import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { hashPassword } from "@/lib/auth/password";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const ALLOWED_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ALLOWED_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { students, defaultProgramId } = body;

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: "students array is required and must not be empty" },
        { status: 400 }
      );
    }

    const institutionId = auth.payload.institutionId;
    if (!institutionId && auth.payload.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Institution context missing" }, { status: 400 });
    }

    const targetInstitutionId =
      institutionId ||
      (await prisma.institution.findFirst())?.id;

    if (!targetInstitutionId) {
      return NextResponse.json({ error: "No target institution available" }, { status: 404 });
    }

    const targetProgramId =
      defaultProgramId ||
      (await prisma.program.findFirst({
        where: { department: { campus: { institutionId: targetInstitutionId } } },
      }))?.id;

    if (!targetProgramId) {
      return NextResponse.json(
        { error: "No academic program found for student enrollment" },
        { status: 404 }
      );
    }

    const defaultHashedPassword = await hashPassword("Welcome@2026!");
    const imported: any[] = [];
    const skipped: any[] = [];
    const validationErrors: Array<{ row: number; field: string; message: string; record: any }> = [];

    for (let i = 0; i < students.length; i++) {
      const rowNum = i + 1;
      const row = students[i];

      const rollNumber = String(row.rollNumber || "").trim();
      const admissionNumber = String(row.admissionNumber || rollNumber).trim();
      const email = String(row.email || "").toLowerCase().trim();
      const firstName = String(row.firstName || "").trim();
      const lastName = String(row.lastName || "").trim();
      const semester = Number(row.currentSemester) || 1;

      if (!rollNumber) {
        validationErrors.push({ row: rowNum, field: "rollNumber", message: "Roll number is required", record: row });
        skipped.push(row);
        continue;
      }

      if (!email || !email.includes("@")) {
        validationErrors.push({ row: rowNum, field: "email", message: "Valid email address required", record: row });
        skipped.push(row);
        continue;
      }

      if (!firstName) {
        validationErrors.push({ row: rowNum, field: "firstName", message: "First name is required", record: row });
        skipped.push(row);
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { studentProfile: { rollNumber } },
            { studentProfile: { admissionNumber } },
          ],
        },
      });

      if (existingUser) {
        validationErrors.push({
          row: rowNum,
          field: "duplicate",
          message: `Scholar with rollNumber '${rollNumber}' or email '${email}' already exists`,
          record: row,
        });
        skipped.push(row);
        continue;
      }

      try {
        const user = await prisma.user.create({
          data: {
            institutionId: targetInstitutionId,
            email,
            passwordHash: defaultHashedPassword,
            firstName,
            lastName: lastName || "Scholar",
            role: "STUDENT",
            studentProfile: {
              create: {
                programId: row.programId || targetProgramId,
                rollNumber,
                admissionNumber,
                admissionDate: new Date(),
                currentSemester: semester,
                cgpa: Number(row.cgpa) || 3.5,
                attendanceRate: Number(row.attendanceRate) || 100.0,
                status: "ACTIVE",
              },
            },
          },
          include: { studentProfile: true },
        });

        imported.push({
          row: rowNum,
          userId: user.id,
          studentId: user.studentProfile?.id,
          rollNumber,
          email,
          name: `${user.firstName} ${user.lastName}`,
        });
      } catch (err: any) {
        validationErrors.push({
          row: rowNum,
          field: "database",
          message: err.message || "Failed to persist scholar record",
          record: row,
        });
        skipped.push(row);
      }
    }

    await logAuditEvent({
      institutionId: targetInstitutionId,
      actorUserId: auth.payload.userId || "admin",
      action: "STUDENT_BULK_IMPORTED",
      targetEntity: "Student",
      details: {
        totalProcessed: students.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        errorCount: validationErrors.length,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalSubmitted: students.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        hasErrors: validationErrors.length > 0,
      },
      imported,
      errors: validationErrors,
    }, { status: imported.length > 0 ? 201 : 400 });
  } catch (error: any) {
    logger.error("Students bulk import error", error);
    return NextResponse.json(
      { error: error.message || "Bulk student import failed" },
      { status: 500 }
    );
  }
}
