import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get("q")?.trim();

    if (!rawQuery || rawQuery.length < 2) {
      return NextResponse.json({ results: [] });
    }

    // Input sanitization: limit search query to 50 characters
    const query = rawQuery.slice(0, 50).toLowerCase();

    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT";
    const isParent = session?.role === "PARENT";
    const isStaff = session && !isStudent && !isParent;

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: "STUDENT" | "FACULTY" | "COURSE" | "ROOM" | "ANNOUNCEMENT" | "BOOK";
      href: string;
    }> = [];

    // 1. Student Search: Strictly restricted to academic staff / admins (Defense in Depth)
    if (isStaff) {
      const students = await prisma.student.findMany({
        where: {
          OR: [
            { rollNumber: { contains: query } },
            { user: { firstName: { contains: query } } },
            { user: { lastName: { contains: query } } },
            { user: { email: { contains: query } } },
          ],
        },
        include: { user: true, program: true },
        take: 5,
      });

      for (const s of students) {
        results.push({
          id: s.id,
          title: `${s.user.firstName} ${s.user.lastName}`,
          subtitle: `${s.rollNumber} • ${s.program.name}`,
          category: "STUDENT",
          href: `/students`,
        });
      }
    }

    // 2. Faculty Directory Search
    const faculty = await prisma.faculty.findMany({
      where: {
        OR: [
          { employeeCode: { contains: query } },
          { user: { firstName: { contains: query } } },
          { user: { lastName: { contains: query } } },
        ],
      },
      include: { user: true, department: true },
      take: 5,
    });

    for (const f of faculty) {
      results.push({
        id: f.id,
        title: `${f.user.firstName} ${f.user.lastName}`,
        subtitle: `${f.designation} • Dept of ${f.department.code}`,
        category: "FACULTY",
        href: `/faculty`,
      });
    }

    // 3. Courses Search
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { code: { contains: query } },
          { title: { contains: query } },
        ],
      },
      take: 5,
    });

    for (const c of courses) {
      results.push({
        id: c.id,
        title: `${c.code}: ${c.title}`,
        subtitle: `${c.credits} Credits • ${c.labHours > 0 ? "Theory + Lab" : "Theory"}`,
        category: "COURSE",
        href: `/lms`,
      });
    }

    // 4. Books Search
    const books = await prisma.libraryBook.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { author: { contains: query } },
          { isbn: { contains: query } },
        ],
      },
      take: 5,
    });

    for (const b of books) {
      results.push({
        id: b.id,
        title: b.title,
        subtitle: `By ${b.author} • ISBN: ${b.isbn}`,
        category: "BOOK",
        href: `/library`,
      });
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    logger.error("Search API Error:", error);
    return NextResponse.json(
      { error: "Search execution failed" },
      { status: 500 }
    );
  }
}
