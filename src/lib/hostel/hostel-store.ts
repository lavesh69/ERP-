/**
 * Persistent Data Store for Enterprise Hostel & Residence Life Operations
 * Stores and manages residential blocks, rooms, bed allocations, outpasses, and mess plans.
 */

import fs from "fs";
import path from "path";
import {
  HostelBlock,
  HostelRoom,
  HostelBed,
  GatePass,
  MessPlan,
  StudentMessSubscription,
  determineRoomStatus,
  calculateBlockOccupancy,
  validateGatePassRequest,
  processGatePassAction,
  calculateMessRebate,
  RoomTransferRequest,
  HostelMaintenanceTicket,
  HostelVisitorRecord,
  HostelWaitlistEntry,
  validateTransferRequest,
  validateMaintenanceTicket,
  validateVisitorRecord,
  MaintenanceStatus,
} from "./hostel-engine";

const DATA_DIR = path.join(process.cwd(), "data", "hostel");
const STORE_FILE = path.join(DATA_DIR, "hostel_operations.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface PunchedMeal {
  id: string;
  studentRoll: string;
  studentName: string;
  plan: string;
  mealType: string;
  timestamp: string;
  lane: string;
  tokenHash: string;
}

export interface WasteLog {
  id: string;
  session: string;
  preparedKg: number;
  consumedKg: number;
  wastedKg: number;
  residents: number;
  divertedToBiogas: boolean;
}

interface HostelStoreSchema {
  blocks: HostelBlock[];
  rooms: HostelRoom[];
  gatePasses: GatePass[];
  messPlans: MessPlan[];
  subscriptions: StudentMessSubscription[];
  nightRollCalls?: any[];
  punchedMeals?: PunchedMeal[];
  wasteLogs?: WasteLog[];
  transferRequests?: RoomTransferRequest[];
  maintenanceTickets?: HostelMaintenanceTicket[];
  visitors?: HostelVisitorRecord[];
  waitlist?: HostelWaitlistEntry[];
}

const DEFAULT_BLOCKS: HostelBlock[] = [
  {
    id: "blk-a",
    name: "Nelson Mandela Hall (Block A)",
    code: "BLK-A",
    genderAllowed: "MALE",
    totalFloors: 4,
    totalRooms: 60,
    totalBeds: 150,
    occupiedBeds: 138,
    wardenName: "Dr. Arthur Pendelton",
    wardenContact: "+1 (555) 321-7788",
    wardenEmail: "arthur.pendelton@classroom.edu",
  },
  {
    id: "blk-b",
    name: "Marie Curie Hall (Block B)",
    code: "BLK-B",
    genderAllowed: "FEMALE",
    totalFloors: 4,
    totalRooms: 50,
    totalBeds: 120,
    occupiedBeds: 104,
    wardenName: "Dr. Sunita Deshmukh",
    wardenContact: "+1 (555) 321-7789",
    wardenEmail: "sunita.deshmukh@classroom.edu",
  },
  {
    id: "blk-c",
    name: "C.V. Raman Postgrad Scholars Hall (Block C)",
    code: "BLK-C",
    genderAllowed: "COED",
    totalFloors: 3,
    totalRooms: 40,
    totalBeds: 40,
    occupiedBeds: 36,
    wardenName: "Prof. Kenneth Clark",
    wardenContact: "+1 (555) 321-7790",
    wardenEmail: "kenneth.clark@classroom.edu",
  },
];

const DEFAULT_ROOMS: HostelRoom[] = [
  {
    id: "rm-a-101",
    blockId: "blk-a",
    blockName: "Nelson Mandela Hall (Block A)",
    roomNumber: "A-101",
    floor: 1,
    roomType: "DOUBLE_AC",
    capacity: 2,
    occupiedCount: 2,
    status: "FULL",
    feePerSemester: 1400,
    amenities: ["Air Conditioning", "Attached Bath", "Study Desks", "Wi-Fi 6"],
    beds: [
      {
        id: "bed-a-101-a",
        roomId: "rm-a-101",
        bedNumber: "A",
        isOccupied: true,
        studentId: "stu-alex-01",
        studentName: "Alex Mercer",
        studentRoll: "CS2026-001",
        branch: "B.Tech Computer Science",
        allocatedDate: "2026-08-01",
        feeStatus: "PAID",
      },
      {
        id: "bed-a-101-b",
        roomId: "rm-a-101",
        bedNumber: "B",
        isOccupied: true,
        studentId: "stu-ryan-02",
        studentName: "Ryan Gosling",
        studentRoll: "CS2026-002",
        branch: "B.Tech Computer Science",
        allocatedDate: "2026-08-01",
        feeStatus: "PAID",
      },
    ],
  },
  {
    id: "rm-a-102",
    blockId: "blk-a",
    blockName: "Nelson Mandela Hall (Block A)",
    roomNumber: "A-102",
    floor: 1,
    roomType: "TRIPLE_NON_AC",
    capacity: 3,
    occupiedCount: 2,
    status: "PARTIALLY_OCCUPIED",
    feePerSemester: 950,
    amenities: ["Ceiling Fans", "Common Washroom", "High-speed Ethernet", "Balcony"],
    beds: [
      {
        id: "bed-a-102-a",
        roomId: "rm-a-102",
        bedNumber: "A",
        isOccupied: true,
        studentId: "stu-david-05",
        studentName: "David Miller",
        studentRoll: "ME2026-015",
        branch: "Mechanical Engineering",
        allocatedDate: "2026-08-02",
        feeStatus: "PAID",
      },
      {
        id: "bed-a-102-b",
        roomId: "rm-a-102",
        bedNumber: "B",
        isOccupied: true,
        studentId: "stu-arjun-09",
        studentName: "Arjun Verma",
        studentRoll: "EE2026-008",
        branch: "Electrical Engineering",
        allocatedDate: "2026-08-03",
        feeStatus: "PARTIAL",
      },
      {
        id: "bed-a-102-c",
        roomId: "rm-a-102",
        bedNumber: "C",
        isOccupied: false,
      },
    ],
  },
  {
    id: "rm-b-201",
    blockId: "blk-b",
    blockName: "Marie Curie Hall (Block B)",
    roomNumber: "B-201",
    floor: 2,
    roomType: "DOUBLE_AC",
    capacity: 2,
    occupiedCount: 1,
    status: "PARTIALLY_OCCUPIED",
    feePerSemester: 1400,
    amenities: ["Air Conditioning", "Ensuite Bath", "Dual Desks", "Balcony"],
    beds: [
      {
        id: "bed-b-201-a",
        roomId: "rm-b-201",
        bedNumber: "A",
        isOccupied: true,
        studentId: "stu-priya-03",
        studentName: "Priya Sharma",
        studentRoll: "CS2026-018",
        branch: "B.Tech Computer Science",
        allocatedDate: "2026-08-01",
        feeStatus: "PAID",
      },
      {
        id: "bed-b-201-b",
        roomId: "rm-b-201",
        bedNumber: "B",
        isOccupied: false,
      },
    ],
  },
  {
    id: "rm-c-301",
    blockId: "blk-c",
    blockName: "C.V. Raman Postgrad Scholars Hall (Block C)",
    roomNumber: "C-301",
    floor: 3,
    roomType: "SINGLE_AC",
    capacity: 1,
    occupiedCount: 1,
    status: "FULL",
    feePerSemester: 1950,
    amenities: ["Single Executive Bed", "Attached Bath", "Private Workspace", "AC & Geyser"],
    beds: [
      {
        id: "bed-c-301-a",
        roomId: "rm-c-301",
        bedNumber: "A",
        isOccupied: true,
        studentId: "stu-chen-04",
        studentName: "Chen Wei",
        studentRoll: "PHD-AI-003",
        branch: "Ph.D. Computer Science",
        allocatedDate: "2026-07-15",
        feeStatus: "PAID",
      },
    ],
  },
];

const DEFAULT_GATE_PASSES: GatePass[] = [
  {
    id: "gp-001",
    passNumber: "GP-2026-1049",
    studentId: "stu-alex-01",
    studentName: "Alex Mercer",
    studentRoll: "CS2026-001",
    roomNumber: "A-101",
    blockName: "Nelson Mandela Hall (Block A)",
    reason: "ACM ICPC Regional Collegiate Programming Contest Final",
    destination: "MIT Convention Center, Cambridge, MA",
    departureTime: "2026-10-10T08:00:00.000Z",
    expectedReturnTime: "2026-10-12T20:00:00.000Z",
    status: "APPROVED",
    emergencyContact: "+1 (555) 998-1122",
    parentConsentVerified: true,
    approvedBy: "Dr. Arthur Pendelton (Chief Warden)",
    remarks: "Authorized team departure with faculty mentor sponsorship.",
    createdAt: "2026-10-05T14:30:00.000Z",
  },
  {
    id: "gp-002",
    passNumber: "GP-2026-1050",
    studentId: "stu-priya-03",
    studentName: "Priya Sharma",
    studentRoll: "CS2026-018",
    roomNumber: "B-201",
    blockName: "Marie Curie Hall (Block B)",
    reason: "Family wedding and festival weekend leave",
    destination: "Chicago, IL",
    departureTime: "2026-10-15T16:00:00.000Z",
    expectedReturnTime: "2026-10-19T21:00:00.000Z",
    status: "PENDING_WARDEN",
    emergencyContact: "+1 (555) 774-8833",
    parentConsentVerified: true,
    createdAt: "2026-10-06T09:15:00.000Z",
  },
];

const DEFAULT_MESS_PLANS: MessPlan[] = [
  {
    id: "mp-veg",
    name: "Royal Sattvic & Continental Veg",
    description: "Nutritionally balanced multi-cuisine vegetarian menu prepared in dedicated clean kitchens.",
    dietType: "VEG",
    monthlyFee: 260,
    activeSubscribers: 185,
    weeklyHighlights: {
      breakfast: "Oatmeal porridge, Fresh Fruit, Idli/Sambar, Masala Omelette alternative",
      lunch: "Paneer Lababdar, Dal Tadka, Steamed Basmati Rice, Artisan Naan, Curd",
      snacks: "Samosa/Tea & Cold Pressed Juice",
      dinner: "Methi Malai Mutter, Mixed Lentils, Phulkas, Kheer dessert",
    },
  },
  {
    id: "mp-special",
    name: "High-Protein & Non-Vegetarian Executive",
    description: "Custom athlete and fitness plan with grilled chicken, eggs, fish curry, and macro-counted sides.",
    dietType: "NON_VEG",
    monthlyFee: 340,
    activeSubscribers: 142,
    weeklyHighlights: {
      breakfast: "Boiled Eggs, Peanut Butter Toast, Protein Shake, Seasonal Fruits",
      lunch: "Grilled Herb Chicken Breast, Brown Rice, Steamed Greens, Lentil Soup",
      snacks: "Roasted Almonds, Whey Shake, Banana Walnut Muffin",
      dinner: "Coastal Fish Curry, Fragrant Rice, Garden Salad, Low-fat Custard",
    },
  },
];

const DEFAULT_SUBSCRIPTIONS: StudentMessSubscription[] = [
  {
    studentId: "stu-alex-01",
    studentName: "Alex Mercer",
    studentRoll: "CS2026-001",
    planId: "mp-special",
    planName: "High-Protein & Non-Vegetarian Executive",
    status: "ACTIVE",
    rebateDaysCount: 0,
  },
  {
    studentId: "stu-priya-03",
    studentName: "Priya Sharma",
    studentRoll: "CS2026-018",
    planId: "mp-veg",
    planName: "Royal Sattvic & Continental Veg",
    status: "ACTIVE",
    rebateDaysCount: 0,
  },
];

export const DEFAULT_PUNCHED_MEALS: PunchedMeal[] = [
  {
    id: "tok-101",
    studentRoll: "CS2026-001",
    studentName: "Alex Rivera",
    plan: "All-Access Premium Buffet",
    mealType: "Dinner (Executive)",
    timestamp: "Just now",
    lane: "Turnstile Gate #02 (Optical)",
    tokenHash: "0x89f4b...3e1a",
  },
  {
    id: "tok-102",
    studentRoll: "ME2025-042",
    studentName: "Priya Sharma",
    plan: "South Indian Vegetarian",
    mealType: "Dinner (Executive)",
    timestamp: "3 mins ago",
    lane: "Turnstile Gate #01 (Biometric)",
    tokenHash: "0x12c8a...9f00",
  },
  {
    id: "tok-103",
    studentRoll: "EE2024-019",
    studentName: "Marcus Vance",
    plan: "Continental & Halal Fusion",
    mealType: "Dinner (Executive)",
    timestamp: "7 mins ago",
    lane: "Turnstile Gate #03 (RFID Card)",
    tokenHash: "0x44d1e...bc27",
  },
];

export const DEFAULT_WASTE_LOGS: WasteLog[] = [
  { id: "w-1", session: "Dinner (Yesterday)", preparedKg: 340, consumedKg: 318, wastedKg: 22, residents: 410, divertedToBiogas: true },
  { id: "w-2", session: "Breakfast (Today)", preparedKg: 210, consumedKg: 198, wastedKg: 12, residents: 380, divertedToBiogas: true },
  { id: "w-3", session: "Lunch (Today)", preparedKg: 360, consumedKg: 334, wastedKg: 26, residents: 395, divertedToBiogas: true },
];

export const DEFAULT_TRANSFERS: RoomTransferRequest[] = [
  {
    id: "tr-001",
    requestNumber: "TR-2026-081",
    studentId: "stu-alex-01",
    studentName: "Alex Mercer",
    studentRoll: "CS2026-001",
    currentRoomId: "rm-a-101",
    currentRoomNumber: "A-101",
    currentBedNumber: "A",
    currentBlockName: "Nelson Mandela Hall (Block A)",
    targetRoomId: "rm-c-301",
    targetRoomNumber: "C-301",
    targetBedNumber: "A",
    targetBlockName: "C.V. Raman Postgrad Scholars Hall (Block C)",
    reason: "Promoted to AI Research Fellowship; requiring quiet postgrad research floor.",
    status: "PENDING_WARDEN",
    requestedAt: "2026-10-18T14:20:00.000Z",
  },
];

export const DEFAULT_MAINTENANCE_TICKETS: HostelMaintenanceTicket[] = [
  {
    id: "maint-101",
    ticketNumber: "HST-MNT-101",
    blockId: "blk-a",
    blockName: "Nelson Mandela Hall (Block A)",
    roomNumber: "A-102",
    bedNumber: "A",
    category: "PLUMBING",
    priority: "HIGH",
    status: "OPEN",
    description: "Attached washroom washbasin tap continuously leaking with severe water pressure drop.",
    reportedBy: "David Miller",
    reportedRoll: "ME2026-015",
    reportedAt: "2026-10-28T09:15:00.000Z",
  },
  {
    id: "maint-102",
    ticketNumber: "HST-MNT-102",
    blockId: "blk-b",
    blockName: "Marie Curie Hall (Block B)",
    roomNumber: "B-201",
    bedNumber: "A",
    category: "ELECTRICAL",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    description: "Ceiling fan speed regulator sparking on setting 4. Fan oscillates erratically.",
    reportedBy: "Priya Sharma",
    reportedRoll: "CS2026-018",
    assignedTechnician: "Campus Electrician Ramesh K.",
    reportedAt: "2026-10-27T11:40:00.000Z",
  },
  {
    id: "maint-103",
    ticketNumber: "HST-MNT-103",
    blockId: "blk-a",
    blockName: "Nelson Mandela Hall (Block A)",
    roomNumber: "A-101",
    bedNumber: "B",
    category: "INTERNET_WIFI",
    priority: "LOW",
    status: "RESOLVED",
    description: "Ethernet wall jack RJ45 clip loose; packet drop during distributed computing lab sync.",
    reportedBy: "Ryan Gosling",
    reportedRoll: "CS2026-002",
    assignedTechnician: "Network Admin Deepak S.",
    reportedAt: "2026-10-25T16:00:00.000Z",
    resolvedAt: "2026-10-26T10:30:00.000Z",
    resolutionNotes: "Wall plate replaced, Cat6 keystone re-terminated and validated at 1Gbps duplex.",
  },
];

export const DEFAULT_VISITORS: HostelVisitorRecord[] = [
  {
    id: "vis-001",
    badgeNumber: "VTR-HST-881",
    studentRoll: "CS2026-001",
    studentName: "Alex Mercer",
    roomNumber: "A-101",
    blockName: "Nelson Mandela Hall (Block A)",
    visitorName: "Robert Mercer",
    relation: "PARENT",
    phone: "+1 (555) 441-9988",
    idProofNumber: "DL-MA-9921827",
    checkInTime: "2026-11-02T11:30:00.000Z",
    status: "CHECKED_IN",
    gateSecurityOfficer: "Officer B. K. Singh (Gate #01)",
    purpose: "Parental visit for semester commencement kit delivery & winter blankets.",
  },
  {
    id: "vis-002",
    badgeNumber: "VTR-HST-882",
    studentRoll: "CS2026-018",
    studentName: "Priya Sharma",
    roomNumber: "B-201",
    blockName: "Marie Curie Hall (Block B)",
    visitorName: "Anjali Sharma",
    relation: "PARENT",
    phone: "+1 (555) 321-4411",
    idProofNumber: "AADHAAR-4491-0029",
    checkInTime: "2026-11-01T14:00:00.000Z",
    checkOutTime: "2026-11-01T18:15:00.000Z",
    status: "CHECKED_OUT",
    gateSecurityOfficer: "Officer P. L. Rawat (Gate #02)",
    purpose: "Family festival sweets and medical supplements handover.",
  },
];

export const DEFAULT_WAITLIST: HostelWaitlistEntry[] = [
  {
    id: "wl-001",
    waitlistToken: "WL-BLK-A-01",
    studentId: "stu-wait-01",
    studentName: "Rohan Saxena",
    studentRoll: "CS2026-088",
    gender: "MALE",
    branch: "B.Tech Computer Science",
    preferredBlockId: "blk-a",
    preferredBlockName: "Nelson Mandela Hall (Block A)",
    preferredRoomType: "DOUBLE_AC",
    distanceFromHomeKm: 1450,
    priorityScore: 92,
    status: "WAITLISTED",
    appliedAt: "2026-10-12T09:00:00.000Z",
  },
  {
    id: "wl-002",
    waitlistToken: "WL-BLK-B-01",
    studentId: "stu-wait-02",
    studentName: "Meera Nair",
    studentRoll: "EC2026-034",
    gender: "FEMALE",
    branch: "B.Tech Electronics & Comm",
    preferredBlockId: "blk-b",
    preferredBlockName: "Marie Curie Hall (Block B)",
    preferredRoomType: "SINGLE_AC",
    distanceFromHomeKm: 980,
    priorityScore: 84,
    status: "WAITLISTED",
    appliedAt: "2026-10-14T11:20:00.000Z",
  },
];

function readStore(): HostelStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: HostelStoreSchema = {
      blocks: DEFAULT_BLOCKS,
      rooms: DEFAULT_ROOMS,
      gatePasses: DEFAULT_GATE_PASSES,
      messPlans: DEFAULT_MESS_PLANS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      punchedMeals: DEFAULT_PUNCHED_MEALS,
      wasteLogs: DEFAULT_WASTE_LOGS,
      transferRequests: DEFAULT_TRANSFERS,
      maintenanceTickets: DEFAULT_MAINTENANCE_TICKETS,
      visitors: DEFAULT_VISITORS,
      waitlist: DEFAULT_WAITLIST,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed: HostelStoreSchema = JSON.parse(raw);
    let changed = false;
    if (!parsed.punchedMeals || !Array.isArray(parsed.punchedMeals)) {
      parsed.punchedMeals = DEFAULT_PUNCHED_MEALS;
      changed = true;
    }
    if (!parsed.wasteLogs || !Array.isArray(parsed.wasteLogs)) {
      parsed.wasteLogs = DEFAULT_WASTE_LOGS;
      changed = true;
    }
    if (!parsed.transferRequests || !Array.isArray(parsed.transferRequests)) {
      parsed.transferRequests = DEFAULT_TRANSFERS;
      changed = true;
    }
    if (!parsed.maintenanceTickets || !Array.isArray(parsed.maintenanceTickets)) {
      parsed.maintenanceTickets = DEFAULT_MAINTENANCE_TICKETS;
      changed = true;
    }
    if (!parsed.visitors || !Array.isArray(parsed.visitors)) {
      parsed.visitors = DEFAULT_VISITORS;
      changed = true;
    }
    if (!parsed.waitlist || !Array.isArray(parsed.waitlist)) {
      parsed.waitlist = DEFAULT_WAITLIST;
      changed = true;
    }
    if (changed) {
      writeStore(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading hostel store, fallback to default", err);
    return {
      blocks: DEFAULT_BLOCKS,
      rooms: DEFAULT_ROOMS,
      gatePasses: DEFAULT_GATE_PASSES,
      messPlans: DEFAULT_MESS_PLANS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      punchedMeals: DEFAULT_PUNCHED_MEALS,
      wasteLogs: DEFAULT_WASTE_LOGS,
      transferRequests: DEFAULT_TRANSFERS,
      maintenanceTickets: DEFAULT_MAINTENANCE_TICKETS,
      visitors: DEFAULT_VISITORS,
      waitlist: DEFAULT_WAITLIST,
    };
  }
}

function writeStore(data: HostelStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const hostelStore = {
  resetStore() {
    writeStore({
      blocks: JSON.parse(JSON.stringify(DEFAULT_BLOCKS)),
      rooms: JSON.parse(JSON.stringify(DEFAULT_ROOMS)),
      gatePasses: JSON.parse(JSON.stringify(DEFAULT_GATE_PASSES)),
      messPlans: JSON.parse(JSON.stringify(DEFAULT_MESS_PLANS)),
      subscriptions: JSON.parse(JSON.stringify(DEFAULT_SUBSCRIPTIONS)),
      nightRollCalls: [],
      punchedMeals: JSON.parse(JSON.stringify(DEFAULT_PUNCHED_MEALS)),
      wasteLogs: JSON.parse(JSON.stringify(DEFAULT_WASTE_LOGS)),
      transferRequests: JSON.parse(JSON.stringify(DEFAULT_TRANSFERS)),
      maintenanceTickets: JSON.parse(JSON.stringify(DEFAULT_MAINTENANCE_TICKETS)),
      visitors: JSON.parse(JSON.stringify(DEFAULT_VISITORS)),
      waitlist: JSON.parse(JSON.stringify(DEFAULT_WAITLIST)),
    });
  },

  getSummary() {
    const store = readStore();
    const totalBeds = store.blocks.reduce((acc, b) => acc + b.totalBeds, 0);
    const occupiedBeds = store.blocks.reduce((acc, b) => acc + b.occupiedBeds, 0);
    const pendingPasses = store.gatePasses.filter((p) => p.status === "PENDING_WARDEN").length;
    const activeMessSubscribers = store.subscriptions.filter((s) => s.status === "ACTIVE").length;

    return {
      totalBlocks: store.blocks.length,
      totalRooms: store.rooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 1000) / 10 : 0,
      pendingGatePasses: pendingPasses,
      activeMessSubscribers,
      blocks: store.blocks.map((b) => ({
        ...b,
        stats: calculateBlockOccupancy(b),
      })),
    };
  },

  getRooms(blockId?: string) {
    const store = readStore();
    if (blockId) {
      return store.rooms.filter((r) => r.blockId === blockId);
    }
    return store.rooms;
  },

  getGatePasses() {
    return readStore().gatePasses;
  },

  getMessPlans() {
    const store = readStore();
    return {
      plans: store.messPlans,
      subscriptions: store.subscriptions,
    };
  },

  allocateBed(params: {
    roomId: string;
    bedNumber: string;
    studentId: string;
    studentName: string;
    studentRoll: string;
    branch: string;
  }) {
    const store = readStore();
    const room = store.rooms.find((r) => r.id === params.roomId);
    if (!room) throw new Error("Specified room could not be found.");

    const alreadyAllocated = store.rooms.some((r) =>
      r.beds.some(
        (b) =>
          b.isOccupied &&
          (b.studentRoll === params.studentRoll || (params.studentId && b.studentId === params.studentId))
      )
    );
    if (alreadyAllocated) {
      throw new Error(`Conflict: Student ${params.studentRoll} is already allocated a hostel bed.`);
    }

    const bed = room.beds.find((b) => b.bedNumber === params.bedNumber);
    if (!bed) throw new Error(`Bed ${params.bedNumber} does not exist in room ${room.roomNumber}.`);
    if (bed.isOccupied) throw new Error(`Bed ${params.bedNumber} is already occupied by ${bed.studentName}.`);

    bed.isOccupied = true;
    bed.studentId = params.studentId;
    bed.studentName = params.studentName;
    bed.studentRoll = params.studentRoll;
    bed.branch = params.branch;
    bed.allocatedDate = new Date().toISOString().split("T")[0];
    bed.feeStatus = "PAID";

    room.occupiedCount = room.beds.filter((b) => b.isOccupied).length;
    room.status = determineRoomStatus(room.beds, room.capacity);

    // Update block occupied count
    const block = store.blocks.find((b) => b.id === room.blockId);
    if (block) {
      block.occupiedBeds += 1;
    }

    writeStore(store);
    return { success: true, room, bed };
  },

  vacateBed(params: { roomId?: string; bedNumber?: string; studentRoll?: string }) {
    const store = readStore();
    let targetRoom: HostelRoom | undefined;
    let targetBed: HostelBed | undefined;

    if (params.studentRoll) {
      targetRoom = store.rooms.find((r) => r.beds.some((b) => b.isOccupied && b.studentRoll === params.studentRoll));
      if (targetRoom) {
        targetBed = targetRoom.beds.find((b) => b.isOccupied && b.studentRoll === params.studentRoll);
      }
    } else if (params.roomId && params.bedNumber) {
      targetRoom = store.rooms.find((r) => r.id === params.roomId);
      if (targetRoom) {
        targetBed = targetRoom.beds.find((b) => b.bedNumber === params.bedNumber);
      }
    }

    if (!targetRoom || !targetBed) {
      throw new Error("Specified room or resident bed allocation could not be found.");
    }

    if (!targetBed.isOccupied) {
      throw new Error(`Bed ${targetBed.bedNumber} in room ${targetRoom.roomNumber} is already vacant.`);
    }

    const vacatedStudent = {
      roll: targetBed.studentRoll,
      name: targetBed.studentName,
    };

    targetBed.isOccupied = false;
    delete targetBed.studentId;
    delete targetBed.studentName;
    delete targetBed.studentRoll;
    delete targetBed.branch;
    delete targetBed.allocatedDate;
    delete targetBed.feeStatus;

    targetRoom.occupiedCount = targetRoom.beds.filter((b) => b.isOccupied).length;
    targetRoom.status = determineRoomStatus(targetRoom.beds, targetRoom.capacity);

    const block = store.blocks.find((b) => b.id === targetRoom!.blockId);
    if (block && block.occupiedBeds > 0) {
      block.occupiedBeds -= 1;
    }

    writeStore(store);
    return { success: true, room: targetRoom, vacatedStudent };
  },

  createGatePass(payload: Partial<GatePass>) {
    const validation = validateGatePassRequest(payload);
    if (!validation.isValid) {
      throw new Error(`Gate Pass Validation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const newPass: GatePass = {
      id: `gp-${Date.now()}`,
      passNumber: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: payload.studentId || "stu-guest",
      studentName: payload.studentName!,
      studentRoll: payload.studentRoll!,
      roomNumber: payload.roomNumber || "Unassigned",
      blockName: payload.blockName || "General Hostel Wing",
      reason: payload.reason!,
      destination: payload.destination!,
      departureTime: payload.departureTime!,
      expectedReturnTime: payload.expectedReturnTime!,
      status: "PENDING_WARDEN",
      emergencyContact: payload.emergencyContact!,
      parentConsentVerified: Boolean(payload.parentConsentVerified),
      remarks: payload.remarks,
      createdAt: new Date().toISOString(),
    };

    store.gatePasses.unshift(newPass);
    writeStore(store);
    return newPass;
  },

  updateGatePass(id: string, action: "APPROVE" | "REJECT" | "CHECK_OUT" | "RETURN", actor: string, remarks?: string) {
    const store = readStore();
    const index = store.gatePasses.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Gate pass not found.");

    const updated = processGatePassAction(store.gatePasses[index], action, actor, remarks);
    store.gatePasses[index] = updated;
    writeStore(store);
    return updated;
  },

  subscribeMess(studentId: string, studentName: string, studentRoll: string, planId: string) {
    const store = readStore();
    const plan = store.messPlans.find((p) => p.id === planId);
    if (!plan) throw new Error("Mess plan not found.");

    const existingIndex = store.subscriptions.findIndex((s) => s.studentId === studentId);
    if (existingIndex >= 0) {
      store.subscriptions[existingIndex].planId = planId;
      store.subscriptions[existingIndex].planName = plan.name;
      store.subscriptions[existingIndex].status = "ACTIVE";
    } else {
      store.subscriptions.push({
        studentId,
        studentName,
        studentRoll,
        planId,
        planName: plan.name,
        status: "ACTIVE",
        rebateDaysCount: 0,
      });
    }

    writeStore(store);
    return { success: true, planName: plan.name };
  },

  claimMessRebate(studentRoll: string, leaveDays: number) {
    if (leaveDays < 3) {
      throw new Error("Mess rebate requires a minimum of 3 consecutive sanctioned leave days.");
    }
    const store = readStore();
    const sub = store.subscriptions.find((s) => s.studentRoll === studentRoll);
    if (!sub) {
      throw new Error(`Active mess subscription not found for roll number ${studentRoll}.`);
    }
    const plan = store.messPlans.find((p) => p.id === sub.planId);
    const monthlyFee = plan ? plan.monthlyFee : 260;
    const rebateAmount = calculateMessRebate(monthlyFee, leaveDays);

    sub.rebateDaysCount = (sub.rebateDaysCount || 0) + leaveDays;
    writeStore(store);
    return {
      success: true,
      studentRoll,
      leaveDays,
      rebateAmount,
      updatedRebateDays: sub.rebateDaysCount,
    };
  },

  getNightRollCall(blockId?: string) {
    const store = readStore();
    const defaultRollCalls = [
      {
        id: "nrc-2026-10-08",
        date: new Date().toISOString().split("T")[0],
        curfewTime: "21:30",
        blockId: "blk-a",
        blockName: "Nelson Mandela Hall (Block A)",
        wardenOnDuty: "Dr. Arthur Pendelton",
        status: "IN_PROGRESS",
        totalResidents: 6,
        inRoomCount: 4,
        permittedOutpassCount: 1,
        unauthorizedAbsentCount: 1,
        roster: [
          {
            studentRoll: "CS2026-001",
            studentName: "Alex Mercer",
            roomNumber: "A-101",
            bedId: "A101-B1",
            status: "IN_ROOM",
            updatedAt: new Date().toISOString(),
            remarks: "Biometric optical verify",
          },
          {
            studentRoll: "CS2026-089",
            studentName: "Rohan Deshmukh",
            roomNumber: "A-101",
            bedId: "A101-B2",
            status: "IN_ROOM",
            updatedAt: new Date().toISOString(),
            remarks: "Present in room",
          },
          {
            studentRoll: "ME2025-042",
            studentName: "Priya Sharma",
            roomNumber: "A-102",
            bedId: "A102-B1",
            status: "PERMITTED_LATE_PASS",
            updatedAt: new Date().toISOString(),
            remarks: "Library night pass till 23:00",
          },
          {
            studentRoll: "EE2024-019",
            studentName: "Karan Singhania",
            roomNumber: "A-102",
            bedId: "A102-B2",
            status: "UNAUTHORIZED_ABSENT",
            updatedAt: new Date().toISOString(),
            remarks: "Not in room, SOS outpass alert flagged",
          },
          {
            studentRoll: "CS2025-014",
            studentName: "Tanya Mehta",
            roomNumber: "A-103",
            bedId: "A103-B1",
            status: "HOME_LEAVE",
            updatedAt: new Date().toISOString(),
            remarks: "Diwali sanctioned home leave",
          },
          {
            studentRoll: "CS2026-042",
            studentName: "Alex Rivera",
            roomNumber: "A-103",
            bedId: "A103-B2",
            status: "IN_ROOM",
            updatedAt: new Date().toISOString(),
            remarks: "Verified present",
          },
        ],
      },
    ];

    const rollCalls = store.nightRollCalls || defaultRollCalls;
    if (blockId && blockId !== "all") {
      return rollCalls.filter((rc: any) => rc.blockId === blockId);
    }
    return rollCalls;
  },

  submitNightRollCall(payload: {
    blockId: string;
    blockName?: string;
    wardenOnDuty?: string;
    roster: any[];
  }) {
    const store = readStore();
    const defaultRollCalls = [
      {
        id: "nrc-2026-10-08",
        date: new Date().toISOString().split("T")[0],
        curfewTime: "21:30",
        blockId: "blk-a",
        blockName: "Nelson Mandela Hall (Block A)",
        wardenOnDuty: "Dr. Arthur Pendelton",
        status: "IN_PROGRESS",
        totalResidents: 6,
        inRoomCount: 4,
        permittedOutpassCount: 1,
        unauthorizedAbsentCount: 1,
        roster: [],
      },
    ];

    if (!store.nightRollCalls) {
      store.nightRollCalls = defaultRollCalls;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const inRoomCount = payload.roster.filter((r) => r.status === "IN_ROOM").length;
    const permittedOutpassCount = payload.roster.filter((r) => r.status === "PERMITTED_LATE_PASS").length;
    const unauthorizedAbsentCount = payload.roster.filter((r) => r.status === "UNAUTHORIZED_ABSENT").length;

    const existingIdx = store.nightRollCalls.findIndex(
      (rc: any) => rc.blockId === payload.blockId && rc.date === todayStr
    );

    const record = {
      id: existingIdx >= 0 ? store.nightRollCalls[existingIdx].id : `nrc-${Date.now()}`,
      date: todayStr,
      curfewTime: "21:30",
      blockId: payload.blockId,
      blockName: payload.blockName || "Hostel Residential Block",
      wardenOnDuty: payload.wardenOnDuty || "Resident Hostel Warden",
      status: "COMPLETED",
      totalResidents: payload.roster.length,
      inRoomCount,
      permittedOutpassCount,
      unauthorizedAbsentCount,
      roster: payload.roster,
    };

    if (existingIdx >= 0) {
      store.nightRollCalls[existingIdx] = record;
    } else {
      store.nightRollCalls.unshift(record);
    }

    writeStore(store);
    return record;
  },

  getPunchedMeals(): PunchedMeal[] {
    const store = readStore();
    return store.punchedMeals || DEFAULT_PUNCHED_MEALS;
  },

  recordMealPunch(punch: Omit<PunchedMeal, "id" | "timestamp" | "tokenHash">) {
    const store = readStore();
    if (!store.punchedMeals) store.punchedMeals = [...DEFAULT_PUNCHED_MEALS];
    const newPunch: PunchedMeal = {
      id: `tok-${Date.now()}`,
      studentRoll: punch.studentRoll,
      studentName: punch.studentName,
      plan: punch.plan || "All-Access Premium Buffet",
      mealType: punch.mealType || "Dinner (Executive)",
      timestamp: "Just now",
      lane: punch.lane || "Turnstile Gate #01 (Biometric Optical)",
      tokenHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    store.punchedMeals.unshift(newPunch);
    writeStore(store);
    return newPunch;
  },

  getWasteLogs(): WasteLog[] {
    const store = readStore();
    return store.wasteLogs || DEFAULT_WASTE_LOGS;
  },

  recordFoodWaste(log: Omit<WasteLog, "id" | "divertedToBiogas">) {
    const store = readStore();
    if (!store.wasteLogs) store.wasteLogs = [...DEFAULT_WASTE_LOGS];
    const newEntry: WasteLog = {
      id: `w-${Date.now()}`,
      session: log.session,
      preparedKg: Number(log.preparedKg),
      consumedKg: Number(log.consumedKg),
      wastedKg: Number(log.wastedKg),
      residents: Number(log.residents) || 1,
      divertedToBiogas: true,
    };
    store.wasteLogs.unshift(newEntry);
    writeStore(store);
    return newEntry;
  },

  // -------------------------------------------------------------
  // Room Transfer & Bed Swap Methods
  // -------------------------------------------------------------
  getTransferRequests(studentRoll?: string): RoomTransferRequest[] {
    const store = readStore();
    const list = store.transferRequests || DEFAULT_TRANSFERS;
    if (studentRoll) {
      return list.filter((t) => t.studentRoll === studentRoll);
    }
    return list;
  },

  requestRoomTransfer(payload: Partial<RoomTransferRequest>): RoomTransferRequest {
    const validation = validateTransferRequest(payload);
    if (!validation.isValid) {
      throw new Error(`Room Transfer Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.transferRequests) store.transferRequests = [...DEFAULT_TRANSFERS];

    const currentRoom = store.rooms.find((r) => r.id === payload.currentRoomId);
    const targetRoom = store.rooms.find((r) => r.id === payload.targetRoomId);
    if (!currentRoom) throw new Error("Current room could not be found.");
    if (!targetRoom) throw new Error("Target room could not be found.");

    const targetBed = targetRoom.beds.find((b) => b.bedNumber === payload.targetBedNumber);
    if (!targetBed) throw new Error(`Target Bed ${payload.targetBedNumber} does not exist in room ${targetRoom.roomNumber}.`);
    if (targetBed.isOccupied) throw new Error(`Target Bed ${payload.targetBedNumber} in room ${targetRoom.roomNumber} is already occupied.`);

    const newTransfer: RoomTransferRequest = {
      id: `tr-${Date.now()}`,
      requestNumber: `TR-2026-${Math.floor(100 + Math.random() * 900)}`,
      studentId: payload.studentId || "stu-resident",
      studentName: payload.studentName || "Student Resident",
      studentRoll: payload.studentRoll!,
      currentRoomId: payload.currentRoomId!,
      currentRoomNumber: currentRoom.roomNumber,
      currentBedNumber: payload.currentBedNumber!,
      currentBlockName: currentRoom.blockName,
      targetRoomId: payload.targetRoomId!,
      targetRoomNumber: targetRoom.roomNumber,
      targetBedNumber: payload.targetBedNumber!,
      targetBlockName: targetRoom.blockName,
      reason: payload.reason!,
      status: "PENDING_WARDEN",
      requestedAt: new Date().toISOString(),
    };

    store.transferRequests.unshift(newTransfer);
    writeStore(store);
    return newTransfer;
  },

  processRoomTransfer(
    transferId: string,
    action: "APPROVE" | "REJECT",
    actor: string,
    remarks?: string
  ): RoomTransferRequest {
    const store = readStore();
    if (!store.transferRequests) store.transferRequests = [...DEFAULT_TRANSFERS];

    const transfer = store.transferRequests.find((t) => t.id === transferId);
    if (!transfer) throw new Error("Room transfer request could not be found.");
    if (transfer.status !== "PENDING_WARDEN") {
      throw new Error(`Transfer request has already been ${transfer.status.toLowerCase()}.`);
    }

    if (action === "REJECT") {
      transfer.status = "REJECTED";
      transfer.processedAt = new Date().toISOString();
      transfer.processedBy = actor;
      if (remarks) transfer.remarks = remarks;
      writeStore(store);
      return transfer;
    }

    // Action === APPROVE: Perform atomic room bed relocation
    const targetRoom = store.rooms.find((r) => r.id === transfer.targetRoomId);
    if (!targetRoom) throw new Error("Target room does not exist.");
    const targetBed = targetRoom.beds.find((b) => b.bedNumber === transfer.targetBedNumber);
    if (!targetBed) throw new Error("Target bed does not exist.");
    if (targetBed.isOccupied) {
      throw new Error(`Cannot approve transfer: Target bed ${transfer.targetBedNumber} in room ${targetRoom.roomNumber} is now occupied.`);
    }

    // 1. Vacate current bed
    this.vacateBed({
      roomId: transfer.currentRoomId,
      bedNumber: transfer.currentBedNumber,
      studentRoll: transfer.studentRoll,
    });

    // 2. Allocate target bed
    this.allocateBed({
      roomId: transfer.targetRoomId,
      bedNumber: transfer.targetBedNumber,
      studentId: transfer.studentId,
      studentName: transfer.studentName,
      studentRoll: transfer.studentRoll,
      branch: "Institutional Academic Program",
    });

    // 3. Mark transfer approved
    const refreshedStore = readStore();
    const updatedTransfer = refreshedStore.transferRequests?.find((t) => t.id === transferId) || transfer;
    updatedTransfer.status = "APPROVED";
    updatedTransfer.processedAt = new Date().toISOString();
    updatedTransfer.processedBy = actor;
    if (remarks) updatedTransfer.remarks = remarks;

    writeStore(refreshedStore);
    return updatedTransfer;
  },

  // -------------------------------------------------------------
  // Hostel Maintenance & Repair Tickets Methods
  // -------------------------------------------------------------
  getMaintenanceTickets(blockId?: string, roomNumber?: string): HostelMaintenanceTicket[] {
    const store = readStore();
    let tickets = store.maintenanceTickets || DEFAULT_MAINTENANCE_TICKETS;
    if (blockId && blockId !== "all") {
      tickets = tickets.filter((t) => t.blockId === blockId);
    }
    if (roomNumber) {
      tickets = tickets.filter((t) => t.roomNumber === roomNumber);
    }
    return tickets;
  },

  createMaintenanceTicket(payload: Partial<HostelMaintenanceTicket>): HostelMaintenanceTicket {
    const validation = validateMaintenanceTicket(payload);
    if (!validation.isValid) {
      throw new Error(`Maintenance Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.maintenanceTickets) store.maintenanceTickets = [...DEFAULT_MAINTENANCE_TICKETS];

    const block = store.blocks.find((b) => b.id === payload.blockId) || store.blocks[0];

    const newTicket: HostelMaintenanceTicket = {
      id: `maint-${Date.now()}`,
      ticketNumber: `HST-MNT-${Math.floor(100 + Math.random() * 900)}`,
      blockId: payload.blockId || block.id,
      blockName: payload.blockName || block.name,
      roomNumber: payload.roomNumber!,
      bedNumber: payload.bedNumber,
      category: payload.category!,
      priority: payload.priority || "MEDIUM",
      status: "OPEN",
      description: payload.description!,
      reportedBy: payload.reportedBy || "Resident Scholar",
      reportedRoll: payload.reportedRoll,
      reportedAt: new Date().toISOString(),
    };

    store.maintenanceTickets.unshift(newTicket);
    writeStore(store);
    return newTicket;
  },

  updateMaintenanceTicket(
    ticketId: string,
    status: MaintenanceStatus,
    actor?: string,
    resolutionNotes?: string
  ): HostelMaintenanceTicket {
    const store = readStore();
    if (!store.maintenanceTickets) store.maintenanceTickets = [...DEFAULT_MAINTENANCE_TICKETS];

    const ticket = store.maintenanceTickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error("Maintenance ticket could not be found.");

    ticket.status = status;
    if (actor && !ticket.assignedTechnician) {
      ticket.assignedTechnician = actor;
    }
    if (status === "RESOLVED") {
      ticket.resolvedAt = new Date().toISOString();
      if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;
    }

    writeStore(store);
    return ticket;
  },

  // -------------------------------------------------------------
  // Hostel Visitor & Guest Register Methods
  // -------------------------------------------------------------
  getVisitors(studentRoll?: string): HostelVisitorRecord[] {
    const store = readStore();
    let visitors = store.visitors || DEFAULT_VISITORS;
    if (studentRoll) {
      visitors = visitors.filter((v) => v.studentRoll === studentRoll);
    }
    return visitors;
  },

  registerVisitor(payload: Partial<HostelVisitorRecord>): HostelVisitorRecord {
    const validation = validateVisitorRecord(payload);
    if (!validation.isValid) {
      throw new Error(`Visitor Registration Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.visitors) store.visitors = [...DEFAULT_VISITORS];

    const newVisitor: HostelVisitorRecord = {
      id: `vis-${Date.now()}`,
      badgeNumber: `VTR-HST-${Math.floor(800 + Math.random() * 199)}`,
      studentRoll: payload.studentRoll!,
      studentName: payload.studentName || "Host Resident",
      roomNumber: payload.roomNumber || "Residence Room",
      blockName: payload.blockName || "Residence Hall",
      visitorName: payload.visitorName!,
      relation: payload.relation || "PARENT",
      phone: payload.phone!,
      idProofNumber: payload.idProofNumber!,
      checkInTime: new Date().toISOString(),
      status: "CHECKED_IN",
      gateSecurityOfficer: payload.gateSecurityOfficer || "Gate Security Officer",
      purpose: payload.purpose!,
    };

    store.visitors.unshift(newVisitor);
    writeStore(store);
    return newVisitor;
  },

  checkoutVisitor(visitorId: string): HostelVisitorRecord {
    const store = readStore();
    if (!store.visitors) store.visitors = [...DEFAULT_VISITORS];

    const visitor = store.visitors.find((v) => v.id === visitorId);
    if (!visitor) throw new Error("Visitor record could not be found.");
    if (visitor.status === "CHECKED_OUT") {
      throw new Error("Visitor has already been checked out.");
    }

    visitor.status = "CHECKED_OUT";
    visitor.checkOutTime = new Date().toISOString();

    writeStore(store);
    return visitor;
  },

  // -------------------------------------------------------------
  // Hostel Waitlist Methods
  // -------------------------------------------------------------
  getWaitlist(): HostelWaitlistEntry[] {
    const store = readStore();
    return store.waitlist || DEFAULT_WAITLIST;
  },

  joinWaitlist(payload: Partial<HostelWaitlistEntry>): HostelWaitlistEntry {
    const store = readStore();
    if (!store.waitlist) store.waitlist = [...DEFAULT_WAITLIST];

    const block = store.blocks.find((b) => b.id === payload.preferredBlockId) || store.blocks[0];
    const dist = Number(payload.distanceFromHomeKm) || 100;
    const priority = Math.min(100, Math.round(50 + dist / 30));

    const newWaitlist: HostelWaitlistEntry = {
      id: `wl-${Date.now()}`,
      waitlistToken: `WL-${block.code}-${Math.floor(10 + Math.random() * 90)}`,
      studentId: payload.studentId || "stu-wait",
      studentName: payload.studentName || "Applicant Scholar",
      studentRoll: payload.studentRoll || "STU-2026",
      gender: payload.gender || "COED",
      branch: payload.branch || "General Program",
      preferredBlockId: block.id,
      preferredBlockName: block.name,
      preferredRoomType: payload.preferredRoomType || "DOUBLE_AC",
      distanceFromHomeKm: dist,
      priorityScore: priority,
      status: "WAITLISTED",
      appliedAt: new Date().toISOString(),
    };

    store.waitlist.push(newWaitlist);
    writeStore(store);
    return newWaitlist;
  },
};
