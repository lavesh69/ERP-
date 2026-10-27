import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import { alumniStore } from "@/lib/alumni/alumni-store";

export async function GET(req: NextRequest) {
  try {
    const campaigns = alumniStore.getCampaigns();
    return NextResponse.json({ success: true, campaigns });
  } catch (error: any) {
    logger.error("Alumni giving GET error", error);
    return NextResponse.json({ error: error.message || "Failed to load giving campaigns" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { campaignId, donorName, donorEmail, donorPan, amount, isAnonymous, paymentMethod } = body;

    if (!campaignId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Campaign ID and positive contribution amount are required" }, { status: 400 });
    }

    const donation = alumniStore.recordDonation({
      campaignId,
      donorName: donorName || session?.fullName || "Distinguished Alumnus",
      donorEmail: donorEmail || session?.email,
      donorPan,
      amount: Number(amount),
      isAnonymous: Boolean(isAnonymous),
      paymentMethod,
    });

    return NextResponse.json({
      success: true,
      message: `Donation of ₹${donation.amount.toLocaleString("en-IN")} acknowledged with official receipt ${donation.receiptNo}`,
      donation,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Alumni donation POST error", error);
    return NextResponse.json({ error: error.message || "Failed to process alumni donation" }, { status: 400 });
  }
}
