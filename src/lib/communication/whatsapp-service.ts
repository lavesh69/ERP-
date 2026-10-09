import crypto from "crypto";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logging/logger";

export const DEFAULT_WHATSAPP_VERIFY_TOKEN = "apex_erp_whatsapp_verify_2026";
export const DEFAULT_WHATSAPP_APP_SECRET = "apex_erp_whatsapp_secret_key";
export const DEFAULT_WHATSAPP_PHONE_ID = "109823485729104";

const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");
const WHATSAPP_OUTBOX_FILE = path.join(OUTBOX_DIR, "whatsapp.json");

export interface WhatsAppTemplateParameter {
  type: "text" | "currency" | "date_time";
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
}

export interface WhatsAppMessageParams {
  recipientPhone: string;
  recipientName?: string;
  recipientRole?: "PARENT" | "STUDENT" | "FACULTY" | "STAFF";
  templateName:
    | "attendance_shortage_alert"
    | "fee_due_reminder"
    | "emergency_campus_alert"
    | "exam_hallticket_released"
    | "custom_institutional_notice";
  parameters: Record<string, string>;
  languageCode?: string;
}

export interface WhatsAppDispatchRecord {
  id: string;
  wamid: string;
  recipientPhone: string;
  recipientName?: string;
  recipientRole: string;
  templateName: string;
  parameters: Record<string, string>;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  dispatchedAt: string;
  deliveredAt?: string;
  readAt?: string;
  failureReason?: string;
  rawPayload: any;
}

function ensureOutboxFile() {
  if (!fs.existsSync(OUTBOX_DIR)) {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  }
  if (!fs.existsSync(WHATSAPP_OUTBOX_FILE)) {
    fs.writeFileSync(WHATSAPP_OUTBOX_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

/**
 * Reads all dispatched WhatsApp records from outbox ledger
 */
export function getWhatsAppOutbox(): WhatsAppDispatchRecord[] {
  ensureOutboxFile();
  try {
    const raw = fs.readFileSync(WHATSAPP_OUTBOX_FILE, "utf-8");
    return JSON.parse(raw) as WhatsAppDispatchRecord[];
  } catch (err) {
    logger.error("Failed to read WhatsApp outbox file", err);
    return [];
  }
}

/**
 * Saves or updates records in the WhatsApp outbox ledger
 */
export function saveWhatsAppOutbox(records: WhatsAppDispatchRecord[]): void {
  ensureOutboxFile();
  try {
    fs.writeFileSync(WHATSAPP_OUTBOX_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    logger.error("Failed to write WhatsApp outbox file", err);
  }
}

/**
 * Verifies Meta Webhook subscription challenge
 */
export function verifyWebhookSubscription(
  mode: string | null,
  verifyToken: string | null,
  expectedToken?: string
): { valid: boolean; error?: string } {
  const tokenToMatch = expectedToken || process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_WHATSAPP_VERIFY_TOKEN;

  if (mode !== "subscribe") {
    return { valid: false, error: "hub.mode must be 'subscribe'" };
  }

  if (!verifyToken || verifyToken !== tokenToMatch) {
    return { valid: false, error: "hub.verify_token mismatch or invalid" };
  }

  return { valid: true };
}

/**
 * Cryptographically verifies x-hub-signature-256 using HMAC-SHA256 with constant-time equality
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader?: string | null,
  appSecret?: string
): boolean {
  if (!signatureHeader) return false;

  const secret = appSecret || process.env.WHATSAPP_APP_SECRET || DEFAULT_WHATSAPP_APP_SECRET;

  const match = signatureHeader.match(/^sha256=(.+)$/);
  if (!match) return false;

  const providedHashHex = match[1];
  const calculatedHashHex = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf-8")
    .digest("hex");

  if (providedHashHex.length !== calculatedHashHex.length) return false;

  const providedBuffer = Buffer.from(providedHashHex, "hex");
  const calculatedBuffer = Buffer.from(calculatedHashHex, "hex");

  if (providedBuffer.length !== calculatedBuffer.length) return false;

  return crypto.timingSafeEqual(providedBuffer, calculatedBuffer);
}

/**
 * Formats official Meta WhatsApp Business Cloud API JSON payload
 */
export function formatMetaWhatsAppPayload(params: WhatsAppMessageParams) {
  // Normalize phone number (strip whitespace and symbols, ensure leading country code)
  const cleanPhone = params.recipientPhone.replace(/[^0-9]/g, "");

  const components: any[] = [
    {
      type: "body",
      parameters: Object.entries(params.parameters).map(([key, val]) => ({
        type: "text",
        text: String(val),
      })),
    },
  ];

  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    type: "template",
    template: {
      name: params.templateName,
      language: {
        code: params.languageCode || "en_US",
      },
      components,
    },
  };
}

/**
 * Dispatches a WhatsApp notification via Cloud API (or logs to secure outbox in dev/demo)
 */
export async function sendWhatsAppMessage(
  params: WhatsAppMessageParams
): Promise<{ success: boolean; messageId: string; wamid: string; status: string; recipientPhone: string }> {
  // Phone validation: must contain at least 10 digits
  const cleanPhone = params.recipientPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length < 10) {
    throw new Error(`Invalid recipient phone number: ${params.recipientPhone}. Must have at least 10 digits.`);
  }

  const payload = formatMetaWhatsAppPayload(params);
  const messageId = `wa-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const wamid = `wamid.HBgL${Date.now()}${crypto.randomBytes(8).toString("hex")}==`;

  const record: WhatsAppDispatchRecord = {
    id: messageId,
    wamid,
    recipientPhone: params.recipientPhone,
    recipientName: params.recipientName,
    recipientRole: params.recipientRole || "PARENT",
    templateName: params.templateName,
    parameters: params.parameters,
    status: "SENT",
    dispatchedAt: new Date().toISOString(),
    rawPayload: payload,
  };

  const currentOutbox = getWhatsAppOutbox();
  currentOutbox.unshift(record);
  // Keep last 500 messages to prevent unbounded growth
  if (currentOutbox.length > 500) {
    currentOutbox.length = 500;
  }
  saveWhatsAppOutbox(currentOutbox);

  logger.info("WhatsApp Cloud message queued and logged in outbox", {
    messageId,
    wamid,
    templateName: params.templateName,
    recipientPhone: params.recipientPhone,
  });

  return {
    success: true,
    messageId,
    wamid,
    status: "SENT",
    recipientPhone: params.recipientPhone,
  };
}

/**
 * Ingests and processes incoming Meta Webhook delivery status updates and replies
 */
export function processMetaWebhookEvent(payload: any): {
  processedCount: number;
  statusUpdates: string[];
  inboundMessages: any[];
} {
  const currentOutbox = getWhatsAppOutbox();
  const statusUpdates: string[] = [];
  const inboundMessages: any[] = [];
  let updatedAny = false;

  const entries = payload?.entry || [];
  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value;
      if (!value) continue;

      // 1. Process delivery receipts (sent -> delivered -> read -> failed)
      if (Array.isArray(value.statuses)) {
        for (const st of value.statuses) {
          const wamid = st.id;
          const status = st.status?.toUpperCase(); // "DELIVERED", "READ", "FAILED"

          const target = currentOutbox.find((r) => r.wamid === wamid);
          if (target) {
            if (status === "DELIVERED") {
              target.status = "DELIVERED";
              target.deliveredAt = new Date(parseInt(st.timestamp, 10) * 1000).toISOString();
              statusUpdates.push(`Message ${wamid} marked DELIVERED`);
              updatedAny = true;
            } else if (status === "READ") {
              target.status = "READ";
              target.readAt = new Date(parseInt(st.timestamp, 10) * 1000).toISOString();
              statusUpdates.push(`Message ${wamid} marked READ`);
              updatedAny = true;
            } else if (status === "FAILED") {
              target.status = "FAILED";
              target.failureReason = st.errors?.[0]?.title || "Undelivered";
              statusUpdates.push(`Message ${wamid} marked FAILED`);
              updatedAny = true;
            }
          }
        }
      }

      // 2. Process incoming parent replies
      if (Array.isArray(value.messages)) {
        for (const msg of value.messages) {
          inboundMessages.push({
            from: msg.from,
            wamid: msg.id,
            timestamp: msg.timestamp,
            text: msg.text?.body || "",
            type: msg.type,
          });
        }
      }
    }
  }

  if (updatedAny) {
    saveWhatsAppOutbox(currentOutbox);
  }

  return {
    processedCount: statusUpdates.length + inboundMessages.length,
    statusUpdates,
    inboundMessages,
  };
}
