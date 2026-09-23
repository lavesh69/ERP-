import { logger } from "@/lib/logging/logger";

interface MetricRecord {
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

const metricsBuffer: MetricRecord[] = [];
const MAX_BUFFER_SIZE = 1000;

export function recordApiMetric(path: string, status: number, durationMs: number): void {
  metricsBuffer.push({
    path,
    status,
    durationMs,
    timestamp: Date.now(),
  });

  if (metricsBuffer.length > MAX_BUFFER_SIZE) {
    metricsBuffer.shift();
  }

  // Trigger alert if status is 500+
  if (status >= 500) {
    dispatchWebhookAlert(
      "High Priority Server Error (5xx)",
      `Endpoint ${path} returned HTTP ${status} in ${durationMs}ms`,
      { path, status, durationMs }
    ).catch(() => {});
  }
}

export function getTelemetrySummary() {
  if (metricsBuffer.length === 0) {
    return {
      totalRequests: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      errorRatePercent: 0,
      statusBreakdown: { "2xx": 0, "4xx": 0, "5xx": 0 },
    };
  }

  const sortedDurations = [...metricsBuffer].map((m) => m.durationMs).sort((a, b) => a - b);
  const total = sortedDurations.length;

  const p50 = sortedDurations[Math.floor(total * 0.5)] || 0;
  const p95 = sortedDurations[Math.floor(total * 0.95)] || 0;
  const p99 = sortedDurations[Math.floor(total * 0.99)] || 0;

  let count2xx = 0;
  let count4xx = 0;
  let count5xx = 0;

  metricsBuffer.forEach((m) => {
    if (m.status >= 200 && m.status < 300) count2xx++;
    else if (m.status >= 400 && m.status < 500) count4xx++;
    else if (m.status >= 500) count5xx++;
  });

  const errorRatePercent = Number(((count5xx / total) * 100).toFixed(2));

  return {
    totalRequests: total,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    errorRatePercent,
    statusBreakdown: { "2xx": count2xx, "4xx": count4xx, "5xx": count5xx },
  };
}

export async function dispatchWebhookAlert(title: string, message: string, details?: any): Promise<boolean> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  logger.error(`[APM TELEMETRY ALERT] ${title}: ${message}`, details);

  if (!webhookUrl || !webhookUrl.startsWith("http")) {
    return false; // No live webhook URL configured, logged to internal audit
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🚨 **[CLASSROOM ERP ALERT]** ${title}\n${message}\n\`\`\`json\n${JSON.stringify(details || {}, null, 2)}\n\`\`\``,
      }),
    });
    return true;
  } catch (err) {
    logger.error("Failed to post alert to external webhook:", err);
    return false;
  }
}
