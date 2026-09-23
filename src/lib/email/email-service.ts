import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "@/lib/logging/logger";

export interface EmailMessage {
  id: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  type: "PASSWORD_RESET" | "WELCOME" | "HALL_TICKET" | "PAYMENT_RECEIPT" | "NOTIFICATION";
  otpCode?: string;
  createdAt: string;
}

const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");
const OUTBOX_FILE = path.join(OUTBOX_DIR, "emails.json");

function ensureOutboxDir() {
  if (!fs.existsSync(OUTBOX_DIR)) {
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
  }
}

export function getOutboxEmails(): EmailMessage[] {
  try {
    ensureOutboxDir();
    if (!fs.existsSync(OUTBOX_FILE)) return [];
    const content = fs.readFileSync(OUTBOX_FILE, "utf-8");
    return JSON.parse(content) || [];
  } catch {
    return [];
  }
}

export function saveOutboxEmail(email: EmailMessage) {
  try {
    ensureOutboxDir();
    const existing = getOutboxEmails();
    const updated = [email, ...existing.slice(0, 49)]; // keep latest 50
    fs.writeFileSync(OUTBOX_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    logger.error("Failed to save email to outbox", err);
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type: EmailMessage["type"];
  otpCode?: string;
}): Promise<{ success: boolean; messageId: string; email: EmailMessage }> {
  const id = `msg-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const email: EmailMessage = {
    id,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.subject,
    type: options.type,
    otpCode: options.otpCode,
    createdAt: new Date().toISOString(),
  };

  // Always log to outbox for audit inspection & offline development
  saveOutboxEmail(email);

  logger.info(`[EMAIL DISPATCH] To: ${email.to} | Subject: "${email.subject}" | OTP: ${email.otpCode || "N/A"}`);

  // Live Resend HTTP API Driver if configured in environment
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && resendApiKey.startsWith("re_")) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "CLASSROOM Notifications <notifications@classroom.edu>";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email.to],
          subject: email.subject,
          html: email.html,
          text: email.text,
        }),
      });
      logger.info(`[RESEND API SUCCESS] Delivered message ${id} to ${email.to}`);
    } catch (apiErr) {
      logger.error(`[RESEND API ERROR] Failed live dispatch to ${email.to}:`, apiErr);
    }
  }

  // Live SendGrid HTTP API Driver if configured in environment
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey && sendgridApiKey.startsWith("SG.")) {
    try {
      const fromEmail = process.env.EMAIL_FROM || "notifications@classroom.edu";
      await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: email.to }] }],
          from: { email: fromEmail, name: "CLASSROOM ERP" },
          subject: email.subject,
          content: [{ type: "text/html", value: email.html }],
        }),
      });
      logger.info(`[SENDGRID API SUCCESS] Delivered message ${id} to ${email.to}`);
    } catch (apiErr) {
      logger.error(`[SENDGRID API ERROR] Failed live dispatch to ${email.to}:`, apiErr);
    }
  }

  return {
    success: true,
    messageId: id,
    email,
  };
}

// ─── Branded HTML Templates ───

export function getResetPasswordEmailHtml(name: string, otpCode: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; margin: 0; padding: 24px; color: #231e21; }
.card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd8; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(35,30,33,0.04); }
.brand { color: #8e5368; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 20px; }
.code-box { background: #fdf2f4; border: 1px dashed #d99aa8; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0; }
.code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #8e5368; }
.button { display: inline-block; background: #8e5368; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 12px; }
.footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e7dfd8; font-size: 11px; color: #7f777b; }
</style></head>
<body>
<div class="card">
  <div class="brand">CLASSROOM · Academic OS</div>
  <h2>Password Reset Verification</h2>
  <p>Hello <strong>${name}</strong>,</p>
  <p>We received an official request to reset your institutional account password. Use the single-use 6-digit verification passkey below:</p>
  <div class="code-box">
    <div class="code">${otpCode}</div>
    <div style="font-size: 11px; color: #7f777b; margin-top: 6px;">Valid for 30 minutes · Never share this code</div>
  </div>
  <p>Alternatively, click the button below to proceed directly to the secure password change portal:</p>
  <div style="text-align: center;">
    <a href="${resetUrl}" class="button">Reset Password Securely</a>
  </div>
  <div class="footer">
    <p>If you did not request this password reset, please report this immediately to your campus System Administrator.</p>
    <p>© 2026 CLASSROOM ERP Multi-Tenant Academic Network.</p>
  </div>
</div>
</body></html>`;
}

export function getWelcomeStudentEmailHtml(name: string, rollNumber: string, loginUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; margin: 0; padding: 24px; color: #231e21; }
.card { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e7dfd8; border-radius: 16px; padding: 32px; }
.brand { color: #8e5368; font-size: 20px; font-weight: 800; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1ece6; font-size: 13px; }
.button { display: inline-block; background: #8e5368; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 16px; }
</style></head>
<body>
<div class="card">
  <div class="brand">CLASSROOM · Academic OS</div>
  <h2>Welcome to Apex University!</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>Your institutional scholar identity has been formally registered in the university ERP registry.</p>
  <div style="background: #fdfbf7; border: 1px solid #e7dfd8; border-radius: 12px; padding: 16px; margin: 20px 0;">
    <div class="info-row"><span>Official Roll Number:</span><strong>${rollNumber}</strong></div>
    <div class="info-row"><span>Status:</span><strong style="color: #2e7d32;">ACTIVE SCHOLAR</strong></div>
    <div class="info-row"><span>Default Password:</span><strong>Classroom@2026</strong></div>
  </div>
  <p>Please log in immediately and update your password on first sign-in.</p>
  <div style="text-align: center;">
    <a href="${loginUrl}" class="button">Access Student Portal</a>
  </div>
</div>
</body></html>`;
}
