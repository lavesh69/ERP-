import fs from "fs";
import path from "path";
import {
  VisitorPass,
  SecurityGate,
  generateVisitorPassQr,
  validateVisitorInput,
  PassStatus,
} from "./security-engine";

const DATA_DIR = path.join(process.cwd(), "data", "security");
const STORE_FILE = path.join(DATA_DIR, "security_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface SecurityStoreSchema {
  gates: SecurityGate[];
  passes: VisitorPass[];
}

const DEFAULT_GATES: SecurityGate[] = [
  {
    id: "gt-01",
    name: "Main North Arch Gate",
    location: "Campus University Boulevard Entry",
    guardOnDuty: "Officer Daniel Miller (Security Lead)",
    activePassesCount: 2,
  },
  {
    id: "gt-02",
    name: "South Technology Park Gate",
    location: "South Entrance near Research Labs",
    guardOnDuty: "Officer Samuel Jackson",
    activePassesCount: 0,
  },
  {
    id: "gt-03",
    name: "Residential Halls Perimeter Kiosk",
    location: "West Perimeter between Hostel Blocks",
    guardOnDuty: "Officer Robert Henderson",
    activePassesCount: 1,
  },
];

const DEFAULT_PASSES: VisitorPass[] = [
  {
    id: "vp-01",
    passNumber: "VTR-2026-401",
    visitorName: "Dr. Ronald Sterling",
    contactPhone: "+1 (555) 332-9911",
    idProofType: "NATIONAL_ID",
    idProofNumber: "ID-US-998822",
    visitorType: "OFFICIAL_DELEGATION",
    hostName: "Director Arthur Pendleton",
    hostDepartment: "Directorate & Executive Office",
    purposeOfVisit: "Annual Institutional Governance & ABET Accreditation Audit",
    vehicleNumber: "MA-774-NX",
    checkInTime: "2026-10-06T09:15:00.000Z",
    validUntil: "2026-10-06T18:00:00.000Z",
    entryGate: "Main North Arch Gate",
    status: "ACTIVE_ON_CAMPUS",
    digitalSeal: "SEC-PASS-9B4E38F102AA19CD",
  },
  {
    id: "vp-02",
    passNumber: "VTR-2026-402",
    visitorName: "Katherine Mercer",
    contactPhone: "+1 (555) 998-1122",
    idProofType: "DRIVING_LICENSE",
    idProofNumber: "DL-MA-88412",
    visitorType: "PARENT",
    hostName: "Alex Mercer",
    hostDepartment: "Student Life & Hostel Block A",
    purposeOfVisit: "Parent meeting and residence life visit",
    vehicleNumber: "MA-442-TT",
    checkInTime: "2026-10-06T11:00:00.000Z",
    validUntil: "2026-10-06T16:00:00.000Z",
    entryGate: "Main North Arch Gate",
    status: "ACTIVE_ON_CAMPUS",
    digitalSeal: "SEC-PASS-87AC19EE34D908FF",
  },
];

function readStore(): SecurityStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: SecurityStoreSchema = {
      gates: DEFAULT_GATES,
      passes: DEFAULT_PASSES,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading security store, using defaults", err);
    return {
      gates: DEFAULT_GATES,
      passes: DEFAULT_PASSES,
    };
  }
}

function writeStore(data: SecurityStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const securityStore = {
  getSummary() {
    const store = readStore();
    const activeVisitors = store.passes.filter((p) => p.status === "ACTIVE_ON_CAMPUS").length;
    const checkedOutToday = store.passes.filter((p) => p.status === "CHECKED_OUT").length;

    return {
      totalGates: store.gates.length,
      activeVisitors,
      checkedOutToday,
      totalPassesIssued: store.passes.length,
      gates: store.gates,
    };
  },

  getGates() {
    return readStore().gates;
  },

  getPasses(status?: PassStatus) {
    const store = readStore();
    if (status) {
      return store.passes.filter((p) => p.status === status);
    }
    return store.passes;
  },

  issuePass(payload: Partial<VisitorPass>) {
    const validation = validateVisitorInput(payload);
    if (!validation.isValid) {
      throw new Error(`Gate Pass Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const validUntil = payload.validUntil || new Date(Date.now() + 8 * 3600 * 1000).toISOString();
    const seal = generateVisitorPassQr(payload.visitorName!, payload.hostName!, validUntil);

    const newPass: VisitorPass = {
      id: `vp-${Date.now()}`,
      passNumber: `VTR-2026-${Math.floor(100 + Math.random() * 900)}`,
      visitorName: payload.visitorName!,
      contactPhone: payload.contactPhone!,
      idProofType: payload.idProofType || "NATIONAL_ID",
      idProofNumber: payload.idProofNumber || "ID-VERIFIED",
      visitorType: payload.visitorType || "OFFICIAL_DELEGATION",
      hostName: payload.hostName!,
      hostDepartment: payload.hostDepartment || "Campus Department",
      purposeOfVisit: payload.purposeOfVisit!,
      vehicleNumber: payload.vehicleNumber || "None (Pedestrian)",
      checkInTime: new Date().toISOString(),
      validUntil,
      entryGate: payload.entryGate || "Main North Arch Gate",
      status: "ACTIVE_ON_CAMPUS",
      digitalSeal: seal,
    };

    store.passes.unshift(newPass);
    writeStore(store);
    return newPass;
  },

  checkOutVisitor(passId: string) {
    const store = readStore();
    const pass = store.passes.find((p) => p.id === passId);
    if (!pass) {
      throw new Error("Visitor pass not found in campus registry.");
    }

    pass.status = "CHECKED_OUT";
    pass.checkOutTime = new Date().toISOString();
    writeStore(store);
    return pass;
  },
};
