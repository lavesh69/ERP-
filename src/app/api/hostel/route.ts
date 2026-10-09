import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { hostelStore } from "@/lib/hostel/hostel-store";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access hostel services" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";
    const blockId = searchParams.get("blockId") || undefined;

    if (tab === "rooms") {
      const rooms = hostelStore.getRooms(blockId);
      return NextResponse.json({ success: true, rooms });
    }

    if (tab === "gate-passes") {
      const passes = hostelStore.getGatePasses();
      return NextResponse.json({ success: true, passes });
    }

    if (tab === "mess") {
      const messData = hostelStore.getMessPlans();
      const punchedMeals = hostelStore.getPunchedMeals();
      const wasteLogs = hostelStore.getWasteLogs();
      return NextResponse.json({ success: true, ...messData, punchedMeals, wasteLogs });
    }

    if (tab === "night-rollcall") {
      const rollCalls = hostelStore.getNightRollCall(blockId);
      return NextResponse.json({ success: true, rollCalls });
    }

    // Default: summary
    const summary = hostelStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Hostel API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve hostel data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to perform hostel operations" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "SUBMIT_NIGHT_ROLLCALL") {
      const { blockId, blockName, wardenOnDuty, roster } = body;
      if (!blockId || !roster) {
        return NextResponse.json({ error: "blockId and roster are required for night roll call." }, { status: 400 });
      }
      const record = hostelStore.submitNightRollCall({
        blockId,
        blockName,
        wardenOnDuty: wardenOnDuty || session.email || "Chief Resident Warden",
        roster,
      });
      return NextResponse.json({
        success: true,
        message: "Hostel night curfew roll-call recorded and synchronized.",
        record,
      });
    }

    if (action === "ALLOCATE_BED") {
      const { roomId, bedNumber, studentId, studentName, studentRoll, branch } = body;
      if (!roomId || !bedNumber || !studentName || !studentRoll) {
        return NextResponse.json({ error: "Missing required bed allocation fields" }, { status: 400 });
      }

      const result = hostelStore.allocateBed({
        roomId,
        bedNumber,
        studentId: studentId || session.id,
        studentName,
        studentRoll,
        branch: branch || "Engineering",
      });
      return NextResponse.json({ message: `Bed ${bedNumber} allocated successfully`, ...result });
    }

    if (action === "REQUEST_GATE_PASS") {
      const pass = hostelStore.createGatePass({
        studentId: body.studentId || session.id,
        studentName: body.studentName || session.fullName || "Student",
        studentRoll: body.studentRoll || "STU-2026",
        roomNumber: body.roomNumber,
        blockName: body.blockName,
        reason: body.reason,
        destination: body.destination,
        departureTime: body.departureTime,
        expectedReturnTime: body.expectedReturnTime,
        emergencyContact: body.emergencyContact,
        parentConsentVerified: body.parentConsentVerified,
        remarks: body.remarks,
      });
      return NextResponse.json({ success: true, message: "Outpass submitted for warden review", pass });
    }

    if (action === "PROCESS_GATE_PASS") {
      const { passId, passAction, remarks } = body;
      if (!passId || !passAction) {
        return NextResponse.json({ error: "Pass ID and pass action are required" }, { status: 400 });
      }

      const updated = hostelStore.updateGatePass(
        passId,
        passAction,
        session.fullName || session.role,
        remarks
      );
      return NextResponse.json({ success: true, message: `Pass ${passAction.toLowerCase()} successfully`, pass: updated });
    }

    if (action === "SUBSCRIBE_MESS") {
      const { studentId, studentName, studentRoll, planId } = body;
      if (!planId) {
        return NextResponse.json({ error: "Mess plan ID is required" }, { status: 400 });
      }

      const res = hostelStore.subscribeMess(
        studentId || session.id,
        studentName || session.fullName || "Student",
        studentRoll || "STU-2026",
        planId
      );
      return NextResponse.json({ message: "Mess subscription updated successfully", ...res });
    }

    if (action === "PUNCH_MEAL") {
      const { studentRoll, studentName, plan, mealType, lane } = body;
      const punch = hostelStore.recordMealPunch({
        studentRoll: studentRoll || (session as any)?.studentRollNumber || session.email?.split("@")[0] || "STU-2026",
        studentName: studentName || session.fullName || "Student Scholar",
        plan: plan || "All-Access Premium Buffet",
        mealType: mealType || "Dinner (Executive)",
        lane: lane || "Turnstile Gate #01 (Biometric Optical)",
      });
      return NextResponse.json({
        success: true,
        message: "Biometric Turnstile Token Validated! Meal voucher deducted & barrier opened.",
        punch,
      });
    }

    if (action === "LOG_FOOD_WASTE") {
      const { session: diningSession, preparedKg, consumedKg, residents } = body;
      const wasted = Math.max(0, Number(preparedKg) - Number(consumedKg));
      const log = hostelStore.recordFoodWaste({
        session: diningSession || "Dinner",
        preparedKg: Number(preparedKg),
        consumedKg: Number(consumedKg),
        wastedKg: wasted,
        residents: Number(residents) || 1,
      });
      return NextResponse.json({
        success: true,
        message: `Logged ${wasted} kg kitchen surplus for ${diningSession}. Diverted to campus anaerobic digester.`,
        log,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Hostel API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to execute hostel action" }, { status: 400 });
  }
}
