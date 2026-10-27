import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { transportStore } from "@/lib/transport/transport-store";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to access transport fleet" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "summary";

    if (tab === "routes") {
      const routes = transportStore.getRoutes();
      return NextResponse.json({ success: true, routes });
    }

    if (tab === "passes") {
      const passes = transportStore.getPasses();
      return NextResponse.json({ success: true, passes });
    }

    if (tab === "maintenance") {
      const maintenance = transportStore.getMaintenance();
      return NextResponse.json({ success: true, maintenance });
    }

    // Default: summary
    const summary = transportStore.getSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error("[Transport API Error GET]:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve transport data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getOptionalSession(request);
    if (!session) {
      return NextResponse.json({ error: "Authentication required to execute transport action" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const TRANSPORT_STAFF_ROLES = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ESTATE_OFFICER", "FACULTY", "HR_STAFF"];
    if (["UPDATE_TELEMETRY", "RECORD_MAINTENANCE"].includes(action)) {
      if (!TRANSPORT_STAFF_ROLES.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only fleet managers or administrators can update telemetry or log maintenance" }, { status: 403 });
      }
    }

    if (action === "ISSUE_PASS") {
      const { studentId, studentName, studentRoll, routeId, stopName, feeAmount } = body;
      if (!studentName || !studentRoll || !routeId || !stopName) {
        return NextResponse.json({ error: "Missing required bus pass fields" }, { status: 400 });
      }

      if (session.role === "STUDENT") {
        const student = await prisma.student.findFirst({
          where: {
            OR: [
              { userId: session.userId },
              { user: { email: session.email } },
            ],
          },
        });
        if (student && studentId && studentId !== student.id) {
          return NextResponse.json({ error: "Forbidden: Students can only request bus passes for themselves" }, { status: 403 });
        }
      }

      const pass = transportStore.issueBusPass({
        studentId: studentId || session.id,
        studentName,
        studentRoll,
        routeId,
        stopName,
        feeAmount: feeAmount || 450,
      });

      // Synchronize with Finance Ledger if matching student exists
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
              where: { title: { contains: "Transport" } },
            })) || (await prisma.feeStructure.findFirst());

          if (feeStructure) {
            await prisma.studentFee.create({
              data: {
                studentId: student.id,
                feeStructureId: feeStructure.id,
                totalAmount: Number(feeAmount) || 450,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: "PENDING",
              },
            });
          }
        }
      } catch (err) {
        console.warn("[Transport-Finance Link Warning]:", err);
      }

      return NextResponse.json({ success: true, message: "Digital transit pass issued successfully", pass });
    }

    if (action === "UPDATE_TELEMETRY") {
      const { vehicleId, updates } = body;
      if (!vehicleId || !updates) {
        return NextResponse.json({ error: "Vehicle ID and telemetry updates required" }, { status: 400 });
      }

      const vehicle = transportStore.updateVehicleTelemetry(vehicleId, updates);
      return NextResponse.json({ success: true, message: "Vehicle telemetry refreshed", vehicle });
    }

    if (action === "RECORD_MAINTENANCE") {
      const { vehicleId, vehicleCode, serviceType, date, odometerKm, cost, workshopName, notes } = body;
      if (!vehicleId || !serviceType || !date) {
        return NextResponse.json({ error: "Vehicle ID, service type and date are required" }, { status: 400 });
      }

      const rec = transportStore.addMaintenanceRecord({
        vehicleId,
        vehicleCode: vehicleCode || "BUS",
        serviceType,
        date,
        odometerKm: Number(odometerKm) || 0,
        cost: Number(cost) || 0,
        workshopName: workshopName || "Authorized Depot",
        notes: notes || "",
      });

      return NextResponse.json({ success: true, message: "Maintenance service logged successfully", record: rec });
    }

    if (action === "REGISTER_VEHICLE") {
      const allowedRoles = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "TRANSPORT_MANAGER", "OPERATIONS_STAFF"];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: "Forbidden: Only transport administrators can register new fleet vehicles" }, { status: 403 });
      }

      const vehicle = transportStore.registerVehicle(body);
      return NextResponse.json({ success: true, message: `Vehicle ${vehicle.vehicleCode} (${vehicle.registrationNumber}) registered successfully`, vehicle }, { status: 201 });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error("[Transport API Error POST]:", error);
    return NextResponse.json({ error: error.message || "Failed to process transport request" }, { status: 400 });
  }
}
