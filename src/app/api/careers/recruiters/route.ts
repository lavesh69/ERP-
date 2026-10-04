import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const PLACEMENT_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PLACEMENT_OFFICER", "PRINCIPAL"];

interface RecruiterPartner {
  id: string;
  companyName: string;
  industry: string;
  tier: "DREAM" | "SUPER_DREAM" | "CORE" | "MASS";
  averageCtcLpa: number;
  highestCtcLpa: number;
  primaryHrName: string;
  primaryHrEmail: string;
  primaryHrPhone: string;
  driveStatus: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "BLACKLISTED";
  targetBatches: string[];
}

const SAMPLE_RECRUITERS: RecruiterPartner[] = [
  {
    id: "rec-01",
    companyName: "Google Cloud Platform",
    industry: "Cloud & Distributed Systems",
    tier: "SUPER_DREAM",
    averageCtcLpa: 28.5,
    highestCtcLpa: 45.0,
    primaryHrName: "Sarah Jenkins",
    primaryHrEmail: "sarah.j@google.com",
    primaryHrPhone: "+1-650-253-0000",
    driveStatus: "UPCOMING",
    targetBatches: ["B.Tech CSE 2026", "M.Tech AI 2026"],
  },
  {
    id: "rec-02",
    companyName: "Microsoft Technology Center",
    industry: "Software Engineering",
    tier: "DREAM",
    averageCtcLpa: 22.0,
    highestCtcLpa: 36.0,
    primaryHrName: "David Miller",
    primaryHrEmail: "david.m@microsoft.com",
    primaryHrPhone: "+1-425-882-8080",
    driveStatus: "IN_PROGRESS",
    targetBatches: ["B.Tech All Branches 2026"],
  },
  {
    id: "rec-03",
    companyName: "Deloitte Digital",
    industry: "Management & Tech Consulting",
    tier: "CORE",
    averageCtcLpa: 11.5,
    highestCtcLpa: 16.0,
    primaryHrName: "Ananya Sharma",
    primaryHrEmail: "ananya.s@deloitte.com",
    primaryHrPhone: "+91-9876543210",
    driveStatus: "COMPLETED",
    targetBatches: ["B.Tech", "MCA", "MBA"],
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, PLACEMENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const status = searchParams.get("status");

    let filtered = [...SAMPLE_RECRUITERS];
    if (tier) filtered = filtered.filter((r) => r.tier === tier);
    if (status) filtered = filtered.filter((r) => r.driveStatus === status);

    const dreamCount = filtered.filter((r) => r.tier === "DREAM" || r.tier === "SUPER_DREAM").length;

    return NextResponse.json({
      success: true,
      totalRecruiters: filtered.length,
      dreamCompaniesCount: dreamCount,
      recruiters: filtered,
    });
  } catch (error: any) {
    logger.error("Careers recruiters GET error", error);
    return NextResponse.json({ error: "Failed to fetch corporate partner CRM" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, PLACEMENT_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { companyName, industry, tier, averageCtcLpa, primaryHrName, primaryHrEmail, primaryHrPhone } = body;

    if (!companyName || !primaryHrEmail) {
      return NextResponse.json({ error: "companyName and primaryHrEmail are required" }, { status: 400 });
    }

    const newPartner: RecruiterPartner = {
      id: `rec-${Date.now()}`,
      companyName,
      industry: industry || "Information Technology",
      tier: tier || "CORE",
      averageCtcLpa: Number(averageCtcLpa) || 10.0,
      highestCtcLpa: Number(averageCtcLpa) || 10.0,
      primaryHrName: primaryHrName || "Recruiting Lead",
      primaryHrEmail,
      primaryHrPhone: primaryHrPhone || "+1-000-000-0000",
      driveStatus: "UPCOMING",
      targetBatches: ["Graduating Batch 2026"],
    };

    SAMPLE_RECRUITERS.push(newPartner);

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "placement_officer",
      action: "CORPORATE_RECRUITER_PARTNER_REGISTERED",
      targetEntity: "JobPosting",
      targetId: newPartner.id,
      details: {
        company: companyName,
        tier: newPartner.tier,
        hrEmail: primaryHrEmail,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Corporate recruiting partner '${companyName}' onboarded successfully to placement directory.`,
      partner: newPartner,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Careers recruiters POST error", error);
    return NextResponse.json({ error: "Failed to register corporate partner" }, { status: 500 });
  }
}
