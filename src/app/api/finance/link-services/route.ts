import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import crypto from "crypto";
import { CAMPUS_SERVICE_CATALOG, CampusServiceFeePayload } from "@/lib/finance/service-catalog";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access service fee catalog" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    let studentServices: any[] = [];
    if (studentId) {
      const studentFees = await prisma.studentFee.findMany({
        where: { studentId },
        include: { feeStructure: true, transactions: true },
        orderBy: { createdAt: "desc" },
      });
      studentServices = studentFees;
    }

    return NextResponse.json({
      success: true,
      serviceCatalog: CAMPUS_SERVICE_CATALOG,
      studentServices,
      totalCatalogServices: CAMPUS_SERVICE_CATALOG.length,
    });
  } catch (error: any) {
    console.error("GET /api/finance/link-services error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve service catalog" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Administrative authentication required" }, { status: 401 });
    }

    const authorizedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "PRINCIPAL", "WARDEN", "TRANSPORT_MANAGER"];
    if (!authorizedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: Only bursar, accountant, or operations staff may link service fees" }, { status: 403 });
    }

    const body: CampusServiceFeePayload = await req.json();
    const { studentId, serviceType, amount, description, semester = 1, academicYear = "2026-2027" } = body;

    if (!studentId || !serviceType || !amount || amount <= 0) {
      return NextResponse.json({ error: "Valid studentId, serviceType, and positive amount are required" }, { status: 400 });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, program: true },
    });

    if (!student) {
      return NextResponse.json({ error: `Student with ID ${studentId} not found in SIS directory` }, { status: 404 });
    }

    // Find or create FeeStructure for this auxiliary service
    const feeCode = `FEE-SRV-${serviceType.slice(0, 4)}-${semester}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days due

    let feeStructure = await prisma.feeStructure.findUnique({
      where: {
        code: feeCode,
      },
    });

    if (!feeStructure) {
      feeStructure = await prisma.feeStructure.create({
        data: {
          code: feeCode,
          title: `Auxiliary Service: ${serviceType.replace(/_/g, " ")}`,
          totalAmount: amount,
          currency: "INR",
          dueDate,
          breakdownJson: JSON.stringify({
            serviceType,
            description: description || `Auxiliary fee for ${serviceType.replace(/_/g, " ")}`,
            semester,
            academicYear,
            amount,
          }),
        },
      });
    }

    // Issue new StudentFee record or append to existing fee ledger
    const invoiceNumber = `INV-${new Date().getFullYear()}-${serviceType.slice(0, 3)}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const invoiceHash = crypto
      .createHash("sha256")
      .update(`${studentId}|${serviceType}|${amount}|${invoiceNumber}|${new Date().toISOString()}`)
      .digest("hex")
      .substring(0, 24)
      .toUpperCase();

    const studentFee = await prisma.studentFee.create({
      data: {
        studentId: student.id,
        feeStructureId: feeStructure.id,
        totalAmount: amount,
        paidAmount: 0,
        status: "PENDING",
        dueDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${serviceType.replace(/_/g, " ")} of ₹${amount.toLocaleString("en-IN")} to scholar ${student.user.firstName} ${student.user.lastName} (Roll No: ${student.rollNumber})`,
      invoiceNumber,
      cryptographicInvoiceSeal: `APEX-SRV-INV-${invoiceHash}`,
      studentFeeId: studentFee.id,
      serviceCharge: {
        serviceType,
        amount,
        description: description || `Bursar charge for ${serviceType.replace(/_/g, " ")}`,
        status: "PENDING",
        dueDate: dueDate.toISOString().split("T")[0],
        scholar: {
          id: student.id,
          rollNumber: student.rollNumber,
          fullName: `${student.user.firstName} ${student.user.lastName}`,
        },
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/finance/link-services error:", error);
    return NextResponse.json({ error: error.message || "Failed to link auxiliary service fee" }, { status: 500 });
  }
}
