import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  dispatchEmergencyBroadcast,
  registerSafetyBeacon,
  getIncidentMusterStatus,
  loadIncidents,
  saveIncidents,
} from "@/lib/emergency/emergency-broadcast-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const incidentId = searchParams.get("incidentId");

    const allIncidents = loadIncidents();

    if (incidentId) {
      const target = allIncidents.find((i) => i.id === incidentId);
      if (!target) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      }
      const muster = getIncidentMusterStatus(incidentId);
      return NextResponse.json({
        success: true,
        incident: target,
        muster,
      });
    }

    // Return active and recent incidents
    const active = allIncidents.filter((i) => i.status === "ACTIVE");
    return NextResponse.json({
      success: true,
      hasActiveCrisis: active.length > 0,
      activeCrisis: active[0] || null,
      recentIncidents: allIncidents.slice(-5),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error querying emergency broadcast status", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // 1. DISPATCH_EMERGENCY (Command clearance required)
    if (action === "DISPATCH_EMERGENCY") {
      const allowedCommanders = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "HR_STAFF"];
      if (!allowedCommanders.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Campus Security or Executive clearance required to trigger mass broadcast" }, { status: 403 });
      }

      const { category, severity, headline, instructions, affectedLocations } = body;
      if (!category || !headline || !instructions) {
        return NextResponse.json({ error: "Missing required emergency broadcast parameters" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      const activatorName = user ? `${user.firstName} ${user.lastName} (${session.role})` : "Campus Incident Commander";

      const incident = dispatchEmergencyBroadcast({
        institutionId: session.institutionId || "inst-apex-01",
        category,
        severity: severity || "CRITICAL",
        headline,
        instructions,
        affectedLocations: Array.isArray(affectedLocations) ? affectedLocations : ["All Campus Zones"],
        activatedByUserId: session.userId,
        activatorName,
      });

      return NextResponse.json({
        success: true,
        message: "Mass emergency broadcast triggered across all channels with Clery seal.",
        incident,
      }, { status: 201 });
    }

    // 2. SUBMIT_BEACON (All scholars and staff can report safe/help)
    if (action === "SUBMIT_BEACON") {
      const { incidentId, status, currentLocation, latitude, longitude } = body;
      if (!incidentId || !status || !currentLocation) {
        return NextResponse.json({ error: "Missing required beacon parameters: incidentId, status, currentLocation" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      const name = user ? `${user.firstName} ${user.lastName}` : "Campus Member";

      const beacon = registerSafetyBeacon({
        incidentId,
        userId: session.userId,
        name,
        status,
        currentLocation,
        latitude,
        longitude,
      });

      return NextResponse.json({
        success: true,
        message: status === "SAFE" ? "Marked as safe on campus muster roll." : "Emergency assistance requested. Incident commanders alerted.",
        beacon,
      });
    }

    // 3. ALL_CLEAR (Resolve active incident)
    if (action === "ALL_CLEAR") {
      const allowedCommanders = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "SECURITY"];
      if (!allowedCommanders.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Executive clearance required to issue all-clear" }, { status: 403 });
      }

      const { incidentId } = body;
      const incidents = loadIncidents();
      const target = incidents.find((i) => i.id === incidentId);
      if (!target) {
        return NextResponse.json({ error: "Incident not found" }, { status: 404 });
      }

      target.status = "ALL_CLEAR";
      target.resolvedAt = new Date().toISOString();
      saveIncidents(incidents);

      return NextResponse.json({
        success: true,
        message: "Incident marked ALL_CLEAR. Normal campus operations resumed.",
        incident: target,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: DISPATCH_EMERGENCY, SUBMIT_BEACON, ALL_CLEAR" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error processing emergency broadcast action", details: String(error) },
      { status: 500 }
    );
  }
}
