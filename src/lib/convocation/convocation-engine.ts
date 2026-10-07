/**
 * Enterprise Convocation, Multi-Department Clearance & Degree Conferral Engine
 * Automates statutory graduation clearance (No-Dues), academic honors & medal classifications,
 * convocation robe/guest allocations, and certificate dispatch records.
 */

import crypto from "crypto";

export type NoDuesDepartment =
  | "LIBRARY"
  | "HOSTEL"
  | "FINANCE"
  | "LABORATORY"
  | "SPORTS_COUNCIL"
  | "ALUMNI_ASSOCIATION";

export type HonorsCategory =
  | "FIRST_CLASS_WITH_DISTINCTION"
  | "FIRST_CLASS"
  | "SECOND_CLASS"
  | "PASS";

export type MedalType = "GOLD_MEDAL" | "SILVER_MEDAL" | "BRONZE_MEDAL" | "DEANS_HONORS_LIST";

export interface GraduationCandidate {
  id: string;
  candidateRef: string;
  studentRoll: string;
  fullName: string;
  program: string;
  departmentCode: string;
  graduatingYear: number;
  finalCgpa: number;
  honorsCategory: HonorsCategory;
  isMedalist: boolean;
  medalType?: MedalType;
  noDuesStatus: Record<NoDuesDepartment, boolean>;
  allClearancesGranted: boolean;
  convocationRegistered: boolean;
  robeSize?: "S" | "M" | "L" | "XL";
  guestPassesCount: number;
  degreeDispatchMode: "CONVOCATION_IN_PERSON" | "POSTAL_SPEEDPOST" | "COLLECT_AT_REGISTRAR";
  courierTrackingAwb?: string;
  certificateHash: string;
}

/**
 * Evaluates graduation eligibility and academic honors standing
 */
export function evaluateGraduationEligibility(
  finalCgpa: number,
  noDues: Record<NoDuesDepartment, boolean>
): {
  allClearancesGranted: boolean;
  pendingDepartments: NoDuesDepartment[];
  honorsCategory: HonorsCategory;
  isDegreeConferralReady: boolean;
} {
  const departments: NoDuesDepartment[] = [
    "LIBRARY",
    "HOSTEL",
    "FINANCE",
    "LABORATORY",
    "SPORTS_COUNCIL",
    "ALUMNI_ASSOCIATION",
  ];

  const pendingDepartments: NoDuesDepartment[] = [];
  for (const dep of departments) {
    if (!noDues[dep]) {
      pendingDepartments.push(dep);
    }
  }

  const allClearancesGranted = pendingDepartments.length === 0;

  let honorsCategory: HonorsCategory = "PASS";
  if (finalCgpa >= 8.5) {
    honorsCategory = "FIRST_CLASS_WITH_DISTINCTION";
  } else if (finalCgpa >= 7.0) {
    honorsCategory = "FIRST_CLASS";
  } else if (finalCgpa >= 5.5) {
    honorsCategory = "SECOND_CLASS";
  }

  const isDegreeConferralReady = allClearancesGranted && finalCgpa >= 5.0;

  return {
    allClearancesGranted,
    pendingDepartments,
    honorsCategory,
    isDegreeConferralReady,
  };
}

/**
 * Generates cryptographic certificate authenticity seal
 */
export function generateDegreeCertificateHash(
  studentRoll: string,
  program: string,
  finalCgpa: number,
  graduatingYear: number = 2026
): string {
  const raw = `${studentRoll}:${program}:${finalCgpa}:${graduatingYear}:APEX-CONVOCATION-SEAL`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16).toUpperCase();
  return `DEG-CONF-${hash}`;
}
