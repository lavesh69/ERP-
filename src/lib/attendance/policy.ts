import fs from "fs";
import path from "path";

export interface AttendancePolicy {
  institutionId: string;
  minimumAttendancePercentage: number; // e.g. 75.0
  lateThresholdMinutes: number; // e.g. 15
  countLateAs: "PRESENT" | "HALF_DAY" | "ABSENT";
  countExcusedAs: "PRESENT" | "EXCUSED" | "ABSENT";
  qrRotationSeconds: number; // e.g. 15
  qrExpirySeconds: number; // e.g. 30
  allowedRadiusMeters: number; // e.g. 100
  allowedMethods: string[]; // ["MANUAL", "QR", "BLE", "GEOFENCE", "SMART_COMBO"]
  requireBleForQr: boolean;
  requireGeofenceForQr: boolean;
  correctionWindowDays: number; // e.g. 14
  lockSessionAfterHours: number; // e.g. 24
  updatedAt: string;
}

const DEFAULT_POLICY: AttendancePolicy = {
  institutionId: "inst-apex-01",
  minimumAttendancePercentage: 75.0,
  lateThresholdMinutes: 15,
  countLateAs: "PRESENT",
  countExcusedAs: "PRESENT",
  qrRotationSeconds: 15,
  qrExpirySeconds: 30,
  allowedRadiusMeters: 100,
  allowedMethods: ["MANUAL", "QR", "BLE", "GEOFENCE", "SMART_COMBO"],
  requireBleForQr: false,
  requireGeofenceForQr: false,
  correctionWindowDays: 14,
  lockSessionAfterHours: 24,
  updatedAt: new Date().toISOString(),
};

const POLICY_DIR = path.join(process.cwd(), "data", "policies");

export function getAttendancePolicy(institutionId: string = "inst-apex-01"): AttendancePolicy {
  try {
    const policyFile = path.join(POLICY_DIR, `attendance_${institutionId}.json`);
    if (fs.existsSync(policyFile)) {
      const content = fs.readFileSync(policyFile, "utf-8");
      return { ...DEFAULT_POLICY, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error("Failed to read attendance policy, fallback to default:", err);
  }
  return { ...DEFAULT_POLICY, institutionId };
}

export function saveAttendancePolicy(
  institutionIdOrUpdates: string | Partial<AttendancePolicy> = "inst-apex-01",
  maybeUpdates?: Partial<AttendancePolicy>
): AttendancePolicy {
  let institutionId = "inst-apex-01";
  let updates: Partial<AttendancePolicy> = {};

  if (typeof institutionIdOrUpdates === "string") {
    institutionId = institutionIdOrUpdates;
    updates = maybeUpdates || {};
  } else if (typeof institutionIdOrUpdates === "object" && institutionIdOrUpdates !== null) {
    updates = institutionIdOrUpdates;
    if (typeof maybeUpdates === "string") {
      institutionId = maybeUpdates;
    } else if (updates.institutionId) {
      institutionId = updates.institutionId;
    }
  }

  try {
    if (!fs.existsSync(POLICY_DIR)) {
      fs.mkdirSync(POLICY_DIR, { recursive: true });
    }
    const current = getAttendancePolicy(institutionId);
    const updated: AttendancePolicy = {
      ...current,
      ...updates,
      institutionId,
      updatedAt: new Date().toISOString(),
    };
    const policyFile = path.join(POLICY_DIR, `attendance_${institutionId}.json`);
    fs.writeFileSync(policyFile, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Failed to persist attendance policy:", err);
    return { ...DEFAULT_POLICY, ...updates, institutionId };
  }
}
