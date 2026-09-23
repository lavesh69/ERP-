/**
 * Scalable Cache Abstraction Layer
 * Provides uniform get/set/delete/has interface with in-memory TTL caching
 * and Redis-ready connection adapter for distributed enterprise clusters.
 */

export interface CacheStore {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): { size: number; driver: string };
}

interface MemoryCacheEntry {
  value: any;
  expiresAt: number | null;
}

class MemoryCacheStore implements CacheStore {
  private store: Map<string, MemoryCacheEntry> = new Map();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  getStats(): { size: number; driver: string } {
    return {
      size: this.store.size,
      driver: "in-memory-lru",
    };
  }
}

/**
 * Upstash Redis / Redis REST API Store for serverless and multi-instance deployments
 */
class UpstashRedisCacheStore implements CacheStore {
  private url: string;
  private token: string;
  private fallback: MemoryCacheStore;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
    this.fallback = new MemoryCacheStore();
  }

  private async fetchRedis(command: string[]): Promise<any> {
    const res = await fetch(`${this.url}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) throw new Error(`Redis error: ${res.statusText}`);
    const data = await res.json();
    return data.result;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const res = await this.fetchRedis(["GET", key]);
      if (!res) return null;
      return JSON.parse(res) as T;
    } catch {
      return this.fallback.get<T>(key);
    }
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) {
        await this.fetchRedis(["SETEX", key, String(ttlSeconds), payload]);
      } else {
        await this.fetchRedis(["SET", key, payload]);
      }
    } catch {
      await this.fallback.set(key, value, ttlSeconds);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const res = await this.fetchRedis(["DEL", key]);
      return res > 0;
    } catch {
      return this.fallback.delete(key);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const res = await this.fetchRedis(["EXISTS", key]);
      return res === 1;
    } catch {
      return this.fallback.has(key);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.fetchRedis(["FLUSHDB"]);
    } catch {
      await this.fallback.clear();
    }
  }

  getStats(): { size: number; driver: string } {
    return {
      size: 0,
      driver: "upstash-redis-rest",
    };
  }
}

function createCacheStore(): CacheStore {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return new UpstashRedisCacheStore(upstashUrl, upstashToken);
  }
  return new MemoryCacheStore();
}

export const cache = createCacheStore();
export { MemoryCacheStore, UpstashRedisCacheStore };
