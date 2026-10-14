/**
 * CLASSROOM ERP — Smart Automated Substitute Faculty Allocation Engine
 * 
 * Provides automated constraint-solving substitute teacher allocation, enforcing
 * subject domain alignment, zero timetable clashes, AICTE/UGC workload caps (max 16/20 hrs/week),
 * and balanced department workload distribution when regular faculty take leave.
 */

import fs from "fs";
import path from "path";
import { logger } from "@/lib/logging/logger";

export interface LectureSlot {
  id?: string;
  dayOfWeek: string;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  courseId: string;
  courseCode: string;
  courseName: string;
  departmentId: string;
  roomId: string;
  roomName: string;
  sectionId: string;
  sectionName: string;
}

export interface CandidateFaculty {
  id: string;
  name: string;
  email: string;
  departmentId: string;
  designation: string; // "PROFESSOR" | "ASSOCIATE_PROFESSOR" | "ASSISTANT_PROFESSOR"
  specializations: string[];
  currentWeeklyHours: number;
  currentDayHours: number;
}

export interface SubstitutionCandidateResult {
  facultyId: string;
  facultyName: string;
  departmentId: string;
  designation: string;
  isEligible: boolean;
  score: number; // 0 to 100
  clashReason?: string;
  matchReasons: string[];
  currentWeeklyHours: number;
  maxAllowedHours: number;
}

export interface ConfirmedSubstitutionRecord {
  id: string;
  substitutionPassNumber: string;
  institutionId: string;
  absentFacultyId: string;
  absentFacultyName: string;
  substituteFacultyId: string;
  substituteFacultyName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomName: string;
  sectionName: string;
  status: "ASSIGNED" | "COMPLETED" | "CANCELLED";
  assignedByUserId: string;
  assignedAt: string;
}

const SUBSTITUTIONS_FILE_PATH = path.join(process.cwd(), "data", "faculty", "substitutions.json");

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadSubstitutions(): ConfirmedSubstitutionRecord[] {
  try {
    ensureDir(SUBSTITUTIONS_FILE_PATH);
    if (!fs.existsSync(SUBSTITUTIONS_FILE_PATH)) return [];
    return JSON.parse(fs.readFileSync(SUBSTITUTIONS_FILE_PATH, "utf-8"));
  } catch (err) {
    logger.warn("Failed to load substitutions file", { error: String(err) });
    return [];
  }
}

export function saveSubstitutions(records: ConfirmedSubstitutionRecord[]): void {
  ensureDir(SUBSTITUTIONS_FILE_PATH);
  fs.writeFileSync(SUBSTITUTIONS_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
}

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function slotsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = timeToMinutes(startA);
  const eA = timeToMinutes(endA);
  const sB = timeToMinutes(startB);
  const eB = timeToMinutes(endB);
  return Math.max(sA, sB) < Math.min(eA, eB);
}

export function evaluateSubstituteCandidates(
  targetSlot: LectureSlot,
  absentFacultyId: string,
  candidates: CandidateFaculty[],
  existingTimetableSlots: Array<{ facultyId: string; dayOfWeek: string; startTime: string; endTime: string }>
): SubstitutionCandidateResult[] {
  const slotDurationHours = (timeToMinutes(targetSlot.endTime) - timeToMinutes(targetSlot.startTime)) / 60;

  return candidates
    .filter((c) => c.id !== absentFacultyId)
    .map((candidate) => {
      const matchReasons: string[] = [];
      let score = 50; // base score

      // AICTE Workload Caps:
      // Professors / Assoc: max 16 hrs/week
      // Asst Professors: max 20 hrs/week
      const isSenior = candidate.designation.includes("PROFESSOR") && !candidate.designation.includes("ASSISTANT");
      const maxAllowedHours = isSenior ? 16 : 20;

      // 1. Check Timetable Clashes
      const facultyClashingSlot = existingTimetableSlots.find(
        (s) =>
          s.facultyId === candidate.id &&
          s.dayOfWeek.toUpperCase() === targetSlot.dayOfWeek.toUpperCase() &&
          slotsOverlap(targetSlot.startTime, targetSlot.endTime, s.startTime, s.endTime)
      );

      if (facultyClashingSlot) {
        return {
          facultyId: candidate.id,
          facultyName: candidate.name,
          departmentId: candidate.departmentId,
          designation: candidate.designation,
          isEligible: false,
          score: 0,
          clashReason: `Timetable collision: Already teaching lecture between ${facultyClashingSlot.startTime} and ${facultyClashingSlot.endTime}.`,
          matchReasons: [],
          currentWeeklyHours: candidate.currentWeeklyHours,
          maxAllowedHours,
        };
      }

      // 2. Check AICTE Weekly Workload Cap
      if (candidate.currentWeeklyHours + slotDurationHours > maxAllowedHours) {
        return {
          facultyId: candidate.id,
          facultyName: candidate.name,
          departmentId: candidate.departmentId,
          designation: candidate.designation,
          isEligible: false,
          score: 10,
          clashReason: `Exceeds AICTE statutory workload limit: currently ${candidate.currentWeeklyHours}h/${maxAllowedHours}h limit.`,
          matchReasons: [],
          currentWeeklyHours: candidate.currentWeeklyHours,
          maxAllowedHours,
        };
      }

      // 3. Department Matching Bonus
      if (candidate.departmentId === targetSlot.departmentId) {
        score += 30;
        matchReasons.push("Home Department faculty (specialized domain alignment)");
      } else {
        matchReasons.push("Inter-departmental faculty (allied discipline)");
      }

      // 4. Specialization Match Bonus
      const hasCourseKeyword = candidate.specializations.some((spec) =>
        targetSlot.courseName.toLowerCase().includes(spec.toLowerCase()) ||
        spec.toLowerCase().includes(targetSlot.courseCode.toLowerCase())
      );
      if (hasCourseKeyword) {
        score += 20;
        matchReasons.push("Demonstrated expertise in course syllabus & subject domain");
      }

      // 5. Daily Workload Balancing
      // Prefer faculty with fewer hours already scheduled today
      if (candidate.currentDayHours === 0) {
        score += 15;
        matchReasons.push("No prior lectures scheduled on this day (optimal focus)");
      } else if (candidate.currentDayHours <= 2) {
        score += 5;
        matchReasons.push(`Light daily teaching load (${candidate.currentDayHours}h today)`);
      } else {
        score -= 10;
      }

      return {
        facultyId: candidate.id,
        facultyName: candidate.name,
        departmentId: candidate.departmentId,
        designation: candidate.designation,
        isEligible: true,
        score: Math.min(100, Math.max(0, score)),
        matchReasons,
        currentWeeklyHours: candidate.currentWeeklyHours,
        maxAllowedHours,
      };
    })
    .sort((a, b) => {
      if (a.isEligible !== b.isEligible) return a.isEligible ? -1 : 1;
      return b.score - a.score;
    });
}

export function createSubstitutionAssignment(data: {
  institutionId: string;
  absentFacultyId: string;
  absentFacultyName: string;
  substituteFacultyId: string;
  substituteFacultyName: string;
  date: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomName: string;
  sectionName: string;
  assignedByUserId: string;
}): ConfirmedSubstitutionRecord {
  const records = loadSubstitutions();
  const passNum = `SUB-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const newRecord: ConfirmedSubstitutionRecord = {
    id: `SUB-REQ-${Date.now()}`,
    substitutionPassNumber: passNum,
    institutionId: data.institutionId,
    absentFacultyId: data.absentFacultyId,
    absentFacultyName: data.absentFacultyName,
    substituteFacultyId: data.substituteFacultyId,
    substituteFacultyName: data.substituteFacultyName,
    date: data.date,
    dayOfWeek: data.dayOfWeek,
    startTime: data.startTime,
    endTime: data.endTime,
    courseCode: data.courseCode,
    courseName: data.courseName,
    roomName: data.roomName,
    sectionName: data.sectionName,
    status: "ASSIGNED",
    assignedByUserId: data.assignedByUserId,
    assignedAt: new Date().toISOString(),
  };

  records.push(newRecord);
  saveSubstitutions(records);
  logger.info("Assigned substitute faculty to lecture slot", { passNumber: passNum, substituteId: data.substituteFacultyId });
  return newRecord;
}
