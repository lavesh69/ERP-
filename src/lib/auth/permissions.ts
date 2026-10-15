import { UserRole } from "@/types/auth";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./admin-guard";
import { logger } from "@/lib/logging/logger";

export type PermissionCode =
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "students.view"
  | "students.create"
  | "students.update"
  | "students.delete"
  | "faculty.view"
  | "faculty.create"
  | "faculty.update"
  | "attendance.view"
  | "attendance.create"
  | "attendance.update"
  | "assignments.view"
  | "assignments.create"
  | "assignments.grade"
  | "assignments.submit"
  | "exams.view"
  | "exams.create"
  | "exams.manage"
  | "results.publish"
  | "fees.view"
  | "fees.create"
  | "payments.verify"
  | "library.view"
  | "library.manage"
  | "placement.view"
  | "placement.manage"
  | "research.view"
  | "research.manage"
  | "reports.view"
  | "settings.manage"
  | "audit_logs.view"
  // Extended Operational Permissions
  | "hostel.view"
  | "hostel.manage"
  | "transport.view"
  | "transport.manage"
  | "hr.view"
  | "hr.manage"
  | "payroll.manage"
  | "inventory.view"
  | "inventory.manage"
  | "estate.view"
  | "estate.manage"
  | "accreditation.view"
  | "accreditation.manage"
  | "clinic.view"
  | "clinic.manage"
  | "security.view"
  | "security.manage"
  | "events.view"
  | "events.manage"
  | "clubs.view"
  | "clubs.manage"
  | "convocation.view"
  | "convocation.manage"
  | "international.view"
  | "international.manage"
  | "incubation.view"
  | "incubation.manage"
  | "grievances.view"
  | "grievances.manage"
  | "emergency.broadcast"
  | "canteen.manage";

export const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionCode[]> = {
  SUPER_ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "students.view",
    "students.create",
    "students.update",
    "students.delete",
    "faculty.view",
    "faculty.create",
    "faculty.update",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "assignments.view",
    "assignments.create",
    "assignments.grade",
    "assignments.submit",
    "exams.view",
    "exams.create",
    "exams.manage",
    "results.publish",
    "fees.view",
    "fees.create",
    "payments.verify",
    "library.view",
    "library.manage",
    "placement.view",
    "placement.manage",
    "research.view",
    "research.manage",
    "reports.view",
    "settings.manage",
    "audit_logs.view",
    "hostel.view",
    "hostel.manage",
    "transport.view",
    "transport.manage",
    "hr.view",
    "hr.manage",
    "payroll.manage",
    "inventory.view",
    "inventory.manage",
    "estate.view",
    "estate.manage",
    "accreditation.view",
    "accreditation.manage",
    "clinic.view",
    "clinic.manage",
    "security.view",
    "security.manage",
    "events.view",
    "events.manage",
    "clubs.view",
    "clubs.manage",
    "convocation.view",
    "convocation.manage",
    "international.view",
    "international.manage",
    "incubation.view",
    "incubation.manage",
    "grievances.view",
    "grievances.manage",
    "emergency.broadcast",
    "canteen.manage",
  ],
  INSTITUTION_ADMIN: [
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "students.view",
    "students.create",
    "students.update",
    "faculty.view",
    "faculty.create",
    "faculty.update",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "assignments.view",
    "exams.view",
    "exams.create",
    "exams.manage",
    "results.publish",
    "fees.view",
    "fees.create",
    "payments.verify",
    "library.view",
    "library.manage",
    "placement.view",
    "placement.manage",
    "research.view",
    "reports.view",
    "settings.manage",
    "audit_logs.view",
    "hostel.view",
    "hostel.manage",
    "transport.view",
    "transport.manage",
    "hr.view",
    "hr.manage",
    "payroll.manage",
    "inventory.view",
    "inventory.manage",
    "estate.view",
    "estate.manage",
    "accreditation.view",
    "accreditation.manage",
    "clinic.view",
    "clinic.manage",
    "security.view",
    "security.manage",
    "events.view",
    "events.manage",
    "clubs.view",
    "clubs.manage",
    "convocation.view",
    "convocation.manage",
    "international.view",
    "international.manage",
    "incubation.view",
    "incubation.manage",
    "grievances.view",
    "grievances.manage",
    "emergency.broadcast",
    "canteen.manage",
  ],
  PRINCIPAL: [
    "users.view",
    "students.view",
    "faculty.view",
    "attendance.view",
    "exams.view",
    "results.publish",
    "fees.view",
    "research.view",
    "reports.view",
    "audit_logs.view",
    "hostel.view",
    "transport.view",
    "hr.view",
    "accreditation.view",
    "accreditation.manage",
    "clinic.view",
    "security.view",
    "events.view",
    "clubs.view",
    "convocation.view",
    "convocation.manage",
    "international.view",
    "incubation.view",
    "grievances.view",
    "emergency.broadcast",
  ],
  HOD: [
    "students.view",
    "faculty.view",
    "attendance.view",
    "attendance.update",
    "assignments.view",
    "exams.view",
    "research.view",
    "reports.view",
    "accreditation.view",
    "events.view",
    "clubs.view",
    "convocation.view",
    "international.view",
    "incubation.view",
    "grievances.view",
    "emergency.broadcast",
  ],
  FACULTY: [
    "students.view",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "assignments.view",
    "assignments.create",
    "assignments.grade",
    "exams.view",
    "research.view",
    "research.manage",
    "accreditation.view",
    "events.view",
    "clubs.view",
    "convocation.view",
    "international.view",
    "incubation.view",
    "grievances.view",
  ],
  CLASS_TEACHER: [
    "students.view",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "assignments.view",
    "exams.view",
    "events.view",
    "clubs.view",
    "grievances.view",
  ],
  STUDENT: [
    "assignments.view",
    "assignments.submit",
    "attendance.view",
    "exams.view",
    "fees.view",
    "library.view",
    "placement.view",
    "research.view",
    "hostel.view",
    "transport.view",
    "events.view",
    "clubs.view",
    "convocation.view",
    "international.view",
    "incubation.view",
    "grievances.view",
    "clinic.view",
  ],
  PARENT: [
    "students.view",
    "attendance.view",
    "exams.view",
    "fees.view",
    "hostel.view",
    "transport.view",
    "grievances.view",
    "clinic.view",
    "events.view",
  ],
  ACCOUNTANT: [
    "students.view",
    "fees.view",
    "fees.create",
    "payments.verify",
    "reports.view",
    "payroll.manage",
    "inventory.view",
    "convocation.view",
    "canteen.manage",
  ],
  LIBRARIAN: [
    "library.view",
    "library.manage",
    "students.view",
    "reports.view",
    "convocation.view",
  ],
  EXAMINATION_CONTROLLER: [
    "exams.view",
    "exams.create",
    "exams.manage",
    "results.publish",
    "reports.view",
    "convocation.view",
    "convocation.manage",
  ],
  PLACEMENT_OFFICER: [
    "placement.view",
    "placement.manage",
    "students.view",
    "reports.view",
    "incubation.view",
    "convocation.view",
  ],
  RESEARCH_COORDINATOR: [
    "research.view",
    "research.manage",
    "faculty.view",
    "reports.view",
    "accreditation.view",
    "international.view",
    "incubation.view",
  ],
  HR_STAFF: [
    "faculty.view",
    "faculty.create",
    "faculty.update",
    "reports.view",
    "hr.view",
    "hr.manage",
    "payroll.manage",
    "security.view",
    "clinic.view",
    "grievances.view",
  ],
  ALUMNI: [
    "placement.view",
    "students.view",
    "library.view",
    "events.view",
    "incubation.view",
    "convocation.view",
  ],
  GUEST: [
    "library.view",
    "security.view",
  ],
};

/**
 * Checks whether a role has the specified granular permission.
 */
export function hasPermission(role: UserRole, permission: PermissionCode): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Server-side RBAC guard requiring a specific permission code.
 */
export async function requirePermission(
  req: NextRequest,
  permission: PermissionCode
): Promise<{ payload: Record<string, any> } | NextResponse> {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const role = authResult.payload.role as UserRole;
  if (!hasPermission(role, permission)) {
    logger.security("FORBIDDEN_PERMISSION_ACCESS", authResult.payload.email || "unknown", {
      role,
      requiredPermission: permission,
      path: req.nextUrl.pathname,
    });

    return NextResponse.json(
      {
        error: `Forbidden. Role '${role}' lacks the required '${permission}' permission.`,
      },
      { status: 403 }
    );
  }

  return authResult;
}
