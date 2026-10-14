import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  evaluateStudentCareerRoadmap,
  TARGET_CAREER_BENCHMARKS,
} from "@/lib/academic/career-roadmap-engine";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const targetRole = searchParams.get("targetRole") || "Full-Stack Cloud Architect";

    // If caller is student, verify they are accessing their own roadmap
    let resolvedStudentId = studentId;
    if (session.role === "STUDENT") {
      const selfStudent = await prisma.student.findUnique({ where: { userId: session.userId } });
      if (!selfStudent) {
        return NextResponse.json({ error: "Student profile not linked" }, { status: 404 });
      }
      resolvedStudentId = selfStudent.id;
    }

    if (!resolvedStudentId) {
      // Return available career benchmark roles
      return NextResponse.json({
        success: true,
        availableProfiles: Object.keys(TARGET_CAREER_BENCHMARKS),
      });
    }

    const student = await prisma.student.findUnique({
      where: { id: resolvedStudentId },
      include: {
        user: true,
        program: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    const analysis = evaluateStudentCareerRoadmap({
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      rollNumber: student.rollNumber,
      programTitle: student.program?.name || "Bachelor of Technology in Computer Science",
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      completedCourseCodes: ["CS-101", "CS-201", "CS-301", "CS-402"],
      targetRole,
    });

    return NextResponse.json({
      success: true,
      analysis,
      availableProfiles: Object.keys(TARGET_CAREER_BENCHMARKS),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error evaluating career roadmap", details: error.message },
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
    const { studentId, targetRole } = body;

    if (!studentId || !targetRole) {
      return NextResponse.json({ error: "Missing studentId or targetRole" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true, program: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const analysis = evaluateStudentCareerRoadmap({
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      rollNumber: student.rollNumber,
      programTitle: student.program?.name || "B.Tech Computer Science",
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      completedCourseCodes: ["CS-101", "CS-201", "CS-301", "CS-402"],
      targetRole,
    });

    return NextResponse.json({
      success: true,
      message: `Target career trajectory updated to ${targetRole}`,
      analysis,
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error processing career roadmap update", details: error.message },
      { status: 500 }
    );
  }
}
