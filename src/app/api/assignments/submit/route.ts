import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import { getStorageProvider } from "@/lib/storage";

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const contentType = req.headers.get("content-type") || "";

    let assignmentId = "";
    let content = "";
    let fileUrl = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      assignmentId = (formData.get("assignmentId") as string) || "";
      content = (formData.get("content") as string) || "";
      const customUrl = formData.get("fileUrl") as string;
      if (customUrl) fileUrl = customUrl;

      const file = formData.get("file") as File | null;
      if (file && typeof file.arrayBuffer === "function") {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const storage = getStorageProvider();
        const uploadResult = await storage.upload(
          buffer,
          file.name,
          file.type || "application/pdf",
          false
        );
        fileUrl = uploadResult.fileUrl;
      }
    } else {
      const body = await req.json().catch(() => ({}));
      assignmentId = body.assignmentId;
      content = body.content;
      fileUrl = body.fileUrl;
    }

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignmentId is required" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Resolve student record from authenticated user or fallback for dev sandbox
    let student = null;
    if (session?.userId) {
      student = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { user: true },
      });
    }

    // Fallback only permitted in development sandbox mode
    if (!student && process.env.NODE_ENV !== "production") {
      student = await prisma.student.findFirst({
        include: { user: true },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: "Access Denied: No active scholar profile linked to current session." },
        { status: 403 }
      );
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        content: content || "Student coursework solution",
        fileUrl: fileUrl || "/uploads/submissions/assignment-solution.pdf",
        submittedAt: new Date(),
        isLate,
      },
      create: {
        assignmentId,
        studentId: student.id,
        content: content || "Student coursework solution",
        fileUrl: fileUrl || "/uploads/submissions/assignment-solution.pdf",
        submittedAt: new Date(),
        isLate,
      },
    });

    logger.info("Assignment submission received", {
      assignmentId,
      studentId: student.id,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      isLate,
    });

    return NextResponse.json({
      success: true,
      message: isLate
        ? "Assignment submitted (marked as late submission)"
        : "Assignment solution successfully submitted",
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        content: submission.content,
      },
    });
  } catch (error: any) {
    logger.error("Assignment submission error", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit assignment" },
      { status: 500 }
    );
  }
}
