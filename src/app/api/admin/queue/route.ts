import { NextRequest, NextResponse } from "next/server";
import { jobQueue } from "@/lib/queue/memory-queue";
import "@/lib/queue/workers"; // ensure workers are registered
import { JobType } from "@/lib/queue/types";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  // C3: Admin-only endpoint
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const stats = jobQueue.getStats();
    const recentJobs = jobQueue.listJobs(15);

    return NextResponse.json({
      success: true,
      stats,
      jobs: recentJobs,
    });
  } catch (error: any) {
    logger.error("Queue GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch queue telemetry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // C3: Admin-only endpoint
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { type, payload, priority } = body;

    const validTypes: JobType[] = [
      "GENERATE_TRANSCRIPT_PDF",
      "BULK_ATTENDANCE_INGEST",
      "DISPATCH_SCHEDULED_NOTICES",
      "RECALCULATE_COHORT_GPA",
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const job = jobQueue.enqueue(type, payload || {}, {
      priority: typeof priority === "number" ? priority : 5,
    });

    // C4: Audit log job submission
    logger.info("Job enqueued", { type, jobId: job.id, actor: auth.payload.email });

    return NextResponse.json(
      {
        success: true,
        message: `Job ${job.id} queued successfully`,
        job,
      },
      { status: 202 }
    );
  } catch (error: any) {
    logger.error("Queue POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to enqueue job" },
      { status: 500 }
    );
  }
}

