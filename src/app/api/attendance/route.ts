import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import {
  calculateAttendancePercentage,
  isDefaulter,
  calculateClassesNeededToRecover,
  calculateSafeAbsencesAllowed,
  SENATE_EXAM_THRESHOLD,
} from "@/lib/attendance/calculator";

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
        const percentage = calculateAttendancePercentage(attended, s.total);
        const defaulter = isDefaulter(percentage, SENATE_EXAM_THRESHOLD);
        const classesNeededToRecover = defaulter
          ? calculateClassesNeededToRecover(attended, s.total, SENATE_EXAM_THRESHOLD)
          : 0;
        const safeAbsencesAllowed = !defaulter
          ? calculateSafeAbsencesAllowed(attended, s.total, SENATE_EXAM_THRESHOLD)
          : 0;

        return {
          ...s,
          percentage,
          isDefaulter: defaulter,
          requiredThreshold: SENATE_EXAM_THRESHOLD,
          classesNeededToRecover,
          safeAbsencesAllowed,
        };
      });

      const allAttended = records.filter(
        (r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED"
      ).length;
      const overallRate = calculateAttendancePercentage(allAttended, records.length);
      const overallDefaulter = isDefaulter(overallRate, SENATE_EXAM_THRESHOLD);
      const overallNeeded = overallDefaulter
        ? calculateClassesNeededToRecover(allAttended, records.length, SENATE_EXAM_THRESHOLD)
        : 0;
      const overallSafe = !overallDefaulter
        ? calculateSafeAbsencesAllowed(allAttended, records.length, SENATE_EXAM_THRESHOLD)
        : 0;

      return NextResponse.json({
        perspective: "STUDENT",
        student: {
          id: student.id,
          name: `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
          attendanceRate: overallRate,
        },
        overallAttendance: {
          aggregateRate: overallRate,
          attendedLectures: allAttended,
          totalLectures: records.length,
          isDefaulter: overallDefaulter,
          requiredRate: SENATE_EXAM_THRESHOLD,
          classesNeededToRecover: overallNeeded,
          safeAbsencesAllowed: overallSafe,
        },
        overallRate,
        subjectBreakdown,
        courseWiseAttendance: subjectBreakdown.map((sb) => ({
          courseCode: sb.courseCode,
          courseTitle: sb.courseTitle,
          credits: 4,
          facultyName: "Assigned Professor",
          attendedClasses: sb.present + sb.late + sb.excused,
          totalClasses: sb.total,
          attendanceRate: sb.percentage,
          isDefaulter: sb.isDefaulter,
          classesNeededToRecover: sb.classesNeededToRecover,
          safeAbsencesAllowed: sb.safeAbsencesAllowed,
        })),
        recentRecords: records.slice(0, 30).map((r) => ({
          id: r.id,
          courseCode: r.session.course.code,
          courseTitle: r.session.course.title,
          date: r.session.date.toISOString().split("T")[0],
          status: r.status,
          method: r.session.method,
        })),
        recentSessions: records.slice(0, 30).map((r) => ({
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

    // Command Center: Today's Timetable Slots & Live Detection
    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const todayDayOfWeek = daysOfWeek[new Date().getDay()];
    const todaySlots = await prisma.timetableSlot.findMany({
      where: { dayOfWeek: todayDayOfWeek },
      include: { course: true, section: true, room: true },
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let currentLiveSlot: any = null;
    for (const slot of todaySlots) {
      const [sH, sM] = (slot.startTime || "00:00").split(":").map(Number);
      const [eH, eM] = (slot.endTime || "00:00").split(":").map(Number);
      if (currentMinutes >= sH * 60 + sM && currentMinutes <= eH * 60 + eM) {
        currentLiveSlot = {
          courseCode: slot.course.code,
          courseTitle: slot.course.title,
          sectionName: slot.section.name,
          roomName: slot.room.name,
          roomId: slot.roomId,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
        break;
      }
    }

    // Sessions metrics for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaySessions = await prisma.attendanceSession.findMany({
      where: { date: { gte: startOfToday, lte: endOfToday } },
    });

    const activeSessionsCount = await prisma.attendanceSession.count({
      where: { status: "ACTIVE" },
    });
    const completedSessionsCount = todaySessions.filter(
      (s) => s.status === "SUBMITTED" || s.status === "CLOSED" || s.status === "LOCKED"
    ).length;
    const pendingSessionsCount = Math.max(0, todaySlots.length - completedSessionsCount);

    // Selected Date Session Lookup
    const selectedDateStr = searchParams.get("date");
    const targetDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const endOfTarget = new Date(targetDate);
    endOfTarget.setHours(23, 59, 59, 999);

    const existingSessionToday = await prisma.attendanceSession.findFirst({
      where: {
        courseId: course.id,
        date: { gte: startOfTarget, lte: endOfTarget },
      },
      include: {
        records: true,
      },
    });

    // Student Roster with Risk and Last Attendance
    const roster = course.enrollments.map((enr) => {
      const existingRec = existingSessionToday?.records.find((r) => r.studentId === enr.student.id);
      const aggregate = enr.student.attendanceRate ?? 92.0;
      const risk = aggregate < 75 ? "HIGH" : aggregate < 80 ? "MEDIUM" : "LOW";

      return {
        studentId: enr.student.id,
        name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        rollNo: enr.student.rollNumber,
        section: enr.student.section?.name || "Section A",
        aggregate,
        risk,
        status: existingRec?.status || "PRESENT",
        lastAttendance: "Recent",
      };
    });

    const rates = course.enrollments.map((e) => e.student.attendanceRate ?? 92.0);
    const avgRate = rates.length > 0 ? Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1)) : 92.0;
    const studentsAtRiskCount = rates.filter((r) => r < 75).length;

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
      commandCenter: {
        todayClassesCount: todaySlots.length,
        sessionsActiveCount: activeSessionsCount,
        completedSessionsCount,
        pendingSessionsCount,
        averageAttendance: avgRate,
        studentsAtRiskCount,
        currentLiveSlot,
        todayClasses: todaySlots.map((slot) => {
          const matchingSession = todaySessions.find(
            (s) => s.courseId === slot.courseId && s.sectionId === slot.sectionId
          );
          return {
            slotId: slot.id,
            subject: slot.course.title,
            courseCode: slot.course.code,
            courseId: slot.courseId,
            section: slot.section?.name || "Section A",
            sectionId: slot.sectionId,
            room: slot.room ? `${slot.room.code} - ${slot.room.name}` : "Lecture Hall",
            roomId: slot.roomId,
            scheduledTime: `${slot.startTime} - ${slot.endTime}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            dayOfWeek: slot.dayOfWeek,
            faculty: "Assigned Faculty",
            enrolledCount: course.enrollments.length || 45,
            sessionStatus: matchingSession?.status || "NOT_STARTED",
            sessionId: matchingSession?.id || null,
            attendanceStatus: matchingSession
              ? `${matchingSession.status}`
              : "Pending",
          };
        }),
      },
      sessionExists: Boolean(existingSessionToday),
      sessionId: existingSessionToday?.id || null,
      sessionStatus: existingSessionToday?.status || null,
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
    const { courseCode, date, records, lectureTime, sectionName, sessionAction = "SAVE" } = body;

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
        enrollments: { select: { studentId: true } },
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

    // Finalization & Lock Protection (GAP-01)
    if (existingSession && (existingSession.status === "LOCKED" || existingSession.status === "FINALIZED")) {
      return NextResponse.json(
        {
          error: `Attendance session is ${existingSession.status}. Direct modifications are locked to prevent tampering. Please file an official Attendance Correction Petition.`,
          sessionId: existingSession.id,
          sessionStatus: existingSession.status,
        },
        { status: 403 }
      );
    }

    // Absence Engine: Include all enrolled students not explicitly checked
    const submittedStudentIds = new Set(records.map((r: any) => r.studentId));
    const allEnrolledIds = course.enrollments.map((e) => e.studentId);
    const allFinalRecords = [...records];

    if (sessionAction === "CLOSE" || sessionAction === "LOCK") {
      for (const enrolledId of allEnrolledIds) {
        if (!submittedStudentIds.has(enrolledId)) {
          allFinalRecords.push({
            studentId: enrolledId,
            status: "ABSENT",
            remarks: "Marked absent automatically by System Absence Engine upon session close",
          });
        }
      }
    }

    const targetSessionStatus =
      sessionAction === "LOCK" ? "LOCKED" : sessionAction === "CLOSE" ? "CLOSED" : "SUBMITTED";

    let session = null;
    if (existingSession) {
      // Overwrite/update existing session records
      await prisma.attendanceRecord.deleteMany({
        where: { sessionId: existingSession.id },
      });

      await prisma.attendanceRecord.createMany({
        data: allFinalRecords.map((r: { studentId: string; status: string; remarks?: string }) => ({
          sessionId: existingSession.id,
          studentId: r.studentId,
          status: r.status || "PRESENT",
          remarks: r.remarks || null,
          markedBy: auth.payload.email,
        })),
      });

      session = await prisma.attendanceSession.update({
        where: { id: existingSession.id },
        data: {
          status: targetSessionStatus,
          closedAt: sessionAction === "CLOSE" || sessionAction === "LOCK" ? new Date() : existingSession.closedAt,
        },
      });
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
          status: targetSessionStatus,
          closedAt: sessionAction === "CLOSE" || sessionAction === "LOCK" ? new Date() : null,
          records: {
            create: allFinalRecords.map((r: { studentId: string; status: string; remarks?: string }) => ({
              studentId: r.studentId,
              status: r.status || "PRESENT",
              remarks: r.remarks || null,
              markedBy: auth.payload.email,
            })),
          },
        },
      });
    }

    // Automatically recalculate and update aggregate attendance rate on each student record
    for (const r of allFinalRecords) {
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
      recordsCount: allFinalRecords.length,
      sessionStatus: targetSessionStatus,
      actor: auth.payload.email,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance synchronized for ${allFinalRecords.length} students. Status: ${targetSessionStatus}`,
      sessionId: session.id,
      sessionStatus: targetSessionStatus,
      recordedCount: allFinalRecords.length,
    });
  } catch (error: any) {
    logger.error("Attendance POST API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist attendance" },
      { status: 500 }
    );
  }
}
