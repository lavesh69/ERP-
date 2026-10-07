import fs from "fs";
import path from "path";
import {
  PartnerUniversity,
  ExchangeStudent,
  ExchangeType,
  ExchangeStatus,
  checkVisaFrroCompliance,
} from "./international-engine";

const DATA_DIR = path.join(process.cwd(), "data", "international");
const STORE_FILE = path.join(DATA_DIR, "international_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface InternationalStoreSchema {
  partners: PartnerUniversity[];
  students: ExchangeStudent[];
}

const DEFAULT_PARTNERS: PartnerUniversity[] = [
  {
    id: "part-01",
    institutionName: "Technical University of Munich (TUM)",
    country: "Germany",
    city: "Munich",
    qsWorldRanking: 37,
    mouSigningDate: "2023-09-15",
    mouExpiryDate: "2028-09-14",
    isActive: true,
    cooperationAreas: ["Student Exchange", "Joint Research", "Faculty Mobility"],
    exchangeSeatsPerYear: 6,
  },
  {
    id: "part-02",
    institutionName: "National University of Singapore (NUS)",
    country: "Singapore",
    city: "Singapore",
    qsWorldRanking: 8,
    mouSigningDate: "2022-04-10",
    mouExpiryDate: "2027-04-09",
    isActive: true,
    cooperationAreas: ["Student Exchange", "Dual Degree MS/PhD", "AI Research Lab"],
    exchangeSeatsPerYear: 4,
  },
  {
    id: "part-03",
    institutionName: "University of Waterloo",
    country: "Canada",
    city: "Waterloo",
    qsWorldRanking: 112,
    mouSigningDate: "2024-01-20",
    mouExpiryDate: "2029-01-19",
    isActive: true,
    cooperationAreas: ["Co-op Internship Exchange", "Quantum Computing Joint Grant"],
    exchangeSeatsPerYear: 8,
  },
];

const DEFAULT_STUDENTS: ExchangeStudent[] = [
  {
    id: "ex-01",
    applicationRef: "IRO-2026-301",
    type: "OUTBOUND",
    studentName: "Alex Mercer",
    studentRollOrId: "CS2026-001",
    homeUniversity: "Apex Autonomous University",
    hostUniversity: "Technical University of Munich (TUM)",
    program: "B.Tech Computer Science & Engineering",
    targetSemester: "Spring 2027",
    creditsMapped: 18,
    status: "STUDYING_ABROAD",
    passportNumber: "Z9921448",
    visaExpiryDate: "2027-08-31",
    frroStatus: "NOT_APPLICABLE",
    scholarshipGrantAmount: 3500,
    createdAt: "2026-08-10T10:00:00.000Z",
  },
  {
    id: "ex-02",
    applicationRef: "IRO-2026-302",
    type: "INBOUND",
    studentName: "Liam Van Der Bilt",
    studentRollOrId: "INB-TUM-901",
    homeUniversity: "Technical University of Munich (TUM)",
    hostUniversity: "Apex Autonomous University",
    program: "Exchange Fellow in Robotics",
    targetSemester: "Fall 2026",
    creditsMapped: 16,
    status: "STUDYING_ABROAD",
    passportNumber: "DE7739120",
    visaExpiryDate: "2026-12-20",
    frroStatus: "COMPLIANT",
    scholarshipGrantAmount: 1500,
    createdAt: "2026-07-15T12:00:00.000Z",
  },
];

function readStore(): InternationalStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: InternationalStoreSchema = {
      partners: DEFAULT_PARTNERS,
      students: DEFAULT_STUDENTS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[InternationalStore Read Error]:", err);
    return { partners: DEFAULT_PARTNERS, students: DEFAULT_STUDENTS };
  }
}

function writeStore(data: InternationalStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const internationalStore = {
  getSummary() {
    const store = readStore();
    const outboundCount = store.students.filter((s) => s.type === "OUTBOUND").length;
    const inboundCount = store.students.filter((s) => s.type === "INBOUND").length;

    let alertsCount = 0;
    for (const s of store.students) {
      const check = checkVisaFrroCompliance(s.visaExpiryDate, s.frroStatus);
      if (check.alertLevel !== "NORMAL") {
        alertsCount++;
      }
    }

    return {
      totalPartnerUniversities: store.partners.length,
      outboundExchangeStudents: outboundCount,
      inboundForeignStudents: inboundCount,
      visaRegulatoryAlerts: alertsCount,
      activeMousCount: store.partners.filter((p) => p.isActive).length,
    };
  },

  getPartners() {
    return readStore().partners;
  },

  getStudents(type?: ExchangeType) {
    const store = readStore();
    if (type) {
      return store.students.filter((s) => s.type === type);
    }
    return store.students;
  },

  submitApplication(payload: Partial<ExchangeStudent>) {
    const store = readStore();
    const newStudent: ExchangeStudent = {
      id: `ex-${Date.now()}`,
      applicationRef: `IRO-2026-${Math.floor(100 + Math.random() * 900)}`,
      type: payload.type || "OUTBOUND",
      studentName: payload.studentName!,
      studentRollOrId: payload.studentRollOrId || "CS2026-999",
      homeUniversity: payload.homeUniversity || "Apex Autonomous University",
      hostUniversity: payload.hostUniversity!,
      program: payload.program || "B.Tech Computer Science & Engineering",
      targetSemester: payload.targetSemester || "Spring 2027",
      creditsMapped: Number(payload.creditsMapped) || 16,
      status: "NOMINATED",
      passportNumber: payload.passportNumber || "P-APEX-VALID",
      visaExpiryDate: payload.visaExpiryDate || "2027-06-30",
      frroStatus: payload.frroStatus || "NOT_APPLICABLE",
      scholarshipGrantAmount: Number(payload.scholarshipGrantAmount) || 2000,
      createdAt: new Date().toISOString(),
    };

    store.students.unshift(newStudent);
    writeStore(store);
    return newStudent;
  },

  updateStatus(id: string, status: ExchangeStatus) {
    const store = readStore();
    const student = store.students.find((s) => s.id === id);
    if (!student) {
      throw new Error(`Exchange student record with ID ${id} not found`);
    }

    student.status = status;
    writeStore(store);
    return student;
  },
};
