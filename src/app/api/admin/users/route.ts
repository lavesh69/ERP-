import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { revokeToken } from "@/lib/auth/token-revocation";
import { z } from "zod";

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Valid institutional or personal email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string(),
  departmentCode: z.string().optional(),
  phone: z.string().optional(),
  institutionId: z.string().optional(),
});

const PRIVILEGED_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"];

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  const callerRole = auth.payload.role as UserRole;
  const callerInstitutionId = auth.payload.institutionId;

  const url = req.nextUrl;
  const search = url.searchParams.get("search")?.toLowerCase().trim() || "";
  const roleFilter = url.searchParams.get("role") || "";
  const statusFilter = url.searchParams.get("status") || "";

  // Multi-tenant scoping: INSTITUTION_ADMIN cannot view users from other institutions
  const whereClause: any = {};
  if (callerRole !== "SUPER_ADMIN") {
    whereClause.institutionId = callerInstitutionId;
  }

  if (roleFilter) {
    whereClause.role = roleFilter;
  }

  if (statusFilter === "ACTIVE") {
    whereClause.isActive = true;
  } else if (statusFilter === "INACTIVE" || statusFilter === "SUSPENDED" || statusFilter === "DISABLED") {
    whereClause.isActive = false;
  }

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
    ];
  }

  try {
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        institution: { select: { id: true, name: true, code: true } },
        studentProfile: { select: { rollNumber: true, status: true, currentSemester: true } },
        facultyProfile: { select: { employeeCode: true, designation: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const sanitized = users.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      role: u.role,
      phone: u.phone,
      isActive: u.isActive,
      status: u.isActive ? "ACTIVE" : "SUSPENDED",
      institutionId: u.institutionId,
      institutionName: u.institution?.name || "Apex University",
      studentRollNumber: u.studentProfile?.rollNumber,
      facultyEmployeeId: u.facultyProfile?.employeeCode,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() || null,
    }));

    return NextResponse.json({ users: sanitized, count: sanitized.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  const callerRole = auth.payload.role as UserRole;
  const callerInstitutionId = auth.payload.institutionId;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, password, role, departmentCode, phone, institutionId } = parsed.data;
    const cleanEmail = email.toLowerCase().trim();
    const targetRole = role as UserRole;

    // Security Rule 7: Prevent privilege escalation
    if (PRIVILEGED_ROLES.includes(targetRole) && callerRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: `Forbidden: Only Super Administrators can provision privileged leadership roles (${PRIVILEGED_ROLES.join(", ")}).`,
        },
        { status: 403 }
      );
    }

    // Determine target institution ID (scope enforcement)
    const effectiveInstitutionId =
      callerRole === "SUPER_ADMIN" && institutionId ? institutionId : callerInstitutionId;

    // Check for duplicate account
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: `An account with email '${cleanEmail}' already exists in the system.` },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Resolve department / program
    let department = null;
    if (departmentCode) {
      department = await prisma.department.findFirst({
        where: { code: departmentCode, institutionId: effectiveInstitutionId },
      });
    }
    if (!department) {
      department = await prisma.department.findFirst({
        where: { institutionId: effectiveInstitutionId },
      });
    }

    let program = await prisma.program.findFirst();

    // Role profile creation suffix
    const suffix = Math.floor(1000 + Math.random() * 9000);

    // Transactional creation to prevent partially created accounts
    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          institutionId: effectiveInstitutionId,
          email: cleanEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone ? phone.trim() : null,
          role: targetRole,
          isActive: true,
          mustChangePassword: false,
        },
      });

      // Role profile creation
      if (targetRole === "STUDENT") {
        let actualProgram = program;
        if (!actualProgram) {
          actualProgram = await tx.program.findFirst();
        }
        const actualSection = await tx.section.findFirst();

        const createdStudent = await tx.student.create({
          data: {
            userId: u.id,
            rollNumber: `STD-2026-${suffix}`,
            admissionNumber: `ADM-2026-${suffix}`,
            admissionDate: new Date(),
            currentSemester: 1,
            programId: actualProgram?.id || "prog-cs-btech",
            sectionId: actualSection?.id || null,
            status: "ACTIVE",
            cgpa: 0.0,
            attendanceRate: 100.0,
          },
        });

        // Also enroll student in initial courses so they appear in Attendance & LMS
        const courses = await tx.course.findMany({ take: 3 });
        for (const c of courses) {
          await tx.enrollment.create({
            data: {
              studentId: createdStudent.id,
              courseId: c.id,
              status: "ENROLLED",
            },
          }).catch(() => {});
        }
      } else if (
        ["FACULTY", "CLASS_TEACHER", "HOD", "PRINCIPAL", "RESEARCH_COORDINATOR"].includes(targetRole)
      ) {
        await tx.faculty.create({
          data: {
            userId: u.id,
            employeeCode: `EMP-2026-${suffix}`,
            designation: targetRole === "HOD" ? "Head of Department" : targetRole === "PRINCIPAL" ? "Director / Principal" : "Assistant Professor",
            joiningDate: new Date(),
            departmentId: department?.id || "dept-default",
          },
        });
      } else if (targetRole === "PARENT") {
        await tx.parent.create({
          data: {
            userId: u.id,
            relation: "GUARDIAN",
          },
        });
      }

      return u;
    });

    // Immutable Audit Log
    await logAuditEvent({
      institutionId: effectiveInstitutionId,
      actorUserId: auth.payload.userId || auth.payload.sub || "admin",
      action: "ADMIN_USER_CREATED",
      targetEntity: "User",
      targetId: newUser.id,
      details: {
        email: cleanEmail,
        role: targetRole,
        assignedBy: auth.payload.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User '${cleanEmail}' created successfully with role '${targetRole}'.`,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: `${newUser.firstName} ${newUser.lastName}`,
        role: newUser.role,
        isActive: newUser.isActive,
        studentRollNumber: targetRole === "STUDENT" ? `STD-2026-${suffix}` : undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create user" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  const callerRole = auth.payload.role as UserRole;
  const callerInstitutionId = auth.payload.institutionId;

  try {
    const body = await req.json().catch(() => ({}));
    const { userId, isActive, role, resetPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required for user modification." }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Tenant isolation: INSTITUTION_ADMIN can only modify users in their own institution
    if (callerRole !== "SUPER_ADMIN" && targetUser.institutionId !== callerInstitutionId) {
      return NextResponse.json(
        { error: "Forbidden: You cannot modify users outside your authorized campus." },
        { status: 403 }
      );
    }

    // Privilege escalation guard: Only SUPER_ADMIN can touch SUPER_ADMIN accounts
    if (targetUser.role === "SUPER_ADMIN" && callerRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Administrator accounts can only be modified by Super Admins." },
        { status: 403 }
      );
    }

    const updates: any = {};
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    if (role) {
      if (PRIVILEGED_ROLES.includes(role as UserRole) && callerRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: Only Super Administrators can assign privileged leadership roles." },
          { status: 403 }
        );
      }
      updates.role = role;
    }

    if (resetPassword) {
      updates.passwordHash = await hashPassword(resetPassword);
      updates.mustChangePassword = true;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Audit Log
    await logAuditEvent({
      institutionId: targetUser.institutionId,
      actorUserId: auth.payload.userId || auth.payload.sub || "admin",
      action: "ADMIN_USER_UPDATED",
      targetEntity: "User",
      targetId: userId,
      details: {
        updates,
        modifiedBy: auth.payload.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update user" }, { status: 500 });
  }
}
