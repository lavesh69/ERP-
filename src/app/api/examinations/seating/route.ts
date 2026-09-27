import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireRoleAuth } from "@/lib/auth/admin-guard";
import {
  generateAntiCheatingSeatingPlan,
  ExamHallConfig,
  CandidateEntry,
} from "@/lib/examinations/seating-engine";
import { logger } from "@/lib/logging/logger";

const DEFAULT_EXAM_HALLS: ExamHallConfig[] = [
  {
    hallId: "hall-a101",
    hallName: "Ramanujan Exam Hall A-101",
    building: "Science & Engineering Complex",
    rows: 4,
    cols: 6, // 24 seats
    invigilatorId: "fac-chen-01",
    invigilatorName: "Prof. Sarah Chen",
    invigilatorDept: "Computer Science & Engineering",
  },
  {
    hallId: "hall-b204",
    hallName: "Alan Turing Lecture Complex B-204",
    building: "Computing Center Block B",
    rows: 4,
    cols: 6, // 24 seats
    invigilatorId: "fac-raman-01",
    invigilatorName: "Dr. Vikram Raman",
    invigilatorDept: "Electrical Engineering",
  },
  {
    hallId: "hall-c301",
    hallName: "C.V. Raman Auditorium Hall C-301",
    building: "Main Academic Building",
    rows: 5,
    cols: 6, // 30 seats
    invigilatorId: "fac-johnson-01",
    invigilatorName: "Dr. Marcus Johnson",
    invigilatorDept: "Mathematics",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);

    // Fetch courses with enrollments and student details
    const courses = await prisma.course.findMany({
      include: {
        department: true,
        enrollments: {
          include: {
            student: {
              include: { user: true, program: true },
            },
          },
        },
      },
      take: 4,
    });

    const candidatesByCourse: Record<string, CandidateEntry[]> = {};

    for (const c of courses) {
      candidatesByCourse[c.code] = c.enrollments.map((enr) => ({
        studentId: enr.student.id,
        studentName: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        rollNumber: enr.student.rollNumber,
        courseCode: c.code,
        courseTitle: c.title,
        department: c.department?.name || "General Engineering",
      }));
    }

    // If courses have very few enrollments in test db, create balanced demo cohort
    if (Object.keys(candidatesByCourse).length === 0 || Object.values(candidatesByCourse).flat().length < 6) {
      const allStudents = await prisma.student.findMany({
        include: { user: true },
        take: 30,
      });

      candidatesByCourse["CS-402"] = allStudents.slice(0, 15).map((st) => ({
        studentId: st.id,
        studentName: `${st.user.firstName} ${st.user.lastName}`,
        rollNumber: st.rollNumber,
        courseCode: "CS-402",
        courseTitle: "Neural Networks & Deep Learning",
        department: "Computer Science & Engineering",
      }));

      candidatesByCourse["EC-301"] = allStudents.slice(15, 30).map((st) => ({
        studentId: st.id,
        studentName: `${st.user.firstName} ${st.user.lastName}`,
        rollNumber: st.rollNumber,
        courseCode: "EC-301",
        courseTitle: "Digital Signal Processing",
        department: "Electrical Engineering",
      }));
    }

    const allocation = generateAntiCheatingSeatingPlan(candidatesByCourse, DEFAULT_EXAM_HALLS);

    // If student calling, personalize their seat lookup
    let studentSeat: any = null;
    if (session?.role === "STUDENT" && session.userId) {
      const myStudent = await prisma.student.findFirst({
        where: {
          OR: [{ userId: session.userId }, { user: { email: session.email } }],
        },
      });

      if (myStudent) {
        for (const plan of allocation.plans) {
          for (const row of plan.grid) {
            for (const seat of row) {
              if (seat.student?.studentId === myStudent.id || seat.student?.rollNumber === myStudent.rollNumber) {
                studentSeat = {
                  hallId: plan.hallId,
                  hallName: plan.hallName,
                  building: plan.building,
                  seatNumber: seat.seatNumber,
                  courseCode: seat.student.courseCode,
                  courseTitle: seat.student.courseTitle,
                };
                break;
              }
            }
            if (studentSeat) break;
          }
          if (studentSeat) break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      allocation,
      halls: DEFAULT_EXAM_HALLS,
      studentSeat,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Seating Allocation GET Error", error);
    return NextResponse.json(
      { error: "Failed to generate seating allocation", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "EXAMINATION_CONTROLLER",
    "FACULTY",
    "HOD",
    "PRINCIPAL",
  ]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { halls, courseCodes } = body;

    const targetHalls: ExamHallConfig[] =
      Array.isArray(halls) && halls.length > 0 ? halls : DEFAULT_EXAM_HALLS;

    const whereClause: any = {};
    if (Array.isArray(courseCodes) && courseCodes.length > 0) {
      whereClause.code = { in: courseCodes };
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        department: true,
        enrollments: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
    });

    const candidatesByCourse: Record<string, CandidateEntry[]> = {};
    for (const c of courses) {
      candidatesByCourse[c.code] = c.enrollments.map((enr) => ({
        studentId: enr.student.id,
        studentName: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
        rollNumber: enr.student.rollNumber,
        courseCode: c.code,
        courseTitle: c.title,
        department: c.department?.name || "General Engineering",
      }));
    }

    const result = generateAntiCheatingSeatingPlan(candidatesByCourse, targetHalls);

    logger.info("Custom Anti-Cheating Seating Generated", {
      actor: auth.payload.email,
      totalCandidates: result.totalCandidates,
      hallsUsed: result.hallsUsed,
      horizontalClashes: result.antiCheatingMetrics.horizontalClashes,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error("Seating Allocation POST Error", error);
    return NextResponse.json(
      { error: "Failed to allocate custom examination seating", details: error.message },
      { status: 500 }
    );
  }
}
