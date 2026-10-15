import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  getAllInspections,
  recordMoveIn,
  conductMoveOutAudit,
  getHostelInventoryAnalytics,
} from "@/lib/hostel/hostel-inventory-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const inspections = getAllInspections();
    const analytics = getHostelInventoryAnalytics();
    return NextResponse.json({
      success: true,
      count: inspections.length,
      inspections,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in GET /api/hostel/inventory-audit:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch hostel room inspections" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const HOSTEL_AUDIT_ROLES = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HR_STAFF", "FACULTY"];
    if (!HOSTEL_AUDIT_ROLES.includes(session.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Only hostel administration and wardens can conduct audits" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required ('CREATE_MOVE_IN', 'CONDUCT_MOVE_OUT_AUDIT')" },
        { status: 400 }
      );
    }

    if (action === "CREATE_MOVE_IN") {
      const {
        studentId,
        studentName,
        rollNo,
        roomNumber,
        blockName,
        academicYear,
        cautionDepositAmount,
        assets,
      } = body;

      if (!studentName || !rollNo || !roomNumber || !blockName) {
        return NextResponse.json(
          { success: false, error: "Missing required fields for room move-in baseline" },
          { status: 400 }
        );
      }

      const inspection = recordMoveIn({
        studentId: studentId || `STU-${Date.now().toString(36)}`,
        studentName,
        rollNo,
        roomNumber,
        blockName,
        academicYear,
        cautionDepositAmount: cautionDepositAmount ? Number(cautionDepositAmount) : 500,
        assets,
      });

      return NextResponse.json({
        success: true,
        message: `Move-in asset audit registered for Room ${roomNumber}`,
        inspection,
      });
    }

    if (action === "CONDUCT_MOVE_OUT_AUDIT") {
      const { inspectionId, assets, wardenName, wardenNotes } = body;
      if (!inspectionId || !assets) {
        return NextResponse.json(
          { success: false, error: "inspectionId and assets checklist are required" },
          { status: 400 }
        );
      }

      const audit = conductMoveOutAudit(
        inspectionId,
        assets,
        wardenName || "Chief Warden Dr. H. C. Verma",
        wardenNotes
      );

      return NextResponse.json({
        success: true,
        message: `Move-out clearance completed with seal for Room ${audit.roomNumber}`,
        inspection: audit,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/hostel/inventory-audit:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process inventory audit request" },
      { status: 500 }
    );
  }
}
