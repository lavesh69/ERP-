import fs from "fs";
import path from "path";
import crypto from "crypto";
import { inventoryStore } from "@/lib/inventory/inventory-store";

export type EstateDiscipline = "CIVIL" | "ELECTRICAL" | "HVAC" | "PLUMBING_WATER" | "FIRE_SAFETY";
export type EstatePriority = "CRITICAL_EMERGENCY" | "HIGH_PRIORITY" | "MEDIUM_PRIORITY" | "ROUTINE_PLANNED";

export interface EstateAsset {
  id: string;
  assetCode: string;
  name: string;
  discipline: EstateDiscipline;
  location: string;
  status: "OPERATIONAL" | "NEEDS_SERVICE" | "UNDER_REPAIR" | "CRITICAL_OFFLINE";
  installedYear: number;
  lastServicedDate: string;
  nextPreventiveServiceDue: string;
  specifications: string;
}

export interface EstateMaterialBOQ {
  materialName: string;
  quantity: number;
  cost: number;
}

export interface EstateWorkOrder {
  id: string;
  workOrderNumber: string;
  discipline: EstateDiscipline;
  priority: EstatePriority;
  slaHours: number;
  location: string;
  issueTitle: string;
  issueDescription: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  status: "LOGGED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  assignedEngineer?: {
    engineerName: string;
    engineerRole: string;
    assignedAt: string;
    targetResolutionDate: string;
    estimatedMaterialCost: number;
  };
  materialsBOQ?: EstateMaterialBOQ[];
  completionDetails?: {
    completedAt: string;
    actualCost: number;
    engineerNotes: string;
    completionCertificateNumber: string;
    cryptographicSeal: string;
    inventoryStockReconciled?: boolean;
  };
  userClosureRating?: {
    ratingStars: number;
    satisfactionFeedback: string;
    closedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EstateDataPayload {
  assets: EstateAsset[];
  workOrders: EstateWorkOrder[];
}

const DATA_FILE = path.join(process.cwd(), "data", "estate", "estate_operations.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

const DEFAULT_ESTATE_ASSETS: EstateAsset[] = [
  {
    id: "asset-substation",
    assetCode: "EST-SUB-11KV",
    name: "Campus 11kV High-Tension Electrical Substation",
    discipline: "ELECTRICAL",
    location: "Main Substation Yard, West Campus Gate 3",
    status: "OPERATIONAL",
    installedYear: 2021,
    lastServicedDate: "2026-08-20",
    nextPreventiveServiceDue: "2026-11-20",
    specifications: "1500 kVA Step-Down Transformer with SF6 circuit breaker and auto power-factor correction.",
  },
  {
    id: "asset-genset",
    assetCode: "EST-GEN-500KVA",
    name: "Diesel Generator Power Backup System (500 kVA)",
    discipline: "ELECTRICAL",
    location: "Powerhouse Annex Behind Administrative Block",
    status: "OPERATIONAL",
    installedYear: 2022,
    lastServicedDate: "2026-09-05",
    nextPreventiveServiceDue: "2026-12-05",
    specifications: "Cummins Turbocharged Diesel Engine with acoustic silent canopy and AMF synchronization panel.",
  },
  {
    id: "asset-stp",
    assetCode: "EST-STP-100KLD",
    name: "100 kLD Sewage Treatment & Greywater Recycling Plant",
    discipline: "PLUMBING_WATER",
    location: "South Campus Utility Zone",
    status: "OPERATIONAL",
    installedYear: 2020,
    lastServicedDate: "2026-07-15",
    nextPreventiveServiceDue: "2026-10-25",
    specifications: "MBBR technology bioreactor with tertiary dual-media sand/carbon filtration and UV disinfectant.",
  },
  {
    id: "asset-chiller",
    assetCode: "EST-HVAC-CHILLER",
    name: "Central Auditorium Water-Cooled Screw Chiller (250 TR)",
    discipline: "HVAC",
    location: "Central Library & Auditorium Basement Plant Room",
    status: "NEEDS_SERVICE",
    installedYear: 2019,
    lastServicedDate: "2026-05-10",
    nextPreventiveServiceDue: "2026-10-10",
    specifications: "Carrier 30XW series screw compressor using eco-friendly R134a refrigerant.",
  },
  {
    id: "asset-fire-hydrant",
    assetCode: "EST-FIRE-PUMP",
    name: "Automatic Wet-Riser Firefighting Hydrant Pump System",
    discipline: "FIRE_SAFETY",
    location: "Underground Fire Water Reservoir (200,000 Liters)",
    status: "OPERATIONAL",
    installedYear: 2023,
    lastServicedDate: "2026-09-18",
    nextPreventiveServiceDue: "2026-12-18",
    specifications: "Main electric pump 75 HP, diesel standby pump 80 HP, jockey pressurization pump 10 HP.",
  },
];

const DEFAULT_WORK_ORDERS: EstateWorkOrder[] = [
  {
    id: "wo-2026-001",
    workOrderNumber: "APEX-ESTATE-WO-2026-1001",
    discipline: "HVAC",
    priority: "HIGH_PRIORITY",
    slaHours: 6,
    location: "Central Library - 2nd Floor Digital Reading Hall",
    issueTitle: "Air Conditioning VRF Unit 3 Tripping Circuit Breaker",
    issueDescription: "The 8.5 TR indoor cassette unit in the digital research hall trips the 3-phase MCB immediately upon compressor startup.",
    requesterId: "lib-head-01",
    requesterName: "Dr. Meenakshi Sundaram",
    requesterDepartment: "Central Library & Informatics",
    status: "IN_PROGRESS",
    assignedEngineer: {
      engineerName: "Er. Pradeep Nair (JE HVAC)",
      engineerRole: "Junior Engineer (HVAC & Mechanical)",
      assignedAt: "2026-10-15T06:30:00.000Z",
      targetResolutionDate: "2026-10-15T12:30:00.000Z",
      estimatedMaterialCost: 3500,
    },
    materialsBOQ: [
      { materialName: "40A 3-Pole MCB Breaker", quantity: 1, cost: 1200 },
      { materialName: "Compressor Contactor 24V Coil", quantity: 1, cost: 1800 },
    ],
    createdAt: "2026-10-15T05:45:00.000Z",
    updatedAt: "2026-10-15T07:00:00.000Z",
  },
  {
    id: "wo-2026-002",
    workOrderNumber: "APEX-ESTATE-WO-2026-1002",
    discipline: "CIVIL",
    priority: "ROUTINE_PLANNED",
    slaHours: 72,
    location: "Engineering Block C - Room 204 (Smart Classroom)",
    issueTitle: "Acoustic False Ceiling Tile Repair & Window Latch Replacement",
    issueDescription: "Three mineral fiber ceiling panels dislodged due to wind gust; soundproofing is compromised.",
    requesterId: "fac-ece-44",
    requesterName: "Prof. Rajesh Kumar",
    requesterDepartment: "Department of Electronics & Communication",
    status: "COMPLETED",
    assignedEngineer: {
      engineerName: "Er. G. K. Sharma (JE Civil)",
      engineerRole: "Junior Engineer (Civil & Structural)",
      assignedAt: "2026-10-14T10:00:00.000Z",
      targetResolutionDate: "2026-10-17T10:00:00.000Z",
      estimatedMaterialCost: 1800,
    },
    completionDetails: {
      completedAt: "2026-10-14T16:30:00.000Z",
      actualCost: 1650,
      engineerNotes: "Replaced 3 Armstrong 600x600 ceiling tiles with aluminum grid clips and oiled window latches.",
      completionCertificateNumber: "APEX-ESTATE-CERT-2026-9041",
      cryptographicSeal: "f1a8c903b4e2d71628394a5c6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f",
    },
    userClosureRating: {
      ratingStars: 5,
      satisfactionFeedback: "Swift repair before the afternoon laboratory session. Excellent finish.",
      closedAt: "2026-10-14T17:00:00.000Z",
    },
    createdAt: "2026-10-14T09:15:00.000Z",
    updatedAt: "2026-10-14T17:00:00.000Z",
  },
];

export function loadEstateData(): EstateDataPayload {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load estate data, using defaults:", err);
  }

  const initialData: EstateDataPayload = {
    assets: DEFAULT_ESTATE_ASSETS,
    workOrders: DEFAULT_WORK_ORDERS,
  };
  saveEstateData(initialData);
  return initialData;
}

export function saveEstateData(data: EstateDataPayload): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save estate data:", err);
  }
}

export function computeSLAHours(priority: EstatePriority): number {
  switch (priority) {
    case "CRITICAL_EMERGENCY":
      return 2;
    case "HIGH_PRIORITY":
      return 6;
    case "MEDIUM_PRIORITY":
      return 24;
    case "ROUTINE_PLANNED":
      return 72;
    default:
      return 24;
  }
}

export function raiseEstateWorkOrder(params: {
  discipline: EstateDiscipline;
  priority: EstatePriority;
  location: string;
  issueTitle: string;
  issueDescription: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
}): EstateWorkOrder {
  const data = loadEstateData();
  const slaHours = computeSLAHours(params.priority);
  const workOrderNumber = `APEX-ESTATE-WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder: EstateWorkOrder = {
    id: `wo-${Date.now()}`,
    workOrderNumber,
    discipline: params.discipline,
    priority: params.priority,
    slaHours,
    location: params.location,
    issueTitle: params.issueTitle,
    issueDescription: params.issueDescription,
    requesterId: params.requesterId,
    requesterName: params.requesterName,
    requesterDepartment: params.requesterDepartment,
    status: "LOGGED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.workOrders.unshift(newOrder);
  saveEstateData(data);
  return newOrder;
}

export function assignEstateEngineer(params: {
  workOrderId: string;
  engineerName: string;
  engineerRole: string;
  estimatedMaterialCost: number;
}): EstateWorkOrder {
  const data = loadEstateData();
  const order = data.workOrders.find((w) => w.id === params.workOrderId);
  if (!order) throw new Error("Work order not found");

  const targetDate = new Date(Date.now() + order.slaHours * 3600 * 1000).toISOString();

  order.status = "ASSIGNED";
  order.assignedEngineer = {
    engineerName: params.engineerName,
    engineerRole: params.engineerRole,
    assignedAt: new Date().toISOString(),
    targetResolutionDate: targetDate,
    estimatedMaterialCost: params.estimatedMaterialCost,
  };
  order.updatedAt = new Date().toISOString();

  saveEstateData(data);
  return order;
}

export function startEstateWork(params: {
  workOrderId: string;
  materialsBOQ: EstateMaterialBOQ[];
}): EstateWorkOrder {
  const data = loadEstateData();
  const order = data.workOrders.find((w) => w.id === params.workOrderId);
  if (!order) throw new Error("Work order not found");

  order.status = "IN_PROGRESS";
  order.materialsBOQ = params.materialsBOQ;
  order.updatedAt = new Date().toISOString();

  saveEstateData(data);
  return order;
}

export function completeEstateWork(params: {
  workOrderId: string;
  actualCost: number;
  engineerNotes: string;
}): EstateWorkOrder {
  const data = loadEstateData();
  const order = data.workOrders.find((w) => w.id === params.workOrderId);
  if (!order) throw new Error("Work order not found");

  const certificateNumber = `APEX-ESTATE-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const sealPayload = `${order.workOrderNumber}:${certificateNumber}:${params.actualCost}:${Date.now()}`;
  const cryptographicSeal = crypto.createHash("sha256").update(sealPayload).digest("hex");

  let stockReconciled = false;
  if (order.materialsBOQ && order.materialsBOQ.length > 0) {
    try {
      inventoryStore.deductConsumables(
        order.materialsBOQ.map((m) => ({ materialName: m.materialName, quantity: m.quantity })),
        `Estate Work Order ${order.workOrderNumber} completion`
      );
      stockReconciled = true;
    } catch (e) {
      console.warn("Estate materials stock deduction notice:", e);
    }
  }

  order.status = "COMPLETED";
  order.completionDetails = {
    completedAt: new Date().toISOString(),
    actualCost: params.actualCost,
    engineerNotes: params.engineerNotes,
    completionCertificateNumber: certificateNumber,
    cryptographicSeal,
    inventoryStockReconciled: stockReconciled,
  };
  order.updatedAt = new Date().toISOString();

  saveEstateData(data);
  return order;
}

export function closeEstateWorkOrder(params: {
  workOrderId: string;
  ratingStars: number;
  satisfactionFeedback: string;
}): EstateWorkOrder {
  const data = loadEstateData();
  const order = data.workOrders.find((w) => w.id === params.workOrderId);
  if (!order) throw new Error("Work order not found");

  order.status = "CLOSED";
  order.userClosureRating = {
    ratingStars: Math.max(1, Math.min(5, params.ratingStars)),
    satisfactionFeedback: params.satisfactionFeedback,
    closedAt: new Date().toISOString(),
  };
  order.updatedAt = new Date().toISOString();

  saveEstateData(data);
  return order;
}

export function logPreventiveMaintenance(params: {
  assetId: string;
  servicedDate: string;
  nextDueDate: string;
  notes: string;
}): EstateAsset {
  const data = loadEstateData();
  const asset = data.assets.find((a) => a.id === params.assetId);
  if (!asset) throw new Error("Estate asset not found");

  asset.lastServicedDate = params.servicedDate;
  asset.nextPreventiveServiceDue = params.nextDueDate;
  asset.status = "OPERATIONAL";

  saveEstateData(data);
  return asset;
}

export function getEstateAnalytics() {
  const data = loadEstateData();
  const totalAssets = data.assets.length;
  const operationalAssets = data.assets.filter((a) => a.status === "OPERATIONAL").length;
  const pendingWorkOrders = data.workOrders.filter(
    (w) => w.status !== "COMPLETED" && w.status !== "CLOSED"
  ).length;
  const criticalOrdersCount = data.workOrders.filter(
    (w) => w.priority === "CRITICAL_EMERGENCY" && w.status !== "CLOSED"
  ).length;

  const closedOrders = data.workOrders.filter((w) => w.userClosureRating);
  const avgSatisfaction = closedOrders.length > 0
    ? (closedOrders.reduce((acc, w) => acc + (w.userClosureRating?.ratingStars || 5), 0) / closedOrders.length).toFixed(1)
    : "5.0";

  return {
    totalAssets,
    operationalAssets,
    assetReliabilityRate: Math.round((operationalAssets / (totalAssets || 1)) * 100),
    pendingWorkOrders,
    criticalOrdersCount,
    averageSatisfactionRating: Number(avgSatisfaction),
    totalOrdersLogged: data.workOrders.length,
  };
}
