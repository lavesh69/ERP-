/**
 * Enterprise Hostel & Residence Life Management Engine
 * Implements room allocation algorithms, capacity tracking, gate pass workflows, and mess billing.
 */

export type GenderAllowed = "MALE" | "FEMALE" | "COED";
export type RoomType = "SINGLE_AC" | "DOUBLE_AC" | "TRIPLE_NON_AC" | "FOUR_SHARING";
export type RoomStatus = "VACANT" | "PARTIALLY_OCCUPIED" | "FULL" | "MAINTENANCE";
export type GatePassStatus = "PENDING_WARDEN" | "APPROVED" | "REJECTED" | "CHECKED_OUT" | "RETURNED";
export type DietType = "VEG" | "NON_VEG" | "SPECIAL_DIET";

export interface HostelBed {
  id: string;
  roomId: string;
  bedNumber: string; // "A", "B", "C", "D"
  isOccupied: boolean;
  studentId?: string;
  studentName?: string;
  studentRoll?: string;
  branch?: string;
  allocatedDate?: string;
  feeStatus?: "PAID" | "PARTIAL" | "PENDING";
}

export interface HostelRoom {
  id: string;
  blockId: string;
  blockName: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  capacity: number;
  occupiedCount: number;
  status: RoomStatus;
  feePerSemester: number;
  amenities: string[];
  beds: HostelBed[];
}

export interface HostelBlock {
  id: string;
  name: string;
  code: string;
  genderAllowed: GenderAllowed;
  totalFloors: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  wardenName: string;
  wardenContact: string;
  wardenEmail: string;
}

export interface GatePass {
  id: string;
  passNumber: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  roomNumber: string;
  blockName: string;
  reason: string;
  destination: string;
  departureTime: string;
  expectedReturnTime: string;
  actualReturnTime?: string;
  status: GatePassStatus;
  emergencyContact: string;
  parentConsentVerified: boolean;
  approvedBy?: string;
  remarks?: string;
  createdAt: string;
}

export interface MessPlan {
  id: string;
  name: string;
  description: string;
  dietType: DietType;
  monthlyFee: number;
  activeSubscribers: number;
  weeklyHighlights: {
    breakfast: string;
    lunch: string;
    snacks: string;
    dinner: string;
  };
}

export interface StudentMessSubscription {
  studentId: string;
  studentName: string;
  studentRoll: string;
  planId: string;
  planName: string;
  status: "ACTIVE" | "ON_LEAVE";
  rebateDaysCount: number;
}

/**
 * Calculates occupancy rate and capacity statistics for a hostel block
 */
export function calculateBlockOccupancy(block: HostelBlock) {
  const rate = block.totalBeds > 0 ? (block.occupiedBeds / block.totalBeds) * 100 : 0;
  return {
    totalBeds: block.totalBeds,
    occupiedBeds: block.occupiedBeds,
    availableBeds: Math.max(0, block.totalBeds - block.occupiedBeds),
    occupancyRate: Math.round(rate * 10) / 10,
  };
}

/**
 * Determines room status based on current bed occupancy
 */
export function determineRoomStatus(beds: HostelBed[], capacity: number): RoomStatus {
  const occupied = beds.filter((b) => b.isOccupied).length;
  if (occupied === 0) return "VACANT";
  if (occupied >= capacity) return "FULL";
  return "PARTIALLY_OCCUPIED";
}

/**
 * Validates a student outpass request before submittal to warden
 */
export function validateGatePassRequest(pass: Partial<GatePass>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!pass.studentName || pass.studentName.trim().length === 0) {
    errors.push("Student name is required.");
  }
  if (!pass.studentRoll || pass.studentRoll.trim().length === 0) {
    errors.push("Roll number / registration ID is required.");
  }
  if (!pass.reason || pass.reason.trim().length < 5) {
    errors.push("Reason must be detailed (minimum 5 characters).");
  }
  if (!pass.destination || pass.destination.trim().length === 0) {
    errors.push("Destination address / city is required.");
  }
  if (!pass.departureTime || !pass.expectedReturnTime) {
    errors.push("Departure and expected return times are required.");
  } else {
    const dep = new Date(pass.departureTime).getTime();
    const ret = new Date(pass.expectedReturnTime).getTime();
    if (isNaN(dep) || isNaN(ret)) {
      errors.push("Invalid date/time format.");
    } else if (ret <= dep) {
      errors.push("Expected return time must be strictly after departure time.");
    }
  }
  if (!pass.emergencyContact || pass.emergencyContact.trim().length < 8) {
    errors.push("Valid emergency telephone contact is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Processes warden approval/rejection or guard check-in/out
 */
export function processGatePassAction(
  pass: GatePass,
  action: "APPROVE" | "REJECT" | "CHECK_OUT" | "RETURN",
  actor: string,
  remarks?: string
): GatePass {
  const updated = { ...pass };
  if (action === "APPROVE") {
    updated.status = "APPROVED";
    updated.approvedBy = actor;
    if (remarks) updated.remarks = remarks;
  } else if (action === "REJECT") {
    updated.status = "REJECTED";
    updated.approvedBy = actor;
    if (remarks) updated.remarks = remarks;
  } else if (action === "CHECK_OUT") {
    if (updated.status !== "APPROVED") {
      throw new Error("Cannot check out a gate pass that has not been approved by warden.");
    }
    updated.status = "CHECKED_OUT";
  } else if (action === "RETURN") {
    if (updated.status !== "CHECKED_OUT") {
      throw new Error("Student must be in CHECKED_OUT status to register return.");
    }
    updated.status = "RETURNED";
    updated.actualReturnTime = new Date().toISOString();
  }
  return updated;
}

/**
 * Computes mess rebate credit for approved hostel leave
 * Mandatory UGC/Residential policy: >= 3 sanctioned leave days qualify for 70% per-diem rebate.
 */
export function calculateMessRebate(monthlyFee: number, sanctionedLeaveDays: number): number {
  if (sanctionedLeaveDays < 3) return 0;
  const perDayRate = monthlyFee / 30;
  const rawRebate = sanctionedLeaveDays * perDayRate * 0.7;
  return Math.round(rawRebate);
}

// -------------------------------------------------------------
// Room Transfer & Bed Swap Types & Helpers
// -------------------------------------------------------------

export interface RoomTransferRequest {
  id: string;
  requestNumber: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  currentRoomId: string;
  currentRoomNumber: string;
  currentBedNumber: string;
  currentBlockName: string;
  targetRoomId: string;
  targetRoomNumber: string;
  targetBedNumber: string;
  targetBlockName: string;
  reason: string;
  status: "PENDING_WARDEN" | "APPROVED" | "REJECTED";
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  remarks?: string;
}

export function validateTransferRequest(req: Partial<RoomTransferRequest>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!req.studentRoll || req.studentRoll.trim().length === 0) {
    errors.push("Student roll number is required.");
  }
  if (!req.currentRoomId || !req.currentBedNumber) {
    errors.push("Current room and bed identifiers are required.");
  }
  if (!req.targetRoomId || !req.targetBedNumber) {
    errors.push("Target room and bed identifiers are required.");
  }
  if (req.currentRoomId === req.targetRoomId && req.currentBedNumber === req.targetBedNumber) {
    errors.push("Target room and bed must differ from current allocation.");
  }
  if (!req.reason || req.reason.trim().length < 5) {
    errors.push("A substantive justification for room transfer is required (min 5 characters).");
  }
  return { isValid: errors.length === 0, errors };
}

// -------------------------------------------------------------
// Hostel Maintenance & Repair Tickets Types & Helpers
// -------------------------------------------------------------

export type MaintenanceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "CARPENTRY"
  | "AIR_CONDITIONING"
  | "INTERNET_WIFI"
  | "HOUSEKEEPING";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type MaintenanceStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED";

export interface HostelMaintenanceTicket {
  id: string;
  ticketNumber: string;
  blockId: string;
  blockName: string;
  roomNumber: string;
  bedNumber?: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  description: string;
  reportedBy: string;
  reportedRoll?: string;
  assignedTechnician?: string;
  reportedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export function validateMaintenanceTicket(t: Partial<HostelMaintenanceTicket>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!t.roomNumber || t.roomNumber.trim().length === 0) {
    errors.push("Room number is required.");
  }
  if (!t.blockName || t.blockName.trim().length === 0) {
    errors.push("Block name is required.");
  }
  if (!t.category) {
    errors.push("Maintenance category is required.");
  }
  if (!t.description || t.description.trim().length < 5) {
    errors.push("Detailed description of defect/repair is required (min 5 characters).");
  }
  return { isValid: errors.length === 0, errors };
}

// -------------------------------------------------------------
// Hostel Visitor & Guest Register Types & Helpers
// -------------------------------------------------------------

export interface HostelVisitorRecord {
  id: string;
  badgeNumber: string;
  studentRoll: string;
  studentName: string;
  roomNumber: string;
  blockName: string;
  visitorName: string;
  relation: "PARENT" | "GUARDIAN" | "SIBLING" | "GUEST" | "OFFICIAL";
  phone: string;
  idProofNumber: string;
  checkInTime: string;
  checkOutTime?: string;
  status: "CHECKED_IN" | "CHECKED_OUT";
  gateSecurityOfficer: string;
  purpose: string;
}

export function validateVisitorRecord(v: Partial<HostelVisitorRecord>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!v.studentRoll || v.studentRoll.trim().length === 0) {
    errors.push("Host resident student roll number is required.");
  }
  if (!v.visitorName || v.visitorName.trim().length === 0) {
    errors.push("Visitor name is required.");
  }
  if (!v.phone || v.phone.trim().length < 8) {
    errors.push("Valid visitor telephone contact is required.");
  }
  if (!v.idProofNumber || v.idProofNumber.trim().length === 0) {
    errors.push("Government identity proof number (Aadhaar/DL/Passport) is mandatory.");
  }
  if (!v.purpose || v.purpose.trim().length < 4) {
    errors.push("Purpose of visit must be stated.");
  }
  return { isValid: errors.length === 0, errors };
}

// -------------------------------------------------------------
// Hostel Waitlist Types & Helpers
// -------------------------------------------------------------

export interface HostelWaitlistEntry {
  id: string;
  waitlistToken: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  gender: GenderAllowed;
  branch: string;
  preferredBlockId: string;
  preferredBlockName: string;
  preferredRoomType: RoomType;
  distanceFromHomeKm: number;
  priorityScore: number;
  status: "WAITLISTED" | "ALLOTTED" | "CANCELLED";
  appliedAt: string;
}
