import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");

    const reservations = await prisma.studentRequest.findMany({
      where: {
        type: "DOCUMENT_REQUEST",
        title: { contains: "Book Reservation" },
        ...(bookId ? { reason: { contains: bookId } } : {}),
      },
      include: {
        student: { include: { user: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const queue = reservations.map((r, index) => ({
      reservationId: r.id,
      queuePosition: index + 1,
      studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
      rollNumber: r.student.rollNumber,
      bookTitle: r.title.replace("Book Reservation: ", ""),
      status: r.status,
      reservedAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      totalQueueCount: queue.length,
      queue,
    });
  } catch (error: any) {
    logger.error("Library reservations GET error", error);
    return NextResponse.json({ error: "Failed to fetch book reservations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getOptionalSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { bookId, studentId } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    const book = await prisma.libraryBook.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Library book not found" }, { status: 404 });
    }

    let targetStudentId = studentId;
    if (!targetStudentId) {
      const s = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: session.userId },
            { user: { email: session.email } },
          ],
        },
      });
      targetStudentId = s?.id;
    }

    if (!targetStudentId) {
      return NextResponse.json({ error: "Student record required for reservation" }, { status: 400 });
    }

    const reservation = await prisma.studentRequest.create({
      data: {
        studentId: targetStudentId,
        type: "DOCUMENT_REQUEST",
        title: `Book Reservation: ${book.title}`,
        reason: `Reserved copy for ISBN: ${book.isbn}. Book ID: ${book.id}. Priority queue request.`,
        status: "UNDER_REVIEW",
      },
      include: {
        student: { include: { user: true } },
      },
    });

    await logAuditEvent({
      institutionId: session.institutionId || "global",
      actorUserId: session.userId,
      action: "LIBRARY_BOOK_RESERVED",
      targetEntity: "LibraryBook",
      targetId: book.id,
      details: {
        isbn: book.isbn,
        studentRoll: reservation.student.rollNumber,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Hold placed successfully on '${book.title}'. Scholar will be alerted when a copy is returned.`,
      reservation: {
        id: reservation.id,
        bookTitle: book.title,
        isbn: book.isbn,
        status: "QUEUED",
      },
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Library reservation POST error", error);
    return NextResponse.json({ error: "Failed to place book reservation" }, { status: 500 });
  }
}
