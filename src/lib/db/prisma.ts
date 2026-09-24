import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

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
].filter((url): url is string => typeof url === "string" && url.trim().length > 0);

const activePostgresUrl = candidateUrls.find(
  (url) => url.startsWith("postgresql://") || url.startsWith("postgres://")
);

let activeDatabaseUrl = activePostgresUrl;

if (activePostgresUrl) {
  process.env.DATABASE_URL = activePostgresUrl;
} else {
  // If running in serverless environment (Vercel) without remote PostgreSQL,
  // prepare SQLite in writable /tmp directory to prevent SQLITE_CANTOPEN (Error 14)
  if (process.env.VERCEL) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    const candidates = [
      path.join(process.cwd(), "prisma", "dev.db"),
      path.join(process.cwd(), "dev.db"),
      "/var/task/prisma/dev.db",
      "/var/task/dev.db",
    ];
    const sourceDbPath = candidates.find((p) => fs.existsSync(p));
    if (!fs.existsSync(tmpDbPath) && sourceDbPath) {
      try {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
      } catch (err) {
        console.warn("Could not copy sqlite db to /tmp:", err);
      }
    }
    activeDatabaseUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = activeDatabaseUrl;
  } else if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./dev.db";
    activeDatabaseUrl = "file:./dev.db";
  } else {
    let dbUrl = process.env.DATABASE_URL;
    if (dbUrl.startsWith("file:./prisma/")) {
      dbUrl = dbUrl.replace("file:./prisma/", "file:./");
    }
    activeDatabaseUrl = dbUrl;
    process.env.DATABASE_URL = dbUrl;
  }
}

// 1. Primary Writer Client
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(activeDatabaseUrl
      ? { datasources: { db: { url: activeDatabaseUrl } } }
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
