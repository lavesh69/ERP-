import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const CLASS_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, CLASS_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const remarks = await prisma.studentRequest.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        type: "ATTENDANCE_CORRECTION",
        title: { contains: "Conduct" },
      },
      include: {
        student: {
          include: { user: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = remarks.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
      rollNumber: r.student.rollNumber,
      category: r.title,
      notes: r.reason,
      loggedBy: r.reviewerRemarks,
      timestamp: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      remarks: formatted,
    });
  } catch (error: any) {
    logger.error("Class remarks GET error", error);
    return NextResponse.json({ error: "Failed to fetch student remarks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, CLASS_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { studentId, category, remarks, parentMeetingSummary } = body;

    if (!studentId || !remarks) {
      return NextResponse.json({ error: "studentId and remarks are required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    const entry = await prisma.studentRequest.create({
      data: {
        studentId,
        type: "ATTENDANCE_CORRECTION",
        title: `Conduct & PTM Log: ${category || "General Feedback"}`,
        reason: `${remarks}${parentMeetingSummary ? ` | PTM Notes: ${parentMeetingSummary}` : ""}`,
        status: "COMPLETED",
        reviewerRemarks: `Recorded by Class Teacher: ${auth.payload.email}`,
        reviewedById: auth.payload.userId || "class_teacher",
      },
    });

    await logAuditEvent({
      institutionId: student.user.institutionId,
      actorUserId: auth.payload.userId || "class_teacher",
      action: "CLASS_TEACHER_REMARKS_RECORDED",
      targetEntity: "Student",
      targetId: studentId,
      details: {
        rollNumber: student.rollNumber,
        category,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Remarks successfully added to ${student.user.firstName}'s cumulative student dossier.`,
      entry,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Class remarks POST error", error);
    return NextResponse.json({ error: "Failed to log student remarks" }, { status: 500 });
  }
}
