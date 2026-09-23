import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { verifyPaymentSignature } from "@/lib/payments/payment-service";
import { logAuditEvent } from "@/lib/audit/logger";
import { sendEmail } from "@/lib/email/email-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { feeId, orderId, paymentId, signature, amount } = body;

    if (!feeId || !orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing required payment signature parameters" }, { status: 400 });
    }

    const isValid = verifyPaymentSignature({ orderId, paymentId, signature });
    if (!isValid) {
      return NextResponse.json({ error: "Invalid cryptographic payment signature" }, { status: 400 });
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

    const pending = Math.max(0, fee.totalAmount - fee.paidAmount - fee.discountAmount);
    const amountPaid = Number(amount) || pending;
    const newPaidAmount = fee.paidAmount + amountPaid;
    const newStatus = newPaidAmount + fee.discountAmount >= fee.totalAmount ? "PAID" : "PARTIAL";

    // 1. Update Student Fee Ledger
    const updatedFee = await prisma.studentFee.update({
      where: { id: feeId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // 2. Insert Payment Transaction Record
    const refNumber = `TXN-${Date.now().toString().slice(-6)}-${paymentId.slice(-4)}`;
    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentFeeId: feeId,
        amount: amountPaid,
        paymentMethod: `Online Gateway (${paymentId})`,
        referenceNumber: refNumber,
        status: "SUCCESS",
      },
    });

    // 3. Log Immutable Bursar Audit Trail
    await logAuditEvent({
      institutionId: session.institutionId || "inst-apex-01",
      actorUserId: session.userId,
      action: "FEE_COLLECTED",
      targetEntity: "StudentFee",
      targetId: feeId,
      details: {
        amountPaid,
        referenceNumber: refNumber,
        paymentId,
        studentId: fee.studentId,
      },
    });

    // 4. Send Confirmation & Digital Receipt Email
    const studentEmail = fee.student.user?.email || session.email;
    const studentFullName = `${fee.student.user?.firstName || "Scholar"} ${fee.student.user?.lastName || ""}`.trim();
    const feeTitle = fee.feeStructure?.title || "Semester Tuition & Lab Fee";

    if (studentEmail) {
      await sendEmail({
        to: studentEmail,
        subject: `Fee Payment Receipt: ${refNumber}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #231e21;">
            <h2 style="color: #8e5368;">Payment Authorized & Settled</h2>
            <p>Dear ${studentFullName},</p>
            <p>Your institutional fee payment of <strong>$${amountPaid.toLocaleString()}.00</strong> for <strong>${feeTitle}</strong> has been confirmed.</p>
            <p><strong>Reference Number:</strong> ${refNumber}<br/><strong>Payment ID:</strong> ${paymentId}</p>
            <p>Office of the Bursar & Treasury</p>
          </div>
        `,
        type: "PAYMENT_RECEIPT",
      });
    }

    return NextResponse.json({
      success: true,
      transaction,
      fee: updatedFee,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Payment verification failed" }, { status: 500 });
  }
}
