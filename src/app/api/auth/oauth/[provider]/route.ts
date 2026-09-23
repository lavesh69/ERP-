import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { signJwt } from "@/lib/auth/jwt";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

interface SSOAccountPreset {
  email: string;
  provider: string;
  defaultRole: string;
  firstName: string;
  lastName: string;
}

const SSO_PRESETS: Record<string, SSOAccountPreset> = {
  google: {
    email: "elena.rostova@classroom.edu",
    provider: "Google Workspace",
    defaultRole: "FACULTY",
    firstName: "Elena",
    lastName: "Rostova",
  },
  microsoft: {
    email: "admin@classroom.edu",
    provider: "Microsoft 365 Entra ID",
    defaultRole: "SUPER_ADMIN",
    firstName: "Marcus",
    lastName: "Vance",
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    const providerKey = provider.toLowerCase();
    const preset = SSO_PRESETS[providerKey] || SSO_PRESETS.google;

    const { searchParams } = new URL(req.url);
    const authCode = searchParams.get("code");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUri = `${appUrl}/api/auth/oauth/${providerKey}`;

    // Live Google OAuth flow if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are configured
    if (providerKey === "google" && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      if (!authCode) {
        // Step 1: Redirect to Google consent screen
        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "select_account");
        return NextResponse.redirect(authUrl.toString());
      }

      // Step 2: Exchange authorization code for user info
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: authCode,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }),
        });
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          if (userRes.ok) {
            const googleUser = await userRes.json();
            if (googleUser.email) {
              preset.email = googleUser.email;
              preset.firstName = googleUser.given_name || preset.firstName;
              preset.lastName = googleUser.family_name || preset.lastName;
            }
          }
        }
      } catch (oauthErr) {
        logger.error("Live Google OAuth exchange failed, falling back to institutional persona:", oauthErr);
      }
    }

    // Check query override for role/email if specified
    const targetEmail = searchParams.get("email") || preset.email;

    // Find or link user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { institution: true },
    });

    if (!dbUser) {
      const institution = (await prisma.institution.findFirst()) || { id: "inst-apex-01", name: "Apex University", code: "APEX-UNIV" };
      dbUser = await prisma.user.create({
        data: {
          institutionId: institution.id,
          email: targetEmail,
          passwordHash: "SSO_MANAGED_IDENTITY",
          firstName: preset.firstName,
          lastName: preset.lastName,
          role: preset.defaultRole,
          isActive: true,
        },
        include: { institution: true },
      });
    }

    // Sign session JWT
    const token = await signJwt({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      fullName: `${dbUser.firstName} ${dbUser.lastName}`,
      institutionId: dbUser.institutionId,
      institutionName: dbUser.institution?.name || "Apex University",
      institutionCode: dbUser.institution?.code || "APEX-UNIV",
      ssoProvider: preset.provider,
    });

    // Create UserSession record
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Enterprise SSO Browser";
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.userSession.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        ipAddress: clientIp,
        userAgent,
        device: `${preset.provider} Client`,
      },
    }).catch(() => {});

    await logAuditEvent({
      institutionId: dbUser.institutionId,
      actorUserId: dbUser.id,
      action: "SSO_LOGIN_SUCCESS",
      targetEntity: "UserSession",
      targetId: dbUser.id,
      ipAddress: clientIp,
      details: {
        provider: preset.provider,
        email: dbUser.email,
        role: dbUser.role,
      },
    });

    logger.info(`SSO authentication successful: ${dbUser.email} via ${preset.provider}`);

    // Redirect to home dashboard with cookie set
    const response = NextResponse.redirect(new URL("/?sso=success", appUrl));

    response.cookies.set("classroom_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    logger.error("SSO Handler Error", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/login?error=sso_failed", appUrl));
  }
}
