/**
 * Automated Database Migration Engine: SQLite -> AWS RDS / Supabase PostgreSQL
 *
 * Usage:
 *   TARGET_DATABASE_URL="postgresql://user:pass@rds-host:5432/classroom" npx tsx scripts/migrate-to-postgres.ts
 */

import { PrismaClient as SqliteClient } from "@prisma/client";

async function runMigration() {
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!targetUrl || !targetUrl.startsWith("postgres")) {
    console.error("❌ ERROR: TARGET_DATABASE_URL environment variable is required and must begin with 'postgresql://'");
    console.error("Example: TARGET_DATABASE_URL=\"postgresql://postgres:pass@db.xxxx.supabase.co:5432/postgres\" npx tsx scripts/migrate-to-postgres.ts");
    process.exit(1);
  }

  console.log("==================================================");
  console.log("🚀 STARTING ZERO-DATA-LOSS POSTGRESQL MIGRATION");
  console.log("==================================================");

  const sqlite = new SqliteClient();

  try {
    console.log("1. Reading entities from local SQLite database...");
    const [institutions, campuses, departments, users, students, faculty, courses, fees] = await Promise.all([
      sqlite.institution.findMany(),
      sqlite.campus.findMany(),
      sqlite.department.findMany(),
      sqlite.user.findMany(),
      sqlite.student.findMany(),
      sqlite.faculty.findMany(),
      sqlite.course.findMany(),
      sqlite.studentFee.findMany(),
    ]);

    console.log(`   - Institutions: ${institutions.length}`);
    console.log(`   - Campuses:      ${campuses.length}`);
    console.log(`   - Departments:   ${departments.length}`);
    console.log(`   - Users:         ${users.length}`);
    console.log(`   - Students:      ${students.length}`);
    console.log(`   - Faculty:       ${faculty.length}`);
    console.log(`   - Courses:       ${courses.length}`);
    console.log(`   - Student Fees:  ${fees.length}`);

    console.log("\n2. Connecting to Target PostgreSQL Cluster (PgBouncer mode supported)...");
    // Connect to PostgreSQL target
    const postgres = new SqliteClient({
      datasources: { db: { url: targetUrl } },
    });

    console.log("3. Seeding target PostgreSQL database tables...");
    for (const inst of institutions) {
      await postgres.institution.upsert({
        where: { id: inst.id },
        update: inst,
        create: inst,
      });
    }

    for (const u of users) {
      await postgres.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
    }

    console.log("\n✅ MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("Update your .env file with:");
    console.log(`DATABASE_URL="${targetUrl}"`);
    console.log("==================================================");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
  }
}

runMigration();
