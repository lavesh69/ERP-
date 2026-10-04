import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const referenceNumber = searchParams.get("ref");
    const transactionId = searchParams.get("id");

    if (!referenceNumber && !transactionId) {
      return NextResponse.json({ error: "ref or id parameter is required" }, { status: 400 });
    }

    const txn = transactionId
      ? await prisma.paymentTransaction.findUnique({
          where: { id: transactionId },
          include: {
            studentFee: {
              include: {
                student: { include: { user: true, program: true } },
                feeStructure: true,
              },
            },
          },
        })
      : await prisma.paymentTransaction.findFirst({
          where: { referenceNumber: referenceNumber! },
          include: {
            studentFee: {
              include: {
                student: { include: { user: true, program: true } },
                feeStructure: true,
              },
            },
          },
        });

    if (!txn) {
      return NextResponse.json({ error: "Transaction record not found" }, { status: 404 });
    }

    const fee = txn.studentFee;
    const scholar = fee.student;

    // Security check: Student can only access their own receipt unless staff
    const isStaff = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL"].includes(session.role);
    if (!isStaff && scholar.userId !== session.userId && scholar.user.email !== session.email) {
      return NextResponse.json({ error: "Forbidden: You cannot view receipts of other scholars." }, { status: 403 });
    }

    // Generate tamper-evident cryptographic verification seal
    const sealData = `${txn.referenceNumber}:${txn.amount}:${scholar.rollNumber}:${txn.transactedAt.toISOString()}`;
    const verificationHash = crypto.createHash("sha256").update(sealData).digest("hex").slice(0, 16).toUpperCase();

    const receipt = {
      receiptNumber: `REC-${txn.referenceNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
      transactionReference: txn.referenceNumber,
      institution: {
        name: "Apex University of Science & Technology",
        code: "APEX-UNIV",
        treasuryOffice: "Office of the Bursar & University Treasury",
        officialSeal: "VERIFIED_BURSAR_SEAL_APEX",
      },
      scholar: {
        name: `${scholar.user.firstName} ${scholar.user.lastName}`,
        rollNumber: scholar.rollNumber,
        admissionNumber: scholar.admissionNumber,
        program: scholar.program.name,
      },
      paymentDetails: {
        amountPaid: txn.amount,
        currency: "USD",
        paymentMethod: txn.paymentMethod,
        status: txn.status,
        dateOfPayment: txn.transactedAt.toISOString(),
        feeCategory: fee.feeStructure.title,
        totalBilled: fee.totalAmount,
        totalPaidTillDate: fee.paidAmount,
        remainingBalance: Math.max(0, fee.totalAmount - fee.paidAmount),
      },
      cryptographicSeal: {
        algorithm: "SHA-256",
        verificationHash,
        qrVerificationUrl: `https://apex.edu/verify/receipt?seal=${verificationHash}&ref=${txn.referenceNumber}`,
      },
      disclaimer: "This is a computer-generated official receipt recognized under university regulations.",
    };

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (error: any) {
    logger.error("Finance receipt GET error", error);
    return NextResponse.json({ error: "Failed to generate receipt" }, { status: 500 });
  }
}
