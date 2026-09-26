import { NextRequest, NextResponse } from "next/server";
import { verifyJwt, signJwt } from "@/lib/auth/jwt";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";

const VALID_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "PRINCIPAL",
  "HOD",
  "FACULTY",
  "CLASS_TEACHER",
  "STUDENT",
  "PARENT",
  "ACCOUNTANT",
  "LIBRARIAN",
  "EXAMINATION_CONTROLLER",
  "PLACEMENT_OFFICER",
  "RESEARCH_COORDINATOR",
  "HR_STAFF",
  "ALUMNI",
  "GUEST",
];

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("classroom_session")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "No active session found to switch perspective." },
        { status: 401 }
      );
    }

    const payload = await verifyJwt<any>(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const targetRole = body.role as UserRole;

    if (!targetRole || !VALID_ROLES.includes(targetRole)) {
      return NextResponse.json(
        { error: `Invalid target role: ${targetRole}` },
        { status: 400 }
      );
    }

    // Preserve original role if not already recorded
    const originalRole = payload.originalRole || payload.role;

    // Mint new JWT with switched perspective role
    const updatedPayload = {
      ...payload,
      role: targetRole,
      originalRole,
      switchedAt: new Date().toISOString(),
    };

    const newToken = await signJwt(updatedPayload, 86400 * 7);

    const response = NextResponse.json({
      success: true,
      message: `Perspective successfully switched to ${targetRole}`,
      role: targetRole,
      originalRole,
    });

    response.cookies.set("classroom_session", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await logAuditEvent({
      institutionId: payload.institutionId || "inst-apex-01",
      actorUserId: payload.userId,
      action: "PERSPECTIVE_SWITCHED",
      targetEntity: "UserSession",
      targetId: payload.userId,
      details: {
        fromRole: payload.role,
        toRole: targetRole,
      },
    });

    return response;
  } catch (error: any) {
    console.error("Switch Role API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to switch perspective" },
      { status: 500 }
    );
  }
}
