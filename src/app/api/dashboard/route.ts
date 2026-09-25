import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { calculateCumulativeCGPA } from "@/lib/grading/gpa-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const role = session?.role || "SUPER_ADMIN";

    // -------------------------------------------------------------------------
    // 1. TEACHER / FACULTY DASHBOARD EXPERIENCE
    // -------------------------------------------------------------------------
    if (["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD", "PRINCIPAL"].includes(role)) {
      let faculty = null;
      if (session?.userId || session?.email) {
        faculty = await prisma.faculty.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
          include: {
            user: true,
            department: true,
            courses: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      include: {
                        student: { include: { user: true } },
                      },
                    },
                    assignments: {
                      include: {
                        submissions: true,
                      },
                    },
                    exams: true,
                  },
                },
              },
            },
          },
        });
      }

      // Fallback to primary seeded faculty if in sandbox or direct perspective switch
      if (!faculty) {
        faculty = await prisma.faculty.findFirst({
          include: {
            user: true,
            department: true,
            courses: {
              include: {
                course: {
                  include: {
                    enrollments: {
                      include: {
                        student: { include: { user: true } },
                      },
                    },
                    assignments: {
                      include: {
                        submissions: true,
                      },
                    },
                    exams: true,
                  },
                },
              },
            },
          },
        });
      }

      const facultyId = faculty?.id || "fac-default";

      // Query Timetable for this Faculty
      const timetableSlots = await prisma.timetableSlot.findMany({
        where: { facultyId },
        include: {
          course: true,
          room: true,
          section: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });

      // Days mapping
      const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const currentDayName = dayNames[new Date().getDay()];

      const todaySchedule = timetableSlots.filter(
        (s) => s.dayOfWeek.toUpperCase() === currentDayName.toUpperCase()
      );

      // Determine next class
      const nowTimeStr = new Date().toTimeString().slice(0, 5); // "HH:MM"
      const nextClass =
        todaySchedule.find((s) => s.startTime >= nowTimeStr) ||
        todaySchedule[0] ||
        timetableSlots[0] ||
        null;

      // Extract assigned courses
      const assignedCourses = (faculty?.courses || []).map((cf) => {
        const c = cf.course;
        const totalEnrolled = c.enrollments.length;
        const totalAssignments = c.assignments.length;
        const totalExams = c.exams.length;

        // Calculate average attendance for this course
        const studentAggregates = c.enrollments.map((e) => e.student.attendanceRate || 90.0);
        const avgAttendance =
          studentAggregates.length > 0
            ? (studentAggregates.reduce((a, b) => a + b, 0) / studentAggregates.length).toFixed(1)
            : "94.0";

        return {
          id: c.id,
          code: c.code,
          title: c.title,
          credits: c.credits,
          lectureHours: c.lectureHours,
          labHours: c.labHours,
          studentCount: totalEnrolled,
          avgAttendance: Number(avgAttendance),
          assignmentsCount: totalAssignments,
          examsCount: totalExams,
        };
      });

      // Pending Submissions to grade
      let pendingGradingCount = 0;
      (faculty?.courses || []).forEach((cf) => {
        cf.course.assignments.forEach((a) => {
          const unrated = a.submissions.filter((sub) => sub.gradePoints === null);
          pendingGradingCount += unrated.length;
        });
      });

      // Upcoming exams for faculty's courses
      const courseIds = (faculty?.courses || []).map((cf) => cf.courseId);
      const upcomingExams = await prisma.exam.findMany({
        where: {
          courseId: { in: courseIds.length > 0 ? courseIds : ["course-default"] },
        },
        include: { course: true },
        orderBy: { examDate: "asc" },
        take: 5,
      });

      // Students below attendance threshold (< 75%)
      const atRiskStudents: any[] = [];
      (faculty?.courses || []).forEach((cf) => {
        cf.course.enrollments.forEach((enr) => {
          if ((enr.student.attendanceRate || 100) < 75) {
            atRiskStudents.push({
              studentId: enr.student.id,
              name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
              rollNumber: enr.student.rollNumber,
              courseCode: cf.course.code,
              attendanceRate: enr.student.attendanceRate,
            });
          }
        });
      });

      // Workload Metrics
      const totalStudentsTaught = assignedCourses.reduce((sum, c) => sum + c.studentCount, 0);
      const weeklyHoursTaught = assignedCourses.reduce(
        (sum, c) => sum + (c.lectureHours + c.labHours),
        0
      );

      // Announcements for Faculty
      const announcements = await prisma.announcement.findMany({
        where: { targetAudience: { in: ["ALL", "FACULTY"] } },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      return NextResponse.json({
        perspective: "FACULTY",
        faculty: {
          id: faculty?.id,
          name: `${faculty?.user.firstName} ${faculty?.user.lastName}`,
          designation: faculty?.designation || "Faculty Member",
          department: faculty?.department.name || "Computer Science",
          employeeCode: faculty?.employeeCode,
          officeRoom: faculty?.officeRoom || "Academic Block A-302",
        },
        metrics: {
          assignedCoursesCount: assignedCourses.length,
          totalStudentsCount: totalStudentsTaught,
          weeklyTeachingHours: weeklyHoursTaught || faculty?.weeklyHours || 18,
          pendingGradingCount,
          atRiskDefaultersCount: atRiskStudents.length,
          activeExamsCount: upcomingExams.length,
        },
        assignedCourses,
        todaySchedule: todaySchedule.map((s) => ({
          id: s.id,
          courseCode: s.course.code,
          courseTitle: s.course.title,
          roomCode: s.room.code,
          roomName: s.room.name,
          sectionName: s.section.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        nextClass: nextClass
          ? {
              courseCode: nextClass.course.code,
              courseTitle: nextClass.course.title,
              roomCode: nextClass.room.code,
              startTime: nextClass.startTime,
              endTime: nextClass.endTime,
            }
          : null,
        upcomingExams: upcomingExams.map((e) => ({
          id: e.id,
          title: e.title,
          courseCode: e.course.code,
          examDate: e.examDate.toISOString().split("T")[0],
          durationMins: e.durationMins,
          status: e.status,
        })),
        atRiskStudents: atRiskStudents.slice(0, 5),
        recentAnnouncements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          createdAt: a.createdAt,
        })),
      });
    }

    // -------------------------------------------------------------------------
    // 2. STUDENT DASHBOARD EXPERIENCE
    // -------------------------------------------------------------------------
    if (role === "STUDENT") {
      let student = null;
      if (session?.userId || session?.email) {
        student = await prisma.student.findFirst({
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
                    faculty: {
                      include: {
                        faculty: { include: { user: true } },
                      },
                    },
                    assignments: {
                      include: {
                        submissions: true,
                      },
                    },
                    exams: true,
                  },
                },
              },
            },
            fees: {
              include: { feeStructure: true, transactions: true },
            },
            examResults: {
              include: {
                exam: { include: { course: true } },
              },
            },
            bookLoans: {
              include: { book: true },
            },
            requests: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        });
      }

      // Fallback to first student in sandbox or demo mode
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
                    faculty: {
                      include: {
                        faculty: { include: { user: true } },
                      },
                    },
                    assignments: {
                      include: {
                        submissions: true,
                      },
                    },
                    exams: true,
                  },
                },
              },
            },
            fees: {
              include: { feeStructure: true, transactions: true },
            },
            examResults: {
              include: {
                exam: { include: { course: true } },
              },
            },
            bookLoans: {
              include: { book: true },
            },
            requests: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        });
      }

      const enrolledCourseIds = (student?.enrollments || []).map((e) => e.courseId);

      // Student Timetable slots (matching student's enrolled courses or section)
      const timetableSlots = await prisma.timetableSlot.findMany({
        where: {
          OR: [
            { courseId: { in: enrolledCourseIds.length > 0 ? enrolledCourseIds : ["none"] } },
            { sectionId: student?.sectionId || "sec-none" },
          ],
        },
        include: {
          course: true,
          faculty: { include: { user: true } },
          room: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });

      const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const currentDayName = dayNames[new Date().getDay()];

      const todaySchedule = timetableSlots.filter(
        (s) => s.dayOfWeek.toUpperCase() === currentDayName.toUpperCase()
      );

      const nowTimeStr = new Date().toTimeString().slice(0, 5);
      const nextClass =
        todaySchedule.find((s) => s.startTime >= nowTimeStr) ||
        todaySchedule[0] ||
        timetableSlots[0] ||
        null;

      // Pending assignments (assignments where student has NOT submitted yet)
      const pendingAssignments: any[] = [];
      (student?.enrollments || []).forEach((enr) => {
        enr.course.assignments.forEach((a) => {
          const mySubmission = a.submissions.find((s) => s.studentId === student?.id);
          if (!mySubmission) {
            pendingAssignments.push({
              id: a.id,
              title: a.title,
              courseCode: enr.course.code,
              courseTitle: enr.course.title,
              dueDate: a.dueDate.toISOString().split("T")[0],
              maxPoints: a.maxPoints,
              isLate: new Date(a.dueDate) < new Date(),
            });
          }
        });
      });

      // Upcoming exams for enrolled courses
      const upcomingExams = await prisma.exam.findMany({
        where: {
          courseId: { in: enrolledCourseIds.length > 0 ? enrolledCourseIds : ["none"] },
          examDate: { gte: new Date(new Date().setDate(new Date().getDate() - 1)) },
        },
        include: { course: true },
        orderBy: { examDate: "asc" },
        take: 4,
      });

      // Financial status
      let totalFees = 0;
      let paidFees = 0;
      student?.fees.forEach((f) => {
        totalFees += f.totalAmount;
        paidFees += f.paidAmount;
      });
      const pendingFees = Math.max(0, totalFees - paidFees);

      // Enrolled courses summary
      const coursesSummary = (student?.enrollments || []).map((e) => {
        const primaryFaculty = e.course.faculty[0]?.faculty?.user;
        return {
          id: e.course.id,
          code: e.course.code,
          title: e.course.title,
          credits: e.course.credits,
          status: e.status,
          grade: e.grade,
          gradePoint: e.gradePoint,
          facultyName: primaryFaculty
            ? `Prof. ${primaryFaculty.firstName} ${primaryFaculty.lastName}`
            : "Assigned Faculty",
        };
      });

      // Library loans
      const activeLoans = (student?.bookLoans || []).filter((b) => b.status === "ISSUED");

      // Announcements for Students
      const announcements = await prisma.announcement.findMany({
        where: { targetAudience: { in: ["ALL", "STUDENTS"] } },
        orderBy: { createdAt: "desc" },
        take: 4,
      });

      return NextResponse.json({
        perspective: "STUDENT",
        student: {
          id: student?.id,
          name: `${student?.user.firstName} ${student?.user.lastName}`,
          rollNumber: student?.rollNumber,
          admissionNumber: student?.admissionNumber,
          program: student?.program.name || "B.Tech Computer Science",
          semester: student?.currentSemester || 1,
          section: student?.section?.name || "Section A",
          cgpa: student?.cgpa || 3.85,
          attendanceRate: student?.attendanceRate || 94.2,
          status: student?.status || "ACTIVE",
        },
        metrics: {
          enrolledCoursesCount: coursesSummary.length,
          attendanceRate: student?.attendanceRate || 94.2,
          cgpa: student?.cgpa || 3.85,
          pendingAssignmentsCount: pendingAssignments.length,
          upcomingExamsCount: upcomingExams.length,
          pendingFees,
          activeBookLoansCount: activeLoans.length,
          openRequestsCount: (student?.requests || []).filter((r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length,
        },
        courses: coursesSummary,
        todaySchedule: todaySchedule.map((s) => ({
          id: s.id,
          courseCode: s.course.code,
          courseTitle: s.course.title,
          facultyName: `${s.faculty.user.firstName} ${s.faculty.user.lastName}`,
          roomCode: s.room.code,
          roomName: s.room.name,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        nextClass: nextClass
          ? {
              courseCode: nextClass.course.code,
              courseTitle: nextClass.course.title,
              facultyName: `${nextClass.faculty.user.firstName} ${nextClass.faculty.user.lastName}`,
              roomCode: nextClass.room.code,
              startTime: nextClass.startTime,
              endTime: nextClass.endTime,
            }
          : null,
        pendingAssignments,
        upcomingExams: upcomingExams.map((e) => ({
          id: e.id,
          title: e.title,
          courseCode: e.course.code,
          examDate: e.examDate.toISOString().split("T")[0],
          durationMins: e.durationMins,
        })),
        feeStatus: {
          totalFees,
          paidFees,
          pendingFees,
          status: pendingFees === 0 ? "PAID" : paidFees > 0 ? "PARTIAL" : "PENDING",
        },
        activeLoans: activeLoans.map((l) => ({
          id: l.id,
          title: l.book.title,
          dueDate: l.dueDate.toISOString().split("T")[0],
        })),
        recentRequests: (student?.requests || []).map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          status: r.status,
          createdAt: r.createdAt.toISOString().split("T")[0],
        })),
        recentAnnouncements: announcements.map((a) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          createdAt: a.createdAt,
        })),
      });
    }

    // -------------------------------------------------------------------------
    // 3. EXECUTIVE / ADMIN OVERVIEW EXPERIENCE (SUPER_ADMIN, INSTITUTION_ADMIN)
    // -------------------------------------------------------------------------
    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const todayDayOfWeek = daysOfWeek[new Date().getDay()];

    const [
      studentCount,
      facultyCount,
      courseCount,
      todayTimetableSlots,
      recentAnnouncements,
      feeAggregates,
      attendanceRecords,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.course.count(),
      prisma.timetableSlot.findMany({
        where: { dayOfWeek: todayDayOfWeek },
        take: 8,
        include: {
          course: true,
          faculty: { include: { user: true } },
          room: true,
        },
        orderBy: { startTime: "asc" },
      }),
      prisma.announcement.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
      }),
      prisma.studentFee.aggregate({
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
      prisma.attendanceRecord.findMany({
        select: { status: true },
      }),
    ]);

    // Fallback if today has no slots scheduled
    let timetableSlots = todayTimetableSlots;
    if (timetableSlots.length === 0) {
      timetableSlots = await prisma.timetableSlot.findMany({
        take: 6,
        include: {
          course: true,
          faculty: { include: { user: true } },
          room: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    }

    const totalAttendance = attendanceRecords.length;
    const presentAttendance = attendanceRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;
    const attendancePercentage =
      totalAttendance > 0
        ? ((presentAttendance / totalAttendance) * 100).toFixed(1)
        : "94.6";

    const totalFees = feeAggregates._sum.totalAmount || 0;
    const paidFees = feeAggregates._sum.paidAmount || 0;
    const feeCollectionRate =
      totalFees > 0 ? ((paidFees / totalFees) * 100).toFixed(1) : "100.0";

    const attendanceTrends = [
      { day: "Mon", rate: 94.2, present: 64, absent: 4 },
      { day: "Tue", rate: 96.0, present: 65, absent: 3 },
      { day: "Wed", rate: 92.8, present: 63, absent: 5 },
      { day: "Thu", rate: 95.5, present: 65, absent: 3 },
      { day: "Fri", rate: 93.9, present: 64, absent: 4 },
    ];

    return NextResponse.json({
      perspective: "ADMIN",
      metrics: {
        studentCount,
        facultyCount,
        courseCount,
        attendancePercentage: Number(attendancePercentage),
        totalFees,
        paidFees,
        pendingFees: Math.max(0, totalFees - paidFees),
        feeCollectionRate: Number(feeCollectionRate),
        activeIoTScanners: 42,
      },
      attendanceTrends,
      todaySchedule: timetableSlots.map((s) => ({
        id: s.id,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        facultyName: `${s.faculty.user.firstName} ${s.faculty.user.lastName}`,
        roomName: s.room.name,
        roomCode: s.room.code,
        startTime: s.startTime,
        endTime: s.endTime,
        dayOfWeek: s.dayOfWeek,
      })),
      recentAnnouncements: recentAnnouncements.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        targetAudience: a.targetAudience,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch real dashboard metrics" },
      { status: 500 }
    );
  }
}
