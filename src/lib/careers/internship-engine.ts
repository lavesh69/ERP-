import fs from "fs";
import path from "path";
import crypto from "crypto";

export type NocStatus =
  | "APPLIED"
  | "NOC_ISSUED"
  | "IN_PROGRESS"
  | "EVALUATED"
  | "CREDITS_AWARDED"
  | "REJECTED";

export interface LogbookEntry {
  weekNumber: number;
  startDate: string;
  endDate: string;
  tasksCompleted: string;
  hoursWorked: number;
  mentorFeedback?: string;
  verifiedByMentor: boolean;
}

export interface InternshipEvaluation {
  industryMentorScore: number; // 0-50
  facultyVivaScore: number;     // 0-50
  totalScore: number;           // 0-100
  grade: string;                // O, A+, A, B+, B, F
  academicCreditsAwarded: number;
  evaluatedAt: string;
  evaluatorSignatory: string;
}

export interface InternshipApplication {
  id: string;
  applicationNo: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  department: string;
  currentSemester: number;
  academicYear: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  industrySupervisorName: string;
  industrySupervisorEmail: string;
  industrySupervisorPhone: string;
  internshipRole: string;
  stipendInrPerMonth: number;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  mode: "ON_SITE" | "HYBRID" | "REMOTE";
  facultyMentorName: string;
  nocStatus: NocStatus;
  nocCertificateNumber?: string;
  nocIssuedAt?: string;
  authorizedSignatory?: string;
  logbookEntries: LogbookEntry[];
  evaluation?: InternshipEvaluation;
  completionSeal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternshipAnalytics {
  totalApplications: number;
  nocIssuedCount: number;
  activeInProgress: number;
  completedWithCredits: number;
  totalStipendMobilizedInr: number;
  averageDurationWeeks: number;
  industryPartnersCount: number;
}

const DATA_DIR = path.join(process.cwd(), "data", "careers");
const INTERNSHIP_FILE = path.join(DATA_DIR, "internships_registry.json");

const SEED_INTERNSHIPS: InternshipApplication[] = [
  {
    id: "INT-2026-001",
    applicationNo: "APEX-INT-2026-1001",
    studentId: "STD-2025-001",
    rollNumber: "2025-CS-101",
    studentName: "Aarav Sharma",
    department: "Computer Science & Engineering",
    currentSemester: 6,
    academicYear: "2026-2027",
    companyName: "Google Cloud India",
    companyAddress: "RMZ Infinity, Old Madras Road, Bengaluru, Karnataka 560016",
    companyWebsite: "https://cloud.google.com",
    industrySupervisorName: "Vikram Malhotra (Lead Cloud Architect)",
    industrySupervisorEmail: "vmalhotra@google.com",
    industrySupervisorPhone: "+91 80 6721 8000",
    internshipRole: "Site Reliability & Cloud Infrastructure Intern",
    stipendInrPerMonth: 65000,
    startDate: "2026-06-01",
    endDate: "2026-08-10",
    durationWeeks: 10,
    mode: "HYBRID",
    facultyMentorName: "Dr. Arvind Swaminathan (Assoc. Prof, CSE)",
    nocStatus: "CREDITS_AWARDED",
    nocCertificateNumber: "APEX-NOC-2026-0142",
    nocIssuedAt: "2026-05-15T10:00:00Z",
    authorizedSignatory: "Prof. S. K. Bose (Dean, Corporate Relations & T&P)",
    logbookEntries: [
      {
        weekNumber: 1,
        startDate: "2026-06-01",
        endDate: "2026-06-07",
        tasksCompleted: "Onboarding, IAM security access setup, distributed Kubernetes cluster architecture review.",
        hoursWorked: 40,
        mentorFeedback: "Solid grasp of container fundamentals.",
        verifiedByMentor: true,
      },
      {
        weekNumber: 2,
        startDate: "2026-06-08",
        endDate: "2026-06-14",
        tasksCompleted: "Implemented automated canary deployment monitoring with Prometheus metric alerts.",
        hoursWorked: 42,
        mentorFeedback: "Accurate alerts telemetry implemented.",
        verifiedByMentor: true,
      },
    ],
    evaluation: {
      industryMentorScore: 48,
      facultyVivaScore: 47,
      totalScore: 95,
      grade: "O",
      academicCreditsAwarded: 4,
      evaluatedAt: "2026-08-14T15:30:00Z",
      evaluatorSignatory: "Dr. Arvind Swaminathan & Industry Committee",
    },
    completionSeal: "APEX-INTERN-SEAL-89B4C211A90E34",
    createdAt: "2026-05-10T09:00:00Z",
    updatedAt: "2026-08-14T15:30:00Z",
  },
  {
    id: "INT-2026-002",
    applicationNo: "APEX-INT-2026-1002",
    studentId: "STD-2025-002",
    rollNumber: "2025-EC-104",
    studentName: "Diya Nair",
    department: "Electronics & Communication",
    currentSemester: 6,
    academicYear: "2026-2027",
    companyName: "Qualcomm Wireless Solutions",
    companyAddress: "Bagmane World Technology Centre, KR Puram, Bengaluru",
    companyWebsite: "https://www.qualcomm.com",
    industrySupervisorName: "Pooja Hegde (Senior Staff Engineer, DSP)",
    industrySupervisorEmail: "phegde@qualcomm.com",
    industrySupervisorPhone: "+91 80 4321 9000",
    internshipRole: "5G NR Physical Layer Firmware Intern",
    stipendInrPerMonth: 55000,
    startDate: "2026-06-15",
    endDate: "2026-08-25",
    durationWeeks: 10,
    mode: "ON_SITE",
    facultyMentorName: "Dr. Sneha Roy (HOD, ECE)",
    nocStatus: "IN_PROGRESS",
    nocCertificateNumber: "APEX-NOC-2026-0158",
    nocIssuedAt: "2026-05-20T11:30:00Z",
    authorizedSignatory: "Prof. S. K. Bose (Dean, Corporate Relations & T&P)",
    logbookEntries: [
      {
        weekNumber: 1,
        startDate: "2026-06-15",
        endDate: "2026-06-21",
        tasksCompleted: "MATLAB 5G toolbox simulations for OFDM beamforming algorithms.",
        hoursWorked: 40,
        mentorFeedback: "Simulation models aligned with specs.",
        verifiedByMentor: true,
      },
    ],
    createdAt: "2026-05-18T14:00:00Z",
    updatedAt: "2026-06-22T09:00:00Z",
  },
  {
    id: "INT-2026-003",
    applicationNo: "APEX-INT-2026-1003",
    studentId: "STD-2025-003",
    rollNumber: "2025-ME-109",
    studentName: "Rohan Kulkarni",
    department: "Mechanical Engineering",
    currentSemester: 6,
    academicYear: "2026-2027",
    companyName: "Tata Motors Mobility Research",
    companyAddress: "Pimpri Industrial Area, Pune, Maharashtra 411018",
    companyWebsite: "https://www.tatamotors.com",
    industrySupervisorName: "Rajeshwar Deshmukh (Head, EV Powertrain)",
    industrySupervisorEmail: "rdeshmukh@tatamotors.com",
    industrySupervisorPhone: "+91 20 6613 2000",
    internshipRole: "Battery Thermal Management Systems Intern",
    stipendInrPerMonth: 40000,
    startDate: "2026-07-01",
    endDate: "2026-08-30",
    durationWeeks: 8,
    mode: "ON_SITE",
    facultyMentorName: "Prof. H. C. Verma (Chief Warden & Mechanical Faculty)",
    nocStatus: "NOC_ISSUED",
    nocCertificateNumber: "APEX-NOC-2026-0199",
    nocIssuedAt: "2026-06-05T14:15:00Z",
    authorizedSignatory: "Prof. S. K. Bose (Dean, Corporate Relations & T&P)",
    logbookEntries: [],
    createdAt: "2026-06-01T10:00:00Z",
    updatedAt: "2026-06-05T14:15:00Z",
  },
];

function ensureData(): InternshipApplication[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(INTERNSHIP_FILE)) {
      return JSON.parse(fs.readFileSync(INTERNSHIP_FILE, "utf-8"));
    }
    fs.writeFileSync(INTERNSHIP_FILE, JSON.stringify(SEED_INTERNSHIPS, null, 2), "utf-8");
    return SEED_INTERNSHIPS;
  } catch {
    return SEED_INTERNSHIPS;
  }
}

function persistData(data: InternshipApplication[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(INTERNSHIP_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist internships registry:", err);
  }
}

export function getAllInternships(filter?: {
  studentId?: string;
  department?: string;
  status?: string;
}): InternshipApplication[] {
  let list = ensureData();
  if (filter?.studentId) {
    list = list.filter((i) => i.studentId === filter.studentId || i.rollNumber === filter.studentId);
  }
  if (filter?.department && filter.department !== "ALL") {
    list = list.filter((i) => i.department === filter.department);
  }
  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((i) => i.nocStatus === filter.status);
  }
  return list;
}

export function applyForInternship(params: {
  studentId: string;
  rollNumber: string;
  studentName: string;
  department: string;
  currentSemester: number;
  academicYear?: string;
  companyName: string;
  companyAddress: string;
  companyWebsite: string;
  industrySupervisorName: string;
  industrySupervisorEmail: string;
  industrySupervisorPhone: string;
  internshipRole: string;
  stipendInrPerMonth: number;
  startDate: string;
  endDate: string;
  durationWeeks?: number;
  mode: "ON_SITE" | "HYBRID" | "REMOTE";
  facultyMentorName: string;
}): InternshipApplication {
  const list = ensureData();
  const serial = list.length + 1001;

  // Calculate duration in weeks if not provided
  let durationWeeks = params.durationWeeks;
  if (!durationWeeks) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    durationWeeks = Math.max(1, Math.round(diffDays / 7));
  }

  const newApp: InternshipApplication = {
    id: `INT-${Date.now().toString(36).toUpperCase()}`,
    applicationNo: `APEX-INT-${new Date().getFullYear()}-${serial}`,
    studentId: params.studentId,
    rollNumber: params.rollNumber,
    studentName: params.studentName,
    department: params.department,
    currentSemester: params.currentSemester,
    academicYear: params.academicYear || "2026-2027",
    companyName: params.companyName,
    companyAddress: params.companyAddress,
    companyWebsite: params.companyWebsite,
    industrySupervisorName: params.industrySupervisorName,
    industrySupervisorEmail: params.industrySupervisorEmail,
    industrySupervisorPhone: params.industrySupervisorPhone,
    internshipRole: params.internshipRole,
    stipendInrPerMonth: params.stipendInrPerMonth,
    startDate: params.startDate,
    endDate: params.endDate,
    durationWeeks,
    mode: params.mode,
    facultyMentorName: params.facultyMentorName,
    nocStatus: "APPLIED",
    logbookEntries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  list.unshift(newApp);
  persistData(list);
  return newApp;
}

export function issueUniversityNoc(params: {
  applicationId: string;
  authorizedSignatory?: string;
}): InternshipApplication {
  const list = ensureData();
  const target = list.find((i) => i.id === params.applicationId || i.applicationNo === params.applicationId);
  if (!target) throw new Error(`Internship application ${params.applicationId} not found`);

  const hexNo = crypto.randomBytes(3).toString("hex").toUpperCase();
  target.nocStatus = "NOC_ISSUED";
  target.nocCertificateNumber = `APEX-NOC-${new Date().getFullYear()}-${hexNo}`;
  target.nocIssuedAt = new Date().toISOString();
  target.authorizedSignatory =
    params.authorizedSignatory || "Prof. S. K. Bose (Dean, Corporate Relations & T&P)";
  target.updatedAt = new Date().toISOString();

  persistData(list);
  return target;
}

export function submitWeeklyLogbook(params: {
  applicationId: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  tasksCompleted: string;
  hoursWorked: number;
}): InternshipApplication {
  const list = ensureData();
  const target = list.find((i) => i.id === params.applicationId || i.applicationNo === params.applicationId);
  if (!target) throw new Error(`Internship application ${params.applicationId} not found`);

  const existingEntryIndex = target.logbookEntries.findIndex((e) => e.weekNumber === params.weekNumber);
  const entry: LogbookEntry = {
    weekNumber: params.weekNumber,
    startDate: params.startDate,
    endDate: params.endDate,
    tasksCompleted: params.tasksCompleted,
    hoursWorked: params.hoursWorked,
    verifiedByMentor: false,
  };

  if (existingEntryIndex >= 0) {
    target.logbookEntries[existingEntryIndex] = entry;
  } else {
    target.logbookEntries.push(entry);
    target.logbookEntries.sort((a, b) => a.weekNumber - b.weekNumber);
  }

  target.nocStatus = "IN_PROGRESS";
  target.updatedAt = new Date().toISOString();
  persistData(list);
  return target;
}

export function verifyWeeklyLogbook(params: {
  applicationId: string;
  weekNumber: number;
  mentorFeedback: string;
}): InternshipApplication {
  const list = ensureData();
  const target = list.find((i) => i.id === params.applicationId || i.applicationNo === params.applicationId);
  if (!target) throw new Error(`Internship application ${params.applicationId} not found`);

  const entry = target.logbookEntries.find((e) => e.weekNumber === params.weekNumber);
  if (!entry) throw new Error(`Logbook entry for week ${params.weekNumber} not found`);

  entry.mentorFeedback = params.mentorFeedback;
  entry.verifiedByMentor = true;
  target.updatedAt = new Date().toISOString();

  persistData(list);
  return target;
}

export function finalizeInternshipEvaluation(params: {
  applicationId: string;
  industryMentorScore: number;
  facultyVivaScore: number;
  academicCreditsAwarded?: number;
  evaluatorSignatory?: string;
}): InternshipApplication {
  const list = ensureData();
  const target = list.find((i) => i.id === params.applicationId || i.applicationNo === params.applicationId);
  if (!target) throw new Error(`Internship application ${params.applicationId} not found`);

  const total = params.industryMentorScore + params.facultyVivaScore;
  let grade = "F";
  if (total >= 90) grade = "O";
  else if (total >= 80) grade = "A+";
  else if (total >= 70) grade = "A";
  else if (total >= 60) grade = "B+";
  else if (total >= 50) grade = "B";

  const seal = crypto
    .createHash("sha256")
    .update(`${target.id}|${target.applicationNo}|${total}|${new Date().toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  target.evaluation = {
    industryMentorScore: params.industryMentorScore,
    facultyVivaScore: params.facultyVivaScore,
    totalScore: total,
    grade,
    academicCreditsAwarded: params.academicCreditsAwarded || 4,
    evaluatedAt: new Date().toISOString(),
    evaluatorSignatory: params.evaluatorSignatory || "Academic Internship Viva Examination Board",
  };

  target.nocStatus = "CREDITS_AWARDED";
  target.completionSeal = `APEX-INTERN-SEAL-${seal}`;
  target.updatedAt = new Date().toISOString();

  persistData(list);
  return target;
}

export function getInternshipAnalytics(): InternshipAnalytics {
  const list = ensureData();
  const total = list.length;
  const nocIssued = list.filter((i) => i.nocStatus !== "APPLIED" && i.nocStatus !== "REJECTED").length;
  const inProgress = list.filter((i) => i.nocStatus === "IN_PROGRESS").length;
  const completed = list.filter((i) => i.nocStatus === "CREDITS_AWARDED").length;

  const totalStipend = list.reduce(
    (sum, i) => sum + (i.stipendInrPerMonth * Math.round(i.durationWeeks / 4)),
    0
  );
  const totalWeeks = list.reduce((sum, i) => sum + i.durationWeeks, 0);
  const avgWeeks = total > 0 ? Number((totalWeeks / total).toFixed(1)) : 0;
  const companies = new Set(list.map((i) => i.companyName)).size;

  return {
    totalApplications: total,
    nocIssuedCount: nocIssued,
    activeInProgress: inProgress,
    completedWithCredits: completed,
    totalStipendMobilizedInr: totalStipend,
    averageDurationWeeks: avgWeeks,
    industryPartnersCount: companies,
  };
}
