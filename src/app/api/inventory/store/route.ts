import { NextRequest, NextResponse } from "next/server";
import {
  loadStoreData,
  createStoreIndent,
  approveStoreIndentHOD,
  dispatchStoreIndent,
  acknowledgeIndentReceipt,
  receiveStockOrder,
  getStoreAnalytics,
} from "@/lib/inventory/store-engine";

export async function GET(req: NextRequest) {
  try {
    const data = loadStoreData();
    const analytics = getStoreAnalytics();
    return NextResponse.json({
      success: true,
      items: data.items,
      indents: data.indents,
      movements: data.movements,
      analytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch store operations" },
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

    if (action === "CREATE_INDENT") {
      const {
        department,
        indentorId,
        indentorName,
        indentorRole,
        purpose,
        examSessionCode,
        items,
      } = body;

      if (!department || !indentorId || !purpose || !items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json(
          { success: false, error: "Missing required indent fields or line items" },
          { status: 400 }
        );
      }

      const indent = createStoreIndent({
        department,
        indentorId,
        indentorName: indentorName || "Faculty Indentor",
        indentorRole: indentorRole || "Assistant Professor",
        purpose,
        examSessionCode,
        items,
      });

      return NextResponse.json({
        success: true,
        message: "Store indent requisition logged successfully. Awaiting HOD endorsement.",
        indent,
      }, { status: 201 });
    }

    if (action === "APPROVE_HOD") {
      const { indentId, approvedBy, remarks } = body;
      if (!indentId) {
        return NextResponse.json(
          { success: false, error: "indentId is required" },
          { status: 400 }
        );
      }

      const indent = approveStoreIndentHOD({
        indentId,
        approvedBy: approvedBy || "Head of Department",
        remarks: remarks || "Departmental necessity verified. Endorsed for store dispatch.",
      });

      return NextResponse.json({
        success: true,
        message: "Indent endorsed by HOD successfully.",
        indent,
      });
    }

    if (action === "DISPATCH_STORE") {
      const { indentId, dispatchedBy, dispatches } = body;
      if (!indentId || !dispatches || !Array.isArray(dispatches)) {
        return NextResponse.json(
          { success: false, error: "indentId and dispatches list are required" },
          { status: 400 }
        );
      }

      const indent = dispatchStoreIndent({
        indentId,
        dispatchedBy: dispatchedBy || "Central Storekeeper",
        dispatches,
      });

      return NextResponse.json({
        success: true,
        message: "Store items dispatched, barcode serialized ranges logged, and stock deducted.",
        indent,
      });
    }

    if (action === "RECEIVE_INDENT") {
      const { indentId, receivedBy, remarks } = body;
      if (!indentId) {
        return NextResponse.json(
          { success: false, error: "indentId is required" },
          { status: 400 }
        );
      }

      const indent = acknowledgeIndentReceipt({
        indentId,
        receivedBy: receivedBy || "Department Representative",
        remarks: remarks || "Materials physically checked and taken into departmental stock.",
      });

      return NextResponse.json({
        success: true,
        message: "Indent fulfilled and physically acknowledged.",
        indent,
      });
    }

    if (action === "RECEIVE_STOCK") {
      const { itemId, receivedQuantity, poReference } = body;
      if (!itemId || !receivedQuantity) {
        return NextResponse.json(
          { success: false, error: "itemId and receivedQuantity are required" },
          { status: 400 }
        );
      }

      const item = receiveStockOrder({
        itemId,
        receivedQuantity: Number(receivedQuantity),
        poReference: poReference || `PO-APEX-2026-${Date.now().toString().slice(-4)}`,
      });

      return NextResponse.json({
        success: true,
        message: "Stock replenishment received and inventory ledger credited.",
        item,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid action: ${action}` },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process store action" },
      { status: 500 }
    );
  }
}
