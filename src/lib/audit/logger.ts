import { prisma } from "@/lib/db/prisma";

export interface LogAuditEventParams {
  institutionId?: string;
  actorUserId: string;
  action:
    | "LOGIN"
    | "LOGOUT"
    | "GRADE_MODIFIED"
    | "ATTENDANCE_CHANGED"
    | "FEE_COLLECTED"
    | "TIMETABLE_UPDATED"
    | "AI_AGENT_EXECUTION"
    | "DISCIPLINARY_RECORD"
    | "PERMISSION_OVERRIDE"
    | "2FA_ENABLED"
    | "2FA_DISABLED"
    | "PASSWORD_CHANGED"
    | "REVOKE_ALL_OTHER_SESSIONS"
    | "STUDENT_SELF_REGISTERED"
    | "ACCOUNT_LOCKED"
    | "SSO_LOGIN_SUCCESS"
    | (string & {});
  targetEntity: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: LogAuditEventParams) {
  try {
    const institutionId = params.institutionId || "inst-apex-01";
    return await prisma.auditLog.create({
      data: {
        institutionId,
        actorUserId: params.actorUserId,
        action: params.action,
        targetEntity: params.targetEntity,
        targetId: params.targetId,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || "127.0.0.1",
        userAgent: params.userAgent || "CLASSROOM-Internal-Client",
      },
    });
  } catch (err) {
    console.error("Audit logging error (fallback memory trace):", err);
    return null;
  }
}
