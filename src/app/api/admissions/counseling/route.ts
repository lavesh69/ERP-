import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  calculateCompositeMeritScore,
  generateMeritRankings,
  executeCounselingAllocation,
  generateSeatAllotmentOrder,
  DEFAULT_PROGRAM_SEAT_MATRIX,
  ApplicantMeritRecord,
  RankedApplicant,
} from "@/lib/admissions/counseling-engine";

const SAMPLE_APPLICANTS: ApplicantMeritRecord[] = [
  {
    applicantId: "app-coun-01",
    applicationNo: "APEX-2026-9001",
    fullName: "Aarav Sharma",
    category: "GENERAL",
    isPwd: false,
    boardExamPercent: 94.5,
    entranceScore: 98.2,
    preferredPrograms: ["CSE", "AI_DS", "ECE"],
  },
  {
    applicantId: "app-coun-02",
    applicationNo: "APEX-2026-9002",
    fullName: "Ananya Patel",
    category: "OBC_NCL",
    isPwd: false,
    boardExamPercent: 91.0,
    entranceScore: 93.5,
    preferredPrograms: ["CSE", "AI_DS"],
  },
  {
    applicantId: "app-coun-03",
    applicationNo: "APEX-2026-9003",
    fullName: "Rohan Verma",
    category: "SC",
    isPwd: false,
    boardExamPercent: 86.0,
    entranceScore: 89.0,
    preferredPrograms: ["AI_DS", "CSE", "ECE"],
  },
  {
    applicantId: "app-coun-04",
    applicationNo: "APEX-2026-9004",
    fullName: "Meera Nair",
    category: "EWS",
    isPwd: false,
    boardExamPercent: 92.5,
    entranceScore: 95.0,
    preferredPrograms: ["CSE", "ECE"],
  },
  {
    applicantId: "app-coun-05",
    applicationNo: "APEX-2026-9005",
    fullName: "Tenzin Dorji",
    category: "ST",
    isPwd: false,
    boardExamPercent: 82.0,
    entranceScore: 84.0,
    preferredPrograms: ["ECE", "AI_DS"],
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicantId = searchParams.get("applicantId");

    // Pre-rank the sample cohort
    const rankedCohort = generateMeritRankings(SAMPLE_APPLICANTS);
    const allotment = executeCounselingAllocation({
      rankedApplicants: rankedCohort,
      roundNumber: 1,
    });

    if (applicantId) {
      const target = allotment.allocatedApplicants.find((a) => a.applicantId === applicantId)
        || allotment.waitlistedApplicants.find((a) => a.applicantId === applicantId);

      if (!target) {
        return NextResponse.json({ error: "Applicant not found in counseling register" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        applicant: target,
      });
    }

    return NextResponse.json({
      success: true,
      counselingRound: 1,
      totalApplicantsProcessed: SAMPLE_APPLICANTS.length,
      seatMatrix: allotment.updatedSeatMatrix,
      rankedCohort: rankedCohort,
      sampleRankedCohort: rankedCohort,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    if (action === "COMPUTE_MERIT_SCORE") {
      const boardExamPercent = body.boardExamPercent !== undefined ? body.boardExamPercent : body.boardMarksPercentage;
      const entranceScore = body.entranceScore !== undefined ? body.entranceScore : body.entranceExamScore;
      if (boardExamPercent === undefined || entranceScore === undefined) {
        return NextResponse.json({ error: "Missing boardExamPercent or entranceScore" }, { status: 400 });
      }

      const compositeScore = calculateCompositeMeritScore(
        Number(boardExamPercent),
        Number(entranceScore)
      );

      return NextResponse.json({
        success: true,
        boardExamPercent: Number(boardExamPercent),
        entranceScore: Number(entranceScore),
        compositeScore,
        compositeMeritScore: compositeScore,
      });
    }

    if (action === "SIMULATE_ALLOTMENT") {
      const isCounselingAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isCounselingAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Only admissions administrators and officers can execute counseling allocations" },
          { status: 403 }
        );
      }

      const { applicants, roundNumber = 1 } = body;
      const applicantList: ApplicantMeritRecord[] = Array.isArray(applicants) && applicants.length > 0
        ? applicants
        : SAMPLE_APPLICANTS;

      const ranked = generateMeritRankings(applicantList);
      const result = executeCounselingAllocation({
        rankedApplicants: ranked,
        roundNumber: Number(roundNumber),
      });

      return NextResponse.json({
        success: true,
        message: `Counseling Round ${roundNumber} allocation completed`,
        result,
      });
    }

    if (action === "GENERATE_ORDER") {
      let { applicant, roundNumber = 1, seatAcceptanceFeeInr = 25000 } = body;
      if (!applicant && (body.candidateId || body.candidateName)) {
        applicant = {
          applicantId: body.candidateId || "APP-2026-001",
          applicationNo: body.candidateId || "APP-2026-001",
          fullName: body.candidateName || "Aryan Gupta",
          category: body.category || "GENERAL",
          isPwd: false,
          boardExamPercent: 92,
          entranceScore: 96,
          preferredPrograms: [body.allottedProgram || "B.Tech Computer Science & Engineering"],
          compositeScore: 94.4,
          generalMeritRank: body.meritRank || 1,
          categoryRank: 1,
          status: "ALLOCATED",
          allottedProgram: body.allottedProgram || "B.Tech Computer Science & Engineering",
          allottedCategory: body.quotaCategory || "OPEN_MERIT",
          roundAllocated: Number(roundNumber),
        };
      }

      if (!applicant || !applicant.applicationNo || !applicant.fullName) {
        return NextResponse.json({ error: "Valid applicant record required for allotment order" }, { status: 400 });
      }

      const order = generateSeatAllotmentOrder({
        applicant: applicant as RankedApplicant,
        counselingRound: Number(roundNumber),
        seatAcceptanceFeeInr: Number(seatAcceptanceFeeInr),
      });

      return NextResponse.json({
        success: true,
        message: "Provisional seat allotment order generated successfully",
        order,
      });
    }

    if (action === "PROVISION_ALLOTTED_STUDENT") {
      const isCounselingAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "DEAN", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isCounselingAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Only admissions administrators and officers can provision students" },
          { status: 403 }
        );
      }

      const { applicant, allottedProgram, roundNumber = 1 } = body;
      if (!applicant || !applicant.applicationNo || !applicant.fullName) {
        return NextResponse.json({ error: "Valid applicant record required for provisioning" }, { status: 400 });
      }

      const progCode = (applicant.allottedProgram || allottedProgram || "CSE").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
      const serialPart = applicant.applicationNo.replace(/[^0-9]/g, "").slice(-3) || "091";
      const rollNumber = `2026-${progCode}-${serialPart}`;
      const admissionNumber = applicant.applicationNo;

      const institution = await prisma.institution.findFirst();
      const institutionId = institution?.id || "inst-apex-01";
      const program = await prisma.program.findFirst();
      const targetProgramId = program?.id || "prog-cs-01";

      const email = `${applicant.fullName.toLowerCase().replace(/[^a-z]/g, "")}@apex.edu`;
      let user = await prisma.user.findFirst({ where: { email } });
      if (!user) {
        const nameParts = applicant.fullName.split(" ");
        user = await prisma.user.create({
          data: {
            email,
            firstName: nameParts[0] || "Scholar",
            lastName: nameParts.slice(1).join(" ") || "Candidate",
            role: "STUDENT",
            passwordHash: "PROVISIONED_DEFAULT_HASH",
            institutionId,
          },
        });
      }

      let student = await prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) {
        student = await prisma.student.create({
          data: {
            userId: user.id,
            programId: targetProgramId,
            rollNumber,
            admissionNumber,
            admissionDate: new Date(),
            currentSemester: 1,
            status: "ACTIVE",
          },
        });
      }

      const seal = `APEX-ENROLL-SEAL-${crypto.createHash("sha256").update(`${rollNumber}|${student.id}|${admissionNumber}`).digest("hex").slice(0, 16).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        message: `Scholar ${applicant.fullName} successfully provisioned into Student Information System`,
        enrollmentDetails: {
          studentId: student.id,
          rollNumber: student.rollNumber,
          admissionNumber: student.admissionNumber,
          fullName: applicant.fullName,
          email,
          allottedProgram: applicant.allottedProgram || allottedProgram || "CSE",
          status: "ACTIVE",
          currentSemester: 1,
          enrollmentSeal: seal,
        },
      }, { status: 201 });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
