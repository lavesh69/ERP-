import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const programId = searchParams.get("programId");
    const sectionId = searchParams.get("sectionId");
    const dateParam = searchParams.get("date");

    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDayOfWeek = dayNames[targetDate.getDay()];

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build filter for timetable slots
    const slotWhere: any = {
      dayOfWeek: currentDayOfWeek,
    };

    const callerRole = auth.payload.role;
    if (callerRole === "HOD") {
      const faculty = await prisma.faculty.findFirst({
        where: {
          OR: [
            { userId: auth.payload.userId || auth.payload.sub },
            { user: { email: auth.payload.email } },
          ],
        },
      });
      if (faculty) {
        slotWhere.course = { departmentId: faculty.departmentId };
      }
    } else if (departmentId) {
      slotWhere.course = { departmentId };
    }

    if (sectionId) slotWhere.sectionId = sectionId;

    const slots = await prisma.timetableSlot.findMany({
      where: slotWhere,
      include: {
        course: {
          include: {
            department: true,
            semester: { include: { program: true } },
          },
        },
        section: true,
        faculty: { include: { user: true } },
        room: true,
      },
      orderBy: { startTime: "asc" },
    });

    // Fetch existing attendance sessions for today
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        courseId: true,
        sectionId: true,
        status: true,
        method: true,
        startTime: true,
        endTime: true,
      },
    });

    const sessionLookup = new Map<string, any>();
    sessions.forEach((s) => {
      sessionLookup.set(`${s.courseId}_${s.sectionId}`, s);
    });

    const nowTimeStr = `${String(targetDate.getHours()).padStart(2, "0")}:${String(
      targetDate.getMinutes()
    ).padStart(2, "0")}`;

    const missingSlots: any[] = [];
    const conductedSlots: any[] = [];

    slots.forEach((slot) => {
      const matchingSession = sessionLookup.get(`${slot.courseId}_${slot.sectionId}`);
      const isPastStartTime = nowTimeStr >= slot.startTime;

      const item = {
        slotId: slot.id,
        courseId: slot.courseId,
        courseCode: slot.course.code,
        courseTitle: slot.course.title,
        departmentCode: slot.course.department.code,
        departmentName: slot.course.department.name,
        programName: slot.course.semester?.program?.name || "Academic Program",
        sectionId: slot.sectionId,
        sectionName: slot.section?.name || "Section A",
        roomCode: slot.room?.code || "Room",
        roomName: slot.room?.name || "Lecture Hall",
        facultyId: slot.facultyId,
        facultyName: slot.faculty?.user
          ? `${slot.faculty.user.firstName} ${slot.faculty.user.lastName}`
          : "Assigned Faculty",
        facultyEmail: slot.faculty?.user?.email,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dayOfWeek: slot.dayOfWeek,
        sessionStatus: matchingSession?.status || "NOT_STARTED",
        sessionId: matchingSession?.id || null,
        isOverdue: isPastStartTime && (!matchingSession || matchingSession.status === "NOT_STARTED"),
      };

      if (!matchingSession || matchingSession.status === "NOT_STARTED") {
        missingSlots.push(item);
      } else {
        conductedSlots.push(item);
      }
    });

    return NextResponse.json({
      targetDate: targetDate.toISOString().split("T")[0],
      dayOfWeek: currentDayOfWeek,
      totalScheduled: slots.length,
      totalMissing: missingSlots.length,
      totalConducted: conductedSlots.length,
      complianceRate:
        slots.length > 0
          ? Number(((conductedSlots.length / slots.length) * 100).toFixed(1))
          : 100.0,
      missingClasses: missingSlots,
      conductedClasses: conductedSlots,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to scan missing attendance", details: error.message },
      { status: 500 }
    );
  }
}
