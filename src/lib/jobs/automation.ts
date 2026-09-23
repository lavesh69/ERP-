import { prisma } from "@/lib/db/prisma";

export interface JobExecutionResult {
  job: string;
  success: boolean;
  durationMs: number;
  timestamp: string;
  details: Record<string, any>;
}

export interface AutomationCycleSummary {
  success: boolean;
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
  results: JobExecutionResult[];
}

/**
 * Recalculates student aggregate attendance rates from biometric/session records
 */
export async function runBiometricAggregation(): Promise<JobExecutionResult> {
  const start = Date.now();
  try {
    const students = await prisma.student.findMany({
      include: {
        attendance: true,
      },
    });

    let updatedCount = 0;
    for (const student of students) {
      if (student.attendance.length > 0) {
        const presentCount = student.attendance.filter(
          (a) => a.status === "PRESENT" || a.status === "LATE"
        ).length;
        const rate = parseFloat(((presentCount / student.attendance.length) * 100).toFixed(1));

        if (rate !== student.attendanceRate) {
          await prisma.student.update({
            where: { id: student.id },
            data: { attendanceRate: rate },
          });
          updatedCount++;
        }
      }
    }

    return {
      job: "Biometric Attendance Aggregation",
      success: true,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: {
        totalStudentsEvaluated: students.length,
        ratesUpdated: updatedCount,
      },
    };
  } catch (error: any) {
    console.error("Biometric Aggregation Job Failed:", error);
    return {
      job: "Biometric Attendance Aggregation",
      success: false,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

/**
 * Scans for students falling below the mandatory 75% attendance threshold
 * Sets DEFAULTER_ALERT status and dispatches urgent academic notifications
 */
export async function scanDefaulterRisk(): Promise<JobExecutionResult> {
  const start = Date.now();
  try {
    const defaulters = await prisma.student.findMany({
      where: {
        attendanceRate: { lt: 75.0 },
      },
      include: {
        user: true,
      },
    });

    let notificationsSent = 0;
    let statusUpdated = 0;

    for (const student of defaulters) {
      if (student.status !== "DEFAULTER_ALERT") {
        await prisma.student.update({
          where: { id: student.id },
          data: { status: "DEFAULTER_ALERT" },
        });
        statusUpdated++;
      }

      // Check if alert already sent in the last 24 hours
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: student.userId,
          type: "ATTENDANCE",
          title: { contains: "Attendance Defaulter Warning" },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            userId: student.userId,
            title: "Urgent: Attendance Defaulter Warning (<75%)",
            message: `Your aggregate attendance of ${student.attendanceRate}% has fallen below the mandatory 75% institutional threshold. Please contact your academic advisor immediately.`,
            type: "ATTENDANCE",
            linkUrl: "/attendance",
          },
        });
        notificationsSent++;
      }
    }

    return {
      job: "Defaulter Risk Screening & Alerts",
      success: true,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: {
        defaultersIdentified: defaulters.length,
        statusUpdated,
        notificationsSent,
      },
    };
  } catch (error: any) {
    console.error("Defaulter Risk Scan Job Failed:", error);
    return {
      job: "Defaulter Risk Screening & Alerts",
      success: false,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

/**
 * Reconciles student fee accounts against due dates and payment balances
 * Flags overdue accounts and dispatches payment reminders
 */
export async function reconcileFeeDues(): Promise<JobExecutionResult> {
  const start = Date.now();
  try {
    const studentFees = await prisma.studentFee.findMany({
      include: {
        student: { include: { user: true } },
        feeStructure: true,
      },
    });

    const now = new Date();
    let overdueMarked = 0;
    let clearedMarked = 0;
    let remindersDispatched = 0;

    for (const fee of studentFees) {
      if (fee.paidAmount >= fee.totalAmount) {
        if (fee.status !== "PAID") {
          await prisma.studentFee.update({
            where: { id: fee.id },
            data: { status: "PAID" },
          });
          clearedMarked++;
        }
      } else if (fee.dueDate < now) {
        if (fee.status !== "OVERDUE") {
          await prisma.studentFee.update({
            where: { id: fee.id },
            data: { status: "OVERDUE" },
          });
          overdueMarked++;
        }

        // Send payment reminder if none sent in last 48 hours
        const recentReminder = await prisma.notification.findFirst({
          where: {
            userId: fee.student.userId,
            type: "FEE",
            title: { contains: "Overdue Fee Payment Notice" },
            createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
          },
        });

        if (!recentReminder) {
          await prisma.notification.create({
            data: {
              userId: fee.student.userId,
              title: "Overdue Fee Payment Notice",
              message: `An outstanding balance of $${(fee.totalAmount - fee.paidAmount).toLocaleString()} for ${fee.feeStructure.title} is overdue. Please settle via the Bursar portal.`,
              type: "FEE",
              linkUrl: "/finance",
            },
          });
          remindersDispatched++;
        }
      }
    }

    return {
      job: "Fee Ledger Reconciliation & Overdue Screening",
      success: true,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: {
        totalLedgersInspected: studentFees.length,
        overdueMarked,
        clearedMarked,
        remindersDispatched,
      },
    };
  } catch (error: any) {
    console.error("Fee Reconciliation Job Failed:", error);
    return {
      job: "Fee Ledger Reconciliation & Overdue Screening",
      success: false,
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString(),
      details: { error: error.message },
    };
  }
}

/**
 * Runs all scheduled institutional automation routines
 */
export async function runAllAutomationJobs(): Promise<AutomationCycleSummary> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  const results: JobExecutionResult[] = [];
  results.push(await runBiometricAggregation());
  results.push(await scanDefaulterRisk());
  results.push(await reconcileFeeDues());

  const totalDurationMs = Date.now() - startTime;
  const completedAt = new Date().toISOString();
  const allSuccess = results.every((r) => r.success);

  // Record Audit Log if an institution and actor exist
  try {
    const institution = await prisma.institution.findFirst();
    const adminUser = await prisma.user.findFirst({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    });

    if (institution && adminUser) {
      await prisma.auditLog.create({
        data: {
          institutionId: institution.id,
          actorUserId: adminUser.id,
          action: "AI_ACTION",
          targetEntity: "SystemScheduler",
          detailsJson: JSON.stringify({
            cycle: "Scheduled Institutional Maintenance",
            results,
            totalDurationMs,
          }),
        },
      });
    }
  } catch (auditErr) {
    console.warn("Could not record scheduler audit log:", auditErr);
  }

  return {
    success: allSuccess,
    totalDurationMs,
    startedAt,
    completedAt,
    results,
  };
}
