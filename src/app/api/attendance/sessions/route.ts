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
    const { sessionId, action } = body; // action: "PAUSE", "RESUME", "CLOSE"

    if (!sessionId || !action) {
      return NextResponse.json({ error: "sessionId and action (PAUSE, RESUME, CLOSE) are required" }, { status: 400 });
    }

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }

    let updateData: any = {};

    switch (action.toUpperCase()) {
      case "PAUSE":
        updateData = { status: "PAUSED", qrCodeToken: null };
        break;
      case "RESUME":
        const newQr = generateRotatingQrToken(session.id, session.qrRotationSeconds);
        updateData = {
          status: "ACTIVE",
          qrCodeToken: newQr.token,
          qrNonce: newQr.nonce,
          qrExpiresAt: new Date(newQr.expiresAt * 1000),
        };
        break;
      case "CLOSE":
        updateData = {
          status: "CLOSED",
          closedAt: new Date(),
          qrCodeToken: null,
          qrExpiresAt: null,
        };
        break;
      default:
        return NextResponse.json({ error: `Invalid action: ${action}. Must be PAUSE, RESUME, or CLOSE.` }, { status: 400 });
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    logger.security(`ATTENDANCE_SESSION_${action.toUpperCase()}`, auth.payload.email || "faculty", {
      sessionId,
      newStatus: updated.status,
    });

    return NextResponse.json({
      message: `Session successfully transitioned to ${updated.status}`,
      session: {
        id: updated.id,
        status: updated.status,
        closedAt: updated.closedAt,
      },
    });
  } catch (error) {
    console.error("Attendance Session PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update attendance session state" }, { status: 500 });
  }
}
