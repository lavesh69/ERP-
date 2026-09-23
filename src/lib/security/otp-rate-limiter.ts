import { logger } from "@/lib/logging/logger";

interface RateRecord {
  timestamps: number[];
}

const emailStore = new Map<string, RateRecord>();
const ipStore = new Map<string, RateRecord>();

const MAX_PER_EMAIL = 3;
const WINDOW_PER_EMAIL_MS = 15 * 60 * 1000; // 15 minutes

const MAX_PER_IP = 10;
const WINDOW_PER_IP_MS = 60 * 60 * 1000; // 60 minutes

function pruneTimestamps(timestamps: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return timestamps.filter((t) => t > cutoff);
}

/**
 * Enterprise Sliding-Window OTP Bombing Shield
 */
export function checkOtpLimit(
  email: string,
  ip: string
): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanIp = ip.trim();

  // 1. Verify Email Window
  const emailRecord = emailStore.get(cleanEmail);
  if (emailRecord) {
    const active = pruneTimestamps(emailRecord.timestamps, WINDOW_PER_EMAIL_MS);
    emailStore.set(cleanEmail, { timestamps: active });

    if (active.length >= MAX_PER_EMAIL) {
      const oldestActive = active[0];
      const resetTime = oldestActive + WINDOW_PER_EMAIL_MS;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      logger.security("OTP_BOMBING_PREVENTED", cleanEmail, {
        ip: cleanIp,
        attempts: active.length,
        retryAfterSeconds,
      });

      return {
        allowed: false,
        retryAfterSeconds,
        reason: `Too many password reset requests for this email. Please wait ${Math.ceil(retryAfterSeconds / 60)} minute(s) before requesting again.`,
      };
    }
  }

  // 2. Verify IP Window
  const ipRecord = ipStore.get(cleanIp);
  if (ipRecord) {
    const active = pruneTimestamps(ipRecord.timestamps, WINDOW_PER_IP_MS);
    ipStore.set(cleanIp, { timestamps: active });

    if (active.length >= MAX_PER_IP) {
      const oldestActive = active[0];
      const resetTime = oldestActive + WINDOW_PER_IP_MS;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      logger.security("OTP_IP_BOMBING_PREVENTED", "anonymous", {
        ip: cleanIp,
        attempts: active.length,
        retryAfterSeconds,
      });

      return {
        allowed: false,
        retryAfterSeconds,
        reason: `Excessive password reset requests from this network address. Please wait ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
      };
    }
  }

  return { allowed: true };
}

export function recordOtpDispatch(email: string, ip: string): void {
  const cleanEmail = email.trim().toLowerCase();
  const cleanIp = ip.trim();
  const now = Date.now();

  const emailRecord = emailStore.get(cleanEmail) || { timestamps: [] };
  emailRecord.timestamps.push(now);
  emailStore.set(cleanEmail, emailRecord);

  const ipRecord = ipStore.get(cleanIp) || { timestamps: [] };
  ipRecord.timestamps.push(now);
  ipStore.set(cleanIp, ipRecord);
}

export function resetOtpLimit(email: string): void {
  emailStore.delete(email.trim().toLowerCase());
}
