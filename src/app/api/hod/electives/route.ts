import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const HOD_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, HOD_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode");

    const courseWhere: any = {};
    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      courseWhere.department = { campus: { institutionId: auth.payload.institutionId } };
    }
    if (courseCode) {
      courseWhere.code = courseCode;
    }

    const electiveCourses = await prisma.course.findMany({
      where: courseWhere,
      include: {
        department: true,
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const report = electiveCourses.map((c) => {
      const maxCap = 60;
      const enrolledCount = c.enrollments.length;
      return {
        courseId: c.id,
        code: c.code,
        title: c.title,
        credits: c.credits,
        department: c.department.name,
        capacity: maxCap,
        enrolledCount,
        availableSeats: Math.max(0, maxCap - enrolledCount),
        occupancyRate: Number(((enrolledCount / maxCap) * 100).toFixed(1)),
        isQuotaFull: enrolledCount >= maxCap,
        registeredStudents: c.enrollments.map((e) => ({
          studentId: e.student.id,
          name: `${e.student.user.firstName} ${e.student.user.lastName}`,
          rollNumber: e.student.rollNumber,
          enrolledAt: e.enrolledAt.toISOString(),
          status: e.status,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      count: report.length,
      electives: report,
    });
  } catch (error: any) {
    logger.error("HOD Electives GET error", error);
    return NextResponse.json({ error: "Failed to fetch departmental electives" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, HOD_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { courseId, action, studentIds } = body;

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { department: { include: { campus: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Tenant check
    if (
      auth.payload.role !== "SUPER_ADMIN" &&
      auth.payload.institutionId &&
      course.department.campus.institutionId !== auth.payload.institutionId
    ) {
      return NextResponse.json({ error: "Forbidden: Cross-tenant access denied" }, { status: 403 });
    }

    if (action === "LOCK_QUOTA") {
      await logAuditEvent({
        institutionId: course.department.campus.institutionId,
        actorUserId: auth.payload.userId || "hod",
        action: "ELECTIVE_QUOTA_LOCKED",
        targetEntity: "Course",
        targetId: course.id,
        details: { courseCode: course.code, title: course.title },
      });

      return NextResponse.json({
        success: true,
        message: `Departmental elective '${course.code}: ${course.title}' registration quota officially frozen and locked by HOD.`,
        isLocked: true,
      });
    }

    if (action === "APPROVE_BATCH" && Array.isArray(studentIds)) {
      const updated = await prisma.enrollment.updateMany({
        where: {
          courseId,
          studentId: { in: studentIds },
        },
        data: { status: "ACTIVE" },
      });

      return NextResponse.json({
        success: true,
        message: `Approved ${updated.count} student registrations for elective ${course.code}.`,
        approvedCount: updated.count,
      });
    }

    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 });
  } catch (error: any) {
    logger.error("HOD Electives POST error", error);
    return NextResponse.json({ error: "Failed to process elective approval" }, { status: 500 });
  }
}
