import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { integrationHub, IntegrationCategory } from "@/lib/integrations/integration-hub";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to inspect enterprise integrations" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = (searchParams.get("category") as IntegrationCategory) || undefined;

    const connectors = integrationHub.getConnectors(category);
    const summary = {
      totalConnectors: connectors.length,
      liveCount: connectors.filter((c) => c.status === "CONFIGURED_LIVE").length,
      sandboxActiveCount: connectors.filter((c) => c.status === "SANDBOX_ACTIVE").length,
      unconfiguredCount: connectors.filter((c) => c.status === "UNCONFIGURED").length,
    };

    return NextResponse.json({
      success: true,
      summary,
      connectors,
    });
  } catch (error: any) {
    logger.error("GET /api/integrations error", error);
    return NextResponse.json({ error: error.message || "Failed to load integrations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform integration diagnostics" }, { status: 401 });
    }

    const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL"].includes(session.role);
    if (!isStaffOrAdmin) {
      return NextResponse.json({ error: "Forbidden: Administrative clearance required for integration testing" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "PING_TEST") {
      const { connectorId } = body;
      if (!connectorId) {
        return NextResponse.json({ error: "connectorId is required for connection testing" }, { status: 400 });
      }

      const pingResult = integrationHub.testConnectorPing(connectorId);
      return NextResponse.json({
        ...pingResult,
      });
    }

    if (action === "VERIFY_WEBHOOK") {
      const { payload, signature, secret } = body;
      if (!payload || !signature || !secret) {
        return NextResponse.json({ error: "payload, signature, and secret are required" }, { status: 400 });
      }

      const isValid = integrationHub.verifyWebhookHMAC(payload, signature, secret);
      return NextResponse.json({
        success: true,
        isValid,
        algorithm: "HMAC-SHA256",
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    logger.error("POST /api/integrations error", error);
    return NextResponse.json({ error: error.message || "Failed to execute integration operation" }, { status: 400 });
  }
}
