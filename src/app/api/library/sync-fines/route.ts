import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const LIBRARIAN_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LIBRARIAN", "ACCOUNTANT"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, LIBRARIAN_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const today = new Date();

    const overdueLoans = await prisma.bookLoan.findMany({
      where: {
        status: "ISSUED",
        dueDate: { lt: today },
      },
      include: {
        book: true,
        student: {
          include: { user: true },
        },
      },
    });

    let synchronizedCount = 0;
    let totalFineBilled = 0;

    for (const loan of overdueLoans) {
      const daysOverdue = Math.ceil((today.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const finePerDay = 1.0;
      const fineAmount = daysOverdue * finePerDay;

      await prisma.bookLoan.update({
        where: { id: loan.id },
        data: {
          fineAmount,
          status: "OVERDUE",
        },
      });

      const student = loan.student;
      if (student) {
        const existingFineFee = await prisma.studentFee.findFirst({
          where: {
            studentId: student.id,
            feeStructure: { code: "LIB-OVERDUE-FINE" },
          },
        });

        if (existingFineFee) {
          await prisma.studentFee.update({
            where: { id: existingFineFee.id },
            data: {
              totalAmount: existingFineFee.totalAmount + fineAmount,
              status: "OVERDUE",
            },
          });
        } else {
          let libStructure = await prisma.feeStructure.findUnique({
            where: { code: "LIB-OVERDUE-FINE" },
          });

          if (!libStructure) {
            libStructure = await prisma.feeStructure.create({
              data: {
                code: "LIB-OVERDUE-FINE",
                title: "Library Overdue Circulation Penalties",
                totalAmount: 10.0,
                currency: "USD",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                breakdownJson: JSON.stringify({ libraryCirculationFine: 10.0 }),
              },
            });
          }

          await prisma.studentFee.create({
            data: {
              studentId: student.id,
              feeStructureId: libStructure.id,
              totalAmount: fineAmount,
              paidAmount: 0.0,
              status: "OVERDUE",
              dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        }

        synchronizedCount += 1;
        totalFineBilled += fineAmount;
      }
    }

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "librarian",
      action: "LIBRARY_FINES_SYNCED_TO_FINANCE",
      targetEntity: "BookLoan",
      details: {
        overdueLoansProcessed: overdueLoans.length,
        synchronizedCount,
        totalFineBilled,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${synchronizedCount} overdue library fines ($${totalFineBilled}) into university bursar ledgers.`,
      synchronizedCount,
      totalFineBilled,
      overdueLoansCount: overdueLoans.length,
    });
  } catch (error: any) {
    logger.error("Library fine sync POST error", error);
    return NextResponse.json({ error: "Failed to synchronize library fines" }, { status: 500 });
  }
}
