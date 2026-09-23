import crypto from "crypto";

class SessionBlacklistStore {
  // Map of token hash -> expiration timestamp ms
  private revokedTokens: Map<string, number> = new Map();

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Blacklists a token until its natural expiration
   */
  revoke(token: string, expiresAtMs: number): void {
    const hash = this.hashToken(token);
    this.revokedTokens.set(hash, expiresAtMs);
  }

  /**
   * Checks if a token has been explicitly revoked
   */
  isRevoked(token: string): boolean {
    const hash = this.hashToken(token);
    const expiresAt = this.revokedTokens.get(hash);
    if (!expiresAt) return false;

    if (Date.now() > expiresAt) {
      this.revokedTokens.delete(hash);
      return false;
    }
    return true;
  }

  /**
   * Prunes all expired tokens from memory
   */
  prune(): void {
    const now = Date.now();
    for (const [hash, exp] of this.revokedTokens.entries()) {
      if (now > exp) {
        this.revokedTokens.delete(hash);
      }
    }
  }
}

export const sessionBlacklist = new SessionBlacklistStore();
