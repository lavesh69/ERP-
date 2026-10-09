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

export interface PharmacyItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minThreshold: number;
  unit: string;
  expiry: string;
  batch: string;
}

interface ClinicStoreSchema {
  emergencyProfiles: MedicalEmergencyRecord[];
  consultations: ClinicConsultation[];
  beds: SickBayBed[];
  pharmacyStock?: PharmacyItem[];
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

export const DEFAULT_PHARMACY: PharmacyItem[] = [
  { id: "MED-01", name: "Paracetamol 650mg Tabs", category: "Analgesic / Antipyretic", stock: 85, minThreshold: 30, unit: "tablets", expiry: "2027-08", batch: "BATCH-PCM-89" },
  { id: "MED-02", name: "ORS Oral Rehydration Salts", category: "Electrolyte Replenisher", stock: 12, minThreshold: 25, unit: "sachets", expiry: "2026-12", batch: "BATCH-ORS-21" },
  { id: "MED-03", name: "Amoxicillin 500mg Caps", category: "Antibiotic", stock: 42, minThreshold: 20, unit: "capsules", expiry: "2027-04", batch: "BATCH-AMX-77" },
  { id: "MED-04", name: "Cetirizine 10mg Tabs", category: "Antihistamine / Allergy", stock: 16, minThreshold: 20, unit: "tablets", expiry: "2026-11", batch: "BATCH-CTZ-09" },
  { id: "MED-05", name: "Betadine 10% Ointment", category: "Antiseptic Microbicide", stock: 58, minThreshold: 15, unit: "tubes", expiry: "2028-01", batch: "BATCH-BTD-45" },
  { id: "MED-06", name: "Sterile Gauze & Bandage Packs", category: "First Aid & Trauma", stock: 120, minThreshold: 40, unit: "packs", expiry: "2029-06", batch: "BATCH-GBZ-12" },
];

function readStore(): ClinicStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: ClinicStoreSchema = {
      emergencyProfiles: DEFAULT_PROFILES,
      consultations: DEFAULT_CONSULTATIONS,
      beds: DEFAULT_BEDS,
      pharmacyStock: DEFAULT_PHARMACY,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed: ClinicStoreSchema = JSON.parse(raw);
    if (!parsed.pharmacyStock || !Array.isArray(parsed.pharmacyStock)) {
      parsed.pharmacyStock = DEFAULT_PHARMACY;
      writeStore(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading clinic store, using defaults", err);
    return {
      emergencyProfiles: DEFAULT_PROFILES,
      consultations: DEFAULT_CONSULTATIONS,
      beds: DEFAULT_BEDS,
      pharmacyStock: DEFAULT_PHARMACY,
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

  dischargeBed(bedId: string) {
    const store = readStore();
    const bed = store.beds.find((b) => b.id === bedId);
    if (!bed) {
      throw new Error(`Bed with ID ${bedId} not found`);
    }
    const patientName = bed.patientName;
    bed.isOccupied = false;
    bed.patientName = undefined;
    bed.admittedAt = undefined;

    if (patientName) {
      const activeCons = store.consultations.find(
        (c) => c.patientName.toLowerCase() === patientName.toLowerCase() && c.status === "ADMITTED_SICK_BAY"
      );
      if (activeCons) {
        activeCons.status = "TREATED_DISCHARGED";
      }
    }

    writeStore(store);
    return bed;
  },

  getPharmacyStock(): PharmacyItem[] {
    const store = readStore();
    return store.pharmacyStock || DEFAULT_PHARMACY;
  },

  dispenseMedicine(medId: string, quantity: number = 2) {
    const store = readStore();
    if (!store.pharmacyStock) store.pharmacyStock = [...DEFAULT_PHARMACY];
    const med = store.pharmacyStock.find((m) => m.id === medId);
    if (!med) {
      throw new Error(`Medicine ${medId} not found in pharmacy repository`);
    }
    med.stock = Math.max(0, med.stock - quantity);
    writeStore(store);
    return med;
  },

  restockMedicine(medId: string, quantity: number = 50) {
    const store = readStore();
    if (!store.pharmacyStock) store.pharmacyStock = [...DEFAULT_PHARMACY];
    const med = store.pharmacyStock.find((m) => m.id === medId);
    if (!med) {
      throw new Error(`Medicine ${medId} not found in pharmacy repository`);
    }
    med.stock += quantity;
    writeStore(store);
    return med;
  },
};
