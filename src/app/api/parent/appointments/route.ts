import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const PARENT_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PARENT"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, PARENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const appointments = await prisma.studentRequest.findMany({
      where: {
        type: "ATTENDANCE_CORRECTION",
        title: { contains: "PTM" },
      },
      include: {
        student: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = appointments.map((a) => ({
      appointmentId: a.id,
      studentName: `${a.student.user.firstName} ${a.student.user.lastName}`,
      rollNumber: a.student.rollNumber,
      title: a.title,
      details: a.reason,
      status: a.status,
      requestedAt: a.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      appointments: formatted,
    });
  } catch (error: any) {
    logger.error("Parent appointments GET error", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, PARENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { studentId, preferredDate, preferredTimeSlot, discussionAgenda } = body;

    if (!studentId || !discussionAgenda) {
      return NextResponse.json({ error: "studentId and discussionAgenda are required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Ward student record not found" }, { status: 404 });
    }

    const slotTime = preferredTimeSlot || "15:00 - 15:30";
    const dateStr = preferredDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const appointment = await prisma.studentRequest.create({
      data: {
        studentId,
        type: "ATTENDANCE_CORRECTION",
        title: `Parent PTM Consultation Request: ${dateStr} (${slotTime})`,
        reason: `Discussion Topic: ${discussionAgenda}. Preferred Slot: ${dateStr} at ${slotTime}. Requested by: ${auth.payload.email}`,
        status: "UNDER_REVIEW",
      },
    });

    await logAuditEvent({
      institutionId: student.user.institutionId,
      actorUserId: auth.payload.userId || "parent",
      action: "PARENT_APPOINTMENT_REQUESTED",
      targetEntity: "StudentRequest",
      targetId: appointment.id,
      details: {
        wardRoll: student.rollNumber,
        slot: `${dateStr} ${slotTime}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Parent-Teacher consultation slot requested successfully. Course Mentor will confirm schedule.",
      appointment: {
        id: appointment.id,
        wardName: `${student.user.firstName} ${student.user.lastName}`,
        scheduledDate: dateStr,
        slot: slotTime,
        status: appointment.status,
      },
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Parent appointments POST error", error);
    return NextResponse.json({ error: "Failed to schedule appointment" }, { status: 500 });
  }
}
