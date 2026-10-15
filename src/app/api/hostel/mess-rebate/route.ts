import { NextRequest, NextResponse } from "next/server";
import {
  getAllRebates,
  getAllTokens,
  getMessRebateAnalytics,
  applyMessRebate,
  approveMessRebate,
  creditMessRebateToBursar,
  generateDailyMealToken,
  consumeMealToken,
} from "@/lib/hostel/mess-rebate-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || undefined;
    const hostelName = searchParams.get("hostelName") || undefined;
    const status = searchParams.get("status") || undefined;
    const mealType = searchParams.get("mealType") || undefined;
    const date = searchParams.get("date") || undefined;

    const rebates = getAllRebates({ studentId, hostelName, status });
    const tokens = getAllTokens({ studentId, mealType, date });
    const analytics = getMessRebateAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        rebates,
        tokens,
        analytics,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch mess rebate data" },
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
        { success: false, error: "Action parameter is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "APPLY_REBATE": {
        const {
          studentId,
          rollNumber,
          studentName,
          hostelName,
          roomNumber,
          leaveStartDate,
          leaveEndDate,
          leaveReason,
          leaveApplicationRef,
          dailyDietRateInr,
        } = body;

        if (
          !studentId ||
          !rollNumber ||
          !studentName ||
          !hostelName ||
          !roomNumber ||
          !leaveStartDate ||
          !leaveEndDate ||
          !leaveReason
        ) {
          return NextResponse.json(
            { success: false, error: "Missing required rebate application fields" },
            { status: 400 }
          );
        }

        const application = applyMessRebate({
          studentId,
          rollNumber,
          studentName,
          hostelName,
          roomNumber,
          leaveStartDate,
          leaveEndDate,
          leaveReason,
          leaveApplicationRef,
          dailyDietRateInr: dailyDietRateInr ? Number(dailyDietRateInr) : undefined,
        });

        return NextResponse.json({ success: true, data: application });
      }

      case "APPROVE_REBATE": {
        const { rebateId, approved, wardenApprovalNotes, wardenSignatory } = body;
        if (!rebateId || typeof approved !== "boolean") {
          return NextResponse.json(
            { success: false, error: "rebateId and boolean approved flag are required" },
            { status: 400 }
          );
        }

        const updated = approveMessRebate({
          rebateId,
          approved,
          wardenApprovalNotes,
          wardenSignatory,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case "CREDIT_BURSAR": {
        const { rebateId } = body;
        if (!rebateId) {
          return NextResponse.json(
            { success: false, error: "rebateId is required" },
            { status: 400 }
          );
        }

        const updated = creditMessRebateToBursar(rebateId);
        return NextResponse.json({ success: true, data: updated });
      }

      case "GENERATE_TOKEN": {
        const { studentId, studentRollNumber, studentName, hostelName, date, mealType } = body;
        if (!studentId || !studentRollNumber || !studentName || !hostelName || !date || !mealType) {
          return NextResponse.json(
            { success: false, error: "Missing required meal token parameters" },
            { status: 400 }
          );
        }

        const token = generateDailyMealToken({
          studentId,
          studentRollNumber,
          studentName,
          hostelName,
          date,
          mealType,
        });

        return NextResponse.json({ success: true, data: token });
      }

      case "CONSUME_TOKEN": {
        const { tokenId, messManager } = body;
        if (!tokenId) {
          return NextResponse.json(
            { success: false, error: "tokenId is required" },
            { status: 400 }
          );
        }

        const token = consumeMealToken({ tokenId, messManager });
        return NextResponse.json({ success: true, data: token });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
