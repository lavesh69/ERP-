import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth, ACADEMIC_LEADERSHIP_ROLES } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

import {
  evaluateStudentPromotion,
  PromotionCandidateEvaluation,
} from "@/lib/academic/promotion-engine";

/**
 * GET /api/students/promote
 * Preview cohort promotion statistics, backlog distribution, and individual eligibility
 */
export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, ACADEMIC_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId");
    const currentSemesterParam = searchParams.get("currentSemester");
    const targetSemesterParam = searchParams.get("targetSemester");
    const minCgpaParam = searchParams.get("minCgpa");
    const maxBacklogsParam = searchParams.get("maxBacklogs");

    const currentSemester = currentSemesterParam ? parseInt(currentSemesterParam, 10) : 1;
    const targetSemester = targetSemesterParam
      ? parseInt(targetSemesterParam, 10)
      : currentSemester + 1;
    const minCgpa = minCgpaParam ? parseFloat(minCgpaParam) : 4.0;
    const maxBacklogs = maxBacklogsParam ? parseInt(maxBacklogsParam, 10) : 3;

    // Filter criteria
    const whereClause: any = {
      currentSemester,
      status: { in: ["ACTIVE", "DEFAULTER_ALERT", "ACADEMIC_PROBATION"] },
    };

    if (programId) {
      whereClause.programId = programId;
    }

    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      whereClause.user = { institutionId: auth.payload.institutionId };
    }

    let program = programId
      ? await prisma.program.findUnique({
          where: { id: programId },
          select: { id: true, code: true, name: true, degree: true, durationYears: true },
        })
      : await prisma.program.findFirst({
          select: { id: true, code: true, name: true, degree: true, durationYears: true },
        });

    const maxProgramSemesters = (program?.durationYears || 4) * 2;

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, institutionId: true },
        },
        program: {
          select: { id: true, code: true, name: true, degree: true, durationYears: true },
        },
        section: {
          select: { id: true, name: true },
        },
        examResults: {
          include: {
            exam: {
              select: {
                title: true,
                course: { select: { code: true, title: true } },
              },
            },
          },
        },
        enrollments: {
          include: {
            course: { select: { code: true, title: true } },
          },
        },
      },
      orderBy: { rollNumber: "asc" },
    });

    const evaluations: PromotionCandidateEvaluation[] = students.map((s) => {
      const studentMaxSem = (s.program?.durationYears || 4) * 2;
      return evaluateStudentPromotion(s, targetSemester, minCgpa, maxBacklogs, studentMaxSem);
    });

    const eligibleCount = evaluations.filter((e) => e.eligible).length;
    const detainedCount = evaluations.filter((e) => !e.eligible).length;
    const graduationCount = evaluations.filter((e) => e.status === "GRADUATION_ELIGIBLE").length;
    const totalCount = evaluations.length;
    const promotionRate = totalCount > 0 ? ((eligibleCount / totalCount) * 100).toFixed(1) + "%" : "0.0%";

    return NextResponse.json({
      success: true,
      summary: {
        programId: program?.id || programId || "all",
        programCode: program?.code || "N/A",
        programName: program?.name || "All Programs",
        currentSemester,
        targetSemester,
        minCgpa,
        maxBacklogs,
        maxProgramSemesters,
        totalCohortSize: totalCount,
        eligibleCount,
        detainedCount,
        graduationCount,
        promotionRate,
      },
      students: evaluations,
    });
  } catch (error: any) {
    logger.error("Failed to preview bulk student promotion", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview semester promotion" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students/promote
 * Execute bulk semester promotion or graduation with CGPA and backlog gates
 */
export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ACADEMIC_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      programId,
      currentSemester,
      targetSemester,
      minCgpa = 4.0,
      maxBacklogs = 3,
      studentIds,
      action = "PROMOTE",
    } = body;

    if (currentSemester == null || targetSemester == null) {
      return NextResponse.json(
        { error: "currentSemester and targetSemester are required fields" },
        { status: 400 }
      );
    }

    const sourceSemNum = parseInt(String(currentSemester), 10);
    const targetSemNum = parseInt(String(targetSemester), 10);
    const minCgpaNum = parseFloat(String(minCgpa));
    const maxBacklogsNum = parseInt(String(maxBacklogs), 10);

    if (targetSemNum <= sourceSemNum) {
      return NextResponse.json(
        { error: "targetSemester must be strictly greater than currentSemester" },
        { status: 400 }
      );
    }

    // Filter candidates
    const whereClause: any = {
      currentSemester: sourceSemNum,
      status: { in: ["ACTIVE", "DEFAULTER_ALERT", "ACADEMIC_PROBATION"] },
    };

    if (programId) {
      whereClause.programId = programId;
    }

    if (Array.isArray(studentIds) && studentIds.length > 0) {
      whereClause.id = { in: studentIds };
    }

    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      whereClause.user = { institutionId: auth.payload.institutionId };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true, institutionId: true },
        },
        program: {
          select: { id: true, code: true, name: true, degree: true, durationYears: true },
        },
        examResults: {
          include: {
            exam: {
              select: {
                title: true,
                course: { select: { code: true, title: true } },
              },
            },
          },
        },
        enrollments: {
          include: {
            course: { select: { code: true, title: true } },
          },
        },
      },
    });

    if (students.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No active students found in Semester ${sourceSemNum} matching criteria.`,
        promotedCount: 0,
        detainedCount: 0,
        totalProcessed: 0,
        results: [],
      });
    }

    const evaluations = students.map((s) => {
      const studentMaxSem = (s.program?.durationYears || 4) * 2;
      return evaluateStudentPromotion(s, targetSemNum, minCgpaNum, maxBacklogsNum, studentMaxSem);
    });

    const eligibleCandidates = evaluations.filter((e) => e.eligible);
    const detainedCandidates = evaluations.filter((e) => !e.eligible);

    // If simulating, return preview results without database writes
    if (action === "SIMULATE") {
      return NextResponse.json({
        success: true,
        simulated: true,
        message: `Simulation complete: ${eligibleCandidates.length} eligible for promotion, ${detainedCandidates.length} detained.`,
        totalProcessed: evaluations.length,
        promotedCount: eligibleCandidates.length,
        detainedCount: detainedCandidates.length,
        results: evaluations,
      });
    }

    // Execute atomic promotion in database
    await prisma.$transaction(async (tx) => {
      for (const item of eligibleCandidates) {
        const studentRecord = students.find((s) => s.id === item.id);
        const maxSem = (studentRecord?.program?.durationYears || 4) * 2;
        const isGraduation = targetSemNum > maxSem;

        await tx.student.update({
          where: { id: item.id },
          data: {
            currentSemester: isGraduation ? sourceSemNum : targetSemNum,
            status: isGraduation ? "GRADUATED" : "ACTIVE",
          },
        });
      }

      for (const item of detainedCandidates) {
        await tx.student.update({
          where: { id: item.id },
          data: {
            status: "ACADEMIC_PROBATION",
          },
        });
      }
    });

    // Dispatch audit log
    const institutionId =
      auth.payload.institutionId || students[0]?.user.institutionId || "inst-apex-01";

    await logAuditEvent({
      institutionId,
      actorUserId: auth.payload.userId || "admin",
      action: "BULK_STUDENT_PROMOTION",
      targetEntity: "StudentCohort",
      targetId: programId || "all",
      details: {
        programId: programId || "all",
        sourceSemester: sourceSemNum,
        targetSemester: targetSemNum,
        minCgpa: minCgpaNum,
        maxBacklogs: maxBacklogsNum,
        totalProcessed: evaluations.length,
        promotedCount: eligibleCandidates.length,
        detainedCount: detainedCandidates.length,
      },
    });

    logger.info("Bulk student semester promotion completed", {
      programId,
      sourceSemester: sourceSemNum,
      targetSemester: targetSemNum,
      promotedCount: eligibleCandidates.length,
      detainedCount: detainedCandidates.length,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed semester promotion: ${eligibleCandidates.length} students advanced to Semester ${targetSemNum}, ${detainedCandidates.length} placed on academic probation/detained.`,
      programId: programId || "all",
      sourceSemester: sourceSemNum,
      targetSemester: targetSemNum,
      promotedCount: eligibleCandidates.length,
      detainedCount: detainedCandidates.length,
      totalProcessed: evaluations.length,
      results: evaluations,
    });
  } catch (error: any) {
    logger.error("Failed to execute bulk student promotion", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute bulk student promotion" },
      { status: 500 }
    );
  }
}
