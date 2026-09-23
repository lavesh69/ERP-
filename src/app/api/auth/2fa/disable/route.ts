import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { getUserTotpSecret, verify2FACode, PRIVILEGED_2FA_ROLES } from "@/lib/auth/two-factor";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (PRIVILEGED_2FA_ROLES.has(session.role)) {
      return NextResponse.json(
        { error: "Administrative policy strictly requires 2FA for this institutional role. It cannot be disabled." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Authentication code is required to disable 2FA" }, { status: 400 });
    }

    const secret = getUserTotpSecret(session.userId);
    const isValid = verify2FACode(code, secret);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid confirmation code" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { twoFactorEnabled: false },
    });

    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "2FA_DISABLED",
      targetEntity: "UserSecurity",
      targetId: session.userId,
      details: { email: session.email },
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled.",
    });
  } catch (error: any) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json({ error: "Failed to disable 2FA", details: error.message }, { status: 500 });
  }
}
