import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdminAuth } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";
import { logger } from "@/lib/logging/logger";

export async function GET() {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: true,
        department: true,
        courses: { include: { course: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = faculty.map((f) => ({
      id: f.id,
      userId: f.user.id,
      name: `${f.user.firstName} ${f.user.lastName}`,
      email: f.user.email,
      employeeCode: f.employeeCode,
      department: f.department.code,
      departmentName: f.department.name,
      designation: f.designation,
      specialization: f.specialization || "General Studies",
      officeRoom: f.officeRoom || "Academic Block A",
      weeklyHours: f.weeklyHours,
      coursesCount: f.courses.length,
      courses: f.courses.map((c) => c.course.code),
    }));

    return NextResponse.json({ faculty: formatted });
  } catch (error) {
    logger.error("Faculty GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch faculty" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Admin only authorization
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { firstName, lastName, email, designation, departmentCode, specialization } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findFirst();
    const department = await prisma.department.findFirst({
      where: { code: departmentCode || "CSE" },
    });

    if (!institution || !department) {
      return NextResponse.json({ error: "Institution or department not found" }, { status: 400 });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const employeeCode = `FAC-${department.code}-${randomSuffix}`;
    const passwordHash = await hashPassword("Classroom@2026");

    const facultyUser = await prisma.user.create({
      data: {
        institutionId: institution.id,
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        role: "FACULTY",
        facultyProfile: {
          create: {
            departmentId: department.id,
            employeeCode,
            designation: designation || "Assistant Professor",
            specialization: specialization || "Computer Science",
            joiningDate: new Date(),
            weeklyHours: 18,
          },
        },
      },
      include: { facultyProfile: true },
    });

    logger.info("Faculty onboarded", {
      employeeCode,
      email,
      actor: auth.payload.email,
    });

    return NextResponse.json(
      { success: true, faculty: facultyUser.facultyProfile },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Faculty POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to onboard faculty member" },
      { status: 500 }
    );
  }
}
