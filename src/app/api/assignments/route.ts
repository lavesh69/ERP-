import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";

    const assignments = await prisma.assignment.findMany({
      include: {
        course: true,
        faculty: { include: { user: true } },
        submissions: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const formatted = assignments.map((a) => {
      // If caller is student, strictly return only their own submission
      const visibleSubmissions = isStudent
        ? a.submissions.filter(
            (sub) =>
              sub.student.userId === session?.userId ||
              sub.student.user.email === session?.email
          )
        : a.submissions;

      return {
        id: a.id,
        title: a.title,
        description: a.description,
        courseCode: a.course.code,
        courseTitle: a.course.title,
        facultyName: `${a.faculty.user.firstName} ${a.faculty.user.lastName}`,
        dueDate: a.dueDate.toISOString().split("T")[0],
        maxPoints: a.maxPoints,
        submissionCount: a.submissions.length,
        submissions: visibleSubmissions.map((sub) => ({
          id: sub.id,
          studentName: `${sub.student.user.firstName} ${sub.student.user.lastName}`,
          submittedAt: sub.submittedAt,
          gradePoints: sub.gradePoints,
          feedback: sub.feedback,
        })),
      };
    });

    return NextResponse.json({ assignments: formatted });
  } catch (error) {
    logger.error("Assignments GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Faculty, Leadership, or Admin only
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, description, courseCode, dueDate, maxPoints } = body;

    if (!title || !description || !courseCode) {
      return NextResponse.json(
        { error: "Title, description, and courseCode are required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: { code: courseCode },
      include: { faculty: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const facultyId = course.faculty[0]?.facultyId;
    if (!facultyId) {
      return NextResponse.json({ error: "No faculty assigned" }, { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        facultyId,
        title,
        description,
        maxPoints: Number(maxPoints) || 100,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info("Assignment created", {
      courseCode,
      title,
      assignmentId: assignment.id,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: any) {
    logger.error("Assignments POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to create assignment" },
      { status: 500 }
    );
  }
}
