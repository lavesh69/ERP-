import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_DEMO_PASSWORD } from "@/lib/auth/ensure-db-users";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toLowerCase().trim();
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email) {
      return NextResponse.json({ error: "Email is required to unlock account." }, { status: 400 });
    }

    const isDemoEmail =
      email.endsWith("@classroom.edu") ||
      email.endsWith("@apex.edu") ||
      email.includes("mercer") ||
      email.endsWith("@techcorp.io") ||
      email.endsWith("@accreditation-board.org");

    // Enterprise Security Gate: Account unlock requires authenticated Administrator (except for public demo accounts)
    let auth: any = null;
    if (!isDemoEmail) {
      const authRes = await requireAdminAuth(req);
      if (authRes instanceof NextResponse) return authRes;
      auth = authRes;
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Multi-tenant boundary check: Institution Admin can only unlock users within their institution
    if (auth && auth.payload.role !== "SUPER_ADMIN" && user.institutionId !== auth.payload.institutionId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot unlock user accounts from another institution." },
        { status: 403 }
      );
    }

    // Reset rate limiter for this email and IP
    rateLimiter.reset(`login:${clientIp}:${email}`);
    rateLimiter.reset(`login:127.0.0.1:${email}`);

    // Reset password to default if requested for demo account or by super admin
    const shouldResetPassword = (isDemoEmail || auth?.payload?.role === "SUPER_ADMIN") && body.resetPasswordToDefault === true;
    const updateData: any = {
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
      mustChangePassword: false,
    };

    if (shouldResetPassword) {
      updateData.passwordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);
      if (!isDemoEmail) {
        updateData.mustChangePassword = true; // force password change immediately for non-demo users
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await logAuditEvent({
      institutionId: user.institutionId,
      actorUserId: auth?.payload?.userId || user.id,
      action: "ACCOUNT_UNLOCKED",
      targetEntity: `User:${user.id}`,
      targetId: user.id,
      ipAddress: clientIp,
      details: {
        unlockedUserEmail: email,
        passwordResetToDefault: shouldResetPassword,
        admin: auth?.payload?.email || "public-demo-unlock",
      },
    });

    logger.info(`Account unlocked: ${email} by ${auth?.payload?.email || "demo-unlock"}`);

    return NextResponse.json({
      success: true,
      message: `Account for ${email} has been successfully unlocked.`,
      passwordReset: shouldResetPassword,
    });
  } catch (error: any) {
    logger.error("Failed to unlock account", error);
    return NextResponse.json({ error: "Failed to unlock account." }, { status: 500 });
  }
}
