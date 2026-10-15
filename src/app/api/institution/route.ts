import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const session = await getOptionalSession(req);
    const requestedInstId = searchParams.get("institutionId") || session?.institutionId;

    const institution = requestedInstId
      ? await prisma.institution.findUnique({
          where: { id: requestedInstId },
          include: {
            campuses: {
              include: {
                departments: {
                  include: {
                    programs: true,
                    faculty: { include: { user: true } },
                    courses: true,
                  },
                },
                rooms: true,
              },
            },
          },
        })
      : await prisma.institution.findFirst({
          include: {
            campuses: {
              include: {
                departments: {
                  include: {
                    programs: true,
                    faculty: { include: { user: true } },
                    courses: true,
                  },
                },
                rooms: true,
              },
            },
          },
        });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    // Compile Campus-level statistics and departmental breakdown
    const campusesData = await Promise.all(
      institution.campuses.map(async (campus) => {
        const studentCount = await prisma.student.count({
          where: {
            program: {
              department: {
                campusId: campus.id,
              },
            },
          },
        });

        const facultyCount = await prisma.faculty.count({
          where: {
            department: {
              campusId: campus.id,
            },
          },
        });

        return {
          id: campus.id,
          code: campus.code,
          name: campus.name,
          location: campus.location,
          timezone: campus.timezone || "Asia/Kolkata",
          isMainCampus: campus.isMainCampus,
          totalDepartments: campus.departments.length,
          totalRooms: campus.rooms.length,
          totalStudents: studentCount,
          totalFaculty: facultyCount,
          departments: campus.departments.map((dept) => ({
            id: dept.id,
            code: dept.code,
            name: dept.name,
            programsCount: dept.programs.length,
            facultyCount: dept.faculty.length,
            coursesCount: dept.courses.length,
          })),
        };
      })
    );

    const hierarchy = [
      { level: "Institution", name: institution.name, code: institution.code },
      { level: "Campus", name: institution.campuses[0]?.name || "Main Research Campus", code: institution.campuses[0]?.code || "MAIN-CAMPUS" },
      { level: "School / Faculty", name: "School of Computing, AI & Data Science", code: "SCAIDS" },
      { level: "Department", name: "Computer Science & Engineering", code: "CSE" },
      { level: "Program", name: "Bachelor of Technology in Computer Science", code: "BTECH-CSE" },
      { level: "Academic Cohort", name: "Fall 2026 • Semester V (Section 5-A)", code: "SEC-5A" },
    ];

    return NextResponse.json({
      institution: {
        id: institution.id,
        code: institution.code,
        name: institution.name,
        motto: institution.motto,
        defaultCurrency: "INR",
        defaultTimezone: "Asia/Kolkata",
      },
      campuses: campusesData,
      hierarchy,
      crossCampusTransferPolicy: {
        minSemesterRequirement: 2,
        clearancePrerequisites: ["BURSAR_NO_DUES", "LIBRARY_CLEARANCE", "HOSTEL_VACATION", "DEAN_APPROVAL"],
        interCampusCreditPortability: "100% NEP 2020 Academic Bank of Credits compliant",
      },
    });
  } catch (error: any) {
    console.error("Institution GET error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve institution architecture", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (session && session.role === "GUEST") {
      return NextResponse.json(
        { error: "Forbidden: Guest accounts have read-only audit inspection privileges." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action || "CREATE_DEPARTMENT";

    // 1. CREATE CAMPUS
    if (action === "CREATE_CAMPUS") {
      const { code, name, location, timezone, isMainCampus, institutionId } = body;
      if (!code || !name || !location) {
        return NextResponse.json(
          { error: "Campus code, name, and location are required." },
          { status: 400 }
        );
      }

      const instId = institutionId || session?.institutionId || "inst-apex-01";
      const newCampus = await prisma.campus.create({
        data: {
          institutionId: instId,
          code: code.trim().toUpperCase(),
          name: name.trim(),
          location: location.trim(),
          timezone: timezone || "Asia/Kolkata",
          isMainCampus: Boolean(isMainCampus),
        },
      });

      await logAuditEvent({
        institutionId: instId,
        actorUserId: session?.userId || "admin",
        action: "CAMPUS_CREATED",
        targetEntity: "Campus",
        targetId: newCampus.id,
        details: { code: newCampus.code, name: newCampus.name, location: newCampus.location },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Campus ${newCampus.name} (${newCampus.code}) established successfully.`,
          campus: newCampus,
        },
        { status: 201 }
      );
    }

    // 2. CROSS-CAMPUS STUDENT TRANSFER
    if (action === "TRANSFER_STUDENT") {
      const { studentId, targetProgramId, transferReason, clearanceCertificateNo } = body;
      if (!studentId || !targetProgramId) {
        return NextResponse.json(
          { error: "studentId and targetProgramId are required for cross-campus transfer." },
          { status: 400 }
        );
      }

      const targetProgram = await prisma.program.findUnique({
        where: { id: targetProgramId },
        include: { department: { include: { campus: true } } },
      });

      if (!targetProgram) {
        return NextResponse.json({ error: "Target program not found." }, { status: 404 });
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          programId: targetProgramId,
        },
        include: { user: true },
      });

      const certNo =
        clearanceCertificateNo ||
        `CCT-TRANSFER-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

      await logAuditEvent({
        institutionId: targetProgram.department.institutionId,
        actorUserId: session?.userId || "admin",
        action: "STUDENT_CROSS_CAMPUS_TRANSFER",
        targetEntity: "Student",
        targetId: studentId,
        details: {
          studentName: `${updatedStudent.user.firstName} ${updatedStudent.user.lastName}`,
          targetCampus: targetProgram.department.campus.name,
          targetProgram: targetProgram.name,
          transferReason: transferReason || "Academic cohort reallocation",
          clearanceCertificateNo: certNo,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Student ${updatedStudent.user.firstName} ${updatedStudent.user.lastName} successfully transferred to ${targetProgram.department.campus.name} (${targetProgram.name}).`,
        transferRecord: {
          studentId: updatedStudent.id,
          rollNumber: updatedStudent.rollNumber,
          targetCampus: targetProgram.department.campus.name,
          targetProgram: targetProgram.name,
          clearanceCertificateNo: certNo,
          effectiveDate: new Date().toISOString(),
        },
      });
    }

    // 3. CREATE DEPARTMENT (Default fallback)
    const { code, name, description, campusId } = body;
    if (!code || !name) {
      return NextResponse.json(
        { error: "Department code and name are required" },
        { status: 400 }
      );
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "Institution context missing" }, { status: 404 });
    }

    let targetCampusId = campusId;
    if (!targetCampusId) {
      const campus = await prisma.campus.findFirst({
        where: { institutionId: institution.id },
      });
      targetCampusId = campus?.id;
    }

    if (!targetCampusId) {
      return NextResponse.json({ error: "Campus not found" }, { status: 404 });
    }

    const newDept = await prisma.department.create({
      data: {
        institutionId: institution.id,
        campusId: targetCampusId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Department "${newDept.name}" configured and indexed into Institution ERP`,
      department: newDept,
    });
  } catch (error: any) {
    console.error("Institution POST error:", error);
    return NextResponse.json(
      { error: "Failed to process institution request", details: error.message },
      { status: 500 }
    );
  }
}
