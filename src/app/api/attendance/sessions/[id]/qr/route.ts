import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateRotatingQrToken } from "@/lib/attendance/qr-token";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            enrollments: { select: { studentId: true } },
          },
        },
        room: { select: { id: true, code: true, name: true } },
        records: {
          select: {
            id: true,
            status: true,
            timestamp: true,
            student: {
              select: {
                id: true,
                rollNumber: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Attendance session not found" }, { status: 404 });
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json({
        status: session.status,
        message: `Session is ${session.status.toLowerCase()}. QR rotation is inactive.`,
        presentCount: session.records.filter((r) => r.status === "PRESENT").length,
        enrolledCount: session.course.enrollments.length,
      });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const existingExpiresAt = session.qrExpiresAt
      ? Math.floor(session.qrExpiresAt.getTime() / 1000)
      : 0;

    let currentToken = session.qrCodeToken;
    let currentNonce = session.qrNonce;
    let currentExpiresAt = existingExpiresAt;
    const rotationSeconds = session.qrRotationSeconds || 15;

    // Rotate token if expired or missing
    if (!currentToken || currentExpiresAt <= nowSeconds + 1) {
      const generated = generateRotatingQrToken(session.id, rotationSeconds);
      currentToken = generated.token;
      currentNonce = generated.nonce;
      currentExpiresAt = generated.expiresAt;

      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          qrCodeToken: generated.token,
          qrNonce: generated.nonce,
          qrExpiresAt: new Date(generated.expiresAt * 1000),
        },
      });
    }

    const remainingSeconds = Math.max(0, currentExpiresAt - nowSeconds);
    const presentRecords = session.records.filter((r) => r.status === "PRESENT");

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      token: currentToken,
      nonce: currentNonce,
      expiresAt: currentExpiresAt,
      rotationSeconds,
      remainingSeconds,
      courseCode: session.course.code,
      courseTitle: session.course.title,
      roomName: session.room ? `${session.room.code} - ${session.room.name}` : "Lecture Hall",
      presentCount: presentRecords.length,
      enrolledCount: session.course.enrollments.length,
      recentCheckins: session.records.slice(0, 8).map((r) => ({
        id: r.id,
        name: `${r.student.user.firstName} ${r.student.user.lastName}`,
        rollNumber: r.student.rollNumber,
        time: r.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      })),
    });
  } catch (error) {
    console.error("Attendance Session QR Token Error:", error);
    return NextResponse.json({ error: "Failed to generate QR token" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Explicit token re-generation on demand
  return GET(req, { params });
}
