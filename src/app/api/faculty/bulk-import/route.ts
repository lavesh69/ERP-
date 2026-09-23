import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { parseCsv, FACULTY_SAMPLE_CSV } from "@/lib/bulk/csv-parser";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("template") === "true") {
    return new NextResponse(FACULTY_SAMPLE_CSV, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="faculty-bulk-template.csv"',
      },
    });
  }
  return NextResponse.json({ message: "Use ?template=true to download faculty CSV template" });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "INSTITUTION_ADMIN")) {
      return NextResponse.json({ error: "Access Denied: Administrative privileges required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { csvData, rows: providedRows } = body;

    let rows: Record<string, string>[] = [];
    if (csvData && typeof csvData === "string") {
      rows = parseCsv(csvData).rows;
    } else if (Array.isArray(providedRows)) {
      rows = providedRows;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No faculty records found in upload." }, { status: 400 });
    }

    const institutionId = session.institutionId || "inst-apex-01";
    let department = await prisma.department.findFirst({
      where: { campus: { institutionId } },
    });
    if (!department) department = await prisma.department.findFirst();
    if (!department) {
      return NextResponse.json({ error: "No academic department exists in institution." }, { status: 400 });
    }

    const defaultPasswordHash = await hashPassword("Classroom@2026");
    const imported: any[] = [];
    const errors: Array<{ rowNumber: number; email?: string; reason: string }> = [];

    const seenEmails = new Set<string>();
    const seenCodes = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2;
      const email = (r.email || "").toLowerCase().trim();
      const firstName = (r.firstname || r.first_name || r["first name"] || "").trim();
      const lastName = (r.lastname || r.last_name || r["last name"] || "").trim();
      const employeeCode = (r.employeecode || r.employee_code || r["employee code"] || `EMP-2026-${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();
      const designation = (r.designation || "Assistant Professor").trim();
      const phone = (r.phone || null)?.trim() || null;

      if (!email || !firstName || !lastName) {
        errors.push({ rowNumber: rowNum, email, reason: "Missing required fields (firstName, lastName, email)" });
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ rowNumber: rowNum, email, reason: "Invalid email format" });
        continue;
      }

      if (seenEmails.has(email) || seenCodes.has(employeeCode)) {
        errors.push({ rowNumber: rowNum, email, reason: "Duplicate entry within this batch" });
        continue;
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { facultyProfile: { employeeCode } }] },
      });
      if (existingUser) {
        errors.push({ rowNumber: rowNum, email, reason: "User with this email or employee code already exists" });
        continue;
      }

      try {
        const newUser = await prisma.user.create({
          data: {
            institutionId,
            email,
            passwordHash: defaultPasswordHash,
            firstName,
            lastName,
            phone,
            role: "FACULTY",
            mustChangePassword: true,
            facultyProfile: {
              create: {
                employeeCode,
                designation,
                departmentId: department.id,
                joiningDate: new Date(),
              },
            },
          },
          include: { facultyProfile: true },
        });

        seenEmails.add(email);
        seenCodes.add(employeeCode);

        imported.push({
          id: newUser.facultyProfile?.id,
          userId: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          employeeCode: newUser.facultyProfile?.employeeCode,
          designation,
        });
      } catch (err: any) {
        errors.push({ rowNumber: rowNum, email, reason: err.message || "Insert failed" });
      }
    }

    if (imported.length > 0) {
      await logAuditEvent({
        institutionId,
        actorUserId: session.userId,
        action: "FACULTY_ASSIGNED",
        targetEntity: "FacultyBulkImport",
        targetId: `batch_${Date.now()}`,
        details: { importedCount: imported.length, failedCount: errors.length },
      });
    }

    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      failedCount: errors.length,
      imported,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Bulk faculty import failed" }, { status: 500 });
  }
}
