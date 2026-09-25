/**
 * CLASSROOM Academic OS — Central Authoritative Attendance Calculation Engine
 * 
 * Strict academic attendance calculation rules:
 * - Attended = Present + Late + Excused
 * - Total Conducted = Present + Late + Absent + Excused
 * - Rate % = (Attended / Total Conducted) * 100
 * - Default Exam Threshold = 75.0%
 * - Defaulter Recovery = ceil((0.75 * Total - Attended) / 0.25)
 * - Safe Miss Margin = floor((Attended - 0.75 * Total) / 0.75)
 */

export interface AttendanceRecordLike {
  status: string; // "PRESENT" | "LATE" | "ABSENT" | "EXCUSED"
}

export interface AttendanceMetrics {
  totalConducted: number;
  attended: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  percentage: number;
  isDefaulter: boolean;
  requiredRate: number;
  classesNeededToRecover: number;
  safeAbsencesAllowed: number;
}

export const SENATE_EXAM_THRESHOLD = 75.0;

/**
 * Calculates attendance rate percentage given attended and total conducted counts
 */
export function calculateAttendancePercentage(
  attended: number,
  totalConducted: number
): number {
  if (totalConducted <= 0) return 100.0;
  return Number(((attended / totalConducted) * 100).toFixed(1));
}

/**
 * Determines whether a student is classified as an academic defaulter
 */
export function isDefaulter(
  percentage: number,
  threshold: number = SENATE_EXAM_THRESHOLD
): boolean {
  return percentage < threshold;
}

/**
 * Calculates the exact number of consecutive upcoming classes a student must attend
 * to raise their attendance back above the required threshold (e.g. 75%).
 * 
 * Derivation:
 * (Attended + x) / (Total + x) >= T / 100
 * x >= (T/100 * Total - Attended) / (1 - T/100)
 */
export function calculateClassesNeededToRecover(
  attended: number,
  totalConducted: number,
  requiredThreshold: number = SENATE_EXAM_THRESHOLD
): number {
  if (totalConducted <= 0) return 0;
  const targetFraction = requiredThreshold / 100;
  if (attended / totalConducted >= targetFraction) return 0;

  const numerator = targetFraction * totalConducted - attended;
  const denominator = 1 - targetFraction;
  return Math.max(1, Math.ceil(numerator / denominator));
}

/**
 * Calculates the maximum number of upcoming classes a student can miss without
 * dropping below the required threshold (e.g. 75%).
 * 
 * Derivation:
 * Attended / (Total + y) >= T / 100
 * y <= (Attended - T/100 * Total) / (T/100)
 */
export function calculateSafeAbsencesAllowed(
  attended: number,
  totalConducted: number,
  requiredThreshold: number = SENATE_EXAM_THRESHOLD
): number {
  if (totalConducted <= 0) return 0;
  const targetFraction = requiredThreshold / 100;
  if (attended / totalConducted < targetFraction) return 0;

  const numerator = attended - targetFraction * totalConducted;
  const denominator = targetFraction;
  return Math.max(0, Math.floor(numerator / denominator));
}

/**
 * Authoritative summary of attendance records
 */
export function computeAttendanceSummary(
  records: AttendanceRecordLike[],
  requiredThreshold: number = SENATE_EXAM_THRESHOLD
): AttendanceMetrics {
  let present = 0;
  let late = 0;
  let absent = 0;
  let excused = 0;

  for (const r of records) {
    const s = r.status?.toUpperCase();
    if (s === "PRESENT") present++;
    else if (s === "LATE") late++;
    else if (s === "ABSENT") absent++;
    else if (s === "EXCUSED") excused++;
  }

  const attended = present + late + excused;
  const totalConducted = records.length;
  const percentage = calculateAttendancePercentage(attended, totalConducted);
  const defaulter = isDefaulter(percentage, requiredThreshold);

  return {
    totalConducted,
    attended,
    present,
    late,
    absent,
    excused,
    percentage,
    isDefaulter: defaulter,
    requiredRate: requiredThreshold,
    classesNeededToRecover: defaulter
      ? calculateClassesNeededToRecover(attended, totalConducted, requiredThreshold)
      : 0,
    safeAbsencesAllowed: !defaulter
      ? calculateSafeAbsencesAllowed(attended, totalConducted, requiredThreshold)
      : 0,
  };
}
