import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logger } from "@/lib/logging/logger";

const FACULTY_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, FACULTY_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const userId = auth.payload.userId;

    const faculty = await prisma.faculty.findFirst({
      where: {
        OR: [
          { userId },
          { user: { email: auth.payload.email } },
        ],
      },
      include: {
        user: true,
        department: true,
      },
    });

    const facultyId = faculty?.id;

    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const currentDay = daysOfWeek[new Date().getDay()] || "MONDAY";

    const slots = await prisma.timetableSlot.findMany({
      where: {
        ...(facultyId ? { facultyId } : {}),
        dayOfWeek: currentDay === "SUNDAY" ? "MONDAY" : currentDay,
      },
      include: {
        course: true,
        room: true,
        section: {
          include: {
            students: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const formattedSlots = slots.map((s) => ({
      slotId: s.id,
      day: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      courseCode: s.course.code,
      courseTitle: s.course.title,
      roomNumber: s.room.code,
      roomName: s.room.name,
      section: s.section.name,
      studentCount: s.section.students.length,
      quickAttendanceAction: {
        courseId: s.courseId,
        sectionId: s.sectionId,
        roomId: s.roomId,
        method: "SMART_COMBO",
        endpoint: "/api/attendance/sessions",
      },
    }));

    return NextResponse.json({
      success: true,
      dayOfWeek: currentDay,
      totalClassesToday: formattedSlots.length,
      faculty: faculty ? {
        id: faculty.id,
        name: `${faculty.user.firstName} ${faculty.user.lastName}`,
        department: faculty.department.name,
      } : null,
      schedule: formattedSlots,
    });
  } catch (error: any) {
    logger.error("Faculty schedule GET error", error);
    return NextResponse.json({ error: "Failed to fetch faculty daily schedule" }, { status: 500 });
  }
}
