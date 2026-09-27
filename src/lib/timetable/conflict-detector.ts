export interface TimetableSlotItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: string;
  roomName: string;
  facultyId: string;
  facultyName: string;
  courseCode: string;
  courseTitle: string;
  sectionId: string;
  sectionName: string;
  courseType?: string;
  roomType?: string;
  roomCapacity?: number;
  sectionCapacity?: number;
  isLive?: boolean;
}

export interface ConflictResult {
  hasConflict: boolean;
  type?:
    | "FACULTY_CONFLICT"
    | "ROOM_CONFLICT"
    | "SECTION_CONFLICT"
    | "TIME_INVALID"
    | "CAPACITY_MISMATCH"
    | "ROOM_TYPE_MISMATCH";
  message?: string;
  conflictingSlot?: TimetableSlotItem;
}

export function detectTimetableConflict(
  proposed: Omit<TimetableSlotItem, "id">,
  existingSlots: TimetableSlotItem[],
  excludeSlotId?: string
): ConflictResult {
  // 1. Validate chronological bounds
  if (proposed.startTime && proposed.endTime && proposed.startTime >= proposed.endTime) {
    return {
      hasConflict: true,
      type: "TIME_INVALID",
      message: `Invalid time window: Lecture start (${proposed.startTime}) must precede dismissal time (${proposed.endTime}).`,
    };
  }

  // 2. Validate seating capacity vs student section enrollment
  if (
    proposed.roomCapacity &&
    proposed.sectionCapacity &&
    proposed.sectionCapacity > proposed.roomCapacity
  ) {
    return {
      hasConflict: true,
      type: "CAPACITY_MISMATCH",
      message: `Capacity mismatch: Room ${proposed.roomName} holds only ${proposed.roomCapacity} desks, but Section ${proposed.sectionName} requires ${proposed.sectionCapacity} seats.`,
    };
  }

  // 3. Validate laboratory specialized equipment matching
  if (
    proposed.courseType &&
    (proposed.courseType === "LAB" || proposed.courseType === "PRACTICAL") &&
    proposed.roomType &&
    proposed.roomType !== "LAB"
  ) {
    return {
      hasConflict: true,
      type: "ROOM_TYPE_MISMATCH",
      message: `Space mismatch: Laboratory course ${proposed.courseCode} requires a specialized Computer/Engineering Lab, but is assigned to a ${proposed.roomType.replace("_", " ")}.`,
    };
  }

  const activeSlots = existingSlots.filter((s) => s.id !== excludeSlotId);

  for (const slot of activeSlots) {
    if (slot.dayOfWeek !== proposed.dayOfWeek) continue;

    // Check time overlap: (StartA < EndB) and (EndA > StartB)
    const proposedStart = proposed.startTime;
    const proposedEnd = proposed.endTime;
    const existingStart = slot.startTime;
    const existingEnd = slot.endTime;

    const overlaps = proposedStart < existingEnd && proposedEnd > existingStart;
    if (!overlaps) continue;

    // 4. Room Conflict
    if (slot.roomId === proposed.roomId) {
      return {
        hasConflict: true,
        type: "ROOM_CONFLICT",
        message: `Room conflict: ${slot.roomName} is already booked for ${slot.courseCode} (${slot.startTime}-${slot.endTime})`,
        conflictingSlot: slot,
      };
    }

    // 5. Faculty Conflict
    if (slot.facultyId === proposed.facultyId) {
      return {
        hasConflict: true,
        type: "FACULTY_CONFLICT",
        message: `Faculty conflict: ${slot.facultyName} is already assigned to ${slot.courseCode} in ${slot.roomName} (${slot.startTime}-${slot.endTime})`,
        conflictingSlot: slot,
      };
    }

    // 6. Section Conflict
    if (slot.sectionId === proposed.sectionId) {
      return {
        hasConflict: true,
        type: "SECTION_CONFLICT",
        message: `Section conflict: ${slot.sectionName} already has ${slot.courseCode} scheduled at this hour`,
        conflictingSlot: slot,
      };
    }
  }

  return { hasConflict: false };
}

