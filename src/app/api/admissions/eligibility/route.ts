import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";

interface ProgramEligibilityRule {
  programCode: string;
  programTitle: string;
  minTwelfthPercentage: number;
  mandatorySubjects: string[];
  scholarshipCutoff: number;
  scholarshipAmountUsd: number;
  annualTuitionUsd: number;
}

const PROGRAM_CUTOFFS: ProgramEligibilityRule[] = [
  {
    programCode: "BTECH-CSE",
    programTitle: "B.Tech in Computer Science & Engineering",
    minTwelfthPercentage: 75.0,
    mandatorySubjects: ["Physics", "Mathematics", "Chemistry / CS"],
    scholarshipCutoff: 90.0,
    scholarshipAmountUsd: 4000,
    annualTuitionUsd: 12000,
  },
  {
    programCode: "BTECH-AI",
    programTitle: "B.Tech in Artificial Intelligence & Machine Learning",
    minTwelfthPercentage: 78.0,
    mandatorySubjects: ["Physics", "Mathematics"],
    scholarshipCutoff: 92.0,
    scholarshipAmountUsd: 5000,
    annualTuitionUsd: 13500,
  },
  {
    programCode: "BTECH-ECE",
    programTitle: "B.Tech in Electronics & Communication",
    minTwelfthPercentage: 65.0,
    mandatorySubjects: ["Physics", "Mathematics"],
    scholarshipCutoff: 85.0,
    scholarshipAmountUsd: 3000,
    annualTuitionUsd: 10500,
  },
  {
    programCode: "BCA-HONORS",
    programTitle: "Bachelor of Computer Applications (Honors)",
    minTwelfthPercentage: 60.0,
    mandatorySubjects: ["Mathematics / Statistics"],
    scholarshipCutoff: 82.0,
    scholarshipAmountUsd: 2500,
    annualTuitionUsd: 7500,
  },
  {
    programCode: "BBA-FINTECH",
    programTitle: "Bachelor of Business Administration (FinTech & Analytics)",
    minTwelfthPercentage: 55.0,
    mandatorySubjects: ["English"],
    scholarshipCutoff: 80.0,
    scholarshipAmountUsd: 2000,
    annualTuitionUsd: 8000,
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { twelfthPercentage, entrancePercentile, stream } = body;

    const percentage = Number(twelfthPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "Valid twelfthPercentage between 0 and 100 is required" }, { status: 400 });
    }

    const eligiblePrograms = PROGRAM_CUTOFFS.filter((p) => percentage >= p.minTwelfthPercentage).map((p) => {
      const isScholarshipEligible = percentage >= p.scholarshipCutoff;
      const netTuition = isScholarshipEligible
        ? p.annualTuitionUsd - p.scholarshipAmountUsd
        : p.annualTuitionUsd;

      return {
        programCode: p.programCode,
        programTitle: p.programTitle,
        cutoffRequired: p.minTwelfthPercentage,
        candidatePercentage: percentage,
        marginAboveCutoff: Number((percentage - p.minTwelfthPercentage).toFixed(1)),
        isScholarshipGranted: isScholarshipEligible,
        scholarshipGrant: isScholarshipEligible ? `$${p.scholarshipAmountUsd} Merit Award` : "None",
        standardTuition: `$${p.annualTuitionUsd}`,
        effectiveNetTuition: `$${netTuition}`,
        mandatorySubjects: p.mandatorySubjects,
      };
    });

    const highestTierQualified = eligiblePrograms.find((p) => p.programCode === "BTECH-AI" || p.programCode === "BTECH-CSE");

    return NextResponse.json({
      success: true,
      candidateScore: {
        twelfthPercentage: percentage,
        entrancePercentile: entrancePercentile || "N/A",
      },
      summary: {
        totalEligiblePrograms: eligiblePrograms.length,
        hasTopTierAdmission: !!highestTierQualified,
        scholarshipQualifiedCount: eligiblePrograms.filter((p) => p.isScholarshipGranted).length,
      },
      eligiblePrograms,
    });
  } catch (error: any) {
    logger.error("Admission eligibility POST error", error);
    return NextResponse.json({ error: "Failed to evaluate admission eligibility" }, { status: 500 });
  }
}
