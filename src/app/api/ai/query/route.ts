import { NextRequest, NextResponse } from "next/server";
import { executeAutonomousAgent } from "@/lib/ai/agents";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt || body.query || "";
    const agentId = body.agentId || "academic";
    const userId = body.userId || body.context?.userEmail || "usr-anon-01";
    const userRole = body.userRole || body.context?.role || "STUDENT";

    if (!prompt.trim()) {
      return NextResponse.json(
        { error: "Query or prompt parameter is required." },
        { status: 400 }
      );
    }

    const result = await executeAutonomousAgent({
      agentId,
      userId,
      userRole,
      prompt: prompt.trim(),
    });

    await logAuditEvent({
      actorUserId: userId,
      action: "AI_QUERY_EXECUTION",
      targetEntity: `Agent:${agentId}`,
      details: {
        prompt: prompt.substring(0, 100),
        status: result.status,
      },
    });

    return NextResponse.json({
      success: true,
      answer: result.content,
      content: result.content,
      citations: result.citations,
      agentId: result.agentId,
      status: result.status,
    });
  } catch (error: any) {
    console.error("AI Query API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process AI query" },
      { status: 500 }
    );
  }
}
