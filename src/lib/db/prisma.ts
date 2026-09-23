import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaRead?: PrismaClient;
  prismaWalInitialized?: boolean;
};

// Automatically discover and prioritize Neon PostgreSQL connection strings
const candidateUrls = [
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL_NON_POOLING,
].filter((url): url is string => typeof url === "string" && url.length > 0);

const activePostgresUrl = candidateUrls.find(
  (url) => url.startsWith("postgresql://") || url.startsWith("postgres://")
);

if (activePostgresUrl) {
  process.env.DATABASE_URL = activePostgresUrl;
}

// 1. Primary Writer Client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(activePostgresUrl
      ? { datasources: { db: { url: activePostgresUrl } } }
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
