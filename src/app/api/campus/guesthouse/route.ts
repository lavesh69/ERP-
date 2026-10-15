import { NextRequest, NextResponse } from "next/server";
import { guestHouseEngine } from "@/lib/campus/guesthouse-engine";
import { getOptionalSession } from "@/lib/auth/admin-guard";

const GUESTHOUSE_ADMIN_ROLES = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "HR_STAFF", "ACCOUNTANT"];

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to access guest house records" },
        { status: 401 }
      );
    }

    const rooms = guestHouseEngine.getAllRooms();
    const bookings = guestHouseEngine.getAllBookings();
    const analytics = guestHouseEngine.getAnalytics();

    return NextResponse.json({
      success: true,
      data: {
        rooms,
        bookings,
        analytics,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch guest house records" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to process guest house operations" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "REQUEST_BOOKING": {
        if (["STUDENT", "PARENT", "ALUMNI"].includes(session.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Students and parents cannot directly requisition campus guest house suites. Sponsoring faculty approval is required." },
            { status: 403 }
          );
        }

        const {
          roomId,
          guestName,
          guestAffiliation,
          guestDesignation,
          guestPhone,
          guestEmail,
          purpose,
          sponsoringDepartment,
          sponsorFacultyName,
          checkInDate,
          checkOutDate,
          billingMode,
          departmentBudgetCode,
          remarks,
        } = body;

        if (!roomId || !guestName || !sponsoringDepartment || !checkInDate || !checkOutDate) {
          return NextResponse.json(
            { success: false, error: "Mandatory booking parameters missing" },
            { status: 400 }
          );
        }

        const booking = guestHouseEngine.requestBooking({
          roomId,
          guestName,
          guestAffiliation: guestAffiliation || "Visiting Scholar",
          guestDesignation: guestDesignation || "Guest Expert",
          guestPhone: guestPhone || "+91 90000 00000",
          guestEmail: guestEmail || "guest@institution.ac.in",
          purpose: purpose || "GUEST_LECTURE",
          sponsoringDepartment,
          sponsorFacultyName: sponsorFacultyName || "Faculty Coordinator",
          checkInDate,
          checkOutDate,
          billingMode: billingMode || "DEPT_BUDGET",
          departmentBudgetCode,
          remarks,
        });

        return NextResponse.json({
          success: true,
          message: "Guest house requisition submitted for Estate Officer approval",
          data: booking,
        });
      }

      case "APPROVE_BOOKING": {
        if (!GUESTHOUSE_ADMIN_ROLES.includes(session.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Only Estate and Guest House officers can approve bookings" },
            { status: 403 }
          );
        }

        const { bookingId, approvedBy } = body;
        if (!bookingId) {
          return NextResponse.json(
            { success: false, error: "Booking ID is required" },
            { status: 400 }
          );
        }

        const booking = guestHouseEngine.approveBooking(
          bookingId,
          approvedBy || "Estate Officer & Registrar"
        );

        return NextResponse.json({
          success: true,
          message: `Booking allotment confirmed: ${booking.allotmentNumber}`,
          data: booking,
        });
      }

      case "CHECK_IN": {
        if (!GUESTHOUSE_ADMIN_ROLES.includes(session.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Only Estate and Guest House officers can check in guests" },
            { status: 403 }
          );
        }

        const { bookingId } = body;
        if (!bookingId) {
          return NextResponse.json(
            { success: false, error: "Booking ID is required" },
            { status: 400 }
          );
        }

        const booking = guestHouseEngine.checkInGuest(bookingId);
        return NextResponse.json({
          success: true,
          message: `Guest successfully checked into ${booking.roomNumber}`,
          data: booking,
        });
      }

      case "ADD_DINING": {
        if (!GUESTHOUSE_ADMIN_ROLES.includes(session.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Only Estate and Guest House officers can post dining folios" },
            { status: 403 }
          );
        }

        const { bookingId, mealType, amountInr, description } = body;
        if (!bookingId || !mealType || !amountInr) {
          return NextResponse.json(
            { success: false, error: "Meal details incomplete" },
            { status: 400 }
          );
        }

        const booking = guestHouseEngine.addDiningCharge(bookingId, {
          mealType,
          amountInr: Number(amountInr),
          description: description || `${mealType} order`,
        });

        return NextResponse.json({
          success: true,
          message: "Dining charge posted to room folio",
          data: booking,
        });
      }

      case "CHECK_OUT_INVOICE": {
        if (!GUESTHOUSE_ADMIN_ROLES.includes(session.role)) {
          return NextResponse.json(
            { success: false, error: "Forbidden: Only Estate and Guest House officers can check out guests and issue invoices" },
            { status: 403 }
          );
        }

        const { bookingId } = body;
        if (!bookingId) {
          return NextResponse.json(
            { success: false, error: "Booking ID is required" },
            { status: 400 }
          );
        }

        const booking = guestHouseEngine.checkOutAndInvoice(bookingId);
        return NextResponse.json({
          success: true,
          message: `Guest checked out. Final Folio Invoice: ${booking.invoiceNumber}`,
          data: booking,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process guest house action" },
      { status: 500 }
    );
  }
}
