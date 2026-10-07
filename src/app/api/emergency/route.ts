import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { emergencyStore } from "@/lib/emergency/emergency-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access emergency portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "alerts") {
      const alerts = emergencyStore.getAlerts();
      return NextResponse.json({ success: true, alerts });
    }

    if (tab === "muster") {
      const musterPoints = emergencyStore.getMusterPoints();
      return NextResponse.json({ success: true, musterPoints });
    }

    const summary = emergencyStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Emergency API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve emergency data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to dispatch emergency alert" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "BROADCAST_ALERT") {
      const { category, severity, headline, instructions, affectedZones, dispatchedChannels } = body;

      const alert = emergencyStore.broadcastAlert({
        category,
        severity,
        headline,
        instructions,
        affectedZones,
        dispatchedChannels,
        initiatedBy: session.fullName || "Incident Commander",
      });

      return NextResponse.json({
        success: true,
        message: `EMERGENCY BROADCAST DISPATCHED ACROSS CHANNELS (${alert.alertCode})`,
        alert,
      });
    }

    if (action === "RESOLVE_ALERT") {
      const { id, allClearNotes } = body;
      if (!id) {
        return NextResponse.json({ error: "Alert ID is required" }, { status: 400 });
      }

      const resolved = emergencyStore.resolveAlert(id, allClearNotes);
      return NextResponse.json({
        success: true,
        message: `Alert ${resolved.alertCode} marked ALL CLEAR`,
        alert: resolved,
      });
    }

    if (action === "UPDATE_MUSTER") {
      const { id, count, status } = body;
      if (!id) {
        return NextResponse.json({ error: "Muster point ID is required" }, { status: 400 });
      }

      const point = emergencyStore.updateMusterPoint(id, Number(count) || 0, status || "SAFE_ASSEMBLED");
      return NextResponse.json({
        success: true,
        message: `Muster point telemetry updated`,
        point,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Emergency API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process emergency request" }, { status: 400 });
  }
}
