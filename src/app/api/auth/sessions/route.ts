import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { revokeToken } from "@/lib/auth/token-revocation";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentToken = req.cookies.get("classroom_session")?.value || "";
    const currentTokenHash = currentToken
      ? crypto.createHash("sha256").update(currentToken).digest("hex")
      : "";

    const userSessions = await prisma.userSession.findMany({
      where: { userId: session.userId },
      orderBy: { lastActiveAt: "desc" },
    });

    const formatted = userSessions.map((s) => ({
      id: s.id,
      device: s.device || "Desktop Browser",
      ipAddress: s.ipAddress || "127.0.0.1",
      userAgent: s.userAgent || "Web Browser",
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent: s.tokenHash === currentTokenHash,
    }));

    return NextResponse.json({
      sessions: formatted,
      totalActive: formatted.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve active sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, sessionId } = body;

    const currentToken = req.cookies.get("classroom_session")?.value || "";
    const currentTokenHash = currentToken
      ? crypto.createHash("sha256").update(currentToken).digest("hex")
      : "";

    if (action === "REVOKE_ALL_OTHERS") {
      // Find all sessions except current
      const otherSessions = await prisma.userSession.findMany({
        where: {
          userId: session.userId,
          NOT: { tokenHash: currentTokenHash },
        },
      });

      for (const s of otherSessions) {
        await revokeToken(s.tokenHash);
      }

      const deleteResult = await prisma.userSession.deleteMany({
        where: {
          userId: session.userId,
          NOT: { tokenHash: currentTokenHash },
        },
      });

      // Security Audit Log
      await prisma.auditLog.create({
        data: {
          institutionId: session.institutionId || (await prisma.institution.findFirst())?.id || "inst-default",
          actorUserId: session.userId,
          action: "REVOKE_ALL_OTHER_SESSIONS",
          targetEntity: "UserSession",
          targetId: session.userId,
          ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
          detailsJson: JSON.stringify({
            revokedCount: deleteResult.count,
            timestamp: new Date().toISOString(),
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully terminated ${deleteResult.count} other active device sessions.`,
        revokedCount: deleteResult.count,
      });
    }

    if (action === "REVOKE_SESSION" && sessionId) {
      const targetSession = await prisma.userSession.findFirst({
        where: { id: sessionId, userId: session.userId },
      });

      if (targetSession) {
        await revokeToken(targetSession.tokenHash);
        await prisma.userSession.delete({ where: { id: targetSession.id } });
      }

      return NextResponse.json({
        success: true,
        message: "Device session revoked successfully.",
      });
    }

    return NextResponse.json({ error: "Invalid action or parameters." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to revoke session" },
      { status: 500 }
    );
  }
}
