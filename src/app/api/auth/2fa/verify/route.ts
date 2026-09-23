import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { getUserTotpSecret, verify2FACode } from "@/lib/auth/two-factor";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
    }

    const secret = getUserTotpSecret(session.userId);
    const isValid = verify2FACode(code, secret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code. Please check your authenticator app and try again." },
        { status: 400 }
      );
    }

    // Enable 2FA for user
    await prisma.user.update({
      where: { id: session.userId },
      data: { twoFactorEnabled: true },
    });

    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "2FA_ENABLED",
      targetEntity: "UserSecurity",
      targetId: session.userId,
      details: { email: session.email },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication successfully enabled. Your account is now secured.",
    });
  } catch (error: any) {
    console.error("2FA Verify Error:", error);
    return NextResponse.json({ error: "Failed to verify 2FA code", details: error.message }, { status: 500 });
  }
}
