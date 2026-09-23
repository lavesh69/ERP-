import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { getTelemetrySummary } from "@/lib/observability/telemetry";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "INSTITUTION_ADMIN")) {
      return NextResponse.json({ error: "Access Denied: Observability metrics require administrative privileges." }, { status: 403 });
    }

    const summary = getTelemetrySummary();
    const mem = process.memoryUsage();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      telemetry: {
        ...summary,
        memoryUsageMb: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        },
        uptimeSeconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || "development",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load telemetry" }, { status: 500 });
  }
}
