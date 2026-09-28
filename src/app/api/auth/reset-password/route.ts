import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPasswordResetToken, hashPassword } from "@/lib/auth/password";
import { isTokenRevoked, revokeToken } from "@/lib/auth/token-revocation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Reset token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters in length" },
        { status: 400 }
      );
    }

    if (await isTokenRevoked(token)) {
      return NextResponse.json(
        { error: "This password reset token has already been used or invalidated." },
        { status: 400 }
      );
    }

    const verification = verifyPasswordResetToken(token);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { error: verification.error || "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash password with PBKDF2
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: verification.userId },
      data: { passwordHash: hashedPassword },
    });

    // Invalidate the reset token to prevent reuse
    await revokeToken(token, 1800);

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated. You may now log in.",
    });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}
