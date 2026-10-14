/**
 * AI Multi-Agent Token Quota & Governance Engine
 * Implements tiered role-based daily token budgets (NEP 2020 / Enterprise AI Policy)
 * to prevent runaway LLM costs, abusive scraping, and denial-of-wallet risks.
 */

export interface TokenQuotaStatus {
  allowed: boolean;
  consumed: number;
  limit: number;
  remaining: number;
  percentConsumed: number;
  resetInMinutes: number;
  userRole: string;
}

const ROLE_DAILY_TOKEN_LIMITS: Record<string, number> = {
  SUPER_ADMIN: 100000,
  INSTITUTION_ADMIN: 100000,
  PRINCIPAL: 100000,
  HOD: 75000,
  FACULTY: 50000,
  RESEARCH_COORDINATOR: 50000,
  EXAMINATION_CONTROLLER: 50000,
  CLASS_TEACHER: 30000,
  PLACEMENT_OFFICER: 30000,
  HR_STAFF: 30000,
  ACCOUNTANT: 30000,
  LIBRARIAN: 20000,
  STUDENT: 10000,
  PARENT: 5000,
  ALUMNI: 5000,
  GUEST: 5000,
};

interface UserDailyRecord {
  dateKey: string;
  consumedTokens: number;
  queryCount: number;
}

// In-memory ledger with day-key partitioning
const TOKEN_USAGE_REGISTRY = new Map<string, UserDailyRecord>();

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getMinutesUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, Math.round((midnight.getTime() - now.getTime()) / 60000));
}

export class TokenBudgetEngine {
  /**
   * Estimates token count using standard GPT/Gemini heuristic (~4 characters per token)
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.trim().length / 4));
  }

  /**
   * Gets statutory daily token allowance by role
   */
  public static getDailyLimit(role: string): number {
    return ROLE_DAILY_TOKEN_LIMITS[role] || 10000;
  }

  /**
   * Checks whether the user has remaining token allowance for the proposed query
   */
  public static checkQuota(userId: string, role: string, estimatedPromptTokens: number = 0): TokenQuotaStatus {
    const today = getTodayKey();
    const limit = this.getDailyLimit(role);
    const record = TOKEN_USAGE_REGISTRY.get(userId);

    const consumed = (record && record.dateKey === today) ? record.consumedTokens : 0;
    const projectedTotal = consumed + estimatedPromptTokens;
    const remaining = Math.max(0, limit - consumed);
    const allowed = projectedTotal <= limit;
    const percentConsumed = limit > 0 ? Number(Math.min(100, (consumed / limit) * 100).toFixed(1)) : 100;

    return {
      allowed,
      consumed,
      limit,
      remaining,
      percentConsumed,
      resetInMinutes: getMinutesUntilMidnight(),
      userRole: role,
    };
  }

  /**
   * Records completed query token expenditure (prompt + completion)
   */
  public static recordUsage(userId: string, totalTokens: number): void {
    const today = getTodayKey();
    const existing = TOKEN_USAGE_REGISTRY.get(userId);

    if (!existing || existing.dateKey !== today) {
      TOKEN_USAGE_REGISTRY.set(userId, {
        dateKey: today,
        consumedTokens: totalTokens,
        queryCount: 1,
      });
    } else {
      existing.consumedTokens += totalTokens;
      existing.queryCount += 1;
    }
  }

  /**
   * Resets usage registry (used for tests or maintenance)
   */
  public static resetAll(): void {
    TOKEN_USAGE_REGISTRY.clear();
  }
}
