import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateLetterAndGradePoints, calculateCumulativeCGPA } from "@/lib/grading/gpa-engine";
import { getOptionalSession, requireRoleAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

import { UserRole } from "@/types/auth";

const EXAM_EDIT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "EXAMINATION_CONTROLLER",
  "FACULTY",
  "HOD",
  "PRINCIPAL",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";

    const exams = await prisma.exam.findMany({
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: { include: { user: true } },
              },
            },
          },
        },
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
      // If caller is student, strictly return only published results for their own record
      let visibleResults: any[] = [];
      if (isStudent) {
        visibleResults = e.results
          .filter(
            (r) =>
              (r.student.userId === session?.userId ||
                r.student.user.email === session?.email) &&
              r.isVerified &&
              r.publishedAt !== null
          )
          .map((r) => ({
            id: r.id,
            studentId: r.studentId,
            studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
            marksObtained: r.marksObtained,
            gradeLetter: r.gradeLetter,
            remarks: r.remarks,
            isPublished: true,
          }));
      } else {
        // Teacher / Admin: view all student results (both drafts and published)
        visibleResults = e.results.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
          marksObtained: r.marksObtained,
          gradeLetter: r.gradeLetter,
          remarks: r.remarks,
          isVerified: r.isVerified,
          isPublished: r.publishedAt !== null,
        }));
      }

      // Enrolled class roster for marks entry (Faculty view)
      const classRoster = isStudent
        ? []
        : e.course.enrollments.map((enr) => {
            const existingResult = e.results.find((r) => r.studentId === enr.student.id);
            return {
              studentId: enr.student.id,
              name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
              rollNumber: enr.student.rollNumber,
              currentMarks: existingResult ? existingResult.marksObtained : null,
              gradeLetter: existingResult ? existingResult.gradeLetter : null,
              isPublished: existingResult ? existingResult.publishedAt !== null : false,
            };
          });

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
        questions: e.questions.map((q) => ({
          id: q.id,
          text: q.questionText,
          type: q.type,
          marks: q.marks,
          difficulty: q.difficulty,
          bloomTaxonomy: q.bloomTaxonomy,
        })),
        results: visibleResults,
        classRoster,
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
    const { title, courseCode, type, totalMarks, weightage, examDate, durationMins, questions } = body;

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
        questions: Array.isArray(questions) && questions.length > 0
          ? {
              create: questions.map((q: any) => ({
                questionText: q.questionText || "Question item",
                type: q.type || "SHORT",
                marks: Number(q.marks) || 10,
                difficulty: q.difficulty || "MEDIUM",
                bloomTaxonomy: q.bloomTaxonomy || "APPLY",
              })),
            }
          : undefined,
      },
      include: { questions: true },
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
    const { examId, studentId, marksObtained, batchEntries, publish } = body;

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // 1. Batch Marks Submission (Roster Grading)
    if (Array.isArray(batchEntries) && batchEntries.length > 0) {
      const updatedResults = [];
      for (const entry of batchEntries) {
        if (!entry.studentId || entry.marksObtained === undefined || entry.marksObtained === "") continue;

        const percentage = (Number(entry.marksObtained) / exam.totalMarks) * 100;
        const { letter } = calculateLetterAndGradePoints(percentage);

        const res = await prisma.examResult.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: Number(entry.marksObtained),
            gradeLetter: letter,
            remarks: entry.remarks || "Evaluated by course faculty",
            isVerified: publish === true,
            publishedAt: publish === true ? new Date() : null,
            verifiedById: auth.payload.userId || auth.payload.sub,
          },
          create: {
            examId,
            studentId: entry.studentId,
            marksObtained: Number(entry.marksObtained),
            gradeLetter: letter,
            remarks: entry.remarks || "Evaluated by course faculty",
            isVerified: publish === true,
            publishedAt: publish === true ? new Date() : null,
            verifiedById: auth.payload.userId || auth.payload.sub,
          },
        });
        updatedResults.push(res);
      }

      if (publish === true) {
        await prisma.exam.update({
          where: { id: examId },
          data: { status: "PUBLISHED" },
        });
      }

      return NextResponse.json({
        success: true,
        message: publish
          ? `Evaluated & officially published marks for ${updatedResults.length} students.`
          : `Draft evaluation saved for ${updatedResults.length} students.`,
        updatedCount: updatedResults.length,
      });
    }

    // 2. Single Student Marks Submission
    if (!studentId || marksObtained === undefined) {
      return NextResponse.json(
        { error: "studentId and marksObtained or batchEntries are required" },
        { status: 400 }
      );
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
        isVerified: publish === true,
        publishedAt: publish === true ? new Date() : null,
      },
      create: {
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        gradeLetter: letter,
        isVerified: publish === true,
        publishedAt: publish === true ? new Date() : null,
      },
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
