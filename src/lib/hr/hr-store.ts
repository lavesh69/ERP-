/**
 * Enterprise Human Resources, Workforce Governance & Cryptographic Payroll Store
 * Manages teaching & non-teaching staff, dynamic leave quotas, 7th Pay Commission / UGC allowances,
 * statutory tax regimes (Sec 115BAC vs Old), attendance LOP deductions, NACH bank files, and EPFO ECR exports.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "@/lib/logging/logger";

const HR_DIR = path.join(process.cwd(), "data", "hr");
const STAFF_FILE = path.join(HR_DIR, "staff_roster.json");
const LEAVES_FILE = path.join(HR_DIR, "hr_leaves.json");
const PAYROLL_RUNS_FILE = path.join(HR_DIR, "payroll_runs.json");
const PUNCHES_FILE = path.join(HR_DIR, "biometric_punches.json");

function ensureDirectory() {
  if (!fs.existsSync(HR_DIR)) {
    fs.mkdirSync(HR_DIR, { recursive: true });
  }
}

export type EmployeeType =
  | "FACULTY"
  | "ADMIN_STAFF"
  | "LAB_TECHNICIAN"
  | "WARDEN"
  | "SECURITY"
  | "TRANSPORT";

export type TaxRegimeType = "NEW_REGIME" | "OLD_REGIME";

export interface StaffEmployee {
  id: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  employeeType: EmployeeType;
  basicPay: number;
  joinedDate: string;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "RETIRED";
  panNumber: string;
  pfUan: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
  };
  taxRegime: TaxRegimeType;
  section80cDeclared: number;
  section80dDeclared: number;
  lopDays: number; // Loss of pay / unexcused days in current cycle
  holdStatus?: "RELEASED" | "ON_HOLD";
  holdReason?: string;
}

export type LeaveType =
  | "CASUAL_LEAVE"
  | "MEDICAL_LEAVE"
  | "EARNED_LEAVE"
  | "DUTY_LEAVE"
  | "STUDY_LEAVE"
  | "MATERNITY_LEAVE"
  | "RESTRICTED_HOLIDAY";

export interface StaffLeaveApplication {
  id: string;
  staffEmail: string;
  leaveType: LeaveType;
  days: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "RECOMMENDED" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  substituteFacultyEmail?: string;
  substituteRemarks?: string;
  appliedAt?: string;
}

export interface SalaryBreakdown {
  staffId: string;
  staffName: string;
  staffEmail: string;
  designation: string;
  department: string;
  payPeriod: string;
  basicPay: number;
  houseRentAllowance: number;
  dearnessAllowance: number;
  specialAllowance: number;
  grossSalary: number;
  lopDays: number;
  lopDeduction: number;
  providentFund: number;
  taxDeductedAtSource: number;
  professionalTax: number;
  totalDeductions: number;
  netPay: number;
  taxRegime: TaxRegimeType;
  bankAccount: string;
  ifscCode: string;
  status: "DRAFT" | "PROCESSED" | "DISBURSED";
  verificationHash: string;
  holdStatus?: "RELEASED" | "ON_HOLD";
  holdReason?: string;
  esicDeduction?: number;
  lwfDeduction?: number;
  loanEmiDeduction?: number;
}

export interface PayrollRun {
  id: string;
  payPeriod: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalTds: number;
  totalPf: number;
  totalLop: number;
  status: "PROCESSED" | "DISBURSED";
  processedAt: string;
  disbursedAt?: string;
  disbursedBy?: string;
  slips: SalaryBreakdown[];
}

export interface BiometricPunchRecord {
  id: string;
  staffId: string;
  staffName: string;
  terminalId: string;
  location: string;
  punchMode: "FINGERPRINT" | "FACIAL_3D" | "RFID_SMARTCARD";
  punchType: "PUNCH_IN" | "PUNCH_OUT";
  timestamp: string;
  token: string;
  status: "AUTHENTICATED" | "FLAGGED";
}

const DEFAULT_STAFF: StaffEmployee[] = [
  {
    id: "fac-01",
    name: "Dr. Alan Turing",
    email: "alan.turing@classroom.edu",
    designation: "Professor & Chair of Computer Science",
    department: "Computer Science & Engineering",
    employeeType: "FACULTY",
    basicPay: 85000,
    joinedDate: "2018-08-01",
    status: "ACTIVE",
    panNumber: "ABCPT1912A",
    pfUan: "100984729104",
    bankDetails: {
      bankName: "State Bank of India",
      accountNumber: "38920194821",
      ifscCode: "SBIN0004128",
    },
    taxRegime: "NEW_REGIME",
    section80cDeclared: 150000,
    section80dDeclared: 25000,
    lopDays: 0,
  },
  {
    id: "fac-02",
    name: "Dr. Arthur Pendelton",
    email: "arthur.pendelton@classroom.edu",
    designation: "Associate Professor & Chief Warden",
    department: "Mechanical Engineering",
    employeeType: "FACULTY",
    basicPay: 72000,
    joinedDate: "2020-01-15",
    status: "ACTIVE",
    panNumber: "DFGPP4921K",
    pfUan: "100984729105",
    bankDetails: {
      bankName: "HDFC Bank",
      accountNumber: "50100492817291",
      ifscCode: "HDFC0001048",
    },
    taxRegime: "OLD_REGIME",
    section80cDeclared: 120000,
    section80dDeclared: 20000,
    lopDays: 1, // 1 day loss of pay
  },
  {
    id: "fac-03",
    name: "Dr. Sunita Deshmukh",
    email: "sunita.deshmukh@classroom.edu",
    designation: "Professor of Electronics",
    department: "Electrical & Electronics",
    employeeType: "FACULTY",
    basicPay: 78000,
    joinedDate: "2019-07-20",
    status: "ACTIVE",
    panNumber: "KJHPD8492J",
    pfUan: "100984729106",
    bankDetails: {
      bankName: "ICICI Bank",
      accountNumber: "192801948291",
      ifscCode: "ICIC0000481",
    },
    taxRegime: "NEW_REGIME",
    section80cDeclared: 150000,
    section80dDeclared: 25000,
    lopDays: 0,
  },
  {
    id: "fac-04",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@classroom.edu",
    designation: "Head of Human Resources & Staff Welfare",
    department: "Administrative Affairs",
    employeeType: "ADMIN_STAFF",
    basicPay: 64000,
    joinedDate: "2021-03-10",
    status: "ACTIVE",
    panNumber: "MNBPS9281M",
    pfUan: "100984729107",
    bankDetails: {
      bankName: "Punjab National Bank",
      accountNumber: "094820194829",
      ifscCode: "PUNB0001928",
    },
    taxRegime: "NEW_REGIME",
    section80cDeclared: 80000,
    section80dDeclared: 15000,
    lopDays: 0,
  },
];

export class HrPayrollStore {
  private static instance: HrPayrollStore;

  private constructor() {
    ensureDirectory();
    this.initializeDefaults();
  }

  public static getInstance(): HrPayrollStore {
    if (!HrPayrollStore.instance) {
      HrPayrollStore.instance = new HrPayrollStore();
    }
    return HrPayrollStore.instance;
  }

  private initializeDefaults() {
    if (!fs.existsSync(STAFF_FILE)) {
      fs.writeFileSync(STAFF_FILE, JSON.stringify(DEFAULT_STAFF, null, 2), "utf-8");
    }
    if (!fs.existsSync(LEAVES_FILE)) {
      const initialLeaves: StaffLeaveApplication[] = [
        {
          id: "lv-01",
          staffEmail: "alan.turing@classroom.edu",
          leaveType: "CASUAL_LEAVE",
          days: 2,
          startDate: "2026-10-15",
          endDate: "2026-10-16",
          reason: "Academic research presentation at national symposium",
          status: "APPROVED",
          approvedBy: "sarah.jenkins@classroom.edu",
          substituteFacultyEmail: "sunita.deshmukh@classroom.edu",
          appliedAt: "2026-10-01",
        },
      ];
      fs.writeFileSync(LEAVES_FILE, JSON.stringify(initialLeaves, null, 2), "utf-8");
    }
    if (!fs.existsSync(PAYROLL_RUNS_FILE)) {
      fs.writeFileSync(PAYROLL_RUNS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    if (!fs.existsSync(PUNCHES_FILE)) {
      const defaultPunches: BiometricPunchRecord[] = [
        {
          id: "pch-001",
          staffId: "fac-01",
          staffName: "Dr. Alan Turing",
          terminalId: "BIO-ZKTECO-01",
          location: "Main Gate Turnstile A",
          punchMode: "FINGERPRINT",
          punchType: "PUNCH_IN",
          timestamp: "08:54:12 AM",
          token: "BIO-TOKEN-7FA1",
          status: "AUTHENTICATED",
        },
        {
          id: "pch-002",
          staffId: "fac-03",
          staffName: "Dr. Sunita Deshmukh",
          terminalId: "BIO-FACIAL-03",
          location: "Faculty Admin Wing",
          punchMode: "FACIAL_3D",
          punchType: "PUNCH_IN",
          timestamp: "08:58:34 AM",
          token: "BIO-TOKEN-84BC",
          status: "AUTHENTICATED",
        },
      ];
      fs.writeFileSync(PUNCHES_FILE, JSON.stringify(defaultPunches, null, 2), "utf-8");
    }
  }

  // Staff operations
  public getStaffMembers(): StaffEmployee[] {
    try {
      if (fs.existsSync(STAFF_FILE)) {
        return JSON.parse(fs.readFileSync(STAFF_FILE, "utf-8"));
      }
    } catch (err) {
      logger.error("Error reading staff roster", err);
    }
    return DEFAULT_STAFF;
  }

  public getStaffById(id: string): StaffEmployee | undefined {
    return this.getStaffMembers().find((s) => s.id === id);
  }

  public getStaffByEmail(email: string): StaffEmployee | undefined {
    return this.getStaffMembers().find((s) => s.email.toLowerCase() === email.toLowerCase());
  }

  public saveStaffMembers(staff: StaffEmployee[]): void {
    ensureDirectory();
    fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2), "utf-8");
  }

  public upsertStaffMember(staff: Partial<StaffEmployee> & { email: string }): StaffEmployee {
    const list = this.getStaffMembers();
    const existingIndex = list.findIndex((s) => s.email.toLowerCase() === staff.email.toLowerCase() || (staff.id && s.id === staff.id));
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...staff };
      this.saveStaffMembers(list);
      return list[existingIndex];
    } else {
      const newStaff: StaffEmployee = {
        id: staff.id || `stf-${Date.now().toString().slice(-4)}`,
        name: staff.name || "New Staff Member",
        email: staff.email,
        designation: staff.designation || "Assistant Professor",
        department: staff.department || "General Academics",
        employeeType: staff.employeeType || "FACULTY",
        basicPay: staff.basicPay || 55000,
        joinedDate: staff.joinedDate || new Date().toISOString().split("T")[0],
        status: "ACTIVE",
        panNumber: staff.panNumber || "PANXX0000X",
        pfUan: staff.pfUan || "100900000000",
        bankDetails: staff.bankDetails || {
          bankName: "Institutional Partner Bank",
          accountNumber: "0000000000",
          ifscCode: "IPBK0000001",
        },
        taxRegime: staff.taxRegime || "NEW_REGIME",
        section80cDeclared: staff.section80cDeclared || 0,
        section80dDeclared: staff.section80dDeclared || 0,
        lopDays: staff.lopDays || 0,
      };
      list.push(newStaff);
      this.saveStaffMembers(list);
      return newStaff;
    }
  }

  // Dynamic Leave Quotas & Management
  public getLeaves(): StaffLeaveApplication[] {
    try {
      if (fs.existsSync(LEAVES_FILE)) {
        return JSON.parse(fs.readFileSync(LEAVES_FILE, "utf-8"));
      }
    } catch (err) {
      logger.error("Error reading leaves file", err);
    }
    return [];
  }

  public saveLeaves(leaves: StaffLeaveApplication[]): void {
    ensureDirectory();
    fs.writeFileSync(LEAVES_FILE, JSON.stringify(leaves, null, 2), "utf-8");
  }

  public calculateStaffLeaveQuotas(staffEmail: string) {
    const allLeaves = this.getLeaves();
    const approvedStaffLeaves = allLeaves.filter(
      (l) => l.staffEmail.toLowerCase() === staffEmail.toLowerCase() && l.status === "APPROVED"
    );

    const casualTaken = approvedStaffLeaves
      .filter((l) => l.leaveType === "CASUAL_LEAVE")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const medicalTaken = approvedStaffLeaves
      .filter((l) => l.leaveType === "MEDICAL_LEAVE")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const earnedTaken = approvedStaffLeaves
      .filter((l) => l.leaveType === "EARNED_LEAVE")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const dutyTaken = approvedStaffLeaves
      .filter((l) => l.leaveType === "DUTY_LEAVE")
      .reduce((sum, l) => sum + (Number(l.days) || 0), 0);

    const casualTotal = 12;
    const medicalTotal = 10;
    const earnedTotal = 15;
    const dutyTotal = 15;

    return {
      casualLeaveTotal: casualTotal,
      casualLeaveTaken: casualTaken,
      casualLeaveRemaining: Math.max(0, casualTotal - casualTaken),
      medicalLeaveTotal: medicalTotal,
      medicalLeaveTaken: medicalTaken,
      medicalLeaveRemaining: Math.max(0, medicalTotal - medicalTaken),
      earnedLeaveTotal: earnedTotal,
      earnedLeaveTaken: earnedTaken,
      earnedLeaveRemaining: Math.max(0, earnedTotal - earnedTaken),
      dutyLeaveTotal: dutyTotal,
      dutyLeaveTaken: dutyTaken,
      dutyLeaveRemaining: Math.max(0, dutyTotal - dutyTaken),
    };
  }

  public applyLeave(data: {
    staffEmail: string;
    leaveType: LeaveType;
    days: number;
    startDate: string;
    endDate: string;
    reason: string;
    substituteFacultyEmail?: string;
    substituteRemarks?: string;
  }): StaffLeaveApplication {
    const leaves = this.getLeaves();
    const newLeave: StaffLeaveApplication = {
      id: `lv-${Date.now().toString().slice(-6)}`,
      staffEmail: data.staffEmail,
      leaveType: data.leaveType,
      days: Number(data.days),
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: "PENDING",
      substituteFacultyEmail: data.substituteFacultyEmail,
      substituteRemarks: data.substituteRemarks,
      appliedAt: new Date().toISOString().split("T")[0],
    };
    leaves.push(newLeave);
    this.saveLeaves(leaves);
    return newLeave;
  }

  public updateLeaveStatus(
    leaveId: string,
    action: "APPROVE" | "REJECT" | "RECOMMEND",
    actorEmail: string
  ): StaffLeaveApplication | null {
    const leaves = this.getLeaves();
    const target = leaves.find((l) => l.id === leaveId);
    if (!target) return null;

    if (action === "APPROVE") {
      target.status = "APPROVED";
      target.approvedBy = actorEmail;
    } else if (action === "REJECT") {
      target.status = "REJECTED";
      target.approvedBy = actorEmail;
    } else if (action === "RECOMMEND") {
      target.status = "RECOMMENDED";
    }

    this.saveLeaves(leaves);
    return target;
  }

  // 7th Pay Commission / UGC Salary Calculation & Section 192 Tax Engine
  public computeSalarySlip(
    staff: StaffEmployee,
    payPeriod: string = "October 2026",
    overrideLopDays?: number
  ): SalaryBreakdown {
    const basic = Math.max(0, staff.basicPay);
    // UGC/AICTE Standard Components
    const hra = Math.round(basic * 0.20); // 20% Category-Y HRA
    const da = Math.round(basic * 0.14);  // 14% dearness allowance base
    const specialAllowance = Math.round(basic * 0.10); // 10% academic research allowance
    const gross = basic + hra + da + specialAllowance;

    // Loss of Pay (LOP) deduction from unexcused absence days
    const activeLopDays = overrideLopDays !== undefined ? overrideLopDays : (staff.lopDays || 0);
    const dailyWageRate = gross / 30;
    const lopDeduction = Math.round(dailyWageRate * activeLopDays);

    // Statutory Provident Fund (12% of basic)
    const pf = Math.round(basic * 0.12);

    // Income Tax Section 192 & Section 115BAC Progressive Slab Engine
    const isNewRegime = staff.taxRegime === "NEW_REGIME";
    const annualProjectedGross = gross * 12;

    let annualTax = 0;
    if (isNewRegime) {
      // Standard deduction of 75,000 under Finance Act 2024/2026
      const taxableIncome = Math.max(0, annualProjectedGross - 75000);
      if (taxableIncome <= 300000) {
        annualTax = 0;
      } else if (taxableIncome <= 700000) {
        annualTax = (taxableIncome - 300000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        annualTax = 20000 + (taxableIncome - 700000) * 0.10;
      } else if (taxableIncome <= 1200000) {
        annualTax = 50000 + (taxableIncome - 1000000) * 0.15;
      } else if (taxableIncome <= 1500000) {
        annualTax = 80000 + (taxableIncome - 1200000) * 0.20;
      } else {
        annualTax = 140000 + (taxableIncome - 1500000) * 0.30;
      }
      // Section 87A rebate for income up to 7 Lakhs in new regime
      if (taxableIncome <= 700000) {
        annualTax = 0;
      }
    } else {
      // Old Regime with 80C (up to 1.5L) & 80D (up to 25k) + Standard deduction 50,000
      const standardDeduction = 50000;
      const sec80cDeduction = Math.min(150000, staff.section80cDeclared || 0);
      const sec80dDeduction = Math.min(25000, staff.section80dDeclared || 0);
      const totalExemptions = standardDeduction + sec80cDeduction + sec80dDeduction;
      const taxableIncome = Math.max(0, annualProjectedGross - totalExemptions);

      if (taxableIncome <= 250000) {
        annualTax = 0;
      } else if (taxableIncome <= 500000) {
        annualTax = (taxableIncome - 250000) * 0.05;
      } else if (taxableIncome <= 1000000) {
        annualTax = 12500 + (taxableIncome - 500000) * 0.20;
      } else {
        annualTax = 112500 + (taxableIncome - 1000000) * 0.30;
      }
      // Section 87A rebate for income up to 5 Lakhs in old regime
      if (taxableIncome <= 500000) {
        annualTax = 0;
      }
    }

    // Health & Education Cess 4%
    annualTax = Math.round(annualTax * 1.04);
    const monthlyTds = Math.max(0, Math.round(annualTax / 12));

    // Professional Tax (Standard institutional flat PT)
    const professionalTax = 200;

    const totalDeductions = pf + monthlyTds + professionalTax + lopDeduction;
    const netPay = Math.max(0, gross - totalDeductions);

    const verificationHash = crypto
      .createHash("sha256")
      .update(`${staff.email}:${payPeriod}:${netPay}:${staff.panNumber}`)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffEmail: staff.email,
      designation: staff.designation,
      department: staff.department,
      payPeriod,
      basicPay: basic,
      houseRentAllowance: hra,
      dearnessAllowance: da,
      specialAllowance,
      grossSalary: gross,
      lopDays: activeLopDays,
      lopDeduction,
      providentFund: pf,
      taxDeductedAtSource: monthlyTds,
      professionalTax,
      totalDeductions,
      netPay,
      taxRegime: staff.taxRegime,
      bankAccount: staff.bankDetails?.accountNumber || "N/A",
      ifscCode: staff.bankDetails?.ifscCode || "N/A",
      status: "PROCESSED",
      verificationHash,
      holdStatus: staff.holdStatus || "RELEASED",
      holdReason: staff.holdReason,
      esicDeduction: gross <= 21000 ? Math.round(gross * 0.0075) : 0,
      lwfDeduction: 4,
      loanEmiDeduction: 0,
    };
  }

  // Monthly Batch Payroll Execution
  public getPayrollRuns(): PayrollRun[] {
    try {
      if (fs.existsSync(PAYROLL_RUNS_FILE)) {
        return JSON.parse(fs.readFileSync(PAYROLL_RUNS_FILE, "utf-8"));
      }
    } catch (err) {
      logger.error("Error reading payroll runs file", err);
    }
    return [];
  }

  public savePayrollRuns(runs: PayrollRun[]): void {
    ensureDirectory();
    fs.writeFileSync(PAYROLL_RUNS_FILE, JSON.stringify(runs, null, 2), "utf-8");
  }

  public executeMonthlyBatchPayroll(payPeriod: string, actorEmail: string): PayrollRun {
    const staffList = this.getStaffMembers().filter((s) => s.status === "ACTIVE");
    const slips: SalaryBreakdown[] = staffList.map((s) => this.computeSalarySlip(s, payPeriod));

    const totalGross = slips.reduce((sum, s) => sum + s.grossSalary, 0);
    const totalNet = slips.reduce((sum, s) => sum + s.netPay, 0);
    const totalTds = slips.reduce((sum, s) => sum + s.taxDeductedAtSource, 0);
    const totalPf = slips.reduce((sum, s) => sum + s.providentFund, 0);
    const totalLop = slips.reduce((sum, s) => sum + s.lopDeduction, 0);

    const runs = this.getPayrollRuns();
    // Replace existing run for same period if present, or add new
    const existingIndex = runs.findIndex((r) => r.payPeriod.toLowerCase() === payPeriod.toLowerCase());

    const newRun: PayrollRun = {
      id: `pr-${Date.now().toString().slice(-6)}`,
      payPeriod,
      totalEmployees: staffList.length,
      totalGross,
      totalNet,
      totalTds,
      totalPf,
      totalLop,
      status: "PROCESSED",
      processedAt: new Date().toISOString(),
      slips,
    };

    if (existingIndex >= 0) {
      runs[existingIndex] = newRun;
    } else {
      runs.unshift(newRun);
    }

    this.savePayrollRuns(runs);
    return newRun;
  }

  public disbursePayrollRun(runId: string, actorEmail: string): PayrollRun | null {
    const runs = this.getPayrollRuns();
    const run = runs.find((r) => r.id === runId);
    if (!run) return null;

    run.status = "DISBURSED";
    run.disbursedAt = new Date().toISOString();
    run.disbursedBy = actorEmail;
    run.slips.forEach((s) => {
      s.status = "DISBURSED";
    });

    this.savePayrollRuns(runs);
    return run;
  }

  // Banking NACH/NEFT Batch Payout Manifest
  public generateBankPayoutCsv(payPeriod: string): string {
    const runs = this.getPayrollRuns();
    const run = runs.find((r) => r.payPeriod.toLowerCase() === payPeriod.toLowerCase());
    const slips = run ? run.slips : this.getStaffMembers().map((s) => this.computeSalarySlip(s, payPeriod));

    const headers = [
      "SrNo",
      "BeneficiaryName",
      "AccountNumber",
      "IFSC",
      "BankName",
      "NetPayAmount",
      "PayPeriod",
      "TransactionRemarks",
      "PAN",
    ];

    const rows = slips.map((slip, index) => {
      const staff = this.getStaffById(slip.staffId);
      return [
        index + 1,
        `"${slip.staffName.replace(/"/g, '""')}"`,
        `"${slip.bankAccount}"`,
        slip.ifscCode,
        `"${staff?.bankDetails.bankName || "National Bank"}"`,
        slip.netPay,
        `"${slip.payPeriod}"`,
        `"SALARY-${slip.payPeriod.replace(/\s+/g, "")}-${slip.staffId}"`,
        staff?.panNumber || "PANXX0000X",
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  // EPFO ECR (Electronic Challan cum Return) Generation
  public generateEpfoEcrText(payPeriod: string): string {
    const runs = this.getPayrollRuns();
    const run = runs.find((r) => r.payPeriod.toLowerCase() === payPeriod.toLowerCase());
    const slips = run ? run.slips : this.getStaffMembers().map((s) => this.computeSalarySlip(s, payPeriod));

    // Standard EPFO # separated text file format
    return slips
      .map((slip) => {
        const staff = this.getStaffById(slip.staffId);
        const uan = staff?.pfUan || "100900000000";
        const gross = slip.grossSalary;
        const epfWages = Math.min(15000, slip.basicPay);
        const epsWages = epfWages;
        const edliWages = epfWages;
        const eeShare = Math.round(epfWages * 0.12);
        const erEpsShare = Math.round(epsWages * 0.0833);
        const erEpfShare = eeShare - erEpsShare;

        return `${uan}#${slip.staffName}#${gross}#${epfWages}#${epsWages}#${edliWages}#${eeShare}#${erEpfShare}#${erEpsShare}#0#0`;
      })
      .join("\n");
  }

  // Biometric Terminal Hardware & Punch Records
  public getBiometricPunches(): BiometricPunchRecord[] {
    try {
      if (fs.existsSync(PUNCHES_FILE)) {
        return JSON.parse(fs.readFileSync(PUNCHES_FILE, "utf-8"));
      }
    } catch (err) {
      logger.error("Error reading punches file", err);
    }
    return [];
  }

  public recordBiometricPunch(data: {
    staffId: string;
    terminalId: string;
    punchMode: "FINGERPRINT" | "FACIAL_3D" | "RFID_SMARTCARD";
    punchType: "PUNCH_IN" | "PUNCH_OUT";
  }): BiometricPunchRecord {
    ensureDirectory();
    const punches = this.getBiometricPunches();
    const staff = this.getStaffById(data.staffId);
    const staffName = staff?.name || "Staff Member";

    const locations: Record<string, string> = {
      "BIO-ZKTECO-01": "Main Gate Turnstile A",
      "BIO-ESSL-02": "Academic Block North Entry",
      "BIO-FACIAL-03": "Faculty Administration Wing",
    };

    const newPunch: BiometricPunchRecord = {
      id: `pch-${Date.now().toString().slice(-4)}`,
      staffId: data.staffId,
      staffName,
      terminalId: data.terminalId,
      location: locations[data.terminalId] || "Terminal",
      punchMode: data.punchMode,
      punchType: data.punchType,
      timestamp: new Date().toLocaleTimeString(),
      token: `BIO-TOKEN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      status: "AUTHENTICATED",
    };

    punches.unshift(newPunch);
    fs.writeFileSync(PUNCHES_FILE, JSON.stringify(punches.slice(0, 100), null, 2), "utf-8");
    return newPunch;
  }
}

export const hrPayrollStore = HrPayrollStore.getInstance();
