import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);

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

    if (!student) {
      student = await prisma.student.findFirst({
        include: { user: true },
      });
    }

    const scholarships = await prisma.scholarship.findMany({
      include: {
        applications: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    const studentCgpa = student?.cgpa ?? 3.88;

    const formatted = scholarships.map((s) => {
      const myApplication = student
        ? s.applications.find((app) => app.studentId === student.id)
        : null;

      const isEligible = studentCgpa >= s.minCgpa;

      return {
        id: s.id,
        title: s.title,
        provider: s.provider,
        amount: `$${s.amount.toLocaleString()} / semester`,
        numericAmount: s.amount,
        minCgpa: s.minCgpa,
        deadline: s.deadline.toISOString().split("T")[0],
        eligibility: s.eligibilityRules,
        description: s.description,
        isEligible,
        studentMatch: isEligible && student
          ? `${student.user.firstName} ${student.user.lastName} matches criteria (CGPA: ${studentCgpa.toFixed(2)})`
          : null,
        myApplication: myApplication
          ? {
              id: myApplication.id,
              status: myApplication.status,
              statement: myApplication.statement,
              appliedAt: myApplication.appliedAt.toISOString().split("T")[0],
            }
          : null,
      };
    });

    const allApplications = scholarships.flatMap((s) =>
      s.applications.map((app) => ({
        id: app.id,
        scholarshipId: s.id,
        scholarshipTitle: s.title,
        provider: s.provider,
        amount: `$${s.amount.toLocaleString()} / semester`,
        studentId: app.student.id,
        studentName: `${app.student.user.firstName} ${app.student.user.lastName}`,
        rollNumber: app.student.rollNumber,
        cgpa: app.student.cgpa,
        statement: app.statement,
        documentsUrl: app.documentsUrl,
        status: app.status,
        appliedAt: app.appliedAt.toISOString().split("T")[0],
      }))
    );

    return NextResponse.json({
      scholarships: formatted,
      allApplications,
      studentProfile: student
        ? {
            name: `${student.user.firstName} ${student.user.lastName}`,
            rollNumber: student.rollNumber,
            cgpa: studentCgpa,
          }
        : null,
    });
  } catch (error: any) {
    logger.error("Scholarships GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch scholarships" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { scholarshipId, statement, documentsUrl } = body;

    if (!scholarshipId) {
      return NextResponse.json(
        { error: "scholarshipId is required" },
        { status: 400 }
      );
    }

    const scholarship = await prisma.scholarship.findUnique({
      where: { id: scholarshipId },
    });

    if (!scholarship) {
      return NextResponse.json(
        { error: "Scholarship fellowship not found" },
        { status: 404 }
      );
    }

    // Resolve student record
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

    if (!student) {
      student = await prisma.student.findFirst({
        include: { user: true },
      });
    }

    if (!student) {
      return NextResponse.json(
        { error: "No student profile found for scholarship application" },
        { status: 403 }
      );
    }

    // Check existing application
    const existing = await prisma.scholarshipApplication.findFirst({
      where: {
        scholarshipId,
        studentId: student.id,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `You have already applied for ${scholarship.title} (Status: ${existing.status})`,
        application: existing,
      });
    }

    const application = await prisma.scholarshipApplication.create({
      data: {
        scholarshipId,
        studentId: student.id,
        statement: statement || "Undergraduate fellowship application statement",
        documentsUrl: documentsUrl || "/uploads/scholarships/transcript_verified.pdf",
        status: "UNDER_REVIEW",
      },
    });

    logger.info("Scholarship application submitted", {
      scholarshipId,
      title: scholarship.title,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Application submitted successfully for ${scholarship.title}`,
        application,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Scholarships POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit scholarship application" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD", "ACCOUNTANT"];
    if (session?.role && !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: "Access denied. Administrative role required." }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, status, remarks } = body;

    if (!applicationId || !status || !["APPROVED", "REJECTED", "UNDER_REVIEW"].includes(status)) {
      return NextResponse.json(
        { error: "applicationId and valid status (APPROVED, REJECTED, UNDER_REVIEW) are required" },
        { status: 400 }
      );
    }

    const application = await prisma.scholarshipApplication.findUnique({
      where: { id: applicationId },
      include: {
        scholarship: true,
        student: { include: { user: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Scholarship application not found" }, { status: 404 });
    }

    const updated = await prisma.scholarshipApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    // Create a real student notification
    await prisma.notification.create({
      data: {
        userId: application.student.userId,
        title: status === "APPROVED" ? "Scholarship Fellowship Approved!" : "Scholarship Review Update",
        message: status === "APPROVED"
          ? `Congratulations! Your fellowship application for ${application.scholarship.title} ($${application.scholarship.amount.toLocaleString()}) has been APPROVED. ${remarks ? `Remarks: ${remarks}` : ""}`
          : `Your fellowship application for ${application.scholarship.title} was reviewed and marked as ${status}. ${remarks ? `Remarks: ${remarks}` : ""}`,
        type: status === "APPROVED" ? "SUCCESS" : "INFO",
        isRead: false,
      },
    });

    logger.info("Scholarship application status updated", {
      applicationId,
      status,
      scholarship: application.scholarship.title,
      student: `${application.student.user.firstName} ${application.student.user.lastName}`,
    });

    return NextResponse.json({
      success: true,
      message: `Application marked as ${status} successfully. Student notification dispatched.`,
      application: updated,
    });
  } catch (error: any) {
    logger.error("Scholarships PATCH Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to update scholarship status" },
      { status: 500 }
    );
  }
}
