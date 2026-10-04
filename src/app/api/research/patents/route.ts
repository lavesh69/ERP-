import { NextRequest, NextResponse } from "next/server";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const RESEARCH_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "RESEARCH_COORDINATOR", "PRINCIPAL", "FACULTY"];

interface PatentRecord {
  id: string;
  title: string;
  inventors: string[];
  applicationNumber: string;
  filingDate: string;
  jurisdiction: "INDIAN_PATENT_OFFICE" | "USPTO" | "WIPO_PCT" | "EPO";
  status: "PROVISIONAL" | "COMPLETE_SPECIFICATION" | "PUBLISHED" | "EXAMINED" | "GRANTED";
  patentNumber?: string;
  commercializationPartner?: string;
}

const SAMPLE_PATENTS: PatentRecord[] = [
  {
    id: "pat-01",
    title: "Fault-Tolerant Dynamic Beacon Authentication for Edge Telemetry",
    inventors: ["Dr. Evelyn Reed", "Alex Mercer"],
    applicationNumber: "IN-202641098231",
    filingDate: "2026-03-12",
    jurisdiction: "INDIAN_PATENT_OFFICE",
    status: "PUBLISHED",
    commercializationPartner: "Apex IoT Spin-off Labs",
  },
  {
    id: "pat-02",
    title: "Ultra-Low Power Geofencing Protocol for Campus Sensor Networks",
    inventors: ["Dr. Evelyn Reed"],
    applicationNumber: "US-18/982,109",
    filingDate: "2026-07-20",
    jurisdiction: "USPTO",
    status: "EXAMINED",
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, RESEARCH_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let list = [...SAMPLE_PATENTS];
    if (status) list = list.filter((p) => p.status === status);

    return NextResponse.json({
      success: true,
      totalPatents: list.length,
      grantedCount: list.filter((p) => p.status === "GRANTED").length,
      patents: list,
    });
  } catch (error: any) {
    logger.error("Research patents GET error", error);
    return NextResponse.json({ error: "Failed to fetch patent portfolio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, RESEARCH_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { title, inventors, applicationNumber, jurisdiction, status } = body;

    if (!title || !applicationNumber) {
      return NextResponse.json({ error: "title and applicationNumber are required" }, { status: 400 });
    }

    const newPatent: PatentRecord = {
      id: `pat-${Date.now()}`,
      title,
      inventors: Array.isArray(inventors) ? inventors : [auth.payload.email],
      applicationNumber,
      filingDate: new Date().toISOString().split("T")[0],
      jurisdiction: jurisdiction || "INDIAN_PATENT_OFFICE",
      status: status || "PROVISIONAL",
    };

    SAMPLE_PATENTS.push(newPatent);

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "research_coordinator",
      action: "PATENT_DISCLOSURE_REGISTERED",
      targetEntity: "PatentRecord",
      targetId: newPatent.id,
      details: {
        title,
        appNumber: applicationNumber,
        jurisdiction: newPatent.jurisdiction,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Patent application '${title}' successfully indexed in institutional intellectual property portfolio.`,
      patent: newPatent,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Research patents POST error", error);
    return NextResponse.json({ error: "Failed to register patent disclosure" }, { status: 500 });
  }
}
