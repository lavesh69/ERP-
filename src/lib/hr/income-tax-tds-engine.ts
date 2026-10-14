/**
 * CLASSROOM ERP — Income Tax Section 192 TDS Planner & Form 16 Part B Engine
 * 
 * Implements FY 2025-26 / AY 2026-27 Indian Income Tax calculations under Section 192:
 * - Compares Old Tax Regime (with 80C, 80D, 80CCD(1B), HRA Sec 10(13A), Sec 24(b)) vs
 *   New Tax Regime (Section 115BAC with ₹75k standard deduction and revised slabs).
 * - Identifies optimal tax regime and computes annual savings.
 * - Schedules monthly TDS withholding across pay cycles.
 * - Generates cryptographically sealed statutory Form 16 Part B certificates.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface TaxDeductionInputs {
  employeeId: string;
  employeeName: string;
  panNumber: string;
  financialYear: string; // e.g., "2025-26"
  annualGrossSalary: number;
  basicSalary: number;
  daAmount: number;
  hraReceived: number;
  rentPaidAnnual: number;
  isMetroCity: boolean;
  section80C: number;           // Max 150000
  section80D: number;           // Max 75000
  section80CCD1B_Nps: number;   // Max 50000
  section24HomeLoanInterest: number; // Max 200000
  otherTaxSavingInvestments: number;
}

export interface TaxComputationResult {
  regime: "NEW_REGIME" | "OLD_REGIME";
  grossSalary: number;
  exemptionsUnderSection10: number; // e.g. HRA exemption
  standardDeduction: number;
  chapterVIA_Deductions: number;
  totalTaxableIncome: number;
  taxSlabBreakdown: Array<{
    slab: string;
    ratePercent: number;
    taxableInSlab: number;
    taxAmount: number;
  }>;
  baseTax: number;
  rebate87A: number;
  taxAfterRebate: number;
  healthAndEducationCess4Pct: number;
  totalAnnualTaxPayable: number;
  monthlyTdsWithholding: number;
}

export interface TaxComparisonAndForm16 {
  employeeId: string;
  employeeName: string;
  panNumber: string;
  financialYear: string;
  assessmentYear: string;
  newRegime: TaxComputationResult;
  oldRegime: TaxComputationResult;
  recommendedRegime: "NEW_REGIME" | "OLD_REGIME";
  annualTaxSavings: number;
  selectedRegime: "NEW_REGIME" | "OLD_REGIME";
  monthlyTdsWithholding: number;
  form16PartB: {
    certificateNumber: string;
    employerName: string;
    employerTan: string;
    assessmentYear: string;
    grossTotalIncome: number;
    totalDeductions: number;
    totalTaxableIncome: number;
    taxOnTotalIncome: number;
    rebateUnderSection87A: number;
    cessAmount: number;
    netTaxPayable: number;
    totalTaxDeductedAtSource: number;
    taxRefundOrDue: number;
    digitalSeal: string;
  };
}

const DATA_DIR = path.join(process.cwd(), "data", "hr");
const TAX_FILE = path.join(DATA_DIR, "tax_declarations.json");

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(TAX_FILE)) {
    fs.writeFileSync(TAX_FILE, JSON.stringify({}, null, 2), "utf-8");
  }
}

/**
 * Calculates HRA exemption under Section 10(13A) read with Rule 2A
 * Minimum of:
 * 1. Actual HRA received
 * 2. Rent paid minus 10% of Salary (Basic + DA)
 * 3. 50% of Salary (Metro) or 40% (Non-Metro)
 */
export function calculateHraExemption(
  hraReceived: number,
  rentPaidAnnual: number,
  salaryBasicPlusDa: number,
  isMetro: boolean
): number {
  if (rentPaidAnnual <= 0) return 0;
  const rentExcessOver10Pct = Math.max(0, rentPaidAnnual - 0.10 * salaryBasicPlusDa);
  const salaryCap = isMetro ? 0.50 * salaryBasicPlusDa : 0.40 * salaryBasicPlusDa;
  const exemption = Math.min(hraReceived, rentExcessOver10Pct, salaryCap);
  return Math.max(0, Math.round(exemption));
}

/**
 * Computes Tax under New Tax Regime (Section 115BAC)
 * Standard deduction: ₹75,000
 * Slabs:
 * - 0 - 3,00,000: 0%
 * - 3,00,001 - 7,00,000: 5%
 * - 7,00,001 - 10,00,000: 10%
 * - 10,00,001 - 12,00,000: 15%
 * - 12,00,001 - 15,00,000: 20%
 * - Above 15,00,000: 30%
 * Rebate u/s 87A: Up to ₹7,00,000 taxable income -> 100% tax rebate
 */
export function computeNewRegimeTax(grossSalary: number): TaxComputationResult {
  const standardDeduction = 75000;
  const totalTaxableIncome = Math.max(0, grossSalary - standardDeduction);

  const slabs = [
    { slab: "₹0 to ₹3,00,000", min: 0, max: 300000, rate: 0 },
    { slab: "₹3,00,001 to ₹7,00,000", min: 300000, max: 700000, rate: 0.05 },
    { slab: "₹7,00,001 to ₹10,00,000", min: 700000, max: 1000000, rate: 0.10 },
    { slab: "₹10,00,001 to ₹12,00,000", min: 1000000, max: 1200000, rate: 0.15 },
    { slab: "₹12,00,001 to ₹15,00,000", min: 1200000, max: 1500000, rate: 0.20 },
    { slab: "Above ₹15,00,000", min: 1500000, max: Infinity, rate: 0.30 },
  ];

  const breakdown: TaxComputationResult["taxSlabBreakdown"] = [];
  let baseTax = 0;

  for (const s of slabs) {
    if (totalTaxableIncome > s.min) {
      const taxable = Math.min(totalTaxableIncome, s.max) - s.min;
      const tax = taxable * s.rate;
      baseTax += tax;
      breakdown.push({
        slab: s.slab,
        ratePercent: s.rate * 100,
        taxableInSlab: taxable,
        taxAmount: Math.round(tax),
      });
    } else {
      breakdown.push({
        slab: s.slab,
        ratePercent: s.rate * 100,
        taxableInSlab: 0,
        taxAmount: 0,
      });
    }
  }

  // Section 87A Rebate for New Regime: full rebate if taxable income <= 7,00,000
  let rebate87A = 0;
  if (totalTaxableIncome <= 700000) {
    rebate87A = baseTax;
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = Math.round(taxAfterRebate + cess);

  return {
    regime: "NEW_REGIME",
    grossSalary,
    exemptionsUnderSection10: 0,
    standardDeduction,
    chapterVIA_Deductions: 0,
    totalTaxableIncome,
    taxSlabBreakdown: breakdown,
    baseTax: Math.round(baseTax),
    rebate87A: Math.round(rebate87A),
    taxAfterRebate: Math.round(taxAfterRebate),
    healthAndEducationCess4Pct: cess,
    totalAnnualTaxPayable: totalTax,
    monthlyTdsWithholding: Math.round(totalTax / 12),
  };
}

/**
 * Computes Tax under Old Tax Regime
 * Standard deduction: ₹50,000
 * Slabs:
 * - 0 - 2,50,000: 0%
 * - 2,50,001 - 5,00,000: 5%
 * - 5,00,001 - 10,00,000: 20%
 * - Above 10,00,000: 30%
 * Deductions:
 * - HRA exemption under Sec 10(13A)
 * - 80C up to 1.5L
 * - 80D up to 75k
 * - 80CCD(1B) up to 50k
 * - Sec 24(b) home loan interest up to 2L
 * Rebate u/s 87A: Taxable income <= 5,00,000 -> rebate up to 12,500
 */
export function computeOldRegimeTax(inputs: TaxDeductionInputs): TaxComputationResult {
  const salaryBase = inputs.basicSalary + inputs.daAmount;
  const hraExempt = calculateHraExemption(
    inputs.hraReceived,
    inputs.rentPaidAnnual,
    salaryBase,
    inputs.isMetroCity
  );

  const standardDeduction = 50000;
  const sec80C = Math.min(150000, Math.max(0, inputs.section80C));
  const sec80D = Math.min(75000, Math.max(0, inputs.section80D));
  const nps80CCD = Math.min(50000, Math.max(0, inputs.section80CCD1B_Nps));
  const sec24 = Math.min(200000, Math.max(0, inputs.section24HomeLoanInterest));
  const other = Math.max(0, inputs.otherTaxSavingInvestments);

  const totalChapterVIA = sec80C + sec80D + nps80CCD + sec24 + other;
  const totalTaxableIncome = Math.max(
    0,
    inputs.annualGrossSalary - hraExempt - standardDeduction - totalChapterVIA
  );

  const slabs = [
    { slab: "₹0 to ₹2,50,000", min: 0, max: 250000, rate: 0 },
    { slab: "₹2,50,001 to ₹5,00,000", min: 250000, max: 500000, rate: 0.05 },
    { slab: "₹5,00,001 to ₹10,00,000", min: 500000, max: 1000000, rate: 0.20 },
    { slab: "Above ₹10,00,000", min: 1000000, max: Infinity, rate: 0.30 },
  ];

  const breakdown: TaxComputationResult["taxSlabBreakdown"] = [];
  let baseTax = 0;

  for (const s of slabs) {
    if (totalTaxableIncome > s.min) {
      const taxable = Math.min(totalTaxableIncome, s.max) - s.min;
      const tax = taxable * s.rate;
      baseTax += tax;
      breakdown.push({
        slab: s.slab,
        ratePercent: s.rate * 100,
        taxableInSlab: taxable,
        taxAmount: Math.round(tax),
      });
    } else {
      breakdown.push({
        slab: s.slab,
        ratePercent: s.rate * 100,
        taxableInSlab: 0,
        taxAmount: 0,
      });
    }
  }

  // Section 87A Rebate for Old Regime: max 12,500 if taxable income <= 5,00,000
  let rebate87A = 0;
  if (totalTaxableIncome <= 500000) {
    rebate87A = Math.min(12500, baseTax);
  }

  const taxAfterRebate = Math.max(0, baseTax - rebate87A);
  const cess = Math.round(taxAfterRebate * 0.04);
  const totalTax = Math.round(taxAfterRebate + cess);

  return {
    regime: "OLD_REGIME",
    grossSalary: inputs.annualGrossSalary,
    exemptionsUnderSection10: hraExempt,
    standardDeduction,
    chapterVIA_Deductions: totalChapterVIA,
    totalTaxableIncome,
    taxSlabBreakdown: breakdown,
    baseTax: Math.round(baseTax),
    rebate87A: Math.round(rebate87A),
    taxAfterRebate: Math.round(taxAfterRebate),
    healthAndEducationCess4Pct: cess,
    totalAnnualTaxPayable: totalTax,
    monthlyTdsWithholding: Math.round(totalTax / 12),
  };
}

/**
 * Runs full Section 192 Tax Comparison and synthesizes Form 16 Part B Certificate
 */
export function analyzeTaxAndGenerateForm16(inputs: TaxDeductionInputs): TaxComparisonAndForm16 {
  const newRegime = computeNewRegimeTax(inputs.annualGrossSalary);
  const oldRegime = computeOldRegimeTax(inputs);

  const recommendedRegime =
    newRegime.totalAnnualTaxPayable <= oldRegime.totalAnnualTaxPayable ? "NEW_REGIME" : "OLD_REGIME";
  const annualTaxSavings = Math.abs(newRegime.totalAnnualTaxPayable - oldRegime.totalAnnualTaxPayable);

  const selectedComputation = recommendedRegime === "NEW_REGIME" ? newRegime : oldRegime;

  const assessmentYear = "2026-27";
  const certNumber = `FORM16-B-${inputs.financialYear}-${inputs.employeeId}-${Date.now().toString().slice(-6)}`;
  const sealPayload = `${certNumber}|${inputs.panNumber}|${selectedComputation.totalTaxableIncome}|${selectedComputation.totalAnnualTaxPayable}`;
  const digitalSeal = `FORM16-SEAL-${crypto.createHash("sha256").update(sealPayload).digest("hex").substring(0, 24).toUpperCase()}`;

  const form16PartB = {
    certificateNumber: certNumber,
    employerName: "Apex Institute of Technology & Management",
    employerTan: "DELA12345B",
    assessmentYear,
    grossTotalIncome: selectedComputation.grossSalary,
    totalDeductions: selectedComputation.exemptionsUnderSection10 + selectedComputation.standardDeduction + selectedComputation.chapterVIA_Deductions,
    totalTaxableIncome: selectedComputation.totalTaxableIncome,
    taxOnTotalIncome: selectedComputation.baseTax,
    rebateUnderSection87A: selectedComputation.rebate87A,
    cessAmount: selectedComputation.healthAndEducationCess4Pct,
    netTaxPayable: selectedComputation.totalAnnualTaxPayable,
    totalTaxDeductedAtSource: selectedComputation.totalAnnualTaxPayable, // 100% scheduled deduction
    taxRefundOrDue: 0,
    digitalSeal,
  };

  const fullResult: TaxComparisonAndForm16 = {
    employeeId: inputs.employeeId,
    employeeName: inputs.employeeName,
    panNumber: inputs.panNumber,
    financialYear: inputs.financialYear,
    assessmentYear,
    newRegime,
    oldRegime,
    recommendedRegime,
    annualTaxSavings,
    selectedRegime: recommendedRegime,
    monthlyTdsWithholding: selectedComputation.monthlyTdsWithholding,
    form16PartB,
  };

  ensureStorage();
  try {
    const raw = fs.readFileSync(TAX_FILE, "utf-8");
    const stored = JSON.parse(raw);
    stored[inputs.employeeId] = fullResult;
    fs.writeFileSync(TAX_FILE, JSON.stringify(stored, null, 2), "utf-8");
  } catch {
    // Ignore store sync failure
  }

  return fullResult;
}
