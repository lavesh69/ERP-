import { cache } from "@/lib/cache/index";
import crypto from "crypto";

const REVOKED_TOKEN_PREFIX = "revoked_token:";

/**
 * Calculates a SHA-256 hash of the token to avoid storing large JWT strings in cache keys
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Marks a JWT token as revoked. The token will be rejected by guards and middleware.
 * Stores in unified cache with 7-day TTL (matching max token lifetime).
 */
export async function revokeToken(token: string, ttlSeconds = 60 * 60 * 24 * 7): Promise<void> {
  if (!token) return;
  const key = `${REVOKED_TOKEN_PREFIX}${hashToken(token)}`;
  await cache.set(key, { revokedAt: new Date().toISOString() }, ttlSeconds);
}

/**
 * Checks if a JWT token has been explicitly revoked
 */
export async function isTokenRevoked(token: string): Promise<boolean> {
  if (!token) return true;
  const key = `${REVOKED_TOKEN_PREFIX}${hashToken(token)}`;
  return await cache.has(key);
}
