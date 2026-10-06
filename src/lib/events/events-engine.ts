/**
 * Enterprise Campus Events & Facility Venue Reservation Engine
 * Manages institutional halls, auditoriums, sports arenas, slot conflict detection, and event approvals.
 */

export type EventCategory =
  | "ACADEMIC_SYMPOSIUM"
  | "GUEST_LECTURE"
  | "CULTURAL_FEST"
  | "SPORTS_TOURNAMENT"
  | "HACKATHON"
  | "ADMINISTRATIVE_MEETING";

export type BookingStatus = "PENDING_APPROVAL" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface CampusVenue {
  id: string;
  name: string;
  building: string;
  seatingCapacity: number;
  amenities: string[]; // e.g. "4K Laser Projection", "Dolby Atmos", "Video Conferencing", "AC", "Stage Lighting"
  isOperational: boolean;
  custodianOfficer: string;
}

export interface EventBooking {
  id: string;
  bookingRef: string;
  eventTitle: string;
  organizingDepartmentOrClub: string;
  category: EventCategory;
  venueId: string;
  venueName: string;
  eventDate: string; // YYYY-MM-DD
  timeSlot: string;  // e.g. "09:00 - 13:00" or "14:00 - 18:00" or "FULL_DAY"
  expectedAttendees: number;
  contactPersonName: string;
  contactPersonEmail: string;
  status: BookingStatus;
  approvalRemarks?: string;
  createdAt: string;
}

/**
 * Detects time slot and venue scheduling clashes
 */
export function detectVenueBookingConflict(
  existingBookings: EventBooking[],
  venueId: string,
  eventDate: string,
  timeSlot: string,
  excludeBookingId?: string
): { hasConflict: boolean; conflictingBooking?: EventBooking } {
  const clash = existingBookings.find((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === "CANCELLED") return false;
    if (b.venueId !== venueId) return false;
    if (b.eventDate !== eventDate) return false;

    // Direct match or full day overlap
    if (b.timeSlot === timeSlot || b.timeSlot === "FULL_DAY" || timeSlot === "FULL_DAY") {
      return true;
    }
    return false;
  });

  return {
    hasConflict: Boolean(clash),
    conflictingBooking: clash,
  };
}

/**
 * Validates new event reservation application
 */
export function validateEventBookingInput(
  booking: Partial<EventBooking>,
  venue?: CampusVenue
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!booking.eventTitle || booking.eventTitle.trim().length < 5) {
    errors.push("Event title must be at least 5 characters long.");
  }
  if (!booking.organizingDepartmentOrClub) {
    errors.push("Organizing department or registered student club is required.");
  }
  if (!booking.venueId) {
    errors.push("A target campus venue must be selected.");
  }
  if (!booking.eventDate) {
    errors.push("Scheduled event date is required.");
  }
  if (!booking.timeSlot) {
    errors.push("Target booking time slot is required.");
  }
  if (!booking.expectedAttendees || booking.expectedAttendees <= 0) {
    errors.push("Expected attendee count must be a positive number.");
  } else if (venue && booking.expectedAttendees > venue.seatingCapacity) {
    errors.push(
      `Expected attendees (${booking.expectedAttendees}) exceeds venue seating capacity (${venue.seatingCapacity}).`
    );
  }
  if (!booking.contactPersonEmail || !booking.contactPersonEmail.includes("@")) {
    errors.push("Valid organizer contact email is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
