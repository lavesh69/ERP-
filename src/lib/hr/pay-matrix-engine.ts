/**
 * 7th Central Pay Commission Pay Matrix & Retroactive DA Arrears Engine
 * Implements UGC / MHRD / 7th CPC Pay Bands, Academic Levels 10-15,
 * Annual Increments, and Month-by-Month Retroactive Arrears Calculations.
 */

export interface PayMatrixLevelData {
  academicLevel: string;
  designation: string;
  academicGradePay: number;
  entryPay: number;
  cells: number[];
}

// 7th CPC Academic Pay Matrix Cells (Level 10 to Level 14)
export const PAY_MATRIX_7TH_CPC: Record<string, PayMatrixLevelData> = {
  LEVEL_10: {
    academicLevel: "Academic Level 10 (AGP 6000)",
    designation: "Assistant Professor (Entry)",
    academicGradePay: 6000,
    entryPay: 57700,
    cells: [
      57700, 59400, 61200, 63000, 64900, 66800, 68800, 70900, 73000, 75200,
      77500, 79800, 82200, 84700, 87200, 89800, 92500, 95300, 98200, 101100,
      104100, 107200, 110400, 113700, 117100, 120600, 124200, 127900, 131700, 135700,
      139800, 144000, 148300, 152700, 157300, 162000, 166900, 171900, 177100, 182400,
    ],
  },
  LEVEL_11: {
    academicLevel: "Academic Level 11 (AGP 7000)",
    designation: "Assistant Professor (Senior Scale)",
    academicGradePay: 7000,
    entryPay: 68900,
    cells: [
      68900, 71000, 73100, 75300, 77600, 79900, 82300, 84800, 87300, 89900,
      92600, 95400, 98300, 101200, 104200, 107300, 110500, 113800, 117200, 120700,
      124300, 128000, 131800, 135800, 139900, 144100, 148400, 152900, 157500, 162200,
      167100, 172100, 177300, 182600, 188100, 193700, 199500, 205500,
    ],
  },
  LEVEL_12: {
    academicLevel: "Academic Level 12 (AGP 8000)",
    designation: "Assistant Professor (Selection Grade)",
    academicGradePay: 8000,
    entryPay: 79800,
    cells: [
      79800, 82200, 84700, 87200, 89800, 92500, 95300, 98200, 101100, 104100,
      107200, 110400, 113700, 117100, 120600, 124200, 127900, 131700, 135700, 139800,
      144000, 148300, 152700, 157300, 162000, 166900, 171900, 177100, 182400, 187900,
      193500, 199300, 205300, 211500,
    ],
  },
  LEVEL_13A: {
    academicLevel: "Academic Level 13A (AGP 9000)",
    designation: "Associate Professor",
    academicGradePay: 9000,
    entryPay: 131400,
    cells: [
      131400, 135300, 139400, 143600, 147900, 152300, 156900, 161600, 166400, 171400,
      176500, 181800, 187300, 192900, 198700, 204700, 210800, 217100,
    ],
  },
  LEVEL_14: {
    academicLevel: "Academic Level 14 (AGP 10000)",
    designation: "Professor",
    academicGradePay: 10000,
    entryPay: 144200,
    cells: [
      144200, 148500, 153000, 157600, 162300, 167200, 172200, 177400, 182700, 188200,
      193800, 199600, 205600, 211800, 218200,
    ],
  },
};

export interface DaArrearsMonthBreakdown {
  monthYear: string;
  basicPay: number;
  oldDaPercent: number;
  newDaPercent: number;
  oldDaAmount: number;
  newDaAmount: number;
  grossDaDifference: number;
  pfDeductionOnArrears: number; // 12% on DA difference
  netArrearsPayable: number;
}

export interface DaArrearsStatement {
  employeeId: string;
  employeeName: string;
  payLevel: string;
  periodSummary: string;
  monthsCount: number;
  oldDaPercent: number;
  newDaPercent: number;
  monthlyBreakdowns: DaArrearsMonthBreakdown[];
  totalGrossArrears: number;
  totalPfDeduction: number;
  totalNetArrears: number;
  sanctionOrderNumber: string;
}

export class PayMatrixEngine {
  /**
   * Calculates next basic pay after 3% annual increment
   */
  public static computeAnnualIncrement(academicLevel: string, currentBasic: number): {
    newBasic: number;
    cellIndex: number;
    incrementAmount: number;
  } {
    const levelData = PAY_MATRIX_7TH_CPC[academicLevel] || PAY_MATRIX_7TH_CPC.LEVEL_10;
    const cells = levelData.cells;
    const currentIndex = cells.findIndex((c) => c >= currentBasic);

    if (currentIndex >= 0 && currentIndex < cells.length - 1) {
      const nextCell = cells[currentIndex + 1];
      return {
        newBasic: nextCell,
        cellIndex: currentIndex + 2,
        incrementAmount: nextCell - currentBasic,
      };
    }

    // Stagnation fallback: standard 3% compound rounded off to next 100
    const calculatedIncrement = Math.round((currentBasic * 0.03) / 100) * 100;
    const newBasic = currentBasic + calculatedIncrement;
    return {
      newBasic,
      cellIndex: cells.length,
      incrementAmount: calculatedIncrement,
    };
  }

  /**
   * Calculates Month-by-Month Retroactive Dearness Allowance (DA) Arrears
   */
  public static computeDaArrears(params: {
    employeeId: string;
    employeeName: string;
    academicLevel: string;
    basicPay: number;
    fromMonth: string; // e.g. "2026-07"
    toMonth: string;   // e.g. "2026-09"
    oldDaPercent: number; // e.g. 46%
    newDaPercent: number; // e.g. 50%
  }): DaArrearsStatement {
    const { employeeId, employeeName, academicLevel, basicPay, fromMonth, toMonth, oldDaPercent, newDaPercent } = params;

    const fromDate = new Date(`${fromMonth}-01`);
    const toDate = new Date(`${toMonth}-01`);

    const monthlyBreakdowns: DaArrearsMonthBreakdown[] = [];
    const current = new Date(fromDate);

    while (current <= toDate) {
      const monthStr = current.toLocaleString("en-US", { month: "long", year: "numeric" });
      const oldDaAmount = Math.round((basicPay * oldDaPercent) / 100);
      const newDaAmount = Math.round((basicPay * newDaPercent) / 100);
      const grossDaDifference = newDaAmount - oldDaAmount;
      const pfDeduction = Math.round(grossDaDifference * 0.12); // 12% PF on DA arrears
      const netPayable = grossDaDifference - pfDeduction;

      monthlyBreakdowns.push({
        monthYear: monthStr,
        basicPay,
        oldDaPercent,
        newDaPercent,
        oldDaAmount,
        newDaAmount,
        grossDaDifference,
        pfDeductionOnArrears: pfDeduction,
        netArrearsPayable: netPayable,
      });

      current.setMonth(current.getMonth() + 1);
    }

    const totalGrossArrears = monthlyBreakdowns.reduce((sum, m) => sum + m.grossDaDifference, 0);
    const totalPfDeduction = monthlyBreakdowns.reduce((sum, m) => sum + m.pfDeductionOnArrears, 0);
    const totalNetArrears = totalGrossArrears - totalPfDeduction;

    return {
      employeeId,
      employeeName,
      payLevel: academicLevel,
      periodSummary: `${fromMonth} to ${toMonth}`,
      monthsCount: monthlyBreakdowns.length,
      oldDaPercent,
      newDaPercent,
      monthlyBreakdowns,
      totalGrossArrears,
      totalPfDeduction,
      totalNetArrears,
      sanctionOrderNumber: `UGC-DA-ARR-${newDaPercent}PCT-${Date.now().toString().slice(-6)}`,
    };
  }
}

/**
 * Direct export for computeAnnualIncrement
 */
export function computeAnnualIncrement(
  academicLevel: string,
  currentCellOrBasic: number
): {
  newCellIndex: number;
  newBasicPay: number;
  incrementAmount: number;
  newBasic: number;
  cellIndex: number;
} {
  const levelData = PAY_MATRIX_7TH_CPC[academicLevel] || PAY_MATRIX_7TH_CPC.LEVEL_10;
  const cells = levelData.cells;
  let currentIndex = -1;
  if (currentCellOrBasic < 100) {
    currentIndex = currentCellOrBasic - 1;
  } else {
    currentIndex = cells.findIndex((c) => c >= currentCellOrBasic);
  }

  if (currentIndex >= 0 && currentIndex < cells.length - 1) {
    const nextCell = cells[currentIndex + 1];
    const prevPay = cells[currentIndex] || currentCellOrBasic;
    return {
      newCellIndex: currentIndex + 2,
      newBasicPay: nextCell,
      newBasic: nextCell,
      cellIndex: currentIndex + 2,
      incrementAmount: nextCell - prevPay,
    };
  }

  const currentPay = cells[currentIndex] || currentCellOrBasic;
  const calculatedIncrement = Math.round((currentPay * 0.03) / 100) * 100;
  const newPay = currentPay + calculatedIncrement;
  return {
    newCellIndex: cells.length,
    newBasicPay: newPay,
    newBasic: newPay,
    cellIndex: cells.length,
    incrementAmount: calculatedIncrement,
  };
}

/**
 * Direct export for computeDaArrears
 */
export function computeDaArrears(
  paramOrBasic: any,
  fromMonth?: string,
  toMonth?: string,
  oldDaPercent?: number,
  newDaPercent?: number,
  deductPf: boolean = true
): any {
  if (typeof paramOrBasic === "object" && paramOrBasic !== null) {
    return PayMatrixEngine.computeDaArrears(paramOrBasic);
  }

  const basicPay = Number(paramOrBasic) || 57700;
  const fMonth = fromMonth || "2026-01";
  const tMonth = toMonth || "2026-06";
  const oldDa = oldDaPercent ?? 46;
  const newDa = newDaPercent ?? 50;

  const result = PayMatrixEngine.computeDaArrears({
    employeeId: "EMP-TEMP",
    employeeName: "Staff",
    academicLevel: "LEVEL_10",
    basicPay,
    fromMonth: fMonth,
    toMonth: tMonth,
    oldDaPercent: oldDa,
    newDaPercent: newDa,
  });

  return {
    ...result,
    monthsCount: result.monthsCount,
    totalGrossArrears: result.totalGrossArrears,
    totalPfDeduction: result.totalPfDeduction,
    totalNetArrears: result.totalNetArrears,
  };
}

/**
 * Direct export for compute7thCpcSalary
 */
export function compute7thCpcSalary(
  academicLevel: string,
  cellIndex: number = 1,
  daPercent: number = 50,
  hraPercent: number = 27
): {
  basicPay: number;
  dearnessAllowance: number;
  houseRentAllowance: number;
  grossSalary: number;
} {
  const levelData = PAY_MATRIX_7TH_CPC[academicLevel] || PAY_MATRIX_7TH_CPC.LEVEL_10;
  const basicPay = levelData.cells[Math.max(0, cellIndex - 1)] || levelData.entryPay;
  const dearnessAllowance = Math.round((basicPay * daPercent) / 100);
  const houseRentAllowance = Math.round((basicPay * hraPercent) / 100);
  const grossSalary = basicPay + dearnessAllowance + houseRentAllowance;
  return {
    basicPay,
    dearnessAllowance,
    houseRentAllowance,
    grossSalary,
  };
}

