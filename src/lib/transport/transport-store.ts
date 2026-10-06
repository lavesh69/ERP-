/**
 * Persistent Data Store for Enterprise Transport & Fleet Operations
 * Stores and manages transit vehicles, routes, student bus passes, and vehicle maintenance logs.
 */

import fs from "fs";
import path from "path";
import {
  TransportVehicle,
  TransportRoute,
  StudentBusPass,
  FleetMaintenanceRecord,
  calculateRouteOccupancy,
  generateBusPassFingerprint,
  checkVehicleComplianceAlerts,
  validateBusPassApplication,
} from "./transport-engine";

const DATA_DIR = path.join(process.cwd(), "data", "transport");
const STORE_FILE = path.join(DATA_DIR, "fleet_operations.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface TransportStoreSchema {
  vehicles: TransportVehicle[];
  routes: TransportRoute[];
  passes: StudentBusPass[];
  maintenance: FleetMaintenanceRecord[];
}

const DEFAULT_VEHICLES: TransportVehicle[] = [
  {
    id: "veh-01",
    registrationNumber: "MA-01-AX-9921",
    vehicleCode: "BUS-01",
    type: "ELECTRIC_BUS",
    capacity: 48,
    currentPassengers: 42,
    fuelType: "ELECTRIC",
    driverName: "Robert Kowalski",
    driverPhone: "+1 (555) 771-0021",
    driverLicense: "CDL-MA-99281A",
    attendantName: "Samira Patel",
    attendantPhone: "+1 (555) 771-0022",
    status: "ACTIVE_EN_ROUTE",
    gpsLat: 42.3601,
    gpsLng: -71.0589,
    speedKmH: 38,
    batteryOrFuelLevel: 82,
    nextFcDate: "2027-05-15",
    insuranceExpiry: "2027-04-20",
    pucExpiry: "2027-08-10",
  },
  {
    id: "veh-02",
    registrationNumber: "MA-01-BX-4482",
    vehicleCode: "BUS-02",
    type: "BUS",
    capacity: 52,
    currentPassengers: 36,
    fuelType: "DIESEL",
    driverName: "Dmitri Volkov",
    driverPhone: "+1 (555) 771-0033",
    driverLicense: "CDL-MA-88192B",
    attendantName: "Carlos Mendez",
    attendantPhone: "+1 (555) 771-0034",
    status: "ON_CAMPUS",
    gpsLat: 42.3505,
    gpsLng: -71.1054,
    speedKmH: 0,
    batteryOrFuelLevel: 65,
    nextFcDate: "2027-03-10",
    insuranceExpiry: "2027-06-12",
    pucExpiry: "2027-02-28",
  },
  {
    id: "veh-03",
    registrationNumber: "MA-01-CX-1029",
    vehicleCode: "VAN-03",
    type: "VAN",
    capacity: 20,
    currentPassengers: 14,
    fuelType: "CNG",
    driverName: "Marcus Vance",
    driverPhone: "+1 (555) 771-0045",
    driverLicense: "CDL-MA-44912C",
    attendantName: "Amina Yusuf",
    attendantPhone: "+1 (555) 771-0046",
    status: "ON_CAMPUS",
    gpsLat: 42.3505,
    gpsLng: -71.1054,
    speedKmH: 0,
    batteryOrFuelLevel: 90,
    nextFcDate: "2027-07-20",
    insuranceExpiry: "2027-08-15",
    pucExpiry: "2027-09-01",
  },
];

const DEFAULT_ROUTES: TransportRoute[] = [
  {
    id: "rt-01",
    routeNumber: "R-01",
    routeName: "North Suburbs Metro Corridor",
    startingPoint: "Somerville Union Square",
    destination: "Main University Campus Gate 1",
    totalDistanceKm: 24.5,
    morningStartTime: "07:15 AM",
    eveningDepartureTime: "05:15 PM",
    assignedVehicleId: "veh-01",
    assignedVehicleCode: "BUS-01",
    assignedDriverName: "Robert Kowalski",
    totalRegisteredStudents: 42,
    stops: [
      { stopName: "Union Square Metro", landmark: "Opposite Market Basket", morningPickupTime: "07:15 AM", eveningDropTime: "06:05 PM", sequenceOrder: 1, distanceKmFromCampus: 24.5 },
      { stopName: "Porter Square T-Station", landmark: "Commuter Rail Entrance", morningPickupTime: "07:30 AM", eveningDropTime: "05:50 PM", sequenceOrder: 2, distanceKmFromCampus: 18.2 },
      { stopName: "Harvard North Gate", landmark: "Science Center Plaza", morningPickupTime: "07:45 AM", eveningDropTime: "05:35 PM", sequenceOrder: 3, distanceKmFromCampus: 12.0 },
      { stopName: "Kendall Square Tech Hub", landmark: "Main Street Crossing", morningPickupTime: "08:00 AM", eveningDropTime: "05:25 PM", sequenceOrder: 4, distanceKmFromCampus: 6.5 },
      { stopName: "University Campus Central", landmark: "Academic Quadrangle", morningPickupTime: "08:20 AM", eveningDropTime: "05:15 PM", sequenceOrder: 5, distanceKmFromCampus: 0 },
    ],
  },
  {
    id: "rt-02",
    routeNumber: "R-02",
    routeName: "South Shore Coastal Express",
    startingPoint: "Quincy Adams Depot",
    destination: "Main University Campus Gate 2",
    totalDistanceKm: 31.0,
    morningStartTime: "07:00 AM",
    eveningDepartureTime: "05:30 PM",
    assignedVehicleId: "veh-02",
    assignedVehicleCode: "BUS-02",
    assignedDriverName: "Dmitri Volkov",
    totalRegisteredStudents: 36,
    stops: [
      { stopName: "Quincy Adams Transit", landmark: "Parking Garage Level 1", morningPickupTime: "07:00 AM", eveningDropTime: "06:20 PM", sequenceOrder: 1, distanceKmFromCampus: 31.0 },
      { stopName: "Neponset Circle", landmark: "Riverway Gas Station", morningPickupTime: "07:20 AM", eveningDropTime: "06:00 PM", sequenceOrder: 2, distanceKmFromCampus: 22.4 },
      { stopName: "Dorchester JFK Station", landmark: "Red Line Terminal", morningPickupTime: "07:40 AM", eveningDropTime: "05:45 PM", sequenceOrder: 3, distanceKmFromCampus: 14.2 },
      { stopName: "University Campus Central", landmark: "Gate 2 Transit Pavilion", morningPickupTime: "08:15 AM", eveningDropTime: "05:30 PM", sequenceOrder: 4, distanceKmFromCampus: 0 },
    ],
  },
];

const DEFAULT_PASSES: StudentBusPass[] = [
  {
    id: "pass-001",
    passNumber: "BP-2026-8801",
    studentId: "stu-alex-01",
    studentName: "Alex Mercer",
    studentRoll: "CS2026-001",
    routeId: "rt-01",
    routeNumber: "R-01",
    stopName: "Porter Square T-Station",
    academicYear: "2026-2027",
    validUntil: "2027-05-31",
    status: "ACTIVE",
    feeAmount: 450,
    feeStatus: "PAID",
    qrCodeFingerprint: generateBusPassFingerprint("CS2026-001", "R-01", "2027-05-31"),
    issuedAt: "2026-08-15T10:00:00.000Z",
  },
  {
    id: "pass-002",
    passNumber: "BP-2026-8802",
    studentId: "stu-priya-03",
    studentName: "Priya Sharma",
    studentRoll: "CS2026-018",
    routeId: "rt-02",
    routeNumber: "R-02",
    stopName: "Dorchester JFK Station",
    academicYear: "2026-2027",
    validUntil: "2027-05-31",
    status: "ACTIVE",
    feeAmount: 450,
    feeStatus: "PAID",
    qrCodeFingerprint: generateBusPassFingerprint("CS2026-018", "R-02", "2027-05-31"),
    issuedAt: "2026-08-16T11:20:00.000Z",
  },
];

const DEFAULT_MAINTENANCE: FleetMaintenanceRecord[] = [
  {
    id: "maint-01",
    vehicleId: "veh-01",
    vehicleCode: "BUS-01",
    serviceType: "EV High-Voltage Inverter & Brake Pad Inspection",
    date: "2026-09-12",
    odometerKm: 34200,
    cost: 720,
    workshopName: "Apex EcoTransit OEM Service Center",
    notes: "Regenerative braking calibration performed. Battery health 98.4%.",
  },
  {
    id: "maint-02",
    vehicleId: "veh-02",
    vehicleCode: "BUS-02",
    serviceType: "Engine Oil Flush, Filter Replacement & Speed Governor Check",
    date: "2026-08-28",
    odometerKm: 61850,
    cost: 540,
    workshopName: "State Certified Diesel Works",
    notes: "Mandatory speed governor checked at 60 km/h limit. All parameters green.",
  },
];

function readStore(): TransportStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: TransportStoreSchema = {
      vehicles: DEFAULT_VEHICLES,
      routes: DEFAULT_ROUTES,
      passes: DEFAULT_PASSES,
      maintenance: DEFAULT_MAINTENANCE,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading transport store, using defaults", err);
    return {
      vehicles: DEFAULT_VEHICLES,
      routes: DEFAULT_ROUTES,
      passes: DEFAULT_PASSES,
      maintenance: DEFAULT_MAINTENANCE,
    };
  }
}

function writeStore(data: TransportStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const transportStore = {
  getSummary() {
    const store = readStore();
    const totalFleet = store.vehicles.length;
    const activeEnRoute = store.vehicles.filter((v) => v.status === "ACTIVE_EN_ROUTE").length;
    const totalCapacity = store.vehicles.reduce((acc, v) => acc + v.capacity, 0);
    const totalPassengers = store.vehicles.reduce((acc, v) => acc + v.currentPassengers, 0);
    const activePasses = store.passes.filter((p) => p.status === "ACTIVE").length;

    return {
      totalVehicles: totalFleet,
      activeEnRoute,
      onCampus: store.vehicles.filter((v) => v.status === "ON_CAMPUS").length,
      totalRoutes: store.routes.length,
      totalCapacity,
      currentPassengers: totalPassengers,
      fleetOccupancyRate: totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 1000) / 10 : 0,
      activeBusPasses: activePasses,
      vehicles: store.vehicles.map((v) => ({
        ...v,
        compliance: checkVehicleComplianceAlerts(v),
      })),
    };
  },

  getRoutes() {
    const store = readStore();
    return store.routes.map((rt) => {
      const veh = store.vehicles.find((v) => v.id === rt.assignedVehicleId);
      const capacity = veh ? veh.capacity : 50;
      return {
        ...rt,
        occupancy: calculateRouteOccupancy(capacity, rt.totalRegisteredStudents),
      };
    });
  },

  getPasses() {
    return readStore().passes;
  },

  getMaintenance() {
    return readStore().maintenance;
  },

  issueBusPass(params: {
    studentId: string;
    studentName: string;
    studentRoll: string;
    routeId: string;
    stopName: string;
    feeAmount?: number;
  }) {
    const store = readStore();
    const route = store.routes.find((r) => r.id === params.routeId);
    if (!route) throw new Error("Target route not found.");

    const validUntil = "2027-05-31";
    const fingerprint = generateBusPassFingerprint(params.studentRoll, route.routeNumber, validUntil);

    const newPass: StudentBusPass = {
      id: `pass-${Date.now()}`,
      passNumber: `BP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId: params.studentId,
      studentName: params.studentName,
      studentRoll: params.studentRoll,
      routeId: route.id,
      routeNumber: route.routeNumber,
      stopName: params.stopName,
      academicYear: "2026-2027",
      validUntil,
      status: "ACTIVE",
      feeAmount: params.feeAmount || 450,
      feeStatus: "PAID",
      qrCodeFingerprint: fingerprint,
      issuedAt: new Date().toISOString(),
    };

    route.totalRegisteredStudents += 1;
    store.passes.unshift(newPass);
    writeStore(store);

    return newPass;
  },

  updateVehicleTelemetry(
    vehicleId: string,
    updates: Partial<Pick<TransportVehicle, "status" | "speedKmH" | "gpsLat" | "gpsLng" | "batteryOrFuelLevel" | "currentPassengers">>
  ) {
    const store = readStore();
    const veh = store.vehicles.find((v) => v.id === vehicleId);
    if (!veh) throw new Error("Vehicle not found.");

    Object.assign(veh, updates);
    writeStore(store);
    return veh;
  },

  addMaintenanceRecord(record: Omit<FleetMaintenanceRecord, "id">) {
    const store = readStore();
    const newRecord: FleetMaintenanceRecord = {
      id: `maint-${Date.now()}`,
      ...record,
    };
    store.maintenance.unshift(newRecord);
    writeStore(store);
    return newRecord;
  },
};
