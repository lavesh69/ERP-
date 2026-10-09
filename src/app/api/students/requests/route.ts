import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { z } from "zod";

const createRequestSchema = z.object({
  type: z.enum([
    "LEAVE",
    "ATTENDANCE_CORRECTION",
    "DOCUMENT_REQUEST",
    "CERTIFICATE",
    "ACADEMIC_CORRECTION",
    "RE_EVALUATION",
    "ELECTIVE_CHANGE",
    "GUARDIAN_LINK_REQUEST",
  ]),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(1000),
  attachmentUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isStudent = session.role === "STUDENT";

    let requests: any[] = [];
    if (isStudent) {
      // Find caller student
      const student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
      });

      if (!student) {
        return NextResponse.json({ requests: [] });
      }

      requests = await prisma.studentRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Faculty / Admin: view all institutional requests
      requests = await prisma.studentRequest.findMany({
        where: session.role !== "SUPER_ADMIN" && session.institutionId ? {
          student: { user: { institutionId: session.institutionId } },
        } : undefined,
        include: {
          student: {
            include: { user: true, program: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student ? `${r.student.user.firstName} ${r.student.user.lastName}` : undefined,
        rollNumber: r.student?.rollNumber,
        program: r.student?.program?.name,
        type: r.type,
        title: r.title,
        reason: r.reason,
        status: r.status,
        attachmentUrl: r.attachmentUrl,
        reviewerRemarks: r.reviewerRemarks,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized: Please log in to submit requests" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Resolve student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: session.userId },
          { user: { email: session.email } },
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student profile not found for this account" }, { status: 404 });
    }

    const newRequest = await prisma.studentRequest.create({
      data: {
        studentId: student.id,
        type: parsed.data.type,
        title: parsed.data.title,
        reason: parsed.data.reason,
        attachmentUrl: parsed.data.attachmentUrl || null,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Request '${parsed.data.title}' submitted successfully.`,
      request: newRequest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit request" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required to review requests" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { requestId, status, reviewerRemarks } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: "requestId and status are required" }, { status: 400 });
    }

    if (!["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existingRequest = await prisma.studentRequest.findUnique({
      where: { id: requestId },
      include: { student: { include: { user: true } } },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isStudent = session.role === "STUDENT";
    const isLeadershipOrFaculty = [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
    ].includes(session.role);

    // If caller is student, they are ONLY permitted to self-resolve GUARDIAN_LINK_REQUEST for their own profile
    if (isStudent) {
      const callerStudent = await prisma.student.findFirst({
        where: {
          OR: [{ userId: session.userId }, { user: { email: session.email } }],
        },
      });

      if (!callerStudent || callerStudent.id !== existingRequest.studentId || existingRequest.type !== "GUARDIAN_LINK_REQUEST") {
        return NextResponse.json(
          { error: "Forbidden: Students are only permitted to approve or reject their own guardian link requests." },
          { status: 403 }
        );
      }
    } else if (!isLeadershipOrFaculty) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient privileges to review academic requests." },
        { status: 403 }
      );
    } else if (session.role !== "SUPER_ADMIN" && session.institutionId && existingRequest.student.user.institutionId !== session.institutionId) {
      return NextResponse.json(
        { error: "Forbidden: Cannot review requests outside your institution" },
        { status: 403 }
      );
    }

    const reviewerId = session.userId || session.sub || "admin";

    // If guardian link request is approved, establish the StudentParentRelation
    if (status === "APPROVED" && existingRequest.type === "GUARDIAN_LINK_REQUEST") {
      let targetParentId = body.parentId || existingRequest.attachmentUrl;
      if (!targetParentId) {
        const emailMatch = existingRequest.reason.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) {
          const parentUser = await prisma.user.findUnique({
            where: { email: emailMatch[0] },
            include: { parentProfile: true },
          });
          if (parentUser?.parentProfile) {
            targetParentId = parentUser.parentProfile.id;
          }
        }
      }

      if (targetParentId) {
        await prisma.studentParentRelation.upsert({
          where: {
            studentId_parentId: {
              studentId: existingRequest.studentId,
              parentId: targetParentId,
            },
          },
          update: { isPrimary: true },
          create: {
            studentId: existingRequest.studentId,
            parentId: targetParentId,
            isPrimary: true,
          },
        });
      }
    }

    let correctedRecord: any = null;
    if (status === "APPROVED" && (existingRequest.type === "ATTENDANCE_CORRECTION" || existingRequest.type === "LEAVE")) {
      const correctionStatus = body.correctionStatus || "EXCUSED";
      const targetRecordId = body.attendanceRecordId;

      if (targetRecordId) {
        correctedRecord = await prisma.attendanceRecord.update({
          where: { id: targetRecordId },
          data: {
            status: correctionStatus,
            remarks: `Approved correction via request ${requestId}: ${reviewerRemarks || "Verified"}`,
          },
        });
      } else {
        const recentRecord = await prisma.attendanceRecord.findFirst({
          where: {
            studentId: existingRequest.studentId,
            status: { in: ["ABSENT", "LATE"] },
          },
          orderBy: { timestamp: "desc" },
        });

        if (recentRecord) {
          correctedRecord = await prisma.attendanceRecord.update({
            where: { id: recentRecord.id },
            data: {
              status: correctionStatus,
              remarks: `Approved correction via request ${requestId}: ${reviewerRemarks || "Verified"}`,
            },
          });
        }
      }

      if (correctedRecord) {
        await logAuditEvent({
          actorUserId: reviewerId,
          action: "ATTENDANCE_CHANGED",
          targetEntity: "AttendanceRecord",
          targetId: correctedRecord.id,
          details: {
            requestId,
            previousStatus: correctedRecord.status,
            newStatus: correctionStatus,
            studentId: existingRequest.studentId,
            reason: reviewerRemarks || existingRequest.reason,
          },
        });
      }
    }

    const updated = await prisma.studentRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewerRemarks: reviewerRemarks || null,
        reviewedById: reviewerId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Request status updated to '${status}'.`,
      request: updated,
      correctedAttendanceRecord: correctedRecord,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update request" }, { status: 500 });
  }
}
