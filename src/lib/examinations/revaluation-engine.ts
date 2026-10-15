import fs from "fs";
import path from "path";
import crypto from "crypto";

export type RevaluationType = "CERTIFIED_PHOTOCOPY" | "RETOTALING" | "DOUBLE_BLIND_REVALUATION";
export type RevaluationStatus = "SUBMITTED" | "SCRUTINY_PENDING" | "EVALUATOR_ASSIGNED" | "EVALUATED" | "REFEREE_REVIEW" | "COMPLETED" | "REJECTED";

export interface RevaluationApplication {
  id: string;
  applicationNumber: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  examId: string;
  originalMarks: number;
  originalGrade: string;
  type: RevaluationType;
  feeAmount: number;
  paymentStatus: "PAID" | "REFUNDED" | "PENDING";
  appliedAt: string;
  status: RevaluationStatus;
  dummyNumber: string; // Blind mask for double-blind scrutiny
  assignedExaminer?: string;
  revisedMarks?: number;
  revisedGrade?: string;
  marksDelta?: number;
  percentageChange?: number;
  refereeRequired?: boolean;
  refereeExaminer?: string;
  refereeMarks?: number;
  feeRefundEligible?: boolean;
  completionSeal?: string;
  remarks?: string;
}

export interface RevaluationAnalytics {
  totalApplications: number;
  photocopyCount: number;
  retotalingCount: number;
  revaluationCount: number;
  completedCount: number;
  gradeImprovedCount: number;
  refereeCasesCount: number;
  totalFeesCollectedInr: number;
  totalFeesRefundedInr: number;
  averageMarksDelta: number;
}

const DATA_DIR = path.join(process.cwd(), "data", "examinations");
const DATA_FILE = path.join(DATA_DIR, "revaluation_registry.json");

const SEED_APPLICATIONS: RevaluationApplication[] = [
  {
    id: "REV-APP-001",
    applicationNumber: "REV-2026-1001",
    studentId: "STU-2026-001",
    rollNumber: "2026-CSE-001",
    studentName: "Alex Rivera",
    courseCode: "CS-402",
    courseTitle: "Advanced Neural Networks",
    examId: "EXAM-2026-MID",
    originalMarks: 68,
    originalGrade: "B",
    type: "DOUBLE_BLIND_REVALUATION",
    feeAmount: 1000,
    paymentStatus: "PAID",
    appliedAt: "2026-03-20T10:30:00.000Z",
    status: "COMPLETED",
    dummyNumber: "BLIND-9081",
    assignedExaminer: "Dr. K. R. Meenakshi (External Examiner)",
    revisedMarks: 78,
    revisedGrade: "A",
    marksDelta: 10,
    percentageChange: 14.7,
    refereeRequired: false,
    feeRefundEligible: true, // Delta >= 10%
    completionSeal: "APEX-REVAL-SEAL-8A7F912C0B4D3E6A",
    remarks: "Question 4 derivation was uncredited in original script; full credit restored.",
  },
  {
    id: "REV-APP-002",
    applicationNumber: "REV-2026-1002",
    studentId: "STU-2026-002",
    rollNumber: "2026-CSE-002",
    studentName: "Priya Sharma",
    courseCode: "CS-401",
    courseTitle: "Distributed Systems Architecture",
    examId: "EXAM-2026-MID",
    originalMarks: 72,
    originalGrade: "B+",
    type: "CERTIFIED_PHOTOCOPY",
    feeAmount: 300,
    paymentStatus: "PAID",
    appliedAt: "2026-03-21T14:15:00.000Z",
    status: "COMPLETED",
    dummyNumber: "BLIND-9082",
    completionSeal: "APEX-COPY-SEAL-F4A198B27C309DE1",
    remarks: "Certified watermarked PDF copy generated and delivered to student repository.",
  },
  {
    id: "REV-APP-003",
    applicationNumber: "REV-2026-1003",
    studentId: "STU-2026-003",
    rollNumber: "2026-ECE-015",
    studentName: "Devansh Nambiar",
    courseCode: "EC-304",
    courseTitle: "VLSI Circuit Design",
    examId: "EXAM-2026-MID",
    originalMarks: 45,
    originalGrade: "C",
    type: "DOUBLE_BLIND_REVALUATION",
    feeAmount: 1000,
    paymentStatus: "PAID",
    appliedAt: "2026-03-22T09:00:00.000Z",
    status: "EVALUATOR_ASSIGNED",
    dummyNumber: "BLIND-9083",
    assignedExaminer: "Prof. S. K. Bhattacharya (IIT Roorkee)",
    remarks: "Physical script dispatched under blind code BLIND-9083.",
  },
  {
    id: "REV-APP-004",
    applicationNumber: "REV-2026-1004",
    studentId: "STU-2026-004",
    rollNumber: "2026-ME-042",
    studentName: "Rohan Kulkarni",
    courseCode: "ME-201",
    courseTitle: "Thermodynamics & Heat Transfer",
    examId: "EXAM-2026-MID",
    originalMarks: 58,
    originalGrade: "B",
    type: "RETOTALING",
    feeAmount: 200,
    paymentStatus: "PAID",
    appliedAt: "2026-03-23T11:45:00.000Z",
    status: "COMPLETED",
    dummyNumber: "BLIND-9084",
    revisedMarks: 60,
    revisedGrade: "B",
    marksDelta: 2,
    percentageChange: 3.4,
    feeRefundEligible: false,
    completionSeal: "APEX-REVAL-SEAL-3B98CF2018A49E01",
    remarks: "Page 7 sub-question total addition error rectified (+2 marks).",
  },
];

function ensureDataFile(): RevaluationApplication[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_APPLICATIONS, null, 2), "utf-8");
      return SEED_APPLICATIONS;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to load revaluation data, using in-memory defaults:", err);
    return SEED_APPLICATIONS;
  }
}

function persistData(records: RevaluationApplication[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist revaluation registry:", err);
  }
}

export function getAllRevaluationApplications(filter?: {
  studentId?: string;
  courseCode?: string;
  status?: string;
  type?: string;
}): RevaluationApplication[] {
  let records = ensureDataFile();
  if (filter?.studentId) {
    records = records.filter((r) => r.studentId === filter.studentId || r.rollNumber === filter.studentId);
  }
  if (filter?.courseCode) {
    records = records.filter((r) => r.courseCode.toLowerCase() === filter.courseCode!.toLowerCase());
  }
  if (filter?.status) {
    records = records.filter((r) => r.status === filter.status);
  }
  if (filter?.type) {
    records = records.filter((r) => r.type === filter.type);
  }
  return records;
}

export function submitRevaluationApplication(params: {
  studentId: string;
  rollNumber: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  examId: string;
  originalMarks: number;
  originalGrade: string;
  type: RevaluationType;
  remarks?: string;
}): RevaluationApplication {
  const records = ensureDataFile();
  const serial = records.length + 1001;
  const applicationNumber = `REV-${new Date().getFullYear()}-${serial}`;
  const dummyNumber = `BLIND-${Math.floor(1000 + Math.random() * 9000)}`;

  let feeAmount = 1000;
  if (params.type === "CERTIFIED_PHOTOCOPY") feeAmount = 300;
  if (params.type === "RETOTALING") feeAmount = 200;

  const newApp: RevaluationApplication = {
    id: `REV-APP-${Date.now().toString(36).toUpperCase()}`,
    applicationNumber,
    studentId: params.studentId,
    rollNumber: params.rollNumber,
    studentName: params.studentName,
    courseCode: params.courseCode,
    courseTitle: params.courseTitle,
    examId: params.examId,
    originalMarks: params.originalMarks,
    originalGrade: params.originalGrade,
    type: params.type,
    feeAmount,
    paymentStatus: "PAID",
    appliedAt: new Date().toISOString(),
    status: params.type === "CERTIFIED_PHOTOCOPY" ? "COMPLETED" : "SCRUTINY_PENDING",
    dummyNumber,
    remarks: params.remarks || `Student initiated ${params.type.replace(/_/g, " ")} request.`,
  };

  if (params.type === "CERTIFIED_PHOTOCOPY") {
    newApp.completionSeal = `APEX-COPY-SEAL-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
  }

  records.unshift(newApp);
  persistData(records);
  return newApp;
}

export function assignBlindExaminer(applicationId: string, examinerName: string): RevaluationApplication {
  const records = ensureDataFile();
  const target = records.find((r) => r.id === applicationId || r.applicationNumber === applicationId);
  if (!target) throw new Error(`Application ${applicationId} not found in revaluation registry`);

  target.assignedExaminer = examinerName;
  target.status = "EVALUATOR_ASSIGNED";
  persistData(records);
  return target;
}

export function submitEvaluatorScore(params: {
  applicationId: string;
  revisedMarks: number;
  examinerNotes?: string;
}): RevaluationApplication {
  const records = ensureDataFile();
  const target = records.find((r) => r.id === params.applicationId || r.applicationNumber === params.applicationId);
  if (!target) throw new Error(`Application ${params.applicationId} not found in revaluation registry`);

  const delta = params.revisedMarks - target.originalMarks;
  const pctChange = Number(((delta / (target.originalMarks || 1)) * 100).toFixed(1));

  target.revisedMarks = params.revisedMarks;
  target.marksDelta = delta;
  target.percentageChange = pctChange;

  // Grade classification helper
  const computeGrade = (marks: number): string => {
    if (marks >= 90) return "A+";
    if (marks >= 80) return "A";
    if (marks >= 70) return "B+";
    if (marks >= 60) return "B";
    if (marks >= 50) return "C";
    if (marks >= 40) return "D";
    return "F";
  };
  target.revisedGrade = computeGrade(params.revisedMarks);

  // If score differs by >= 15% (absolute), statutory referee evaluation is mandated
  if (Math.abs(pctChange) >= 15 && target.type === "DOUBLE_BLIND_REVALUATION") {
    target.refereeRequired = true;
    target.status = "REFEREE_REVIEW";
    target.remarks = `${params.examinerNotes || ""} [Score disparity of ${pctChange}% triggers referee referral].`;
  } else {
    target.refereeRequired = false;
    target.status = "COMPLETED";
    target.feeRefundEligible = pctChange >= 10;
    if (target.feeRefundEligible) {
      target.paymentStatus = "REFUNDED";
    }
    const hash = crypto
      .createHash("sha256")
      .update(`${target.id}|${target.applicationNumber}|${params.revisedMarks}|${new Date().toISOString()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    target.completionSeal = `APEX-REVAL-SEAL-${hash}`;
    if (params.examinerNotes) {
      target.remarks = params.examinerNotes;
    }
  }

  persistData(records);
  return target;
}

export function resolveRefereeEvaluation(params: {
  applicationId: string;
  refereeMarks: number;
  refereeExaminer: string;
  refereeNotes?: string;
}): RevaluationApplication {
  const records = ensureDataFile();
  const target = records.find((r) => r.id === params.applicationId || r.applicationNumber === params.applicationId);
  if (!target) throw new Error(`Application ${params.applicationId} not found`);

  target.refereeExaminer = params.refereeExaminer;
  target.refereeMarks = params.refereeMarks;
  target.revisedMarks = params.refereeMarks;

  const delta = params.refereeMarks - target.originalMarks;
  const pctChange = Number(((delta / (target.originalMarks || 1)) * 100).toFixed(1));
  target.marksDelta = delta;
  target.percentageChange = pctChange;

  const computeGrade = (marks: number): string => {
    if (marks >= 90) return "A+";
    if (marks >= 80) return "A";
    if (marks >= 70) return "B+";
    if (marks >= 60) return "B";
    if (marks >= 50) return "C";
    if (marks >= 40) return "D";
    return "F";
  };
  target.revisedGrade = computeGrade(params.refereeMarks);
  target.status = "COMPLETED";
  target.feeRefundEligible = pctChange >= 10;
  if (target.feeRefundEligible) {
    target.paymentStatus = "REFUNDED";
  }

  const hash = crypto
    .createHash("sha256")
    .update(`${target.id}|${params.refereeMarks}|REFEREE|${new Date().toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  target.completionSeal = `APEX-REVAL-SEAL-${hash}`;
  target.remarks = `Referee resolution by ${params.refereeExaminer}: ${params.refereeNotes || "Final adjudicated marks awarded."}`;

  persistData(records);
  return target;
}

export function getRevaluationAnalytics(): RevaluationAnalytics {
  const records = ensureDataFile();
  const photocopyCount = records.filter((r) => r.type === "CERTIFIED_PHOTOCOPY").length;
  const retotalingCount = records.filter((r) => r.type === "RETOTALING").length;
  const revaluationCount = records.filter((r) => r.type === "DOUBLE_BLIND_REVALUATION").length;
  const completed = records.filter((r) => r.status === "COMPLETED");
  const gradeImprovedCount = completed.filter((r) => (r.marksDelta || 0) > 0).length;
  const refereeCasesCount = records.filter((r) => r.refereeRequired || r.refereeMarks !== undefined).length;

  const totalFeesCollected = records.reduce((acc, r) => acc + r.feeAmount, 0);
  const totalFeesRefunded = records.filter((r) => r.paymentStatus === "REFUNDED").reduce((acc, r) => acc + r.feeAmount, 0);

  const deltas = completed.filter((r) => r.marksDelta !== undefined).map((r) => r.marksDelta!);
  const averageMarksDelta = deltas.length > 0 ? Number((deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1)) : 0;

  return {
    totalApplications: records.length,
    photocopyCount,
    retotalingCount,
    revaluationCount,
    completedCount: completed.length,
    gradeImprovedCount,
    refereeCasesCount,
    totalFeesCollectedInr: totalFeesCollected,
    totalFeesRefundedInr: totalFeesRefunded,
    averageMarksDelta,
  };
}
