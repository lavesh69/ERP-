"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useApp } from "@/context/AppContext";
import {
  Building,
  Bed,
  Users,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Send,
  Calendar,
  Sparkles,
  Search,
  QrCode,
  Activity,
  Leaf,
  Scale,
  Moon,
  Wrench,
  Receipt,
  X,
  Download,
  Printer,
  FileText,
  Trash2,
  Eye,
  LogOut,
  ShieldCheck,
  ArrowRightLeft,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { NightRollCallView } from "@/components/hostel/NightRollCallView";
import HostelAssetAuditTab from "@/components/hostel/HostelAssetAuditTab";
import MessRebateTab from "@/components/hostel/MessRebateTab";
import HostelTransfersTab from "@/components/hostel/HostelTransfersTab";
import HostelMaintenanceTab from "@/components/hostel/HostelMaintenanceTab";
import HostelVisitorsTab from "@/components/hostel/HostelVisitorsTab";
import HostelWaitlistTab from "@/components/hostel/HostelWaitlistTab";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";

interface HostelSummary {
  totalBlocks: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  pendingGatePasses: number;
  activeMessSubscribers: number;
  blocks: any[];
}

export default function HostelPage() {
  const { currentUser, currentRole, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    | "matrix"
    | "allocations"
    | "transfers"
    | "maintenance"
    | "visitors"
    | "waitlist"
    | "gatepass"
    | "mess"
    | "mess-rebate"
    | "night-rollcall"
    | "asset-audit"
  >("matrix");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HostelSummary | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [messPlans, setMessPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("all");

  // Mess Biometric State
  const [punchedMeals, setPunchedMeals] = useState<any[]>([
    {
      id: "tok-101",
      studentRoll: "CS2026-001",
      studentName: "Alex Rivera",
      plan: "All-Access Premium Buffet",
      mealType: "Dinner (Executive)",
      timestamp: "Just now",
      lane: "Turnstile Gate #02 (Optical)",
      tokenHash: "0x89f4b...3e1a",
    },
    {
      id: "tok-102",
      studentRoll: "ME2025-042",
      studentName: "Priya Sharma",
      plan: "South Indian Vegetarian",
      mealType: "Dinner (Executive)",
      timestamp: "3 mins ago",
      lane: "Turnstile Gate #01 (Biometric)",
      tokenHash: "0x12c8a...9f00",
    },
    {
      id: "tok-103",
      studentRoll: "EE2024-019",
      studentName: "Marcus Vance",
      plan: "Continental & Halal Fusion",
      mealType: "Dinner (Executive)",
      timestamp: "7 mins ago",
      lane: "Turnstile Gate #03 (RFID Card)",
      tokenHash: "0x44d1e...bc27",
    },
  ]);
  const [hasPunchedThisSession, setHasPunchedThisSession] = useState(false);
  const [diningHeadcount, setDiningHeadcount] = useState(384);

  // SDG-12 Food Waste Tracker State
  const [wasteLogs, setWasteLogs] = useState([
    { id: "w-1", session: "Dinner (Yesterday)", preparedKg: 340, consumedKg: 318, wastedKg: 22, residents: 410, divertedToBiogas: true },
    { id: "w-2", session: "Breakfast (Today)", preparedKg: 210, consumedKg: 198, wastedKg: 12, residents: 380, divertedToBiogas: true },
    { id: "w-3", session: "Lunch (Today)", preparedKg: 360, consumedKg: 334, wastedKg: 26, residents: 395, divertedToBiogas: true },
  ]);
  const [wasteInput, setWasteInput] = useState({
    session: "Dinner (Today)",
    preparedKg: 350,
    consumedKg: 328,
    residents: 384,
  });

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const wasted = Math.max(0, Number(wasteInput.preparedKg) - Number(wasteInput.consumedKg));
    const optimisticEntry = {
      id: `w-${Date.now()}`,
      session: wasteInput.session,
      preparedKg: Number(wasteInput.preparedKg),
      consumedKg: Number(wasteInput.consumedKg),
      wastedKg: wasted,
      residents: Number(wasteInput.residents) || 1,
      divertedToBiogas: true,
    };
    setWasteLogs((prev) => [optimisticEntry, ...prev]);
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_FOOD_WASTE",
          session: wasteInput.session,
          preparedKg: wasteInput.preparedKg,
          consumedKg: wasteInput.consumedKg,
          residents: wasteInput.residents,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to persist waste log");
      showToast(`Logged ${wasted} kg kitchen surplus for ${wasteInput.session}. 100% diverted to campus anaerobic digester.`, "success");
      if (data.log) {
        setWasteLogs((prev) => [data.log, ...prev.filter((w) => w.id !== optimisticEntry.id)]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to log food waste", "error");
    }
  };

  // Search & Filtering State
  const [allocSearch, setAllocSearch] = useState("");
  const [allocBlockFilter, setAllocBlockFilter] = useState("all");
  const [allocFeeFilter, setAllocFeeFilter] = useState("all");
  const [passSearch, setPassSearch] = useState("");
  const [passStatusFilter, setPassStatusFilter] = useState("ALL");

  // No-Dues Clearance Voucher Modal State
  const [viewingNoDuesRecord, setViewingNoDuesRecord] = useState<{ room: any; bed: any } | null>(null);

  // New Gate Pass Form
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({
    studentName: currentUser?.fullName || "",
    studentRoll: (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || "CS2026-001",
    roomNumber: "A-101",
    blockName: "Nelson Mandela Hall (Block A)",
    reason: "",
    destination: "",
    departureTime: "",
    expectedReturnTime: "",
    emergencyContact: "+1 (555) 000-0000",
    parentConsentVerified: true,
  });

  // Bed Allocation Form
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    roomId: "",
    bedNumber: "A",
    studentName: "",
    studentRoll: "",
    branch: "Computer Science & Engineering",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, roomsRes, passRes, messRes] = await Promise.all([
        fetch("/api/hostel?tab=summary"),
        fetch("/api/hostel?tab=rooms"),
        fetch("/api/hostel?tab=gate-passes"),
        fetch("/api/hostel?tab=mess"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        setRooms(rData.rooms || []);
      }
      if (passRes.ok) {
        const pData = await passRes.json();
        setGatePasses(pData.passes || []);
      }
      if (messRes.ok) {
        const mData = await messRes.json();
        setMessPlans(mData.plans || []);
        setSubscriptions(mData.subscriptions || []);
        if (mData.punchedMeals && Array.isArray(mData.punchedMeals)) {
          setPunchedMeals(mData.punchedMeals);
        }
        if (mData.wasteLogs && Array.isArray(mData.wasteLogs)) {
          setWasteLogs(mData.wasteLogs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch hostel data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showPassModal || showAllocateModal || !!viewingNoDuesRecord;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPassModal(false);
        setShowAllocateModal(false);
        setViewingNoDuesRecord(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showPassModal, showAllocateModal, viewingNoDuesRecord]);

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_GATE_PASS",
          ...passForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit gate pass");
      showToast("Outpass submitted successfully! Warden notified.", "success");
      setShowPassModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleProcessPass = async (passId: string, passAction: "APPROVE" | "REJECT" | "CHECK_OUT" | "RETURN") => {
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_GATE_PASS",
          passId,
          passAction,
          remarks: `Action recorded by ${currentUser?.fullName || "Authority"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      showToast(data.message, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ALLOCATE_BED",
          ...allocateForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bed allocation failed");
      showToast(data.message, "success");
      setShowAllocateModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleVacateBed = async (roomId: string, bedNumber: string, studentRoll?: string) => {
    if (!confirm(`Are you sure you want to vacate Bed ${bedNumber} in this room? The resident will be checked out and the bed released to available inventory.`)) {
      return;
    }
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VACATE_BED",
          roomId,
          bedNumber,
          studentRoll,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to vacate bed");
      showToast(data.message || `Bed ${bedNumber} vacated and released to available inventory!`, "success");
      if (viewingNoDuesRecord) {
        setViewingNoDuesRecord(null);
      }
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to vacate bed", "error");
    }
  };

  const handleExportAllocationsCsv = () => {
    const allocatedList = rooms.flatMap((r) =>
      r.beds
        .filter((b: any) => b.isOccupied)
        .map((b: any) => ({
          studentName: b.studentName || "",
          studentRoll: b.studentRoll || "",
          blockName: r.blockName || "",
          roomNumber: r.roomNumber || "",
          bedNumber: b.bedNumber || "",
          branch: b.branch || "General Program",
          allocatedDate: b.allocatedDate || "2026-08-01",
          feeStatus: b.feeStatus || "PAID",
        }))
    );

    if (allocatedList.length === 0) {
      showToast("No active bed allocations to export.", "error");
      return;
    }

    const headers = ["Student Name", "Roll Number", "Block", "Room", "Bed", "Academic Branch", "Allotted Date", "Fee Status"];
    const rows = allocatedList.map((item) => [
      `"${item.studentName.replace(/"/g, '""')}"`,
      `"${item.studentRoll.replace(/"/g, '""')}"`,
      `"${item.blockName.replace(/"/g, '""')}"`,
      `"${item.roomNumber}"`,
      `"${item.bedNumber}"`,
      `"${item.branch.replace(/"/g, '""')}"`,
      `"${item.allocatedDate}"`,
      `"${item.feeStatus}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_bed_allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Bed allocations registry exported to CSV.", "success");
  };

  const handleExportGatePassCsv = () => {
    if (gatePasses.length === 0) {
      showToast("No gate pass records to export.", "error");
      return;
    }

    const headers = ["Pass Number", "Student Name", "Roll Number", "Block", "Room", "Destination", "Reason", "Departure Time", "Return Time", "Status", "Parent Consent Verified", "Emergency Contact"];
    const rows = gatePasses.map((pass) => [
      `"${pass.passNumber || ""}"`,
      `"${(pass.studentName || "").replace(/"/g, '""')}"`,
      `"${pass.studentRoll || ""}"`,
      `"${(pass.blockName || "").replace(/"/g, '""')}"`,
      `"${pass.roomNumber || ""}"`,
      `"${(pass.destination || "").replace(/"/g, '""')}"`,
      `"${(pass.reason || "").replace(/"/g, '""')}"`,
      `"${pass.departureTime || ""}"`,
      `"${pass.expectedReturnTime || ""}"`,
      `"${pass.status || ""}"`,
      `"${pass.parentConsentVerified ? "YES" : "NO"}"`,
      `"${pass.emergencyContact || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostel_gate_passes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Gate passes log exported to CSV.", "success");
  };

  const handleSubscribeMess = async (planId: string) => {
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBSCRIBE_MESS",
          studentId: currentUser?.id || "stu-alex-01",
          studentName: currentUser?.fullName || "Alex Mercer",
          studentRoll: (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber || "CS2026-001",
          planId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mess subscription failed");
      showToast("Mess plan subscription updated!", "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleBiometricPunch = async () => {
    if (hasPunchedThisSession) {
      showToast("Double-Punch Lockout Active: You have already punched your meal token for this dining session.", "error");
      return;
    }
    const resolvedRoll =
      (currentUser as any)?.studentRollNumber ||
      (currentUser as any)?.rollNo ||
      (currentUser as any)?.rollNumber ||
      currentUser?.email?.split("@")[0] ||
      "STU-2026";
    const resolvedName = currentUser?.fullName || "Student Scholar";

    const optimisticPunch = {
      id: `tok-${Date.now()}`,
      studentRoll: resolvedRoll,
      studentName: resolvedName,
      plan: "All-Access Premium Buffet",
      mealType: "Dinner (Executive)",
      timestamp: "Just now",
      lane: "Turnstile Gate #01 (Biometric Optical)",
      tokenHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setPunchedMeals((prev) => [optimisticPunch, ...prev]);
    setHasPunchedThisSession(true);
    setDiningHeadcount((prev) => prev + 1);

    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUNCH_MEAL",
          studentRoll: resolvedRoll,
          studentName: resolvedName,
          plan: "All-Access Premium Buffet",
          mealType: "Dinner (Executive)",
          lane: "Turnstile Gate #01 (Biometric Optical)",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Biometric validation failed");
      showToast("Biometric Turnstile Token Validated! Meal voucher deducted & barrier opened.", "success");
      if (data.punch) {
        setPunchedMeals((prev) => [data.punch, ...prev.filter((p) => p.id !== optimisticPunch.id)]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to validate meal punch", "error");
    }
  };

  const filteredRooms = selectedBlockId === "all" ? rooms : rooms.filter((r) => r.blockId === selectedBlockId);

  return (
    <AppShell>
      <Breadcrumbs />
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header - Unified Classroom Academic OS Design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <Bed className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  Residence Life & Housing ERP
                </span>
                <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  Active Term 2026-27
                </span>
              </div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Hostel & Dormitory Management
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Real-time room matrix, bi-directional warden gate pass approval, biometric mess subscriptions, and residential welfare oversight.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPassModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all shadow-xs"
            >
              <Send className="w-4 h-4 text-rose-primary dark:text-rose-accent" />
              <span>Request Outpass</span>
            </button>
            <button
              onClick={() => setShowAllocateModal(true)}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Allocate Bed</span>
            </button>
          </div>
        </div>

        {/* 4-Card KPI Telemetry Strip - Matching Main App Design */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Total Capacity
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                  {summary.totalBeds} Beds
                </h3>
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
                  {summary.totalRooms} Rooms • {summary.totalBlocks} Blocks
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Occupancy Rate
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {summary.occupancyRate}%
                </h3>
                <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
                  {summary.occupiedBeds} Occupied / {summary.availableBeds} Vacant
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Bed className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Pending Outpasses
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {summary.pendingGatePasses}
                </h3>
                <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
                  Awaiting Warden Clearance
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Mess Dining
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                  {summary.activeMessSubscribers}
                </h3>
                <span className="badge-subtle bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 mt-1 inline-block">
                  Active Meal Subscriptions
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                <Utensils className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Clean Unified Pills Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-soft/60 dark:bg-charcoal-900 border border-border/80 dark:border-charcoal-800 overflow-x-auto no-scrollbar">
          {[
            { id: "matrix", label: "Room Matrix & Layout", icon: Building },
            { id: "allocations", label: "Bed Allocation Registry", icon: Bed },
            { id: "transfers", label: "Room Transfers & Bed Swaps", icon: ArrowRightLeft },
            { id: "maintenance", label: "Dorm Maintenance & Repairs", icon: Wrench },
            { id: "visitors", label: "Visitor & Guest Register", icon: UserCheck },
            { id: "waitlist", label: "Housing Waitlist Queue", icon: ClipboardList },
            { id: "gatepass", label: "Gate Pass & Night Outpass", icon: Clock, count: summary?.pendingGatePasses },
            { id: "mess", label: "Dining & Mess Management", icon: Utensils },
            { id: "mess-rebate", label: "Mess Diet Rebates & Meal Tokens", icon: Receipt },
            { id: "night-rollcall", label: "Night Curfew Roll-Call (21:30)", icon: Moon },
            { id: "asset-audit", label: "Room Inventory & Deposit Clearance", icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm border border-border/50 dark:border-charcoal-700"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-rose-primary dark:text-rose-accent" : "text-charcoal-500 dark:text-charcoal-400"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-container text-rose-primary dark:bg-rose-dark/40 dark:text-rose-accent">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      {/* TAB 1: ROOM MATRIX & LAYOUT */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Block Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal-500" />
              <span className="text-sm font-medium text-charcoal-700 dark:text-ivory-300">Filter by Block:</span>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="text-sm bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Residence Halls (Total {rooms.length} Rooms)</option>
                {summary?.blocks.map((blk) => (
                  <option key={blk.id} value={blk.id}>
                    {blk.name} ({blk.stats.occupancyRate}% Full)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs text-charcoal-600 dark:text-ivory-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Vacant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Partially Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Full
              </span>
            </div>
          </div>

          {/* Rooms Grid */}
          {filteredRooms.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No Rooms Found"
              description="No residence rooms match your selected block filter."
              actionLabel="Show All Blocks"
              onAction={() => setSelectedBlockId("all")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRooms.map((room) => {
              const statusBadgeColor =
                room.status === "VACANT"
                  ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                  : room.status === "PARTIALLY_OCCUPIED"
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200"
                  : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200";

              return (
                <div
                  key={room.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">{room.roomNumber}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadgeColor}`}>
                          {room.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 dark:text-ivory-400 mt-0.5">
                        {room.blockName} • Floor {room.floor}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 rounded-md">
                      {room.roomType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Bed Breakdown */}
                  <div className="mt-4 space-y-2 border-t border-border dark:border-charcoal-800 pt-3">
                    <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                      Beds ({room.occupiedCount}/{room.capacity} Occupied)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {room.beds.map((bed: any) => (
                        <div
                          key={bed.id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                            bed.isOccupied
                              ? "bg-ivory-50 dark:bg-charcoal-800/60 border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-200"
                              : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Bed {bed.bedNumber}</span>
                            {bed.isOccupied ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">VACANT</span>
                            )}
                          </div>
                          {bed.isOccupied ? (
                            <div className="mt-1 flex flex-col justify-between flex-1">
                              <div>
                                <p className="font-semibold truncate">{bed.studentName}</p>
                                <p className="text-[10px] text-charcoal-500 dark:text-ivory-400">{bed.studentRoll}</p>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-border/50 dark:border-charcoal-700/60 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => setViewingNoDuesRecord({ room, bed })}
                                  className="text-[10px] text-rose-primary dark:text-rose-light hover:underline font-semibold flex items-center gap-0.5"
                                  title="View No Dues Clearance Voucher"
                                >
                                  <FileText className="w-3 h-3" />
                                  Voucher
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleVacateBed(room.id, bed.bedNumber, bed.studentRoll)}
                                  className="text-[10px] text-charcoal-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold transition-colors flex items-center gap-0.5"
                                  title="Vacate Bed"
                                >
                                  <LogOut className="w-3 h-3" />
                                  Vacate
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAllocateForm({
                                  ...allocateForm,
                                  roomId: room.id,
                                  bedNumber: bed.bedNumber,
                                });
                                setShowAllocateModal(true);
                              }}
                              className="mt-1 text-left text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              + Assign Student
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-border dark:border-charcoal-800">
                    {room.amenities.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: BED ALLOCATIONS REGISTRY */}
      {activeTab === "allocations" && (() => {
        const allAllocatedBeds = rooms.flatMap((r) =>
          r.beds
            .filter((b: any) => b.isOccupied)
            .map((b: any) => ({ room: r, bed: b }))
        );

        const filteredAllocatedBeds = allAllocatedBeds.filter(({ room, bed }) => {
          if (allocBlockFilter !== "all" && room.blockId !== allocBlockFilter) return false;
          if (allocFeeFilter !== "all" && (bed.feeStatus || "PAID") !== allocFeeFilter) return false;
          if (allocSearch.trim()) {
            const q = allocSearch.toLowerCase();
            const matchName = bed.studentName?.toLowerCase().includes(q);
            const matchRoll = bed.studentRoll?.toLowerCase().includes(q);
            const matchRoom = room.roomNumber?.toLowerCase().includes(q);
            const matchBranch = bed.branch?.toLowerCase().includes(q);
            if (!matchName && !matchRoll && !matchRoom && !matchBranch) return false;
          }
          return true;
        });

        return (
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border dark:border-charcoal-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Active Student Residence Allocations
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                  Official institutional bed records with fee ledger reconciliation &amp; statutory vacate clearances
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAllocationsCsv}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-container/50 border border-border dark:border-charcoal-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-rose-primary" />
                  <span>Export (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(true)}
                  className="btn-primary-glow px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-primary text-white hover:bg-rose-dark transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Allocation</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-4 bg-ivory-50/60 dark:bg-charcoal-850/40 border-b border-border dark:border-charcoal-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={allocSearch}
                  onChange={(e) => setAllocSearch(e.target.value)}
                  placeholder="Search by student name, roll number, room, or branch..."
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-primary"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-charcoal-800 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700">
                  <span className="text-[11px] text-charcoal-500 font-medium">Block:</span>
                  <select
                    value={allocBlockFilter}
                    onChange={(e) => setAllocBlockFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-charcoal-800 dark:text-ivory-200 focus:outline-none"
                  >
                    <option value="all">All Residence Blocks</option>
                    {summary?.blocks.map((blk) => (
                      <option key={blk.id} value={blk.id}>
                        {blk.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-charcoal-800 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700">
                  <span className="text-[11px] text-charcoal-500 font-medium">Fee:</span>
                  <select
                    value={allocFeeFilter}
                    onChange={(e) => setAllocFeeFilter(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-charcoal-800 dark:text-ivory-200 focus:outline-none"
                  >
                    <option value="all">All Fee Statuses</option>
                    <option value="PAID">PAID</option>
                    <option value="PENDING">PENDING</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                  <tr>
                    <th className="p-3.5">Student / Roll</th>
                    <th className="p-3.5">Block / Room</th>
                    <th className="p-3.5">Bed</th>
                    <th className="p-3.5">Academic Branch</th>
                    <th className="p-3.5">Allocated On</th>
                    <th className="p-3.5">Fee Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-charcoal-800">
                  {filteredAllocatedBeds.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8">
                        <EmptyState
                          icon={Bed}
                          title="No Bed Allocations Found"
                          description={
                            allocSearch || allocBlockFilter !== "all" || allocFeeFilter !== "all"
                              ? "No active room allocations match your search criteria."
                              : "There are currently no active room allocations recorded in the registry."
                          }
                          actionLabel={allocSearch || allocBlockFilter !== "all" || allocFeeFilter !== "all" ? "Clear Filters" : "Allocate Bed"}
                          onAction={() => {
                            if (allocSearch || allocBlockFilter !== "all" || allocFeeFilter !== "all") {
                              setAllocSearch("");
                              setAllocBlockFilter("all");
                              setAllocFeeFilter("all");
                            } else {
                              setShowAllocateModal(true);
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredAllocatedBeds.map(({ room, bed }) => (
                      <tr key={bed.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="p-3.5">
                          <p className="font-semibold text-charcoal-900 dark:text-ivory-100">{bed.studentName}</p>
                          <p className="text-[11px] text-charcoal-500">{bed.studentRoll}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-charcoal-900 dark:text-ivory-200">{room.roomNumber}</p>
                          <p className="text-[11px] text-charcoal-500">{room.blockName}</p>
                        </td>
                        <td className="p-3.5 font-bold text-rose-primary dark:text-rose-light">
                          Bed {bed.bedNumber}
                        </td>
                        <td className="p-3.5 text-charcoal-600 dark:text-ivory-300">
                          {bed.branch || "General Program"}
                        </td>
                        <td className="p-3.5 text-charcoal-500">
                          {bed.allocatedDate || "2026-08-01"}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              (bed.feeStatus || "PAID") === "PAID"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                                : (bed.feeStatus || "PAID") === "PENDING"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200"
                                : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200"
                            }`}
                          >
                            {bed.feeStatus || "PAID"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingNoDuesRecord({ room, bed })}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-rose-primary hover:bg-rose-container/50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center gap-1"
                              title="View and print official No Dues Clearance Voucher"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>No Dues Voucher</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleVacateBed(room.id, bed.bedNumber, bed.studentRoll)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-charcoal-700 dark:text-ivory-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 transition-colors flex items-center gap-1"
                              title="Vacate Bed and release occupancy"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>Vacate</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* TAB: ROOM TRANSFERS & SWAPS */}
      {activeTab === "transfers" && (
        <HostelTransfersTab rooms={rooms} onRefresh={fetchData} />
      )}

      {/* TAB: DORM MAINTENANCE & REPAIRS */}
      {activeTab === "maintenance" && (
        <HostelMaintenanceTab blocks={summary?.blocks || []} rooms={rooms} onRefresh={fetchData} />
      )}

      {/* TAB: VISITOR & GUEST REGISTER */}
      {activeTab === "visitors" && (
        <HostelVisitorsTab rooms={rooms} onRefresh={fetchData} />
      )}

      {/* TAB: HOUSING WAITLIST QUEUE */}
      {activeTab === "waitlist" && (
        <HostelWaitlistTab blocks={summary?.blocks || []} onRefresh={fetchData} />
      )}

      {/* TAB 3: GATE PASS & OUTPASS */}
      {activeTab === "gatepass" && (() => {
        const filteredGatePasses = gatePasses.filter((pass) => {
          if (passStatusFilter !== "ALL" && pass.status !== passStatusFilter) return false;
          if (passSearch.trim()) {
            const q = passSearch.toLowerCase();
            const matchName = pass.studentName?.toLowerCase().includes(q);
            const matchRoll = pass.studentRoll?.toLowerCase().includes(q);
            const matchDest = pass.destination?.toLowerCase().includes(q);
            const matchReason = pass.reason?.toLowerCase().includes(q);
            const matchPass = pass.passNumber?.toLowerCase().includes(q);
            if (!matchName && !matchRoll && !matchDest && !matchReason && !matchPass) return false;
          }
          return true;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Warden Digital Outpass &amp; Leave Gate
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                  Real-time security check-in/out, biometric turnstile authorization, and parental emergency consent
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportGatePassCsv}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-container/50 border border-border dark:border-charcoal-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-rose-primary" />
                  <span>Export (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassModal(true)}
                  className="btn-primary-glow px-4 py-2 bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Outpass</span>
                </button>
              </div>
            </div>

            {/* Outpass Filters & Search Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 text-xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={passSearch}
                  onChange={(e) => setPassSearch(e.target.value)}
                  placeholder="Search outpasses by student, roll number, destination..."
                  className="w-full pl-9 pr-3 py-2 bg-ivory-50/70 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-primary"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-ivory-50/70 dark:bg-charcoal-800 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700">
                <span className="text-[11px] text-charcoal-500 font-medium">Status:</span>
                <select
                  value={passStatusFilter}
                  onChange={(e) => setPassStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-charcoal-800 dark:text-ivory-200 focus:outline-none"
                >
                  <option value="ALL">All Outpass Statuses ({gatePasses.length})</option>
                  <option value="PENDING_WARDEN">Pending Warden ({gatePasses.filter(p => p.status === "PENDING_WARDEN").length})</option>
                  <option value="APPROVED">Approved / Ready ({gatePasses.filter(p => p.status === "APPROVED").length})</option>
                  <option value="CHECKED_OUT">Checked Out ({gatePasses.filter(p => p.status === "CHECKED_OUT").length})</option>
                  <option value="RETURNED">Returned ({gatePasses.filter(p => p.status === "RETURNED").length})</option>
                  <option value="REJECTED">Rejected ({gatePasses.filter(p => p.status === "REJECTED").length})</option>
                </select>
              </div>
            </div>

            {filteredGatePasses.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No Outpass Records Found"
                description={
                  passSearch || passStatusFilter !== "ALL"
                    ? "No gate pass applications match your search query."
                    : "There are no gate passes or leave outpass requests currently in the queue."
                }
                actionLabel={passSearch || passStatusFilter !== "ALL" ? "Clear Filters" : "Submit Outpass Request"}
                onAction={() => {
                  if (passSearch || passStatusFilter !== "ALL") {
                    setPassSearch("");
                    setPassStatusFilter("ALL");
                  } else {
                    setShowPassModal(true);
                  }
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredGatePasses.map((pass) => {
                  const statusPill =
                    pass.status === "APPROVED"
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300"
                      : pass.status === "PENDING_WARDEN"
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300"
                      : pass.status === "CHECKED_OUT"
                      ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300"
                      : pass.status === "RETURNED"
                      ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-300"
                      : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300";

                  return (
                    <div
                      key={pass.id}
                      className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:border-rose-primary/30"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                            {pass.passNumber}
                          </span>
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusPill}`}>
                            {pass.status.replace("_", " ")}
                          </span>
                          {pass.parentConsentVerified && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> Parent Consent Verified
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                          {pass.studentName} ({pass.studentRoll}) — Room {pass.roomNumber}, {pass.blockName}
                        </h3>
                        <p className="text-xs text-charcoal-600 dark:text-ivory-300 font-medium">
                          <span className="text-charcoal-400">Destination:</span> {pass.destination} •{" "}
                          <span className="text-charcoal-400">Reason:</span> {pass.reason}
                        </p>
                        <div className="text-[11px] text-charcoal-500 dark:text-ivory-400 flex flex-wrap gap-4 pt-1">
                          <span>Departure: {new Date(pass.departureTime).toLocaleString()}</span>
                          <span>Expected Return: {new Date(pass.expectedReturnTime).toLocaleString()}</span>
                          <span>Emergency Tel: {pass.emergencyContact}</span>
                        </div>
                        {pass.remarks && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                            Warden Notes: {pass.remarks}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons for Warden / Guard */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {pass.status === "PENDING_WARDEN" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleProcessPass(pass.id, "APPROVE")}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessPass(pass.id, "REJECT")}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {pass.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => handleProcessPass(pass.id, "CHECK_OUT")}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                          >
                            Guard Check-Out
                          </button>
                        )}
                        {pass.status === "CHECKED_OUT" && (
                          <button
                            type="button"
                            onClick={() => handleProcessPass(pass.id, "RETURN")}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-xs"
                          >
                            Register Return
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 4: DINING & MESS MANAGEMENT */}
      {activeTab === "mess" && (
        <div className="space-y-6">
          {/* Live Dining Session & Turnstile Card */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-border dark:border-charcoal-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    SESSION ACTIVE: EXECUTIVE DINNER (19:30 – 22:00)
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 font-medium">
                    Closing in 1h 42m
                  </span>
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
                  Smart Dining Hall Headcount & Biometric Turnstile Terminal
                </h3>
                <p className="text-xs text-charcoal-500 max-w-xl">
                  Automated optical turnstile with biometric token validation, anti-passback double-punch prevention, and HACCP dietary compliance tracking.
                </p>
              </div>

              {/* Headcount Gauge */}
              <div className="w-full lg:w-72 bg-ivory-50 dark:bg-charcoal-800/60 p-4 rounded-xl border border-border dark:border-charcoal-700/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-charcoal-500 font-medium">Live Seating Occupancy:</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                    {diningHeadcount} / 450 ({Math.round((diningHeadcount / 450) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-border dark:bg-charcoal-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (diningHeadcount / 450) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Normal dining throughput • Lane 1-4 active
                </p>
              </div>
            </div>

            {/* Turnstile Punch Station */}
            <div className="mt-6 bg-gradient-to-r from-rose-50/50 via-ivory-50 to-rose-50/50 dark:from-rose-950/20 dark:via-charcoal-850 dark:to-rose-950/20 p-5 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-charcoal-800 rounded-xl shadow-xs border border-border dark:border-charcoal-700">
                  <QrCode className="w-7 h-7 text-rose-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    Biometric Turnstile Gate #01 (Optical/RFID)
                  </h4>
                  <p className="text-xs text-charcoal-500">
                    Resident: <span className="font-semibold text-charcoal-700 dark:text-ivory-200">{currentUser?.fullName || "Alex Rivera"}</span> • Plan: All-Access Buffet
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleBiometricPunch}
                  disabled={hasPunchedThisSession}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                    hasPunchedThisSession
                      ? "bg-emerald-600 text-white cursor-not-allowed opacity-90"
                      : "bg-rose-primary text-white hover:bg-rose-accent active:scale-95 hover:shadow-md"
                  }`}
                >
                  {hasPunchedThisSession ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      Turnstile Token Redeemed (Gate Passed)
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      Punch Biometric Meal Token
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Biometric Token Logs */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-primary" /> Recent Biometric Turnstile Token Log
                </h4>
                <span className="text-[11px] text-charcoal-400">Anti-Passback Verification: Active</span>
              </div>
              <div className="overflow-x-auto border border-border dark:border-charcoal-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-500">
                    <tr>
                      <th className="p-3">Student / Resident</th>
                      <th className="p-3">Plan Enrolled</th>
                      <th className="p-3">Meal Session</th>
                      <th className="p-3">Verified Lane</th>
                      <th className="p-3">Cryptographic Token</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-charcoal-800">
                    {punchedMeals.map((punch) => (
                      <tr key={punch.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                        <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100">
                          {punch.studentName} <span className="font-normal text-charcoal-400">({punch.studentRoll})</span>
                        </td>
                        <td className="p-3 text-charcoal-600 dark:text-ivory-300">{punch.plan}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                            {punch.mealType}
                          </span>
                        </td>
                        <td className="p-3 text-charcoal-500 font-mono text-[11px]">{punch.lane}</td>
                        <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">{punch.tokenHash}</td>
                        <td className="p-3 text-charcoal-500 font-medium">{punch.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SDG-12 Kitchen Food Waste & Sustainability Tracker */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 border border-border dark:border-charcoal-800 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
                      SDG-12 Kitchen Food Waste & Circularity Tracker
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      UN SDG Target 12.3 Compliant
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    Real-time per-capita kitchen surplus auditing and automated diversion to campus anaerobic biogas digesters.
                  </p>
                </div>
              </div>

              {/* Real-time KPI Badges */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="bg-ivory-50 dark:bg-charcoal-850 p-2.5 rounded-xl border border-border dark:border-charcoal-800">
                  <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Per-Capita Wastage</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {(
                      wasteLogs.reduce((acc, l) => acc + l.wastedKg, 0) /
                      Math.max(1, wasteLogs.reduce((acc, l) => acc + l.residents, 0))
                    ).toFixed(3)}{" "}
                    kg/head
                  </span>
                  <span className="text-[10px] text-charcoal-400 block">(Target: &lt; 0.080 kg)</span>
                </div>
                <div className="bg-ivory-50 dark:bg-charcoal-850 p-2.5 rounded-xl border border-border dark:border-charcoal-800">
                  <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Consumption Rate</span>
                  <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    {(
                      (wasteLogs.reduce((acc, l) => acc + l.consumedKg, 0) /
                        Math.max(1, wasteLogs.reduce((acc, l) => acc + l.preparedKg, 0))) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                  <span className="text-[10px] text-emerald-500 block font-medium">90%+ Green Tier</span>
                </div>
                <div className="bg-ivory-50 dark:bg-charcoal-850 p-2.5 rounded-xl border border-border dark:border-charcoal-800">
                  <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Biogas Clean Yield</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {wasteLogs.reduce((acc, l) => acc + l.wastedKg, 0)} kg
                  </span>
                  <span className="text-[10px] text-charcoal-400 block">100% Diverted</span>
                </div>
              </div>
            </div>

            {/* Quick Log Form */}
            <form onSubmit={handleLogWaste} className="bg-ivory-50 dark:bg-charcoal-850/60 p-4 rounded-xl border border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs font-bold text-charcoal-800 dark:text-ivory-200">
                  Log Meal Session Audit (Hostel Mess In-Charge)
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-charcoal-500 text-[11px] mb-1">Session</label>
                  <input
                    type="text"
                    required
                    value={wasteInput.session}
                    onChange={(e) => setWasteInput({ ...wasteInput, session: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs"
                    placeholder="e.g. Dinner"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-500 text-[11px] mb-1">Prepared (kg)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={wasteInput.preparedKg}
                    onChange={(e) => setWasteInput({ ...wasteInput, preparedKg: Number(e.target.value) })}
                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-500 text-[11px] mb-1">Consumed (kg)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={wasteInput.consumedKg}
                    onChange={(e) => setWasteInput({ ...wasteInput, consumedKg: Number(e.target.value) })}
                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-charcoal-500 text-[11px] mb-1">Residents Served</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={wasteInput.residents}
                    onChange={(e) => setWasteInput({ ...wasteInput, residents: Number(e.target.value) })}
                    className="w-full p-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full p-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Record Audit
                  </button>
                </div>
              </div>
            </form>

            {/* Waste Session Audit History */}
            <div className="overflow-x-auto border border-border dark:border-charcoal-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-500">
                  <tr>
                    <th className="p-3">Session</th>
                    <th className="p-3">Prepared</th>
                    <th className="p-3">Consumed</th>
                    <th className="p-3">Surplus (kg)</th>
                    <th className="p-3">Residents</th>
                    <th className="p-3">Per Capita</th>
                    <th className="p-3">Circularity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-charcoal-800">
                  {wasteLogs.map((log) => {
                    const perCap = (log.wastedKg / Math.max(1, log.residents)).toFixed(3);
                    const isOptimal = Number(perCap) <= 0.08;
                    return (
                      <tr key={log.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                        <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100">{log.session}</td>
                        <td className="p-3 text-charcoal-600 dark:text-ivory-300">{log.preparedKg} kg</td>
                        <td className="p-3 text-charcoal-600 dark:text-ivory-300">{log.consumedKg} kg</td>
                        <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{log.wastedKg} kg</td>
                        <td className="p-3 text-charcoal-500">{log.residents} students</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isOptimal
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {perCap} kg/capita
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Biogas Digester Diverted
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mess Subscriptions Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-6 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        {plan.dietType.replace("_", " ")}
                      </span>
                      <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100 mt-2">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
                        ${plan.monthlyFee}
                      </p>
                      <p className="text-xs text-charcoal-500">per calendar month</p>
                    </div>
                  </div>
                  <p className="text-xs text-charcoal-600 dark:text-ivory-300 mt-2">
                    {plan.description}
                  </p>

                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-1.5 text-xs">
                    <p className="font-semibold text-charcoal-800 dark:text-ivory-200">Weekly Menu Highlights:</p>
                    <p><span className="text-charcoal-500 font-medium">Breakfast:</span> {plan.weeklyHighlights.breakfast}</p>
                    <p><span className="text-charcoal-500 font-medium">Lunch:</span> {plan.weeklyHighlights.lunch}</p>
                    <p><span className="text-charcoal-500 font-medium">Snacks:</span> {plan.weeklyHighlights.snacks}</p>
                    <p><span className="text-charcoal-500 font-medium">Dinner:</span> {plan.weeklyHighlights.dinner}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border dark:border-charcoal-800 flex items-center justify-between">
                  <span className="text-xs text-charcoal-500">
                    {plan.activeSubscribers} Active Residents Enrolled
                  </span>
                  <button
                    onClick={() => handleSubscribeMess(plan.id)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors shadow-sm"
                  >
                    Select Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NIGHT CURFEW ROLL-CALL (21:30) */}
      {activeTab === "night-rollcall" && (
        <NightRollCallView
          blocks={summary?.blocks || []}
          currentUser={currentUser}
          showToast={(msg, type) => showToast(msg, type === "error" ? "error" : "success")}
        />
      )}

      {/* TAB 6: ROOM INVENTORY & DEPOSIT CLEARANCE */}
      {activeTab === "asset-audit" && <HostelAssetAuditTab />}

      {/* TAB 7: MESS DIET REBATE & DINING TOKENS */}
      {activeTab === "mess-rebate" && <MessRebateTab />}

      {/* MODAL: Request Outpass */}
      {showPassModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="New Hostel Leave & Outpass Application"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPassModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                New Hostel Leave & Outpass Application
              </h3>
              <button
                onClick={() => setShowPassModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Student Name & Roll
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={passForm.studentName}
                    onChange={(e) => setPassForm({ ...passForm, studentName: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    required
                    value={passForm.studentRoll}
                    onChange={(e) => setPassForm({ ...passForm, studentRoll: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="Roll No"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Reason for Outpass
                </label>
                <input
                  type="text"
                  required
                  value={passForm.reason}
                  onChange={(e) => setPassForm({ ...passForm, reason: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g., Hackathon Competition / Family Event"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  required
                  value={passForm.destination}
                  onChange={(e) => setPassForm({ ...passForm, destination: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g., Boston, MA / Home"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={passForm.departureTime}
                    onChange={(e) => setPassForm({ ...passForm, departureTime: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Expected Return Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={passForm.expectedReturnTime}
                    onChange={(e) => setPassForm({ ...passForm, expectedReturnTime: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Parent / Emergency Telephone
                </label>
                <input
                  type="text"
                  required
                  value={passForm.emergencyContact}
                  onChange={(e) => setPassForm({ ...passForm, emergencyContact: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Allocate Bed */}
      {showAllocateModal && (() => {
        const selectedRoomObj = rooms.find((rm) => rm.id === allocateForm.roomId);
        const vacantBeds = selectedRoomObj?.beds?.filter((b: any) => !b.isOccupied) || [];
        const isRoomFull = selectedRoomObj && vacantBeds.length === 0;

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Allocate Bed to Student"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllocateModal(false);
            }}
            className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Allocate Bed to Student
                  </h3>
                  <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                    Assign student to verified vacant bed in institutional residence hall
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAllocateBed} className="space-y-3.5 mt-4 text-xs">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Select Residence Room
                  </label>
                  <select
                    required
                    value={allocateForm.roomId}
                    onChange={(e) => {
                      const rId = e.target.value;
                      const targetRm = rooms.find((r) => r.id === rId);
                      const vBeds = targetRm?.beds?.filter((b: any) => !b.isOccupied) || [];
                      setAllocateForm({
                        ...allocateForm,
                        roomId: rId,
                        bedNumber: vBeds.length > 0 ? vBeds[0].bedNumber : "",
                      });
                    }}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">-- Choose Room --</option>
                    {rooms.map((rm) => (
                      <option key={rm.id} value={rm.id}>
                        {rm.roomNumber} ({rm.blockName}) — {rm.occupiedCount}/{rm.capacity} Occupied {rm.occupiedCount >= rm.capacity ? "[FULL]" : `[${rm.capacity - rm.occupiedCount} Bed(s) Available]`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Select Vacant Bed Letter
                  </label>
                  <select
                    required
                    disabled={!allocateForm.roomId || isRoomFull}
                    value={allocateForm.bedNumber}
                    onChange={(e) => setAllocateForm({ ...allocateForm, bedNumber: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:opacity-50"
                  >
                    {!allocateForm.roomId ? (
                      <option value="">-- First Select a Room Above --</option>
                    ) : isRoomFull ? (
                      <option value="">No vacant beds available in this room</option>
                    ) : (
                      vacantBeds.map((b: any) => (
                        <option key={b.id || b.bedNumber} value={b.bedNumber}>
                          Bed {b.bedNumber} (Vacant &amp; Sanitized)
                        </option>
                      ))
                    )}
                  </select>
                  {isRoomFull && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                      ⚠️ This room is at full capacity ({selectedRoomObj?.capacity}/{selectedRoomObj?.capacity} Occupied). Please select a different room.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={allocateForm.studentName}
                      onChange={(e) => setAllocateForm({ ...allocateForm, studentName: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg"
                      placeholder="e.g. Jordan Lee"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      Roll / Registration No
                    </label>
                    <input
                      type="text"
                      required
                      value={allocateForm.studentRoll}
                      onChange={(e) => setAllocateForm({ ...allocateForm, studentRoll: e.target.value })}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg"
                      placeholder="e.g. CS2026-044"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department / Academic Branch
                  </label>
                  <input
                    type="text"
                    required
                    value={allocateForm.branch}
                    onChange={(e) => setAllocateForm({ ...allocateForm, branch: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg"
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => setShowAllocateModal(false)}
                    className="px-3.5 py-2 rounded-xl font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!allocateForm.roomId || isRoomFull || !allocateForm.bedNumber}
                    className="btn-primary-glow px-4 py-2 rounded-xl font-semibold bg-rose-primary text-white hover:bg-rose-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
                  >
                    Confirm Allocation
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Official Hostel No-Dues & Caution Deposit Settlement Voucher */}
      {viewingNoDuesRecord && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hostel No-Dues Clearance & Caution Deposit Settlement Voucher"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingNoDuesRecord(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 sm:p-7 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent text-[10px]">
                      Official Institutional Certificate
                    </span>
                    <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      Voucher Ref: HST-ND-{viewingNoDuesRecord.bed.studentRoll}-{new Date().getFullYear()}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
                    Hostel No-Dues &amp; Caution Deposit Settlement Voucher
                  </h3>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    Apex Institute of Science &amp; Technology • Directorate of Residence Life &amp; Student Housing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingNoDuesRecord(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resident Dossier Summary Grid */}
            <div className="mt-4 p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-850 border border-border dark:border-charcoal-750 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Student Resident</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{viewingNoDuesRecord.bed.studentName}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Roll Number</span>
                <span className="font-mono font-bold text-rose-primary dark:text-rose-accent">{viewingNoDuesRecord.bed.studentRoll}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Residence Hall</span>
                <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{viewingNoDuesRecord.room.blockName}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Allocated Room &amp; Bed</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">Room {viewingNoDuesRecord.room.roomNumber} • Bed {viewingNoDuesRecord.bed.bedNumber}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Academic Branch</span>
                <span className="text-charcoal-700 dark:text-ivory-300">{viewingNoDuesRecord.bed.branch || "General Program"}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Allotment Date</span>
                <span className="text-charcoal-700 dark:text-ivory-300">{viewingNoDuesRecord.bed.allocatedDate || "2026-08-01"}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Fee Reconciliation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{viewingNoDuesRecord.bed.feeStatus || "PAID"}</span>
              </div>
              <div>
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Clearance Date</span>
                <span className="text-charcoal-700 dark:text-ivory-300">{new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
            </div>

            {/* Statutory Clearance Inspection Audit */}
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Residence Clearance Audit Checklist
              </h4>
              <div className="divide-y divide-border/60 dark:divide-charcoal-800 border border-border dark:border-charcoal-800 rounded-xl overflow-hidden text-xs">
                <div className="p-2.5 bg-white dark:bg-charcoal-900 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-ivory-100">Room Furniture &amp; Fixture Inspection</p>
                    <p className="text-[11px] text-charcoal-500">Study desk, chair, wardrobe, and bed frame in satisfactory condition.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    INSPECTED &amp; PASSED
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-charcoal-900 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-ivory-100">Electrical &amp; Utility Assets</p>
                    <p className="text-[11px] text-charcoal-500">Ceiling fan, switchboards, lighting, and air conditioning unit intact.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    NO DAMAGE
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-charcoal-900 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-ivory-100">Room Keys Handover</p>
                    <p className="text-[11px] text-charcoal-500">All original room lock and wardrobe keys returned to hostel superintendent.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    KEYS RECEIVED
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-charcoal-900 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-ivory-100">Mess &amp; Dining Account Reconciliation</p>
                    <p className="text-[11px] text-charcoal-500">All dining billing cycles reconciled. Zero pending mess arrears.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    NIL ARREARS
                  </span>
                </div>
              </div>
            </div>

            {/* Caution Deposit Settlement Financial Table */}
            <div className="mt-4 p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs">
              <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Caution Deposit Settlement Ledger
                </span>
                <span className="text-[11px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
                  Status: REFUNDABLE
                </span>
              </div>
              <div className="space-y-1 text-charcoal-700 dark:text-ivory-300 text-[11px]">
                <div className="flex justify-between">
                  <span>Original Caution Money Deposited at Admission:</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">₹10,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessed Breakage / Maintenance Penalty Deductions:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0.00</span>
                </div>
                <div className="flex justify-between border-t border-emerald-200 dark:border-emerald-800/60 pt-1 text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                  <span>Net Refundable Amount to Student Bank Account:</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">₹10,000.00</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="mt-5 pt-4 border-t border-border dark:border-charcoal-800 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-200 dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewingNoDuesRecord(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 hover:bg-ivory-200 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleVacateBed(viewingNoDuesRecord.room.id, viewingNoDuesRecord.bed.bedNumber, viewingNoDuesRecord.bed.studentRoll)}
                  className="btn-primary-glow px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Vacate Bed &amp; Release Occupancy</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
