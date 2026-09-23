/**
 * One-time migration: Replace "demo-hashed-password" placeholder in the live
 * SQLite DB with real PBKDF2-SHA512 hashes so the fallback can be removed.
 *
 * Run once:  npx tsx scripts/rehash-demo-users.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";
const SALT_LEN = 32;

// Default demo password for ALL persona accounts.
// Change this if you want a different password.
const DEMO_PASSWORD = "Classroom@2026";

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LEN).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(`pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${key.toString("hex")}`);
    });
  });
}

async function main() {
  // Find every user that still has a placeholder hash
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { passwordHash: "demo-hashed-password" },
        { passwordHash: "password123" },
        { passwordHash: "pbkdf2_sha256_mock_hash" },
        { passwordHash: "" },
      ],
    },
    select: { id: true, email: true, passwordHash: true },
  });

  if (users.length === 0) {
    console.log("No placeholder password hashes found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${users.length} users with placeholder hashes. Migrating...`);

  for (const user of users) {
    const hash = await hashPassword(DEMO_PASSWORD);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash },
    });
    console.log(`  [OK] ${user.email}`);
  }

  console.log(`\nDone. All ${users.length} users now have PBKDF2 hashes.`);
  console.log(`Demo login password for all personas: "${DEMO_PASSWORD}"`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
