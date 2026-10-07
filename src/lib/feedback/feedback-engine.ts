/**
 * Enterprise Student Evaluation of Teaching (SET) & 360 Feedback Engine
 * Implements NAAC Criterion 1.4 & 2.7 continuous student feedback metrics,
 * Faculty Performance Index (FPI), and course satisfaction scoring.
 */

export type FeedbackSurveyType =
  | "COURSE_FACULTY_EVALUATION"
  | "EXIT_SURVEY_SENIORS"
  | "ALUMNI_CURRICULUM_SURVEY"
  | "FACILITY_INFRASTRUCTURE";

export type PerformanceBand = "EXCELLENT" | "VERY_GOOD" | "GOOD" | "SATISFACTORY" | "NEEDS_IMPROVEMENT";

export interface SurveyResponse {
  id: string;
  surveyRef: string;
  surveyType: FeedbackSurveyType;
  courseCode: string;
  courseName: string;
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  semester: number;
  academicYear: string;
  ratingPedagogy: number;        // 1 to 5
  ratingSyllabus: number;        // 1 to 5
  ratingPunctuality: number;     // 1 to 5
  ratingDoubtClearing: number;   // 1 to 5
  ratingCourseMaterial: number;  // 1 to 5
  overallScore: number;          // Computed average (out of 5.0)
  qualitativeRemarks?: string;
  isAnonymized: boolean;
  submittedAt: string;
}

export interface FacultyPerformanceIndex {
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  totalSubmissions: number;
  avgPedagogy: number;
  avgSyllabus: number;
  avgPunctuality: number;
  avgDoubtClearing: number;
  avgCourseMaterial: number;
  overallFPI: number; // Out of 5.0
  performanceBand: PerformanceBand;
}

/**
 * Calculates aggregated Faculty Performance Index (FPI) from student evaluation responses
 */
export function calculateFacultyPerformanceIndex(
  responses: SurveyResponse[],
  facultyId: string,
  facultyName: string,
  departmentCode: string
): FacultyPerformanceIndex {
  const matching = responses.filter((r) => r.facultyId === facultyId);

  if (matching.length === 0) {
    return {
      facultyId,
      facultyName,
      departmentCode,
      totalSubmissions: 0,
      avgPedagogy: 0,
      avgSyllabus: 0,
      avgPunctuality: 0,
      avgDoubtClearing: 0,
      avgCourseMaterial: 0,
      overallFPI: 0,
      performanceBand: "SATISFACTORY",
    };
  }

  const count = matching.length;
  const sumPedagogy = matching.reduce((sum, r) => sum + r.ratingPedagogy, 0);
  const sumSyllabus = matching.reduce((sum, r) => sum + r.ratingSyllabus, 0);
  const sumPunctuality = matching.reduce((sum, r) => sum + r.ratingPunctuality, 0);
  const sumDoubt = matching.reduce((sum, r) => sum + r.ratingDoubtClearing, 0);
  const sumMaterial = matching.reduce((sum, r) => sum + r.ratingCourseMaterial, 0);

  const avgPedagogy = Math.round((sumPedagogy / count) * 100) / 100;
  const avgSyllabus = Math.round((sumSyllabus / count) * 100) / 100;
  const avgPunctuality = Math.round((sumPunctuality / count) * 100) / 100;
  const avgDoubtClearing = Math.round((sumDoubt / count) * 100) / 100;
  const avgCourseMaterial = Math.round((sumMaterial / count) * 100) / 100;

  const rawOverall = (avgPedagogy + avgSyllabus + avgPunctuality + avgDoubtClearing + avgCourseMaterial) / 5;
  const overallFPI = Math.round(rawOverall * 100) / 100;

  let performanceBand: PerformanceBand = "SATISFACTORY";
  if (overallFPI >= 4.5) performanceBand = "EXCELLENT";
  else if (overallFPI >= 4.0) performanceBand = "VERY_GOOD";
  else if (overallFPI >= 3.5) performanceBand = "GOOD";
  else if (overallFPI >= 3.0) performanceBand = "SATISFACTORY";
  else performanceBand = "NEEDS_IMPROVEMENT";

  return {
    facultyId,
    facultyName,
    departmentCode,
    totalSubmissions: count,
    avgPedagogy,
    avgSyllabus,
    avgPunctuality,
    avgDoubtClearing,
    avgCourseMaterial,
    overallFPI,
    performanceBand,
  };
}

/**
 * Validates survey input ratings within strict 1-5 Likert range
 */
export function validateSurveySubmission(data: Partial<SurveyResponse>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.courseCode) errors.push("Course code is required");
  if (!data.facultyId) errors.push("Faculty ID is required");

  const ratings = [
    { label: "Pedagogy", val: data.ratingPedagogy },
    { label: "Syllabus Coverage", val: data.ratingSyllabus },
    { label: "Punctuality", val: data.ratingPunctuality },
    { label: "Doubt Clearing", val: data.ratingDoubtClearing },
    { label: "Course Material", val: data.ratingCourseMaterial },
  ];

  for (const r of ratings) {
    if (r.val === undefined || r.val === null || r.val < 1 || r.val > 5) {
      errors.push(`${r.label} rating must be an integer between 1 and 5`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
