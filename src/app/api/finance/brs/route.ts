import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import {
  getBankStatementEntries,
  addBankStatementEntries,
  runBankReconciliationMatching,
} from "@/lib/finance/finance-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const entries = await getBankStatementEntries();
    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load bank statement entries", details: error.message },
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
        { error: "Forbidden: Only Bursars and Finance Administrators can reconcile bank statements." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "AUTO_RECONCILE";

    if (action === "UPLOAD_STATEMENT") {
      const entries = body.entries || [];
      const updated = await addBankStatementEntries(entries);
      return NextResponse.json({
        success: true,
        message: `Imported ${entries.length} bank statement rows into treasury book.`,
        entries: updated,
      });
    }

    // Default action: AUTO_RECONCILE
    const reconciliation = await runBankReconciliationMatching();

    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "BANK_RECONCILIATION_RUN",
      targetEntity: "BankReconciliation",
      targetId: `BRS-${new Date().toISOString().split("T")[0]}`,
      details: {
        exactMatches: reconciliation.exactMatchCount,
        probableMatches: reconciliation.probableMatchCount,
        unmatched: reconciliation.unmatchedCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bank reconciliation executed: ${reconciliation.exactMatchCount} exact matches auto-settled, ${reconciliation.probableMatchCount} probable matches flagged.`,
      reconciliation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process bank reconciliation", details: error.message },
      { status: 500 }
    );
  }
}
