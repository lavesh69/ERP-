import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";
import { admissionsStore } from "@/lib/admissions/admissions-store";

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

const DATA_DIR = path.join(process.cwd(), "data", "admissions");
const ENQUIRIES_FILE = path.join(DATA_DIR, "enquiries.json");

const DEFAULT_LEADS: AdmissionLead[] = [
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
    counselorNotes: "Interested in AI & Systems minor. Follow-up scheduled.",
    submittedAt: "2026-10-02T14:30:00Z",
  },
  {
    id: "lead-02",
    applicantName: "Diya Sengupta",
    email: "diya.sengupta@example.com",
    phone: "+91-9876505678",
    targetProgram: "B.Tech in Artificial Intelligence & Robotics",
    twelfthPercentage: 95.0,
    entranceExamScore: "SAT 1490",
    city: "Bengaluru",
    status: "COUNSELED",
    counselorNotes: "Counseled by Dr. Evelyn. Eligible for merit scholarship waiver.",
    submittedAt: "2026-10-10T11:15:00Z",
  },
  {
    id: "lead-03",
    applicantName: "Kabir Malhotra",
    email: "kabir.malhotra@example.com",
    phone: "+91-9876509988",
    targetProgram: "B.Tech Electronics & Communication",
    twelfthPercentage: 84.2,
    entranceExamScore: "State CET Rank 1420",
    city: "Pune",
    status: "CONTACTED",
    counselorNotes: "Parent requested hostel accommodation details and fee schedule.",
    submittedAt: "2026-10-18T09:40:00Z",
  },
];

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEnquiries(): AdmissionLead[] {
  ensureDirectory();
  if (!fs.existsSync(ENQUIRIES_FILE)) {
    fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(DEFAULT_LEADS, null, 2), "utf-8");
    return DEFAULT_LEADS;
  }
  try {
    const raw = fs.readFileSync(ENQUIRIES_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read enquiries file, fallback to defaults", err);
    return DEFAULT_LEADS;
  }
}

function writeEnquiries(leads: AdmissionLead[]) {
  ensureDirectory();
  fs.writeFileSync(ENQUIRIES_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const program = searchParams.get("program");
    const status = searchParams.get("status");

    let leads = readEnquiries();
    if (program && program !== "ALL") {
      leads = leads.filter((l) => l.targetProgram.toLowerCase().includes(program.toLowerCase()));
    }
    if (status && status !== "ALL") {
      leads = leads.filter((l) => l.status === status);
    }

    return NextResponse.json({
      success: true,
      totalLeads: leads.length,
      newEnquiriesCount: leads.filter((l) => l.status === "NEW_ENQUIRY").length,
      counseledCount: leads.filter((l) => l.status === "COUNSELED").length,
      leads,
    });
  } catch (error: any) {
    logger.error("Admission enquiry GET error", error);
    return NextResponse.json({ error: "Failed to fetch admission leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { action } = body;

    if (action === "UPDATE_STATUS") {
      if (!session) {
        return NextResponse.json({ error: "Authentication required to update enquiry status" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions counselors can update leads" }, { status: 403 });
      }

      const { enquiryId, status, counselorNotes } = body;
      if (!enquiryId || !status) {
        return NextResponse.json({ error: "enquiryId and status are required" }, { status: 400 });
      }

      const leads = readEnquiries();
      const target = leads.find((l) => l.id === enquiryId);
      if (!target) {
        return NextResponse.json({ error: "Enquiry record not found" }, { status: 404 });
      }

      target.status = status;
      if (counselorNotes !== undefined) {
        target.counselorNotes = counselorNotes;
      }
      writeEnquiries(leads);

      return NextResponse.json({
        success: true,
        message: `Enquiry ${enquiryId} status updated to ${status}`,
        lead: target,
      });
    }

    if (action === "CONVERT_TO_APPLICANT") {
      if (!session) {
        return NextResponse.json({ error: "Authentication required to convert enquiry to applicant" }, { status: 401 });
      }
      const isStaffOrAdmin = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ADMISSION_OFFICER", "FACULTY"].includes(session.role);
      if (!isStaffOrAdmin) {
        return NextResponse.json({ error: "Forbidden: Only admissions administrators can convert leads" }, { status: 403 });
      }

      const { enquiryId, programCode } = body;
      if (!enquiryId) {
        return NextResponse.json({ error: "enquiryId is required" }, { status: 400 });
      }

      const leads = readEnquiries();
      const target = leads.find((l) => l.id === enquiryId);
      if (!target) {
        return NextResponse.json({ error: "Enquiry record not found" }, { status: 404 });
      }

      // Create applicant in admissionsStore
      const gpa = Number((target.twelfthPercentage / 25).toFixed(2)); // convert ~95% to ~3.8
      const examScore = 1350; // default estimated SAT equivalent
      const pCode = programCode || "BTECH-CSE";

      const applicant = admissionsStore.createApplicant({
        fullName: target.applicantName,
        email: target.email,
        phone: target.phone,
        programCode: pCode,
        highSchoolGpa: gpa,
        entranceExamScore: examScore,
        source: "WALK_IN",
      });

      target.status = "ADMITTED";
      target.counselorNotes = (target.counselorNotes ? `${target.counselorNotes} | ` : "") + `Converted to formal applicant (${applicant.applicationNo})`;
      writeEnquiries(leads);

      return NextResponse.json({
        success: true,
        message: `Enquiry successfully promoted to formal applicant (App #: ${applicant.applicationNo})`,
        applicant,
        lead: target,
      });
    }

    // Default action: Create new prospective enquiry
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
      entranceExamScore: entranceExamScore || "Awaiting Entrance Results",
      city: city || "Campus Region",
      status: "NEW_ENQUIRY",
      submittedAt: new Date().toISOString(),
    };

    const leads = readEnquiries();
    leads.unshift(lead);
    writeEnquiries(leads);

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
    return NextResponse.json({ error: error.message || "Failed to submit admission enquiry" }, { status: 500 });
  }
}
