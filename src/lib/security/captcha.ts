import { logger } from "@/lib/logging/logger";

export interface CaptchaVerificationResult {
  success: boolean;
  error?: string;
  challengeTs?: string;
  hostname?: string;
}

/**
 * Validates Cloudflare Turnstile token or provides smart development bypass
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string
): Promise<CaptchaVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // 1. Development & Sandbox Bypass
  if (!secretKey || secretKey.trim() === "") {
    return { success: true };
  }

  // 2. Explicit Development/Test token bypass
  if (token === "cf-turnstile-development-bypass" || token === "sandbox_captcha_token") {
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: "Captcha challenge required. Missing Turnstile verification token.",
    };
  }

  // 3. Live Cloudflare Turnstile Siteverify API
  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) formData.append("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!res.ok) {
      logger.error(`Turnstile verification network failure: HTTP ${res.status}`);
      return { success: false, error: "Cloudflare Turnstile verification server unavailable." };
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      };
    }

    return {
      success: false,
      error: `Turnstile verification rejected: ${(data["error-codes"] || []).join(", ") || "Failed challenge"}`,
    };
  } catch (err: any) {
    logger.error("Turnstile verification exception:", err);
    return { success: false, error: "Captcha verification service error." };
  }
}
