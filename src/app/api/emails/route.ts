import { NextRequest, NextResponse } from "next/server";
import { getOutboxEmails } from "@/lib/email/email-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const to = searchParams.get("to");
    const type = searchParams.get("type");

    let emails = getOutboxEmails();

    if (to) {
      emails = emails.filter((e) => e.to.toLowerCase() === to.toLowerCase());
    }
    if (type) {
      emails = emails.filter((e) => e.type === type);
    }

    return NextResponse.json({
      success: true,
      count: emails.length,
      emails,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to read email outbox", details: error.message }, { status: 500 });
  }
}
