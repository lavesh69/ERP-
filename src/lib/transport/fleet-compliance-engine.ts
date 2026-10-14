import fs from "fs";
import path from "path";
import crypto from "crypto";

export type ComplianceStatus =
  | "FULLY_COMPLIANT_FIT"
  | "RENEWAL_DUE_30_DAYS"
  | "GROUNDED_NON_COMPLIANT";

export interface VehicleComplianceRecord {
  vehicleId: string;
  registrationNumber: string;
  busNumber: string;
  seatingCapacity: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  driverMedicalFitnessValid: boolean;
  fitnessCertificateNumber: string;
  fitnessExpiryDate: string;
  pucCertificateNumber: string;
  pucExpiryDate: string;
  insurancePolicyNumber: string;
  insuranceExpiryDate: string;
  speedGovernorCertified: boolean;
  ais140GpsCompliant: boolean;
  cctvInstalled: boolean;
  firstAidKitInspected: boolean;
  complianceStatus: ComplianceStatus;
  complianceSeal?: string;
  certifiedBy?: string;
  certifiedAt?: string;
  validUntil?: string;
  safetyOfficerNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const COMPLIANCE_FILE = path.join(DATA_DIR, "fleet-safety-compliance.json");

export const DEFAULT_COMPLIANCE_SEED: VehicleComplianceRecord[] = [
  {
    vehicleId: "BUS-01",
    registrationNumber: "MA-01-AX-4820",
    busNumber: "Apex Express #01",
    seatingCapacity: 52,
    driverName: "Robert Johnson",
    driverPhone: "+1 (555) 019-2831",
    driverLicenseNumber: "DL-COMM-MA-881902",
    driverLicenseExpiry: "2028-09-14",
    driverMedicalFitnessValid: true,
    fitnessCertificateNumber: "FC-RTO-2025-90112",
    fitnessExpiryDate: "2027-11-30",
    pucCertificateNumber: "PUC-EMISS-8819",
    pucExpiryDate: "2027-08-15",
    insurancePolicyNumber: "POL-COMM-CHUBB-99218",
    insuranceExpiryDate: "2027-12-31",
    speedGovernorCertified: true,
    ais140GpsCompliant: true,
    cctvInstalled: true,
    firstAidKitInspected: true,
    complianceStatus: "FULLY_COMPLIANT_FIT",
    complianceSeal: "APEX-BUS-FIT-SEAL-77C10B2A99D41F80",
    certifiedBy: "Transport Safety Director Major K. S. Rao",
    certifiedAt: "2026-01-10T10:00:00.000Z",
    validUntil: "2027-11-30T23:59:59.000Z",
    safetyOfficerNotes: "Complete roadworthiness audit cleared. Speed governor calibrated to 40 km/h school zone limit.",
  },
  {
    vehicleId: "BUS-02",
    registrationNumber: "MA-01-AX-4821",
    busNumber: "Apex Metro Shuttle #02",
    seatingCapacity: 45,
    driverName: "Michael Chang",
    driverPhone: "+1 (555) 019-2832",
    driverLicenseNumber: "DL-COMM-MA-774109",
    driverLicenseExpiry: "2028-10-20",
    driverMedicalFitnessValid: true,
    fitnessCertificateNumber: "FC-RTO-2025-90113",
    fitnessExpiryDate: "2027-10-15",
    pucCertificateNumber: "PUC-EMISS-8820",
    pucExpiryDate: "2027-07-10",
    insurancePolicyNumber: "POL-COMM-CHUBB-99219",
    insuranceExpiryDate: "2027-12-31",
    speedGovernorCertified: true,
    ais140GpsCompliant: true,
    cctvInstalled: true,
    firstAidKitInspected: true,
    complianceStatus: "FULLY_COMPLIANT_FIT",
    complianceSeal: "APEX-BUS-FIT-SEAL-88D21A3B00E52C91",
    certifiedBy: "Transport Safety Director Major K. S. Rao",
    certifiedAt: "2026-01-12T11:30:00.000Z",
    validUntil: "2027-10-15T23:59:59.000Z",
    safetyOfficerNotes: "Zero defects noted during chassis and brake dyno testing. Cleared for inter-campus rapid transit.",
  },
  {
    vehicleId: "BUS-03",
    registrationNumber: "MA-01-AX-4822",
    busNumber: "Apex Campus Feeder #03",
    seatingCapacity: 32,
    driverName: "David Miller",
    driverPhone: "+1 (555) 019-2833",
    driverLicenseNumber: "DL-COMM-MA-665201",
    driverLicenseExpiry: "2028-04-10",
    driverMedicalFitnessValid: true,
    fitnessCertificateNumber: "FC-RTO-2025-90114",
    fitnessExpiryDate: "2026-10-25",
    pucCertificateNumber: "PUC-EMISS-8821",
    pucExpiryDate: "2026-10-28",
    insurancePolicyNumber: "POL-COMM-CHUBB-99220",
    insuranceExpiryDate: "2027-09-30",
    speedGovernorCertified: true,
    ais140GpsCompliant: true,
    cctvInstalled: true,
    firstAidKitInspected: true,
    complianceStatus: "RENEWAL_DUE_30_DAYS",
    complianceSeal: "APEX-BUS-FIT-SEAL-11A04F5E66B99D20",
    certifiedBy: "Transport Safety Director Major K. S. Rao",
    certifiedAt: "2025-10-15T09:00:00.000Z",
    validUntil: "2026-10-25T23:59:59.000Z",
    safetyOfficerNotes: "Fitness certificate and PUC due for mandatory annual renewal within 30 days. RTO inspection scheduled.",
  },
  {
    vehicleId: "BUS-04",
    registrationNumber: "MA-01-AX-4823",
    busNumber: "Apex Tech Van #04",
    seatingCapacity: 24,
    driverName: "Sanjay Patel",
    driverPhone: "+1 (555) 019-2834",
    driverLicenseNumber: "DL-COMM-MA-554100",
    driverLicenseExpiry: "2025-12-30",
    driverMedicalFitnessValid: false,
    fitnessCertificateNumber: "FC-RTO-2024-88019",
    fitnessExpiryDate: "2025-11-15",
    pucCertificateNumber: "PUC-EMISS-7719",
    pucExpiryDate: "2025-12-01",
    insurancePolicyNumber: "POL-COMM-CHUBB-99221",
    insuranceExpiryDate: "2026-06-30",
    speedGovernorCertified: false,
    ais140GpsCompliant: true,
    cctvInstalled: false,
    firstAidKitInspected: false,
    complianceStatus: "GROUNDED_NON_COMPLIANT",
    safetyOfficerNotes: "GROUNDED: Expired RTO Fitness Certificate and missing speed governor recalibration. Strict operational lock in place.",
  },
];

function ensureComplianceFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMPLIANCE_FILE)) {
    fs.writeFileSync(COMPLIANCE_FILE, JSON.stringify(DEFAULT_COMPLIANCE_SEED, null, 2), "utf8");
  }
}

export function getAllComplianceRecords(): VehicleComplianceRecord[] {
  ensureComplianceFile();
  try {
    const raw = fs.readFileSync(COMPLIANCE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_COMPLIANCE_SEED;
  } catch (err) {
    console.error("Error reading fleet compliance file:", err);
    return DEFAULT_COMPLIANCE_SEED;
  }
}

export function saveComplianceRecords(records: VehicleComplianceRecord[]): void {
  ensureComplianceFile();
  fs.writeFileSync(COMPLIANCE_FILE, JSON.stringify(records, null, 2), "utf8");
}

export function inspectAndCertifyRoadworthiness(
  vehicleId: string,
  officerName: string,
  inspectionNotes?: string
): VehicleComplianceRecord {
  const records = getAllComplianceRecords();
  const index = records.findIndex((r) => r.vehicleId === vehicleId);
  if (index === -1) {
    throw new Error(`Vehicle ${vehicleId} not found in fleet compliance registry`);
  }

  const rec = records[index];
  const now = new Date();
  const fcDate = new Date(rec.fitnessExpiryDate);
  const pucDate = new Date(rec.pucExpiryDate);
  const dlDate = new Date(rec.driverLicenseExpiry);

  const isFcExpired = fcDate < now;
  const isPucExpired = pucDate < now;
  const isDlExpired = dlDate < now;

  // Upon physical officer inspection and roadworthiness certification:
  rec.speedGovernorCertified = true;
  rec.driverMedicalFitnessValid = true;
  rec.ais140GpsCompliant = true;
  rec.cctvInstalled = true;
  rec.firstAidKitInspected = true;

  const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const oneYearAhead = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  if (isFcExpired || fcDate < thirtyDaysAhead) rec.fitnessExpiryDate = oneYearAhead;
  if (isPucExpired || pucDate < thirtyDaysAhead) rec.pucExpiryDate = oneYearAhead;
  if (isDlExpired) rec.driverLicenseExpiry = oneYearAhead;

  rec.complianceStatus = "FULLY_COMPLIANT_FIT";

  // Cryptographic seal
  const hash = crypto
    .createHash("sha256")
    .update(`${rec.vehicleId}:${rec.registrationNumber}:${rec.fitnessCertificateNumber}:${now.toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  rec.complianceSeal = `APEX-BUS-FIT-SEAL-${hash}`;
  rec.certifiedBy = officerName.trim();
  rec.certifiedAt = now.toISOString();
  rec.validUntil = rec.fitnessExpiryDate;
  if (inspectionNotes) rec.safetyOfficerNotes = inspectionNotes.trim();

  records[index] = rec;
  saveComplianceRecords(records);
  return rec;
}

export function updateComplianceCertificates(
  vehicleId: string,
  updates: Partial<VehicleComplianceRecord>
): VehicleComplianceRecord {
  const records = getAllComplianceRecords();
  const index = records.findIndex((r) => r.vehicleId === vehicleId);
  if (index === -1) {
    throw new Error(`Vehicle ${vehicleId} not found`);
  }

  records[index] = { ...records[index], ...updates };
  saveComplianceRecords(records);
  return records[index];
}

export function getFleetComplianceAnalytics() {
  const records = getAllComplianceRecords();
  const total = records.length;
  const fullyCompliant = records.filter((r) => r.complianceStatus === "FULLY_COMPLIANT_FIT").length;
  const renewalDue = records.filter((r) => r.complianceStatus === "RENEWAL_DUE_30_DAYS").length;
  const grounded = records.filter((r) => r.complianceStatus === "GROUNDED_NON_COMPLIANT").length;
  const complianceRate = total > 0 ? Math.round((fullyCompliant / total) * 100) : 0;

  return {
    total,
    fullyCompliant,
    renewalDue,
    grounded,
    complianceRate,
  };
}
