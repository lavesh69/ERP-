import { execSync } from "child_process";

const candidateUrls = [
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL,
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL_NON_POOLING,
].filter(Boolean);

const activePostgresUrl = candidateUrls.find(
  (url) => typeof url === "string" && (url.startsWith("postgresql://") || url.startsWith("postgres://"))
);

if (activePostgresUrl) {
  console.log("🚀 PostgreSQL database detected, syncing schema...");
  process.env.DATABASE_URL = activePostgresUrl;
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("✅ PostgreSQL schema synchronized successfully.");
  } catch (err) {
    console.warn("⚠️ Notice during prisma db push:", err.message);
  }
} else {
  console.log("ℹ️ No PostgreSQL URL configured in environment, skipping prisma db push.");
}
