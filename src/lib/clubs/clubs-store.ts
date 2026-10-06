import fs from "fs";
import path from "path";
import {
  StudentClub,
  ActivityPointClaim,
  calculateStudentActivityPoints,
  validateActivityClaimInput,
  ClaimStatus,
} from "./clubs-engine";

const DATA_DIR = path.join(process.cwd(), "data", "clubs");
const STORE_FILE = path.join(DATA_DIR, "clubs_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface ClubsStoreSchema {
  clubs: StudentClub[];
  claims: ActivityPointClaim[];
}

const DEFAULT_CLUBS: StudentClub[] = [
  {
    id: "cl-01",
    code: "IEEE-SB",
    name: "IEEE Student Branch",
    category: "TECHNICAL",
    description: "International technical professional society organizing symposiums, workshops, and robotics sprints.",
    presidentName: "Alex Mercer",
    facultyAdvisor: "Dr. Radhika Gupta (HOD CS)",
    totalMembers: 145,
    annualBudget: 6000,
    budgetUtilized: 3800,
    establishedYear: 2012,
  },
  {
    id: "cl-02",
    code: "ACM-APEX",
    name: "ACM Student Chapter",
    category: "TECHNICAL",
    description: "Computing machinery chapter focusing on competitive programming and algorithms.",
    presidentName: "Liam Zhao",
    facultyAdvisor: "Prof. Sarah Chen",
    totalMembers: 98,
    annualBudget: 4500,
    budgetUtilized: 2100,
    establishedYear: 2016,
  },
  {
    id: "cl-03",
    code: "ROTARACT-YOUTH",
    name: "Rotaract Youth & Community Cell",
    category: "SOCIAL_SERVICE",
    description: "Blood donation drives, rural education programs, and green campus cleanups.",
    presidentName: "Priya Sharma",
    facultyAdvisor: "Dr. Arthur Pendleton",
    totalMembers: 180,
    annualBudget: 3500,
    budgetUtilized: 2900,
    establishedYear: 2010,
  },
  {
    id: "cl-04",
    code: "CULTURE-GUILD",
    name: "Apex University Dramatics & Cultural Guild",
    category: "CULTURAL",
    description: "Performing arts, inter-collegiate dance fests, theatre production, and music recitals.",
    presidentName: "Maya Lin",
    facultyAdvisor: "Prof. David Miller",
    totalMembers: 110,
    annualBudget: 5500,
    budgetUtilized: 4200,
    establishedYear: 2014,
  },
  {
    id: "cl-05",
    code: "VARSITY-SPORTS",
    name: "Varsity Athletics & Sports Club",
    category: "SPORTS",
    description: "Inter-university tournament training in football, basketball, track & field, and badminton.",
    presidentName: "Carlos Santana",
    facultyAdvisor: "Coach Richard Barnes",
    totalMembers: 160,
    annualBudget: 7500,
    budgetUtilized: 5800,
    establishedYear: 2008,
  },
];

const DEFAULT_CLAIMS: ActivityPointClaim[] = [
  {
    id: "clm-01",
    claimRef: "ACT-2026-101",
    studentRoll: "CS2026-001",
    studentName: "Alex Mercer",
    clubCode: "IEEE-SB",
    clubName: "IEEE Student Branch",
    category: "TECHNICAL",
    activityTitle: "Lead Coordinator - National AI Robotics Sprint 2026",
    description: "Conducted 3-day hardware sprint for 250 participants; built autonomous navigation bots.",
    participationHours: 36,
    pointsClaimed: 25,
    pointsAwarded: 25,
    status: "APPROVED",
    evidenceReference: "CERT-IEEE-SPRINT-2026-X1",
    reviewedBy: "Dr. Radhika Gupta (HOD CS)",
    submittedAt: "2026-09-15T10:00:00.000Z",
  },
  {
    id: "clm-02",
    claimRef: "ACT-2026-102",
    studentRoll: "CS2026-001",
    studentName: "Alex Mercer",
    clubCode: "ROTARACT-YOUTH",
    clubName: "Rotaract Youth & Community Cell",
    category: "SOCIAL_SERVICE",
    activityTitle: "Campus Blood Donation & Health Camp Volunteer",
    description: "Managed registration and logistics during annual university mega blood donation drive.",
    participationHours: 16,
    pointsClaimed: 15,
    pointsAwarded: 15,
    status: "APPROVED",
    evidenceReference: "CERT-ROTARACT-BDC-2026",
    reviewedBy: "Dr. Arthur Pendleton",
    submittedAt: "2026-09-28T14:30:00.000Z",
  },
];

function readStore(): ClubsStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: ClubsStoreSchema = {
      clubs: DEFAULT_CLUBS,
      claims: DEFAULT_CLAIMS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading clubs store, using defaults", err);
    return {
      clubs: DEFAULT_CLUBS,
      claims: DEFAULT_CLAIMS,
    };
  }
}

function writeStore(data: ClubsStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const clubsStore = {
  getSummary(studentRoll?: string) {
    const store = readStore();
    const targetRoll = studentRoll || "CS2026-001";
    const studentClaims = store.claims.filter((c) => c.studentRoll === targetRoll);
    const progress = calculateStudentActivityPoints(studentClaims);

    return {
      totalClubs: store.clubs.length,
      totalMembers: store.clubs.reduce((acc, c) => acc + c.totalMembers, 0),
      totalClaims: store.claims.length,
      pendingReviewCount: store.claims.filter((c) => c.status === "PENDING_FACULTY_REVIEW").length,
      studentProgress: progress,
      clubs: store.clubs,
    };
  },

  getClubs() {
    return readStore().clubs;
  },

  getClaims(studentRoll?: string) {
    const store = readStore();
    if (studentRoll) {
      return store.claims.filter((c) => c.studentRoll === studentRoll);
    }
    return store.claims;
  },

  submitClaim(payload: Partial<ActivityPointClaim>) {
    const store = readStore();
    const validation = validateActivityClaimInput(payload);
    if (!validation.isValid) {
      throw new Error(`Activity Claim Error: ${validation.errors.join("; ")}`);
    }

    const club = store.clubs.find((c) => c.code === payload.clubCode);

    const newClaim: ActivityPointClaim = {
      id: `clm-${Date.now()}`,
      claimRef: `ACT-2026-${Math.floor(100 + Math.random() * 900)}`,
      studentRoll: payload.studentRoll!,
      studentName: payload.studentName || "Alex Mercer",
      clubCode: payload.clubCode!,
      clubName: club?.name || "Student Society",
      category: club?.category || payload.category || "TECHNICAL",
      activityTitle: payload.activityTitle!,
      description: payload.description || "Activity participation recorded",
      participationHours: Number(payload.participationHours),
      pointsClaimed: Number(payload.pointsClaimed),
      pointsAwarded: 0,
      status: "PENDING_FACULTY_REVIEW",
      evidenceReference: payload.evidenceReference || `EVID-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };

    store.claims.unshift(newClaim);
    writeStore(store);
    return newClaim;
  },

  verifyClaim(id: string, status: ClaimStatus, pointsAwarded?: number, reviewer?: string) {
    const store = readStore();
    const target = store.claims.find((c) => c.id === id);
    if (!target) {
      throw new Error("Activity claim not found.");
    }

    target.status = status;
    target.pointsAwarded = status === "APPROVED" ? (pointsAwarded ?? target.pointsClaimed) : 0;
    if (reviewer) target.reviewedBy = reviewer;
    writeStore(store);
    return target;
  },
};
