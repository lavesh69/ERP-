/**
 * Enterprise Alumni Network, Mentorship & Giving Engine
 * Handles graduate credential verification, alumni directory indexing,
 * mentorship slot booking without scheduling conflicts, and endowment giving.
 */

export interface AlumniProfile {
  id: string;
  fullName: string;
  graduationBatch: number;
  degree: string;
  currentCompany: string;
  jobTitle: string;
  location: string;
  isAvailableForMentorship: boolean;
  mentorTopics: string[];
  linkedinUrl: string;
  email?: string;
  phone?: string;
  registeredAt?: string;
}

export interface MentorshipBooking {
  id: string;
  bookingRef: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  topic: string;
  date: string;       // YYYY-MM-DD
  slotTime: string;   // e.g. "16:00 - 16:45 IST"
  meetingFormat: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes?: string;
  bookedAt: string;
}

export interface GivingCampaign {
  id: string;
  title: string;
  target: number;
  raised: number;
  donorsCount: number;
  category: string;
  deadline: string;
}

export interface AlumniDonation {
  id: string;
  receiptNo: string;
  campaignId: string;
  campaignTitle: string;
  donorName: string;
  donorEmail?: string;
  donorPan?: string;
  amount: number;
  isAnonymous: boolean;
  paymentMethod: string;
  transactionRef: string;
  donatedAt: string;
}

/**
 * Validates new alumni profile registration
 */
export function validateAlumniProfile(data: Partial<AlumniProfile>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push("Full legal name is required.");
  }
  if (!data.graduationBatch || data.graduationBatch < 1950 || data.graduationBatch > new Date().getFullYear() + 1) {
    errors.push("Valid graduation batch year is required.");
  }
  if (!data.degree || data.degree.trim().length === 0) {
    errors.push("Graduated degree title is required.");
  }
  if (!data.currentCompany || data.currentCompany.trim().length === 0) {
    errors.push("Current employer or organization is required.");
  }
  if (!data.jobTitle || data.jobTitle.trim().length === 0) {
    errors.push("Current designation / job title is required.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks whether a mentor is available for a requested slot without double booking
 */
export function checkMentorshipSlotAvailability(
  existingBookings: MentorshipBooking[],
  mentorId: string,
  date: string,
  slotTime: string
): { isAvailable: boolean; conflictBooking?: MentorshipBooking } {
  const conflict = existingBookings.find(
    (b) =>
      b.mentorId === mentorId &&
      b.date === date &&
      b.slotTime.toLowerCase() === slotTime.toLowerCase() &&
      b.status === "CONFIRMED"
  );

  return {
    isAvailable: !conflict,
    conflictBooking: conflict,
  };
}

/**
 * Validates alumni endowment donation payload
 */
export function validateDonation(data: Partial<AlumniDonation>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.campaignId) {
    errors.push("Endowment campaign ID is required.");
  }
  if (typeof data.amount !== "number" || isNaN(data.amount) || data.amount <= 0) {
    errors.push("Donation contribution amount must be greater than zero.");
  }
  if (!data.isAnonymous && (!data.donorName || data.donorName.trim().length === 0)) {
    errors.push("Donor name is required for non-anonymous giving.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
