/**
 * CLASSROOM ERP — High-Concurrency Load Testing & Micro-Benchmark Suite
 * Measures throughput, latency distributions (p50, p90, p95, p99),
 * error budgets, and memory consumption for enterprise stress testing.
 */

import crypto from "crypto";

export interface BenchmarkConfig {
  name: string;
  totalOperations: number;
  concurrency: number;
  timeoutMs?: number;
}

export interface LatencyDistribution {
  minMs: number;
  maxMs: number;
  meanMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}

export interface BenchmarkResult {
  name: string;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  concurrency: number;
  totalDurationMs: number;
  throughputRps: number;
  latencies: LatencyDistribution;
  memoryUsage: {
    heapUsedBeforeMb: number;
    heapUsedAfterMb: number;
    heapDeltaMb: number;
  };
  errors: Record<string, number>;
  timestamp: string;
}

/**
 * Calculates requested percentile from an ascending sorted numeric array
 */
export function calculatePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const rank = (p / 100) * (sortedValues.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);
  const weight = rank - lowerIndex;
  const val = sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
  return Math.round(val * 100) / 100;
}

/**
 * Executes a load benchmark harness across concurrent worker pools
 */
export async function runLoadBenchmark<T>(
  config: BenchmarkConfig,
  operation: (iterationIndex: number) => Promise<T>
): Promise<BenchmarkResult> {
  const { name, totalOperations, concurrency, timeoutMs = 10000 } = config;

  const initialHeap = process.memoryUsage().heapUsed;
  const latencies: number[] = [];
  const errors: Record<string, number> = {};
  let successful = 0;
  let failed = 0;

  let nextIndex = 0;
  const overallStartTime = performance.now();

  // Worker loop pulling iterations from global index
  async function worker() {
    while (true) {
      const idx = nextIndex++;
      if (idx >= totalOperations) break;

      const opStart = performance.now();
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Operation timed out")), timeoutMs)
        );

        await Promise.race([operation(idx), timeoutPromise]);
        const opDuration = performance.now() - opStart;
        latencies.push(opDuration);
        successful++;
      } catch (err: any) {
        const opDuration = performance.now() - opStart;
        latencies.push(opDuration);
        failed++;
        const errMsg = err?.message || "Unknown error";
        errors[errMsg] = (errors[errMsg] || 0) + 1;
      }
    }
  }

  // Launch worker pool
  const effectiveConcurrency = Math.max(1, Math.min(concurrency, totalOperations));
  const workers = Array.from({ length: effectiveConcurrency }, () => worker());
  await Promise.all(workers);

  const overallDuration = Math.max(1, performance.now() - overallStartTime);
  const finalHeap = process.memoryUsage().heapUsed;

  // Compute Latency Percentiles
  latencies.sort((a, b) => a - b);
  const minMs = latencies.length > 0 ? Math.round(latencies[0] * 100) / 100 : 0;
  const maxMs = latencies.length > 0 ? Math.round(latencies[latencies.length - 1] * 100) / 100 : 0;
  const sumMs = latencies.reduce((acc, v) => acc + v, 0);
  const meanMs = latencies.length > 0 ? Math.round((sumMs / latencies.length) * 100) / 100 : 0;

  const distribution: LatencyDistribution = {
    minMs,
    maxMs,
    meanMs,
    p50Ms: calculatePercentile(latencies, 50),
    p90Ms: calculatePercentile(latencies, 90),
    p95Ms: calculatePercentile(latencies, 95),
    p99Ms: calculatePercentile(latencies, 99),
  };

  const throughputRps = Math.round((totalOperations / (overallDuration / 1000)) * 10) / 10;
  const toMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

  return {
    name,
    totalOperations,
    successfulOperations: successful,
    failedOperations: failed,
    concurrency: effectiveConcurrency,
    totalDurationMs: Math.round(overallDuration * 100) / 100,
    throughputRps,
    latencies: distribution,
    memoryUsage: {
      heapUsedBeforeMb: toMb(initialHeap),
      heapUsedAfterMb: toMb(finalHeap),
      heapDeltaMb: toMb(finalHeap - initialHeap),
    },
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Standard Micro-Benchmark: HMAC-SHA256 Token Verification (Attendance QR verification)
 */
export async function benchmarkCryptoHmacThroughput(
  operations: number = 200,
  concurrency: number = 10
): Promise<BenchmarkResult> {
  const secretKey = "test-classroom-benchmark-secret-key-32b";
  const payload = JSON.stringify({
    courseId: "crs-cs-301",
    sectionId: "sec-a",
    timestamp: Date.now(),
    nonce: "non-89102",
  });

  return runLoadBenchmark(
    {
      name: "Crypto HMAC-SHA256 Verification",
      totalOperations: operations,
      concurrency,
    },
    async () => {
      const hmac = crypto.createHmac("sha256", secretKey);
      hmac.update(payload);
      const signature = hmac.digest("hex");
      // Verify signature
      const verifyHmac = crypto.createHmac("sha256", secretKey);
      verifyHmac.update(payload);
      const expected = verifyHmac.digest("hex");
      if (signature !== expected) throw new Error("Signature verification failed");
    }
  );
}

/**
 * Standard Micro-Benchmark: CSV Injection Sanitization & Data Formatting
 */
export async function benchmarkSanitizationThroughput(
  operations: number = 200,
  concurrency: number = 10
): Promise<BenchmarkResult> {
  const dirtyData = [
    '=cmd|"/c calc"!A1',
    "+1234567890",
    "-SUM(A1:A10)",
    "@evil.server.domain",
    "Normal Academic Text, with comma",
    "Student Name: John Doe",
  ];

  return runLoadBenchmark(
    {
      name: "Tabular Formula Injection Sanitization",
      totalOperations: operations,
      concurrency,
    },
    async (idx) => {
      const cell = dirtyData[idx % dirtyData.length];
      const trimmed = cell.trim();
      const firstChar = trimmed.charAt(0);
      const isDangerous = ["=", "+", "-", "@", "\t", "\r"].includes(firstChar);
      const sanitized = isDangerous ? `'${trimmed}` : trimmed;
      if (isDangerous && !sanitized.startsWith("'")) {
        throw new Error("Sanitization failed to neutralize formula");
      }
    }
  );
}
