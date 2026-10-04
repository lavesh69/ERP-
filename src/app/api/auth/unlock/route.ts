import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_DEMO_PASSWORD } from "@/lib/auth/ensure-db-users";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  // Enterprise Security Gate: Account unlock requires authenticated Administrator
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toLowerCase().trim();
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email) {
      return NextResponse.json({ error: "Email is required to unlock account." }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    // Multi-tenant boundary check: Institution Admin can only unlock users within their institution
    if (auth.payload.role !== "SUPER_ADMIN" && user.institutionId !== auth.payload.institutionId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot unlock user accounts from another institution." },
        { status: 403 }
      );
    }

    // Reset rate limiter for this email and IP
    rateLimiter.reset(`login:${clientIp}:${email}`);
    rateLimiter.reset(`login:127.0.0.1:${email}`);

    // Default to NOT resetting password unless explicitly requested by super admin
    const shouldResetPassword = auth.payload.role === "SUPER_ADMIN" && body.resetPasswordToDefault === true;
    const updateData: any = {
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    };

    if (shouldResetPassword) {
      updateData.passwordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);
      updateData.mustChangePassword = true; // force password change immediately
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    await logAuditEvent({
      institutionId: user.institutionId,
      actorUserId: auth.payload.userId,
      action: "ACCOUNT_UNLOCKED",
      targetEntity: `User:${user.id}`,
      targetId: user.id,
      ipAddress: clientIp,
      details: {
        unlockedUserEmail: email,
        passwordResetToDefault: shouldResetPassword,
        admin: auth.payload.email,
      },
    });

    logger.info(`Account unlocked: ${email} by admin ${auth.payload.email}`);

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
