import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import { rateLimiter } from "@/lib/auth/rate-limiter";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logging/logger";
import { ensureDbUsers } from "@/lib/auth/ensure-db-users";
import { is2FARequiredForUser, verify2FACode, getUserTotpSecret } from "@/lib/auth/two-factor";
import { verifyTurnstileToken } from "@/lib/security/captcha";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Validate request shape
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const { twoFactorCode, rememberMe, turnstileToken } = body;
    const cleanEmail = email.toLowerCase().trim();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required for portal authentication" },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // 1.5 Bot Defense & Captcha Verification
    const captchaCheck = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!captchaCheck.success) {
      return NextResponse.json({ error: captchaCheck.error }, { status: 403 });
    }

    const rateLimitKey = `login:${clientIp}:${cleanEmail}`;

    // 2. Brute-force protection: Max 5 attempts per 60 seconds
    const limitCheck = rateLimiter.check(rateLimitKey, 5, 60000);
    if (!limitCheck.allowed) {
      const waitSeconds = Math.ceil(limitCheck.resetTimeMs / 1000);
      return NextResponse.json(
        {
          error: `Security Alert: Too many failed login attempts. Account temporarily locked for ${waitSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(waitSeconds),
          },
        }
      );
    }

    // 3. Ensure all 16 database accounts exist
    await ensureDbUsers();

    // 4. Query real user from SQLite database
    const dbUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        institution: true,
      },
    });

    if (!dbUser) {
      logger.warn("Authentication failed: user not found in database", { email: cleanEmail, ip: clientIp });
      return NextResponse.json(
        { error: "Invalid institutional email address or password" },
        { status: 401 }
      );
    }

    // 5. Verify account status
    if (!dbUser.isActive) {
      return NextResponse.json(
        { error: "Access Denied: Account has been deactivated or suspended by institutional administration." },
        { status: 403 }
      );
    }

    // 5a. Check Persistent Database Account Lockout
    if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
      const remainingSeconds = Math.ceil((dbUser.lockedUntil.getTime() - Date.now()) / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return NextResponse.json(
        {
          error: `Security Lockout: Account temporarily locked due to repeated failed attempts. Try again in ${remainingMinutes} minute(s).`,
          lockedUntil: dbUser.lockedUntil.toISOString(),
          remainingSeconds,
        },
        { status: 423 }
      );
    }

    // 6. Real Cryptographic PBKDF2 Password Verification
    const isPasswordValid = await verifyPassword(password, dbUser.passwordHash);
    if (!isPasswordValid) {
      logger.warn("Authentication failed: invalid password hash match", { email: cleanEmail, ip: clientIp });

      const newFailedAttempts = (dbUser.failedLoginAttempts || 0) + 1;
      const shouldLock = newFailedAttempts >= 5;
      const lockExpiry = shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : newFailedAttempts,
          lockedUntil: lockExpiry,
        },
      });

      if (shouldLock) {
        await prisma.auditLog.create({
          data: {
            institutionId: dbUser.institutionId,
            actorUserId: dbUser.id,
            action: "ACCOUNT_LOCKED",
            targetEntity: "UserSecurity",
            targetId: dbUser.id,
            ipAddress: clientIp,
            detailsJson: JSON.stringify({
              email: cleanEmail,
              reason: "EXCESSIVE_FAILED_LOGINS",
              lockedUntil: lockExpiry?.toISOString(),
            }),
          },
        });

        return NextResponse.json(
          {
            error: "Security Alert: Account has been locked for 15 minutes due to 5 consecutive failed attempts.",
          },
          { status: 423 }
        );
      }

      const attemptsRemaining = 5 - newFailedAttempts;
      return NextResponse.json(
        {
          error: `Invalid institutional email address or password. (${attemptsRemaining} attempt${attemptsRemaining === 1 ? "" : "s"} remaining before temporary lockout)`,
        },
        { status: 401 }
      );
    }

    // Reset failed login attempts and clear lockout on successful password match
    if (dbUser.failedLoginAttempts > 0 || dbUser.lockedUntil) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // 6a. Check Force Password Change Requirement
    if (dbUser.mustChangePassword) {
      return NextResponse.json({
        mustChangePassword: true,
        email: dbUser.email,
        role: dbUser.role,
        fullName: `${dbUser.firstName} ${dbUser.lastName}`,
        message: "Mandatory initial password change required before accessing dashboard.",
      });
    }

    // 7. Check Two-Factor Authentication (2FA / MFA) Requirement
    if (is2FARequiredForUser(dbUser.role, dbUser.twoFactorEnabled)) {
      if (!twoFactorCode) {
        return NextResponse.json({
          requires2FA: true,
          email: dbUser.email,
          role: dbUser.role,
          fullName: `${dbUser.firstName} ${dbUser.lastName}`,
          message: "Two-factor authentication code required for high-privilege institutional role.",
        });
      }

      const userTotpSecret = getUserTotpSecret(dbUser.id);
      const isCodeValid = verify2FACode(twoFactorCode, userTotpSecret);
      if (!isCodeValid) {
        logger.warn("Authentication failed: invalid 2FA code", { email: cleanEmail, ip: clientIp });
        return NextResponse.json(
          { error: "Invalid two-factor authentication code. Please enter the 6-digit TOTP code or institutional passkey." },
          { status: 401 }
        );
      }
    }

    // 8. Reset rate limiter on successful authentication
    rateLimiter.reset(rateLimitKey);

    // 9. Update last login timestamp in SQLite database
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { lastLoginAt: new Date() },
    });

    // 10. Sign cryptographically verified JWT token
    const token = await signJwt({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      fullName: `${dbUser.firstName} ${dbUser.lastName}`,
      institutionId: dbUser.institutionId,
    });

    // 10a. Record Active Device Session in Database
    const userAgentHeader = req.headers.get("user-agent") || "Desktop Web Browser";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    let deviceLabel = "Desktop PC / Mac";
    if (/mobile/i.test(userAgentHeader)) deviceLabel = "Mobile Device";
    else if (/tablet|ipad/i.test(userAgentHeader)) deviceLabel = "Tablet Device";

    await prisma.userSession.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        ipAddress: clientIp,
        userAgent: userAgentHeader.slice(0, 200),
        device: deviceLabel,
        lastActiveAt: new Date(),
      },
    });

    // 11. Record immutable audit log
    await prisma.auditLog.create({
      data: {
        institutionId: dbUser.institutionId,
        actorUserId: dbUser.id,
        action: "LOGIN",
        targetEntity: "UserSession",
        targetId: dbUser.id,
        ipAddress: clientIp,
        detailsJson: JSON.stringify({
          role: dbUser.role,
          email: dbUser.email,
          authMethod: "PBKDF2_SECURE_PASSWORD",
          twoFactorVerified: is2FARequiredForUser(dbUser.role, dbUser.twoFactorEnabled),
          rememberMe: rememberMe !== false,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${dbUser.firstName} ${dbUser.lastName}`,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        fullName: `${dbUser.firstName} ${dbUser.lastName}`,
        role: dbUser.role,
        institutionId: dbUser.institutionId,
        institutionName: dbUser.institution?.name || "Apex University of Science & Technology",
      },
    });

    // 12. Set secure HTTP-only cookie
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
    if (rememberMe !== false) {
      cookieOptions.maxAge = 60 * 60 * 24 * 7; // 7 days
    }

    response.cookies.set("classroom_session", token, cookieOptions);

    logger.security("LOGIN_SUCCESS", dbUser.email, {
      role: dbUser.role,
      ip: clientIp,
      twoFactor: is2FARequiredForUser(dbUser.role, dbUser.twoFactorEnabled),
    });

    return response;
  } catch (error: any) {
    logger.error("Login API Error", error);
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
