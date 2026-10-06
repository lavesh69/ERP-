import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { getStudentInstallments } from "@/lib/finance/finance-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentFeeId = searchParams.get("studentFeeId") || undefined;

    const plans = await getStudentInstallments(studentFeeId);
    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to load installment plans", details: error.message },
      { status: 500 }
    );
  }
}
