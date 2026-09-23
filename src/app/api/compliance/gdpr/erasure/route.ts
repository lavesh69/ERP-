import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to request data erasure." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { confirmationText } = body;

    if (confirmationText !== "CONFIRM_ERASURE") {
      return NextResponse.json(
        { error: 'Please provide exact confirmationText: "CONFIRM_ERASURE"' },
        { status: 400 }
      );
    }

    const userId = session.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Generate cryptographic pseudonymization key
    const hash = crypto.createHash("sha256").update(`${userId}:${Date.now()}`).digest("hex");
    const anonEmail = `erased.${hash.slice(0, 10)}@privacy.classroom.internal`;

    // 1. Wipe all active device sessions
    await prisma.userSession.deleteMany({ where: { userId } });

    // 2. Anonymize Personal Identifiable Information (PII)
    const anonymizedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: anonEmail,
        firstName: "Anonymized",
        lastName: "Scholar",
        phone: null,
        avatarUrl: null,
        isActive: false,
        twoFactorEnabled: false,
      },
    });

    // 3. Log Immutable Compliance Audit Record
    await logAuditEvent({
      institutionId: user.institutionId,
      actorUserId: userId,
      action: "PERMISSION_OVERRIDE",
      targetEntity: "ComplianceGDPR",
      targetId: userId,
      details: {
        action: "GDPR_ARTICLE_17_ERASURE_EXECUTED",
        pseudonymizedEmail: anonEmail,
      },
    });

    // 4. Invalidate session cookie
    const response = NextResponse.json({
      success: true,
      message: "Personal information successfully pseudonymized and purged in compliance with GDPR Article 17.",
      anonymizedSubjectId: anonymizedUser.id,
    });

    response.cookies.delete("classroom_session");
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to execute erasure" }, { status: 500 });
  }
}
