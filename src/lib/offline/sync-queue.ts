/**
 * Client-Side Offline Mutation Queue & Background Replay Engine
 * Ensures zero data loss when faculty or students perform actions without connectivity.
 */

export interface QueuedMutation {
  id: string;
  url: string;
  method: "POST" | "PUT" | "DELETE" | "PATCH";
  body: any;
  headers?: Record<string, string>;
  createdAt: number;
  description: string;
}

const STORAGE_KEY = "classroom_offline_mutation_queue_v1";

export function getQueuedMutations(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function enqueueOfflineMutation(mutation: Omit<QueuedMutation, "id" | "createdAt">): QueuedMutation {
  const item: QueuedMutation = {
    ...mutation,
    id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    const queue = getQueuedMutations();
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }
  return item;
}

export async function flushOfflineQueue(
  onSuccessItem?: (item: QueuedMutation) => void
): Promise<{ processed: number; failed: number }> {
  if (typeof window === "undefined") return { processed: 0, failed: 0 };

  const queue = getQueuedMutations();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  const remaining: QueuedMutation[] = [];
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: {
          "Content-Type": "application/json",
          "x-offline-replay": "true",
          ...(item.headers || {}),
        },
        body: JSON.stringify(item.body),
      });

      if (res.ok) {
        processed++;
        if (onSuccessItem) onSuccessItem(item);
      } else {
        // Keep failed items for next retry if server error
        if (res.status >= 500) {
          remaining.push(item);
        }
        failed++;
      }
    } catch {
      // Network still down or intermittent
      remaining.push(item);
      failed++;
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  return { processed, failed };
}
