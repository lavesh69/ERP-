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

    const CLINIC_STAFF_ROLES = [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "HR_STAFF",
      "FACULTY",
    ];
    const isClinicStaff = CLINIC_STAFF_ROLES.includes(session.role);

    if (tab === "consultations") {
      let consultations = clinicStore.getConsultations();
      if (!isClinicStaff) {
        if (session.role === "STUDENT") {
          // Scope consultations strictly to calling student
          consultations = consultations.filter(
            (c: any) =>
              (session.studentId && c.patientRoll?.toLowerCase() === session.studentId?.toLowerCase()) ||
              (session.email && c.patientRoll?.toLowerCase() === session.email?.toLowerCase()) ||
              (session.fullName && c.patientName?.toLowerCase() === session.fullName?.toLowerCase())
          );
        } else {
          return NextResponse.json(
            { error: "Forbidden: Medical consultation dossiers require clinical staff authorization" },
            { status: 403 }
          );
        }
      }
      return NextResponse.json({ success: true, consultations });
    }

    if (tab === "profiles") {
      let profiles = clinicStore.getProfiles();
      if (!isClinicStaff) {
        if (session.role === "STUDENT") {
          profiles = profiles.filter(
            (p: any) =>
              (session.studentId && p.rollNumber?.toLowerCase() === session.studentId?.toLowerCase()) ||
              (session.email && p.rollNumber?.toLowerCase() === session.email?.toLowerCase()) ||
              (session.fullName && p.studentName?.toLowerCase() === session.fullName?.toLowerCase())
          );
        } else {
          return NextResponse.json(
            { error: "Forbidden: Medical profiles require clinical staff authorization" },
            { status: 403 }
          );
        }
      }
      return NextResponse.json({ success: true, profiles });
    }

    if (tab === "beds") {
      const { beds } = clinicStore.getSummary();
      return NextResponse.json({ success: true, beds });
    }

    if (tab === "pharmacy") {
      const pharmacyStock = clinicStore.getPharmacyStock();
      return NextResponse.json({ success: true, pharmacyStock });
    }

    const summary = clinicStore.getSummary();
    const pharmacyStock = clinicStore.getPharmacyStock();
    return NextResponse.json({ success: true, summary, pharmacyStock });
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

    const CLINIC_STAFF_ROLES = [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "HR_STAFF",
      "FACULTY",
    ];
    if (!CLINIC_STAFF_ROLES.includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Clinical interventions and pharmacy dispensing require medical staff authorization" },
        { status: 403 }
      );
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

    if (action === "DISCHARGE_BED") {
      const { bedId } = body;
      if (!bedId) {
        return NextResponse.json({ error: "Bed ID is required to discharge" }, { status: 400 });
      }

      const dischargedBed = clinicStore.dischargeBed(bedId);
      return NextResponse.json({
        success: true,
        message: `Patient successfully discharged from ${dischargedBed.bedNumber}. Bed sanitized and marked vacant.`,
        bed: dischargedBed,
      });
    }

    if (action === "DISPENSE_MEDICINE") {
      const { medId, quantity } = body;
      if (!medId) {
        return NextResponse.json({ error: "Medicine ID is required to dispense" }, { status: 400 });
      }
      const updated = clinicStore.dispenseMedicine(medId, Number(quantity) || 2);
      return NextResponse.json({
        success: true,
        message: `Dispensed ${quantity || 2} ${updated.unit} of ${updated.name}. Stock ledger updated.`,
        medicine: updated,
      });
    }

    if (action === "RESTOCK_MEDICINE") {
      const { medId, quantity } = body;
      if (!medId) {
        return NextResponse.json({ error: "Medicine ID is required to restock" }, { status: 400 });
      }
      const updated = clinicStore.restockMedicine(medId, Number(quantity) || 50);
      return NextResponse.json({
        success: true,
        message: `Restocked +${quantity || 50} ${updated.unit} of ${updated.name}. Statutory batch verified.`,
        medicine: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Clinic API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process clinic request" }, { status: 400 });
  }
}
