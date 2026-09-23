import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "INSTITUTION_ADMIN")) {
      return NextResponse.json({ error: "Access Denied: SOC-2 Audit reports require Administrative privileges." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(500, Number(searchParams.get("limit")) || 100);

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: "asc" },
      include: {
        actor: {
          select: { id: true, email: true, role: true, firstName: true, lastName: true },
        },
        institution: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    // Compute cryptographic SHA-256 integrity hash chain
    let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const chainedRecords = logs.map((log) => {
      const dataPayload = `${log.id}:${log.timestamp.toISOString()}:${log.action}:${log.actorUserId}:${log.targetEntity}:${log.targetId || ""}:${prevHash}`;
      const recordHash = crypto.createHash("sha256").update(dataPayload).digest("hex");
      prevHash = recordHash;

      return {
        id: log.id,
        timestamp: log.timestamp,
        institution: log.institution.name,
        actorEmail: log.actor.email,
        actorRole: log.actor.role,
        action: log.action,
        targetEntity: log.targetEntity,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
        blockHash: recordHash,
        previousHash: prevHash,
      };
    });

    const reportSeal = crypto
      .createHash("sha256")
      .update(JSON.stringify(chainedRecords))
      .digest("hex");

    return NextResponse.json({
      success: true,
      standard: "AICPA SOC-2 Type II Trust Services Criteria (Security & Confidentiality)",
      generatedAt: new Date().toISOString(),
      reportSigner: session.email,
      recordsCount: chainedRecords.length,
      integrityProof: {
        algorithm: "SHA-256 Hash Chaining",
        finalLedgerSeal: reportSeal,
      },
      auditTrail: chainedRecords,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate SOC-2 audit export" }, { status: 500 });
  }
}
