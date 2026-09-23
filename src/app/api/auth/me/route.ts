import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { isTokenRevoked } from "@/lib/auth/token-revocation";
import { UserRole } from "@/types/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("classroom_session")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null, error: "No active session" },
        { status: 401 }
      );
    }

    if (await isTokenRevoked(token)) {
      const resp = NextResponse.json(
        { authenticated: false, error: "Session has been revoked or expired" },
        { status: 401 }
      );
      resp.cookies.set("classroom_session", "", { path: "/", maxAge: 0 });
      return resp;
    }

    const payload = await verifyJwt<any>(token);

    if (!payload) {
      return NextResponse.json(
        { authenticated: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Verify account is still active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isActive: true },
    });

    if (dbUser && !dbUser.isActive) {
      const resp = NextResponse.json(
        { authenticated: false, error: "Account has been deactivated" },
        { status: 403 }
      );
      resp.cookies.set("classroom_session", "", { path: "/", maxAge: 0 });
      return resp;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.userId,
        email: payload.email,
        role: payload.role as UserRole,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: payload.fullName,
        institutionId: payload.institutionId,
        institutionName: "Apex Institute of Science & Technology",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { authenticated: false, error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
