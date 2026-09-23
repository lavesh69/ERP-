import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode") || "CS-402";

    const course = await prisma.course.findFirst({
      where: { code: courseCode },
      include: {
        enrollments: {
          include: {
            student: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const roster = course.enrollments.map((enr) => ({
      studentId: enr.student.id,
      name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
      rollNo: enr.student.rollNumber,
      aggregate: enr.student.attendanceRate || 92.0,
      status: "PRESENT",
    }));

    return NextResponse.json({
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
      },
      roster,
    });
  } catch (error) {
    console.error("Attendance GET API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance roster" },
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
    const { courseCode, date, records } = body;

    if (!courseCode || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "courseCode and records array are required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: { code: courseCode },
      include: {
        faculty: true,
        department: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const facultyId = course.faculty[0]?.facultyId;
    if (!facultyId) {
      return NextResponse.json({ error: "No faculty assigned to course" }, { status: 400 });
    }

    const section = await prisma.section.findFirst();
    if (!section) {
      return NextResponse.json({ error: "No academic section found" }, { status: 400 });
    }

    // Create attendance session
    const session = await prisma.attendanceSession.create({
      data: {
        courseId: course.id,
        facultyId,
        sectionId: section.id,
        date: date ? new Date(date) : new Date(),
        startTime: "09:00",
        endTime: "10:30",
        method: "MANUAL",
        status: "SUBMITTED",
        records: {
          create: records.map((r: { studentId: string; status: string }) => ({
            studentId: r.studentId,
            status: r.status || "PRESENT",
          })),
        },
      },
      include: { records: true },
    });

    // Update aggregate attendance rate on student records
    for (const r of records) {
      const allStudentRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: r.studentId },
      });
      const presentCount = allStudentRecords.filter(
        (rec) => rec.status === "PRESENT" || rec.status === "LATE"
      ).length;
      const rate =
        allStudentRecords.length > 0
          ? Number(((presentCount / allStudentRecords.length) * 100).toFixed(1))
          : 100.0;

      await prisma.student.update({
        where: { id: r.studentId },
        data: { attendanceRate: rate },
      });
    }

    logger.info("Attendance submitted", {
      courseCode,
      sessionCount: session.records.length,
      actor: auth.payload.email,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      recordedCount: session.records.length,
    });
  } catch (error: any) {
    logger.error("Attendance POST API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist attendance" },
      { status: 500 }
    );
  }
}

