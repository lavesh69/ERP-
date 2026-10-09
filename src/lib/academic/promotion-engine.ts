export interface PromotionCandidateEvaluation {
  id: string;
  userId: string;
  rollNumber: string;
  admissionNumber: string;
  name: string;
  email: string;
  currentSemester: number;
  targetSemester: number;
  cgpa: number;
  attendanceRate: number;
  backlogsCount: number;
  failingCourses: string[];
  eligible: boolean;
  status: "ELIGIBLE" | "DETAINED_LOW_CGPA" | "DETAINED_EXCESS_BACKLOGS" | "GRADUATION_ELIGIBLE";
  decisionReason: string;
}

/**
 * Pure evaluation engine for student semester promotion and academic rollover.
 * Evaluates CGPA threshold, active course backlogs, and graduation completion.
 */
export function evaluateStudentPromotion(
  student: any,
  targetSemester: number,
  minCgpa: number,
  maxBacklogs: number,
  maxProgramSemesters: number
): PromotionCandidateEvaluation {
  const failingResults = (student.examResults || []).filter(
    (res: any) =>
      res.gradeLetter === "F" ||
      res.gradeLetter === "FAIL" ||
      (res.marksObtained != null && res.marksObtained < 40)
  );
  const failingEnrollments = (student.enrollments || []).filter(
    (enr: any) =>
      enr.grade === "F" ||
      enr.grade === "FAIL" ||
      enr.status === "FAILED"
  );

  const failingCourseCodes = new Set<string>();
  failingResults.forEach((r: any) => {
    if (r.exam?.course?.code) failingCourseCodes.add(r.exam.course.code);
    else if (r.exam?.title) failingCourseCodes.add(r.exam.title);
    else failingCourseCodes.add("Active Backlog");
  });
  failingEnrollments.forEach((e: any) => {
    if (e.course?.code) failingCourseCodes.add(e.course.code);
    else failingCourseCodes.add("Active Backlog");
  });

  const backlogsCount = failingCourseCodes.size;
  const isCgpaQualified = (student.cgpa ?? 0.0) >= minCgpa;
  const isBacklogQualified = backlogsCount <= maxBacklogs;
  const eligible = isCgpaQualified && isBacklogQualified;
  const isGraduation = targetSemester > maxProgramSemesters;

  let status: PromotionCandidateEvaluation["status"];
  let decisionReason: string;

  if (isGraduation && eligible) {
    status = "GRADUATION_ELIGIBLE";
    decisionReason = `Student has fulfilled academic requirements across all ${maxProgramSemesters} semesters with CGPA ${(student.cgpa ?? 0).toFixed(2)}. Eligible for degree conferral.`;
  } else if (eligible) {
    status = "ELIGIBLE";
    decisionReason = `Meets academic standards for promotion to Semester ${targetSemester} (CGPA: ${(student.cgpa ?? 0).toFixed(2)} >= ${minCgpa.toFixed(2)}, Backlogs: ${backlogsCount} <= ${maxBacklogs}).`;
  } else if (!isCgpaQualified && !isBacklogQualified) {
    status = "DETAINED_LOW_CGPA";
    decisionReason = `Detained: CGPA ${(student.cgpa ?? 0).toFixed(2)} is below minimum threshold (${minCgpa.toFixed(2)}) and backlogs (${backlogsCount}) exceed allowable limit (${maxBacklogs}).`;
  } else if (!isCgpaQualified) {
    status = "DETAINED_LOW_CGPA";
    decisionReason = `Detained on academic grounds: CGPA ${(student.cgpa ?? 0).toFixed(2)} is below minimum cutoff of ${minCgpa.toFixed(2)}.`;
  } else {
    status = "DETAINED_EXCESS_BACKLOGS";
    decisionReason = `Detained: ${backlogsCount} active backlogs exceed maximum statutory limit of ${maxBacklogs} (${Array.from(failingCourseCodes).join(", ")}).`;
  }

  const name = student.user
    ? `${student.user.firstName || ""} ${student.user.lastName || ""}`.trim() || student.rollNumber
    : student.rollNumber;

  return {
    id: student.id,
    userId: student.userId,
    rollNumber: student.rollNumber,
    admissionNumber: student.admissionNumber,
    name,
    email: student.user?.email || "",
    currentSemester: student.currentSemester,
    targetSemester,
    cgpa: student.cgpa ?? 0.0,
    attendanceRate: student.attendanceRate ?? 100.0,
    backlogsCount,
    failingCourses: Array.from(failingCourseCodes),
    eligible,
    status,
    decisionReason,
  };
}
