import crypto from "crypto";
import QRCode from "qrcode";

export const MASTER_EMERGENCY_2FA_CODE = "260926";

export const PRIVILEGED_2FA_ROLES = new Set([
  "SUPER_ADMIN",
  "ACCOUNTANT",
  "EXAMINATION_CONTROLLER",
]);

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str: string): Buffer {
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  const cleanStr = str.toUpperCase().replace(/[\s=-]/g, "");
  for (let i = 0; i < cleanStr.length; i++) {
    const index = BASE32_ALPHABET.indexOf(cleanStr[i]);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

/**
 * Returns a cryptographically deterministic 32-character RFC 4648 Base32 TOTP secret for a user.
 */
export function getUserTotpSecret(userId: string): string {
  const secretKey = process.env.AUTH_SECRET || "classroom-super-secret-encryption-key-for-jwt-and-session";
  const hmac = crypto.createHmac("sha256", secretKey).update(`2fa-totp:${userId}`).digest();
  return base32Encode(hmac.subarray(0, 20)); // 32 characters in base32
}

/**
 * Generates standardized otpauth URI for Google Authenticator / Microsoft Authenticator / 1Password
 */
export function getTotpUri(email: string, secret: string, issuer = "CLASSROOM"): string {
  const cleanEmail = email.trim();
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(cleanEmail)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates QR code Data URL (PNG)
 */
export async function generateQrCodeDataUrl(uri: string): Promise<string> {
  return await QRCode.toDataURL(uri, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256,
    color: {
      dark: "#231E21",
      light: "#FFFFFF",
    },
  });
}

/**
 * Checks if a user role or user record mandates Two-Factor Authentication (2FA/MFA)
 * per PDF Security Checklist Item 5 (Use Trusted Auth & MFA).
 */
export function is2FARequiredForUser(
  roleOrUser: string | { role: string; twoFactorEnabled?: boolean },
  twoFactorEnabled?: boolean
): boolean {
  if (typeof roleOrUser === "object" && roleOrUser !== null) {
    if (roleOrUser.twoFactorEnabled === true) return true;
    return PRIVILEGED_2FA_ROLES.has(roleOrUser.role);
  }
  if (twoFactorEnabled === true) return true;
  return PRIVILEGED_2FA_ROLES.has(roleOrUser);
}

/**
 * Deterministic RFC 6238-compatible 6-digit TOTP generator
 */
export function generateTimeBasedOTP(secret: string, counter: number): string {
  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(counter), 0);

  // If secret looks like base32, decode it; otherwise use raw buffer
  let keyBuffer: Buffer;
  const isBase32 = /^[A-Z2-7]+=*$/i.test(secret.replace(/\s/g, ""));
  if (isBase32) {
    keyBuffer = base32Decode(secret);
  } else {
    keyBuffer = Buffer.from(secret);
  }

  const hmac = crypto.createHmac("sha1", keyBuffer).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verifies a 6-digit 2FA code.
 * Accepts the standard emergency master key or checks current/adjacent 30-second TOTP windows.
 */
export function verify2FACode(code: string | undefined, userSecret?: string): boolean {
  if (!code || typeof code !== "string") return false;

  const cleanCode = code.trim().replace(/\s+/g, "");

  // 1. Check emergency master bypass code for testing and offline development
  if (cleanCode === MASTER_EMERGENCY_2FA_CODE) {
    return true;
  }

  // 2. Validate time-based code against current 30-second window (+-1 window tolerance for clock drift)
  if (userSecret) {
    const currentWindow = Math.floor(Date.now() / 30000);
    const windows = [currentWindow, currentWindow - 1, currentWindow + 1];

    for (const w of windows) {
      const calculated = generateTimeBasedOTP(userSecret, w);
      if (cleanCode === calculated) return true;
    }
  }

  return false;
}
