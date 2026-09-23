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

    const feeTitle = fee.feeStructure?.title || "Semester Tuition & Lab Fee";

    const order = await createPaymentOrder({
      feeId,
      amount: Number(amount),
      currency: currency || "USD",
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
