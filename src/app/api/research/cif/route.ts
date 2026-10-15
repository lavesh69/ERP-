import { NextRequest, NextResponse } from "next/server";
import {
  loadCIFData,
  requestCIFSlot,
  clearCIFSafety,
  confirmCIFSlot,
  completeCIFRun,
  logCIFCalibration,
  getCIFAnalytics,
} from "@/lib/research/cif-engine";

export async function GET(req: NextRequest) {
  try {
    const data = loadCIFData();
    const analytics = getCIFAnalytics();
    return NextResponse.json({
      success: true,
      instruments: data.instruments,
      bookings: data.bookings,
      calibrations: data.calibrations,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch CIF operations" },
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
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    if (action === "REQUEST_SLOT") {
      const {
        instrumentId,
        userId,
        userName,
        userEmail,
        userCategory,
        departmentOrOrg,
        grantCode,
        supervisorName,
        bookingDate,
        timeSlot,
        sampleCount,
        sampleState,
        hazardLevel,
        safetyDeclarationAccepted,
        samplePrepRequired,
        samplePrepDetails,
      } = body;

      if (!instrumentId || !userId || !bookingDate || !timeSlot) {
        return NextResponse.json(
          { success: false, error: "Missing required booking fields" },
          { status: 400 }
        );
      }

      const booking = requestCIFSlot({
        instrumentId,
        userId,
        userName: userName || "Institutional Scholar",
        userEmail: userEmail || "scholar@apex.edu",
        userCategory: userCategory || "INTERNAL_SCHOLAR",
        departmentOrOrg: departmentOrOrg || "Engineering & Technology",
        grantCode,
        supervisorName,
        bookingDate,
        timeSlot,
        sampleCount: Number(sampleCount) || 1,
        sampleState: sampleState || "SOLID_POWDER",
        hazardLevel: hazardLevel || "NON_HAZARDOUS",
        safetyDeclarationAccepted: Boolean(safetyDeclarationAccepted),
        samplePrepRequired: Boolean(samplePrepRequired),
        samplePrepDetails,
      });

      return NextResponse.json({
        success: true,
        message: "CIF slot requisition submitted successfully. Awaiting safety clearance.",
        booking,
      }, { status: 201 });
    }

    if (action === "CLEAR_SAFETY") {
      const { bookingId, clearedBy, remarks } = body;
      if (!bookingId) {
        return NextResponse.json(
          { success: false, error: "bookingId is required" },
          { status: 400 }
        );
      }

      const booking = clearCIFSafety({
        bookingId,
        clearedBy: clearedBy || "CIF Chemical & Bio Safety Committee",
        remarks: remarks || "Sample declared non-hazardous and approved for testing.",
      });

      return NextResponse.json({
        success: true,
        message: "Safety clearance stamped successfully.",
        booking,
      });
    }

    if (action === "CONFIRM_SLOT") {
      const { bookingId, assignedOperator } = body;
      if (!bookingId) {
        return NextResponse.json(
          { success: false, error: "bookingId is required" },
          { status: 400 }
        );
      }

      const booking = confirmCIFSlot({
        bookingId,
        assignedOperator: assignedOperator || "Dr. Rajesh Sharma (Sr. Scientific Officer)",
      });

      return NextResponse.json({
        success: true,
        message: "Slot confirmed and cryptographic access token minted.",
        booking,
      });
    }

    if (action === "COMPLETE_RUN") {
      const { bookingId, beamHoursUsed, dataFileUrls, operatorSignature } = body;
      if (!bookingId) {
        return NextResponse.json(
          { success: false, error: "bookingId is required" },
          { status: 400 }
        );
      }

      const booking = completeCIFRun({
        bookingId,
        beamHoursUsed: Number(beamHoursUsed) || 3.5,
        dataFileUrls: dataFileUrls || ["/cif/data/export_raw_01.dat"],
        operatorSignature: operatorSignature || "Dr. Rajesh Sharma, SSO",
      });

      return NextResponse.json({
        success: true,
        message: "Analysis run completed, beam hours logged, and cryptographic seal affixed.",
        booking,
      });
    }

    if (action === "LOG_CALIBRATION") {
      const {
        instrumentId,
        calibrationType,
        calibrationAgency,
        technicianName,
        status,
        certificateNumber,
        notes,
      } = body;

      if (!instrumentId) {
        return NextResponse.json(
          { success: false, error: "instrumentId is required" },
          { status: 400 }
        );
      }

      const log = logCIFCalibration({
        instrumentId,
        calibrationType: calibrationType || "ROUTINE_PREVENTATIVE",
        calibrationAgency: calibrationAgency || "OEM Certified Calibration Engineers",
        technicianName: technicianName || "Er. Certified Metrology Officer",
        status: status || "PASSED",
        certificateNumber: certificateNumber || `NABL-CAL-${Date.now()}`,
        notes: notes || "Instrument optics and sensors aligned within tolerances.",
      });

      return NextResponse.json({
        success: true,
        message: "Instrument calibration log registered and validity extended.",
        log,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process CIF action" },
      { status: 500 }
    );
  }
}
