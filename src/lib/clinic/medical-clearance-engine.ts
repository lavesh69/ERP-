import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface ImmunizationRecord {
  vaccineName: string;
  dosesReceived: number;
  dosesRequired: number;
  lastDoseDate: string;
  compliant: boolean;
  exemptionReason?: string;
}

export type FitnessCategory =
  | "FIT_FOR_ALL"
  | "FIT_HOSTEL_ONLY"
  | "RESTRICTED_SPORTS"
  | "MEDICAL_HOLD";

export interface StudentHealthPassport {
  studentId: string;
  studentName: string;
  rollNo: string;
  department: string;
  bloodGroup: string;
  emergencyContact: string;
  knownAllergies: string[];
  chronicConditions: string[];
  immunizations: ImmunizationRecord[];
  immunizationComplianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "PROVISIONAL";
  fitnessCategory: FitnessCategory;
  medicalClearanceSeal?: string;
  certifiedBy?: string;
  certifiedAt?: string;
  validUntil?: string;
  physicianNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const PASSPORTS_FILE = path.join(DATA_DIR, "clinic-health-passports.json");

export const DEFAULT_HEALTH_SEED: StudentHealthPassport[] = [
  {
    studentId: "STU-2026-001",
    studentName: "Aarav Sharma",
    rollNo: "CS23B042",
    department: "Computer Science",
    bloodGroup: "O+",
    emergencyContact: "+1 (555) 321-9988 (Parent)",
    knownAllergies: ["Penicillin", "Dust Mites"],
    chronicConditions: ["Mild Asthma (Ventolin SOS)"],
    immunizations: [
      { vaccineName: "Hepatitis B", dosesReceived: 3, dosesRequired: 3, lastDoseDate: "2023-04-12", compliant: true },
      { vaccineName: "MMR (Measles, Mumps, Rubella)", dosesReceived: 2, dosesRequired: 2, lastDoseDate: "2021-08-19", compliant: true },
      { vaccineName: "Tdap (Tetanus Booster)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2024-05-10", compliant: true },
      { vaccineName: "Meningococcal (MenACWY)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2023-07-22", compliant: true },
    ],
    immunizationComplianceStatus: "COMPLIANT",
    fitnessCategory: "FIT_FOR_ALL",
    medicalClearanceSeal: "APEX-MED-FIT-SEAL-9A4B72F01C38E619",
    certifiedBy: "Dr. Arvind Swaminathan, MD (Chief Medical Officer)",
    certifiedAt: "2026-01-14T09:00:00.000Z",
    validUntil: "2027-01-14T23:59:59.000Z",
    physicianNotes: "Cleared for varsity badminton and hostel residency. Asthmatic inhaler self-carry authorized.",
  },
  {
    studentId: "STU-2026-002",
    studentName: "Diya Patel",
    rollNo: "AI23B018",
    department: "Artificial Intelligence",
    bloodGroup: "B+",
    emergencyContact: "+1 (555) 441-2090 (Guardian)",
    knownAllergies: ["Peanuts / Tree Nuts (Severe - EpiPen)"],
    chronicConditions: [],
    immunizations: [
      { vaccineName: "Hepatitis B", dosesReceived: 3, dosesRequired: 3, lastDoseDate: "2022-11-05", compliant: true },
      { vaccineName: "MMR (Measles, Mumps, Rubella)", dosesReceived: 2, dosesRequired: 2, lastDoseDate: "2020-03-14", compliant: true },
      { vaccineName: "Tdap (Tetanus Booster)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2024-09-01", compliant: true },
      { vaccineName: "Meningococcal (MenACWY)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2023-08-11", compliant: true },
    ],
    immunizationComplianceStatus: "COMPLIANT",
    fitnessCategory: "FIT_FOR_ALL",
    medicalClearanceSeal: "APEX-MED-FIT-SEAL-8B12E094AA51F028",
    certifiedBy: "Dr. Arvind Swaminathan, MD (Chief Medical Officer)",
    certifiedAt: "2026-01-15T11:30:00.000Z",
    validUntil: "2027-01-15T23:59:59.000Z",
    physicianNotes: "Hostel cafeteria alerted to peanut anaphylaxis protocol. EpiPen auto-injector registered in dorm EMR.",
  },
  {
    studentId: "STU-2026-003",
    studentName: "Rohan Deshmukh",
    rollNo: "ME23B064",
    department: "Mechanical Engineering",
    bloodGroup: "A-",
    emergencyContact: "+1 (555) 789-1122 (Parent)",
    knownAllergies: [],
    chronicConditions: ["Recent Right Knee ACL Reconstruction"],
    immunizations: [
      { vaccineName: "Hepatitis B", dosesReceived: 2, dosesRequired: 3, lastDoseDate: "2025-10-10", compliant: false },
      { vaccineName: "MMR (Measles, Mumps, Rubella)", dosesReceived: 2, dosesRequired: 2, lastDoseDate: "2021-02-18", compliant: true },
      { vaccineName: "Tdap (Tetanus Booster)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2023-06-15", compliant: true },
      { vaccineName: "Meningococcal (MenACWY)", dosesReceived: 0, dosesRequired: 1, lastDoseDate: "N/A", compliant: false },
    ],
    immunizationComplianceStatus: "PROVISIONAL",
    fitnessCategory: "RESTRICTED_SPORTS",
    physicianNotes: "Provisional clearance issued pending Hepatitis B 3rd dose and Meningococcal vaccine before residential check-in. Exempted from high-impact sports.",
  },
  {
    studentId: "STU-2026-004",
    studentName: "Ananya Iyer",
    rollNo: "BT23B009",
    department: "Biotechnology",
    bloodGroup: "AB+",
    emergencyContact: "+1 (555) 662-3344 (Mother)",
    knownAllergies: ["Sulfonamides"],
    chronicConditions: [],
    immunizations: [
      { vaccineName: "Hepatitis B", dosesReceived: 3, dosesRequired: 3, lastDoseDate: "2023-01-10", compliant: true },
      { vaccineName: "MMR (Measles, Mumps, Rubella)", dosesReceived: 2, dosesRequired: 2, lastDoseDate: "2021-05-19", compliant: true },
      { vaccineName: "Tdap (Tetanus Booster)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2025-02-04", compliant: true },
      { vaccineName: "Meningococcal (MenACWY)", dosesReceived: 1, dosesRequired: 1, lastDoseDate: "2024-08-15", compliant: true },
    ],
    immunizationComplianceStatus: "COMPLIANT",
    fitnessCategory: "FIT_FOR_ALL",
    medicalClearanceSeal: "APEX-MED-FIT-SEAL-1109C488F1E772A0",
    certifiedBy: "Dr. Arvind Swaminathan, MD (Chief Medical Officer)",
    certifiedAt: "2026-02-01T14:15:00.000Z",
    validUntil: "2027-02-01T23:59:59.000Z",
    physicianNotes: "Full clearance granted for biotechnology BSL-2 lab courses and varsity rowing team.",
  },
];

function ensurePassportsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PASSPORTS_FILE)) {
    fs.writeFileSync(PASSPORTS_FILE, JSON.stringify(DEFAULT_HEALTH_SEED, null, 2), "utf8");
  }
}

export function getAllHealthPassports(): StudentHealthPassport[] {
  ensurePassportsFile();
  try {
    const raw = fs.readFileSync(PASSPORTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_HEALTH_SEED;
  } catch (err) {
    console.error("Error reading health passports file:", err);
    return DEFAULT_HEALTH_SEED;
  }
}

export function saveHealthPassports(passports: StudentHealthPassport[]): void {
  ensurePassportsFile();
  fs.writeFileSync(PASSPORTS_FILE, JSON.stringify(passports, null, 2), "utf8");
}

export function updateImmunization(
  studentId: string,
  vaccineName: string,
  doseDate: string
): StudentHealthPassport {
  const passports = getAllHealthPassports();
  const index = passports.findIndex((p) => p.studentId === studentId);
  if (index === -1) {
    throw new Error(`Student ${studentId} not found in health registry`);
  }

  const p = passports[index];
  const immIndex = p.immunizations.findIndex(
    (i) => i.vaccineName.toLowerCase() === vaccineName.toLowerCase()
  );

  if (immIndex >= 0) {
    p.immunizations[immIndex].dosesReceived += 1;
    p.immunizations[immIndex].lastDoseDate = doseDate;
    p.immunizations[immIndex].compliant =
      p.immunizations[immIndex].dosesReceived >= p.immunizations[immIndex].dosesRequired;
  } else {
    p.immunizations.push({
      vaccineName,
      dosesReceived: 1,
      dosesRequired: 1,
      lastDoseDate: doseDate,
      compliant: true,
    });
  }

  // Recalculate global immunization compliance
  const allCompliant = p.immunizations.every((i) => i.compliant);
  p.immunizationComplianceStatus = allCompliant ? "COMPLIANT" : "PROVISIONAL";

  passports[index] = p;
  saveHealthPassports(passports);
  return p;
}

export function certifyMedicalFitness(
  studentId: string,
  officerName: string,
  fitnessCategory: FitnessCategory,
  physicianNotes?: string
): StudentHealthPassport {
  const passports = getAllHealthPassports();
  const index = passports.findIndex((p) => p.studentId === studentId);
  if (index === -1) {
    throw new Error(`Student ${studentId} not found in health registry`);
  }

  const p = passports[index];
  p.fitnessCategory = fitnessCategory;
  p.certifiedBy = officerName.trim();
  p.certifiedAt = new Date().toISOString();
  if (physicianNotes) p.physicianNotes = physicianNotes.trim();

  const now = new Date();
  const expiry = new Date();
  expiry.setFullYear(now.getFullYear() + 1);
  p.validUntil = expiry.toISOString();

  // Cryptographic clearance seal
  const hash = crypto
    .createHash("sha256")
    .update(`${p.studentId}:${p.rollNo}:${fitnessCategory}:${now.toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  p.medicalClearanceSeal = `APEX-MED-FIT-SEAL-${hash}`;

  passports[index] = p;
  saveHealthPassports(passports);
  return p;
}

export function getHealthClearanceAnalytics() {
  const passports = getAllHealthPassports();
  const total = passports.length;
  const compliant = passports.filter((p) => p.immunizationComplianceStatus === "COMPLIANT").length;
  const certified = passports.filter((p) => !!p.medicalClearanceSeal).length;
  const holds = passports.filter((p) => p.fitnessCategory === "MEDICAL_HOLD").length;
  const allergyCount = passports.filter((p) => p.knownAllergies.length > 0).length;
  const complianceRate = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return {
    total,
    compliant,
    complianceRate,
    certified,
    holds,
    allergyCount,
  };
}
