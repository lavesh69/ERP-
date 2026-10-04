import { NextRequest, NextResponse } from "next/server";
import { eventBus, RealtimeEvent } from "@/lib/realtime/event-bus";
import { getOptionalSession } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required to subscribe to institutional realtime telemetry." },
      { status: 401 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection packet
      const initData = JSON.stringify({
        type: "CONNECTED",
        message: "CLASSROOM Realtime SSE Stream Established",
        tenant: session.institutionId || "GLOBAL",
      });
      controller.enqueue(encoder.encode(`data: ${initData}\n\n`));

      // Subscribe to internal bus events with tenant and role filtering
      const unsubscribe = eventBus.subscribe((event: RealtimeEvent) => {
        try {
          // Multi-tenant isolation: drop events from other institutions
          if (session.role !== "SUPER_ADMIN" && session.institutionId) {
            const eventTenant = (event.payload as any)?.institutionId;
            if (eventTenant && eventTenant !== session.institutionId) {
              return;
            }
          }

          // Privacy scoping: drop individual punch logs if caller is a scholar/parent and it's not their own record
          const eventUserId = (event.payload as any)?.userId || (event.payload as any)?.studentId;
          const isStaff = [
            "SUPER_ADMIN",
            "INSTITUTION_ADMIN",
            "PRINCIPAL",
            "HOD",
            "FACULTY",
            "CLASS_TEACHER",
            "HR_STAFF",
          ].includes(session.role);

          if (!isStaff && eventUserId && eventUserId !== session.userId && event.type !== "CAMPUS_ALERT") {
            return;
          }

          const serialized = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(serialized));
        } catch {
          // Stream might be closed
        }
      });

      // Keep connection alive with periodic heartbeats every 15s (prevents cloud proxy / edge drops)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

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
