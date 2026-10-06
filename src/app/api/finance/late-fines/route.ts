import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import {
  getActiveLateFineRule,
  saveLateFineRule,
  executeLateFineAssessment,
} from "@/lib/finance/finance-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const rule = getActiveLateFineRule();
    return NextResponse.json({
      success: true,
      rule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve late fine policy", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];
    if (!session || !allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only Bursars and Finance Administrators can modify fine policies." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "UPDATE_RULE";

    if (action === "RUN_ASSESSMENT_BATCH") {
      const assessment = await executeLateFineAssessment();

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: "LATE_FINE_BATCH_EXECUTED",
        targetEntity: "LateFineRule",
        targetId: "lfr-standard-2026",
        details: {
          scanned: assessment.scannedAccounts,
          applied: assessment.finesAppliedCount,
          totalAssessed: assessment.totalFinesAssessed,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Assessed late fines across ${assessment.scannedAccounts} student ledgers. Applied to ${assessment.finesAppliedCount} overdue accounts ($${assessment.totalFinesAssessed} total).`,
        assessment,
      });
    }

    // Default action: UPDATE_RULE
    const updatedRule = saveLateFineRule(body.rule || body);

    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "LATE_FINE_RULE_UPDATED",
      targetEntity: "LateFineRule",
      targetId: updatedRule.id,
      details: updatedRule,
    });

    return NextResponse.json({
      success: true,
      message: "Late fee policy successfully updated.",
      rule: updatedRule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process late fine request", details: error.message },
      { status: 500 }
    );
  }
}
