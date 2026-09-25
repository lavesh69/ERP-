import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireFacultyOrAdminAuth, requireAdminAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/courses
 * Unified Course & Subject Master Data Catalog
 * Supports extensive search and filtering across programs, departments,
 * semesters, sections, faculty assignments, and subject types.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim();
    const departmentId = searchParams.get("departmentId");
    const programId = searchParams.get("programId");
    const semesterId = searchParams.get("semesterId");
    const sectionId = searchParams.get("sectionId");
    const facultyId = searchParams.get("facultyId");
    const academicYearId = searchParams.get("academicYearId");
    const subjectType = searchParams.get("subjectType");
    const courseType = searchParams.get("courseType");
    const statusParam = searchParams.get("status"); // ACTIVE, INACTIVE, ARCHIVED, ALL
    const isElective = searchParams.get("isElective");
    const isCommon = searchParams.get("isCommon");

    const where: any = {};

    // 1. Text Search (Code, Title, ShortName)
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { shortName: { contains: search } },
      ];
    }

    // 2. Department & Program Filters
    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (programId || academicYearId) {
      where.semester = {
        ...(where.semester || {}),
        ...(programId ? { programId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      };
    }

    if (semesterId) {
      where.semesterId = semesterId;
    }

    // 3. Subject Attributes
    if (subjectType && subjectType !== "ALL") {
      where.subjectType = subjectType;
    }
    if (courseType && courseType !== "ALL") {
      where.courseType = courseType;
    }
    if (isElective !== null && isElective !== undefined && isElective !== "") {
      where.isElective = isElective === "true";
    }
    if (isCommon !== null && isCommon !== undefined && isCommon !== "") {
      where.isCommon = isCommon === "true";
    }

    // 4. Status Filter
    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    } else if (!statusParam) {
      // Default to active for regular inquiries
      where.status = "ACTIVE";
    }

    // 5. Section Filter: If sectionId is provided, filter courses offered in the semester of that section
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        select: { semesterId: true },
      });
      if (section) {
        where.semesterId = section.semesterId;
      }
    }

    // 6. Faculty Filter
    if (facultyId) {
      where.faculty = {
        some: { facultyId },
      };
    }

    // 7. Role-Based Scoping & Tenant Isolation
    if (session) {
      if (session.role === "STUDENT") {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
          include: { enrollments: true },
        });

        if (student) {
          // Student only sees courses they are currently enrolled in
          const enrolledCourseIds = student.enrollments.map((e) => e.courseId);
          where.id = { in: enrolledCourseIds };
        }
      } else if (["FACULTY", "PROFESSOR"].includes(session.role)) {
        // Teachers see assigned courses, or can request departmental courses
        const faculty = await prisma.faculty.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
        });

        if (faculty && !departmentId) {
          // Restrict to faculty's assigned courses unless specifically querying their department
          where.OR = [
            { faculty: { some: { facultyId: faculty.id } } },
            { departmentId: faculty.departmentId },
          ];
        }
      } else if (session.role === "HOD") {
        const faculty = await prisma.faculty.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
        });
        if (faculty) {
          where.departmentId = faculty.departmentId;
        }
      }
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        department: {
          select: { id: true, code: true, name: true, institutionId: true },
        },
        semester: {
          include: {
            program: {
              select: { id: true, code: true, name: true, degree: true },
            },
            academicYear: {
              select: { id: true, code: true, title: true, isCurrent: true },
            },
            sections: {
              select: { id: true, name: true, capacity: true },
            },
          },
        },
        faculty: {
          include: {
            faculty: {
              include: {
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            attendanceSessions: true,
          },
        },
      },
      orderBy: [{ semester: { semesterNumber: "asc" } }, { code: "asc" }],
    });

    const formatted = courses.map((c) => ({
      id: c.id,
      code: c.code,
      title: c.title,
      shortName: c.shortName || c.title,
      description: c.description,
      subjectType: c.subjectType,
      courseType: c.courseType,
      credits: c.credits,
      lectureHours: c.lectureHours,
      tutorialHours: c.tutorialHours,
      labHours: c.labHours,
      internalMarks: c.internalMarks,
      externalMarks: c.externalMarks,
      totalMarks: c.totalMarks,
      passingMarks: c.passingMarks,
      status: c.status,
      isElective: c.isElective,
      isCommon: c.isCommon,
      syllabusUrl: c.syllabusUrl,
      isActive: c.isActive,
      department: c.department,
      program: c.semester?.program || null,
      academicYear: c.semester?.academicYear || null,
      semester: {
        id: c.semester.id,
        number: c.semester.semesterNumber,
        title: c.semester.title,
        isCurrent: c.semester.isCurrent,
      },
      sections: c.semester?.sections || [],
      assignedFaculty: c.faculty.map((f) => ({
        facultyId: f.facultyId,
        role: f.role,
        fullName: `${f.faculty.user.firstName} ${f.faculty.user.lastName}`,
        email: f.faculty.user.email,
        employeeCode: f.faculty.employeeCode,
      })),
      enrollmentCount: c._count.enrollments,
      attendanceSessionsCount: c._count.attendanceSessions,
    }));

    return NextResponse.json({
      courses: formatted,
      total: formatted.length,
    });
  } catch (error) {
    logger.error("GET /api/courses failure", { error });
    return NextResponse.json(
      { error: "Failed to fetch course catalog" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create Subject / Course Master Entry
 * Authorized for Academic Admins, Principals, and HODs
 */
export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  // Only Leadership / Admin / HOD
  const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"];
  if (!allowedRoles.includes(auth.payload.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions to create master subject records" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      code,
      title,
      shortName,
      description,
      departmentId,
      semesterId,
      subjectType = "CORE",
      courseType = "THEORY",
      credits = 4,
      lectureHours = 3,
      tutorialHours = 0,
      labHours = 0,
      internalMarks = 40,
      externalMarks = 60,
      totalMarks = 100,
      passingMarks = 40,
      isElective = false,
      isCommon = false,
      facultyIds = [],
    } = body;

    if (!code || !title || !departmentId || !semesterId) {
      return NextResponse.json(
        { error: "code, title, departmentId, and semesterId are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate within department
    const existing = await prisma.course.findFirst({
      where: { departmentId, code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Subject with code ${cleanCode} already exists in this department` },
        { status: 409 }
      );
    }

    // Verify Department & Semester exist
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
    if (!semester) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    const course = await prisma.course.create({
      data: {
        code: cleanCode,
        title: title.trim(),
        shortName: shortName?.trim() || title.trim(),
        description: description?.trim() || null,
        departmentId,
        semesterId,
        subjectType,
        courseType,
        credits: Number(credits),
        lectureHours: Number(lectureHours),
        tutorialHours: Number(tutorialHours),
        labHours: Number(labHours),
        internalMarks: Number(internalMarks),
        externalMarks: Number(externalMarks),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        status: "ACTIVE",
        isElective: Boolean(isElective),
        isCommon: Boolean(isCommon),
        isActive: true,
      },
    });

    // Assign faculty if provided
    if (Array.isArray(facultyIds) && facultyIds.length > 0) {
      for (const facId of facultyIds) {
        await prisma.courseFaculty.create({
          data: {
            courseId: course.id,
            facultyId: facId,
            role: "PRIMARY_INSTRUCTOR",
          },
        });
      }
    }

    return NextResponse.json({
      message: "Subject successfully created in academic master catalog",
      course,
    }, { status: 201 });
  } catch (error) {
    logger.error("POST /api/courses error", { error });
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/courses
 * Update Subject / Course Master Metadata
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"];
  if (!allowedRoles.includes(auth.payload.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions to update master subject records" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { id, facultyIds, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Course id is required" }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Build update data
    const dataToUpdate: any = {};
    if (updates.title) dataToUpdate.title = updates.title.trim();
    if (updates.shortName !== undefined) dataToUpdate.shortName = updates.shortName;
    if (updates.description !== undefined) dataToUpdate.description = updates.description;
    if (updates.subjectType) dataToUpdate.subjectType = updates.subjectType;
    if (updates.courseType) dataToUpdate.courseType = updates.courseType;
    if (updates.credits !== undefined) dataToUpdate.credits = Number(updates.credits);
    if (updates.lectureHours !== undefined) dataToUpdate.lectureHours = Number(updates.lectureHours);
    if (updates.tutorialHours !== undefined) dataToUpdate.tutorialHours = Number(updates.tutorialHours);
    if (updates.labHours !== undefined) dataToUpdate.labHours = Number(updates.labHours);
    if (updates.internalMarks !== undefined) dataToUpdate.internalMarks = Number(updates.internalMarks);
    if (updates.externalMarks !== undefined) dataToUpdate.externalMarks = Number(updates.externalMarks);
    if (updates.totalMarks !== undefined) dataToUpdate.totalMarks = Number(updates.totalMarks);
    if (updates.passingMarks !== undefined) dataToUpdate.passingMarks = Number(updates.passingMarks);
    if (updates.status) {
      dataToUpdate.status = updates.status;
      dataToUpdate.isActive = updates.status === "ACTIVE";
    }
    if (updates.isElective !== undefined) dataToUpdate.isElective = Boolean(updates.isElective);
    if (updates.isCommon !== undefined) dataToUpdate.isCommon = Boolean(updates.isCommon);

    const updated = await prisma.course.update({
      where: { id },
      data: dataToUpdate,
    });

    // Update faculty assignments if provided
    if (Array.isArray(facultyIds)) {
      await prisma.courseFaculty.deleteMany({ where: { courseId: id } });
      for (const facId of facultyIds) {
        await prisma.courseFaculty.create({
          data: {
            courseId: id,
            facultyId: facId,
            role: "PRIMARY_INSTRUCTOR",
          },
        });
      }
    }

    return NextResponse.json({
      message: "Subject successfully updated",
      course: updated,
    });
  } catch (error) {
    logger.error("PATCH /api/courses error", { error });
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses
 * Safe Subject Deletion / Archival Protection
 * Prevents hard-deletion of subjects with historical attendance sessions
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Course id is required" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            attendanceSessions: true,
            enrollments: true,
            exams: true,
            assignments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Historical Records Protection (Section 28 of Master Specification)
    const hasHistory =
      course._count.attendanceSessions > 0 ||
      course._count.exams > 0 ||
      course._count.assignments > 0;

    if (hasHistory) {
      // Safe archival transition
      await prisma.course.update({
        where: { id },
        data: {
          status: "ARCHIVED",
          isActive: false,
        },
      });

      return NextResponse.json({
        message: "Subject contains historical attendance or academic records. Hard-deletion intercepted; subject has been safely ARCHIVED to preserve institutional integrity.",
        archived: true,
        attendanceSessionsPreserved: course._count.attendanceSessions,
      });
    }

    // Hard-deletion allowed only if zero historical footprints
    await prisma.courseFaculty.deleteMany({ where: { courseId: id } });
    await prisma.enrollment.deleteMany({ where: { courseId: id } });
    await prisma.course.delete({ where: { id } });

    return NextResponse.json({
      message: "Subject removed successfully from academic catalog",
      deleted: true,
    });
  } catch (error) {
    logger.error("DELETE /api/courses error", { error });
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
