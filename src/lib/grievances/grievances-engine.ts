/**
 * Enterprise Grievance Redressal & Statutory Helpdesk Engine
 * Implements UGC / AICTE compliant ombudsman workflows, SLA tracking, and whistleblower safeguards.
 */

export type GrievanceCategory =
  | "ANTI_RAGGING"
  | "INTERNAL_COMPLAINTS_ICC"
  | "ACADEMIC_EVALUATION"
  | "CAMPUS_INFRASTRUCTURE"
  | "FINANCIAL_SCHOLARSHIP"
  | "ETHICS_WHISTLEBLOWER";

export type GrievanceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL_URGENT";

export type GrievanceStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMMITTEE_ASSIGNED"
  | "HEARING_SCHEDULED"
  | "RESOLVED"
  | "DISMISSED";

export interface GrievanceRecord {
  id: string;
  grievanceTicketNo: string;
  title: string;
  description: string;
  category: GrievanceCategory;
  severity: GrievanceSeverity;
  status: GrievanceStatus;
  isAnonymous: boolean;
  grievantRole: string;
  grievantName?: string;
  grievantRollOrId?: string;
  respondentName?: string;
  committeeName: string;
  hearingDate?: string;
  actionTakenReport?: string;
  slaTargetDays: number;
  daysRemaining: number;
  isSlaBreached: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface StatutoryCommittee {
  id: string;
  name: string;
  code: string;
  mandate: string;
  headName: string;
  headDesignation: string;
  membersCount: number;
  emergencyHelpline: string;
  officialEmail: string;
}

/**
 * Maps statutory grievance category to regulatory committee and SLA envelope
 */
export function assignStatutoryCommittee(category: GrievanceCategory): { committeeName: string; defaultDays: number } {
  switch (category) {
    case "ANTI_RAGGING":
      return { committeeName: "Apex Anti-Ragging Monitoring Squad (AICTE Mandate)", defaultDays: 2 };
    case "INTERNAL_COMPLAINTS_ICC":
      return { committeeName: "Internal Complaints Committee (ICC / POSH Cell)", defaultDays: 5 };
    case "ACADEMIC_EVALUATION":
      return { committeeName: "Academic Ombudsman & Exam Redressal Cell", defaultDays: 7 };
    case "CAMPUS_INFRASTRUCTURE":
      return { committeeName: "Campus Estate & Residential Welfare Board", defaultDays: 5 };
    case "FINANCIAL_SCHOLARSHIP":
      return { committeeName: "Standing Bursar & Fee Grievance Council", defaultDays: 7 };
    case "ETHICS_WHISTLEBLOWER":
      return { committeeName: "Independent Ethics & Vigilance Commission", defaultDays: 3 };
    default:
      return { committeeName: "Dean of Student Affairs Office", defaultDays: 7 };
  }
}

/**
 * Computes statutory SLA countdown and breach flags
 */
export function computeSlaStatus(createdAt: string, targetDays: number) {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const daysElapsed = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, targetDays - daysElapsed);
  const isBreached = daysElapsed > targetDays;

  return {
    targetDays,
    daysElapsed,
    daysRemaining,
    isBreached,
  };
}

/**
 * Validates grievance submission inputs with support for anonymous whistleblowers
 */
export function validateGrievanceSubmission(g: Partial<GrievanceRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!g.title || g.title.trim().length < 5) {
    errors.push("Grievance subject/title must be at least 5 characters.");
  }
  if (!g.description || g.description.trim().length < 15) {
    errors.push("Detailed grievance narrative must be provided (minimum 15 characters).");
  }
  if (!g.category) {
    errors.push("Statutory grievance classification category is required.");
  }
  if (!g.isAnonymous && (!g.grievantName || g.grievantName.trim().length === 0)) {
    errors.push("Grievant name is required unless submitting anonymously.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Computes statutory disposal rate percentage
 */
export function calculateDisposalRate(totalGrievances: number, resolvedGrievances: number): number {
  if (totalGrievances === 0) return 100;
  const rate = (resolvedGrievances / totalGrievances) * 100;
  return Math.round(rate * 10) / 10;
}
