import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSubscription,
  verifyWebhookSignature,
  getWhatsAppOutbox,
  sendWhatsAppMessage,
  processMetaWebhookEvent,
  WhatsAppMessageParams,
} from "@/lib/communication/whatsapp-service";
import { requireRoleAuth, STAFF_ROLES } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/communication/whatsapp
 * Serves both Meta Webhook verification handshake and administrative outbox telemetry
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hubMode = searchParams.get("hub.mode");
  const hubChallenge = searchParams.get("hub.challenge");
  const hubVerifyToken = searchParams.get("hub.verify_token");

  // 1. Meta Webhook Verification Handshake
  if (hubMode || hubChallenge) {
    const verification = verifyWebhookSubscription(hubMode, hubVerifyToken);
    if (!verification.valid) {
      logger.security("WHATSAPP_WEBHOOK_VERIFY_FAILED", "meta-crawler", {
        error: verification.error,
        ip: req.headers.get("x-forwarded-for") || "unknown",
      });
      return new NextResponse(verification.error || "Verification failed", { status: 403 });
    }

    // Return plain text challenge as required by Meta specifications
    return new NextResponse(hubChallenge || "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // 2. Staff / Admin Telemetry and Outbox Ledger Retrieval
  const auth = await requireRoleAuth(req, STAFF_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const outbox = getWhatsAppOutbox();

    const stats = {
      totalMessages: outbox.length,
      deliveredCount: outbox.filter((m) => m.status === "DELIVERED" || m.status === "READ").length,
      readCount: outbox.filter((m) => m.status === "READ").length,
      failedCount: outbox.filter((m) => m.status === "FAILED").length,
      templateBreakdown: outbox.reduce((acc: Record<string, number>, m) => {
        acc[m.templateName] = (acc[m.templateName] || 0) + 1;
        return acc;
      }, {}),
      relayMode: process.env.WHATSAPP_ACCESS_TOKEN ? "LIVE_META_CLOUD_API" : "INTERNAL_VERIFIED_OUTBOX",
    };

    return NextResponse.json({
      success: true,
      stats,
      outbox,
    });
  } catch (error: any) {
    logger.error("Failed to retrieve WhatsApp outbox telemetry", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve WhatsApp telemetry" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communication/whatsapp
 * Handles incoming Meta webhook callbacks (delivery receipts, inbound replies)
 * AND internal outbound WhatsApp notifications dispatched by faculty / admin
 */
export async function POST(req: NextRequest) {
  const signatureHeader = req.headers.get("x-hub-signature-256");

  // A. Meta Webhook Event Callback (Delivery receipts / inbound messages)
  if (signatureHeader) {
    const rawBody = await req.text();
    const isValidSignature = verifyWebhookSignature(rawBody, signatureHeader);

    if (!isValidSignature) {
      logger.security("WHATSAPP_WEBHOOK_SIGNATURE_INVALID", "meta-webhook", {
        signature: signatureHeader,
      });
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }

    try {
      const payload = JSON.parse(rawBody);
      const result = processMetaWebhookEvent(payload);

      logger.info("WhatsApp webhook event processed", {
        processedCount: result.processedCount,
        statusUpdates: result.statusUpdates,
      });

      return NextResponse.json({
        success: true,
        processed: result.processedCount,
        updates: result.statusUpdates,
      });
    } catch (err: any) {
      logger.error("Failed to process WhatsApp webhook payload", err);
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  // B. Internal Outbound Dispatch API (Authenticated staff & administrators)
  const auth = await requireRoleAuth(req, STAFF_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      recipientPhone,
      recipientName,
      recipientRole = "PARENT",
      templateName,
      parameters = {},
      languageCode = "en_US",
    } = body;

    if (!recipientPhone || !templateName) {
      return NextResponse.json(
        { error: "recipientPhone and templateName are mandatory parameters" },
        { status: 400 }
      );
    }

    const dispatchParams: WhatsAppMessageParams = {
      recipientPhone,
      recipientName,
      recipientRole,
      templateName,
      parameters,
      languageCode,
    };

    const result = await sendWhatsAppMessage(dispatchParams);

    // Record system audit log
    await logAuditEvent({
      institutionId: auth.payload.institutionId || "inst-apex-01",
      actorUserId: auth.payload.userId || "staff",
      action: "WHATSAPP_DISPATCH",
      targetEntity: "ParentNotification",
      targetId: result.messageId,
      details: {
        recipientPhone,
        templateName,
        wamid: result.wamid,
      },
    });

    return NextResponse.json({
      success: true,
      message: `WhatsApp message dispatched successfully (${templateName})`,
      messageId: result.messageId,
      wamid: result.wamid,
      recipientPhone: result.recipientPhone,
      status: result.status,
    });
  } catch (error: any) {
    logger.error("Failed to dispatch WhatsApp message", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch WhatsApp message" },
      { status: 500 }
    );
  }
}
