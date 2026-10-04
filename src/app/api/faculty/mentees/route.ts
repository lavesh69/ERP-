import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const FACULTY_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const institutionFilter =
      auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId
        ? { user: { institutionId: auth.payload.institutionId } }
        : {};

    const mentees = await prisma.student.findMany({
      where: institutionFilter,
      include: {
        user: true,
        program: true,
        section: true,
        requests: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
      take: 25,
      orderBy: { attendanceRate: "asc" },
    });

    const formatted = mentees.map((s) => ({
      studentId: s.id,
      name: `${s.user.firstName} ${s.user.lastName}`,
      rollNumber: s.rollNumber,
      program: s.program.code,
      semester: s.currentSemester,
      section: s.section?.name || "Section A",
      attendanceRate: s.attendanceRate,
      cgpa: s.cgpa,
      academicRisk: s.attendanceRate < 75.0 || s.cgpa < 2.5 ? "HIGH_RISK" : "ON_TRACK",
      recentRequests: s.requests.map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
      })),
    }));

    return NextResponse.json({
      success: true,
      mentor: auth.payload.email,
      totalMentees: formatted.length,
      highRiskCount: formatted.filter((m) => m.academicRisk === "HIGH_RISK").length,
      mentees: formatted,
    });
  } catch (error: any) {
    logger.error("Faculty mentees GET error", error);
    return NextResponse.json({ error: "Failed to retrieve mentee roster" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { studentId, meetingNotes, actionPlan, followUpDate } = body;

    if (!studentId || !meetingNotes) {
      return NextResponse.json({ error: "studentId and meetingNotes are required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const entry = await prisma.studentRequest.create({
      data: {
        studentId,
        type: "ACADEMIC_CORRECTION",
        title: `Mentoring Session: ${new Date().toISOString().split("T")[0]}`,
        reason: `Notes: ${meetingNotes}. Action Plan: ${actionPlan || "Attend remedial sessions"}. Next Review: ${followUpDate || "Two weeks"}`,
        status: "COMPLETED",
        reviewerRemarks: `Mentored by ${auth.payload.email}`,
        reviewedById: auth.payload.userId || "mentor",
      },
    });

    await logAuditEvent({
      institutionId: student.user.institutionId,
      actorUserId: auth.payload.userId || "mentor",
      action: "MENTORING_SESSION_LOGGED",
      targetEntity: "Student",
      targetId: studentId,
      details: {
        studentRoll: student.rollNumber,
        mentor: auth.payload.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pastoral mentoring record successfully logged for ${student.user.firstName}.`,
      session: entry,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Faculty mentees POST error", error);
    return NextResponse.json({ error: "Failed to log mentoring session" }, { status: 500 });
  }
}
