/**
 * Enterprise Admissions & Enrolment Engine
 * Manages prospective applicant funnels, eligibility scoring, merit rank calculation, and offer letter generation.
 */

export type AdmissionStage =
  | "INQUIRY"
  | "APPLICATION_SUBMITTED"
  | "DOCUMENTS_VERIFIED"
  | "MERIT_SHORTLISTED"
  | "OFFER_EXTENDED"
  | "SEAT_CONFIRMED"
  | "REJECTED";

export interface ApplicantLead {
  id: string;
  applicationNo: string;
  fullName: string;
  email: string;
  phone: string;
  programCode: string;
  programName: string;
  highSchoolGpa: number; // e.g. 3.8 / 4.0 or percentage 92%
  entranceExamScore: number; // e.g. 1420 / 1600 SAT or 96.5 percentile
  meritRank: number;
  stage: AdmissionStage;
  documentsStatus: {
    transcriptsVerified: boolean;
    identityProofVerified: boolean;
    recommendationLettersVerified: boolean;
  };
  seatDepositPaid: boolean;
  depositAmount: number;
  assignedCounselor: string;
  source: "WEBSITE" | "EDUCATION_FAIR" | "WALK_IN" | "REFERRAL";
  appliedDate: string;
}

export interface ProgramQuota {
  programCode: string;
  programName: string;
  totalSeats: number;
  confirmedSeats: number;
  cutoffScore: number;
  applicationFee: number;
}

/**
 * Calculates applicant composite score for merit ranking
 * Formula: 40% High School GPA (normalized to 100) + 60% Entrance Exam Score (normalized to 100)
 */
export function calculateCompositeScore(gpaOutOfFour: number, entranceScore: number, entranceMax: number = 1600): number {
  const gpaNorm = (Math.min(4.0, Math.max(0, gpaOutOfFour)) / 4.0) * 100;
  const examNorm = (Math.min(entranceMax, Math.max(0, entranceScore)) / entranceMax) * 100;
  const composite = gpaNorm * 0.4 + examNorm * 0.6;
  return Math.round(composite * 10) / 10;
}

/**
 * Validates eligibility against program minimum cutoff
 */
export function checkAdmissionEligibility(
  gpa: number,
  entranceScore: number,
  cutoffScore: number
): { isEligible: boolean; compositeScore: number; deficit: number } {
  const composite = calculateCompositeScore(gpa, entranceScore);
  const isEligible = composite >= cutoffScore;
  const deficit = Math.max(0, Math.round((cutoffScore - composite) * 10) / 10);
  return {
    isEligible,
    compositeScore: composite,
    deficit,
  };
}

/**
 * Validates applicant registration form
 */
export function validateApplicantInput(data: Partial<ApplicantLead>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.push("Full legal name is required.");
  }
  if (!data.email || !data.email.includes("@")) {
    errors.push("Valid email address is required.");
  }
  if (!data.phone || data.phone.trim().length < 8) {
    errors.push("Contact telephone number is required.");
  }
  if (!data.programCode) {
    errors.push("Target degree program is required.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const calculateCompositeMeritScore = calculateCompositeScore;
export const validateApplicantData = validateApplicantInput;
