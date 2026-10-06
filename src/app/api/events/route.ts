import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { eventsStore } from "@/lib/events/events-store";
import { BookingStatus } from "@/lib/events/events-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access events portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const status = (searchParams.get("status") as BookingStatus) || undefined;

    if (tab === "venues") {
      const venues = eventsStore.getVenues();
      return NextResponse.json({ success: true, venues });
    }

    if (tab === "bookings") {
      const bookings = eventsStore.getBookings(status);
      return NextResponse.json({ success: true, bookings });
    }

    const summary = eventsStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Events API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve events data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform events operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "REQUEST_BOOKING") {
      const {
        eventTitle,
        organizingDepartmentOrClub,
        category,
        venueId,
        eventDate,
        timeSlot,
        expectedAttendees,
        contactPersonName,
        contactPersonEmail,
      } = body;

      if (!eventTitle || !venueId || !eventDate || !timeSlot) {
        return NextResponse.json(
          { error: "Event title, venue, date, and time slot are required" },
          { status: 400 }
        );
      }

      const booking = eventsStore.createBooking({
        eventTitle,
        organizingDepartmentOrClub: organizingDepartmentOrClub || "Academic Department",
        category: category || "ACADEMIC_SYMPOSIUM",
        venueId,
        eventDate,
        timeSlot,
        expectedAttendees: Number(expectedAttendees) || 100,
        contactPersonName: contactPersonName || session.fullName,
        contactPersonEmail: contactPersonEmail || session.email,
      });

      return NextResponse.json({
        success: true,
        message: `Reservation request submitted successfully (${booking.bookingRef})`,
        booking,
      });
    }

    if (action === "DECIDE_BOOKING") {
      const { bookingId, status, remarks } = body;
      if (!bookingId || !status) {
        return NextResponse.json({ error: "Booking ID and decision status are required" }, { status: 400 });
      }

      const booking = eventsStore.updateBookingStatus(bookingId, status, remarks);
      return NextResponse.json({
        success: true,
        message: `Booking ${booking.bookingRef} updated to ${status}`,
        booking,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Events API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process events request" }, { status: 400 });
  }
}
