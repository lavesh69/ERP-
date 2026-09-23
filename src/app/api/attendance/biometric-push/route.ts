import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { eventBus } from "@/lib/realtime/event-bus";
import { logger } from "@/lib/logging/logger";

export async function POST(req: NextRequest) {
  try {
    const deviceKey = req.headers.get("x-device-key") || req.headers.get("authorization");
    const configuredKey = process.env.BIOMETRIC_DEVICE_KEY || "apex-biometric-secret-2026";

    // Validate device authorization
    if (deviceKey && deviceKey.replace(/^Bearer\s+/i, "") !== configuredKey) {
      return NextResponse.json({ error: "Unauthorized hardware biometric device" }, { status: 401 });
    }

    const body = await req.json();
    const { deviceSerialNumber, courseCode, punches } = body;

    if (!punches || !Array.isArray(punches) || punches.length === 0) {
      return NextResponse.json({ error: "punches array cannot be empty" }, { status: 400 });
    }

    // Resolve course or default
    const course = await prisma.course.findFirst({
      where: courseCode ? { code: courseCode } : {},
      include: { faculty: true },
    });

    const facultyId = course?.faculty[0]?.facultyId || "fac-cs-01";
    const section = await prisma.section.findFirst();
    const sectionId = section?.id || "sec-a";

    // Create Biometric Attendance Session
    const attendanceSession = await prisma.attendanceSession.create({
      data: {
        courseId: course?.id || "cse-301",
        facultyId,
        sectionId,
        date: new Date(),
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5),
        method: "BIOMETRIC",
        status: "SUBMITTED",
        records: {
          create: punches.map((p: { studentId: string; status?: string }) => ({
            studentId: p.studentId,
            status: p.status || "PRESENT",
          })),
        },
      },
      include: { records: true },
    });

    // Broadcast SSE realtime event to active campus monitors
    eventBus.broadcast({
      type: "ATTENDANCE_PUNCH",
      payload: {
        deviceSerialNumber: deviceSerialNumber || "ZK-TECO-U300-CAMPUS-GATE",
        sessionId: attendanceSession.id,
        punchesCount: punches.length,
        timestamp: new Date().toISOString(),
      },
    });

    logger.info(`Biometric hardware batch processed: ${punches.length} student punches recorded.`);

    return NextResponse.json({
      success: true,
      sessionId: attendanceSession.id,
      punchedCount: punches.length,
      method: "BIOMETRIC",
      records: attendanceSession.records,
    });
  } catch (error: any) {
    logger.error("Biometric push ingestion error:", error);
    return NextResponse.json({ error: error.message || "Failed to ingest biometric data" }, { status: 500 });
  }
}
