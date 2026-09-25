import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/admin-guard";
import { verifyRotatingQrToken } from "@/lib/attendance/qr-token";
import { verifyGeofenceProximity } from "@/lib/attendance/geofence";
import { verifyBleChallengeProof } from "@/lib/attendance/ble";
import { recordAttendanceException } from "@/lib/attendance/exceptions";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  // Step 1: Require authenticated user session
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      token,
      sessionId: explicitSessionId,
      latitude,
      longitude,
      accuracy,
      bleChallenge,
      rssi,
      deviceFingerprint,
    } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Attendance QR token is required" },
        { status: 400 }
      );
    }

    // Step 2: Resolve calling Student
    const userRole = auth.payload.role;
    let student = null;

    if (userRole === "STUDENT") {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId },
            { user: { email: auth.payload.email } },
          ],
        },
        include: { user: true },
      });
    } else {
      // If an admin or faculty tests scanning on behalf of a student, or in testing mode
      const targetStudentId = body.studentId;
      if (targetStudentId) {
        student = await prisma.student.findUnique({
          where: { id: targetStudentId },
          include: { user: true },
        });
      } else {
        student = await prisma.student.findFirst({
          include: { user: true },
        });
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: "No active student academic record linked to your account" },
        { status: 404 }
      );
    }

    // Step 3: Cryptographic verification of rotating token
    const tokenVerification = verifyRotatingQrToken(token, explicitSessionId);
    if (!tokenVerification.valid) {
      recordAttendanceException({
        institutionId: student.user.institutionId || "inst-apex-01",
        actor: student.user.email,
        actorRole: "STUDENT",
        category: "QR_FAILED",
        severity: "P2_MEDIUM",
        sessionId: explicitSessionId,
        reason: tokenVerification.error || "Invalid or expired attendance QR token",
        clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
      return NextResponse.json(
        { error: tokenVerification.error || "Invalid attendance token" },
        { status: 400 }
      );
    }

    const sessionId = tokenVerification.sessionId!;

    // Step 4: Verify session state and metadata
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: { select: { id: true, code: true, title: true } },
        room: { select: { id: true, code: true, name: true, latitude: true, longitude: true } },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Attendance session not found or has been revoked" },
        { status: 404 }
      );
    }

    if (session.status !== "ACTIVE") {
      recordAttendanceException({
        institutionId: student.user.institutionId || "inst-apex-01",
        actor: student.user.email,
        actorRole: "STUDENT",
        category: "LOCKED_SESSION_TAMPER",
        severity: "P0_CRITICAL",
        sessionId: session.id,
        courseCode: session.course.code,
        reason: `Scan attempt on ${session.status.toLowerCase()} session`,
        clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
      return NextResponse.json(
        { error: `Session is ${session.status.toLowerCase()}. You can only scan during an active attendance window.` },
        { status: 403 }
      );
    }

    // Step 5: Check Student Course Enrollment (Anti-Proxy / Unauthorized Student)
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: session.courseId,
        status: "ENROLLED",
      },
    });

    if (!enrollment) {
      recordAttendanceException({
        institutionId: student.user.institutionId || "inst-apex-01",
        actor: student.user.email,
        actorRole: "STUDENT",
        category: "UNENROLLED_SCAN",
        severity: "P1_HIGH",
        sessionId: session.id,
        courseCode: session.course.code,
        reason: `Student ${student.rollNumber} attempted check-in without course enrollment`,
        clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
      return NextResponse.json(
        {
          error: `You are not enrolled in ${session.course.code} (${session.course.title}). Only enrolled students may check in.`,
        },
        { status: 403 }
      );
    }

    // Step 6: Server-Side Geofence Validation
    let geofenceVerified = false;
    let distanceMeters: number | null = null;
    const sessionLat = session.latitude ?? session.room?.latitude;
    const sessionLng = session.longitude ?? session.room?.longitude;

    if (typeof latitude === "number" && typeof longitude === "number" && sessionLat && sessionLng) {
      const geoResult = verifyGeofenceProximity(
        { latitude, longitude, accuracy },
        { latitude: sessionLat, longitude: sessionLng },
        session.allowedRadiusMeters || 100
      );

      distanceMeters = geoResult.distanceMeters;
      geofenceVerified = geoResult.inGeofence;

      if (session.geofenceRequired && !geofenceVerified) {
        recordAttendanceException({
          institutionId: student.user.institutionId || "inst-apex-01",
          actor: student.user.email,
          actorRole: "STUDENT",
          category: "OUTSIDE_GEOFENCE",
          severity: "P1_HIGH",
          sessionId: session.id,
          courseCode: session.course.code,
          reason: `Student outside geofence (${distanceMeters}m away, max allowed ${session.allowedRadiusMeters}m)`,
          clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
        });
        return NextResponse.json(
          {
            error: `Geofence validation failed: You are ${distanceMeters}m away from the classroom. Maximum allowed radius is ${session.allowedRadiusMeters}m.`,
            distanceMeters,
            allowedRadiusMeters: session.allowedRadiusMeters,
          },
          { status: 403 }
        );
      }
    } else if (session.geofenceRequired) {
      recordAttendanceException({
        institutionId: student.user.institutionId || "inst-apex-01",
        actor: student.user.email,
        actorRole: "STUDENT",
        category: "OUTSIDE_GEOFENCE",
        severity: "P1_HIGH",
        sessionId: session.id,
        courseCode: session.course.code,
        reason: "Geolocation coordinates missing for geofenced session",
        clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
      });
      return NextResponse.json(
        { error: "Geolocation coordinates are strictly required for this attendance session. Please enable GPS permissions." },
        { status: 403 }
      );
    }

    // Step 7: Web Bluetooth (BLE) Proximity Validation
    let bluetoothVerified = false;
    if (session.bleRequired) {
      if (!bleChallenge) {
        recordAttendanceException({
          institutionId: student.user.institutionId || "inst-apex-01",
          actor: student.user.email,
          actorRole: "STUDENT",
          category: "BLE_MISMATCH",
          severity: "P1_HIGH",
          sessionId: session.id,
          courseCode: session.course.code,
          reason: "BLE beacon challenge missing for beacon-enforced session",
          clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
        });
        return NextResponse.json(
          { error: "Classroom Bluetooth Low Energy beacon verification is required for this lecture. Enable Bluetooth and scan the classroom beacon." },
          { status: 403 }
        );
      }

      const bleResult = verifyBleChallengeProof(
        bleChallenge,
        session.id,
        student.id,
        rssi
      );

      if (!bleResult.valid) {
        recordAttendanceException({
          institutionId: student.user.institutionId || "inst-apex-01",
          actor: student.user.email,
          actorRole: "STUDENT",
          category: "BLE_MISMATCH",
          severity: "P1_HIGH",
          sessionId: session.id,
          courseCode: session.course.code,
          reason: bleResult.error || "Classroom BLE beacon challenge verification failed",
          clientIp: req.headers.get("x-forwarded-for") || "127.0.0.1",
        });
        return NextResponse.json(
          { error: bleResult.error || "BLE Proximity verification failed" },
          { status: 403 }
        );
      }

      bluetoothVerified = true;
    } else if (bleChallenge) {
      const bleResult = verifyBleChallengeProof(bleChallenge, session.id, student.id, rssi);
      bluetoothVerified = bleResult.valid;
    }

    // Step 8: Duplicate Check (Idempotency)
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId: student.id,
        },
      },
    });

    if (existingRecord) {
      return NextResponse.json({
        success: true,
        alreadyMarked: true,
        message: "Attendance was already recorded for this lecture",
        record: {
          id: existingRecord.id,
          status: existingRecord.status,
          timestamp: existingRecord.timestamp,
          verificationMethod: existingRecord.verificationMethod,
        },
        student: {
          name: `${student.user.firstName} ${student.user.lastName}`,
          rollNumber: student.rollNumber,
        },
        course: {
          code: session.course.code,
          title: session.course.title,
        },
      });
    }

    // Step 9: Check Late arrival threshold (e.g. > 15 mins past start time)
    let recordStatus = "PRESENT";
    if (session.startTime && session.startTime.includes(":")) {
      const [startH, startM] = session.startTime.split(":").map(Number);
      const now = new Date();
      const sessionStartMin = startH * 60 + startM;
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const isToday = session.date.toISOString().split("T")[0] === now.toISOString().split("T")[0];
      if (isToday && currentMin > sessionStartMin + 15) {
        recordStatus = "LATE";
      }
    }

    // Step 10: Determine composite verification method
    let verificationMethod = "QR";
    if (bluetoothVerified && geofenceVerified) {
      verificationMethod = "COMBO";
    } else if (bluetoothVerified) {
      verificationMethod = "BLUETOOTH";
    } else if (geofenceVerified) {
      verificationMethod = "GEOFENCE";
    }

    // Step 11: Atomic Record Creation
    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        status: recordStatus,
        verificationMethod,
        qrVerified: true,
        bluetoothVerified,
        geofenceVerified,
        distanceMeters,
        verifiedAt: new Date(),
        deviceFingerprint: deviceFingerprint || null,
        markedBy: "STUDENT_SELF_SCAN",
      },
    });

    // Step 12: Recalculate Student Aggregate Attendance Rate
    const allStudentRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
    });
    const presentCount = allStudentRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE" || r.status === "EXCUSED"
    ).length;
    const updatedRate = allStudentRecords.length > 0
      ? Number(((presentCount / allStudentRecords.length) * 100).toFixed(1))
      : 100.0;
    await prisma.student.update({
      where: { id: student.id },
      data: { attendanceRate: updatedRate },
    });

    logger.security("STUDENT_QR_ATTENDANCE_VERIFIED", student.user.email, {
      studentId: student.id,
      sessionId: session.id,
      courseCode: session.course.code,
      verificationMethod,
      distanceMeters,
      bluetoothVerified,
      status: recordStatus,
    });

    const nowFormattedTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const receipt = {
      receiptId: `REC-${record.id.slice(-8).toUpperCase()}`,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      rollNumber: student.rollNumber,
      courseCode: session.course.code,
      courseTitle: session.course.title,
      date: session.date.toISOString().split("T")[0],
      time: nowFormattedTime,
      status: record.status,
      verificationMethod,
      qrVerified: true,
      bluetoothVerified,
      geofenceVerified,
      distanceMeters,
      sessionRef: session.id,
      hash: record.id,
    };

    return NextResponse.json({
      success: true,
      message: `Attendance recorded successfully as ${record.status}`,
      record: {
        id: record.id,
        status: record.status,
        timestamp: record.timestamp,
        verificationMethod: record.verificationMethod,
        qrVerified: record.qrVerified,
        bluetoothVerified: record.bluetoothVerified,
        geofenceVerified: record.geofenceVerified,
        distanceMeters: record.distanceMeters,
      },
      receipt,
      student: {
        id: student.id,
        name: `${student.user.firstName} ${student.user.lastName}`,
        rollNumber: student.rollNumber,
        newAttendanceRate: updatedRate,
      },
      course: {
        code: session.course.code,
        title: session.course.title,
      },
      session: {
        id: session.id,
        date: session.date.toISOString().split("T")[0],
        startTime: session.startTime,
        room: session.room ? `${session.room.code} - ${session.room.name}` : "Lecture Hall",
      },
    });
  } catch (error) {
    console.error("Attendance QR Verify API Error:", error);
    return NextResponse.json(
      { error: "Internal server error during attendance verification" },
      { status: 500 }
    );
  }
}
