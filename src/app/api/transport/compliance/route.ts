import { NextRequest, NextResponse } from "next/server";
import {
  getAllComplianceRecords,
  inspectAndCertifyRoadworthiness,
  updateComplianceCertificates,
  getFleetComplianceAnalytics,
} from "@/lib/transport/fleet-compliance-engine";

export async function GET() {
  try {
    const records = getAllComplianceRecords();
    const analytics = getFleetComplianceAnalytics();
    return NextResponse.json({
      success: true,
      count: records.length,
      records,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in GET /api/transport/compliance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch fleet compliance records" },
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
        { success: false, error: "Action is required ('INSPECT_AND_CERTIFY', 'UPDATE_DOCUMENTS')" },
        { status: 400 }
      );
    }

    if (action === "INSPECT_AND_CERTIFY") {
      const { vehicleId, officerName, inspectionNotes } = body;
      if (!vehicleId) {
        return NextResponse.json({ success: false, error: "vehicleId is required" }, { status: 400 });
      }

      const certified = inspectAndCertifyRoadworthiness(
        vehicleId,
        officerName || "Transport Safety Director Major K. S. Rao",
        inspectionNotes
      );

      return NextResponse.json({
        success: true,
        message: `Roadworthiness inspection recorded for ${certified.busNumber}`,
        record: certified,
      });
    }

    if (action === "UPDATE_DOCUMENTS") {
      const { vehicleId, ...updates } = body;
      if (!vehicleId) {
        return NextResponse.json({ success: false, error: "vehicleId is required" }, { status: 400 });
      }

      const updated = updateComplianceCertificates(vehicleId, updates);
      return NextResponse.json({
        success: true,
        message: `Certificates updated for ${updated.busNumber}`,
        record: updated,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/transport/compliance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process fleet compliance request" },
      { status: 500 }
    );
  }
}
