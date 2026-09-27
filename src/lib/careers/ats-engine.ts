export interface AtsScoreResult {
  matchPercentage: number;
  grade: "EXCELLENT" | "STRONG" | "MODERATE" | "GAP";
  matchedSkills: string[];
  missingSkills: string[];
  cgpaEligible: boolean;
  recommendations: string[];
}

export interface ScheduledInterview {
  id: string;
  jobId: string;
  companyName: string;
  jobTitle: string;
  candidateName: string;
  candidateRollNo: string;
  roundName: string;
  scheduledAt: string;
  interviewerName: string;
  meetingLink: string;
  status: "CONFIRMED" | "COMPLETED" | "RESCHEDULED";
}

export function computeAtsScore(
  candidateSkills: string[],
  candidateCgpa: number,
  jobRequirements: string
): AtsScoreResult {
  const reqLower = (jobRequirements || "").toLowerCase();

  const INDUSTRY_KEYWORDS = [
    "python",
    "pytorch",
    "tensorflow",
    "distributed systems",
    "algorithms",
    "docker",
    "kubernetes",
    "sql",
    "postgresql",
    "react",
    "typescript",
    "node.js",
    "c++",
    "rust",
    "machine learning",
    "microservices",
    "cloud",
    "neural networks",
    "linux",
    "git",
  ];

  const requiredSkills = INDUSTRY_KEYWORDS.filter((kw) => reqLower.includes(kw));
  const targetRequired = requiredSkills.length > 0 ? requiredSkills : ["algorithms", "python", "distributed systems", "sql"];

  const candidateLower = candidateSkills.map((s) => s.toLowerCase());

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of targetRequired) {
    if (candidateLower.some((cs) => cs.includes(skill) || skill.includes(cs))) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillRatio = targetRequired.length > 0 ? matchedSkills.length / targetRequired.length : 1.0;
  const cgpaEligible = candidateCgpa >= 3.0;
  const cgpaBonus = candidateCgpa >= 3.6 ? 12 : candidateCgpa >= 3.0 ? 5 : -10;

  const rawScore = Math.round(skillRatio * 85 + cgpaBonus);
  const matchPercentage = Math.max(30, Math.min(98, rawScore));

  let grade: AtsScoreResult["grade"] = "MODERATE";
  if (matchPercentage >= 85) grade = "EXCELLENT";
  else if (matchPercentage >= 70) grade = "STRONG";
  else if (matchPercentage < 50) grade = "GAP";

  const recommendations: string[] = [];
  if (missingSkills.length > 0) {
    recommendations.push(`Incorporate laboratory projects demonstrating: ${missingSkills.slice(0, 3).join(", ")}`);
  }
  if (!cgpaEligible) {
    recommendations.push("Maintain minimum 3.0 CGPA threshold or seek Senate academic standing waiver.");
  }
  recommendations.push("Quantify architectural impact (e.g. latency, throughput, scale) in resume bullet points.");

  return {
    matchPercentage,
    grade,
    matchedSkills,
    missingSkills,
    cgpaEligible,
    recommendations,
  };
}
