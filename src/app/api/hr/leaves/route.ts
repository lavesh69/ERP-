import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const HR_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL", "HOD", "FACULTY"];

interface StaffLeaveApplication {
  id: string;
  staffEmail: string;
  leaveType: "CASUAL_LEAVE" | "MEDICAL_LEAVE" | "EARNED_LEAVE" | "DUTY_LEAVE";
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: string;
}

const SAMPLE_LEAVE_APPLICATIONS: StaffLeaveApplication[] = [
  {
    id: "lv-01",
    staffEmail: "faculty.ai@apex.edu",
    leaveType: "CASUAL_LEAVE",
    days: 2,
    startDate: "2026-10-15",
    endDate: "2026-10-16",
    reason: "Personal family commitment",
    status: "APPROVED",
    approvedBy: "hr.manager@apex.edu",
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const isHrOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL"].includes(auth.payload.role);

    // Standard institutional annual leave quotas
    const quota = {
      casualLeaveTotal: 12,
      casualLeaveTaken: 2,
      casualLeaveRemaining: 10,
      medicalLeaveTotal: 10,
      medicalLeaveTaken: 1,
      medicalLeaveRemaining: 9,
      earnedLeaveTotal: 15,
      earnedLeaveTaken: 0,
      earnedLeaveRemaining: 15,
    };

    const applications = isHrOrAdmin
      ? SAMPLE_LEAVE_APPLICATIONS
      : SAMPLE_LEAVE_APPLICATIONS.filter((a) => a.staffEmail === auth.payload.email);

    return NextResponse.json({
      success: true,
      staffEmail: auth.payload.email,
      leaveQuotas: quota,
      totalPendingApproval: SAMPLE_LEAVE_APPLICATIONS.filter((a) => a.status === "PENDING").length,
      applications,
    });
  } catch (error: any) {
    logger.error("HR leaves GET error", error);
    return NextResponse.json({ error: "Failed to fetch staff leave balances" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action, applicationId, leaveType, days, startDate, endDate, reason } = body;

    const isHrOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL"].includes(auth.payload.role);

    // Action 1: HR Decision (Approve / Reject)
    if (action === "DECISION") {
      if (!isHrOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only HR or Principal can decide leave petitions" }, { status: 403 });
      }

      const target = SAMPLE_LEAVE_APPLICATIONS.find((a) => a.id === applicationId);
      if (!target) {
        return NextResponse.json({ error: "Leave application not found" }, { status: 404 });
      }

      target.status = body.decision === "APPROVED" ? "APPROVED" : "REJECTED";
      target.approvedBy = auth.payload.email;

      await logAuditEvent({
        institutionId: auth.payload.institutionId || "global",
        actorUserId: auth.payload.userId || "hr_staff",
        action: `STAFF_LEAVE_${target.status}`,
        targetEntity: "StaffLeave",
        targetId: target.id,
        details: { staff: target.staffEmail, decision: target.status },
      });

      return NextResponse.json({
        success: true,
        message: `Staff leave application ${target.id} marked as ${target.status}.`,
        application: target,
      });
    }

    // Action 2: Staff Submits Leave Application
    if (!leaveType || !days || !startDate || !endDate) {
      return NextResponse.json({ error: "leaveType, days, startDate, and endDate are required" }, { status: 400 });
    }

    const newApp: StaffLeaveApplication = {
      id: `lv-${Date.now()}`,
      staffEmail: auth.payload.email,
      leaveType,
      days: Number(days),
      startDate,
      endDate,
      reason: reason || "Standard personal leave request",
      status: "PENDING",
    };

    SAMPLE_LEAVE_APPLICATIONS.push(newApp);

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "staff",
      action: "STAFF_LEAVE_APPLIED",
      targetEntity: "StaffLeave",
      targetId: newApp.id,
      details: { leaveType, days: newApp.days, dates: `${startDate} to ${endDate}` },
    });

    return NextResponse.json({
      success: true,
      message: "Leave application submitted to HR Office successfully.",
      application: newApp,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("HR leaves POST error", error);
    return NextResponse.json({ error: "Failed to process staff leave request" }, { status: 500 });
  }
}
