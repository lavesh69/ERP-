import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { clinicStore } from "@/lib/clinic/clinic-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access clinic portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "consultations") {
      const consultations = clinicStore.getConsultations();
      return NextResponse.json({ success: true, consultations });
    }

    if (tab === "profiles") {
      const profiles = clinicStore.getProfiles();
      return NextResponse.json({ success: true, profiles });
    }

    if (tab === "beds") {
      const { beds } = clinicStore.getSummary();
      return NextResponse.json({ success: true, beds });
    }

    const summary = clinicStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Clinic API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve clinic data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform clinic operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "LOG_CONSULTATION") {
      const {
        patientName,
        patientRoll,
        chiefComplaint,
        vitals,
        diagnosis,
        prescriptions,
        attendingDoctor,
        requiresSickBayAdmit,
      } = body;

      if (!patientName || !chiefComplaint || !diagnosis) {
        return NextResponse.json(
          { error: "Patient name, chief complaint, and diagnosis are required" },
          { status: 400 }
        );
      }

      const consultation = clinicStore.createConsultation({
        patientName,
        patientRoll,
        chiefComplaint,
        vitals,
        diagnosis,
        prescriptions: prescriptions || [],
        attendingDoctor,
        requiresSickBayAdmit: Boolean(requiresSickBayAdmit),
      });

      return NextResponse.json({
        success: true,
        message: `Consultation recorded successfully (${consultation.caseNo})`,
        consultation,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Clinic API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process clinic request" }, { status: 400 });
  }
}
