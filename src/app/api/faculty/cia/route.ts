import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const FACULTY_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];

export interface CiaComponents {
  assignmentMarks: number;
  midTermMarks: number;
  quizOrPresentation: number;
  attendanceRate: number;
}

export function computeCiaBreakdown(components: CiaComponents) {
  const { assignmentMarks, midTermMarks, quizOrPresentation, attendanceRate } = components;

  let attendanceMarks = 0;
  if (attendanceRate >= 90) attendanceMarks = 5;
  else if (attendanceRate >= 85) attendanceMarks = 4;
  else if (attendanceRate >= 80) attendanceMarks = 3;
  else if (attendanceRate >= 75) attendanceMarks = 2;
  else attendanceMarks = 0;

  const validAssign = Math.min(10, Math.max(0, assignmentMarks));
  const validMidTerm = Math.min(10, Math.max(0, midTermMarks));
  const validQuiz = Math.min(5, Math.max(0, quizOrPresentation));

  const totalCiaMarks = validAssign + validMidTerm + validQuiz + attendanceMarks;
  const percentage = Number(((totalCiaMarks / 30) * 100).toFixed(1));

  return {
    assignmentComponent: validAssign,
    midTermComponent: validMidTerm,
    quizComponent: validQuiz,
    attendanceComponent: attendanceMarks,
    totalCiaMarks,
    maxCiaAllowed: 30,
    percentage,
    isPassing: totalCiaMarks >= 12,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { studentId, courseCode, assignmentMarks, midTermMarks, quizOrPresentation, attendanceRate } = body;

    const evalResult = computeCiaBreakdown({
      assignmentMarks: Number(assignmentMarks) || 0,
      midTermMarks: Number(midTermMarks) || 0,
      quizOrPresentation: Number(quizOrPresentation) || 0,
      attendanceRate: Number(attendanceRate) || 80.0,
    });

    return NextResponse.json({
      success: true,
      studentId,
      courseCode,
      evaluation: evalResult,
      evaluatedBy: auth.payload.email,
      evaluatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error("Faculty CIA POST error", error);
    return NextResponse.json({ error: "Failed to compute Continuous Internal Assessment" }, { status: 500 });
  }
}
