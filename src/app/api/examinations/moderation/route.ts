import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  calculateExamStatistics,
  applyBellCurveModeration,
  applyGraceMarkModeration,
} from "@/lib/examinations/moderation-engine";
import { requireRoleAuth, ACADEMIC_LEADERSHIP_ROLES } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/examinations/moderation
 * Retrieves statistical dispersion analysis, histogram bins, and moderation projections for an examination
 */
export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, ACADEMIC_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");

    let exam = null;
    if (examId) {
      exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: {
          course: { select: { code: true, title: true } },
          results: {
            include: {
              student: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      });
    } else {
      exam = await prisma.exam.findFirst({
        include: {
          course: { select: { code: true, title: true } },
          results: {
            include: {
              student: {
                include: { user: { select: { firstName: true, lastName: true } } },
              },
            },
          },
        },
      });
    }

    if (!exam) {
      return NextResponse.json({ error: "Examination record not found" }, { status: 404 });
    }

    const candidateResults = exam.results.map((r) => ({
      studentId: r.studentId,
      studentName: r.student?.user
        ? `${r.student.user.firstName || ""} ${r.student.user.lastName || ""}`.trim()
        : r.student?.rollNumber || "Unknown",
      rollNumber: r.student?.rollNumber || "N/A",
      marksObtained: r.marksObtained,
      gradeLetter: r.gradeLetter,
    }));

    const rawMarks = candidateResults.map((r) => r.marksObtained);
    const stats = calculateExamStatistics(rawMarks, 40);

    const bellCurveSim = applyBellCurveModeration(candidateResults, 65, exam.totalMarks);
    const graceMarksSim = applyGraceMarkModeration(candidateResults, 40, 5);

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        type: exam.type,
        totalMarks: exam.totalMarks,
        courseCode: exam.course?.code,
        courseTitle: exam.course?.title,
      },
      statistics: stats,
      projections: {
        bellCurve: {
          targetMean: 65,
          afterStats: bellCurveSim.afterStats,
          projectedPassRate: bellCurveSim.afterStats.passRatePercent,
        },
        graceMarks: {
          passingThreshold: 40,
          maxGrace: 5,
          beneficiariesCount: graceMarksSim.graceBeneficiariesCount,
          afterStats: graceMarksSim.afterStats,
          projectedPassRate: graceMarksSim.afterStats.passRatePercent,
        },
      },
      candidates: candidateResults,
    });
  } catch (error: any) {
    logger.error("Failed to retrieve examination moderation analysis", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve examination moderation analysis" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/examinations/moderation
 * Executes or simulates examination mark moderation with committee sign-off audit logging
 */
export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ACADEMIC_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      examId,
      moderationType = "BELL_CURVE",
      targetMean = 65,
      passingMarks = 40,
      maxGraceMarks = 5,
      action = "APPLY",
      committeeSignOffBy = "Senate Examination Moderation Board",
    } = body;

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { results: true },
    });

    if (!exam) {
      return NextResponse.json({ error: "Examination not found" }, { status: 404 });
    }

    const records = exam.results.map((r) => ({
      studentId: r.studentId,
      marksObtained: r.marksObtained,
    }));

    let moderationOutput: any;
    if (moderationType === "GRACE_MARKS") {
      moderationOutput = applyGraceMarkModeration(records, passingMarks, maxGraceMarks);
    } else {
      moderationOutput = applyBellCurveModeration(records, targetMean, exam.totalMarks);
    }

    if (action === "SIMULATE") {
      return NextResponse.json({
        success: true,
        simulated: true,
        moderationType,
        beforeStats: moderationOutput.beforeStats,
        afterStats: moderationOutput.afterStats,
        results: moderationOutput.results,
      });
    }

    // Apply moderation to database atomically
    await prisma.$transaction(async (tx) => {
      for (const item of moderationOutput.results) {
        await tx.examResult.updateMany({
          where: { examId, studentId: item.studentId },
          data: {
            marksObtained: item.moderatedMarks,
            gradeLetter: item.moderatedGrade,
            remarks: item.moderationReason,
            isVerified: true,
          },
        });
      }
    });

    // Record audit event
    await logAuditEvent({
      institutionId: auth.payload.institutionId || "inst-apex-01",
      actorUserId: auth.payload.userId || "coe",
      action: "EXAMINATION_MARKS_MODERATION",
      targetEntity: "Exam",
      targetId: examId,
      details: {
        moderationType,
        targetMean,
        passingMarks,
        maxGraceMarks,
        committeeSignOffBy,
        totalCandidates: records.length,
        beforeMean: moderationOutput.beforeStats.mean,
        afterMean: moderationOutput.afterStats.mean,
        beforePassRate: moderationOutput.beforeStats.passRatePercent,
        afterPassRate: moderationOutput.afterStats.passRatePercent,
      },
    });

    logger.info("Examination marks moderation applied successfully", {
      examId,
      moderationType,
      committeeSignOffBy,
      totalCandidates: records.length,
    });

    return NextResponse.json({
      success: true,
      message: `Examination moderation applied successfully: ${records.length} candidate marks adjusted under ${moderationType} protocol.`,
      examId,
      moderationType,
      committeeSignOffBy,
      totalCandidates: records.length,
      beforeStats: moderationOutput.beforeStats,
      afterStats: moderationOutput.afterStats,
      results: moderationOutput.results,
    });
  } catch (error: any) {
    logger.error("Failed to apply examination moderation", error);
    return NextResponse.json(
      { error: error.message || "Failed to apply examination moderation" },
      { status: 500 }
    );
  }
}
