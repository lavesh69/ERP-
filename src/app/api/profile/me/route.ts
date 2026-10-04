import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session?.userId && !session?.email) {
      return NextResponse.json(
        { error: "Authentication required to access profile" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findFirst({
      where: session.userId ? { id: session.userId } : { email: session.email },
      include: {
        institution: true,
        studentProfile: {
          include: {
            program: { include: { department: true } },
            section: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
        parentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // Role-specific profile object
    let profileData: any = null;

    if (user.role === "FACULTY" || user.role === "PROFESSOR" || user.role === "HOD") {
      let faculty = user.facultyProfile;
      if (!faculty) {
        // Auto-initialize faculty profile if missing
        let dept = await prisma.department.findFirst();
        if (!dept) {
          const campus = (await prisma.campus.findFirst()) || (await prisma.campus.create({
            data: {
              institutionId: user.institutionId,
              code: "CAMPUS-MAIN",
              name: "Main Campus",
              location: "Academic Square",
            },
          }));
          dept = await prisma.department.create({
            data: {
              institutionId: user.institutionId,
              campusId: campus.id,
              code: "CSE",
              name: "Computer Science & Engineering",
            },
          });
        }

        faculty = await prisma.faculty.create({
          data: {
            userId: user.id,
            departmentId: dept.id,
            employeeCode: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
            designation: "Assistant Professor",
            qualification: "Ph.D. / M.Tech in Discipline",
            specialization: "General Engineering & Computing",
            officeRoom: "Academic Block A, Cabin 302",
            joiningDate: new Date(),
            weeklyHours: 18,
          },
          include: { department: true },
        });
      }

      profileData = {
        employeeCode: faculty.employeeCode,
        departmentCode: faculty.department.code,
        departmentName: faculty.department.name,
        designation: faculty.designation,
        qualification: faculty.qualification,
        specialization: faculty.specialization,
        officeRoom: faculty.officeRoom,
        weeklyHours: faculty.weeklyHours,
        joiningDate: faculty.joiningDate.toISOString().split("T")[0],
      };
    } else if (user.role === "STUDENT") {
      let student = user.studentProfile;
      if (!student) {
        let program = await prisma.program.findFirst();
        if (!program) {
          const dept = (await prisma.department.findFirst()) || (await prisma.department.create({
            data: {
              institutionId: user.institutionId,
              campusId: (await prisma.campus.findFirst())?.id || "campus-1",
              code: "CSE",
              name: "Computer Science & Engineering",
            },
          }));
          program = await prisma.program.create({
            data: {
              departmentId: dept.id,
              code: "BTECH-CS",
              name: "Bachelor of Technology in Computer Science",
              degree: "B.Tech",
              durationYears: 4,
              totalCredits: 160,
            },
          });
        }

        const appNo = `APP-${Date.now().toString().slice(-6)}`;
        student = await prisma.student.create({
          data: {
            userId: user.id,
            programId: program.id,
            rollNumber: appNo,
            admissionNumber: appNo,
            admissionDate: new Date(),
            currentSemester: 1,
            cgpa: 0.0,
            attendanceRate: 100.0,
            status: "ACTIVE",
          },
          include: {
            program: { include: { department: true } },
            section: true,
          },
        });
      }

      profileData = {
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        programCode: student.program.code,
        programName: student.program.name,
        departmentName: student.program.department.name,
        currentSemester: student.currentSemester,
        sectionName: student.section?.name || "Section A",
        cgpa: student.cgpa,
        attendanceRate: student.attendanceRate,
        status: student.status,
      };
    } else if (user.role === "PARENT") {
      let parent = user.parentProfile;
      if (!parent) {
        parent = await prisma.parent.create({
          data: {
            userId: user.id,
            relation: "GUARDIAN",
            occupation: "Registered Parent",
          },
        });
      }
      profileData = {
        relation: parent.relation,
        occupation: parent.occupation,
      };
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role,
        institutionId: user.institutionId,
        institutionName: user.institution?.name || "Apex Institute of Science & Technology",
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt.toISOString().split("T")[0],
      },
      profile: profileData,
    });
  } catch (error: any) {
    logger.error("Profile GET Error", error);
    return NextResponse.json(
      { error: "Failed to retrieve user profile dossier" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session?.userId && !session?.email) {
      return NextResponse.json(
        { error: "Authentication required to update profile" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      firstName,
      lastName,
      phone,
      avatarUrl,
      // Faculty attributes
      officeRoom,
      specialization,
      qualification,
      designation,
      weeklyHours,
      // Student attributes
      currentSemester,
      residence,
      emergencyContact,
      // Parent attributes
      occupation,
      relation,
    } = body;

    const user = await prisma.user.findFirst({
      where: session.userId ? { id: session.userId } : { email: session.email },
      include: {
        facultyProfile: true,
        studentProfile: true,
        parentProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // 1. Update Base User record
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(firstName ? { firstName: firstName.trim() } : {}),
        ...(lastName ? { lastName: lastName.trim() } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl.trim() } : {}),
      },
    });

    // 2. Role-specific profile updates
    if (user.role === "FACULTY" || user.role === "PROFESSOR" || user.role === "HOD") {
      if (user.facultyProfile) {
        await prisma.faculty.update({
          where: { id: user.facultyProfile.id },
          data: {
            ...(officeRoom ? { officeRoom: officeRoom.trim() } : {}),
            ...(specialization ? { specialization: specialization.trim() } : {}),
            ...(qualification ? { qualification: qualification.trim() } : {}),
            ...(designation ? { designation: designation.trim() } : {}),
            ...(weeklyHours ? { weeklyHours: Number(weeklyHours) } : {}),
          },
        });
      }
    } else if (user.role === "STUDENT") {
      if (user.studentProfile) {
        await prisma.student.update({
          where: { id: user.studentProfile.id },
          data: {
            ...(currentSemester ? { currentSemester: Number(currentSemester) } : {}),
          },
        });
      }
    } else if (user.role === "PARENT") {
      if (user.parentProfile) {
        await prisma.parent.update({
          where: { id: user.parentProfile.id },
          data: {
            ...(occupation ? { occupation: occupation.trim() } : {}),
            ...(relation ? { relation: relation.trim() } : {}),
          },
        });
      }
    }

    await logAuditEvent({
      institutionId: user.institutionId,
      actorUserId: user.id,
      action: "PROFILE_UPDATED",
      targetEntity: "User",
      targetId: user.id,
      details: {
        fieldsUpdated: Object.keys(body),
        updatedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile dossier updated successfully!",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    logger.error("Profile PATCH Error", error);
    return NextResponse.json(
      { error: "Failed to update profile dossier" },
      { status: 500 }
    );
  }
}
