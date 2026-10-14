import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface AssetCheckItem {
  itemName: string;
  category: "FURNITURE" | "ELECTRICAL" | "FIXTURE" | "KEY";
  moveInStatus: "PRISTINE" | "GOOD" | "MINOR_WEAR";
  moveOutStatus?: "PRISTINE" | "GOOD" | "MINOR_WEAR" | "DAMAGED" | "MISSING";
  damageCharge: number;
  notes?: string;
}

export type InspectionStatus =
  | "MOVE_IN_VERIFIED"
  | "INSPECTION_PENDING"
  | "CLEARED_REFUND_APPROVED"
  | "DISPUTED";

export interface RoomInspectionRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNumber: string;
  blockName: string;
  academicYear: string;
  cautionDepositAmount: number;
  totalDamageDeductions: number;
  refundableAmount: number;
  moveInDate: string;
  moveOutDate?: string;
  inspectionStatus: InspectionStatus;
  assets: AssetCheckItem[];
  clearanceSeal?: string;
  wardenSignoff?: string;
  clearedAt?: string;
  wardenNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const INSPECTIONS_FILE = path.join(DATA_DIR, "hostel-inventory-inspections.json");

export const DEFAULT_INSPECTION_SEED: RoomInspectionRecord[] = [
  {
    id: "INSP-2026-081",
    studentId: "STU-2026-001",
    studentName: "Alex Rivera",
    rollNo: "CS2026-001",
    roomNumber: "B-204",
    blockName: "Mandela International House",
    academicYear: "2025-2026",
    cautionDepositAmount: 500,
    totalDamageDeductions: 0,
    refundableAmount: 500,
    moveInDate: "2025-08-10",
    moveOutDate: "2026-05-20",
    inspectionStatus: "CLEARED_REFUND_APPROVED",
    assets: [
      { itemName: "Study Table & Drawers", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Ergonomic Mesh Chair", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Single Bed Frame & Mattress", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Room & Wardrobe RFID Keys", category: "KEY", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Ceiling Fan & LED Fixtures", category: "ELECTRICAL", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
    ],
    clearanceSeal: "APEX-HOSTEL-CLEAR-91F2C40A7B2011DE",
    wardenSignoff: "Chief Warden Dr. H. C. Verma",
    clearedAt: "2026-05-20T11:00:00.000Z",
    wardenNotes: "All assets in pristine condition. Zero deductions. Full caution deposit release authorized.",
  },
  {
    id: "INSP-2026-082",
    studentId: "STU-2026-002",
    studentName: "Priya Sharma",
    rollNo: "ME2025-042",
    roomNumber: "C-112",
    blockName: "Curie Women's Hall",
    academicYear: "2025-2026",
    cautionDepositAmount: 500,
    totalDamageDeductions: 45,
    refundableAmount: 455,
    moveInDate: "2025-08-12",
    moveOutDate: "2026-05-22",
    inspectionStatus: "CLEARED_REFUND_APPROVED",
    assets: [
      { itemName: "Study Table & Drawers", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Ergonomic Mesh Chair", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "DAMAGED", damageCharge: 30, notes: "Armrest cracked" },
      { itemName: "Single Bed Frame & Mattress", category: "FURNITURE", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
      { itemName: "Room & Wardrobe RFID Keys", category: "KEY", moveInStatus: "PRISTINE", moveOutStatus: "MISSING", damageCharge: 15, notes: "Duplicate wardrobe key charged" },
      { itemName: "Ceiling Fan & LED Fixtures", category: "ELECTRICAL", moveInStatus: "PRISTINE", moveOutStatus: "GOOD", damageCharge: 0 },
    ],
    clearanceSeal: "APEX-HOSTEL-CLEAR-44E890B2CD91A578",
    wardenSignoff: "Warden Prof. Sarita Sundaram",
    clearedAt: "2026-05-22T14:30:00.000Z",
    wardenNotes: "Student accepted deductions for damaged armrest ($30) and replacement key ($15). Net refund $455 approved.",
  },
  {
    id: "INSP-2026-083",
    studentId: "STU-2026-003",
    studentName: "Marcus Vance",
    rollNo: "EE2024-019",
    roomNumber: "A-305",
    blockName: "Aryabhata Engineering Hall",
    academicYear: "2025-2026",
    cautionDepositAmount: 500,
    totalDamageDeductions: 0,
    refundableAmount: 500,
    moveInDate: "2025-08-11",
    inspectionStatus: "MOVE_IN_VERIFIED",
    assets: [
      { itemName: "Study Table & Drawers", category: "FURNITURE", moveInStatus: "GOOD", damageCharge: 0 },
      { itemName: "Ergonomic Mesh Chair", category: "FURNITURE", moveInStatus: "GOOD", damageCharge: 0 },
      { itemName: "Single Bed Frame & Mattress", category: "FURNITURE", moveInStatus: "GOOD", damageCharge: 0 },
      { itemName: "Room & Wardrobe RFID Keys", category: "KEY", moveInStatus: "PRISTINE", damageCharge: 0 },
      { itemName: "Ceiling Fan & LED Fixtures", category: "ELECTRICAL", moveInStatus: "GOOD", damageCharge: 0 },
    ],
    wardenNotes: "Currently occupied. Move-in verification baseline locked.",
  },
];

function ensureInspectionsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INSPECTIONS_FILE)) {
    fs.writeFileSync(INSPECTIONS_FILE, JSON.stringify(DEFAULT_INSPECTION_SEED, null, 2), "utf8");
  }
}

export function getAllInspections(): RoomInspectionRecord[] {
  ensureInspectionsFile();
  try {
    const raw = fs.readFileSync(INSPECTIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_INSPECTION_SEED;
  } catch (err) {
    console.error("Error reading hostel inspections file:", err);
    return DEFAULT_INSPECTION_SEED;
  }
}

export function saveInspections(records: RoomInspectionRecord[]): void {
  ensureInspectionsFile();
  fs.writeFileSync(INSPECTIONS_FILE, JSON.stringify(records, null, 2), "utf8");
}

export function recordMoveIn(data: {
  studentId: string;
  studentName: string;
  rollNo: string;
  roomNumber: string;
  blockName: string;
  academicYear?: string;
  cautionDepositAmount?: number;
  assets?: AssetCheckItem[];
}): RoomInspectionRecord {
  const records = getAllInspections();
  const year = new Date().getFullYear();
  const id = `INSP-${year}-${(records.length + 1).toString().padStart(3, "0")}`;

  const defaultAssets: AssetCheckItem[] = [
    { itemName: "Study Desk & Shelving", category: "FURNITURE", moveInStatus: "PRISTINE", damageCharge: 0 },
    { itemName: "Ergonomic Study Chair", category: "FURNITURE", moveInStatus: "PRISTINE", damageCharge: 0 },
    { itemName: "Bed Frame & Ortho Mattress", category: "FURNITURE", moveInStatus: "PRISTINE", damageCharge: 0 },
    { itemName: "RFID Smart Card & Wardrobe Key", category: "KEY", moveInStatus: "PRISTINE", damageCharge: 0 },
    { itemName: "Electrical Fittings & Switchboard", category: "ELECTRICAL", moveInStatus: "PRISTINE", damageCharge: 0 },
    { itemName: "Bathroom Plumbing & Sanitary Fixtures", category: "FIXTURE", moveInStatus: "PRISTINE", damageCharge: 0 },
  ];

  const caution = data.cautionDepositAmount || 500;
  const newRecord: RoomInspectionRecord = {
    id,
    studentId: data.studentId,
    studentName: data.studentName.trim(),
    rollNo: data.rollNo.trim(),
    roomNumber: data.roomNumber.trim(),
    blockName: data.blockName.trim(),
    academicYear: data.academicYear || `${year}-${year + 1}`,
    cautionDepositAmount: caution,
    totalDamageDeductions: 0,
    refundableAmount: caution,
    moveInDate: new Date().toISOString().split("T")[0],
    inspectionStatus: "MOVE_IN_VERIFIED",
    assets: data.assets || defaultAssets,
    wardenNotes: "Move-in physical inventory audit verified by block caretaker.",
  };

  records.unshift(newRecord);
  saveInspections(records);
  return newRecord;
}

export function conductMoveOutAudit(
  inspectionId: string,
  updatedAssets: AssetCheckItem[],
  wardenName: string,
  wardenNotes?: string
): RoomInspectionRecord {
  const records = getAllInspections();
  const index = records.findIndex((r) => r.id === inspectionId);
  if (index === -1) {
    throw new Error(`Inspection record ${inspectionId} not found`);
  }

  const rec = records[index];
  rec.assets = updatedAssets;
  const totalDeductions = updatedAssets.reduce((sum, item) => sum + (item.damageCharge || 0), 0);
  rec.totalDamageDeductions = totalDeductions;
  rec.refundableAmount = Math.max(0, rec.cautionDepositAmount - totalDeductions);
  rec.moveOutDate = new Date().toISOString().split("T")[0];
  rec.inspectionStatus = "CLEARED_REFUND_APPROVED";
  rec.wardenSignoff = wardenName.trim();
  rec.clearedAt = new Date().toISOString();
  if (wardenNotes) rec.wardenNotes = wardenNotes.trim();

  // Cryptographic clearance seal
  const hash = crypto
    .createHash("sha256")
    .update(`${rec.id}:${rec.rollNo}:${rec.refundableAmount}:${rec.clearedAt}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  rec.clearanceSeal = `APEX-HOSTEL-CLEAR-${hash}`;

  records[index] = rec;
  saveInspections(records);
  return rec;
}

export function getHostelInventoryAnalytics() {
  const records = getAllInspections();
  const totalAudits = records.length;
  const cleared = records.filter((r) => r.inspectionStatus === "CLEARED_REFUND_APPROVED").length;
  const pending = records.filter((r) => r.inspectionStatus === "MOVE_IN_VERIFIED").length;
  const totalDamagesLevied = records.reduce((sum, r) => sum + r.totalDamageDeductions, 0);
  const totalRefundableApproved = records
    .filter((r) => r.inspectionStatus === "CLEARED_REFUND_APPROVED")
    .reduce((sum, r) => sum + r.refundableAmount, 0);

  return {
    totalAudits,
    cleared,
    pending,
    totalDamagesLevied,
    totalRefundableApproved,
  };
}
