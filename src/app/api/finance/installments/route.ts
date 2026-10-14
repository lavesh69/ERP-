import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  getStudentInstallments,
  createCustomInstallmentPlan,
} from "@/lib/finance/finance-store";
import { generateInstallmentSchedule } from "@/lib/finance/finance-engine";

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

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const allowedFinanceRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];
    if (!allowedFinanceRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Bursar or Accountant credentials required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "CREATE_CUSTOM_PLAN") {
      const { studentFeeId, customSplits, concessionAmount } = body;
      if (!studentFeeId || !Array.isArray(customSplits) || customSplits.length === 0) {
        return NextResponse.json({ error: "Missing studentFeeId or valid customSplits array" }, { status: 400 });
      }

      // Validate percentage sum
      const totalPct = customSplits.reduce((acc: number, s: any) => acc + (Number(s.percentage) || 0), 0);
      if (Math.round(totalPct) !== 100) {
        return NextResponse.json({ error: `Custom installment percentages must sum to 100% (currently ${totalPct}%)` }, { status: 400 });
      }

      const fee = await prisma.studentFee.findUnique({
        where: { id: studentFeeId },
        include: { student: { include: { user: true } } },
      });

      if (!fee) {
        return NextResponse.json({ error: "Target student fee record not found" }, { status: 404 });
      }

      const netTotal = Math.max(0, fee.totalAmount - (Number(concessionAmount) || 0));
      const milestones = generateInstallmentSchedule(netTotal, customSplits);

      const plan = createCustomInstallmentPlan({
        studentFeeId: fee.id,
        studentId: fee.studentId,
        studentName: `${fee.student.user.firstName} ${fee.student.user.lastName}`,
        rollNo: fee.student.rollNumber,
        totalFee: netTotal,
        milestones,
      });

      return NextResponse.json({
        success: true,
        message: "Bursar Flexi-Pay dynamic installment schedule configured successfully",
        plan,
      }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action. Supported: CREATE_CUSTOM_PLAN" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error processing installment plan", details: error.message },
      { status: 500 }
    );
  }
}
