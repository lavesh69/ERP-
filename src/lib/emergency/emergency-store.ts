import fs from "fs";
import path from "path";
import {
  EmergencyAlert,
  MusterPoint,
  validateEmergencyBroadcast,
  generateEmergencyDispatchSeal,
  calculateMusterAccountability,
} from "./emergency-engine";

const DATA_DIR = path.join(process.cwd(), "data", "emergency");
const STORE_FILE = path.join(DATA_DIR, "emergency_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface EmergencyStoreSchema {
  alerts: EmergencyAlert[];
  musterPoints: MusterPoint[];
}

const DEFAULT_MUSTER_POINTS: MusterPoint[] = [
  {
    id: "mp-01",
    name: "Central Sports Ground Pavilion Assembly",
    zone: "North Academic & Science Quad",
    capacity: 2500,
    currentEvacueesCount: 840,
    assignedWarden: "Chief Safety Officer Col. Rathore",
    wardenPhone: "+1 (555) 911-0021",
    status: "SAFE_ASSEMBLED",
  },
  {
    id: "mp-02",
    name: "Hostel Quadrangle Open Lawn",
    zone: "South Residential Blocks A-D",
    capacity: 1800,
    currentEvacueesCount: 620,
    assignedWarden: "Senior Hostel Warden Dr. K. Nair",
    wardenPhone: "+1 (555) 911-0022",
    status: "SAFE_ASSEMBLED",
  },
  {
    id: "mp-03",
    name: "East Gate Plaza Perimeter",
    zone: "Innovation Hub & Engineering Workshops",
    capacity: 1200,
    currentEvacueesCount: 310,
    assignedWarden: "Estate Safety Engineer Vikram Sen",
    wardenPhone: "+1 (555) 911-0023",
    status: "SAFE_ASSEMBLED",
  },
];

const DEFAULT_ALERTS: EmergencyAlert[] = [
  {
    id: "al-01",
    alertCode: "EMG-2026-001",
    category: "DRILL_SIMULATION",
    severity: "CAMPUS_ALL_CLEAR",
    headline: "Semester Evacuation Drill & Fire Safety Protocol Simulation Completed",
    instructions: "All building wardens have completed headcounts. Regular academic and lab sessions resume.",
    affectedZones: ["Central Academic Block", "Science Quad", "Library"],
    dispatchedChannels: ["SMS_GATEWAY", "MOBILE_APP_PUSH", "EMERGENCY_EMAILS"],
    initiatedBy: "Campus Emergency Operations Center (EOC)",
    initiatedAt: "2026-10-02T11:00:00.000Z",
    isActive: false,
    resolvedAt: "2026-10-02T11:45:00.000Z",
    cryptographicBroadcastSeal: "EOC-ALERT-91E8B03CA21F889D",
  },
];

function readStore(): EmergencyStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: EmergencyStoreSchema = {
      alerts: DEFAULT_ALERTS,
      musterPoints: DEFAULT_MUSTER_POINTS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[EmergencyStore Read Error]:", err);
    return { alerts: DEFAULT_ALERTS, musterPoints: DEFAULT_MUSTER_POINTS };
  }
}

function writeStore(data: EmergencyStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const emergencyStore = {
  getSummary() {
    const store = readStore();
    const activeAlerts = store.alerts.filter((a) => a.isActive);
    const musterStats = calculateMusterAccountability(store.musterPoints, 2000);

    return {
      activeAlertsCount: activeAlerts.length,
      currentActiveAlert: activeAlerts[0] || null,
      totalHistoricalIncidents: store.alerts.length,
      totalMusterPoints: store.musterPoints.length,
      ...musterStats,
    };
  },

  getAlerts() {
    return readStore().alerts;
  },

  getMusterPoints() {
    return readStore().musterPoints;
  },

  broadcastAlert(payload: Partial<EmergencyAlert>): EmergencyAlert {
    const validation = validateEmergencyBroadcast(payload);
    if (!validation.isValid) {
      throw new Error(`Emergency Broadcast Validation Failed: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const alertCode = `EMG-2026-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();
    const seal = generateEmergencyDispatchSeal(
      alertCode,
      payload.category || "DRILL_SIMULATION",
      payload.severity || "HIGH_WARNING",
      now
    );

    const newAlert: EmergencyAlert = {
      id: `al-${Date.now()}`,
      alertCode,
      category: payload.category || "DRILL_SIMULATION",
      severity: payload.severity || "HIGH_WARNING",
      headline: payload.headline!,
      instructions: payload.instructions!,
      affectedZones: payload.affectedZones || ["All Campus Quads"],
      dispatchedChannels: payload.dispatchedChannels || ["SMS_GATEWAY", "MOBILE_APP_PUSH", "CAMPUS_SIRENS"],
      initiatedBy: payload.initiatedBy || "Campus Incident Commander",
      initiatedAt: now,
      isActive: payload.severity !== "CAMPUS_ALL_CLEAR",
      cryptographicBroadcastSeal: seal,
    };

    store.alerts.unshift(newAlert);
    writeStore(store);
    return newAlert;
  },

  resolveAlert(id: string, allClearNotes?: string): EmergencyAlert {
    const store = readStore();
    const target = store.alerts.find((a) => a.id === id);
    if (!target) {
      throw new Error(`Emergency alert with id ${id} not found`);
    }

    target.isActive = false;
    target.severity = "CAMPUS_ALL_CLEAR";
    target.resolvedAt = new Date().toISOString();
    if (allClearNotes) {
      target.instructions = `${target.instructions} | [ALL CLEAR]: ${allClearNotes}`;
    }

    writeStore(store);
    return target;
  },

  updateMusterPoint(id: string, count: number, status: MusterPoint["status"]): MusterPoint {
    const store = readStore();
    const point = store.musterPoints.find((p) => p.id === id);
    if (!point) {
      throw new Error(`Muster point ${id} not found`);
    }

    point.currentEvacueesCount = count;
    point.status = status;
    writeStore(store);
    return point;
  },
};
