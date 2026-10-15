import { NextRequest, NextResponse } from "next/server";
import {
  getAllAffidavits,
  getAllDisciplinaryIncidents,
  getProctorialAnalytics,
  submitAntiRaggingAffidavit,
  reportDisciplinaryIncident,
  issueShowCauseNotice,
  submitStudentDefense,
  pronounceDisciplinaryOrder,
} from "@/lib/compliance/proctorial-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const respondentId = searchParams.get("respondentId") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;

    const affidavits = getAllAffidavits(studentId);
    const incidents = getAllDisciplinaryIncidents({ respondentId, category, status });
    const analytics = getProctorialAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        affidavits,
        incidents,
        analytics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch proctorial records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action parameter is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "SUBMIT_AFFIDAVIT": {
        const { studentId, rollNumber, studentName, academicYear, parentGuardianName, parentPhone } = body;
        if (!studentId || !rollNumber || !studentName || !parentGuardianName || !parentPhone) {
          return NextResponse.json(
            { success: false, error: "Missing required affidavit fields" },
            { status: 400 }
          );
        }
        const record = submitAntiRaggingAffidavit({
          studentId,
          rollNumber,
          studentName,
          academicYear,
          parentGuardianName,
          parentPhone,
        });
        return NextResponse.json({ success: true, data: record });
      }

      case "REPORT_INCIDENT": {
        const {
          category,
          reportedBy,
          respondentStudentId,
          respondentRollNumber,
          respondentName,
          incidentDate,
          location,
          description,
          evidenceFiles,
          severity,
        } = body;

        if (
          !category ||
          !reportedBy ||
          !respondentStudentId ||
          !respondentRollNumber ||
          !respondentName ||
          !incidentDate ||
          !location ||
          !description ||
          !severity
        ) {
          return NextResponse.json(
            { success: false, error: "Missing required incident fields" },
            { status: 400 }
          );
        }

        const incident = reportDisciplinaryIncident({
          category,
          reportedBy,
          respondentStudentId,
          respondentRollNumber,
          respondentName,
          incidentDate,
          location,
          description,
          evidenceFiles,
          severity,
        });
        return NextResponse.json({ success: true, data: incident });
      }

      case "ISSUE_SCN": {
        const { incidentId, chargeSheet, replyDeadlineHours } = body;
        if (!incidentId || !chargeSheet) {
          return NextResponse.json(
            { success: false, error: "incidentId and chargeSheet are required" },
            { status: 400 }
          );
        }
        const updated = issueShowCauseNotice({
          incidentId,
          chargeSheet,
          replyDeadlineHours: replyDeadlineHours ? Number(replyDeadlineHours) : 72,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "SUBMIT_DEFENSE": {
        const { incidentId, explanationText, witnessStatement } = body;
        if (!incidentId || !explanationText) {
          return NextResponse.json(
            { success: false, error: "incidentId and explanationText are required" },
            { status: 400 }
          );
        }
        const updated = submitStudentDefense({
          incidentId,
          explanationText,
          witnessStatement,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      case "PRONOUNCE_ORDER": {
        const {
          incidentId,
          verdict,
          penaltyFineInr,
          suspensionDays,
          communityServiceHours,
          chiefProctorSignatory,
        } = body;

        if (!incidentId || !verdict) {
          return NextResponse.json(
            { success: false, error: "incidentId and verdict are required" },
            { status: 400 }
          );
        }

        const updated = pronounceDisciplinaryOrder({
          incidentId,
          verdict,
          penaltyFineInr: penaltyFineInr ? Number(penaltyFineInr) : undefined,
          suspensionDays: suspensionDays ? Number(suspensionDays) : undefined,
          communityServiceHours: communityServiceHours ? Number(communityServiceHours) : undefined,
          chiefProctorSignatory,
        });
        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
