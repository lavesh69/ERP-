import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { admissionsStore } from "@/lib/admissions/admissions-store";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access admissions portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const stage = searchParams.get("stage") || undefined;

    if (tab === "applicants") {
      const applicants = admissionsStore.getApplicants(stage);
      return NextResponse.json({ success: true, applicants });
    }

    // Default: summary
    const summary = admissionsStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Admissions API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve admissions data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    const body = await request.json();
    const { action } = body;

    if (action === "SUBMIT_APPLICATION") {
      const { fullName, email, phone, programCode, highSchoolGpa, entranceExamScore, source } = body;
      if (!fullName || !email || !programCode) {
        return NextResponse.json({ error: "Full name, email, and target program are required" }, { status: 400 });
      }

      const applicant = admissionsStore.createApplicant({
        fullName,
        email,
        phone,
        programCode,
        highSchoolGpa: Number(highSchoolGpa) || 3.5,
        entranceExamScore: Number(entranceExamScore) || 1350,
        source: source || "WEBSITE",
      });

      return NextResponse.json({
        success: true,
        message: `Application submitted successfully! Application No: ${applicant.applicationNo}`,
        applicant,
      });
    }

    if (action === "UPDATE_STAGE") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to update applicant stage" }, { status: 401 });
      }
      const { applicantId, stage, depositPaid } = body;
      if (!applicantId || !stage) {
        return NextResponse.json({ error: "Applicant ID and new stage are required" }, { status: 400 });
      }

      const updated = admissionsStore.updateApplicantStage(applicantId, stage, depositPaid);
      return NextResponse.json({ success: true, message: `Application status updated to ${stage}`, applicant: updated });
    }

    if (action === "PROVISION_STUDENT") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to provision student" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can provision students" }, { status: 403 });
      }

      const { applicantId, programId } = body;
      if (!applicantId) {
        return NextResponse.json({ error: "applicantId is required" }, { status: 400 });
      }

      const applicant = admissionsStore.getApplicant(applicantId);
      if (!applicant) {
        return NextResponse.json({ error: "Applicant not found" }, { status: 404 });
      }

      const updatedApplicant = admissionsStore.updateApplicantStage(applicantId, "ENROLLED", true);

      // Provision user and student entities in database if not present
      const institution = await prisma.institution.findFirst();
      const institutionId = institution?.id || "inst-apex-01";
      const program = programId
        ? await prisma.program.findUnique({ where: { id: programId } })
        : await prisma.program.findFirst();
      const targetProgramId = program?.id || "prog-cs-01";

      const rollNumber = `ROLL-${new Date().getFullYear()}-${applicant.applicationNo.slice(-4)}`;
      const admissionNumber = applicant.applicationNo;

      let user = await prisma.user.findUnique({ where: { email: applicant.email } });
      if (!user) {
        const nameParts = applicant.fullName.split(" ");
        const firstName = nameParts[0] || "Scholar";
        const lastName = nameParts.slice(1).join(" ") || "Student";

        user = await prisma.user.create({
          data: {
            email: applicant.email,
            firstName,
            lastName,
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

      return NextResponse.json({
        success: true,
        message: `Student successfully provisioned and enrolled into SIS (Roll No: ${student.rollNumber})`,
        student,
        applicant: updatedApplicant,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Admissions API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process admissions request" }, { status: 400 });
  }
}
