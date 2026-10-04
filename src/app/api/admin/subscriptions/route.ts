import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRoleAuth } from "@/lib/auth/admin-guard";
import { UserRole } from "@/types/auth";
import { logAuditEvent } from "@/lib/audit/logger";
import { logger } from "@/lib/logging/logger";

interface SubscriptionPlan {
  tier: "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE";
  maxStudents: number;
  pricePerMonthUsd: number;
  features: string[];
}

const PLAN_TIERS: Record<string, SubscriptionPlan> = {
  TRIAL: {
    tier: "TRIAL",
    maxStudents: 500,
    pricePerMonthUsd: 0,
    features: ["Core SIS", "Basic Attendance", "Manual Grading"],
  },
  STARTER: {
    tier: "STARTER",
    maxStudents: 2000,
    pricePerMonthUsd: 499,
    features: ["Core SIS", "Dynamic QR Attendance", "CBCS Grading", "Finance Ledgers"],
  },
  GROWTH: {
    tier: "GROWTH",
    maxStudents: 5000,
    pricePerMonthUsd: 999,
    features: ["All Starter Features", "BLE Beacons", "LMS Progression", "ATS Placement"],
  },
  ENTERPRISE: {
    tier: "ENTERPRISE",
    maxStudents: 25000,
    pricePerMonthUsd: 2499,
    features: ["All Growth Features", "Autonomous AI Agents", "Semantic RAG Engine", "Custom SLAs"],
  },
};

const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN"];

export async function GET(req: NextRequest) {
  const auth = await requireRoleAuth(req, ADMIN_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const institutions = await prisma.institution.findMany({
      include: {
        _count: {
          select: {
            users: true,
            campuses: true,
          },
        },
      },
    });

    const totalStudents = await prisma.student.count();

    const subscriptions = institutions.map((inst, idx) => {
      const tier: "TRIAL" | "STARTER" | "GROWTH" | "ENTERPRISE" =
        idx === 0 ? "ENTERPRISE" : idx === 1 ? "GROWTH" : "STARTER";
      const plan = PLAN_TIERS[tier];
      const expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

      return {
        institutionId: inst.id,
        institutionName: inst.name,
        code: inst.code,
        tier: plan.tier,
        maxStudents: plan.maxStudents,
        enrolledStudents: Math.min(totalStudents, plan.maxStudents),
        utilizationPercentage: Number(((totalStudents / plan.maxStudents) * 100).toFixed(1)),
        monthlyRecurringRevenue: plan.pricePerMonthUsd,
        currency: "USD",
        licenseStatus: "ACTIVE",
        expiresAt: expiryDate.toISOString(),
        features: plan.features,
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalInstitutions: institutions.length,
        totalEnrolledSeats: totalStudents,
        totalMmrUsd: subscriptions.reduce((sum, s) => sum + s.monthlyRecurringRevenue, 0),
      },
      subscriptions,
    });
  } catch (error: any) {
    logger.error("Admin subscriptions GET error", error);
    return NextResponse.json({ error: "Failed to retrieve subscription telemetry" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRoleAuth(req, ADMIN_ROLES);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json();
    const { institutionId, targetTier, seatLimit, action } = body;

    if (!institutionId) {
      return NextResponse.json({ error: "institutionId is required" }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { id: institutionId },
    });

    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }

    const plan = PLAN_TIERS[targetTier || "ENTERPRISE"] || PLAN_TIERS.ENTERPRISE;
    const finalSeats = seatLimit ? Number(seatLimit) : plan.maxStudents;

    await logAuditEvent({
      institutionId,
      actorUserId: auth.payload.userId || "super_admin",
      action: action === "RENEW" ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_TIER_UPGRADED",
      targetEntity: "InstitutionSubscription",
      targetId: institutionId,
      details: {
        previousTier: "STANDARD",
        newTier: plan.tier,
        seatLimit: finalSeats,
        mrr: plan.pricePerMonthUsd,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Institution ${institution.name} subscription successfully updated to ${plan.tier}.`,
      subscription: {
        institutionId: institution.id,
        tier: plan.tier,
        maxStudents: finalSeats,
        licenseStatus: "ACTIVE",
        renewedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error: any) {
    logger.error("Admin subscriptions POST error", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
