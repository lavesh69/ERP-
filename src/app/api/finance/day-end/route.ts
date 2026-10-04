import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const FINANCE_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, FINANCE_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const startOfDay = new Date(`${dateParam}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateParam}T23:59:59.999Z`);

    const tenantFilter: any = {
      transactedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "SUCCESS",
    };

    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      tenantFilter.studentFee = {
        student: { user: { institutionId: auth.payload.institutionId } },
      };
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where: tenantFilter,
      include: {
        studentFee: {
          include: {
            student: { include: { user: true } },
            feeStructure: true,
          },
        },
      },
      orderBy: { transactedAt: "desc" },
    });

    const methodBreakdown: Record<string, { count: number; totalAmount: number }> = {};
    let grandTotal = 0;

    for (const t of transactions) {
      const method = t.paymentMethod || "OTHER";
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = { count: 0, totalAmount: 0 };
      }
      methodBreakdown[method].count += 1;
      methodBreakdown[method].totalAmount += t.amount;
      grandTotal += t.amount;
    }

    const reconciliationSeal = crypto
      .createHash("sha256")
      .update(`${dateParam}:${grandTotal}:${transactions.length}:${auth.payload.email}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    return NextResponse.json({
      success: true,
      settlementDate: dateParam,
      reconciliationSignOff: {
        settledBy: auth.payload.email,
        signOffTimestamp: new Date().toISOString(),
        cryptographicProofHash: reconciliationSeal,
        status: "RECONCILED",
      },
      summary: {
        totalTransactionCount: transactions.length,
        totalCollectionAmount: grandTotal,
        currency: "USD",
        methodBreakdown,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        ref: t.referenceNumber,
        studentName: `${t.studentFee.student.user.firstName} ${t.studentFee.student.user.lastName}`,
        rollNumber: t.studentFee.student.rollNumber,
        feeTitle: t.studentFee.feeStructure.title,
        amount: t.amount,
        method: t.paymentMethod,
        timestamp: t.transactedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    logger.error("Day-End finance reconciliation GET error", error);
    return NextResponse.json({ error: "Failed to compile day-end cash book" }, { status: 500 });
  }
}
