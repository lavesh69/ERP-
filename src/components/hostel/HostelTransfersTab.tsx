"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Building,
  Bed,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  X,
  Sparkles,
  Send,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { RoomTransferRequest } from "@/lib/hostel/hostel-engine";

interface HostelTransfersTabProps {
  rooms: any[];
  onRefresh?: () => void;
}

export default function HostelTransfersTab({ rooms, onRefresh }: HostelTransfersTabProps) {
  const { showToast, currentUser, currentRole } = useApp();
  const [transfers, setTransfers] = useState<RoomTransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    studentRoll: "",
    studentName: "",
    currentRoomId: "",
    currentBedNumber: "A",
    targetRoomId: "",
    targetBedNumber: "A",
    reason: "",
  });

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hostel?tab=transfers");
      if (res.ok) {
        const data = await res.json();
        setTransfers(data.transfers || []);
      }
    } catch (err) {
      console.error("Failed to load transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
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

  // Handle student roll autofill from room allocations
  const handleRollChange = (roll: string) => {
    const trimmed = roll.trim();
    let foundName = "";
    let foundRoomId = "";
    let foundBedNum = "A";

    for (const r of rooms) {
      const matchBed = r.beds?.find(
        (b: any) => b.isOccupied && b.studentRoll?.toLowerCase() === trimmed.toLowerCase()
      );
      if (matchBed) {
        foundName = matchBed.studentName || "";
        foundRoomId = r.id;
        foundBedNum = matchBed.bedNumber || "A";
        break;
      }
    }

    setForm((prev) => ({
      ...prev,
      studentRoll: roll,
      studentName: foundName || prev.studentName,
      currentRoomId: foundRoomId || prev.currentRoomId,
      currentBedNumber: foundBedNum,
    }));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentRoll.trim() || !form.currentRoomId || !form.targetRoomId) {
      showToast("Please provide roll number, current room, and target room", "error");
      return;
    }
    if (form.currentRoomId === form.targetRoomId && form.currentBedNumber === form.targetBedNumber) {
      showToast("Target room and bed must differ from current allocation", "error");
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 5) {
      showToast("Please specify a substantive reason (min 5 characters)", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_ROOM_TRANSFER",
          studentRoll: form.studentRoll.trim(),
          studentName: form.studentName.trim() || currentUser?.fullName || "Student Scholar",
          currentRoomId: form.currentRoomId,
          currentBedNumber: form.currentBedNumber,
          targetRoomId: form.targetRoomId,
          targetBedNumber: form.targetBedNumber,
          reason: form.reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit transfer request");

      showToast(data.message || "Room transfer application logged successfully", "success");
      setShowModal(false);
      setForm({
        studentRoll: "",
        studentName: "",
        currentRoomId: "",
        currentBedNumber: "A",
        targetRoomId: "",
        targetBedNumber: "A",
        reason: "",
      });
      fetchTransfers();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error submitting transfer request", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessTransfer = async (transferId: string, processAction: "APPROVE" | "REJECT") => {
    let remarks = "";
    if (processAction === "REJECT") {
      const input = prompt("Enter reason for rejection:") || "";
      if (!input.trim()) return;
      remarks = input.trim();
    }

    try {
      setProcessingId(transferId);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_ROOM_TRANSFER",
          transferId,
          processAction,
          remarks: remarks || `Approved by Chief Warden ${currentUser?.fullName || "Office"}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      showToast(data.message || `Transfer ${processAction.toLowerCase()}d successfully`, "success");
      fetchTransfers();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error processing transfer", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleExportCsv = () => {
    if (!transfers.length) {
      showToast("No transfer records to export", "error");
      return;
    }
    const headers = [
      "Transfer ID",
      "Roll Number",
      "Student Name",
      "From Block",
      "From Room",
      "From Bed",
      "To Block",
      "To Room",
      "To Bed",
      "Reason",
      "Status",
      "Requested Date",
    ];
    const rows = transfers.map((t) => [
      t.id,
      t.studentRoll,
      `"${t.studentName}"`,
      `"${t.currentBlockName}"`,
      t.currentRoomNumber,
      t.currentBedNumber,
      `"${t.targetBlockName}"`,
      t.targetRoomNumber,
      t.targetBedNumber,
      `"${t.reason.replace(/"/g, '""')}"`,
      t.status,
      t.requestedAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hostel_Room_Transfers_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Room Transfers register CSV", "success");
  };

  // Filtered dataset
  const filtered = transfers.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.studentName?.toLowerCase().includes(q);
      const matchRoll = t.studentRoll?.toLowerCase().includes(q);
      const matchRoom =
        t.currentRoomNumber?.toLowerCase().includes(q) ||
        t.targetRoomNumber?.toLowerCase().includes(q);
      const matchReason = t.reason?.toLowerCase().includes(q);
      return matchName || matchRoll || matchRoom || matchReason;
    }
    return true;
  });

  // Calculate available beds in target rooms
  const targetRoom = rooms.find((r) => r.id === form.targetRoomId);
  const targetAvailableBeds = targetRoom
    ? targetRoom.beds.filter((b: any) => !b.isOccupied).map((b: any) => b.bedNumber)
    : ["A", "B", "C"];

  const pendingCount = transfers.filter((t) => t.status === "PENDING_WARDEN").length;
  const approvedCount = transfers.filter((t) => t.status === "APPROVED").length;
  const rejectedCount = transfers.filter((t) => t.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Applications
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {transfers.length}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              Resident Relocations
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Pending Warden Action
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
              {pendingCount}
            </h3>
            <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
              Requires Inspection
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Approved & Relocated
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {approvedCount}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Atomic Bed Swaps
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Rejected / Denied
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-rose-600 dark:text-rose-400 mt-1">
              {rejectedCount}
            </h3>
            <span className="badge-subtle bg-rose-500/10 text-rose-700 dark:text-rose-300 mt-1 inline-block">
              Non-Qualifying
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5" />
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
              placeholder="Search by student, roll, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "PENDING_WARDEN", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-rose-primary text-white"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {st === "ALL" ? "All Requests" : st.replace("_", " ")}
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
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Request Room Transfer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/70 dark:bg-charcoal-800/50 border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Student Scholar</th>
                <th className="p-3.5">Current Room & Bed</th>
                <th className="p-3.5">Requested Target</th>
                <th className="p-3.5">Reason & Justification</th>
                <th className="p-3.5">Requested At</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Warden Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Loading room transfer applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    No room transfer requests found matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">{t.studentName}</div>
                      <div className="font-mono text-[11px] text-rose-primary dark:text-rose-accent">
                        {t.studentRoll}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold">{t.currentBlockName}</div>
                      <div className="text-[11px] text-charcoal-500">
                        Room {t.currentRoomNumber} • Bed {t.currentBedNumber}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {t.targetBlockName}
                      </div>
                      <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400">
                        Room {t.targetRoomNumber} • Bed {t.targetBedNumber}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-charcoal-600 dark:text-charcoal-300" title={t.reason}>
                        {t.reason}
                      </p>
                      {t.remarks && (
                        <p className="text-[10px] text-charcoal-400 mt-0.5 italic">
                          Warden Note: {t.remarks}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-charcoal-500">
                      {new Date(t.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {t.status === "PENDING_WARDEN" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Warden
                        </span>
                      )}
                      {t.status === "APPROVED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Approved & Relocated
                        </span>
                      )}
                      {t.status === "REJECTED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Request Denied
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      {t.status === "PENDING_WARDEN" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            disabled={processingId === t.id}
                            onClick={() => handleProcessTransfer(t.id, "APPROVE")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                          >
                            Approve
                          </button>
                          <button
                            disabled={processingId === t.id}
                            onClick={() => handleProcessTransfer(t.id, "REJECT")}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-charcoal-400">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Room Transfer Application */}
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
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Hostel Room Transfer & Bed Swap Application
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Resident Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS2026-001"
                  value={form.studentRoll}
                  onChange={(e) => handleRollChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Resident Name
                </label>
                <input
                  type="text"
                  placeholder="Auto-detected or enter name"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-800">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Current Room <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.currentRoomId}
                    onChange={(e) => setForm({ ...form, currentRoomId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
                  >
                    <option value="">Select Room...</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.blockName} - Room {r.roomNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Current Bed
                  </label>
                  <select
                    value={form.currentBedNumber}
                    onChange={(e) => setForm({ ...form, currentBedNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
                  >
                    <option value="A">Bed A</option>
                    <option value="B">Bed B</option>
                    <option value="C">Bed C</option>
                    <option value="D">Bed D</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div>
                  <label className="block font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                    Target Room <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={form.targetRoomId}
                    onChange={(e) => setForm({ ...form, targetRoomId: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-emerald-300 dark:border-emerald-700"
                  >
                    <option value="">Select Target Room...</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.blockName} - Room {r.roomNumber} ({r.roomType.replace("_", " ")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                    Target Bed
                  </label>
                  <select
                    value={form.targetBedNumber}
                    onChange={(e) => setForm({ ...form, targetBedNumber: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-emerald-300 dark:border-emerald-700"
                  >
                    {targetAvailableBeds.length > 0 ? (
                      targetAvailableBeds.map((b: string) => (
                        <option key={b} value={b}>
                          Bed {b} (Available)
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="A">Bed A</option>
                        <option value="B">Bed B</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Reason for Transfer Request <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Medical conditions, study schedule compatibility, branch alignment, etc."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
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
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Application"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
