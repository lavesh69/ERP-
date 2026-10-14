/**
 * Statutory Social Security, ESIC, Gratuity & Form 10E/24Q Engine
 * Implements ESIC Act 1948, Payment of Gratuity Act 1972, LWF State Slabs,
 * Income Tax Section 89(1) Arrears Relief, and Form 24Q Quarterly TDS Return.
 */

export interface EsicComputationInput {
  employeeId: string;
  employeeName: string;
  ipNumber: string; // Insurance Person Number (17-digit)
  monthlyGrossWage: number;
  paidDaysInMonth: number;
  hasDisability?: boolean;
}

export interface EsicComputationResult {
  employeeId: string;
  employeeName: string;
  ipNumber: string;
  isEligible: boolean;
  monthlyGrossWage: number;
  paidDays: number;
  employeeContribution: number; // 0.75%
  employerContribution: number; // 3.25%
  totalContribution: number;    // 4.00%
  wageLimitExceeded: boolean;
  remarks: string;
}

export interface GratuityComputationInput {
  employeeId: string;
  employeeName: string;
  joiningDate: string; // ISO date string
  exitDate: string;    // ISO date string
  lastDrawnBasic: number;
  lastDrawnDa: number;
  isDeathOrDisablement?: boolean;
}

export interface GratuityComputationResult {
  employeeId: string;
  employeeName: string;
  serviceYearsCompleted: number;
  fractionMonths: number;
  isEligible: boolean; // >= 5 years unless death/disablement
  monthlyWageBase: number; // Basic + DA
  rawGratuityCalculated: number;
  payableGratuity: number; // Capped at ₹20,00,000
  statutoryCapApplied: boolean;
  formula: string;
}

export type LwfState = "DELHI" | "MAHARASHTRA" | "KARNATAKA" | "HARYANA" | "TAMIL_NADU" | "WEST_BENGAL";

export interface LwfComputationResult {
  state: LwfState;
  employeeShare: number;
  employerShare: number;
  frequency: "MONTHLY" | "HALF_YEARLY" | "ANNUAL";
  totalContribution: number;
}

export interface Section89ReliefInput {
  employeeId: string;
  employeeName: string;
  panNumber: string;
  currentFinancialYear: string; // E.g., "2026-2027"
  arrearsPertainingYear: string; // E.g., "2025-2026"
  salaryExcludingArrearsCurrentYear: number;
  arrearsAmount: number;
  salaryPriorYear: number;
}

export interface Section89ReliefResult {
  employeeId: string;
  employeeName: string;
  panNumber: string;
  currentYearTotalSalary: number;
  taxOnCurrentYearWithArrears: number;
  taxOnCurrentYearWithoutArrears: number;
  taxDifferenceCurrentYear: number;
  priorYearRevisedSalary: number;
  taxOnPriorYearWithArrears: number;
  taxOnPriorYearWithoutArrears: number;
  taxDifferencePriorYear: number;
  section89ReliefGranted: number;
  form10EEligible: boolean;
}

export interface Form24QChallan {
  bsrCode: string;
  challanDate: string;
  challanSerialNo: string;
  tdsAmount: number;
  surchargeAmount: number;
  cessAmount: number;
  interestAmount: number;
  feeAmount: number;
  totalDeposit: number;
}

export interface Form24QEmployeeRecord {
  pan: string;
  name: string;
  grossSalary: number;
  standardDeduction: number;
  chapterVIAExemptions: number;
  taxableIncome: number;
  tdsDeducted: number;
  taxRegime: "NEW_REGIME" | "OLD_REGIME";
}

export class StatutorySocialSecurityEngine {
  public static readonly ESIC_WAGE_CEILING = 21000;
  public static readonly ESIC_DISABILITY_CEILING = 25000;
  public static readonly ESIC_EMPLOYEE_RATE = 0.0075; // 0.75%
  public static readonly ESIC_EMPLOYER_RATE = 0.0325; // 3.25%
  public static readonly GRATUITY_MAX_STATUTORY_CAP = 2000000; // ₹20 Lakhs

  /**
   * Compute ESIC deductions under Employees' State Insurance Act, 1948
   */
  public static computeEsic(input: EsicComputationInput): EsicComputationResult {
    const ceiling = input.hasDisability
      ? this.ESIC_DISABILITY_CEILING
      : this.ESIC_WAGE_CEILING;

    const isEligible = input.monthlyGrossWage <= ceiling && input.paidDaysInMonth > 0;

    if (!isEligible) {
      return {
        employeeId: input.employeeId,
        employeeName: input.employeeName,
        ipNumber: input.ipNumber,
        isEligible: false,
        monthlyGrossWage: input.monthlyGrossWage,
        paidDays: input.paidDaysInMonth,
        employeeContribution: 0,
        employerContribution: 0,
        totalContribution: 0,
        wageLimitExceeded: input.monthlyGrossWage > ceiling,
        remarks: `Wage ₹${input.monthlyGrossWage.toLocaleString()} exceeds ESIC statutory threshold of ₹${ceiling.toLocaleString()}. Not covered under ESI.`,
      };
    }

    const employeeContribution = Math.round(input.monthlyGrossWage * this.ESIC_EMPLOYEE_RATE);
    const employerContribution = Math.round(input.monthlyGrossWage * this.ESIC_EMPLOYER_RATE);

    return {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      ipNumber: input.ipNumber,
      isEligible: true,
      monthlyGrossWage: input.monthlyGrossWage,
      paidDays: input.paidDaysInMonth,
      employeeContribution,
      employerContribution,
      totalContribution: employeeContribution + employerContribution,
      wageLimitExceeded: false,
      remarks: "Eligible and covered under Employees State Insurance Act 1948.",
    };
  }

  /**
   * Generate monthly ESIC contribution return text file
   */
  public static generateEsicChallanText(
    records: EsicComputationResult[],
    employerCode: string = "11000342910001001",
    payPeriod: string = "October 2026"
  ): string {
    const header = [
      `ESIC_MONTHLY_CONTRIBUTION_RETURN#${employerCode}#${payPeriod}`,
      "IP_NUMBER#EMPLOYEE_NAME#PAID_DAYS#GROSS_WAGE#IP_CONTRIBUTION#EMPLOYER_CONTRIBUTION#TOTAL_CONTRIBUTION",
    ].join("\n");

    const rows = records
      .filter((r) => r.isEligible)
      .map((r) =>
        [
          r.ipNumber,
          r.employeeName.toUpperCase(),
          r.paidDays,
          r.monthlyGrossWage,
          r.employeeContribution,
          r.employerContribution,
          r.totalContribution,
        ].join("#")
      );

    const totalEmployees = records.filter((r) => r.isEligible).length;
    const totalWage = records.filter((r) => r.isEligible).reduce((acc, r) => acc + r.monthlyGrossWage, 0);
    const totalContribution = records.filter((r) => r.isEligible).reduce((acc, r) => acc + r.totalContribution, 0);

    const footer = `TRAILER#TOTAL_IPS:${totalEmployees}#TOTAL_WAGES:${totalWage}#TOTAL_AMOUNT:${totalContribution}`;

    return `${header}\n${rows.join("\n")}\n${footer}`;
  }

  /**
   * Compute Gratuity under Payment of Gratuity Act, 1972
   */
  public static computeGratuity(input: GratuityComputationInput): GratuityComputationResult {
    const start = new Date(input.joiningDate);
    const end = new Date(input.exitDate);

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalDays = diffMs / (1000 * 60 * 60 * 24);
    const totalYearsExact = totalDays / 365.25;

    let fullYears = Math.floor(totalYearsExact);
    const fractionMonths = Math.round((totalYearsExact - fullYears) * 12);

    // Rule: More than 6 months of service rounds up to the next completed year
    let effectiveYears = fullYears;
    if (fractionMonths > 6) {
      effectiveYears += 1;
    }

    const isEligible = input.isDeathOrDisablement || effectiveYears >= 5;

    if (!isEligible) {
      return {
        employeeId: input.employeeId,
        employeeName: input.employeeName,
        serviceYearsCompleted: effectiveYears,
        fractionMonths,
        isEligible: false,
        monthlyWageBase: input.lastDrawnBasic + input.lastDrawnDa,
        rawGratuityCalculated: 0,
        payableGratuity: 0,
        statutoryCapApplied: false,
        formula: "Service < 5 years (Vesting criteria unfulfilled under Section 4(1)).",
      };
    }

    const wageBase = input.lastDrawnBasic + input.lastDrawnDa;
    // Formula: (15 / 26) * WageBase * EffectiveYears
    const rawGratuity = Math.round((15 / 26) * wageBase * effectiveYears);
    const payableGratuity = Math.min(rawGratuity, this.GRATUITY_MAX_STATUTORY_CAP);

    return {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      serviceYearsCompleted: effectiveYears,
      fractionMonths,
      isEligible: true,
      monthlyWageBase: wageBase,
      rawGratuityCalculated: rawGratuity,
      payableGratuity,
      statutoryCapApplied: rawGratuity > this.GRATUITY_MAX_STATUTORY_CAP,
      formula: `(15 / 26) * (Last Drawn Basic + DA: ₹${wageBase.toLocaleString()}) * (${effectiveYears} Completed Years)`,
    };
  }

  /**
   * Compute Labour Welfare Fund (LWF) state specific statutory contribution
   */
  public static computeLwf(state: LwfState, monthlyGrossWage: number): LwfComputationResult {
    switch (state) {
      case "MAHARASHTRA":
        // As per Maharashtra LWF Amendment: Employee ₹12 (half-yearly), Employer ₹36
        return {
          state,
          employeeShare: 12,
          employerShare: 36,
          frequency: "HALF_YEARLY",
          totalContribution: 48,
        };
      case "KARNATAKA":
        // Annual LWF: Employee ₹20, Employer ₹40
        return {
          state,
          employeeShare: 20,
          employerShare: 40,
          frequency: "ANNUAL",
          totalContribution: 60,
        };
      case "HARYANA":
        // 0.2% of salary capped at ₹25/month for employee, employer 2x
        const emp = Math.min(25, Math.round(monthlyGrossWage * 0.002));
        return {
          state,
          employeeShare: emp,
          employerShare: emp * 2,
          frequency: "MONTHLY",
          totalContribution: emp * 3,
        };
      case "TAMIL_NADU":
        return {
          state,
          employeeShare: 20,
          employerShare: 40,
          frequency: "ANNUAL",
          totalContribution: 60,
        };
      case "WEST_BENGAL":
        return {
          state,
          employeeShare: 3,
          employerShare: 15,
          frequency: "HALF_YEARLY",
          totalContribution: 18,
        };
      case "DELHI":
      default:
        // Delhi: Employee ₹0.75/month, Employer ₹2.25/month
        return {
          state: "DELHI",
          employeeShare: 1,
          employerShare: 3,
          frequency: "MONTHLY",
          totalContribution: 4,
        };
    }
  }

  /**
   * Calculate Section 89(1) Tax Relief and Form 10E statement on retroactive arrears
   */
  public static computeSection89Relief(input: Section89ReliefInput): Section89ReliefResult {
    const calcTax = (income: number) => {
      // Simplified tax slab approximation (Budget 2024 New Regime with ₹75k std deduction)
      const taxable = Math.max(0, income - 75000);
      if (taxable <= 300000) return 0;
      if (taxable <= 700000) return (taxable - 300000) * 0.05;
      if (taxable <= 1000000) return 20000 + (taxable - 700000) * 0.1;
      if (taxable <= 1200000) return 50000 + (taxable - 1000000) * 0.15;
      if (taxable <= 1500000) return 80000 + (taxable - 1200000) * 0.2;
      return 140000 + (taxable - 1500000) * 0.3;
    };

    const curWith = input.salaryExcludingArrearsCurrentYear + input.arrearsAmount;
    const curWithout = input.salaryExcludingArrearsCurrentYear;

    const taxCurWith = Math.round(calcTax(curWith) * 1.04); // Including 4% Cess
    const taxCurWithout = Math.round(calcTax(curWithout) * 1.04);
    const diffCur = taxCurWith - taxCurWithout;

    const priorWithout = input.salaryPriorYear;
    const priorWith = input.salaryPriorYear + input.arrearsAmount;

    const taxPriorWith = Math.round(calcTax(priorWith) * 1.04);
    const taxPriorWithout = Math.round(calcTax(priorWithout) * 1.04);
    const diffPrior = taxPriorWith - taxPriorWithout;

    const relief = Math.max(0, diffCur - diffPrior);

    return {
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      panNumber: input.panNumber,
      currentYearTotalSalary: curWith,
      taxOnCurrentYearWithArrears: taxCurWith,
      taxOnCurrentYearWithoutArrears: taxCurWithout,
      taxDifferenceCurrentYear: diffCur,
      priorYearRevisedSalary: priorWith,
      taxOnPriorYearWithArrears: taxPriorWith,
      taxOnPriorYearWithoutArrears: taxPriorWithout,
      taxDifferencePriorYear: diffPrior,
      section89ReliefGranted: relief,
      form10EEligible: relief > 0,
    };
  }

  /**
   * Generate Quarterly Form 24Q e-TDS Return structure for NSDL FVU ingestion
   */
  public static generateForm24QStructure(
    tan: string,
    finYear: string,
    quarter: "Q1" | "Q2" | "Q3" | "Q4",
    challans: Form24QChallan[],
    employees: Form24QEmployeeRecord[]
  ) {
    const totalTdsDeducted = employees.reduce((a, b) => a + b.tdsDeducted, 0);
    const totalChallanDeposited = challans.reduce((a, b) => a + b.totalDeposit, 0);
    const isChallanSufficient = totalChallanDeposited >= totalTdsDeducted;

    return {
      header: {
        formType: "24Q",
        tan,
        financialYear: finYear,
        quarter,
        generatedAt: new Date().toISOString(),
        fvuVersion: "8.6",
      },
      challanSummary: {
        count: challans.length,
        totalDeposited: totalChallanDeposited,
        challans,
      },
      annexure1Details: employees.map((emp, idx) => ({
        serialNumber: idx + 1,
        pan: emp.pan,
        name: emp.name,
        grossSalary: emp.grossSalary,
        standardDeduction: emp.standardDeduction,
        chapterVIAExemptions: emp.chapterVIAExemptions,
        taxableIncome: emp.taxableIncome,
        tdsDeducted: emp.tdsDeducted,
        taxRegime: emp.taxRegime,
      })),
      audit: {
        totalEmployees: employees.length,
        totalTdsDeducted,
        isChallanSufficient,
        shortfall: isChallanSufficient ? 0 : totalTdsDeducted - totalChallanDeposited,
      },
    };
  }
}
