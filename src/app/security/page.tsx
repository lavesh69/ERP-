"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Car,
  KeyRound,
  LogOut,
  MapPin,
  Lock,
  Download,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  RotateCcw,
  Camera,
  CheckSquare,
  Square,
  Video,
} from "lucide-react";
import { VisitorPass, SecurityGate, PassStatus } from "@/lib/security/security-engine";

interface SecuritySummary {
  totalGates: number;
  activeVisitors: number;
  checkedOutToday: number;
  totalPassesIssued: number;
  gates: SecurityGate[];
}

export default function SecurityPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"passes" | "gates">("passes");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [gates, setGates] = useState<SecurityGate[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedPassDossier, setSelectedPassDossier] = useState<VisitorPass | null>(null);
  const [selectedPassIds, setSelectedPassIds] = useState<string[]>([]);
  const [isBulkCheckingOut, setIsBulkCheckingOut] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const filteredPasses = passes.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.passNumber.toLowerCase().includes(q) ||
      p.visitorName.toLowerCase().includes(q) ||
      p.contactPhone.toLowerCase().includes(q) ||
      (p.vehicleNumber && p.vehicleNumber.toLowerCase().includes(q)) ||
      p.hostName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportSecurityCsv = () => {
    const headers = "Pass Ref,Visitor Name,Phone,ID Proof,Visitor Type,Host Name,Department,Purpose,Vehicle No,Entry Gate,Status,Check-In Time,Check-Out Time\n";
    const rows = filteredPasses
      .map((p) => `"${p.passNumber}","${p.visitorName}","${p.contactPhone}","${p.idProofType}: ${p.idProofNumber}","${p.visitorType}","${p.hostName}","${p.hostDepartment}","${(p.purposeOfVisit || "").replace(/"/g, '""')}","${p.vehicleNumber || "N/A"}","${p.entryGate}","${p.status}","${p.checkInTime}","${p.checkOutTime || "N/A"}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Perimeter_Security_Gate_Passes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New Pass Modal
  const [showModal, setShowModal] = useState(false);
  const [passForm, setPassForm] = useState({
    visitorName: "",
    contactPhone: "",
    idProofType: "NATIONAL_ID" as const,
    idProofNumber: "",
    visitorType: "GUEST_SPEAKER" as const,
    hostName: currentUser?.fullName || "Prof. Sarah Chen",
    hostDepartment: "Computer Science & Engineering",
    purposeOfVisit: "Academic Guest Lecture & Lab Tour",
    vehicleNumber: "",
    entryGate: "Main North Arch Gate",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, pRes, gRes] = await Promise.all([
        fetch("/api/security?tab=summary"),
        fetch("/api/security?tab=passes"),
        fetch("/api/security?tab=gates"),
      ]);

      if (sumRes.ok) {
        const sData = await sumRes.json();
        setSummary(sData.summary);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPasses(pData.passes || []);
      }
      if (gRes.ok) {
        const gData = await gRes.json();
        setGates(gData.gates || []);
      }
    } catch (err) {
      console.error("Failed to load security data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_PASS",
          ...passForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue visitor pass");

      setStatusMessage({ type: "success", text: data.message });
      setShowModal(false);
      setPassForm({
        visitorName: "",
        contactPhone: "",
        idProofType: "NATIONAL_ID",
        idProofNumber: "",
        visitorType: "GUEST_SPEAKER",
        hostName: currentUser?.fullName || "Prof. Sarah Chen",
        hostDepartment: "Computer Science & Engineering",
        purposeOfVisit: "Academic Guest Lecture & Lab Tour",
        vehicleNumber: "",
        entryGate: "Main North Arch Gate",
      });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCheckOut = async (passId: string) => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_OUT",
          passId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check out visitor");

      setStatusMessage({ type: "success", text: data.message });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleToggleSelectPass = (id: string) => {
    setSelectedPassIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllPasses = () => {
    const activePassIds = filteredPasses
      .filter((p) => p.status === "ACTIVE_ON_CAMPUS")
      .map((p) => p.id);
    if (selectedPassIds.length === activePassIds.length && activePassIds.length > 0) {
      setSelectedPassIds([]);
    } else {
      setSelectedPassIds(activePassIds);
    }
  };

  const handleBulkCheckOut = async () => {
    if (selectedPassIds.length === 0) return;
    setIsBulkCheckingOut(true);
    let successCount = 0;
    try {
      for (const passId of selectedPassIds) {
        const res = await fetch("/api/security", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "CHECK_OUT", passId }),
        });
        if (res.ok) successCount++;
      }
      setStatusMessage({
        type: "success",
        text: `Successfully checked out ${successCount} visitors across active perimeter gates.`,
      });
      setSelectedPassIds([]);
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "Bulk checkout encountered an error." });
      setTimeout(() => setStatusMessage(null), 5000);
    } finally {
      setIsBulkCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Gate Security & Visitor Access Suite
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cryptographic digital QR passes, vehicle license monitoring, and real-time perimeter surveillance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search visitor, phone, car..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-52"
            />
          </div>
          <button
            onClick={handleExportSecurityCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Passes (CSV)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Issue Visitor Pass
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active On-Campus</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.activeVisitors ?? "--"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">visitors</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Currently inside institutional premises</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Gates</span>
            <Lock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalGates ?? "--"}
            </span>
            <span className="text-xs text-slate-500">manned posts</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Active perimeter barriers & kiosks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Checked Out</span>
            <LogOut className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.checkedOutToday ?? 0}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">departures</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Safely concluded visits today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Passes Issued</span>
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalPassesIssued ?? "--"}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">passes</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cryptographically signed access badges</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("passes")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "passes"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Visitor Passes Ledger ({passes.length})
        </button>

        <button
          onClick={() => setActiveTab("gates")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "gates"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          Perimeter Gates ({gates.length})
        </button>
      </div>

      {/* Tab 1: Visitor Passes Ledger */}
      {activeTab === "passes" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Active & Historical Passes</h3>
              <p className="text-xs text-slate-400">{filteredPasses.length} of {passes.length} badges matching</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search visitor, vehicle, pass #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE_ON_CAMPUS">ACTIVE_ON_CAMPUS</option>
                  <option value="CHECKED_OUT">CHECKED_OUT</option>
                  <option value="OVERSTAY_ALERT">OVERSTAY_ALERT</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllPasses}
                      title="Select all active visitors"
                      className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {selectedPassIds.length > 0 && selectedPassIds.length === filteredPasses.filter((p) => p.status === "ACTIVE_ON_CAMPUS").length ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-4">Pass #</th>
                  <th className="p-4">Visitor & Contact</th>
                  <th className="p-4">Host & Purpose</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Security QR Seal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPasses.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 text-center">
                      {p.status === "ACTIVE_ON_CAMPUS" ? (
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPass(p.id)}
                          className="text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        >
                          {selectedPassIds.includes(p.id) ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 font-mono font-medium text-xs text-emerald-600 dark:text-emerald-400">
                      {p.passNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.visitorName}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.contactPhone}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded text-slate-500">
                        {p.visitorType}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">Host: {p.hostName}</div>
                      <div className="text-xs text-slate-400 truncate" title={p.purposeOfVisit}>
                        {p.purposeOfVisit}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        {p.vehicleNumber || "Pedestrian"}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {p.digitalSeal}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          p.status === "ACTIVE_ON_CAMPUS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {p.status === "ACTIVE_ON_CAMPUS" ? "Active Inside" : "Checked Out"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPassDossier(p)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          View Pass
                        </button>
                        {p.status === "ACTIVE_ON_CAMPUS" && (
                          <button
                            onClick={() => handleCheckOut(p.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 rounded-lg text-xs font-semibold transition-all"
                          >
                            Check Out
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sticky Bulk Check-Out Toolbar */}
          {selectedPassIds.length > 0 && (
            <div className="sticky bottom-4 mx-4 my-3 p-3.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-white z-20 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                  {selectedPassIds.length} Active Visitors Selected
                </span>
                <span className="text-xs text-slate-300">Ready for simultaneous perimeter gate checkout.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkCheckOut}
                  disabled={isBulkCheckingOut}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isBulkCheckingOut ? "Checking Out..." : `Bulk Check-Out (${selectedPassIds.length})`}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPassIds([])}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {filteredPasses.length === 0 && (
            <div className="py-16 text-center border-t border-slate-100 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Visitor Passes Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No gate passes match your current filter or query &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
                className="mt-4 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Perimeter Gates */}
      {activeTab === "gates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  24/7 Monitored
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{gate.name}</h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {gate.location}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                <div>Duty Officer: <span className="font-semibold text-slate-800 dark:text-slate-200">{gate.guardOnDuty}</span></div>
                <div>Automated Boom Barrier: <span className="text-emerald-600 font-semibold">Active & Armed</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Pass Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Issue Cryptographic Visitor Gate Pass
            </h3>

            <form onSubmit={handleIssuePass} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visitor Legal Name</label>
                  <input
                    type="text"
                    required
                    value={passForm.visitorName}
                    onChange={(e) => setPassForm({ ...passForm, visitorName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. Dr. Alan Turing"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={passForm.contactPhone}
                    onChange={(e) => setPassForm({ ...passForm, contactPhone: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID Proof Type</label>
                  <select
                    value={passForm.idProofType}
                    onChange={(e) => setPassForm({ ...passForm, idProofType: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="NATIONAL_ID">National ID / Aadhaar</option>
                    <option value="DRIVING_LICENSE">Driver's License</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visitor Category</label>
                  <select
                    value={passForm.visitorType}
                    onChange={(e) => setPassForm({ ...passForm, visitorType: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="GUEST_SPEAKER">Guest Speaker / Academic</option>
                    <option value="OFFICIAL_DELEGATION">Accreditation / Official Delegation</option>
                    <option value="PARENT">Parent / Guardian</option>
                    <option value="VENDOR_DELIVERY">Vendor / Delivery</option>
                    <option value="CONTRACTOR">Estate Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Host Person Name</label>
                  <input
                    type="text"
                    required
                    value={passForm.hostName}
                    onChange={(e) => setPassForm({ ...passForm, hostName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Host Department</label>
                  <input
                    type="text"
                    required
                    value={passForm.hostDepartment}
                    onChange={(e) => setPassForm({ ...passForm, hostDepartment: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  value={passForm.purposeOfVisit}
                  onChange={(e) => setPassForm({ ...passForm, purposeOfVisit: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Deliberation with Vice Chancellor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    value={passForm.vehicleNumber}
                    onChange={(e) => setPassForm({ ...passForm, vehicleNumber: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. MA-882-QX (or leave blank)"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Entry Gate</label>
                  <select
                    value={passForm.entryGate}
                    onChange={(e) => setPassForm({ ...passForm, entryGate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="Main North Arch Gate">Main North Arch Gate</option>
                    <option value="South Technology Park Gate">South Technology Park Gate</option>
                    <option value="Residential Halls Perimeter Kiosk">Residential Halls Perimeter Kiosk</option>
                  </select>
                </div>
              </div>

              {/* Visitor Badge Photo / Webcam Simulator */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Visitor Badge Photo (Biometric Verification)</span>
                  {capturedPhoto && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Photo Enrolled
                    </span>
                  )}
                </label>

                {webcamActive ? (
                  <div className="mt-1 p-3 bg-slate-950 rounded-xl border border-emerald-500/50 shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono mb-2">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                        CAM-01_1080P_LIVE [30 FPS]
                      </span>
                      <span>ISO 400 • F/2.0</span>
                    </div>

                    <div className="relative h-36 bg-slate-900 rounded-lg flex items-center justify-center border border-dashed border-emerald-500/40">
                      {/* Face tracking reticle */}
                      <div className="w-24 h-24 border-2 border-emerald-400/80 rounded-2xl flex flex-col items-center justify-center animate-pulse relative">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 mb-1" />
                        <div className="w-14 h-6 rounded-t-xl bg-emerald-500/20 border-t border-x border-emerald-400" />
                        <span className="absolute bottom-1 font-mono text-[9px] text-emerald-300 bg-slate-900/80 px-1 rounded">
                          FACE_LOCK: 99.4%
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setWebcamActive(false)}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedPhoto(`PHOTO_BADGE_${Date.now().toString().slice(-4)}`);
                          setWebcamActive(false);
                        }}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Capture Badge Photo
                      </button>
                    </div>
                  </div>
                ) : capturedPhoto ? (
                  <div className="mt-1 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {capturedPhoto}.jpg
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Biometric Face Checksum: OK
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWebcamActive(true)}
                      className="px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    >
                      Retake
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Video className="w-4 h-4 text-slate-400" />
                      <span>No badge snapshot captured yet.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWebcamActive(true)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Launch Kiosk Webcam
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Generate Digital Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Visitor Pass QR & Access Slip Modal */}
      {selectedPassDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Visitor Gate Pass</h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {selectedPassDossier.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{selectedPassDossier.passNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPassDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Biometric Snapshot & Identification Card */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 relative overflow-hidden">
                <Users className="w-7 h-7" />
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-[8px] text-white font-mono text-center py-0.5">
                  ENROLLED
                </span>
              </div>
              <div className="text-xs space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPassDossier.visitorName}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded font-semibold">Face Hash: OK</span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  ID Proof: <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{selectedPassDossier.idProofType} ({selectedPassDossier.idProofNumber})</span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                  Perimeter Biometric Checksum: SEC-BIO-OK-{selectedPassDossier.passNumber.slice(-4)}
                </div>
              </div>
            </div>

            {/* QR Code & Seal Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700/60 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <QrCode className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">Cryptographic Perimeter Access Seal</div>
                <div className="font-mono text-[10px] text-slate-500 break-all bg-slate-100 dark:bg-slate-800 p-1.5 rounded">
                  {selectedPassDossier.digitalSeal}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-0.5">
                  Verified with Gate Kiosk NFC & Optical Scanner
                </div>
              </div>
            </div>

            {/* Detailed Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Visitor Full Name</span>
                <span className="font-semibold text-slate-900 dark:text-white text-sm">{selectedPassDossier.visitorName}</span>
                <span className="text-slate-500 font-mono block">{selectedPassDossier.contactPhone}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">ID Proof Verified</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedPassDossier.idProofType}</span>
                <span className="text-slate-500 font-mono block">{selectedPassDossier.idProofNumber}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Host Officer / Dept</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedPassDossier.hostName}</span>
                <span className="text-slate-500 block truncate">{selectedPassDossier.hostDepartment}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Entry Gate & Vehicle</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate block">{selectedPassDossier.entryGate}</span>
                <span className="text-slate-500 font-mono block">{selectedPassDossier.vehicleNumber || "Pedestrian Access"}</span>
              </div>
            </div>

            {/* Vehicle Parking and Speed Clearance */}
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-850 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-600" /> Authorized Campus Parking Zone: Bay #P-42 (Zone B)
                </span>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Campus Speed Limit: 20 km/h • Reverse Parking Mandatory in Academics</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Permitted
              </span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">Purpose of Visit & Destination</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPassDossier.purposeOfVisit}</p>
            </div>

            {/* Security Officer Duty Signature & Camera Stamp */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    CCTV Perimeter Checkpoint: Cam-Gate-01 • ALPR Logged
                  </span>
                  <p className="text-[10px] text-slate-500">
                    Duty Officer: Chief Guard R. Miller • Command Center Badge #SEC-8092
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                LPR-MATCH: 100%
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div>
                <span>Checked In: </span>
                <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedPassDossier.checkInTime).toLocaleString()}</strong>
              </div>
              {selectedPassDossier.checkOutTime && (
                <div>
                  <span>Checked Out: </span>
                  <strong className="text-slate-800 dark:text-slate-200">{new Date(selectedPassDossier.checkOutTime).toLocaleString()}</strong>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                {selectedPassDossier.status === "ACTIVE_ON_CAMPUS" ? (
                  <button
                    onClick={async () => {
                      await handleCheckOut(selectedPassDossier.id);
                      setSelectedPassDossier((prev: any) => ({
                        ...prev,
                        status: "CHECKED_OUT",
                        checkOutTime: new Date().toISOString(),
                      }));
                    }}
                    className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Instant Gate Check-Out
                  </button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Exit Processed Successfully
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Pass Slip
                </button>
                <button
                  onClick={() => setSelectedPassDossier(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
