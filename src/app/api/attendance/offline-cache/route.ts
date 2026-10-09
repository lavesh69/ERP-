import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  signOfflineManifest,
  validateOfflineAttendanceRecords,
  OfflineSyncBatchPayload,
  OfflineAttendanceManifest,
} from "@/lib/attendance/offline-attendance-engine";
import { requireRoleAuth, FACULTY_LEADERSHIP_ROLES } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

/**
 * GET /api/attendance/offline-cache
 * Downloads offline pre-authorized attendance roster manifest with cryptographic signature
 */
export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    let courseId = searchParams.get("courseId");
    let sectionId = searchParams.get("sectionId");
    const validDate = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    // Resolve course
    let course = null;
    if (courseId) {
      course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { department: true, faculty: { include: { faculty: { include: { user: true } } } } },
      });
    } else {
      course = await prisma.course.findFirst({
        include: { department: true, faculty: { include: { faculty: { include: { user: true } } } } },
      });
    }

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    courseId = course.id;

    // Resolve section
    let section = null;
    if (sectionId) {
      section = await prisma.section.findUnique({ where: { id: sectionId } });
    } else {
      section = await prisma.section.findFirst({ where: { semesterId: course.semesterId } });
      if (!section) {
        section = await prisma.section.findFirst();
      }
    }

    if (!section) {
      return NextResponse.json({ error: "Academic section not found" }, { status: 404 });
    }
    sectionId = section.id;

    // Resolve faculty
    const primaryFaculty = course.faculty[0]?.faculty;
    const facultyId = primaryFaculty?.id || "fac-default";
    const facultyName = primaryFaculty?.user
      ? `${primaryFaculty.user.firstName} ${primaryFaculty.user.lastName}`
      : "Course Instructor";

    // Query enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: course.id },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    let roster = enrollments.map((e) => ({
      studentId: e.student.id,
      userId: e.student.userId,
      rollNumber: e.student.rollNumber,
      name: `${e.student.user.firstName || ""} ${e.student.user.lastName || ""}`.trim() || e.student.rollNumber,
      cgpa: e.student.cgpa,
    }));

    // If no course enrollments, fall back to section students
    if (roster.length === 0) {
      const sectionStudents = await prisma.student.findMany({
        where: { sectionId: section.id },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      roster = sectionStudents.map((s) => ({
        studentId: s.id,
        userId: s.userId,
        rollNumber: s.rollNumber,
        name: `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() || s.rollNumber,
        cgpa: s.cgpa,
      }));
    }

    const nonce = crypto.randomBytes(8).toString("hex");
    const manifestId = `OFFLINE-MAN-${Date.now().toString(36).toUpperCase()}-${nonce.substring(0, 4)}`;
    const digitalSignature = signOfflineManifest(courseId, sectionId, validDate, nonce);

    const manifest: OfflineAttendanceManifest = {
      manifestId,
      courseId,
      courseCode: course.code,
      courseTitle: course.title,
      sectionId,
      sectionName: section.name,
      facultyId,
      facultyName,
      validDate,
      roster,
      nonce,
      digitalSignature,
    };

    return NextResponse.json({
      success: true,
      manifest,
    });
  } catch (error: any) {
    logger.error("Failed to generate offline attendance manifest", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate offline manifest" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/attendance/offline-cache
 * Reconciles and batch-syncs offline attendance records into official attendance database
 */
export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body: OfflineSyncBatchPayload = await req.json();
    const {
      manifestId,
      courseId,
      sectionId,
      facultyId,
      sessionDate,
      startTime = "09:00",
      endTime = "10:00",
      roomId,
      method = "OFFLINE_QR",
      records = [],
    } = body;

    if (!courseId || !sectionId || !records) {
      return NextResponse.json(
        { error: "courseId, sectionId, and records are mandatory parameters" },
        { status: 400 }
      );
    }

    // Validate and deduplicate attendance records
    const validation = validateOfflineAttendanceRecords(records);

    // Resolve or find a valid faculty member to bind foreign key
    let resolvedFacultyId = facultyId;
    const existingFaculty = await prisma.faculty.findUnique({ where: { id: resolvedFacultyId } });
    if (!existingFaculty) {
      const anyFaculty = await prisma.faculty.findFirst();
      if (anyFaculty) {
        resolvedFacultyId = anyFaculty.id;
      }
    }

    // Upsert or create attendance session in database
    const sessionDateObj = new Date(sessionDate || new Date().toISOString());

    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId,
        sectionId,
        facultyId: resolvedFacultyId,
        roomId: roomId || null,
        date: sessionDateObj,
        startTime,
        endTime,
        method: "SMART_COMBO",
        status: "SUBMITTED",
      },
    });

    // Batch upsert records
    let persistedCount = 0;
    for (const item of validation.validRecords) {
      try {
        await prisma.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: attendanceSession.id,
              studentId: item.studentId,
            },
          },
          update: {
            status: item.status,
            verificationMethod: method === "OFFLINE_QR" ? "QR" : "MANUAL",
            qrVerified: method === "OFFLINE_QR",
            markedBy: "FACULTY_OFFLINE_SYNC",
          },
          create: {
            sessionId: attendanceSession.id,
            studentId: item.studentId,
            status: item.status,
            verificationMethod: method === "OFFLINE_QR" ? "QR" : "MANUAL",
            qrVerified: method === "OFFLINE_QR",
            markedBy: "FACULTY_OFFLINE_SYNC",
          },
        });
        persistedCount++;
      } catch (upsertErr) {
        logger.warn("Failed to upsert offline attendance record for student", {
          studentId: item.studentId,
          error: upsertErr,
        });
      }
    }

    // Dispatch audit log
    await logAuditEvent({
      institutionId: auth.payload.institutionId || "inst-apex-01",
      actorUserId: auth.payload.userId || "faculty",
      action: "OFFLINE_ATTENDANCE_BATCH_SYNC",
      targetEntity: "AttendanceSession",
      targetId: attendanceSession.id,
      details: {
        manifestId,
        courseId,
        sectionId,
        totalSubmitted: records.length,
        persistedCount,
        duplicatesDropped: validation.duplicatesCount,
        presentCount: validation.presentCount,
        absentCount: validation.absentCount,
      },
    });

    logger.info("Offline attendance batch synchronized successfully", {
      sessionId: attendanceSession.id,
      persistedCount,
      duplicatesDropped: validation.duplicatesCount,
    });

    return NextResponse.json({
      success: true,
      message: `Offline attendance reconciled successfully: ${persistedCount} records synced, ${validation.duplicatesCount} duplicate scans ignored.`,
      sessionId: attendanceSession.id,
      syncedRecordsCount: persistedCount,
      duplicateDroppedCount: validation.duplicatesCount,
      presentCount: validation.presentCount,
      absentCount: validation.absentCount,
      lateCount: validation.lateCount,
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Failed to process offline attendance batch sync", error);
    return NextResponse.json(
      { error: error.message || "Failed to process offline attendance batch" },
      { status: 500 }
    );
  }
}
