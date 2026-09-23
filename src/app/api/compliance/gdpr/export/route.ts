import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to request data archive." }, { status: 401 });
    }

    const userId = session.userId;

    // 1. Fetch comprehensive profile & institution link
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        institution: true,
        sessions: {
          select: { id: true, device: true, ipAddress: true, createdAt: true, lastActiveAt: true },
        },
        notifications: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User record not found." }, { status: 404 });
    }

    // 2. Fetch Student academic dossier if applicable
    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        enrollments: {
          include: {
            course: true,
          },
        },
        attendance: {
          take: 100,
          orderBy: { timestamp: "desc" },
        },
        examResults: true,
        fees: {
          include: {
            feeStructure: true,
            transactions: true,
          },
        },
      },
    });

    // 3. Fetch Audit events logged for this user
    const auditLogs = await prisma.auditLog.findMany({
      where: { actorUserId: userId },
      take: 50,
      orderBy: { timestamp: "desc" },
    });

    const exportBundle = {
      exportMetadata: {
        standard: "GDPR Article 15 (Right of Access) & FERPA Educational Records Request",
        exportedAt: new Date().toISOString(),
        subjectId: userId,
        institutionalTenant: user.institution.name,
      },
      personalInformation: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
      deviceSessions: user.sessions,
      academicRecord: student
        ? {
            rollNumber: student.rollNumber,
            currentSemester: student.currentSemester,
            cgpa: student.cgpa,
            attendanceRate: student.attendanceRate,
            enrollments: student.enrollments.map((enr) => ({
              courseCode: enr.course.code,
              courseTitle: enr.course.title,
              credits: enr.course.credits,
              grade: enr.grade,
              gradePoint: enr.gradePoint,
              status: enr.status,
            })),
            attendanceCount: student.attendance.length,
            examResultsCount: student.examResults.length,
            feeRecords: student.fees.map((f) => ({
              title: f.feeStructure.title,
              totalAmount: f.totalAmount,
              paidAmount: f.paidAmount,
              status: f.status,
              transactionsCount: f.transactions.length,
            })),
          }
        : null,
      notificationsCount: user.notifications.length,
      auditHistoryCount: auditLogs.length,
    };

    const bundleString = JSON.stringify(exportBundle, null, 2);
    const archiveSeal = crypto.createHash("sha256").update(bundleString).digest("hex");

    await logAuditEvent({
      institutionId: user.institutionId,
      actorUserId: userId,
      action: "PERMISSION_OVERRIDE",
      targetEntity: "ComplianceGDPR",
      targetId: userId,
      details: {
        action: "DATA_EXPORT_GENERATED",
        seal: archiveSeal,
      },
    });

    return new NextResponse(bundleString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gdpr-ferpa-archive-${user.email}.json"`,
        "X-Compliance-Seal": archiveSeal,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate compliance export" }, { status: 500 });
  }
}
