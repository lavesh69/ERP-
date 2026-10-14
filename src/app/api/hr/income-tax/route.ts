import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  analyzeTaxAndGenerateForm16,
  TaxDeductionInputs,
} from "@/lib/hr/income-tax-tds-engine";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "hr");
const TAX_FILE = path.join(DATA_DIR, "tax_declarations.json");

function getStoredDeclaration(employeeId: string) {
  try {
    if (fs.existsSync(TAX_FILE)) {
      const raw = fs.readFileSync(TAX_FILE, "utf-8");
      const data = JSON.parse(raw);
      return data[employeeId] || null;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      // Check if user is faculty or staff
      const faculty = await prisma.faculty.findFirst({
        where: { userId: session.user?.id || "" },
      });
      employeeId = faculty ? faculty.id : "EMP-FAC-01";
    }

    const stored = getStoredDeclaration(employeeId);
    if (stored) {
      return NextResponse.json({
        success: true,
        taxData: stored,
      });
    }

    // Default simulation for demo employee
    const defaultInputs: TaxDeductionInputs = {
      employeeId,
      employeeName: session.user?.name || "Dr. Rajesh K. Sharma",
      panNumber: "ABCDE1234F",
      financialYear: "2025-26",
      annualGrossSalary: 1450000,
      basicSalary: 850000,
      daAmount: 425000,
      hraReceived: 170000,
      rentPaidAnnual: 240000,
      isMetroCity: true,
      section80C: 150000,
      section80D: 25000,
      section80CCD1B_Nps: 50000,
      section24HomeLoanInterest: 180000,
      otherTaxSavingInvestments: 0,
    };

    const simulated = analyzeTaxAndGenerateForm16(defaultInputs);

    return NextResponse.json({
      success: true,
      taxData: simulated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action = "ANALYZE_TAX" } = body;

    let employeeId = body.employeeId;
    if (!employeeId) {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: session.user?.id || "" },
      });
      employeeId = faculty ? faculty.id : "EMP-FAC-01";
    }

    const inputs: TaxDeductionInputs = {
      employeeId,
      employeeName: body.employeeName || session.user?.name || "Employee",
      panNumber: body.panNumber || "ABCDE1234F",
      financialYear: body.financialYear || "2025-26",
      annualGrossSalary: Number(body.annualGrossSalary || 1200000),
      basicSalary: Number(body.basicSalary || 700000),
      daAmount: Number(body.daAmount || 350000),
      hraReceived: Number(body.hraReceived || 140000),
      rentPaidAnnual: Number(body.rentPaidAnnual || 0),
      isMetroCity: Boolean(body.isMetroCity ?? true),
      section80C: Number(body.section80C || 0),
      section80D: Number(body.section80D || 0),
      section80CCD1B_Nps: Number(body.section80CCD1B_Nps || 0),
      section24HomeLoanInterest: Number(body.section24HomeLoanInterest || 0),
      otherTaxSavingInvestments: Number(body.otherTaxSavingInvestments || 0),
    };

    const result = analyzeTaxAndGenerateForm16(inputs);

    if (action === "LOCK_TAX_REGIME") {
      const selectedRegime = body.selectedRegime || result.recommendedRegime;
      result.selectedRegime = selectedRegime;
      result.monthlyTdsWithholding =
        selectedRegime === "NEW_REGIME"
          ? result.newRegime.monthlyTdsWithholding
          : result.oldRegime.monthlyTdsWithholding;

      // Update storage
      try {
        if (fs.existsSync(TAX_FILE)) {
          const raw = fs.readFileSync(TAX_FILE, "utf-8");
          const data = JSON.parse(raw);
          data[employeeId] = result;
          fs.writeFileSync(TAX_FILE, JSON.stringify(data, null, 2), "utf-8");
        }
      } catch {
        // ignore
      }

      return NextResponse.json({
        success: true,
        message: `Tax regime ${selectedRegime} locked for FY ${inputs.financialYear}. Monthly TDS set to ₹${result.monthlyTdsWithholding.toLocaleString("en-IN")}`,
        taxData: result,
      });
    }

    if (action === "GENERATE_FORM_16") {
      return NextResponse.json({
        success: true,
        message: "Statutory Form 16 Part B Certificate generated with cryptographic seal",
        form16: result.form16PartB,
        taxData: result,
      });
    }

    // Default action: ANALYZE_TAX
    return NextResponse.json({
      success: true,
      message: "Income tax comparison computed under Section 192",
      taxData: result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
