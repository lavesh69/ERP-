import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { createPaymentOrder } from "@/lib/payments/payment-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feeId, amount, currency } = body;

    if (!feeId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Invalid feeId or amount" }, { status: 400 });
    }

    const fee = await prisma.studentFee.findUnique({
      where: { id: feeId },
      include: {
        feeStructure: true,
        student: { include: { user: true } },
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    }

    // IDOR Protection: Students can only initiate payment orders for their own fee invoices
    if (
      session.role === "STUDENT" &&
      fee.student.userId !== session.userId &&
      fee.student.user?.email !== session.email
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot create payment orders for another student" },
        { status: 403 }
      );
    }

    const pendingBalance = Math.max(0, fee.totalAmount - fee.paidAmount - (fee.discountAmount || 0));
    if (fee.status === "PAID" || pendingBalance <= 0) {
      return NextResponse.json(
        { error: "Fee is already fully settled. No pending balance remains." },
        { status: 400 }
      );
    }
    if (Number(amount) > pendingBalance) {
      return NextResponse.json(
        { error: `Payment amount (${amount}) exceeds pending fee balance of ${pendingBalance}` },
        { status: 400 }
      );
    }

    const feeTitle = fee.feeStructure?.title || "Semester Tuition & Lab Fee";

    const order = await createPaymentOrder({
      feeId,
      amount: Number(amount),
      currency: currency || "INR",
      studentId: fee.studentId,
      studentEmail: fee.student.user?.email || session.email,
      feeTitle,
    });

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create payment order" }, { status: 500 });
  }
}
