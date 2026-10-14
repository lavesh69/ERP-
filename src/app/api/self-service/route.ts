import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  selfServiceStore,
  SelfServiceRequestType,
  SelfServiceStatus,
} from "@/lib/self-service/self-service-engine";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access self-service desk" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") as SelfServiceRequestType) || undefined;
    const status = (searchParams.get("status") as SelfServiceStatus) || undefined;
    const isMine = searchParams.get("mine") === "true";

    const isStudentOrParent = ["STUDENT", "PARENT"].includes(session.role);
    const filterUserId = isStudentOrParent || isMine ? session.userId : undefined;

    const requests = selfServiceStore.getRequests({
      institutionId: session.role === "SUPER_ADMIN" ? undefined : session.institutionId,
      userId: filterUserId,
      type,
      status,
    });

    const summary = {
      total: requests.length,
      submitted: requests.filter((r) => r.status === "SUBMITTED").length,
      processing: requests.filter((r) => r.status === "PROCESSING").length,
      readyOrCompleted: requests.filter((r) => r.status === "COMPLETED" || r.status === "READY_FOR_PICKUP").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      requests,
    });
  } catch (error: any) {
    logger.error("GET /api/self-service error", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve self-service requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to submit or update self-service requests" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "SUBMIT_REQUEST") {
      const { requestType, purpose, urgency, userIdentifier } = body;
      if (!requestType || !purpose) {
        return NextResponse.json({ error: "requestType and purpose are required" }, { status: 400 });
      }

      const request = selfServiceStore.createRequest({
        requestType,
        institutionId: session.institutionId || "inst-apex-01",
        userId: session.userId || "anonymous-usr",
        userName: session.fullName || session.email || "Requester",
        userRole: session.role || "STUDENT",
        userIdentifier: userIdentifier || session.email || "ID-UNSPECIFIED",
        purpose,
        urgency,
      });

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: `SELF_SERVICE_SUBMITTED_${requestType}`,
        targetEntity: "ServiceRequestRecord",
        targetId: request.id,
        details: { type: requestType, token: request.verificationToken },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Self-service petition ${request.id} submitted successfully with SLA ${request.slaHours}h.`,
          request,
        },
        { status: 201 }
      );
    }

    if (action === "UPDATE_STATUS") {
      const isStaffOrAdmin = [
        "SUPER_ADMIN",
        "INSTITUTION_ADMIN",
        "PRINCIPAL",
        "HOD",
        "HR_STAFF",
        "ACCOUNTANT",
      ].includes(session.role);

      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Administrative access required to resolve service requests" }, { status: 403 });
      }

      const { requestId, status, remarks } = body;
      if (!requestId || !status) {
        return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
      }

      const updated = selfServiceStore.updateRequestStatus(
        requestId,
        status as SelfServiceStatus,
        remarks
      );

      if (!updated) {
        return NextResponse.json({ error: "Service request record not found" }, { status: 404 });
      }

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: `SELF_SERVICE_STATUS_${status}`,
        targetEntity: "ServiceRequestRecord",
        targetId: requestId,
        details: { status, remarks },
      });

      return NextResponse.json({
        success: true,
        message: `Service request ${requestId} transitioned to ${status}.`,
        request: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    logger.error("POST /api/self-service error", error);
    return NextResponse.json({ error: error.message || "Failed to process self-service action" }, { status: 400 });
  }
}
