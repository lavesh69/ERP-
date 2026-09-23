export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

class SlidingWindowRateLimiter {
  private store: Map<string, number[]> = new Map();
  private lastPrune: number = Date.now();

  /**
   * Evaluates if an action by a given key (IP, user ID, email) is permitted within window
   */
  check(key: string, maxAttempts = 5, windowMs = 60000): RateLimitResult {
    const now = Date.now();
    this.pruneOldEntries(now);

    const timestamps = this.store.get(key) || [];
    const validTimestamps = timestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= maxAttempts) {
      const oldestValid = validTimestamps[0];
      const resetTimeMs = Math.max(0, oldestValid + windowMs - now);
      return {
        allowed: false,
        limit: maxAttempts,
        remaining: 0,
        resetTimeMs,
      };
    }

    validTimestamps.push(now);
    this.store.set(key, validTimestamps);

    return {
      allowed: true,
      limit: maxAttempts,
      remaining: maxAttempts - validTimestamps.length,
      resetTimeMs: 0,
    };
  }

  /**
   * Resets rate limit for a specific key (e.g. after successful login)
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  private pruneOldEntries(now: number): void {
    // Prune stale entries every 5 minutes
    if (now - this.lastPrune > 300000) {
      for (const [key, timestamps] of this.store.entries()) {
        const fresh = timestamps.filter((t) => now - t < 300000);
        if (fresh.length === 0) {
          this.store.delete(key);
        } else {
          this.store.set(key, fresh);
        }
      }
      this.lastPrune = now;
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();
export const loginRateLimiter = rateLimiter;
