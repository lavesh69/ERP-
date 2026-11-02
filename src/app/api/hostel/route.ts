import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { hostelStore } from "@/lib/hostel/hostel-store";
import { prisma } from "@/lib/db/prisma";

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

    if (tab === "transfers") {
      const studentRoll = searchParams.get("studentRoll") || undefined;
      const transfers = hostelStore.getTransferRequests(studentRoll);
      return NextResponse.json({ success: true, transfers });
    }

    if (tab === "maintenance") {
      const roomNumber = searchParams.get("roomNumber") || undefined;
      const tickets = hostelStore.getMaintenanceTickets(blockId, roomNumber);
      return NextResponse.json({ success: true, tickets });
    }

    if (tab === "visitors") {
      const studentRoll = searchParams.get("studentRoll") || undefined;
      const visitors = hostelStore.getVisitors(studentRoll);
      return NextResponse.json({ success: true, visitors });
    }

    if (tab === "waitlist") {
      const waitlist = hostelStore.getWaitlist();
      return NextResponse.json({ success: true, waitlist });
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
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only Hostel Wardens or Administrators can allocate beds." }, { status: 403 });
      }

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

      // Synchronize with Finance Ledger if student exists in database
      try {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { rollNumber: studentRoll },
              { admissionNumber: studentRoll },
              { id: studentId || "" },
            ],
          },
        });
        if (student) {
          const feeStructure =
            (await prisma.feeStructure.findFirst({
              where: { title: { contains: "Hostel" } },
            })) || (await prisma.feeStructure.findFirst());

          if (feeStructure) {
            await prisma.studentFee.create({
              data: {
                studentId: student.id,
                feeStructureId: feeStructure.id,
                totalAmount: 1200,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "PENDING",
              },
            });
          }
        }
      } catch (err) {
        console.warn("[Hostel-Finance Link Warning]:", err);
      }

      return NextResponse.json({ message: `Bed ${bedNumber} allocated successfully`, ...result });
    }

    if (action === "VACATE_BED") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only wardens or administrators can vacate hostel beds" }, { status: 403 });
      }

      const { roomId, bedNumber, studentRoll } = body;
      if (!studentRoll && (!roomId || !bedNumber)) {
        return NextResponse.json({ error: "studentRoll or both roomId and bedNumber are required to vacate bed" }, { status: 400 });
      }

      const result = hostelStore.vacateBed({ roomId, bedNumber, studentRoll });
      return NextResponse.json({ message: "Hostel bed vacated and returned to available inventory", ...result });
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
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only Hostel Wardens or Administrators can approve or process gate passes." }, { status: 403 });
      }

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

    if (action === "CLAIM_MESS_REBATE") {
      const { studentRoll, leaveDays } = body;
      const targetRoll = studentRoll || (session as any)?.studentRollNumber || session.email?.split("@")[0] || "STU-2026";
      const days = Number(leaveDays);
      if (!days || days < 3) {
        return NextResponse.json({ error: "Mess rebate requires at least 3 sanctioned leave days" }, { status: 400 });
      }
      const rebate = hostelStore.claimMessRebate(targetRoll, days);
      return NextResponse.json({ success: true, message: `Mess rebate of ₹${rebate.rebateAmount} credited for ${days} sanctioned leave days.`, rebate });
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
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL", "FACULTY", "HR_STAFF"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only mess supervisors, wardens, or administrators can log food surplus" }, { status: 403 });
      }

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

    if (action === "REQUEST_ROOM_TRANSFER") {
      const transfer = hostelStore.requestRoomTransfer({
        studentId: body.studentId || session.id,
        studentName: body.studentName || session.fullName || "Student",
        studentRoll: body.studentRoll || (session as any)?.studentRollNumber || "STU-2026",
        currentRoomId: body.currentRoomId,
        currentBedNumber: body.currentBedNumber,
        targetRoomId: body.targetRoomId,
        targetBedNumber: body.targetBedNumber,
        reason: body.reason,
      });
      return NextResponse.json({
        success: true,
        message: "Room transfer request submitted for warden authorization.",
        transfer,
      });
    }

    if (action === "PROCESS_ROOM_TRANSFER") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only hostel wardens or administrators can process room transfers." },
          { status: 403 }
        );
      }
      const { transferId, remarks } = body;
      const passAction = body.passAction || body.processAction;
      if (!transferId || !passAction) {
        return NextResponse.json({ error: "Transfer ID and action ('APPROVE' or 'REJECT') are required." }, { status: 400 });
      }
      const updated = hostelStore.processRoomTransfer(
        transferId,
        passAction as "APPROVE" | "REJECT",
        session.fullName || session.role,
        remarks
      );
      return NextResponse.json({
        success: true,
        message: `Room transfer ${passAction.toLowerCase()} successfully.`,
        transfer: updated,
      });
    }

    if (action === "LOG_MAINTENANCE_TICKET") {
      const ticket = hostelStore.createMaintenanceTicket({
        blockId: body.blockId,
        blockName: body.blockName,
        roomNumber: body.roomNumber,
        bedNumber: body.bedNumber,
        category: body.category,
        priority: body.priority,
        description: body.description,
        reportedBy: body.reportedBy || session.fullName || "Resident",
        reportedRoll: body.reportedRoll || (session as any)?.studentRollNumber,
      });
      return NextResponse.json({
        success: true,
        message: "Hostel maintenance ticket logged successfully.",
        ticket,
      });
    }

    if (action === "UPDATE_MAINTENANCE_TICKET") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL", "ESTATE_MANAGER", "STAFF", "FACULTY", "HR_STAFF"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only hostel or maintenance staff can update tickets." },
          { status: 403 }
        );
      }
      const { ticketId, status, resolutionNotes } = body;
      if (!ticketId || !status) {
        return NextResponse.json({ error: "Ticket ID and status are required." }, { status: 400 });
      }
      const updated = hostelStore.updateMaintenanceTicket(
        ticketId,
        status,
        session.fullName || session.role,
        resolutionNotes
      );
      return NextResponse.json({
        success: true,
        message: "Maintenance ticket updated successfully.",
        ticket: updated,
      });
    }

    if (action === "LOG_VISITOR_ENTRY") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL", "SECURITY_OFFICER", "STAFF", "HR_STAFF"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only hostel wardens or security officers can register visitors." },
          { status: 403 }
        );
      }
      const visitor = hostelStore.registerVisitor({
        studentRoll: body.studentRoll,
        studentName: body.studentName,
        roomNumber: body.roomNumber,
        blockName: body.blockName,
        visitorName: body.visitorName,
        relation: body.relation,
        phone: body.phone,
        idProofNumber: body.idProofNumber,
        purpose: body.purpose,
        gateSecurityOfficer: session.fullName || "Gate Security Officer",
      });
      return NextResponse.json({
        success: true,
        message: "Hostel visitor entry pass issued.",
        visitor,
      });
    }

    if (action === "CHECKOUT_VISITOR") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "WARDEN", "PRINCIPAL", "SECURITY_OFFICER", "STAFF", "HR_STAFF"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json(
          { error: "Forbidden: Only hostel wardens or security officers can check out visitors." },
          { status: 403 }
        );
      }
      const visitor = hostelStore.checkoutVisitor(body.visitorId);
      return NextResponse.json({
        success: true,
        message: "Visitor checked out successfully.",
        visitor,
      });
    }

    if (action === "JOIN_WAITLIST") {
      const waitlist = hostelStore.joinWaitlist({
        studentId: body.studentId || session.id,
        studentName: body.studentName || session.fullName || "Student Scholar",
        studentRoll: body.studentRoll || (session as any)?.studentRollNumber || "STU-2026",
        gender: body.gender,
        branch: body.branch,
        preferredBlockId: body.preferredBlockId,
        preferredRoomType: body.preferredRoomType,
        distanceFromHomeKm: body.distanceFromHomeKm,
      });
      return NextResponse.json({
        success: true,
        message: "Hostel accommodation waitlist application registered.",
        waitlist,
        waitlistEntry: waitlist,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Hostel API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to execute hostel action" }, { status: 400 });
  }
}
