import { execSync } from "child_process";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || "";

if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  console.log("🚀 PostgreSQL database detected, syncing schema...");
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("✅ Database schema synchronized successfully.");
  } catch (err) {
    console.warn("⚠️ Notice during prisma db push:", err.message);
  }
} else {
  console.log("ℹ️ No PostgreSQL URL configured in environment, skipping prisma db push.");
}
