import { prisma } from "@/lib/db/prisma";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface DatabaseBackupResult {
  success: boolean;
  filename: string;
  filePath: string;
  totalRecords: number;
  checksumSha256: string;
  fileSizeBytes: number;
  createdAt: string;
  tableCounts: Record<string, number>;
}

/**
 * Creates an enterprise cryptographic snapshot of all database entities
 */
export async function createDatabaseBackup(backupDir?: string): Promise<DatabaseBackupResult> {
  const targetDir = backupDir || path.join(process.cwd(), "backups");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const [
    institutions,
    campuses,
    departments,
    programs,
    users,
    students,
    faculty,
    courses,
    attendanceSessions,
    attendanceRecords,
    feeStructures,
    studentFees,
    paymentTransactions,
    assignments,
    submissions,
    exams,
    examResults,
    books,
    bookLoans,
    announcements,
    notifications,
    documents,
    auditLogs,
  ] = await Promise.all([
    prisma.institution.findMany(),
    prisma.campus.findMany(),
    prisma.department.findMany(),
    prisma.program.findMany(),
    prisma.user.findMany(),
    prisma.student.findMany(),
    prisma.faculty.findMany(),
    prisma.course.findMany(),
    prisma.attendanceSession.findMany(),
    prisma.attendanceRecord.findMany(),
    prisma.feeStructure.findMany(),
    prisma.studentFee.findMany(),
    prisma.paymentTransaction.findMany(),
    prisma.assignment.findMany(),
    prisma.submission.findMany(),
    prisma.exam.findMany(),
    prisma.examResult.findMany(),
    prisma.libraryBook.findMany(),
    prisma.bookLoan.findMany(),
    prisma.announcement.findMany(),
    prisma.notification.findMany(),
    prisma.academicDocument.findMany(),
    prisma.auditLog.findMany(),
  ]);

  const tableCounts = {
    institutions: institutions.length,
    campuses: campuses.length,
    departments: departments.length,
    programs: programs.length,
    users: users.length,
    students: students.length,
    faculty: faculty.length,
    courses: courses.length,
    attendanceSessions: attendanceSessions.length,
    attendanceRecords: attendanceRecords.length,
    feeStructures: feeStructures.length,
    studentFees: studentFees.length,
    paymentTransactions: paymentTransactions.length,
    assignments: assignments.length,
    submissions: submissions.length,
    exams: exams.length,
    examResults: examResults.length,
    books: books.length,
    bookLoans: bookLoans.length,
    announcements: announcements.length,
    notifications: notifications.length,
    documents: documents.length,
    auditLogs: auditLogs.length,
  };

  const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);

  const payload = {
    metadata: {
      system: "CLASSROOM Education Operating System",
      schemaVersion: "1.0.0",
      createdAt: new Date().toISOString(),
      totalRecords,
      tableCounts,
    },
    tables: {
      institutions,
      campuses,
      departments,
      programs,
      users,
      students,
      faculty,
      courses,
      attendanceSessions,
      attendanceRecords,
      feeStructures,
      studentFees,
      paymentTransactions,
      assignments,
      submissions,
      exams,
      examResults,
      books,
      bookLoans,
      announcements,
      notifications,
      documents,
      auditLogs,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const checksum = crypto.createHash("sha256").update(jsonString).digest("hex");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `classroom-backup-${timestamp}.json`;
  const filePath = path.join(targetDir, filename);

  fs.writeFileSync(filePath, jsonString, "utf8");
  const stats = fs.statSync(filePath);

  // Prune backups older than 30 days
  try {
    const files = fs.readdirSync(targetDir);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (f.startsWith("classroom-backup-") && f.endsWith(".json")) {
        const fullPath = path.join(targetDir, f);
        const fStats = fs.statSync(fullPath);
        if (fStats.mtimeMs < thirtyDaysAgo) {
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (err) {
    console.warn("Could not prune old backups:", err);
  }

  return {
    success: true,
    filename,
    filePath,
    totalRecords,
    checksumSha256: checksum,
    fileSizeBytes: stats.size,
    createdAt: payload.metadata.createdAt,
    tableCounts,
  };
}

/**
 * Validates integrity of a backup payload using SHA-256
 */
export function verifyBackupIntegrity(backupJson: string, expectedChecksum: string): boolean {
  const actualChecksum = crypto.createHash("sha256").update(backupJson).digest("hex");
  return actualChecksum === expectedChecksum;
}
