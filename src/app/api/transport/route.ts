import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { transportStore } from "@/lib/transport/transport-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access transport fleet" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "routes") {
      const routes = transportStore.getRoutes();
      return NextResponse.json({ success: true, routes });
    }

    if (tab === "passes") {
      const passes = transportStore.getPasses();
      return NextResponse.json({ success: true, passes });
    }

    if (tab === "maintenance") {
      const maintenance = transportStore.getMaintenance();
      return NextResponse.json({ success: true, maintenance });
    }

    // Default: summary
    const summary = transportStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Transport API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve transport data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to execute transport action" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "ISSUE_PASS") {
      const { studentId, studentName, studentRoll, routeId, stopName, feeAmount } = body;
      if (!studentName || !studentRoll || !routeId || !stopName) {
        return NextResponse.json({ error: "Missing required bus pass fields" }, { status: 400 });
      }

      const pass = transportStore.issueBusPass({
        studentId: studentId || session.id,
        studentName,
        studentRoll,
        routeId,
        stopName,
        feeAmount: feeAmount || 450,
      });

      return NextResponse.json({ success: true, message: "Digital transit pass issued successfully", pass });
    }

    if (action === "UPDATE_TELEMETRY") {
      const { vehicleId, updates } = body;
      if (!vehicleId || !updates) {
        return NextResponse.json({ error: "Vehicle ID and telemetry updates required" }, { status: 400 });
      }

      const vehicle = transportStore.updateVehicleTelemetry(vehicleId, updates);
      return NextResponse.json({ success: true, message: "Vehicle telemetry refreshed", vehicle });
    }

    if (action === "RECORD_MAINTENANCE") {
      const { vehicleId, vehicleCode, serviceType, date, odometerKm, cost, workshopName, notes } = body;
      if (!vehicleId || !serviceType || !date) {
        return NextResponse.json({ error: "Vehicle ID, service type and date are required" }, { status: 400 });
      }

      const rec = transportStore.addMaintenanceRecord({
        vehicleId,
        vehicleCode: vehicleCode || "BUS",
        serviceType,
        date,
        odometerKm: Number(odometerKm) || 0,
        cost: Number(cost) || 0,
        workshopName: workshopName || "Authorized Depot",
        notes: notes || "",
      });

      return NextResponse.json({ success: true, message: "Maintenance service logged successfully", record: rec });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Transport API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process transport request" }, { status: 400 });
  }
}
