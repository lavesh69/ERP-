"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Shield,
  Clock,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  X,
  Phone,
  FileText,
  Building,
  CheckCircle2,
  Users,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HostelVisitorRecord } from "@/lib/hostel/hostel-engine";

interface HostelVisitorsTabProps {
  rooms: any[];
  onRefresh?: () => void;
}

export default function HostelVisitorsTab({ rooms, onRefresh }: HostelVisitorsTabProps) {
  const { showToast, currentUser, currentRole } = useApp();
  const [visitors, setVisitors] = useState<HostelVisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [relationFilter, setRelationFilter] = useState<string>("ALL");
  const [activeOnly, setActiveOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const [form, setForm] = useState({
    studentRoll: "CS2026-001",
    studentName: "Alex Rivera",
    roomNumber: "A-101",
    blockName: "Nelson Mandela Hall (Block A)",
    visitorName: "",
    relation: "PARENT" as const,
    phone: "",
    idProofNumber: "",
    purpose: "Family semester check-in and luggage delivery",
  });

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hostel?tab=visitors");
      if (res.ok) {
        const data = await res.json();
        setVisitors(data.visitors || []);
      }
    } catch (err) {
      console.error("Failed to load visitors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [showModal]);

  const handleRollChange = (roll: string) => {
    const trimmed = roll.trim().toLowerCase();
    let foundName = "";
    let foundRoom = "";
    let foundBlock = "";

    for (const r of rooms) {
      const matchBed = r.beds?.find(
        (b: any) => b.isOccupied && b.studentRoll?.toLowerCase() === trimmed
      );
      if (matchBed) {
        foundName = matchBed.studentName || "";
        foundRoom = r.roomNumber;
        foundBlock = r.blockName;
        break;
      }
    }

    setForm((prev) => ({
      ...prev,
      studentRoll: roll,
      studentName: foundName || prev.studentName,
      roomNumber: foundRoom || prev.roomNumber,
      blockName: foundBlock || prev.blockName,
    }));
  };

  const handleSubmitVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim()) {
      showToast("Visitor name is required", "error");
      return;
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      showToast("Valid telephone contact number is required", "error");
      return;
    }
    if (!form.idProofNumber.trim()) {
      showToast("Government ID proof number is mandatory", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_VISITOR_ENTRY",
          ...form,
          gateSecurityOfficer: currentUser?.fullName || "Security Sergeant R. Singh",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log visitor entry");

      showToast(data.message || "Visitor check-in badge generated successfully", "success");
      setShowModal(false);
      setForm({
        studentRoll: "CS2026-001",
        studentName: "Alex Rivera",
        roomNumber: "A-101",
        blockName: "Nelson Mandela Hall (Block A)",
        visitorName: "",
        relation: "PARENT",
        phone: "",
        idProofNumber: "",
        purpose: "Family semester check-in and luggage delivery",
      });
      fetchVisitors();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error logging visitor entry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutVisitor = async (visitorId: string) => {
    try {
      setCheckingOutId(visitorId);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECKOUT_VISITOR",
          visitorId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record checkout");

      showToast(data.message || "Visitor departure recorded at main gate", "success");
      fetchVisitors();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error during checkout", "error");
    } finally {
      setCheckingOutId(null);
    }
  };

  const handleExportCsv = () => {
    if (!visitors.length) {
      showToast("No visitor entries to export", "error");
      return;
    }
    const headers = [
      "Badge ID",
      "Visitor Name",
      "Phone",
      "Govt ID Proof",
      "Relation",
      "Student Roll",
      "Student Name",
      "Room",
      "Block",
      "Check-In",
      "Check-Out",
      "Status",
      "Security Officer",
      "Purpose",
    ];
    const rows = visitors.map((v) => [
      v.badgeNumber,
      `"${v.visitorName}"`,
      v.phone,
      v.idProofNumber,
      v.relation,
      v.studentRoll,
      `"${v.studentName}"`,
      v.roomNumber,
      `"${v.blockName}"`,
      v.checkInTime,
      v.checkOutTime || "STILL_IN",
      v.status,
      `"${v.gateSecurityOfficer}"`,
      `"${v.purpose.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hostel_Visitor_Gate_Log_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Security Gate Visitor Register CSV", "success");
  };

  const filtered = visitors.filter((v) => {
    if (activeOnly && v.status !== "CHECKED_IN") return false;
    if (relationFilter !== "ALL" && v.relation !== relationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = v.visitorName?.toLowerCase().includes(q);
      const matchRoll = v.studentRoll?.toLowerCase().includes(q);
      const matchStudent = v.studentName?.toLowerCase().includes(q);
      const matchPhone = v.phone?.toLowerCase().includes(q);
      const matchId = v.idProofNumber?.toLowerCase().includes(q);
      return matchName || matchRoll || matchStudent || matchPhone || matchId;
    }
    return true;
  });

  const checkedInCount = visitors.filter((v) => v.status === "CHECKED_IN").length;
  const parentCount = visitors.filter((v) => v.relation === "PARENT" || v.relation === "GUARDIAN").length;

  return (
    <div className="space-y-6">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Active Visitors In-House
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
              <span>{checkedInCount}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Currently On Campus
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Logged Entries
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {visitors.length}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              Gate Security Register
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Parents & Guardians
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-blue-600 dark:text-blue-400 mt-1">
              {parentCount}
            </h3>
            <span className="badge-subtle bg-blue-500/10 text-blue-700 dark:text-blue-300 mt-1 inline-block">
              Family Check-Ins
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              ID Proof Compliance
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              100%
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Statutory Biometric / Gov ID
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search visitor, phone, student roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-charcoal-700 dark:text-ivory-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded text-rose-primary focus:ring-rose-primary w-4 h-4"
            />
            <span>Active On-Premises Only</span>
          </label>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "PARENT", "GUARDIAN", "SIBLING", "GUEST", "OFFICIAL"].map((rel) => (
              <button
                key={rel}
                onClick={() => setRelationFilter(rel)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  relationFilter === rel
                    ? "bg-rose-primary text-white"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {rel === "ALL" ? "All Relations" : rel}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-700 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Gate Log</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Visitor Entry</span>
          </button>
        </div>
      </div>

      {/* Visitors Gate Register Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/70 dark:bg-charcoal-800/50 border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Security Badge & Visitor</th>
                <th className="p-3.5">Phone & Gov ID Proof</th>
                <th className="p-3.5">Resident Scholar</th>
                <th className="p-3.5">Purpose of Visit</th>
                <th className="p-3.5">Gate In / Out</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Departure Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Loading security gate register...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    No visitor records found matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono text-[11px] font-bold text-rose-primary dark:text-rose-accent">
                        {v.badgeNumber}
                      </div>
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm">
                        {v.visitorName}
                      </div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-container/70 dark:bg-rose-950/60 text-rose-primary dark:text-rose-accent">
                        {v.relation}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-charcoal-700 dark:text-ivory-300">
                        <Phone className="w-3 h-3 text-charcoal-400" />
                        <span>{v.phone}</span>
                      </div>
                      <div className="font-mono text-[11px] text-charcoal-500 mt-0.5">
                        ID: {v.idProofNumber}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{v.studentName}</div>
                      <div className="font-mono text-[11px] text-charcoal-500">{v.studentRoll}</div>
                      <div className="text-[10px] text-charcoal-400">
                        {v.blockName} • Room {v.roomNumber}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-charcoal-600 dark:text-charcoal-300">
                        {v.purpose}
                      </p>
                      <div className="text-[10px] text-charcoal-400 mt-0.5">
                        Guard: {v.gateSecurityOfficer}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                        In: {new Date(v.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-charcoal-500 text-[11px]">
                        Out: {v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {v.status === "CHECKED_IN" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          IN-HOUSE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          CHECKED OUT
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {v.status === "CHECKED_IN" ? (
                        <button
                          disabled={checkingOutId === v.id}
                          onClick={() => handleCheckoutVisitor(v.id)}
                          className="px-3 py-1.5 rounded-lg bg-charcoal-800 dark:bg-charcoal-700 hover:bg-rose-primary text-white font-semibold text-[11px] transition-colors shadow-xs inline-flex items-center gap-1.5"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Record Gate Exit</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-charcoal-400">Departure Recorded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Check-In Visitor */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-primary text-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Security Gate Visitor Check-In &amp; Entry Pass
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVisitor} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Visitor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robert Rivera"
                  value={form.visitorName}
                  onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Relationship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.relation}
                    onChange={(e) => setForm({ ...form, relation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="PARENT">Parent (Father / Mother)</option>
                    <option value="GUARDIAN">Authorized Guardian</option>
                    <option value="SIBLING">Sibling (Brother / Sister)</option>
                    <option value="GUEST">Academic Guest / Friend</option>
                    <option value="OFFICIAL">Official / Delivery Personnel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Government ID Proof Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Aadhaar / Voter ID / Driving License / Passport"
                  value={form.idProofNumber}
                  onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-800 space-y-3">
                <p className="font-semibold text-charcoal-800 dark:text-ivory-200">
                  Host Resident Scholar Information:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Student Roll No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CS2026-001"
                      value={form.studentRoll}
                      onChange={(e) => handleRollChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      value={form.studentName}
                      onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={form.roomNumber}
                      onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Hostel Residence Block
                    </label>
                    <input
                      type="text"
                      value={form.blockName}
                      onChange={(e) => setForm({ ...form, blockName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Purpose of Visit <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-glow px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Generating Badge..." : "Issue Gate Pass"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
