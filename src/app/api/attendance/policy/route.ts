import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, requireAdminAuth } from "@/lib/auth/admin-guard";
import { getAttendancePolicy, saveAttendancePolicy } from "@/lib/attendance/policy";
import { logAuditEvent } from "@/lib/audit/logger";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const institutionId = searchParams.get("institutionId") || session?.institutionId || "inst-apex-01";

    const policy = getAttendancePolicy(institutionId);
    return NextResponse.json({ policy });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch attendance policy", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const institutionId = body.institutionId || auth.payload.institutionId || "inst-apex-01";

    const updated = saveAttendancePolicy(institutionId, body);

    await logAuditEvent({
      institutionId,
      actorUserId: auth.payload.userId || auth.payload.sub || "admin",
      action: "ATTENDANCE_CHANGED",
      targetEntity: "AttendancePolicy",
      targetId: institutionId,
      details: {
        updates: body,
        updatedPolicy: updated,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Attendance policy updated successfully",
      policy: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update attendance policy", details: error.message },
      { status: 500 }
    );
  }
}
