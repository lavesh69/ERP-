import { NextRequest } from "next/server";
import { eventBus, RealtimeEvent } from "@/lib/realtime/event-bus";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection packet
      const initData = JSON.stringify({ type: "CONNECTED", message: "CLASSROOM Realtime SSE Stream Established" });
      controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

      // Subscribe to internal bus events
      const unsubscribe = eventBus.subscribe((event: RealtimeEvent) => {
        try {
          const serialized = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(serialized));
        } catch {
          // Stream might be closed
        }
      });

      // Keep connection alive with periodic heartbeats every 25s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
