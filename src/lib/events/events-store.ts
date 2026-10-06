import fs from "fs";
import path from "path";
import {
  CampusVenue,
  EventBooking,
  detectVenueBookingConflict,
  validateEventBookingInput,
  BookingStatus,
} from "./events-engine";

const DATA_DIR = path.join(process.cwd(), "data", "events");
const STORE_FILE = path.join(DATA_DIR, "events_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface EventsStoreSchema {
  venues: CampusVenue[];
  bookings: EventBooking[];
}

const DEFAULT_VENUES: CampusVenue[] = [
  {
    id: "vn-01",
    name: "Main University Grand Auditorium",
    building: "Central Academic Block A",
    seatingCapacity: 1200,
    amenities: ["4K Laser Projection", "Dolby Atmos Surround", "Dual Stage Green Rooms", "Full Central AC", "Motorized Curtains"],
    isOperational: true,
    custodianOfficer: "Estate Management & Audio-Visual Unit",
  },
  {
    id: "vn-02",
    name: "Dr. APJ Abdul Kalam Mini Auditorium",
    building: "Science & Innovation Complex",
    seatingCapacity: 300,
    amenities: ["Dual Laser Projectors", "Live Streaming Kit", "Acoustic Wall Paneling", "AC"],
    isOperational: true,
    custodianOfficer: "Dean Student Welfare Office",
  },
  {
    id: "vn-03",
    name: "Sir CV Raman Seminar Hall",
    building: "Department of Computer Science & Physics",
    seatingCapacity: 160,
    amenities: ["Interactive Smart Podium", "Surround Sound", "High-speed Wi-Fi 6", "AC"],
    isOperational: true,
    custodianOfficer: "HOD Computer Science",
  },
  {
    id: "vn-04",
    name: "Indoor Multi-Sports Arena",
    building: "Sports Pavilion",
    seatingCapacity: 800,
    amenities: ["Maple Hardwood Basketball Court", "Electronic Scoreboard", "Press Box", "Locker Rooms"],
    isOperational: true,
    custodianOfficer: "Director of Physical Education",
  },
  {
    id: "vn-05",
    name: "Central Moot Court & Deliberation Chamber",
    building: "School of Legal Studies",
    seatingCapacity: 120,
    amenities: ["Judicial Bench Podiums", "Court Recording System", "Law Library Annex", "AC"],
    isOperational: true,
    custodianOfficer: "Faculty Dean of Law",
  },
];

const DEFAULT_BOOKINGS: EventBooking[] = [
  {
    id: "bk-01",
    bookingRef: "EVT-2026-801",
    eventTitle: "Annual National AI & Quantum Hackathon 2026",
    organizingDepartmentOrClub: "IEEE Student Branch & CS Department",
    category: "HACKATHON",
    venueId: "vn-01",
    venueName: "Main University Grand Auditorium",
    eventDate: "2026-11-15",
    timeSlot: "FULL_DAY",
    expectedAttendees: 650,
    contactPersonName: "Alex Mercer",
    contactPersonEmail: "alex.mercer@apex.edu",
    status: "CONFIRMED",
    approvalRemarks: "Approved by Dean of Student Affairs. Security & power backup notified.",
    createdAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "bk-02",
    bookingRef: "EVT-2026-802",
    eventTitle: "Distinguished Alumni Keynote: Frontier Generative AI",
    organizingDepartmentOrClub: "Corporate Relations & Alumni Association",
    category: "GUEST_LECTURE",
    venueId: "vn-02",
    venueName: "Dr. APJ Abdul Kalam Mini Auditorium",
    eventDate: "2026-10-25",
    timeSlot: "14:00 - 18:00",
    expectedAttendees: 240,
    contactPersonName: "Jessica Alvarez",
    contactPersonEmail: "careers@apex.edu",
    status: "CONFIRMED",
    approvalRemarks: "Confirmed. Livestream setup scheduled with AV Unit.",
    createdAt: "2026-10-03T14:30:00.000Z",
  },
];

function readStore(): EventsStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: EventsStoreSchema = {
      venues: DEFAULT_VENUES,
      bookings: DEFAULT_BOOKINGS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading events store, using defaults", err);
    return {
      venues: DEFAULT_VENUES,
      bookings: DEFAULT_BOOKINGS,
    };
  }
}

function writeStore(data: EventsStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const eventsStore = {
  getSummary() {
    const store = readStore();
    const confirmedCount = store.bookings.filter((b) => b.status === "CONFIRMED").length;
    const pendingCount = store.bookings.filter((b) => b.status === "PENDING_APPROVAL").length;
    const totalCapacity = store.venues.reduce((acc, v) => acc + v.seatingCapacity, 0);

    return {
      totalVenues: store.venues.length,
      totalCapacity,
      totalBookings: store.bookings.length,
      confirmedCount,
      pendingCount,
      venues: store.venues,
    };
  },

  getVenues() {
    return readStore().venues;
  },

  getBookings(status?: BookingStatus) {
    const store = readStore();
    if (status) {
      return store.bookings.filter((b) => b.status === status);
    }
    return store.bookings;
  },

  createBooking(payload: Partial<EventBooking>) {
    const store = readStore();
    const venue = store.venues.find((v) => v.id === payload.venueId);

    const validation = validateEventBookingInput(payload, venue);
    if (!validation.isValid) {
      throw new Error(`Booking Validation Failed: ${validation.errors.join("; ")}`);
    }

    const conflict = detectVenueBookingConflict(
      store.bookings,
      payload.venueId!,
      payload.eventDate!,
      payload.timeSlot!
    );

    if (conflict.hasConflict) {
      throw new Error(
        `Scheduling Clash! ${venue?.name} is already booked for "${conflict.conflictingBooking?.eventTitle}" on ${payload.eventDate} during slot ${payload.timeSlot}.`
      );
    }

    const newBooking: EventBooking = {
      id: `bk-${Date.now()}`,
      bookingRef: `EVT-2026-${Math.floor(100 + Math.random() * 900)}`,
      eventTitle: payload.eventTitle!,
      organizingDepartmentOrClub: payload.organizingDepartmentOrClub!,
      category: payload.category || "ACADEMIC_SYMPOSIUM",
      venueId: payload.venueId!,
      venueName: venue?.name || "Campus Facility",
      eventDate: payload.eventDate!,
      timeSlot: payload.timeSlot!,
      expectedAttendees: Number(payload.expectedAttendees),
      contactPersonName: payload.contactPersonName || "Campus Organizer",
      contactPersonEmail: payload.contactPersonEmail!,
      status: "PENDING_APPROVAL",
      approvalRemarks: "Submitted for Estate & Student Affairs clearance.",
      createdAt: new Date().toISOString(),
    };

    store.bookings.unshift(newBooking);
    writeStore(store);
    return newBooking;
  },

  updateBookingStatus(id: string, status: BookingStatus, remarks?: string) {
    const store = readStore();
    const target = store.bookings.find((b) => b.id === id);
    if (!target) {
      throw new Error("Event booking not found.");
    }

    target.status = status;
    if (remarks) target.approvalRemarks = remarks;
    writeStore(store);
    return target;
  },
};
