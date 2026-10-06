/**
 * Enterprise Campus Asset & Facility Inventory Engine
 * Implements fixed-asset lifecycle tracking, straight-line depreciation, stock replenishment, and work orders.
 */

export type AssetCategory =
  | "IT_COMPUTING"
  | "LAB_INSTRUMENTATION"
  | "CLASSROOM_AV"
  | "FURNITURE_FACILITY"
  | "ELECTRICAL_HVAC";

export type AssetStatus =
  | "OPERATIONAL"
  | "UNDER_MAINTENANCE"
  | "CALIBRATION_DUE"
  | "SCRAPPED_RETIRED";

export interface CampusAsset {
  id: string;
  assetTag: string; // "AST-CS-1092"
  name: string;
  category: AssetCategory;
  department: string;
  locationRoom: string;
  custodianFaculty: string;
  purchaseDate: string;
  purchaseCost: number;
  currentDepreciatedValue: number;
  warrantyExpiry: string;
  status: AssetStatus;
  serialNumber: string;
  modelNumber: string;
  maintenanceHistoryCount: number;
}

export interface ConsumableItem {
  id: string;
  itemCode: string;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  minReorderThreshold: number;
  unitCost: number;
  supplierName: string;
  needsReorder: boolean;
}

export interface WorkOrderTicket {
  id: string;
  workOrderNo: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  reportedIssue: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  assignedTechnician: string;
  estimatedCost: number;
  actualCost?: number;
  reportedDate: string;
  completedDate?: string;
  notes?: string;
}

/**
 * Computes straight-line asset depreciation based on acquisition date and useful lifespan
 */
export function computeStraightLineDepreciation(
  purchaseCost: number,
  purchaseDate: string,
  usefulLifeYears: number = 5,
  salvageValue: number = 0
): { currentBookValue: number; accumulatedDepreciation: number; annualDepreciation: number } {
  if (purchaseCost <= 0) {
    return { currentBookValue: 0, accumulatedDepreciation: 0, annualDepreciation: 0 };
  }

  const annualDep = (purchaseCost - salvageValue) / Math.max(1, usefulLifeYears);
  const purchaseTime = new Date(purchaseDate).getTime();
  const now = new Date().getTime();
  const yearsElapsed = Math.max(0, (now - purchaseTime) / (1000 * 60 * 60 * 24 * 365.25));

  const accumulated = Math.min(purchaseCost - salvageValue, annualDep * yearsElapsed);
  const currentVal = Math.max(salvageValue, purchaseCost - accumulated);

  return {
    currentBookValue: Math.round(currentVal),
    accumulatedDepreciation: Math.round(accumulated),
    annualDepreciation: Math.round(annualDep),
  };
}

/**
 * Determines whether a consumable stock item needs replenishment
 */
export function evaluateReorderStatus(quantityOnHand: number, minThreshold: number): boolean {
  return quantityOnHand <= minThreshold;
}

/**
 * Validates fixed asset registration inputs
 */
export function validateAssetRegistration(asset: Partial<CampusAsset>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!asset.name || asset.name.trim().length === 0) {
    errors.push("Asset name is required.");
  }
  if (!asset.category) {
    errors.push("Asset category classification is required.");
  }
  if (!asset.department || asset.department.trim().length === 0) {
    errors.push("Owning academic or administrative department is required.");
  }
  if (!asset.locationRoom || asset.locationRoom.trim().length === 0) {
    errors.push("Designated physical location / room is required.");
  }
  if (typeof asset.purchaseCost !== "number" || asset.purchaseCost < 0) {
    errors.push("Valid positive purchase cost is required.");
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}
