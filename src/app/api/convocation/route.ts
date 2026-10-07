import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { convocationStore } from "@/lib/convocation/convocation-store";
import { NoDuesDepartment } from "@/lib/convocation/convocation-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access convocation portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const roll = searchParams.get("roll") || undefined;

    if (tab === "candidates") {
      const candidates = convocationStore.getCandidates(roll);
      return NextResponse.json({ success: true, candidates });
    }

    const summary = convocationStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Convocation API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve convocation data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform convocation operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "UPDATE_CLEARANCE") {
      const { candidateId, department, isCleared } = body;
      if (!candidateId || !department) {
        return NextResponse.json({ error: "Candidate ID and department are required" }, { status: 400 });
      }

      const updated = convocationStore.updateClearance(
        candidateId,
        department as NoDuesDepartment,
        Boolean(isCleared)
      );

      return NextResponse.json({
        success: true,
        message: `Clearance updated for ${department}`,
        candidate: updated,
      });
    }

    if (action === "REGISTER_CEREMONY") {
      const { candidateId, robeSize, guestPassesCount, degreeDispatchMode } = body;
      if (!candidateId) {
        return NextResponse.json({ error: "Candidate ID is required" }, { status: 400 });
      }

      const candidate = convocationStore.registerCandidate(candidateId, {
        robeSize: robeSize || "L",
        guestPassesCount: Number(guestPassesCount) || 2,
        degreeDispatchMode: degreeDispatchMode || "CONVOCATION_IN_PERSON",
      });

      return NextResponse.json({
        success: true,
        message: `Convocation registration confirmed (${candidate.candidateRef})`,
        candidate,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Convocation API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process convocation request" }, { status: 400 });
  }
}
