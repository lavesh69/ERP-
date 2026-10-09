import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth, ADMIN_ROLES } from "@/lib/auth/admin-guard";
import {
  benchmarkCryptoHmacThroughput,
  benchmarkSanitizationThroughput,
  runLoadBenchmark,
} from "@/lib/testing/load-benchmark";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRoleAuth(req, ADMIN_ROLES);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const memory = process.memoryUsage();
    return NextResponse.json({
      success: true,
      availableSuites: [
        {
          id: "HMAC_CRYPTO",
          name: "Crypto HMAC-SHA256 Token Verification",
          description: "Simulates high-throughput QR attendance scanning and signature verification under concurrency.",
        },
        {
          id: "DATA_SANITIZATION",
          name: "Tabular Formula Injection Sanitization",
          description: "Benchmarks high-velocity CSV and Excel export data scrubbing under concurrency.",
        },
        {
          id: "SYNTHETIC_WORKER",
          name: "Synthetic Async Job Execution",
          description: "Measures event loop latency and concurrency thread pool starvation.",
        },
      ],
      systemTelemetry: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.round(process.uptime()),
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error("Benchmark Telemetry Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve benchmark telemetry" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRoleAuth(req, ADMIN_ROLES);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const { suite = "HMAC_CRYPTO", operations = 100, concurrency = 10 } = body;

    // Sanitize parameters to avoid serverless resource exhaustion
    const safeOperations = Math.max(10, Math.min(Number(operations) || 100, 1000));
    const safeConcurrency = Math.max(1, Math.min(Number(concurrency) || 10, 50));

    let result;
    if (suite === "DATA_SANITIZATION") {
      result = await benchmarkSanitizationThroughput(safeOperations, safeConcurrency);
    } else if (suite === "SYNTHETIC_WORKER") {
      result = await runLoadBenchmark(
        {
          name: "Synthetic Async Worker",
          totalOperations: safeOperations,
          concurrency: safeConcurrency,
        },
        async (idx) => {
          // Synthetic async task simulating micro-task queue dispatch
          await new Promise((resolve) => setTimeout(resolve, idx % 3 === 0 ? 2 : 1));
        }
      );
    } else {
      // Default to HMAC_CRYPTO
      result = await benchmarkCryptoHmacThroughput(safeOperations, safeConcurrency);
    }

    return NextResponse.json({
      success: true,
      suite,
      benchmarkResult: result,
    });
  } catch (error: any) {
    console.error("Benchmark Execution Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute benchmark test" },
      { status: 500 }
    );
  }
}
