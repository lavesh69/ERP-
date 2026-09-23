import { NextRequest, NextResponse } from "next/server";
import {
  runBiometricAggregation,
  scanDefaulterRisk,
  reconcileFeeDues,
  runAllAutomationJobs,
} from "@/lib/jobs/automation";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  // C3: Admin-only endpoint
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const latestLogs = await prisma.auditLog.findMany({
      where: {
        targetEntity: "SystemScheduler",
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    const jobs = [
      {
        id: "biometric",
        name: "Biometric Attendance Aggregation",
        description: "Recalculates student aggregate attendance percentages from biometric logs & attendance sessions.",
        frequency: "Hourly (0 * * * *)",
        status: "SCHEDULED",
      },
      {
        id: "defaulters",
        name: "Defaulter Risk Screening & Alerts",
        description: "Scans for scholars below 75% attendance, applies DEFAULTER_ALERT status, and issues urgent notices.",
        frequency: "Daily at 08:00 (0 8 * * *)",
        status: "SCHEDULED",
      },
      {
        id: "fees",
        name: "Fee Ledger Reconciliation",
        description: "Evaluates term due dates, transitions unpaid accounts to OVERDUE, and delivers Bursar notices.",
        frequency: "Daily at 00:00 (0 0 * * *)",
        status: "SCHEDULED",
      },
    ];

    return NextResponse.json({
      jobs,
      recentExecutions: latestLogs.map((log) => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        details: log.detailsJson ? JSON.parse(log.detailsJson) : null,
      })),
    });
  } catch (error: any) {
    logger.error("Admin Jobs GET Error", error);
    return NextResponse.json(
      { error: "Failed to retrieve scheduled automation telemetry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // C3: Admin-only endpoint
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const jobName = body.jobName || "all";

    let result;
    if (jobName === "biometric") {
      result = await runBiometricAggregation();
    } else if (jobName === "defaulters") {
      result = await scanDefaulterRisk();
    } else if (jobName === "fees") {
      result = await reconcileFeeDues();
    } else {
      result = await runAllAutomationJobs();
    }

    // C4: Audit log job execution
    logger.info("Automation job executed", { jobName, actor: auth.payload.email });

    return NextResponse.json({
      success: true,
      jobName,
      executedAt: new Date().toISOString(),
      result,
    });
  } catch (error: any) {
    logger.error("Admin Jobs POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute automation job" },
      { status: 500 }
    );
  }
}

