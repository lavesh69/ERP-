import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

const HMAC_SECRET = process.env.JWT_SECRET || "apex-university-coe-secure-key";

/**
 * Generates an official signed verification token for an examination admit card
 */
function generateAdmitCardSignature(studentId: string, examId: string, rollNumber: string): string {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(`${studentId}:${examId}:${rollNumber.toUpperCase()}:COE-VERIFIED`)
    .digest("hex")
    .substring(0, 16)
    .toUpperCase();
}

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

    // Resolve student with IDOR and tenant protection
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

      if (student && session && session.role !== "SUPER_ADMIN" && session.institutionId && student.user.institutionId !== session.institutionId) {
        return NextResponse.json(
          { error: "Forbidden: Cross-institution student record access denied" },
          { status: 403 }
        );
      }
    } else if (session?.userId) {
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

    // Administrative preview fallback within the caller's institution
    if (!student && (!session || ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "PRINCIPAL", "HOD", "FACULTY"].includes(session.role))) {
      student = await prisma.student.findFirst({
        where: session && session.role !== "SUPER_ADMIN" && session.institutionId ? {
          user: { institutionId: session.institutionId },
        } : undefined,
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

    // Check financial fee clearance
    const feeRecords = await prisma.studentFee.findMany({
      where: { studentId: student.id, status: "OVERDUE" },
    });
    const hasFinancialHold = feeRecords.length > 0;

    const authSignature = generateAdmitCardSignature(student.id, exam.id, student.rollNumber);
    const seatNumber = `DESK-${student.rollNumber.replace(/[^0-9]/g, "").slice(-3) || "042"}`;
    const hallLocation = "Main Academic Complex — Examination Hall B-3";

    // QR Verification Payload formatted as structured JSON string
    const qrPayload = JSON.stringify({
      sig: authSignature,
      tkt: `HT-FALL26-${exam.course.code}-${student.rollNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      roll: student.rollNumber,
      examId: exam.id,
      course: exam.course.code,
      seat: seatNumber,
      hall: hallLocation,
      clearance: isDefaulter ? "PROVISIONAL" : hasFinancialHold ? "FINANCIAL_HOLD" : "CLEARED",
    });

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
        hallLocation,
        seatNumber,
      },
      verification: {
        issuedAt: new Date().toISOString(),
        authSignature: `APX-SIG-${authSignature}`,
        rawSignature: authSignature,
        status: isDefaulter
          ? "PROVISIONAL_CONDITIONAL"
          : hasFinancialHold
          ? "FINANCIAL_HOLD"
          : "OFFICIALLY_VERIFIED",
        seal: "APEX-CONTROLLER-OF-EXAMINATIONS",
        isDefaulter,
        hasFinancialHold,
        attendanceRate: Number(attRate.toFixed(1)),
        conditionNote: isDefaulter
          ? `PROVISIONAL ADMITTANCE: Course attendance (${attRate.toFixed(1)}%) is below 75% Senate threshold. Entry requires Dean Condonation.`
          : hasFinancialHold
          ? "FINANCIAL CLEARANCE PENDING: Outstanding fee dues require Bursar's Office clearance."
          : null,
        qrPayload,
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

/**
 * POST /api/examinations/hall-ticket
 * Gate Security & Invigilation Scanner Verification
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, ticketNumber, rollNumber, examId } = body;

    let parsedRoll = rollNumber;
    let parsedExamId = examId;
    let parsedSignature = "";

    if (token) {
      try {
        const decoded = JSON.parse(token);
        parsedRoll = decoded.roll || parsedRoll;
        parsedExamId = decoded.examId || parsedExamId;
        parsedSignature = decoded.sig || "";
      } catch {
        parsedSignature = token;
      }
    }

    if (!parsedRoll) {
      return NextResponse.json(
        { error: "Roll number or valid QR token required for gate verification" },
        { status: 400 }
      );
    }

    const student = await prisma.student.findFirst({
      where: { rollNumber: parsedRoll },
      include: { user: true, program: true },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: "INVALID_CANDIDATE",
          message: `No candidate found matching Roll Number '${parsedRoll}'`,
        },
        { status: 404 }
      );
    }

    let targetExam = null;
    if (parsedExamId) {
      targetExam = await prisma.exam.findUnique({
        where: { id: parsedExamId },
        include: { course: true },
      });
    } else {
      targetExam = await prisma.exam.findFirst({
        orderBy: { examDate: "asc" },
        include: { course: true },
      });
    }

    const expectedSignature = targetExam
      ? generateAdmitCardSignature(student.id, targetExam.id, student.rollNumber)
      : "";

    // Signature match check if signature provided
    const isAuthentic = !parsedSignature || parsedSignature.toUpperCase() === expectedSignature;

    // Check attendance eligibility
    let attendanceRate = 85.0;
    if (targetExam) {
      const studentAttendance = await prisma.attendanceRecord.findMany({
        where: { studentId: student.id, session: { courseId: targetExam.courseId } },
      });
      if (studentAttendance.length > 0) {
        const present = studentAttendance.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
        ).length;
        attendanceRate = (present / studentAttendance.length) * 100;
      }
    }

    const isDefaulter = attendanceRate < 75.0;
    const seatNumber = `DESK-${student.rollNumber.replace(/[^0-9]/g, "").slice(-3) || "042"}`;

    return NextResponse.json({
      success: true,
      verified: isAuthentic,
      gateAction: !isAuthentic
        ? "REJECT_FORGED_TICKET"
        : isDefaulter
        ? "ADMIT_PROVISIONAL_CONDONATION"
        : "ADMIT_CLEARED",
      candidate: {
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        program: student.program.name,
        semester: student.currentSemester,
      },
      examination: targetExam
        ? {
            title: targetExam.title,
            courseCode: targetExam.course.code,
            allocatedHall: "Main Academic Complex — Examination Hall B-3",
            seatNumber,
          }
        : null,
      verificationCheck: {
        isAuthentic,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        isDefaulter,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Gate Verification Error", error);
    return NextResponse.json(
      { error: "Failed to verify examination token", details: error.message },
      { status: 500 }
    );
  }
}
