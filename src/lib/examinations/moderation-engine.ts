/**
 * Examination Moderation & Statistical Bell Curve Normalization Engine
 * Implements standard university senate moderation rules:
 * 1. Z-Score Gaussian Bell Curve scaling for high-failure examinations
 * 2. Statutory grace mark awards for borderline failure candidates (Condonation)
 * 3. Question difficulty compensatory allowance for defective/ambiguous questions
 */

import { calculateUgcLetterGrade } from "@/lib/grading/gpa-engine";

export interface ExamStatistics {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  passRatePercent: number;
  passCount: number;
  failCount: number;
  gradeDistribution: Record<string, number>;
}

export interface ModeratedStudentResult {
  studentId: string;
  originalMarks: number;
  moderatedMarks: number;
  deltaMarks: number;
  originalGrade: string;
  moderatedGrade: string;
  moderationReason: string;
}

/**
 * Computes descriptive statistical metrics for an array of examination scores
 */
export function calculateExamStatistics(
  marks: number[],
  passingThreshold: number = 40
): ExamStatistics {
  if (!marks || marks.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      variance: 0,
      passRatePercent: 0,
      passCount: 0,
      failCount: 0,
      gradeDistribution: {},
    };
  }

  const count = marks.length;
  const sorted = [...marks].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = parseFloat((sum / count).toFixed(2));

  let median: number;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = parseFloat(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
  } else {
    median = sorted[mid];
  }

  const squaredDiffs = sorted.map((val) => Math.pow(val - mean, 2));
  const variance = parseFloat((squaredDiffs.reduce((acc, v) => acc + v, 0) / count).toFixed(2));
  const standardDeviation = parseFloat(Math.sqrt(variance).toFixed(2));

  let passCount = 0;
  const gradeDistribution: Record<string, number> = {};

  for (const mark of sorted) {
    if (mark >= passingThreshold) {
      passCount++;
    }
    const grade = calculateUgcLetterGrade(mark).letter;
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  }

  const failCount = count - passCount;
  const passRatePercent = parseFloat(((passCount / count) * 100).toFixed(1));

  return {
    count,
    min,
    max,
    mean,
    median,
    standardDeviation,
    variance,
    passRatePercent,
    passCount,
    failCount,
    gradeDistribution,
  };
}

/**
 * Normalizes scores to a target Gaussian mean using z-score projection
 */
export function applyBellCurveModeration(
  records: { studentId: string; marksObtained: number }[],
  targetMean: number = 65,
  maxMarks: number = 100
): {
  results: ModeratedStudentResult[];
  beforeStats: ExamStatistics;
  afterStats: ExamStatistics;
} {
  const rawMarks = records.map((r) => r.marksObtained);
  const beforeStats = calculateExamStatistics(rawMarks);

  if (beforeStats.standardDeviation === 0) {
    // If standard deviation is 0, apply simple uniform shift
    const shift = targetMean - beforeStats.mean;
    const results = records.map((r) => {
      const moderated = Math.min(maxMarks, Math.max(0, Math.round(r.marksObtained + shift)));
      return {
        studentId: r.studentId,
        originalMarks: r.marksObtained,
        moderatedMarks: moderated,
        deltaMarks: moderated - r.marksObtained,
        originalGrade: calculateUgcLetterGrade(r.marksObtained).letter,
        moderatedGrade: calculateUgcLetterGrade(moderated).letter,
        moderationReason: `Uniform mean alignment (+${shift} marks)`,
      };
    });
    return {
      results,
      beforeStats,
      afterStats: calculateExamStatistics(results.map((r) => r.moderatedMarks)),
    };
  }

  const results: ModeratedStudentResult[] = records.map((r) => {
    const zScore = (r.marksObtained - beforeStats.mean) / beforeStats.standardDeviation;
    // Scale with target mean while maintaining spread
    let moderated = Math.round(targetMean + zScore * beforeStats.standardDeviation);
    moderated = Math.min(maxMarks, Math.max(0, moderated));

    return {
      studentId: r.studentId,
      originalMarks: r.marksObtained,
      moderatedMarks: moderated,
      deltaMarks: moderated - r.marksObtained,
      originalGrade: calculateUgcLetterGrade(r.marksObtained).letter,
      moderatedGrade: calculateUgcLetterGrade(moderated).letter,
      moderationReason: `Gaussian Bell Curve scaling (z=${zScore.toFixed(2)}, target μ=${targetMean})`,
    };
  });

  const afterStats = calculateExamStatistics(results.map((r) => r.moderatedMarks));

  return {
    results,
    beforeStats,
    afterStats,
  };
}

/**
 * Lifts borderline failing students across the passing threshold
 */
export function applyGraceMarkModeration(
  records: { studentId: string; marksObtained: number }[],
  passingMarks: number = 40,
  maxGraceMarks: number = 5
): {
  results: ModeratedStudentResult[];
  beforeStats: ExamStatistics;
  afterStats: ExamStatistics;
  graceBeneficiariesCount: number;
} {
  const beforeStats = calculateExamStatistics(records.map((r) => r.marksObtained), passingMarks);
  let graceBeneficiariesCount = 0;

  const results: ModeratedStudentResult[] = records.map((r) => {
    const raw = r.marksObtained;
    const deficit = passingMarks - raw;

    let moderated = raw;
    let reason = "No grace modification required";

    if (deficit > 0 && deficit <= maxGraceMarks) {
      moderated = passingMarks;
      graceBeneficiariesCount++;
      reason = `Borderline condonation waiver: +${deficit} grace mark(s) awarded`;
    }

    return {
      studentId: r.studentId,
      originalMarks: raw,
      moderatedMarks: moderated,
      deltaMarks: moderated - raw,
      originalGrade: calculateUgcLetterGrade(raw).letter,
      moderatedGrade: calculateUgcLetterGrade(moderated).letter,
      moderationReason: reason,
    };
  });

  const afterStats = calculateExamStatistics(results.map((r) => r.moderatedMarks), passingMarks);

  return {
    results,
    beforeStats,
    afterStats,
    graceBeneficiariesCount,
  };
}
