import fs from "fs";
import path from "path";
import {
  AlumniProfile,
  MentorshipBooking,
  GivingCampaign,
  AlumniDonation,
  validateAlumniProfile,
  checkMentorshipSlotAvailability,
  validateDonation,
} from "./alumni-engine";

const DATA_DIR = path.join(process.cwd(), "data", "alumni");
const STORE_FILE = path.join(DATA_DIR, "alumni_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface AlumniStoreSchema {
  alumni: AlumniProfile[];
  mentorshipBookings: MentorshipBooking[];
  campaigns: GivingCampaign[];
  donations: AlumniDonation[];
}

const DEFAULT_ALUMNI: AlumniProfile[] = [
  {
    id: "alm-01",
    fullName: "Rohan Varma",
    graduationBatch: 2023,
    degree: "B.Tech in Computer Science",
    currentCompany: "Stripe",
    jobTitle: "Senior Systems Engineer",
    location: "San Francisco, CA",
    isAvailableForMentorship: true,
    mentorTopics: ["Distributed Systems", "FAANG Mock Interviews", "US Masters Advice"],
    linkedinUrl: "https://linkedin.com/in/rohan-varma",
  },
  {
    id: "alm-02",
    fullName: "Priya Nair",
    graduationBatch: 2024,
    degree: "B.Tech in Artificial Intelligence",
    currentCompany: "Google DeepMind",
    jobTitle: "Research Engineer",
    location: "London, UK",
    isAvailableForMentorship: true,
    mentorTopics: ["AI/ML Research", "Publishing NeurIPS papers", "Scholarships"],
    linkedinUrl: "https://linkedin.com/in/priya-nair",
  },
  {
    id: "alm-03",
    fullName: "Karan Johar",
    graduationBatch: 2022,
    degree: "B.Tech in Mechanical",
    currentCompany: "Tesla Motors",
    jobTitle: "Thermal Systems Architect",
    location: "Austin, TX",
    isAvailableForMentorship: false,
    mentorTopics: ["Hardware & EV Systems"],
    linkedinUrl: "https://linkedin.com/in/karan-johar",
  },
];

const DEFAULT_CAMPAIGNS: GivingCampaign[] = [
  {
    id: "camp-01",
    title: "Dean's Merit Scholarship Endowment Fund",
    target: 250000,
    raised: 184500,
    donorsCount: 312,
    category: "Student Financial Aid",
    deadline: "2026-12-31",
  },
  {
    id: "camp-02",
    title: "High Performance AI & Quantum Compute Cluster",
    target: 500000,
    raised: 412000,
    donorsCount: 148,
    category: "Research Infrastructure",
    deadline: "2026-11-30",
  },
  {
    id: "camp-03",
    title: "Campus Maker-Space & Hardware Robotics Lab",
    target: 150000,
    raised: 95000,
    donorsCount: 84,
    category: "Campus Innovation",
    deadline: "2026-10-31",
  },
];

function readStore(): AlumniStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: AlumniStoreSchema = {
      alumni: DEFAULT_ALUMNI,
      mentorshipBookings: [],
      campaigns: DEFAULT_CAMPAIGNS,
      donations: [],
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[AlumniStore Read Error]:", err);
    return {
      alumni: DEFAULT_ALUMNI,
      mentorshipBookings: [],
      campaigns: DEFAULT_CAMPAIGNS,
      donations: [],
    };
  }
}

function writeStore(data: AlumniStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const alumniStore = {
  getAlumni(filters?: { company?: string; batch?: number; mentorshipOnly?: boolean }) {
    const store = readStore();
    let list = [...store.alumni];

    if (filters?.company) {
      list = list.filter((a) => a.currentCompany.toLowerCase().includes(filters.company!.toLowerCase()));
    }
    if (filters?.batch) {
      list = list.filter((a) => a.graduationBatch === filters.batch);
    }
    if (filters?.mentorshipOnly) {
      list = list.filter((a) => a.isAvailableForMentorship);
    }

    return list;
  },

  getAlumnus(id: string) {
    const store = readStore();
    return store.alumni.find((a) => a.id === id);
  },

  registerAlumnus(payload: Partial<AlumniProfile>): AlumniProfile {
    const validation = validateAlumniProfile(payload);
    if (!validation.isValid) {
      throw new Error(`Alumni Profile Validation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const newAlumnus: AlumniProfile = {
      id: `alm-${Date.now()}`,
      fullName: payload.fullName!,
      graduationBatch: Number(payload.graduationBatch),
      degree: payload.degree!,
      currentCompany: payload.currentCompany!,
      jobTitle: payload.jobTitle!,
      location: payload.location || "Bengaluru, India",
      isAvailableForMentorship: Boolean(payload.isAvailableForMentorship),
      mentorTopics: payload.mentorTopics && payload.mentorTopics.length > 0 ? payload.mentorTopics : ["Career Guidance"],
      linkedinUrl: payload.linkedinUrl || "",
      email: payload.email,
      phone: payload.phone,
      registeredAt: new Date().toISOString(),
    };

    store.alumni.unshift(newAlumnus);
    writeStore(store);
    return newAlumnus;
  },

  getMentorshipBookings(mentorId?: string) {
    const store = readStore();
    if (mentorId) {
      return store.mentorshipBookings.filter((b) => b.mentorId === mentorId);
    }
    return store.mentorshipBookings;
  },

  bookMentorshipSession(params: {
    mentorId: string;
    mentorName: string;
    studentId: string;
    studentName: string;
    studentRoll: string;
    topic: string;
    date: string;
    slotTime: string;
    meetingFormat?: string;
    notes?: string;
  }): MentorshipBooking {
    const store = readStore();
    const mentor = store.alumni.find((a) => a.id === params.mentorId);
    if (!mentor) {
      throw new Error("Specified alumni mentor not found in directory.");
    }
    if (!mentor.isAvailableForMentorship) {
      throw new Error(`${mentor.fullName} is currently not accepting new mentorship bookings.`);
    }

    const availability = checkMentorshipSlotAvailability(
      store.mentorshipBookings,
      params.mentorId,
      params.date,
      params.slotTime
    );
    if (!availability.isAvailable) {
      throw new Error(`Slot conflict: ${mentor.fullName} already has a confirmed mentorship booking on ${params.date} at ${params.slotTime}.`);
    }

    const newBooking: MentorshipBooking = {
      id: `mb-${Date.now()}`,
      bookingRef: `MB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      mentorId: params.mentorId,
      mentorName: mentor.fullName,
      studentId: params.studentId,
      studentName: params.studentName,
      studentRoll: params.studentRoll,
      topic: params.topic || "Career & Industry Mentorship",
      date: params.date,
      slotTime: params.slotTime,
      meetingFormat: params.meetingFormat || "1:1 Video Mentorship (Google Meet)",
      status: "CONFIRMED",
      notes: params.notes,
      bookedAt: new Date().toISOString(),
    };

    store.mentorshipBookings.unshift(newBooking);
    writeStore(store);
    return newBooking;
  },

  getCampaigns(): GivingCampaign[] {
    const store = readStore();
    return store.campaigns;
  },

  recordDonation(params: {
    campaignId: string;
    donorName: string;
    donorEmail?: string;
    donorPan?: string;
    amount: number;
    isAnonymous?: boolean;
    paymentMethod?: string;
  }): AlumniDonation {
    const store = readStore();
    const campaign = store.campaigns.find((c) => c.id === params.campaignId);
    if (!campaign) {
      throw new Error("Specified giving campaign not found.");
    }

    const validation = validateDonation({
      campaignId: params.campaignId,
      amount: params.amount,
      donorName: params.donorName,
      isAnonymous: Boolean(params.isAnonymous),
    });
    if (!validation.isValid) {
      throw new Error(`Donation Error: ${validation.errors.join("; ")}`);
    }

    const receiptNo = `REC-APEX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const transactionRef = `TXN-${Date.now().toString(36).toUpperCase()}`;

    const newDonation: AlumniDonation = {
      id: `don-${Date.now()}`,
      receiptNo,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      donorName: params.isAnonymous ? "Anonymous Alumnus Patron" : params.donorName,
      donorEmail: params.donorEmail,
      donorPan: params.donorPan,
      amount: params.amount,
      isAnonymous: Boolean(params.isAnonymous),
      paymentMethod: params.paymentMethod || "UPI / Net Banking Gateway",
      transactionRef,
      donatedAt: new Date().toISOString(),
    };

    campaign.raised += params.amount;
    campaign.donorsCount += 1;

    store.donations.unshift(newDonation);
    writeStore(store);
    return newDonation;
  },
};
