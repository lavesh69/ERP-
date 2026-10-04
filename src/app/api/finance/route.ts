import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { processPaymentSchema } from "@/lib/validation/schemas";
import { logger } from "@/lib/logging/logger";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to access financial ledgers." },
        { status: 401 }
      );
    }
    const role = session.role;

    const isFinanceOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"].includes(role);
    const isStudent = role === "STUDENT";
    const isParent = role === "PARENT";

    if (!isFinanceOrAdmin && !isStudent && !isParent) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to access student financial records (FERPA compliance)." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // Resolve parent's wards if caller is a parent
    let parentStudentIds: string[] = [];
    if (isParent && session.userId) {
      const parentRecord = await prisma.parent.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { students: true },
      });
      if (parentRecord) {
        parentStudentIds = parentRecord.students.map((rel) => rel.studentId);
      }
    }

    // Role-based scoping: students see only their own fees; parents see their wards; finance staff see all
    const studentFeeWhere = isStudent
      ? {
          student: {
            OR: [
              { userId: session?.userId },
              { user: { email: session?.email } },
            ],
          },
        }
      : isParent
      ? {
          studentId: { in: parentStudentIds },
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
      : isParent
      ? {
          studentFee: {
            studentId: { in: parentStudentIds },
          },
        }
      : {};

    const whereClause: any = { ...studentFeeWhere };
    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { student: { user: { firstName: { contains: q } } } },
        { student: { user: { lastName: { contains: q } } } },
        { student: { rollNumber: { contains: q } } },
        { feeStructure: { title: { contains: q } } },
      ];
    }

    const [feeStructures, aggregates, totalCount, pagedStudentFees, transactions] = await Promise.all([
      prisma.feeStructure.findMany(),
      prisma.studentFee.aggregate({
        where: studentFeeWhere,
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
      prisma.studentFee.count({ where: whereClause }),
      prisma.studentFee.findMany({
        where: whereClause,
        include: {
          student: { include: { user: true } },
          feeStructure: true,
          transactions: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: "asc" },
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

    const totalBilled = aggregates._sum.totalAmount || 0;
    const totalCollected = aggregates._sum.paidAmount || 0;

    const formattedFees = pagedStudentFees.map((f) => ({
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
    }));

    const total = totalCount;
    const totalPages = Math.ceil(total / limit) || 1;
    const paginatedFees = formattedFees;

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

    // Offline Bank Challan Submission Workflow
    if (body.action === "SUBMIT_OFFLINE_CHALLAN") {
      const { studentFeeId, amount, bankName, branchName, challanRef, depositDate } = body;
      if (!studentFeeId || !amount) {
        return NextResponse.json({ error: "studentFeeId and amount are required" }, { status: 400 });
      }

      const fee = await prisma.studentFee.findUnique({
        where: { id: studentFeeId },
        include: { student: { include: { user: true } } },
      });

      if (!fee) {
        return NextResponse.json({ error: "Student fee record not found" }, { status: 404 });
      }

      const refNo = challanRef || `CHL-${Date.now()}`;
      const transaction = await prisma.paymentTransaction.create({
        data: {
          studentFeeId,
          amount: Number(amount),
          paymentMethod: "BANK_CHALLAN",
          referenceNumber: refNo,
          status: "PENDING",
          gatewayResponse: `Offline branch bank challan submitted. Bank: ${bankName || "National Bank"}, Branch: ${branchName || "Main Campus"}, Date: ${depositDate || new Date().toISOString().split("T")[0]}`,
        },
      });

      await prisma.studentRequest.create({
        data: {
          studentId: fee.studentId,
          type: "FEE_CHALLAN_VERIFICATION",
          title: `Bank Challan Deposit Verification: $${amount}`,
          reason: `Bank: ${bankName || "National Bank"}, Branch: ${branchName || "Main"}, Ref: ${refNo}, Amount: $${amount}`,
          status: "UNDER_REVIEW",
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: "Bank deposit challan registered successfully. Pending Bursar verification.",
        transaction,
        referenceNumber: refNo,
      });
    }

    // Bursar Offline Challan Approval & Settlement
    if (body.action === "APPROVE_CHALLAN") {
      const allowedApprovers = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"];
      if (!session || !allowedApprovers.includes(session.role)) {
        return NextResponse.json(
          { error: "Access denied. Only bursars and finance administrators can reconcile offline challans." },
          { status: 403 }
        );
      }

      const { transactionId, referenceNumber } = body;
      if (!transactionId && !referenceNumber) {
        return NextResponse.json({ error: "transactionId or referenceNumber is required" }, { status: 400 });
      }

      const txn = transactionId
        ? await prisma.paymentTransaction.findUnique({
            where: { id: transactionId },
            include: { studentFee: true },
          })
        : await prisma.paymentTransaction.findFirst({
            where: { referenceNumber },
            include: { studentFee: true },
          });

      if (!txn) {
        return NextResponse.json({ error: "Transaction record not found" }, { status: 404 });
      }

      const fee = txn.studentFee;
      const newPaidAmount = fee.paidAmount + txn.amount;
      const newStatus = newPaidAmount >= fee.totalAmount ? "PAID" : "PARTIAL";

      await prisma.$transaction([
        prisma.paymentTransaction.update({
          where: { id: txn.id },
          data: { status: "SUCCESS", gatewayResponse: "VERIFIED_AND_RECONCILED_BY_BURSAR" },
        }),
        prisma.studentFee.update({
          where: { id: fee.id },
          data: { paidAmount: newPaidAmount, status: newStatus },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Bank challan deposit reconciled and fee credit applied.",
        newPaidAmount,
        newStatus,
      });
    }

    // Direct payment settlement requires authorized Bursar / Finance staff
    const financeStaffRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT"];
    if (!session || !financeStaffRoles.includes(session.role)) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Direct fee settlement is restricted to Bursars and Accountants. Students and parents must complete transactions via the payment gateway or bank challan.",
        },
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
      include: { student: { include: { user: true } } },
    });

    if (!fee) {
      return NextResponse.json({ error: "Student fee record not found" }, { status: 404 });
    }

    // Tenant boundary enforcement
    if (session.role !== "SUPER_ADMIN" && fee.student.user.institutionId !== session.institutionId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify fee ledgers for another institution." },
        { status: 403 }
      );
    }

    const payAmount = Number(amount);
    const newPaidAmount = fee.paidAmount + payAmount;
    const newStatus = newPaidAmount >= fee.totalAmount ? "PAID" : "PARTIAL";

    const referenceNumber = `TXN-REC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentFeeId,
        amount: payAmount,
        paymentMethod: paymentMethod || "DIRECT_DEPOSIT",
        referenceNumber,
        status: "SUCCESS",
        gatewayResponse: "RECORDED_BY_BURSAR",
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
    await logAuditEvent({
      institutionId: fee.student.user.institutionId,
      actorUserId: session.userId || "bursar",
      action: "FEE_PAYMENT_RECORDED",
      targetEntity: "StudentFee",
      targetId: studentFeeId,
      details: {
        amount: payAmount,
        referenceNumber,
        newStatus,
        paymentMethod: paymentMethod || "DIRECT_DEPOSIT",
        bursar: session.email,
      },
    });

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

