import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const LEADERSHIP_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, LEADERSHIP_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const institutionId = auth.payload.institutionId;
    const studentFilter = institutionId && auth.payload.role !== "SUPER_ADMIN"
      ? { user: { institutionId } }
      : {};
    const facultyFilter = institutionId && auth.payload.role !== "SUPER_ADMIN"
      ? { user: { institutionId } }
      : {};
    const financeFilter = institutionId && auth.payload.role !== "SUPER_ADMIN"
      ? { student: { user: { institutionId } } }
      : {};

    const [
      totalStudents,
      avgAttendanceResult,
      atRiskAttendanceCount,
      totalFaculty,
      feeAggregates,
      pendingRequestsCount,
      activeBroadcasts,
    ] = await Promise.all([
      prisma.student.count({ where: studentFilter }),
      prisma.student.aggregate({ where: studentFilter, _avg: { attendanceRate: true } }),
      prisma.student.count({ where: { ...studentFilter, attendanceRate: { lt: 75.0 } } }),
      prisma.faculty.count({ where: facultyFilter }),
      prisma.studentFee.aggregate({
        where: financeFilter,
        _sum: { totalAmount: true, paidAmount: true },
      }),
      prisma.studentRequest.count({
        where: {
          ...(institutionId && auth.payload.role !== "SUPER_ADMIN"
            ? { student: { user: { institutionId } } }
            : {}),
          status: "UNDER_REVIEW",
        },
      }),
      prisma.announcement.count({
        where: {
          ...(institutionId && auth.payload.role !== "SUPER_ADMIN" ? { institutionId } : {}),
          priority: "EMERGENCY",
        },
      }),
    ]);

    const totalBilled = feeAggregates._sum.totalAmount || 0;
    const totalCollected = feeAggregates._sum.paidAmount || 0;
    const feeCollectionRate = totalBilled > 0
      ? Number(((totalCollected / totalBilled) * 100).toFixed(1))
      : 100.0;

    const avgAttendance = avgAttendanceResult._avg.attendanceRate
      ? Number(avgAttendanceResult._avg.attendanceRate.toFixed(1))
      : 88.5;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      kpi: {
        totalEnrolledScholars: totalStudents,
        averageCampusAttendance: avgAttendance,
        attendanceRiskDefaulters: atRiskAttendanceCount,
        retentionHealthRate: totalStudents > 0
          ? Number((((totalStudents - atRiskAttendanceCount) / totalStudents) * 100).toFixed(1))
          : 100.0,
        activeFacultyCount: totalFaculty,
        financialCollectionPercentage: feeCollectionRate,
        totalTuitionBilled: totalBilled,
        totalTuitionCollected: totalCollected,
        pendingApprovalsCount: pendingRequestsCount,
        activeEmergencySirens: activeBroadcasts,
      },
    });
  } catch (error: any) {
    logger.error("Principal KPI GET error", error);
    return NextResponse.json({ error: "Failed to compile executive campus KPI" }, { status: 500 });
  }
}
