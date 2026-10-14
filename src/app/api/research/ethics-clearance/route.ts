import { NextRequest, NextResponse } from "next/server";
import {
  getAllProtocols,
  submitProtocol,
  castBoardVote,
  getIRBAnalytics,
} from "@/lib/research/ethics-clearance-engine";

export async function GET() {
  try {
    const protocols = getAllProtocols();
    const analytics = getIRBAnalytics();
    return NextResponse.json({
      success: true,
      count: protocols.length,
      protocols,
      analytics,
    });
  } catch (error: any) {
    console.error("Error in GET /api/research/ethics-clearance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch ethics protocols" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "Action is required ('SUBMIT_PROTOCOL', 'CAST_VOTE')" },
        { status: 400 }
      );
    }

    if (action === "SUBMIT_PROTOCOL") {
      const {
        title,
        principalInvestigator,
        piEmail,
        department,
        riskTier,
        studyType,
        vulnerablePopulationsInvolved,
        dataPrivacyProtocol,
      } = body;

      if (!title || !principalInvestigator || !piEmail || !department || !riskTier || !studyType) {
        return NextResponse.json(
          { success: false, error: "Missing required fields for ethics submission" },
          { status: 400 }
        );
      }

      const protocol = submitProtocol({
        title,
        principalInvestigator,
        piEmail,
        department,
        riskTier,
        studyType,
        vulnerablePopulationsInvolved: Boolean(vulnerablePopulationsInvolved),
        dataPrivacyProtocol: dataPrivacyProtocol || "Standard institutional research privacy procedures",
      });

      return NextResponse.json({
        success: true,
        message: "Ethics protocol registered with Institutional Review Board",
        protocol,
      });
    }

    if (action === "CAST_VOTE") {
      const { protocolId, memberName, role, decision, remarks } = body;
      if (!protocolId || !memberName || !decision) {
        return NextResponse.json(
          { success: false, error: "protocolId, memberName, and decision are required" },
          { status: 400 }
        );
      }

      const updated = castBoardVote(protocolId, {
        memberName,
        role: role || "CLINICAL_ETHICIST",
        decision,
        remarks: remarks || "Review completed according to Belmont Report principles.",
      });

      return NextResponse.json({
        success: true,
        message: `Board vote recorded for protocol ${protocolId}`,
        protocol: updated,
      });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in POST /api/research/ethics-clearance:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process ethics protocol request" },
      { status: 500 }
    );
  }
}
