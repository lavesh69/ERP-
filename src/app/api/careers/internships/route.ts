import { NextRequest, NextResponse } from "next/server";
import {
  getAllInternships,
  getInternshipAnalytics,
  applyForInternship,
  issueUniversityNoc,
  submitWeeklyLogbook,
  verifyWeeklyLogbook,
  finalizeInternshipEvaluation,
} from "@/lib/careers/internship-engine";

export async function GET(req: NextRequest) {
  try {
    let studentId: string | undefined;
    let department: string | undefined;
    let status: string | undefined;

    if (req?.url) {
      const { searchParams } = new URL(req.url);
      studentId = searchParams.get("studentId") || undefined;
      department = searchParams.get("department") || undefined;
      status = searchParams.get("status") || undefined;
    }

    const internships = getAllInternships({ studentId, department, status });
    const analytics = getInternshipAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        internships,
        analytics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch internships" },
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
      case "APPLY": {
        const {
          studentId,
          rollNumber,
          studentName,
          department,
          currentSemester,
          academicYear,
          companyName,
          companyAddress,
          companyWebsite,
          industrySupervisorName,
          industrySupervisorEmail,
          industrySupervisorPhone,
          internshipRole,
          stipendInrPerMonth,
          startDate,
          endDate,
          durationWeeks,
          mode,
          facultyMentorName,
        } = body;

        if (
          !studentId ||
          !rollNumber ||
          !studentName ||
          !department ||
          !companyName ||
          !internshipRole ||
          !startDate ||
          !endDate
        ) {
          return NextResponse.json(
            { success: false, error: "Missing required internship application fields" },
            { status: 400 }
          );
        }

        const app = applyForInternship({
          studentId,
          rollNumber,
          studentName,
          department,
          currentSemester: Number(currentSemester) || 6,
          academicYear,
          companyName,
          companyAddress: companyAddress || "Corporate Campus",
          companyWebsite: companyWebsite || "https://example.com",
          industrySupervisorName: industrySupervisorName || "Industry Mentor",
          industrySupervisorEmail: industrySupervisorEmail || "mentor@example.com",
          industrySupervisorPhone: industrySupervisorPhone || "+91 90000 00000",
          internshipRole,
          stipendInrPerMonth: Number(stipendInrPerMonth) || 0,
          startDate,
          endDate,
          durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
          mode: mode || "HYBRID",
          facultyMentorName: facultyMentorName || "Department Faculty Mentor",
        });

        return NextResponse.json({ success: true, data: app }, { status: 201 });
      }

      case "ISSUE_NOC": {
        const { applicationId, authorizedSignatory } = body;
        if (!applicationId) {
          return NextResponse.json(
            { success: false, error: "applicationId is required" },
            { status: 400 }
          );
        }

        const updated = issueUniversityNoc({
          applicationId,
          authorizedSignatory,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "LOG_WEEK": {
        const { applicationId, weekNumber, startDate, endDate, tasksCompleted, hoursWorked } = body;
        if (!applicationId || !weekNumber || !tasksCompleted) {
          return NextResponse.json(
            { success: false, error: "applicationId, weekNumber, and tasksCompleted are required" },
            { status: 400 }
          );
        }

        const updated = submitWeeklyLogbook({
          applicationId,
          weekNumber: Number(weekNumber),
          startDate: startDate || new Date().toISOString().split("T")[0],
          endDate: endDate || new Date().toISOString().split("T")[0],
          tasksCompleted,
          hoursWorked: Number(hoursWorked) || 40,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "VERIFY_WEEK": {
        const { applicationId, weekNumber, mentorFeedback } = body;
        if (!applicationId || !weekNumber) {
          return NextResponse.json(
            { success: false, error: "applicationId and weekNumber are required" },
            { status: 400 }
          );
        }

        const updated = verifyWeeklyLogbook({
          applicationId,
          weekNumber: Number(weekNumber),
          mentorFeedback: mentorFeedback || "Work verified and approved by faculty mentor.",
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "FINALIZE_EVALUATION": {
        const {
          applicationId,
          industryMentorScore,
          facultyVivaScore,
          academicCreditsAwarded,
          evaluatorSignatory,
        } = body;

        if (!applicationId || industryMentorScore === undefined || facultyVivaScore === undefined) {
          return NextResponse.json(
            { success: false, error: "applicationId, industryMentorScore, and facultyVivaScore are required" },
            { status: 400 }
          );
        }

        const updated = finalizeInternshipEvaluation({
          applicationId,
          industryMentorScore: Number(industryMentorScore),
          facultyVivaScore: Number(facultyVivaScore),
          academicCreditsAwarded: academicCreditsAwarded ? Number(academicCreditsAwarded) : 4,
          evaluatorSignatory,
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
