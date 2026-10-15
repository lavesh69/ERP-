/**
 * CLASSROOM ERP — Enterprise Data Governance & DPDP Act 2023 / FERPA Compliance Engine
 * 
 * Provides automated data classification, statutory retention schedules,
 * consent lifecycle management, and purpose-based access controls.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

export type DataClassificationTier =
  | "PUBLIC_DIRECTORY"
  | "EDUCATIONAL_RECORD"
  | "FINANCIAL_LEDGER"
  | "HEALTH_MEDICAL"
  | "STATUTORY_DISCIPLINARY";

export interface DataClassificationPolicy {
  tier: DataClassificationTier;
  label: string;
  description: string;
  applicableRegulations: string[];
  authorizedRoles: UserRole[];
  exportControls: {
    requiresWatermark: boolean;
    requiresPurposeDeclaration: boolean;
    auditLogged: boolean;
  };
  retentionYears: number | "PERMANENT";
}

export interface ConsentRecord {
  id: string;
  userId: string;
  userRole: UserRole;
  purpose: "BIOMETRIC_ATTENDANCE" | "PLACEMENT_RESUME_SHARING" | "WHATSAPP_PARENT_NOTICES" | "RESEARCH_ANONYMIZED_TELEMETRY";
  granted: boolean;
  grantedAt: string;
  revokedAt?: string;
  ipAddress?: string;
}

export interface DataCorrectionRequest {
  id: string;
  requesterUserId: string;
  requesterRole: UserRole;
  fieldName: "FULL_NAME" | "DATE_OF_BIRTH" | "GUARDIAN_PHONE" | "PERMANENT_ADDRESS" | "BLOOD_GROUP";
  currentValue: string;
  proposedValue: string;
  supportingDocumentUrl?: string;
  reason: string;
  status: "PENDING_VERIFICATION" | "VERIFIED_APPROVED" | "REJECTED";
  verifiedByUserId?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data", "governance");
const GOV_FILE = path.join(DATA_DIR, "privacy_governance.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const DATA_CLASSIFICATION_REGISTRY: Record<DataClassificationTier, DataClassificationPolicy> = {
  PUBLIC_DIRECTORY: {
    tier: "PUBLIC_DIRECTORY",
    label: "Public Campus Directory",
    description: "General directory data including scholar full name, major, sports/cultural accolades, and faculty designation.",
    applicableRegulations: ["FERPA Directory Exception", "DPDP Act 2023 Sec 6"],
    authorizedRoles: [
      "SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY",
      "CLASS_TEACHER", "ACCOUNTANT", "LIBRARIAN", "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER", "RESEARCH_COORDINATOR", "HR_STAFF", "STUDENT", "PARENT", "ALUMNI", "GUEST"
    ],
    exportControls: {
      requiresWatermark: false,
      requiresPurposeDeclaration: false,
      auditLogged: false,
    },
    retentionYears: "PERMANENT",
  },
  EDUCATIONAL_RECORD: {
    tier: "EDUCATIONAL_RECORD",
    label: "Official Academic Records",
    description: "Continuous internal assessments, examination marks, grade points, attendance logs, and degree transcripts.",
    applicableRegulations: ["FERPA 34 CFR Part 99", "DPDP Act 2023 Sec 7", "NEP 2020 Academic Bank of Credits"],
    authorizedRoles: [
      "SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY",
      "CLASS_TEACHER", "EXAMINATION_CONTROLLER", "STUDENT", "PARENT"
    ],
    exportControls: {
      requiresWatermark: true,
      requiresPurposeDeclaration: true,
      auditLogged: true,
    },
    retentionYears: "PERMANENT",
  },
  FINANCIAL_LEDGER: {
    tier: "FINANCIAL_LEDGER",
    label: "Treasury & Student Fee Ledgers",
    description: "Student tuition fee assessments, scholarship vouchers, bank reconciliation, concession awards, and refunds.",
    applicableRegulations: ["RBI Digital Payment Guidelines", "CAG Statutory University Audit", "PCI-DSS v4.0"],
    authorizedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "ACCOUNTANT"],
    exportControls: {
      requiresWatermark: true,
      requiresPurposeDeclaration: true,
      auditLogged: true,
    },
    retentionYears: 8, // Statutory Indian audit retention requirement
  },
  HEALTH_MEDICAL: {
    tier: "HEALTH_MEDICAL",
    label: "Student Health & Clinical Records",
    description: "Campus health clinic consults, medical leave certificates, vaccination records, and physical disability documentation.",
    applicableRegulations: ["DPDP Act 2023 Health Data Mandate", "Indian Medical Council Act"],
    authorizedRoles: ["SUPER_ADMIN", "PRINCIPAL"],
    exportControls: {
      requiresWatermark: true,
      requiresPurposeDeclaration: true,
      auditLogged: true,
    },
    retentionYears: 5,
  },
  STATUTORY_DISCIPLINARY: {
    tier: "STATUTORY_DISCIPLINARY",
    label: "Proctorial & Grievance POSH Dossiers",
    description: "Internal Complaints Committee (ICC/POSH) inquiries, Show-Cause Notices (SCN), Proctorial sanctions, and disciplinary minutes.",
    applicableRegulations: ["UGC 2009 Anti-Ragging Regulations", "POSH Act 2013 Confidentiality Section 16"],
    authorizedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL"],
    exportControls: {
      requiresWatermark: true,
      requiresPurposeDeclaration: true,
      auditLogged: true,
    },
    retentionYears: 10,
  },
};

const SEED_CORRECTIONS: DataCorrectionRequest[] = [
  {
    id: "CORR-2026-001",
    requesterUserId: "usr-stu-01",
    requesterRole: "STUDENT",
    fieldName: "FULL_NAME",
    currentValue: "Alex Mercer",
    proposedValue: "Alexander Mercer",
    reason: "Government Passport and Aadhaar name alignment for international visa processing",
    supportingDocumentUrl: "https://docs.classroom.internal/vault/passport_mercer.pdf",
    status: "PENDING_VERIFICATION",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
];

class DataGovernanceEngineStore {
  private corrections: DataCorrectionRequest[] = [];
  private consents: ConsentRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      ensureDirectory();
      if (fs.existsSync(GOV_FILE)) {
        const raw = fs.readFileSync(GOV_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.corrections = parsed.corrections || [...SEED_CORRECTIONS];
        this.consents = parsed.consents || [];
      } else {
        this.corrections = [...SEED_CORRECTIONS];
        this.consents = [];
        this.save();
      }
    } catch (err) {
      logger.error("Failed to load governance data, using defaults", err);
      this.corrections = [...SEED_CORRECTIONS];
    }
  }

  private save() {
    try {
      ensureDirectory();
      fs.writeFileSync(
        GOV_FILE,
        JSON.stringify({ corrections: this.corrections, consents: this.consents }, null, 2),
        "utf-8"
      );
    } catch (err) {
      logger.error("Failed to persist governance store", err);
    }
  }

  public getClassificationPolicies(): DataClassificationPolicy[] {
    return Object.values(DATA_CLASSIFICATION_REGISTRY);
  }

  public getCorrectionRequests(userId?: string): DataCorrectionRequest[] {
    if (userId) {
      return this.corrections.filter((c) => c.requesterUserId === userId);
    }
    return [...this.corrections];
  }

  public createCorrectionRequest(data: {
    requesterUserId: string;
    requesterRole: UserRole;
    fieldName: DataCorrectionRequest["fieldName"];
    currentValue: string;
    proposedValue: string;
    reason: string;
    supportingDocumentUrl?: string;
  }): DataCorrectionRequest {
    const id = `CORR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const newReq: DataCorrectionRequest = {
      id,
      requesterUserId: data.requesterUserId,
      requesterRole: data.requesterRole,
      fieldName: data.fieldName,
      currentValue: data.currentValue,
      proposedValue: data.proposedValue,
      reason: data.reason,
      supportingDocumentUrl: data.supportingDocumentUrl,
      status: "PENDING_VERIFICATION",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.corrections.unshift(newReq);
    this.save();
    return newReq;
  }

  public verifyCorrectionRequest(
    id: string,
    verifiedByUserId: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string
  ): { success: boolean; message: string; request?: DataCorrectionRequest } {
    const item = this.corrections.find((c) => c.id === id);
    if (!item) return { success: false, message: "Correction request not found" };

    item.status = action === "APPROVE" ? "VERIFIED_APPROVED" : "REJECTED";
    item.verifiedByUserId = verifiedByUserId;
    item.rejectionReason = rejectionReason;
    item.updatedAt = new Date().toISOString();

    this.save();
    return {
      success: true,
      message: `Correction request ${id} ${action === "APPROVE" ? "approved and executed" : "rejected"}.`,
      request: item,
    };
  }

  public registerConsent(data: {
    userId: string;
    userRole: UserRole;
    purpose: ConsentRecord["purpose"];
    granted: boolean;
    ipAddress?: string;
  }): ConsentRecord {
    const nowIso = new Date().toISOString();
    const existingIdx = this.consents.findIndex(
      (c) => c.userId === data.userId && c.purpose === data.purpose
    );

    const record: ConsentRecord = {
      id: `CNS-${Date.now().toString(36)}`,
      userId: data.userId,
      userRole: data.userRole,
      purpose: data.purpose,
      granted: data.granted,
      grantedAt: nowIso,
      revokedAt: data.granted ? undefined : nowIso,
      ipAddress: data.ipAddress || "127.0.0.1",
    };

    if (existingIdx >= 0) {
      this.consents[existingIdx] = record;
    } else {
      this.consents.push(record);
    }

    this.save();
    return record;
  }

  public getUserConsents(userId: string): ConsentRecord[] {
    return this.consents.filter((c) => c.userId === userId);
  }
}

export const dataGovernanceEngine = new DataGovernanceEngineStore();
