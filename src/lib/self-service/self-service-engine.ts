/**
 * Universal Student & Staff Self-Service Request Engine
 * Centralized service desk for bonafide certificates, medium of instruction letters,
 * detail corrections, parking passes, and institutional letters with SLA tracking.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const SELF_SERVICE_DIR = path.join(process.cwd(), "data", "self_service");
const REQUESTS_FILE = path.join(SELF_SERVICE_DIR, "service_requests.json");

function ensureDirectory() {
  if (!fs.existsSync(SELF_SERVICE_DIR)) {
    fs.mkdirSync(SELF_SERVICE_DIR, { recursive: true });
  }
}

export type SelfServiceRequestType =
  | "BONAFIDE_CERTIFICATE"
  | "MEDIUM_OF_INSTRUCTION"
  | "TRANSCRIPT_EXPEDITE"
  | "TRANSFER_CERTIFICATE"
  | "DETAIL_CORRECTION"
  | "FEE_INSTALLMENT_QUERY"
  | "PARKING_VEHICLE_PASS";

export type SelfServiceStatus =
  | "SUBMITTED"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "REJECTED";

export interface ServiceRequestRecord {
  id: string;
  requestType: SelfServiceRequestType;
  institutionId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  userIdentifier: string; // Roll number or employee ID
  purpose: string;
  urgency: "NORMAL" | "HIGH" | "URGENT";
  slaHours: number;
  status: SelfServiceStatus;
  resolutionRemarks?: string;
  verificationToken: string;
  digitalCertificateDocUrl?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

const DEFAULT_SLA_HOURS: Record<SelfServiceRequestType, number> = {
  BONAFIDE_CERTIFICATE: 24,
  MEDIUM_OF_INSTRUCTION: 48,
  TRANSCRIPT_EXPEDITE: 24,
  TRANSFER_CERTIFICATE: 72,
  DETAIL_CORRECTION: 48,
  FEE_INSTALLMENT_QUERY: 24,
  PARKING_VEHICLE_PASS: 12,
};

const SEED_REQUESTS: ServiceRequestRecord[] = [
  {
    id: "SSR-2026-1001",
    requestType: "BONAFIDE_CERTIFICATE",
    institutionId: "inst-apex-01",
    userId: "usr-stu-01",
    userName: "Alex Mercer",
    userRole: "STUDENT",
    userIdentifier: "CS2026-0042",
    purpose: "State Education Loan Subsidy and Passport Renewal Verification",
    urgency: "NORMAL",
    slaHours: 24,
    status: "COMPLETED",
    resolutionRemarks: "Official Bonafide issued with digital institutional seal.",
    verificationToken: "APEX-BONAFIDE-9921-2026",
    digitalCertificateDocUrl: "/api/documents/download?id=doc-bonafide-mercer",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "SSR-2026-1002",
    requestType: "PARKING_VEHICLE_PASS",
    institutionId: "inst-apex-01",
    userId: "usr-stu-02",
    userName: "Sarah Jenkins",
    userRole: "STUDENT",
    userIdentifier: "CS2026-0089",
    purpose: "Electric Two-Wheeler Campus Gate Entry Decal",
    urgency: "HIGH",
    slaHours: 12,
    status: "PROCESSING",
    resolutionRemarks: "Vehicle registration documents verified by Campus Estate Office.",
    verificationToken: "APEX-PARK-8812-2026",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

class SelfServiceStore {
  private requests: ServiceRequestRecord[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      ensureDirectory();
      if (fs.existsSync(REQUESTS_FILE)) {
        const raw = fs.readFileSync(REQUESTS_FILE, "utf-8");
        this.requests = JSON.parse(raw);
      } else {
        this.requests = [...SEED_REQUESTS];
        this.save();
      }
    } catch (err) {
      logger.error("Failed to load self-service requests", err);
      this.requests = [...SEED_REQUESTS];
    }
  }

  private save() {
    try {
      ensureDirectory();
      fs.writeFileSync(REQUESTS_FILE, JSON.stringify(this.requests, null, 2), "utf-8");
    } catch (err) {
      logger.error("Failed to persist self-service requests", err);
    }
  }

  public getRequests(filters?: {
    userId?: string;
    institutionId?: string;
    status?: SelfServiceStatus;
    type?: SelfServiceRequestType;
  }): ServiceRequestRecord[] {
    let list = [...this.requests];
    if (filters?.userId) {
      list = list.filter((r) => r.userId === filters.userId);
    }
    if (filters?.institutionId) {
      list = list.filter((r) => r.institutionId === filters.institutionId || r.institutionId === "global");
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    if (filters?.type) {
      list = list.filter((r) => r.requestType === filters.type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRequestById(id: string): ServiceRequestRecord | null {
    return this.requests.find((r) => r.id === id) || null;
  }

  public createRequest(data: {
    requestType: SelfServiceRequestType;
    institutionId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    userIdentifier: string;
    purpose: string;
    urgency?: "NORMAL" | "HIGH" | "URGENT";
  }): ServiceRequestRecord {
    const id = `SSR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const urgency = data.urgency || "NORMAL";
    const slaHours = DEFAULT_SLA_HOURS[data.requestType] || 24;

    const hashRaw = `${id}:${data.userId}:${data.requestType}:${Date.now()}`;
    const verificationToken = `APEX-DOC-${crypto.createHash("sha256").update(hashRaw).digest("hex").slice(0, 16).toUpperCase()}`;

    const record: ServiceRequestRecord = {
      id,
      requestType: data.requestType,
      institutionId: data.institutionId || "inst-apex-01",
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      userIdentifier: data.userIdentifier,
      purpose: data.purpose,
      urgency,
      slaHours,
      status: "SUBMITTED",
      verificationToken,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.requests.unshift(record);
    this.save();
    return record;
  }

  public updateRequestStatus(
    id: string,
    status: SelfServiceStatus,
    resolutionRemarks?: string
  ): ServiceRequestRecord | null {
    const target = this.getRequestById(id);
    if (!target) return null;

    target.status = status;
    target.updatedAt = new Date().toISOString();
    if (resolutionRemarks) {
      target.resolutionRemarks = resolutionRemarks;
    }
    if (status === "COMPLETED") {
      target.resolvedAt = new Date().toISOString();
      target.digitalCertificateDocUrl = `/api/documents/download?id=doc-${target.id}`;
    }

    this.save();
    return target;
  }
}

export const selfServiceStore = new SelfServiceStore();
