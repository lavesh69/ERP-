import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";
import { alumniStore } from "@/lib/alumni/alumni-store";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get("mentorId") || undefined;
    const bookings = alumniStore.getMentorshipBookings(mentorId);

    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    logger.error("Mentorship GET error", error);
    return NextResponse.json({ error: error.message || "Failed to load mentorship bookings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to book mentorship" }, { status: 401 });
    }

    const body = await req.json();
    const { mentorId, mentorName, topic, date, slotTime, meetingFormat, notes, studentRoll, studentName } = body;

    if (!mentorId || !date || !slotTime) {
      return NextResponse.json({ error: "Mentor ID, session date, and slot time are required" }, { status: 400 });
    }

    const booking = alumniStore.bookMentorshipSession({
      mentorId,
      mentorName: mentorName || "Alumni Mentor",
      studentId: session.userId || session.id,
      studentName: studentName || session.fullName || "Student Scholar",
      studentRoll: studentRoll || (session as any)?.studentRollNumber || "CS2026-001",
      topic: topic || "Career and Technical Guidance",
      date,
      slotTime,
      meetingFormat,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Mentorship session confirmed with ${booking.mentorName} (${booking.bookingRef})`,
      booking,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Mentorship booking POST error", error);
    return NextResponse.json({ error: error.message || "Failed to book mentorship session" }, { status: 400 });
  }
}
