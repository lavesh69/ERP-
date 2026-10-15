import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession, STAFF_ROLES } from "@/lib/auth/admin-guard";
import { generateInstitutionalForecast } from "@/lib/analytics/predictive-engine";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    const userRole = session?.role || "GUEST";
    const institutionId = session?.institutionId || "inst-apex-01";

    // Staff or leadership required for institutional predictive radar
    const isLeadershipOrStaff = STAFF_ROLES.includes(userRole as any);

    const forecast = await generateInstitutionalForecast(institutionId);

    // If caller is student or parent, restrict to academic risk guidance for own scope
    if (userRole === "STUDENT" || userRole === "PARENT") {
      return NextResponse.json({
        success: true,
        overallHealthScore: forecast.overallHealthScore,
        academicRisk: {
          cohortRetentionForecastPercent: forecast.academicRisk.cohortRetentionForecastPercent,
          primaryRiskDrivers: forecast.academicRisk.primaryRiskDrivers,
          metadata: forecast.academicRisk.metadata,
        },
        disclaimer: forecast.disclaimer,
        userNotice: "Detailed financial and resource allocation models are restricted to institutional administrators.",
      });
    }

    if (!isLeadershipOrStaff && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({
        success: true,
        overallHealthScore: forecast.overallHealthScore,
        academicRisk: forecast.academicRisk,
        disclaimer: forecast.disclaimer,
      });
    }

    // Audit query for governance compliance
    await logAuditEvent({
      actorUserId: session?.userId || "usr-anon-staff",
      action: "PREDICTIVE_ANALYTICS_QUERY",
      targetEntity: "InstitutionalPredictiveRadar",
      details: {
        institutionId,
        userRole,
        overallHealthScore: forecast.overallHealthScore,
      },
    });

    return NextResponse.json({
      success: true,
      data: forecast,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate predictive institutional forecast", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
