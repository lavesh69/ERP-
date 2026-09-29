import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { hashPassword } from "@/lib/auth/password";
import { DEFAULT_DEMO_PASSWORD } from "@/lib/auth/ensure-db-users";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").toLowerCase().trim();
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    if (!email) {
      return NextResponse.json({ error: "Email is required to unlock account." }, { status: 400 });
    }

    // Reset rate limiter for this email and IP
    rateLimiter.reset(`login:${clientIp}:${email}`);
    rateLimiter.reset(`login:127.0.0.1:${email}`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found." }, { status: 404 });
    }

    const shouldResetPassword = body.resetPasswordToDefault ?? true;
    const updateData: any = {
      failedLoginAttempts: 0,
      lockedUntil: null,
      isActive: true,
    };

    if (shouldResetPassword) {
      updateData.passwordHash = await hashPassword(DEFAULT_DEMO_PASSWORD);
      updateData.mustChangePassword = false;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    logger.info(`Account unlocked and refreshed: ${email} by ${clientIp}`);

    return NextResponse.json({
      success: true,
      message: `Account for ${email} has been completely unlocked. Password reset to "${DEFAULT_DEMO_PASSWORD}".`,
      defaultPassword: DEFAULT_DEMO_PASSWORD,
    });
  } catch (error: any) {
    logger.error("Failed to unlock account", error);
    return NextResponse.json({ error: "Failed to unlock account." }, { status: 500 });
  }
}
