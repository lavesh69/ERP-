import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { parseCsv, STUDENT_SAMPLE_CSV } from "@/lib/bulk/csv-parser";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("template") === "true") {
    return new NextResponse(STUDENT_SAMPLE_CSV, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="students-bulk-template.csv"',
      },
    });
  }
  return NextResponse.json({ message: "Use ?template=true to download sample CSV template" });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "INSTITUTION_ADMIN")) {
      return NextResponse.json({ error: "Access Denied: Registrar or Administrative privileges required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { csvData, rows: providedRows } = body;

    let rows: Record<string, string>[] = [];
    if (csvData && typeof csvData === "string") {
      const parsed = parseCsv(csvData);
      rows = parsed.rows;
    } else if (Array.isArray(providedRows)) {
      rows = providedRows;
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "No student records found to import. Please provide CSV data." }, { status: 400 });
    }

    // Resolve Institution and default Program
    const institutionId = session.institutionId || "inst-apex-01";
    let program = await prisma.program.findFirst({
      where: { department: { campus: { institutionId } } },
    });
    if (!program) {
      program = await prisma.program.findFirst();
    }
    if (!program) {
      return NextResponse.json({ error: "No degree programs configured in institution. Create a program first." }, { status: 400 });
    }

    const defaultPasswordHash = await hashPassword("Classroom@2026");
    const imported: any[] = [];
    const errors: Array<{ rowNumber: number; email?: string; reason: string }> = [];

    // Track emails & roll numbers in this batch to prevent internal duplicates
    const seenEmails = new Set<string>();
    const seenRolls = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 2; // Row 1 is header
      const email = (r.email || "").toLowerCase().trim();
      const firstName = (r.firstname || r.first_name || r["first name"] || "").trim();
      const lastName = (r.lastname || r.last_name || r["last name"] || "").trim();
      const rollNumber = (r.rollnumber || r.roll_number || r["roll no"] || r["roll number"] || "").trim().toUpperCase();
      const admissionNumber = (r.admissionnumber || r.admission_number || r["admission number"] || `ADM-2026-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
      const phone = (r.phone || r.phone_number || null)?.trim() || null;
      const currentSemester = parseInt(r.semester || r.currentsemester || "1", 10) || 1;

      if (!email || !firstName || !lastName || !rollNumber) {
        errors.push({ rowNumber: rowNum, email, reason: "Missing required fields (firstName, lastName, email, rollNumber)" });
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({ rowNumber: rowNum, email, reason: "Invalid email address format" });
        continue;
      }

      if (seenEmails.has(email) || seenRolls.has(rollNumber)) {
        errors.push({ rowNumber: rowNum, email, reason: "Duplicate entry within this CSV batch" });
        continue;
      }

      // Check DB existence
      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { studentProfile: { rollNumber } }] },
      });
      if (existingUser) {
        errors.push({ rowNumber: rowNum, email, reason: "User with this email or roll number already registered" });
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
            role: "STUDENT",
            mustChangePassword: true,
            studentProfile: {
              create: {
                rollNumber,
                admissionNumber,
                admissionDate: new Date(),
                currentSemester,
                programId: program.id,
                status: "ACTIVE",
                cgpa: 0.0,
                attendanceRate: 100.0,
              },
            },
          },
          include: { studentProfile: true },
        });

        seenEmails.add(email);
        seenRolls.add(rollNumber);

        imported.push({
          id: newUser.studentProfile?.id,
          userId: newUser.id,
          name: `${newUser.firstName} ${newUser.lastName}`,
          email: newUser.email,
          rollNumber: newUser.studentProfile?.rollNumber,
        });
      } catch (err: any) {
        errors.push({ rowNumber: rowNum, email, reason: err.message || "Database insert error" });
      }
    }

    if (imported.length > 0) {
      await logAuditEvent({
        institutionId,
        actorUserId: session.userId,
        action: "STUDENT_ENROLLED",
        targetEntity: "StudentBulkImport",
        targetId: `batch_${Date.now()}`,
        details: {
          importedCount: imported.length,
          failedCount: errors.length,
        },
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
    return NextResponse.json({ error: error.message || "Bulk import failed" }, { status: 500 });
  }
}
