import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  STANDARD_PROGRAM_OUTCOMES,
  BLOOM_TAXONOMY,
  computePOAttainmentMatrix,
  computeColumnAverages,
  computeRowAverages,
  generateNbaSarCriterion3,
} from "@/lib/curriculum/obe-engine";
import {
  getAllArticulations,
  getCourseArticulation,
  saveCourseArticulation,
} from "@/lib/curriculum/obe-store";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode") || "CS-402";

    const allArticulations = getAllArticulations();
    const availableCourses = Object.keys(allArticulations).map((code) => ({
      code,
      title: allArticulations[code].courseTitle,
      department: allArticulations[code].departmentCode,
    }));

    // Fetch live courses from DB if available
    const dbCourses = await prisma.course.findMany({
      select: { code: true, title: true, credits: true },
      take: 10,
    }).catch(() => []);

    for (const c of dbCourses) {
      if (!availableCourses.some((ac) => ac.code.toUpperCase() === c.code.toUpperCase())) {
        availableCourses.push({
          code: c.code,
          title: c.title,
          department: "CSE",
        });
      }
    }

    const articulation = getCourseArticulation(courseCode);
    const poAttainments = computePOAttainmentMatrix(
      articulation.outcomes,
      articulation.mappingMatrix,
      STANDARD_PROGRAM_OUTCOMES
    );

    const poCodes = STANDARD_PROGRAM_OUTCOMES.map((p) => p.code);
    const columnAverages = computeColumnAverages(articulation.outcomes, articulation.mappingMatrix, poCodes);
    const rowAverages = computeRowAverages(articulation.outcomes, articulation.mappingMatrix, poCodes);

    return NextResponse.json({
      success: true,
      articulation,
      programOutcomes: STANDARD_PROGRAM_OUTCOMES,
      bloomTaxonomy: BLOOM_TAXONOMY,
      poAttainments,
      columnAverages,
      rowAverages,
      availableCourses,
    });
  } catch (error: any) {
    console.error("Error in GET /api/examinations/co-po:", error);
    return NextResponse.json(
      { error: "Failed to load CO-PO articulation data", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || "SAVE_MATRIX";
    const courseCode = (body.courseCode || "CS-402").toUpperCase().trim();

    // Check authorization for mutations
    const isAuthorized = session && [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "EXAMINATION_CONTROLLER",
      "CLASS_TEACHER",
    ].includes(session.role);

    // 1. Action: EXPORT_SAR
    if (action === "EXPORT_SAR") {
      const articulation = getCourseArticulation(courseCode);
      const poAttainments = computePOAttainmentMatrix(
        articulation.outcomes,
        articulation.mappingMatrix,
        STANDARD_PROGRAM_OUTCOMES
      );
      const sarReport = generateNbaSarCriterion3(articulation, poAttainments);

      if (session) {
        await logAuditEvent({
          institutionId: session.institutionId || "inst-apex-01",
          actorUserId: session.userId,
          action: "NBA_SAR_EXPORTED",
          targetEntity: "OBEAttainment",
          targetId: courseCode,
          details: { courseCode, sarFingerprint: sarReport.verificationFingerprint },
        });
      }

      return NextResponse.json({
        success: true,
        report: sarReport,
        message: "NBA Self Assessment Report Criterion 3 generated successfully.",
      });
    }

    // 2. Action: SAVE_MATRIX or UPDATE_OUTCOMES
    const actorName = session ? `${session.role} (${session.email})` : "Faculty Instructor";
    const updatedArticulation = saveCourseArticulation(
      courseCode,
      {
        mappingMatrix: body.mappingMatrix,
        outcomes: body.outcomes,
        directWeight: body.directWeight,
        indirectWeight: body.indirectWeight,
        academicYear: body.academicYear,
      },
      actorName
    );

    const poAttainments = computePOAttainmentMatrix(
      updatedArticulation.outcomes,
      updatedArticulation.mappingMatrix,
      STANDARD_PROGRAM_OUTCOMES
    );

    if (session) {
      await logAuditEvent({
        institutionId: session.institutionId || "inst-apex-01",
        actorUserId: session.userId,
        action: "CO_PO_MATRIX_UPDATED",
        targetEntity: "OBEArticulation",
        targetId: courseCode,
        details: { courseCode, actor: actorName },
      });
    }

    return NextResponse.json({
      success: true,
      message: `CO-PO Articulation Matrix and OBE Attainments successfully updated for ${courseCode}.`,
      articulation: updatedArticulation,
      poAttainments,
    });
  } catch (error: any) {
    console.error("Error in POST /api/examinations/co-po:", error);
    return NextResponse.json(
      { error: "Failed to process CO-PO request", details: error.message },
      { status: 500 }
    );
  }
}
