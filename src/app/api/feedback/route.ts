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

    if (tab === "faculty") {
      const facultyIndices = feedbackStore.getAllFacultyIndices();
      return NextResponse.json({ success: true, facultyIndices });
    }

    if (tab === "responses") {
      const responses = feedbackStore.getResponses(facultyId, courseCode);
      return NextResponse.json({ success: true, responses });
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
      });

      return NextResponse.json({
        success: true,
        message: `Course evaluation submitted anonymously (${survey.surveyRef})`,
        survey,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Feedback API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process survey submission" }, { status: 400 });
  }
}
