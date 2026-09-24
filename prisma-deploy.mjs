import { execSync } from "child_process";
import fs from "fs";

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
  console.log("🚀 PostgreSQL database detected (Cloud), activating PostgreSQL schema...");
  process.env.DATABASE_URL = activePostgresUrl;
  if (fs.existsSync("prisma/schema.postgresql.prisma")) {
    fs.copyFileSync("prisma/schema.postgresql.prisma", "prisma/schema.prisma");
  }
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: process.env });
    console.log("✅ PostgreSQL schema synchronized successfully.");
  } catch (err) {
    console.warn("⚠️ Notice during prisma db push:", err.message);
  }
} else {
  console.log("ℹ️ No PostgreSQL URL configured in environment, activating SQLite development schema...");
  if (fs.existsSync("prisma/schema.sqlite.prisma")) {
    fs.copyFileSync("prisma/schema.sqlite.prisma", "prisma/schema.prisma");
  }
  execSync("npx prisma generate", { stdio: "inherit", env: process.env });
}
