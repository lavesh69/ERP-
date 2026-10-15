import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, STAFF_ROLES } from "@/lib/auth/admin-guard";
import {
  dataGovernanceEngine,
  DATA_CLASSIFICATION_REGISTRY,
} from "@/lib/governance/data-governance-engine";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const userId = session?.userId;
    const userRole = session?.role || "GUEST";
    const isStaff = STAFF_ROLES.includes(userRole as any) || userRole === "SUPER_ADMIN";

    const policies = dataGovernanceEngine.getClassificationPolicies();
    const corrections = isStaff
      ? dataGovernanceEngine.getCorrectionRequests()
      : userId
      ? dataGovernanceEngine.getCorrectionRequests(userId)
      : [];
    const consents = userId ? dataGovernanceEngine.getUserConsents(userId) : [];

    const retentionSchedules = [
      { category: "Permanent Academic Transcript & ABC Registry", retention: "PERMANENT", mandate: "UGC / NEP 2020" },
      { category: "Treasury Fee Ledgers & Bank Vouchers", retention: "8 Years", mandate: "CAG / Income Tax Act" },
      { category: "Biometric Attendance Scanner Logs", retention: "1 Year", mandate: "DPDP Act 2023 Sec 8" },
      { category: "Hostel Outing & Gate Pass Slips", retention: "90 Days", mandate: "Institutional Security" },
      { category: "Proctorial Disciplinary Dossiers", retention: "10 Years", mandate: "Supreme Court Anti-Ragging Mandate" },
    ];

    return NextResponse.json({
      success: true,
      governanceFramework: "DPDP Act 2023 / FERPA / ISO 27001",
      policies,
      retentionSchedules,
      corrections,
      consents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to load data governance policies", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // 1. Submit Data Correction Request
    if (action === "SUBMIT_CORRECTION") {
      const { fieldName, currentValue, proposedValue, reason, supportingDocumentUrl } = body;
      if (!fieldName || !currentValue || !proposedValue || !reason) {
        return NextResponse.json(
          { error: "fieldName, currentValue, proposedValue, and reason are required" },
          { status: 400 }
        );
      }

      const correction = dataGovernanceEngine.createCorrectionRequest({
        requesterUserId: session.userId,
        requesterRole: session.role,
        fieldName,
        currentValue,
        proposedValue,
        reason,
        supportingDocumentUrl,
      });

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: "DATA_CORRECTION_REQUESTED",
        targetEntity: "DataCorrectionRequest",
        targetId: correction.id,
        details: { fieldName, proposedValue, reason },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Correction request ${correction.id} submitted for registrar verification.`,
          correction,
        },
        { status: 201 }
      );
    }

    // 2. Verify Correction Request (Staff only)
    if (action === "VERIFY_CORRECTION") {
      const isStaff = STAFF_ROLES.includes(session.role) || session.role === "SUPER_ADMIN";
      if (!isStaff) {
        return NextResponse.json(
          { error: "Forbidden: Staff clearance required to verify data correction" },
          { status: 403 }
        );
      }

      const { correctionId, decision, rejectionReason } = body;
      if (!correctionId || !["APPROVE", "REJECT"].includes(decision)) {
        return NextResponse.json(
          { error: "correctionId and valid decision ('APPROVE' | 'REJECT') are required" },
          { status: 400 }
        );
      }

      const res = dataGovernanceEngine.verifyCorrectionRequest(
        correctionId,
        session.userId,
        decision,
        rejectionReason
      );

      if (!res.success) {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: `DATA_CORRECTION_${decision}D`,
        targetEntity: "DataCorrectionRequest",
        targetId: correctionId,
        details: { decision, rejectionReason },
      });

      return NextResponse.json({
        success: true,
        message: res.message,
        correction: res.request,
      });
    }

    // 3. Update DPDP Processing Consent
    if (action === "UPDATE_CONSENT") {
      const { purpose, granted } = body;
      if (!purpose || typeof granted !== "boolean") {
        return NextResponse.json({ error: "purpose and granted (boolean) are required" }, { status: 400 });
      }

      const consent = dataGovernanceEngine.registerConsent({
        userId: session.userId,
        userRole: session.role,
        purpose,
        granted,
        ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: granted ? "DPDP_CONSENT_GRANTED" : "DPDP_CONSENT_REVOKED",
        targetEntity: "ConsentRecord",
        targetId: consent.id,
        details: { purpose, granted },
      });

      return NextResponse.json({
        success: true,
        message: `Consent preference for ${purpose} updated to ${granted ? "GRANTED" : "REVOKED"}.`,
        consent,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process data privacy action" }, { status: 500 });
  }
}
