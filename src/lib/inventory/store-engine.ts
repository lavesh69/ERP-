import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoreItem {
  id: string;
  code: string;
  name: string;
  category: "EXAM_STATIONERY" | "ACADEMIC_CONSUMABLES" | "OFFICE_SUPPLIES" | "LAB_CHEMICALS";
  unitOfMeasurement: "BOOKLETS" | "SHEETS" | "BOXES" | "REAMS" | "UNITS" | "KITS";
  quantityOnHand: number;
  reorderThreshold: number;
  unitCost: number;
  securityControlled: boolean;
  specifications: string;
}

export interface IndentLineItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  requestedQuantity: number;
  dispatchedQuantity?: number;
  barcodeRangeStart?: string;
  barcodeRangeEnd?: string;
}

export interface StoreIndent {
  id: string;
  indentNumber: string;
  department: string;
  indentorId: string;
  indentorName: string;
  indentorRole: string;
  purpose: string;
  examSessionCode?: string;
  items: IndentLineItem[];
  status: "SUBMITTED" | "HOD_APPROVED" | "DISPATCHED" | "FULFILLED" | "REJECTED";
  hodApproval?: {
    approvedBy: string;
    approvedAt: string;
    remarks: string;
  };
  dispatchVoucher?: {
    voucherNumber: string;
    dispatchedBy: string;
    dispatchedAt: string;
    cryptographicSeal: string;
    gatePassNumber: string;
  };
  fulfillmentAcknowledgement?: {
    receivedBy: string;
    receivedAt: string;
    remarks: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface StoreStockMovement {
  id: string;
  itemId: string;
  itemCode: string;
  transactionType: "INDENT_ISSUE" | "STOCK_RECEIPT" | "SCRAP_ADJUSTMENT";
  quantity: number;
  balanceAfter: number;
  referenceDoc: string;
  timestamp: string;
}

export interface StoreDataPayload {
  items: StoreItem[];
  indents: StoreIndent[];
  movements: StoreStockMovement[];
}

const DATA_FILE = path.join(process.cwd(), "data", "inventory", "store_operations.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

const DEFAULT_STORE_ITEMS: StoreItem[] = [
  {
    id: "item-bklt-32",
    code: "BKLT-32",
    name: "Main 32-Page Barcoded Exam Answer Booklet",
    category: "EXAM_STATIONERY",
    unitOfMeasurement: "BOOKLETS",
    quantityOnHand: 45000,
    reorderThreshold: 10000,
    unitCost: 18.5,
    securityControlled: true,
    specifications: "Thread-sewn, 70 GSM security watermark, 2D QR and Code128 encrypted sequential serial number.",
  },
  {
    id: "item-bklt-08",
    code: "BKLT-08",
    name: "8-Page Supplementary Answer Sheet",
    category: "EXAM_STATIONERY",
    unitOfMeasurement: "SHEETS",
    quantityOnHand: 28000,
    reorderThreshold: 5000,
    unitCost: 6.2,
    securityControlled: true,
    specifications: "Pre-punched, sequential micro-perforation with holographic stripe.",
  },
  {
    id: "item-graph-a4",
    code: "GRAPH-A4",
    name: "Standard 2mm Linear & Semi-Log Graph Paper",
    category: "EXAM_STATIONERY",
    unitOfMeasurement: "SHEETS",
    quantityOnHand: 15000,
    reorderThreshold: 3000,
    unitCost: 1.5,
    securityControlled: false,
    specifications: "High-contrast green grid, 80 GSM maplitho paper, approved for University Engineering Exams.",
  },
  {
    id: "item-draw-a3",
    code: "DRAW-A3",
    name: "A3 Engineering Cartridge Drawing Sheets",
    category: "EXAM_STATIONERY",
    unitOfMeasurement: "SHEETS",
    quantityOnHand: 4200,
    reorderThreshold: 1000,
    unitCost: 8.0,
    securityControlled: false,
    specifications: "140 GSM acid-free cartridge paper with standard institutional title block.",
  },
  {
    id: "item-mark-reg",
    code: "MARK-REG",
    name: "Continuous Assessment & Attendance Ledger (Hardbound)",
    category: "ACADEMIC_CONSUMABLES",
    unitOfMeasurement: "UNITS",
    quantityOnHand: 480,
    reorderThreshold: 100,
    unitCost: 120.0,
    securityControlled: false,
    specifications: "120-page cloth-bound, 60 scholars x 40 lectures capacity.",
  },
  {
    id: "item-wbm-box",
    code: "WBM-BOX",
    name: "Dry-Erase Whiteboard Marker Pack (4 Assorted Colors)",
    category: "ACADEMIC_CONSUMABLES",
    unitOfMeasurement: "BOXES",
    quantityOnHand: 320,
    reorderThreshold: 50,
    unitCost: 95.0,
    securityControlled: false,
    specifications: "Low-odor, xylene-free ink, bullet tip (2mm line width).",
  },
  {
    id: "item-paper-a4",
    code: "PAPER-A4",
    name: "A4 75 GSM High-Speed Copier Paper (5 Reams/Carton)",
    category: "OFFICE_SUPPLIES",
    unitOfMeasurement: "REAMS",
    quantityOnHand: 550,
    reorderThreshold: 100,
    unitCost: 240.0,
    securityControlled: false,
    specifications: "98% brightness, jam-free for high-volume syllabus printing.",
  },
  {
    id: "item-chem-reag",
    code: "CHEM-REAG",
    name: "Analytical Grade General Chemistry Lab Reagents Kit",
    category: "LAB_CHEMICALS",
    unitOfMeasurement: "KITS",
    quantityOnHand: 35,
    reorderThreshold: 10,
    unitCost: 4500.0,
    securityControlled: true,
    specifications: "ISO certified titration salts, buffer solutions, and concentrated acids.",
  },
];

const DEFAULT_INDENTS: StoreIndent[] = [
  {
    id: "indent-2026-001",
    indentNumber: "APEX-INDENT-2026-1001",
    department: "Examination Cell & Evaluation Center",
    indentorId: "coe-officer-01",
    indentorName: "Dr. Ramanathan Swamy",
    indentorRole: "Controller of Examinations",
    purpose: "End-Semester Theory Examinations (Nov-Dec 2026 Session)",
    examSessionCode: "WINTER-2026-UG",
    items: [
      {
        itemId: "item-bklt-32",
        itemCode: "BKLT-32",
        itemName: "Main 32-Page Barcoded Exam Answer Booklet",
        requestedQuantity: 5000,
        dispatchedQuantity: 5000,
        barcodeRangeStart: "BKLT-2026-100001",
        barcodeRangeEnd: "BKLT-2026-105000",
      },
      {
        itemId: "item-bklt-08",
        itemCode: "BKLT-08",
        itemName: "8-Page Supplementary Answer Sheet",
        requestedQuantity: 2000,
        dispatchedQuantity: 2000,
        barcodeRangeStart: "SUPP-2026-050001",
        barcodeRangeEnd: "SUPP-2026-052000",
      },
    ],
    status: "DISPATCHED",
    hodApproval: {
      approvedBy: "Prof. S. R. Iyengar (Dean Academic Affairs)",
      approvedAt: "2026-10-14T09:30:00.000Z",
      remarks: "Approved as per certified examination candidate roll strength.",
    },
    dispatchVoucher: {
      voucherNumber: "APEX-INDENT-DISP-2026-8801",
      dispatchedBy: "Mr. B. K. Joshi (Chief Storekeeper)",
      dispatchedAt: "2026-10-14T11:45:00.000Z",
      cryptographicSeal: "e9b2a758f12c4b0c9a778e34215f79b6d81234a5c6e7f8a9b0c1d2e3f4a5b6c7",
      gatePassNumber: "STORE-GP-2026-4421",
    },
    createdAt: "2026-10-14T08:00:00.000Z",
    updatedAt: "2026-10-14T11:45:00.000Z",
  },
  {
    id: "indent-2026-002",
    indentNumber: "APEX-INDENT-2026-1002",
    department: "Department of Computer Science & Engineering",
    indentorId: "fac-cse-01",
    indentorName: "Dr. Alan Turing",
    indentorRole: "Head of Department",
    purpose: "Continuous Assessment Lab Journals and Markers for Semester 3 & 5",
    items: [
      {
        itemId: "item-mark-reg",
        itemCode: "MARK-REG",
        itemName: "Continuous Assessment & Attendance Ledger (Hardbound)",
        requestedQuantity: 25,
      },
      {
        itemId: "item-wbm-box",
        itemCode: "WBM-BOX",
        itemName: "Dry-Erase Whiteboard Marker Pack (4 Assorted Colors)",
        requestedQuantity: 15,
      },
    ],
    status: "HOD_APPROVED",
    hodApproval: {
      approvedBy: "Dr. Alan Turing (HOD CSE)",
      approvedAt: "2026-10-15T08:15:00.000Z",
      remarks: "Urgent replenishment for programming labs.",
    },
    createdAt: "2026-10-15T07:45:00.000Z",
    updatedAt: "2026-10-15T08:15:00.000Z",
  },
];

const DEFAULT_MOVEMENTS: StoreStockMovement[] = [
  {
    id: "mov-01",
    itemId: "item-bklt-32",
    itemCode: "BKLT-32",
    transactionType: "INDENT_ISSUE",
    quantity: 5000,
    balanceAfter: 45000,
    referenceDoc: "APEX-INDENT-DISP-2026-8801",
    timestamp: "2026-10-14T11:45:00.000Z",
  },
  {
    id: "mov-02",
    itemId: "item-bklt-08",
    itemCode: "BKLT-08",
    transactionType: "INDENT_ISSUE",
    quantity: 2000,
    balanceAfter: 28000,
    referenceDoc: "APEX-INDENT-DISP-2026-8801",
    timestamp: "2026-10-14T11:45:00.000Z",
  },
];

export function loadStoreData(): StoreDataPayload {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load store data, using defaults:", err);
  }

  const initialData: StoreDataPayload = {
    items: DEFAULT_STORE_ITEMS,
    indents: DEFAULT_INDENTS,
    movements: DEFAULT_MOVEMENTS,
  };
  saveStoreData(initialData);
  return initialData;
}

export function saveStoreData(data: StoreDataPayload): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save store data:", err);
  }
}

export function createStoreIndent(params: {
  department: string;
  indentorId: string;
  indentorName: string;
  indentorRole: string;
  purpose: string;
  examSessionCode?: string;
  items: Array<{
    itemId: string;
    requestedQuantity: number;
  }>;
}): StoreIndent {
  const data = loadStoreData();

  const lineItems: IndentLineItem[] = params.items.map((itemReq) => {
    const matched = data.items.find((i) => i.id === itemReq.itemId);
    if (!matched) throw new Error(`Store item with ID ${itemReq.itemId} not found`);
    return {
      itemId: matched.id,
      itemCode: matched.code,
      itemName: matched.name,
      requestedQuantity: Number(itemReq.requestedQuantity) || 1,
    };
  });

  const indentNumber = `APEX-INDENT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newIndent: StoreIndent = {
    id: `indent-${Date.now()}`,
    indentNumber,
    department: params.department,
    indentorId: params.indentorId,
    indentorName: params.indentorName,
    indentorRole: params.indentorRole,
    purpose: params.purpose,
    examSessionCode: params.examSessionCode,
    items: lineItems,
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.indents.unshift(newIndent);
  saveStoreData(data);
  return newIndent;
}

export function approveStoreIndentHOD(params: {
  indentId: string;
  approvedBy: string;
  remarks: string;
}): StoreIndent {
  const data = loadStoreData();
  const indent = data.indents.find((i) => i.id === params.indentId);
  if (!indent) throw new Error("Indent requisition not found");

  indent.status = "HOD_APPROVED";
  indent.hodApproval = {
    approvedBy: params.approvedBy,
    approvedAt: new Date().toISOString(),
    remarks: params.remarks,
  };
  indent.updatedAt = new Date().toISOString();

  saveStoreData(data);
  return indent;
}

export function dispatchStoreIndent(params: {
  indentId: string;
  dispatchedBy: string;
  dispatches: Array<{
    itemId: string;
    dispatchedQuantity: number;
    barcodeRangeStart?: string;
    barcodeRangeEnd?: string;
  }>;
}): StoreIndent {
  const data = loadStoreData();
  const indent = data.indents.find((i) => i.id === params.indentId);
  if (!indent) throw new Error("Indent requisition not found");

  const voucherNumber = `APEX-INDENT-DISP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const gatePassNumber = `STORE-GP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Update line items and deduct stock
  for (const disp of params.dispatches) {
    const lineItem = indent.items.find((i) => i.itemId === disp.itemId);
    const storeItem = data.items.find((i) => i.id === disp.itemId);

    if (lineItem && storeItem) {
      lineItem.dispatchedQuantity = disp.dispatchedQuantity;
      lineItem.barcodeRangeStart = disp.barcodeRangeStart;
      lineItem.barcodeRangeEnd = disp.barcodeRangeEnd;

      // Deduct from stock
      storeItem.quantityOnHand = Math.max(0, storeItem.quantityOnHand - disp.dispatchedQuantity);

      // Log movement
      data.movements.unshift({
        id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: storeItem.id,
        itemCode: storeItem.code,
        transactionType: "INDENT_ISSUE",
        quantity: disp.dispatchedQuantity,
        balanceAfter: storeItem.quantityOnHand,
        referenceDoc: voucherNumber,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const sealPayload = `${voucherNumber}:${indent.indentNumber}:${params.dispatchedBy}:${Date.now()}`;
  const cryptographicSeal = crypto.createHash("sha256").update(sealPayload).digest("hex");

  indent.status = "DISPATCHED";
  indent.dispatchVoucher = {
    voucherNumber,
    dispatchedBy: params.dispatchedBy,
    dispatchedAt: new Date().toISOString(),
    cryptographicSeal,
    gatePassNumber,
  };
  indent.updatedAt = new Date().toISOString();

  saveStoreData(data);
  return indent;
}

export function acknowledgeIndentReceipt(params: {
  indentId: string;
  receivedBy: string;
  remarks: string;
}): StoreIndent {
  const data = loadStoreData();
  const indent = data.indents.find((i) => i.id === params.indentId);
  if (!indent) throw new Error("Indent requisition not found");

  indent.status = "FULFILLED";
  indent.fulfillmentAcknowledgement = {
    receivedBy: params.receivedBy,
    receivedAt: new Date().toISOString(),
    remarks: params.remarks,
  };
  indent.updatedAt = new Date().toISOString();

  saveStoreData(data);
  return indent;
}

export function receiveStockOrder(params: {
  itemId: string;
  receivedQuantity: number;
  poReference: string;
}): StoreItem {
  const data = loadStoreData();
  const item = data.items.find((i) => i.id === params.itemId);
  if (!item) throw new Error("Store item not found");

  item.quantityOnHand += params.receivedQuantity;

  data.movements.unshift({
    id: `mov-${Date.now()}`,
    itemId: item.id,
    itemCode: item.code,
    transactionType: "STOCK_RECEIPT",
    quantity: params.receivedQuantity,
    balanceAfter: item.quantityOnHand,
    referenceDoc: params.poReference,
    timestamp: new Date().toISOString(),
  });

  saveStoreData(data);
  return item;
}

export function getStoreAnalytics() {
  const data = loadStoreData();
  const totalItemCategories = data.items.length;
  const totalBookletsOnHand = data.items
    .filter((i) => i.code.startsWith("BKLT"))
    .reduce((acc, i) => acc + i.quantityOnHand, 0);

  const lowStockAlerts = data.items.filter((i) => i.quantityOnHand <= i.reorderThreshold);
  const totalInventoryValuation = Math.round(
    data.items.reduce((acc, i) => acc + i.quantityOnHand * i.unitCost, 0)
  );

  const totalIndentsProcessed = data.indents.length;
  const pendingIndents = data.indents.filter(
    (i) => i.status === "SUBMITTED" || i.status === "HOD_APPROVED"
  ).length;

  return {
    totalItemCategories,
    totalBookletsOnHand,
    lowStockAlertsCount: lowStockAlerts.length,
    lowStockItems: lowStockAlerts.map((i) => ({ code: i.code, name: i.name, onHand: i.quantityOnHand, reorder: i.reorderThreshold })),
    totalInventoryValuation,
    totalIndentsProcessed,
    pendingIndents,
  };
}
