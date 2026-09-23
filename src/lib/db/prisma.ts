import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaRead?: PrismaClient;
  prismaWalInitialized?: boolean;
};

// 1. Primary Writer Client (AWS RDS Primary / Master PgBouncer Node)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(process.env.DATABASE_URL
      ? { datasources: { db: { url: process.env.DATABASE_URL } } }
      : {}),
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

export default prisma;
