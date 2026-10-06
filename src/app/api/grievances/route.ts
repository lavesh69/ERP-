import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { grievancesStore } from "@/lib/grievances/grievances-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access grievance redressal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const category = searchParams.get("category") || undefined;

    if (tab === "list") {
      const list = grievancesStore.getGrievances(category);
      return NextResponse.json({ success: true, grievances: list });
    }

    // Default: summary
    const summary = grievancesStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Grievances API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch grievances data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to file grievance" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "SUBMIT_GRIEVANCE") {
      const { title, description, category, severity, isAnonymous, grievantName, grievantRollOrId, respondentName } = body;
      if (!title || !description || !category) {
        return NextResponse.json({ error: "Title, description, and statutory category are required" }, { status: 400 });
      }

      const grievance = grievancesStore.createGrievance({
        title,
        description,
        category,
        severity: severity || "MEDIUM",
        isAnonymous: Boolean(isAnonymous),
        grievantRole: session.role,
        grievantName: isAnonymous ? undefined : (grievantName || session.fullName),
        grievantRollOrId: isAnonymous ? undefined : (grievantRollOrId || "ID-USER"),
        respondentName,
      });

      return NextResponse.json({
        success: true,
        message: `Grievance registered under ${grievance.committeeName} (Ticket: ${grievance.grievanceTicketNo})`,
        grievance,
      });
    }

    if (action === "RESOLVE_GRIEVANCE") {
      const { grievanceId, actionTakenReport, status } = body;
      if (!grievanceId || !actionTakenReport) {
        return NextResponse.json({ error: "Grievance ID and Action Taken Report (ATR) are required" }, { status: 400 });
      }

      const resolved = grievancesStore.resolveGrievance(grievanceId, actionTakenReport, status || "RESOLVED");
      return NextResponse.json({ success: true, message: "Grievance marked as resolved with official ATR", grievance: resolved });
    }

    if (action === "SCHEDULE_HEARING") {
      const { grievanceId, hearingDate, notes } = body;
      if (!grievanceId || !hearingDate) {
        return NextResponse.json({ error: "Grievance ID and Hearing Date are required" }, { status: 400 });
      }

      const scheduled = grievancesStore.scheduleHearing(grievanceId, hearingDate, notes);
      return NextResponse.json({ success: true, message: "Committee hearing scheduled", grievance: scheduled });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Grievances API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process grievance operation" }, { status: 400 });
  }
}
