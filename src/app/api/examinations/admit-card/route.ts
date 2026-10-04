import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { getOptionalSession } from "@/lib/auth/admin-guard";
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
        user: true,
        program: true,
        section: true,
        enrollments: {
          include: {
            course: {
              include: {
                exams: {
                  where: { status: "SCHEDULED" },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Eligibility check: Senate 75% rule or approved condonation
    const isEligible = student.attendanceRate >= 75.0;
    const pendingCondonation = await prisma.studentRequest.findFirst({
      where: {
        studentId: student.id,
        type: "LEAVE",
        status: "APPROVED",
      },
    });

    const isCleared = isEligible || !!pendingCondonation;

    if (!isCleared) {
      return NextResponse.json({
        success: false,
        isEligible: false,
        reason: `Admit card held: Attendance ${student.attendanceRate}% is below mandatory Senate threshold (75.0%). Please consult Course Coordinator for condonation petition.`,
        student: {
          name: `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
          attendanceRate: student.attendanceRate,
        },
      }, { status: 403 });
    }

    // Compile timetable of scheduled exams
    const examsList = student.enrollments.flatMap((e) =>
      e.course.exams.map((ex) => ({
        examId: ex.id,
        courseCode: e.course.code,
        courseTitle: e.course.title,
        examType: ex.type,
        date: ex.examDate.toISOString().split("T")[0],
        durationMins: ex.durationMins,
        totalMarks: ex.totalMarks,
        examinationCenter: "Apex Central Examination Complex",
      }))
    );

    const hallTicketSeal = crypto
      .createHash("sha256")
      .update(`${student.rollNumber}:${student.admissionNumber}:${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    return NextResponse.json({
      success: true,
      isEligible: true,
      admitCard: {
        ticketNumber: `HT-${student.rollNumber}-2026`,
        issueDate: new Date().toISOString(),
        institution: "Apex University Examination Authority",
        controllerSignature: "Prof. S. R. Ramanujan (CoE)",
        student: {
          name: `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
          admissionNumber: student.admissionNumber,
          program: student.program.name,
          semester: student.currentSemester,
          section: student.section?.name || "Section A",
          attendanceCertified: `${student.attendanceRate}%`,
        },
        hallTicketSecuritySeal: hallTicketSeal,
        examinationSchedule: examsList,
        instructions: [
          "Candidate must report to examination hall 20 minutes prior to scheduled start.",
          "Electronic devices, smartwatches, and unauthorized notes are strictly prohibited.",
          "Admit card and physical student identity card must be displayed on desk at all times.",
        ],
      },
    });
  } catch (error: any) {
    logger.error("Admit card GET error", error);
    return NextResponse.json({ error: "Failed to compile examination admit card" }, { status: 500 });
  }
}
