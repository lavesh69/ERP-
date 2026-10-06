/**
 * Enterprise Student Clubs & Co-Curricular Activity Points Engine
 * Manages recognized student organizations, leadership bodies, and statutory Activity Points towards degree qualification.
 */

export type ClubCategory =
  | "TECHNICAL"
  | "CULTURAL"
  | "SPORTS"
  | "SOCIAL_SERVICE"
  | "ENTREPRENEURSHIP";

export interface StudentClub {
  id: string;
  code: string;
  name: string;
  category: ClubCategory;
  description: string;
  presidentName: string;
  facultyAdvisor: string;
  totalMembers: number;
  annualBudget: number;
  budgetUtilized: number;
  establishedYear: number;
}

export type ClaimStatus = "PENDING_FACULTY_REVIEW" | "APPROVED" | "REJECTED";

export interface ActivityPointClaim {
  id: string;
  claimRef: string;
  studentRoll: string;
  studentName: string;
  clubCode: string;
  clubName: string;
  category: ClubCategory;
  activityTitle: string;
  description: string;
  participationHours: number;
  pointsClaimed: number;
  pointsAwarded: number;
  status: ClaimStatus;
  evidenceReference: string;
  reviewedBy?: string;
  submittedAt: string;
}

export const DEGREE_REQUIRED_ACTIVITY_POINTS = 100;

/**
 * Calculates aggregate activity points earned by a student across categories
 */
export function calculateStudentActivityPoints(claims: ActivityPointClaim[]): {
  totalPoints: number;
  requiredPoints: number;
  completionPercentage: number;
  isEligibleForDegree: boolean;
  byCategory: Record<ClubCategory, number>;
} {
  const byCategory: Record<ClubCategory, number> = {
    TECHNICAL: 0,
    CULTURAL: 0,
    SPORTS: 0,
    SOCIAL_SERVICE: 0,
    ENTREPRENEURSHIP: 0,
  };

  let totalPoints = 0;

  claims
    .filter((c) => c.status === "APPROVED")
    .forEach((c) => {
      totalPoints += c.pointsAwarded;
      if (byCategory[c.category] !== undefined) {
        byCategory[c.category] += c.pointsAwarded;
      }
    });

  const completionPercentage = Math.min(
    100,
    Math.round((totalPoints / DEGREE_REQUIRED_ACTIVITY_POINTS) * 100)
  );

  return {
    totalPoints,
    requiredPoints: DEGREE_REQUIRED_ACTIVITY_POINTS,
    completionPercentage,
    isEligibleForDegree: totalPoints >= DEGREE_REQUIRED_ACTIVITY_POINTS,
    byCategory,
  };
}

/**
 * Validates new activity point claim submission
 */
export function validateActivityClaimInput(
  claim: Partial<ActivityPointClaim>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!claim.studentRoll || claim.studentRoll.trim().length === 0) {
    errors.push("Student roll number is required.");
  }
  if (!claim.activityTitle || claim.activityTitle.trim().length < 5) {
    errors.push("Activity title must be at least 5 characters.");
  }
  if (!claim.clubCode) {
    errors.push("Affiliated club or society code is required.");
  }
  if (!claim.participationHours || claim.participationHours <= 0) {
    errors.push("Participation hours must be positive.");
  }
  if (!claim.pointsClaimed || claim.pointsClaimed <= 0) {
    errors.push("Claimed points must be greater than 0.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
