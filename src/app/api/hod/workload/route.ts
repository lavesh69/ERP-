import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const HOD_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, HOD_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const departmentCode = searchParams.get("departmentCode");

    const deptFilter: any = {};
    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      deptFilter.campus = { institutionId: auth.payload.institutionId };
    }
    if (departmentCode) {
      deptFilter.code = departmentCode;
    }

    const departments = await prisma.department.findMany({
      where: deptFilter,
      include: {
        faculty: {
          include: {
            user: true,
            courses: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    const workloadRegistry = departments.flatMap((dept) =>
      dept.faculty.map((f) => {
        const assignedCourses = f.courses.map((cf) => ({
          courseId: cf.course.id,
          code: cf.course.code,
          title: cf.course.title,
          credits: cf.course.credits,
        }));

        const computedHours = assignedCourses.reduce((acc, c) => acc + c.credits * 3, 0) || f.weeklyHours;
        const targetBenchmark = 16;
        let status: "UNDERUTILIZED" | "BALANCED" | "OVERLOADED" = "BALANCED";

        if (computedHours > 20) {
          status = "OVERLOADED";
        } else if (computedHours < 12) {
          status = "UNDERUTILIZED";
        }

        return {
          facultyId: f.id,
          name: `${f.user.firstName} ${f.user.lastName}`,
          email: f.user.email,
          designation: f.designation,
          departmentCode: dept.code,
          departmentName: dept.name,
          weeklyAssignedHours: computedHours,
          benchmarkHours: targetBenchmark,
          status,
          overloadVariance: computedHours - targetBenchmark,
          assignedCourseCount: assignedCourses.length,
          courses: assignedCourses,
        };
      })
    );

    const totalAssignedHours = workloadRegistry.reduce((sum, f) => sum + f.weeklyAssignedHours, 0);
    const avgLoad = workloadRegistry.length > 0
      ? Number((totalAssignedHours / workloadRegistry.length).toFixed(1))
      : 16.0;

    return NextResponse.json({
      success: true,
      departmentSummary: {
        totalFacultyTracked: workloadRegistry.length,
        averageWeeklyLoadHours: avgLoad,
        overloadedCount: workloadRegistry.filter((f) => f.status === "OVERLOADED").length,
        underutilizedCount: workloadRegistry.filter((f) => f.status === "UNDERUTILIZED").length,
      },
      workload: workloadRegistry,
    });
  } catch (error: any) {
    logger.error("HOD Workload GET error", error);
    return NextResponse.json({ error: "Failed to compile faculty workload distribution" }, { status: 500 });
  }
}
