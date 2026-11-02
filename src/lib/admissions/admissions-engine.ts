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
  | "ENROLLED"
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
  documentsUploaded?: {
    transcripts?: string;
    identityProof?: string;
    recommendationLetters?: string;
    categoryCertificate?: string;
    uploadedAt?: string;
  };
  category?: string;
  counselorNotes?: string;
  offerSeal?: string;
  offerIssuedAt?: string;
  reportingDeadline?: string;
  scholarshipAmount?: number;
  seatDepositPaid: boolean;
  depositAmount: number;
  assignedCounselor: string;
  source: "WEBSITE" | "EDUCATION_FAIR" | "WALK_IN" | "REFERRAL" | "PUBLIC_PORTAL";
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
  const gpaNorm = gpaOutOfFour > 4.0
    ? Math.min(100, Math.max(0, gpaOutOfFour))
    : (Math.min(4.0, Math.max(0, gpaOutOfFour)) / 4.0) * 100;
  const examNorm = entranceScore <= 100
    ? Math.min(100, Math.max(0, entranceScore))
    : (Math.min(entranceMax, Math.max(0, entranceScore)) / entranceMax) * 100;
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
  if (data.highSchoolGpa === undefined || isNaN(Number(data.highSchoolGpa)) || Number(data.highSchoolGpa) < 0 || Number(data.highSchoolGpa) > 100) {
    errors.push("High school GPA / percentage must be a valid number between 0 and 100 (or 0.0 to 4.0 scale).");
  }
  if (data.entranceExamScore === undefined || isNaN(Number(data.entranceExamScore)) || Number(data.entranceExamScore) < 0) {
    errors.push("Valid non-negative entrance examination score is required.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates progression through the official university enrollment lifecycle
 */
export function validateStageTransition(
  currentStage: AdmissionStage,
  nextStage: AdmissionStage
): { isValid: boolean; reason?: string } {
  if (currentStage === nextStage) return { isValid: true };
  if (nextStage === "REJECTED") return { isValid: true };

  const validTransitions: Record<AdmissionStage, AdmissionStage[]> = {
    INQUIRY: ["APPLICATION_SUBMITTED", "REJECTED"],
    APPLICATION_SUBMITTED: ["DOCUMENTS_VERIFIED", "MERIT_SHORTLISTED", "REJECTED"],
    DOCUMENTS_VERIFIED: ["MERIT_SHORTLISTED", "OFFER_EXTENDED", "REJECTED"],
    MERIT_SHORTLISTED: ["OFFER_EXTENDED", "REJECTED"],
    OFFER_EXTENDED: ["SEAT_CONFIRMED", "REJECTED"],
    SEAT_CONFIRMED: ["ENROLLED", "REJECTED"],
    ENROLLED: [],
    REJECTED: ["APPLICATION_SUBMITTED"], // Appeal reactivation
  };

  const allowed = validTransitions[currentStage] || [];
  if (!allowed.includes(nextStage)) {
    return {
      isValid: false,
      reason: `Illegal admission pipeline progression: Cannot transition applicant from '${currentStage}' to '${nextStage}'.`,
    };
  }
  return { isValid: true };
}

export const calculateCompositeMeritScore = calculateCompositeScore;
export const validateApplicantData = validateApplicantInput;
