import { NextRequest, NextResponse } from "next/server";
import { executeAutonomousAgent } from "@/lib/ai/agents";
import { logAuditEvent } from "@/lib/audit/logger";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { TokenBudgetEngine } from "@/lib/ai/token-budget-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const userId = session?.userId || session?.email || "usr-anon-01";
    const userRole = session?.role || "STUDENT";
    const quota = TokenBudgetEngine.checkQuota(userId, userRole);
    return NextResponse.json({ success: true, quota });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const prompt = body.prompt || body.query || "";
    const agentId = body.agentId || "academic";
    // Always bind to verified session identity if logged in; prevent client role tampering
    const userId = session?.userId || session?.email || body.userId || "usr-anon-01";
    const userRole = session?.role || "STUDENT";

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Query or prompt parameter is required." },
        { status: 400 }
      );
    }

    const promptTokens = TokenBudgetEngine.estimateTokens(prompt);
    const quotaCheck = TokenBudgetEngine.checkQuota(userId, userRole, promptTokens);

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: `Daily AI token limit reached (${quotaCheck.consumed}/${quotaCheck.limit} tokens consumed). Quota resets at midnight in ${quotaCheck.resetInMinutes} minutes.`,
          quota: quotaCheck,
        },
        { status: 429 }
      );
    }

    const result = await executeAutonomousAgent({
      agentId,
      userId,
      userRole,
      institutionId: session?.institutionId,
      prompt: prompt.trim(),
    });

    const completionTokens = TokenBudgetEngine.estimateTokens(result.content);
    TokenBudgetEngine.recordUsage(userId, promptTokens + completionTokens);

    await logAuditEvent({
      actorUserId: userId,
      action: "AI_QUERY_EXECUTION",
      targetEntity: `Agent:${agentId}`,
      details: {
        prompt: prompt.substring(0, 100),
        status: result.status,
        tokensSpent: promptTokens + completionTokens,
      },
    });

    return NextResponse.json({
      success: true,
      answer: result.content,
      content: result.content,
      citations: result.citations,
      agentId: result.agentId,
      status: result.status,
      quota: TokenBudgetEngine.checkQuota(userId, userRole),
    });
  } catch (error: any) {
    console.error("AI Query API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI query" },
      { status: 500 }
    );
  }
}
