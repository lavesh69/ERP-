"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Download,
  Users,
  ShieldCheck,
  Building,
  Clock,
  Send,
  Printer,
  ChevronRight,
  Filter,
  Search,
  Eye,
  Fingerprint,
  Cpu,
  Wifi,
  Radio,
  Phone,
  Calculator,
  Scale,
  Award,
  BookOpen,
  TrendingUp,
  Key,
  Landmark,
  FileCheck,
  ClipboardCheck,
  GraduationCap,
  CheckSquare,
  CreditCard,
} from "lucide-react";
import { CpcIncrementTab } from "@/components/hr/tabs/CpcIncrementTab";
import { IncomeTaxTdsTab } from "@/components/hr/tabs/IncomeTaxTdsTab";

export default function HRPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"staff" | "leaves" | "payroll" | "biometric" | "cpc-matrix" | "income-tax">("staff");
  const [loading, setLoading] = useState(true);
  const [leaveData, setLeaveData] = useState<any>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedStaffProfile, setSelectedStaffProfile] = useState<any | null>(null);

  // Biometric Terminal Simulator State
  const [punchSimulator, setPunchSimulator] = useState({
    staffId: "fac-01",
    terminalId: "BIO-ZKTECO-01",
    punchMode: "FINGERPRINT",
    punchType: "PUNCH_IN",
  });
  const [punchesLog, setPunchesLog] = useState([
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
    {
      id: "pch-003",
      staffId: "fac-02",
      staffName: "Dr. Arthur Pendelton",
      terminalId: "BIO-ESSL-02",
      location: "Academic Block North",
      punchMode: "RFID_SMARTCARD",
      punchType: "PUNCH_IN",
      timestamp: "09:02:11 AM",
      token: "BIO-TOKEN-29DD",
      status: "AUTHENTICATED",
    },
  ]);

  // Apply Leave Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "CASUAL_LEAVE",
    days: 2,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
    substituteFacultyEmail: "",
    substituteRemarks: "",
  });

  // Sample Staff Roster
  const [staffMembers, setStaffMembers] = useState([
    {
      id: "fac-01",
      name: "Dr. Alan Turing",
      email: "alan.turing@classroom.edu",
      designation: "Professor & Chair of Computer Science",
      department: "Computer Science & Engineering",
      basicPay: 8500,
      joinedDate: "2018-08-01",
      status: "ACTIVE",
    },
    {
      id: "fac-02",
      name: "Dr. Arthur Pendelton",
      email: "arthur.pendelton@classroom.edu",
      designation: "Associate Professor & Chief Warden",
      department: "Mechanical Engineering",
      basicPay: 7200,
      joinedDate: "2020-01-15",
      status: "ACTIVE",
    },
    {
      id: "fac-03",
      name: "Dr. Sunita Deshmukh",
      email: "sunita.deshmukh@classroom.edu",
      designation: "Professor of Electronics",
      department: "Electrical & Electronics",
      basicPay: 7800,
      joinedDate: "2019-07-20",
      status: "ACTIVE",
    },
    {
      id: "fac-04",
      name: "Sarah Jenkins",
      email: "sarah.jenkins@classroom.edu",
      designation: "Head of Human Resources & Staff Welfare",
      department: "Administrative Affairs",
      basicPay: 6400,
      joinedDate: "2021-03-10",
      status: "ACTIVE",
    },
  ]);

  const [searchStaff, setSearchStaff] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedPayrollStaffId, setSelectedPayrollStaffId] = useState<string>("fac-01");
  const [selectedPayPeriod, setSelectedPayPeriod] = useState<string>("October 2026");
  const [taxRegime, setTaxRegime] = useState<"NEW_REGIME" | "OLD_REGIME">("NEW_REGIME");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<string>("ALL");
  const [leaveSearch, setLeaveSearch] = useState<string>("");

  // Enterprise Statutory & Academic Governance Modals
  const [serviceBookModal, setServiceBookModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });
  const [casModal, setCasModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });
  const [daArrearsModal, setDaArrearsModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean; oldDa: number; newDa: number }>({ isOpen: false, data: null, loading: false, oldDa: 46, newDa: 50 });
  const [h2hModal, setH2hModal] = useState<{ isOpen: boolean; result: any | null; loading: boolean; otp: string; makerId: string; checkerId: string }>({ isOpen: false, result: null, loading: false, otp: "2FA-APPROVE-8849", makerId: "DDO_FIN_ADMIN", checkerId: "REGISTRAR_EXEC" });
  const [form12bbModal, setForm12bbModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });

  // Phase A, B, C Enterprise Modals
  const [esicModal, setEsicModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });
  const [rosterModal, setRosterModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });
  const [noDuesModal, setNoDuesModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });
  const [gratuityModal, setGratuityModal] = useState<{ isOpen: boolean; data: any | null; loading: boolean }>({ isOpen: false, data: null, loading: false });

  const handleOpenEsic = async () => {
    setEsicModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch("/api/hr/payroll?action=ESIC_CHALLAN");
      const json = await res.json();
      setEsicModal({ isOpen: true, data: json, loading: false });
    } catch {
      setEsicModal({ isOpen: true, data: null, loading: false });
    }
  };

  const handleOpenRoster = async () => {
    setRosterModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch("/api/hr/payroll?action=ROSTER_200");
      const json = await res.json();
      setRosterModal({ isOpen: true, data: json, loading: false });
    } catch {
      setRosterModal({ isOpen: true, data: null, loading: false });
    }
  };

  const handleOpenNoDues = async (staffId?: string) => {
    const id = staffId || selectedPayrollStaffId || "fac-01";
    setNoDuesModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch(`/api/hr/payroll?action=NO_DUES_STATUS&employeeId=${id}`);
      const json = await res.json();
      setNoDuesModal({ isOpen: true, data: json, loading: false });
    } catch {
      setNoDuesModal({ isOpen: true, data: null, loading: false });
    }
  };

  const handleCalculateGratuity = async (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId) || staffMembers[0];
    setGratuityModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CALCULATE_GRATUITY",
          employeeId: staff.id,
          employeeName: staff.name,
          joiningDate: staff.joinedDate,
          exitDate: "2026-10-31",
          lastDrawnBasic: staff.basicPay,
          lastDrawnDa: Math.round(staff.basicPay * 0.14),
        }),
      });
      const json = await res.json();
      setGratuityModal({ isOpen: true, data: json.gratuity, loading: false });
    } catch {
      setGratuityModal({ isOpen: true, data: null, loading: false });
    }
  };

  const handleToggleSalaryHold = async (staffId: string, currentStatus?: string) => {
    const newStatus = currentStatus === "ON_HOLD" ? "RELEASED" : "ON_HOLD";
    const reason = newStatus === "ON_HOLD" ? "Held pending semester grade verification" : undefined;
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_SALARY_HOLD",
          staffId,
          holdStatus: newStatus,
          holdReason: reason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setStatusMessage({ type: "success", text: json.message });
        setStaffMembers((prev) =>
          prev.map((s) => (s.id === staffId ? { ...s, holdStatus: newStatus, holdReason: reason } : s))
        );
        if (selectedStaffProfile && selectedStaffProfile.id === staffId) {
          setSelectedStaffProfile({ ...selectedStaffProfile, holdStatus: newStatus, holdReason: reason });
        }
      }
    } catch (e: any) {
      setStatusMessage({ type: "error", text: "Failed to toggle salary hold status" });
    }
  };

  const handleExportStaffCsv = () => {
    const headers = ["Staff ID", "Name", "Email", "Designation", "Department", "Joined Date", "Basic Pay", "Status"];
    const rows = filteredStaff.map((m) => [
      m.id,
      `"${m.name.replace(/"/g, '""')}"`,
      `"${m.email}"`,
      `"${m.designation.replace(/"/g, '""')}"`,
      `"${m.department.replace(/"/g, '""')}"`,
      m.joinedDate,
      m.basicPay,
      m.status,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HR_Staff_Roster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStaff = staffMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchStaff.toLowerCase()) ||
      m.email.toLowerCase().includes(searchStaff.toLowerCase()) ||
      m.designation.toLowerCase().includes(searchStaff.toLowerCase()) ||
      m.department.toLowerCase().includes(searchStaff.toLowerCase());
    const matchesDept = deptFilter === "ALL" || m.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const fetchHRData = async () => {
    try {
      setLoading(true);
      const [lRes, pRes] = await Promise.all([
        fetch("/api/hr/leaves"),
        fetch("/api/hr/payroll"),
      ]);

      if (lRes.ok) {
        const lJson = await lRes.json();
        setLeaveData(lJson);
      }
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPayrollData(pJson);
        if (pJson.staffRoster && Array.isArray(pJson.staffRoster) && pJson.staffRoster.length > 0) {
          setStaffMembers(pJson.staffRoster);
        }
        if (pJson.biometricPunches && Array.isArray(pJson.biometricPunches) && pJson.biometricPunches.length > 0) {
          setPunchesLog(pJson.biometricPunches);
        }
      }
    } catch (err) {
      console.error("Failed to fetch HR data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit leave application");
      setStatusMessage({ type: "success", text: "Staff leave application submitted successfully!" });
      setShowLeaveModal(false);
      fetchHRData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleApproveLeave = async (leaveId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/hr/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process leave");
      setStatusMessage({ type: "success", text: `Leave application ${action.toLowerCase()}d.` });
      fetchHRData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleSimulatePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffMembers.find((s) => s.id === punchSimulator.staffId);
    if (!staff) return;
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_BIOMETRIC_PUNCH",
          staffId: punchSimulator.staffId,
          terminalId: punchSimulator.terminalId,
          punchMode: punchSimulator.punchMode,
          punchType: punchSimulator.punchType,
        }),
      });
      const data = await res.json();
      const savedPunch = data.punch || {
        id: `pch-${Date.now().toString().slice(-4)}`,
        staffId: staff.id,
        staffName: staff.name,
        terminalId: punchSimulator.terminalId,
        location: "Terminal",
        punchMode: punchSimulator.punchMode,
        punchType: punchSimulator.punchType,
        timestamp: new Date().toLocaleTimeString(),
        token: `BIO-TOKEN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        status: "AUTHENTICATED",
      };
      setPunchesLog([savedPunch, ...punchesLog]);
      setStatusMessage({
        type: "success",
        text: `Biometric Hardware ${punchSimulator.punchType.replace(/_/g, " ")} recorded for ${staff.name} via ${punchSimulator.terminalId} & synchronized!`,
      });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to record punch" });
    }
  };

  const handleRunBatchPayroll = async () => {
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RUN_BATCH_PAYROLL",
          payPeriod: selectedPayPeriod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute batch payroll");
      setStatusMessage({ type: "success", text: data.message });
      fetchHRData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleUpdateTaxRegime = async (regime: "NEW_REGIME" | "OLD_REGIME") => {
    setTaxRegime(regime);
    try {
      await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_TAX_DECLARATION",
          staffId: selectedPayrollStaffId,
          taxRegime: regime,
        }),
      });
      fetchHRData();
    } catch (err) {
      console.warn("Could not save tax regime", err);
    }
  };

  const handleDownloadBankPayout = () => {
    window.open(`/api/hr/payroll?action=BANK_EXPORT&period=${encodeURIComponent(selectedPayPeriod)}`, "_blank");
  };

  const handleDownloadEpfoEcr = () => {
    window.open(`/api/hr/payroll?action=EPFO_EXPORT&period=${encodeURIComponent(selectedPayPeriod)}`, "_blank");
  };

  const handleDownloadNpsScf = () => {
    window.open(`/api/hr/payroll?action=NPS_SCF&period=${encodeURIComponent(selectedPayPeriod)}`, "_blank");
  };

  const handleProcessH2HDirectPayout = async (otp?: string) => {
    try {
      setH2hModal(prev => ({ ...prev, loading: true }));
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_H2H_PAYOUT",
          payPeriod: selectedPayPeriod,
          makerId: h2hModal.makerId,
          checkerId: h2hModal.checkerId,
          twoFactorOtp: otp || h2hModal.otp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "H2H Payout failed");
      setH2hModal(prev => ({ ...prev, result: data, loading: false }));
      setStatusMessage({ type: "success", text: `Host-to-Host Corporate Payout completed! Reference: ${data.batchReferenceId}` });
      fetchHRData();
    } catch (err: any) {
      setH2hModal(prev => ({ ...prev, loading: false }));
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleViewServiceBook = async (staffId: string) => {
    try {
      setServiceBookModal({ isOpen: true, data: null, loading: true });
      const res = await fetch(`/api/hr/payroll?action=SERVICE_BOOK&staffId=${encodeURIComponent(staffId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load e-Service Book");
      setServiceBookModal({ isOpen: true, data, loading: false });
    } catch (err: any) {
      setServiceBookModal({ isOpen: false, data: null, loading: false });
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleEvaluateUgcCas = async (staffId: string) => {
    try {
      setCasModal({ isOpen: true, data: null, loading: true });
      const res = await fetch(`/api/hr/payroll?action=CAS_EVALUATION&staffId=${encodeURIComponent(staffId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate UGC CAS");
      setCasModal({ isOpen: true, data, loading: false });
    } catch (err: any) {
      setCasModal({ isOpen: false, data: null, loading: false });
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleCalculateDaArrears = async (staffId: string, oldDa = 46, newDa = 50) => {
    try {
      setDaArrearsModal(prev => ({ ...prev, isOpen: true, data: null, loading: true, oldDa, newDa }));
      const res = await fetch(`/api/hr/payroll?action=DA_ARREARS&staffId=${encodeURIComponent(staffId)}&fromMonth=2026-01&toMonth=2026-06&oldDaRate=${oldDa}&newDaRate=${newDa}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to compute DA arrears");
      setDaArrearsModal(prev => ({ ...prev, isOpen: true, data, loading: false }));
    } catch (err: any) {
      setDaArrearsModal(prev => ({ ...prev, isOpen: false, data: null, loading: false }));
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleAuditForm12BB = async (staffId: string) => {
    try {
      setForm12bbModal({ isOpen: true, data: null, loading: true });
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AUDIT_FORM12BB",
          staffId,
          assessmentYear: "2026-2027",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to audit Form 12BB");
      setForm12bbModal({ isOpen: true, data, loading: false });
    } catch (err: any) {
      setForm12bbModal({ isOpen: false, data: null, loading: false });
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleDownloadForm16 = (staffId: string) => {
    window.open(`/api/hr/payroll?action=FORM16&staffId=${encodeURIComponent(staffId)}&assessmentYear=2026-2027`, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                Staff Welfare & Compensation ERP
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Pay Cycle Active (October 2026)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Human Resources, Staff Leave & Payroll
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Faculty workforce governance, statutory leave quota reconciliations, automated tax deductions, and cryptographic salary payslips.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunBatchPayroll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
            >
              <DollarSign className="w-4 h-4" />
              Run Payroll ({selectedPayPeriod})
            </button>
            <button
              onClick={handleDownloadBankPayout}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <Building className="w-4 h-4" />
              Bank NACH/NEFT
            </button>
            <button
              onClick={handleDownloadEpfoEcr}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <FileText className="w-4 h-4" />
              EPFO ECR
            </button>
            <button
              onClick={handleDownloadNpsScf}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <Landmark className="w-4 h-4 text-emerald-300" />
              NSDL NPS (Tier-I)
            </button>
            <button
              onClick={handleOpenEsic}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-teal-600/80 hover:bg-teal-600 text-white border border-teal-400/40 shadow-sm transition-all active:scale-95"
            >
              <FileCheck className="w-4 h-4 text-teal-200" />
              ESIC & 24Q
            </button>
            <button
              onClick={handleOpenRoster}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-400/40 shadow-sm transition-all active:scale-95"
            >
              <GraduationCap className="w-4 h-4 text-blue-200" />
              200-Pt Roster
            </button>
            <button
              onClick={() => handleOpenNoDues()}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-purple-600/80 hover:bg-purple-600 text-white border border-purple-400/40 shadow-sm transition-all active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4 text-purple-200" />
              Digital No-Dues
            </button>
            <button
              onClick={() => setH2hModal({ ...h2hModal, isOpen: true })}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/40 shadow-sm transition-all active:scale-95"
            >
              <Key className="w-4 h-4" />
              Direct H2H Payout
            </button>
            <button
              onClick={() => handleCalculateDaArrears(selectedPayrollStaffId)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-400/40 shadow-sm transition-all active:scale-95"
            >
              <TrendingUp className="w-4 h-4" />
              7th CPC DA Arrears
            </button>
            <button
              onClick={handleExportStaffCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Staff CSV
            </button>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Apply Leave
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Total Faculty & Staff</p>
            <p className="text-xl md:text-2xl font-bold mt-1">{staffMembers.length} Members</p>
            <p className="text-xs text-rose-300 mt-0.5">100% Verified Service Records</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Casual Leave Quota</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">
              {leaveData?.leaveQuotas?.casualLeaveRemaining ?? leaveData?.quota?.casualLeaveRemaining ?? 10} / {leaveData?.leaveQuotas?.casualLeaveTotal ?? 12} Days
            </p>
            <p className="text-xs text-rose-300 mt-0.5">Annual Statutory Balance</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Medical Leave</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">
              {leaveData?.leaveQuotas?.medicalLeaveRemaining ?? leaveData?.quota?.medicalLeaveRemaining ?? 9} / {leaveData?.leaveQuotas?.medicalLeaveTotal ?? 10} Days
            </p>
            <p className="text-xs text-rose-300 mt-0.5">Paid Sickness Benefit</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Monthly Payroll Total</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">
              ${staffMembers.reduce((acc, m) => acc + m.basicPay * 1.44, 0).toLocaleString()}
            </p>
            <p className="text-xs text-rose-300 mt-0.5">Gross Salaries Disbursed</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto no-scrollbar flex-nowrap pb-px">
        {[
          { id: "staff", label: "Faculty & Staff Directory", icon: Users },
          { id: "leaves", label: "Leave Management & Quotas", icon: Calendar, count: leaveData?.applications?.filter((a: any) => a.status === "PENDING")?.length },
          { id: "payroll", label: "Enterprise Payroll & Payslips", icon: DollarSign },
          { id: "cpc-matrix", label: "7th CPC Pay Matrix & Increments", icon: Award },
          { id: "income-tax", label: "Income Tax Sec 192 & Form 16", icon: Landmark },
          { id: "biometric", label: "Biometric Hardware Sync", icon: Fingerprint },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "border-rose-primary text-rose-primary dark:text-rose-light dark:border-rose-light"
                  : "border-transparent text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FACULTY & STAFF DIRECTORY */}
      {activeTab === "staff" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Institutional Workforce Register
              </h2>
              <p className="text-xs text-charcoal-500">
                {filteredStaff.length} of {staffMembers.length} faculty and staff records matching
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff, email, dept..."
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44 sm:w-52"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-charcoal-400" />
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="ALL">All Departments</option>
                  <option value="Computer Science & Engineering">CSE</option>
                  <option value="Mechanical Engineering">Mechanical</option>
                  <option value="Electrical & Electronics">EEE</option>
                  <option value="Administrative Affairs">Administration</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                <tr>
                  <th className="p-3.5">Staff Member / Email</th>
                  <th className="p-3.5">Designation</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5">Basic Pay</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-charcoal-800">
                {filteredStaff.map((m) => (
                  <tr key={m.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-charcoal-900 dark:text-ivory-100">{m.name}</p>
                      <p className="text-[11px] text-charcoal-500">{m.email}</p>
                    </td>
                    <td className="p-3.5 font-medium text-charcoal-800 dark:text-ivory-200">{m.designation}</td>
                    <td className="p-3.5 text-charcoal-600 dark:text-ivory-300">{m.department}</td>
                    <td className="p-3.5 text-charcoal-500">{m.joinedDate}</td>
                    <td className="p-3.5 font-semibold text-charcoal-900 dark:text-ivory-100">${m.basicPay.toLocaleString()} / mo</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedStaffProfile(m)}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-rose-primary dark:text-rose-light" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab("payroll");
                            setStatusMessage({ type: "success", text: `Loaded salary record for ${m.name}` });
                          }}
                          className="px-2.5 py-1 rounded text-[11px] font-semibold text-rose-primary hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors"
                        >
                          Payslip
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredStaff.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mx-auto text-rose-primary dark:text-rose-light">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                No Staff Records Found
              </h3>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
                No faculty or administrative staff records match your search query or department filter.
              </p>
              <button
                onClick={() => {
                  setDeptFilter("ALL");
                  setSearchStaff("");
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-primary text-white rounded-lg hover:bg-rose-accent transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEAVE MANAGEMENT */}
      {activeTab === "leaves" && (
        <div className="space-y-6">
          {/* Leave Quota Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-charcoal-900 p-5 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                Casual Leave (CL)
              </span>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                {leaveData?.quota?.casualLeaveRemaining ?? 10} Days Remaining
              </p>
              <p className="text-xs text-charcoal-500 mt-1">
                Used: {leaveData?.quota?.casualLeaveTaken ?? 2} / Total: {leaveData?.quota?.casualLeaveTotal ?? 12}
              </p>
            </div>
            <div className="bg-white dark:bg-charcoal-900 p-5 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Medical Leave (ML)
              </span>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                {leaveData?.quota?.medicalLeaveRemaining ?? 9} Days Remaining
              </p>
              <p className="text-xs text-charcoal-500 mt-1">
                Used: {leaveData?.quota?.medicalLeaveTaken ?? 1} / Total: {leaveData?.quota?.medicalLeaveTotal ?? 10}
              </p>
            </div>
            <div className="bg-white dark:bg-charcoal-900 p-5 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                Earned Vacation (EL)
              </span>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                {leaveData?.quota?.earnedLeaveRemaining ?? 15} Days Remaining
              </p>
              <p className="text-xs text-charcoal-500 mt-1">
                Used: {leaveData?.quota?.earnedLeaveTaken ?? 0} / Total: {leaveData?.quota?.earnedLeaveTotal ?? 15}
              </p>
            </div>
          </div>

          {/* Leave Applications Table */}
          <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Staff Leave Applications & Approvals
                </h3>
                <p className="text-xs text-charcoal-500">
                  Statutory leave authorization audit trail
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search staff, reason, type..."
                    value={leaveSearch}
                    onChange={(e) => setLeaveSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500 w-44 sm:w-56"
                  />
                </div>
                <select
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Submit Application
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                  <tr>
                    <th className="p-3.5">Applicant Staff</th>
                    <th className="p-3.5">Leave Type</th>
                    <th className="p-3.5">Duration</th>
                    <th className="p-3.5">Dates</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-charcoal-800">
                  {(leaveData?.applications || [])
                    .filter((app: any) => {
                      const matchesSearch =
                        app.staffEmail?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                        app.reason?.toLowerCase().includes(leaveSearch.toLowerCase()) ||
                        app.leaveType?.toLowerCase().includes(leaveSearch.toLowerCase());
                      const matchesStatus = leaveStatusFilter === "ALL" || app.status === leaveStatusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((app: any) => (
                    <tr key={app.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-charcoal-900 dark:text-ivory-100">
                        {app.staffEmail}
                      </td>
                      <td className="p-3.5 font-medium text-charcoal-800 dark:text-ivory-200">
                        {app.leaveType.replace(/_/g, " ")}
                      </td>
                      <td className="p-3.5 text-charcoal-700 dark:text-ivory-300">{app.days} Days</td>
                      <td className="p-3.5 text-charcoal-500">{app.startDate} to {app.endDate}</td>
                      <td className="p-3.5 text-charcoal-600 dark:text-ivory-300 italic">{app.reason}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            app.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {app.status === "PENDING" && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveLeave(app.id, "APPROVE")}
                              className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[10px] hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveLeave(app.id, "REJECT")}
                              className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold text-[10px] hover:bg-rose-700"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {app.status === "APPROVED" && (
                          <span className="text-[11px] text-charcoal-400">Authorized</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL & SALARY SLIPS */}
      {activeTab === "payroll" && (() => {
        const activeStaffForPayroll = staffMembers.find((m) => m.id === selectedPayrollStaffId) || staffMembers[0];
        const basicPay = activeStaffForPayroll?.basicPay || 8500;
        const houseRentAllowance = Math.round(basicPay * 0.20);
        const dearnessAllowance = Math.round(basicPay * 0.14);
        const specialAllowance = Math.round(basicPay * 0.10);
        const grossSalary = basicPay + houseRentAllowance + dearnessAllowance + specialAllowance;
        const providentFund = Math.round(basicPay * 0.12);
        
        // Income Tax Calculations
        const isNewRegime = taxRegime === "NEW_REGIME";
        const oldRegimeTax = Math.round(grossSalary * 0.092);
        const newRegimeTax = Math.round(grossSalary * 0.065);
        const taxDeductedAtSource = isNewRegime ? newRegimeTax : oldRegimeTax;
        const monthlyTaxSavings = Math.abs(oldRegimeTax - newRegimeTax);
        const professionalTax = 200;
        const totalDeductions = providentFund + taxDeductedAtSource + professionalTax;
        const netPay = grossSalary - totalDeductions;
        const verificationHash = `SAL-${activeStaffForPayroll?.id.toUpperCase()}-SHA256-${((basicPay * 997) % 65535).toString(16).toUpperCase()}`;

        return (
          <div className="space-y-6">
            {/* Staff Selector & Tax Regime Control Bar */}
            <div className="bg-white dark:bg-charcoal-900 rounded-xl p-4 border border-border dark:border-charcoal-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-charcoal-700 dark:text-ivory-200 block">
                  Faculty Compensation & Income Tax Engine (Section 192)
                </span>
                <span className="text-[11px] text-charcoal-500">
                  Switch faculty members and toggle between Indian Income Tax Regimes
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPayrollStaffId}
                  onChange={(e) => setSelectedPayrollStaffId(e.target.value)}
                  className="p-2 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {staffMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.department})
                    </option>
                  ))}
                </select>
                <select
                  value={selectedPayPeriod}
                  onChange={(e) => setSelectedPayPeriod(e.target.value)}
                  className="p-2 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="October 2026">October 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="August 2026">August 2026</option>
                </select>
              </div>
            </div>

            {/* Income Tax Regime Switcher */}
            <div className="max-w-2xl mx-auto bg-ivory-50/70 dark:bg-charcoal-850 p-4 rounded-xl border border-border dark:border-charcoal-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-rose-primary" />
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    Statutory Tax Regime Selector (Finance Act 2026):
                  </span>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-charcoal-900 rounded-lg border border-border dark:border-charcoal-700">
                  <button
                    type="button"
                    onClick={() => handleUpdateTaxRegime("NEW_REGIME")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      isNewRegime
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900"
                    }`}
                  >
                    Section 115BAC (New)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateTaxRegime("OLD_REGIME")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      !isNewRegime
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900"
                    }`}
                  >
                    Old Regime (80C / 80D)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-border dark:border-charcoal-700/60">
                <span className="text-[11px] text-charcoal-500">
                  {isNewRegime
                    ? "✓ Default Regime: Standard Deduction ₹75,000 / $900 applied with concessional slabs."
                    : "⚠️ Old Regime: Higher base rates; requires Section 80C, 80D & HRA rent receipts proof submission."}
                </span>
                <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200">
                  {isNewRegime ? `Saving $${monthlyTaxSavings}/mo` : `+$${monthlyTaxSavings}/mo extra tax`}
                </span>
              </div>
            </div>

            {/* Official Payslip Voucher */}
            <div className="max-w-2xl mx-auto bg-white dark:bg-charcoal-900 rounded-2xl p-6 border border-border dark:border-charcoal-800 shadow-xl space-y-6">
              <div className="flex justify-between items-start pb-4 border-b border-border dark:border-charcoal-800">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-rose-primary" />
                    <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
                      Apex University of Science & Technology
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Official Institutional Salary Voucher • {selectedPayPeriod}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200">
                    DISBURSED
                  </span>
                  <p className="text-[10px] font-mono text-charcoal-400 mt-1">
                    Seal: {verificationHash}
                  </p>
                </div>
              </div>

              {/* Employee Header */}
              <div className="p-3.5 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-charcoal-500">Employee:</span>
                  <p className="font-bold text-charcoal-900 dark:text-ivory-100">{activeStaffForPayroll.name}</p>
                </div>
                <div>
                  <span className="text-charcoal-500">Designation & ID:</span>
                  <p className="font-semibold text-charcoal-800 dark:text-ivory-200">{activeStaffForPayroll.id.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-charcoal-500">Pay Period:</span>
                  <p className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedPayPeriod}</p>
                </div>
                <div>
                  <span className="text-charcoal-500">Tax Regime:</span>
                  <p className="font-bold text-rose-primary">{isNewRegime ? "Sec 115BAC (New)" : "Old Regime"}</p>
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Earnings Column */}
                <div className="space-y-2 p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/30 dark:bg-charcoal-800/30">
                  <h4 className="font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[11px] pb-1 border-b border-border">
                    Gross Earnings
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">Basic Salary:</span>
                    <span className="font-semibold">${basicPay.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">HRA (20%):</span>
                    <span className="font-semibold">${houseRentAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">Dearness Allowance (DA 14%):</span>
                    <span className="font-semibold">${dearnessAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">Special Research Allowance (10%):</span>
                    <span className="font-semibold">${specialAllowance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Total Gross Pay:</span>
                    <span>${grossSalary.toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="space-y-2 p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/30 dark:bg-charcoal-800/30">
                  <h4 className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-[11px] pb-1 border-b border-border">
                    Statutory Deductions
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">Provident Fund (PF 12%):</span>
                    <span className="font-semibold">${providentFund.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">
                      TDS Tax ({isNewRegime ? "New Slab 6.5%" : "Old Slab 9.2%"}):
                    </span>
                    <span className="font-semibold">${taxDeductedAtSource.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-charcoal-600 dark:text-ivory-400">Professional Tax:</span>
                    <span className="font-semibold">${professionalTax}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border font-bold text-rose-600 dark:text-rose-400">
                    <span>Total Deductions:</span>
                    <span>${totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center shadow-md">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold opacity-90">Net Take-Home Salary</p>
                  <p className="text-2xl font-bold mt-0.5">${netPay.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-white text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  Print Payslip
                </button>
              </div>

              {/* Form-16 Section 192 Tax Estimation Summary */}
              <div className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-800/40 text-xs space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-border dark:border-charcoal-700">
                  <span className="font-bold text-charcoal-800 dark:text-ivory-100 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-primary" />
                    Annual Form-16 (Section 192) Tax Summary
                  </span>
                  <span className="font-mono text-[10px] text-emerald-600 font-semibold">TRACES 24Q VALIDATED</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-charcoal-600 dark:text-ivory-300">
                  <div>
                    <span className="text-charcoal-400 block">Annual Gross Pay:</span>
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100">${(grossSalary * 12).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Standard Deduction:</span>
                    <span className="font-semibold text-emerald-600">{isNewRegime ? "$900 (₹75k)" : "$600 (₹50k)"}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Annual TDS Deposited:</span>
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100">${(taxDeductedAtSource * 12).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Form-16 Clearance:</span>
                    <span className="font-semibold text-emerald-600">Part A & B Generated</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 4: BIOMETRIC HARDWARE FLEET & PUNCH SYNC */}
      {activeTab === "biometric" && (
        <div className="space-y-6">
          {/* Hardware Device Fleet Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: "BIO-ZKTECO-01",
                name: "Turnstile A - Main Campus Gate",
                ip: "192.168.10.45",
                mode: "Dual Thumbprint / RFID",
                status: "ONLINE",
                uptime: "99.8%",
                ping: "12ms",
                firmware: "v4.2.1-ent",
              },
              {
                id: "BIO-ESSL-02",
                name: "Turnstile B - Academic Complex North",
                ip: "192.168.10.46",
                mode: "Optical Sensor / Smartcard",
                status: "ONLINE",
                uptime: "99.9%",
                ping: "16ms",
                firmware: "v4.2.1-ent",
              },
              {
                id: "BIO-FACIAL-03",
                name: "Kiosk C - Faculty Admin Wing",
                ip: "192.168.10.48",
                mode: "3D AI Facial Recognition",
                status: "ONLINE",
                uptime: "100%",
                ping: "20ms",
                firmware: "v5.0.0-ai",
              },
            ].map((device) => (
              <div
                key={device.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-primary">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {device.id}
                      </span>
                      <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                        {device.name}
                      </h4>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {device.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border dark:border-charcoal-800">
                  <div>
                    <span className="text-charcoal-400 block">IP Address:</span>
                    <span className="font-mono font-medium text-charcoal-800 dark:text-ivory-200">{device.ip}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Auth Sensor:</span>
                    <span className="font-medium text-charcoal-800 dark:text-ivory-200">{device.mode}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Network Ping:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{device.ping} (Active)</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 block">Hardware Uptime:</span>
                    <span className="font-mono text-charcoal-800 dark:text-ivory-200">{device.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Hardware Punch Simulator & Event Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Punch Trigger Form */}
            <div className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border dark:border-charcoal-800">
                <Fingerprint className="w-5 h-5 text-rose-primary" />
                <div>
                  <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    Hardware Punch Simulator
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Simulate biometric sensor ingress & terminal authentication
                  </p>
                </div>
              </div>

              <form onSubmit={handleSimulatePunch} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Select Faculty / Staff
                  </label>
                  <select
                    value={punchSimulator.staffId}
                    onChange={(e) => setPunchSimulator({ ...punchSimulator, staffId: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    {staffMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Biometric Terminal Device
                  </label>
                  <select
                    value={punchSimulator.terminalId}
                    onChange={(e) => setPunchSimulator({ ...punchSimulator, terminalId: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="BIO-ZKTECO-01">BIO-ZKTECO-01 (Turnstile A - Main Gate)</option>
                    <option value="BIO-ESSL-02">BIO-ESSL-02 (Turnstile B - Academic Complex North)</option>
                    <option value="BIO-FACIAL-03">BIO-FACIAL-03 (Kiosk C - Faculty Admin Wing)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      Sensor Mode
                    </label>
                    <select
                      value={punchSimulator.punchMode}
                      onChange={(e) => setPunchSimulator({ ...punchSimulator, punchMode: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="FINGERPRINT">Thumbprint</option>
                      <option value="RFID_SMARTCARD">RFID Smartcard</option>
                      <option value="FACIAL_3D">3D Face Scan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      Punch Action
                    </label>
                    <select
                      value={punchSimulator.punchType}
                      onChange={(e) => setPunchSimulator({ ...punchSimulator, punchType: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    >
                      <option value="PUNCH_IN">Punch IN (Shift Start)</option>
                      <option value="PUNCH_OUT">Punch OUT (Shift End)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  Simulate Biometric Hardware Punch
                </button>
              </form>
            </div>

            {/* Right: Live Ingress Punch Log */}
            <div className="lg:col-span-2 bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
                <div>
                  <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    Live Hardware Event Stream (Biometric Timekeeping)
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Chronological audit ledger of physical biometric turnstile swipes
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                  {punchesLog.length} Records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase bg-ivory-50 dark:bg-charcoal-800/50 text-charcoal-500 border-b border-border dark:border-charcoal-800">
                    <tr>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Staff Member</th>
                      <th className="p-2.5">Device & Location</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5">Punch Type</th>
                      <th className="p-2.5">Auth Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-charcoal-800">
                    {punchesLog.map((p) => (
                      <tr key={p.id} className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="p-2.5 font-mono text-[11px] text-charcoal-600 dark:text-ivory-300">{p.timestamp}</td>
                        <td className="p-2.5 font-semibold text-charcoal-900 dark:text-ivory-100">{p.staffName}</td>
                        <td className="p-2.5">
                          <span className="font-mono text-[11px] text-rose-primary block">{p.terminalId}</span>
                          <span className="text-[10px] text-charcoal-400">{p.location}</span>
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300">
                            {p.punchMode.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.punchType === "PUNCH_IN"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                          }`}>
                            {p.punchType.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-charcoal-400">{p.token}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: 7th CPC Academic Pay Matrix & Increments */}
      {activeTab === "cpc-matrix" && <CpcIncrementTab />}

      {/* TAB: Income Tax Section 192 TDS Planner & Form 16 Part B */}
      {activeTab === "income-tax" && <IncomeTaxTdsTab />}

      {/* MODAL: Apply Leave */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Staff Leave Application
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  <option value="CASUAL_LEAVE">Casual Leave (CL)</option>
                  <option value="MEDICAL_LEAVE">Medical / Sickness Leave (ML)</option>
                  <option value="EARNED_LEAVE">Earned Annual Leave (EL)</option>
                  <option value="DUTY_LEAVE">Duty Leave (Academic Conference / Paper Presentation / Viva)</option>
                  <option value="STUDY_LEAVE">Study Leave / Sabbatical (Ph.D. / Research)</option>
                  <option value="RESTRICTED_HOLIDAY">Restricted Holiday (RH)</option>
                  <option value="MATERNITY_LEAVE">Maternity / Child Care Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Number of Working Days
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leaveForm.days}
                  onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Reason for Absence
                </label>
                <input
                  type="text"
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="Detail the purpose of leave..."
                />
              </div>

              <div className="p-2.5 rounded-lg bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700 space-y-2">
                <span className="font-semibold text-[11px] text-charcoal-800 dark:text-ivory-200 block">
                  Lecture Substitution & Alternate Class Arrangement (UGC Compliant)
                </span>
                <div>
                  <label className="block text-[10px] text-charcoal-500 mb-0.5">
                    Substitute Faculty Email (Class Handover)
                  </label>
                  <input
                    type="email"
                    value={leaveForm.substituteFacultyEmail || ""}
                    onChange={(e) => setLeaveForm({ ...leaveForm, substituteFacultyEmail: e.target.value })}
                    className="w-full p-1.5 text-xs bg-white dark:bg-charcoal-900 border rounded"
                    placeholder="e.g. sunita.deshmukh@classroom.edu"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-charcoal-500 mb-0.5">
                    Substitution Arrangement Remarks
                  </label>
                  <input
                    type="text"
                    value={leaveForm.substituteRemarks || ""}
                    onChange={(e) => setLeaveForm({ ...leaveForm, substituteRemarks: e.target.value })}
                    className="w-full p-1.5 text-xs bg-white dark:bg-charcoal-900 border rounded"
                    placeholder="e.g. CS-301 Lab Slot delegated to Prof. Sunita"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Staff Profile Dossier */}
      {selectedStaffProfile && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-light flex items-center justify-center font-bold text-sm shadow-inner">
                  {selectedStaffProfile.name.split(" ").map((n: string) => n[0]).slice(-2).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    {selectedStaffProfile.name}
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    ID: {selectedStaffProfile.id} • {selectedStaffProfile.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffProfile(null)}
                className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Official Designation:</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{selectedStaffProfile.designation}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Department Dean / Supervisor:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">Prof. HOD Engineering & Academics</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Official Institutional Email:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedStaffProfile.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Emergency Contact:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-rose-primary" /> +1 (555) 234-8900
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Date of Joining / Tenure:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedStaffProfile.joinedDate}</span>
                </div>
              </div>

              {/* Interactive Status Switcher */}
              <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-charcoal-700 dark:text-ivory-200">
                    Employment Status Workflow:
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {selectedStaffProfile.status}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {(["ACTIVE", "ON_LEAVE", "SABBATICAL", "PROBATION"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        const updated = { ...selectedStaffProfile, status: st };
                        setSelectedStaffProfile(updated);
                        setStaffMembers((prev: any[]) => prev.map((s) => s.id === updated.id ? updated : s));
                        setStatusMessage({ type: "success", text: `Updated ${updated.name}'s status to ${st}` });
                      }}
                      className={`py-1 px-1.5 text-[10px] font-semibold rounded-lg border transition-all text-center ${
                        selectedStaffProfile.status === st
                          ? "bg-rose-primary text-white border-rose-600 shadow-sm"
                          : "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700"
                      }`}
                    >
                      {st.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Financial & Statutory Breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                  <span className="text-charcoal-500 text-[11px] block">Base Pay Scale</span>
                  <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">${selectedStaffProfile.basicPay.toLocaleString()} / mo</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">Tier-1 Academic Scale</span>
                </div>
                <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                  <span className="text-charcoal-500 text-[11px] block">Provident Fund (UAN)</span>
                  <span className="font-bold text-xs font-mono text-charcoal-800 dark:text-ivory-200 block mt-1">UAN-100984210</span>
                  <span className="text-[10px] text-charcoal-400 block mt-0.5">Statutory E-Passbook</span>
                </div>
              </div>

              {/* Direct Hardware Biometric Quick Punch */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-blue-600" /> Biometric Identity: BIO-SYN-{selectedStaffProfile.id.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400">Terminal Synchronized • Ready for Attendance Punch</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString();
                    const newPunch = {
                      id: `pch-${Date.now().toString().slice(-4)}`,
                      staffId: selectedStaffProfile.id,
                      staffName: selectedStaffProfile.name,
                      terminalId: "BIO-ZKTECO-01",
                      location: "Main Gate Turnstile A",
                      punchMode: "FINGERPRINT",
                      punchType: "PUNCH_IN",
                      timestamp: timeStr,
                      token: `BIO-TOKEN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                      status: "AUTHENTICATED",
                    };
                    setPunchesLog([newPunch, ...punchesLog]);
                    setStatusMessage({
                      type: "success",
                      text: `Instant Biometric Punch Recorded for ${selectedStaffProfile.name} at ${timeStr}!`,
                    });
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all"
                >
                  Quick Punch IN
                </button>
              </div>

              {/* Academic & Statutory Governance Actions */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" /> Statutory & Academic Governance (UGC / 7th CPC / DDO)
                  </span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">DDO Verified</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleViewServiceBook(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">e-Service Book</p>
                    <p className="text-[10px] text-charcoal-500">DDO Cryptographic Log</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEvaluateUgcCas(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <Award className="w-3.5 h-3.5 text-purple-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">UGC CAS PBAS</p>
                    <p className="text-[10px] text-charcoal-500">API Scorecard (2018)</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAuditForm12BB(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-purple-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">Form 12BB Proofs</p>
                    <p className="text-[10px] text-charcoal-500">ITR & PAN Audit</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateDaArrears(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">DA Arrears Bill</p>
                    <p className="text-[10px] text-charcoal-500">7th CPC Due-Drawn</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadForm16(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">Form-16 Part A/B</p>
                    <p className="text-[10px] text-charcoal-500">TRACES TDS Certificate</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadNpsScf()}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <Landmark className="w-3.5 h-3.5 text-indigo-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">NSDL NPS Tier-I</p>
                    <p className="text-[10px] text-charcoal-500">PRAN Contrib File</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCalculateGratuity(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <Scale className="w-3.5 h-3.5 text-emerald-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">Gratuity (1972)</p>
                    <p className="text-[10px] text-charcoal-500">Service Vesting Bill</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenNoDues(selectedStaffProfile.id)}
                    className="p-2 text-left bg-white dark:bg-charcoal-800 rounded-lg border border-purple-200 dark:border-purple-800 hover:border-purple-400 transition-all text-xs"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-purple-600 mb-1" />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">Digital No-Dues</p>
                    <p className="text-[10px] text-charcoal-500">7-Dept Offboarding</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSalaryHold(selectedStaffProfile.id, selectedStaffProfile.holdStatus)}
                    className={`p-2 text-left rounded-lg border transition-all text-xs ${
                      selectedStaffProfile.holdStatus === "ON_HOLD"
                        ? "bg-rose-50 border-rose-300 text-rose-800"
                        : "bg-white dark:bg-charcoal-800 border-purple-200 dark:border-purple-800 hover:border-purple-400"
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 mb-1 ${selectedStaffProfile.holdStatus === "ON_HOLD" ? "text-rose-600" : "text-amber-600"}`} />
                    <p className="font-semibold text-[11px] text-charcoal-900 dark:text-ivory-100">
                      {selectedStaffProfile.holdStatus === "ON_HOLD" ? "Release Salary" : "Hold Salary"}
                    </p>
                    <p className="text-[10px] text-charcoal-500">
                      {selectedStaffProfile.holdStatus === "ON_HOLD" ? "ON HOLD (Vigilance)" : "Active (Released)"}
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Profile Slip
              </button>
              <button
                onClick={() => {
                  setSelectedStaffProfile(null);
                  setActiveTab("payroll");
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-rose-primary text-white rounded-xl hover:bg-rose-accent transition-colors"
              >
                Access Payroll & Payslip
              </button>
              <button
                onClick={() => setSelectedStaffProfile(null)}
                className="px-3.5 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200 dark:hover:bg-charcoal-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: e-Service Book (DDO Digital History) */}
      {serviceBookModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Official e-Service Book (DDO Attested)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Staff ID: {serviceBookModal.data?.staffId || "fac-01"} • Cryptographic Audit Trail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setServiceBookModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {serviceBookModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Loading official service record entries...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold">Total Recorded Service Events:</span> {serviceBookModal.data?.count ?? 0}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-100">
                    Rule 288 GFR Compliant
                  </span>
                </div>

                <div className="space-y-2">
                  {(serviceBookModal.data?.entries || []).map((entry: any) => (
                    <div key={entry.id} className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">{entry.actionType.replace(/_/g, " ")}</span>
                        <span className="font-mono text-[10px] text-charcoal-500">{new Date(entry.eventDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-charcoal-700 dark:text-ivory-300">{entry.remarks}</p>
                      <div className="flex justify-between items-center text-[10px] text-charcoal-400 pt-1 border-t border-border/50">
                        <span>Attested By: {entry.attestedBy}</span>
                        <span className="font-mono truncate max-w-[200px]" title={entry.signatureHash}>Seal: {entry.signatureHash}</span>
                      </div>
                    </div>
                  ))}
                  {(!serviceBookModal.data?.entries || serviceBookModal.data?.entries.length === 0) && (
                    <p className="text-center text-charcoal-400 py-4">No e-Service Book entries logged for this employee yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: UGC CAS 2018 PBAS Scorecard */}
      {casModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-primary" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    UGC CAS 2018 Academic Performance Indicator (API)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Staff: {casModal.data?.facultyName} • Stage: {casModal.data?.currentLevel} → {casModal.data?.targetLevel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCasModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {casModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Computing UGC Regulations 2018 PBAS metrics...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  casModal.data?.isEligible
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                    : "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                }`}>
                  <div>
                    <span className="font-bold text-sm block">
                      {casModal.data?.isEligible ? "ELIGIBLE FOR PROMOTION" : "CRITERIA PENDING"}
                    </span>
                    <span className="text-[11px]">
                      Required Score: {casModal.data?.minimumRequiredScore} pts • Total Achieved: {casModal.data?.totalApiScore} pts
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    casModal.data?.isEligible ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                  }`}>
                    {casModal.data?.recommendation}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Category I (Teaching)</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">{casModal.data?.categories?.category1?.score} pts</span>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">{casModal.data?.categories?.category1?.percentage}% classes held</span>
                  </div>
                  <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Category II (Governance)</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">{casModal.data?.categories?.category2?.score} pts</span>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">Exams & Committee Work</span>
                  </div>
                  <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Category III (Research)</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">{casModal.data?.categories?.category3?.score} pts</span>
                    <span className="text-[10px] text-charcoal-400 block mt-0.5">UGC-CARE / Scopus / Grants</span>
                  </div>
                </div>

                {casModal.data?.remarks && casModal.data.remarks.length > 0 && (
                  <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 space-y-1">
                    <span className="font-bold text-charcoal-800 dark:text-ivory-200 block text-[11px]">DDO & Screening Committee Audit Notes:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-charcoal-600 dark:text-ivory-300">
                      {casModal.data.remarks.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: 7th CPC Retroactive DA Arrears Bill */}
      {daArrearsModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    7th CPC Retroactive Dearness Allowance (DA) Arrears
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Staff: {daArrearsModal.data?.staffId || "fac-01"} • Revision: {daArrearsModal.data?.oldDaRate}% → {daArrearsModal.data?.newDaRate}% (+{daArrearsModal.data?.differentialPercentage}%)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDaArrearsModal({ ...daArrearsModal, isOpen: false, data: null })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {daArrearsModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Computing retroactive due-drawn statements...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                    <span className="text-amber-800 dark:text-amber-300 font-semibold block text-[10px]">Gross DA Differential:</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(daArrearsModal.data?.totalGrossArrears || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800">
                    <span className="text-rose-800 dark:text-rose-300 font-semibold block text-[10px]">Statutory PF/NPS Recovery:</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(daArrearsModal.data?.totalPfDeduction || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <span className="text-emerald-800 dark:text-emerald-300 font-semibold block text-[10px]">Net Arrears Payable:</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(daArrearsModal.data?.totalNetArrears || 0).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border border-border dark:border-charcoal-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-ivory-50 dark:bg-charcoal-800 font-semibold text-charcoal-600 dark:text-ivory-300 border-b border-border dark:border-charcoal-700">
                      <tr>
                        <th className="p-2.5">Month</th>
                        <th className="p-2.5">Basic Pay</th>
                        <th className="p-2.5">Drawn DA</th>
                        <th className="p-2.5">Due DA</th>
                        <th className="p-2.5">Diff</th>
                        <th className="p-2.5">PF Deduct</th>
                        <th className="p-2.5 text-right">Net Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-charcoal-800">
                      {(daArrearsModal.data?.monthlyBreakdown || []).map((m: any) => (
                        <tr key={m.month}>
                          <td className="p-2.5 font-medium">{m.month}</td>
                          <td className="p-2.5">₹{m.basicPay.toLocaleString()}</td>
                          <td className="p-2.5">₹{m.drawnDa.toLocaleString()}</td>
                          <td className="p-2.5">₹{m.dueDa.toLocaleString()}</td>
                          <td className="p-2.5 font-semibold text-amber-600">₹{m.differentialDa.toLocaleString()}</td>
                          <td className="p-2.5 text-rose-600">₹{m.pfDeduction.toLocaleString()}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-600">₹{m.netPayable.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Host-to-Host Corporate Banking Direct Payout */}
      {h2hModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Host-to-Host (H2H) Corporate Banking Payout
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Direct SFTP/API Disbursement • Maker-Checker 2FA Clearance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setH2hModal({ ...h2hModal, isOpen: false, result: null })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {h2hModal.result ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Corporate Batch Disbursed Successfully!
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div><span className="font-semibold">Batch Reference:</span> {h2hModal.result.batchReferenceId}</div>
                    <div><span className="font-semibold">Total Amount:</span> ₹{h2hModal.result.totalDisbursed?.toLocaleString()}</div>
                    <div><span className="font-semibold">Bank Channel:</span> {h2hModal.result.channel}</div>
                    <div><span className="font-semibold">Transactions Executed:</span> {h2hModal.result.transactions?.length || 0}</div>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border dark:border-charcoal-800 rounded-xl p-2">
                  {(h2hModal.result.transactions || []).map((t: any) => (
                    <div key={t.staffId} className="flex justify-between items-center p-2 rounded bg-ivory-50 dark:bg-charcoal-800 text-[11px]">
                      <div>
                        <span className="font-semibold">{t.staffName}</span>
                        <span className="text-charcoal-400 block font-mono text-[10px]">UTR: {t.utrNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">₹{t.amount.toLocaleString()}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 block mt-0.5">{t.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 space-y-1">
                  <span className="font-bold">Dual-Control Governance Protocol:</span>
                  <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                    Disbursement requires both Maker (DDO) initiation and Checker (Registrar) authorization with a hardware OTP token.
                  </p>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">Maker ID (DDO):</label>
                    <input
                      type="text"
                      value={h2hModal.makerId}
                      onChange={(e) => setH2hModal({ ...h2hModal, makerId: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">Checker ID (Registrar):</label>
                    <input
                      type="text"
                      value={h2hModal.checkerId}
                      onChange={(e) => setH2hModal({ ...h2hModal, checkerId: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">Dual-Factor OTP Token:</label>
                    <input
                      type="text"
                      value={h2hModal.otp}
                      onChange={(e) => setH2hModal({ ...h2hModal, otp: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => setH2hModal({ ...h2hModal, isOpen: false })}
                    className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={h2hModal.loading}
                    onClick={() => handleProcessH2HDirectPayout()}
                    className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    {h2hModal.loading ? "Transmitting to Bank..." : "Authorize & Disburse Payout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: Form 12BB Statutory Proof Audit */}
      {form12bbModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Form 12BB Statutory Proof Verification
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Staff: {form12bbModal.data?.staffId || "fac-01"} • Assessment Year: {form12bbModal.data?.assessmentYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setForm12bbModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {form12bbModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Auditing investment proofs and PAN compliance...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  form12bbModal.data?.panMandatoryBreach
                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                    : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                }`}>
                  <div>
                    <span className="font-bold text-sm block">
                      {form12bbModal.data?.panMandatoryBreach ? "COMPLIANCE BREACH" : "AUDIT VERIFIED"}
                    </span>
                    <span className="text-[11px]">
                      {form12bbModal.data?.panMandatoryBreach
                        ? "HRA Rent exceeds ₹1,00,000 without valid Landlord PAN"
                        : "All Section 80C, 80D, and HRA proofs within limits"}
                    </span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    form12bbModal.data?.panMandatoryBreach ? "bg-rose-600 text-white" : "bg-emerald-600 text-white"
                  }`}>
                    {form12bbModal.data?.auditStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Section 80C Allowed</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(form12bbModal.data?.deductions?.section80C || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-charcoal-400 block">Cap: ₹1,50,000</span>
                  </div>
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Section 80D Mediclaim</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(form12bbModal.data?.deductions?.section80D || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-charcoal-400 block">Cap: ₹25,000</span>
                  </div>
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Section 24(b) Home Loan Interest</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{(form12bbModal.data?.deductions?.section24b || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-charcoal-400 block">Cap: ₹2,00,000</span>
                  </div>
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
                    <span className="text-charcoal-500 text-[10px] block font-semibold">Audited Taxable Income</span>
                    <span className="font-bold text-base text-emerald-600">₹{(form12bbModal.data?.taxableIncomeAudited || 0).toLocaleString()}</span>
                    <span className="text-[10px] text-charcoal-400 block">Tax Rebate Applied</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 6: ESIC & 24Q Statutory Returns (Phase A) */}
      {esicModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    ESIC & Form 24Q Statutory Compliance (Phase A)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Employees State Insurance Act 1948 • Monthly Challan & NSDL 24Q
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEsicModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {esicModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Loading statutory returns data...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 flex justify-between items-center">
                  <div>
                    <span className="font-bold">Total Eligible IP Workers:</span> {esicModal.data?.eligibleCount ?? 3}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-200 dark:bg-teal-900 text-teal-800 dark:text-teal-100">
                    Statutory Rate: 0.75% IP + 3.25% Employer
                  </span>
                </div>

                <div className="space-y-2">
                  {(esicModal.data?.computations || []).slice(0, 6).map((c: any) => (
                    <div key={c.employeeId} className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-charcoal-900 dark:text-ivory-100">{c.employeeName}</p>
                        <p className="text-[10px] text-charcoal-500 font-mono">IP: {c.ipNumber} • Wages: ₹{c.monthlyGrossWage.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isEligible ? "bg-emerald-100 text-emerald-800" : "bg-charcoal-200 text-charcoal-600"}`}>
                          {c.isEligible ? `Contr: ₹${c.totalContribution}` : "Exempt (> ₹21,000)"}
                        </span>
                        <p className="text-[9px] text-charcoal-400 mt-0.5">Emp: ₹{c.employeeContribution} | Emplyr: ₹{c.employerContribution}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <a
                    href="/api/hr/payroll?action=ESIC_CHALLAN&format=TXT"
                    className="px-3.5 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download ESIC Challan TXT
                  </a>
                  <button
                    onClick={() => setEsicModal({ isOpen: false, data: null, loading: false })}
                    className="px-3 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 7: 200-Point Reservation Roster & UGC Table 3A (Phase B) */}
      {rosterModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    200-Point Reservation Roster & UGC Table 3A (Phase B)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    DoPT Post-Based Roster Cycle • Direct Recruitment Shortlisting Matrix
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRosterModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {rosterModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Loading 200-point roster audit...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center text-blue-900 dark:text-blue-200">
                  <div>
                    <span className="font-bold">Next Vacancy Point:</span> Point #{rosterModal.data?.rosterReport?.nextRosterPoint}
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-600 text-white">
                    Designated Quota: {rosterModal.data?.rosterReport?.designatedCategoryForNextPost}
                  </span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300">
                      <tr>
                        <th className="p-2.5">Point #</th>
                        <th className="p-2.5">Category Designation</th>
                        <th className="p-2.5">Statutory Reservation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(rosterModal.data?.rosterReport?.rosterPreview || []).slice(0, 10).map((r: any) => (
                        <tr key={r.rosterPoint} className={r.rosterPoint === rosterModal.data?.rosterReport?.nextRosterPoint ? "bg-blue-50/80 font-bold" : ""}>
                          <td className="p-2.5 font-mono">Point {r.rosterPoint}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.category === "SC" ? "bg-purple-100 text-purple-800" :
                              r.category === "ST" ? "bg-amber-100 text-amber-800" :
                              r.category === "OBC" ? "bg-emerald-100 text-emerald-800" :
                              r.category === "EWS" ? "bg-indigo-100 text-indigo-800" : "bg-charcoal-100 text-charcoal-700"
                            }`}>
                              {r.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-charcoal-500">{r.isReserved ? "Reserved Category Vacancy" : "Unreserved (Open)"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => setRosterModal({ isOpen: false, data: null, loading: false })}
                    className="px-3 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: Digital Multi-Department No-Dues Clearance (Phase C) */}
      {noDuesModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Digital 7-Department No-Dues Clearance (Phase C)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Staff: {noDuesModal.data?.noDues?.employeeName} ({noDuesModal.data?.noDues?.department})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNoDuesModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {noDuesModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Loading clearance status...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 flex justify-between items-center text-purple-900 dark:text-purple-200">
                  <div>
                    <span className="font-bold">Clearance Tracking ID:</span> {noDuesModal.data?.noDues?.id}
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-600 text-white">
                    Status: {noDuesModal.data?.noDues?.overallStatus}
                  </span>
                </div>

                <div className="space-y-2">
                  {Object.entries(noDuesModal.data?.noDues?.checkpoints || {}).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700 flex justify-between items-center">
                      <div>
                        <p className="font-bold capitalize text-charcoal-900 dark:text-ivory-100">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-[11px] text-charcoal-500">{val.remarks}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${val.cleared ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {val.cleared ? "CLEARED" : "PENDING"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => setNoDuesModal({ isOpen: false, data: null, loading: false })}
                    className="px-3 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 9: Payment of Gratuity Act 1972 Settlement (Phase A) */}
      {gratuityModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Payment of Gratuity Act, 1972 (Phase A)
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Statutory Superannuation / Relieving Settlement Bill
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGratuityModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {gratuityModal.loading ? (
              <div className="p-8 text-center text-charcoal-500 text-xs">Computing gratuity entitlement...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-emerald-900 dark:text-emerald-200">
                  <div>
                    <span className="font-bold">Total Service Completed:</span> {gratuityModal.data?.serviceYearsCompleted} Years
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold ${gratuityModal.data?.isEligible ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
                    {gratuityModal.data?.isEligible ? "ELIGIBLE" : "VESTING PENDING (< 5 Yrs)"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border">
                    <span className="text-charcoal-500 text-[10px] block">Wage Base (Last Basic + DA)</span>
                    <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">₹{gratuityModal.data?.monthlyWageBase?.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border">
                    <span className="text-charcoal-500 text-[10px] block">Payable Gratuity</span>
                    <span className="font-bold text-base text-emerald-600">₹{gratuityModal.data?.payableGratuity?.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-charcoal-500 font-mono p-2.5 bg-ivory-50 dark:bg-charcoal-800 rounded-lg border border-border">
                  Formula: {gratuityModal.data?.formula}
                </p>

                <div className="flex justify-end pt-2 border-t border-border">
                  <button
                    onClick={() => setGratuityModal({ isOpen: false, data: null, loading: false })}
                    className="px-3 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
