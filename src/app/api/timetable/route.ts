import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { detectTimetableConflict, TimetableSlotItem } from "@/lib/timetable/conflict-detector";
import { requireFacultyOrAdminAuth } from "@/lib/auth/admin-guard";

export async function GET() {
  try {
    const slots = await prisma.timetableSlot.findMany({
      include: {
        course: true,
        faculty: { include: { user: true } },
        room: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const formatted: TimetableSlotItem[] = slots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      roomName: s.room.name,
      facultyId: s.facultyId,
      facultyName: `${s.faculty.user.firstName} ${s.faculty.user.lastName}`,
      courseCode: s.course.code,
      courseTitle: s.course.title,
      sectionId: s.sectionId,
      sectionName: s.section.name,
    }));

    const [rooms, courses, facultyList] = await Promise.all([
      prisma.room.findMany(),
      prisma.course.findMany(),
      prisma.faculty.findMany({ include: { user: true } }),
    ]);

    return NextResponse.json({
      slots: formatted,
      metadata: {
        rooms: rooms.map((r) => ({ id: r.id, name: r.name, code: r.code })),
        courses: courses.map((c) => ({ id: c.id, code: c.code, title: c.title })),
        faculty: facultyList.map((f) => ({
          id: f.id,
          name: `${f.user.firstName} ${f.user.lastName}`,
        })),
      },
    });
  } catch (error) {
    console.error("Timetable GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { courseCode, facultyId, roomId, dayOfWeek, startTime, endTime } = body;

    if (!courseCode || !facultyId || !roomId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All slot parameters are required" },
        { status: 400 }
      );
    }

    const [course, faculty, room, section, existingSlots] = await Promise.all([
      prisma.course.findFirst({ where: { code: courseCode } }),
      prisma.faculty.findUnique({ where: { id: facultyId }, include: { user: true } }),
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.section.findFirst(),
      prisma.timetableSlot.findMany({
        include: {
          course: true,
          faculty: { include: { user: true } },
          room: true,
          section: true,
        },
      }),
    ]);

    if (!course || !faculty || !room || !section) {
      return NextResponse.json({ error: "Referenced entities not found" }, { status: 404 });
    }

    const proposed = {
      dayOfWeek,
      startTime,
      endTime,
      roomId: room.id,
      roomName: room.name,
      facultyId: faculty.id,
      facultyName: `${faculty.user.firstName} ${faculty.user.lastName}`,
      courseCode: course.code,
      courseTitle: course.title,
      sectionId: section.id,
      sectionName: section.name,
    };

    const existingFormatted: TimetableSlotItem[] = existingSlots.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      roomId: s.roomId,
      roomName: s.room.name,
      facultyId: s.facultyId,
      facultyName: `${s.faculty.user.firstName} ${s.faculty.user.lastName}`,
      courseCode: s.course.code,
      courseTitle: s.course.title,
      sectionId: s.sectionId,
      sectionName: s.section.name,
    }));

    const conflict = detectTimetableConflict(proposed, existingFormatted);
    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          error: conflict.message,
          type: conflict.type,
          hasConflict: true,
        },
        { status: 409 }
      );
    }

    const campus = await prisma.campus.findFirst();
    const newSlot = await prisma.timetableSlot.create({
      data: {
        campusId: campus?.id || "cmp-main-01",
        courseId: course.id,
        facultyId: faculty.id,
        roomId: room.id,
        sectionId: section.id,
        dayOfWeek,
        startTime,
        endTime,
      },
    });

    return NextResponse.json({ success: true, slot: newSlot }, { status: 201 });
  } catch (error: any) {
    console.error("Timetable POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create timetable slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Slot ID is required" }, { status: 400 });
    }

    await prisma.timetableSlot.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Timetable slot deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete slot" }, { status: 500 });
  }
}
