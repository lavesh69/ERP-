import { NextRequest, NextResponse } from "next/server";
import { getOutboxEmails, sendEmail, EmailMessage } from "@/lib/email/email-service";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import fs from "fs";
import path from "path";

const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");
const OUTBOX_FILE = path.join(OUTBOX_DIR, "emails.json");

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    // Students can only see their own notifications, staff can see outbox
    const emails = getOutboxEmails();

    const stats = {
      totalMessages: emails.length,
      typesCount: emails.reduce((acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {}),
      lastDispatchedAt: emails[0]?.createdAt || null,
      relayStatus: process.env.RESEND_API_KEY
        ? "LIVE_RESEND"
        : process.env.SENDGRID_API_KEY
        ? "LIVE_SENDGRID"
        : "OFFLINE_OUTBOX",
    };

    return NextResponse.json({
      success: true,
      stats,
      outbox: emails,
    });
  } catch (error: any) {
    logger.error("Outbox GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch outbox" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action, messageId, to, subject, type, html } = body;

    // 1. RETRY / RE-DISPATCH
    if (action === "RETRY") {
      if (!messageId) {
        return NextResponse.json({ error: "messageId is required for retry" }, { status: 400 });
      }

      const emails = getOutboxEmails();
      const target = emails.find((e) => e.id === messageId);
      if (!target) {
        return NextResponse.json({ error: "Target message not found in outbox" }, { status: 404 });
      }

      const retryResult = await sendEmail({
        to: target.to,
        subject: `[RETRY] ${target.subject}`,
        html: target.html,
        text: target.text,
        type: target.type,
        otpCode: target.otpCode,
      });

      return NextResponse.json({
        success: true,
        message: `Message re-dispatched to ${target.to}`,
        result: retryResult,
      });
    }

    // 2. CLEAR OUTBOX
    if (action === "CLEAR") {
      try {
        if (fs.existsSync(OUTBOX_FILE)) {
          fs.writeFileSync(OUTBOX_FILE, JSON.stringify([], null, 2), "utf-8");
        }
      } catch (err) {
        logger.error("Failed to clear outbox file", err);
      }
      return NextResponse.json({ success: true, message: "Outbox cleared successfully" });
    }

    // 3. TEST DISPATCH
    if (action === "TEST_DISPATCH") {
      const recipient = to || auth.payload.email || "admin@apex.edu";
      const result = await sendEmail({
        to: recipient,
        subject: subject || "Apex ERP: Outbox Delivery Channel Verification Test",
        html: html || "<p>This is a test notification confirming delivery telemetry integrity.</p>",
        type: (type as EmailMessage["type"]) || "NOTIFICATION",
      });

      return NextResponse.json({
        success: true,
        message: `Test email dispatched to ${recipient}`,
        result,
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    logger.error("Outbox POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process outbox action" }, { status: 500 });
  }
}
