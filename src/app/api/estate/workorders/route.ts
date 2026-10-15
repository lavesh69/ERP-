import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  loadEstateData,
  raiseEstateWorkOrder,
  assignEstateEngineer,
  startEstateWork,
  completeEstateWork,
  closeEstateWorkOrder,
  logPreventiveMaintenance,
  getEstateAnalytics,
} from "@/lib/estate/estate-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const data = loadEstateData();
    const analytics = getEstateAnalytics();
    return NextResponse.json({
      success: true,
      assets: data.assets,
      workOrders: data.workOrders,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch estate operations" },
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

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required" },
        { status: 400 }
      );
    }

    const ESTATE_STAFF_ROLES = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "HR_STAFF", "FACULTY"];
    if (["ASSIGN_ENGINEER", "START_WORK", "COMPLETE_WORK", "LOG_PREVENTIVE"].includes(action)) {
      if (!ESTATE_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Estate operations require maintenance staff clearance" },
          { status: 403 }
        );
      }
    }

    if (action === "RAISE_WORK_ORDER") {
      const {
        discipline,
        priority,
        location,
        issueTitle,
        issueDescription,
        requesterId,
        requesterName,
        requesterDepartment,
      } = body;

      if (!discipline || !priority || !location || !issueTitle || !requesterId) {
        return NextResponse.json(
          { success: false, error: "Missing required work order fields" },
          { status: 400 }
        );
      }

      const order = raiseEstateWorkOrder({
        discipline,
        priority,
        location,
        issueTitle,
        issueDescription: issueDescription || issueTitle,
        requesterId,
        requesterName: requesterName || "Campus Faculty / Staff",
        requesterDepartment: requesterDepartment || "General Administration",
      });

      return NextResponse.json({
        success: true,
        message: "Work order registered with statutory SLA timer.",
        workOrder: order,
      }, { status: 201 });
    }

    if (action === "ASSIGN_ENGINEER") {
      const { workOrderId, engineerName, engineerRole, estimatedMaterialCost } = body;
      if (!workOrderId || !engineerName) {
        return NextResponse.json(
          { success: false, error: "workOrderId and engineerName are required" },
          { status: 400 }
        );
      }

      const order = assignEstateEngineer({
        workOrderId,
        engineerName,
        engineerRole: engineerRole || "Junior Engineer (JE)",
        estimatedMaterialCost: Number(estimatedMaterialCost) || 0,
      });

      return NextResponse.json({
        success: true,
        message: "Junior Engineer assigned to work order successfully.",
        workOrder: order,
      });
    }

    if (action === "START_WORK") {
      const { workOrderId, materialsBOQ } = body;
      if (!workOrderId) {
        return NextResponse.json(
          { success: false, error: "workOrderId is required" },
          { status: 400 }
        );
      }

      const order = startEstateWork({
        workOrderId,
        materialsBOQ: materialsBOQ || [],
      });

      return NextResponse.json({
        success: true,
        message: "Work marked in progress with materials BOQ requisition.",
        workOrder: order,
      });
    }

    if (action === "COMPLETE_WORK") {
      const { workOrderId, actualCost, engineerNotes } = body;
      if (!workOrderId) {
        return NextResponse.json(
          { success: false, error: "workOrderId is required" },
          { status: 400 }
        );
      }

      const order = completeEstateWork({
        workOrderId,
        actualCost: Number(actualCost) || 0,
        engineerNotes: engineerNotes || "Maintenance work completed and verified operational.",
      });

      return NextResponse.json({
        success: true,
        message: "Work completion certified with cryptographic seal.",
        inventoryStockReconciled: order.completionDetails?.inventoryStockReconciled || false,
        workOrder: order,
      });
    }

    if (action === "CLOSE_ORDER") {
      const { workOrderId, ratingStars, satisfactionFeedback } = body;
      if (!workOrderId) {
        return NextResponse.json(
          { success: false, error: "workOrderId is required" },
          { status: 400 }
        );
      }

      const order = closeEstateWorkOrder({
        workOrderId,
        ratingStars: Number(ratingStars) || 5,
        satisfactionFeedback: satisfactionFeedback || "Service satisfactory.",
      });

      return NextResponse.json({
        success: true,
        message: "Work order closed and verified by requester.",
        workOrder: order,
      });
    }

    if (action === "LOG_PREVENTIVE") {
      const { assetId, servicedDate, nextDueDate, notes } = body;
      if (!assetId) {
        return NextResponse.json(
          { success: false, error: "assetId is required" },
          { status: 400 }
        );
      }

      const today = new Date().toISOString().split("T")[0];
      const defaultNext = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];

      const asset = logPreventiveMaintenance({
        assetId,
        servicedDate: servicedDate || today,
        nextDueDate: nextDueDate || defaultNext,
        notes: notes || "Quarterly routine servicing completed.",
      });

      return NextResponse.json({
        success: true,
        message: "Preventive maintenance logged and equipment certified.",
        asset,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process estate action" },
      { status: 500 }
    );
  }
}
