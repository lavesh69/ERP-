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
import { ensureAcademicMasterData } from "@/lib/academic/master-data";
import { getAttendanceExceptions } from "@/lib/attendance/exceptions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const courseCodeParam = searchParams.get("courseCode");
    const courseIdParam = searchParams.get("courseId");
    const sectionIdParam = searchParams.get("sectionId");
    const semesterFilterParam = searchParams.get("semester");

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
          section: true,
          enrollments: {
            include: {
              course: {
                include: {
                  department: true,
                  semester: {
                    include: { program: true },
                  },
                  faculty: {
                    include: {
                      faculty: {
                        include: { user: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!student) {
        student = await prisma.student.findFirst({
          include: {
            user: true,
            program: true,
            section: true,
            enrollments: {
              include: {
                course: {
                  include: {
                    department: true,
                    semester: {
                      include: { program: true },
                    },
                    faculty: {
                      include: {
                        faculty: {
                          include: { user: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
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
            include: {
              course: {
                include: {
                  department: true,
                  semester: true,
                },
              },
            },
          },
        },
        orderBy: { timestamp: "desc" },
      });

      // Subject-wise grouping
      const subjectMap: Record<
        string,
        {
          courseId: string;
          courseCode: string;
          courseTitle: string;
          shortName: string;
          subjectType: string;
          courseType: string;
          credits: number;
          facultyName: string;
          semesterNumber: number;
          total: number;
          present: number;
          absent: number;
          late: number;
          excused: number;
        }
      > = {};

      // Seed subjects strictly from student's active course enrollments
      student.enrollments.forEach((enr) => {
        const c = enr.course;
        const facName = c.faculty[0]?.faculty?.user
          ? `Prof. ${c.faculty[0].faculty.user.firstName} ${c.faculty[0].faculty.user.lastName}`
          : "Assigned Faculty";

        subjectMap[c.code] = {
          courseId: c.id,
          courseCode: c.code,
          courseTitle: c.title,
          shortName: c.shortName || c.title,
          subjectType: c.subjectType || "CORE",
          courseType: c.courseType || "THEORY",
          credits: c.credits || 4,
          facultyName: facName,
          semesterNumber: c.semester?.semesterNumber || student?.currentSemester || 1,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        };
      });

      // Aggregate attendance records
      records.forEach((rec) => {
        const cCode = rec.session.course.code;
        if (!subjectMap[cCode]) {
          const c = rec.session.course;
          subjectMap[cCode] = {
            courseId: c.id,
            courseCode: cCode,
            courseTitle: c.title,
            shortName: c.shortName || c.title,
            subjectType: c.subjectType || "CORE",
            courseType: c.courseType || "THEORY",
            credits: c.credits || 4,
            facultyName: "Assigned Faculty",
            semesterNumber: c.semester?.semesterNumber || 1,
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

      let subjectBreakdown = Object.values(subjectMap).map((s) => {
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

      // Filter by semester if requested
      if (semesterFilterParam) {
        const semNum = Number(semesterFilterParam);
        subjectBreakdown = subjectBreakdown.filter((s) => s.semesterNumber === semNum);
      }

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
          program: student.program.name,
          degree: student.program.degree,
          section: student.section?.name || "Section A",
          semester: student.currentSemester,
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
          courseId: sb.courseId,
          courseCode: sb.courseCode,
          courseTitle: sb.courseTitle,
          shortName: sb.shortName,
          subjectType: sb.subjectType,
          courseType: sb.courseType,
          credits: sb.credits,
          facultyName: sb.facultyName,
          semesterNumber: sb.semesterNumber,
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
          verificationMethod: r.verificationMethod,
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
    let availableCourses: any[] = [];
    const callerRole = session?.role;

    if (session && ["FACULTY", "PROFESSOR", "CLASS_TEACHER"].includes(callerRole || "")) {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: {
          courses: {
            include: {
              course: {
                include: {
                  department: true,
                  semester: {
                    include: {
                      program: true,
                      sections: true,
                    },
                  },
                },
              },
            },
          },
          timetables: {
            include: {
              course: {
                include: {
                  department: true,
                  semester: {
                    include: {
                      program: true,
                      sections: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (faculty) {
        const courseMap = new Map<string, any>();
        faculty.courses.forEach((cf) => {
          if (cf.course.isActive) courseMap.set(cf.course.id, cf.course);
        });
        faculty.timetables.forEach((ts) => {
          if (ts.course.isActive) courseMap.set(ts.course.id, ts.course);
        });

        if (courseMap.size > 0) {
          availableCourses = Array.from(courseMap.values());
        } else {
          // If newly hired faculty without assignments yet, offer active courses in their department
          availableCourses = await prisma.course.findMany({
            where: { departmentId: faculty.departmentId, isActive: true },
            include: {
              department: true,
              semester: {
                include: { program: true, sections: true },
              },
            },
          });
        }
      }
    } else if (session?.role === "HOD") {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
      });
      if (faculty) {
        availableCourses = await prisma.course.findMany({
          where: { departmentId: faculty.departmentId, isActive: true },
          include: {
            department: true,
            semester: {
              include: { program: true, sections: true },
            },
          },
        });
      }
    } else {
      // SUPER_ADMIN, INSTITUTION_ADMIN, PRINCIPAL, or Sandbox
      availableCourses = await prisma.course.findMany({
        where: { isActive: true },
        include: {
          department: true,
          semester: {
            include: { program: true, sections: true },
          },
        },
        orderBy: [{ code: "asc" }],
      });
    }

    // Master data self-healing fallback
    if (availableCourses.length === 0) {
      await ensureAcademicMasterData();
      availableCourses = await prisma.course.findMany({
        where: { isActive: true },
        include: {
          department: true,
          semester: {
            include: { program: true, sections: true },
          },
        },
      });
    }

    // Resolve target course
    let course = null;
    if (courseIdParam) {
      course = await prisma.course.findUnique({
        where: { id: courseIdParam },
        include: {
          department: true,
          faculty: { include: { faculty: { include: { user: true } } } },
          semester: {
            include: { program: true, sections: true },
          },
          enrollments: {
            include: {
              student: {
                include: { user: true, section: true },
              },
            },
          },
          attendanceSessions: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });
    }

    if (!course && courseCodeParam) {
      course = await prisma.course.findFirst({
        where: { code: courseCodeParam },
        include: {
          department: true,
          faculty: { include: { faculty: { include: { user: true } } } },
          semester: {
            include: { program: true, sections: true },
          },
          enrollments: {
            include: {
              student: {
                include: { user: true, section: true },
              },
            },
          },
          attendanceSessions: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });
    }

    if (!course && availableCourses.length > 0) {
      const fallbackCode = availableCourses[0].code;
      course = await prisma.course.findFirst({
        where: { code: fallbackCode },
        include: {
          department: true,
          faculty: { include: { faculty: { include: { user: true } } } },
          semester: {
            include: { program: true, sections: true },
          },
          enrollments: {
            include: {
              student: {
                include: { user: true, section: true },
              },
            },
          },
          attendanceSessions: {
            orderBy: { date: "desc" },
            take: 10,
          },
        },
      });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Resolve target section
    const availableSections = course.semester?.sections || [];
    let targetSection = null;
    if (sectionIdParam) {
      targetSection = availableSections.find((s: any) => s.id === sectionIdParam);
      if (!targetSection) {
        targetSection = await prisma.section.findUnique({ where: { id: sectionIdParam } });
      }
    }
    if (!targetSection && availableSections.length > 0) {
      targetSection = availableSections[0];
    }

    // Filter roster by section if applicable (strict multi-section isolation)
    let enrollmentsToUse = course.enrollments;
    if (targetSection) {
      enrollmentsToUse = course.enrollments.filter(
        (e) => e.student.sectionId === targetSection.id
      );
    }

    // Command Center: Today's Timetable Slots & Live Detection
    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const todayDayOfWeek = daysOfWeek[new Date().getDay()];
    const todaySlots = await prisma.timetableSlot.findMany({
      where: { dayOfWeek: todayDayOfWeek },
      include: {
        course: { include: { semester: { include: { program: true } } } },
        section: true,
        room: true,
        faculty: { include: { user: true } },
      },
    });

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let currentLiveSlot: any = null;
    for (const slot of todaySlots) {
      const [sH, sM] = (slot.startTime || "00:00").split(":").map(Number);
      const [eH, eM] = (slot.endTime || "00:00").split(":").map(Number);
      if (currentMinutes >= sH * 60 + sM && currentMinutes <= eH * 60 + eM) {
        currentLiveSlot = {
          courseId: slot.courseId,
          courseCode: slot.course.code,
          courseTitle: slot.course.title,
          sectionId: slot.sectionId,
          sectionName: slot.section?.name || "Section A",
          roomName: slot.room?.name || "Lecture Hall",
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
      (s) => s.status === "SUBMITTED" || s.status === "CLOSED" || s.status === "LOCKED" || s.status === "FINALIZED"
    ).length;
    const pendingSessionsCount = Math.max(0, todaySlots.length - completedSessionsCount);

    // Selected Date Session Lookup (Section-Specific)
    const selectedDateStr = searchParams.get("date");
    const targetDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
    const startOfTarget = new Date(targetDate);
    startOfTarget.setHours(0, 0, 0, 0);
    const endOfTarget = new Date(targetDate);
    endOfTarget.setHours(23, 59, 59, 999);

    const sessionQueryWhere: any = {
      courseId: course.id,
      date: { gte: startOfTarget, lte: endOfTarget },
    };
    if (targetSection) {
      sessionQueryWhere.sectionId = targetSection.id;
    }

    const existingSessionToday = await prisma.attendanceSession.findFirst({
      where: sessionQueryWhere,
      include: {
        records: true,
      },
    });

    // Student Roster with Risk and Last Attendance
    const roster = enrollmentsToUse.map((enr) => {
      const existingRec = existingSessionToday?.records.find((r) => r.studentId === enr.student.id);
      const aggregate = enr.student.attendanceRate ?? 92.0;
      const risk = aggregate < 75 ? "HIGH" : aggregate < 80 ? "MEDIUM" : "LOW";

      return {
        studentId: enr.student.id,
        name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        rollNo: enr.student.rollNumber,
        section: enr.student.section?.name || targetSection?.name || "Section A",
        sectionId: enr.student.sectionId || targetSection?.id || null,
        aggregate,
        risk,
        status: existingRec?.status || "PRESENT",
        lastAttendance: "Recent",
      };
    });

    const rates = enrollmentsToUse.map((e) => e.student.attendanceRate ?? 92.0);
    const avgRate = rates.length > 0 ? Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1)) : 92.0;
    const studentsAtRiskCount = rates.filter((r) => r < 75).length;

    // Fetch pending correction requests for teacher
    const pendingCorrections = await prisma.studentRequest.findMany({
      where: {
        type: "ATTENDANCE_CORRECTION",
        status: "PENDING",
      },
      include: {
        student: {
          include: { user: true, section: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const formattedAvailableCourses = availableCourses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      shortName: c.shortName || c.title,
      subjectType: c.subjectType || "CORE",
      courseType: c.courseType || "THEORY",
      credits: c.credits || 4,
      program: c.semester?.program
        ? {
            id: c.semester.program.id,
            code: c.semester.program.code,
            name: c.semester.program.name,
            degree: c.semester.program.degree,
          }
        : null,
      semester: c.semester
        ? {
            id: c.semester.id,
            number: c.semester.semesterNumber,
            title: c.semester.title,
          }
        : null,
      sections:
        c.semester?.sections?.map((s: any) => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity,
        })) || [],
    }));

    return NextResponse.json({
      perspective: "FACULTY",
      availableCourses: formattedAvailableCourses,
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        shortName: course.shortName || course.title,
        subjectType: course.subjectType || "CORE",
        courseType: course.courseType || "THEORY",
        credits: course.credits || 4,
        program: course.semester?.program || null,
        semester: course.semester
          ? {
              id: course.semester.id,
              number: course.semester.semesterNumber,
              title: course.semester.title,
            }
          : null,
        sections: availableSections,
        selectedSection: targetSection
          ? {
              id: targetSection.id,
              name: targetSection.name,
            }
          : null,
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
            program: slot.course.semester?.program?.name || "Academic Program",
            room: slot.room ? `${slot.room.code} - ${slot.room.name}` : "Lecture Hall",
            roomId: slot.roomId,
            scheduledTime: `${slot.startTime} - ${slot.endTime}`,
            startTime: slot.startTime,
            endTime: slot.endTime,
            dayOfWeek: slot.dayOfWeek,
            faculty: slot.faculty?.user
              ? `${slot.faculty.user.firstName} ${slot.faculty.user.lastName}`
              : "Assigned Faculty",
            enrolledCount: enrollmentsToUse.length || 45,
            sessionStatus: matchingSession?.status || "NOT_STARTED",
            sessionId: matchingSession?.id || null,
            attendanceStatus: matchingSession ? `${matchingSession.status}` : "Pending",
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
      pendingCorrections: pendingCorrections.map((p) => ({
        id: p.id,
        studentName: `${p.student.user.firstName} ${p.student.user.lastName}`,
        rollNo: p.student.rollNumber,
        section: p.student.section?.name || "Section A",
        subject: p.title,
        reason: p.reason,
        status: p.status,
        date: p.createdAt.toISOString().split("T")[0],
      })),
      governance: {
        totalInstitutions: await prisma.institution.count(),
        totalCampuses: await prisma.campus.count(),
        totalDepartments: await prisma.department.count(),
        totalPrograms: await prisma.program.count(),
        totalSections: await prisma.section.count(),
        totalFaculty: await prisma.faculty.count(),
        totalStudents: await prisma.student.count(),
        recentExceptions: getAttendanceExceptions({ limit: 8 }),
      },
    });
  } catch (error) {
    logger.error("Attendance GET API Error:", error);
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
    const {
      courseCode,
      courseId,
      sectionId,
      sectionName,
      date,
      records,
      lectureTime,
      sessionAction = "SAVE",
    } = body;

    if ((!courseCode && !courseId) || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "courseCode (or courseId) and records array are required" },
        { status: 400 }
      );
    }

    // Resolve course
    let course = null;
    if (courseId) {
      course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          faculty: { include: { faculty: true } },
          department: true,
          semester: { include: { sections: true } },
          enrollments: { select: { studentId: true, student: { select: { sectionId: true } } } },
        },
      });
    }

    if (!course && courseCode) {
      course = await prisma.course.findFirst({
        where: { code: courseCode },
        include: {
          faculty: { include: { faculty: true } },
          department: true,
          semester: { include: { sections: true } },
          enrollments: { select: { studentId: true, student: { select: { sectionId: true } } } },
        },
      });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Teacher Authorization Validation (Section 7 of Master Specification)
    const callerRole = auth.payload.role;
    let facultyId: string | null = null;

    if (["FACULTY", "PROFESSOR", "CLASS_TEACHER"].includes(callerRole)) {
      const facultyRecord = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId || auth.payload.sub },
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

      facultyId = facultyRecord.id;

      // Verify that this teacher is assigned to the course or timetable or is in department
      const isAssigned = course.faculty.some((cf) => cf.facultyId === facultyRecord.id);
      const hasSlot = await prisma.timetableSlot.findFirst({
        where: { courseId: course.id, facultyId: facultyRecord.id },
      });
      const isSameDept = course.departmentId === facultyRecord.departmentId;

      if (!isAssigned && !hasSlot && !isSameDept) {
        return NextResponse.json(
          {
            error: `Authorization check failed: You are not assigned to conduct attendance for ${course.code}: ${course.title}.`,
          },
          { status: 403 }
        );
      }
    } else {
      // Leadership / HOD / Admin
      facultyId = course.faculty[0]?.facultyId || null;
      if (!facultyId) {
        const deptFaculty = await prisma.faculty.findFirst({
          where: { departmentId: course.departmentId },
        });
        facultyId = deptFaculty?.id || null;
      }
    }

    // Resolve Section
    let targetSection = null;
    if (sectionId) {
      targetSection = await prisma.section.findUnique({ where: { id: sectionId } });
    } else if (sectionName && course.semester?.sections) {
      targetSection = course.semester.sections.find((s) => s.name === sectionName);
    }

    if (!targetSection && course.semester?.sections && course.semester.sections.length > 0) {
      targetSection = course.semester.sections[0];
    }

    if (!targetSection) {
      targetSection = await prisma.section.findFirst();
    }

    if (!targetSection) {
      return NextResponse.json({ error: "No academic section found for this course" }, { status: 400 });
    }

    const sessionDate = date ? new Date(date) : new Date();

    // Prevent duplicate attendance session on the same calendar day for the same course AND section
    const startOfDay = new Date(sessionDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sessionDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSession = await prisma.attendanceSession.findFirst({
      where: {
        courseId: course.id,
        sectionId: targetSection.id,
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

    // Absence Engine: Include enrolled students of this section not explicitly checked
    const submittedStudentIds = new Set(records.map((r: any) => r.studentId));
    const sectionEnrolledIds = course.enrollments
      .filter((e) => !e.student?.sectionId || e.student.sectionId === targetSection.id)
      .map((e) => e.studentId);

    const candidateEnrolledIds =
      sectionEnrolledIds.length > 0
        ? sectionEnrolledIds
        : course.enrollments.map((e) => e.studentId);

    const allFinalRecords = [...records];

    if (sessionAction === "CLOSE" || sessionAction === "LOCK") {
      for (const enrolledId of candidateEnrolledIds) {
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
      sessionAction === "LOCK"
        ? "LOCKED"
        : sessionAction === "CLOSE"
        ? "CLOSED"
        : sessionAction === "FINALIZE"
        ? "FINALIZED"
        : "SUBMITTED";

    let session = null;
    if (existingSession) {
      // Map existing records to preserve verification flags (QR, BLE, Geofence multi-factor proofs)
      const existingRecordsMap = new Map();
      const currentRecords = await prisma.attendanceRecord.findMany({
        where: { sessionId: existingSession.id },
      });
      for (const rec of currentRecords) {
        existingRecordsMap.set(rec.studentId, rec);
      }

      // Overwrite/update existing session records
      await prisma.attendanceRecord.deleteMany({
        where: { sessionId: existingSession.id },
      });

      await prisma.attendanceRecord.createMany({
        data: allFinalRecords.map((r: { studentId: string; status: string; remarks?: string }) => {
          const prev = existingRecordsMap.get(r.studentId);
          return {
            sessionId: existingSession.id,
            studentId: r.studentId,
            status: r.status || "PRESENT",
            remarks: r.remarks || prev?.remarks || null,
            markedBy: prev?.markedBy || auth.payload.email,
            verificationMethod: prev?.verificationMethod || "MANUAL",
            qrVerified: prev?.qrVerified ?? false,
            bluetoothVerified: prev?.bluetoothVerified ?? false,
            geofenceVerified: prev?.geofenceVerified ?? false,
            distanceMeters: prev?.distanceMeters ?? null,
          };
        }),
      });

      session = await prisma.attendanceSession.update({
        where: { id: existingSession.id },
        data: {
          status: targetSessionStatus,
          closedAt:
            sessionAction === "CLOSE" || sessionAction === "LOCK" || sessionAction === "FINALIZE"
              ? new Date()
              : existingSession.closedAt,
        },
      });
    } else {
      // Create fresh session
      session = await prisma.attendanceSession.create({
        data: {
          courseId: course.id,
          facultyId: facultyId || "fac-chen-01",
          sectionId: targetSection.id,
          date: sessionDate,
          startTime: lectureTime || "09:00",
          endTime: "10:30",
          method: "MANUAL",
          status: targetSessionStatus,
          closedAt:
            sessionAction === "CLOSE" || sessionAction === "LOCK" || sessionAction === "FINALIZE"
              ? new Date()
              : null,
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
      courseCode: course.code,
      sectionName: targetSection.name,
      date: sessionDate.toISOString().split("T")[0],
      recordsCount: allFinalRecords.length,
      sessionStatus: targetSessionStatus,
      actor: auth.payload.email,
    });

    return NextResponse.json({
      success: true,
      message: `Attendance synchronized for ${allFinalRecords.length} students in ${targetSection.name}. Status: ${targetSessionStatus}`,
      sessionId: session.id,
      sessionStatus: targetSessionStatus,
      recordedCount: allFinalRecords.length,
      sectionName: targetSection.name,
    });
  } catch (error: any) {
    logger.error("Attendance POST API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to persist attendance" },
      { status: 500 }
    );
  }
}
