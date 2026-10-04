import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

interface PlacementCheckRequest {
  studentId: string;
  currentOffers: Array<{ companyName: string; ctcLpa: number; isAccepted: boolean }>;
  targetJobCtcLpa: number;
  targetJobTier: "MASS" | "CORE" | "DREAM" | "SUPER_DREAM";
}

function evaluateOneJobPolicy(req: PlacementCheckRequest) {
  const { currentOffers, targetJobCtcLpa, targetJobTier } = req;

  if (!currentOffers || currentOffers.length === 0) {
    return {
      isAllowedToApply: true,
      reason: "Scholar currently has 0 job offers. Eligible for all campus recruitment drives.",
      dreamOfferEligible: false,
    };
  }

  const highestExistingCtc = Math.max(...currentOffers.map((o) => o.ctcLpa));

  // "One Student One Job" Rule:
  // If placed, student can ONLY apply if target company offers at least 1.5x CTC (Dream Offer policy)
  const dreamMultiplier = 1.5;
  const dreamThreshold = highestExistingCtc * dreamMultiplier;

  if (targetJobCtcLpa >= dreamThreshold || targetJobTier === "SUPER_DREAM") {
    return {
      isAllowedToApply: true,
      reason: `Dream Offer exception unlocked: Target package (${targetJobCtcLpa} LPA) satisfies the >= 1.5x threshold over current offer (${highestExistingCtc} LPA).`,
      dreamOfferEligible: true,
      highestExistingCtc,
      targetJobCtcLpa,
    };
  }

  return {
    isAllowedToApply: false,
    reason: `Application restricted under 'One Student One Job' Senate Placement Policy. Candidate is already placed at ${highestExistingCtc} LPA. Target package must be at least ${dreamThreshold.toFixed(1)} LPA (1.5x) to qualify as a Dream Offer.`,
    dreamOfferEligible: false,
    highestExistingCtc,
    targetJobCtcLpa,
    requiredCtcThreshold: dreamThreshold,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const evaluation = evaluateOneJobPolicy(body);

    return NextResponse.json({
      success: true,
      studentId: body.studentId,
      evaluation,
    });
  } catch (error: any) {
    logger.error("Career policy POST error", error);
    return NextResponse.json({ error: "Failed to evaluate placement policy" }, { status: 500 });
  }
}
