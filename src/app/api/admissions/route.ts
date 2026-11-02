import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { admissionsStore } from "@/lib/admissions/admissions-store";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email-service";

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

      if (highSchoolGpa === undefined || isNaN(Number(highSchoolGpa)) || Number(highSchoolGpa) < 0) {
        return NextResponse.json({ error: "Valid non-negative high school GPA / percentage is required" }, { status: 400 });
      }
      if (entranceExamScore === undefined || isNaN(Number(entranceExamScore)) || Number(entranceExamScore) < 0) {
        return NextResponse.json({ error: "Valid non-negative entrance examination score is required" }, { status: 400 });
      }

      const applicant = admissionsStore.createApplicant({
        fullName,
        email,
        phone,
        programCode,
        highSchoolGpa: Number(highSchoolGpa),
        entranceExamScore: Number(entranceExamScore),
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
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "ACCOUNTANT"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can update applicant stages" }, { status: 403 });
      }

      const { applicantId, stage, depositPaid } = body;
      if (!applicantId || !stage) {
        return NextResponse.json({ error: "Applicant ID and new stage are required" }, { status: 400 });
      }

      const updated = admissionsStore.updateApplicantStage(applicantId, stage, depositPaid);
      return NextResponse.json({ success: true, message: `Application status updated to ${stage}`, applicant: updated });
    }

    if (action === "UPDATE_QUOTA") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to update quotas" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "ACCOUNTANT"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can modify intake quotas" }, { status: 403 });
      }
      const { quota } = body;
      if (!quota || !quota.programCode) {
        return NextResponse.json({ error: "Valid quota payload is required" }, { status: 400 });
      }
      const updated = admissionsStore.updateQuota(quota);
      return NextResponse.json({ success: true, message: "Program quota updated and persisted", quota: updated });
    }

    if (action === "PROVISION_STUDENT") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to provision student" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
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

      // Cross-Module Integration: Initialize student tuition fee ledger
      try {
        const existingFee = await prisma.studentFee.findFirst({
          where: { studentId: student.id },
        });
        if (!existingFee) {
          const defaultFeeStructure = await prisma.feeStructure.findFirst();
          if (defaultFeeStructure) {
            await prisma.studentFee.create({
              data: {
                studentId: student.id,
                feeStructureId: defaultFeeStructure.id,
                totalAmount: defaultFeeStructure.totalAmount,
                paidAmount: applicant.seatDepositPaid ? (applicant.depositAmount || 1000) : 0,
                discountAmount: 0,
                status: applicant.seatDepositPaid ? "PARTIAL" : "PENDING",
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
          }
        }
      } catch (feeErr) {
        console.warn("[Admissions-Finance Link Warning]:", feeErr);
      }

      return NextResponse.json({
        success: true,
        message: `Student successfully provisioned and enrolled into SIS (Roll No: ${student.rollNumber})`,
        student,
        applicant: updatedApplicant,
      });
    }

    if (action === "UPDATE_DOCUMENT_STATUS") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to update document verification" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can update document verification" }, { status: 403 });
      }

      const { applicantId, documentType, isVerified, notes } = body;
      if (!applicantId || !documentType) {
        return NextResponse.json({ error: "applicantId and documentType are required" }, { status: 400 });
      }

      const updated = admissionsStore.updateDocumentStatus(applicantId, documentType, Boolean(isVerified), notes);
      return NextResponse.json({
        success: true,
        message: `Document '${documentType}' verification updated to ${isVerified ? "VERIFIED" : "PENDING"} for ${updated.fullName}`,
        applicant: updated,
      });
    }

    if (action === "DISPATCH_OFFER_LETTER") {
      if (!session) {
        return NextResponse.json({ error: "Administrative authentication required to dispatch offer letters" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can dispatch offer letters" }, { status: 403 });
      }

      const { applicantId, scholarshipAmount, deadlineDays } = body;
      if (!applicantId) {
        return NextResponse.json({ error: "applicantId is required" }, { status: 400 });
      }

      const result = admissionsStore.dispatchOfferLetter(applicantId, { scholarshipAmount, deadlineDays });

      let emailResult = null;
      try {
        emailResult = await sendEmail({
          to: result.applicant.email,
          subject: `Provisional Admission Offer Letter 2026-27 — ${result.applicant.programName}`,
          type: "NOTIFICATION",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
              <h2 style="color: #be123c;">APEX UNIVERSITY ADMISSIONS DIRECTORATE</h2>
              <p>Dear <strong>${result.applicant.fullName}</strong>,</p>
              <p>Congratulations! We are delighted to inform you that your application for admission to <strong>${result.applicant.programName} (${result.applicant.programCode})</strong> for the Academic Cohort 2026-27 has been provisionally approved.</p>
              <div style="background-color: #f8fafc; border-left: 4px solid #be123c; padding: 12px; margin: 16px 0;">
                <p style="margin: 4px 0;"><strong>Application Number:</strong> ${result.applicant.applicationNo}</p>
                <p style="margin: 4px 0;"><strong>Merit Rank:</strong> #${result.applicant.meritRank}</p>
                <p style="margin: 4px 0;"><strong>Composite Score:</strong> ${result.applicant.highSchoolGpa} GPA / ${result.applicant.entranceExamScore} Exam</p>
                <p style="margin: 4px 0;"><strong>Seat Deposit Required:</strong> ₹${result.seatDepositRequired.toLocaleString("en-IN")}</p>
                <p style="margin: 4px 0;"><strong>Reporting Deadline:</strong> ${result.reportingDeadline}</p>
                <p style="margin: 4px 0; font-family: monospace; font-size: 11px;"><strong>Cryptographic Offer Seal:</strong> ${result.offerSeal}</p>
              </div>
              <p>To reserve your seat, please submit the provisional reservation deposit within the reporting window.</p>
              <p>Sincerely,<br/><strong>Office of the Registrar & Admissions Deanery</strong><br/>Apex University</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn("[Admissions Email Dispatch Warning]:", emailErr);
      }

      return NextResponse.json({
        success: true,
        message: `Provisional offer letter dispatched to ${result.applicant.email} (Seal: ${result.offerSeal})`,
        applicant: result.applicant,
        offerSeal: result.offerSeal,
        reportingDeadline: result.reportingDeadline,
        emailDispatched: !!emailResult?.success,
        emailId: emailResult?.messageId,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Admissions API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process admissions request" }, { status: 400 });
  }
}
