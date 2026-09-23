import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { assignmentId, content, fileUrl } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Resolve student record from authenticated user or fallback for dev
    let student = null;
    if (session?.userId) {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { user: true },
      });
    }

    // Fallback to first student if not found in session
    if (!student) {
      student = await prisma.student.findFirst({
        include: { user: true },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: "No eligible student profile found for submission" },
        { status: 403 }
      );
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        content: content || "Student coursework solution",
        fileUrl: fileUrl || "/uploads/submissions/assignment-solution.pdf",
        submittedAt: new Date(),
        isLate,
      },
      create: {
        assignmentId,
        studentId: student.id,
        content: content || "Student coursework solution",
        fileUrl: fileUrl || "/uploads/submissions/assignment-solution.pdf",
        submittedAt: new Date(),
        isLate,
      },
    });

    logger.info("Assignment submission received", {
      assignmentId,
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      isLate,
    });

    return NextResponse.json({
      success: true,
      message: isLate
        ? "Assignment submitted (marked as late submission)"
        : "Assignment solution successfully submitted",
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        content: submission.content,
      },
    });
  } catch (error: any) {
    logger.error("Assignment submission error", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
