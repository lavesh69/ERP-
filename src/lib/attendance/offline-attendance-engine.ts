import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";

const OFFLINE_SECRET = process.env.JWT_SECRET || "apex-offline-attendance-secret-2026";

export interface OfflineAttendanceRosterEntry {
  studentId: string;
  userId: string;
  rollNumber: string;
  name: string;
  cgpa: number;
}

export interface OfflineAttendanceManifest {
  manifestId: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  sectionId: string;
  sectionName: string;
  facultyId: string;
  facultyName: string;
  validDate: string; // YYYY-MM-DD
  roster: OfflineAttendanceRosterEntry[];
  nonce: string;
  digitalSignature: string;
}

export interface OfflineSyncRecordInput {
  studentId: string;
  rollNumber: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  timestamp: string;
  nonce: string;
  qrHash?: string;
}

export interface OfflineSyncBatchPayload {
  manifestId: string;
  courseId: string;
  sectionId: string;
  facultyId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  roomId?: string;
  method?: "OFFLINE_QR" | "OFFLINE_MANUAL" | "OFFLINE_BIOMETRIC";
  records: OfflineSyncRecordInput[];
}

/**
 * Computes a tamper-evident digital HMAC-SHA256 signature for the offline manifest
 */
export function signOfflineManifest(courseId: string, sectionId: string, validDate: string, nonce: string): string {
  return crypto
    .createHmac("sha256", OFFLINE_SECRET)
    .update(`${courseId}:${sectionId}:${validDate}:${nonce}`)
    .digest("hex");
}

/**
 * Verifies if an offline attendance manifest signature is authentic
 */
export function verifyOfflineManifestSignature(
  courseId: string,
  sectionId: string,
  validDate: string,
  nonce: string,
  signature: string
): boolean {
  const expected = signOfflineManifest(courseId, sectionId, validDate, nonce);
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

/**
 * Deduplicates and validates offline sync attendance records
 */
export function validateOfflineAttendanceRecords(
  records: OfflineSyncRecordInput[]
): {
  validRecords: OfflineSyncRecordInput[];
  duplicatesCount: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
} {
  const seenStudentIds = new Set<string>();
  const seenNonces = new Set<string>();
  const validRecords: OfflineSyncRecordInput[] = [];
  let duplicatesCount = 0;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  for (const record of records) {
    if (!record.studentId || seenStudentIds.has(record.studentId) || (record.nonce && seenNonces.has(record.nonce))) {
      duplicatesCount++;
      continue;
    }

    seenStudentIds.add(record.studentId);
    if (record.nonce) {
      seenNonces.add(record.nonce);
    }

    validRecords.push(record);

    if (record.status === "PRESENT") presentCount++;
    else if (record.status === "ABSENT") absentCount++;
    else if (record.status === "LATE") lateCount++;
  }

  return {
    validRecords,
    duplicatesCount,
    presentCount,
    absentCount,
    lateCount,
  };
}
