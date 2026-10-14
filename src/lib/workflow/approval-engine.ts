/**
 * Unified Institutional Workflow & Multi-Tier Approval Engine
 * Enterprise clearinghouse for academic, financial, administrative, and operational approvals.
 * Conforms to Ellucian Banner, PowerSchool, and Fedena workflow governance standards.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const WORKFLOW_DIR = path.join(process.cwd(), "data", "workflows");
const WORKFLOW_FILE = path.join(WORKFLOW_DIR, "workflow_items.json");

function ensureDirectory() {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    fs.mkdirSync(WORKFLOW_DIR, { recursive: true });
  }
}

export type InstitutionalWorkflowType =
  | "ADMISSION_APPROVAL"
  | "FEE_WAIVER"
  | "ATTENDANCE_CONDONATION"
  | "GRADE_CORRECTION"
  | "STAFF_LEAVE"
  | "DOCUMENT_VERIFICATION"
  | "PURCHASE_REQUISITION"
  | "STUDENT_PETITION";

export type WorkflowStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface ApprovalStepLog {
  level: number;
  approverUserId: string;
  approverRole: UserRole;
  approverName: string;
  action: "APPROVED" | "REJECTED";
  remarks: string;
  timestamp: string;
  signatureHash: string;
}

export interface WorkflowItem {
  id: string;
  workflowType: InstitutionalWorkflowType;
  institutionId: string;
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  entityId: string;
  title: string;
  description: string;
  metadata: Record<string, any>;
  currentLevel: number;
  requiredLevels: number;
  authorizedRolesPerLevel: Record<number, UserRole[]>;
  status: WorkflowStatus;
  auditTrail: ApprovalStepLog[];
  completionSeal?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_WORKFLOW_RULES: Record<InstitutionalWorkflowType, { requiredLevels: number; authorizedRoles: Record<number, UserRole[]> }> = {
  ADMISSION_APPROVAL: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["HOD", "FACULTY", "INSTITUTION_ADMIN"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  FEE_WAIVER: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["ACCOUNTANT", "INSTITUTION_ADMIN"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  ATTENDANCE_CONDONATION: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["CLASS_TEACHER", "HOD"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  GRADE_CORRECTION: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["HOD", "EXAMINATION_CONTROLLER"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  STAFF_LEAVE: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["HOD", "HR_STAFF"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  DOCUMENT_VERIFICATION: {
    requiredLevels: 1,
    authorizedRoles: {
      1: ["INSTITUTION_ADMIN", "PRINCIPAL", "SUPER_ADMIN", "HOD", "EXAMINATION_CONTROLLER"],
    },
  },
  PURCHASE_REQUISITION: {
    requiredLevels: 2,
    authorizedRoles: {
      1: ["HOD", "ACCOUNTANT"],
      2: ["PRINCIPAL", "SUPER_ADMIN"],
    },
  },
  STUDENT_PETITION: {
    requiredLevels: 1,
    authorizedRoles: {
      1: ["CLASS_TEACHER", "HOD", "PRINCIPAL", "SUPER_ADMIN"],
    },
  },
};

const SEED_WORKFLOWS: WorkflowItem[] = [
  {
    id: "WF-REQ-2026-0001",
    workflowType: "FEE_WAIVER",
    institutionId: "inst-apex-01",
    requesterId: "usr-stu-01",
    requesterName: "Alex Mercer",
    requesterRole: "STUDENT",
    entityId: "fee-sem5-mercer",
    title: "National Merit Fee Concession Request (50% Tuition Waiver)",
    description: "Applicant awarded National Cyber Olympiad Gold Medal; requesting authorized 50% tuition scholarship fee concession.",
    metadata: {
      totalOriginalFee: 4500,
      concessionRequested: 2250,
      achievementRef: "NCO-GOLD-2026",
    },
    currentLevel: 1,
    requiredLevels: 2,
    authorizedRolesPerLevel: DEFAULT_WORKFLOW_RULES.FEE_WAIVER.authorizedRoles,
    status: "PENDING",
    auditTrail: [],
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
  },
  {
    id: "WF-REQ-2026-0002",
    workflowType: "ATTENDANCE_CONDONATION",
    institutionId: "inst-apex-01",
    requesterId: "usr-stu-02",
    requesterName: "Sarah Jenkins",
    requesterRole: "STUDENT",
    entityId: "cs402-attendance-jenkins",
    title: "Hospitalization Medical Attendance Condonation (CS-402)",
    description: "Hospitalized for 10 days due to acute viral pneumonia. Requesting statutory medical waiver to restore 75% examination eligibility.",
    metadata: {
      courseCode: "CS-402",
      lecturesMissed: 8,
      medicalCertId: "HOSP-MAX-9921",
    },
    currentLevel: 1,
    requiredLevels: 2,
    authorizedRolesPerLevel: DEFAULT_WORKFLOW_RULES.ATTENDANCE_CONDONATION.authorizedRoles,
    status: "PENDING",
    auditTrail: [],
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
];

class UnifiedApprovalEngineStore {
  private workflows: WorkflowItem[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      ensureDirectory();
      if (fs.existsSync(WORKFLOW_FILE)) {
        const raw = fs.readFileSync(WORKFLOW_FILE, "utf-8");
        this.workflows = JSON.parse(raw);
      } else {
        this.workflows = [...SEED_WORKFLOWS];
        this.save();
      }
    } catch (err) {
      logger.error("Failed to load workflow items, using defaults", err);
      this.workflows = [...SEED_WORKFLOWS];
    }
  }

  private save() {
    try {
      ensureDirectory();
      fs.writeFileSync(WORKFLOW_FILE, JSON.stringify(this.workflows, null, 2), "utf-8");
    } catch (err) {
      logger.error("Failed to persist workflow items", err);
    }
  }

  public getWorkflows(filters?: {
    institutionId?: string;
    requesterId?: string;
    workflowType?: InstitutionalWorkflowType;
    status?: WorkflowStatus;
    canApproveRole?: UserRole;
  }): WorkflowItem[] {
    let result = [...this.workflows];

    if (filters?.institutionId) {
      result = result.filter((w) => w.institutionId === filters.institutionId || w.institutionId === "global");
    }
    if (filters?.requesterId) {
      result = result.filter((w) => w.requesterId === filters.requesterId);
    }
    if (filters?.workflowType) {
      result = result.filter((w) => w.workflowType === filters.workflowType);
    }
    if (filters?.status) {
      result = result.filter((w) => w.status === filters.status);
    }
    if (filters?.canApproveRole) {
      result = result.filter((w) => {
        if (w.status !== "PENDING") return false;
        const allowedRoles = w.authorizedRolesPerLevel[w.currentLevel] || [];
        return allowedRoles.includes(filters.canApproveRole!) || filters.canApproveRole === "SUPER_ADMIN";
      });
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getWorkflowById(id: string): WorkflowItem | null {
    return this.workflows.find((w) => w.id === id) || null;
  }

  public createWorkflowItem(data: {
    workflowType: InstitutionalWorkflowType;
    institutionId: string;
    requesterId: string;
    requesterName: string;
    requesterRole: UserRole;
    entityId: string;
    title: string;
    description: string;
    metadata?: Record<string, any>;
  }): WorkflowItem {
    const rules = DEFAULT_WORKFLOW_RULES[data.workflowType];
    const id = `WF-REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newItem: WorkflowItem = {
      id,
      workflowType: data.workflowType,
      institutionId: data.institutionId || "inst-apex-01",
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      requesterRole: data.requesterRole,
      entityId: data.entityId,
      title: data.title,
      description: data.description,
      metadata: data.metadata || {},
      currentLevel: 1,
      requiredLevels: rules.requiredLevels,
      authorizedRolesPerLevel: rules.authorizedRoles,
      status: "PENDING",
      auditTrail: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.unshift(newItem);
    this.save();
    logger.info("New institutional workflow requisition initiated", { id, type: data.workflowType });
    return newItem;
  }

  public processDecision(
    workflowId: string,
    approver: {
      userId: string;
      role: UserRole;
      name: string;
    },
    decision: "APPROVE" | "REJECT",
    remarks: string
  ): { success: boolean; error?: string; workflow?: WorkflowItem } {
    const item = this.getWorkflowById(workflowId);
    if (!item) {
      return { success: false, error: "Workflow requisition not found" };
    }

    if (item.status !== "PENDING") {
      return { success: false, error: `Cannot decide workflow already in ${item.status} state` };
    }

    const currentAllowedRoles = item.authorizedRolesPerLevel[item.currentLevel] || [];
    const isAuthorized = currentAllowedRoles.includes(approver.role) || approver.role === "SUPER_ADMIN";

    if (!isAuthorized) {
      return {
        success: false,
        error: `Forbidden: Role ${approver.role} is not authorized to sign off Level ${item.currentLevel} for ${item.workflowType}`,
      };
    }

    const stepPayload = `${item.id}:${item.currentLevel}:${approver.userId}:${decision}:${remarks}:${new Date().toISOString()}`;
    const signatureHash = crypto.createHash("sha256").update(stepPayload).digest("hex").slice(0, 24);

    const stepLog: ApprovalStepLog = {
      level: item.currentLevel,
      approverUserId: approver.userId,
      approverRole: approver.role,
      approverName: approver.name,
      action: decision === "APPROVE" ? "APPROVED" : "REJECTED",
      remarks: remarks || `Level ${item.currentLevel} ${decision === "APPROVE" ? "endorsement" : "refusal"} recorded.`,
      timestamp: new Date().toISOString(),
      signatureHash,
    };

    item.auditTrail.push(stepLog);
    item.updatedAt = new Date().toISOString();

    if (decision === "REJECT") {
      item.status = "REJECTED";
      item.completionSeal = `REJECTED-${signatureHash}`;
    } else {
      if (item.currentLevel < item.requiredLevels) {
        // Escalate to next approval tier
        item.currentLevel += 1;
      } else {
        // Fully approved across all tiers
        item.status = "APPROVED";
        const finalAuditString = `${item.id}:${item.auditTrail.map((s) => s.signatureHash).join("|")}`;
        item.completionSeal = `APPROVED-SEAL-${crypto.createHash("sha256").update(finalAuditString).digest("hex").slice(0, 32).toUpperCase()}`;
      }
    }

    this.save();
    logger.info("Workflow decision processed", {
      id: item.id,
      decision,
      newStatus: item.status,
      currentLevel: item.currentLevel,
    });

    return { success: true, workflow: item };
  }
}

export const approvalEngine = new UnifiedApprovalEngineStore();
