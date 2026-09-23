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
}

export interface ConflictResult {
  hasConflict: boolean;
  type?: "FACULTY_CONFLICT" | "ROOM_CONFLICT" | "SECTION_CONFLICT";
  message?: string;
  conflictingSlot?: TimetableSlotItem;
}

export function detectTimetableConflict(
  proposed: Omit<TimetableSlotItem, "id">,
  existingSlots: TimetableSlotItem[],
  excludeSlotId?: string
): ConflictResult {
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

    // 1. Room Conflict
    if (slot.roomId === proposed.roomId) {
      return {
        hasConflict: true,
        type: "ROOM_CONFLICT",
        message: `Room conflict: ${slot.roomName} is already booked for ${slot.courseCode} (${slot.startTime}-${slot.endTime})`,
        conflictingSlot: slot,
      };
    }

    // 2. Faculty Conflict
    if (slot.facultyId === proposed.facultyId) {
      return {
        hasConflict: true,
        type: "FACULTY_CONFLICT",
        message: `Faculty conflict: ${slot.facultyName} is already assigned to ${slot.courseCode} in ${slot.roomName} (${slot.startTime}-${slot.endTime})`,
        conflictingSlot: slot,
      };
    }

    // 3. Section Conflict
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
