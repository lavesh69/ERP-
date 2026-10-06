/**
 * Persistent Data Store for Enterprise Grievances & Statutory Ombudsman Operations
 * Manages official complaint dossiers, hearing minutes, action-taken reports, and statutory committees.
 */

import fs from "fs";
import path from "path";
import {
  GrievanceRecord,
  StatutoryCommittee,
  assignStatutoryCommittee,
  computeSlaStatus,
  validateGrievanceSubmission,
  calculateDisposalRate,
} from "./grievances-engine";

const DATA_DIR = path.join(process.cwd(), "data", "grievances");
const STORE_FILE = path.join(DATA_DIR, "grievance_registry.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface GrievancesStoreSchema {
  grievances: GrievanceRecord[];
  committees: StatutoryCommittee[];
}

const DEFAULT_COMMITTEES: StatutoryCommittee[] = [
  {
    id: "com-anti-ragging",
    name: "Apex Anti-Ragging Monitoring Squad (AICTE Mandate)",
    code: "ARC-01",
    mandate: "Strict zero-tolerance enforcement against hazing or harassment under Supreme Court directive.",
    headName: "Prof. Dr. Vikramaditya Sen",
    headDesignation: "Dean of Student Affairs & Chairman ARC",
    membersCount: 8,
    emergencyHelpline: "+1 (800) 180-5522 (Toll Free 24/7)",
    officialEmail: "antiragging@classroom.edu",
  },
  {
    id: "com-icc",
    name: "Internal Complaints Committee (ICC / POSH Cell)",
    code: "ICC-02",
    mandate: "Statutory prevention and redressal of gender discrimination and workplace/campus harassment.",
    headName: "Prof. Dr. Catherine Brooks",
    headDesignation: "Senior Faculty & Presiding Officer ICC",
    membersCount: 6,
    emergencyHelpline: "+1 (555) 880-9911",
    officialEmail: "icc.posh@classroom.edu",
  },
  {
    id: "com-ombudsman",
    name: "Academic Ombudsman & Exam Redressal Cell",
    code: "AEC-03",
    mandate: "Independent review of semester grade challenges, course assessment disputes, and academic integrity appeals.",
    headName: "Justice (Retd.) Evelyn Martinez",
    headDesignation: "Institutional Ombudsman",
    membersCount: 5,
    emergencyHelpline: "+1 (555) 880-9922",
    officialEmail: "ombudsman@classroom.edu",
  },
  {
    id: "com-welfare",
    name: "Campus Estate & Residential Welfare Board",
    code: "ERW-04",
    mandate: "Resolution of student dining, hostel living, transport schedules, and classroom facility deficiencies.",
    headName: "Dr. Arthur Pendelton",
    headDesignation: "Chief Warden & Estate Administrator",
    membersCount: 7,
    emergencyHelpline: "+1 (555) 880-9933",
    officialEmail: "campus.welfare@classroom.edu",
  },
];

const DEFAULT_GRIEVANCES: GrievanceRecord[] = [
  {
    id: "grv-001",
    grievanceTicketNo: "GRV-2026-081",
    title: "Request for Mid-Term Re-Evaluation in CS-402 Distributed Systems",
    description: "Discrepancy observed in Q3 grading rubrics regarding Paxos consensus proofs. Instructor marks do not align with official model key.",
    category: "ACADEMIC_EVALUATION",
    severity: "MEDIUM",
    status: "HEARING_SCHEDULED",
    isAnonymous: false,
    grievantRole: "STUDENT",
    grievantName: "Alex Mercer",
    grievantRollOrId: "CS2026-001",
    respondentName: "Dr. Alan Turing (Course Lead)",
    committeeName: "Academic Ombudsman & Exam Redressal Cell",
    hearingDate: "2026-10-14T10:00:00.000Z",
    actionTakenReport: "Independent evaluator appointed for blind re-assessment. Hearing scheduled with course coordinator.",
    slaTargetDays: 7,
    daysRemaining: 4,
    isSlaBreached: false,
    createdAt: "2026-10-03T11:00:00.000Z",
  },
  {
    id: "grv-002",
    grievanceTicketNo: "GRV-2026-082",
    title: "Hostel Block A 2nd Floor Hot Water Geyser Malfunction",
    description: "The central solar geyser on Mandela Hall Floor 2 has experienced fluctuating pressure for 5 consecutive days.",
    category: "CAMPUS_INFRASTRUCTURE",
    severity: "LOW",
    status: "RESOLVED",
    isAnonymous: false,
    grievantRole: "STUDENT",
    grievantName: "David Miller",
    grievantRollOrId: "ME2026-015",
    committeeName: "Campus Estate & Residential Welfare Board",
    actionTakenReport: "Estate plumbing team replaced the secondary heating coil on Oct 5. Flow rate verified normal by floor prefect.",
    slaTargetDays: 5,
    daysRemaining: 0,
    isSlaBreached: false,
    createdAt: "2026-10-01T08:30:00.000Z",
    resolvedAt: "2026-10-05T16:00:00.000Z",
  },
  {
    id: "grv-003",
    grievanceTicketNo: "GRV-2026-083",
    title: "Anonymous Whistleblower: Unsanctioned Fees for Club Equipment",
    description: "Certain executive members of robotics society reportedly soliciting private cash payments for university laboratory 3D printers.",
    category: "ETHICS_WHISTLEBLOWER",
    severity: "HIGH",
    status: "UNDER_REVIEW",
    isAnonymous: true,
    grievantRole: "CONFIDENTIAL_WHISTLEBLOWER",
    committeeName: "Independent Ethics & Vigilance Commission",
    slaTargetDays: 3,
    daysRemaining: 2,
    isSlaBreached: false,
    createdAt: "2026-10-05T17:15:00.000Z",
  },
];

function readStore(): GrievancesStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: GrievancesStoreSchema = {
      grievances: DEFAULT_GRIEVANCES,
      committees: DEFAULT_COMMITTEES,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading grievances store, fallback to default", err);
    return {
      grievances: DEFAULT_GRIEVANCES,
      committees: DEFAULT_COMMITTEES,
    };
  }
}

function writeStore(data: GrievancesStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const grievancesStore = {
  getSummary() {
    const store = readStore();
    const total = store.grievances.length;
    const resolved = store.grievances.filter((g) => g.status === "RESOLVED").length;
    const active = store.grievances.filter((g) => g.status !== "RESOLVED" && g.status !== "DISMISSED").length;
    const slaBreached = store.grievances.filter((g) => {
      const sla = computeSlaStatus(g.createdAt, g.slaTargetDays);
      return g.status !== "RESOLVED" && sla.isBreached;
    }).length;

    return {
      totalGrievances: total,
      activeGrievances: active,
      resolvedGrievances: resolved,
      disposalRate: calculateDisposalRate(total, resolved),
      slaBreachedCount: slaBreached,
      averageResolutionDays: 2.8,
      committees: store.committees,
    };
  },

  getGrievances(category?: string) {
    const store = readStore();
    let list = store.grievances.map((g) => {
      const sla = computeSlaStatus(g.createdAt, g.slaTargetDays);
      return {
        ...g,
        daysRemaining: sla.daysRemaining,
        isSlaBreached: g.status !== "RESOLVED" && sla.isBreached,
      };
    });

    if (category && category !== "ALL") {
      list = list.filter((g) => g.category === category);
    }
    return list;
  },

  createGrievance(payload: Partial<GrievanceRecord>) {
    const validation = validateGrievanceSubmission(payload);
    if (!validation.isValid) {
      throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const committeeInfo = assignStatutoryCommittee(payload.category!);

    const newGrievance: GrievanceRecord = {
      id: `grv-${Date.now()}`,
      grievanceTicketNo: `GRV-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: payload.title!,
      description: payload.description!,
      category: payload.category!,
      severity: payload.severity || "MEDIUM",
      status: "SUBMITTED",
      isAnonymous: Boolean(payload.isAnonymous),
      grievantRole: payload.grievantRole || "STUDENT",
      grievantName: payload.isAnonymous ? undefined : payload.grievantName,
      grievantRollOrId: payload.isAnonymous ? undefined : payload.grievantRollOrId,
      respondentName: payload.respondentName,
      committeeName: committeeInfo.committeeName,
      slaTargetDays: committeeInfo.defaultDays,
      daysRemaining: committeeInfo.defaultDays,
      isSlaBreached: false,
      createdAt: new Date().toISOString(),
    };

    store.grievances.unshift(newGrievance);
    writeStore(store);
    return newGrievance;
  },

  resolveGrievance(id: string, actionTakenReport: string, status: "RESOLVED" | "DISMISSED" = "RESOLVED") {
    const store = readStore();
    const g = store.grievances.find((item) => item.id === id);
    if (!g) throw new Error("Grievance ticket not found.");

    g.status = status;
    g.actionTakenReport = actionTakenReport;
    g.resolvedAt = new Date().toISOString();

    writeStore(store);
    return g;
  },

  scheduleHearing(id: string, hearingDate: string, notes?: string) {
    const store = readStore();
    const g = store.grievances.find((item) => item.id === id);
    if (!g) throw new Error("Grievance ticket not found.");

    g.status = "HEARING_SCHEDULED";
    g.hearingDate = hearingDate;
    if (notes) g.actionTakenReport = notes;

    writeStore(store);
    return g;
  },
};
