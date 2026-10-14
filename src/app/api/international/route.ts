import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { internationalStore } from "@/lib/international/international-store";
import { ExchangeType, ExchangeStatus } from "@/lib/international/international-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access international portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const type = (searchParams.get("type") as ExchangeType) || undefined;

    if (tab === "partners") {
      const partners = internationalStore.getPartners();
      return NextResponse.json({ success: true, partners });
    }

    if (tab === "students") {
      let students = internationalStore.getStudents(type);
      const isStaffOrOfficer = [
        "SUPER_ADMIN",
        "INSTITUTION_ADMIN",
        "REGISTRAR",
        "PRINCIPAL",
        "HOD",
        "RESEARCH_COORDINATOR",
      ].includes(session.role);

      if (!isStaffOrOfficer) {
        students = students.map((s: any) => ({
          ...s,
          passportNumber:
            s.studentRollOrId === session.studentId ||
            s.studentName?.toLowerCase() === session.fullName?.toLowerCase()
              ? s.passportNumber
              : s.passportNumber
              ? `${s.passportNumber.slice(0, 2)}****${s.passportNumber.slice(-2)}`
              : undefined,
        }));
      }
      return NextResponse.json({ success: true, students });
    }

    const summary = internationalStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[International API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve international data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform international operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "APPLY_EXCHANGE") {
      const {
        studentName,
        studentRollOrId,
        type,
        homeUniversity,
        hostUniversity,
        program,
        targetSemester,
        creditsMapped,
        passportNumber,
        visaExpiryDate,
        scholarshipGrantAmount,
      } = body;

      if (!studentName || !hostUniversity) {
        return NextResponse.json({ error: "Student name and host university are required" }, { status: 400 });
      }

      const application = internationalStore.submitApplication({
        studentName,
        studentRollOrId,
        type: type || "OUTBOUND",
        homeUniversity,
        hostUniversity,
        program,
        targetSemester,
        creditsMapped: Number(creditsMapped) || 16,
        passportNumber,
        visaExpiryDate,
        scholarshipGrantAmount: Number(scholarshipGrantAmount) || 2000,
      });

      return NextResponse.json({
        success: true,
        message: `International study abroad nomination registered (${application.applicationRef})`,
        application,
      });
    }

    if (action === "UPDATE_STATUS") {
      const { id, status } = body;
      if (!id || !status) {
        return NextResponse.json({ error: "Application ID and new status are required" }, { status: 400 });
      }

      const updated = internationalStore.updateStatus(id, status as ExchangeStatus);
      return NextResponse.json({
        success: true,
        message: `Exchange student status transitioned to ${status}`,
        application: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[International API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process international request" }, { status: 400 });
  }
}
