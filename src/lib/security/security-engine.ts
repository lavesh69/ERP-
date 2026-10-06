/**
 * Enterprise Campus Security, Gate Access & Visitor Pass Engine
 * Issues cryptographic visitor passes, logs vehicle entry/exit, and monitors active campus footprint.
 */

import crypto from "crypto";

export type VisitorType = "GUEST_SPEAKER" | "PARENT" | "VENDOR_DELIVERY" | "CONTRACTOR" | "OFFICIAL_DELEGATION";
export type PassStatus = "ACTIVE_ON_CAMPUS" | "CHECKED_OUT" | "OVERSTAY_ALERT";

export interface VisitorPass {
  id: string;
  passNumber: string;
  visitorName: string;
  contactPhone: string;
  idProofType: "NATIONAL_ID" | "DRIVING_LICENSE" | "PASSPORT";
  idProofNumber: string;
  visitorType: VisitorType;
  hostName: string;
  hostDepartment: string;
  purposeOfVisit: string;
  vehicleNumber?: string;
  checkInTime: string;
  checkOutTime?: string;
  validUntil: string;
  entryGate: string;
  status: PassStatus;
  digitalSeal: string;
}

export interface SecurityGate {
  id: string;
  name: string;
  location: string;
  guardOnDuty: string;
  activePassesCount: number;
}

/**
 * Generates cryptographic digital seal for verifiable QR gate passes
 */
export function generateVisitorPassQr(
  visitorName: string,
  hostName: string,
  validUntil: string
): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${visitorName}:${hostName}:${validUntil}:APEX-CAMPUS-SECURITY`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  return `SEC-PASS-${hash}`;
}

/**
 * Validates visitor gate pass application data
 */
export function validateVisitorInput(data: Partial<VisitorPass>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.visitorName || data.visitorName.trim().length === 0) {
    errors.push("Visitor full legal name is required.");
  }
  if (!data.contactPhone || data.contactPhone.trim().length < 8) {
    errors.push("Visitor contact telephone is required.");
  }
  if (!data.hostName || data.hostName.trim().length === 0) {
    errors.push("Campus host faculty or department contact is required.");
  }
  if (!data.purposeOfVisit || data.purposeOfVisit.trim().length < 4) {
    errors.push("Purpose of campus visit must be specified.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
