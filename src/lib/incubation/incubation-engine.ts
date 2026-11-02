// SPDX-License-Identifier: Apache-2.0
/**
 * Enterprise University Incubation Center & Startup Accelerator Engine
 * Manages venture lab cohorts, seed grants, university cap-table equity,
 * technology transfer patents, workspace desk allocations, and milestone tracking.
 */

export type StartupSector =
  | "AI_ML"
  | "FINTECH"
  | "EDTECH"
  | "HEALTHTECH"
  | "CLEANTECH"
  | "AGRITECH"
  | "ROBOTICS_IOT";

export type IncubationStage =
  | "PRE_INCUBATION"
  | "INCUBATED_PROTOTYPE"
  | "SEED_FUNDED"
  | "ACCELERATOR_GROWTH"
  | "GRADUATED_VENTURE";

export type VentureStatus = "ACTIVE" | "GRADUATED" | "DORMANT";

export interface IncubatedStartup {
  id: string;
  companyRef: string;
  startupName: string;
  founderName: string;
  founderRollOrStaffId: string;
  founderRole: "STUDENT" | "ALUMNI" | "FACULTY";
  sector: StartupSector;
  stage: IncubationStage;
  pitchDeckSummary: string;
  seedGrantDisbursed: number;
  universityEquityPercentage: number;
  externalFundingRaised: number;
  patentsFiled: number;
  labDesksAllocated: number;
  mentorName: string;
  status: VentureStatus;
  incubatedDate: string;
}

export interface PortfolioMetrics {
  totalVentures: number;
  activeVentures: number;
  graduatedVentures: number;
  totalSeedCapitalDisbursed: number;
  totalExternalFundingRaised: number;
  totalPatentsFiled: number;
  totalWorkspacesAllocated: number;
  estimatedPortfolioValuation: number;
}

export interface LabDeskAllocation {
  id: string;
  deskCode: string;
  podName: string;
  startupId: string | null;
  startupName: string | null;
  allocatedDate: string | null;
  status: "VACANT" | "OCCUPIED" | "RESERVED";
}

export interface SeedGrantTranche {
  id: string;
  trancheRef: string;
  startupId: string;
  startupName: string;
  trancheNumber: number;
  amount: number;
  milestoneDescription: string;
  status: "APPROVED" | "DISBURSED" | "UNDER_REVIEW";
  disbursedAt: string | null;
  sanctionOrderNumber: string;
}

export interface PatentDisclosure {
  id: string;
  disclosureRef: string;
  startupId: string;
  startupName: string;
  inventionTitle: string;
  applicationNumber: string;
  jurisdiction: "INDIAN_PATENT_OFFICE" | "USPTO" | "PCT_INTERNATIONAL";
  filingDate: string;
  status: "PROVISIONAL_FILED" | "PUBLISHED" | "EXAMINATION_UNDERWAY" | "GRANTED";
  universitySharePercentage: number;
  inventors: string[];
}

export interface QuarterlyMilestoneReview {
  id: string;
  reviewRef: string;
  startupId: string;
  startupName: string;
  quarter: string;
  reviewDate: string;
  reviewerName: string;
  mrrAchieved: number;
  prototypeStage: string;
  overallRating: number;
  mentorRemarks: string;
  recommendedAction: "CONTINUE_INCUBATION" | "FAST_TRACK_ACCELERATION" | "PROBATION_SUPPORT" | "GRADUATION_READY";
}

export type ApplicationStatus =
  | "SUBMITTED"
  | "UNDER_SCREENING"
  | "PITCH_SCHEDULED"
  | "APPROVED"
  | "REJECTED";

export interface IncubationApplication {
  id: string;
  applicationRef: string;
  startupName: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantRole: "STUDENT" | "ALUMNI" | "FACULTY";
  department: string;
  sector: StartupSector;
  problemStatement: string;
  proposedSolution: string;
  prototypeUrl?: string;
  requestedGrant: number;
  requestedDesks: number;
  status: ApplicationStatus;
  committeeScore?: number;
  committeeNotes?: string;
  submittedAt: string;
  evaluatedAt?: string;
}

export interface IncubationMentor {
  id: string;
  mentorName: string;
  title: string;
  organization: string;
  expertise: string[];
  email: string;
  phone: string;
  totalSessionsConducted: number;
  rating: number;
  availabilityStatus: "AVAILABLE" | "ENGAGED" | "ON_LEAVE";
}

export interface MentorSession {
  id: string;
  sessionRef: string;
  mentorId: string;
  mentorName: string;
  startupId: string;
  startupName: string;
  scheduledDate: string;
  durationMinutes: number;
  discussionTopic: string;
  keyTakeaways: string;
  actionItems: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export interface SeedFundScheme {
  id: string;
  schemeCode: string;
  schemeName: string;
  sponsoringAgency: string;
  sanctionedCorpus: number;
  disbursedAmount: number;
  maxGrantPerVenture: number;
  activeVenturesFunded: number;
  status: "ACTIVE" | "EXHAUSTED" | "REPLENISHED";
}

export interface InvestorEOI {
  id: string;
  eoiRef: string;
  startupId: string;
  startupName: string;
  investorFirm: string;
  partnerName: string;
  contactEmail: string;
  indicatedChequeAmount: number;
  proposedValuationCap: number;
  stageInterest: "SEED" | "PRE_SERIES_A" | "SERIES_A";
  dueDiligenceStatus: "EXPRESSION_SUBMITTED" | "DATA_ROOM_OPENED" | "DUE_DILIGENCE_PASS" | "TERM_SHEET_ISSUED";
  submittedAt: string;
}

/**
 * Calculates aggregate innovation metrics across the university startup portfolio
 */
export function calculateIncubationPortfolioMetrics(
  startups: IncubatedStartup[]
): PortfolioMetrics {
  const totalVentures = startups.length;
  const activeVentures = startups.filter((s) => s.status === "ACTIVE").length;
  const graduatedVentures = startups.filter((s) => s.status === "GRADUATED").length;

  const totalSeedCapitalDisbursed = startups.reduce((sum, s) => sum + s.seedGrantDisbursed, 0);
  const totalExternalFundingRaised = startups.reduce((sum, s) => sum + s.externalFundingRaised, 0);
  const totalPatentsFiled = startups.reduce((sum, s) => sum + s.patentsFiled, 0);
  const totalWorkspacesAllocated = startups.reduce((sum, s) => sum + s.labDesksAllocated, 0);

  // Portfolio valuation estimate based on external funding benchmark
  const estimatedPortfolioValuation = totalExternalFundingRaised * 4.5 + totalSeedCapitalDisbursed * 3.0;

  return {
    totalVentures,
    activeVentures,
    graduatedVentures,
    totalSeedCapitalDisbursed,
    totalExternalFundingRaised,
    totalPatentsFiled,
    totalWorkspacesAllocated,
    estimatedPortfolioValuation: Math.round(estimatedPortfolioValuation),
  };
}

/**
 * Validates new incubator venture application
 */
export function validateStartupApplication(data: Partial<IncubatedStartup>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.startupName || data.startupName.trim().length < 2) {
    errors.push("Startup name is required");
  }

  if (!data.founderName || data.founderName.trim().length < 2) {
    errors.push("Primary founder name is required");
  }

  if (!data.pitchDeckSummary || data.pitchDeckSummary.trim().length < 15) {
    errors.push("Problem statement and pitch deck summary must be at least 15 characters");
  }

  if (
    data.universityEquityPercentage !== undefined &&
    (isNaN(Number(data.universityEquityPercentage)) ||
      Number(data.universityEquityPercentage) < 0 ||
      Number(data.universityEquityPercentage) > 100)
  ) {
    errors.push("University equity percentage must be between 0.0% and 100.0%");
  }

  if (
    data.seedGrantDisbursed !== undefined &&
    (isNaN(Number(data.seedGrantDisbursed)) || Number(data.seedGrantDisbursed) < 0)
  ) {
    errors.push("Seed grant disbursed cannot be negative");
  }

  if (
    data.labDesksAllocated !== undefined &&
    (isNaN(Number(data.labDesksAllocated)) || Number(data.labDesksAllocated) < 0)
  ) {
    errors.push("Lab desks allocated cannot be negative");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates formal venture progression through incubation stages
 */
export function validateIncubationStageTransition(
  currentStage: IncubationStage,
  nextStage: IncubationStage
): { isValid: boolean; reason?: string } {
  if (currentStage === nextStage) return { isValid: true };

  const validTransitions: Record<IncubationStage, IncubationStage[]> = {
    PRE_INCUBATION: ["INCUBATED_PROTOTYPE"],
    INCUBATED_PROTOTYPE: ["SEED_FUNDED", "GRADUATED_VENTURE"],
    SEED_FUNDED: ["ACCELERATOR_GROWTH", "GRADUATED_VENTURE"],
    ACCELERATOR_GROWTH: ["GRADUATED_VENTURE"],
    GRADUATED_VENTURE: [],
  };

  const allowed = validTransitions[currentStage] || [];
  if (!allowed.includes(nextStage)) {
    return {
      isValid: false,
      reason: `Illegal venture stage transition: Cannot progress startup from '${currentStage}' to '${nextStage}'.`,
    };
  }
  return { isValid: true };
}

/**
 * Computes post-round dilution for university cap table
 */
export function calculateCapTableDilution(
  preMoneyValuation: number,
  investmentAmount: number,
  existingStakeholders: { stakeholder: string; percentage: number }[]
): {
  postMoneyValuation: number;
  investorEquityPercentage: number;
  dilutedCapTable: { stakeholder: string; postRoundPercentage: number }[];
} {
  if (preMoneyValuation <= 0 || investmentAmount <= 0) {
    throw new Error("Pre-money valuation and investment amount must be positive.");
  }

  const postMoneyValuation = preMoneyValuation + investmentAmount;
  const investorEquity = Math.round((investmentAmount / postMoneyValuation) * 10000) / 100;
  const retentionFactor = preMoneyValuation / postMoneyValuation;

  const dilutedCapTable = existingStakeholders.map((s) => ({
    stakeholder: s.stakeholder,
    postRoundPercentage: Math.round(s.percentage * retentionFactor * 100) / 100,
  }));

  dilutedCapTable.push({
    stakeholder: "New Investor Round",
    postRoundPercentage: investorEquity,
  });

  return {
    postMoneyValuation,
    investorEquityPercentage: investorEquity,
    dilutedCapTable,
  };
}

/**
 * Validates seed grant tranche sanction
 */
export function validateGrantTranche(data: Partial<SeedGrantTranche>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.startupId) errors.push("Target venture ID is required.");
  if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
    errors.push("Grant tranche amount must be greater than zero.");
  }
  if (!data.milestoneDescription || data.milestoneDescription.trim().length < 5) {
    errors.push("Milestone description must be at least 5 characters.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates invention patent disclosure
 */
export function validatePatentDisclosure(data: Partial<PatentDisclosure>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.startupId) errors.push("Target venture ID is required.");
  if (!data.inventionTitle || data.inventionTitle.trim().length < 5) {
    errors.push("Invention title is required (min 5 characters).");
  }
  if (
    data.universitySharePercentage !== undefined &&
    (isNaN(Number(data.universitySharePercentage)) ||
      Number(data.universitySharePercentage) < 0 ||
      Number(data.universitySharePercentage) > 100)
  ) {
    errors.push("University share percentage must be between 0% and 100%.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates quarterly venture milestone review
 */
export function validateMilestoneReview(data: Partial<QuarterlyMilestoneReview>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.startupId) errors.push("Target venture ID is required.");
  if (!data.quarter || data.quarter.trim().length === 0) {
    errors.push("Quarter identifier is required (e.g. Q3 2026-27).");
  }
  if (data.overallRating !== undefined && (data.overallRating < 1 || data.overallRating > 5)) {
    errors.push("Overall rating must be between 1 and 5.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates incubation intake application
 */
export function validateIncubationApplication(data: Partial<IncubationApplication>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.startupName || data.startupName.trim().length < 3) {
    errors.push("Proposed startup/venture name must be at least 3 characters.");
  }
  if (!data.applicantName || data.applicantName.trim().length < 3) {
    errors.push("Applicant founder name is required.");
  }
  if (!data.applicantEmail || !data.applicantEmail.includes("@")) {
    errors.push("Valid applicant email is required.");
  }
  if (!data.problemStatement || data.problemStatement.trim().length < 15) {
    errors.push("Problem statement description must be at least 15 characters.");
  }
  if (!data.proposedSolution || data.proposedSolution.trim().length < 15) {
    errors.push("Proposed technology solution must be at least 15 characters.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates mentor onboarding
 */
export function validateMentorRegistration(data: Partial<IncubationMentor>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.mentorName || data.mentorName.trim().length < 3) {
    errors.push("Mentor full name is required.");
  }
  if (!data.title || data.title.trim().length < 2) {
    errors.push("Professional title / designation is required.");
  }
  if (!data.organization || data.organization.trim().length < 2) {
    errors.push("Affiliated venture firm or organization is required.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates mentor advisory session scheduling
 */
export function validateMentorSession(data: Partial<MentorSession>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.mentorId) errors.push("Assigned mentor ID is required.");
  if (!data.startupId) errors.push("Target startup venture ID is required.");
  if (!data.scheduledDate) errors.push("Scheduled session date is required.");
  if (!data.discussionTopic || data.discussionTopic.trim().length < 5) {
    errors.push("Discussion agenda/topic must be at least 5 characters.");
  }
  return { isValid: errors.length === 0, errors };
}

/**
 * Validates investor expression of interest
 */
export function validateInvestorEOI(data: Partial<InvestorEOI>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.startupId) errors.push("Target startup venture ID is required.");
  if (!data.investorFirm || data.investorFirm.trim().length < 2) {
    errors.push("Investor syndicate or venture capital firm name is required.");
  }
  if (!data.partnerName || data.partnerName.trim().length < 2) {
    errors.push("Lead partner/associate name is required.");
  }
  if (!data.contactEmail || !data.contactEmail.includes("@")) {
    errors.push("Valid contact email is required.");
  }
  if (!data.indicatedChequeAmount || Number(data.indicatedChequeAmount) <= 0) {
    errors.push("Indicated cheque investment amount must be greater than zero.");
  }
  return { isValid: errors.length === 0, errors };
}
