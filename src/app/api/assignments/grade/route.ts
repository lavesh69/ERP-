import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { submissionId, gradePoints, feedback, rubricScores, lock } = body;

    if (!submissionId || gradePoints === undefined || gradePoints === null) {
      return NextResponse.json(
        { error: "submissionId and gradePoints are required" },
        { status: 400 }
      );
    }

    const numericPoints = Number(gradePoints);
    if (isNaN(numericPoints) || numericPoints < 0) {
      return NextResponse.json(
        { error: "gradePoints must be a non-negative number" },
        { status: 400 }
      );
    }

    const existing = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: {
              include: {
                faculty: true,
                department: true,
              },
            },
          },
        },
        student: { include: { user: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Submission record not found" },
        { status: 404 }
      );
    }

    const callerRole = auth.payload.role;
    if (callerRole === "FACULTY" || callerRole === "CLASS_TEACHER") {
      const facultyRecord = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId },
            { user: { email: auth.payload.email } },
          ],
        },
      });

      if (!facultyRecord) {
        return NextResponse.json(
          { error: "Faculty profile not found for authenticated instructor" },
          { status: 403 }
        );
      }

      const isInstructor =
        existing.assignment.facultyId === facultyRecord.id ||
        existing.assignment.course.faculty.some((cf) => cf.facultyId === facultyRecord.id);

      if (!isInstructor) {
        return NextResponse.json(
          {
            error: `Forbidden: You are not assigned to instruct or grade coursework for ${existing.assignment.course.code}.`,
          },
          { status: 403 }
        );
      }
    } else if (callerRole === "HOD") {
      const hodRecord = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId },
            { user: { email: auth.payload.email } },
          ],
        },
      });
      if (hodRecord && hodRecord.departmentId !== existing.assignment.course.departmentId) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Head of Department can only grade assignments within their own department.",
          },
          { status: 403 }
        );
      }
    }

    // Check if existing grade is locked
    const isLocked = existing.feedback?.includes("[LOCKED]");
    const isElevated = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HOD", "PRINCIPAL"].includes(auth.payload.role);
    if (isLocked && !isElevated) {
      return NextResponse.json(
        { error: "Grade record is locked. Only department HOD or administrator can override finalized grades." },
        { status: 403 }
      );
    }

    if (numericPoints > existing.assignment.maxPoints) {
      return NextResponse.json(
        {
          error: `gradePoints (${numericPoints}) cannot exceed maxPoints (${existing.assignment.maxPoints})`,
        },
        { status: 400 }
      );
    }

    let finalFeedback = feedback || "Evaluated by faculty.";
    if (rubricScores && Array.isArray(rubricScores)) {
      finalFeedback += `\n[RUBRIC]: ${JSON.stringify(rubricScores)}`;
    }
    if (lock) {
      finalFeedback += "\n[LOCKED]";
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        gradePoints: numericPoints,
        feedback: finalFeedback,
        gradedAt: new Date(),
        gradedById: auth.payload.userId,
      },
    });

    await logAuditEvent({
      actorUserId: auth.payload.userId || auth.payload.sub || "faculty",
      action: "GRADE_MODIFIED",
      targetEntity: "Submission",
      targetId: updated.id,
      details: {
        gradePoints: numericPoints,
        rubricScores,
        locked: !!lock,
        studentId: existing.studentId,
      },
    });

    logger.info("Submission graded", {
      submissionId,
      studentName: `${existing.student.user.firstName} ${existing.student.user.lastName}`,
      gradePoints: numericPoints,
      maxPoints: existing.assignment.maxPoints,
      gradedBy: auth.payload.email,
      locked: !!lock,
    });

    return NextResponse.json({
      success: true,
      message: `Score ${numericPoints}/${existing.assignment.maxPoints} saved successfully${lock ? " and grade locked" : ""}`,
      submission: {
        id: updated.id,
        gradePoints: updated.gradePoints,
        feedback: updated.feedback,
        gradedAt: updated.gradedAt,
        isLocked: !!lock || updated.feedback?.includes("[LOCKED]"),
        rubricScores: rubricScores || null,
      },
    });
  } catch (error: any) {
    logger.error("Submission grading error", error);
    return NextResponse.json(
      { error: error.message || "Failed to grade submission" },
      { status: 500 }
    );
  }
}
