import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateLetterAndGradePoints } from "@/lib/grading/gpa-engine";
import { getOptionalSession, requireRoleAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

const EXAM_EDIT_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "EXAMINATION_CONTROLLER",
  "FACULTY",
  "HOD",
] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";

    const exams = await prisma.exam.findMany({
      include: {
        course: true,
        questions: true,
        results: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { examDate: "asc" },
    });

    const formatted = exams.map((e) => {
      // If caller is student, strictly return only their own result
      const visibleResults = isStudent
        ? e.results.filter(
            (r) =>
              r.student.userId === session?.userId ||
              r.student.user.email === session?.email
          )
        : e.results;

      return {
        id: e.id,
        title: e.title,
        type: e.type,
        courseCode: e.course.code,
        courseTitle: e.course.title,
        totalMarks: e.totalMarks,
        weightage: e.weightage,
        examDate: e.examDate.toISOString().split("T")[0],
        durationMins: e.durationMins,
        status: e.status,
        questionCount: e.questions.length,
        results: visibleResults.map((r) => ({
          id: r.id,
          studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
          marksObtained: r.marksObtained,
          gradeLetter: r.gradeLetter,
        })),
      };
    });

    return NextResponse.json({ exams: formatted });
  } catch (error) {
    logger.error("Examinations GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch examinations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Exam Controller, Faculty, or Admin only
  const auth = await requireRoleAuth(req, [...EXAM_EDIT_ROLES]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, courseCode, type, totalMarks, weightage, examDate, durationMins } = body;

    if (!title || !courseCode) {
      return NextResponse.json(
        { error: "Title and courseCode are required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: { code: courseCode },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const exam = await prisma.exam.create({
      data: {
        courseId: course.id,
        title,
        type: type || "MID_TERM",
        totalMarks: Number(totalMarks) || 100,
        weightage: Number(weightage) || 30,
        examDate: examDate ? new Date(examDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        durationMins: Number(durationMins) || 120,
        status: "SCHEDULED",
      },
    });

    logger.info("Exam scheduled", {
      courseCode,
      title,
      examId: exam.id,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error: any) {
    logger.error("Examinations POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule exam" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Exam Controller, Faculty, or Admin only
  const auth = await requireRoleAuth(req, [...EXAM_EDIT_ROLES]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { examId, studentId, marksObtained } = body;

    if (!examId || !studentId || marksObtained === undefined) {
      return NextResponse.json(
        { error: "examId, studentId, and marksObtained are required" },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const percentage = (Number(marksObtained) / exam.totalMarks) * 100;
    const { letter } = calculateLetterAndGradePoints(percentage);

    const result = await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId,
          studentId,
        },
      },
      update: {
        marksObtained: Number(marksObtained),
        gradeLetter: letter,
        isVerified: true,
      },
      create: {
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        gradeLetter: letter,
        isVerified: true,
      },
    });

    logger.info("Exam marks updated", {
      examId,
      studentId,
      marksObtained,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error("Examinations PUT Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to record exam marks" },
      { status: 500 }
    );
  }
}
