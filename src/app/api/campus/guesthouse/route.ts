import { NextRequest, NextResponse } from "next/server";
import { guestHouseEngine } from "@/lib/campus/guesthouse-engine";

export async function GET() {
  try {
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
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "REQUEST_BOOKING": {
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
