import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  getAllRevaluationApplications,
  submitRevaluationApplication,
  assignBlindExaminer,
  submitEvaluatorScore,
  resolveRefereeEvaluation,
  getRevaluationAnalytics,
} from "@/lib/examinations/revaluation-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const courseCode = searchParams.get("courseCode") || undefined;
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const applications = getAllRevaluationApplications({
      studentId: session.role === "STUDENT" ? session.studentId || session.id : studentId,
      courseCode,
      status,
      type,
    });
    const analytics = getRevaluationAnalytics();

    return NextResponse.json({
      success: true,
      applications,
      analytics,
      totalCount: applications.length,
    });
  } catch (error: any) {
    console.error("GET /api/examinations/revaluation error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch revaluation data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "APPLY") {
      const {
        studentId,
        rollNumber,
        studentName,
        courseCode,
        courseTitle,
        examId,
        originalMarks,
        originalGrade,
        type,
        remarks,
      } = body;

      if (!courseCode || !originalMarks || !type) {
        return NextResponse.json({ error: "Missing required application parameters" }, { status: 400 });
      }

      const application = submitRevaluationApplication({
        studentId: studentId || session.studentId || session.id,
        rollNumber: rollNumber || (session as any).rollNumber || "2026-CSE-001",
        studentName: studentName || session.fullName || "Enrolled Scholar",
        courseCode,
        courseTitle: courseTitle || courseCode,
        examId: examId || "EXAM-2026-MAIN",
        originalMarks: Number(originalMarks),
        originalGrade: originalGrade || "B",
        type,
        remarks,
      });

      return NextResponse.json({
        success: true,
        message: `Successfully filed ${type.replace(/_/g, " ")} application (${application.applicationNumber})`,
        application,
      }, { status: 201 });
    }

    if (action === "ASSIGN_EXAMINER") {
      const authorized = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "PRINCIPAL"];
      if (!authorized.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only Controller of Examinations may assign examiners" }, { status: 403 });
      }

      const { applicationId, examinerName } = body;
      if (!applicationId || !examinerName) {
        return NextResponse.json({ error: "applicationId and examinerName are required" }, { status: 400 });
      }

      const updated = assignBlindExaminer(applicationId, examinerName);
      return NextResponse.json({
        success: true,
        message: `External examiner assigned under blind mask ${updated.dummyNumber}`,
        application: updated,
      });
    }

    if (action === "SUBMIT_EVALUATION") {
      const authorized = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "FACULTY", "PRINCIPAL"];
      if (!authorized.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only evaluation staff or examiners may submit marks" }, { status: 403 });
      }

      const { applicationId, revisedMarks, examinerNotes } = body;
      if (!applicationId || revisedMarks === undefined) {
        return NextResponse.json({ error: "applicationId and revisedMarks are required" }, { status: 400 });
      }

      const updated = submitEvaluatorScore({
        applicationId,
        revisedMarks: Number(revisedMarks),
        examinerNotes,
      });

      return NextResponse.json({
        success: true,
        message: updated.refereeRequired
          ? `Discrepancy of ${updated.percentageChange}% requires Referee Examination`
          : `Revaluation evaluation completed. Final marks: ${updated.revisedMarks} (${updated.revisedGrade})`,
        application: updated,
      });
    }

    if (action === "RESOLVE_REFEREE") {
      const authorized = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "PRINCIPAL"];
      if (!authorized.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only Controller of Examinations may record referee ruling" }, { status: 403 });
      }

      const { applicationId, refereeMarks, refereeExaminer, refereeNotes } = body;
      if (!applicationId || refereeMarks === undefined || !refereeExaminer) {
        return NextResponse.json({ error: "applicationId, refereeMarks, and refereeExaminer are required" }, { status: 400 });
      }

      const updated = resolveRefereeEvaluation({
        applicationId,
        refereeMarks: Number(refereeMarks),
        refereeExaminer,
        refereeNotes,
      });

      return NextResponse.json({
        success: true,
        message: `Referee resolution finalized with ${updated.refereeMarks} marks`,
        application: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/examinations/revaluation error:", error);
    return NextResponse.json({ error: error.message || "Failed to process revaluation action" }, { status: 500 });
  }
}
