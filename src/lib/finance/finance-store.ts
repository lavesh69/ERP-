/**
 * Persistent Data Store for Enterprise Finance & Treasury Operations
 * Bridges SQLite Prisma database with enterprise structures, installment schedules, fine policies, BRS, and refunds.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import {
  MasterFeeStructure,
  FeeHeadItem,
  calculateFeeStructureTotal,
  StudentInstallmentPlan,
  generateInstallmentSchedule,
  LateFineRule,
  computeLateFine,
  BankStatementEntry,
  BRSMatchResult,
  matchBankTransactionsWithChallans,
  RefundVoucher,
  evaluateRefundEligibility,
} from "./finance-engine";

const DATA_DIR = path.join(process.cwd(), "data", "finance");
const STORE_FILE = path.join(DATA_DIR, "enterprise_finance.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface FinanceStoreSchema {
  structures: MasterFeeStructure[];
  installmentPlans: StudentInstallmentPlan[];
  fineRule: LateFineRule;
  bankEntries: BankStatementEntry[];
  refundVouchers: RefundVoucher[];
}

const DEFAULT_STRUCTURES: MasterFeeStructure[] = [
  {
    id: "mfs-btech-cse-gen",
    code: "BTECH-CSE-2026-REG",
    title: "B.Tech Computer Science (Regular Merit Quota) 2026-27",
    programCode: "BTECH-CSE",
    academicYear: "2026-2027",
    quotaType: "MERIT_GENERAL",
    studentType: "DAY_SCHOLAR",
    currency: "USD",
    heads: [
      { id: "h1", name: "Academic Tuition & Instruction Fee", category: "TUITION", amount: 6500 },
      { id: "h2", name: "High-Performance Computing & AI Labs", category: "LAB", amount: 1200 },
      { id: "h3", name: "IEEE Digital Library & Textbook Access", category: "LIBRARY", amount: 450 },
      { id: "h4", name: "Continuous Assessment & Semester Exams", category: "EXAM", amount: 350 },
      { id: "h5", name: "Student Gymnasium & Sports Complex", category: "OTHER", amount: 200 },
      { id: "h6", name: "Institutional Caution Deposit (Refundable)", category: "CAUTION_DEPOSIT", amount: 500, isRefundable: true },
    ],
    totalAmount: 9200,
    dueDate: "2026-11-15",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mfs-btech-cse-hostel",
    code: "BTECH-CSE-2026-HST",
    title: "B.Tech Computer Science (Hosteller AC Residence) 2026-27",
    programCode: "BTECH-CSE",
    academicYear: "2026-2027",
    quotaType: "MERIT_GENERAL",
    studentType: "HOSTELLER_PREMIUM",
    currency: "USD",
    heads: [
      { id: "h1", name: "Academic Tuition & Instruction Fee", category: "TUITION", amount: 6500 },
      { id: "h2", name: "High-Performance Computing & AI Labs", category: "LAB", amount: 1200 },
      { id: "h3", name: "IEEE Digital Library & Textbook Access", category: "LIBRARY", amount: 450 },
      { id: "h4", name: "Continuous Assessment & Semester Exams", category: "EXAM", amount: 350 },
      { id: "h5", name: "Air-Conditioned Single Residency & Mess Meals", category: "HOSTEL", amount: 3800 },
      { id: "h6", name: "Institutional Caution Deposit (Refundable)", category: "CAUTION_DEPOSIT", amount: 800, isRefundable: true },
    ],
    totalAmount: 13100,
    dueDate: "2026-11-15",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mfs-mba-exec",
    code: "MBA-EXEC-2026",
    title: "Executive Master of Business Administration (Global Cohort)",
    programCode: "MBA-EXEC",
    academicYear: "2026-2027",
    quotaType: "MANAGEMENT",
    studentType: "DAY_SCHOLAR",
    currency: "USD",
    heads: [
      { id: "h1", name: "Executive Business Core Tuition", category: "TUITION", amount: 9500 },
      { id: "h2", name: "Bloomberg Financial Terminal Access", category: "LAB", amount: 1800 },
      { id: "h3", name: "Harvard Business School Case Studies", category: "LIBRARY", amount: 850 },
      { id: "h4", name: "Leadership Colloquium & Capstone", category: "OTHER", amount: 1200 },
      { id: "h5", name: "Executive Caution Deposit (Refundable)", category: "CAUTION_DEPOSIT", amount: 650, isRefundable: true },
    ],
    totalAmount: 14000,
    dueDate: "2026-10-31",
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_FINE_RULE: LateFineRule = {
  id: "lfr-standard-2026",
  name: "Standard Academic Term Late Fine Policy",
  gracePeriodDays: 7,
  model: "DAILY",
  flatAmount: 50,
  dailyRate: 10,
  percentageRate: 2,
  maxCap: 200,
  isActive: true,
};

const DEFAULT_BANK_ENTRIES: BankStatementEntry[] = [
  {
    id: "bnk-001",
    txnDate: "2026-10-04",
    utrNumber: "CHL-2026-90412",
    remitterName: "David Mercer",
    amount: 1500,
    description: "NEFT/IB/CHL-2026-90412/Apex University Tuition",
    matchedStatus: "MATCHED",
    matchedChallanRef: "CHL-2026-90412",
  },
  {
    id: "bnk-002",
    txnDate: "2026-10-05",
    utrNumber: "CMS-NEFT-883921",
    remitterName: "Sanjay Patel",
    amount: 1200,
    description: "RTGS TRANSFER SANJAY PATEL FEES BTECH",
    matchedStatus: "UNMATCHED",
  },
  {
    id: "bnk-003",
    txnDate: "2026-10-06",
    utrNumber: "UPI-AXIS-0912443",
    remitterName: "Elena Rostova",
    amount: 2500,
    description: "UPI/294819230/Elena Rostova Fall Term Fee",
    matchedStatus: "UNMATCHED",
  },
];

const DEFAULT_REFUNDS: RefundVoucher[] = [
  {
    id: "rfnd-001",
    voucherNo: "RFND-2026-0018",
    studentId: "stu-alex-mercer",
    studentName: "Alex Mercer",
    rollNo: "CS2026-001",
    program: "B.Tech Computer Science & Engineering",
    type: "CAUTION_MONEY",
    amount: 500,
    bankDetails: {
      accountHolder: "Alex Mercer",
      accountNumber: "918237461928",
      ifscOrSwift: "CHASUS33XXX",
      bankName: "Chase Manhattan Bank",
    },
    clearanceStatus: {
      libraryCleared: true,
      hostelCleared: true,
      labCleared: true,
    },
    status: "APPROVED",
    requestedAt: "2026-10-02T10:00:00.000Z",
    approvedBy: "Bursar Treasury Controller",
    remarks: "All departmental dues and library borrowings verified cleared.",
  },
  {
    id: "rfnd-002",
    voucherNo: "RFND-2026-0024",
    studentId: "stu-priya-patel",
    studentName: "Priya Patel",
    rollNo: "CS2026-002",
    program: "B.Tech Computer Science & Engineering",
    type: "EXCESS_PAYMENT",
    amount: 350,
    bankDetails: {
      accountHolder: "Priya Patel",
      accountNumber: "482910492817",
      ifscOrSwift: "BOFAUS3NXXX",
      bankName: "Bank of America",
    },
    clearanceStatus: {
      libraryCleared: true,
      hostelCleared: false,
      labCleared: true,
    },
    status: "PENDING_APPROVAL",
    requestedAt: "2026-10-05T14:30:00.000Z",
    remarks: "Double payment refund requested. Awaiting hostel warden room inspection sign-off.",
  },
];

function readStore(): FinanceStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: FinanceStoreSchema = {
      structures: DEFAULT_STRUCTURES,
      installmentPlans: [],
      fineRule: DEFAULT_FINE_RULE,
      bankEntries: DEFAULT_BANK_ENTRIES,
      refundVouchers: DEFAULT_REFUNDS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      structures: parsed.structures || DEFAULT_STRUCTURES,
      installmentPlans: parsed.installmentPlans || [],
      fineRule: parsed.fineRule || DEFAULT_FINE_RULE,
      bankEntries: parsed.bankEntries || DEFAULT_BANK_ENTRIES,
      refundVouchers: parsed.refundVouchers || DEFAULT_REFUNDS,
    };
  } catch {
    return {
      structures: DEFAULT_STRUCTURES,
      installmentPlans: [],
      fineRule: DEFAULT_FINE_RULE,
      bankEntries: DEFAULT_BANK_ENTRIES,
      refundVouchers: DEFAULT_REFUNDS,
    };
  }
}

function writeStore(data: FinanceStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getAllMasterFeeStructures(): MasterFeeStructure[] {
  const store = readStore();
  return store.structures;
}

export async function createOrUpdateMasterFeeStructure(
  structureData: Partial<MasterFeeStructure>
): Promise<MasterFeeStructure> {
  const store = readStore();
  const id = structureData.id || `mfs-${Date.now().toString(36)}`;
  const code = (structureData.code || `FEE-${Date.now().toString().slice(-4)}`).toUpperCase().trim();
  const title = structureData.title || "Custom Term Fee Structure";
  const heads = structureData.heads || [
    { id: "h1", name: "Tuition & Instruction", category: "TUITION", amount: 5000 },
  ];
  const totalAmount = calculateFeeStructureTotal(heads);

  const existingIdx = store.structures.findIndex((s) => s.id === id || s.code === code);
  const newStructure: MasterFeeStructure = {
    id,
    code,
    title,
    programCode: structureData.programCode || "BTECH-CSE",
    academicYear: structureData.academicYear || "2026-2027",
    quotaType: structureData.quotaType || "MERIT_GENERAL",
    studentType: structureData.studentType || "DAY_SCHOLAR",
    currency: structureData.currency || "USD",
    heads,
    totalAmount,
    dueDate: structureData.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    createdAt: structureData.createdAt || new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    store.structures[existingIdx] = newStructure;
  } else {
    store.structures.push(newStructure);
  }

  writeStore(store);

  // Sync with Prisma FeeStructure table if not already present
  await prisma.feeStructure
    .upsert({
      where: { code: newStructure.code },
      update: {
        title: newStructure.title,
        totalAmount: newStructure.totalAmount,
        breakdownJson: JSON.stringify(newStructure.heads),
      },
      create: {
        code: newStructure.code,
        title: newStructure.title,
        totalAmount: newStructure.totalAmount,
        dueDate: new Date(newStructure.dueDate),
        breakdownJson: JSON.stringify(newStructure.heads),
      },
    })
    .catch(() => null);

  return newStructure;
}

export async function getStudentInstallments(studentFeeId?: string): Promise<StudentInstallmentPlan[]> {
  const store = readStore();
  if (studentFeeId) {
    return store.installmentPlans.filter((p) => p.studentFeeId === studentFeeId);
  }

  // If empty, auto-generate standard installment schedules for existing student fees
  if (store.installmentPlans.length === 0) {
    const fees = await prisma.studentFee.findMany({
      take: 10,
      include: { student: { include: { user: true } }, feeStructure: true },
    }).catch(() => []);

    for (const f of fees) {
      const milestones = generateInstallmentSchedule(f.totalAmount);
      // Mark milestones paid based on paidAmount
      let remainingPaid = f.paidAmount;
      for (const m of milestones) {
        if (remainingPaid >= m.amount) {
          m.status = "PAID";
          m.paidAmount = m.amount;
          remainingPaid -= m.amount;
        } else if (remainingPaid > 0) {
          m.paidAmount = remainingPaid;
          remainingPaid = 0;
        }
      }

      store.installmentPlans.push({
        id: `plan-${f.id}`,
        studentFeeId: f.id,
        studentId: f.studentId,
        studentName: `${f.student.user.firstName} ${f.student.user.lastName}`,
        rollNo: f.student.rollNumber,
        totalFee: f.totalAmount,
        milestones,
        createdAt: new Date().toISOString(),
      });
    }
    writeStore(store);
  }

  return store.installmentPlans;
}

export function getActiveLateFineRule(): LateFineRule {
  const store = readStore();
  return store.fineRule;
}

export function saveLateFineRule(rule: Partial<LateFineRule>): LateFineRule {
  const store = readStore();
  store.fineRule = {
    ...store.fineRule,
    ...rule,
  };
  writeStore(store);
  return store.fineRule;
}

export async function executeLateFineAssessment(): Promise<{
  scannedAccounts: number;
  finesAppliedCount: number;
  totalFinesAssessed: number;
  records: { studentName: string; rollNo: string; pendingAmount: number; daysOverdue: number; fineAssessed: number }[];
}> {
  const store = readStore();
  const rule = store.fineRule;
  const now = new Date();

  const overdueFees = await prisma.studentFee.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
    },
    include: {
      student: { include: { user: true } },
    },
  }).catch(() => []);

  const results = [];
  let totalFinesAssessed = 0;

  for (const fee of overdueFees) {
    const pending = fee.totalAmount - fee.paidAmount;
    if (pending <= 0) continue;

    const fineResult = computeLateFine(fee.dueDate, pending, rule, now);
    if (fineResult.isGraceExceeded && fineResult.fineAmount > 0) {
      results.push({
        studentName: `${fee.student.user.firstName} ${fee.student.user.lastName}`,
        rollNo: fee.student.rollNumber,
        pendingAmount: pending,
        daysOverdue: fineResult.daysOverdue,
        fineAssessed: fineResult.fineAmount,
      });
      totalFinesAssessed += fineResult.fineAmount;

      // Update fee status to OVERDUE if not already
      if (fee.status !== "OVERDUE") {
        await prisma.studentFee.update({
          where: { id: fee.id },
          data: { status: "OVERDUE" },
        }).catch(() => null);
      }
    }
  }

  return {
    scannedAccounts: overdueFees.length,
    finesAppliedCount: results.length,
    totalFinesAssessed,
    records: results,
  };
}

export async function getBankStatementEntries(): Promise<BankStatementEntry[]> {
  const store = readStore();
  return store.bankEntries;
}

export async function addBankStatementEntries(entries: Partial<BankStatementEntry>[]): Promise<BankStatementEntry[]> {
  const store = readStore();
  const added: BankStatementEntry[] = entries.map((e, idx) => ({
    id: e.id || `bnk-${Date.now()}-${idx}`,
    txnDate: e.txnDate || new Date().toISOString().split("T")[0],
    utrNumber: (e.utrNumber || `UTR-${Date.now()}`).toUpperCase().trim(),
    remitterName: e.remitterName || "Unknown Remitter",
    amount: Number(e.amount) || 0,
    description: e.description || "Bank Direct Deposit",
    matchedStatus: "UNMATCHED",
  }));

  store.bankEntries.push(...added);
  writeStore(store);
  return store.bankEntries;
}

export async function runBankReconciliationMatching(): Promise<{
  results: BRSMatchResult[];
  exactMatchCount: number;
  probableMatchCount: number;
  unmatchedCount: number;
}> {
  const store = readStore();

  // Fetch all pending/unreconciled bank challans from DB
  const pendingTransactions = await prisma.paymentTransaction.findMany({
    where: {
      status: "PENDING",
      paymentMethod: "BANK_CHALLAN",
    },
    include: {
      studentFee: {
        include: {
          student: { include: { user: true } },
        },
      },
    },
  }).catch(() => []);

  const pendingChallans = pendingTransactions.map((t) => ({
    id: t.id,
    referenceNumber: t.referenceNumber,
    studentName: `${t.studentFee.student.user.firstName} ${t.studentFee.student.user.lastName}`,
    rollNo: t.studentFee.student.rollNumber,
    amount: t.amount,
  }));

  const matches = matchBankTransactionsWithChallans(store.bankEntries, pendingChallans);

  // Auto-settle exact matches if found
  for (const m of matches) {
    if (m.status === "EXACT_MATCH" && m.matchedChallanId) {
      const txn = pendingTransactions.find((p) => p.id === m.matchedChallanId);
      if (txn) {
        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: txn.id },
            data: { status: "SUCCESS", gatewayResponse: `AUTO_RECONCILED_VIA_BRS_UTR_${m.utrNumber}` },
          }),
          prisma.studentFee.update({
            where: { id: txn.studentFeeId },
            data: {
              paidAmount: { increment: txn.amount },
              status: "PAID",
            },
          }),
        ]).catch(() => null);

        // Update local bank entry status
        const bnkEntry = store.bankEntries.find((b) => b.id === m.bankEntryId);
        if (bnkEntry) {
          bnkEntry.matchedStatus = "MATCHED";
          bnkEntry.matchedChallanRef = txn.referenceNumber;
        }
      }
    }
  }

  writeStore(store);

  const exactMatchCount = matches.filter((m) => m.status === "EXACT_MATCH").length;
  const probableMatchCount = matches.filter((m) => m.status === "PROBABLE_MATCH").length;
  const unmatchedCount = matches.filter((m) => m.status === "NO_MATCH").length;

  return {
    results: matches,
    exactMatchCount,
    probableMatchCount,
    unmatchedCount,
  };
}

export function getAllRefundVouchers(): RefundVoucher[] {
  const store = readStore();
  return store.refundVouchers;
}

export function createRefundVoucher(data: Partial<RefundVoucher>): RefundVoucher {
  const store = readStore();
  const voucherNo = `RFND-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newVoucher: RefundVoucher = {
    id: `rfnd-${Date.now()}`,
    voucherNo,
    studentId: data.studentId || "stu-general",
    studentName: data.studentName || "Scholar Beneficiary",
    rollNo: data.rollNo || "CS2026-NIL",
    program: data.program || "Computer Science",
    type: data.type || "CAUTION_MONEY",
    amount: Number(data.amount) || 500,
    bankDetails: data.bankDetails || {
      accountHolder: data.studentName || "Scholar Beneficiary",
      accountNumber: "0000000000",
      ifscOrSwift: "INSTITUTION-SWIFT",
      bankName: "National Treasury Bank",
    },
    clearanceStatus: data.clearanceStatus || {
      libraryCleared: true,
      hostelCleared: true,
      labCleared: true,
    },
    status: "PENDING_APPROVAL",
    requestedAt: new Date().toISOString(),
    remarks: data.remarks || "Refund application logged with Bursar Treasury",
  };

  store.refundVouchers.unshift(newVoucher);
  writeStore(store);
  return newVoucher;
}

export function updateRefundVoucherStatus(
  voucherId: string,
  status: "APPROVED" | "DISBURSED" | "REJECTED",
  actorEmail: string
): RefundVoucher | null {
  const store = readStore();
  const v = store.refundVouchers.find((r) => r.id === voucherId);
  if (!v) return null;

  v.status = status;
  if (status === "APPROVED") {
    v.approvedBy = actorEmail;
  } else if (status === "DISBURSED") {
    v.disbursedAt = new Date().toISOString();
  }

  writeStore(store);
  return v;
}
