import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import {
  getAllRefundVouchers,
  createRefundVoucher,
  updateRefundVoucherStatus,
} from "@/lib/finance/finance-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vouchers = getAllRefundVouchers();
    return NextResponse.json({
      success: true,
      vouchers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve refund vouchers", details: error.message },
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "REQUEST_REFUND";

    if (action === "REQUEST_REFUND") {
      const voucher = createRefundVoucher(body);
      return NextResponse.json({
        success: true,
        message: `Refund voucher ${voucher.voucherNo} created for $${voucher.amount}.`,
        voucher,
      });
    }

    const financeRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];
    if (!financeRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "Forbidden: Only Bursars can approve or disburse refund vouchers." },
        { status: 403 }
      );
    }

    if (action === "APPROVE_REFUND") {
      const updated = updateRefundVoucherStatus(body.voucherId, "APPROVED", session.email);
      if (!updated) {
        return NextResponse.json({ error: "Refund voucher not found" }, { status: 404 });
      }

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: "REFUND_APPROVED",
        targetEntity: "RefundVoucher",
        targetId: updated.id,
        details: { voucherNo: updated.voucherNo, amount: updated.amount, recipient: updated.studentName },
      });

      return NextResponse.json({
        success: true,
        message: `Refund voucher ${updated.voucherNo} approved for disbursement.`,
        voucher: updated,
      });
    }

    if (action === "DISBURSE_REFUND") {
      const updated = updateRefundVoucherStatus(body.voucherId, "DISBURSED", session.email);
      if (!updated) {
        return NextResponse.json({ error: "Refund voucher not found" }, { status: 404 });
      }

      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: "REFUND_DISBURSED",
        targetEntity: "RefundVoucher",
        targetId: updated.id,
        details: { voucherNo: updated.voucherNo, amount: updated.amount, recipient: updated.studentName },
      });

      return NextResponse.json({
        success: true,
        message: `Funds disbursed for voucher ${updated.voucherNo} to student's verified bank account.`,
        voucher: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to process refund action", details: error.message },
      { status: 500 }
    );
  }
}
