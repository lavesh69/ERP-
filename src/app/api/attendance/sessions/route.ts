import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";
import { generateRotatingQrToken } from "@/lib/attendance/qr-token";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const status = searchParams.get("status");
    const activeOnly = searchParams.get("active") === "true";

    const whereClause: any = {};
    if (courseId) whereClause.courseId = courseId;
    if (status) whereClause.status = status;
    else if (activeOnly) whereClause.status = "ACTIVE";

    // If user is faculty, prioritize courses they teach
    if (session && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(session.role)) {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [{ userId: session.userId }, { user: { email: session.email } }],
        },
      });
      if (faculty && !courseId) {
        whereClause.facultyId = faculty.id;
      }
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        course: { select: { id: true, code: true, title: true } },
        faculty: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        section: { select: { id: true, name: true } },
        room: { select: { id: true, code: true, name: true, latitude: true, longitude: true } },
        records: {
          select: {
            id: true,
            status: true,
            verificationMethod: true,
            qrVerified: true,
            bluetoothVerified: true,
            geofenceVerified: true,
            studentId: true,
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formattedSessions = sessions.map((s) => {
      const presentCount = s.records.filter((r) => r.status === "PRESENT").length;
      const lateCount = s.records.filter((r) => r.status === "LATE").length;
      const absentCount = s.records.filter((r) => r.status === "ABSENT").length;

      return {
        id: s.id,
        courseId: s.courseId,
        courseCode: s.course.code,
        courseTitle: s.course.title,
        facultyName: `${s.faculty.user.firstName} ${s.faculty.user.lastName}`,
        sectionName: s.section.name,
        room: s.room ? `${s.room.code} - ${s.room.name}` : "Lecture Hall",
        date: s.date.toISOString().split("T")[0],
        startTime: s.startTime,
        endTime: s.endTime,
        method: s.method,
        status: s.status,
        qrExpiresAt: s.qrExpiresAt,
        qrRotationSeconds: s.qrRotationSeconds,
        allowedRadiusMeters: s.allowedRadiusMeters,
        bleRequired: s.bleRequired,
        geofenceRequired: s.geofenceRequired,
        presentCount,
        lateCount,
        absentCount,
        totalRecords: s.records.length,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (error) {
    console.error("Attendance Sessions GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      courseId,
      courseCode,
      sectionId,
      roomId,
      method = "SMART_COMBO",
      qrRotationSeconds = 15,
      allowedRadiusMeters = 100,
      latitude,
      longitude,
      bleDeviceId,
      bleBeaconId,
      bleRequired = false,
      geofenceRequired = false,
    } = body;

    // Resolve course
    let targetCourse = null;
    if (courseId) {
      targetCourse = await prisma.course.findUnique({
        where: { id: courseId },
        include: { faculty: true },
      });
    } else if (courseCode) {
      targetCourse = await prisma.course.findFirst({
        where: { code: courseCode },
        include: { faculty: true },
      });
    }

    if (!targetCourse) {
      return NextResponse.json({ error: "Valid course ID or course code is required" }, { status: 400 });
    }

    // Resolve Faculty
    let targetFacultyId = targetCourse.faculty[0]?.facultyId;
    if (auth.payload.role === "FACULTY" || auth.payload.role === "PROFESSOR") {
      const facultyRecord = await prisma.faculty.findFirst({
        where: {
          OR: [{ userId: auth.payload.userId }, { user: { email: auth.payload.email } }],
        },
      });
      if (facultyRecord) {
        targetFacultyId = facultyRecord.id;
      }
    }

    if (!targetFacultyId) {
      const fallbackFaculty = await prisma.faculty.findFirst();
      if (!fallbackFaculty) {
        return NextResponse.json({ error: "No faculty found to assign session" }, { status: 400 });
      }
      targetFacultyId = fallbackFaculty.id;
    }

    // Resolve Section
    let targetSectionId = sectionId;
    if (!targetSectionId) {
      const fallbackSection = await prisma.section.findFirst();
      if (!fallbackSection) {
        return NextResponse.json({ error: "No section found in institution" }, { status: 400 });
      }
      targetSectionId = fallbackSection.id;
    }

    // Resolve Room and Coordinates
    let resolvedRoomId = roomId || null;
    let resolvedLat = typeof latitude === "number" ? latitude : null;
    let resolvedLng = typeof longitude === "number" ? longitude : null;

    if (resolvedRoomId) {
      const room = await prisma.room.findUnique({ where: { id: resolvedRoomId } });
      if (room) {
        if (resolvedLat === null && room.latitude !== null) resolvedLat = room.latitude;
        if (resolvedLng === null && room.longitude !== null) resolvedLng = room.longitude;
      }
    } else {
      const defaultRoom = await prisma.room.findFirst();
      if (defaultRoom) {
        resolvedRoomId = defaultRoom.id;
        if (resolvedLat === null && defaultRoom.latitude !== null) resolvedLat = defaultRoom.latitude;
        if (resolvedLng === null && defaultRoom.longitude !== null) resolvedLng = defaultRoom.longitude;
      }
    }

    const now = new Date();
    const startTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const endHour = (now.getHours() + 1) % 24;
    const endTimeStr = `${String(endHour).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    // Create session in ACTIVE status
    const session = await prisma.attendanceSession.create({
      data: {
        courseId: targetCourse.id,
        facultyId: targetFacultyId,
        sectionId: targetSectionId,
        roomId: resolvedRoomId,
        date: now,
        startTime: startTimeStr,
        endTime: endTimeStr,
        method,
        qrRotationSeconds: Math.max(5, Math.min(120, qrRotationSeconds)),
        latitude: resolvedLat,
        longitude: resolvedLng,
        allowedRadiusMeters: allowedRadiusMeters || 100,
        bleDeviceId: bleDeviceId || null,
        bleBeaconId: bleBeaconId || null,
        bleRequired: Boolean(bleRequired),
        geofenceRequired: Boolean(geofenceRequired),
        status: "ACTIVE",
      },
      include: {
        course: { select: { id: true, code: true, title: true } },
        room: { select: { id: true, code: true, name: true, latitude: true, longitude: true } },
      },
    });

    // Generate initial dynamic rotating QR token
    const initialQr = generateRotatingQrToken(session.id, session.qrRotationSeconds);

    const updatedSession = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        qrCodeToken: initialQr.token,
        qrNonce: initialQr.nonce,
        qrExpiresAt: new Date(initialQr.expiresAt * 1000),
      },
    });

    logger.security("SMART_ATTENDANCE_SESSION_STARTED", auth.payload.email || "faculty", {
      sessionId: session.id,
      courseCode: targetCourse.code,
      method,
      bleRequired,
      geofenceRequired,
    });

    return NextResponse.json({
      message: "Attendance session started successfully",
      session: {
        id: session.id,
        courseId: targetCourse.id,
        courseCode: targetCourse.code,
        courseTitle: targetCourse.title,
        status: updatedSession.status,
        startTime: session.startTime,
        endTime: session.endTime,
        qrToken: initialQr.token,
        qrExpiresAt: updatedSession.qrExpiresAt,
        qrRotationSeconds: session.qrRotationSeconds,
        room: session.room ? `${session.room.code} - ${session.room.name}` : null,
        bleRequired: session.bleRequired,
        geofenceRequired: session.geofenceRequired,
        latitude: session.latitude,
        longitude: session.longitude,
        allowedRadiusMeters: session.allowedRadiusMeters,
      },
    });
  } catch (error) {
    console.error("Attendance Session Start Error:", error);
    return NextResponse.json({ error: "Failed to initialize attendance session" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { sessionId, action } = body; // action: "PAUSE", "RESUME", "CLOSE", "LOCK", "REOPEN"

    if (!sessionId || !action) {
      return NextResponse.json({ error: "sessionId and action (PAUSE, RESUME, CLOSE, LOCK, REOPEN) are required" }, { status: 400 });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }

    const upperAction = action.toUpperCase();
    const actionToTargetStatus: Record<string, string> = {
      PAUSE: "PAUSED",
      RESUME: "ACTIVE",
      REOPEN: "ACTIVE",
      CLOSE: "CLOSED",
      FINALIZE: "FINALIZED",
      LOCK: "LOCKED",
      CANCEL: "CANCELLED",
    };

    const targetStatus = actionToTargetStatus[upperAction];
    if (!targetStatus) {
      return NextResponse.json(
        { error: `Invalid action: ${action}. Valid actions are PAUSE, RESUME, CLOSE, FINALIZE, LOCK, CANCEL, or REOPEN.` },
        { status: 400 }
      );
    }

    const currentStatus = session.status || "DRAFT";

    // Strict Finite State Machine Transition Validation
    const VALID_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ["ACTIVE", "CANCELLED"],
      ACTIVE: ["PAUSED", "CLOSED", "FINALIZED", "LOCKED"],
      PAUSED: ["ACTIVE", "CLOSED", "CANCELLED"],
      CLOSED: ["FINALIZED", "LOCKED", "ACTIVE"],
      FINALIZED: ["LOCKED", "ACTIVE"],
      LOCKED: ["ACTIVE"], // Reopen only allowed for authorized roles
      CANCELLED: [],
    };

    const allowedNextStates = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(targetStatus)) {
      return NextResponse.json(
        {
          error: `Invalid session transition: Cannot transition from '${currentStatus}' to '${targetStatus}' via action '${upperAction}'. Allowed next states: [${allowedNextStates.join(", ")}]`,
        },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let autoAbsenceCount = 0;

    switch (upperAction) {
      case "PAUSE":
        updateData = { status: "PAUSED", qrCodeToken: null, qrExpiresAt: null };
        break;
      case "RESUME":
      case "REOPEN": {
        const newQr = generateRotatingQrToken(session.id, session.qrRotationSeconds);
        updateData = {
          status: "ACTIVE",
          closedAt: null,
          qrCodeToken: newQr.token,
          qrNonce: newQr.nonce,
          qrExpiresAt: new Date(newQr.expiresAt * 1000),
        };
        break;
      }
      case "CANCEL":
        updateData = {
          status: "CANCELLED",
          closedAt: new Date(),
          qrCodeToken: null,
          qrExpiresAt: null,
        };
        break;
      case "CLOSE":
      case "FINALIZE":
      case "LOCK": {
        updateData = {
          status: targetStatus,
          closedAt: new Date(),
          qrCodeToken: null,
          qrExpiresAt: null,
        };

        // System Absence Engine: Enrolled students with no record are marked ABSENT
        const enrollmentWhere: any = { courseId: session.courseId, status: "ENROLLED" };
        if (session.sectionId) {
          enrollmentWhere.student = { sectionId: session.sectionId };
        }
        const enrollments = await prisma.enrollment.findMany({
          where: enrollmentWhere,
          select: { studentId: true },
        });

        const existingRecords = await prisma.attendanceRecord.findMany({
          where: { sessionId: session.id },
          select: { studentId: true },
        });

        const recordedIds = new Set(existingRecords.map((r) => r.studentId));
        const unmarkedEnrollees = enrollments.filter((e) => !recordedIds.has(e.studentId));

        if (unmarkedEnrollees.length > 0) {
          await prisma.attendanceRecord.createMany({
            data: unmarkedEnrollees.map((e) => ({
              sessionId: session.id,
              studentId: e.studentId,
              status: "ABSENT",
              remarks: `Auto-marked absent by System on session ${targetStatus.toLowerCase()}`,
              markedBy: "SYSTEM_AUTO_CLOSE",
              verificationMethod: "SYSTEM",
            })),
          });

          autoAbsenceCount = unmarkedEnrollees.length;

          // Recalculate attendance rates for newly absent students
          for (const e of unmarkedEnrollees) {
            const allRecs = await prisma.attendanceRecord.findMany({
              where: { studentId: e.studentId },
            });
            const presentCount = allRecs.filter(
              (r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED"
            ).length;
            const rate = allRecs.length > 0 ? Number(((presentCount / allRecs.length) * 100).toFixed(1)) : 100.0;
            await prisma.student.update({
              where: { id: e.studentId },
              data: { attendanceRate: rate },
            });
          }
        }
        break;
      }
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    logger.security(`ATTENDANCE_SESSION_${upperAction}`, auth.payload.email || "faculty", {
      sessionId,
      newStatus: updated.status,
      autoAbsenceCount,
    });

    return NextResponse.json({
      message: `Session successfully transitioned to ${updated.status}`,
      session: {
        id: updated.id,
        status: updated.status,
        closedAt: updated.closedAt,
        autoAbsenceCount,
      },
    });
  } catch (error) {
    console.error("Attendance Session PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update attendance session state" }, { status: 500 });
  }
}
