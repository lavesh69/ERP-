import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { accreditationStore } from "@/lib/accreditation/accreditation-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access accreditation portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "criteria") {
      const criteria = accreditationStore.getCriteria();
      return NextResponse.json({ success: true, criteria });
    }

    if (tab === "dossier") {
      const dossier = accreditationStore.generateOfficialDossier();
      return NextResponse.json({ success: true, dossier });
    }

    const summary = accreditationStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Accreditation API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve accreditation data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform accreditation operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "GENERATE_AQAR") {
      const dossier = accreditationStore.generateOfficialDossier();
      return NextResponse.json({
        success: true,
        message: `AQAR Annual Quality Assurance Report generated successfully (${dossier.verificationHash})`,
        dossier,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Accreditation API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process accreditation request" }, { status: 400 });
  }
}
