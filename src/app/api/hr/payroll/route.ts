import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const HR_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HR_STAFF", "ACCOUNTANT", "PRINCIPAL", "FACULTY"];

interface SalaryBreakdown {
  staffEmail: string;
  payPeriod: string; // e.g. "October 2026"
  basicPay: number;
  houseRentAllowance: number; // HRA 20%
  dearnessAllowance: number;  // DA 14%
  specialAllowance: number;
  grossSalary: number;
  providentFund: number;      // PF 12%
  taxDeductedAtSource: number;// TDS
  professionalTax: number;
  totalDeductions: number;
  netPay: number;
  verificationHash: string;
}

function computeSalarySlip(staffEmail: string, basicPay: number, payPeriod: string): SalaryBreakdown {
  const basic = Math.max(0, basicPay);
  const hra = Math.round(basic * 0.20);
  const da = Math.round(basic * 0.14);
  const specialAllowance = Math.round(basic * 0.10);
  const gross = basic + hra + da + specialAllowance;

  const pf = Math.round(basic * 0.12);
  const tds = Math.round(gross * 0.08); // 8% estimated income tax
  const profTax = 200; // Flat standard PT
  const deductions = pf + tds + profTax;
  const net = gross - deductions;

  const hash = crypto
    .createHash("sha256")
    .update(`${staffEmail}:${payPeriod}:${net}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  return {
    staffEmail,
    payPeriod,
    basicPay: basic,
    houseRentAllowance: hra,
    dearnessAllowance: da,
    specialAllowance,
    grossSalary: gross,
    providentFund: pf,
    taxDeductedAtSource: tds,
    professionalTax: profTax,
    totalDeductions: deductions,
    netPay: net,
    verificationHash: hash,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, HR_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const staffEmail = searchParams.get("email") || auth.payload.email;
    const period = searchParams.get("period") || "October 2026";
    const basic = Number(searchParams.get("basic")) || 65000;

    const slip = computeSalarySlip(staffEmail, basic, period);

    return NextResponse.json({
      success: true,
      institution: "Apex University Human Resources Office",
      salarySlip: slip,
    });
  } catch (error: any) {
    logger.error("Payroll salary slip GET error", error);
    return NextResponse.json({ error: "Failed to generate salary slip" }, { status: 500 });
  }
}
