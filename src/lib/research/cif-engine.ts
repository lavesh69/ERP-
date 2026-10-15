import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface CIFInstrument {
  id: string;
  code: string;
  name: string;
  makeModel: string;
  specifications: string;
  category: "MICROSCOPY" | "SPECTROSCOPY" | "DIFFRACTION" | "CHROMATOGRAPHY" | "SURFACE_ANALYSIS";
  facilityLocation: string;
  technicianInCharge: string;
  technicianContact: string;
  status: "OPERATIONAL" | "UNDER_CALIBRATION" | "BREAKDOWN_MAINTENANCE";
  rates: {
    internalScholarPerHour: number;
    facultyGrantPerHour: number;
    externalAcademicPerHour: number;
    industryRndPerHour: number;
    samplePrepCharge: number;
  };
  totalBeamHoursLogged: number;
  totalSamplesAnalyzed: number;
  lastCalibrationDate: string;
  nextCalibrationDueDate: string;
}

export type CIFUserCategory = "INTERNAL_SCHOLAR" | "FACULTY_GRANT" | "EXTERNAL_ACADEMIC" | "INDUSTRY_RND";
export type CIFSampleState = "SOLID_POWDER" | "THIN_FILM" | "LIQUID_SOLUTION" | "BIOLOGICAL_CELLS" | "NANO_PARTICLES";
export type CIFHazardLevel = "NON_HAZARDOUS" | "FLAMMABLE" | "TOXIC" | "CORROSIVE" | "RADIOACTIVE_EXEMPT";

export interface CIFSlotBooking {
  id: string;
  bookingRef: string;
  instrumentId: string;
  instrumentName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCategory: CIFUserCategory;
  departmentOrOrg: string;
  grantCode?: string;
  supervisorName?: string;
  bookingDate: string;
  timeSlot: "MORNING_0930_1300" | "AFTERNOON_1400_1730" | "FULL_DAY_0930_1730";
  estimatedHours: number;
  sampleCount: number;
  sampleState: CIFSampleState;
  hazardLevel: CIFHazardLevel;
  safetyDeclarationAccepted: boolean;
  samplePrepRequired: boolean;
  samplePrepDetails?: string;
  calculatedTariff: number;
  status: "SUBMITTED" | "SAFETY_CLEARED" | "SLOT_CONFIRMED" | "IN_ANALYSIS" | "COMPLETED" | "CANCELLED";
  slotToken?: string;
  safetyOfficerApproval?: {
    approvedBy: string;
    clearedAt: string;
    remarks: string;
  };
  assignedOperator?: string;
  completionData?: {
    beamHoursUsed: number;
    completedAt: string;
    operatorSignature: string;
    dataFileUrls: string[];
    cryptographicSeal: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CIFCalibrationLog {
  id: string;
  instrumentId: string;
  instrumentCode: string;
  calibrationType: "ROUTINE_PREVENTATIVE" | "OEM_ANNUAL" | "NABL_TRACEABLE" | "BREAKDOWN_REPAIR";
  calibrationAgency: string;
  technicianName: string;
  calibrationDate: string;
  calibrationValidUntil: string;
  status: "PASSED" | "PASSED_WITH_CORRECTION" | "REPLACEMENT_RECOMMENDED";
  certificateNumber: string;
  notes: string;
}

const DATA_FILE = path.join(process.cwd(), "data", "research", "cif_operations.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

const DEFAULT_INSTRUMENTS: CIFInstrument[] = [
  {
    id: "INST-CIF-SEM",
    code: "FESEM-01",
    name: "Field Emission Scanning Electron Microscope",
    makeModel: "Carl Zeiss GeminiSEM 500 (Resolution 0.6 nm)",
    specifications: "In-lens secondary & backscattered electron detectors, STEM detector, Oxford EDS microanalysis system, 0.02 - 30 kV acceleration.",
    category: "MICROSCOPY",
    facilityLocation: "Central Instrumentation Facility, Ground Floor Lab G-04",
    technicianInCharge: "Dr. Rajesh Sharma (Sr. Scientific Officer)",
    technicianContact: "cif.sem@apex.edu | Ext: 4104",
    status: "OPERATIONAL",
    rates: {
      internalScholarPerHour: 400,
      facultyGrantPerHour: 800,
      externalAcademicPerHour: 1800,
      industryRndPerHour: 5000,
      samplePrepCharge: 250,
    },
    totalBeamHoursLogged: 1240,
    totalSamplesAnalyzed: 865,
    lastCalibrationDate: "2026-09-10",
    nextCalibrationDueDate: "2026-12-10",
  },
  {
    id: "INST-CIF-NMR",
    code: "NMR-500",
    name: "500 MHz Multinuclear FT-NMR Spectrometer",
    makeModel: "Bruker Avance NEO 500 (11.74 Tesla Superconducting Magnet)",
    specifications: "Direct detection BBO probe, 1H/13C/19F/31P multinuclear capability, variable temperature controller (-40C to +150C).",
    category: "SPECTROSCOPY",
    facilityLocation: "CIF Vibration-Isolated Annex, Basement Lab B-01",
    technicianInCharge: "Dr. S. Ananth (Scientific Officer)",
    technicianContact: "cif.nmr@apex.edu | Ext: 4101",
    status: "OPERATIONAL",
    rates: {
      internalScholarPerHour: 350,
      facultyGrantPerHour: 700,
      externalAcademicPerHour: 1600,
      industryRndPerHour: 4500,
      samplePrepCharge: 150,
    },
    totalBeamHoursLogged: 1890,
    totalSamplesAnalyzed: 2410,
    lastCalibrationDate: "2026-08-15",
    nextCalibrationDueDate: "2026-11-15",
  },
  {
    id: "INST-CIF-XRD",
    code: "PXRD-01",
    name: "High-Resolution Powder X-Ray Diffractometer",
    makeModel: "Malvern Panalytical Empyrean (Theta-Theta Gonio)",
    specifications: "Pre-aligned Cu-LFF X-ray tube, PIXcel3D detector, Anton Paar non-ambient temperature chamber (-100C to 450C).",
    category: "DIFFRACTION",
    facilityLocation: "CIF First Floor Material Characterization Wing, Lab 102",
    technicianInCharge: "Er. Kavita Verma (Technical Officer)",
    technicianContact: "cif.xrd@apex.edu | Ext: 4102",
    status: "OPERATIONAL",
    rates: {
      internalScholarPerHour: 300,
      facultyGrantPerHour: 600,
      externalAcademicPerHour: 1500,
      industryRndPerHour: 4000,
      samplePrepCharge: 100,
    },
    totalBeamHoursLogged: 1420,
    totalSamplesAnalyzed: 1980,
    lastCalibrationDate: "2026-09-01",
    nextCalibrationDueDate: "2026-12-01",
  },
  {
    id: "INST-CIF-HRMS",
    code: "LCMS-QTOF",
    name: "High Resolution LC-MS/MS Orbitrap System",
    makeModel: "Thermo Fisher Scientific Q Exactive Focus",
    specifications: "Heated Electrospray Ionization (HESI-II), resolution up to 70,000 FWHM, mass range 50-6000 m/z, Vanquish UHPLC.",
    category: "CHROMATOGRAPHY",
    facilityLocation: "CIF Clean Room Wing, Second Floor Lab 205",
    technicianInCharge: "Dr. Manas Sen (Senior Research Scientist)",
    technicianContact: "cif.hrms@apex.edu | Ext: 4205",
    status: "OPERATIONAL",
    rates: {
      internalScholarPerHour: 500,
      facultyGrantPerHour: 1000,
      externalAcademicPerHour: 2500,
      industryRndPerHour: 6500,
      samplePrepCharge: 300,
    },
    totalBeamHoursLogged: 980,
    totalSamplesAnalyzed: 740,
    lastCalibrationDate: "2026-07-20",
    nextCalibrationDueDate: "2026-10-20",
  },
  {
    id: "INST-CIF-AFM",
    code: "AFM-01",
    name: "Atomic Force Microscope & Nanomechanical Profiler",
    makeModel: "Bruker Dimension Icon (ScanAsyst Mode)",
    specifications: "Nanometer resolution topography, Kelvin Probe Force Microscopy (KPFM), conductive AFM, PeakForce QNM mechanical mapping.",
    category: "SURFACE_ANALYSIS",
    facilityLocation: "CIF Surface Science Lab G-07",
    technicianInCharge: "Dr. Rajesh Sharma (Sr. Scientific Officer)",
    technicianContact: "cif.afm@apex.edu | Ext: 4107",
    status: "UNDER_CALIBRATION",
    rates: {
      internalScholarPerHour: 450,
      facultyGrantPerHour: 900,
      externalAcademicPerHour: 2000,
      industryRndPerHour: 5500,
      samplePrepCharge: 200,
    },
    totalBeamHoursLogged: 810,
    totalSamplesAnalyzed: 512,
    lastCalibrationDate: "2026-06-15",
    nextCalibrationDueDate: "2026-10-15",
  },
];

const DEFAULT_BOOKINGS: CIFSlotBooking[] = [
  {
    id: "cif-book-01",
    bookingRef: "APEX-CIF-REQ-2026-0012",
    instrumentId: "INST-CIF-SEM",
    instrumentName: "Field Emission Scanning Electron Microscope",
    userId: "scholar-phd-401",
    userName: "Ananya Ghosh",
    userEmail: "ananya.ghosh@res.apex.edu",
    userCategory: "INTERNAL_SCHOLAR",
    departmentOrOrg: "Department of Materials Science & Nanotechnology",
    supervisorName: "Prof. Arvind Trivedi",
    bookingDate: "2026-10-22",
    timeSlot: "MORNING_0930_1300",
    estimatedHours: 3.5,
    sampleCount: 4,
    sampleState: "SOLID_POWDER",
    hazardLevel: "NON_HAZARDOUS",
    safetyDeclarationAccepted: true,
    samplePrepRequired: true,
    samplePrepDetails: "Gold sputter coating 5nm required for non-conducting ceramic pellets.",
    calculatedTariff: 2400, // 3.5 hr * 400 = 1400 + 4*250 = 2400
    status: "SLOT_CONFIRMED",
    slotToken: "APEX-CIF-SLOT-2026-8812",
    safetyOfficerApproval: {
      approvedBy: "CIF Chemical Safety Board",
      clearedAt: "2026-10-14T10:00:00.000Z",
      remarks: "Sample MSDS verified. Non-toxic ceramic composite approved for secondary electron imaging.",
    },
    assignedOperator: "Dr. Rajesh Sharma",
    createdAt: "2026-10-14T09:15:00.000Z",
    updatedAt: "2026-10-14T10:00:00.000Z",
  },
  {
    id: "cif-book-02",
    bookingRef: "APEX-CIF-REQ-2026-0014",
    instrumentId: "INST-CIF-NMR",
    instrumentName: "500 MHz Multinuclear FT-NMR Spectrometer",
    userId: "faculty-chem-102",
    userName: "Dr. Priya Nair",
    userEmail: "priya.nair@apex.edu",
    userCategory: "FACULTY_GRANT",
    departmentOrOrg: "Department of Chemical Sciences",
    grantCode: "DST-SERB-CRG-2025-00412",
    bookingDate: "2026-10-25",
    timeSlot: "AFTERNOON_1400_1730",
    estimatedHours: 3.5,
    sampleCount: 3,
    sampleState: "LIQUID_SOLUTION",
    hazardLevel: "NON_HAZARDOUS",
    safetyDeclarationAccepted: true,
    samplePrepRequired: false,
    calculatedTariff: 2450, // 3.5 hr * 700 = 2450
    status: "SAFETY_CLEARED",
    safetyOfficerApproval: {
      approvedBy: "CIF Chemical Safety Board",
      clearedAt: "2026-10-15T08:00:00.000Z",
      remarks: "Deuterated chloroform solution checked. No paramagnetic impurities.",
    },
    createdAt: "2026-10-15T07:30:00.000Z",
    updatedAt: "2026-10-15T08:00:00.000Z",
  },
];

const DEFAULT_CALIBRATIONS: CIFCalibrationLog[] = [
  {
    id: "cal-sem-2026-01",
    instrumentId: "INST-CIF-SEM",
    instrumentCode: "FESEM-01",
    calibrationType: "NABL_TRACEABLE",
    calibrationAgency: "Zeiss India Precision Calibration Services",
    technicianName: "Mr. M. Joseph (Certified Metrology Engineer)",
    calibrationDate: "2026-09-10",
    calibrationValidUntil: "2026-12-10",
    status: "PASSED",
    certificateNumber: "NABL-CAL-ZEISS-2026-784",
    notes: "Magnification calibration verified using standard silicon test grid (10um pitch). Electron beam alignment within 0.1% tolerance.",
  },
];

export interface CIFDataPayload {
  instruments: CIFInstrument[];
  bookings: CIFSlotBooking[];
  calibrations: CIFCalibrationLog[];
}

export function loadCIFData(): CIFDataPayload {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load CIF data, using defaults:", err);
  }

  const initialData: CIFDataPayload = {
    instruments: DEFAULT_INSTRUMENTS,
    bookings: DEFAULT_BOOKINGS,
    calibrations: DEFAULT_CALIBRATIONS,
  };
  saveCIFData(initialData);
  return initialData;
}

export function saveCIFData(data: CIFDataPayload): void {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save CIF data:", err);
  }
}

export function calculateTariff(
  instrument: CIFInstrument,
  userCategory: CIFUserCategory,
  hours: number,
  sampleCount: number,
  samplePrep: boolean
): number {
  let hourlyRate = instrument.rates.internalScholarPerHour;
  if (userCategory === "FACULTY_GRANT") hourlyRate = instrument.rates.facultyGrantPerHour;
  else if (userCategory === "EXTERNAL_ACADEMIC") hourlyRate = instrument.rates.externalAcademicPerHour;
  else if (userCategory === "INDUSTRY_RND") hourlyRate = instrument.rates.industryRndPerHour;

  const baseTariff = hourlyRate * hours;
  const prepCost = samplePrep ? instrument.rates.samplePrepCharge * sampleCount : 0;
  return Math.round(baseTariff + prepCost);
}

export function requestCIFSlot(params: {
  instrumentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userCategory: CIFUserCategory;
  departmentOrOrg: string;
  grantCode?: string;
  supervisorName?: string;
  bookingDate: string;
  timeSlot: "MORNING_0930_1300" | "AFTERNOON_1400_1730" | "FULL_DAY_0930_1730";
  sampleCount: number;
  sampleState: CIFSampleState;
  hazardLevel: CIFHazardLevel;
  safetyDeclarationAccepted: boolean;
  samplePrepRequired: boolean;
  samplePrepDetails?: string;
}): CIFSlotBooking {
  const data = loadCIFData();
  const instrument = data.instruments.find((i) => i.id === params.instrumentId);
  if (!instrument) {
    throw new Error(`Instrument with ID ${params.instrumentId} not found in CIF catalog.`);
  }

  const hours = params.timeSlot === "FULL_DAY_0930_1730" ? 7.0 : 3.5;
  const tariff = calculateTariff(
    instrument,
    params.userCategory,
    hours,
    params.sampleCount,
    params.samplePrepRequired
  );

  const bookingRef = `APEX-CIF-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const newBooking: CIFSlotBooking = {
    id: `cif-book-${Date.now()}`,
    bookingRef,
    instrumentId: instrument.id,
    instrumentName: instrument.name,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    userCategory: params.userCategory,
    departmentOrOrg: params.departmentOrOrg,
    grantCode: params.grantCode,
    supervisorName: params.supervisorName,
    bookingDate: params.bookingDate,
    timeSlot: params.timeSlot,
    estimatedHours: hours,
    sampleCount: params.sampleCount,
    sampleState: params.sampleState,
    hazardLevel: params.hazardLevel,
    safetyDeclarationAccepted: params.safetyDeclarationAccepted,
    samplePrepRequired: params.samplePrepRequired,
    samplePrepDetails: params.samplePrepDetails,
    calculatedTariff: tariff,
    status: "SUBMITTED",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.bookings.unshift(newBooking);
  saveCIFData(data);
  return newBooking;
}

export function clearCIFSafety(params: {
  bookingId: string;
  clearedBy: string;
  remarks: string;
}): CIFSlotBooking {
  const data = loadCIFData();
  const booking = data.bookings.find((b) => b.id === params.bookingId);
  if (!booking) throw new Error("Booking not found");

  booking.status = "SAFETY_CLEARED";
  booking.safetyOfficerApproval = {
    approvedBy: params.clearedBy,
    clearedAt: new Date().toISOString(),
    remarks: params.remarks,
  };
  booking.updatedAt = new Date().toISOString();

  saveCIFData(data);
  return booking;
}

export function confirmCIFSlot(params: {
  bookingId: string;
  assignedOperator: string;
}): CIFSlotBooking {
  const data = loadCIFData();
  const booking = data.bookings.find((b) => b.id === params.bookingId);
  if (!booking) throw new Error("Booking not found");

  const slotToken = `APEX-CIF-SLOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  booking.status = "SLOT_CONFIRMED";
  booking.slotToken = slotToken;
  booking.assignedOperator = params.assignedOperator;
  booking.updatedAt = new Date().toISOString();

  saveCIFData(data);
  return booking;
}

export function completeCIFRun(params: {
  bookingId: string;
  beamHoursUsed: number;
  dataFileUrls: string[];
  operatorSignature: string;
}): CIFSlotBooking {
  const data = loadCIFData();
  const booking = data.bookings.find((b) => b.id === params.bookingId);
  if (!booking) throw new Error("Booking not found");

  const sealPayload = `${booking.slotToken}:${booking.instrumentId}:${params.beamHoursUsed}:${Date.now()}`;
  const cryptographicSeal = crypto.createHash("sha256").update(sealPayload).digest("hex");

  booking.status = "COMPLETED";
  booking.completionData = {
    beamHoursUsed: params.beamHoursUsed,
    completedAt: new Date().toISOString(),
    operatorSignature: params.operatorSignature,
    dataFileUrls: params.dataFileUrls,
    cryptographicSeal,
  };
  booking.updatedAt = new Date().toISOString();

  // Increment instrument usage metrics
  const instrument = data.instruments.find((i) => i.id === booking.instrumentId);
  if (instrument) {
    instrument.totalBeamHoursLogged += params.beamHoursUsed;
    instrument.totalSamplesAnalyzed += booking.sampleCount;
  }

  saveCIFData(data);
  return booking;
}

export function logCIFCalibration(params: {
  instrumentId: string;
  calibrationType: "ROUTINE_PREVENTATIVE" | "OEM_ANNUAL" | "NABL_TRACEABLE" | "BREAKDOWN_REPAIR";
  calibrationAgency: string;
  technicianName: string;
  status: "PASSED" | "PASSED_WITH_CORRECTION" | "REPLACEMENT_RECOMMENDED";
  certificateNumber: string;
  notes: string;
}): CIFCalibrationLog {
  const data = loadCIFData();
  const instrument = data.instruments.find((i) => i.id === params.instrumentId);
  if (!instrument) throw new Error("Instrument not found");

  const today = new Date().toISOString().split("T")[0];
  const nextDue = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const log: CIFCalibrationLog = {
    id: `cal-${Date.now()}`,
    instrumentId: instrument.id,
    instrumentCode: instrument.code,
    calibrationType: params.calibrationType,
    calibrationAgency: params.calibrationAgency,
    technicianName: params.technicianName,
    calibrationDate: today,
    calibrationValidUntil: nextDue,
    status: params.status,
    certificateNumber: params.certificateNumber,
    notes: params.notes,
  };

  instrument.lastCalibrationDate = today;
  instrument.nextCalibrationDueDate = nextDue;
  if (params.status === "PASSED" || params.status === "PASSED_WITH_CORRECTION") {
    instrument.status = "OPERATIONAL";
  }

  data.calibrations.unshift(log);
  saveCIFData(data);
  return log;
}

export function getCIFAnalytics() {
  const data = loadCIFData();
  const totalInstruments = data.instruments.length;
  const operationalInstruments = data.instruments.filter((i) => i.status === "OPERATIONAL").length;
  const totalBeamHours = data.instruments.reduce((acc, i) => acc + i.totalBeamHoursLogged, 0);
  const totalSamples = data.instruments.reduce((acc, i) => acc + i.totalSamplesAnalyzed, 0);

  const completedBookings = data.bookings.filter((b) => b.status === "COMPLETED");
  const totalRevenue = completedBookings.reduce((acc, b) => acc + b.calculatedTariff, 0);

  return {
    totalInstruments,
    operationalInstruments,
    uptimePercentage: Math.round((operationalInstruments / (totalInstruments || 1)) * 100),
    totalBeamHours,
    totalSamples,
    totalRevenue,
    activeBookingsCount: data.bookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length,
  };
}
