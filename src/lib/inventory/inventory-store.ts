/**
 * Persistent Data Store for Enterprise Campus Assets & Inventory
 * Stores and manages fixed physical assets, consumables stock, and maintenance work orders.
 */

import fs from "fs";
import path from "path";
import {
  CampusAsset,
  ConsumableItem,
  WorkOrderTicket,
  computeStraightLineDepreciation,
  evaluateReorderStatus,
  validateAssetRegistration,
} from "./inventory-engine";

const DATA_DIR = path.join(process.cwd(), "data", "inventory");
const STORE_FILE = path.join(DATA_DIR, "asset_registry.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface InventoryStoreSchema {
  assets: CampusAsset[];
  consumables: ConsumableItem[];
  workOrders: WorkOrderTicket[];
}

const DEFAULT_ASSETS: CampusAsset[] = [
  {
    id: "ast-01",
    assetTag: "AST-CS-1092",
    name: "NVIDIA DGX H100 AI Supercomputing Node",
    category: "IT_COMPUTING",
    department: "Computer Science & Engineering",
    locationRoom: "HPC Data Center Rack 04",
    custodianFaculty: "Dr. Alan Turing",
    purchaseDate: "2024-03-15",
    purchaseCost: 320000,
    currentDepreciatedValue: 192000,
    warrantyExpiry: "2027-03-15",
    status: "OPERATIONAL",
    serialNumber: "SN-NV-DGX-99812",
    modelNumber: "DGX-H100-8X",
    maintenanceHistoryCount: 2,
  },
  {
    id: "ast-02",
    assetTag: "AST-MECH-4410",
    name: "HAAS VF-2 Precision CNC Milling Center",
    category: "LAB_INSTRUMENTATION",
    department: "Mechanical & Mechatronics",
    locationRoom: "Advanced Manufacturing Shop (Bldg D-12)",
    custodianFaculty: "Dr. Arthur Pendelton",
    purchaseDate: "2023-08-20",
    purchaseCost: 85000,
    currentDepreciatedValue: 47200,
    warrantyExpiry: "2026-08-20",
    status: "OPERATIONAL",
    serialNumber: "SN-HAAS-VF2-3310",
    modelNumber: "VF-2-SS",
    maintenanceHistoryCount: 4,
  },
  {
    id: "ast-03",
    assetTag: "AST-AV-2019",
    name: "Epson Pro L1755UNL Laser Cinema Projector",
    category: "CLASSROOM_AV",
    department: "Central Academic Facility",
    locationRoom: "Auditorium Hall A (500-Seater)",
    custodianFaculty: "Prof. Kenneth Clark",
    purchaseDate: "2024-06-10",
    purchaseCost: 22000,
    currentDepreciatedValue: 14800,
    warrantyExpiry: "2027-06-10",
    status: "UNDER_MAINTENANCE",
    serialNumber: "SN-EPS-L175-994",
    modelNumber: "L1755UNL",
    maintenanceHistoryCount: 1,
  },
];

const DEFAULT_CONSUMABLES: ConsumableItem[] = [
  {
    id: "con-01",
    itemCode: "MAT-PLA-01",
    name: "Industrial 3D Printing Filament (PLA+ 1.75mm)",
    category: "Maker Lab Supplies",
    unit: "Spools (1kg)",
    quantityOnHand: 42,
    minReorderThreshold: 15,
    unitCost: 28,
    supplierName: "Polymer Pro Labs Inc.",
    needsReorder: false,
  },
  {
    id: "con-02",
    itemCode: "CHM-ETH-99",
    name: "Analytical Grade Ethanol (99.8% Pure)",
    category: "Chemistry Consumables",
    unit: "Bottles (2.5L)",
    quantityOnHand: 4,
    minReorderThreshold: 10,
    unitCost: 65,
    supplierName: "Sigma-Aldrich Chemicals",
    needsReorder: true,
  },
  {
    id: "con-03",
    itemCode: "IT-RJ45-CAT6",
    name: "Shielded Cat6 Gigabit Patch Cables (3 Meter)",
    category: "Networking Supplies",
    unit: "Packs of 10",
    quantityOnHand: 18,
    minReorderThreshold: 12,
    unitCost: 35,
    supplierName: "Belkin Enterprise Cables",
    needsReorder: false,
  },
];

const DEFAULT_WORK_ORDERS: WorkOrderTicket[] = [
  {
    id: "wo-01",
    workOrderNo: "WO-2026-4401",
    assetId: "ast-03",
    assetTag: "AST-AV-2019",
    assetName: "Epson Pro L1755UNL Laser Cinema Projector",
    reportedIssue: "High temperature optical lamp warning tripping after 45 minutes of continuous presentation.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTechnician: "Marcus Vance (AV Lead)",
    estimatedCost: 350,
    reportedDate: "2026-10-04T10:00:00.000Z",
    notes: "Exhaust blower fan replacement ordered from OEM authorized distributor.",
  },
];

function readStore(): InventoryStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: InventoryStoreSchema = {
      assets: DEFAULT_ASSETS,
      consumables: DEFAULT_CONSUMABLES,
      workOrders: DEFAULT_WORK_ORDERS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading inventory store, fallback to default", err);
    return {
      assets: DEFAULT_ASSETS,
      consumables: DEFAULT_CONSUMABLES,
      workOrders: DEFAULT_WORK_ORDERS,
    };
  }
}

function writeStore(data: InventoryStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const inventoryStore = {
  getSummary() {
    const store = readStore();
    const totalAssets = store.assets.length;
    const operationalAssets = store.assets.filter((a) => a.status === "OPERATIONAL").length;
    const totalAssetValuation = store.assets.reduce((acc, a) => acc + a.currentDepreciatedValue, 0);
    const lowStockItems = store.consumables.filter((c) => evaluateReorderStatus(c.quantityOnHand, c.minReorderThreshold)).length;
    const openWorkOrders = store.workOrders.filter((w) => w.status !== "COMPLETED").length;

    return {
      totalAssets,
      operationalAssets,
      assetOperationalRate: totalAssets > 0 ? Math.round((operationalAssets / totalAssets) * 1000) / 10 : 0,
      totalAssetValuation,
      lowStockItems,
      openWorkOrders,
      totalConsumables: store.consumables.length,
    };
  },

  getAssets(category?: string) {
    const store = readStore();
    let list = store.assets.map((a) => {
      const dep = computeStraightLineDepreciation(a.purchaseCost, a.purchaseDate, 5);
      return {
        ...a,
        currentDepreciatedValue: dep.currentBookValue,
      };
    });

    if (category && category !== "ALL") {
      list = list.filter((a) => a.category === category);
    }
    return list;
  },

  getConsumables() {
    const store = readStore();
    return store.consumables.map((c) => ({
      ...c,
      needsReorder: evaluateReorderStatus(c.quantityOnHand, c.minReorderThreshold),
    }));
  },

  getWorkOrders() {
    return readStore().workOrders;
  },

  addAsset(payload: Partial<CampusAsset>) {
    const validation = validateAssetRegistration(payload);
    if (!validation.isValid) {
      throw new Error(`Asset Validation Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const dep = computeStraightLineDepreciation(payload.purchaseCost || 0, payload.purchaseDate || new Date().toISOString(), 5);

    const newAsset: CampusAsset = {
      id: `ast-${Date.now()}`,
      assetTag: payload.assetTag || `AST-${payload.category?.slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: payload.name!,
      category: payload.category!,
      department: payload.department!,
      locationRoom: payload.locationRoom!,
      custodianFaculty: payload.custodianFaculty || "Department Head",
      purchaseDate: payload.purchaseDate || new Date().toISOString().split("T")[0],
      purchaseCost: payload.purchaseCost || 0,
      currentDepreciatedValue: dep.currentBookValue,
      warrantyExpiry: payload.warrantyExpiry || "2028-12-31",
      status: "OPERATIONAL",
      serialNumber: payload.serialNumber || "SN-OEM-GENERIC",
      modelNumber: payload.modelNumber || "STD-MODEL",
      maintenanceHistoryCount: 0,
    };

    store.assets.unshift(newAsset);
    writeStore(store);
    return newAsset;
  },

  createWorkOrder(params: {
    assetId: string;
    reportedIssue: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
    assignedTechnician?: string;
    estimatedCost?: number;
  }) {
    const store = readStore();
    const asset = store.assets.find((a) => a.id === params.assetId);
    if (!asset) throw new Error("Target asset not found.");

    asset.status = "UNDER_MAINTENANCE";
    asset.maintenanceHistoryCount += 1;

    const newOrder: WorkOrderTicket = {
      id: `wo-${Date.now()}`,
      workOrderNo: `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      reportedIssue: params.reportedIssue,
      priority: params.priority || "MEDIUM",
      status: "OPEN",
      assignedTechnician: params.assignedTechnician || "Campus Engineering Staff",
      estimatedCost: params.estimatedCost || 100,
      reportedDate: new Date().toISOString(),
    };

    store.workOrders.unshift(newOrder);
    writeStore(store);
    return newOrder;
  },

  completeWorkOrder(orderId: string, actualCost: number, notes?: string) {
    const store = readStore();
    const order = store.workOrders.find((w) => w.id === orderId);
    if (!order) throw new Error("Work order not found.");

    order.status = "COMPLETED";
    order.actualCost = actualCost;
    order.completedDate = new Date().toISOString();
    if (notes) order.notes = notes;

    const asset = store.assets.find((a) => a.id === order.assetId);
    if (asset) {
      asset.status = "OPERATIONAL";
    }

    writeStore(store);
    return order;
  },
};
