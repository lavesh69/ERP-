import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { getAttendanceExceptions, recordAttendanceException } from "@/lib/attendance/exceptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "ALL";
    const severity = searchParams.get("severity") || "ALL";
    const institutionId = searchParams.get("institutionId") || "ALL";
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;

    const exceptions = getAttendanceExceptions({
      category,
      severity,
      institutionId,
      limit,
    });

    return NextResponse.json({
      total: exceptions.length,
      exceptions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch attendance exceptions", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const session = await getOptionalSession(req);

    const recorded = recordAttendanceException({
      institutionId: body.institutionId || session?.institutionId || "inst-apex-01",
      actor: session?.email || body.actor || "anonymous",
      actorRole: session?.role || body.actorRole || "GUEST",
      category: body.category || "QR_FAILED",
      severity: body.severity || "P2_MEDIUM",
      sessionId: body.sessionId,
      courseCode: body.courseCode,
      sectionName: body.sectionName,
      reason: body.reason || "Unspecified anomaly",
      clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    return NextResponse.json({ success: true, exception: recorded });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to record exception", details: error.message },
      { status: 500 }
    );
  }
}
