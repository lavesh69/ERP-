/**
 * Enterprise Campus Finance & Treasury Engine
 * Inspired by SAP S/4HANA Higher Ed, Ellucian Banner Student Finance & Oracle PeopleSoft Campus Solutions.
 */

import crypto from "crypto";

export interface FeeHeadItem {
  id: string;
  name: string;
  category: "TUITION" | "LAB" | "LIBRARY" | "EXAM" | "HOSTEL" | "TRANSPORT" | "CAUTION_DEPOSIT" | "OTHER";
  amount: number;
  isRefundable?: boolean;
}

export interface MasterFeeStructure {
  id: string;
  code: string;
  title: string;
  programCode: string;
  academicYear: string;
  quotaType: "MERIT_GENERAL" | "MANAGEMENT" | "NRI_INTERNATIONAL" | "EWS_SPORTS";
  studentType: "DAY_SCHOLAR" | "HOSTELLER_STANDARD" | "HOSTELLER_PREMIUM";
  currency: string;
  heads: FeeHeadItem[];
  totalAmount: number;
  dueDate: string;
  createdAt: string;
}

export interface InstallmentMilestone {
  milestoneNumber: number;
  title: string;
  percentage: number;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidAmount: number;
}

export interface StudentInstallmentPlan {
  id: string;
  studentFeeId: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  totalFee: number;
  milestones: InstallmentMilestone[];
  createdAt: string;
}

export interface LateFineRule {
  id: string;
  name: string;
  gracePeriodDays: number;
  model: "FLAT" | "DAILY" | "PERCENTAGE";
  flatAmount: number;
  dailyRate: number;
  percentageRate: number; // e.g. 2% per month
  maxCap: number;
  isActive: boolean;
}

export interface BankStatementEntry {
  id: string;
  txnDate: string;
  utrNumber: string;
  remitterName: string;
  amount: number;
  description: string;
  matchedStatus: "UNMATCHED" | "MATCHED" | "MANUAL";
  matchedChallanRef?: string;
}

export interface BRSMatchResult {
  bankEntryId: string;
  utrNumber: string;
  bankAmount: number;
  matchedChallanId?: string;
  challanReference?: string;
  studentName?: string;
  challanAmount?: number;
  confidenceScore: number; // 0.0 to 1.0
  matchReason: string;
  status: "EXACT_MATCH" | "PROBABLE_MATCH" | "NO_MATCH";
}

export interface RefundVoucher {
  id: string;
  voucherNo: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  program: string;
  type: "CAUTION_MONEY" | "EXCESS_PAYMENT" | "WITHDRAWAL";
  amount: number;
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifscOrSwift: string;
    bankName: string;
  };
  clearanceStatus: {
    libraryCleared: boolean;
    hostelCleared: boolean;
    labCleared: boolean;
  };
  status: "PENDING_APPROVAL" | "APPROVED" | "DISBURSED" | "REJECTED";
  requestedAt: string;
  approvedBy?: string;
  disbursedAt?: string;
  remarks?: string;
}

/**
 * Calculates sum total of master fee heads
 */
export function calculateFeeStructureTotal(heads: FeeHeadItem[]): number {
  return heads.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);
}

/**
 * Generates automated 3-milestone installment plan schedule
 */
export function generateInstallmentSchedule(
  totalAmount: number,
  templates: { title: string; percentage: number; dueDaysFromNow: number }[] = [
    { title: "Term 1: Admission & Registration", percentage: 50, dueDaysFromNow: 15 },
    { title: "Term 2: Mid-Semester Milestone", percentage: 25, dueDaysFromNow: 60 },
    { title: "Term 3: End-Semester Milestone", percentage: 25, dueDaysFromNow: 120 },
  ],
  baseDate: Date = new Date()
): InstallmentMilestone[] {
  let allocated = 0;
  return templates.map((tmpl, idx) => {
    const isLast = idx === templates.length - 1;
    const amount = isLast
      ? Math.max(0, totalAmount - allocated)
      : Math.round((totalAmount * tmpl.percentage) / 100);
    allocated += amount;

    const dueDate = new Date(baseDate);
    dueDate.setDate(dueDate.getDate() + tmpl.dueDaysFromNow);

    return {
      milestoneNumber: idx + 1,
      title: tmpl.title,
      percentage: tmpl.percentage,
      amount,
      dueDate: dueDate.toISOString().split("T")[0],
      status: "PENDING",
      paidAmount: 0,
    };
  });
}

/**
 * Computes overdue late fine based on grace period and fine policy model
 */
export function computeLateFine(
  dueDateStr: string | Date,
  pendingAmount: number,
  rule: LateFineRule,
  asOfDate: Date = new Date()
): { daysOverdue: number; fineAmount: number; isGraceExceeded: boolean } {
  if (pendingAmount <= 0) {
    return { daysOverdue: 0, fineAmount: 0, isGraceExceeded: false };
  }

  const due = new Date(dueDateStr);
  const diffTime = asOfDate.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= rule.gracePeriodDays) {
    return { daysOverdue: Math.max(0, diffDays), fineAmount: 0, isGraceExceeded: false };
  }

  const chargeableDays = diffDays - rule.gracePeriodDays;
  let calculated = 0;

  if (rule.model === "FLAT") {
    calculated = rule.flatAmount;
  } else if (rule.model === "DAILY") {
    calculated = chargeableDays * rule.dailyRate;
  } else if (rule.model === "PERCENTAGE") {
    const monthsOverdue = Math.max(1, Math.ceil(chargeableDays / 30));
    calculated = Math.round((pendingAmount * (rule.percentageRate / 100)) * monthsOverdue);
  }

  const cappedFine = Math.min(rule.maxCap, Math.max(0, calculated));

  return {
    daysOverdue: diffDays,
    fineAmount: cappedFine,
    isGraceExceeded: true,
  };
}

/**
 * Algorithmic Bank Reconciliation (BRS) auto-matcher
 * Matches bank statement records with pending bursar challans based on UTR tokens, amounts & remitter details.
 */
export function matchBankTransactionsWithChallans(
  bankEntries: BankStatementEntry[],
  pendingChallans: { id: string; referenceNumber: string; studentName: string; amount: number; rollNo: string }[]
): BRSMatchResult[] {
  const results: BRSMatchResult[] = [];
  const matchedChallanIds = new Set<string>();

  for (const entry of bankEntries) {
    // 1. Exact match by UTR reference token
    const exactRefMatch = pendingChallans.find(
      (c) =>
        !matchedChallanIds.has(c.id) &&
        (entry.utrNumber.toUpperCase() === c.referenceNumber.toUpperCase() ||
          entry.description.toUpperCase().includes(c.referenceNumber.toUpperCase()))
    );

    if (exactRefMatch) {
      matchedChallanIds.add(exactRefMatch.id);
      results.push({
        bankEntryId: entry.id,
        utrNumber: entry.utrNumber,
        bankAmount: entry.amount,
        matchedChallanId: exactRefMatch.id,
        challanReference: exactRefMatch.referenceNumber,
        studentName: exactRefMatch.studentName,
        challanAmount: exactRefMatch.amount,
        confidenceScore: 1.0,
        matchReason: `Exact reference token match on ${exactRefMatch.referenceNumber}`,
        status: "EXACT_MATCH",
      });
      continue;
    }

    // 2. Probable match by exact amount + student name substring
    const probableMatch = pendingChallans.find((c) => {
      if (matchedChallanIds.has(c.id)) return false;
      const amountMatches = Math.abs(c.amount - entry.amount) < 0.01;
      const nameParts = c.studentName.toLowerCase().split(" ");
      const nameMatches = nameParts.some((p) => p.length > 2 && entry.remitterName.toLowerCase().includes(p));
      return amountMatches && nameMatches;
    });

    if (probableMatch) {
      matchedChallanIds.add(probableMatch.id);
      results.push({
        bankEntryId: entry.id,
        utrNumber: entry.utrNumber,
        bankAmount: entry.amount,
        matchedChallanId: probableMatch.id,
        challanReference: probableMatch.referenceNumber,
        studentName: probableMatch.studentName,
        challanAmount: probableMatch.amount,
        confidenceScore: 0.85,
        matchReason: `Amount parity ($${entry.amount}) and remitter name similarity (${probableMatch.studentName})`,
        status: "PROBABLE_MATCH",
      });
      continue;
    }

    // 3. Unmatched
    results.push({
      bankEntryId: entry.id,
      utrNumber: entry.utrNumber,
      bankAmount: entry.amount,
      confidenceScore: 0.0,
      matchReason: "No matching pending offline bank challan located in university ledger",
      status: "NO_MATCH",
    });
  }

  return results;
}

/**
 * Evaluates whether student has clearance from Library, Hostel and Labs for Caution Deposit/Refund
 */
export function evaluateRefundEligibility(voucher: RefundVoucher): {
  eligible: boolean;
  pendingClearances: string[];
} {
  const pending: string[] = [];
  if (!voucher.clearanceStatus.libraryCleared) pending.push("Library Book Returns & Fine Clearance");
  if (!voucher.clearanceStatus.hostelCleared) pending.push("Hostel Warden Damage & Inventory Clearance");
  if (!voucher.clearanceStatus.labCleared) pending.push("Computing / Hardware Lab Equipment Clearance");

  return {
    eligible: pending.length === 0,
    pendingClearances: pending,
  };
}

/**
 * Creates SHA-256 seal for Day-End Bursar Cashbook reconciliation
 */
export function generateDayEndSettlementHash(
  dateStr: string,
  totalAmount: number,
  txnCount: number,
  auditorEmail: string
): string {
  return crypto
    .createHash("sha256")
    .update(`DAY_END_BURSAR:${dateStr}:${totalAmount.toFixed(2)}:${txnCount}:${auditorEmail}`)
    .digest("hex")
    .toUpperCase();
}
