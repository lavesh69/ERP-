import crypto from "crypto";
import { Job, JobType, JobStatus, QueueStats, JobHandler } from "./types";

class PriorityJobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<JobType, JobHandler> = new Map();
  private concurrencyLimit = 3;
  private activeCount = 0;

  /**
   * Registers a worker handler for a specific job type
   */
  registerWorker(type: JobType, handler: JobHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * Enqueues a new background job with priority and retry configuration
   */
  enqueue<T = any>(
    type: JobType,
    payload: T,
    options?: { priority?: number; maxRetries?: number }
  ): Job<T> {
    const id = `job-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const job: Job<T> = {
      id,
      type,
      payload,
      priority: options?.priority ?? 5,
      status: "QUEUED",
      attempts: 0,
      maxRetries: options?.maxRetries ?? 3,
      createdAt: new Date().toISOString(),
    };

    this.jobs.set(id, job);
    // Trigger queue processing asynchronously
    setTimeout(() => this.processNext(), 10);
    return job;
  }

  /**
   * Finds the highest-priority queued job and executes its registered worker
   */
  private async processNext(): Promise<void> {
    if (this.activeCount >= this.concurrencyLimit) {
      return;
    }

    // Find highest priority queued job
    const queuedJobs = Array.from(this.jobs.values())
      .filter((j) => j.status === "QUEUED")
      .sort((a, b) => b.priority - a.priority || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (queuedJobs.length === 0) {
      return;
    }

    const job = queuedJobs[0];
    const handler = this.handlers.get(job.type);

    if (!handler) {
      job.status = "FAILED";
      job.error = `No registered worker handler for job type "${job.type}"`;
      job.completedAt = new Date().toISOString();
      return;
    }

    this.activeCount++;
    job.status = "PROCESSING";
    job.startedAt = new Date().toISOString();
    job.attempts++;

    const startTime = Date.now();

    try {
      const result = await handler(job);
      job.status = "COMPLETED";
      job.result = result;
      job.completedAt = new Date().toISOString();
      job.durationMs = Date.now() - startTime;
    } catch (err: any) {
      console.error(`Queue job ${job.id} failed (attempt ${job.attempts}/${job.maxRetries}):`, err);
      if (job.attempts < job.maxRetries) {
        // Retry with backoff
        job.status = "QUEUED";
      } else {
        job.status = "FAILED";
        job.error = err.message || "Unknown worker error";
        job.completedAt = new Date().toISOString();
        job.durationMs = Date.now() - startTime;
      }
    } finally {
      this.activeCount--;
      // Continue processing subsequent jobs
      setTimeout(() => this.processNext(), 10);
    }
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  listJobs(limit = 20): Job[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getStats(): QueueStats {
    let queued = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const job of this.jobs.values()) {
      if (job.status === "QUEUED") queued++;
      else if (job.status === "PROCESSING") processing++;
      else if (job.status === "COMPLETED") completed++;
      else if (job.status === "FAILED") failed++;
    }

    return {
      queued,
      processing,
      completed,
      failed,
      total: this.jobs.size,
    };
  }
}

export const jobQueue = new PriorityJobQueue();
