import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ADMIN_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const {
      name,
      code,
      subdomain,
      adminEmail,
      adminFirstName,
      adminLastName,
      adminPassword,
    } = body;

    if (!name || !code || !adminEmail) {
      return NextResponse.json(
        { error: "name, code, and adminEmail are required" },
        { status: 400 }
      );
    }

    const existingCode = await prisma.institution.findFirst({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: `Institution with code '${code}' already exists.` },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(adminPassword || "ApexAdmin2026!@#");

    // Atomic 1-Click Provisioning
    const result = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: {
          name,
          code,
        },
      });

      const campus = await tx.campus.create({
        data: {
          institutionId: institution.id,
          name: `${name} Main Campus`,
          code: `${code}-MAIN`,
          location: "Central University Avenue, Tech Park",
        },
      });

      const dept = await tx.department.create({
        data: {
          institutionId: institution.id,
          campusId: campus.id,
          name: "Computer Science & Engineering",
          code: "CSE",
        },
      });

      const program = await tx.program.create({
        data: {
          departmentId: dept.id,
          name: "Bachelor of Technology in Computer Science",
          code: "BTECH-CSE",
          degree: "B.Tech",
          durationYears: 4,
          totalCredits: 160,
        },
      });

      let academicYear = await tx.academicYear.findFirst({
        where: { code: "2026-2027" },
      });
      if (!academicYear) {
        academicYear = await tx.academicYear.create({
          data: {
            code: "2026-2027",
            title: "Academic Year 2026-2027",
            startDate: new Date("2026-08-01"),
            endDate: new Date("2027-06-30"),
            isCurrent: true,
          },
        });
      }

      const semester1 = await tx.semester.create({
        data: {
          programId: program.id,
          academicYearId: academicYear.id,
          semesterNumber: 1,
          title: "Fall Semester 2026",
          startDate: new Date("2026-08-01"),
          endDate: new Date("2026-12-15"),
          isCurrent: true,
        },
      });

      const section = await tx.section.create({
        data: {
          semesterId: semester1.id,
          name: "Section A",
          capacity: 60,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          institutionId: institution.id,
          email: adminEmail,
          passwordHash: hashedPassword,
          firstName: adminFirstName || "Institutional",
          lastName: adminLastName || "Administrator",
          role: "INSTITUTION_ADMIN",
        },
      });

      return {
        institution,
        campus,
        department: dept,
        program,
        academicYear,
        semester: semester1,
        section,
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
      };
    });

    await logAuditEvent({
      institutionId: result.institution.id,
      actorUserId: auth.payload.userId || "super_admin",
      action: "INSTITUTION_PROVISIONED",
      targetEntity: "Institution",
      targetId: result.institution.id,
      details: {
        code: result.institution.code,
        campusId: result.campus.id,
        adminEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Institution '${name}' provisioned successfully with campus, departments, academic year, and initial administrator.`,
      provisioned: result,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Admin provision POST error", error);
    return NextResponse.json(
      { error: error.message || "Failed to provision institution" },
      { status: 500 }
    );
  }
}
