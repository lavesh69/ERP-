import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { logger } from "@/lib/logging/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const isStudent = session?.role === "STUDENT" || session?.role === "PARENT";

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const [books, students] = await Promise.all([
      prisma.libraryBook.findMany({
        include: {
          loans: {
            include: {
              student: { include: { user: true } },
            },
            orderBy: { issuedAt: "desc" },
          },
        },
        orderBy: { title: "asc" },
      }),
      prisma.student.findMany({
        include: { user: true },
        orderBy: { rollNumber: "asc" },
      }),
    ]);

    const filtered = books.filter((b) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    });

    const now = new Date();
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    return NextResponse.json({
      books: filtered.map((b) => ({
        id: b.id,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        category: b.category,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        shelfLocation: b.shelfLocation,
        activeLoansCount: b.loans.filter((l) => l.status === "ISSUED").length,
        activeLoans: b.loans
          .filter((l) => {
            if (l.status !== "ISSUED") return false;
            if (isStudent && session) {
              return (
                l.student.userId === session.userId ||
                l.student.user.email === session.email
              );
            }
            return true;
          })
          .map((l) => {
            const dueDate = new Date(l.dueDate);
            const issuedAt = new Date(l.issuedAt);
            const isOverdue = now > dueDate;
            const daysOverdue = isOverdue
              ? Math.ceil((now.getTime() - dueDate.getTime()) / MS_PER_DAY)
              : 0;
            const accruedFine = daysOverdue * 5.0;
            const durationDays = Math.round((dueDate.getTime() - issuedAt.getTime()) / MS_PER_DAY);
            const renewalsUsed = Math.max(0, Math.round((durationDays - 14) / 14));
            const canRenew = renewalsUsed < 3 && !isOverdue;

            return {
              id: l.id,
              studentName: `${l.student.user.firstName} ${l.student.user.lastName}`,
              rollNo: l.student.rollNumber,
              dueDate: l.dueDate.toISOString().split("T")[0],
              issuedAt: l.issuedAt.toISOString().split("T")[0],
              isOverdue,
              daysOverdue,
              accruedFine,
              renewalsUsed,
              maxRenewals: 3,
              canRenew,
            };
          }),
      })),
      students: isStudent
        ? []
        : students.map((s) => ({
            id: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            rollNo: s.rollNumber,
          })),
    });
  } catch (error) {
    logger.error("Library GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch library books" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const body = await req.json();
    const { action, bookId, studentId, title, author, isbn, category, totalCopies } = body;

    // RBAC: Students and Parents cannot catalog books or perform administrative circulation
    if (session?.role === "STUDENT" || session?.role === "PARENT") {
      if (action === "ADD_BOOK") {
        return NextResponse.json(
          { error: "Forbidden: Students and parents cannot catalog books into the repository" },
          { status: 403 }
        );
      }
    }

    // Action: Add new book
    if (action === "ADD_BOOK") {
      if (!title || !author || !isbn) {
        return NextResponse.json({ error: "Title, author, and ISBN are required" }, { status: 400 });
      }

      const book = await prisma.libraryBook.create({
        data: {
          title,
          author,
          isbn,
          category: category || "Computer Science",
          totalCopies: Number(totalCopies) || 5,
          availableCopies: Number(totalCopies) || 5,
          shelfLocation: "A-4 / Bay 2",
        },
      });

      return NextResponse.json({ success: true, book }, { status: 201 });
    }

    // Action: Issue book
    if (action === "ISSUE") {
      if (!bookId || !studentId) {
        return NextResponse.json({ error: "bookId and studentId are required" }, { status: 400 });
      }

      const book = await prisma.libraryBook.findUnique({ where: { id: bookId } });
      if (!book || book.availableCopies <= 0) {
        return NextResponse.json({ error: "Book not available for loan" }, { status: 400 });
      }

      const loan = await prisma.bookLoan.create({
        data: {
          bookId,
          studentId,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "ISSUED",
        },
      });

      await prisma.libraryBook.update({
        where: { id: bookId },
        data: { availableCopies: book.availableCopies - 1 },
      });

      return NextResponse.json({ success: true, loan });
    }

    // Action: Return book with fine calculation
    if (action === "RETURN") {
      const { loanId } = body;
      if (!loanId) {
        return NextResponse.json({ error: "loanId is required" }, { status: 400 });
      }

      const loan = await prisma.bookLoan.findUnique({ where: { id: loanId } });
      if (!loan) {
        return NextResponse.json({ error: "Loan record not found" }, { status: 404 });
      }

      const now = new Date();
      const dueDate = new Date(loan.dueDate);
      let fineAmount = 0;
      if (now > dueDate) {
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        fineAmount = daysOverdue * 5.0; // ₹5 / $5 per day overdue
      }

      await prisma.bookLoan.update({
        where: { id: loanId },
        data: {
          status: "RETURNED",
          returnedAt: now,
          fineAmount,
        },
      });

      await prisma.libraryBook.update({
        where: { id: loan.bookId },
        data: { availableCopies: { increment: 1 } },
      });

      logger.info("Book loan returned", {
        loanId,
        fineAmount,
        isOverdue: fineAmount > 0,
      });

      return NextResponse.json({
        success: true,
        message:
          fineAmount > 0
            ? `Book returned. Overdue fine assessed: ₹${fineAmount.toFixed(2)}`
            : "Book returned successfully with zero penalty.",
        fineAmount,
      });
    }

    // Action: Renew book loan (Max 3 renewals, 14 days per renewal)
    if (action === "RENEW") {
      const { loanId } = body;
      if (!loanId) {
        return NextResponse.json({ error: "loanId is required" }, { status: 400 });
      }

      const loan = await prisma.bookLoan.findUnique({
        where: { id: loanId },
        include: {
          book: true,
          student: { include: { user: true } },
        },
      });

      if (!loan) {
        return NextResponse.json({ error: "Loan record not found" }, { status: 404 });
      }

      if (session?.role === "STUDENT") {
        if (
          loan.student.userId !== session.userId &&
          loan.student.user.email !== session.email
        ) {
          return NextResponse.json(
            { error: "Forbidden: You cannot renew another student's loan" },
            { status: 403 }
          );
        }
      }

      const MS_PER_DAY = 1000 * 60 * 60 * 24;
      const loanDurationDays = Math.round(
        (new Date(loan.dueDate).getTime() - new Date(loan.issuedAt).getTime()) / MS_PER_DAY
      );
      const renewalsUsed = Math.max(0, Math.round((loanDurationDays - 14) / 14));

      if (renewalsUsed >= 3) {
        return NextResponse.json(
          {
            error:
              "Maximum renewal limit (3/3) reached for this volume. Please return it to the physical library circulation desk.",
          },
          { status: 400 }
        );
      }

      const newDueDate = new Date(new Date(loan.dueDate).getTime() + 14 * MS_PER_DAY);
      await prisma.bookLoan.update({
        where: { id: loanId },
        data: { dueDate: newDueDate },
      });

      logger.info("Book loan renewed", {
        loanId,
        newDueDate,
        renewalsUsed: renewalsUsed + 1,
      });

      return NextResponse.json({
        success: true,
        message: `Book loan renewed by 14 days! Due: ${newDueDate.toISOString().split("T")[0]} (Renewal ${renewalsUsed + 1}/3)`,
        dueDate: newDueDate.toISOString().split("T")[0],
        renewalsUsed: renewalsUsed + 1,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Library POST Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process library action" },
      { status: 500 }
    );
  }
}

