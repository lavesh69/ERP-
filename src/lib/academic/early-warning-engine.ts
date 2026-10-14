/**
 * CLASSROOM ERP — Predictive Academic Early Warning & Dropout Risk Radar Engine
 * 
 * Computes multi-factorial scholar risk indices (0-100) combining attendance velocity,
 * continuous internal assessment (CIA) trajectories, bursar arrears, LMS engagement,
 * and wellbeing indicators to enable proactive institutional retention interventions.
 */

import fs from "fs";
import path from "path";
import { logger } from "@/lib/logging/logger";

export type RiskTier = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface RiskFactorEvaluation {
  category: "ATTENDANCE" | "ACADEMIC_CIA" | "FINANCIAL_ARREARS" | "LMS_ENGAGEMENT" | "WELLBEING";
  score: number; // 0 to 100
  weight: number; // 0.0 to 1.0
  weightedScore: number;
  triggerDescription: string;
  isFlagged: boolean;
}

export interface EarlyWarningProfile {
  studentId: string;
  studentName: string;
  rollNumber: string;
  programCode: string;
  currentSemester: number;
  compositeRiskScore: number; // 0 to 100
  riskTier: RiskTier;
  factors: RiskFactorEvaluation[];
  primaryDrivers: string[];
  recommendedInterventions: string[];
  lastEvaluatedAt: string;
}

export interface StudentInterventionRecord {
  id: string;
  studentId: string;
  institutionId: string;
  assignedCounselorId: string;
  counselorName: string;
  interventionType: "ACADEMIC_TUTORING" | "FINANCIAL_HARDSHIP" | "PARENT_CONFERENCE" | "WELLBEING_MENTORING" | "ATTENDANCE_CONTRACT";
  notes: string;
  status: "OPEN" | "IN_INTERVENTION" | "RESOLVED" | "ESCALATED";
  createdAt: string;
  updatedAt: string;
}

const INTERVENTIONS_FILE_PATH = path.join(process.cwd(), "data", "academic", "early_warning_interventions.json");

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadInterventions(): StudentInterventionRecord[] {
  try {
    ensureDirectoryExists(INTERVENTIONS_FILE_PATH);
    if (!fs.existsSync(INTERVENTIONS_FILE_PATH)) {
      return [];
    }
    const data = fs.readFileSync(INTERVENTIONS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    logger.warn("Failed to read early warning interventions file, returning empty array", { error: String(err) });
    return [];
  }
}

export function saveInterventions(records: StudentInterventionRecord[]): void {
  ensureDirectoryExists(INTERVENTIONS_FILE_PATH);
  fs.writeFileSync(INTERVENTIONS_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
}

export interface ScholarDataInput {
  studentId: string;
  studentName: string;
  rollNumber: string;
  programCode: string;
  currentSemester: number;
  attendanceRate: number; // 0 to 100
  recentAttendanceTrend?: number; // e.g. -10% or +2%
  ciaAveragePercentage: number; // 0 to 100
  backlogCount: number;
  feeDueAmount: number; // in INR / currency
  totalFeeAmount: number;
  unsubmittedAssignmentsCount: number;
  unresolvedGrievancesOrClinicVisits: number;
}

export function computeScholarRiskScore(input: ScholarDataInput): EarlyWarningProfile {
  const factors: RiskFactorEvaluation[] = [];

  // 1. Attendance Factor (Weight 0.30)
  // Under 75% triggers penalty; under 65% is severe
  let attScore = 0;
  let attDesc = "Attendance is optimal (above 85%).";
  let attFlagged = false;
  if (input.attendanceRate < 65) {
    attScore = 100;
    attDesc = `Critical attendance deficit: current rate is ${input.attendanceRate.toFixed(1)}% (below statutory 65% detention threshold).`;
    attFlagged = true;
  } else if (input.attendanceRate < 75) {
    attScore = 75;
    attDesc = `Shortage alert: attendance at ${input.attendanceRate.toFixed(1)}% is below mandatory 75% exam threshold.`;
    attFlagged = true;
  } else if (input.attendanceRate < 80) {
    attScore = 40;
    attDesc = `Borderline attendance rate: ${input.attendanceRate.toFixed(1)}%.`;
    attFlagged = false;
  }

  // Velocity penalty if trend is negative
  if (input.recentAttendanceTrend && input.recentAttendanceTrend < -5) {
    attScore = Math.min(100, attScore + 20);
    attDesc += ` Rapid deceleration of ${input.recentAttendanceTrend}% over recent weeks.`;
    attFlagged = true;
  }

  factors.push({
    category: "ATTENDANCE",
    score: attScore,
    weight: 0.30,
    weightedScore: attScore * 0.30,
    triggerDescription: attDesc,
    isFlagged: attFlagged,
  });

  // 2. Academic CIA & Backlog Factor (Weight 0.30)
  let ciaScore = 0;
  let ciaDesc = "Academic performance in continuous assessments is satisfactory.";
  let ciaFlagged = false;
  if (input.backlogCount >= 3) {
    ciaScore = 100;
    ciaDesc = `Critical academic hazard: ${input.backlogCount} active backlogs.`;
    ciaFlagged = true;
  } else if (input.backlogCount > 0) {
    ciaScore = 50 + (input.backlogCount * 15);
    ciaDesc = `${input.backlogCount} active course backlog(s) pending clearance.`;
    ciaFlagged = true;
  } else if (input.ciaAveragePercentage < 40) {
    ciaScore = 80;
    ciaDesc = `Internal assessment score average is critically low: ${input.ciaAveragePercentage.toFixed(1)}%.`;
    ciaFlagged = true;
  } else if (input.ciaAveragePercentage < 55) {
    ciaScore = 45;
    ciaDesc = `Borderline internal assessment score: ${input.ciaAveragePercentage.toFixed(1)}%.`;
    ciaFlagged = true;
  }

  factors.push({
    category: "ACADEMIC_CIA",
    score: ciaScore,
    weight: 0.30,
    weightedScore: ciaScore * 0.30,
    triggerDescription: ciaDesc,
    isFlagged: ciaFlagged,
  });

  // 3. Financial Arrears Factor (Weight 0.20)
  let feeScore = 0;
  let feeDesc = "Tuition and institutional dues are fully cleared.";
  let feeFlagged = false;
  const overdueRatio = input.totalFeeAmount > 0 ? (input.feeDueAmount / input.totalFeeAmount) : 0;
  if (input.feeDueAmount > 0 && overdueRatio > 0.5) {
    feeScore = 90;
    feeDesc = `Substantial outstanding fee arrears: ₹${input.feeDueAmount.toLocaleString()} (${(overdueRatio * 100).toFixed(0)}% of annual fees pending).`;
    feeFlagged = true;
  } else if (input.feeDueAmount > 0) {
    feeScore = 45;
    feeDesc = `Unsettled fee balance of ₹${input.feeDueAmount.toLocaleString()}.`;
    feeFlagged = true;
  }

  factors.push({
    category: "FINANCIAL_ARREARS",
    score: feeScore,
    weight: 0.20,
    weightedScore: feeScore * 0.20,
    triggerDescription: feeDesc,
    isFlagged: feeFlagged,
  });

  // 4. LMS Engagement Factor (Weight 0.10)
  let lmsScore = 0;
  let lmsDesc = "Course assignments and digital LMS submissions are up to date.";
  let lmsFlagged = false;
  if (input.unsubmittedAssignmentsCount >= 4) {
    lmsScore = 90;
    lmsDesc = `${input.unsubmittedAssignmentsCount} assignments missing or unsubmitted past deadlines.`;
    lmsFlagged = true;
  } else if (input.unsubmittedAssignmentsCount >= 2) {
    lmsScore = 50;
    lmsDesc = `${input.unsubmittedAssignmentsCount} overdue coursework tasks.`;
    lmsFlagged = true;
  }

  factors.push({
    category: "LMS_ENGAGEMENT",
    score: lmsScore,
    weight: 0.10,
    weightedScore: lmsScore * 0.10,
    triggerDescription: lmsDesc,
    isFlagged: lmsFlagged,
  });

  // 5. Wellbeing & Grievances Factor (Weight 0.10)
  let wellScore = 0;
  let wellDesc = "No recorded wellbeing distress signals or pending grievances.";
  let wellFlagged = false;
  if (input.unresolvedGrievancesOrClinicVisits >= 3) {
    wellScore = 80;
    wellDesc = `Multiple clinic triage logs or unresolved statutory grievances recorded (${input.unresolvedGrievancesOrClinicVisits}).`;
    wellFlagged = true;
  } else if (input.unresolvedGrievancesOrClinicVisits >= 1) {
    wellScore = 40;
    wellDesc = "Elevated health center visits or active grievance petition.";
    wellFlagged = false;
  }

  factors.push({
    category: "WELLBEING",
    score: wellScore,
    weight: 0.10,
    weightedScore: wellScore * 0.10,
    triggerDescription: wellDesc,
    isFlagged: wellFlagged,
  });

  // Compute composite weighted score
  const compositeScore = Math.round(
    factors.reduce((acc, curr) => acc + curr.weightedScore, 0)
  );

  let riskTier: RiskTier = "LOW";
  if (compositeScore >= 80) {
    riskTier = "CRITICAL";
  } else if (compositeScore >= 60) {
    riskTier = "HIGH";
  } else if (compositeScore >= 30) {
    riskTier = "MODERATE";
  }

  // Generate explainable primary drivers
  const primaryDrivers = factors
    .filter((f) => f.isFlagged)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .map((f) => f.triggerDescription);

  // Generate targeted actionable interventions
  const recommendedInterventions: string[] = [];
  if (attFlagged) {
    recommendedInterventions.push("Issue Statutory Attendance Warning & Assign Remedial Recovery Sessions");
  }
  if (ciaFlagged) {
    recommendedInterventions.push("Assign Faculty Peer Tutor & Schedule Midterm Makeup Assessment");
  }
  if (feeFlagged) {
    recommendedInterventions.push("Recommend Bursar Flexi-Pay 3-Installment Restructuring Plan");
  }
  if (lmsFlagged) {
    recommendedInterventions.push("Trigger Automated LMS Assignment Extension & Advisor Follow-up");
  }
  if (wellFlagged) {
    recommendedInterventions.push("Refer to Campus Student Welfare & Counseling Cell");
  }
  if (recommendedInterventions.length === 0) {
    recommendedInterventions.push("Scholar in Good Academic Standing — Maintain Routine Mentoring");
  }

  return {
    studentId: input.studentId,
    studentName: input.studentName,
    rollNumber: input.rollNumber,
    programCode: input.programCode,
    currentSemester: input.currentSemester,
    compositeRiskScore: compositeScore,
    riskTier,
    factors,
    primaryDrivers,
    recommendedInterventions,
    lastEvaluatedAt: new Date().toISOString(),
  };
}

export function recordIntervention(data: {
  studentId: string;
  institutionId: string;
  assignedCounselorId: string;
  counselorName: string;
  interventionType: StudentInterventionRecord["interventionType"];
  notes: string;
}): StudentInterventionRecord {
  const records = loadInterventions();
  const newRecord: StudentInterventionRecord = {
    id: `INTV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    studentId: data.studentId,
    institutionId: data.institutionId,
    assignedCounselorId: data.assignedCounselorId,
    counselorName: data.counselorName,
    interventionType: data.interventionType,
    notes: data.notes,
    status: "OPEN",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  records.push(newRecord);
  saveInterventions(records);
  logger.info("Recorded academic early-warning intervention", { interventionId: newRecord.id, studentId: data.studentId });
  return newRecord;
}

export function updateInterventionStatus(
  interventionId: string,
  newStatus: StudentInterventionRecord["status"],
  notesUpdate?: string
): StudentInterventionRecord | null {
  const records = loadInterventions();
  const idx = records.findIndex((r) => r.id === interventionId);
  if (idx === -1) return null;

  records[idx].status = newStatus;
  records[idx].updatedAt = new Date().toISOString();
  if (notesUpdate) {
    records[idx].notes += `\n[${new Date().toISOString()}] ${notesUpdate}`;
  }

  saveInterventions(records);
  return records[idx];
}
