import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, requireRoleAuth } from "@/lib/auth/admin-guard";
import { approvalEngine, InstitutionalWorkflowType, WorkflowStatus } from "@/lib/workflow/approval-engine";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access workflow approvals" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") as InstitutionalWorkflowType) || undefined;
    const status = (searchParams.get("status") as WorkflowStatus) || undefined;
    const forMe = searchParams.get("mine") === "true";
    const canApprove = searchParams.get("canApprove") === "true";

    const workflows = approvalEngine.getWorkflows({
      institutionId: session.role === "SUPER_ADMIN" ? undefined : session.institutionId,
      requesterId: forMe ? session.userId : undefined,
      workflowType: type,
      status,
      canApproveRole: canApprove ? session.role : undefined,
    });

    const summary = {
      total: workflows.length,
      pending: workflows.filter((w) => w.status === "PENDING").length,
      approved: workflows.filter((w) => w.status === "APPROVED").length,
      rejected: workflows.filter((w) => w.status === "REJECTED").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      workflows,
    });
  } catch (error: any) {
    logger.error("GET /api/workflows/approvals error", error);
    return NextResponse.json({ error: error.message || "Failed to fetch workflow requisitions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to submit or decide approvals" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "SUBMIT") {
      const { workflowType, entityId, title, description, metadata } = body;
      if (!workflowType || !title || !description) {
        return NextResponse.json(
          { error: "workflowType, title, and description are required to initiate an approval workflow" },
          { status: 400 }
        );
      }

      const workflow = approvalEngine.createWorkflowItem({
        workflowType,
        institutionId: session.institutionId || "inst-apex-01",
        requesterId: session.userId || "anonymous",
        requesterName: session.fullName || session.email || "Requester",
        requesterRole: session.role || "STUDENT",
        entityId: entityId || `entity-${Date.now()}`,
        title,
        description,
        metadata,
      });

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: `WORKFLOW_INITIATED_${workflowType}`,
        targetEntity: "WorkflowItem",
        targetId: workflow.id,
        details: { title, type: workflowType, level: 1 },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Requisition ${workflow.id} submitted for multi-tier institutional approval.`,
          workflow,
        },
        { status: 201 }
      );
    }

    if (action === "DECIDE") {
      const { workflowId, decision, remarks } = body;
      if (!workflowId || !decision || !["APPROVE", "REJECT"].includes(decision)) {
        return NextResponse.json(
          { error: "workflowId and valid decision ('APPROVE' | 'REJECT') are required." },
          { status: 400 }
        );
      }

      const result = approvalEngine.processDecision(
        workflowId,
        {
          userId: session.userId,
          role: session.role,
          name: session.fullName || session.email || "Approver",
        },
        decision,
        remarks || ""
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 403 });
      }

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: `WORKFLOW_${decision}D`,
        targetEntity: "WorkflowItem",
        targetId: workflowId,
        details: {
          decision,
          status: result.workflow?.status,
          currentLevel: result.workflow?.currentLevel,
          seal: result.workflow?.completionSeal,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Workflow ${workflowId} decision (${decision}D) successfully recorded.`,
        workflow: result.workflow,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    logger.error("POST /api/workflows/approvals error", error);
    return NextResponse.json({ error: error.message || "Failed to process approval workflow" }, { status: 400 });
  }
}
