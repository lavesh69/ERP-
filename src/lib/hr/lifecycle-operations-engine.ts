/**
 * Employee Lifecycle, No-Dues Clearance, Loans & Workforce Operations Engine
 * Implements Multi-Department Digital No-Dues Pipeline, Late-Punch Penalty Deduction,
 * Staff Welfare Loans (Festival/Computer Advances), Salary HOLD/Subsistence Allowance,
 * and Multi-Bank Corporate Formats (SBI CMP, HDFC Enet).
 */

import crypto from "crypto";

export interface NoDuesState {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  resignationDate: string;
  targetRelieveDate: string;
  reason: string;
  checkpoints: {
    library: { cleared: boolean; remarks: string; clearedAt?: string };
    laboratory: { cleared: boolean; remarks: string; clearedAt?: string };
    hostel: { cleared: boolean; remarks: string; clearedAt?: string };
    itServices: { cleared: boolean; remarks: string; clearedAt?: string };
    finance: { cleared: boolean; remarks: string; clearedAt?: string };
    examBranch: { cleared: boolean; remarks: string; clearedAt?: string };
    registrar: { cleared: boolean; remarks: string; clearedAt?: string };
  };
  overallStatus: "IN_PROGRESS" | "CLEARANCE_COMPLETE" | "RELIEVED" | "REJECTED";
  relievingCertificateHash?: string;
}

export interface LatePunchRecord {
  date: string;
  punchInTime: string; // "09:24"
  scheduledStartTime: string; // "09:00"
  graceMinutes: number; // 15
}

export interface LatePunchEvaluationResult {
  totalPunches: number;
  latePunchesCount: number;
  unexcusedLates: number;
  clDeductionsDays: number; // 3 late marks = 0.5 CL
  lopDeductionsDays: number;
  penaltyRemarks: string;
}

export interface StaffLoanApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  loanType: "FESTIVAL_ADVANCE" | "COMPUTER_ADVANCE" | "HOUSING_ADVANCE" | "SALARY_ADVANCE";
  principalAmount: number;
  tenureMonths: number;
  interestRateAnnual?: number;
}

export interface StaffLoanAccount {
  id: string;
  employeeId: string;
  loanType: string;
  principalAmount: number;
  interestRateAnnual: number;
  totalRepayable: number;
  tenureMonths: number;
  monthlyEmi: number;
  totalRecovered: number;
  remainingBalance: number;
  status: "ACTIVE" | "REPAID" | "CLOSED";
}

export interface BankPayoutEntry {
  employeeId: string;
  employeeName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  netPay: number;
}

export class LifecycleOperationsEngine {
  /**
   * Initialize a new 7-Department Digital No-Dues Clearance Pipeline
   */
  public static initiateNoDues(
    employeeId: string,
    employeeName: string,
    department: string,
    designation: string,
    resignationDate: string,
    targetRelieveDate: string,
    reason: string
  ): NoDuesState {
    const id = `ND-${Date.now().toString().slice(-6)}`;
    return {
      id,
      employeeId,
      employeeName,
      department,
      designation,
      resignationDate,
      targetRelieveDate,
      reason,
      checkpoints: {
        library: { cleared: false, remarks: "Pending return of 2 borrowed reference books." },
        laboratory: { cleared: false, remarks: "Pending laboratory equipment handover." },
        hostel: { cleared: false, remarks: "Quarters inspection scheduled." },
        itServices: { cleared: false, remarks: "Official laptop and ERP credentials surrender." },
        finance: { cleared: false, remarks: "Advance imprest reconciliation pending." },
        examBranch: { cleared: false, remarks: "End-semester marksheet submission check." },
        registrar: { cleared: false, remarks: "Awaiting all departmental clearances." },
      },
      overallStatus: "IN_PROGRESS",
    };
  }

  /**
   * Update clearance status for a specific department
   */
  public static updateDepartmentClearance(
    record: NoDuesState,
    department: keyof NoDuesState["checkpoints"],
    cleared: boolean,
    remarks: string
  ): NoDuesState {
    const updated = JSON.parse(JSON.stringify(record)) as NoDuesState;
    updated.checkpoints[department] = {
      cleared,
      remarks,
      clearedAt: cleared ? new Date().toISOString() : undefined,
    };

    const c = updated.checkpoints;
    const allDeptCleared =
      c.library.cleared &&
      c.laboratory.cleared &&
      c.hostel.cleared &&
      c.itServices.cleared &&
      c.finance.cleared &&
      c.examBranch.cleared;

    if (allDeptCleared && !c.registrar.cleared) {
      c.registrar.remarks = "All operational departments cleared. Ready for Registrar final sign-off.";
    }

    if (allDeptCleared && c.registrar.cleared) {
      updated.overallStatus = "CLEARANCE_COMPLETE";
      const payload = `${updated.id}:${updated.employeeId}:${updated.targetRelieveDate}:${new Date().toISOString()}`;
      updated.relievingCertificateHash = crypto.createHash("sha256").update(payload).digest("hex");
    }

    return updated;
  }

  /**
   * Evaluate Late Punch Penalties (Grace period: 15 mins; 3 Late marks = 0.5 Day CL cut)
   */
  public static evaluateLatePunches(
    punches: LatePunchRecord[],
    availableClBalance: number = 2.0
  ): LatePunchEvaluationResult {
    let lateCount = 0;

    for (const p of punches) {
      const [pMin, pSec] = p.punchInTime.split(":").map(Number);
      const [sMin, sSec] = p.scheduledStartTime.split(":").map(Number);
      const punchTotalMinutes = pMin * 60 + pSec;
      const scheduledTotalMinutes = sMin * 60 + sSec;

      const diff = punchTotalMinutes - scheduledTotalMinutes;
      if (diff > p.graceMinutes) {
        lateCount += 1;
      }
    }

    // Every 3 late punches = 0.5 days cut
    const penaltyUnits = Math.floor(lateCount / 3);
    const totalDaysToDeduct = penaltyUnits * 0.5;

    let clDeducted = Math.min(availableClBalance, totalDaysToDeduct);
    let lopDeducted = totalDaysToDeduct - clDeducted;

    return {
      totalPunches: punches.length,
      latePunchesCount: lateCount,
      unexcusedLates: lateCount % 3,
      clDeductionsDays: clDeducted,
      lopDeductionsDays: lopDeducted,
      penaltyRemarks:
        totalDaysToDeduct > 0
          ? `${lateCount} Late punches triggered ${totalDaysToDeduct} Day(s) leave deduction (${clDeducted} CL, ${lopDeducted} LOP).`
          : `${lateCount} Late marks within permissible threshold. No leave deducted.`,
    };
  }

  /**
   * Create a new Staff Welfare Loan Account (Festival Advance / Computer Advance)
   */
  public static createStaffLoan(input: StaffLoanApplication): StaffLoanAccount {
    const rate = input.interestRateAnnual || 0;
    const principal = input.principalAmount;
    const tenure = input.tenureMonths;

    let totalRepayable = principal;
    if (rate > 0) {
      // Simple interest for staff advances: P * (1 + R*T/100)
      const interest = Math.round((principal * rate * (tenure / 12)) / 100);
      totalRepayable = principal + interest;
    }

    const monthlyEmi = Math.round(totalRepayable / tenure);

    return {
      id: input.id,
      employeeId: input.employeeId,
      loanType: input.loanType,
      principalAmount: principal,
      interestRateAnnual: rate,
      totalRepayable,
      tenureMonths: tenure,
      monthlyEmi,
      totalRecovered: 0,
      remainingBalance: totalRepayable,
      status: "ACTIVE",
    };
  }

  /**
   * Process monthly loan EMI recovery
   */
  public static recoverMonthlyEmi(account: StaffLoanAccount): {
    updatedAccount: StaffLoanAccount;
    recoveredThisMonth: number;
  } {
    if (account.status !== "ACTIVE" || account.remainingBalance <= 0) {
      return { updatedAccount: account, recoveredThisMonth: 0 };
    }

    const emi = Math.min(account.monthlyEmi, account.remainingBalance);
    const newRecovered = account.totalRecovered + emi;
    const newBalance = account.remainingBalance - emi;
    const isClosed = newBalance <= 0;

    const updated: StaffLoanAccount = {
      ...account,
      totalRecovered: newRecovered,
      remainingBalance: newBalance,
      status: isClosed ? "REPAID" : "ACTIVE",
    };

    return {
      updatedAccount: updated,
      recoveredThisMonth: emi,
    };
  }

  /**
   * Calculate Disciplinary Subsistence Allowance during vigilance suspension
   * (50% Basic + DA for first 3 months, 75% thereafter)
   */
  public static calculateSubsistenceAllowance(
    basicPay: number,
    daPercent: number,
    suspensionMonths: number
  ) {
    const allowancePercent = suspensionMonths <= 3 ? 0.50 : 0.75;
    const basicComponent = Math.round(basicPay * allowancePercent);
    const daComponent = Math.round(basicComponent * (daPercent / 100));
    const grossSubsistence = basicComponent + daComponent;

    return {
      basicPay,
      suspensionMonths,
      allowancePercent: allowancePercent * 100,
      subsistenceBasic: basicComponent,
      subsistenceDa: daComponent,
      totalSubsistencePayable: grossSubsistence,
      statutoryRule:
        suspensionMonths <= 3
          ? "FR 53(1)(ii)(a): 50% Basic Pay + admissible DA for first 90 days."
          : "FR 53(1)(ii)(a): Enhanced to 75% Basic Pay + admissible DA after 90 days of suspension without employee delay.",
    };
  }

  /**
   * Generate SBI Corporate Multi-Payment (CMP) Pipe-Delimited Bank File
   */
  public static generateSbiCmpFormat(entries: BankPayoutEntry[], treasuryDdoCode: string = "DDO99104"): string {
    const header = `H|${treasuryDdoCode}|${entries.length}|${entries.reduce((a, b) => a + b.netPay, 0)}|${new Date().toISOString().slice(0, 10)}`;
    const lines = entries.map((e, idx) => {
      // Format: D|Serial|AccountNo|IFSC|Amount|Name|Remarks
      return `D|${idx + 1}|${e.accountNumber}|${e.ifscCode}|${e.netPay}|${e.employeeName.toUpperCase()}|SALARY_OCT2026`;
    });
    return `${header}\n${lines.join("\n")}\nT|EOF`;
  }

  /**
   * Generate HDFC Bank Enet / CMS Payout CSV File
   */
  public static generateHdfcEnetFormat(entries: BankPayoutEntry[], clientCode: string = "APEXUNIV"): string {
    const headers = "Transaction Type,Beneficiary Code,Beneficiary Account Number,Beneficiary Name,Amount,Currency,Payment Mode,Bank IFSC Code,Payment Remarks";
    const rows = entries.map((e) => {
      return `PAYROLL,${e.employeeId},${e.accountNumber},"${e.employeeName}",${e.netPay},INR,NEFT,${e.ifscCode},APEX_UNIVERSITY_PAYROLL`;
    });
    return `${headers}\n${rows.join("\n")}`;
  }
}
