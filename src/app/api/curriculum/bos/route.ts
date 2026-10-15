import { NextRequest, NextResponse } from "next/server";
import { bosGovernanceEngine } from "@/lib/curriculum/bos-engine";

export async function GET() {
  try {
    const proposals = bosGovernanceEngine.getAllProposals();
    const analytics = bosGovernanceEngine.getAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        proposals,
        analytics,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch BoS governance records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "CREATE_PROPOSAL": {
        const {
          department,
          regulation,
          chairpersonName,
          externalAcademicNominees,
          industryExpertNominee,
          alumniNominee,
          meetingDate,
        } = body;

        if (!department || !chairpersonName || !meetingDate) {
          return NextResponse.json(
            { success: false, error: "Mandatory BoS details missing" },
            { status: 400 }
          );
        }

        const proposal = bosGovernanceEngine.createProposal({
          department,
          regulation: regulation || "Regulation R2026 - NEP 2020 CBCS Scheme",
          chairpersonName,
          externalAcademicNominees: externalAcademicNominees || [
            "Prof. Dr. N. K. Sharma (External Expert, IIT Bombay)",
          ],
          industryExpertNominee: industryExpertNominee || "Industry Technology Advisor",
          alumniNominee: alumniNominee || "Distinguished Alumnus Representative",
          meetingDate,
        });

        return NextResponse.json({
          success: true,
          message: `BoS Proposal initialized with Resolution No: ${proposal.resolutionNumber}`,
          data: proposal,
        });
      }

      case "ADD_MODIFICATION": {
        const {
          proposalId,
          type,
          courseCode,
          courseTitle,
          credits,
          ltpPattern,
          justification,
          stakeholderFeedbackRef,
          prerequisites,
          syllabusUnitsSummary,
        } = body;

        if (!proposalId || !courseCode || !courseTitle || credits === undefined) {
          return NextResponse.json(
            { success: false, error: "Curricular modification fields incomplete" },
            { status: 400 }
          );
        }

        const proposal = bosGovernanceEngine.addCourseModification(proposalId, {
          type: type || "NEW_COURSE",
          courseCode,
          courseTitle,
          credits: Number(credits),
          ltpPattern: ltpPattern || "3-0-0",
          justification: justification || "Curricular modernization",
          stakeholderFeedbackRef: stakeholderFeedbackRef || "BoS 2026 Deliberation",
          prerequisites,
          syllabusUnitsSummary: syllabusUnitsSummary || "Detailed syllabus attached in annexure.",
        });

        return NextResponse.json({
          success: true,
          message: `Course ${courseCode} added to BoS resolution ${proposal.resolutionNumber}`,
          data: proposal,
        });
      }

      case "APPROVE_BOS": {
        const { proposalId } = body;
        if (!proposalId) {
          return NextResponse.json(
            { success: false, error: "Proposal ID is required" },
            { status: 400 }
          );
        }

        const proposal = bosGovernanceEngine.approveByBoS(proposalId);
        return NextResponse.json({
          success: true,
          message: "BoS resolution approved and recommended to the Academic Council",
          data: proposal,
        });
      }

      case "RATIFY_COUNCIL": {
        const { proposalId, ratifiedBy, councilMeetingDate } = body;
        if (!proposalId) {
          return NextResponse.json(
            { success: false, error: "Proposal ID is required" },
            { status: 400 }
          );
        }

        const proposal = bosGovernanceEngine.ratifyByAcademicCouncil(
          proposalId,
          ratifiedBy || "Academic Council (Chaired by Vice-Chancellor & Director)",
          councilMeetingDate || new Date().toISOString().split("T")[0]
        );

        return NextResponse.json({
          success: true,
          message: `Curriculum officially ratified under Academic Council Gazette No: ${proposal.ratificationGazetteNumber}`,
          data: proposal,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process BoS action" },
      { status: 500 }
    );
  }
}
