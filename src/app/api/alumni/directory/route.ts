import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export interface AlumniProfile {
  id: string;
  fullName: string;
  graduationBatch: number;
  degree: string;
  currentCompany: string;
  jobTitle: string;
  location: string;
  isAvailableForMentorship: boolean;
  mentorTopics: string[];
  linkedinUrl: string;
}

const SAMPLE_ALUMNI: AlumniProfile[] = [
  {
    id: "alm-01",
    fullName: "Rohan Varma",
    graduationBatch: 2023,
    degree: "B.Tech in Computer Science",
    currentCompany: "Stripe",
    jobTitle: "Senior Systems Engineer",
    location: "San Francisco, CA",
    isAvailableForMentorship: true,
    mentorTopics: ["Distributed Systems", "FAANG Mock Interviews", "US Masters Advice"],
    linkedinUrl: "https://linkedin.com/in/rohan-varma",
  },
  {
    id: "alm-02",
    fullName: "Priya Nair",
    graduationBatch: 2024,
    degree: "B.Tech in Artificial Intelligence",
    currentCompany: "Google DeepMind",
    jobTitle: "Research Engineer",
    location: "London, UK",
    isAvailableForMentorship: true,
    mentorTopics: ["AI/ML Research", "Publishing NeurIPS papers", "Scholarships"],
    linkedinUrl: "https://linkedin.com/in/priya-nair",
  },
  {
    id: "alm-03",
    fullName: "Karan Johar",
    graduationBatch: 2022,
    degree: "B.Tech in Mechanical",
    currentCompany: "Tesla Motors",
    jobTitle: "Thermal Systems Architect",
    location: "Austin, TX",
    isAvailableForMentorship: false,
    mentorTopics: ["Hardware & EV Systems"],
    linkedinUrl: "https://linkedin.com/in/karan-johar",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const batch = searchParams.get("batch");
    const mentorshipOnly = searchParams.get("mentorshipOnly") === "true";

    let list = [...SAMPLE_ALUMNI];

    if (company) {
      list = list.filter((a) => a.currentCompany.toLowerCase().includes(company.toLowerCase()));
    }
    if (batch) {
      list = list.filter((a) => a.graduationBatch === Number(batch));
    }
    if (mentorshipOnly) {
      list = list.filter((a) => a.isAvailableForMentorship);
    }

    return NextResponse.json({
      success: true,
      totalAlumni: list.length,
      availableMentorsCount: list.filter((a) => a.isAvailableForMentorship).length,
      alumni: list,
    });
  } catch (error: any) {
    logger.error("Alumni directory GET error", error);
    return NextResponse.json({ error: "Failed to fetch alumni directory" }, { status: 500 });
  }
}
