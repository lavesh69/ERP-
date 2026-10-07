/**
 * Enterprise Campus Emergency Broadcast, Disaster Management & Clery Act Safety Engine
 * Handles statutory mass emergency alerts, multi-channel siren/SMS dispatches,
 * and building evacuation muster-point accountability.
 */

import crypto from "crypto";

export type AlertSeverity = "CRITICAL_EVACUATION" | "HIGH_WARNING" | "ADVISORY" | "CAMPUS_ALL_CLEAR";

export type EmergencyCategory =
  | "FIRE_EVACUATION"
  | "SEVERE_WEATHER_ALERT"
  | "CAMPUS_SECURITY_LOCKDOWN"
  | "MEDICAL_HAZARD"
  | "INFRASTRUCTURE_FAILURE"
  | "DRILL_SIMULATION";

export type BroadcastChannel = "SMS_GATEWAY" | "CAMPUS_SIRENS" | "MOBILE_APP_PUSH" | "PA_AUDIO_SYSTEM" | "EMERGENCY_EMAILS";

export interface EmergencyAlert {
  id: string;
  alertCode: string;
  category: EmergencyCategory;
  severity: AlertSeverity;
  headline: string;
  instructions: string;
  affectedZones: string[]; // e.g. ["Hostel Block A", "Science Complex", "North Gate"]
  dispatchedChannels: BroadcastChannel[];
  initiatedBy: string;
  initiatedAt: string;
  isActive: boolean;
  resolvedAt?: string;
  cryptographicBroadcastSeal: string;
}

export interface MusterPoint {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  currentEvacueesCount: number;
  assignedWarden: string;
  wardenPhone: string;
  status: "SAFE_ASSEMBLED" | "EVACUATING" | "UNACCOUNTED_PERSONS_REPORTED";
}

/**
 * Validates emergency alert broadcast parameters before trigger
 */
export function validateEmergencyBroadcast(data: Partial<EmergencyAlert>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.headline || data.headline.trim().length < 5) {
    errors.push("Emergency headline must be at least 5 characters");
  }

  if (!data.instructions || data.instructions.trim().length < 10) {
    errors.push("Actionable life-safety instructions must be at least 10 characters");
  }

  if (!data.affectedZones || data.affectedZones.length === 0) {
    errors.push("At least one campus zone must be designated for alert dispatch");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates cryptographic tamper-proof dispatch seal for statutory Clery Act incident audit logs
 */
export function generateEmergencyDispatchSeal(
  alertCode: string,
  category: EmergencyCategory,
  severity: AlertSeverity,
  timestamp: string
): string {
  const raw = `${alertCode}:${category}:${severity}:${timestamp}:APEX-EOC-SEAL`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16).toUpperCase();
  return `EOC-ALERT-${hash}`;
}

/**
 * Calculates overall campus evacuation muster accountability percentage
 */
export function calculateMusterAccountability(points: MusterPoint[], totalExpectedCampusPopulation: number): {
  totalEvacuatedCount: number;
  totalAccountedPercentage: number;
  safePointsCount: number;
  hasUnaccountedRisk: boolean;
} {
  const totalEvacuatedCount = points.reduce((sum, p) => sum + p.currentEvacueesCount, 0);
  const totalAccountedPercentage =
    totalExpectedCampusPopulation > 0
      ? Math.min(100, Math.round((totalEvacuatedCount / totalExpectedCampusPopulation) * 100))
      : 100;

  const safePointsCount = points.filter((p) => p.status === "SAFE_ASSEMBLED").length;
  const hasUnaccountedRisk = points.some((p) => p.status === "UNACCOUNTED_PERSONS_REPORTED");

  return {
    totalEvacuatedCount,
    totalAccountedPercentage,
    safePointsCount,
    hasUnaccountedRisk,
  };
}
