import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    let studentId = searchParams.get("studentId");

    const session = await getOptionalSession(req);

    if (!examId) {
      return NextResponse.json({ error: "examId parameter is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: { department: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Examination record not found" }, { status: 404 });
    }

    // Resolve student with IDOR protection
    let student = null;
    if (session?.role === "STUDENT") {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { user: true, program: true },
      });

      if (studentId && student && student.id !== studentId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot access another student's hall ticket" },
          { status: 403 }
        );
      }
    } else if (studentId) {
      student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { user: true, program: true },
      });
    }

    if (!student && session?.userId) {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { user: true, program: true },
      });
    }

    if (!student) {
      // Default to first student in cohort for administrative demonstration
      student = await prisma.student.findFirst({
        include: { user: true, program: true },
      });
    }

    if (!student) {
      return NextResponse.json({ error: "No student record found to issue hall ticket" }, { status: 404 });
    }

    const institution = await prisma.institution.findFirst();

    // Compute candidate course attendance to determine exam clearance standing
    const studentAttendance = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id, session: { courseId: exam.courseId } },
    });
    const totalAtt = studentAttendance.length;
    const presentAtt = studentAttendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
    ).length;
    const attRate = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 85.0;
    const isDefaulter = attRate < 75.0;

    const hallTicket = {
      ticketNumber: `HT-FALL26-${exam.course.code}-${student.rollNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      candidate: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        program: student.program.name,
        semester: `Semester ${student.currentSemester}`,
        email: student.user.email,
        institutionName: institution?.name || "Apex University of Science & Technology",
        institutionCode: institution?.code || "APEX",
      },
      examination: {
        id: exam.id,
        title: exam.title,
        type: exam.type,
        courseCode: exam.course.code,
        courseTitle: exam.course.title,
        department: exam.course.department.name,
        date: exam.examDate.toISOString().split("T")[0],
        duration: `${exam.durationMins} Minutes`,
        totalMarks: exam.totalMarks,
        reportingTime: "08:30 AM EST",
        hallLocation: "Main Academic Complex — Examination Hall B-3",
        seatNumber: `DESK-${student.rollNumber.slice(-3) || "042"}`,
      },
      verification: {
        issuedAt: new Date().toISOString(),
        authSignature: `APX-SIG-${Date.now().toString(36).toUpperCase()}-${student.id.substring(0, 6).toUpperCase()}`,
        status: isDefaulter ? "PROVISIONAL_CONDITIONAL" : "OFFICIALLY_VERIFIED",
        seal: "APEX-CONTROLLER-OF-EXAMINATIONS",
        isDefaulter,
        attendanceRate: Number(attRate.toFixed(1)),
        conditionNote: isDefaulter
          ? `PROVISIONAL ADMITTANCE: Course attendance (${attRate.toFixed(1)}%) is below 75% Senate threshold. Entry requires Dean Condonation.`
          : null,
      },
      guidelines: [
        "1. Candidate must present this Admit Card along with their Biometric RFID Smart Card at the entrance.",
        "2. Candidates must occupy their allotted desk 15 minutes before commencement. Late entry is barred.",
        "3. Mobile phones, smartwatches, programmable calculators, and unapproved electronics are strictly prohibited in the exam hall.",
        "4. Malpractice or violation of academic honor code incurs immediate disciplinary disqualification.",
      ],
    };

    logger.info("Hall ticket generated", {
      examId,
      studentId: student.id,
      ticketNumber: hallTicket.ticketNumber,
    });

    return NextResponse.json({ success: true, hallTicket });
  } catch (error: any) {
    logger.error("Hall Ticket Generation Error", error);
    return NextResponse.json(
      { error: "Failed to generate examination hall ticket", details: error.message },
      { status: 500 }
    );
  }
}
