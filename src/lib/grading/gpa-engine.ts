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

export interface CourseGradeEntry {
  courseCode: string;
  credits: number;
  gradePoints: number;
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
