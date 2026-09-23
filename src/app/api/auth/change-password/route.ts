import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { evaluatePassword } from "@/lib/auth/password-strength";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Email, current password, and new password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // 1. Verify current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Current password does not match records." },
        { status: 401 }
      );
    }

    // 2. Validate new password strength
    const { score } = evaluatePassword(newPassword);
    if (score < 3) {
      return NextResponse.json(
        { error: "New password does not meet institutional complexity standards." },
        { status: 400 }
      );
    }

    // 3. Hash with PBKDF2-SHA512
    const newHash = await hashPassword(newPassword);

    // 4. Update user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    // 5. Audit Log
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLog.create({
      data: {
        institutionId: user.institutionId,
        actorUserId: user.id,
        action: "PASSWORD_CHANGED",
        targetEntity: "UserSecurity",
        targetId: user.id,
        ipAddress: clientIp,
        detailsJson: JSON.stringify({
          email: cleanEmail,
          method: "MANDATORY_OR_USER_INITIATED",
          timestamp: new Date().toISOString(),
        }),
      },
    });

    logger.info(`Password successfully updated for user: ${cleanEmail}`);

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now sign in.",
    });
  } catch (error: any) {
    logger.error("Change password failed", error);
    return NextResponse.json(
      { error: "Failed to process password change." },
      { status: 500 }
    );
  }
}
