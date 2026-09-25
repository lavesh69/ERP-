import crypto from "crypto";

const BLE_SIGNING_SECRET = process.env.JWT_SECRET || process.env.BLE_SECRET || "apx-ble-proximity-secret-2026";

// Standard Institutional Classroom BLE Service UUIDs
export const CLASSROOM_BLE_SERVICE_UUID = "0000ffe0-0000-1000-8000-00805f9b34fb";
export const CLASSROOM_BLE_CHALLENGE_CHARACTERISTIC_UUID = "0000ffe1-0000-1000-8000-00805f9b34fb";
export const EDDYSTONE_SERVICE_UUID = "0000feaa-0000-1000-8000-00805f9b34fb";

export interface BleChallenge {
  challenge: string;
  sessionId: string;
  studentId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface BleVerificationResult {
  valid: boolean;
  error?: string;
  rssi?: number;
}

/**
 * Generates a short-lived cryptographic challenge for Web Bluetooth verification.
 */
export function generateBleChallenge(
  sessionId: string,
  studentId: string,
  validitySeconds: number = 60
): BleChallenge {
  const nonce = crypto.randomBytes(8).toString("hex");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + validitySeconds;

  const dataToSign = `BLE:${sessionId}:${studentId}:${nonce}:${now}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", BLE_SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex")
    .substring(0, 24);

  const challenge = `BLE_CHALLENGE.${sessionId}.${studentId}.${nonce}.${now}.${expiresAt}.${signature}`;

  return {
    challenge,
    sessionId,
    studentId,
    issuedAt: now,
    expiresAt,
  };
}

/**
 * Verifies a BLE challenge proof submitted by a student client.
 */
export function verifyBleChallengeProof(
  challenge: string,
  expectedSessionId: string,
  expectedStudentId: string,
  rssi?: number,
  minRssiThreshold: number = -85
): BleVerificationResult {
  if (!challenge || typeof challenge !== "string") {
    return { valid: false, error: "Missing BLE challenge token" };
  }

  const parts = challenge.split(".");
  if (parts.length !== 7 || parts[0] !== "BLE_CHALLENGE") {
    return { valid: false, error: "Invalid BLE challenge format" };
  }

  const [, sessionId, studentId, nonce, issuedAtStr, expiresAtStr, signature] = parts;
  const issuedAt = parseInt(issuedAtStr, 10);
  const expiresAt = parseInt(expiresAtStr, 10);

  if (sessionId !== expectedSessionId) {
    return { valid: false, error: "BLE challenge belongs to a different session" };
  }

  if (studentId !== expectedStudentId) {
    return { valid: false, error: "BLE challenge was issued for a different student" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > expiresAt + 5) {
    return { valid: false, error: "BLE challenge has expired. Please re-scan proximity beacon." };
  }

  // Verify HMAC signature
  const dataToSign = `BLE:${sessionId}:${studentId}:${nonce}:${issuedAt}:${expiresAt}`;
  const expectedSignature = crypto
    .createHmac("sha256", BLE_SIGNING_SECRET)
    .update(dataToSign)
    .digest("hex")
    .substring(0, 24);

  const sigBuffer = Buffer.from(signature, "utf-8");
  const expBuffer = Buffer.from(expectedSignature, "utf-8");

  if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
    return { valid: false, error: "Invalid cryptographic BLE challenge signature" };
  }

  // Verify RSSI signal strength if available
  if (typeof rssi === "number" && rssi < minRssiThreshold) {
    return {
      valid: false,
      rssi,
      error: `BLE signal strength too weak (${rssi} dBm < minimum ${minRssiThreshold} dBm). Move closer to the classroom beacon.`,
    };
  }

  return { valid: true, rssi };
}
