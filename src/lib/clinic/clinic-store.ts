/**
 * Persistent Data Store for Enterprise Campus Medical Clinic
 * Stores medical health records, consultations, vitals history, and infirmary beds.
 */

import fs from "fs";
import path from "path";
import {
  MedicalEmergencyRecord,
  ClinicConsultation,
  SickBayBed,
  checkTriageUrgency,
  validateConsultationInput,
} from "./clinic-engine";

const DATA_DIR = path.join(process.cwd(), "data", "clinic");
const STORE_FILE = path.join(DATA_DIR, "clinic_records.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface ClinicStoreSchema {
  emergencyProfiles: MedicalEmergencyRecord[];
  consultations: ClinicConsultation[];
  beds: SickBayBed[];
}

const DEFAULT_PROFILES: MedicalEmergencyRecord[] = [
  {
    id: "med-01",
    patientId: "stu-alex-01",
    name: "Alex Mercer",
    rollOrEmpId: "CS2026-001",
    role: "STUDENT",
    bloodGroup: "O+",
    knownAllergies: ["Penicillin", "Peanuts"],
    chronicConditions: ["None"],
    emergencyContactName: "Helena Mercer (Mother)",
    emergencyContactPhone: "+1 (555) 998-1122",
    isInsured: true,
  },
  {
    id: "med-02",
    patientId: "fac-alan-01",
    name: "Dr. Alan Turing",
    rollOrEmpId: "FAC-CS-01",
    role: "FACULTY",
    bloodGroup: "A+",
    knownAllergies: ["Dust Mites"],
    chronicConditions: ["Mild Hypertension"],
    emergencyContactName: "Joan Clarke",
    emergencyContactPhone: "+1 (555) 881-2244",
    isInsured: true,
  },
];

const DEFAULT_CONSULTATIONS: ClinicConsultation[] = [
  {
    id: "cs-01",
    caseNo: "OPD-2026-104",
    patientName: "Alex Mercer",
    patientRoll: "CS2026-001",
    visitDate: "2026-10-04T11:30:00.000Z",
    chiefComplaint: "Acute tension headache with mild eye strain following 12-hour programming marathon",
    vitals: {
      bp: "122/82",
      pulseRate: 76,
      temperatureF: 98.4,
      spo2Percent: 99,
    },
    diagnosis: "Digital eye strain & tension-type cephalea",
    prescriptions: [
      { name: "Paracetamol", dosage: "500mg", frequency: "SOS", days: 3 },
      { name: "Carboxymethylcellulose Eye Drops", dosage: "0.5%", frequency: "TID", days: 5 },
    ],
    attendingDoctor: "Dr. Marcus Welby (Campus Physician)",
    requiresSickBayAdmit: false,
    status: "TREATED_DISCHARGED",
  },
];

const DEFAULT_BEDS: SickBayBed[] = [
  { id: "bed-01", bedNumber: "Bed 1 (Male Wing)", roomNumber: "Clinic Room A", isOccupied: false },
  { id: "bed-02", bedNumber: "Bed 2 (Male Wing)", roomNumber: "Clinic Room A", isOccupied: false },
  { id: "bed-03", bedNumber: "Bed 3 (Female Wing)", roomNumber: "Clinic Room B", isOccupied: false },
  { id: "bed-04", bedNumber: "Bed 4 (Emergency Recovery)", roomNumber: "Triage Bay", isOccupied: false },
];

function readStore(): ClinicStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: ClinicStoreSchema = {
      emergencyProfiles: DEFAULT_PROFILES,
      consultations: DEFAULT_CONSULTATIONS,
      beds: DEFAULT_BEDS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading clinic store, using defaults", err);
    return {
      emergencyProfiles: DEFAULT_PROFILES,
      consultations: DEFAULT_CONSULTATIONS,
      beds: DEFAULT_BEDS,
    };
  }
}

function writeStore(data: ClinicStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const clinicStore = {
  getSummary() {
    const store = readStore();
    const totalConsultations = store.consultations.length;
    const occupiedBeds = store.beds.filter((b) => b.isOccupied).length;

    return {
      totalConsultations,
      totalProfiles: store.emergencyProfiles.length,
      totalBeds: store.beds.length,
      occupiedBeds,
      availableBeds: store.beds.length - occupiedBeds,
      beds: store.beds,
    };
  },

  getConsultations() {
    return readStore().consultations;
  },

  getProfiles() {
    return readStore().emergencyProfiles;
  },

  createConsultation(payload: Partial<ClinicConsultation>) {
    const validation = validateConsultationInput(payload);
    if (!validation.isValid) {
      throw new Error(`Consultation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const newCase: ClinicConsultation = {
      id: `cs-${Date.now()}`,
      caseNo: `OPD-2026-${Math.floor(100 + Math.random() * 900)}`,
      patientName: payload.patientName!,
      patientRoll: payload.patientRoll || "STU-2026",
      visitDate: new Date().toISOString(),
      chiefComplaint: payload.chiefComplaint!,
      vitals: payload.vitals || { bp: "120/80", pulseRate: 72, temperatureF: 98.6, spo2Percent: 99 },
      diagnosis: payload.diagnosis!,
      prescriptions: payload.prescriptions || [],
      attendingDoctor: payload.attendingDoctor || "Campus Medical Officer",
      requiresSickBayAdmit: Boolean(payload.requiresSickBayAdmit),
      status: payload.requiresSickBayAdmit ? "ADMITTED_SICK_BAY" : "TREATED_DISCHARGED",
    };

    if (newCase.requiresSickBayAdmit) {
      const vacantBed = store.beds.find((b) => !b.isOccupied);
      if (vacantBed) {
        vacantBed.isOccupied = true;
        vacantBed.patientName = newCase.patientName;
        vacantBed.admittedAt = new Date().toISOString();
      }
    }

    store.consultations.unshift(newCase);
    writeStore(store);
    return newCase;
  },
};
