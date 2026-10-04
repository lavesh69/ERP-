import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const LEADERSHIP_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status") || "UNDER_REVIEW";

    const tenantFilter: any = {};
    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      tenantFilter.student = { user: { institutionId: auth.payload.institutionId } };
    }

    if (type) {
      tenantFilter.type = type;
    }

    if (status !== "ALL") {
      tenantFilter.status = status;
    }

    const pendingRequests = await prisma.studentRequest.findMany({
      where: tenantFilter,
      include: {
        student: {
          include: {
            user: true,
            program: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const formatted = pendingRequests.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      reason: r.reason,
      status: r.status,
      scholar: {
        studentId: r.student.id,
        name: `${r.student.user.firstName} ${r.student.user.lastName}`,
        rollNumber: r.student.rollNumber,
        program: r.student.program.code,
        attendanceRate: r.student.attendanceRate,
        cgpa: r.student.cgpa,
      },
      submittedAt: r.createdAt.toISOString(),
      attachmentUrl: r.attachmentUrl,
      reviewerRemarks: r.reviewerRemarks,
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      pendingCount: formatted.filter((f) => f.status === "UNDER_REVIEW" || f.status === "SUBMITTED").length,
      approvals: formatted,
    });
  } catch (error: any) {
    logger.error("Principal approvals GET error", error);
    return NextResponse.json({ error: "Failed to fetch executive approvals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { requestIds, decision, remarks } = body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return NextResponse.json({ error: "requestIds array is required" }, { status: 400 });
    }

    if (!decision || !["APPROVED", "REJECTED"].includes(decision)) {
      return NextResponse.json({ error: "decision must be 'APPROVED' or 'REJECTED'" }, { status: 400 });
    }

    const resolved = await prisma.studentRequest.updateMany({
      where: { id: { in: requestIds } },
      data: {
        status: decision,
        reviewerRemarks: remarks || `Executive decision rendered by ${auth.payload.role}.`,
        reviewedById: auth.payload.userId || "principal",
      },
    });

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "principal",
      action: decision === "APPROVED" ? "EXECUTIVE_APPROVAL_GRANTED" : "EXECUTIVE_APPROVAL_REJECTED",
      targetEntity: "StudentRequest",
      details: {
        count: resolved.count,
        requestIds,
        decision,
        remarks,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${resolved.count} requests as ${decision}.`,
      updatedCount: resolved.count,
      decision,
    });
  } catch (error: any) {
    logger.error("Principal approvals POST error", error);
    return NextResponse.json({ error: "Failed to update approvals" }, { status: 500 });
  }
}
