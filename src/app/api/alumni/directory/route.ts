import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import { alumniStore } from "@/lib/alumni/alumni-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company") || undefined;
    const batch = searchParams.get("batch") ? Number(searchParams.get("batch")) : undefined;
    const mentorshipOnly = searchParams.get("mentorshipOnly") === "true";

    const list = alumniStore.getAlumni({
      company,
      batch,
      mentorshipOnly,
    });

    return NextResponse.json({
      success: true,
      totalAlumni: list.length,
      availableMentorsCount: list.filter((a) => a.isAvailableForMentorship).length,
      alumni: list,
    });
  } catch (error: any) {
    logger.error("Alumni directory GET error", error);
    return NextResponse.json({ error: error.message || "Failed to fetch alumni directory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to register in alumni directory" }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, graduationBatch, degree, currentCompany, jobTitle, location, isAvailableForMentorship, mentorTopics, linkedinUrl } = body;

    const alumnus = alumniStore.registerAlumnus({
      fullName: fullName || session.fullName,
      graduationBatch: Number(graduationBatch),
      degree,
      currentCompany,
      jobTitle,
      location,
      isAvailableForMentorship: Boolean(isAvailableForMentorship),
      mentorTopics: Array.isArray(mentorTopics) ? mentorTopics : typeof mentorTopics === "string" ? mentorTopics.split(",").map((s: string) => s.trim()) : undefined,
      linkedinUrl,
      email: session.email,
    });

    return NextResponse.json({
      success: true,
      message: "Alumni profile registered successfully in the university network",
      alumnus,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Alumni registration POST error", error);
    return NextResponse.json({ error: error.message || "Failed to register alumni profile" }, { status: 400 });
  }
}
