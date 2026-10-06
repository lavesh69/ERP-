/**
 * Persistent Data Store for Enterprise Admissions & Enrollment Operations
 * Manages applicant pipelines, program quotas, admission offers, and seat deposits.
 */

import fs from "fs";
import path from "path";
import {
  ApplicantLead,
  ProgramQuota,
  calculateCompositeScore,
  checkAdmissionEligibility,
  validateApplicantInput,
} from "./admissions-engine";

const DATA_DIR = path.join(process.cwd(), "data", "admissions");
const STORE_FILE = path.join(DATA_DIR, "admissions_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface AdmissionsStoreSchema {
  applicants: ApplicantLead[];
  quotas: ProgramQuota[];
}

const DEFAULT_QUOTAS: ProgramQuota[] = [
  {
    programCode: "BTECH-CSE",
    programName: "B.Tech Computer Science & Engineering",
    totalSeats: 120,
    confirmedSeats: 104,
    cutoffScore: 82.0,
    applicationFee: 75,
  },
  {
    programCode: "BTECH-AI",
    programName: "B.Tech Artificial Intelligence & Robotics",
    totalSeats: 60,
    confirmedSeats: 54,
    cutoffScore: 84.5,
    applicationFee: 75,
  },
  {
    programCode: "BTECH-MECH",
    programName: "B.Tech Mechanical & Mechatronics",
    totalSeats: 90,
    confirmedSeats: 68,
    cutoffScore: 74.0,
    applicationFee: 60,
  },
  {
    programCode: "MBA-TECH",
    programName: "Master of Business Administration (Tech Management)",
    totalSeats: 60,
    confirmedSeats: 48,
    cutoffScore: 78.0,
    applicationFee: 90,
  },
];

const DEFAULT_APPLICANTS: ApplicantLead[] = [
  {
    id: "app-01",
    applicationNo: "ADM-2026-901",
    fullName: "Kavita R. Nair",
    email: "kavita.nair@applicant.org",
    phone: "+1 (555) 334-9911",
    programCode: "BTECH-CSE",
    programName: "B.Tech Computer Science & Engineering",
    highSchoolGpa: 3.92,
    entranceExamScore: 1480,
    meritRank: 14,
    stage: "SEAT_CONFIRMED",
    documentsStatus: {
      transcriptsVerified: true,
      identityProofVerified: true,
      recommendationLettersVerified: true,
    },
    seatDepositPaid: true,
    depositAmount: 1500,
    assignedCounselor: "Dr. Evelyn Reed (Admissions Dean)",
    source: "WEBSITE",
    appliedDate: "2026-08-10T10:00:00.000Z",
  },
  {
    id: "app-02",
    applicationNo: "ADM-2026-902",
    fullName: "Ethan Christopher Vance",
    email: "ethan.vance@applicant.org",
    phone: "+1 (555) 334-9922",
    programCode: "BTECH-AI",
    programName: "B.Tech Artificial Intelligence & Robotics",
    highSchoolGpa: 3.85,
    entranceExamScore: 1440,
    meritRank: 28,
    stage: "OFFER_EXTENDED",
    documentsStatus: {
      transcriptsVerified: true,
      identityProofVerified: true,
      recommendationLettersVerified: false,
    },
    seatDepositPaid: false,
    depositAmount: 0,
    assignedCounselor: "Sarah Jenkins (Senior Counselor)",
    source: "EDUCATION_FAIR",
    appliedDate: "2026-08-14T14:20:00.000Z",
  },
  {
    id: "app-03",
    applicationNo: "ADM-2026-903",
    fullName: "Liam Zhao",
    email: "liam.zhao@applicant.org",
    phone: "+1 (555) 334-9933",
    programCode: "BTECH-CSE",
    programName: "B.Tech Computer Science & Engineering",
    highSchoolGpa: 3.65,
    entranceExamScore: 1390,
    meritRank: 84,
    stage: "MERIT_SHORTLISTED",
    documentsStatus: {
      transcriptsVerified: true,
      identityProofVerified: true,
      recommendationLettersVerified: true,
    },
    seatDepositPaid: false,
    depositAmount: 0,
    assignedCounselor: "Sarah Jenkins (Senior Counselor)",
    source: "REFERRAL",
    appliedDate: "2026-08-20T09:15:00.000Z",
  },
];

function readStore(): AdmissionsStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: AdmissionsStoreSchema = {
      applicants: DEFAULT_APPLICANTS,
      quotas: DEFAULT_QUOTAS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading admissions store, using defaults", err);
    return {
      applicants: DEFAULT_APPLICANTS,
      quotas: DEFAULT_QUOTAS,
    };
  }
}

function writeStore(data: AdmissionsStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const admissionsStore = {
  getSummary() {
    const store = readStore();
    const totalApplicants = store.applicants.length;
    const confirmedSeats = store.applicants.filter((a) => a.stage === "SEAT_CONFIRMED").length;
    const offersExtended = store.applicants.filter((a) => a.stage === "OFFER_EXTENDED").length;
    const totalSeatCapacity = store.quotas.reduce((acc, q) => acc + q.totalSeats, 0);

    return {
      totalApplicants,
      confirmedSeats,
      offersExtended,
      totalSeatCapacity,
      enrollmentRate: totalSeatCapacity > 0 ? Math.round((confirmedSeats / totalSeatCapacity) * 1000) / 10 : 0,
      quotas: store.quotas,
    };
  },

  getApplicants(stage?: string) {
    const store = readStore();
    if (stage && stage !== "ALL") {
      return store.applicants.filter((a) => a.stage === stage);
    }
    return store.applicants;
  },

  createApplicant(lead: Partial<ApplicantLead>) {
    const validation = validateApplicantInput(lead);
    if (!validation.isValid) {
      throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const quota = store.quotas.find((q) => q.programCode === lead.programCode);
    const gpa = lead.highSchoolGpa || 3.5;
    const entrance = lead.entranceExamScore || 1350;
    const composite = calculateCompositeScore(gpa, entrance);

    const newLead: ApplicantLead = {
      id: `app-${Date.now()}`,
      applicationNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
      fullName: lead.fullName!,
      email: lead.email!,
      phone: lead.phone!,
      programCode: lead.programCode!,
      programName: quota ? quota.programName : "Undergraduate Degree",
      highSchoolGpa: gpa,
      entranceExamScore: entrance,
      meritRank: Math.floor(10 + Math.random() * 90),
      stage: composite >= (quota?.cutoffScore || 75) ? "MERIT_SHORTLISTED" : "APPLICATION_SUBMITTED",
      documentsStatus: {
        transcriptsVerified: false,
        identityProofVerified: false,
        recommendationLettersVerified: false,
      },
      seatDepositPaid: false,
      depositAmount: 0,
      assignedCounselor: "Admissions Central Desk",
      source: lead.source || "WEBSITE",
      appliedDate: new Date().toISOString(),
    };

    store.applicants.unshift(newLead);
    writeStore(store);
    return newLead;
  },

  updateApplicantStage(applicantId: string, stage: ApplicantLead["stage"], depositPaid?: boolean) {
    const store = readStore();
    const app = store.applicants.find((a) => a.id === applicantId);
    if (!app) throw new Error("Applicant record not found.");

    app.stage = stage;
    if (depositPaid !== undefined) {
      app.seatDepositPaid = depositPaid;
      if (depositPaid) {
        app.depositAmount = 1500;
        app.stage = "SEAT_CONFIRMED";
      }
    }

    writeStore(store);
    return app;
  },
};
