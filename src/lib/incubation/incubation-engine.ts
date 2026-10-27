/**
 * Enterprise University Incubation Center & Startup Accelerator Engine
 * Manages venture lab cohorts, seed grants, university cap-table equity,
 * technology transfer patents, and milestone tracking.
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
