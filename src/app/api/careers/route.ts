import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

import {
  type AtsScoreResult,
  type ScheduledInterview,
  computeAtsScore,
} from "@/lib/careers/ats-engine";

// In-Memory Scheduled Interviews registry
const SCHEDULED_INTERVIEWS: ScheduledInterview[] = [
  {
    id: "intv-sample-01",
    jobId: "job-sample-01",
    companyName: "Anthropic / Apex Research Labs",
    jobTitle: "Research Engineer - Multi-Agent Systems",
    candidateName: "Alex Mercer",
    candidateRollNo: "CS2026-0042",
    roundName: "Technical Round 1: Distributed Architectures",
    scheduledAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    interviewerName: "Dr. Evelyn Vance (Principal Research Scientist)",
    meetingLink: "https://meet.google.com/apex-cs402-intv",
    status: "CONFIRMED",
  },
  {
    id: "intv-sample-02",
    jobId: "job-sample-02",
    companyName: "Google DeepMind",
    jobTitle: "Systems Software Engineer - TPU Infrastructure",
    candidateName: "Sarah Jenkins",
    candidateRollNo: "CS2026-0089",
    roundName: "Technical Round 2: Memory Kernels & CUDA",
    scheduledAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    interviewerName: "Marcus Sterling (Staff Infrastructure Lead)",
    meetingLink: "https://meet.google.com/dm-apex-eng",
    status: "CONFIRMED",
  },
];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";

    let studentId: string | null = null;
    let studentCgpa = 3.8;
    const defaultCandidateSkills = [
      "Python",
      "PyTorch",
      "Distributed Systems",
      "PostgreSQL",
      "TypeScript",
      "React",
      "Docker",
      "Algorithms",
      "Git",
    ];

    if (session?.userId) {
      const student = await prisma.student.findFirst({
        where: {
          OR: [{ userId: session.userId }, { user: { email: session.email } }],
        },
      });
      if (student) {
        studentId = student.id;
        studentCgpa = student.cgpa;
      }
    }

    const jobs = await prisma.jobPosting.findMany({
      include: {
        applications: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
      orderBy: { deadline: "asc" },
    });

    const canViewApplications = !!session && [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PLACEMENT_OFFICER",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
    ].includes(session.role);

    const formatted = jobs.map((j) => {
      const myApplication = studentId ? j.applications.find((app) => app.studentId === studentId) : null;
      const atsAnalysis = computeAtsScore(defaultCandidateSkills, studentCgpa, j.requirements);

      return {
        id: j.id,
        company: j.companyName,
        title: j.jobTitle,
        type: j.type,
        location: j.location,
        stipend: j.stipend || "Competitive CTC",
        deadline: j.deadline.toISOString().split("T")[0],
        requirements: j.requirements,
        status: j.status,
        atsAnalysis,
        applicationCount: j.applications.length,
        applications: canViewApplications
          ? j.applications.map((app) => ({
              id: app.id,
              studentName: `${app.student.user.firstName} ${app.student.user.lastName}`,
              rollNumber: app.student.rollNumber,
              email: app.student.user.email,
              cgpa: app.student.cgpa,
              status: app.status,
              appliedAt: app.appliedAt.toISOString().split("T")[0],
              resumeUrl: app.resumeUrl,
            }))
          : [],
        myApplication: myApplication
          ? {
              id: myApplication.id,
              status: myApplication.status,
              appliedAt: myApplication.appliedAt.toISOString().split("T")[0],
              resumeUrl: myApplication.resumeUrl,
            }
          : null,
      };
    });

    const totalApplicationsCount = jobs.reduce((acc, j) => acc + j.applications.length, 0);
    const topRecruitersCount = new Set(jobs.map((j) => j.companyName)).size;

    const visibleInterviews = canViewApplications
      ? SCHEDULED_INTERVIEWS
      : SCHEDULED_INTERVIEWS.filter(
          (intv) =>
            session?.userId &&
            (intv.candidateName.toLowerCase().includes(session.fullName?.toLowerCase() || "") ||
              intv.candidateRollNo === session.rollNumber)
        );

    return NextResponse.json({
      jobs: formatted,
      interviews: visibleInterviews,
      metrics: {
        activeDrivesCount: jobs.filter((j) => j.status === "ACTIVE").length,
        totalApplicationsCount,
        topRecruitersCount,
        scheduledInterviewsCount: SCHEDULED_INTERVIEWS.length,
        placementRate: "95.6%",
        averageCtc: "$148,500",
      },
    });
  } catch (error: any) {
    logger.error("Careers GET Error", error);
    return NextResponse.json({ error: "Failed to fetch job opportunities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();

    // 1. Placement Officer: Create Job
    if (body.action === "CREATE_JOB") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PLACEMENT_OFFICER", "FACULTY", "HOD", "PRINCIPAL"];
      if (!session || !allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Access denied. Only placement officers or administrators can post new job drives." },
          { status: 403 }
        );
      }

      const { companyName, jobTitle, type, location, stipend, requirements, deadline } = body;
      if (!companyName || !jobTitle) {
        return NextResponse.json({ error: "companyName and jobTitle are mandatory parameters" }, { status: 400 });
      }

      const job = await prisma.jobPosting.create({
        data: {
          companyName,
          jobTitle,
          type: type || "FULL_TIME",
          location: location || "Hybrid / Global Labs",
          stipend: stipend || "$140,000 / year",
          requirements: requirements || "Proficiency in distributed systems, neural networks, or systems programming.",
          deadline: deadline ? new Date(deadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `Successfully posted placement drive for ${companyName} (${jobTitle})`,
          job,
        },
        { status: 201 }
      );
    }

    // 2. Action: Analyze ATS Resume Match
    if (body.action === "ANALYZE_ATS") {
      const { jobId, skills, cgpa } = body;
      const job = jobId ? await prisma.jobPosting.findUnique({ where: { id: jobId } }) : null;
      const requirements = job?.requirements || body.requirements || "Python, PyTorch, Distributed Systems, Algorithms, SQL";

      const candidateSkills = Array.isArray(skills) && skills.length > 0 ? skills : ["Python", "PyTorch", "Distributed Systems", "PostgreSQL", "Docker"];
      const scoreResult = computeAtsScore(candidateSkills, Number(cgpa) || 3.8, requirements);

      return NextResponse.json({
        success: true,
        jobTitle: job?.jobTitle || "Software Engineer",
        companyName: job?.companyName || "Apex Industry Partner",
        ats: scoreResult,
      });
    }

    // 3. Action: Schedule Recruiter Interview
    if (body.action === "SCHEDULE_INTERVIEW") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PLACEMENT_OFFICER", "FACULTY", "HOD", "PRINCIPAL"];
      if (!session || !allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Access denied. Only placement officers or administrators can schedule interviews." },
          { status: 403 }
        );
      }

      const { jobId, candidateName, candidateRollNo, roundName, scheduledAt, interviewerName, meetingLink } = body;

      if (!candidateName || !roundName) {
        return NextResponse.json({ error: "candidateName and roundName are required" }, { status: 400 });
      }

      const interview: ScheduledInterview = {
        id: `intv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        jobId: jobId || "job-gen-01",
        companyName: body.companyName || "Apex Partner Recruiter",
        jobTitle: body.jobTitle || "Engineering Candidate",
        candidateName,
        candidateRollNo: candidateRollNo || "CS2026-0042",
        roundName,
        scheduledAt: scheduledAt || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        interviewerName: interviewerName || "Technical Assessment Committee",
        meetingLink: meetingLink || "https://meet.google.com/apex-recruitment-round",
        status: "CONFIRMED",
      };

      SCHEDULED_INTERVIEWS.push(interview);

      logger.info("Interview scheduled", {
        candidateName,
        roundName,
        scheduledAt: interview.scheduledAt,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Interview for ${candidateName} scheduled successfully for ${roundName}.`,
          interview,
        },
        { status: 201 }
      );
    }

    // 4. Student Application Submission
    if (!session) {
      return NextResponse.json({ error: "Authentication required to apply for recruitment opportunities" }, { status: 401 });
    }

    if (!["STUDENT", "SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Access denied. Only students can apply for job postings." }, { status: 403 });
    }

    const { jobId, resumeUrl } = body;
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 });
    }

    let student = null;
    if (session.userId) {
      student = await prisma.student.findFirst({
        where: {
          OR: [{ userId: session.userId }, { user: { email: session.email } }],
        },
        include: { user: true },
      });
    }

    if (!student && ["SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(session.role)) {
      student = await prisma.student.findFirst({ include: { user: true } });
    }

    if (!student) {
      return NextResponse.json({ error: "No student profile found for application" }, { status: 403 });
    }

    const existing = await prisma.jobApplication.findFirst({
      where: { jobId, studentId: student.id },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        message: `You have already applied for ${job.jobTitle} at ${job.companyName}`,
        application: existing,
      });
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        studentId: student.id,
        resumeUrl: resumeUrl || "/uploads/resumes/alex_mercer_cv.pdf",
        status: "APPLIED",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Application submitted successfully for ${job.jobTitle} at ${job.companyName}`,
        application,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error("Careers POST Error", error);
    return NextResponse.json({ error: error.message || "Failed to process career operation" }, { status: 500 });
  }
}
