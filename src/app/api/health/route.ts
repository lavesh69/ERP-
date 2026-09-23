import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const startTime = Date.now();
  try {
    // 1. Check Database connection & measure ping latency
    const dbPingStart = Date.now();
    await prisma.$queryRawUnsafe("SELECT 1;");
    const dbLatencyMs = Date.now() - dbPingStart;

    // 2. Measure Memory consumption
    const memory = process.memoryUsage();
    const memoryMetrics = {
      rssMb: Math.round((memory.rss / (1024 * 1024)) * 10) / 10,
      heapUsedMb: Math.round((memory.heapUsed / (1024 * 1024)) * 10) / 10,
      heapTotalMb: Math.round((memory.heapTotal / (1024 * 1024)) * 10) / 10,
    };

    // 3. Count primary records for database telemetry
    const [studentsCount, facultyCount, coursesCount] = await Promise.all([
      prisma.student.count().catch(() => 0),
      prisma.faculty.count().catch(() => 0),
      prisma.course.count().catch(() => 0),
    ]);

    const totalResponseTimeMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "HEALTHY",
        timestamp: new Date().toISOString(),
        responseTimeMs: totalResponseTimeMs,
        database: {
          status: "UP",
          engine: (process.env.DATABASE_URL || "").includes("postgres") ? "PostgreSQL (Neon Cloud)" : "PostgreSQL",
          latencyMs: dbLatencyMs,
          counts: {
            students: studentsCount,
            faculty: facultyCount,
            courses: coursesCount,
          },
        },
        memory: memoryMetrics,
        system: {
          uptimeSeconds: Math.round(process.uptime()),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          environment: process.env.NODE_ENV || "development",
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    console.error("Health Check Failed:", error);
    const availableEnvKeys = Object.keys(process.env).filter(
      (k) => k.includes("DATABASE") || k.includes("POSTGRES") || k.includes("NEON")
    );
    const dbScheme = process.env.DATABASE_URL ? process.env.DATABASE_URL.split(":")[0] : "none";
    const prismaScheme = process.env.POSTGRES_PRISMA_URL ? process.env.POSTGRES_PRISMA_URL.split(":")[0] : "none";

    return NextResponse.json(
      {
        status: "DEGRADED",
        timestamp: new Date().toISOString(),
        error: error.message || "Database connection degraded",
        diagnostics: {
          availableEnvKeys,
          databaseUrlScheme: dbScheme,
          postgresPrismaScheme: prismaScheme,
        },
      },
      { status: 503 }
    );
  }
}
