/**
 * Enterprise Institutional Accreditation & Quality Assurance Engine (NAAC / ABET / NIRF)
 * Calculates Faculty-to-Student Ratio (FSR), Cadre distribution, Criteria scoring, and AQAR dossier seals.
 */

import crypto from "crypto";

export interface AccreditationCriterion {
  criterionNumber: number;
  name: string;
  weightage: number; // Out of 1000
  scoreAchieved: number;
  gradeEquivalent: string;
  keyIndicators: {
    indicator: string;
    target: string;
    achieved: string;
    isCompliant: boolean;
  }[];
}

export interface InstitutionalMetrics {
  totalStudents: number;
  totalFaculty: number;
  professorsCount: number;
  associateProfessorsCount: number;
  assistantProfessorsCount: number;
  phdQualifiedPercentage: number;
  placementRatePercentage: number;
  studentSatisfactionSurveyRating: number; // e.g. 3.86 out of 4.00
}

/**
 * Calculates Faculty-to-Student Ratio (FSR) and checks compliance against statutory norms
 */
export function calculateFacultyStudentRatio(
  totalStudents: number,
  totalFaculty: number,
  benchmarkRatio: number = 15
): {
  ratioValue: number;
  ratioString: string;
  isCompliant: boolean;
  surplusOrDeficitFaculty: number;
} {
  if (totalFaculty <= 0) {
    return {
      ratioValue: totalStudents,
      ratioString: `${totalStudents}:1`,
      isCompliant: false,
      surplusOrDeficitFaculty: -Math.ceil(totalStudents / benchmarkRatio),
    };
  }

  const rawRatio = totalStudents / totalFaculty;
  const ratioValue = Math.round(rawRatio * 10) / 10;
  const isCompliant = ratioValue <= benchmarkRatio;

  const requiredFaculty = Math.ceil(totalStudents / benchmarkRatio);
  const surplusOrDeficitFaculty = totalFaculty - requiredFaculty;

  return {
    ratioValue,
    ratioString: `1:${ratioValue}`,
    isCompliant,
    surplusOrDeficitFaculty,
  };
}

/**
 * Verifies academic cadre ratio (Standard Cadre: 1 Professor : 2 Associate Profs : 6 Assistant Profs)
 */
export function calculateCadreRatio(
  professors: number,
  assocProfs: number,
  asstProfs: number
): {
  isCadreBalanced: boolean;
  actualRatio: string;
  benchmarkRatio: string;
  remarks: string;
} {
  const benchmarkRatio = "1 : 2 : 6";
  const actualRatio = `${professors} : ${assocProfs} : ${asstProfs}`;

  // If there are sufficient senior professors and associate professors
  const isCadreBalanced = professors >= 1 && assocProfs >= 2 && asstProfs >= 6;

  return {
    isCadreBalanced,
    actualRatio,
    benchmarkRatio,
    remarks: isCadreBalanced
      ? "Cadre distribution aligns with statutory university promotion rules."
      : "Cadre imbalance detected; recruit senior leadership professors to satisfy accreditation requirements.",
  };
}

/**
 * Generates official Annual Quality Assurance Report (AQAR) summary with cryptographic stamp
 */
export function generateAQARDossier(
  criteria: AccreditationCriterion[],
  academicYear: string = "2025-2026"
): {
  institutionalCgpa: number;
  accreditationGrade: "A++" | "A+" | "A" | "B++" | "B";
  totalScore: number;
  maxScore: number;
  verificationHash: string;
  certifiedDate: string;
} {
  const totalScore = criteria.reduce((sum, c) => sum + c.scoreAchieved, 0);
  const maxScore = criteria.reduce((sum, c) => sum + c.weightage, 0);

  const cgpaRaw = (totalScore / maxScore) * 4.0;
  const institutionalCgpa = Math.round(cgpaRaw * 100) / 100;

  let accreditationGrade: "A++" | "A+" | "A" | "B++" | "B" = "A";
  if (institutionalCgpa >= 3.51) accreditationGrade = "A++";
  else if (institutionalCgpa >= 3.26) accreditationGrade = "A+";
  else if (institutionalCgpa >= 3.01) accreditationGrade = "A";
  else if (institutionalCgpa >= 2.76) accreditationGrade = "B++";
  else accreditationGrade = "B";

  const hash = crypto
    .createHash("sha256")
    .update(`${academicYear}:${institutionalCgpa}:${accreditationGrade}:APEX-AQAR-VALID`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  return {
    institutionalCgpa,
    accreditationGrade,
    totalScore,
    maxScore,
    verificationHash: `AQAR-NAAC-${hash}`,
    certifiedDate: new Date().toISOString(),
  };
}

export interface NaacSsrDossier {
  cycle: number;
  aisheCode: string;
  institutionName: string;
  accreditationGrade: "A++" | "A+" | "A" | "B++" | "B";
  institutionalCgpa: number;
  totalScore: number;
  maxScore: number;
  executiveSummary: {
    vision: string;
    mission: string;
    swocAnalysis: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      challenges: string[];
    };
  };
  criteriaBreakdown: AccreditationCriterion[];
  verificationHash: string;
  compiledAt: string;
}

/**
 * Compiles the official NAAC Self Study Report (SSR) Institutional Dossier
 */
export function generateNAACSSRDossier(
  criteria: AccreditationCriterion[],
  metrics: InstitutionalMetrics,
  institutionName: string = "APEX INSTITUTE OF HIGHER EDUCATION & RESEARCH",
  aisheCode: string = "U-0128"
): NaacSsrDossier {
  const aqar = generateAQARDossier(criteria);

  const hash = crypto
    .createHash("sha256")
    .update(`${aisheCode}:${institutionName}:${aqar.institutionalCgpa}:${Date.now()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  return {
    cycle: 3,
    aisheCode,
    institutionName,
    accreditationGrade: aqar.accreditationGrade,
    institutionalCgpa: aqar.institutionalCgpa,
    totalScore: aqar.totalScore,
    maxScore: aqar.maxScore,
    executiveSummary: {
      vision: "To be an internationally recognized center of academic excellence nurturing ethical scholars and innovation leaders.",
      mission: "Provide state-of-the-art technological curricula, foster interdisciplinary scientific discovery, and ensure holistic societal upliftment.",
      swocAnalysis: {
        strengths: [
          "100% Outcome-Based Education (OBE) mapped to Program Specific Outcomes (PSOs)",
          `High-density faculty-student ratio of ${calculateFacultyStudentRatio(metrics.totalStudents, metrics.totalFaculty).ratioString}`,
          "Fully integrated autonomous ERP automating administration, fees, attendance and examinations",
          `${metrics.placementRatePercentage}% placement record in Fortune 500 tech enterprises`,
        ],
        weaknesses: [
          "Need for increased international exchange faculty chairs",
          "Potential for higher cross-border patent commercialization",
        ],
        opportunities: [
          "Establishment of Semiconductor & AI Center of Excellence under NEP 2020",
          "Expansion of extramural grant funding from DST, DBT, and global consortia",
        ],
        challenges: [
          "Rapid evolution of emerging technology skills requiring continuous curriculum agility",
          "Attracting and retaining senior tier-1 academic researchers",
        ],
      },
    },
    criteriaBreakdown: criteria,
    verificationHash: `NAAC-SSR-${hash}`,
    compiledAt: new Date().toISOString(),
  };
}

