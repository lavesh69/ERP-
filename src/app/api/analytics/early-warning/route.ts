import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  computeScholarRiskScore,
  recordIntervention,
  updateInterventionStatus,
  loadInterventions,
  EarlyWarningProfile,
} from "@/lib/academic/early-warning-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get("studentId");
    const institutionId = session.institutionId || "inst-apex-01";

    // 1. Single Student Deep Risk Analysis
    if (targetStudentId) {
      if (session.role === "STUDENT") {
        const callerStudent = await prisma.student.findUnique({ where: { userId: session.userId } });
        if (!callerStudent || callerStudent.id !== targetStudentId) {
          return NextResponse.json({ error: "Access denied to peer student risk dossier" }, { status: 403 });
        }
      }

      const student = await prisma.student.findUnique({
        where: { id: targetStudentId },
        include: {
          user: true,
          program: true,
          fees: true,
        },
      });

      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      // Compute total fee and dues
      const totalFee = student.fees.reduce((acc, f) => acc + f.totalAmount, 0);
      const paidFee = student.fees.reduce((acc, f) => acc + f.paidAmount, 0);
      const feeDue = Math.max(0, totalFee - paidFee);

      // Estimate CIA and backlog count
      const profile = computeScholarRiskScore({
        studentId: student.id,
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        programCode: student.program?.code || "GEN",
        currentSemester: student.currentSemester,
        attendanceRate: student.attendanceRate,
        ciaAveragePercentage: Math.max(30, Math.min(100, student.cgpa * 9.5)),
        backlogCount: student.cgpa < 5.0 ? 2 : 0,
        feeDueAmount: feeDue,
        totalFeeAmount: totalFee > 0 ? totalFee : 100000,
        unsubmittedAssignmentsCount: student.attendanceRate < 75 ? 3 : 0,
        unresolvedGrievancesOrClinicVisits: 0,
      });

      const allInterventions = loadInterventions().filter((i) => i.studentId === student.id);

      return NextResponse.json({
        success: true,
        profile,
        interventions: allInterventions,
      });
    }

    // 2. Cohort Radar Summary for Leadership (Super Admin, Principal, HOD, Faculty)
    const allowedLeadership = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];
    if (!allowedLeadership.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Leadership role required for cohort radar" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        user: { institutionId },
      },
      include: {
        user: true,
        program: true,
        fees: true,
      },
      take: 50,
    });

    const evaluatedProfiles: EarlyWarningProfile[] = students.map((s) => {
      const totalFee = s.fees.reduce((acc, f) => acc + f.totalAmount, 0);
      const paidFee = s.fees.reduce((acc, f) => acc + f.paidAmount, 0);
      const feeDue = Math.max(0, totalFee - paidFee);

      return computeScholarRiskScore({
        studentId: s.id,
        studentName: `${s.user.firstName} ${s.user.lastName}`,
        rollNumber: s.rollNumber,
        programCode: s.program?.code || "GEN",
        currentSemester: s.currentSemester,
        attendanceRate: s.attendanceRate,
        ciaAveragePercentage: Math.max(30, Math.min(100, s.cgpa * 9.5)),
        backlogCount: s.cgpa < 5.0 ? 2 : 0,
        feeDueAmount: feeDue,
        totalFeeAmount: totalFee > 0 ? totalFee : 100000,
        unsubmittedAssignmentsCount: s.attendanceRate < 75 ? 3 : 0,
        unresolvedGrievancesOrClinicVisits: 0,
      });
    });

    const summary = {
      totalEvaluated: evaluatedProfiles.length,
      criticalCount: evaluatedProfiles.filter((p) => p.riskTier === "CRITICAL").length,
      highCount: evaluatedProfiles.filter((p) => p.riskTier === "HIGH").length,
      moderateCount: evaluatedProfiles.filter((p) => p.riskTier === "MODERATE").length,
      lowCount: evaluatedProfiles.filter((p) => p.riskTier === "LOW").length,
      interventionsActive: loadInterventions().filter((i) => i.status === "OPEN" || i.status === "IN_INTERVENTION").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      profiles: evaluatedProfiles,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error evaluating academic early warning radar", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const allowedCounselors = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];
    if (!allowedCounselors.includes(session.role)) {
      return NextResponse.json({ error: "Only academic advisors and administrators can log interventions" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "LOG_INTERVENTION") {
      const { studentId, interventionType, notes } = body;
      if (!studentId || !interventionType || !notes) {
        return NextResponse.json({ error: "Missing required fields: studentId, interventionType, notes" }, { status: 400 });
      }

      const counselorUser = await prisma.user.findUnique({ where: { id: session.userId } });
      const counselorName = counselorUser ? `${counselorUser.firstName} ${counselorUser.lastName}` : "Academic Advisor";

      const record = recordIntervention({
        studentId,
        institutionId: session.institutionId || "inst-apex-01",
        assignedCounselorId: session.userId,
        counselorName,
        interventionType,
        notes,
      });

      return NextResponse.json({
        success: true,
        message: "Academic retention intervention recorded successfully",
        record,
      }, { status: 201 });
    }

    if (action === "UPDATE_STATUS") {
      const { interventionId, newStatus, notesUpdate } = body;
      if (!interventionId || !newStatus) {
        return NextResponse.json({ error: "Missing interventionId or newStatus" }, { status: 400 });
      }

      const updated = updateInterventionStatus(interventionId, newStatus, notesUpdate);
      if (!updated) {
        return NextResponse.json({ error: "Intervention not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Intervention status updated successfully",
        record: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: LOG_INTERVENTION, UPDATE_STATUS" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error processing intervention", details: String(error) },
      { status: 500 }
    );
  }
}
