// SPDX-License-Identifier: Apache-2.0
/**
 * Incubation Center API Route
 * Handles venture registration, stage progression, mentor assignment,
 * innovation lab desk allocations, seed grant disbursements, patent disclosures, and milestone reviews.
 */

import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { incubationStore } from "@/lib/incubation/incubation-store";
import { IncubationStage } from "@/lib/incubation/incubation-engine";

const INCUBATION_STAFF_ROLES = [
  "SUPER_ADMIN",
  "INSTITUTION_ADMIN",
  "PRINCIPAL",
  "DEAN",
  "HOD",
  "FACULTY",
  "RESEARCH_COORDINATOR",
];

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access incubation portal" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const stage = (searchParams.get("stage") as IncubationStage) || undefined;
    const startupId = searchParams.get("startupId") || undefined;

    if (tab === "startups") {
      const startups = incubationStore.getStartups(stage);
      return NextResponse.json({ success: true, startups });
    }

    if (tab === "desks") {
      const desks = incubationStore.getDesks();
      return NextResponse.json({ success: true, desks });
    }

    if (tab === "grants") {
      const tranches = incubationStore.getGrantTranches(startupId);
      return NextResponse.json({ success: true, tranches });
    }

    if (tab === "patents") {
      const patents = incubationStore.getPatents(startupId);
      return NextResponse.json({ success: true, patents });
    }

    if (tab === "reviews") {
      const reviews = incubationStore.getMilestoneReviews(startupId);
      return NextResponse.json({ success: true, reviews });
    }

    const summary = incubationStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Incubation API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve incubation data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform incubation operation" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "REGISTER_VENTURE") {
      const {
        startupName,
        founderName,
        founderRollOrStaffId,
        founderRole,
        sector,
        stage,
        pitchDeckSummary,
        seedGrantDisbursed,
        universityEquityPercentage,
        labDesksAllocated,
        mentorName,
      } = body;

      const venture = incubationStore.registerStartup({
        startupName,
        founderName,
        founderRollOrStaffId,
        founderRole,
        sector,
        stage,
        pitchDeckSummary,
        seedGrantDisbursed: seedGrantDisbursed !== undefined ? Number(seedGrantDisbursed) : 0,
        universityEquityPercentage: universityEquityPercentage !== undefined ? Number(universityEquityPercentage) : 0,
        labDesksAllocated: labDesksAllocated !== undefined ? Number(labDesksAllocated) : 1,
        mentorName,
      });

      return NextResponse.json({
        success: true,
        message: `Startup registered into incubation cohort (${venture.companyRef})`,
        venture,
      });
    }

    if (action === "UPDATE_STAGE") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only incubation coordinators and administrators can update venture stages and funding" },
          { status: 403 }
        );
      }

      const { id, stage, seedGrantDisbursed, externalFundingRaised } = body;
      if (!id || !stage) {
        return NextResponse.json({ error: "Venture ID and stage are required" }, { status: 400 });
      }

      const updated = incubationStore.updateStartupStage(id, stage as IncubationStage, {
        seed: seedGrantDisbursed !== undefined ? Number(seedGrantDisbursed) : undefined,
        external: externalFundingRaised !== undefined ? Number(externalFundingRaised) : undefined,
      });

      return NextResponse.json({
        success: true,
        message: `Venture stage transitioned to ${stage}`,
        venture: updated,
      });
    }

    if (action === "ASSIGN_MENTOR") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only incubation coordinators and administrators can assign venture mentors" },
          { status: 403 }
        );
      }

      const { id, mentorName } = body;
      if (!id || !mentorName) {
        return NextResponse.json({ error: "Venture ID and mentorName are required" }, { status: 400 });
      }

      const updated = incubationStore.assignMentor(id, mentorName);
      return NextResponse.json({
        success: true,
        message: `Assigned mentor ${mentorName} to venture ${updated.startupName}`,
        venture: updated,
      });
    }

    if (action === "ALLOCATE_DESK") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only incubation staff can allocate workspace desks" },
          { status: 403 }
        );
      }

      const { deskCode, startupId } = body;
      if (!deskCode || !startupId) {
        return NextResponse.json({ error: "Both deskCode and startupId are required" }, { status: 400 });
      }

      const allocated = incubationStore.allocateDesk(deskCode, startupId);
      return NextResponse.json({
        success: true,
        message: `Desk ${deskCode} allocated to ${allocated.startupName}`,
        desk: allocated,
      });
    }

    if (action === "DEALLOCATE_DESK") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only incubation staff can deallocate workspace desks" },
          { status: 403 }
        );
      }

      const { deskCode } = body;
      if (!deskCode) {
        return NextResponse.json({ error: "deskCode is required" }, { status: 400 });
      }

      const vacated = incubationStore.deallocateDesk(deskCode);
      return NextResponse.json({
        success: true,
        message: `Desk ${deskCode} released and marked VACANT`,
        desk: vacated,
      });
    }

    if (action === "DISBURSE_GRANT") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only incubation directors and accountants can disburse seed grants" },
          { status: 403 }
        );
      }

      const tranche = incubationStore.disburseGrantTranche(body);
      return NextResponse.json({
        success: true,
        message: `Seed grant tranche of INR ${tranche.amount.toLocaleString()} disbursed to ${tranche.startupName}`,
        tranche,
      });
    }

    if (action === "FILE_PATENT") {
      const patent = incubationStore.filePatentDisclosure(body);
      return NextResponse.json({
        success: true,
        message: `Invention disclosure filed: ${patent.inventionTitle} (${patent.disclosureRef})`,
        patent,
      });
    }

    if (action === "RECORD_REVIEW") {
      if (!INCUBATION_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only mentors and incubation committee can log quarterly reviews" },
          { status: 403 }
        );
      }

      const review = incubationStore.recordMilestoneReview(body);
      return NextResponse.json({
        success: true,
        message: `Quarterly milestone review logged for ${review.startupName} (${review.quarter})`,
        review,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Incubation API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process incubation request" }, { status: 400 });
  }
}
