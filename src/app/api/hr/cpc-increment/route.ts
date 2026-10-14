import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import { prisma } from "@/lib/db/prisma";
import {
  PAY_MATRIX_7TH_CPC,
  computeAnnualIncrement,
  PayMatrixEngine,
} from "@/lib/hr/pay-matrix-engine";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const academicLevel = searchParams.get("level") || "LEVEL_10";

    const levelData = PAY_MATRIX_7TH_CPC[academicLevel] || PAY_MATRIX_7TH_CPC.LEVEL_10;

    return NextResponse.json({
      success: true,
      currentLevelData: levelData,
      allLevels: Object.keys(PAY_MATRIX_7TH_CPC).map((key) => ({
        key,
        levelName: PAY_MATRIX_7TH_CPC[key].academicLevel,
        designation: PAY_MATRIX_7TH_CPC[key].designation,
        entryPay: PAY_MATRIX_7TH_CPC[key].entryPay,
        agp: PAY_MATRIX_7TH_CPC[key].academicGradePay,
        totalCells: PAY_MATRIX_7TH_CPC[key].cells.length,
        maximumPay: PAY_MATRIX_7TH_CPC[key].cells[PAY_MATRIX_7TH_CPC[key].cells.length - 1],
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "SIMULATE_ANNUAL_INCREMENT") {
      const {
        employeeId = "EMP-FAC-01",
        employeeName = "Dr. Rajesh K. Sharma",
        academicLevel = "LEVEL_12",
        currentBasic = 84700,
        effectiveDate = "2026-07-01",
      } = body;

      const incrementResult = computeAnnualIncrement(academicLevel, Number(currentBasic));

      const sealPayload = `${employeeId}|${academicLevel}|${currentBasic}|${incrementResult.newBasicPay}|${effectiveDate}`;
      const sanctionOrderNumber = `UGC-CPC7-INC-${Date.now().toString().slice(-6)}`;
      const verificationSeal = `7THCPC-INC-SEAL-${crypto.createHash("sha256").update(sealPayload).digest("hex").substring(0, 24).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        message: "Annual vertical 3% increment successfully calculated",
        incrementDetails: {
          employeeId,
          employeeName,
          academicLevel,
          sanctionOrderNumber,
          effectiveDate,
          previousBasicPay: Number(currentBasic),
          newBasicPay: incrementResult.newBasicPay,
          monthlyHike: incrementResult.incrementAmount,
          annualGrossHike: incrementResult.incrementAmount * 12,
          newCellIndex: incrementResult.newCellIndex,
          verificationSeal,
        },
      });
    }

    if (action === "APPLY_CAS_PROMOTION") {
      const {
        employeeId = "EMP-FAC-01",
        employeeName = "Dr. Rajesh K. Sharma",
        fromLevel = "LEVEL_12",
        toLevel = "LEVEL_13A",
        currentBasic = 95300,
        effectiveDate = "2026-08-01",
      } = body;

      const targetLevelData = PAY_MATRIX_7TH_CPC[toLevel];
      if (!targetLevelData) {
        return NextResponse.json({ error: `Invalid target pay level: ${toLevel}` }, { status: 400 });
      }

      // Fixation of pay on promotion (Rule 13):
      // 1. One notional increment is given in the existing level.
      const notional = computeAnnualIncrement(fromLevel, Number(currentBasic));
      const notionalPay = notional.newBasicPay;

      // 2. In the new level, locate the cell equal to or next higher than the notional pay.
      const targetCells = targetLevelData.cells;
      let fixedCellIndex = targetCells.findIndex((c) => c >= notionalPay);
      if (fixedCellIndex === -1) {
        fixedCellIndex = targetCells.length - 1;
      }
      const fixedPay = targetCells[fixedCellIndex];

      const sealPayload = `CAS|${employeeId}|${fromLevel}->${toLevel}|${fixedPay}|${effectiveDate}`;
      const casOrderNumber = `UGC-CAS-PROM-${Date.now().toString().slice(-6)}`;
      const verificationSeal = `CAS-PROM-SEAL-${crypto.createHash("sha256").update(sealPayload).digest("hex").substring(0, 24).toUpperCase()}`;

      return NextResponse.json({
        success: true,
        message: "UGC CAS promotion fixation calculated in accordance with 7th CPC Rule 13",
        promotionDetails: {
          employeeId,
          employeeName,
          fromLevel,
          toLevel,
          targetDesignation: targetLevelData.designation,
          casOrderNumber,
          effectiveDate,
          previousBasicPay: Number(currentBasic),
          notionalPayBeforeFixation: notionalPay,
          promotedBasicPay: fixedPay,
          promotedCellIndex: fixedCellIndex + 1,
          monthlyPayJump: fixedPay - Number(currentBasic),
          annualizedDifferential: (fixedPay - Number(currentBasic)) * 12,
          verificationSeal,
        },
      });
    }

    if (action === "COMPUTE_DA_ARREARS") {
      const {
        employeeId = "EMP-FAC-01",
        employeeName = "Dr. Rajesh K. Sharma",
        academicLevel = "LEVEL_12",
        basicPay = 87200,
        fromMonth = "2026-01",
        toMonth = "2026-06",
        oldDaPercent = 46,
        newDaPercent = 50,
      } = body;

      const arrears = PayMatrixEngine.computeDaArrears({
        employeeId,
        employeeName,
        academicLevel,
        basicPay: Number(basicPay),
        fromMonth,
        toMonth,
        oldDaPercent: Number(oldDaPercent),
        newDaPercent: Number(newDaPercent),
      });

      return NextResponse.json({
        success: true,
        message: `DA Arrears computed across ${arrears.monthsCount} months (${oldDaPercent}% -> ${newDaPercent}%)`,
        arrears,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
