import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import {
  calculateAttendancePercentage,
  isDefaulter,
  calculateClassesNeededToRecover,
  calculateSafeAbsencesAllowed,
  SENATE_EXAM_THRESHOLD,
} from "@/lib/attendance/calculator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "DAILY_SHEET"; // DAILY_SHEET, SUBJECT_REGISTER, DEFAULTER_ROSTER, SECTION_SUMMARY, AUDIT_TRAIL
    const format = searchParams.get("format") || "JSON"; // JSON, CSV
    const courseId = searchParams.get("courseId");
    const sectionId = searchParams.get("sectionId");
    const departmentId = searchParams.get("departmentId");
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Helper to format as CSV
    const toCsv = (headers: string[], rows: any[][]): string => {
      const escape = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const headerRow = headers.map(escape).join(",");
      const dataRows = rows.map((r) => r.map(escape).join(",")).join("\n");
      return `${headerRow}\n${dataRows}`;
    };

    if (reportType === "DAILY_SHEET") {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const sessions = await prisma.attendanceSession.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          ...(courseId ? { courseId } : {}),
          ...(sectionId ? { sectionId } : {}),
        },
        include: {
          course: { include: { department: true } },
          section: true,
          faculty: { include: { user: true } },
          records: true,
        },
        orderBy: { startTime: "asc" },
      });

      const reportRows = sessions.map((s) => {
        const total = s.records.length;
        const present = s.records.filter((r) => r.status === "PRESENT").length;
        const late = s.records.filter((r) => r.status === "LATE").length;
        const absent = s.records.filter((r) => r.status === "ABSENT").length;
        const rate = total > 0 ? Number((((present + late) / total) * 100).toFixed(1)) : 0;

        return {
          sessionDate: dateParam,
          courseCode: s.course.code,
          courseTitle: s.course.title,
          department: s.course.department.code,
          section: s.section.name,
          instructor: s.faculty?.user ? `${s.faculty.user.firstName} ${s.faculty.user.lastName}` : "Faculty",
          lectureWindow: `${s.startTime} - ${s.endTime}`,
          method: s.method,
          status: s.status,
          totalStudents: total,
          present,
          late,
          absent,
          attendanceRate: `${rate}%`,
        };
      });

      if (format === "CSV") {
        const headers = [
          "Date",
          "Course Code",
          "Course Title",
          "Department",
          "Section",
          "Instructor",
          "Time",
          "Method",
          "Status",
          "Total",
          "Present",
          "Late",
          "Absent",
          "Turnout %",
        ];
        const data = reportRows.map((r) => [
          r.sessionDate,
          r.courseCode,
          r.courseTitle,
          r.department,
          r.section,
          r.instructor,
          r.lectureWindow,
          r.method,
          r.status,
          r.totalStudents,
          r.present,
          r.late,
          r.absent,
          r.attendanceRate,
        ]);
        const csvContent = toCsv(headers, data);
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=Daily_Attendance_${dateParam}.csv`,
          },
        });
      }

      return NextResponse.json({
        reportType: "DAILY_SHEET",
        date: dateParam,
        totalSessions: reportRows.length,
        data: reportRows,
      });
    }

    if (reportType === "DEFAULTER_ROSTER") {
      const students = await prisma.student.findMany({
        where: {
          ...(sectionId ? { sectionId } : {}),
        },
        include: {
          user: true,
          program: true,
          section: true,
          attendance: {
            include: {
              session: { include: { course: true } },
            },
          },
        },
      });

      const defaultersList: any[] = [];

      for (const st of students) {
        const records = st.attendance;
        if (records.length === 0) continue;

        const attended = records.filter(
          (r: any) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED"
        ).length;
        const total = records.length;
        const rate = calculateAttendancePercentage(attended, total);

        if (isDefaulter(rate, SENATE_EXAM_THRESHOLD)) {
          const needed = calculateClassesNeededToRecover(attended, total, SENATE_EXAM_THRESHOLD);
          defaultersList.push({
            rollNumber: st.rollNumber,
            name: `${st.user.firstName} ${st.user.lastName}`,
            email: st.user.email,
            program: st.program.name,
            section: st.section?.name || "Section A",
            conductedLectures: total,
            attendedLectures: attended,
            attendanceRate: rate,
            threshold: SENATE_EXAM_THRESHOLD,
            classesNeededToRecover: needed,
            admitCardStatus: "WITHHELD_DEFAULTER",
          });
        }
      }

      if (format === "CSV") {
        const headers = [
          "Roll Number",
          "Student Name",
          "Email",
          "Program",
          "Section",
          "Conducted",
          "Attended",
          "Current %",
          "Cutoff %",
          "Classes Needed to Recover",
          "Admit Card Standing",
        ];
        const data = defaultersList.map((d) => [
          d.rollNumber,
          d.name,
          d.email,
          d.program,
          d.section,
          d.conductedLectures,
          d.attendedLectures,
          `${d.attendanceRate}%`,
          `${d.threshold}%`,
          d.classesNeededToRecover,
          d.admitCardStatus,
        ]);
        const csvContent = toCsv(headers, data);
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=Defaulter_Roster_${dateParam}.csv`,
          },
        });
      }

      return NextResponse.json({
        reportType: "DEFAULTER_ROSTER",
        totalDefaulters: defaultersList.length,
        cutoffThreshold: SENATE_EXAM_THRESHOLD,
        data: defaultersList,
      });
    }

    if (reportType === "SUBJECT_REGISTER") {
      let targetCourse = null;
      if (courseId) {
        targetCourse = await prisma.course.findUnique({
          where: { id: courseId },
          include: {
            enrollments: {
              include: {
                student: { include: { user: true, section: true } },
              },
            },
            attendanceSessions: {
              include: { records: true },
            },
          },
        });
      }

      if (!targetCourse) {
        targetCourse = await prisma.course.findFirst({
          include: {
            enrollments: {
              include: {
                student: { include: { user: true, section: true } },
              },
            },
            attendanceSessions: {
              include: { records: true },
            },
          },
        });
      }

      if (!targetCourse) {
        return NextResponse.json({ error: "No course found for register" }, { status: 404 });
      }

      const totalConducted = targetCourse.attendanceSessions.length;
      const rosterRows = targetCourse.enrollments.map((enr) => {
        let attendedCount = 0;
        targetCourse!.attendanceSessions.forEach((sess) => {
          const rec = sess.records.find((r) => r.studentId === enr.studentId);
          if (rec && (rec.status === "PRESENT" || rec.status === "LATE" || rec.status === "EXCUSED")) {
            attendedCount += 1;
          }
        });

        const rate = calculateAttendancePercentage(attendedCount, totalConducted);
        const defaulter = isDefaulter(rate, SENATE_EXAM_THRESHOLD);
        const needed = defaulter ? calculateClassesNeededToRecover(attendedCount, totalConducted, SENATE_EXAM_THRESHOLD) : 0;
        const safe = !defaulter ? calculateSafeAbsencesAllowed(attendedCount, totalConducted, SENATE_EXAM_THRESHOLD) : 0;

        return {
          rollNumber: enr.student.rollNumber,
          name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
          section: enr.student.section?.name || "Section A",
          totalConducted,
          attendedCount,
          attendanceRate: rate,
          isDefaulter: defaulter,
          classesNeededToRecover: needed,
          safeAbsencesAllowed: safe,
        };
      });

      if (format === "CSV") {
        const headers = [
          "Roll Number",
          "Student Name",
          "Section",
          "Conducted",
          "Attended",
          "Attendance %",
          "Standing",
          "Recovery Need",
          "Safe Margin",
        ];
        const data = rosterRows.map((r) => [
          r.rollNumber,
          r.name,
          r.section,
          r.totalConducted,
          r.attendedCount,
          `${r.attendanceRate}%`,
          r.isDefaulter ? "DEFAULTER" : "ELIGIBLE",
          r.classesNeededToRecover,
          r.safeAbsencesAllowed,
        ]);
        const csvContent = toCsv(headers, data);
        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename=Register_${targetCourse.code}.csv`,
          },
        });
      }

      return NextResponse.json({
        reportType: "SUBJECT_REGISTER",
        courseCode: targetCourse.code,
        courseTitle: targetCourse.title,
        totalConducted,
        enrolledCount: rosterRows.length,
        data: rosterRows,
      });
    }

    return NextResponse.json({ error: "Unsupported reportType" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate attendance report", details: error.message },
      { status: 500 }
    );
  }
}
