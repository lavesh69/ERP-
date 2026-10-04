import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const CLASS_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, CLASS_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId");

    const section = sectionId
      ? await prisma.section.findUnique({
          where: { id: sectionId },
          include: { semester: { include: { program: true } } },
        })
      : await prisma.section.findFirst({
          include: { semester: { include: { program: true } } },
        });

    if (!section) {
      return NextResponse.json({ error: "No class section located" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: { sectionId: section.id },
      include: {
        user: true,
        parents: {
          include: {
            parent: {
              include: {
                user: true,
              },
            },
          },
        },
        fees: {
          take: 1,
          orderBy: { dueDate: "desc" },
        },
      },
      orderBy: { rollNumber: "asc" },
    });

    const roster = students.map((s) => {
      const primaryParent = s.parents[0]?.parent?.user;
      const feeStatus = s.fees[0]?.status || "PAID";
      return {
        studentId: s.id,
        rollNumber: s.rollNumber,
        admissionNumber: s.admissionNumber,
        name: `${s.user.firstName} ${s.user.lastName}`,
        email: s.user.email,
        attendanceRate: s.attendanceRate,
        isDefaulter: s.attendanceRate < 75.0,
        cgpa: s.cgpa,
        feeStatus,
        parentContact: primaryParent
          ? {
              name: `${primaryParent.firstName} ${primaryParent.lastName}`,
              email: primaryParent.email,
              isPrimary: s.parents[0]?.isPrimary,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      section: {
        id: section.id,
        name: section.name,
        capacity: section.capacity,
        enrolledCount: roster.length,
        semesterTitle: section.semester.title,
        programName: section.semester.program.name,
      },
      roster,
    });
  } catch (error: any) {
    logger.error("Class roster GET error", error);
    return NextResponse.json({ error: "Failed to compile class roster" }, { status: 500 });
  }
}
