import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { parseCsv } from "@/lib/bulk/csv-parser";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/courses/bulk-import
 * Bulk Subject / Course Catalog Ingestion Engine
 * Validates program, department, semester, and faculty mappings before creation.
 * Rejects duplicates and preserves transaction safety.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const contentType = req.headers.get("content-type") || "";
    let rows: any[] = [];

    if (contentType.includes("application/json")) {
      const body = await req.json();
      rows = Array.isArray(body) ? body : body.courses || [];
    } else {
      // CSV Upload
      const text = await req.text();
      const parsed = parseCsv(text);
      rows = parsed.rows;
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "No course/subject records provided for bulk import" },
        { status: 400 }
      );
    }

    const results = {
      totalProcessed: rows.length,
      importedCount: 0,
      skippedCount: 0,
      errors: [] as string[],
    };

    // Preload departments, programs, and faculty for fast batch lookup
    const departments = await prisma.department.findMany({ select: { id: true, code: true } });
    const departmentMap = new Map(departments.map((d) => [d.code.toUpperCase(), d.id]));

    const programs = await prisma.program.findMany({
      include: { semesters: true },
    });
    const programMap = new Map(programs.map((p) => [p.code.toUpperCase(), p]));

    const faculty = await prisma.faculty.findMany({ select: { id: true, employeeCode: true } });
    const facultyMap = new Map(faculty.map((f) => [f.employeeCode.toUpperCase(), f.id]));

    // Transactional Batch Import
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        const code = (row.code || row.subjectCode || row["Subject Code"] || "").trim().toUpperCase();
        const title = (row.title || row.subjectName || row["Subject Name"] || "").trim();
        const shortName = (row.shortName || row["Short Name"] || title).trim();
        const deptCode = (row.departmentCode || row.department || row["Department"] || "").trim().toUpperCase();
        const progCode = (row.programCode || row.program || row["Program"] || "").trim().toUpperCase();
        const semNum = Number(row.semesterNumber || row.semester || row["Semester"] || 1);
        const subjectType = (row.subjectType || row["Subject Type"] || "CORE").trim().toUpperCase();
        const courseType = (row.courseType || row["Course Type"] || "THEORY").trim().toUpperCase();
        const credits = Number(row.credits || row["Credits"] || 4);
        const lectureHours = Number(row.lectureHours || row["Theory Hours"] || 3);
        const labHours = Number(row.labHours || row["Practical Hours"] || 0);
        const facultyCode = (row.facultyCode || row.facultyEmployeeCode || row["Faculty"] || "").trim().toUpperCase();

        if (!code || !title) {
          results.errors.push(`Row ${rowNum}: Subject Code and Name are mandatory`);
          results.skippedCount++;
          continue;
        }

        const departmentId = departmentMap.get(deptCode);
        if (!departmentId) {
          results.errors.push(`Row ${rowNum} (${code}): Department code '${deptCode}' not found`);
          results.skippedCount++;
          continue;
        }

        const program = programMap.get(progCode);
        if (!program) {
          results.errors.push(`Row ${rowNum} (${code}): Program code '${progCode}' not found`);
          results.skippedCount++;
          continue;
        }

        const semester = program.semesters.find((s) => s.semesterNumber === semNum);
        if (!semester) {
          results.errors.push(`Row ${rowNum} (${code}): Semester ${semNum} not found in program ${progCode}`);
          results.skippedCount++;
          continue;
        }

        // Check duplicate code in department
        const existing = await tx.course.findFirst({
          where: { departmentId, code },
        });

        if (existing) {
          results.skippedCount++;
          results.errors.push(`Row ${rowNum} (${code}): Duplicate subject code in department ${deptCode}`);
          continue;
        }

        const created = await tx.course.create({
          data: {
            code,
            title,
            shortName,
            departmentId,
            semesterId: semester.id,
            subjectType,
            courseType,
            credits,
            lectureHours,
            labHours,
            status: "ACTIVE",
            isActive: true,
            isElective: subjectType.includes("ELECTIVE"),
          },
        });

        if (facultyCode && facultyMap.has(facultyCode)) {
          const facId = facultyMap.get(facultyCode)!;
          await tx.courseFaculty.create({
            data: {
              courseId: created.id,
              facultyId: facId,
              role: "PRIMARY_INSTRUCTOR",
            },
          });
        }

        results.importedCount++;
      }
    });

    return NextResponse.json({
      message: `Bulk import completed: ${results.importedCount} subjects added, ${results.skippedCount} skipped`,
      results,
    });
  } catch (error: any) {
    logger.error("POST /api/courses/bulk-import error", { error });
    return NextResponse.json(
      { error: "Bulk import transaction failed", details: error.message },
      { status: 500 }
    );
  }
}
