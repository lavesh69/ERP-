/**
 * Enterprise Campus Clinic & Student Health Wellness Engine
 * Manages electronic health records (EMR), outpatient consultations, triage vitals, and infirmary sick-bay beds.
 */

export interface MedicalEmergencyRecord {
  id: string;
  patientId: string;
  name: string;
  rollOrEmpId: string;
  role: "STUDENT" | "FACULTY" | "STAFF";
  bloodGroup: string;
  knownAllergies: string[];
  chronicConditions: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  isInsured: boolean;
}

export interface PrescribedMedicine {
  name: string;
  dosage: string;
  frequency: string;
  days: number;
}

export interface ClinicConsultation {
  id: string;
  caseNo: string;
  patientName: string;
  patientRoll: string;
  visitDate: string;
  chiefComplaint: string;
  vitals: {
    bp: string;          // e.g. "120/80"
    pulseRate: number;   // e.g. 74 bpm
    temperatureF: number;// e.g. 98.6 F
    spo2Percent: number; // e.g. 99%
  };
  diagnosis: string;
  prescriptions: PrescribedMedicine[];
  attendingDoctor: string;
  requiresSickBayAdmit: boolean;
  status: "TREATED_DISCHARGED" | "ADMITTED_SICK_BAY" | "REFERRED_HOSPITAL";
}

export interface SickBayBed {
  id: string;
  bedNumber: string;
  roomNumber: string;
  isOccupied: boolean;
  patientName?: string;
  admittedAt?: string;
}

export type TriageUrgencyLevel = "ROUTINE" | "URGENT" | "CRITICAL";

export function checkTriageUrgency(vitals: ClinicConsultation["vitals"]): {
  isCritical: boolean;
  level: TriageUrgencyLevel;
  recommendation: string;
  flags: string[];
  redFlags: string[];
} {
  const flags: string[] = [];
  let isSevere = false;

  if (vitals.temperatureF >= 103.5) {
    flags.push(`Hyperpyrexia (Fever ${vitals.temperatureF}°F)`);
    isSevere = true;
  } else if (vitals.temperatureF >= 101.0) {
    flags.push(`Elevated temperature (${vitals.temperatureF}°F)`);
  }

  if (vitals.spo2Percent < 90) {
    flags.push(`Severe hypoxia detected (SpO2 ${vitals.spo2Percent}%)`);
    isSevere = true;
  } else if (vitals.spo2Percent < 95) {
    flags.push(`Mild hypoxia (SpO2 ${vitals.spo2Percent}%)`);
  }

  if (vitals.pulseRate > 130 || vitals.pulseRate < 45) {
    flags.push(`Critical cardiac rhythm (${vitals.pulseRate} bpm)`);
    isSevere = true;
  } else if (vitals.pulseRate > 105 || vitals.pulseRate < 55) {
    flags.push(`Tachycardia/Bradycardia (${vitals.pulseRate} bpm)`);
  }

  const bpParts = vitals.bp.split("/");
  if (bpParts.length === 2) {
    const systolic = parseInt(bpParts[0], 10);
    const diastolic = parseInt(bpParts[1], 10);
    if (systolic >= 180 || diastolic >= 110) {
      flags.push(`Hypertensive crisis (${vitals.bp} mmHg)`);
      isSevere = true;
    } else if (systolic >= 140 || diastolic >= 90) {
      flags.push(`Elevated blood pressure (${vitals.bp} mmHg)`);
    }
  }

  const level: TriageUrgencyLevel = isSevere
    ? "CRITICAL"
    : flags.length > 0
    ? "URGENT"
    : "ROUTINE";

  const recommendation =
    level === "CRITICAL"
      ? "Immediate physician stabilization & ambulance hospital referral required."
      : level === "URGENT"
      ? "Infirmary bed observation, oral rehydration/antipyretics, and repeat vitals every 30 mins."
      : "Standard outpatient consultation, discharge with prescription medication.";

  return {
    isCritical: flags.length > 0,
    level,
    recommendation,
    flags,
    redFlags: flags,
  };
}

/**
 * Validates consultation form entries
 */
export function validateConsultationInput(c: Partial<ClinicConsultation>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!c.patientName || c.patientName.trim().length === 0) {
    errors.push("Patient name is required.");
  }
  if (!c.chiefComplaint || c.chiefComplaint.trim().length < 5) {
    errors.push("Chief medical complaint must be described.");
  }
  if (!c.diagnosis || c.diagnosis.trim().length === 0) {
    errors.push("Clinical diagnosis is required.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
