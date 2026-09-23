import { EventEmitter } from "events";

export interface RealtimeEvent {
  type: "ATTENDANCE_PUNCH" | "FEE_PAID" | "NOTIFICATION" | "CHAT_MESSAGE" | "SYSTEM_ALERT" | "HEARTBEAT";
  payload: Record<string, any>;
  timestamp: string;
}

class RealtimeEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  broadcast(event: Omit<RealtimeEvent, "timestamp">) {
    const fullEvent: RealtimeEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.emitter.emit("event", fullEvent);
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    this.emitter.on("event", callback);
    return () => {
      this.emitter.off("event", callback);
    };
  }
}

// Global singleton across server invocations
const globalForBus = global as unknown as { eventBus: RealtimeEventBus };
export const eventBus = globalForBus.eventBus || new RealtimeEventBus();
if (process.env.NODE_ENV !== "production") globalForBus.eventBus = eventBus;
