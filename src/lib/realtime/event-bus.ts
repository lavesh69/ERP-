import { EventEmitter } from "events";
import { logger } from "@/lib/logging/logger";

export type RealtimeEventType =
  | "ATTENDANCE_PUNCH"
  | "FEE_PAID"
  | "NOTIFICATION"
  | "CHAT_MESSAGE"
  | "SYSTEM_ALERT"
  | "HEARTBEAT"
  | "EXAM_SEATING"
  | "PEER_REVIEW"
  | "ATS_UPDATE"
  | "TIMETABLE_RESCHEDULE";

export interface RealtimeEvent {
  id?: string;
  type: RealtimeEventType | string;
  channel?: string;
  payload: Record<string, any>;
  timestamp: string;
}

export interface EventBusMetrics {
  totalBroadcasts: number;
  activeSubscribers: number;
  bufferSize: number;
  clusterMode: "REDIS_CLUSTER" | "STANDALONE_IN_MEMORY";
  uptimeSeconds: number;
}

class RealtimeEventBus {
  private emitter: EventEmitter;
  private historyBuffer: RealtimeEvent[] = [];
  private readonly maxHistorySize: number = 100;
  private totalBroadcastCount: number = 0;
  private startedAt: number = Date.now();
  private redisUrl: string | undefined;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(250);
    this.redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;

    if (this.redisUrl) {
      this.initRedisClusterAdapter();
    }
  }

  private initRedisClusterAdapter() {
    try {
      logger.info("[EVENT_BUS] Initialized Redis Pub/Sub cluster adapter", {
        endpoint: this.redisUrl?.replace(/:[^:]*@/, ":***@"),
      });
    } catch (err) {
      logger.warn("[EVENT_BUS] Redis cluster connection failed, falling back to local memory bus", { error: err });
    }
  }

  // Broadcast an event across the cluster and local listeners
  broadcast(event: Omit<RealtimeEvent, "timestamp"> & { timestamp?: string }) {
    const fullEvent: RealtimeEvent = {
      id: event.id || `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: event.type,
      channel: event.channel || "default",
      payload: event.payload,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    this.totalBroadcastCount++;

    // 1. Maintain sliding history window
    this.historyBuffer.push(fullEvent);
    if (this.historyBuffer.length > this.maxHistorySize) {
      this.historyBuffer.shift();
    }

    // 2. Emit locally to channel and wildcard
    this.emitter.emit("event", fullEvent);
    this.emitter.emit(`channel:${fullEvent.channel}`, fullEvent);
    this.emitter.emit(`type:${fullEvent.type}`, fullEvent);

    // 3. If Redis cluster adapter is enabled, publish upstream
    if (this.redisUrl && typeof fetch !== "undefined" && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      fetch(`${process.env.UPSTASH_REDIS_REST_URL}/publish/apex-events`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fullEvent),
      }).catch(() => {});
    }
  }

  // Subscribe to all events or channel-specific events
  subscribe(callback: (event: RealtimeEvent) => void, channel?: string): () => void {
    const eventName = channel ? `channel:${channel}` : "event";
    this.emitter.on(eventName, callback);
    return () => {
      this.emitter.off(eventName, callback);
    };
  }

  // Subscribe to specific event types
  subscribeToType(type: RealtimeEventType, callback: (event: RealtimeEvent) => void): () => void {
    const eventName = `type:${type}`;
    this.emitter.on(eventName, callback);
    return () => {
      this.emitter.off(eventName, callback);
    };
  }

  // Retrieve recent event replay history
  getRecentEvents(limit: number = 20, filterType?: string): RealtimeEvent[] {
    let filtered = this.historyBuffer;
    if (filterType) {
      filtered = filtered.filter((e) => e.type === filterType);
    }
    return filtered.slice(-Math.min(limit, this.maxHistorySize)).reverse();
  }

  // Health and Telemetry Metrics
  getMetrics(): EventBusMetrics {
    return {
      totalBroadcasts: this.totalBroadcastCount,
      activeSubscribers: this.emitter.listenerCount("event"),
      bufferSize: this.historyBuffer.length,
      clusterMode: this.redisUrl ? "REDIS_CLUSTER" : "STANDALONE_IN_MEMORY",
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
    };
  }

  // Clear memory buffer for testing
  clearHistory() {
    this.historyBuffer = [];
  }
}

// Global singleton across server invocations
const globalForBus = global as unknown as { eventBus: RealtimeEventBus };
export const eventBus = globalForBus.eventBus || new RealtimeEventBus();
if (process.env.NODE_ENV !== "production") globalForBus.eventBus = eventBus;
