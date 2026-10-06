import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import {
  getAllMasterFeeStructures,
  createOrUpdateMasterFeeStructure,
} from "@/lib/finance/finance-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const structures = getAllMasterFeeStructures();
    return NextResponse.json({
      success: true,
      structures,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve fee structures", details: error.message },
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
        { error: "Forbidden: Only Bursars and Finance Administrators can create fee structures." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const created = await createOrUpdateMasterFeeStructure(body);

    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "FEE_STRUCTURE_CREATED",
      targetEntity: "FeeStructure",
      targetId: created.id,
      details: {
        code: created.code,
        title: created.title,
        totalAmount: created.totalAmount,
        headsCount: created.heads.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Master Fee Structure ${created.code} successfully saved and synchronized.`,
      structure: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create fee structure", details: error.message },
      { status: 500 }
    );
  }
}
