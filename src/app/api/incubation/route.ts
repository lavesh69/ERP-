import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { incubationStore } from "@/lib/incubation/incubation-store";
import { IncubationStage } from "@/lib/incubation/incubation-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access incubation portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const stage = (searchParams.get("stage") as IncubationStage) || undefined;

    if (tab === "startups") {
      const startups = incubationStore.getStartups(stage);
      return NextResponse.json({ success: true, startups });
    }

    const summary = incubationStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Incubation API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve incubation data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform incubation operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "REGISTER_VENTURE") {
      const {
        startupName,
        founderName,
        founderRollOrStaffId,
        founderRole,
        sector,
        stage,
        pitchDeckSummary,
        seedGrantDisbursed,
        universityEquityPercentage,
        labDesksAllocated,
        mentorName,
      } = body;

      const venture = incubationStore.registerStartup({
        startupName,
        founderName,
        founderRollOrStaffId,
        founderRole,
        sector,
        stage,
        pitchDeckSummary,
        seedGrantDisbursed: Number(seedGrantDisbursed) || 15000,
        universityEquityPercentage: Number(universityEquityPercentage) || 2.0,
        labDesksAllocated: Number(labDesksAllocated) || 2,
        mentorName,
      });

      return NextResponse.json({
        success: true,
        message: `Startup registered into incubation cohort (${venture.companyRef})`,
        venture,
      });
    }

    if (action === "UPDATE_STAGE") {
      const { id, stage, seedGrantDisbursed, externalFundingRaised } = body;
      if (!id || !stage) {
        return NextResponse.json({ error: "Venture ID and stage are required" }, { status: 400 });
      }

      const updated = incubationStore.updateStartupStage(id, stage as IncubationStage, {
        seed: seedGrantDisbursed !== undefined ? Number(seedGrantDisbursed) : undefined,
        external: externalFundingRaised !== undefined ? Number(externalFundingRaised) : undefined,
      });

      return NextResponse.json({
        success: true,
        message: `Venture stage transitioned to ${stage}`,
        venture: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Incubation API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process incubation request" }, { status: 400 });
  }
}
