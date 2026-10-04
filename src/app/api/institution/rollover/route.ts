import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ALLOWED_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { fromSemester, toSemester, programId, targetStatus } = body;

    if (!fromSemester || !toSemester) {
      return NextResponse.json(
        { error: "fromSemester and toSemester numbers are required" },
        { status: 400 }
      );
    }

    const fromSemNum = Number(fromSemester);
    const toSemNum = Number(toSemester);

    // Tenant boundary scoping
    const tenantFilter: any = {};
    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      tenantFilter.user = { institutionId: auth.payload.institutionId };
    }

    if (programId) {
      tenantFilter.programId = programId;
    }

    tenantFilter.currentSemester = fromSemNum;
    tenantFilter.status = "ACTIVE";

    const candidates = await prisma.student.findMany({
      where: tenantFilter,
      include: { user: true, program: true },
    });

    if (candidates.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No active students found in Semester ${fromSemNum} matching the criteria.`,
        promotedCount: 0,
      });
    }

    const candidateIds = candidates.map((c) => c.id);
    const isGraduation = toSemNum > 8 || targetStatus === "GRADUATED";

    const updated = await prisma.student.updateMany({
      where: { id: { in: candidateIds } },
      data: {
        currentSemester: isGraduation ? fromSemNum : toSemNum,
        status: isGraduation ? "GRADUATED" : "ACTIVE",
      },
    });

    const institutionId =
      auth.payload.institutionId || candidates[0]?.user.institutionId || "global";

    await logAuditEvent({
      institutionId,
      actorUserId: auth.payload.userId || "admin",
      action: isGraduation ? "BATCH_STUDENTS_GRADUATED" : "ACADEMIC_SEMESTER_ROLLOVER",
      targetEntity: "StudentCohort",
      details: {
        fromSemester: fromSemNum,
        toSemester: toSemNum,
        totalPromoted: updated.count,
        isGraduation,
      },
    });

    logger.info("Academic cohort rollover completed", {
      fromSemester: fromSemNum,
      toSemester: toSemNum,
      count: updated.count,
    });

    return NextResponse.json({
      success: true,
      message: isGraduation
        ? `Successfully conferred degrees and graduated ${updated.count} scholars from Semester ${fromSemNum}.`
        : `Successfully promoted ${updated.count} scholars from Semester ${fromSemNum} to Semester ${toSemNum}.`,
      promotedCount: updated.count,
      fromSemester: fromSemNum,
      toSemester: toSemNum,
      isGraduation,
    });
  } catch (error: any) {
    logger.error("Academic rollover POST error", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute academic rollover" },
      { status: 500 }
    );
  }
}
