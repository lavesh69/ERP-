import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";
import { getUserDemographics, saveUserDemographics } from "@/lib/profile/extensions";

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
        roles: { include: { role: true } },
        studentProfile: {
          include: {
            program: { include: { department: true } },
            section: true,
            enrollments: {
              include: {
                course: true,
              },
            },
            fees: true,
          },
        },
        facultyProfile: {
          include: {
            department: true,
            courses: {
              include: {
                course: true,
              },
            },
            publications: true,
            researchProjects: true,
          },
        },
        parentProfile: {
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                    program: true,
                    section: true,
                    fees: true,
                  },
                },
              },
            },
          },
        },
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
          include: {
            department: true,
            courses: { include: { course: true } },
            publications: true,
            researchProjects: true,
          },
        });
      }

      profileData = {
        employeeCode: faculty.employeeCode,
        departmentCode: faculty.department?.code || "CSE",
        departmentName: faculty.department?.name || "Computer Science & Engineering",
        designation: faculty.designation,
        qualification: faculty.qualification,
        specialization: faculty.specialization,
        officeRoom: faculty.officeRoom,
        weeklyHours: faculty.weeklyHours,
        joiningDate: faculty.joiningDate.toISOString().split("T")[0],
        assignedCourses: faculty.courses?.map((c) => ({
          id: c.course.id,
          code: c.course.code,
          title: c.course.title,
          credits: c.course.credits,
          role: c.role,
        })) || [],
        publicationsCount: faculty.publications?.length || 0,
        researchProjectsCount: faculty.researchProjects?.length || 0,
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
            enrollments: { include: { course: true } },
            fees: true,
          },
        });
      }

      // Calculate fees
      const totalFees = student.fees?.reduce((acc, f) => acc + f.totalAmount, 0) || 0;
      const paidFees = student.fees?.reduce((acc, f) => acc + f.paidAmount, 0) || 0;
      const pendingDues = Math.max(0, totalFees - paidFees);

      profileData = {
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        admissionDate: student.admissionDate.toISOString().split("T")[0],
        programCode: student.program?.code || "BTECH-CS",
        programName: student.program?.name || "B.Tech Computer Science",
        departmentName: student.program?.department?.name || "Computer Science",
        currentSemester: student.currentSemester,
        sectionName: student.section?.name || "Section A",
        cgpa: student.cgpa,
        attendanceRate: student.attendanceRate,
        status: student.status,
        enrolledCourses: student.enrollments?.map((e) => ({
          id: e.course.id,
          code: e.course.code,
          title: e.course.title,
          credits: e.course.credits,
          status: e.status,
          grade: e.grade,
        })) || [],
        feeSummary: {
          totalFees,
          paidFees,
          pendingDues,
          isCleared: pendingDues === 0,
        },
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
          include: {
            students: {
              include: {
                student: {
                  include: {
                    user: true,
                    program: true,
                    section: true,
                    fees: true,
                  },
                },
              },
            },
          },
        });
      }

      const linkedWards = parent.students?.map((s) => {
        const total = s.student.fees?.reduce((acc, f) => acc + f.totalAmount, 0) || 0;
        const paid = s.student.fees?.reduce((acc, f) => acc + f.paidAmount, 0) || 0;
        return {
          studentId: s.student.id,
          rollNumber: s.student.rollNumber,
          fullName: `${s.student.user.firstName} ${s.student.user.lastName}`,
          programName: s.student.program?.name || "Undergraduate Program",
          semester: s.student.currentSemester,
          attendanceRate: s.student.attendanceRate,
          cgpa: s.student.cgpa,
          pendingDues: Math.max(0, total - paid),
          isPrimary: s.isPrimary,
        };
      }) || [];

      profileData = {
        relation: parent.relation,
        occupation: parent.occupation,
        linkedWards,
      };
    } else {
      // Administrative, Operations, Staff & Governance Roles
      const roleModulesMap: Record<string, string[]> = {
        SUPER_ADMIN: ["System Architecture", "Multi-Campus Governance", "Global Security Audits", "Tenant Management"],
        INSTITUTION_ADMIN: ["Institution Governance", "User Provisioning", "Policy Enforcement", "Campus Configuration"],
        PRINCIPAL: ["Academic Senate", "Faculty Performance", "Executive Approvals", "Institutional KPI"],
        HOD: ["Curriculum Planning", "Faculty Workload Allocation", "Department Electives", "CIA Review"],
        ACCOUNTANT: ["Bursar Ledger", "Fee Structures & Invoices", "Reconciliation & Concessions", "Daily Cashier Operations"],
        LIBRARIAN: ["Koha/RFID Circulation", "Repository Acquisitions", "OPAC Catalog", "Student Book Borrowing"],
        HR_STAFF: ["Employee Lifecycle", "Payroll & Compensation", "Faculty Leave Authorizations", "Staff Appraisal"],
        PLACEMENT_OFFICER: ["Corporate Recruiters Liaison", "ATS Matching Engine", "Interview Coordination", "Alumni Networking"],
        EXAMINATION_CONTROLLER: ["Admit Card Sealing", "Dummy Number Masking", "Hall Seating Optimization", "Official Transcripts"],
        RESEARCH_COORDINATOR: ["Grant Disbursements", "Patent Filings", "Peer Review DOI", "Ethics Clearances"],
        ALUMNI: ["Mentorship Program", "Alumni Directory", "Campus Homecoming", "Endowment Contribution"],
      };

      profileData = {
        jurisdiction: user.institution?.name || "Apex University Headquarters",
        administrativeTier: "Enterprise Staff & Governance Clearance",
        assignedModules: roleModulesMap[user.role] || ["Institutional Core Operations", "Compliance & Reporting"],
        accessClearance: user.role === "SUPER_ADMIN" ? "Level 5 - Sovereign Root" : "Level 4 - Institutional Officer",
        employeeCode: `ADM-${user.id.slice(-4).toUpperCase()}`,
      };
    }

    // Retrieve rich demographics from persistent storage
    const demographics = getUserDemographics(user.id);

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
      demographics: {
        bio: demographics.bio || "",
        bloodGroup: demographics.bloodGroup || "",
        dob: demographics.dob || "",
        gender: demographics.gender || "",
        emergencyContactName: demographics.emergencyContactName || "",
        emergencyContactPhone: demographics.emergencyContactPhone || "",
        address: demographics.address || {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India",
        },
        socialLinks: demographics.socialLinks || {
          linkedin: "",
          github: "",
          website: "",
        },
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
      // Demographics & Extensions
      bio,
      bloodGroup,
      dob,
      gender,
      emergencyContactName,
      emergencyContactPhone,
      address,
      socialLinks,
      // Faculty attributes
      officeRoom,
      specialization,
      qualification,
      designation,
      weeklyHours,
      // Student attributes
      currentSemester,
      // Parent attributes
      occupation,
      relation,
      linkWardRollNumber,
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

    // 2. Persist Demographics & Extensions
    saveUserDemographics(user.id, {
      bio: bio !== undefined ? bio : undefined,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
      dob: dob !== undefined ? dob : undefined,
      gender: gender !== undefined ? gender : undefined,
      emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
      emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
      address: address !== undefined ? address : undefined,
      socialLinks: socialLinks !== undefined ? socialLinks : undefined,
    });

    // 3. Role-specific profile updates
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

        // Link a new ward if requested by roll number
        if (linkWardRollNumber && typeof linkWardRollNumber === "string") {
          const ward = await prisma.student.findUnique({
            where: { rollNumber: linkWardRollNumber.trim() },
          });
          if (ward) {
            const existingRelation = await prisma.studentParentRelation.findUnique({
              where: {
                studentId_parentId: {
                  studentId: ward.id,
                  parentId: user.parentProfile.id,
                },
              },
            });
            if (!existingRelation) {
              await prisma.studentParentRelation.create({
                data: {
                  studentId: ward.id,
                  parentId: user.parentProfile.id,
                  isPrimary: true,
                },
              });
            }
          }
        }
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
      message: "Profile dossier and demographics updated successfully!",
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
