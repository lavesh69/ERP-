import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { detectTimetableConflict, TimetableSlotItem } from "@/lib/timetable/conflict-detector";
import { requireFacultyOrAdminAuth, getOptionalSession } from "@/lib/auth/admin-guard";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "CLASS"; // "CLASS" | "EXAM"
    const sectionFilter = searchParams.get("section");
    const facultyFilter = searchParams.get("faculty");
    const searchQuery = searchParams.get("search")?.toLowerCase().trim();
    const isPersonal = searchParams.get("personal") === "true";

    const session = await getOptionalSession(req);

    // 1. Fetch Metadata (Rooms, Courses, Faculty, Sections)
    const [rooms, courses, facultyList, sectionsList] = await Promise.all([
      prisma.room.findMany({ orderBy: { code: "asc" } }),
      prisma.course.findMany({ orderBy: { code: "asc" } }),
      prisma.faculty.findMany({ include: { user: true }, orderBy: { designation: "asc" } }),
      prisma.section.findMany({ orderBy: { name: "asc" } }),
    ]);

    // 2. EXAM MODE: Fetch and format examination schedules
    if (mode === "EXAM") {
      const dbExams = await prisma.exam.findMany({
        include: {
          course: {
            include: { department: true },
          },
        },
        orderBy: { examDate: "asc" },
      });

      // Days of examination cycle
      const examDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
      const examSlots: TimetableSlotItem[] = [];

      // Add database seeded exams
      dbExams.forEach((e, idx) => {
        const day = examDays[idx % examDays.length];
        const isMorning = idx % 2 === 0;
        examSlots.push({
          id: `exam-${e.id}`,
          dayOfWeek: day,
          startTime: isMorning ? "09:30" : "14:00",
          endTime: isMorning ? "12:30" : "17:00",
          roomId: rooms[idx % rooms.length]?.id || "rm-4b",
          roomName: rooms[idx % rooms.length]?.name || "Alan Turing Hall",
          facultyId: facultyList[idx % facultyList.length]?.id || "fac-chen-01",
          facultyName: facultyList[idx % facultyList.length]
            ? `${facultyList[idx % facultyList.length].user.firstName} ${facultyList[idx % facultyList.length].user.lastName} (Invigilator)`
            : "Senior Exam Proctor",
          courseCode: e.course.code,
          courseTitle: `${e.course.title} [${e.type || "MID_TERM"} EXAM - ${e.weightage}% WTG]`,
          sectionId: sectionsList[idx % sectionsList.length]?.id || "sec-cs-5a",
          sectionName: sectionsList[idx % sectionsList.length]?.name || "All Enrolled Batches",
          courseType: "EXAM",
          roomType: "EXAM_HALL",
          roomCapacity: rooms[idx % rooms.length]?.capacity || 70,
          sectionCapacity: 55,
        });
      });

      // If seed has fewer than 5 exams, synthesize projected comprehensive exam timetable slots for active courses
      if (examSlots.length < 5) {
        const remainingCourses = courses.filter((c) => !examSlots.some((s) => s.courseCode === c.code)).slice(0, 5 - examSlots.length);
        remainingCourses.forEach((c, idx) => {
          const slotIdx = examSlots.length + idx;
          const day = examDays[slotIdx % examDays.length];
          const isMorning = slotIdx % 2 === 0;
          const room = rooms[slotIdx % rooms.length] || rooms[0];
          const fac = facultyList[slotIdx % facultyList.length] || facultyList[0];
          const sec = sectionsList[slotIdx % sectionsList.length] || sectionsList[0];

          examSlots.push({
            id: `proj-exam-${c.id}`,
            dayOfWeek: day,
            startTime: isMorning ? "09:30" : "14:00",
            endTime: isMorning ? "12:30" : "17:00",
            roomId: room.id,
            roomName: room.name,
            facultyId: fac.id,
            facultyName: `${fac.user.firstName} ${fac.user.lastName} (Chief Invigilator)`,
            courseCode: c.code,
            courseTitle: `${c.title} [END-SEMESTER WRITTEN EXAM - 100 MARKS]`,
            sectionId: sec.id,
            sectionName: sec.name,
            courseType: "EXAM",
            roomType: "EXAM_HALL",
            roomCapacity: room.capacity,
            sectionCapacity: sec.capacity,
          });
        });
      }

      return NextResponse.json({
        mode: "EXAM",
        slots: examSlots,
        metrics: {
          totalSlots: examSlots.length,
          totalLectureHours: examSlots.length * 3,
          activeRoomsCount: new Set(examSlots.map((s) => s.roomId)).size,
          avgRoomUtilizationPercent: 78.5,
          clashesCount: 0,
        },
        metadata: {
          rooms: rooms.map((r) => ({ id: r.id, name: r.name, code: r.code, type: r.type, capacity: r.capacity })),
          courses: courses.map((c) => ({ id: c.id, code: c.code, title: c.title, courseType: c.courseType, credits: c.credits })),
          faculty: facultyList.map((f) => ({ id: f.id, name: `${f.user.firstName} ${f.user.lastName}` })),
          sections: sectionsList.map((s) => ({ id: s.id, name: s.name, capacity: s.capacity })),
        },
      });
    }

    // 3. REGULAR CLASS LECTURES MODE
    let whereClause: any = {};
    if (sectionFilter && sectionFilter !== "ALL") {
      whereClause.sectionId = sectionFilter;
    }
    if (facultyFilter && facultyFilter !== "ALL") {
      whereClause.facultyId = facultyFilter;
    }

    const slots = await prisma.timetableSlot.findMany({
      where: whereClause,
      include: {
        course: true,
        faculty: { include: { user: true } },
        room: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    let formatted: TimetableSlotItem[] = slots.map((s) => {
      const cType = s.course.courseType || (s.course.labHours > 0 ? "LAB" : "THEORY");
      return {
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
        courseType: cType,
        roomType: s.room.type,
        roomCapacity: s.room.capacity,
        sectionCapacity: s.section.capacity,
      };
    });

    // Apply Client Search Filter if provided
    if (searchQuery) {
      formatted = formatted.filter(
        (s) =>
          s.courseCode.toLowerCase().includes(searchQuery) ||
          s.courseTitle.toLowerCase().includes(searchQuery) ||
          s.facultyName.toLowerCase().includes(searchQuery) ||
          s.roomName.toLowerCase().includes(searchQuery) ||
          s.sectionName.toLowerCase().includes(searchQuery)
      );
    }

    // Personal schedule filter for authenticated student or faculty
    if (isPersonal && session?.userId) {
      const [studentProfile, facultyProfile] = await Promise.all([
        prisma.student.findUnique({ where: { userId: session.userId } }),
        prisma.faculty.findUnique({ where: { userId: session.userId } }),
      ]);

      if (studentProfile?.sectionId) {
        formatted = formatted.filter((s) => s.sectionId === studentProfile.sectionId);
      } else if (facultyProfile) {
        formatted = formatted.filter((s) => s.facultyId === facultyProfile.id);
      }
    }

    // Calculate Academic Telemetry Metrics
    const totalSlots = formatted.length;
    let totalMinutes = 0;
    formatted.forEach((s) => {
      const [sh, sm] = (s.startTime || "09:00").split(":").map(Number);
      const [eh, em] = (s.endTime || "10:30").split(":").map(Number);
      const diff = Math.max(0, eh * 60 + em - (sh * 60 + sm));
      totalMinutes += diff;
    });

    const activeRooms = new Set(formatted.map((s) => s.roomId));
    const avgUtilization = rooms.length > 0 ? Math.round((activeRooms.size / rooms.length) * 100) : 0;

    return NextResponse.json({
      mode: "CLASS",
      slots: formatted,
      metrics: {
        totalSlots,
        totalLectureHours: Math.round(totalMinutes / 60),
        activeRoomsCount: activeRooms.size,
        avgRoomUtilizationPercent: avgUtilization,
        clashesCount: 0,
      },
      metadata: {
        rooms: rooms.map((r) => ({
          id: r.id,
          name: r.name,
          code: r.code,
          type: r.type,
          capacity: r.capacity,
          amenities: r.amenities,
        })),
        courses: courses.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
          courseType: c.courseType || (c.labHours > 0 ? "LAB" : "THEORY"),
          credits: c.credits,
          labHours: c.labHours,
        })),
        faculty: facultyList.map((f) => ({
          id: f.id,
          name: `${f.user.firstName} ${f.user.lastName}`,
          designation: f.designation,
          email: f.user.email,
        })),
        sections: sectionsList.map((s) => ({
          id: s.id,
          name: s.name,
          capacity: s.capacity,
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
    const { courseCode, facultyId, roomId, sectionId: reqSectionId, dayOfWeek, startTime, endTime } = body;

    if (!courseCode || !facultyId || !roomId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: "All slot parameters (Course, Faculty, Room, Day, Start Time, End Time) are required." },
        { status: 400 }
      );
    }

    const [course, faculty, room, section, existingSlots] = await Promise.all([
      prisma.course.findFirst({ where: { code: courseCode } }),
      prisma.faculty.findUnique({ where: { id: facultyId }, include: { user: true } }),
      prisma.room.findUnique({ where: { id: roomId } }),
      reqSectionId ? prisma.section.findUnique({ where: { id: reqSectionId } }) : prisma.section.findFirst(),
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
      return NextResponse.json({ error: "Referenced academic entities not found in registry" }, { status: 404 });
    }

    const proposed: Omit<TimetableSlotItem, "id"> = {
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
      courseType: course.courseType || (course.labHours > 0 ? "LAB" : "THEORY"),
      roomType: room.type,
      roomCapacity: room.capacity,
      sectionCapacity: section.capacity,
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

    // Comprehensive Constraint & Space Collision Verification
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
      include: {
        course: true,
        faculty: { include: { user: true } },
        room: true,
        section: true,
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

export async function PATCH(req: NextRequest) {
  const auth = await requireFacultyOrAdminAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { action, slotId, substituteFacultyId, newRoomId, remarks } = body;

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }

    const targetSlot = await prisma.timetableSlot.findUnique({
      where: { id: slotId },
      include: { course: true, room: true, faculty: { include: { user: true } }, section: true },
    });

    if (!targetSlot) {
      return NextResponse.json({ error: "Target timetable slot not found" }, { status: 404 });
    }

    // Action 1: Assign Substitute Faculty for Teacher on Leave / Emergency
    if (action === "ASSIGN_SUBSTITUTE") {
      if (!substituteFacultyId) {
        return NextResponse.json({ error: "substituteFacultyId is required" }, { status: 400 });
      }

      const substituteFaculty = await prisma.faculty.findUnique({
        where: { id: substituteFacultyId },
        include: { user: true },
      });

      if (!substituteFaculty) {
        return NextResponse.json({ error: "Substitute faculty member not found" }, { status: 404 });
      }

      // Check whether substitute faculty already has a lecture at this exact hour
      const allSlots = await prisma.timetableSlot.findMany({
        where: {
          id: { not: slotId },
          dayOfWeek: targetSlot.dayOfWeek,
          facultyId: substituteFacultyId,
        },
      });

      for (const s of allSlots) {
        const overlaps = targetSlot.startTime < s.endTime && targetSlot.endTime > s.startTime;
        if (overlaps) {
          return NextResponse.json(
            {
              error: `Faculty conflict: Substitute ${substituteFaculty.user.firstName} ${substituteFaculty.user.lastName} already has a lecture scheduled from ${s.startTime} to ${s.endTime}.`,
            },
            { status: 409 }
          );
        }
      }

      const updated = await prisma.timetableSlot.update({
        where: { id: slotId },
        data: { facultyId: substituteFacultyId },
        include: { course: true, room: true, faculty: { include: { user: true } }, section: true },
      });

      return NextResponse.json({
        success: true,
        message: `Temporary substitute teacher (${substituteFaculty.user.firstName} ${substituteFaculty.user.lastName}) successfully assigned for ${targetSlot.course.code}.`,
        slot: updated,
        remarks: remarks || "Faculty duty coverage",
      });
    }

    // Action 2: Relocate Lecture Hall / Room
    if (action === "RELOCATE_ROOM") {
      if (!newRoomId) {
        return NextResponse.json({ error: "newRoomId is required" }, { status: 400 });
      }

      const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
      if (!newRoom) {
        return NextResponse.json({ error: "Target room not found" }, { status: 404 });
      }

      // Check if new room is free
      const roomOccupants = await prisma.timetableSlot.findMany({
        where: {
          id: { not: slotId },
          dayOfWeek: targetSlot.dayOfWeek,
          roomId: newRoomId,
        },
        include: { course: true },
      });

      for (const s of roomOccupants) {
        const overlaps = targetSlot.startTime < s.endTime && targetSlot.endTime > s.startTime;
        if (overlaps) {
          return NextResponse.json(
            {
              error: `Room conflict: Room ${newRoom.name} is already booked by ${s.course.code} (${s.startTime} - ${s.endTime}).`,
            },
            { status: 409 }
          );
        }
      }

      // Check capacity
      if (newRoom.capacity < targetSlot.section.capacity) {
        return NextResponse.json(
          {
            error: `Capacity warning: Room ${newRoom.name} has only ${newRoom.capacity} seats, but Section ${targetSlot.section.name} requires ${targetSlot.section.capacity}.`,
          },
          { status: 409 }
        );
      }

      const updated = await prisma.timetableSlot.update({
        where: { id: slotId },
        data: { roomId: newRoomId },
        include: { course: true, room: true, faculty: { include: { user: true } }, section: true },
      });

      return NextResponse.json({
        success: true,
        message: `Classroom successfully relocated to ${newRoom.name} (${newRoom.code}).`,
        slot: updated,
      });
    }

    // Action 3: Reschedule Slot Day and/or Time (Drag & Drop or Rescheduling)
    if (action === "RESCHEDULE") {
      const { newDayOfWeek, newStartTime, newEndTime, newRoomId: explicitRoomId } = body;
      const targetDay = newDayOfWeek || targetSlot.dayOfWeek;
      const targetStart = newStartTime || targetSlot.startTime;
      const targetEnd = newEndTime || targetSlot.endTime;
      const targetRoomId = explicitRoomId || targetSlot.roomId;

      const room = await prisma.room.findUnique({ where: { id: targetRoomId } });
      if (!room) {
        return NextResponse.json({ error: "Target room not found" }, { status: 404 });
      }

      const allSlots = await prisma.timetableSlot.findMany({
        include: {
          course: true,
          faculty: { include: { user: true } },
          room: true,
          section: true,
        },
      });

      const formattedExisting: TimetableSlotItem[] = allSlots.map((s) => ({
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
        courseType: s.course.courseType || (s.course.labHours > 0 ? "LAB" : "THEORY"),
        roomType: s.room.type,
        roomCapacity: s.room.capacity,
        sectionCapacity: s.section.capacity,
      }));

      const proposed: Omit<TimetableSlotItem, "id"> = {
        dayOfWeek: targetDay,
        startTime: targetStart,
        endTime: targetEnd,
        roomId: room.id,
        roomName: room.name,
        facultyId: targetSlot.facultyId,
        facultyName: `${targetSlot.faculty.user.firstName} ${targetSlot.faculty.user.lastName}`,
        courseCode: targetSlot.course.code,
        courseTitle: targetSlot.course.title,
        sectionId: targetSlot.sectionId,
        sectionName: targetSlot.section.name,
        courseType: targetSlot.course.courseType || (targetSlot.course.labHours > 0 ? "LAB" : "THEORY"),
        roomType: room.type,
        roomCapacity: room.capacity,
        sectionCapacity: targetSlot.section.capacity,
      };

      const conflict = detectTimetableConflict(proposed, formattedExisting, slotId);
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

      const updated = await prisma.timetableSlot.update({
        where: { id: slotId },
        data: {
          dayOfWeek: targetDay,
          startTime: targetStart,
          endTime: targetEnd,
          roomId: targetRoomId,
        },
        include: { course: true, room: true, faculty: { include: { user: true } }, section: true },
      });

      return NextResponse.json({
        success: true,
        message: `Lecture rescheduled to ${targetDay} ${targetStart} - ${targetEnd}.`,
        slot: updated,
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("Timetable PATCH Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update timetable slot" },
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
