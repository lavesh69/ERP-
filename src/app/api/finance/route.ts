import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { processPaymentSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logging/logger";
import { getOptionalSession } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const role = session?.role;

    // FERPA Compliance: Academic faculty have zero access to student billing & ledgers
    if (role && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(role)) {
      return NextResponse.json(
        { error: "Forbidden: Academic faculty are restricted from accessing student financial records (FERPA compliance)." },
        { status: 403 }
      );
    }

    const isStudent = role === "STUDENT";

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // Role-based scoping: students only see their own fees and transactions
    const studentFeeWhere = isStudent
      ? {
          student: {
            OR: [
              { userId: session?.userId },
              { user: { email: session?.email } },
            ],
          },
        }
      : {};

    const transactionWhere = isStudent
      ? {
          studentFee: {
            student: {
              OR: [
                { userId: session?.userId },
                { user: { email: session?.email } },
              ],
            },
          },
        }
      : {};

    const [feeStructures, studentFees, transactions] = await Promise.all([
      prisma.feeStructure.findMany(),
      prisma.studentFee.findMany({
        where: studentFeeWhere,
        include: {
          student: { include: { user: true } },
          feeStructure: true,
          transactions: true,
        },
      }),
      prisma.paymentTransaction.findMany({
        where: transactionWhere,
        include: {
          studentFee: {
            include: {
              student: { include: { user: true } },
              feeStructure: true,
            },
          },
        },
        orderBy: { transactedAt: "desc" },
        take: 10,
      }),
    ]);


    const totalBilled = studentFees.reduce((acc, f) => acc + f.totalAmount, 0);
    const totalCollected = studentFees.reduce((acc, f) => acc + f.paidAmount, 0);

    const formattedFees = studentFees
      .map((f) => ({
        id: f.id,
        studentId: f.student.id,
        studentName: `${f.student.user.firstName} ${f.student.user.lastName}`,
        rollNo: f.student.rollNumber,
        title: f.feeStructure.title,
        totalAmount: f.totalAmount,
        paidAmount: f.paidAmount,
        pendingAmount: f.totalAmount - f.paidAmount,
        status: f.status,
        dueDate: f.dueDate.toISOString().split("T")[0],
      }))
      .filter((f) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          f.studentName.toLowerCase().includes(q) ||
          f.rollNo.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q)
        );
      });

    const total = formattedFees.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedFees = formattedFees.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      summary: {
        totalBilled,
        totalCollected,
        pendingAmount: Math.max(0, totalBilled - totalCollected),
        collectionRate: totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(1) : "0",
      },
      feeStructures,
      studentFees: paginatedFees,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      recentTransactions: transactions.map((t) => ({
        id: t.id,
        studentName: `${t.studentFee.student.user.firstName} ${t.studentFee.student.user.lastName}`,
        feeTitle: t.studentFee.feeStructure.title,
        amount: t.amount,
        paymentMethod: t.paymentMethod,
        referenceNumber: t.referenceNumber,
        status: t.status,
        transactedAt: t.transactedAt,
      })),
    });
  } catch (error) {
    console.error("Finance GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee details" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const session = await getOptionalSession(req);
    const role = session?.role;

    if (role && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(role)) {
      return NextResponse.json(
        { error: "Forbidden: Academic faculty are restricted from modifying student financial records (FERPA compliance)." },
        { status: 403 }
      );
    }

    // C2: Zod validation
    const parsed = processPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { studentFeeId, amount, paymentMethod } = parsed.data;

    const fee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
    });

    if (!fee) {
      return NextResponse.json({ error: "Student fee record not found" }, { status: 404 });
    }

    const payAmount = Number(amount);
    const newPaidAmount = fee.paidAmount + payAmount;
    const newStatus = newPaidAmount >= fee.totalAmount ? "PAID" : "PARTIAL";

    const referenceNumber = `TXN-DEV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentFeeId,
        amount: payAmount,
        paymentMethod: paymentMethod || "DEVELOPMENT_SIMULATION",
        referenceNumber,
        status: "SUCCESS",
        gatewayResponse: "PROCESSED_IN_DEV_SANDBOX",
      },
    });

    await prisma.studentFee.update({
      where: { id: studentFeeId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // C4: Audit log
    logger.info("Payment recorded", { studentFeeId, amount: payAmount, referenceNumber, newStatus });

    return NextResponse.json({
      success: true,
      transaction,
      referenceNumber,
      newStatus,
      newPaidAmount,
    });
  } catch (error: any) {
    logger.error("Finance POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}

