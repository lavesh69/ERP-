import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  computeStudentActivitySummary,
  submitActivityClaim,
  verifyActivityClaim,
  ActivityCategory,
} from "@/lib/academic/student-activity-points-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetStudentId = searchParams.get("studentId");

    let resolvedId = targetStudentId;
    if (session.role === "STUDENT") {
      const student = await prisma.student.findUnique({ where: { userId: session.userId } });
      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }
      resolvedId = student.id;
    }

    if (!resolvedId) {
      return NextResponse.json({ error: "Missing required studentId parameter" }, { status: 400 });
    }

    const studentRecord = await prisma.student.findUnique({
      where: { id: resolvedId },
      include: { user: true },
    });

    if (!studentRecord) {
      return NextResponse.json({ error: "Student not found in institutional database" }, { status: 404 });
    }

    const summary = computeStudentActivitySummary(
      studentRecord.id,
      `${studentRecord.user.firstName} ${studentRecord.user.lastName}`,
      studentRecord.rollNumber
    );

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error loading activity points", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // 1. Student submits claim
    if (action === "SUBMIT_CLAIM") {
      const { studentId, category, title, description, activityDate, pointsClaimed, evidenceUrl } = body;

      if (!category || !title || !description || !activityDate) {
        return NextResponse.json({ error: "Missing required claim parameters" }, { status: 400 });
      }

      let resolvedStudentId = studentId;
      if (session.role === "STUDENT") {
        const student = await prisma.student.findUnique({ where: { userId: session.userId } });
        if (!student) return NextResponse.json({ error: "Student record missing" }, { status: 404 });
        resolvedStudentId = student.id;
      }

      const scholar = await prisma.student.findUnique({
        where: { id: resolvedStudentId },
        include: { user: true },
      });

      if (!scholar) {
        return NextResponse.json({ error: "Target student not found" }, { status: 404 });
      }

      const claim = submitActivityClaim({
        studentId: scholar.id,
        studentName: `${scholar.user.firstName} ${scholar.user.lastName}`,
        rollNumber: scholar.rollNumber,
        category: category as ActivityCategory,
        title,
        description,
        activityDate,
        pointsClaimed: Number(pointsClaimed) || 10,
        evidenceUrl,
      });

      return NextResponse.json({
        success: true,
        message: "Co-curricular activity point claim submitted for faculty verification",
        claim,
      }, { status: 200 });
    }

    // 2. Faculty / Dean verifies claim
    if (action === "VERIFY_CLAIM") {
      const allowedEvaluators = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "DEAN"];
      if (!allowedEvaluators.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Faculty or Dean clearance required to verify points" }, { status: 403 });
      }

      const { claimId, status, awardedPoints, remarks } = body;
      if (!claimId || !status) {
        return NextResponse.json({ error: "Missing claimId or status" }, { status: 400 });
      }

      const updated = verifyActivityClaim({
        claimId,
        evaluatorId: session.userId,
        status: status as any,
        awardedPoints: Number(awardedPoints) || 0,
        remarks: remarks || "Verified in accordance with AICTE activity norms.",
      });

      if (!updated) {
        return NextResponse.json({ error: "Activity claim not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Claim ${updated.id} marked ${updated.status} with ${updated.pointsAwarded} points awarded`,
        claim: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: SUBMIT_CLAIM, VERIFY_CLAIM" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error processing activity claim", details: error.message },
      { status: 500 }
    );
  }
}
