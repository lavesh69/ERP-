import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const PARENT_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PARENT"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, PARENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const parent = await prisma.parent.findFirst({
      where: {
        OR: [
          { userId: auth.payload.userId },
          { user: { email: auth.payload.email } },
        ],
      },
      include: {
        students: {
          include: {
            student: {
              include: {
                user: true,
                program: true,
                section: true,
                fees: {
                  take: 1,
                  orderBy: { dueDate: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      return NextResponse.json({
        success: true,
        wards: [],
        message: "No registered parent record located for active session.",
      });
    }

    const wards = parent.students.map((rel) => {
      const s = rel.student;
      const latestFee = s.fees[0];
      const pendingAmount = latestFee ? Math.max(0, latestFee.totalAmount - latestFee.paidAmount) : 0;

      return {
        studentId: s.id,
        isPrimary: rel.isPrimary,
        profile: {
          name: `${s.user.firstName} ${s.user.lastName}`,
          rollNumber: s.rollNumber,
          admissionNumber: s.admissionNumber,
          program: s.program.name,
          currentSemester: s.currentSemester,
          section: s.section?.name || "Section A",
          attendanceRate: s.attendanceRate,
          attendanceStatus: s.attendanceRate < 75.0 ? "ATTENDANCE_CRITICAL" : "HEALTHY",
          cgpa: s.cgpa,
          pendingFeeAmount: pendingAmount,
        },
      };
    });

    return NextResponse.json({
      success: true,
      totalWards: wards.length,
      activeWard: wards[0] || null,
      wards,
    });
  } catch (error: any) {
    logger.error("Parent wards GET error", error);
    return NextResponse.json({ error: "Failed to resolve parent wards" }, { status: 500 });
  }
}
