import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { executeAutonomousAgent } from "@/lib/ai/agents";
import { logAuditEvent } from "@/lib/audit/logger";
import { loginRateLimiter } from "@/lib/auth/rate-limiter";

const SETTINGS_FILE = path.join(process.cwd(), "data", "system_settings.json");

function isAiEnabled(): boolean {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
      const settings = JSON.parse(raw);
      if (settings.aiQuestionGeneration === false || settings.enableAiAssistant === false) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. PDF Item 9: Kill Switch verification
    if (!isAiEnabled()) {
      return NextResponse.json(
        {
          error: "AI Copilot has been temporarily disabled by institutional administration kill-switch policy.",
          status: "DISABLED",
        },
        { status: 503 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await req.json();
    const { agentId, prompt, userId, userRole, actionRequested } = body;

    // 2. PDF Items 2 & 8: Rate limiting & AI usage limits
    const rateLimitKey = `ai:${userId || ip}`;
    const rateCheck = loginRateLimiter.check(rateLimitKey, 30, 60000); // 30 req / min
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "AI rate limit exceeded. Please wait before submitting more queries.",
          remaining: 0,
          resetTimeMs: rateCheck.resetTimeMs,
        },
        { status: 429 }
      );
    }

    // 3. PDF Items 3 & 4: Input validation & sanitization
    if (!agentId || !prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "agentId and prompt are required parameters" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt exceeds maximum allowed length of 2000 characters." },
        { status: 400 }
      );
    }

    // Sanitize prompt against script injection
    const sanitizedPrompt = prompt
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .trim();

    const result = await executeAutonomousAgent({
      agentId,
      userId: userId || "usr-anon-01",
      userRole: userRole || "STUDENT",
      prompt: sanitizedPrompt,
      actionRequested,
    });

    await logAuditEvent({
      actorUserId: userId || "usr-anon-01",
      action: "AI_AGENT_EXECUTION",
      targetEntity: `Agent:${agentId}`,
      details: {
        prompt: sanitizedPrompt.substring(0, 100),
        status: result.status,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI Agent Execution API Error:", error);
    return NextResponse.json(
      { error: "Internal AI Gateway failure processing agent request" },
      { status: 500 }
    );
  }
}
