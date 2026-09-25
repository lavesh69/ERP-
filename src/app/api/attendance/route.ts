import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const courseCodeParam = searchParams.get("courseCode");

    // -------------------------------------------------------------------------
    // 1. STUDENT PERSPECTIVE: Self-Service Attendance Dashboard
    // -------------------------------------------------------------------------
    if (session?.role === "STUDENT") {
      let student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: {
          user: true,
          program: true,
          enrollments: {
            include: { course: true },
          },
        },
      });

      if (!student) {
        student = await prisma.student.findFirst({
          include: { user: true, program: true, enrollments: { include: { course: true } } },
        });
      }

      if (!student) {
        return NextResponse.json({ error: "Student record not found" }, { status: 404 });
      }

      // Fetch all attendance records for this student
      const records = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id },
        include: {
          session: {
            include: { course: true },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      // Subject-wise grouping
      const subjectMap: Record<
        string,
        {
          courseCode: string;
          courseTitle: string;
          total: number;
          present: number;
          absent: number;
          late: number;
          excused: number;
        }
      > = {};

      // Seed subjects from enrolled courses
      student.enrollments.forEach((enr) => {
        subjectMap[enr.course.code] = {
          courseCode: enr.course.code,
          courseTitle: enr.course.title,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      });

      records.forEach((rec) => {
        const cCode = rec.session.course.code;
        if (!subjectMap[cCode]) {
          subjectMap[cCode] = {
            courseCode: cCode,
            courseTitle: rec.session.course.title,
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          };
        }
        subjectMap[cCode].total += 1;
        if (rec.status === "PRESENT") subjectMap[cCode].present += 1;
        else if (rec.status === "LATE") subjectMap[cCode].late += 1;
        else if (rec.status === "ABSENT") subjectMap[cCode].absent += 1;
        else if (rec.status === "EXCUSED") subjectMap[cCode].excused += 1;
      });

      const subjectBreakdown = Object.values(subjectMap).map((s) => {
        const attended = s.present + s.late + s.excused;
        const percentage = s.total > 0 ? Number(((attended / s.total) * 100).toFixed(1)) : 100.0;
        return {
          ...s,
          percentage,
          isDefaulter: percentage < 75.0,
        };
      });

      return NextResponse.json({
        perspective: "STUDENT",
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
          attendanceRate: student.attendanceRate || 92.0,
        },
        overallRate: student.attendanceRate || 92.0,
        subjectBreakdown,
        recentRecords: records.slice(0, 30).map((r) => ({
          id: r.id,
          courseCode: r.session.course.code,
          courseTitle: r.session.course.title,
          date: r.session.date.toISOString().split("T")[0],
          status: r.status,
          method: r.session.method,
        })),
      });
    }

    // -------------------------------------------------------------------------
    // 2. TEACHER / ADMIN PERSPECTIVE: Class Roster & Roll Marking
    // -------------------------------------------------------------------------
    // Determine available courses for the caller
    let availableCourses: any[] = [];
    if (session && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(session.role)) {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { courses: { include: { course: true } } },
      });

      if (faculty && faculty.courses.length > 0) {
        availableCourses = faculty.courses.map((cf) => cf.course);
      }
    }

    if (availableCourses.length === 0) {
      availableCourses = await prisma.course.findMany({
        where: { isActive: true },
        take: 10,
      });
    }

    const targetCourseCode = courseCodeParam || availableCourses[0]?.code || "CS-402";

    const course = await prisma.course.findFirst({
      where: { code: targetCourseCode },
      include: {
        enrollments: {
          include: {
            student: {
              include: { user: true, section: true },
            },
          },
        },
        attendanceSessions: {
          orderBy: { date: "desc" },
          take: 5,
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
      section: enr.student.section?.name || "Section A",
      aggregate: enr.student.attendanceRate || 92.0,
      status: "PRESENT",
    }));

    return NextResponse.json({
      perspective: "FACULTY",
      availableCourses: availableCourses.map((c) => ({
        id: c.id,
        code: c.code,
        title: c.title,
      })),
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
      },
      roster,
      pastSessionsCount: course.attendanceSessions.length,
      recentSessions: course.attendanceSessions.map((s) => ({
        id: s.id,
        date: s.date.toISOString().split("T")[0],
        status: s.status,
        method: s.method,
      })),
    });
  } catch (error) {
    console.error("Attendance GET API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance records" },
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
    const { courseCode, date, records, lectureTime, sectionName } = body;

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

    const sessionDate = date ? new Date(date) : new Date();

    // Prevent duplicate attendance session on the same calendar day for the same course
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        courseId: course.id,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    let session = null;
    if (existingSession) {
      // Overwrite/update existing session records
      await prisma.attendanceRecord.deleteMany({
        where: { sessionId: existingSession.id },
      });

      await prisma.attendanceRecord.createMany({
        data: records.map((r: { studentId: string; status: string }) => ({
          sessionId: existingSession.id,
          studentId: r.studentId,
          status: r.status || "PRESENT",
        })),
      });

      session = existingSession;
    } else {
      // Create fresh session
      session = await prisma.attendanceSession.create({
        data: {
          courseId: course.id,
          facultyId,
          sectionId: section.id,
          date: sessionDate,
          startTime: lectureTime || "09:00",
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
      });
    }

    // Automatically recalculate and update aggregate attendance rate on each student record
    for (const r of records) {
      const allStudentRecords = await prisma.attendanceRecord.findMany({
        where: { studentId: r.studentId },
      });
      const presentCount = allStudentRecords.filter(
        (rec) => rec.status === "PRESENT" || rec.status === "LATE" || rec.status === "EXCUSED"
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
      date: sessionDate.toISOString().split("T")[0],
      recordsCount: records.length,
      actor: auth.payload.email,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance synchronized for ${records.length} students.`,
      sessionId: session.id,
      recordedCount: records.length,
    });
  } catch (error: any) {
    logger.error("Attendance POST API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist attendance" },
      { status: 500 }
    );
  }
}
