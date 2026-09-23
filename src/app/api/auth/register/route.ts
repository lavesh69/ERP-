import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { z } from "zod";
import { logger } from "@/lib/logging/logger";
import { sendEmail, getWelcomeStudentEmailHtml } from "@/lib/email/email-service";

const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  programCode: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, programCode, password } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in directly." },
        { status: 409 }
      );
    }

    // 2. Resolve institution & default academic program
    const institution = await prisma.institution.findFirst({
      where: { code: "APEX-UNIV" },
    }) || await prisma.institution.findFirst();

    if (!institution) {
      return NextResponse.json({ error: "Institution environment not configured" }, { status: 500 });
    }

    let program = null;
    if (programCode) {
      program = await prisma.program.findFirst({
        where: { code: programCode },
      });
    }
    if (!program) {
      program = await prisma.program.findFirst() || await prisma.program.create({
        data: {
          departmentId: (await prisma.department.findFirst())?.id || "dept-cs-01",
          code: "BTECH-CS",
          name: "Bachelor of Technology in Computer Science",
          degree: "B.Tech",
          durationYears: 4,
          totalCredits: 160,
        },
      });
    }

    // 3. Hash password using NIST SP 800-63B PBKDF2-SHA512
    const hashedPassword = await hashPassword(password);

    // 4. Generate standardized applicant roll number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicantNumber = `APP-2026-${randomSuffix}`;

    // 5. Persist User & Student Profile in Database
    const newUser = await prisma.user.create({
      data: {
        institutionId: institution.id,
        email: cleanEmail,
        passwordHash: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : null,
        role: "STUDENT",
        isActive: true,
        studentProfile: {
          create: {
            rollNumber: applicantNumber,
            admissionNumber: applicantNumber,
            admissionDate: new Date(),
            programId: program.id,
            currentSemester: 1,
            cgpa: 0.0,
            attendanceRate: 100.0,
            status: "ACTIVE",
          },
        },
      },
      include: {
        studentProfile: true,
      },
    });

    // 6. Security Audit Log
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    await prisma.auditLog.create({
      data: {
        institutionId: institution.id,
        actorUserId: newUser.id,
        action: "STUDENT_SELF_REGISTERED",
        targetEntity: "User",
        targetId: newUser.id,
        ipAddress: clientIp,
        detailsJson: JSON.stringify({
          email: cleanEmail,
          applicantNumber,
          program: program.name,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    logger.info(`Student self-registered: ${cleanEmail} (${applicantNumber})`);

    // Dispatch welcome email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendEmail({
      to: cleanEmail,
      subject: `[CLASSROOM] Welcome to Apex University - Scholar ID: ${applicantNumber}`,
      html: getWelcomeStudentEmailHtml(`${newUser.firstName} ${newUser.lastName}`, applicantNumber, `${appUrl}/login`),
      type: "WELCOME",
    }).catch((err) => logger.warn("Welcome email dispatch failed", err));

    return NextResponse.json(
      {
        success: true,
        message: "Student application account successfully registered. You may now sign in.",
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: `${newUser.firstName} ${newUser.lastName}`,
          role: newUser.role,
          applicationNumber: applicantNumber,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Student registration failed", error);
    return NextResponse.json(
      { error: "Registration processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
