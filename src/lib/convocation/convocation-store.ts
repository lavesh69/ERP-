import fs from "fs";
import path from "path";
import {
  GraduationCandidate,
  NoDuesDepartment,
  evaluateGraduationEligibility,
  generateDegreeCertificateHash,
} from "./convocation-engine";

const DATA_DIR = path.join(process.cwd(), "data", "convocation");
const STORE_FILE = path.join(DATA_DIR, "convocation_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface ConvocationStoreSchema {
  candidates: GraduationCandidate[];
}

const DEFAULT_CANDIDATES: GraduationCandidate[] = [
  {
    id: "cand-01",
    candidateRef: "CONV-2026-081",
    studentRoll: "CS2026-001",
    fullName: "Alex Mercer",
    program: "B.Tech Computer Science & Engineering",
    departmentCode: "CSE",
    graduatingYear: 2026,
    finalCgpa: 9.24,
    honorsCategory: "FIRST_CLASS_WITH_DISTINCTION",
    isMedalist: true,
    medalType: "GOLD_MEDAL",
    noDuesStatus: {
      LIBRARY: true,
      HOSTEL: true,
      FINANCE: true,
      LABORATORY: true,
      SPORTS_COUNCIL: true,
      ALUMNI_ASSOCIATION: true,
    },
    allClearancesGranted: true,
    convocationRegistered: true,
    robeSize: "L",
    guestPassesCount: 2,
    degreeDispatchMode: "CONVOCATION_IN_PERSON",
    certificateHash: "DEG-CONF-A4F79BC8D10E3321",
  },
  {
    id: "cand-02",
    candidateRef: "CONV-2026-082",
    studentRoll: "CS2026-002",
    fullName: "Sophia Rodriguez",
    program: "B.Tech Computer Science & Engineering",
    departmentCode: "CSE",
    graduatingYear: 2026,
    finalCgpa: 8.82,
    honorsCategory: "FIRST_CLASS_WITH_DISTINCTION",
    isMedalist: false,
    noDuesStatus: {
      LIBRARY: true,
      HOSTEL: false, // Pending room inventory check
      FINANCE: true,
      LABORATORY: true,
      SPORTS_COUNCIL: true,
      ALUMNI_ASSOCIATION: true,
    },
    allClearancesGranted: false,
    convocationRegistered: false,
    guestPassesCount: 0,
    degreeDispatchMode: "CONVOCATION_IN_PERSON",
    certificateHash: "DEG-CONF-E810BB421590FA7A",
  },
  {
    id: "cand-03",
    candidateRef: "CONV-2026-083",
    studentRoll: "ECE2026-015",
    fullName: "Tariq Mansoor",
    program: "B.Tech Electronics & Communication",
    departmentCode: "ECE",
    graduatingYear: 2026,
    finalCgpa: 7.65,
    honorsCategory: "FIRST_CLASS",
    isMedalist: false,
    noDuesStatus: {
      LIBRARY: true,
      HOSTEL: true,
      FINANCE: true,
      LABORATORY: true,
      SPORTS_COUNCIL: true,
      ALUMNI_ASSOCIATION: true,
    },
    allClearancesGranted: true,
    convocationRegistered: true,
    robeSize: "M",
    guestPassesCount: 1,
    degreeDispatchMode: "POSTAL_SPEEDPOST",
    courierTrackingAwb: "SP-IN-88992014-DEL",
    certificateHash: "DEG-CONF-C309117FF619A01B",
  },
];

function readStore(): ConvocationStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: ConvocationStoreSchema = { candidates: DEFAULT_CANDIDATES };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[ConvocationStore Read Error]:", err);
    return { candidates: DEFAULT_CANDIDATES };
  }
}

function writeStore(data: ConvocationStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const convocationStore = {
  getSummary() {
    const store = readStore();
    const totalCandidates = store.candidates.length;
    const fullyCleared = store.candidates.filter((c) => c.allClearancesGranted).length;
    const registered = store.candidates.filter((c) => c.convocationRegistered).length;
    const medalists = store.candidates.filter((c) => c.isMedalist).length;

    return {
      totalCandidates,
      fullyCleared,
      pendingClearances: totalCandidates - fullyCleared,
      registeredForConvocation: registered,
      honorMedalistsCount: medalists,
    };
  },

  getCandidates(roll?: string) {
    const store = readStore();
    if (roll) {
      return store.candidates.filter((c) => c.studentRoll.toLowerCase() === roll.toLowerCase());
    }
    return store.candidates;
  },

  updateClearance(candidateId: string, department: NoDuesDepartment, isCleared: boolean) {
    const store = readStore();
    const candidate = store.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error(`Candidate with id ${candidateId} not found`);
    }

    candidate.noDuesStatus[department] = isCleared;
    const evalResult = evaluateGraduationEligibility(candidate.finalCgpa, candidate.noDuesStatus);
    candidate.allClearancesGranted = evalResult.allClearancesGranted;

    writeStore(store);
    return candidate;
  },

  registerCandidate(
    candidateId: string,
    payload: {
      robeSize: "S" | "M" | "L" | "XL";
      guestPassesCount: number;
      degreeDispatchMode: "CONVOCATION_IN_PERSON" | "POSTAL_SPEEDPOST" | "COLLECT_AT_REGISTRAR";
    }
  ) {
    const store = readStore();
    const candidate = store.candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error(`Candidate with id ${candidateId} not found`);
    }

    if (!candidate.allClearancesGranted) {
      throw new Error("Cannot register for Convocation: pending institutional department clearances exist!");
    }

    candidate.convocationRegistered = true;
    candidate.robeSize = payload.robeSize;
    candidate.guestPassesCount = payload.guestPassesCount;
    candidate.degreeDispatchMode = payload.degreeDispatchMode;

    writeStore(store);
    return candidate;
  },
};
