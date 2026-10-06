import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { inventoryStore } from "@/lib/inventory/inventory-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access campus inventory" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const category = searchParams.get("category") || undefined;

    if (tab === "assets") {
      const assets = inventoryStore.getAssets(category);
      return NextResponse.json({ success: true, assets });
    }

    if (tab === "consumables") {
      const consumables = inventoryStore.getConsumables();
      return NextResponse.json({ success: true, consumables });
    }

    if (tab === "workorders") {
      const workOrders = inventoryStore.getWorkOrders();
      return NextResponse.json({ success: true, workOrders });
    }

    // Default: summary
    const summary = inventoryStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Inventory API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve inventory data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform inventory actions" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "ADD_ASSET") {
      const { name, category, department, locationRoom, custodianFaculty, purchaseDate, purchaseCost, serialNumber, modelNumber } = body;
      if (!name || !category || !department || !locationRoom || purchaseCost === undefined) {
        return NextResponse.json({ error: "Missing required asset registration parameters" }, { status: 400 });
      }

      const newAsset = inventoryStore.addAsset({
        name,
        category,
        department,
        locationRoom,
        custodianFaculty: custodianFaculty || session.fullName,
        purchaseDate,
        purchaseCost: Number(purchaseCost),
        serialNumber,
        modelNumber,
      });

      return NextResponse.json({ success: true, message: "Asset registered successfully", asset: newAsset });
    }

    if (action === "CREATE_WORK_ORDER") {
      const { assetId, reportedIssue, priority, assignedTechnician, estimatedCost } = body;
      if (!assetId || !reportedIssue) {
        return NextResponse.json({ error: "Asset ID and reported issue description are required" }, { status: 400 });
      }

      const order = inventoryStore.createWorkOrder({
        assetId,
        reportedIssue,
        priority: priority || "MEDIUM",
        assignedTechnician,
        estimatedCost: Number(estimatedCost) || 100,
      });

      return NextResponse.json({ success: true, message: "Maintenance work order initiated", workOrder: order });
    }

    if (action === "COMPLETE_WORK_ORDER") {
      const { orderId, actualCost, notes } = body;
      if (!orderId) {
        return NextResponse.json({ error: "Work order ID is required" }, { status: 400 });
      }

      const completed = inventoryStore.completeWorkOrder(orderId, Number(actualCost) || 0, notes);
      return NextResponse.json({ success: true, message: "Work order resolved and asset marked OPERATIONAL", workOrder: completed });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Inventory API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process inventory request" }, { status: 400 });
  }
}
