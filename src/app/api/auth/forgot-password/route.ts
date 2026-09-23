import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createPasswordResetToken } from "@/lib/auth/password";
import { sendEmail, getResetPasswordEmailHtml } from "@/lib/email/email-service";
import { verifyTurnstileToken } from "@/lib/security/captcha";
import { checkOtpLimit, recordOtpDispatch } from "@/lib/security/otp-rate-limiter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, turnstileToken } = body;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    // 1. Bot Defense & CAPTCHA Verification
    const captchaCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!captchaCheck.success) {
      return NextResponse.json({ error: captchaCheck.error }, { status: 403 });
    }

    // 2. Anti-OTP Bombing & Rate Limit Shield
    const rateCheck = checkOtpLimit(cleanEmail, clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.reason, retryAfterSeconds: rateCheck.retryAfterSeconds },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return 200 to prevent user enumeration attacks in production
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been dispatched.",
      });
    }

    const resetToken = createPasswordResetToken(user.email, user.id);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/login?resetToken=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(cleanEmail)}`;

    // Dispatch branded email to student/staff outbox
    const fullName = `${user.firstName} ${user.lastName}`;
    await sendEmail({
      to: cleanEmail,
      subject: `[CLASSROOM] Password Reset Code: ${otpCode}`,
      html: getResetPasswordEmailHtml(fullName, otpCode, resetUrl),
      type: "PASSWORD_RESET",
      otpCode,
    });

    recordOtpDispatch(cleanEmail, clientIp);

    return NextResponse.json({
      success: true,
      message: `Password reset instructions dispatched to ${cleanEmail}. Check inbox or Outbox.`,
      resetToken,
      otpCode,
      expiresInMinutes: 30,
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
