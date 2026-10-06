import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { securityStore } from "@/lib/security/security-store";
import { PassStatus } from "@/lib/security/security-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access security portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const status = (searchParams.get("status") as PassStatus) || undefined;

    if (tab === "gates") {
      const gates = securityStore.getGates();
      return NextResponse.json({ success: true, gates });
    }

    if (tab === "passes") {
      const passes = securityStore.getPasses(status);
      return NextResponse.json({ success: true, passes });
    }

    const summary = securityStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Security API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve security data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform security operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "ISSUE_PASS") {
      const {
        visitorName,
        contactPhone,
        idProofType,
        idProofNumber,
        visitorType,
        hostName,
        hostDepartment,
        purposeOfVisit,
        vehicleNumber,
        entryGate,
        validUntil,
      } = body;

      if (!visitorName || !contactPhone || !hostName || !purposeOfVisit) {
        return NextResponse.json(
          { error: "Visitor name, phone, host name, and purpose are required" },
          { status: 400 }
        );
      }

      const pass = securityStore.issuePass({
        visitorName,
        contactPhone,
        idProofType,
        idProofNumber,
        visitorType,
        hostName,
        hostDepartment,
        purposeOfVisit,
        vehicleNumber,
        entryGate,
        validUntil,
      });

      return NextResponse.json({
        success: true,
        message: `Visitor pass issued successfully (${pass.passNumber})`,
        pass,
      });
    }

    if (action === "CHECK_OUT") {
      const { passId } = body;
      if (!passId) {
        return NextResponse.json({ error: "Pass ID is required to record check-out" }, { status: 400 });
      }

      const pass = securityStore.checkOutVisitor(passId);
      return NextResponse.json({
        success: true,
        message: `Visitor ${pass.visitorName} checked out successfully.`,
        pass,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Security API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process security request" }, { status: 400 });
  }
}
