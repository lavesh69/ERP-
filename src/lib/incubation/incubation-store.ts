import fs from "fs";
import path from "path";
import {
  IncubatedStartup,
  IncubationStage,
  calculateIncubationPortfolioMetrics,
  validateStartupApplication,
  validateIncubationStageTransition,
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

function readStore(): IncubationStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: IncubationStoreSchema = { startups: DEFAULT_STARTUPS };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[IncubationStore Read Error]:", err);
    return { startups: DEFAULT_STARTUPS };
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
      throw new Error(`A venture named '${payload.startupName}' is already registered in the university incubator.`);
    }

    const newStartup: IncubatedStartup = {
      id: `st-${Date.now()}`,
      companyRef: `VENT-2026-${Math.floor(100 + Math.random() * 900)}`,
      startupName: payload.startupName!,
      founderName: payload.founderName!,
      founderRollOrStaffId: payload.founderRollOrStaffId || "STU-2026",
      founderRole: payload.founderRole || "STUDENT",
      sector: payload.sector || "AI_ML",
      stage: payload.stage || "INCUBATED_PROTOTYPE",
      pitchDeckSummary: payload.pitchDeckSummary!,
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
};
