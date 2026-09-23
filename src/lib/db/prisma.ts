import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaRead?: PrismaClient;
  prismaWalInitialized?: boolean;
};

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

// 1. Primary Writer Client (AWS RDS Primary / Master PgBouncer Node)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 2. Read Replica Client (AWS RDS Read-Replica / Aurora Reader Node)
export const prismaRead =
  globalForPrisma.prismaRead ||
  (process.env.DATABASE_READ_URL
    ? new PrismaClient({
        datasources: { db: { url: process.env.DATABASE_READ_URL } },
        log: ["error"],
      })
    : prisma);

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaRead = prismaRead;

/**
 * Returns read-optimized replica client for heavy analytics & reports
 */
export function getReadClient(): PrismaClient {
  return prismaRead;
}

/**
 * Returns write-authoritative master client for transactions and mutations
 */
export function getWriteClient(): PrismaClient {
  return prisma;
}

// 3. Configure SQLite Concurrency & Write-Ahead Logging (WAL) Mode when running on SQLite
if (!globalForPrisma.prismaWalInitialized) {
  globalForPrisma.prismaWalInitialized = true;
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:")) {
    prisma
      .$queryRawUnsafe("PRAGMA journal_mode = WAL;")
      .then(() => prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;"))
      .then(() => prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;"))
      .catch(() => {});
  }
}

export default prisma;
