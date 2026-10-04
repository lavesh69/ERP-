import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const COE_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "PRINCIPAL"];

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, COE_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { examId, studentIds } = body;

    const candidates = await prisma.student.findMany({
      where: studentIds && Array.isArray(studentIds) ? { id: { in: studentIds } } : { status: "ACTIVE" },
      take: 50,
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: "No candidates located for anonymization" }, { status: 404 });
    }

    const secretSalt = process.env.SESSION_SECRET || "coe-anonymity-salt-2026";

    const maskedDummies = candidates.map((c, idx) => {
      const hash = crypto
        .createHmac("sha256", secretSalt)
        .update(`${c.id}:${c.rollNumber}:${examId || "EXAM-2026"}`)
        .digest("hex");

      const dummyCode = `DUMMY-${hash.slice(0, 6).toUpperCase()}-${(idx + 1).toString().padStart(3, "0")}`;
      const barcodeToken = `BAR-${hash.slice(6, 14).toUpperCase()}`;

      return {
        studentId: c.id,
        originalRollNumber: c.rollNumber,
        dummyCode,
        barcodeToken,
        isSealed: true,
      };
    });

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "coe",
      action: "EXAM_ANONYMOUS_DUMMY_CODES_GENERATED",
      targetEntity: "ExamResult",
      details: {
        totalMasked: maskedDummies.length,
        examId,
      },
    });

    const examinerPack = maskedDummies.map((m) => ({
      dummyCode: m.dummyCode,
      barcodeToken: m.barcodeToken,
      examId: examId || "CURRENT_SERIES",
    }));

    return NextResponse.json({
      success: true,
      message: `Successfully masked ${maskedDummies.length} candidate scripts with anonymous dummy codes for unbiased evaluation.`,
      totalMasked: maskedDummies.length,
      examinerBundle: examinerPack,
      coeMasterLedger: auth.payload.role === "EXAMINATION_CONTROLLER" || auth.payload.role === "SUPER_ADMIN"
        ? maskedDummies
        : "Restricted to Senate CoE clearance only",
    });
  } catch (error: any) {
    logger.error("Dummy roll numbers POST error", error);
    return NextResponse.json({ error: "Failed to generate dummy roll numbers" }, { status: 500 });
  }
}
