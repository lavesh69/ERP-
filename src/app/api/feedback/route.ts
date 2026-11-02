import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { feedbackStore } from "@/lib/feedback/feedback-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access feedback portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const facultyId = searchParams.get("facultyId") || undefined;
    const courseCode = searchParams.get("courseCode") || undefined;

    const LEADERSHIP_ROLES = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD"];
    const FACULTY_ROLES = ["FACULTY", "TEACHER", "INSTRUCTOR", ...LEADERSHIP_ROLES];

    if (tab === "faculty") {
      if (!FACULTY_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only faculty and academic leadership can view faculty performance indices" }, { status: 403 });
      }
      const facultyIndices = feedbackStore.getAllFacultyIndices();
      return NextResponse.json({ success: true, facultyIndices });
    }

    if (tab === "responses") {
      if (!FACULTY_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only instructors and academic leadership can review evaluation responses" }, { status: 403 });
      }
      // Non-leadership faculty can only see evaluations directed to themselves
      let targetFacultyId = facultyId;
      if (!LEADERSHIP_ROLES.includes(session.role)) {
        targetFacultyId = session.userId || session.id;
      }
      const responses = feedbackStore.getResponses(targetFacultyId, courseCode, true);
      return NextResponse.json({ success: true, responses });
    }

    if (tab === "action-reports") {
      const status = searchParams.get("status") || undefined;
      const dept = searchParams.get("department") || undefined;
      const reports = feedbackStore.getActionReports(status, dept);
      return NextResponse.json({ success: true, reports });
    }

    if (tab === "cycles") {
      const status = searchParams.get("status") || undefined;
      const cycles = feedbackStore.getSurveyCycles(status);
      return NextResponse.json({ success: true, cycles });
    }

    if (tab === "multi-stakeholder") {
      const surveyType = searchParams.get("surveyType") || undefined;
      const surveys = feedbackStore.getMultiStakeholderSurveys(surveyType);
      return NextResponse.json({ success: true, surveys });
    }

    const summary = feedbackStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Feedback API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve feedback data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to submit feedback" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "SUBMIT_SURVEY") {
      const {
        surveyType,
        courseCode,
        courseName,
        facultyId,
        facultyName,
        departmentCode,
        semester,
        ratingPedagogy,
        ratingSyllabus,
        ratingPunctuality,
        ratingDoubtClearing,
        ratingCourseMaterial,
        qualitativeRemarks,
      } = body;

      const survey = feedbackStore.submitSurvey({
        surveyType,
        courseCode,
        courseName,
        facultyId,
        facultyName,
        departmentCode,
        semester: Number(semester) || 5,
        ratingPedagogy: Number(ratingPedagogy),
        ratingSyllabus: Number(ratingSyllabus),
        ratingPunctuality: Number(ratingPunctuality),
        ratingDoubtClearing: Number(ratingDoubtClearing),
        ratingCourseMaterial: Number(ratingCourseMaterial),
        qualitativeRemarks,
        studentId: session.userId || session.id || session.email,
        studentHash: session.id || session.userId,
        stakeholderType: body.stakeholderType,
        facilityCategory: body.facilityCategory,
        emergingTechRecommended: body.emergingTechRecommended,
        futureAspirations: body.futureAspirations,
        employerCompanyName: body.employerCompanyName,
        employerDesignation: body.employerDesignation,
        parentWardName: body.parentWardName,
        parentWardRoll: body.parentWardRoll,
      });

      return NextResponse.json({
        success: true,
        message: `Course evaluation submitted anonymously (${survey.surveyRef})`,
        survey,
      });
    }

    if (action === "CREATE_ACTION_REPORT") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only academic leadership can log Action Taken Reports." },
          { status: 403 }
        );
      }
      const report = feedbackStore.createActionReport({
        targetType: body.targetType,
        targetId: body.targetId,
        targetName: body.targetName,
        departmentCode: body.departmentCode,
        triggerReason: body.triggerReason,
        correctiveAction: body.correctiveAction,
        assignedAuthority: body.assignedAuthority || session.fullName || "Department HOD",
        deadlineDate: body.deadlineDate,
        status: body.status || "ACTION_PLANNED",
      });
      return NextResponse.json({
        success: true,
        message: `Action Taken Report ${report.reportRef} recorded under NAAC Criterion 1.4.2`,
        report,
      });
    }

    if (action === "UPDATE_ACTION_REPORT") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only leadership can update Action Reports." },
          { status: 403 }
        );
      }
      const updated = feedbackStore.updateActionReport(body.id, body.status, body.iqacRemarks);
      return NextResponse.json({
        success: true,
        message: `Action Taken Report status transitioned to ${body.status}`,
        report: updated,
      });
    }

    if (action === "CREATE_SURVEY_CYCLE") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can schedule survey cycles." },
          { status: 403 }
        );
      }
      const cycle = feedbackStore.createSurveyCycle(body.cycle || body);
      return NextResponse.json({
        success: true,
        message: `Survey window ${cycle.cycleCode} launched successfully`,
        cycle,
      });
    }

    if (action === "UPDATE_SURVEY_CYCLE") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only administrators can update survey cycles." },
          { status: 403 }
        );
      }
      const updated = feedbackStore.updateSurveyCycle(body.id, body.status);
      return NextResponse.json({
        success: true,
        message: `Survey window ${updated.cycleCode} status updated to ${body.status}`,
        cycle: updated,
      });
    }

    if (action === "DISPATCH_CYCLE_REMINDERS") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD", "TEACHER", "FACULTY"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only faculty and administrators can broadcast survey reminders." },
          { status: 403 }
        );
      }
      const result = feedbackStore.dispatchSurveyCycleReminders(body.cycleId);
      return NextResponse.json({
        success: true,
        message: `Reminder notifications successfully dispatched to ${result.remindedCount} pending stakeholders for cycle ${result.cycleCode}`,
        remindedCount: result.remindedCount,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Feedback API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process survey submission" }, { status: 400 });
  }
}
