import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const query = q.toLowerCase();

    const [students, faculty, courses, rooms, announcements, books] = await Promise.all([
      prisma.student.findMany({
        include: { user: true, program: true },
        take: 5,
      }),
      prisma.faculty.findMany({
        include: { user: true, department: true },
        take: 5,
      }),
      prisma.course.findMany({ take: 5 }),
      prisma.room.findMany({ take: 5 }),
      prisma.announcement.findMany({ take: 5 }),
      prisma.libraryBook.findMany({ take: 5 }),
    ]);

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: "STUDENT" | "FACULTY" | "COURSE" | "ROOM" | "ANNOUNCEMENT" | "BOOK";
      href: string;
    }> = [];

    // Filter students
    for (const s of students) {
      const name = `${s.user.firstName} ${s.user.lastName}`;
      if (
        name.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query) ||
        s.user.email.toLowerCase().includes(query)
      ) {
        results.push({
          id: s.id,
          title: name,
          subtitle: `${s.rollNumber} • ${s.program.name}`,
          category: "STUDENT",
          href: `/students`,
        });
      }
    }

    // Filter faculty
    for (const f of faculty) {
      const name = `${f.user.firstName} ${f.user.lastName}`;
      if (
        name.toLowerCase().includes(query) ||
        f.employeeCode.toLowerCase().includes(query) ||
        f.department.name.toLowerCase().includes(query)
      ) {
        results.push({
          id: f.id,
          title: name,
          subtitle: `${f.designation} • Dept of ${f.department.code}`,
          category: "FACULTY",
          href: `/faculty`,
        });
      }
    }

    // Filter courses
    for (const c of courses) {
      if (c.code.toLowerCase().includes(query) || c.title.toLowerCase().includes(query)) {
        results.push({
          id: c.id,
          title: `${c.code}: ${c.title}`,
          subtitle: `${c.credits} Credits • ${c.labHours > 0 ? "Theory + Lab" : "Theory"}`,
          category: "COURSE",
          href: `/lms`,
        });
      }
    }

    // Filter rooms
    for (const r of rooms) {
      if (r.name.toLowerCase().includes(query) || r.code.toLowerCase().includes(query)) {
        results.push({
          id: r.id,
          title: `${r.name} (${r.code})`,
          subtitle: `Capacity: ${r.capacity} • IoT: ${r.iotStatus}`,
          category: "ROOM",
          href: `/timetable`,
        });
      }
    }

    // Filter books
    for (const b of books) {
      if (
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query)
      ) {
        results.push({
          id: b.id,
          title: b.title,
          subtitle: `By ${b.author} • ISBN: ${b.isbn}`,
          category: "BOOK",
          href: `/library`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Search execution failed" },
      { status: 500 }
    );
  }
}
