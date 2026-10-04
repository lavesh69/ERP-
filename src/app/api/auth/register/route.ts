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
  role: z
    .enum([
      "STUDENT",
      "FACULTY",
      "PARENT",
      "ALUMNI",
      "HR_STAFF",
      "ACCOUNTANT",
      "LIBRARIAN",
      "PLACEMENT_OFFICER",
    ])
    .optional()
    .default("STUDENT"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Student fields
  programCode: z.string().optional(),
  currentSemester: z.number().optional().default(1),
  // Faculty fields
  departmentCode: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  officeRoom: z.string().optional(),
  employeeCode: z.string().optional(),
  // Parent fields
  wardRollNumber: z.string().optional(),
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN"]).optional().default("GUARDIAN"),
  // Alumni fields
  graduationBatch: z.number().optional(),
  degree: z.string().optional(),
  currentCompany: z.string().optional(),
  jobTitle: z.string().optional(),
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

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      password,
      programCode,
      currentSemester,
      departmentCode,
      designation,
      qualification,
      specialization,
      officeRoom,
      employeeCode,
      wardRollNumber,
      relation,
    } = parsed.data;

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

    // 2. Resolve institution
    const institution =
      (await prisma.institution.findFirst({
        where: { code: "APEX-UNIV" },
      })) || (await prisma.institution.findFirst());

    if (!institution) {
      return NextResponse.json({ error: "Institution environment not configured" }, { status: 500 });
    }

    // 3. Hash password using NIST SP 800-63B PBKDF2-SHA512
    const hashedPassword = await hashPassword(password);
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // ==========================================
    // ROLE A: TEACHER / FACULTY MEMBER REGISTRATION
    // ==========================================
    if (role === "FACULTY") {
      let dept = await prisma.department.findFirst({
        where: {
          code: departmentCode || "CSE",
        },
      });

      if (!dept) {
        const campus = (await prisma.campus.findFirst()) || (await prisma.campus.create({
          data: {
            institutionId: institution.id,
            code: "MAIN-CAMPUS",
            name: "Main University Campus",
            location: "Academic Square",
          },
        }));

        dept = await prisma.department.create({
          data: {
            institutionId: institution.id,
            campusId: campus.id,
            code: departmentCode || "CSE",
            name: "Computer Science & Engineering",
          },
        });
      }

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const generatedEmpCode = employeeCode?.trim() || `FAC-2026-${randomSuffix}`;

      const facultyUser = await prisma.user.create({
        data: {
          institutionId: institution.id,
          email: cleanEmail,
          passwordHash: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role: "FACULTY",
          isActive: true,
          facultyProfile: {
            create: {
              departmentId: dept.id,
              employeeCode: generatedEmpCode,
              designation: designation?.trim() || "Assistant Professor",
              qualification: qualification?.trim() || "Ph.D. / M.Tech in Discipline",
              specialization: specialization?.trim() || "Computer Systems & Intelligence",
              officeRoom: officeRoom?.trim() || "Academic Block A, Cabin 302",
              joiningDate: new Date(),
              weeklyHours: 18,
            },
          },
        },
        include: {
          facultyProfile: {
            include: { department: true },
          },
        },
      });

      await prisma.auditLog.create({
        data: {
          institutionId: institution.id,
          actorUserId: facultyUser.id,
          action: "FACULTY_SELF_REGISTERED",
          targetEntity: "Faculty",
          targetId: facultyUser.id,
          ipAddress: clientIp,
          detailsJson: JSON.stringify({
            email: cleanEmail,
            role: "FACULTY",
            employeeCode: generatedEmpCode,
            department: dept.code,
          }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Faculty profile registered successfully! You may now sign in.",
          user: {
            id: facultyUser.id,
            email: facultyUser.email,
            fullName: `${facultyUser.firstName} ${facultyUser.lastName}`,
            role: "FACULTY",
            employeeCode: generatedEmpCode,
            department: dept.name,
          },
        },
        { status: 201 }
      );
    }

    // ==========================================
    // ROLE B: PARENT / GUARDIAN REGISTRATION
    // ==========================================
    if (role === "PARENT") {
      const parentUser = await prisma.user.create({
        data: {
          institutionId: institution.id,
          email: cleanEmail,
          passwordHash: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role: "PARENT",
          isActive: true,
          parentProfile: {
            create: {
              relation: relation || "GUARDIAN",
              occupation: "Registered Parent",
            },
          },
        },
        include: {
          parentProfile: true,
        },
      });

      if (wardRollNumber && parentUser.parentProfile) {
        const ward = await prisma.student.findFirst({
          where: {
            OR: [
              { rollNumber: wardRollNumber.trim() },
              { admissionNumber: wardRollNumber.trim() },
            ],
          },
        });
        if (ward) {
          await prisma.studentRequest
            .create({
              data: {
                studentId: ward.id,
                type: "GUARDIAN_LINK_REQUEST",
                title: "Parent / Guardian Association Request",
                reason: `Parent ${parentUser.email} (${firstName} ${lastName}) registered and requested guardian link. Verification pending.`,
                status: "UNDER_REVIEW",
              },
            })
            .catch(() => {});
        }
      }

      await prisma.auditLog.create({
        data: {
          institutionId: institution.id,
          actorUserId: parentUser.id,
          action: "PARENT_SELF_REGISTERED",
          targetEntity: "User",
          targetId: parentUser.id,
          ipAddress: clientIp,
          detailsJson: JSON.stringify({ email: cleanEmail, role: "PARENT", wardRollNumber }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: "Parent / Guardian registration successful! You can now sign in.",
          user: {
            id: parentUser.id,
            email: parentUser.email,
            role: "PARENT",
            fullName: `${parentUser.firstName} ${parentUser.lastName}`,
          },
        },
        { status: 201 }
      );
    }

    // ==========================================
    // ROLE C: ALUMNI OR INSTITUTIONAL STAFF
    // ==========================================
    if (["ALUMNI", "HR_STAFF", "ACCOUNTANT", "LIBRARIAN", "PLACEMENT_OFFICER"].includes(role)) {
      const memberUser = await prisma.user.create({
        data: {
          institutionId: institution.id,
          email: cleanEmail,
          passwordHash: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role,
          isActive: true,
        },
      });

      await prisma.auditLog.create({
        data: {
          institutionId: institution.id,
          actorUserId: memberUser.id,
          action: `${role}_SELF_REGISTERED`,
          targetEntity: "User",
          targetId: memberUser.id,
          ipAddress: clientIp,
          detailsJson: JSON.stringify({ email: cleanEmail, role }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `${role.replace("_", " ")} profile registered successfully! You may now sign in.`,
          user: {
            id: memberUser.id,
            email: memberUser.email,
            role: memberUser.role,
            fullName: `${memberUser.firstName} ${memberUser.lastName}`,
          },
        },
        { status: 201 }
      );
    }

    // ==========================================
    // ROLE D: SCHOLAR / STUDENT REGISTRATION
    // ==========================================
    let program = null;
    if (programCode) {
      program = await prisma.program.findFirst({
        where: { code: programCode },
      });
    }
    if (!program) {
      let dept = await prisma.department.findFirst();
      if (!dept) {
        const campus = (await prisma.campus.findFirst()) || (await prisma.campus.create({
          data: {
            institutionId: institution.id,
            code: "MAIN-CAMPUS",
            name: "Main Campus",
            location: "Tech Boulevard",
          },
        }));
        dept = await prisma.department.create({
          data: {
            institutionId: institution.id,
            campusId: campus.id,
            code: "CSE",
            name: "Computer Science & Engineering",
          },
        });
      }

      program =
        (await prisma.program.findFirst()) ||
        (await prisma.program.create({
          data: {
            departmentId: dept.id,
            code: "BTECH-CS",
            name: "Bachelor of Technology in Computer Science",
            degree: "B.Tech",
            durationYears: 4,
            totalCredits: 160,
          },
        }));
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const applicantNumber = `APP-2026-${randomSuffix}`;

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
            currentSemester: currentSemester || 1,
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
    logger.error("Member registration failed", error);
    return NextResponse.json(
      { error: "Registration processing failed. Please try again later." },
      { status: 500 }
    );
  }
}
