import fs from "fs";
import path from "path";
import crypto from "crypto";

export type IncidentCategory =
  | "RAGGING_ZERO_TOLERANCE"
  | "ACADEMIC_DISHONESTY"
  | "HOSTEL_PROPERTY_DAMAGE"
  | "SUBSTANCE_ABUSE"
  | "CYBER_HARASSMENT"
  | "CAMPUS_MISCONDUCT";

export type IncidentStatus =
  | "REPORTED"
  | "SHOW_CAUSE_ISSUED"
  | "EXPLANATION_RECEIVED"
  | "HEARING_SCHEDULED"
  | "ORDER_EXECUTED"
  | "EXONERATED";

export type DisciplinaryVerdict =
  | "FORMAL_REPRIMAND"
  | "DISCIPLINARY_FINE"
  | "COMMUNITY_SERVICE"
  | "HOSTEL_SUSPENSION"
  | "SEMESTER_RUSTICATION"
  | "EXONERATED";

export interface AntiRaggingAffidavit {
  id: string;
  affidavitId: string;
  studentId: string;
  rollNumber: string;
  studentName: string;
  academicYear: string;
  parentGuardianName: string;
  parentPhone: string;
  undertakingSignedDate: string;
  antiRaggingReferenceNumber: string;
  complianceStatus: "AFFIDAVIT_VERIFIED" | "PENDING_SUBMISSION";
  signedOathHash: string;
}

export interface DisciplinaryIncident {
  id: string;
  incidentNumber: string;
  category: IncidentCategory;
  reportedBy: string;
  respondentStudentId: string;
  respondentRollNumber: string;
  respondentName: string;
  incidentDate: string;
  location: string;
  description: string;
  evidenceFiles: string[];
  severity: "LOW" | "MEDIUM" | "SEVERE";
  status: IncidentStatus;
  showCauseNotice?: {
    noticeNumber: string;
    issuedAt: string;
    replyDeadlineHours: number;
    chargeSheet: string;
  };
  studentDefense?: {
    submittedAt: string;
    explanationText: string;
    witnessStatement?: string;
  };
  hearingDetails?: {
    hearingDate: string;
    venue: string;
    committeeMembers: string[];
  };
  disciplinaryOrder?: {
    orderNumber: string;
    verdict: DisciplinaryVerdict;
    penaltyFineInr?: number;
    suspensionDays?: number;
    communityServiceHours?: number;
    orderSeal: string;
    chiefProctorSignatory: string;
    issuedAt: string;
  };
}

export interface ProctorialAnalytics {
  totalAffidavitsSigned: number;
  antiRaggingComplianceRate: number;
  totalIncidentsReported: number;
  activeShowCauseNotices: number;
  ordersExecuted: number;
  exoneratedCases: number;
  totalFinesLeviedInr: number;
}

const DATA_DIR = path.join(process.cwd(), "data", "compliance");
const AFFIDAVIT_FILE = path.join(DATA_DIR, "anti_ragging_affidavits.json");
const INCIDENTS_FILE = path.join(DATA_DIR, "disciplinary_incidents.json");

const SEED_AFFIDAVITS: AntiRaggingAffidavit[] = [
  {
    id: "RAG-001",
    affidavitId: "APEX-RAG-AFF-2026-CSE001",
    studentId: "STU-2026-001",
    rollNumber: "2026-CSE-001",
    studentName: "Alex Rivera",
    academicYear: "2026-2027",
    parentGuardianName: "Elena Rivera",
    parentPhone: "+91 98110 23456",
    undertakingSignedDate: "2026-08-01T09:00:00.000Z",
    antiRaggingReferenceNumber: "UGC-RAG-2026-89102",
    complianceStatus: "AFFIDAVIT_VERIFIED",
    signedOathHash: "APEX-OATH-SEAL-9B1C283F0198DA22",
  },
  {
    id: "RAG-002",
    affidavitId: "APEX-RAG-AFF-2026-CSE002",
    studentId: "STU-2026-002",
    rollNumber: "2026-CSE-002",
    studentName: "Priya Sharma",
    academicYear: "2026-2027",
    parentGuardianName: "Sunil Sharma",
    parentPhone: "+91 98220 34567",
    undertakingSignedDate: "2026-08-02T10:30:00.000Z",
    antiRaggingReferenceNumber: "UGC-RAG-2026-89103",
    complianceStatus: "AFFIDAVIT_VERIFIED",
    signedOathHash: "APEX-OATH-SEAL-88C1B74390F21AA4",
  },
  {
    id: "RAG-003",
    affidavitId: "APEX-RAG-AFF-2026-ECE015",
    studentId: "STU-2026-003",
    rollNumber: "2026-ECE-015",
    studentName: "Devansh Nambiar",
    academicYear: "2026-2027",
    parentGuardianName: "Ramesh Nambiar",
    parentPhone: "+91 98440 45678",
    undertakingSignedDate: "2026-08-03T11:15:00.000Z",
    antiRaggingReferenceNumber: "UGC-RAG-2026-89104",
    complianceStatus: "AFFIDAVIT_VERIFIED",
    signedOathHash: "APEX-OATH-SEAL-77D9A01358F421CB",
  },
];

const SEED_INCIDENTS: DisciplinaryIncident[] = [
  {
    id: "INC-2026-001",
    incidentNumber: "DISC-2026-8001",
    category: "HOSTEL_PROPERTY_DAMAGE",
    reportedBy: "Chief Warden Dr. H. C. Verma",
    respondentStudentId: "STU-2026-003",
    respondentRollNumber: "2026-ECE-015",
    respondentName: "Devansh Nambiar",
    incidentDate: "2026-03-10T22:30:00.000Z",
    location: "Aryabhata Hostel Block B Common Room",
    description: "Vandalism of common room smart television and table tennis equipment after curfew hours.",
    evidenceFiles: ["cctv_footage_blockB_2230.mp4", "damage_photo_01.jpg"],
    severity: "MEDIUM",
    status: "ORDER_EXECUTED",
    showCauseNotice: {
      noticeNumber: "APEX-SCN-2026-019",
      issuedAt: "2026-03-11T10:00:00.000Z",
      replyDeadlineHours: 72,
      chargeSheet: "Violation of Hostel Rule 14 (Property Preservation) and Rule 8 (Night Curfew Adherence).",
    },
    studentDefense: {
      submittedAt: "2026-03-12T14:00:00.000Z",
      explanationText: "Admitted accidental damage while playing table tennis; offered to pay full repair compensation.",
      witnessStatement: "Roommate Samar Khan confirmed it was accidental during recreational game.",
    },
    disciplinaryOrder: {
      orderNumber: "APEX-PROCTOR-ORDER-812C",
      verdict: "DISCIPLINARY_FINE",
      penaltyFineInr: 4500,
      orderSeal: "APEX-PROCTOR-SEAL-891FA0029B81C432",
      chiefProctorSignatory: "Prof. M. S. Ranganathan (Chief Proctor)",
      issuedAt: "2026-03-14T16:00:00.000Z",
    },
  },
  {
    id: "INC-2026-002",
    incidentNumber: "DISC-2026-8002",
    category: "ACADEMIC_DISHONESTY",
    reportedBy: "Dr. Arvind Swaminathan (Invigilator)",
    respondentStudentId: "STU-2026-004",
    respondentRollNumber: "2026-ME-042",
    respondentName: "Rohan Kulkarni",
    incidentDate: "2026-03-18T11:15:00.000Z",
    location: "Examination Hall 3, Desk 42",
    description: "Possession of unauthorized electronic smartwatch displaying solved formula sheet during CS-402 examination.",
    evidenceFiles: ["confiscated_watch_log.pdf", "invigilator_report_desk42.pdf"],
    severity: "SEVERE",
    status: "SHOW_CAUSE_ISSUED",
    showCauseNotice: {
      noticeNumber: "APEX-SCN-2026-022",
      issuedAt: "2026-03-19T09:00:00.000Z",
      replyDeadlineHours: 72,
      chargeSheet: "Violation of Examination Regulation Clause 9.2 (Unfair Means & Unauthorized Digital Devices in Examination Centre).",
    },
  },
  {
    id: "INC-2026-003",
    incidentNumber: "DISC-2026-8003",
    category: "RAGGING_ZERO_TOLERANCE",
    reportedBy: "Anti-Ragging Squad Leader Prof. P. K. Saxena",
    respondentStudentId: "STU-2026-005",
    respondentRollNumber: "2026-CS-088",
    respondentName: "Kunal Mehra",
    incidentDate: "2026-03-25T20:00:00.000Z",
    location: "Senior Residence Wing C Courtyard",
    description: "Intimidation and unauthorized physical drill demands imposed upon junior freshers in dining hall queue.",
    evidenceFiles: ["anti_ragging_squad_report_25mar.pdf"],
    severity: "SEVERE",
    status: "EXONERATED",
    showCauseNotice: {
      noticeNumber: "APEX-SCN-2026-025",
      issuedAt: "2026-03-26T08:00:00.000Z",
      replyDeadlineHours: 72,
      chargeSheet: "Violation of Supreme Court Guidelines on Prevention of Ragging in Technical Institutions.",
    },
    studentDefense: {
      submittedAt: "2026-03-26T14:30:00.000Z",
      explanationText: "Respondent was assisting event stage volunteers and was not present in Wing C courtyard at the alleged time.",
      witnessStatement: "Faculty event coordinator confirmed respondent presence at auditorium rehearsal.",
    },
    disciplinaryOrder: {
      orderNumber: "APEX-PROCTOR-ORDER-813E",
      verdict: "EXONERATED",
      orderSeal: "APEX-PROCTOR-SEAL-CLEAR-009A",
      chiefProctorSignatory: "Prof. M. S. Ranganathan (Chief Proctor)",
      issuedAt: "2026-03-28T11:00:00.000Z",
    },
  },
];

function ensureFiles(): { affidavits: AntiRaggingAffidavit[]; incidents: DisciplinaryIncident[] } {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    let affidavits = SEED_AFFIDAVITS;
    if (fs.existsSync(AFFIDAVIT_FILE)) {
      affidavits = JSON.parse(fs.readFileSync(AFFIDAVIT_FILE, "utf-8"));
    } else {
      fs.writeFileSync(AFFIDAVIT_FILE, JSON.stringify(SEED_AFFIDAVITS, null, 2), "utf-8");
    }

    let incidents = SEED_INCIDENTS;
    if (fs.existsSync(INCIDENTS_FILE)) {
      incidents = JSON.parse(fs.readFileSync(INCIDENTS_FILE, "utf-8"));
    } else {
      fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(SEED_INCIDENTS, null, 2), "utf-8");
    }

    return { affidavits, incidents };
  } catch (err) {
    console.warn("Using in-memory proctorial seed defaults:", err);
    return { affidavits: SEED_AFFIDAVITS, incidents: SEED_INCIDENTS };
  }
}

function persistAffidavits(data: AntiRaggingAffidavit[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(AFFIDAVIT_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist affidavits:", err);
  }
}

function persistIncidents(data: DisciplinaryIncident[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist incidents:", err);
  }
}

export function getAllAffidavits(studentId?: string): AntiRaggingAffidavit[] {
  const { affidavits } = ensureFiles();
  if (studentId) {
    return affidavits.filter((a) => a.studentId === studentId || a.rollNumber === studentId);
  }
  return affidavits;
}

export function submitAntiRaggingAffidavit(params: {
  studentId: string;
  rollNumber: string;
  studentName: string;
  academicYear?: string;
  parentGuardianName: string;
  parentPhone: string;
}): AntiRaggingAffidavit {
  const { affidavits } = ensureFiles();
  const serial = affidavits.length + 101;
  const hash = crypto
    .createHash("sha256")
    .update(`${params.studentId}|${params.rollNumber}|${params.parentPhone}|${new Date().toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  const newAffidavit: AntiRaggingAffidavit = {
    id: `RAG-${Date.now().toString(36).toUpperCase()}`,
    affidavitId: `APEX-RAG-AFF-${new Date().getFullYear()}-${params.rollNumber.replace(/[^a-zA-Z0-9]/g, "")}`,
    studentId: params.studentId,
    rollNumber: params.rollNumber,
    studentName: params.studentName,
    academicYear: params.academicYear || "2026-2027",
    parentGuardianName: params.parentGuardianName,
    parentPhone: params.parentPhone,
    undertakingSignedDate: new Date().toISOString(),
    antiRaggingReferenceNumber: `UGC-RAG-${new Date().getFullYear()}-${serial}`,
    complianceStatus: "AFFIDAVIT_VERIFIED",
    signedOathHash: `APEX-OATH-SEAL-${hash}`,
  };

  affidavits.unshift(newAffidavit);
  persistAffidavits(affidavits);
  return newAffidavit;
}

export function getAllDisciplinaryIncidents(filter?: {
  respondentId?: string;
  category?: string;
  status?: string;
}): DisciplinaryIncident[] {
  const { incidents } = ensureFiles();
  let list = incidents;
  if (filter?.respondentId) {
    list = list.filter((i) => i.respondentStudentId === filter.respondentId || i.respondentRollNumber === filter.respondentId);
  }
  if (filter?.category) {
    list = list.filter((i) => i.category === filter.category);
  }
  if (filter?.status) {
    list = list.filter((i) => i.status === filter.status);
  }
  return list;
}

export function reportDisciplinaryIncident(params: {
  category: IncidentCategory;
  reportedBy: string;
  respondentStudentId: string;
  respondentRollNumber: string;
  respondentName: string;
  incidentDate: string;
  location: string;
  description: string;
  evidenceFiles?: string[];
  severity: "LOW" | "MEDIUM" | "SEVERE";
}): DisciplinaryIncident {
  const { incidents } = ensureFiles();
  const serial = incidents.length + 8001;

  const newIncident: DisciplinaryIncident = {
    id: `INC-${Date.now().toString(36).toUpperCase()}`,
    incidentNumber: `DISC-${new Date().getFullYear()}-${serial}`,
    category: params.category,
    reportedBy: params.reportedBy,
    respondentStudentId: params.respondentStudentId,
    respondentRollNumber: params.respondentRollNumber,
    respondentName: params.respondentName,
    incidentDate: params.incidentDate,
    location: params.location,
    description: params.description,
    evidenceFiles: params.evidenceFiles || [],
    severity: params.severity,
    status: "REPORTED",
  };

  incidents.unshift(newIncident);
  persistIncidents(incidents);
  return newIncident;
}

export function issueShowCauseNotice(params: {
  incidentId: string;
  chargeSheet: string;
  replyDeadlineHours?: number;
}): DisciplinaryIncident {
  const { incidents } = ensureFiles();
  const target = incidents.find((i) => i.id === params.incidentId || i.incidentNumber === params.incidentId);
  if (!target) throw new Error(`Incident ${params.incidentId} not found`);

  const hexNotice = crypto.randomBytes(3).toString("hex").toUpperCase();
  target.showCauseNotice = {
    noticeNumber: `APEX-SCN-${new Date().getFullYear()}-${hexNotice}`,
    issuedAt: new Date().toISOString(),
    replyDeadlineHours: params.replyDeadlineHours || 72,
    chargeSheet: params.chargeSheet,
  };
  target.status = "SHOW_CAUSE_ISSUED";

  persistIncidents(incidents);
  return target;
}

export function submitStudentDefense(params: {
  incidentId: string;
  explanationText: string;
  witnessStatement?: string;
}): DisciplinaryIncident {
  const { incidents } = ensureFiles();
  const target = incidents.find((i) => i.id === params.incidentId || i.incidentNumber === params.incidentId);
  if (!target) throw new Error(`Incident ${params.incidentId} not found`);

  target.studentDefense = {
    submittedAt: new Date().toISOString(),
    explanationText: params.explanationText,
    witnessStatement: params.witnessStatement,
  };
  target.status = "EXPLANATION_RECEIVED";

  persistIncidents(incidents);
  return target;
}

export function pronounceDisciplinaryOrder(params: {
  incidentId: string;
  verdict: DisciplinaryVerdict;
  penaltyFineInr?: number;
  suspensionDays?: number;
  communityServiceHours?: number;
  chiefProctorSignatory?: string;
}): DisciplinaryIncident {
  const { incidents } = ensureFiles();
  const target = incidents.find((i) => i.id === params.incidentId || i.incidentNumber === params.incidentId);
  if (!target) throw new Error(`Incident ${params.incidentId} not found`);

  const orderHex = crypto.randomBytes(4).toString("hex").toUpperCase();
  const sealHash = crypto
    .createHash("sha256")
    .update(`${target.id}|${params.verdict}|${params.penaltyFineInr || 0}|${new Date().toISOString()}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  target.disciplinaryOrder = {
    orderNumber: `APEX-PROCTOR-ORDER-${orderHex}`,
    verdict: params.verdict,
    penaltyFineInr: params.penaltyFineInr,
    suspensionDays: params.suspensionDays,
    communityServiceHours: params.communityServiceHours,
    orderSeal: `APEX-PROCTOR-SEAL-${sealHash}`,
    chiefProctorSignatory: params.chiefProctorSignatory || "Prof. M. S. Ranganathan (Chief Proctor)",
    issuedAt: new Date().toISOString(),
  };

  target.status = params.verdict === "EXONERATED" ? "EXONERATED" : "ORDER_EXECUTED";
  persistIncidents(incidents);
  return target;
}

export function getProctorialAnalytics(): ProctorialAnalytics {
  const { affidavits, incidents } = ensureFiles();
  const totalIncidents = incidents.length;
  const activeScn = incidents.filter((i) => i.status === "SHOW_CAUSE_ISSUED").length;
  const ordersExecuted = incidents.filter((i) => i.status === "ORDER_EXECUTED").length;
  const exonerated = incidents.filter((i) => i.status === "EXONERATED").length;
  const totalFines = incidents
    .filter((i) => i.disciplinaryOrder?.penaltyFineInr)
    .reduce((acc, i) => acc + (i.disciplinaryOrder?.penaltyFineInr || 0), 0);

  return {
    totalAffidavitsSigned: affidavits.length,
    antiRaggingComplianceRate: affidavits.length > 0 ? 100 : 0,
    totalIncidentsReported: totalIncidents,
    activeShowCauseNotices: activeScn,
    ordersExecuted,
    exoneratedCases: exonerated,
    totalFinesLeviedInr: totalFines,
  };
}
