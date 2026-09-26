import { NextRequest, NextResponse } from "next/server";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import { scanSubmissionsForPlagiarism } from "@/lib/examination/plagiarism";

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { assignmentId, threshold, sampleSubmissions } = body;

    let submissionsToCompare: Array<{ id: string; studentName: string; content: string }> = [];

    if (assignmentId) {
      const dbAssignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: {
          submissions: {
            include: { student: { include: { user: true } } },
          },
        },
      });

      if (dbAssignment) {
        submissionsToCompare = dbAssignment.submissions.map((s) => ({
          id: s.id,
          studentName: `${s.student.user.firstName} ${s.student.user.lastName}`,
          content: s.content || s.feedback || s.fileUrl || "Submitted academic response text",
        }));
      }
    } else if (Array.isArray(sampleSubmissions) && sampleSubmissions.length > 0) {
      submissionsToCompare = sampleSubmissions;
    }

    if (submissionsToCompare.length < 2) {
      return NextResponse.json(
        { error: "At least two submissions are required to execute plagiarism comparison" },
        { status: 400 }
      );
    }

    const similarityThreshold = threshold !== undefined ? Number(threshold) : 0.30;
    const flaggedPairs = scanSubmissionsForPlagiarism(submissionsToCompare, similarityThreshold);

    return NextResponse.json({
      success: true,
      scannedCount: submissionsToCompare.length,
      threshold: similarityThreshold,
      flaggedCount: flaggedPairs.length,
      flaggedPairs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Plagiarism analysis failed" },
      { status: 500 }
    );
  }
}
