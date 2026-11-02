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
  calculateIncubationPortfolioMetrics,
  validateStartupApplication,
  validateIncubationStageTransition,
  validateGrantTranche,
  validatePatentDisclosure,
  validateMilestoneReview,
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

function readStore(): IncubationStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: IncubationStoreSchema = {
      startups: JSON.parse(JSON.stringify(DEFAULT_STARTUPS)),
      desks: JSON.parse(JSON.stringify(DEFAULT_DESKS)),
      tranches: JSON.parse(JSON.stringify(DEFAULT_TRANCHES)),
      patents: JSON.parse(JSON.stringify(DEFAULT_PATENTS)),
      milestoneReviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)),
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

  resetStore() {
    const initial: IncubationStoreSchema = {
      startups: JSON.parse(JSON.stringify(DEFAULT_STARTUPS)),
      desks: JSON.parse(JSON.stringify(DEFAULT_DESKS)),
      tranches: JSON.parse(JSON.stringify(DEFAULT_TRANCHES)),
      patents: JSON.parse(JSON.stringify(DEFAULT_PATENTS)),
      milestoneReviews: JSON.parse(JSON.stringify(DEFAULT_REVIEWS)),
    };
    writeStore(initial);
    return initial;
  },
};
