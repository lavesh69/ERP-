import { NextRequest, NextResponse } from "next/server";
import { getOutboxEmails } from "@/lib/email/email-service";
import { getOptionalSession } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required to access institutional outbox." },
        { status: 401 }
      );
    }

    const isAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(session.role);
    const { searchParams } = new URL(req.url);
    const requestedTo = searchParams.get("to");
    const type = searchParams.get("type");

    let emails = getOutboxEmails();

    // Non-admins can strictly only inspect messages addressed to their own verified email
    if (!isAdmin) {
      const userEmail = (session.email || "").toLowerCase();
      emails = emails.filter((e) => e.to.toLowerCase() === userEmail);
    } else if (requestedTo) {
      emails = emails.filter((e) => e.to.toLowerCase() === requestedTo.toLowerCase());
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

