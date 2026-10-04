import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: session.userId },
          { user: { email: session.email } },
        ],
      },
      include: {
        program: {
          include: {
            department: {
              include: {
                courses: true,
              },
            },
          },
        },
        enrollments: {
          include: { course: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const enrolledCourseIds = new Set(student.enrollments.map((e) => e.courseId));

    const allCourses = await prisma.course.findMany({
      where: {
        department: { campus: { institutionId: session.institutionId } },
      },
      include: { department: true },
    });

    const categorized = allCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      credits: c.credits,
      category: c.departmentId === student.program.departmentId ? "PROGRAM_CORE" : "OPEN_ELECTIVE",
      department: c.department.name,
      isEnrolled: enrolledCourseIds.has(c.id),
    }));

    const currentCredits = student.enrollments.reduce((acc, e) => acc + e.course.credits, 0);

    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        rollNumber: student.rollNumber,
        semester: student.currentSemester,
        program: student.program.name,
        currentCredits,
        maxCreditLimit: 26,
      },
      availableCourses: categorized,
    });
  } catch (error: any) {
    logger.error("Student registration GET error", error);
    return NextResponse.json({ error: "Failed to fetch registration catalogue" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { courseIds } = body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: "courseIds array is required" }, { status: 400 });
    }

    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: session.userId },
          { user: { email: session.email } },
        ],
      },
      include: {
        enrollments: { include: { course: true } },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    const requestedCourses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
    });

    const newCredits = requestedCourses.reduce((sum, c) => sum + c.credits, 0);
    const existingCredits = student.enrollments.reduce((sum, e) => sum + e.course.credits, 0);

    if (existingCredits + newCredits > 28) {
      return NextResponse.json(
        { error: `Credit ceiling breach: Maximum allowed is 28 credits. Selected total: ${existingCredits + newCredits}` },
        { status: 400 }
      );
    }

    const enrollmentsCreated: any[] = [];
    for (const c of requestedCourses) {
      const existing = student.enrollments.find((e) => e.courseId === c.id);
      if (!existing) {
        const enr = await prisma.enrollment.create({
          data: {
            studentId: student.id,
            courseId: c.id,
            status: "ACTIVE",
          },
        });
        enrollmentsCreated.push(enr);
      }
    }

    await logAuditEvent({
      institutionId: session.institutionId || "global",
      actorUserId: session.userId,
      action: "COURSE_REGISTRATION_COMPLETED",
      targetEntity: "Enrollment",
      details: {
        rollNumber: student.rollNumber,
        registeredCount: enrollmentsCreated.length,
        totalCredits: existingCredits + newCredits,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully registered for ${enrollmentsCreated.length} course(s).`,
      enrolledCount: enrollmentsCreated.length,
      totalCredits: existingCredits + newCredits,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Student registration POST error", error);
    return NextResponse.json({ error: "Failed to process course registration" }, { status: 500 });
  }
}
