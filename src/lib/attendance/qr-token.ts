import crypto from "crypto";

const QR_SIGNING_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "apx-classroom-smart-attendance-secret-2026";
const TOKEN_PREFIX = "APX_ATT_V2";

export interface QrTokenPayload {
  prefix: string;
  sessionId: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  signature: string;
}

export interface GeneratedQrToken {
  token: string;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
  rotationSeconds: number;
}

export interface QrVerificationResult {
  valid: boolean;
  sessionId?: string;
  nonce?: string;
  issuedAt?: number;
  expiresAt?: number;
  error?: string;
}

/**
 * Generate a cryptographically signed rotating QR token.
 * Default rotation interval is 15 seconds.
 */
export function generateRotatingQrToken(sessionId: string, rotationSeconds: number = 15): GeneratedQrToken {
  const nonce = crypto.randomBytes(8).toString("hex");
  const now = Date.now();
  const issuedAt = Math.floor(now / 1000);
  const expiresAt = issuedAt + rotationSeconds;

  const dataToSign = `${TOKEN_PREFIX}:${sessionId}:${nonce}:${issuedAt}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", QR_SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex")
    .substring(0, 32); // 32 hex chars (128-bit truncated hmac for compact QR scanning)

  const token = `${TOKEN_PREFIX}.${sessionId}.${nonce}.${issuedAt}.${expiresAt}.${signature}`;

  return {
    token,
    nonce,
    issuedAt,
    expiresAt,
    rotationSeconds,
  };
}

/**
 * Verifies the validity, signature, and expiration of a rotating QR token.
 * Clock skew tolerance: +/- 5 seconds.
 */
export function verifyRotatingQrToken(token: string, expectedSessionId?: string): QrVerificationResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing or malformed attendance token" };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 6 || parts[0] !== TOKEN_PREFIX) {
    return { valid: false, error: "Invalid attendance token format" };
  }

  const [, sessionId, nonce, issuedAtStr, expiresAtStr, signature] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(issuedAt) || isNaN(expiresAt)) {
    return { valid: false, error: "Malformed timestamp in attendance token" };
  }

  if (expectedSessionId && sessionId !== expectedSessionId) {
    return { valid: false, error: "Attendance token belongs to a different session" };
  }

  // Verify HMAC-SHA256 signature
  const dataToSign = `${TOKEN_PREFIX}:${sessionId}:${nonce}:${issuedAt}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", QR_SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex")
    .substring(0, 32);

  const sigBuffer = Buffer.from(signature, "utf-8");
  const expBuffer = Buffer.from(expectedSignature, "utf-8");

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return { valid: false, error: "Cryptographic signature verification failed (tampered or counterfeit token)" };
  }

  // Verify time boundaries with 5s leeway for network latency and clock skew
  const now = Math.floor(Date.now() / 1000);
  const CLOCK_TOLERANCE_SECONDS = 5;

  if (now > expiresAt + CLOCK_TOLERANCE_SECONDS) {
    return { 
      valid: false, 
      sessionId, 
      nonce,
      issuedAt, 
      expiresAt, 
      error: `Attendance token expired ${now - expiresAt} seconds ago. Scan the latest QR code displayed on the screen.` 
    };
  }

  if (now < issuedAt - CLOCK_TOLERANCE_SECONDS) {
    return { valid: false, error: "Attendance token timestamp is from the future" };
  }

  return {
    valid: true,
    sessionId,
    nonce,
    issuedAt,
    expiresAt,
  };
}
