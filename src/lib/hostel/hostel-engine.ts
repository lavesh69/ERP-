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
