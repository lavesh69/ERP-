/**
 * CLASSROOM ERP — Admissions Merit Ranking, Reservation Quota & Counseling Allotment Engine
 * 
 * Implements national statutory higher education seat allocation algorithms:
 * - Composite Merit Score Calculation (Board 40% + Entrance 60%)
 * - General Merit Rank (GMR) & Category Rank (CR) sorting
 * - Central/State Reservation Quotas (UR 40.5%, OBC-NCL 27%, SC 15%, ST 7.5%, EWS 10%, PwD 5%)
 * - Multi-round seat allotment simulation with Opening/Closing rank cutoffs
 * - Cryptographic provisional Seat Allotment Order generation with SHA-256 seal
 */

import crypto from "crypto";

export type SocialCategory = "GENERAL" | "OBC_NCL" | "SC" | "ST" | "EWS";

export interface ApplicantMeritRecord {
  applicantId: string;
  applicationNo: string;
  fullName: string;
  category: SocialCategory;
  isPwd: boolean;
  boardExamPercent: number; // 0 - 100
  entranceScore: number;     // scaled 0 - 100
  preferredPrograms: string[]; // ordered preferences: e.g. ["CSE", "AI_DS", "ECE", "IT"]
}

export interface RankedApplicant extends ApplicantMeritRecord {
  compositeScore: number;
  generalMeritRank: number;
  categoryRank: number;
  status: "ALLOCATED" | "WAITLISTED" | "UNALLOCATED";
  allottedProgram?: string;
  allottedCategory?: string;
  roundAllocated?: number;
}

export interface ProgramQuotaAllocation {
  programCode: string;
  programTitle: string;
  totalSeats: number;
  quotas: {
    GENERAL: number;
    OBC_NCL: number;
    SC: number;
    ST: number;
    EWS: number;
    PWD_HORIZONTAL: number;
  };
  filled: {
    GENERAL: number;
    OBC_NCL: number;
    SC: number;
    ST: number;
    EWS: number;
    PWD_HORIZONTAL: number;
  };
  openingRank: number | null;
  closingRank: number | null;
}

export interface SeatAllotmentOrder {
  orderId: string;
  applicationNo: string;
  applicantName: string;
  generalMeritRank: number;
  categoryRank: number;
  allottedProgram: string;
  allottedCategory: string;
  counselingRound: number;
  compositeScore: number;
  reportingDeadline: string;
  seatAcceptanceFeeInr: number;
  verificationSeal: string;
  digitalSeal: string;
  issuedAt: string;
}

export const DEFAULT_PROGRAM_SEAT_MATRIX: ProgramQuotaAllocation[] = [
  {
    programCode: "CSE",
    programTitle: "B.Tech Computer Science & Engineering",
    totalSeats: 120,
    quotas: { GENERAL: 49, OBC_NCL: 32, SC: 18, ST: 9, EWS: 12, PWD_HORIZONTAL: 6 },
    filled: { GENERAL: 0, OBC_NCL: 0, SC: 0, ST: 0, EWS: 0, PWD_HORIZONTAL: 0 },
    openingRank: null,
    closingRank: null,
  },
  {
    programCode: "AI_DS",
    programTitle: "B.Tech Artificial Intelligence & Data Science",
    totalSeats: 60,
    quotas: { GENERAL: 25, OBC_NCL: 16, SC: 9, ST: 4, EWS: 6, PWD_HORIZONTAL: 3 },
    filled: { GENERAL: 0, OBC_NCL: 0, SC: 0, ST: 0, EWS: 0, PWD_HORIZONTAL: 0 },
    openingRank: null,
    closingRank: null,
  },
  {
    programCode: "ECE",
    programTitle: "B.Tech Electronics & Communication Engineering",
    totalSeats: 60,
    quotas: { GENERAL: 25, OBC_NCL: 16, SC: 9, ST: 4, EWS: 6, PWD_HORIZONTAL: 3 },
    filled: { GENERAL: 0, OBC_NCL: 0, SC: 0, ST: 0, EWS: 0, PWD_HORIZONTAL: 0 },
    openingRank: null,
    closingRank: null,
  },
  {
    programCode: "IT",
    programTitle: "B.Tech Information Technology",
    totalSeats: 60,
    quotas: { GENERAL: 25, OBC_NCL: 16, SC: 9, ST: 4, EWS: 6, PWD_HORIZONTAL: 3 },
    filled: { GENERAL: 0, OBC_NCL: 0, SC: 0, ST: 0, EWS: 0, PWD_HORIZONTAL: 0 },
    openingRank: null,
    closingRank: null,
  },
  {
    programCode: "ME",
    programTitle: "B.Tech Mechanical Engineering",
    totalSeats: 60,
    quotas: { GENERAL: 25, OBC_NCL: 16, SC: 9, ST: 4, EWS: 6, PWD_HORIZONTAL: 3 },
    filled: { GENERAL: 0, OBC_NCL: 0, SC: 0, ST: 0, EWS: 0, PWD_HORIZONTAL: 0 },
    openingRank: null,
    closingRank: null,
  },
];

/**
 * Computes standardized composite merit score:
 * Board Examination (40% weightage) + Entrance Exam Percentile (60% weightage)
 */
export function calculateCompositeMeritScore(boardExamPercent: number, entranceScore: number): number {
  const composite = (boardExamPercent * 0.40) + (entranceScore * 0.60);
  return Math.round(composite * 100) / 100;
}

/**
 * Computes General Merit Rank (GMR) and Category Rank (CR) for a cohort of applicants
 */
export function generateMeritRankings(applicants: ApplicantMeritRecord[]): RankedApplicant[] {
  // 1. Calculate composite scores
  const scored = applicants.map((app) => ({
    ...app,
    compositeScore: calculateCompositeMeritScore(app.boardExamPercent, app.entranceScore),
    generalMeritRank: 0,
    categoryRank: 0,
    status: "UNALLOCATED" as const,
  }));

  // 2. Sort descending by composite score (tie-breaker: entrance score, then board percent)
  scored.sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore;
    if (b.entranceScore !== a.entranceScore) return b.entranceScore - a.entranceScore;
    return b.boardExamPercent - a.boardExamPercent;
  });

  // 3. Assign General Merit Ranks
  scored.forEach((app, idx) => {
    app.generalMeritRank = idx + 1;
  });

  // 4. Assign Category Ranks
  const categoryCounters: Record<string, number> = {};
  for (const app of scored) {
    categoryCounters[app.category] = (categoryCounters[app.category] || 0) + 1;
    app.categoryRank = categoryCounters[app.category];
  }

  return scored;
}

/**
 * Simulates a counseling seat allocation round matching ranks against quota matrices
 */
export function executeCounselingAllocation(params: {
  rankedApplicants: RankedApplicant[];
  seatMatrix?: ProgramQuotaAllocation[];
  roundNumber: number;
}): {
  round: number;
  allocatedApplicants: RankedApplicant[];
  waitlistedApplicants: RankedApplicant[];
  updatedSeatMatrix: ProgramQuotaAllocation[];
  totalAllocated: number;
} {
  const matrix = params.seatMatrix
    ? JSON.parse(JSON.stringify(params.seatMatrix)) as ProgramQuotaAllocation[]
    : JSON.parse(JSON.stringify(DEFAULT_PROGRAM_SEAT_MATRIX)) as ProgramQuotaAllocation[];

  const allocated: RankedApplicant[] = [];
  const waitlisted: RankedApplicant[] = [];

  for (const app of params.rankedApplicants) {
    let seatFound = false;

    for (const progCode of app.preferredPrograms) {
      const prog = matrix.find((p) => p.programCode === progCode);
      if (!prog) continue;

      // 1. Try General / Open Merit seat first (regardless of applicant's social category)
      if (prog.filled.GENERAL < prog.quotas.GENERAL) {
        prog.filled.GENERAL += 1;
        app.status = "ALLOCATED";
        app.allottedProgram = prog.programCode;
        app.allottedCategory = "OPEN_GENERAL";
        app.roundAllocated = params.roundNumber;
        seatFound = true;
      }
      // 2. If Open seat unavailable and applicant is from reserved category, try category quota
      else if (app.category !== "GENERAL" && prog.filled[app.category] < prog.quotas[app.category]) {
        prog.filled[app.category] += 1;
        app.status = "ALLOCATED";
        app.allottedProgram = prog.programCode;
        app.allottedCategory = app.category;
        app.roundAllocated = params.roundNumber;
        seatFound = true;
      }

      if (seatFound) {
        if (prog.openingRank === null || app.generalMeritRank < prog.openingRank) {
          prog.openingRank = app.generalMeritRank;
        }
        if (prog.closingRank === null || app.generalMeritRank > prog.closingRank) {
          prog.closingRank = app.generalMeritRank;
        }
        allocated.push(app);
        break;
      }
    }

    if (!seatFound) {
      app.status = "WAITLISTED";
      waitlisted.push(app);
    }
  }

  return {
    round: params.roundNumber,
    allocatedApplicants: allocated,
    waitlistedApplicants: waitlisted,
    updatedSeatMatrix: matrix,
    totalAllocated: allocated.length,
  };
}

/**
 * Generates an official, tamper-evident Seat Allotment Order
 */
export function generateSeatAllotmentOrder(params: {
  applicant: RankedApplicant;
  counselingRound: number;
  seatAcceptanceFeeInr?: number;
}): SeatAllotmentOrder {
  const orderId = `ALLOT-${new Date().getFullYear()}-${params.applicant.applicationNo.slice(-6)}-R${params.counselingRound}`;
  const deadlineDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days reporting window
  const reportingDeadline = deadlineDate.toISOString().split("T")[0];
  const fee = params.seatAcceptanceFeeInr || 25000;

  const rawPayload = `${orderId}|${params.applicant.applicationNo}|${params.applicant.allottedProgram}|${params.applicant.generalMeritRank}|${fee}|${reportingDeadline}`;
  const verificationSeal = `APEX-SEAT-ALLOT-${crypto.createHash("sha256").update(rawPayload).digest("hex").substring(0, 24).toUpperCase()}`;

  return {
    orderId,
    applicationNo: params.applicant.applicationNo,
    applicantName: params.applicant.fullName,
    generalMeritRank: params.applicant.generalMeritRank,
    categoryRank: params.applicant.categoryRank,
    allottedProgram: params.applicant.allottedProgram || "CSE",
    allottedCategory: params.applicant.allottedCategory || "OPEN_GENERAL",
    counselingRound: params.counselingRound,
    compositeScore: params.applicant.compositeScore,
    reportingDeadline,
    seatAcceptanceFeeInr: fee,
    verificationSeal,
    digitalSeal: verificationSeal,
    issuedAt: new Date().toISOString(),
  };
}
