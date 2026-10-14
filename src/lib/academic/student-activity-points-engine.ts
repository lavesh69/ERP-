/**
 * CLASSROOM ERP — AICTE Mandatory 100 Activity Points Ledger Engine
 * 
 * Enforces the AICTE statutory mandate requiring undergraduate engineering students
 * to earn at least 100 non-academic activity points across 5 standardized pillars
 * before qualifying for degree award.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

export type ActivityCategory =
  | "NATIONAL_INITIATIVES"      // NSS, NCC, Swachh Bharat (Max 40 pts)
  | "SPORTS_AND_CULTURAL"       // Inter-college, State, National events (Max 30 pts)
  | "TECHNICAL_HACKATHONS"      // Hackathons, IEEE/ACM papers, Coding contests (Max 40 pts)
  | "ENTREPRENEURSHIP_STARTUP"  // Incubation, patent filing, prototype creation (Max 40 pts)
  | "COMMUNITY_AND_MENTORING";  // Rural immersion, school tutoring, blood donation (Max 30 pts)

export interface ActivityClaimRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  category: ActivityCategory;
  title: string;
  description: string;
  activityDate: string;
  pointsClaimed: number;
  pointsAwarded: number;
  evidenceUrl?: string;
  status: "SUBMITTED" | "VERIFIED_BY_FACULTY" | "DEAN_APPROVED" | "REJECTED";
  facultyEvaluatorId?: string;
  evaluatorRemarks?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface StudentActivityPointsSummary {
  studentId: string;
  studentName: string;
  rollNumber: string;
  totalPointsRequired: number; // Standard: 100
  totalPointsEarned: number;
  pointsByCategory: Record<ActivityCategory, number>;
  degreeClearanceGranted: boolean;
  clearanceCertificateSeal?: string;
  claims: ActivityClaimRecord[];
  claimsPendingVerification: number;
}

const ACTIVITY_FILE = path.join(process.cwd(), "data", "academic", "student_activity_points.json");

function ensureDirectory() {
  const dir = path.dirname(ACTIVITY_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadActivityClaims(): ActivityClaimRecord[] {
  try {
    ensureDirectory();
    if (!fs.existsSync(ACTIVITY_FILE)) return [];
    return JSON.parse(fs.readFileSync(ACTIVITY_FILE, "utf-8"));
  } catch {
    return [];
  }
}

export function saveActivityClaims(records: ActivityClaimRecord[]): void {
  ensureDirectory();
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(records, null, 2), "utf-8");
}

export function computeStudentActivitySummary(
  studentId: string,
  studentName: string,
  rollNumber: string
): StudentActivityPointsSummary {
  const allClaims = loadActivityClaims();
  const studentClaims = allClaims.filter((c) => c.studentId === studentId);

  const pointsByCategory: Record<ActivityCategory, number> = {
    NATIONAL_INITIATIVES: 0,
    SPORTS_AND_CULTURAL: 0,
    TECHNICAL_HACKATHONS: 0,
    ENTREPRENEURSHIP_STARTUP: 0,
    COMMUNITY_AND_MENTORING: 0,
  };

  let totalPointsEarned = 0;
  let pendingCount = 0;

  for (const claim of studentClaims) {
    if (claim.status === "DEAN_APPROVED" || claim.status === "VERIFIED_BY_FACULTY") {
      const awarded = claim.pointsAwarded || claim.pointsClaimed;
      pointsByCategory[claim.category] = (pointsByCategory[claim.category] || 0) + awarded;
      totalPointsEarned += awarded;
    } else if (claim.status === "SUBMITTED") {
      pendingCount++;
    }
  }

  // Cap total required at 100 for undergraduate regular admission
  const totalPointsRequired = 100;
  const degreeClearanceGranted = totalPointsEarned >= totalPointsRequired;

  let clearanceCertificateSeal: string | undefined = undefined;
  if (degreeClearanceGranted) {
    const raw = `${studentId}|${rollNumber}|${totalPointsEarned}|AICTE-CLEARANCE-100`;
    clearanceCertificateSeal = `AICTE-ACT-SEAL-${crypto.createHash("sha256").update(raw).digest("hex").substring(0, 20).toUpperCase()}`;
  }

  return {
    studentId,
    studentName,
    rollNumber,
    totalPointsRequired,
    totalPointsEarned,
    pointsByCategory,
    degreeClearanceGranted,
    clearanceCertificateSeal,
    claims: studentClaims,
    claimsPendingVerification: pendingCount,
  };
}

export function submitActivityClaim(params: {
  studentId: string;
  studentName: string;
  rollNumber: string;
  category: ActivityCategory;
  title: string;
  description: string;
  activityDate: string;
  pointsClaimed: number;
  evidenceUrl?: string;
}): ActivityClaimRecord {
  const claims = loadActivityClaims();
  const id = `ACT-CLM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const newClaim: ActivityClaimRecord = {
    id,
    studentId: params.studentId,
    studentName: params.studentName,
    rollNumber: params.rollNumber,
    category: params.category,
    title: params.title,
    description: params.description,
    activityDate: params.activityDate,
    pointsClaimed: Math.min(30, Math.max(5, params.pointsClaimed)),
    pointsAwarded: 0,
    evidenceUrl: params.evidenceUrl,
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
  };

  claims.unshift(newClaim);
  saveActivityClaims(claims);
  return newClaim;
}

export function verifyActivityClaim(params: {
  claimId: string;
  evaluatorId: string;
  status: "VERIFIED_BY_FACULTY" | "DEAN_APPROVED" | "REJECTED";
  awardedPoints: number;
  remarks?: string;
}): ActivityClaimRecord | null {
  const claims = loadActivityClaims();
  const claim = claims.find((c) => c.id === params.claimId);
  if (!claim) return null;

  claim.status = params.status;
  claim.pointsAwarded = params.status === "REJECTED" ? 0 : params.awardedPoints;
  claim.facultyEvaluatorId = params.evaluatorId;
  claim.evaluatorRemarks = params.remarks;
  claim.reviewedAt = new Date().toISOString();

  saveActivityClaims(claims);
  return claim;
}
