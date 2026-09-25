import fs from "fs";
import path from "path";

export interface AttendanceException {
  id: string;
  timestamp: string;
  institutionId: string;
  actor: string;
  actorRole: string;
  category:
    | "QR_FAILED"
    | "REPLAY_ATTEMPT"
    | "OUTSIDE_GEOFENCE"
    | "BLE_MISMATCH"
    | "UNENROLLED_SCAN"
    | "LOCKED_SESSION_TAMPER"
    | "UNAUTHORIZED_FACULTY";
  severity: "P0_CRITICAL" | "P1_HIGH" | "P2_MEDIUM" | "P3_LOW";
  sessionId?: string;
  courseCode?: string;
  sectionName?: string;
  reason: string;
  clientIp?: string;
}

const EXCEPTIONS_FILE = path.join(process.cwd(), "data", "attendance_exceptions.json");

export function recordAttendanceException(exception: Omit<AttendanceException, "id" | "timestamp">): AttendanceException {
  const newEntry: AttendanceException = {
    ...exception,
    id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const dir = path.dirname(EXCEPTIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let existing: AttendanceException[] = [];
    if (fs.existsSync(EXCEPTIONS_FILE)) {
      const content = fs.readFileSync(EXCEPTIONS_FILE, "utf-8");
      existing = JSON.parse(content);
    }

    existing.unshift(newEntry);
    // Keep most recent 500 exceptions
    if (existing.length > 500) existing = existing.slice(0, 500);

    fs.writeFileSync(EXCEPTIONS_FILE, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to record attendance exception:", err);
  }

  return newEntry;
}

export function getAttendanceExceptions(filter?: {
  institutionId?: string;
  category?: string;
  severity?: string;
  limit?: number;
}): AttendanceException[] {
  try {
    if (!fs.existsSync(EXCEPTIONS_FILE)) {
      return getSeedExceptions();
    }
    const content = fs.readFileSync(EXCEPTIONS_FILE, "utf-8");
    let list: AttendanceException[] = JSON.parse(content);

    if (filter?.institutionId && filter.institutionId !== "ALL") {
      list = list.filter((e) => e.institutionId === filter.institutionId);
    }
    if (filter?.category && filter.category !== "ALL") {
      list = list.filter((e) => e.category === filter.category);
    }
    if (filter?.severity && filter.severity !== "ALL") {
      list = list.filter((e) => e.severity === filter.severity);
    }

    return list.slice(0, filter?.limit || 50);
  } catch (err) {
    console.error("Failed to read attendance exceptions:", err);
    return getSeedExceptions();
  }
}

export function clearAttendanceExceptions(): void {
  try {
    const dir = path.dirname(EXCEPTIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EXCEPTIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to clear attendance exceptions:", err);
  }
}

function getSeedExceptions(): AttendanceException[] {
  return [
    {
      id: "exc-seed-01",
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      institutionId: "inst-apex-01",
      actor: "unknown-client",
      actorRole: "STUDENT",
      category: "QR_FAILED",
      severity: "P2_MEDIUM",
      courseCode: "CS-402",
      sectionName: "Section 5-A",
      reason: "Expired rotating QR token submitted (+42s elapsed)",
      clientIp: "192.168.1.104",
    },
    {
      id: "exc-seed-02",
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      institutionId: "inst-apex-01",
      actor: "alex.mercer@apex.edu",
      actorRole: "STUDENT",
      category: "OUTSIDE_GEOFENCE",
      severity: "P1_HIGH",
      courseCode: "BIO-301",
      sectionName: "Section 3-A",
      reason: "GPS coordinate distance 342m exceeds permitted 100m geofence perimeter",
      clientIp: "10.0.4.15",
    },
    {
      id: "exc-seed-03",
      timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
      institutionId: "inst-apex-01",
      actor: "unassigned.faculty@apex.edu",
      actorRole: "FACULTY",
      category: "UNAUTHORIZED_FACULTY",
      severity: "P0_CRITICAL",
      courseCode: "MGMT-201",
      sectionName: "Section 3-A",
      reason: "Faculty not mapped to course assignment or departmental timetable",
      clientIp: "172.16.0.22",
    },
  ];
}
