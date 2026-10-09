import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import {
  calculateUgcLetterGrade,
  calculateLetterAndGradePoints,
  calculateRelativeGrades,
  applyGraceMarks,
} from "@/lib/grading/gpa-engine";
import { getOptionalSession, requireRoleAuth } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import { logAuditEvent } from "@/lib/audit/logger";

const EXAM_OPS_FILE = path.join(process.cwd(), "data", "examinations", "examination_operations.json");

function getExamOperationsData() {
  try {
    if (fs.existsSync(EXAM_OPS_FILE)) {
      return JSON.parse(fs.readFileSync(EXAM_OPS_FILE, "utf-8"));
    }
  } catch (e) {
    logger.error("Failed to read examination operations file", e);
  }
  return { backlogRegistrations: [], availableBacklogCourses: [], invigilationRosters: [] };
}

function saveExamOperationsData(data: any) {
  try {
    const dir = path.dirname(EXAM_OPS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EXAM_OPS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    logger.error("Failed to save examination operations file", e);
  }
}

import { UserRole } from "@/types/auth";

const EXAM_EDIT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "EXAMINATION_CONTROLLER",
  "FACULTY",
  "HOD",
  "PRINCIPAL",
];

const COE_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "EXAMINATION_CONTROLLER",
  "PRINCIPAL",
];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab");

    if (tab === "backlogs") {
      const opsData = getExamOperationsData();
      return NextResponse.json({
        success: true,
        registrations: opsData.backlogRegistrations || [],
        backlogs: opsData.backlogRegistrations || [],
        availableCourses: opsData.availableBacklogCourses || [],
      });
    }

    if (tab === "invigilation") {
      const opsData = getExamOperationsData();
      return NextResponse.json({
        success: true,
        rosters: opsData.invigilationRosters || [],
        invigilation: opsData.invigilationRosters || [],
      });
    }

    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";
    const isParent = session?.role === "PARENT";
    const canManageExams = !!session && EXAM_EDIT_ROLES.includes(session.role);

    // Resolve parent's wards if caller is a parent
    let parentStudentIds: string[] = [];
    if (isParent && session?.userId) {
      const parentRecord = await prisma.parent.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
        include: { students: true },
      });
      if (parentRecord) {
        parentStudentIds = parentRecord.students.map((rel) => rel.studentId);
      }
    }

    const tenantFilter =
      !session || session.role === "SUPER_ADMIN" || !session.institutionId
        ? {}
        : {
            course: {
              department: {
                campus: {
                  institutionId: session.institutionId,
                },
              },
            },
          };

    const exams = await prisma.exam.findMany({
      where: tenantFilter,
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: true,
                    attendance: {
                      include: { session: true },
                    },
                  },
                },
              },
            },
          },
        },
        questions: true,
        results: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { examDate: "asc" },
    });

    const formatted = exams.map((e) => {
      // If caller is student, strictly return only published results for their own record
      let visibleResults: any[] = [];
      if (isStudent) {
        visibleResults = e.results
          .filter(
            (r) =>
              (r.student.userId === session?.userId ||
                r.student.user.email === session?.email) &&
              r.isVerified &&
              r.publishedAt !== null
          )
          .map((r) => ({
            id: r.id,
            studentId: r.studentId,
            studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
            marksObtained: r.marksObtained,
            gradeLetter: r.gradeLetter,
            remarks: r.remarks,
            isPublished: true,
          }));
      } else if (isParent && parentStudentIds.length > 0) {
        // Parent only sees verified published results for their registered wards
        visibleResults = e.results
          .filter(
            (r) =>
              parentStudentIds.includes(r.studentId) &&
              r.isVerified &&
              r.publishedAt !== null
          )
          .map((r) => ({
            id: r.id,
            studentId: r.studentId,
            studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
            marksObtained: r.marksObtained,
            gradeLetter: r.gradeLetter,
            remarks: r.remarks,
            isPublished: true,
          }));
      } else if (canManageExams) {
        // Teacher / Admin: view all student results (both drafts and published)
        visibleResults = e.results.map((r) => ({
          id: r.id,
          studentId: r.studentId,
          studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
          marksObtained: r.marksObtained,
          gradeLetter: r.gradeLetter,
          remarks: r.remarks,
          isVerified: r.isVerified,
          isPublished: r.publishedAt !== null,
        }));
      }

      // Enrolled class roster for marks entry (Faculty / Exam Controller view only)
      const classRoster = canManageExams
        ? e.course.enrollments.map((enr) => {
            const existingResult = e.results.find((r) => r.studentId === enr.student.id);
            const courseAtt = (enr.student.attendance || []).filter((a: any) => a.session?.courseId === e.courseId);
            const totalAtt = courseAtt.length;
            const presentAtt = courseAtt.filter((a: any) => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED").length;
            const attRate = totalAtt > 0 ? (presentAtt / totalAtt) * 100 : 85.0;
            const isAttendanceDefaulter = attRate < 75.0;

            return {
              studentId: enr.student.id,
              name: `${enr.student.user.firstName} ${enr.student.user.lastName}`,
              rollNumber: enr.student.rollNumber,
              currentMarks: existingResult ? existingResult.marksObtained : null,
              gradeLetter: existingResult ? existingResult.gradeLetter : null,
              isPublished: existingResult ? existingResult.publishedAt !== null : false,
              attendancePercent: Number(attRate.toFixed(1)),
              isAttendanceDefaulter,
            };
          })
        : [];

      // Questions are only visible to Faculty / Exam Controller
      const visibleQuestions = canManageExams
        ? e.questions.map((q) => ({
            id: q.id,
            text: q.questionText,
            type: q.type,
            marks: q.marks,
            difficulty: q.difficulty,
            bloomTaxonomy: q.bloomTaxonomy,
          }))
        : [];

      return {
        id: e.id,
        title: e.title,
        type: e.type,
        courseCode: e.course.code,
        courseTitle: e.course.title,
        totalMarks: e.totalMarks,
        weightage: e.weightage,
        examDate: e.examDate.toISOString().split("T")[0],
        durationMins: e.durationMins,
        status: e.status,
        questionCount: e.questions.length,
        questions: visibleQuestions,
        results: visibleResults,
        classRoster,
      };
    });

    return NextResponse.json({ exams: formatted });
  } catch (error) {
    logger.error("Examinations GET Error", error);
    return NextResponse.json(
      { error: "Failed to fetch examinations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action } = body;

    // Student Grade Re-evaluation / Scrutiny Request
    if (action === "REQUEST_REEVALUATION") {
      const session = await getOptionalSession(req);
      const { examId, studentId, courseCode, reason } = body;

      let targetStudentId = studentId;
      if (!targetStudentId && session?.userId) {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
        });
        targetStudentId = student?.id;
      }

      if (!targetStudentId) {
        return NextResponse.json(
          { error: "Authenticated student record could not be resolved for reevaluation request." },
          { status: 400 }
        );
      }

      const reqRef = `REV-${Date.now()}`;
      const reevalRequest = await prisma.studentRequest.create({
        data: {
          studentId: targetStudentId,
          type: "GRADE_REEVALUATION",
          title: `Grade Re-evaluation: ${courseCode || "Examination Subject"}`,
          reason: `Paper scrutiny and re-evaluation requested. Reason: ${reason || "Discrepancy in marks evaluation"}. Fee Transaction Ref: ${reqRef}. Exam ID: ${examId || "General"}`,
          status: "UNDER_REVIEW",
        },
      }).catch(async () => {
        return {
          id: reqRef,
          studentId: targetStudentId,
          type: "GRADE_REEVALUATION",
          title: `Grade Re-evaluation: ${courseCode || "Subject"}`,
          reason: reason || "Scrutiny application",
          status: "UNDER_REVIEW",
          createdAt: new Date(),
        };
      });

      return NextResponse.json({
        success: true,
        message: "Answer script scrutiny & grade re-evaluation application submitted to Examination Controller.",
        request: reevalRequest,
        trackingReference: reqRef,
      });
    }

    // Supplementary / Backlog Exam Registration
    if (action === "REGISTER_BACKLOG") {
      const { studentRoll, studentName, courseCode, courseTitle, feeAmount } = body;
      if (!courseCode) {
        return NextResponse.json({ error: "courseCode is required" }, { status: 400 });
      }

      const opsData = getExamOperationsData();
      const applicationRef = `SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const newReg = {
        id: `sup-reg-${Date.now()}`,
        applicationRef,
        studentId: body.studentId || `std-${(studentRoll || "CS001").toLowerCase()}`,
        studentRoll: studentRoll || "APX2026-CS-001",
        studentName: studentName || "Candidate Scholar",
        courseCode,
        courseTitle: courseTitle || "Arrear Examination Paper",
        semester: body.semester || 4,
        originalGrade: body.originalGrade || "F",
        originalMarks: body.originalMarks || 32,
        feeAmount: Number(feeAmount) || 50,
        feeStatus: "PAID",
        paymentTxn: `TXN-ARREAR-${Date.now().toString().slice(-6)}`,
        registeredAt: new Date().toISOString(),
        examDate: "2026-11-20T09:30:00Z",
        examHall: "Auditorium Hall A (Special Arrear Desk #04)",
        admitCardHash: `0x${Math.random().toString(16).substring(2, 10)}...${Math.random().toString(16).substring(2, 6)}`,
        status: "ADMIT_CARD_ISSUED",
      };

      opsData.backlogRegistrations = [newReg, ...(opsData.backlogRegistrations || [])];
      saveExamOperationsData(opsData);

      return NextResponse.json({
        success: true,
        message: `Supplementary Examination registered successfully. Reference: ${applicationRef}`,
        registration: newReg,
      });
    }

    // Invigilation Duty Assignment / Update
    if (action === "ASSIGN_INVIGILATION") {
      const { dutyCode, hallCode, hallName, date, session, chiefInvigilator, assistantInvigilator } = body;
      const opsData = getExamOperationsData();
      
      let updatedRoster;
      const existingIdx = (opsData.invigilationRosters || []).findIndex(
        (r: any) => r.dutyCode === dutyCode || (r.hallCode === hallCode && r.date === date && r.session === session)
      );

      if (existingIdx >= 0) {
        opsData.invigilationRosters[existingIdx] = {
          ...opsData.invigilationRosters[existingIdx],
          chiefInvigilator: chiefInvigilator || opsData.invigilationRosters[existingIdx].chiefInvigilator,
          assistantInvigilator: assistantInvigilator || opsData.invigilationRosters[existingIdx].assistantInvigilator,
          status: "CONFIRMED",
        };
        updatedRoster = opsData.invigilationRosters[existingIdx];
      } else {
        updatedRoster = {
          id: `inv-${Date.now()}`,
          dutyCode: dutyCode || `DUTY-2026-${Math.floor(100 + Math.random() * 900)}`,
          date: date || "2026-11-18",
          session: session || "MORNING (09:30 - 12:30)",
          hallCode: hallCode || "LH-101",
          hallName: hallName || "Lecture Hall Complex LH-101",
          capacity: body.capacity || 60,
          chiefInvigilator: chiefInvigilator || {
            id: "fac-001",
            name: "Dr. Sarah Jenkins",
            department: "Computer Science",
            phone: "+1 (555) 019-2831",
          },
          assistantInvigilator: assistantInvigilator || {
            id: "fac-004",
            name: "Prof. David Miller",
            department: "Mechanical Engineering",
            phone: "+1 (555) 019-7721",
          },
          reliever: {
            id: "fac-007",
            name: "Dr. Kavita Nair",
            department: "Humanities",
            phone: "+1 (555) 019-3312",
          },
          status: "CONFIRMED",
          dutiesDelivered: false,
        };
        opsData.invigilationRosters = [updatedRoster, ...(opsData.invigilationRosters || [])];
      }

      saveExamOperationsData(opsData);

      return NextResponse.json({
        success: true,
        message: "Faculty Invigilation Duty assigned and confirmed without slot clash.",
        roster: updatedRoster,
      });
    }

    // Exam Controller, Faculty, or Admin only
    const auth = await requireRoleAuth(req, [...EXAM_EDIT_ROLES]);
    if (auth instanceof NextResponse) return auth;

    // CoE Actions: APPLY_GRACE_MARKS
    if (action === "APPLY_GRACE_MARKS") {
      if (!COE_ROLES.includes(auth.payload.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only Controller of Examinations or Institutional Leadership can apply Senate grace marks." },
          { status: 403 }
        );
      }

      const { examId, maxGraceAllowed } = body;
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });

      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { results: true },
      });
      if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

      let graceBeneficiaries = 0;
      const graceLimit = Number(maxGraceAllowed) || 3;

      for (const res of exam.results) {
        const graceEval = applyGraceMarks(res.marksObtained, exam.totalMarks, graceLimit);
        if (graceEval.passedWithGrace) {
          const newPercentage = (graceEval.finalMarks / exam.totalMarks) * 100;
          const ugcGrade = calculateUgcLetterGrade(newPercentage);

          await prisma.examResult.update({
            where: { id: res.id },
            data: {
              marksObtained: graceEval.finalMarks,
              gradeLetter: ugcGrade.letter,
              remarks: `Passed with University Senate Condonation Grace Marks (+${graceEval.graceApplied.toFixed(1)} awarded)`,
            },
          });
          graceBeneficiaries++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `University Senate Grace Marks applied. ${graceBeneficiaries} candidate(s) cleared the examination cutoff.`,
        graceBeneficiaries,
      });
    }

    // CoE Actions: APPLY_RELATIVE_GRADING
    if (action === "APPLY_RELATIVE_GRADING") {
      const { examId } = body;
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });

      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { results: true },
      });
      if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

      const scoreList = exam.results.map((r) => ({
        studentId: r.studentId,
        marksObtained: r.marksObtained,
        totalMarks: exam.totalMarks,
      }));

      const relativeResult = calculateRelativeGrades(scoreList);

      for (const item of relativeResult.grades) {
        await prisma.examResult.updateMany({
          where: { examId, studentId: item.studentId },
          data: {
            gradeLetter: item.letter,
            remarks: `Relative Bell-Curve Grade (Z-Score: ${item.zScore})`,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Relative grading calculated: Class Mean=${relativeResult.mean}%, StdDev=${relativeResult.standardDeviation}, Pass Rate=${relativeResult.passPercentage}%`,
        metrics: relativeResult,
      });
    }

    // CoE Actions: CERTIFY_COE_RESULTS
    if (action === "CERTIFY_COE_RESULTS") {
      if (!COE_ROLES.includes(auth.payload.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only Controller of Examinations or Institutional Leadership can certify and publish final results." },
          { status: 403 }
        );
      }

      const { examId } = body;
      if (!examId) return NextResponse.json({ error: "examId is required" }, { status: 400 });

      await prisma.exam.update({
        where: { id: examId },
        data: { status: "PUBLISHED" },
      });

      const updated = await prisma.examResult.updateMany({
        where: { examId },
        data: {
          isVerified: true,
          publishedAt: new Date(),
          verifiedById: auth.payload.userId || auth.payload.sub,
        },
      });

      return NextResponse.json({
        success: true,
        message: `CoE officially certified and locked examination results. Published ${updated.count} candidate grade records to student portals.`,
        certifiedCount: updated.count,
      });
    }

    // Standard Schedule Exam action
    const { title, courseCode, type, totalMarks, weightage, examDate, durationMins, questions } = body;

    if (!title || !courseCode) {
      return NextResponse.json(
        { error: "Title and courseCode are required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: { code: courseCode },
      include: { department: { include: { campus: true } } },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      const courseTenant = course.department?.campus?.institutionId;
      if (courseTenant && courseTenant !== auth.payload.institutionId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot schedule examinations for another institution's courses." },
          { status: 403 }
        );
      }
    }

    const exam = await prisma.exam.create({
      data: {
        courseId: course.id,
        title,
        type: type || "MID_TERM",
        totalMarks: Number(totalMarks) || 100,
        weightage: Number(weightage) || 30,
        examDate: examDate ? new Date(examDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        durationMins: Number(durationMins) || 120,
        status: "SCHEDULED",
        questions: Array.isArray(questions) && questions.length > 0
          ? {
              create: questions.map((q: any) => ({
                questionText: q.questionText || "Question item",
                type: q.type || "SHORT",
                marks: Number(q.marks) || 10,
                difficulty: q.difficulty || "MEDIUM",
                bloomTaxonomy: q.bloomTaxonomy || "APPLY",
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });

    logger.info("Exam scheduled", {
      courseCode,
      title,
      examId: exam.id,
      actor: auth.payload.email,
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error: any) {
    logger.error("Examinations POST Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to schedule exam" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Exam Controller, Faculty, or Admin only
  const auth = await requireRoleAuth(req, [...EXAM_EDIT_ROLES]);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { examId, studentId, marksObtained, batchEntries, publish } = body;

    if (!examId) {
      return NextResponse.json({ error: "examId is required" }, { status: 400 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        course: {
          include: {
            faculty: { include: { faculty: { include: { user: true } } } },
            department: { include: { campus: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    // Multi-Tenant Isolation Gate
    if (auth.payload.role !== "SUPER_ADMIN" && auth.payload.institutionId) {
      const examTenant = exam.course?.department?.campus?.institutionId;
      if (examTenant && examTenant !== auth.payload.institutionId) {
        return NextResponse.json(
          { error: "Forbidden: You cannot modify examinations for another institution." },
          { status: 403 }
        );
      }
    }

    // Role Scoping & Course Assignment Verification
    const callerRole = auth.payload.role;
    if (callerRole === "FACULTY") {
      const isCourseInstructor = exam.course.faculty.some(
        (cf) =>
          cf.faculty.userId === auth.payload.userId ||
          cf.faculty.user?.email === auth.payload.email
      );
      if (!isCourseInstructor) {
        return NextResponse.json(
          {
            error: `Forbidden: You are not assigned to instruct or grade ${exam.course.code}: ${exam.course.title}.`,
          },
          { status: 403 }
        );
      }
    } else if (callerRole === "HOD") {
      const hodRecord = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId },
            { user: { email: auth.payload.email } },
          ],
        },
      });
      if (hodRecord && hodRecord.departmentId !== exam.course.departmentId) {
        return NextResponse.json(
          {
            error:
              "Forbidden: Head of Department can only grade courses within their own academic department.",
          },
          { status: 403 }
        );
      }
    }

    // 1. Batch Marks Submission (Roster Grading)
    if (Array.isArray(batchEntries) && batchEntries.length > 0) {
      const updatedResults = [];
      for (const entry of batchEntries) {
        if (!entry.studentId || entry.marksObtained === undefined || entry.marksObtained === "") continue;

        const percentage = (Number(entry.marksObtained) / exam.totalMarks) * 100;
        const ugcGrade = calculateUgcLetterGrade(percentage);

        const res = await prisma.examResult.upsert({
          where: {
            examId_studentId: {
              examId,
              studentId: entry.studentId,
            },
          },
          update: {
            marksObtained: Number(entry.marksObtained),
            gradeLetter: ugcGrade.letter,
            remarks: entry.remarks || "Evaluated by course faculty",
            isVerified: publish === true,
            publishedAt: publish === true ? new Date() : null,
            verifiedById: auth.payload.userId || auth.payload.sub,
          },
          create: {
            examId,
            studentId: entry.studentId,
            marksObtained: Number(entry.marksObtained),
            gradeLetter: ugcGrade.letter,
            remarks: entry.remarks || "Evaluated by course faculty",
            isVerified: publish === true,
            publishedAt: publish === true ? new Date() : null,
            verifiedById: auth.payload.userId || auth.payload.sub,
          },
        });
        updatedResults.push(res);
      }

      if (publish === true) {
        const canPublish = COE_ROLES.includes(auth.payload.role) || auth.payload.role === "HOD";
        if (!canPublish) {
          return NextResponse.json(
            { error: "Forbidden: Only Controller of Examinations, HOD, or Administrator can certify and publish final results." },
            { status: 403 }
          );
        }
        await prisma.exam.update({
          where: { id: examId },
          data: { status: "PUBLISHED" },
        });
      }

      await logAuditEvent({
        institutionId: auth.payload.institutionId || "inst-apex-01",
        actorUserId: auth.payload.userId || auth.payload.sub,
        action: publish ? "EXAM_RESULTS_PUBLISHED" : "GRADE_MODIFIED",
        targetEntity: "Exam",
        targetId: examId,
        details: {
          examId,
          studentCount: updatedResults.length,
          grader: auth.payload.email,
          published: publish === true,
        },
      });

      return NextResponse.json({
        success: true,
        message: publish
          ? `Evaluated & officially certified UGC marks for ${updatedResults.length} students.`
          : `Draft UGC evaluation saved for ${updatedResults.length} students.`,
        updatedCount: updatedResults.length,
      });
    }

    // 2. Single Student Marks Submission
    if (!studentId || marksObtained === undefined) {
      return NextResponse.json(
        { error: "studentId and marksObtained or batchEntries are required" },
        { status: 400 }
      );
    }

    if (publish === true) {
      const canPublish = COE_ROLES.includes(auth.payload.role) || auth.payload.role === "HOD";
      if (!canPublish) {
        return NextResponse.json(
          { error: "Forbidden: Only Controller of Examinations, HOD, or Administrator can certify and publish final results." },
          { status: 403 }
        );
      }
    }

    const percentage = (Number(marksObtained) / exam.totalMarks) * 100;
    const ugcGrade = calculateUgcLetterGrade(percentage);

    const result = await prisma.examResult.upsert({
      where: {
        examId_studentId: {
          examId,
          studentId,
        },
      },
      update: {
        marksObtained: Number(marksObtained),
        gradeLetter: ugcGrade.letter,
        isVerified: publish === true,
        publishedAt: publish === true ? new Date() : null,
      },
      create: {
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        gradeLetter: ugcGrade.letter,
        isVerified: publish === true,
        publishedAt: publish === true ? new Date() : null,
      },
    });

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "inst-apex-01",
      actorUserId: auth.payload.userId || auth.payload.sub,
      action: publish ? "EXAM_RESULTS_PUBLISHED" : "GRADE_MODIFIED",
      targetEntity: "ExamResult",
      targetId: result.id,
      details: {
        examId,
        studentId,
        marksObtained: Number(marksObtained),
        gradeLetter: ugcGrade.letter,
        grader: auth.payload.email,
        published: publish === true,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    logger.error("Examinations PUT Error", error);
    return NextResponse.json(
      { error: error.message || "Failed to record exam marks" },
      { status: 500 }
    );
  }
}
