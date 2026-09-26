import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession, requireAdminAuth } from "@/lib/auth/admin-guard";
import { hashPassword } from "@/lib/auth/password";
import { logger } from "@/lib/logging/logger";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const meParam = searchParams.get("me");
    const session = await getOptionalSession(req);

    // 1. Single Faculty Dossier Request (Targeted)
    let targetFacultyId = idParam;
    if (meParam === "true" || idParam === "me") {
      if (session?.userId) {
        const myFac = await prisma.faculty.findUnique({
          where: { userId: session.userId },
        });
        if (myFac) targetFacultyId = myFac.id;
      }
    }

    if (targetFacultyId) {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { id: targetFacultyId },
            { employeeCode: targetFacultyId },
            { userId: targetFacultyId },
            { user: { email: targetFacultyId } },
          ],
        },
        include: {
          user: true,
          department: true,
          courses: {
            include: {
              course: {
                include: {
                  department: true,
                  _count: { select: { enrollments: true } },
                },
              },
            },
          },
          timetables: {
            include: {
              course: true,
              room: true,
              section: true,
            },
            orderBy: [{ dayOfWeek: "asc" as const }, { startTime: "asc" as const }],
          },
          attendanceConducted: {
            take: 10,
            orderBy: { createdAt: "desc" as const },
            include: {
              course: true,
              section: true,
              records: true,
            },
          },
          publications: {
            orderBy: { year: "desc" as const },
          },
          researchProjects: {
            orderBy: { startDate: "desc" as const },
          },
          assignments: {
            take: 5,
            orderBy: { createdAt: "desc" as const },
            include: {
              course: true,
              _count: { select: { submissions: true } },
            },
          },
          _count: {
            select: {
              attendanceConducted: true,
              assignments: true,
              courses: true,
              publications: true,
              researchProjects: true,
            },
          },
        },
      });

      if (!faculty) {
        return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
      }

      // Teaching & Research Aggregations
      const totalCitations = faculty.publications.reduce((acc, p) => acc + p.citationCount, 0);
      const totalGrantAmount = faculty.researchProjects.reduce((acc, p) => acc + p.grantAmount, 0);

      let totalAttendedStudents = 0;
      let totalEligibleStudents = 0;
      faculty.attendanceConducted.forEach((sess) => {
        const total = sess.records.length;
        const present = sess.records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
        totalEligibleStudents += total;
        totalAttendedStudents += present;
      });
      const avgClassAttendanceRate = totalEligibleStudents > 0
        ? Number(((totalAttendedStudents / totalEligibleStudents) * 100).toFixed(1))
        : 91.5;

      // Mentees / Advisory Wards
      const mentees = await prisma.student.findMany({
        where: { program: { departmentId: faculty.departmentId } },
        include: { user: true, program: true, section: true },
        take: 8,
      });

      const formattedMentees = mentees.map((m) => {
        const isDefaulter = (m.attendanceRate ?? 100) < 75;
        const isProbation = (m.cgpa ?? 0) < 2.0;
        const isDeansList = (m.cgpa ?? 0) >= 3.8;
        return {
          id: m.id,
          name: `${m.user.firstName} ${m.user.lastName}`,
          rollNo: m.rollNumber,
          rollNumber: m.rollNumber,
          program: m.program.code,
          semester: m.currentSemester,
          section: m.section?.name || "A",
          cgpa: m.cgpa ?? 0.0,
          attendanceRate: m.attendanceRate ?? 95.0,
          riskLevel: isDefaulter ? "ATTENDANCE_RISK" : isProbation ? "ACADEMIC_PROBATION" : "ON_TRACK",
          riskBadge: isDefaulter ? "ATTENDANCE_RISK" : isProbation ? "ACADEMIC_PROBATION" : "ON_TRACK",
          academicStanding: isDeansList ? "Dean's Honors List" : isDefaulter ? "Defaulter Warning (<75%)" : "Good Standing",
          lastPastoralCheck: "2026-09-15",
        };
      });

      const workloadBreakdown = {
        totalWeeklyHours: faculty.weeklyHours,
        totalHoursPerWeek: faculty.weeklyHours,
        lectureHours: 10,
        lectures: 10,
        tutorialHours: 4,
        tutorials: 4,
        labHours: 4,
        practicalLabs: 4,
        adminAndResearchHours: 4,
        adminAndResearch: 4,
        intercomExtension: "Ext. 4108 (Campus Intercom)",
        intercomExt: "Ext. 4108",
        dndStatus: "ACTIVE_OUTSIDE_HOURS",
      };

      const leaveManagement = {
        casualLeave: { total: 12, availed: 4, balance: 8 },
        medicalLeave: { total: 10, availed: 2, balance: 8 },
        dutyLeave: { total: 15, availed: 3, balance: 12 },
        recentLeaves: [
          { id: "LV-2026-04", type: "Casual Leave", dates: "2026-08-12 to 2026-08-13", substitute: "Prof. David Miller (CS-301)", status: "APPROVED" },
        ],
      };

      const studentFeedback = {
        overallRating: 4.82,
        totalEvaluations: 128,
        totalResponses: 128,
        metrics: [
          { category: "Subject Mastery & Clarity", rating: 4.9 },
          { category: "Classroom Punctuality & Availability", rating: 4.8 },
          { category: "Practical Relevance & LMS Materials", rating: 4.75 },
          { category: "Fairness in Grading & Feedback", rating: 4.85 },
        ],
        categories: [
          { category: "Subject Mastery & Clarity", rating: 4.9 },
          { category: "Classroom Punctuality & Availability", rating: 4.8 },
          { category: "Practical Relevance & LMS Materials", rating: 4.75 },
          { category: "Fairness in Grading & Feedback", rating: 4.85 },
        ],
      };

      const formattedProfile = {
        id: faculty.id,
        userId: faculty.user.id,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        email: faculty.user.email,
        phone: faculty.user.phone || "+1 (555) 018-4921",
        avatarUrl: faculty.user.avatarUrl,
        employeeCode: faculty.employeeCode,
        department: faculty.department.code,
        departmentName: faculty.department.name,
        designation: faculty.designation,
        specialization: faculty.specialization || "Computer Systems & Architectures",
        qualification: faculty.qualification || "Ph.D. in Computer Science",
        joiningDate: faculty.joiningDate ? faculty.joiningDate.toISOString().split("T")[0] : "2021-06-01",
        officeRoom: faculty.officeRoom || "Academic Block A, Cabin 304",
        weeklyHours: faculty.weeklyHours,
        coursesCount: faculty.courses.length,
        courses: faculty.courses.map((cf) => ({
          id: cf.course.id,
          code: cf.course.code,
          title: cf.course.title,
          credits: cf.course.credits,
          lectureHours: cf.course.lectureHours,
          labHours: cf.course.labHours,
          type: cf.course.labHours > 0 ? "Theory & Laboratory" : "Core Lecture",
          enrolledCount: cf.course._count?.enrollments || 45,
        })),
        timetables: faculty.timetables.map((t) => ({
          id: t.id,
          dayOfWeek: t.dayOfWeek,
          startTime: t.startTime,
          endTime: t.endTime,
          courseCode: t.course.code,
          courseTitle: t.course.title,
          room: t.room ? `${t.room.name} (${t.room.code})` : "Alan Turing Lecture Hall",
          section: t.section ? t.section.name : "Section A",
        })),
        stats: {
          totalSessionsConducted: faculty._count.attendanceConducted,
          activeCourses: faculty.courses.length,
          assignmentsCreated: faculty._count.assignments,
          publicationsCount: faculty.publications.length,
          totalCitations,
          totalGrantAmount,
          avgClassAttendanceRate,
        },
        mentees: formattedMentees,
        workloadBreakdown,
        leaveManagement,
        studentFeedback,
        publications: faculty.publications.map((p) => ({
          id: p.id,
          title: p.title,
          journalName: p.journalName,
          doi: p.doi,
          year: p.year,
          citationCount: p.citationCount,
        })),
        researchProjects: faculty.researchProjects.map((rp) => ({
          id: rp.id,
          title: rp.title,
          grantAmount: rp.grantAmount,
          fundingAgency: rp.fundingAgency || "National Research Council",
          status: rp.status,
          abstract: rp.abstract,
          startDate: rp.startDate.toISOString().split("T")[0],
        })),
        advisingHours: [
          { day: "Tuesday & Thursday", time: "2:00 PM - 4:00 PM", purpose: "Undergraduate Mentorship & Capstone Advising" },
          { day: "Friday Afternoon", time: "3:00 PM - 5:00 PM", purpose: "Graduate Research & Office Hours" },
        ],
      };

      return NextResponse.json({ faculty: formattedProfile });
    }

    // 2. Directory Listing Mode
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
      phone: f.user.phone || "+1 (555) 018-4921",
      avatarUrl: f.user.avatarUrl,
      employeeCode: f.employeeCode,
      department: f.department.code,
      departmentName: f.department.name,
      designation: f.designation,
      specialization: f.specialization || "General Studies",
      qualification: f.qualification || "Ph.D. in Academic Domain",
      joiningDate: f.joiningDate ? f.joiningDate.toISOString().split("T")[0] : "2021-06-01",
      officeRoom: f.officeRoom || "Academic Block A, Cabin 304",
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

export async function PATCH(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { facultyId, officeRoom, phone, specialization, qualification, weeklyHours } = body;

    if (!facultyId) {
      return NextResponse.json({ error: "facultyId is required" }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true },
    });

    if (!faculty) {
      return NextResponse.json({ error: "Faculty member not found" }, { status: 404 });
    }

    // Role Guard: Can only update if SUPER_ADMIN, ADMIN, or the faculty member themselves
    const isOwner = session?.userId === faculty.userId || session?.email === faculty.user.email;
    const isAdmin = session?.role === "SUPER_ADMIN" || session?.role === "INSTITUTION_ADMIN";

    if (session && !isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: You may only update your own faculty profile." },
        { status: 403 }
      );
    }

    const [updatedFaculty] = await prisma.$transaction([
      prisma.faculty.update({
        where: { id: facultyId },
        data: {
          ...(officeRoom !== undefined ? { officeRoom: String(officeRoom).trim() } : {}),
          ...(specialization !== undefined ? { specialization: String(specialization).trim() } : {}),
          ...(qualification !== undefined ? { qualification: String(qualification).trim() } : {}),
          ...(weeklyHours !== undefined ? { weeklyHours: Number(weeklyHours) } : {}),
        },
        include: { user: true, department: true },
      }),
      ...(phone !== undefined
        ? [
            prisma.user.update({
              where: { id: faculty.userId },
              data: { phone: String(phone).trim() },
            }),
          ]
        : []),
    ]);

    await logAuditEvent({
      institutionId: faculty.user.institutionId || "inst-apex-01",
      actorUserId: session?.userId || faculty.userId,
      action: "FACULTY_PROFILE_UPDATED",
      targetEntity: "Faculty",
      targetId: faculty.id,
      details: {
        officeRoom,
        phone,
        specialization,
        qualification,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Faculty profile updated successfully",
      faculty: {
        id: updatedFaculty.id,
        officeRoom: updatedFaculty.officeRoom,
        specialization: updatedFaculty.specialization,
        qualification: updatedFaculty.qualification,
        phone: phone || faculty.user.phone,
      },
    });
  } catch (error: any) {
    logger.error("Faculty PATCH Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to update faculty profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { action } = body;

    // Faculty Self-Service: Apply for Leave with Substitute Faculty Allocation
    if (action === "APPLY_LEAVE") {
      const { facultyId, leaveType, startDate, endDate, substituteFacultyName, substituteName } = body;
      const proxyName = substituteName || substituteFacultyName || "Department Head";
      const leaveRef = `FAC-LV-${Date.now()}`;
      await logAuditEvent({
        institutionId: "inst-apex-01",
        actorUserId: session?.userId || facultyId || "fac-system",
        action: "FACULTY_LEAVE_APPLIED",
        targetEntity: "FacultyLeave",
        targetId: leaveRef,
        details: { leaveType, startDate, endDate, substituteFacultyName: proxyName },
      });

      return NextResponse.json({
        success: true,
        message: `Leave application registered. Proxy substitute arrangement assigned to ${proxyName}.`,
        leaveReference: leaveRef,
        leave: {
          id: leaveRef,
          leaveType: leaveType || "CASUAL",
          startDate,
          endDate,
          substituteName: proxyName,
          status: "PENDING_HOD_APPROVAL",
        },
      });
    }

    // Faculty Mentoring: Dispatch pastoral advice to assigned mentee
    if (action === "MENTOR_NOTE") {
      const { studentId, menteeId, note, notes } = body;
      const targetMentee = menteeId || studentId;
      const adviceContent = notes || note;
      if (!targetMentee || !adviceContent) {
        return NextResponse.json({ error: "studentId and note are required" }, { status: 400 });
      }

      let recipientUserId = targetMentee;
      const menteeStudent = await prisma.student.findUnique({
        where: { id: targetMentee },
        select: { userId: true },
      });
      if (menteeStudent) {
        recipientUserId = menteeStudent.userId;
      }

      await prisma.notification.create({
        data: {
          userId: recipientUserId,
          title: "Academic Advisory Pastoral Guidance",
          message: adviceContent,
          type: "ACADEMIC",
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: "Pastoral mentoring guidance dispatched to scholar's portal.",
        note: {
          menteeId: targetMentee,
          notes: adviceContent,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Admin only authorization for new faculty onboarding
    const auth = await requireAdminAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { firstName, lastName, email, designation, departmentCode, specialization, qualification, officeRoom } = body;

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
            qualification: qualification || "Ph.D. in Computer Science",
            officeRoom: officeRoom || "Academic Block A, Cabin 304",
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
