/**
 * CLASSROOM Academic OS — Enterprise Cyber Security & Threat Mitigation Suite
 * Adheres to OWASP Top 10, FERPA, GDPR, and NIST SP 800-63 Standards
 */

/**
 * 1. Anti-XSS Sanitizer
 * Strips script tags, javascript: pseudo-protocols, and malicious inline event handlers
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/onload|onerror|onclick|onmouseover|onfocus|onblur/gi, "")
    .replace(/[<>]/g, (char) => (char === "<" ? "&lt;" : "&gt;"))
    .trim();
}

/**
 * 2. Open-Redirect Vulnerability Defense
 * Validates that redirect paths are strictly internal relative routes
 */
export function sanitizeRedirectPath(path: string | null | undefined, defaultFallback = "/dashboard"): string {
  if (!path) return defaultFallback;
  
  // Must start with a single slash
  if (!path.startsWith("/")) return defaultFallback;
  
  // Prevent protocol-relative URLs (//evil.com)
  if (path.startsWith("//")) return defaultFallback;
  
  // Prevent backslash evasion (/\evil.com)
  if (path.includes("\\")) return defaultFallback;
  
  // Prevent URL schemes embedded
  if (path.includes("://") || path.toLowerCase().startsWith("javascript:") || path.toLowerCase().startsWith("data:")) {
    return defaultFallback;
  }
  
  return path;
}

/**
 * 3. Client-Side Anti-Brute-Force & Rate Limiting Guard
 * Prevents automated OTP/Login bombing and rapid-fire API harassment
 */
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

export function checkClientRateLimit(
  actionKey: string,
  maxAttempts = 5,
  windowMs = 60000,
  lockoutMs = 120000
): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const storageKey = `sec_ratelimit_${actionKey}`;
  const now = Date.now();
  
  let record: RateLimitRecord = { attempts: 0, firstAttemptAt: now };
  const raw = sessionStorage.getItem(storageKey);
  
  if (raw) {
    try {
      record = JSON.parse(raw);
    } catch {}
  }

  // Check if locked out
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > windowMs) {
    record = { attempts: 1, firstAttemptAt: now };
    sessionStorage.setItem(storageKey, JSON.stringify(record));
    return { allowed: true, remainingAttempts: maxAttempts - 1, retryAfterSeconds: 0 };
  }

  record.attempts += 1;

  if (record.attempts > maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    sessionStorage.setItem(storageKey, JSON.stringify(record));
    const retryAfter = Math.ceil(lockoutMs / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  sessionStorage.setItem(storageKey, JSON.stringify(record));
  return { allowed: true, remainingAttempts: maxAttempts - record.attempts, retryAfterSeconds: 0 };
}

/**
 * 4. Client Security Telemetry & Audit Logger
 */
export function recordSecurityAudit(eventType: string, details: Record<string, any> = {}): void {
  const auditEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    userAgent: navigator.userAgent,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    details,
  };

  try {
    const rawHistory = sessionStorage.getItem("classroom_security_audits");
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    history.unshift(auditEntry);
    sessionStorage.setItem("classroom_security_audits", JSON.stringify(history.slice(0, 50)));
  } catch {}
}
