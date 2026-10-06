/**
 * Enterprise Transport & Fleet Management Engine
 * Implements GPS telemetry tracking, route optimization, digital pass cryptography, and regulatory compliance.
 */

import crypto from "crypto";

export type VehicleType = "BUS" | "MINI_BUS" | "VAN" | "ELECTRIC_BUS";
export type VehicleStatus = "ACTIVE_EN_ROUTE" | "ON_CAMPUS" | "MAINTENANCE" | "OUT_OF_SERVICE";
export type PassStatus = "ACTIVE" | "EXPIRED" | "SUSPENDED" | "PENDING_APPROVAL";

export interface RouteStop {
  stopName: string;
  landmark: string;
  morningPickupTime: string; // "07:15 AM"
  eveningDropTime: string;   // "05:45 PM"
  sequenceOrder: number;
  distanceKmFromCampus: number;
}

export interface TransportVehicle {
  id: string;
  registrationNumber: string;
  vehicleCode: string;
  type: VehicleType;
  capacity: number;
  currentPassengers: number;
  fuelType: "DIESEL" | "ELECTRIC" | "CNG";
  driverName: string;
  driverPhone: string;
  driverLicense: string;
  attendantName: string;
  attendantPhone: string;
  status: VehicleStatus;
  gpsLat: number;
  gpsLng: number;
  speedKmH: number;
  batteryOrFuelLevel: number; // percentage
  nextFcDate: string;
  insuranceExpiry: string;
  pucExpiry: string;
}

export interface TransportRoute {
  id: string;
  routeNumber: string;
  routeName: string;
  startingPoint: string;
  destination: string;
  totalDistanceKm: number;
  morningStartTime: string;
  eveningDepartureTime: string;
  assignedVehicleId: string;
  assignedVehicleCode: string;
  assignedDriverName: string;
  stops: RouteStop[];
  totalRegisteredStudents: number;
}

export interface StudentBusPass {
  id: string;
  passNumber: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  routeId: string;
  routeNumber: string;
  stopName: string;
  academicYear: string;
  validUntil: string;
  status: PassStatus;
  feeAmount: number;
  feeStatus: "PAID" | "PENDING";
  qrCodeFingerprint: string;
  issuedAt: string;
}

export interface FleetMaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  serviceType: string;
  date: string;
  odometerKm: number;
  cost: number;
  workshopName: string;
  notes: string;
}

/**
 * Calculates route occupancy and flags overload safety hazards
 */
export function calculateRouteOccupancy(vehicleCapacity: number, registeredCount: number) {
  const rate = vehicleCapacity > 0 ? (registeredCount / vehicleCapacity) * 100 : 0;
  return {
    capacity: vehicleCapacity,
    registeredCount,
    occupancyRate: Math.round(rate * 10) / 10,
    isOverloaded: registeredCount > vehicleCapacity,
    availableSeats: Math.max(0, vehicleCapacity - registeredCount),
  };
}

/**
 * Generates a cryptographic verification seal for student digital bus pass
 * Conductors scan this QR to verify authenticity offline.
 */
export function generateBusPassFingerprint(studentRoll: string, routeNumber: string, validUntil: string): string {
  const payload = `BUSPASS::${studentRoll}::${routeNumber}::${validUntil}::VERIFIED_CAMPUS_ERP`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 32);
}

/**
 * Validates vehicular fitness, PUC, and insurance for safety compliance
 */
export function checkVehicleComplianceAlerts(vehicle: TransportVehicle): {
  isFitnessExpired: boolean;
  isInsuranceExpired: boolean;
  isPucExpired: boolean;
  alerts: string[];
} {
  const now = new Date().getTime();
  const fcTime = new Date(vehicle.nextFcDate).getTime();
  const insTime = new Date(vehicle.insuranceExpiry).getTime();
  const pucTime = new Date(vehicle.pucExpiry).getTime();

  const isFitnessExpired = fcTime < now;
  const isInsuranceExpired = insTime < now;
  const isPucExpired = pucTime < now;

  const alerts: string[] = [];
  if (isFitnessExpired) alerts.push(`Fitness Certificate (FC) expired on ${vehicle.nextFcDate}`);
  if (isInsuranceExpired) alerts.push(`Insurance policy expired on ${vehicle.insuranceExpiry}`);
  if (isPucExpired) alerts.push(`Pollution emission certificate (PUC) expired on ${vehicle.pucExpiry}`);

  return {
    isFitnessExpired,
    isInsuranceExpired,
    isPucExpired,
    alerts,
  };
}

/**
 * Validates bus pass application inputs
 */
export function validateBusPassApplication(app: Partial<StudentBusPass>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!app.studentName || app.studentName.trim().length === 0) {
    errors.push("Student name is required.");
  }
  if (!app.studentRoll || app.studentRoll.trim().length === 0) {
    errors.push("Roll number is required.");
  }
  if (!app.routeId || !app.routeNumber) {
    errors.push("Designated transit route is required.");
  }
  if (!app.stopName || app.stopName.trim().length === 0) {
    errors.push("Designated boarding stop is required.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
