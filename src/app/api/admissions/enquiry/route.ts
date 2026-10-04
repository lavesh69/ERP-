import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export interface AdmissionLead {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  targetProgram: string;
  twelfthPercentage: number;
  entranceExamScore?: string;
  city: string;
  status: "NEW_ENQUIRY" | "CONTACTED" | "COUNSELED" | "ADMITTED" | "CLOSED";
  counselorNotes?: string;
  submittedAt: string;
}

const SAMPLE_LEADS: AdmissionLead[] = [
  {
    id: "lead-01",
    applicantName: "Aarav Sharma",
    email: "aarav.sharma@example.com",
    phone: "+91-9876501234",
    targetProgram: "B.Tech in Computer Science",
    twelfthPercentage: 92.4,
    entranceExamScore: "JEE Main: 98.2 Percentile",
    city: "New Delhi",
    status: "NEW_ENQUIRY",
    submittedAt: "2026-10-02T14:30:00Z",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const program = searchParams.get("program");
    const status = searchParams.get("status");

    let leads = [...SAMPLE_LEADS];
    if (program) leads = leads.filter((l) => l.targetProgram.toLowerCase().includes(program.toLowerCase()));
    if (status) leads = leads.filter((l) => l.status === status);

    return NextResponse.json({
      success: true,
      totalLeads: leads.length,
      newEnquiriesCount: leads.filter((l) => l.status === "NEW_ENQUIRY").length,
      leads,
    });
  } catch (error: any) {
    logger.error("Admission enquiry GET error", error);
    return NextResponse.json({ error: "Failed to fetch admission leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicantName, email, phone, targetProgram, twelfthPercentage, entranceExamScore, city } = body;

    if (!applicantName || !email || !phone) {
      return NextResponse.json({ error: "applicantName, email, and phone are required" }, { status: 400 });
    }

    const lead: AdmissionLead = {
      id: `lead-${Date.now()}`,
      applicantName,
      email,
      phone,
      targetProgram: targetProgram || "B.Tech Computer Science",
      twelfthPercentage: Number(twelfthPercentage) || 85.0,
      entranceExamScore,
      city: city || "Campus Region",
      status: "NEW_ENQUIRY",
      submittedAt: new Date().toISOString(),
    };

    SAMPLE_LEADS.unshift(lead);

    logger.info("New prospective admission enquiry received", {
      applicant: applicantName,
      email,
      program: lead.targetProgram,
    });

    return NextResponse.json({
      success: true,
      message: `Thank you ${applicantName}! Your admission enquiry has been submitted. Our Dean of Admissions will contact you within 24 hours.`,
      enquiryReference: `ENQ-APEX-${lead.id.slice(-6).toUpperCase()}`,
      lead,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Admission enquiry POST error", error);
    return NextResponse.json({ error: "Failed to submit admission enquiry" }, { status: 500 });
  }
}
