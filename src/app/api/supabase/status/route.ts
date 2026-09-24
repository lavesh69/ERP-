import { NextResponse } from "next/server";
import { testSupabaseConnection, getSupabaseConfig } from "@/lib/supabase";

export async function GET() {
  const result = await testSupabaseConnection();
  const config = getSupabaseConfig();

  return NextResponse.json(
    {
      status: result.connected ? "CONNECTED" : "FAILED",
      timestamp: new Date().toISOString(),
      supabase: {
        projectId: config.projectId,
        url: config.url,
        latencyMs: result.latencyMs,
        authProviders: result.authProviders || [],
        connected: result.connected,
      },
      databaseMigrationGuide: {
        instructions:
          "To route all Prisma database tables (students, faculty, attendance, fees, exams) to Supabase PostgreSQL, set the DATABASE_URL to your Supabase PostgreSQL connection string in Vercel.",
        examplePooledUrl: `postgresql://postgres.${config.projectId}:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
        exampleDirectUrl: `postgresql://postgres:[YOUR-PASSWORD]@db.${config.projectId}.supabase.co:5432/postgres`,
      },
      error: result.error || null,
    },
    { status: result.connected ? 200 : 502 }
  );
}
