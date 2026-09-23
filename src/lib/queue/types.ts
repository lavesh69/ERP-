export type JobType =
  | "GENERATE_TRANSCRIPT_PDF"
  | "BULK_ATTENDANCE_INGEST"
  | "DISPATCH_SCHEDULED_NOTICES"
  | "RECALCULATE_COHORT_GPA";

export type JobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Job<T = any> {
  id: string;
  type: JobType;
  payload: T;
  priority: number; // 1 (lowest) to 10 (highest)
  status: JobStatus;
  attempts: number;
  maxRetries: number;
  result?: any;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface QueueStats {
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

export type JobHandler<T = any, R = any> = (job: Job<T>) => Promise<R>;
