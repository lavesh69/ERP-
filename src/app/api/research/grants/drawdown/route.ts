import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

const RESEARCH_ROLES: UserRole[] = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "RESEARCH_COORDINATOR", "PRINCIPAL", "FACULTY"];

export interface GrantDrawdownExpense {
  id: string;
  projectId: string;
  category: "EQUIPMENT" | "CONSUMABLES" | "TRAVEL" | "MANPOWER_FELLOWSHIP" | "OVERHEAD";
  description: string;
  amountUsd: number;
  invoiceRef: string;
  disbursedAt: string;
}

const SAMPLE_EXPENSES: GrantDrawdownExpense[] = [
  {
    id: "exp-01",
    projectId: "proj-ai-01",
    category: "EQUIPMENT",
    description: "NVIDIA H100 GPU compute nodes for neural model training",
    amountUsd: 42000,
    invoiceRef: "INV-NV-8821",
    disbursedAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "exp-02",
    projectId: "proj-ai-01",
    category: "MANPOWER_FELLOWSHIP",
    description: "Junior Research Fellow stipend for Q1-Q2",
    amountUsd: 14500,
    invoiceRef: "STIPEND-JRF-2026-Q1",
    disbursedAt: "2026-09-01T10:00:00Z",
  },
];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, RESEARCH_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const totalFundingSanctioned = 120000;
    const totalSpent = SAMPLE_EXPENSES.reduce((sum, e) => sum + e.amountUsd, 0);
    const balanceRemaining = totalFundingSanctioned - totalSpent;

    const ucCertificateHash = crypto
      .createHash("sha256")
      .update(`UC:2026:${totalSpent}:${balanceRemaining}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    return NextResponse.json({
      success: true,
      grantTelemetry: {
        totalFundingSanctioned,
        totalDisbursedExpenditure: totalSpent,
        unspentGrantBalance: balanceRemaining,
        burnRatePercentage: Number(((totalSpent / totalFundingSanctioned) * 100).toFixed(1)),
        currency: "USD",
        utilizationCertificateNumber: `UC-APEX-DST-${ucCertificateHash}`,
        certifiedStatus: "PROVISIONALLY_AUDITED",
      },
      expenses: SAMPLE_EXPENSES,
    });
  } catch (error: any) {
    logger.error("Research grant drawdown GET error", error);
    return NextResponse.json({ error: "Failed to fetch grant drawdown telemetry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, RESEARCH_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { projectId, category, description, amountUsd, invoiceRef } = body;

    if (!category || !amountUsd || !description) {
      return NextResponse.json({ error: "category, description, and amountUsd are required" }, { status: 400 });
    }

    const newExpense: GrantDrawdownExpense = {
      id: `exp-${Date.now()}`,
      projectId: projectId || "proj-ai-01",
      category,
      description,
      amountUsd: Number(amountUsd),
      invoiceRef: invoiceRef || `INV-REF-${Date.now()}`,
      disbursedAt: new Date().toISOString(),
    };

    SAMPLE_EXPENSES.push(newExpense);

    await logAuditEvent({
      institutionId: auth.payload.institutionId || "global",
      actorUserId: auth.payload.userId || "research_coordinator",
      action: "RESEARCH_GRANT_DRAWDOWN_RECORDED",
      targetEntity: "ResearchProject",
      targetId: newExpense.projectId,
      details: {
        category,
        amount: newExpense.amountUsd,
        invoice: newExpense.invoiceRef,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Grant drawdown of $${newExpense.amountUsd} recorded under ${category}.`,
      expense: newExpense,
    }, { status: 201 });
  } catch (error: any) {
    logger.error("Research grant drawdown POST error", error);
    return NextResponse.json({ error: "Failed to record grant expenditure" }, { status: 500 });
  }
}
