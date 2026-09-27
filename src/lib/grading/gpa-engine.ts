/**
 * Academic GPA, UGC 10-Point CBCS Scale & Degree Honors Classification Engine
 */

export interface GradeScale {
  letter: string;
  points: number;
  minPercent: number;
}

export const STANDARD_GRADE_SCALE: GradeScale[] = [
  { letter: "A+", points: 10.0, minPercent: 90 },
  { letter: "A", points: 9.0, minPercent: 80 },
  { letter: "B+", points: 8.0, minPercent: 70 },
  { letter: "B", points: 7.0, minPercent: 60 },
  { letter: "C", points: 6.0, minPercent: 50 },
  { letter: "D", points: 5.0, minPercent: 40 },
  { letter: "F", points: 0.0, minPercent: 0 },
];

export function calculateLetterGrade(percent: number): { letter: string; points: number } {
  for (const grade of STANDARD_GRADE_SCALE) {
    if (percent >= grade.minPercent) {
      return { letter: grade.letter, points: grade.points };
    }
  }
  return { letter: "F", points: 0.0 };
}

export const calculateLetterAndGradePoints = calculateLetterGrade;

// ============================================================
// UGC 10-POINT CHOICE BASED CREDIT SYSTEM (CBCS)
// ============================================================

export interface UgcGradeDefinition {
  letter: string;
  points: number;
  description: string;
  minPercent: number;
  isPassed: boolean;
}

export const UGC_10_POINT_SCALE: UgcGradeDefinition[] = [
  { letter: "O", points: 10.0, description: "Outstanding", minPercent: 90.0, isPassed: true },
  { letter: "A+", points: 9.0, description: "Excellent", minPercent: 80.0, isPassed: true },
  { letter: "A", points: 8.0, description: "Very Good", minPercent: 70.0, isPassed: true },
  { letter: "B+", points: 7.0, description: "Good", minPercent: 60.0, isPassed: true },
  { letter: "B", points: 6.0, description: "Above Average", minPercent: 55.0, isPassed: true },
  { letter: "C", points: 5.0, description: "Average", minPercent: 50.0, isPassed: true },
  { letter: "P", points: 4.0, description: "Pass", minPercent: 40.0, isPassed: true },
  { letter: "F", points: 0.0, description: "Fail (Arrear)", minPercent: 0.0, isPassed: false },
];

export function calculateUgcLetterGrade(
  percentage: number,
  isAbsent: boolean = false
): UgcGradeDefinition {
  if (isAbsent) {
    return {
      letter: "AB",
      points: 0.0,
      description: "Absent",
      minPercent: 0.0,
      isPassed: false,
    };
  }

  for (const scale of UGC_10_POINT_SCALE) {
    if (percentage >= scale.minPercent) {
      return scale;
    }
  }

  return {
    letter: "F",
    points: 0.0,
    description: "Fail (Arrear)",
    minPercent: 0.0,
    isPassed: false,
  };
}

// ============================================================
// RELATIVE GRADING (BELL CURVE / NORMAL DISTRIBUTION)
// ============================================================

export interface RelativeGradeScore {
  studentId: string;
  rawMarks: number;
  totalMarks: number;
  percentage: number;
  zScore: number;
  letter: string;
  points: number;
}

export interface RelativeGradingResult {
  mean: number;
  standardDeviation: number;
  candidateCount: number;
  passCount: number;
  passPercentage: number;
  grades: RelativeGradeScore[];
}

export function calculateRelativeGrades(
  scores: { studentId: string; marksObtained: number; totalMarks: number }[]
): RelativeGradingResult {
  if (scores.length === 0) {
    return {
      mean: 0,
      standardDeviation: 0,
      candidateCount: 0,
      passCount: 0,
      passPercentage: 0,
      grades: [],
    };
  }

  const percentages = scores.map((s) => ({
    studentId: s.studentId,
    rawMarks: s.marksObtained,
    totalMarks: s.totalMarks,
    percentage: Number(((s.marksObtained / s.totalMarks) * 100).toFixed(2)),
  }));

  const sum = percentages.reduce((acc, p) => acc + p.percentage, 0);
  const mean = Number((sum / percentages.length).toFixed(2));

  const variance =
    percentages.reduce((acc, p) => acc + Math.pow(p.percentage - mean, 2), 0) /
    percentages.length;
  const standardDeviation = Number(Math.sqrt(variance).toFixed(2)) || 1.0;

  const grades: RelativeGradeScore[] = percentages.map((p) => {
    const zScore = Number(((p.percentage - mean) / standardDeviation).toFixed(2));
    let letter = "F";
    let points = 0.0;

    // Relative bounds with absolute floor (min 35% required to pass)
    if (p.percentage < 35.0) {
      letter = "F";
      points = 0.0;
    } else if (zScore >= 1.25) {
      letter = "O";
      points = 10.0;
    } else if (zScore >= 0.75) {
      letter = "A+";
      points = 9.0;
    } else if (zScore >= 0.25) {
      letter = "A";
      points = 8.0;
    } else if (zScore >= -0.25) {
      letter = "B+";
      points = 7.0;
    } else if (zScore >= -0.75) {
      letter = "B";
      points = 6.0;
    } else if (zScore >= -1.25) {
      letter = "C";
      points = 5.0;
    } else {
      letter = "P";
      points = 4.0;
    }

    return {
      studentId: p.studentId,
      rawMarks: p.rawMarks,
      totalMarks: p.totalMarks,
      percentage: p.percentage,
      zScore,
      letter,
      points,
    };
  });

  const passCount = grades.filter((g) => g.letter !== "F").length;
  const passPercentage = Number(((passCount / grades.length) * 100).toFixed(1));

  return {
    mean,
    standardDeviation,
    candidateCount: scores.length,
    passCount,
    passPercentage,
    grades,
  };
}

// ============================================================
// MODERATION & GRACE MARKS POLICY
// ============================================================

export interface GraceMarksResult {
  originalMarks: number;
  finalMarks: number;
  graceApplied: number;
  passedWithGrace: boolean;
  notes: string;
}

/**
 * University Condonation Rule: If candidate is within maxGraceAllowed marks
 * from passing cutoff (40%), grant grace marks to clear the course.
 */
export function applyGraceMarks(
  marks: number,
  totalMarks: number,
  maxGraceAllowed: number = 3
): GraceMarksResult {
  const passingMarks = totalMarks * 0.4; // 40% cutoff
  const shortfall = passingMarks - marks;

  if (marks >= passingMarks) {
    return {
      originalMarks: marks,
      finalMarks: marks,
      graceApplied: 0,
      passedWithGrace: false,
      notes: "Candidate has already cleared course without grace.",
    };
  }

  if (shortfall > 0 && shortfall <= maxGraceAllowed) {
    return {
      originalMarks: marks,
      finalMarks: passingMarks,
      graceApplied: shortfall,
      passedWithGrace: true,
      notes: `Passed with University Senate Grace Marks (+${shortfall.toFixed(1)} awarded).`,
    };
  }

  return {
    originalMarks: marks,
    finalMarks: marks,
    graceApplied: 0,
    passedWithGrace: false,
    notes: `Shortfall (${shortfall.toFixed(1)} marks) exceeds maximum permissible grace limit (${maxGraceAllowed}).`,
  };
}

// ============================================================
// DEGREE HONORS & ACADEMIC STANDING
// ============================================================

export type AcademicHonorsClassification =
  | "FIRST_CLASS_DISTINCTION"
  | "FIRST_CLASS"
  | "SECOND_CLASS"
  | "PASS_CLASS"
  | "ACADEMIC_PROBATION";

export function classifyAcademicStanding(
  cgpa: number,
  backlogsCount: number
): {
  classification: AcademicHonorsClassification;
  label: string;
  badgeColor: string;
} {
  if (backlogsCount > 0 || cgpa < 5.0) {
    if (cgpa < 4.0 || backlogsCount >= 3) {
      return {
        classification: "ACADEMIC_PROBATION",
        label: "Academic Probation (Arrears Pending)",
        badgeColor: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800",
      };
    }
    return {
      classification: "PASS_CLASS",
      label: "Pass Class (Clearance Underway)",
      badgeColor: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800",
    };
  }

  if (cgpa >= 8.5) {
    return {
      classification: "FIRST_CLASS_DISTINCTION",
      label: "First Class with Distinction (University Honors)",
      badgeColor: "text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700",
    };
  }

  if (cgpa >= 6.5) {
    return {
      classification: "FIRST_CLASS",
      label: "First Class",
      badgeColor: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-700",
    };
  }

  return {
    classification: "SECOND_CLASS",
    label: "Second Class",
    badgeColor: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-700",
  };
}

// ============================================================
// SEMESTER GPA & CUMULATIVE CGPA CALCULATOR
// ============================================================

export interface CourseGradeEntry {
  courseCode: string;
  courseTitle?: string;
  credits: number;
  gradePoints: number;
  letterGrade?: string;
}

export function calculateSemesterGPA(courses: CourseGradeEntry[]): number {
  if (courses.length === 0) return 0.0;
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  if (totalCredits === 0) return 0.0;
  const totalWeightedPoints = courses.reduce((acc, c) => acc + c.credits * c.gradePoints, 0);
  return Number((totalWeightedPoints / totalCredits).toFixed(2));
}

export function calculateCumulativeCGPA(semesterGPAs: { gpa: number; credits: number }[]): number {
  if (semesterGPAs.length === 0) return 0.0;
  const totalCredits = semesterGPAs.reduce((acc, s) => acc + s.credits, 0);
  if (totalCredits === 0) return 0.0;
  const weighted = semesterGPAs.reduce((acc, s) => acc + s.gpa * s.credits, 0);
  return Number((weighted / totalCredits).toFixed(2));
}
