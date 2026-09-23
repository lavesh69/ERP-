import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { signJwt } from "@/lib/auth/jwt";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  // C3: Super Admin or Institution Admin authorization check
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { institutionId } = body;

    if (!institutionId || typeof institutionId !== "string") {
      return NextResponse.json(
        { error: "institutionId parameter is required" },
        { status: 400 }
      );
    }

    // Verify institution exists in database
    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json(
        { error: `Institution with ID '${institutionId}' not found in registry.` },
        { status: 404 }
      );
    }

    // Re-mint the session JWT containing the updated institution context
    const currentPayload = auth.payload;
    const newPayload = {
      ...currentPayload,
      institutionId: institution.id,
      institutionName: institution.name,
      institutionCode: institution.code,
    };

    const token = await signJwt(newPayload);

    // Audit the tenant context switch
    await logAuditEvent({
      institutionId: institution.id,
      actorUserId: currentPayload.userId,
      action: "PERMISSION_OVERRIDE",
      targetEntity: `InstitutionContext:${institution.code}`,
      targetId: institution.id,
      details: {
        previousInstitutionId: currentPayload.institutionId,
        newInstitutionId: institution.id,
        newInstitutionName: institution.name,
        actor: currentPayload.email,
      },
    });

    const response = NextResponse.json({
      success: true,
      message: `Switched operational context to ${institution.name} (${institution.code})`,
      institution: {
        id: institution.id,
        name: institution.name,
        code: institution.code,
      },
      user: newPayload,
    });

    // Set updated secure HTTP-only cookie with new tenant context
    response.cookies.set("classroom_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    logger.info("Admin context switched to tenant", {
      actor: currentPayload.email,
      institutionCode: institution.code,
    });

    return response;
  } catch (error: any) {
    logger.error("Switch Tenant Error", error);
    return NextResponse.json(
      { error: "Failed to switch institution tenant context", details: error.message },
      { status: 500 }
    );
  }
}
