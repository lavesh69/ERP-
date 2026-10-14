import fs from "fs";
import path from "path";
import crypto from "crypto";

export type RiskTier = "EXEMPT" | "EXPEDITED" | "FULL_BOARD_REVIEW";

export type StudyType =
  | "HUMAN_SUBJECTS"
  | "ANIMAL_RESEARCH"
  | "GENOMICS_BIOSAFETY"
  | "BEHAVIORAL_SURVEY"
  | "AI_CLINICAL_TRIAL";

export type ProtocolStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REVISIONS_REQUESTED"
  | "REJECTED";

export interface BoardMemberVote {
  memberName: string;
  role: "CHAIRPERSON" | "CLINICAL_ETHICIST" | "LEGAL_EXPERT" | "COMMUNITY_REPRESENTATIVE";
  decision: "APPROVE" | "REVISE" | "REJECT";
  remarks: string;
  votedAt: string;
}

export interface EthicsProtocol {
  id: string;
  title: string;
  principalInvestigator: string;
  piEmail: string;
  department: string;
  riskTier: RiskTier;
  studyType: StudyType;
  vulnerablePopulationsInvolved: boolean;
  dataPrivacyProtocol: string;
  status: ProtocolStatus;
  submittedAt: string;
  reviewedAt?: string;
  boardVotes: BoardMemberVote[];
  ethicsClearanceSeal?: string;
  validUntil?: string;
  adverseReportingOfficer: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const PROTOCOLS_FILE = path.join(DATA_DIR, "research-ethics-protocols.json");

export const DEFAULT_ETHICS_SEED: EthicsProtocol[] = [
  {
    id: "IRB-2026-041",
    title: "Double-Blind Evaluation of AI-Assisted Sepsis Prediction in Intensive Care Units",
    principalInvestigator: "Dr. Sunita Sen",
    piEmail: "s.sen@apex.edu",
    department: "Biomedical Engineering & Medicine",
    riskTier: "FULL_BOARD_REVIEW",
    studyType: "AI_CLINICAL_TRIAL",
    vulnerablePopulationsInvolved: true,
    dataPrivacyProtocol: "HIPAA & GDPR Compliant On-Premises De-Identified Telemetry with Zero Egress",
    status: "APPROVED",
    submittedAt: "2026-01-10T10:00:00.000Z",
    reviewedAt: "2026-01-28T16:30:00.000Z",
    boardVotes: [
      {
        memberName: "Dr. Robert Vance, MD",
        role: "CHAIRPERSON",
        decision: "APPROVE",
        remarks: "Consent forms and patient surrogate authorization procedures meet rigorous institutional standards.",
        votedAt: "2026-01-28T14:10:00.000Z",
      },
      {
        memberName: "Prof. Ananya Iyer",
        role: "CLINICAL_ETHICIST",
        decision: "APPROVE",
        remarks: "Patient risk mitigation matrix is thoroughly specified with automated fallback to human intensivist.",
        votedAt: "2026-01-28T14:45:00.000Z",
      },
      {
        memberName: "Adv. Daniel Cole",
        role: "LEGAL_EXPERT",
        decision: "APPROVE",
        remarks: "Institutional liability waivers and statutory data stewardship agreements verified.",
        votedAt: "2026-01-28T15:20:00.000Z",
      },
    ],
    ethicsClearanceSeal: "APEX-IRB-SEAL-8F32C0D194B7EA28",
    validUntil: "2027-01-28T23:59:59.000Z",
    adverseReportingOfficer: "Office of Research Safety & Human Subject Protection",
  },
  {
    id: "IRB-2026-042",
    title: "Longitudinal Cognitive Load Assessment in VR Surgical Simulation Training",
    principalInvestigator: "Prof. Rajesh Khurana",
    piEmail: "r.khurana@apex.edu",
    department: "Computer Science & Cognitive Ergonomics",
    riskTier: "EXPEDITED",
    studyType: "BEHAVIORAL_SURVEY",
    vulnerablePopulationsInvolved: false,
    dataPrivacyProtocol: "Non-invasive EEG & Eye-tracking data with anonymized participant ID mappings",
    status: "APPROVED",
    submittedAt: "2026-02-01T09:15:00.000Z",
    reviewedAt: "2026-02-12T11:00:00.000Z",
    boardVotes: [
      {
        memberName: "Dr. Robert Vance, MD",
        role: "CHAIRPERSON",
        decision: "APPROVE",
        remarks: "Minimal risk ergonomics study with standard adult medical resident volunteers.",
        votedAt: "2026-02-12T10:30:00.000Z",
      },
    ],
    ethicsClearanceSeal: "APEX-IRB-SEAL-71A9B3E42D0F8912",
    validUntil: "2027-02-12T23:59:59.000Z",
    adverseReportingOfficer: "Office of Research Safety & Human Subject Protection",
  },
  {
    id: "IRB-2026-043",
    title: "Engineered Bacteriophage Cocktails for Multi-Drug Resistant Pseudomonas Aeruginosa",
    principalInvestigator: "Dr. Meenakshi Raman",
    piEmail: "m.raman@apex.edu",
    department: "Biotechnology & Microbiology",
    riskTier: "FULL_BOARD_REVIEW",
    studyType: "GENOMICS_BIOSAFETY",
    vulnerablePopulationsInvolved: false,
    dataPrivacyProtocol: "BSL-3 containment lab access logging with genomic sequence escrow",
    status: "UNDER_REVIEW",
    submittedAt: "2026-02-18T14:00:00.000Z",
    boardVotes: [
      {
        memberName: "Prof. Ananya Iyer",
        role: "CLINICAL_ETHICIST",
        decision: "REVISE",
        remarks: "Requires updated Biosafety Level 3 viral dispersal containment emergency protocol before final clearance.",
        votedAt: "2026-02-25T11:15:00.000Z",
      },
    ],
    adverseReportingOfficer: "Institutional Biosafety Committee (IBC)",
  },
  {
    id: "IRB-2026-044",
    title: "Anonymized Cross-Campus Student Sleep Metrics and Academic Performance Correlation",
    principalInvestigator: "Dr. Alan Turing",
    piEmail: "a.turing@apex.edu",
    department: "Psychology & Data Science",
    riskTier: "EXEMPT",
    studyType: "BEHAVIORAL_SURVEY",
    vulnerablePopulationsInvolved: false,
    dataPrivacyProtocol: "Aggregated de-identified voluntary survey data without PII",
    status: "APPROVED",
    submittedAt: "2026-02-20T08:30:00.000Z",
    reviewedAt: "2026-02-22T09:00:00.000Z",
    boardVotes: [
      {
        memberName: "Dr. Robert Vance, MD",
        role: "CHAIRPERSON",
        decision: "APPROVE",
        remarks: "Exempt category 2 verified: Voluntary survey without sensitive personal identifiers.",
        votedAt: "2026-02-22T08:50:00.000Z",
      },
    ],
    ethicsClearanceSeal: "APEX-IRB-SEAL-3C4891BA7E102F54",
    validUntil: "2028-02-22T23:59:59.000Z",
    adverseReportingOfficer: "Office of Research Safety & Human Subject Protection",
  },
];

function ensureProtocolsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROTOCOLS_FILE)) {
    fs.writeFileSync(PROTOCOLS_FILE, JSON.stringify(DEFAULT_ETHICS_SEED, null, 2), "utf8");
  }
}

export function getAllProtocols(): EthicsProtocol[] {
  ensureProtocolsFile();
  try {
    const raw = fs.readFileSync(PROTOCOLS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_ETHICS_SEED;
  } catch (err) {
    console.error("Error reading protocols file:", err);
    return DEFAULT_ETHICS_SEED;
  }
}

export function saveProtocols(protocols: EthicsProtocol[]): void {
  ensureProtocolsFile();
  fs.writeFileSync(PROTOCOLS_FILE, JSON.stringify(protocols, null, 2), "utf8");
}

export function submitProtocol(data: {
  title: string;
  principalInvestigator: string;
  piEmail: string;
  department: string;
  riskTier: RiskTier;
  studyType: StudyType;
  vulnerablePopulationsInvolved: boolean;
  dataPrivacyProtocol: string;
}): EthicsProtocol {
  const protocols = getAllProtocols();
  const year = new Date().getFullYear();
  const seq = (protocols.length + 1).toString().padStart(3, "0");
  const id = `IRB-${year}-${seq}`;

  const newProtocol: EthicsProtocol = {
    id,
    title: data.title.trim(),
    principalInvestigator: data.principalInvestigator.trim(),
    piEmail: data.piEmail.trim(),
    department: data.department.trim(),
    riskTier: data.riskTier,
    studyType: data.studyType,
    vulnerablePopulationsInvolved: data.vulnerablePopulationsInvolved,
    dataPrivacyProtocol: data.dataPrivacyProtocol.trim(),
    status: data.riskTier === "EXEMPT" ? "APPROVED" : "SUBMITTED",
    submittedAt: new Date().toISOString(),
    boardVotes: [],
    adverseReportingOfficer: "Office of Research Safety & Human Subject Protection",
  };

  if (data.riskTier === "EXEMPT") {
    const hash = crypto
      .createHash("sha256")
      .update(`${id}:${data.title}:EXEMPT:${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    newProtocol.ethicsClearanceSeal = `APEX-IRB-SEAL-${hash}`;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);
    newProtocol.validUntil = expiry.toISOString();
    newProtocol.reviewedAt = new Date().toISOString();
    newProtocol.boardVotes.push({
      memberName: "Dr. Robert Vance, MD",
      role: "CHAIRPERSON",
      decision: "APPROVE",
      remarks: "Self-certified statutory exemption under minimal risk survey criteria.",
      votedAt: new Date().toISOString(),
    });
  }

  protocols.unshift(newProtocol);
  saveProtocols(protocols);
  return newProtocol;
}

export function castBoardVote(
  protocolId: string,
  vote: {
    memberName: string;
    role: "CHAIRPERSON" | "CLINICAL_ETHICIST" | "LEGAL_EXPERT" | "COMMUNITY_REPRESENTATIVE";
    decision: "APPROVE" | "REVISE" | "REJECT";
    remarks: string;
  }
): EthicsProtocol {
  const protocols = getAllProtocols();
  const index = protocols.findIndex((p) => p.id === protocolId);
  if (index === -1) {
    throw new Error(`Ethics protocol ${protocolId} not found`);
  }

  const protocol = protocols[index];
  protocol.boardVotes.push({
    ...vote,
    votedAt: new Date().toISOString(),
  });

  const approveCount = protocol.boardVotes.filter((v) => v.decision === "APPROVE").length;
  const reviseCount = protocol.boardVotes.filter((v) => v.decision === "REVISE").length;
  const rejectCount = protocol.boardVotes.filter((v) => v.decision === "REJECT").length;

  if (rejectCount >= 2) {
    protocol.status = "REJECTED";
  } else if (reviseCount >= 1 && protocol.status !== "APPROVED") {
    protocol.status = "REVISIONS_REQUESTED";
  } else if (approveCount >= (protocol.riskTier === "EXPEDITED" ? 1 : 2)) {
    protocol.status = "APPROVED";
    protocol.reviewedAt = new Date().toISOString();
    
    // Generate clearance seal
    const hash = crypto
      .createHash("sha256")
      .update(`${protocol.id}:${protocol.title}:${Date.now()}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
    protocol.ethicsClearanceSeal = `APEX-IRB-SEAL-${hash}`;
    
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    protocol.validUntil = expiry.toISOString();
  } else {
    protocol.status = "UNDER_REVIEW";
  }

  protocols[index] = protocol;
  saveProtocols(protocols);
  return protocol;
}

export function getIRBAnalytics() {
  const protocols = getAllProtocols();
  const total = protocols.length;
  const approved = protocols.filter((p) => p.status === "APPROVED").length;
  const underReview = protocols.filter((p) => p.status === "UNDER_REVIEW" || p.status === "SUBMITTED").length;
  const revisions = protocols.filter((p) => p.status === "REVISIONS_REQUESTED").length;
  const fullBoard = protocols.filter((p) => p.riskTier === "FULL_BOARD_REVIEW").length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return {
    total,
    approved,
    underReview,
    revisions,
    fullBoard,
    approvalRate,
  };
}
