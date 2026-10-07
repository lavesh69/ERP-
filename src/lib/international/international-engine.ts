/**
 * Enterprise International Relations Office (IRO) & Student Exchange Engine
 * Manages global partner university MoUs, inbound/outbound study abroad pipelines,
 * credit transfer mapping, and foreign student Visa/FRRO regulatory compliance.
 */

export type ExchangeType = "OUTBOUND" | "INBOUND";

export type ExchangeStatus =
  | "APPLICATION_SUBMITTED"
  | "NOMINATED"
  | "VISA_GRANTED"
  | "STUDYING_ABROAD"
  | "TRANSCRIPT_TRANSFERRED"
  | "REJECTED";

export type FrroStatus = "NOT_APPLICABLE" | "COMPLIANT" | "PENDING_REGISTRATION" | "EXPIRED";

export interface PartnerUniversity {
  id: string;
  institutionName: string;
  country: string;
  city: string;
  qsWorldRanking: number;
  mouSigningDate: string;
  mouExpiryDate: string;
  isActive: boolean;
  cooperationAreas: string[];
  exchangeSeatsPerYear: number;
}

export interface ExchangeStudent {
  id: string;
  applicationRef: string;
  type: ExchangeType;
  studentName: string;
  studentRollOrId: string;
  homeUniversity: string;
  hostUniversity: string;
  program: string;
  targetSemester: string;
  creditsMapped: number;
  status: ExchangeStatus;
  passportNumber: string;
  visaExpiryDate: string;
  frroStatus: FrroStatus;
  scholarshipGrantAmount: number;
  createdAt: string;
}

/**
 * Evaluates student exchange application eligibility
 */
export function evaluateExchangeApplication(
  cgpa: number,
  creditsMapped: number,
  passportNumber: string
): {
  isEligible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (cgpa < 3.2 && cgpa < 7.5) {
    reasons.push("Minimum CGPA of 3.2 (or 7.5/10.0) required for international nomination");
  }

  if (creditsMapped < 12) {
    reasons.push("At least 12 transferable course credits must be pre-mapped by Academic Dean");
  }

  if (!passportNumber || passportNumber.trim().length < 6) {
    reasons.push("Valid international passport number is required");
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Checks Visa and FRRO statutory compliance for international students
 */
export function checkVisaFrroCompliance(
  visaExpiryDate: string,
  frroStatus: FrroStatus
): {
  isCompliant: boolean;
  daysRemaining: number;
  alertLevel: "NORMAL" | "EXPIRING_SOON" | "OVERSTAY_RISK";
  remarks: string;
} {
  const expiry = new Date(visaExpiryDate).getTime();
  const now = Date.now();
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      isCompliant: false,
      daysRemaining: diffDays,
      alertLevel: "OVERSTAY_RISK",
      remarks: "Statutory student visa has expired! Immediate FRRO exit/extension petition required.",
    };
  }

  if (diffDays <= 30) {
    return {
      isCompliant: true,
      daysRemaining: diffDays,
      alertLevel: "EXPIRING_SOON",
      remarks: "Visa expires in less than 30 days. Renewal dossier should be submitted immediately.",
    };
  }

  return {
    isCompliant: frroStatus === "COMPLIANT" || frroStatus === "NOT_APPLICABLE",
    daysRemaining: diffDays,
    alertLevel: "NORMAL",
    remarks: "Visa and FRRO registration are fully valid and compliant.",
  };
}
