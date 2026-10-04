import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const FINANCE_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, FINANCE_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { studentFeeId, concessionAmount, reason, category } = body;

    if (!studentFeeId || !concessionAmount) {
      return NextResponse.json(
        { error: "studentFeeId and concessionAmount are required" },
        { status: 400 }
      );
    }

    const discountNum = Number(concessionAmount);
    if (isNaN(discountNum) || discountNum <= 0) {
      return NextResponse.json({ error: "Concession amount must be a positive number" }, { status: 400 });
    }

    const fee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: {
        student: { include: { user: true } },
        feeStructure: true,
      },
    });

    if (!fee) {
      return NextResponse.json({ error: "Student fee record not found" }, { status: 404 });
    }

    if (
      auth.payload.role !== "SUPER_ADMIN" &&
      auth.payload.institutionId &&
      fee.student.user.institutionId !== auth.payload.institutionId
    ) {
      return NextResponse.json({ error: "Forbidden: Cross-tenant concession prohibited" }, { status: 403 });
    }

    const currentDiscount = fee.discountAmount || 0;
    const newTotalDiscount = currentDiscount + discountNum;
    const effectiveTotal = Math.max(0, fee.totalAmount - newTotalDiscount);
    const newStatus = fee.paidAmount >= effectiveTotal ? "PAID" : fee.paidAmount > 0 ? "PARTIAL" : "PENDING";

    const updated = await prisma.studentFee.update({
      where: { id: studentFeeId },
      data: {
        discountAmount: newTotalDiscount,
        status: newStatus,
      },
    });

    await logAuditEvent({
      institutionId: fee.student.user.institutionId,
      actorUserId: auth.payload.userId || "accountant",
      action: "FEE_CONCESSION_GRANTED",
      targetEntity: "StudentFee",
      targetId: studentFeeId,
      details: {
        concessionAmount: discountNum,
        newTotalDiscount,
        category: category || "MERIT_OR_EWS_CONCESSION",
        reason: reason || "Approved by bursar",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Fee concession of $${discountNum} granted successfully to ${fee.student.user.firstName}.`,
      feeRecord: {
        id: updated.id,
        totalBilled: updated.totalAmount,
        totalDiscount: updated.discountAmount,
        paidAmount: updated.paidAmount,
        remainingPayable: Math.max(0, updated.totalAmount - updated.discountAmount - updated.paidAmount),
        status: updated.status,
      },
    });
  } catch (error: any) {
    logger.error("Fee concession POST error", error);
    return NextResponse.json({ error: "Failed to apply fee concession" }, { status: 500 });
  }
}
