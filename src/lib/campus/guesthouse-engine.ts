/**
 * University Guest House & Visiting Faculty Transit Accommodation Engine
 * Module 55: Real-world Higher Education ERP Campus Infrastructure
 */

export type RoomCategory = "VIP_SUITE" | "FACULTY_TRANSIT" | "EXECUTIVE_AC" | "SCHOLAR_STANDARD";

export type BookingStatus =
  | "PENDING_ESTATE_APPROVAL"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type BillingMode = "DEPT_BUDGET" | "SELF_PAID" | "PROJECT_GRANT";

export interface GuestHouseRoom {
  id: string;
  roomNumber: string;
  category: RoomCategory;
  floor: number;
  wing: "NORTH_EXECUTIVE" | "SOUTH_HERITAGE" | "CENTENARY_TOWER";
  baseTariffPerNight: number;
  amenities: string[];
  isAvailable: boolean;
  currentBookingId?: string;
}

export interface DiningCharge {
  id: string;
  date: string;
  mealType: "BREAKFAST" | "LUNCH" | "HIGH_TEA" | "DINNER";
  amountInr: number;
  description: string;
}

export interface GuestHouseBooking {
  id: string;
  requisitionNumber: string; // APEX-UGH-REQ-2026-XXXX
  allotmentNumber?: string;   // APEX-UGH-ALLOC-XXXX
  invoiceNumber?: string;     // APEX-UGH-INV-XXXX
  roomId: string;
  roomNumber: string;
  roomCategory: RoomCategory;
  guestName: string;
  guestAffiliation: string;
  guestDesignation: string;
  guestPhone: string;
  guestEmail: string;
  purpose: "EXTERNAL_EXAMINER" | "VISITING_PROFESSOR" | "ACCREDITATION_TEAM" | "GUEST_LECTURE" | "OFFICIAL_CONFERENCE";
  sponsoringDepartment: string;
  sponsorFacultyName: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfNights: number;
  billingMode: BillingMode;
  departmentBudgetCode?: string;
  status: BookingStatus;
  checkInTimestamp?: string;
  checkOutTimestamp?: string;
  actualCheckInTime?: string;
  actualCheckOutTime?: string;
  diningCharges: DiningCharge[];
  roomChargesTotal: number;
  diningChargesTotal: number;
  grandTotalInr: number;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  createdAt: string;
}

export interface GuestHouseAnalytics {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  totalBookings: number;
  pendingApprovals: number;
  activeResidents: number;
  revenueTotalInr: number;
  deptDebitedInr: number;
}

class GuestHouseStore {
  private rooms: GuestHouseRoom[] = [
    {
      id: "RM-101",
      roomNumber: "Suite 101",
      category: "VIP_SUITE",
      floor: 1,
      wing: "NORTH_EXECUTIVE",
      baseTariffPerNight: 2500,
      amenities: ["King Bed", "Chancellor Lounge Access", "High-Speed Wi-Fi", "Dedicated Butler", "Workstation"],
      isAvailable: false,
      currentBookingId: "BK-2026-001",
    },
    {
      id: "RM-102",
      roomNumber: "Suite 102",
      category: "VIP_SUITE",
      floor: 1,
      wing: "NORTH_EXECUTIVE",
      baseTariffPerNight: 2500,
      amenities: ["King Bed", "Chancellor Lounge Access", "High-Speed Wi-Fi", "Workstation"],
      isAvailable: true,
    },
    {
      id: "RM-201",
      roomNumber: "Studio 201",
      category: "FACULTY_TRANSIT",
      floor: 2,
      wing: "CENTENARY_TOWER",
      baseTariffPerNight: 1200,
      amenities: ["Queen Bed", "Kitchenette", "Attached Study", "High-Speed Wi-Fi"],
      isAvailable: false,
      currentBookingId: "BK-2026-002",
    },
    {
      id: "RM-202",
      roomNumber: "Studio 202",
      category: "FACULTY_TRANSIT",
      floor: 2,
      wing: "CENTENARY_TOWER",
      baseTariffPerNight: 1200,
      amenities: ["Queen Bed", "Kitchenette", "Attached Study", "High-Speed Wi-Fi"],
      isAvailable: true,
    },
    {
      id: "RM-301",
      roomNumber: "Room 301",
      category: "EXECUTIVE_AC",
      floor: 3,
      wing: "SOUTH_HERITAGE",
      baseTariffPerNight: 1000,
      amenities: ["Twin Beds", "AC", "Smart TV", "Workstation"],
      isAvailable: true,
    },
    {
      id: "RM-302",
      roomNumber: "Room 302",
      category: "EXECUTIVE_AC",
      floor: 3,
      wing: "SOUTH_HERITAGE",
      baseTariffPerNight: 1000,
      amenities: ["Twin Beds", "AC", "Smart TV", "Workstation"],
      isAvailable: true,
    },
  ];

  private bookings: GuestHouseBooking[] = [
    {
      id: "BK-2026-001",
      requisitionNumber: "APEX-UGH-REQ-2026-0091",
      allotmentNumber: "APEX-UGH-ALLOC-4412",
      roomId: "RM-101",
      roomNumber: "Suite 101",
      roomCategory: "VIP_SUITE",
      guestName: "Prof. K. R. Ramanathan",
      guestAffiliation: "Indian Institute of Science (IISc), Bangalore",
      guestDesignation: "Professor & Chair of Aerospace",
      guestPhone: "+91 98450 11223",
      guestEmail: "kr.raman@iisc.ac.in",
      purpose: "EXTERNAL_EXAMINER",
      sponsoringDepartment: "Department of Aerospace & Mechanical",
      sponsorFacultyName: "Dr. Vikram Seth (Head of Department)",
      checkInDate: "2026-10-14",
      checkOutDate: "2026-10-17",
      numberOfNights: 3,
      billingMode: "DEPT_BUDGET",
      departmentBudgetCode: "EXAM-VIVA-2026-441",
      status: "CHECKED_IN",
      checkInTimestamp: "2026-10-14T14:30:00Z",
      diningCharges: [
        {
          id: "DC-01",
          date: "2026-10-14",
          mealType: "DINNER",
          amountInr: 450,
          description: "Executive Thali Dinner & Herbal Tea",
        },
        {
          id: "DC-02",
          date: "2026-10-15",
          mealType: "BREAKFAST",
          amountInr: 250,
          description: "South Indian Continental Breakfast",
        },
      ],
      roomChargesTotal: 7500,
      diningChargesTotal: 700,
      grandTotalInr: 8200,
      approvedBy: "Col. Sanjeev Nair (Estate Officer)",
      approvedAt: "2026-10-12T11:00:00Z",
      createdAt: "2026-10-11T09:30:00Z",
    },
    {
      id: "BK-2026-002",
      requisitionNumber: "APEX-UGH-REQ-2026-0092",
      allotmentNumber: "APEX-UGH-ALLOC-4413",
      roomId: "RM-201",
      roomNumber: "Studio 201",
      roomCategory: "FACULTY_TRANSIT",
      guestName: "Dr. Elena Rostova",
      guestAffiliation: "ETH Zürich, Switzerland",
      guestDesignation: "Adjunct Chair in Quantum Information",
      guestPhone: "+41 44 632 1100",
      guestEmail: "elena.rostova@ethz.ch",
      purpose: "VISITING_PROFESSOR",
      sponsoringDepartment: "School of Computing & Artificial Intelligence",
      sponsorFacultyName: "Prof. Arvind Swaminathan",
      checkInDate: "2026-10-12",
      checkOutDate: "2026-10-22",
      numberOfNights: 10,
      billingMode: "PROJECT_GRANT",
      departmentBudgetCode: "SERB-QUANTUM-2025-08",
      status: "CHECKED_IN",
      checkInTimestamp: "2026-10-12T16:00:00Z",
      diningCharges: [
        {
          id: "DC-03",
          date: "2026-10-13",
          mealType: "DINNER",
          amountInr: 450,
          description: "Chef Special European Dinner",
        },
      ],
      roomChargesTotal: 12000,
      diningChargesTotal: 450,
      grandTotalInr: 12450,
      approvedBy: "Col. Sanjeev Nair (Estate Officer)",
      approvedAt: "2026-10-10T10:15:00Z",
      createdAt: "2026-10-09T14:20:00Z",
    },
  ];

  public getAllRooms(): GuestHouseRoom[] {
    return [...this.rooms];
  }

  public getAllBookings(): GuestHouseBooking[] {
    return [...this.bookings];
  }

  public getBookingById(id: string): GuestHouseBooking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  public requestBooking(params: {
    roomId: string;
    guestName: string;
    guestAffiliation: string;
    guestDesignation: string;
    guestPhone: string;
    guestEmail: string;
    purpose: GuestHouseBooking["purpose"];
    sponsoringDepartment: string;
    sponsorFacultyName: string;
    checkInDate: string;
    checkOutDate: string;
    billingMode: BillingMode;
    departmentBudgetCode?: string;
    remarks?: string;
  }): GuestHouseBooking {
    const room = this.rooms.find((r) => r.id === params.roomId);
    if (!room) {
      throw new Error(`Room with ID ${params.roomId} not found`);
    }

    const start = new Date(params.checkInDate);
    const end = new Date(params.checkOutDate);
    const diffTime = end.getTime() - start.getTime();
    const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const reqSeq = (this.bookings.length + 93).toString().padStart(4, "0");
    const reqNumber = `APEX-UGH-REQ-2026-${reqSeq}`;

    const roomCharges = room.baseTariffPerNight * nights;

    const booking: GuestHouseBooking = {
      id: `BK-2026-${(this.bookings.length + 1).toString().padStart(3, "0")}`,
      requisitionNumber: reqNumber,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomCategory: room.category,
      guestName: params.guestName,
      guestAffiliation: params.guestAffiliation,
      guestDesignation: params.guestDesignation,
      guestPhone: params.guestPhone,
      guestEmail: params.guestEmail,
      purpose: params.purpose,
      sponsoringDepartment: params.sponsoringDepartment,
      sponsorFacultyName: params.sponsorFacultyName,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      numberOfNights: nights,
      billingMode: params.billingMode,
      departmentBudgetCode: params.departmentBudgetCode,
      status: "PENDING_ESTATE_APPROVAL",
      diningCharges: [],
      roomChargesTotal: roomCharges,
      diningChargesTotal: 0,
      grandTotalInr: roomCharges,
      remarks: params.remarks,
      createdAt: new Date().toISOString(),
    };

    this.bookings.unshift(booking);
    return booking;
  }

  public approveBooking(bookingId: string, approvedBy: string): GuestHouseBooking {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    const allocSeq = Math.floor(1000 + Math.random() * 9000);
    booking.allotmentNumber = `APEX-UGH-ALLOC-${allocSeq}`;
    booking.status = "CONFIRMED";
    booking.approvedBy = approvedBy;
    booking.approvedAt = new Date().toISOString();

    return booking;
  }

  public checkInGuest(bookingId: string): GuestHouseBooking {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    const room = this.rooms.find((r) => r.id === booking.roomId);
    if (room) {
      room.isAvailable = false;
      room.currentBookingId = booking.id;
    }

    booking.status = "CHECKED_IN";
    booking.checkInTimestamp = new Date().toISOString();
    return booking;
  }

  public addDiningCharge(
    bookingId: string,
    charge: { mealType: DiningCharge["mealType"]; amountInr: number; description: string }
  ): GuestHouseBooking {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    const newCharge: DiningCharge = {
      id: `DC-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split("T")[0],
      mealType: charge.mealType,
      amountInr: charge.amountInr,
      description: charge.description,
    };

    booking.diningCharges.push(newCharge);
    booking.diningChargesTotal += charge.amountInr;
    booking.grandTotalInr = booking.roomChargesTotal + booking.diningChargesTotal;

    return booking;
  }

  public checkOutAndInvoice(bookingId: string): GuestHouseBooking {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error("Booking not found");

    const room = this.rooms.find((r) => r.id === booking.roomId);
    if (room) {
      room.isAvailable = true;
      delete room.currentBookingId;
    }

    const invSeq = Math.floor(10000 + Math.random() * 90000);
    booking.invoiceNumber = `APEX-UGH-INV-${invSeq}`;
    booking.status = "CHECKED_OUT";
    booking.checkOutTimestamp = new Date().toISOString();

    return booking;
  }

  public getAnalytics(): GuestHouseAnalytics {
    const totalRooms = this.rooms.length;
    const availableRooms = this.rooms.filter((r) => r.isAvailable).length;
    const occupiedRooms = totalRooms - availableRooms;
    const activeResidents = this.bookings.filter((b) => b.status === "CHECKED_IN").length;
    const pendingApprovals = this.bookings.filter((b) => b.status === "PENDING_ESTATE_APPROVAL").length;

    let revenueTotalInr = 0;
    let deptDebitedInr = 0;

    for (const b of this.bookings) {
      revenueTotalInr += b.grandTotalInr;
      if (b.billingMode === "DEPT_BUDGET") {
        deptDebitedInr += b.grandTotalInr;
      }
    }

    return {
      totalRooms,
      availableRooms,
      occupiedRooms,
      totalBookings: this.bookings.length,
      pendingApprovals,
      activeResidents,
      revenueTotalInr,
      deptDebitedInr,
    };
  }
}

export const guestHouseEngine = new GuestHouseStore();
