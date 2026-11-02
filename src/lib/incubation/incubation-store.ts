// SPDX-License-Identifier: Apache-2.0
/**
 * Enterprise Incubation Store
 * Durably persists venture cohorts, cap-table metrics, workspace desk allocations,
 * seed grant tranches, patent disclosures, and quarterly milestone reviews.
 */

import fs from "fs";
import path from "path";
import {
  IncubatedStartup,
  IncubationStage,
  LabDeskAllocation,
  SeedGrantTranche,
  PatentDisclosure,
  QuarterlyMilestoneReview,
  IncubationApplication,
  IncubationMentor,
  MentorSession,
  SeedFundScheme,
  InvestorEOI,
  ApplicationStatus,
  calculateIncubationPortfolioMetrics,
  validateStartupApplication,
  validateIncubationStageTransition,
  validateGrantTranche,
  validatePatentDisclosure,
  validateMilestoneReview,
  validateIncubationApplication,
  validateMentorRegistration,
  validateMentorSession,
  validateInvestorEOI,
} from "./incubation-engine";

const DATA_DIR = path.join(process.cwd(), "data", "incubation");
const STORE_FILE = path.join(DATA_DIR, "incubation_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface IncubationStoreSchema {
  startups: IncubatedStartup[];
  desks: LabDeskAllocation[];
  tranches: SeedGrantTranche[];
  patents: PatentDisclosure[];
  milestoneReviews: QuarterlyMilestoneReview[];
  applications?: IncubationApplication[];
  mentors?: IncubationMentor[];
  mentorSessions?: MentorSession[];
  grantSchemes?: SeedFundScheme[];
  investorEOIs?: InvestorEOI[];
}

const DEFAULT_STARTUPS: IncubatedStartup[] = [
  {
    id: "st-01",
    companyRef: "VENT-2026-041",
    startupName: "NeuroPulse BioTech",
    founderName: "Dr. Vikram Sethi & Alex Mercer",
    founderRollOrStaffId: "FAC-BIO-09 / CS2026-001",
    founderRole: "STUDENT",
    sector: "HEALTHTECH",
    stage: "ACCELERATOR_GROWTH",
    pitchDeckSummary: "Non-invasive neural interfaces for neuromuscular rehabilitation monitoring.",
    seedGrantDisbursed: 50000,
    universityEquityPercentage: 3.5,
    externalFundingRaised: 750000,
    patentsFiled: 2,
    labDesksAllocated: 6,
    mentorName: "Dr. Arvind Gupta (Angel Investor)",
    status: "ACTIVE",
    incubatedDate: "2025-06-12T10:00:00.000Z",
  },
  {
    id: "st-02",
    companyRef: "VENT-2026-042",
    startupName: "TerraCharge Robotics",
    founderName: "Rohan Singhania",
    founderRollOrStaffId: "ME2025-032",
    founderRole: "ALUMNI",
    sector: "CLEANTECH",
    stage: "SEED_FUNDED",
    pitchDeckSummary: "Autonomous inductive charging pads and mobile robots for municipal electric buses.",
    seedGrantDisbursed: 25000,
    universityEquityPercentage: 2.0,
    externalFundingRaised: 250000,
    patentsFiled: 1,
    labDesksAllocated: 4,
    mentorName: "Prof. Priya Nambiar",
    status: "ACTIVE",
    incubatedDate: "2025-11-20T14:30:00.000Z",
  },
  {
    id: "st-03",
    companyRef: "VENT-2026-043",
    startupName: "OmniLedger FinAI",
    founderName: "Ananya Deshmukh",
    founderRollOrStaffId: "CS2026-088",
    founderRole: "STUDENT",
    sector: "FINTECH",
    stage: "INCUBATED_PROTOTYPE",
    pitchDeckSummary: "Cross-border algorithmic settlement network for educational institutions.",
    seedGrantDisbursed: 10000,
    universityEquityPercentage: 2.5,
    externalFundingRaised: 0,
    patentsFiled: 0,
    labDesksAllocated: 2,
    mentorName: "Sanjay Mehta (Venture Partner)",
    status: "ACTIVE",
    incubatedDate: "2026-02-15T09:00:00.000Z",
  },
];

const DEFAULT_DESKS: LabDeskAllocation[] = [
  { id: "desk-01", deskCode: "POD-A-01", podName: "AI & DeepTech Bay", startupId: "st-01", startupName: "NeuroPulse BioTech", allocatedDate: "2025-06-15", status: "OCCUPIED" },
  { id: "desk-02", deskCode: "POD-A-02", podName: "AI & DeepTech Bay", startupId: "st-01", startupName: "NeuroPulse BioTech", allocatedDate: "2025-06-15", status: "OCCUPIED" },
  { id: "desk-03", deskCode: "POD-A-03", podName: "AI & DeepTech Bay", startupId: "st-01", startupName: "NeuroPulse BioTech", allocatedDate: "2025-06-15", status: "OCCUPIED" },
  { id: "desk-04", deskCode: "POD-A-04", podName: "AI & DeepTech Bay", startupId: null, startupName: null, allocatedDate: null, status: "VACANT" },

  { id: "desk-05", deskCode: "POD-B-01", podName: "Robotics & Hardware Bay", startupId: "st-02", startupName: "TerraCharge Robotics", allocatedDate: "2025-11-25", status: "OCCUPIED" },
  { id: "desk-06", deskCode: "POD-B-02", podName: "Robotics & Hardware Bay", startupId: "st-02", startupName: "TerraCharge Robotics", allocatedDate: "2025-11-25", status: "OCCUPIED" },
  { id: "desk-07", deskCode: "POD-B-03", podName: "Robotics & Hardware Bay", startupId: null, startupName: null, allocatedDate: null, status: "VACANT" },
  { id: "desk-08", deskCode: "POD-B-04", podName: "Robotics & Hardware Bay", startupId: null, startupName: null, allocatedDate: null, status: "VACANT" },

  { id: "desk-09", deskCode: "POD-C-01", podName: "FinTech & Cloud Computing", startupId: "st-03", startupName: "OmniLedger FinAI", allocatedDate: "2026-02-20", status: "OCCUPIED" },
  { id: "desk-10", deskCode: "POD-C-02", podName: "FinTech & Cloud Computing", startupId: "st-03", startupName: "OmniLedger FinAI", allocatedDate: "2026-02-20", status: "OCCUPIED" },
  { id: "desk-11", deskCode: "POD-C-03", podName: "FinTech & Cloud Computing", startupId: null, startupName: null, allocatedDate: null, status: "VACANT" },
  { id: "desk-12", deskCode: "POD-C-04", podName: "FinTech & Cloud Computing", startupId: null, startupName: null, allocatedDate: null, status: "VACANT" },
];

const DEFAULT_TRANCHES: SeedGrantTranche[] = [
  {
    id: "tr-01",
    trancheRef: "TR-2026-001",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    trancheNumber: 1,
    amount: 25000,
    milestoneDescription: "Proof-of-concept neural interface headband telemetry with 95% latency reduction.",
    status: "DISBURSED",
    disbursedAt: "2025-07-01T10:00:00.000Z",
    sanctionOrderNumber: "SO-AIC-2025-081",
  },
  {
    id: "tr-02",
    trancheRef: "TR-2026-002",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    trancheNumber: 2,
    amount: 25000,
    milestoneDescription: "IRB human trials approval & clinical beta pilot on 10 patients.",
    status: "DISBURSED",
    disbursedAt: "2025-12-15T12:00:00.000Z",
    sanctionOrderNumber: "SO-AIC-2025-114",
  },
  {
    id: "tr-03",
    trancheRef: "TR-2026-003",
    startupId: "st-02",
    startupName: "TerraCharge Robotics",
    trancheNumber: 1,
    amount: 25000,
    milestoneDescription: "Working 50kW inductive power transfer prototype and dynamometer bench testing.",
    status: "DISBURSED",
    disbursedAt: "2025-12-05T09:30:00.000Z",
    sanctionOrderNumber: "SO-AIC-2025-099",
  },
  {
    id: "tr-04",
    trancheRef: "TR-2026-004",
    startupId: "st-03",
    startupName: "OmniLedger FinAI",
    trancheNumber: 1,
    amount: 10000,
    milestoneDescription: "Algorithmic cross-border clearing smart contract testnet deployment.",
    status: "DISBURSED",
    disbursedAt: "2026-03-01T11:00:00.000Z",
    sanctionOrderNumber: "SO-AIC-2026-022",
  },
];

const DEFAULT_PATENTS: PatentDisclosure[] = [
  {
    id: "pat-01",
    disclosureRef: "PAT-2026-001",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    inventionTitle: "Adaptive Neural Signal Filtering Apparatus for Wearable Myoelectric Sensor Nodes",
    applicationNumber: "IN-202541088921",
    jurisdiction: "INDIAN_PATENT_OFFICE",
    filingDate: "2025-08-14",
    status: "PUBLISHED",
    universitySharePercentage: 50,
    inventors: ["Dr. Vikram Sethi", "Alex Mercer"],
  },
  {
    id: "pat-02",
    disclosureRef: "PAT-2026-002",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    inventionTitle: "Ultra-Low Power Bidirectional Neural Transceiver Integrated Circuit",
    applicationNumber: "US-18/902,414",
    jurisdiction: "USPTO",
    filingDate: "2025-11-03",
    status: "PROVISIONAL_FILED",
    universitySharePercentage: 50,
    inventors: ["Dr. Vikram Sethi", "Alex Mercer"],
  },
  {
    id: "pat-03",
    disclosureRef: "PAT-2026-003",
    startupId: "st-02",
    startupName: "TerraCharge Robotics",
    inventionTitle: "Resonant Magnetic Coupling Inductive Charger with Dynamic Vehicle Alignment",
    applicationNumber: "IN-202541099112",
    jurisdiction: "INDIAN_PATENT_OFFICE",
    filingDate: "2025-12-18",
    status: "EXAMINATION_UNDERWAY",
    universitySharePercentage: 40,
    inventors: ["Rohan Singhania", "Prof. Priya Nambiar"],
  },
];

const DEFAULT_REVIEWS: QuarterlyMilestoneReview[] = [
  {
    id: "rev-01",
    reviewRef: "REV-2026-001",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    quarter: "Q2 2026-27",
    reviewDate: "2026-01-15",
    reviewerName: "Dr. Arvind Gupta (Angel Investor)",
    mrrAchieved: 8500,
    prototypeStage: "Clinical Beta Trial Completed",
    overallRating: 5,
    mentorRemarks: "Exceeded clinical testing milestones. Ready for Series A venture capital roadshow.",
    recommendedAction: "FAST_TRACK_ACCELERATION",
  },
  {
    id: "rev-02",
    reviewRef: "REV-2026-002",
    startupId: "st-02",
    startupName: "TerraCharge Robotics",
    quarter: "Q2 2026-27",
    reviewDate: "2026-01-20",
    reviewerName: "Prof. Priya Nambiar",
    mrrAchieved: 3200,
    prototypeStage: "Municipal Bus Depot Fleet Trial",
    overallRating: 4,
    mentorRemarks: "Field testing verified 92% inductive efficiency. Patent progressing through examination.",
    recommendedAction: "CONTINUE_INCUBATION",
  },
];

const DEFAULT_APPLICATIONS: IncubationApplication[] = [
  {
    id: "app-01",
    applicationRef: "APP-2026-001",
    startupName: "BioSens Microfluidics",
    applicantName: "Dr. Ananya Sen",
    applicantEmail: "ananya.sen@apex.edu",
    applicantPhone: "+91 98765 43210",
    applicantRole: "FACULTY",
    department: "BioTechnology",
    sector: "HEALTHTECH",
    problemStatement: "Current clinical biomarker assays take 48+ hours and require centralized pathology labs, delaying ICU sepsis diagnosis.",
    proposedSolution: "Microfluidic disposable lab-on-a-chip detecting inflammatory biomarkers in under 15 minutes at bedside.",
    prototypeUrl: "https://biosens-preview.internal.apex.edu",
    requestedGrant: 1000000,
    requestedDesks: 3,
    status: "APPROVED",
    committeeScore: 92,
    committeeNotes: "Strong experimental validation with Department of Biotechnology grant. Recommended for immediate Cohort onboard.",
    submittedAt: "2026-08-10T10:00:00.000Z",
    evaluatedAt: "2026-09-01T15:30:00.000Z",
  },
  {
    id: "app-02",
    applicationRef: "APP-2026-002",
    startupName: "AeroKite Heavy-Lift Drones",
    applicantName: "Kabir Mehta",
    applicantEmail: "kabir.mehta@students.apex.edu",
    applicantPhone: "+91 98112 34567",
    applicantRole: "STUDENT",
    department: "Mechanical & Aerospace Engineering",
    sector: "ROBOTICS_IOT",
    problemStatement: "High-altitude disaster relief logistics are constrained by standard quadcopter battery payload limitations.",
    proposedSolution: "Tethered hybrid fuel-cell octocopter capable of carrying 25kg cargo in Himalayan sub-zero terrains.",
    prototypeUrl: "https://aerokite-uav.github.io",
    requestedGrant: 500000,
    requestedDesks: 2,
    status: "PITCH_SCHEDULED",
    committeeScore: 84,
    committeeNotes: "Initial screening passed. Invited for in-person flight test and pitch presentation on Nov 15.",
    submittedAt: "2026-09-12T11:30:00.000Z",
    evaluatedAt: "2026-09-25T14:00:00.000Z",
  },
  {
    id: "app-03",
    applicationRef: "APP-2026-003",
    startupName: "FinLedger Micro-Savings",
    applicantName: "Tanya Goel",
    applicantEmail: "tanya.goel@alumni.apex.edu",
    applicantPhone: "+91 98450 11223",
    applicantRole: "ALUMNI",
    department: "Computer Science & Engineering",
    sector: "FINTECH",
    problemStatement: "Gen-Z university students lack automated disciplined saving and micro-investing instruments linked to UPI.",
    proposedSolution: "UPI round-up micro-investing smart app rounding merchant purchases to the nearest ₹10 and allocating to sovereign gold bonds.",
    requestedGrant: 250000,
    requestedDesks: 1,
    status: "UNDER_SCREENING",
    committeeScore: 76,
    committeeNotes: "Under review by FinTech domain subcommittee. Awaiting compliance opinion on RBI account aggregator framework.",
    submittedAt: "2026-10-01T09:15:00.000Z",
  },
];

const DEFAULT_MENTORS: IncubationMentor[] = [
  {
    id: "men-01",
    mentorName: "Dr. Arvind Gupta",
    title: "General Partner & Angel Investor",
    organization: "DeepTech Seed Fund",
    expertise: ["DeepTech", "AI/ML", "Fundraising", "Venture Valuation"],
    email: "arvind.gupta@angelnetwork.in",
    phone: "+91 98100 23456",
    totalSessionsConducted: 24,
    rating: 4.9,
    availabilityStatus: "AVAILABLE",
  },
  {
    id: "men-02",
    mentorName: "Sunita Rao",
    title: "Partner & Patent Attorney",
    organization: "IP Legal Solutions LLP",
    expertise: ["Patent Claims", "PCT International Filings", "Technology Transfer", "Trade Secrets"],
    email: "sunita.rao@ipattorneys.com",
    phone: "+91 98201 34567",
    totalSessionsConducted: 18,
    rating: 4.8,
    availabilityStatus: "AVAILABLE",
  },
  {
    id: "men-03",
    mentorName: "Vikramaditya Bose",
    title: "VP of Hardware Engineering & EIR",
    organization: "HyperScale Robotics",
    expertise: ["Embedded Systems", "Hardware Prototyping", "Foundry Tape-out", "ISO Compliance"],
    email: "vbose@hyperscale.tech",
    phone: "+91 98310 45678",
    totalSessionsConducted: 15,
    rating: 5.0,
    availabilityStatus: "ENGAGED",
  },
  {
    id: "men-04",
    mentorName: "Meera Namboodiri",
    title: "Former Unicorn CMO & Growth Advisor",
    organization: "ScaleUp Partners",
    expertise: ["B2B Go-to-Market", "Enterprise Sales", "Product-Market Fit", "Unit Economics"],
    email: "meera@scaleuppartners.io",
    phone: "+91 98450 56789",
    totalSessionsConducted: 12,
    rating: 4.9,
    availabilityStatus: "AVAILABLE",
  },
];

const DEFAULT_MENTOR_SESSIONS: MentorSession[] = [
  {
    id: "ses-01",
    sessionRef: "SES-2026-001",
    mentorId: "men-01",
    mentorName: "Dr. Arvind Gupta",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    scheduledDate: "2026-09-18T14:00:00.000Z",
    durationMinutes: 60,
    discussionTopic: "Series-A Term Sheet Negotiation & Due Diligence Room Prep",
    keyTakeaways: "Agreed to fix valuation cap at ₹35 Cr with 15% post-money SAFE note. Cleaned cap table ESOP pool.",
    actionItems: "1. Finalize audited balance sheet. 2. Request clean patent assignment certificate from TTO.",
    status: "COMPLETED",
  },
  {
    id: "ses-02",
    sessionRef: "SES-2026-002",
    mentorId: "men-03",
    mentorName: "Vikramaditya Bose",
    startupId: "st-02",
    startupName: "TerraCharge Robotics",
    scheduledDate: "2026-09-28T16:00:00.000Z",
    durationMinutes: 45,
    discussionTopic: "Inductive High-Voltage Resonance Safety & ISO Standards",
    keyTakeaways: "Identified thermal dissipation bottleneck in secondary receiver coil. Recommended copper heat sink re-routing.",
    actionItems: "1. Update CAD thermals. 2. Order thermal interface pads for depot test bench.",
    status: "COMPLETED",
  },
  {
    id: "ses-03",
    sessionRef: "SES-2026-003",
    mentorId: "men-02",
    mentorName: "Sunita Rao",
    startupId: "st-03",
    startupName: "OmniLedger FinAI",
    scheduledDate: "2026-11-10T11:00:00.000Z",
    durationMinutes: 45,
    discussionTopic: "Smart Contract Algorithm Scoping for Indian Patent Office",
    keyTakeaways: "",
    actionItems: "Bring system architecture flowcharts and technical novelties draft.",
    status: "SCHEDULED",
  },
];

const DEFAULT_GRANT_SCHEMES: SeedFundScheme[] = [
  {
    id: "sch-01",
    schemeCode: "SCH-DST-PRAYAS",
    schemeName: "DST NIDHI-PRAYAS Prototyping Grant",
    sponsoringAgency: "Department of Science & Technology (DST), Govt. of India",
    sanctionedCorpus: 10000000,
    disbursedAmount: 4500000,
    maxGrantPerVenture: 1000000,
    activeVenturesFunded: 5,
    status: "ACTIVE",
  },
  {
    id: "sch-02",
    schemeCode: "SCH-BIRAC-BIG",
    schemeName: "BIRAC Biotechnology Ignition Grant (BIG)",
    sponsoringAgency: "Biotechnology Industry Research Assistance Council (BIRAC)",
    sanctionedCorpus: 25000000,
    disbursedAmount: 12000000,
    maxGrantPerVenture: 5000000,
    activeVenturesFunded: 3,
    status: "ACTIVE",
  },
  {
    id: "sch-03",
    schemeCode: "SCH-SISFS",
    schemeName: "Startup India Seed Fund Scheme (SISFS)",
    sponsoringAgency: "DPIIT, Ministry of Commerce & Industry",
    sanctionedCorpus: 50000000,
    disbursedAmount: 21000000,
    maxGrantPerVenture: 2000000,
    activeVenturesFunded: 11,
    status: "ACTIVE",
  },
  {
    id: "sch-04",
    schemeCode: "SCH-INST-SEED",
    schemeName: "Apex University Venture Innovation Corpus",
    sponsoringAgency: "Apex University Endowment Trust",
    sanctionedCorpus: 15000000,
    disbursedAmount: 6000000,
    maxGrantPerVenture: 1500000,
    activeVenturesFunded: 6,
    status: "ACTIVE",
  },
];

const DEFAULT_INVESTOR_EOIS: InvestorEOI[] = [
  {
    id: "eoi-01",
    eoiRef: "EOI-2026-001",
    startupId: "st-01",
    startupName: "NeuroPulse BioTech",
    investorFirm: "Peak XV Surge Accelerator",
    partnerName: "Rajat Dhawan",
    contactEmail: "rajat@peakxv.com",
    indicatedChequeAmount: 35000000,
    proposedValuationCap: 350000000,
    stageInterest: "SEED",
    dueDiligenceStatus: "TERM_SHEET_ISSUED",
    submittedAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: "eoi-02",
    eoiRef: "EOI-2026-002",
    startupId: "st-02",
    startupName: "TerraCharge Robotics",
    investorFirm: "Blume Ventures Climate Fund",
    partnerName: "Arun Natarajan",
    contactEmail: "arun@blume.vc",
    indicatedChequeAmount: 20000000,
    proposedValuationCap: 220000000,
    stageInterest: "SEED",
    dueDiligenceStatus: "DUE_DILIGENCE_PASS",
    submittedAt: "2026-10-04T12:00:00.000Z",
  },
  {
    id: "eoi-03",
    eoiRef: "EOI-2026-003",
    startupId: "st-03",
    startupName: "OmniLedger FinAI",
    investorFirm: "Indian Angel Network FinTech Syndicate",
    partnerName: "Siddharth Roy",
    contactEmail: "siddharth@indianangels.com",
    indicatedChequeAmount: 12500000,
    proposedValuationCap: 150000000,
    stageInterest: "SEED",
    dueDiligenceStatus: "DATA_ROOM_OPENED",
    submittedAt: "2026-10-18T16:30:00.000Z",
  },
];

function readStore(): IncubationStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: IncubationStoreSchema = {
      startups: JSON.parse(JSON.stringify(DEFAULT_STARTUPS)),
      desks: JSON.parse(JSON.stringify(DEFAULT_DESKS)),
      tranches: JSON.parse(JSON.stringify(DEFAULT_TRANCHES)),
      patents: JSON.parse(JSON.stringify(DEFAULT_PATENTS)),
      milestoneReviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)),
      applications: JSON.parse(JSON.stringify(DEFAULT_APPLICATIONS)),
      mentors: JSON.parse(JSON.stringify(DEFAULT_MENTORS)),
      mentorSessions: JSON.parse(JSON.stringify(DEFAULT_MENTOR_SESSIONS)),
      grantSchemes: JSON.parse(JSON.stringify(DEFAULT_GRANT_SCHEMES)),
      investorEOIs: JSON.parse(JSON.stringify(DEFAULT_INVESTOR_EOIS)),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const data = JSON.parse(raw);
    let mutated = false;

    if (!data.startups) { data.startups = JSON.parse(JSON.stringify(DEFAULT_STARTUPS)); mutated = true; }
    if (!data.desks) { data.desks = JSON.parse(JSON.stringify(DEFAULT_DESKS)); mutated = true; }
    if (!data.tranches) { data.tranches = JSON.parse(JSON.stringify(DEFAULT_TRANCHES)); mutated = true; }
    if (!data.patents) { data.patents = JSON.parse(JSON.stringify(DEFAULT_PATENTS)); mutated = true; }
    if (!data.milestoneReviews) { data.milestoneReviews = JSON.parse(JSON.stringify(DEFAULT_REVIEWS)); mutated = true; }
    if (!data.applications) { data.applications = JSON.parse(JSON.stringify(DEFAULT_APPLICATIONS)); mutated = true; }
    if (!data.mentors) { data.mentors = JSON.parse(JSON.stringify(DEFAULT_MENTORS)); mutated = true; }
    if (!data.mentorSessions) { data.mentorSessions = JSON.parse(JSON.stringify(DEFAULT_MENTOR_SESSIONS)); mutated = true; }
    if (!data.grantSchemes) { data.grantSchemes = JSON.parse(JSON.stringify(DEFAULT_GRANT_SCHEMES)); mutated = true; }
    if (!data.investorEOIs) { data.investorEOIs = JSON.parse(JSON.stringify(DEFAULT_INVESTOR_EOIS)); mutated = true; }

    if (mutated) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    }
    return data;
  } catch (err) {
    console.error("[IncubationStore Read Error]:", err);
    return {
      startups: JSON.parse(JSON.stringify(DEFAULT_STARTUPS)),
      desks: JSON.parse(JSON.stringify(DEFAULT_DESKS)),
      tranches: JSON.parse(JSON.stringify(DEFAULT_TRANCHES)),
      patents: JSON.parse(JSON.stringify(DEFAULT_PATENTS)),
      milestoneReviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)),
      applications: JSON.parse(JSON.stringify(DEFAULT_APPLICATIONS)),
      mentors: JSON.parse(JSON.stringify(DEFAULT_MENTORS)),
      mentorSessions: JSON.parse(JSON.stringify(DEFAULT_MENTOR_SESSIONS)),
      grantSchemes: JSON.parse(JSON.stringify(DEFAULT_GRANT_SCHEMES)),
      investorEOIs: JSON.parse(JSON.stringify(DEFAULT_INVESTOR_EOIS)),
    };
  }
}

function writeStore(data: IncubationStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const incubationStore = {
  getSummary() {
    const store = readStore();
    return calculateIncubationPortfolioMetrics(store.startups);
  },

  getStartups(stage?: IncubationStage) {
    const store = readStore();
    if (stage) {
      return store.startups.filter((s) => s.stage === stage);
    }
    return store.startups;
  },

  registerStartup(payload: Partial<IncubatedStartup>): IncubatedStartup {
    const validation = validateStartupApplication(payload);
    if (!validation.isValid) {
      throw new Error(`Incubation Application Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const duplicate = store.startups.find(
      (s) => s.startupName.toLowerCase() === payload.startupName!.trim().toLowerCase()
    );
    if (duplicate) {
      if (payload.founderRollOrStaffId && duplicate.founderRollOrStaffId !== payload.founderRollOrStaffId) {
        throw new Error(`A venture named '${payload.startupName}' is already registered in the university incubator.`);
      }
      if (!payload.founderRollOrStaffId) {
        throw new Error(`A venture named '${payload.startupName}' is already registered in the university incubator.`);
      }
      // Idempotently update existing venture if re-registered by same founder
      Object.assign(duplicate, payload);
      writeStore(store);
      return duplicate;
    }

    const newStartup: IncubatedStartup = {
      id: `st-${Date.now()}`,
      companyRef: `VENT-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupName: payload.startupName!.trim(),
      founderName: payload.founderName!.trim(),
      founderRollOrStaffId: payload.founderRollOrStaffId || "STU-2026",
      founderRole: payload.founderRole || "STUDENT",
      sector: payload.sector || "AI_ML",
      stage: payload.stage || "INCUBATED_PROTOTYPE",
      pitchDeckSummary: payload.pitchDeckSummary!.trim(),
      seedGrantDisbursed: payload.seedGrantDisbursed !== undefined && !isNaN(Number(payload.seedGrantDisbursed))
        ? Math.max(0, Number(payload.seedGrantDisbursed))
        : 0,
      universityEquityPercentage: payload.universityEquityPercentage !== undefined && !isNaN(Number(payload.universityEquityPercentage))
        ? Math.max(0, Number(payload.universityEquityPercentage))
        : 0,
      externalFundingRaised: payload.externalFundingRaised !== undefined && !isNaN(Number(payload.externalFundingRaised))
        ? Math.max(0, Number(payload.externalFundingRaised))
        : 0,
      patentsFiled: payload.patentsFiled !== undefined && !isNaN(Number(payload.patentsFiled))
        ? Math.max(0, Number(payload.patentsFiled))
        : 0,
      labDesksAllocated: payload.labDesksAllocated !== undefined && !isNaN(Number(payload.labDesksAllocated))
        ? Math.max(0, Number(payload.labDesksAllocated))
        : 1,
      mentorName: payload.mentorName || "Center Director & EIR",
      status: "ACTIVE",
      incubatedDate: new Date().toISOString(),
    };

    store.startups.unshift(newStartup);
    writeStore(store);
    return newStartup;
  },

  updateStartupStage(
    id: string,
    stage: IncubationStage,
    fundingDelta?: { seed?: number; external?: number }
  ): IncubatedStartup {
    const store = readStore();
    const startup = store.startups.find((s) => s.id === id);
    if (!startup) {
      throw new Error(`Startup venture with id ${id} not found`);
    }

    const check = validateIncubationStageTransition(startup.stage, stage);
    if (!check.isValid) {
      throw new Error(check.reason || `Invalid transition from ${startup.stage} to ${stage}`);
    }

    startup.stage = stage;
    if (fundingDelta?.seed !== undefined) startup.seedGrantDisbursed = Math.max(0, fundingDelta.seed);
    if (fundingDelta?.external !== undefined) startup.externalFundingRaised = Math.max(0, fundingDelta.external);
    if (stage === "GRADUATED_VENTURE") startup.status = "GRADUATED";

    writeStore(store);
    return startup;
  },

  assignMentor(id: string, mentorName: string): IncubatedStartup {
    if (!mentorName || mentorName.trim().length === 0) {
      throw new Error("Mentor name is required.");
    }
    const store = readStore();
    const startup = store.startups.find((s) => s.id === id);
    if (!startup) {
      throw new Error(`Startup venture with id ${id} not found`);
    }
    startup.mentorName = mentorName.trim();
    writeStore(store);
    return startup;
  },

  // Co-Working Space & Innovation Lab Desk Allocation
  getDesks(): LabDeskAllocation[] {
    const store = readStore();
    return store.desks;
  },

  allocateDesk(deskCode: string, startupId: string): LabDeskAllocation {
    const store = readStore();
    const desk = store.desks.find((d) => d.deskCode === deskCode);
    if (!desk) throw new Error(`Workspace desk ${deskCode} not found in innovation center`);
    if (desk.status === "OCCUPIED") {
      throw new Error(`Desk ${deskCode} is already allocated to venture '${desk.startupName}'`);
    }

    const startup = store.startups.find((s) => s.id === startupId);
    if (!startup) throw new Error(`Venture with ID ${startupId} not found`);

    desk.startupId = startup.id;
    desk.startupName = startup.startupName;
    desk.allocatedDate = new Date().toISOString().split("T")[0];
    desk.status = "OCCUPIED";

    startup.labDesksAllocated = (startup.labDesksAllocated || 0) + 1;

    writeStore(store);
    return desk;
  },

  deallocateDesk(deskCode: string): LabDeskAllocation {
    const store = readStore();
    const desk = store.desks.find((d) => d.deskCode === deskCode);
    if (!desk) throw new Error(`Workspace desk ${deskCode} not found`);
    if (desk.status === "VACANT") throw new Error(`Desk ${deskCode} is already vacant`);

    if (desk.startupId) {
      const startup = store.startups.find((s) => s.id === desk.startupId);
      if (startup && startup.labDesksAllocated > 0) {
        startup.labDesksAllocated -= 1;
      }
    }

    desk.startupId = null;
    desk.startupName = null;
    desk.allocatedDate = null;
    desk.status = "VACANT";

    writeStore(store);
    return desk;
  },

  // Seed Grant Tranches & Disbursement Ledger
  getGrantTranches(startupId?: string): SeedGrantTranche[] {
    const store = readStore();
    if (startupId) {
      return store.tranches.filter((t) => t.startupId === startupId);
    }
    return store.tranches;
  },

  disburseGrantTranche(payload: Partial<SeedGrantTranche>): SeedGrantTranche {
    const validation = validateGrantTranche(payload);
    if (!validation.isValid) {
      throw new Error(`Seed Grant Tranche Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const startup = store.startups.find((s) => s.id === payload.startupId);
    if (!startup) throw new Error(`Target venture with id ${payload.startupId} not found`);

    const trancheNum = payload.trancheNumber || (store.tranches.filter((t) => t.startupId === startup.id).length + 1);
    const amount = Number(payload.amount);

    const tranche: SeedGrantTranche = {
      id: `tr-${Date.now()}`,
      trancheRef: `TR-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupId: startup.id,
      startupName: startup.startupName,
      trancheNumber: trancheNum,
      amount,
      milestoneDescription: payload.milestoneDescription!.trim(),
      status: "DISBURSED",
      disbursedAt: new Date().toISOString(),
      sanctionOrderNumber: payload.sanctionOrderNumber || `SO-AIC-2026-${Math.floor(100 + Math.random() * 900)}`,
    };

    store.tranches.unshift(tranche);
    startup.seedGrantDisbursed = (startup.seedGrantDisbursed || 0) + amount;

    writeStore(store);
    return tranche;
  },

  // Technology Transfer & Patent (IPR) Disclosures
  getPatents(startupId?: string): PatentDisclosure[] {
    const store = readStore();
    if (startupId) {
      return store.patents.filter((p) => p.startupId === startupId);
    }
    return store.patents;
  },

  filePatentDisclosure(payload: Partial<PatentDisclosure>): PatentDisclosure {
    const validation = validatePatentDisclosure(payload);
    if (!validation.isValid) {
      throw new Error(`Patent Disclosure Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const startup = store.startups.find((s) => s.id === payload.startupId);
    if (!startup) throw new Error(`Target venture with id ${payload.startupId} not found`);

    const disclosure: PatentDisclosure = {
      id: `pat-${Date.now()}`,
      disclosureRef: `PAT-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupId: startup.id,
      startupName: startup.startupName,
      inventionTitle: payload.inventionTitle!.trim(),
      applicationNumber: payload.applicationNumber || `IN-${Date.now().toString().slice(-8)}`,
      jurisdiction: payload.jurisdiction || "INDIAN_PATENT_OFFICE",
      filingDate: payload.filingDate || new Date().toISOString().split("T")[0],
      status: payload.status || "PROVISIONAL_FILED",
      universitySharePercentage: payload.universitySharePercentage !== undefined ? Number(payload.universitySharePercentage) : 50,
      inventors: payload.inventors && payload.inventors.length > 0 ? payload.inventors : [startup.founderName],
    };

    store.patents.unshift(disclosure);
    startup.patentsFiled = (startup.patentsFiled || 0) + 1;

    writeStore(store);
    return disclosure;
  },

  // Mentorship & Quarterly Milestone Reviews
  getMilestoneReviews(startupId?: string): QuarterlyMilestoneReview[] {
    const store = readStore();
    if (startupId) {
      return store.milestoneReviews.filter((r) => r.startupId === startupId);
    }
    return store.milestoneReviews;
  },

  recordMilestoneReview(payload: Partial<QuarterlyMilestoneReview>): QuarterlyMilestoneReview {
    const validation = validateMilestoneReview(payload);
    if (!validation.isValid) {
      throw new Error(`Milestone Review Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const startup = store.startups.find((s) => s.id === payload.startupId);
    if (!startup) throw new Error(`Target venture with id ${payload.startupId} not found`);

    const review: QuarterlyMilestoneReview = {
      id: `rev-${Date.now()}`,
      reviewRef: `REV-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupId: startup.id,
      startupName: startup.startupName,
      quarter: payload.quarter!.trim(),
      reviewDate: payload.reviewDate || new Date().toISOString().split("T")[0],
      reviewerName: payload.reviewerName || startup.mentorName || "Center Director",
      mrrAchieved: payload.mrrAchieved !== undefined ? Number(payload.mrrAchieved) : 0,
      prototypeStage: payload.prototypeStage || "MVP in Production",
      overallRating: payload.overallRating !== undefined ? Number(payload.overallRating) : 4,
      mentorRemarks: payload.mentorRemarks || "Satisfactory quarterly sprint progress.",
      recommendedAction: payload.recommendedAction || "CONTINUE_INCUBATION",
    };

    store.milestoneReviews.unshift(review);
    writeStore(store);
    return review;
  },

  // Applications & Intake Pipeline
  getApplications(status?: string): IncubationApplication[] {
    const store = readStore();
    const apps = store.applications || [];
    if (status && status !== "ALL") {
      return apps.filter((a) => a.status === status);
    }
    return apps;
  },

  submitApplication(payload: Partial<IncubationApplication>): IncubationApplication {
    const validation = validateIncubationApplication(payload);
    if (!validation.isValid) {
      throw new Error(`Application Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.applications) store.applications = [];

    const newApp: IncubationApplication = {
      id: `app-${Date.now()}`,
      applicationRef: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupName: payload.startupName!.trim(),
      applicantName: payload.applicantName!.trim(),
      applicantEmail: payload.applicantEmail!.trim(),
      applicantPhone: payload.applicantPhone || "+91 99999 00000",
      applicantRole: payload.applicantRole || "STUDENT",
      department: payload.department || "Engineering",
      sector: payload.sector || "AI_ML",
      problemStatement: payload.problemStatement!.trim(),
      proposedSolution: payload.proposedSolution!.trim(),
      prototypeUrl: payload.prototypeUrl || "",
      requestedGrant: Number(payload.requestedGrant) || 250000,
      requestedDesks: Number(payload.requestedDesks) || 1,
      status: "SUBMITTED",
      committeeScore: 0,
      committeeNotes: "",
      submittedAt: new Date().toISOString(),
    };

    store.applications.unshift(newApp);
    writeStore(store);
    return newApp;
  },

  evaluateApplication(
    id: string,
    status: ApplicationStatus,
    score?: number,
    notes?: string
  ): IncubationApplication {
    const store = readStore();
    if (!store.applications) store.applications = [];
    const app = store.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application with ID ${id} not found.`);

    app.status = status;
    if (score !== undefined) app.committeeScore = Number(score);
    if (notes !== undefined) app.committeeNotes = notes.trim();
    app.evaluatedAt = new Date().toISOString();

    writeStore(store);
    return app;
  },

  convertApplicationToStartup(
    applicationId: string,
    options?: {
      initialStage?: IncubationStage;
      labDesksAllocated?: number;
      mentorName?: string;
    }
  ): IncubatedStartup {
    const store = readStore();
    if (!store.applications) store.applications = [];
    const app = store.applications.find((a) => a.id === applicationId);
    if (!app) throw new Error(`Application with ID ${applicationId} not found.`);

    // Check duplicate
    const exists = store.startups.some(
      (s) => s.startupName.toLowerCase() === app.startupName.toLowerCase()
    );
    if (exists) {
      throw new Error(`A venture named '${app.startupName}' is already active in the incubator.`);
    }

    const newStartup: IncubatedStartup = {
      id: `st-${Date.now()}`,
      companyRef: `VENT-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupName: app.startupName,
      founderName: app.applicantName,
      founderRollOrStaffId: `${app.applicantRole}-${app.department.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      founderRole: app.applicantRole,
      sector: app.sector,
      stage: options?.initialStage || "INCUBATED_PROTOTYPE",
      pitchDeckSummary: `${app.problemStatement} — ${app.proposedSolution}`,
      seedGrantDisbursed: 0,
      universityEquityPercentage: 3.0,
      externalFundingRaised: 0,
      patentsFiled: 0,
      labDesksAllocated: options?.labDesksAllocated !== undefined ? Number(options.labDesksAllocated) : (app.requestedDesks || 1),
      mentorName: options?.mentorName || "Center Director & EIR",
      status: "ACTIVE",
      incubatedDate: new Date().toISOString(),
    };

    app.status = "APPROVED";
    store.startups.unshift(newStartup);
    writeStore(store);
    return newStartup;
  },

  // Mentor Network & Office Hours
  getMentors(): IncubationMentor[] {
    const store = readStore();
    return store.mentors || [];
  },

  registerMentor(payload: Partial<IncubationMentor>): IncubationMentor {
    const validation = validateMentorRegistration(payload);
    if (!validation.isValid) {
      throw new Error(`Mentor Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.mentors) store.mentors = [];

    const mentor: IncubationMentor = {
      id: `men-${Date.now()}`,
      mentorName: payload.mentorName!.trim(),
      title: payload.title!.trim(),
      organization: payload.organization!.trim(),
      expertise: payload.expertise && payload.expertise.length > 0 ? payload.expertise : ["DeepTech", "Venture Strategy"],
      email: payload.email || "mentor@aic.apex.edu",
      phone: payload.phone || "+91 99999 11111",
      totalSessionsConducted: 0,
      rating: 5.0,
      availabilityStatus: payload.availabilityStatus || "AVAILABLE",
    };

    store.mentors.unshift(mentor);
    writeStore(store);
    return mentor;
  },

  getMentorSessions(startupId?: string): MentorSession[] {
    const store = readStore();
    const sessions = store.mentorSessions || [];
    if (startupId) {
      return sessions.filter((s) => s.startupId === startupId);
    }
    return sessions;
  },

  scheduleMentorSession(payload: Partial<MentorSession>): MentorSession {
    const validation = validateMentorSession(payload);
    if (!validation.isValid) {
      throw new Error(`Mentor Session Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.mentorSessions) store.mentorSessions = [];

    const mentor = store.mentors?.find((m) => m.id === payload.mentorId);
    const startup = store.startups.find((s) => s.id === payload.startupId);
    if (!startup) throw new Error(`Venture with ID ${payload.startupId} not found.`);

    const session: MentorSession = {
      id: `ses-${Date.now()}`,
      sessionRef: `SES-2026-${Math.floor(100 + Math.random() * 900)}`,
      mentorId: payload.mentorId!,
      mentorName: mentor ? mentor.mentorName : (payload.mentorName || "Designated EIR"),
      startupId: startup.id,
      startupName: startup.startupName,
      scheduledDate: payload.scheduledDate!,
      durationMinutes: Number(payload.durationMinutes) || 45,
      discussionTopic: payload.discussionTopic!.trim(),
      keyTakeaways: payload.keyTakeaways || "",
      actionItems: payload.actionItems || "",
      status: "SCHEDULED",
    };

    store.mentorSessions.unshift(session);
    if (mentor) {
      mentor.totalSessionsConducted = (mentor.totalSessionsConducted || 0) + 1;
    }
    writeStore(store);
    return session;
  },

  completeMentorSession(id: string, keyTakeaways: string, actionItems: string): MentorSession {
    const store = readStore();
    if (!store.mentorSessions) store.mentorSessions = [];
    const session = store.mentorSessions.find((s) => s.id === id);
    if (!session) throw new Error(`Mentor session with ID ${id} not found.`);

    session.status = "COMPLETED";
    session.keyTakeaways = keyTakeaways.trim();
    session.actionItems = actionItems.trim();

    writeStore(store);
    return session;
  },

  // Seed Fund Schemes
  getGrantSchemes(): SeedFundScheme[] {
    const store = readStore();
    return store.grantSchemes || [];
  },

  // Investor Pitch Vault & Expressions of Interest
  getInvestorEOIs(startupId?: string): InvestorEOI[] {
    const store = readStore();
    const eois = store.investorEOIs || [];
    if (startupId) {
      return eois.filter((e) => e.startupId === startupId);
    }
    return eois;
  },

  logInvestorEOI(payload: Partial<InvestorEOI>): InvestorEOI {
    const validation = validateInvestorEOI(payload);
    if (!validation.isValid) {
      throw new Error(`Investor EOI Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.investorEOIs) store.investorEOIs = [];

    const startup = store.startups.find((s) => s.id === payload.startupId);
    if (!startup) throw new Error(`Venture with ID ${payload.startupId} not found.`);

    const eoi: InvestorEOI = {
      id: `eoi-${Date.now()}`,
      eoiRef: `EOI-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupId: startup.id,
      startupName: startup.startupName,
      investorFirm: payload.investorFirm!.trim(),
      partnerName: payload.partnerName!.trim(),
      contactEmail: payload.contactEmail!.trim(),
      indicatedChequeAmount: Number(payload.indicatedChequeAmount),
      proposedValuationCap: Number(payload.proposedValuationCap) || Number(payload.indicatedChequeAmount) * 10,
      stageInterest: payload.stageInterest || "SEED",
      dueDiligenceStatus: payload.dueDiligenceStatus || "EXPRESSION_SUBMITTED",
      submittedAt: new Date().toISOString(),
    };

    store.investorEOIs.unshift(eoi);
    writeStore(store);
    return eoi;
  },

  updateInvestorEOI(id: string, status: string): InvestorEOI {
    const store = readStore();
    if (!store.investorEOIs) store.investorEOIs = [];
    const eoi = store.investorEOIs.find((e) => e.id === id);
    if (!eoi) throw new Error(`Investor EOI with ID ${id} not found.`);

    eoi.dueDiligenceStatus = status as any;
    writeStore(store);
    return eoi;
  },

  resetStore() {
    const initial: IncubationStoreSchema = {
      startups: JSON.parse(JSON.stringify(DEFAULT_STARTUPS)),
      desks: JSON.parse(JSON.stringify(DEFAULT_DESKS)),
      tranches: JSON.parse(JSON.stringify(DEFAULT_TRANCHES)),
      patents: JSON.parse(JSON.stringify(DEFAULT_PATENTS)),
      milestoneReviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)),
      applications: JSON.parse(JSON.stringify(DEFAULT_APPLICATIONS)),
      mentors: JSON.parse(JSON.stringify(DEFAULT_MENTORS)),
      mentorSessions: JSON.parse(JSON.stringify(DEFAULT_MENTOR_SESSIONS)),
      grantSchemes: JSON.parse(JSON.stringify(DEFAULT_GRANT_SCHEMES)),
      investorEOIs: JSON.parse(JSON.stringify(DEFAULT_INVESTOR_EOIS)),
    };
    writeStore(initial);
    return initial;
  },
};
