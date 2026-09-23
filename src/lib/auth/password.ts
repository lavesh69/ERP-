import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = "sha512";
const SALT_LEN = 32;

/**
 * Hashes a plaintext password using NIST SP 800-63B standard PBKDF2-HMAC-SHA512
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(SALT_LEN).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LEN, DIGEST, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`pbkdf2$${DIGEST}$${ITERATIONS}$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Constant-time password verification preventing timing side-channel attacks.
 * Only accepts real PBKDF2 hashes — no plaintext fallback.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!storedHash.startsWith("pbkdf2$")) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 5) {
    return false;
  }

  const [, digest, iterStr, salt, expectedKeyHex] = parts;
  const iterations = parseInt(iterStr, 10);

  return new Promise((resolve) => {
    crypto.pbkdf2(password, salt, iterations, KEY_LEN, digest, (err, derivedKey) => {
      if (err) return resolve(false);

      const expectedBuffer = Buffer.from(expectedKeyHex, "hex");
      if (derivedKey.length !== expectedBuffer.length) {
        return resolve(false);
      }

      // Timing-safe comparison to prevent timing attacks
      resolve(crypto.timingSafeEqual(derivedKey, expectedBuffer));
    });
  });
}

function getResetSecret(): string {
  const secret = process.env.RESET_SECRET || process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === "classroom-password-reset-key-2026") {
      throw new Error("SECURITY_VIOLATION: Insecure or missing RESET_SECRET in production");
    }
  }
  return secret || "classroom-password-reset-key-2026";
}

export function createPasswordResetToken(email: string, userId: string): string {
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
  const payload = `${email.toLowerCase()}:${userId}:${expiresAt}`;
  const signature = crypto.createHmac("sha256", getResetSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyPasswordResetToken(
  token: string
): { valid: boolean; email?: string; userId?: string; error?: string } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(":");
    if (parts.length !== 4) {
      return { valid: false, error: "Malformed reset token" };
    }

    const [email, userId, expiresAtStr, expectedSig] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (Date.now() > expiresAt) {
      return { valid: false, error: "Reset token has expired" };
    }

    const payload = `${email}:${userId}:${expiresAtStr}`;
    const calculatedSig = crypto.createHmac("sha256", getResetSecret()).update(payload).digest("hex");

    const validSig = crypto.timingSafeEqual(
      Buffer.from(calculatedSig),
      Buffer.from(expectedSig)
    );

    if (!validSig) {
      return { valid: false, error: "Invalid token signature" };
    }

    return { valid: true, email, userId };
  } catch {
    return { valid: false, error: "Invalid token encoding" };
  }
}

