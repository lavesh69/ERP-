/**
 * Faculty Academic Governance, Course Lesson Plans, Mentoring & UGC ASAR Engine
 * Implements NAAC/NBA Course Files, Lecture Substitution Workflow,
 * Bloom's Taxonomy Tagging, Proctorial Mentoring Logs, and UGC 2018 Annual Self-Appraisal.
 */

import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { hrPayrollStore, StaffEmployee } from "@/lib/hr/hr-store";

export type BloomTaxonomyLevel =
  | "L1_REMEMBER"
  | "L2_UNDERSTAND"
  | "L3_APPLY"
  | "L4_ANALYZE"
  | "L5_EVALUATE"
  | "L6_CREATE";

export interface LessonPlanUnit {
  weekNumber: number;
  lectureNumber: number;
  topic: string;
  plannedDate: string;
  actualDate?: string;
  deliveryMode: "CLASSROOM" | "LAB" | "HYBRID" | "DIGITAL_LMS";
  bloomLevel: BloomTaxonomyLevel;
  status: "PLANNED" | "COMPLETED" | "RESCHEDULED" | "MISSED";
  remarks?: string;
}

export interface SyllabusCoverageSummary {
  courseCode: string;
  courseTitle: string;
  facultyEmail: string;
  totalPlannedLectures: number;
  completedLectures: number;
  delayedLectures: number;
  completionPercentage: number;
  status: "ON_TRACK" | "BEHIND_SCHEDULE" | "AHEAD_OF_SCHEDULE" | "COMPLETED";
}

export interface MenteeRiskAudit {
  studentId: string;
  studentName: string;
  rollNumber: string;
  attendanceRate: number;
  cgpa: number;
  riskSeverity: "NORMAL" | "MODERATE" | "HIGH_RISK";
  flags: string[];
  recommendedIntervention: string;
}

export interface UgcAsarDossier {
  academicYear: string;
  facultyName: string;
  facultyEmail: string;
  employeeCode: string;
  designation: string;
  department: string;
  vidwanId: string;
  orcidId: string;
  category1Score: number; // Teaching Activities (Max 100)
  category1Grading: "GOOD" | "SATISFACTORY" | "NOT_SATISFACTORY";
  category2Score: number; // Administrative & Institutional Responsibilities (Max 50)
  category3ResearchScore: number; // Research & Academic Contributions
  totalScore: number;
  overallGrading: "GOOD" | "SATISFACTORY" | "NOT_SATISFACTORY";
  verificationHash: string;
  generatedAt: string;
}

export class FacultyAcademicEngine {
  /**
   * Generates a 15-week standard course lesson plan template mapped to Bloom's taxonomy
   */
  public static generateStandardLessonPlan(
    courseCode: string,
    courseTitle: string,
    facultyId: string,
    facultyEmail: string,
    startDateStr: string = "2026-08-01"
  ): LessonPlanUnit[] {
    const defaultUnits: LessonPlanUnit[] = [];
    const baseDate = new Date(startDateStr);

    const sampleTopics = [
      { topic: "Course Introduction, Syllabus Overview & Prerequisites", bloom: "L1_REMEMBER" as BloomTaxonomyLevel },
      { topic: "Core Theoretical Foundations & Architecture Overview", bloom: "L2_UNDERSTAND" as BloomTaxonomyLevel },
      { topic: "Mathematical Models & Analytical Foundations", bloom: "L2_UNDERSTAND" as BloomTaxonomyLevel },
      { topic: "Implementation Strategies & Algorithmic Design", bloom: "L3_APPLY" as BloomTaxonomyLevel },
      { topic: "Optimization Techniques & Performance Profiles", bloom: "L4_ANALYZE" as BloomTaxonomyLevel },
      { topic: "Mid-Term Review & Continuous Internal Assessment I", bloom: "L3_APPLY" as BloomTaxonomyLevel },
      { topic: "Advanced Architecture Paradigms & Distributed Concepts", bloom: "L4_ANALYZE" as BloomTaxonomyLevel },
      { topic: "Empirical Case Study Analysis & System Evaluation", bloom: "L5_EVALUATE" as BloomTaxonomyLevel },
      { topic: "Security, Cryptography & Threat Mitigation", bloom: "L4_ANALYZE" as BloomTaxonomyLevel },
      { topic: "Synthesis, Capstone Integration & Future Trends", bloom: "L6_CREATE" as BloomTaxonomyLevel },
    ];

    sampleTopics.forEach((item, index) => {
      const lectureDate = new Date(baseDate);
      lectureDate.setDate(baseDate.getDate() + index * 7);

      defaultUnits.push({
        weekNumber: index + 1,
        lectureNumber: index + 1,
        topic: `${courseCode}: ${item.topic}`,
        plannedDate: lectureDate.toISOString().split("T")[0],
        deliveryMode: index % 3 === 0 ? "LAB" : "CLASSROOM",
        bloomLevel: item.bloom,
        status: index < 4 ? "COMPLETED" : "PLANNED",
        actualDate: index < 4 ? lectureDate.toISOString().split("T")[0] : undefined,
      });
    });

    return defaultUnits;
  }

  /**
   * Computes Syllabus Coverage and Delivery Compliance
   */
  public static computeSyllabusCoverage(
    courseCode: string,
    courseTitle: string,
    facultyEmail: string,
    plan: LessonPlanUnit[]
  ): SyllabusCoverageSummary {
    const total = plan.length;
    const completed = plan.filter((p) => p.status === "COMPLETED").length;
    const delayed = plan.filter((p) => p.status === "RESCHEDULED" || p.status === "MISSED").length;
    const completionPercentage = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

    let status: "ON_TRACK" | "BEHIND_SCHEDULE" | "AHEAD_OF_SCHEDULE" | "COMPLETED" = "ON_TRACK";
    if (completed === total && total > 0) {
      status = "COMPLETED";
    } else if (completionPercentage < 40 && delayed > 2) {
      status = "BEHIND_SCHEDULE";
    } else if (completionPercentage >= 75) {
      status = "AHEAD_OF_SCHEDULE";
    }

    return {
      courseCode,
      courseTitle,
      facultyEmail,
      totalPlannedLectures: total,
      completedLectures: completed,
      delayedLectures: delayed,
      completionPercentage,
      status,
    };
  }

  /**
   * Evaluates at-risk mentees for a faculty proctor
   */
  public static auditMenteeRisks(
    mentees: Array<{ id: string; name: string; rollNo: string; attendanceRate: number; cgpa: number }>
  ): MenteeRiskAudit[] {
    return mentees.map((m) => {
      const flags: string[] = [];
      let severity: "NORMAL" | "MODERATE" | "HIGH_RISK" = "NORMAL";

      if (m.attendanceRate < 75) {
        flags.push(`Attendance critical: ${m.attendanceRate}% (Minimum 75% required under university statute)`);
        severity = "HIGH_RISK";
      } else if (m.attendanceRate < 80) {
        flags.push(`Attendance borderline: ${m.attendanceRate}%`);
        if (severity === "NORMAL") severity = "MODERATE";
      }

      if (m.cgpa < 5.0) {
        flags.push(`Academic probation alert: CGPA ${m.cgpa} below 5.0 threshold`);
        severity = "HIGH_RISK";
      } else if (m.cgpa < 6.0) {
        flags.push(`Academic improvement needed: CGPA ${m.cgpa}`);
        if (severity === "NORMAL") severity = "MODERATE";
      }

      let recommendation = "Regular academic progress tracking.";
      if (severity === "HIGH_RISK") {
        recommendation = "Schedule mandatory one-on-one proctorial counseling and alert parents immediately.";
      } else if (severity === "MODERATE") {
        recommendation = "Provide peer tutoring support and monitor bi-weekly attendance.";
      }

      return {
        studentId: m.id,
        studentName: m.name,
        rollNumber: m.rollNo,
        attendanceRate: m.attendanceRate,
        cgpa: m.cgpa,
        riskSeverity: severity,
        flags,
        recommendedIntervention: recommendation,
      };
    });
  }

  /**
   * Generates official UGC PBAS Annual Self-Appraisal Report (ASAR)
   */
  public static generateUgcAsarReport(params: {
    facultyName: string;
    facultyEmail: string;
    employeeCode: string;
    designation: string;
    department: string;
    vidwanId?: string;
    orcidId?: string;
    allocatedHoursPerWeek: number;
    deliveredHoursPerWeek: number;
    syllabusCompletionRate: number;
    examDutyDays: number;
    institutionalCommitteeRoles: number;
    menteeCount: number;
    publicationsCount: number;
    firstAuthorCount: number;
    sponsoredGrantsLakhs: number;
  }): UgcAsarDossier {
    const {
      facultyName,
      facultyEmail,
      employeeCode,
      designation,
      department,
      vidwanId = "VID-2026-9812",
      orcidId = "0000-0002-1825-0097",
      allocatedHoursPerWeek,
      deliveredHoursPerWeek,
      syllabusCompletionRate,
      examDutyDays,
      institutionalCommitteeRoles,
      menteeCount,
      publicationsCount,
      firstAuthorCount,
      sponsoredGrantsLakhs,
    } = params;

    // 1. Category I: Teaching Activities (UGC Max: 100)
    // 80% weightage on delivery vs allocated + 20% on syllabus completion
    const deliveryRatio = allocatedHoursPerWeek > 0 ? Math.min(1.0, deliveredHoursPerWeek / allocatedHoursPerWeek) : 1.0;
    const cat1Teaching = Math.round(deliveryRatio * 80);
    const cat1Syllabus = Math.round(Math.min(1.0, syllabusCompletionRate / 100) * 20);
    const category1Score = cat1Teaching + cat1Syllabus;

    const category1Grading: "GOOD" | "SATISFACTORY" | "NOT_SATISFACTORY" =
      category1Score >= 80 ? "GOOD" : category1Score >= 70 ? "SATISFACTORY" : "NOT_SATISFACTORY";

    // 2. Category II: Involvement in University & College Student Related Activities (Max: 50)
    // Examination duties (5 pts/day up to 20) + Committee roles (10 pts/role up to 20) + Mentoring (up to 10)
    const examScore = Math.min(20, examDutyDays * 5);
    const committeeScore = Math.min(20, institutionalCommitteeRoles * 10);
    const mentoringScore = Math.min(10, Math.round(menteeCount * 0.5));
    const category2Score = examScore + committeeScore + mentoringScore;

    // 3. Category III: Research & Academic Contributions
    // Publications: First Author = 15 pts, Co-Author = 10.5 pts (70% rule)
    const coAuthorCount = Math.max(0, publicationsCount - firstAuthorCount);
    const pubScore = firstAuthorCount * 15 + coAuthorCount * 10.5;
    const grantScore = sponsoredGrantsLakhs * 5; // 5 points per Lakh of sponsored research
    const category3ResearchScore = Math.round(pubScore + grantScore);

    const totalScore = category1Score + category2Score + category3ResearchScore;

    const overallGrading: "GOOD" | "SATISFACTORY" | "NOT_SATISFACTORY" =
      category1Grading === "GOOD" && category2Score >= 30 && category3ResearchScore >= 20
        ? "GOOD"
        : category1Grading !== "NOT_SATISFACTORY"
        ? "SATISFACTORY"
        : "NOT_SATISFACTORY";

    const verificationHash = crypto
      .createHash("sha256")
      .update(`${employeeCode}:${facultyEmail}:${totalScore}:${new Date().getFullYear()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    return {
      academicYear: "2025-2026",
      facultyName,
      facultyEmail,
      employeeCode,
      designation,
      department,
      vidwanId,
      orcidId,
      category1Score,
      category1Grading,
      category2Score,
      category3ResearchScore,
      totalScore,
      overallGrading,
      verificationHash: `UGC-ASAR-${verificationHash}`,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Synchronizes Prisma Faculty with EmployeeStaff & HrPayrollStore to prevent data drift
   */
  public static async syncFacultyWithEmployeeStaff(facultyUserId: string): Promise<StaffEmployee> {
    const user = await prisma.user.findUnique({
      where: { id: facultyUserId },
      include: { facultyProfile: { include: { department: true } } },
    });

    if (!user || !user.facultyProfile) {
      throw new Error("Target user is not registered as faculty");
    }

    const fac = user.facultyProfile;
    const fullName = `${user.firstName} ${user.lastName}`.trim();

    // Map designation to default 7th CPC basic pay
    const basicPayMap: Record<string, number> = {
      Professor: 144200,
      "Associate Professor": 131400,
      "Assistant Professor": 57700,
      Lecturer: 45000,
    };
    const defaultBasic = basicPayMap[fac.designation] || 57700;

    // 1. Sync with SQLite / PostgreSQL EmployeeStaff table
    await prisma.employeeStaff.upsert({
      where: { email: user.email },
      create: {
        userId: user.id,
        institutionId: user.institutionId,
        employeeCode: fac.employeeCode,
        fullName,
        email: user.email,
        designation: fac.designation,
        department: fac.department.name,
        cadre: "TEACHING",
        academicLevel: fac.designation.includes("Professor") ? "LEVEL_14" : "LEVEL_10",
        basicPay: defaultBasic,
        pensionScheme: "NPS",
        panNumber: "PANA" + fac.employeeCode.replace(/\D/g, "").padStart(5, "0") + "Z",
        pfUan: "100" + Math.floor(100000000 + Math.random() * 900000000),
        status: "ACTIVE",
      },
      update: {
        designation: fac.designation,
        department: fac.department.name,
        fullName,
      },
    });

    // 2. Sync with HrPayrollStore memory & JSON roster
    const syncedEmployee = hrPayrollStore.upsertStaffMember({
      email: user.email,
      name: fullName,
      designation: fac.designation,
      department: fac.department.name,
      employeeType: "FACULTY",
      basicPay: defaultBasic,
      status: "ACTIVE",
    });

    return syncedEmployee;
  }
}
