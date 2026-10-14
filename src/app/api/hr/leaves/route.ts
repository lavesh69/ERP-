import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";
import { hrPayrollStore, LeaveType } from "@/lib/hr/hr-store";
import { NpsTaxEngine } from "@/lib/hr/nps-tax-engine";

const HR_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL", "HOD", "FACULTY"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const isHrOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL"].includes(auth.payload.role);
    const targetEmail = req.nextUrl.searchParams.get("email") || auth.payload.email;

    // Dynamic institutional annual leave quotas computed per employee
    const quota = hrPayrollStore.calculateStaffLeaveQuotas(targetEmail);

    const allApps = hrPayrollStore.getLeaves();
    const applications = isHrOrAdmin
      ? allApps
      : allApps.filter((a) => a.staffEmail.toLowerCase() === auth.payload.email.toLowerCase());

    return NextResponse.json({
      success: true,
      staffEmail: auth.payload.email,
      leaveQuotas: quota,
      totalPendingApproval: allApps.filter((a) => a.status === "PENDING").length,
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
    const { action, applicationId, leaveType, days, startDate, endDate, reason, substituteFacultyEmail, substituteRemarks } = body;

    const isHrOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL"].includes(auth.payload.role);

    // Action 1: HR Decision (Approve / Reject)
    if (action === "DECISION") {
      if (!isHrOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only HR or Principal can decide leave petitions" }, { status: 403 });
      }

      const decision = body.decision === "APPROVED" ? "APPROVE" : "REJECT";
      const target = hrPayrollStore.updateLeaveStatus(applicationId, decision, auth.payload.email);
      if (!target) {
        return NextResponse.json({ error: "Leave application not found" }, { status: 404 });
      }

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

    let substitutionCheck = { hasConflict: false, message: "No substitute assigned." };
    if (substituteFacultyEmail) {
      const dayName = new Date(startDate).toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
      substitutionCheck = await NpsTaxEngine.checkTimetableSubstitutionConflict(substituteFacultyEmail, dayName);
    }

    const newApp = hrPayrollStore.applyLeave({
      staffEmail: auth.payload.email,
      leaveType: leaveType as LeaveType,
      days: Number(days),
      startDate,
      endDate,
      reason: reason || "Standard personal leave request",
      substituteFacultyEmail,
      substituteRemarks: substituteRemarks || substitutionCheck.message,
    });

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "staff",
      action: "STAFF_LEAVE_APPLIED",
      targetEntity: "StaffLeave",
      targetId: newApp.id,
      details: {
        leaveType,
        days: newApp.days,
        dates: `${startDate} to ${endDate}`,
        substitute: substituteFacultyEmail || "None",
        substitutionStatus: substitutionCheck.message,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave application submitted to HR Office successfully.",
        application: newApp,
        leave: newApp,
        substitutionCheck,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("HR leaves POST error", error);
    return NextResponse.json({ error: "Failed to process staff leave request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRoleAuth(req, HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const isHrOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "PRINCIPAL"].includes(auth.payload.role);
    if (!isHrOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Only HR or Principal can decide leave petitions" }, { status: 403 });
    }

    const leaveId = body.leaveId || body.applicationId;
    const decision: "APPROVE" | "REJECT" | "RECOMMEND" =
      body.action === "APPROVE"
        ? "APPROVE"
        : body.decision === "APPROVED"
        ? "APPROVE"
        : body.action === "RECOMMEND"
        ? "RECOMMEND"
        : "REJECT";

    const target = hrPayrollStore.updateLeaveStatus(leaveId, decision, auth.payload.email);
    if (!target) {
      return NextResponse.json({ error: "Leave application not found" }, { status: 404 });
    }

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
  } catch (error: any) {
    logger.error("HR leaves PATCH error", error);
    return NextResponse.json({ error: "Failed to process leave decision" }, { status: 500 });
  }
}
