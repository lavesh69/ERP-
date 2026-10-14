import { NextRequest, NextResponse } from "next/server";
import {
  getAllHealthPassports,
  updateImmunization,
  certifyMedicalFitness,
  getHealthClearanceAnalytics,
} from "@/lib/clinic/medical-clearance-engine";

export async function GET() {
  try {
    const passports = getAllHealthPassports();
    const analytics = getHealthClearanceAnalytics();
    return NextResponse.json({
      success: true,
      count: passports.length,
      passports,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in GET /api/clinic/medical-clearance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student health passports" },
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
        { success: false, error: "Action is required ('UPDATE_IMMUNIZATION', 'CERTIFY_FITNESS')" },
        { status: 400 }
      );
    }

    if (action === "UPDATE_IMMUNIZATION") {
      const { studentId, vaccineName, doseDate } = body;
      if (!studentId || !vaccineName) {
        return NextResponse.json(
          { success: false, error: "studentId and vaccineName are required" },
          { status: 400 }
        );
      }

      const updated = updateImmunization(
        studentId,
        vaccineName,
        doseDate || new Date().toISOString().split("T")[0]
      );

      return NextResponse.json({
        success: true,
        message: `Immunization record updated for ${updated.studentName}`,
        passport: updated,
      });
    }

    if (action === "CERTIFY_FITNESS") {
      const { studentId, officerName, fitnessCategory, physicianNotes } = body;
      if (!studentId || !fitnessCategory) {
        return NextResponse.json(
          { success: false, error: "studentId and fitnessCategory are required" },
          { status: 400 }
        );
      }

      const certified = certifyMedicalFitness(
        studentId,
        officerName || "Dr. Arvind Swaminathan, MD (Chief Medical Officer)",
        fitnessCategory,
        physicianNotes
      );

      return NextResponse.json({
        success: true,
        message: `Medical fitness certificate issued for ${certified.studentName}`,
        passport: certified,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/clinic/medical-clearance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process medical clearance request" },
      { status: 500 }
    );
  }
}
