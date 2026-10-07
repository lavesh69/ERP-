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

  return {
    isValid: errors.length === 0,
    errors,
  };
}
