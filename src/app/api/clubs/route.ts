import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { clubsStore } from "@/lib/clubs/clubs-store";
import { ClaimStatus } from "@/lib/clubs/clubs-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access clubs portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const studentRoll = searchParams.get("roll") || undefined;

    if (tab === "clubs") {
      const clubs = clubsStore.getClubs();
      return NextResponse.json({ success: true, clubs });
    }

    if (tab === "claims") {
      const claims = clubsStore.getClaims(studentRoll);
      return NextResponse.json({ success: true, claims });
    }

    const summary = clubsStore.getSummary(studentRoll);
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Clubs API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve clubs data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform clubs operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "SUBMIT_CLAIM") {
      const {
        studentRoll,
        studentName,
        clubCode,
        activityTitle,
        description,
        participationHours,
        pointsClaimed,
        evidenceReference,
      } = body;

      if (!studentRoll || !clubCode || !activityTitle) {
        return NextResponse.json(
          { error: "Student roll number, club code, and activity title are required" },
          { status: 400 }
        );
      }

      const claim = clubsStore.submitClaim({
        studentRoll,
        studentName: studentName || session.fullName,
        clubCode,
        activityTitle,
        description,
        participationHours: Number(participationHours) || 10,
        pointsClaimed: Number(pointsClaimed) || 10,
        evidenceReference,
      });

      return NextResponse.json({
        success: true,
        message: `Activity claim registered successfully (${claim.claimRef})`,
        claim,
      });
    }

    if (action === "VERIFY_CLAIM") {
      const { claimId, status, pointsAwarded } = body;
      if (!claimId || !status) {
        return NextResponse.json({ error: "Claim ID and decision status are required" }, { status: 400 });
      }

      const claim = clubsStore.verifyClaim(
        claimId,
        status as ClaimStatus,
        pointsAwarded !== undefined ? Number(pointsAwarded) : undefined,
        session.fullName
      );

      return NextResponse.json({
        success: true,
        message: `Activity point claim ${claim.claimRef} verified as ${status}`,
        claim,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Clubs API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process clubs request" }, { status: 400 });
  }
}
