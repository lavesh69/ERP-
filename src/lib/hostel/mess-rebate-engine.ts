import fs from "fs";
import path from "path";
import crypto from "crypto";

export type RebateStatus = "SUBMITTED" | "WARDEN_APPROVED" | "BURSAR_CREDITED" | "REJECTED";
export type MealType = "BREAKFAST" | "LUNCH" | "EVENING_SNACKS" | "DINNER";
export type TokenStatus = "ACTIVE" | "CONSUMED" | "SUSPENDED_ON_REBATE";

export interface HostelMessRebateApplication {
  id: string;
  rebateNumber: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  leaveStartDate: string;
  leaveEndDate: string;
  daysAbsent: number;
  leaveReason: "ACADEMIC_INTERNSHIP" | "FESTIVAL_RECESS" | "MEDICAL_LEAVE" | "SPORTS_TOURNAMENT" | "PERSONAL_EMERGENCY";
  leaveApplicationRef?: string;
  dailyDietRateInr: number;
  calculatedRebateAmountInr: number;
  approvalStatus: RebateStatus;
  wardenApprovalNotes?: string;
  wardenSignatory?: string;
  bursarCreditVoucherNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessDiningMealToken {
  id: string;
  tokenNumber: string;
  date: string;
  mealType: MealType;
  studentId: string;
  studentRollNumber: string;
  studentName: string;
  hostelName: string;
  status: TokenStatus;
  qrDigest: string;
  scannedAt?: string;
  scannedByMessManager?: string;
}

export interface MessRebateAnalytics {
  totalRebatesClaimed: number;
  approvedRebates: number;
  totalRebateAmountInr: number;
  activeSuspendedTokens: number;
  kitchenFoodWasteSavedKg: number;
  averageLeaveDays: number;
}

const DATA_DIR = path.join(process.cwd(), "data", "hostel");
const REBATE_FILE = path.join(DATA_DIR, "mess_rebates.json");
const TOKEN_FILE = path.join(DATA_DIR, "dining_tokens.json");

const SEED_REBATES: HostelMessRebateApplication[] = [
  {
    id: "REB-001",
    rebateNumber: "APEX-REB-2026-0041",
    studentId: "STD-2025-001",
    rollNumber: "2025-CS-101",
    studentName: "Aarav Sharma",
    hostelName: "Aryabhatta Hall of Residence",
    roomNumber: "B-204",
    leaveStartDate: "2026-10-18",
    leaveEndDate: "2026-10-23",
    daysAbsent: 6,
    leaveReason: "ACADEMIC_INTERNSHIP",
    leaveApplicationRef: "HOSTEL-LEAVE-8921",
    dailyDietRateInr: 160,
    calculatedRebateAmountInr: 960,
    approvalStatus: "BURSAR_CREDITED",
    wardenApprovalNotes: "Verified via department internship endorsement letter.",
    wardenSignatory: "Dr. Alok Verma (Chief Warden)",
    bursarCreditVoucherNo: "BUR-CR-REB-2026-9041",
    createdAt: "2026-10-10T10:30:00Z",
    updatedAt: "2026-10-12T14:20:00Z",
  },
  {
    id: "REB-002",
    rebateNumber: "APEX-REB-2026-0042",
    studentId: "STD-2025-002",
    rollNumber: "2025-EC-104",
    studentName: "Diya Nair",
    hostelName: "Gargi Hall of Residence",
    roomNumber: "G-108",
    leaveStartDate: "2026-10-20",
    leaveEndDate: "2026-10-25",
    daysAbsent: 6,
    leaveReason: "FESTIVAL_RECESS",
    leaveApplicationRef: "HOSTEL-LEAVE-8930",
    dailyDietRateInr: 160,
    calculatedRebateAmountInr: 960,
    approvalStatus: "WARDEN_APPROVED",
    wardenApprovalNotes: "Diwali term recess approved.",
    wardenSignatory: "Prof. Sunita Rao (Warden - Girls)",
    bursarCreditVoucherNo: "BUR-CR-REB-2026-9042",
    createdAt: "2026-10-11T11:15:00Z",
    updatedAt: "2026-10-12T16:00:00Z",
  },
  {
    id: "REB-003",
    rebateNumber: "APEX-REB-2026-0043",
    studentId: "STD-2025-003",
    rollNumber: "2025-ME-109",
    studentName: "Rohan Kulkarni",
    hostelName: "APJ Abdul Kalam Hostel",
    roomNumber: "K-312",
    leaveStartDate: "2026-10-22",
    leaveEndDate: "2026-10-26",
    daysAbsent: 5,
    leaveReason: "SPORTS_TOURNAMENT",
    leaveApplicationRef: "HOSTEL-LEAVE-8945",
    dailyDietRateInr: 160,
    calculatedRebateAmountInr: 800,
    approvalStatus: "SUBMITTED",
    createdAt: "2026-10-13T09:00:00Z",
    updatedAt: "2026-10-13T09:00:00Z",
  },
];

const SEED_TOKENS: MessDiningMealToken[] = [
  {
    id: "TOK-001",
    tokenNumber: "TKN-DIN-2026-901",
    date: new Date().toISOString().split("T")[0],
    mealType: "DINNER",
    studentId: "STD-2025-001",
    studentRollNumber: "2025-CS-101",
    studentName: "Aarav Sharma",
    hostelName: "Aryabhatta Hall of Residence",
    status: "ACTIVE",
    qrDigest: "APEX-MESS-001-DIN-901-SHA256",
  },
  {
    id: "TOK-002",
    tokenNumber: "TKN-LUN-2026-902",
    date: new Date().toISOString().split("T")[0],
    mealType: "LUNCH",
    studentId: "STD-2025-002",
    studentRollNumber: "2025-EC-104",
    studentName: "Diya Nair",
    hostelName: "Gargi Hall of Residence",
    status: "CONSUMED",
    qrDigest: "APEX-MESS-002-LUN-902-SHA256",
    scannedAt: new Date().toISOString(),
    scannedByMessManager: "Mess Supervisor Ramesh Chandra",
  },
  {
    id: "TOK-003",
    tokenNumber: "TKN-DIN-2026-903",
    date: "2026-10-20",
    mealType: "DINNER",
    studentId: "STD-2025-002",
    studentRollNumber: "2025-EC-104",
    studentName: "Diya Nair",
    hostelName: "Gargi Hall of Residence",
    status: "SUSPENDED_ON_REBATE",
    qrDigest: "APEX-MESS-002-SUSP-REB",
  },
];

function ensureFiles(): {
  rebates: HostelMessRebateApplication[];
  tokens: MessDiningMealToken[];
} {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let rebates: HostelMessRebateApplication[] = SEED_REBATES;
    if (fs.existsSync(REBATE_FILE)) {
      rebates = JSON.parse(fs.readFileSync(REBATE_FILE, "utf-8"));
    } else {
      fs.writeFileSync(REBATE_FILE, JSON.stringify(SEED_REBATES, null, 2), "utf-8");
    }

    let tokens: MessDiningMealToken[] = SEED_TOKENS;
    if (fs.existsSync(TOKEN_FILE)) {
      tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
    } else {
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(SEED_TOKENS, null, 2), "utf-8");
    }

    return { rebates, tokens };
  } catch {
    return { rebates: SEED_REBATES, tokens: SEED_TOKENS };
  }
}

function persistRebates(data: HostelMessRebateApplication[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(REBATE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist mess rebates:", err);
  }
}

function persistTokens(data: MessDiningMealToken[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist dining tokens:", err);
  }
}

export function getAllRebates(filter?: {
  studentId?: string;
  hostelName?: string;
  status?: string;
}): HostelMessRebateApplication[] {
  const { rebates } = ensureFiles();
  let list = rebates;
  if (filter?.studentId) {
    list = list.filter((r) => r.studentId === filter.studentId || r.rollNumber === filter.studentId);
  }
  if (filter?.hostelName && filter.hostelName !== "ALL") {
    list = list.filter((r) => r.hostelName === filter.hostelName);
  }
  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((r) => r.approvalStatus === filter.status);
  }
  return list;
}

export function applyMessRebate(params: {
  studentId: string;
  rollNumber: string;
  studentName: string;
  hostelName: string;
  roomNumber: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveReason: HostelMessRebateApplication["leaveReason"];
  leaveApplicationRef?: string;
  dailyDietRateInr?: number;
}): HostelMessRebateApplication {
  const start = new Date(params.leaveStartDate);
  const end = new Date(params.leaveEndDate);
  const diffTime = end.getTime() - start.getTime();
  const daysAbsent = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (daysAbsent < 3) {
    throw new Error(
      `Statutory Mess Rebate policy requires a minimum of 3 consecutive absent days. Requested: ${daysAbsent} day(s).`
    );
  }

  const { rebates, tokens } = ensureFiles();
  const serial = rebates.length + 41;
  const rate = params.dailyDietRateInr || 160;
  const calculatedRebateAmountInr = daysAbsent * rate;

  const newRebate: HostelMessRebateApplication = {
    id: `REB-${Date.now().toString(36).toUpperCase()}`,
    rebateNumber: `APEX-REB-${new Date().getFullYear()}-${serial.toString().padStart(4, "0")}`,
    studentId: params.studentId,
    rollNumber: params.rollNumber,
    studentName: params.studentName,
    hostelName: params.hostelName,
    roomNumber: params.roomNumber,
    leaveStartDate: params.leaveStartDate,
    leaveEndDate: params.leaveEndDate,
    daysAbsent,
    leaveReason: params.leaveReason,
    leaveApplicationRef: params.leaveApplicationRef || `HOSTEL-LEAVE-${Math.floor(1000 + Math.random() * 9000)}`,
    dailyDietRateInr: rate,
    calculatedRebateAmountInr,
    approvalStatus: "SUBMITTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rebates.unshift(newRebate);
  persistRebates(rebates);
  return newRebate;
}

export function approveMessRebate(params: {
  rebateId: string;
  approved: boolean;
  wardenApprovalNotes?: string;
  wardenSignatory?: string;
}): HostelMessRebateApplication {
  const { rebates, tokens } = ensureFiles();
  const target = rebates.find((r) => r.id === params.rebateId || r.rebateNumber === params.rebateId);
  if (!target) throw new Error(`Rebate application ${params.rebateId} not found`);

  target.updatedAt = new Date().toISOString();
  if (params.approved) {
    target.approvalStatus = "WARDEN_APPROVED";
    target.wardenApprovalNotes = params.wardenApprovalNotes || "Approved as per official hostel leave schedule.";
    target.wardenSignatory = params.wardenSignatory || "Dr. Alok Verma (Chief Warden)";
    target.bursarCreditVoucherNo = `BUR-CR-REB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Automatically suspend active dining tokens in this date range to prevent meal waste
    tokens.forEach((tok) => {
      if (
        tok.studentId === target.studentId &&
        tok.date >= target.leaveStartDate &&
        tok.date <= target.leaveEndDate &&
        tok.status === "ACTIVE"
      ) {
        tok.status = "SUSPENDED_ON_REBATE";
      }
    });
    persistTokens(tokens);
  } else {
    target.approvalStatus = "REJECTED";
    target.wardenApprovalNotes = params.wardenApprovalNotes || "Rejected due to inadequate leave documentation.";
    target.wardenSignatory = params.wardenSignatory || "Hostel Warden Office";
  }

  persistRebates(rebates);
  return target;
}

export function creditMessRebateToBursar(rebateId: string): HostelMessRebateApplication {
  const { rebates } = ensureFiles();
  const target = rebates.find((r) => r.id === rebateId || r.rebateNumber === rebateId);
  if (!target) throw new Error(`Rebate application ${rebateId} not found`);

  target.approvalStatus = "BURSAR_CREDITED";
  target.updatedAt = new Date().toISOString();
  persistRebates(rebates);
  return target;
}

export function getAllTokens(filter?: {
  studentId?: string;
  date?: string;
  mealType?: string;
}): MessDiningMealToken[] {
  const { tokens } = ensureFiles();
  let list = tokens;
  if (filter?.studentId) {
    list = list.filter((t) => t.studentId === filter.studentId || t.studentRollNumber === filter.studentId);
  }
  if (filter?.date) {
    list = list.filter((t) => t.date === filter.date);
  }
  if (filter?.mealType && filter.mealType !== "ALL") {
    list = list.filter((t) => t.mealType === filter.mealType);
  }
  return list;
}

export function generateDailyMealToken(params: {
  studentId: string;
  studentRollNumber: string;
  studentName: string;
  hostelName: string;
  date: string;
  mealType: MealType;
}): MessDiningMealToken {
  const { tokens } = ensureFiles();

  // Check if token exists
  const existing = tokens.find(
    (t) =>
      t.studentId === params.studentId &&
      t.date === params.date &&
      t.mealType === params.mealType
  );
  if (existing) return existing;

  const hash = crypto
    .createHash("sha256")
    .update(`${params.studentId}|${params.date}|${params.mealType}|${Date.now()}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  const newToken: MessDiningMealToken = {
    id: `TOK-${Date.now().toString(36).toUpperCase()}`,
    tokenNumber: `TKN-${params.mealType.slice(0, 3)}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    date: params.date,
    mealType: params.mealType,
    studentId: params.studentId,
    studentRollNumber: params.studentRollNumber,
    studentName: params.studentName,
    hostelName: params.hostelName,
    status: "ACTIVE",
    qrDigest: `APEX-MESS-AUTH-${hash}`,
  };

  tokens.unshift(newToken);
  persistTokens(tokens);
  return newToken;
}

export function consumeMealToken(params: {
  tokenId: string;
  messManager?: string;
}): MessDiningMealToken {
  const { tokens } = ensureFiles();
  const target = tokens.find((t) => t.id === params.tokenId || t.tokenNumber === params.tokenId);
  if (!target) throw new Error(`Dining token ${params.tokenId} not found`);

  if (target.status === "SUSPENDED_ON_REBATE") {
    throw new Error("Dining Token is Suspended: Student is currently on approved Mess Rebate Leave.");
  }
  if (target.status === "CONSUMED") {
    throw new Error(`Token already consumed at ${target.scannedAt} by ${target.scannedByMessManager}`);
  }

  target.status = "CONSUMED";
  target.scannedAt = new Date().toISOString();
  target.scannedByMessManager = params.messManager || "Mess Supervisor";
  persistTokens(tokens);
  return target;
}

export function getMessRebateAnalytics(): MessRebateAnalytics {
  const { rebates, tokens } = ensureFiles();
  const totalClaimed = rebates.length;
  const approved = rebates.filter((r) => ["WARDEN_APPROVED", "BURSAR_CREDITED"].includes(r.approvalStatus));
  const totalAmount = approved.reduce((sum, r) => sum + r.calculatedRebateAmountInr, 0);
  const totalDays = rebates.reduce((sum, r) => sum + r.daysAbsent, 0);
  const avgDays = totalClaimed > 0 ? Number((totalDays / totalClaimed).toFixed(1)) : 0;
  const suspendedCount = tokens.filter((t) => t.status === "SUSPENDED_ON_REBATE").length;
  // Each suspended meal saves ~0.45 kg of kitchen prep waste
  const foodWasteSaved = Number((suspendedCount * 0.45).toFixed(1));

  return {
    totalRebatesClaimed: totalClaimed,
    approvedRebates: approved.length,
    totalRebateAmountInr: totalAmount,
    activeSuspendedTokens: suspendedCount,
    kitchenFoodWasteSavedKg: foodWasteSaved,
    averageLeaveDays: avgDays,
  };
}
