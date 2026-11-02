"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Zap,
  Droplets,
  Hammer,
  Wind,
  Wifi,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  X,
  Send,
  Building,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  HostelMaintenanceTicket,
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from "@/lib/hostel/hostel-engine";

interface HostelMaintenanceTabProps {
  blocks: any[];
  rooms: any[];
  onRefresh?: () => void;
}

export default function HostelMaintenanceTab({ blocks, rooms, onRefresh }: HostelMaintenanceTabProps) {
  const { showToast, currentUser, currentRole } = useApp();
  const [tickets, setTickets] = useState<HostelMaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [form, setForm] = useState({
    blockId: blocks[0]?.id || "block-a",
    roomNumber: "A-101",
    bedNumber: "A",
    category: "ELECTRICAL" as MaintenanceCategory,
    priority: "MEDIUM" as MaintenancePriority,
    description: "",
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hostel?tab=maintenance");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load maintenance tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
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

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.roomNumber.trim()) {
      showToast("Room number is required", "error");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 5) {
      showToast("Please provide a defect description (minimum 5 characters)", "error");
      return;
    }

    const selBlock = blocks.find((b) => b.id === form.blockId);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_MAINTENANCE_TICKET",
          blockId: form.blockId,
          blockName: selBlock?.name || "Nelson Mandela Hall (Block A)",
          roomNumber: form.roomNumber.trim(),
          bedNumber: form.bedNumber,
          category: form.category,
          priority: form.priority,
          description: form.description.trim(),
          reportedRoll: (currentUser as any)?.studentRollNumber || currentUser?.email?.split("@")[0] || "RESIDENT",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log maintenance ticket");

      showToast(data.message || "Maintenance ticket dispatched to estate facilities team", "success");
      setShowModal(false);
      setForm({
        blockId: blocks[0]?.id || "block-a",
        roomNumber: "A-101",
        bedNumber: "A",
        category: "ELECTRICAL",
        priority: "MEDIUM",
        description: "",
      });
      fetchTickets();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error logging ticket", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: "IN_PROGRESS" | "RESOLVED") => {
    let notes = "";
    if (status === "RESOLVED") {
      const input = prompt("Enter resolution notes / repairs completed:") || "";
      notes = input.trim() || "Repaired and verified by on-duty maintenance engineer.";
    }

    try {
      setActioningId(ticketId);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MAINTENANCE_TICKET",
          ticketId,
          status,
          resolutionNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ticket status");

      showToast(data.message || `Ticket marked as ${status.replace("_", " ").toLowerCase()}`, "success");
      fetchTickets();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error updating ticket", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleExportCsv = () => {
    if (!tickets.length) {
      showToast("No maintenance tickets to export", "error");
      return;
    }
    const headers = [
      "Ticket ID",
      "Block",
      "Room",
      "Bed",
      "Category",
      "Priority",
      "Status",
      "Reported By",
      "Reported Date",
      "Description",
      "Resolution Notes",
    ];
    const rows = tickets.map((t) => [
      t.ticketNumber,
      `"${t.blockName}"`,
      t.roomNumber,
      t.bedNumber || "N/A",
      t.category,
      t.priority,
      t.status,
      `"${t.reportedBy}"`,
      t.reportedAt,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${(t.resolutionNotes || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hostel_Maintenance_Tickets_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Maintenance Register CSV", "success");
  };

  const getCategoryIcon = (cat: MaintenanceCategory) => {
    switch (cat) {
      case "ELECTRICAL":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "PLUMBING":
        return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
      case "CARPENTRY":
        return <Hammer className="w-3.5 h-3.5 text-amber-700" />;
      case "AIR_CONDITIONING":
        return <Wind className="w-3.5 h-3.5 text-cyan-500" />;
      case "INTERNET_WIFI":
        return <Wifi className="w-3.5 h-3.5 text-indigo-500" />;
      case "HOUSEKEEPING":
        return <Sparkles className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  const filtered = tickets.filter((t) => {
    if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber?.toLowerCase().includes(q);
      const matchRoom = t.roomNumber?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchReporter = t.reportedBy?.toLowerCase().includes(q);
      return matchNum || matchRoom || matchDesc || matchReporter;
    }
    return true;
  });

  const openCount = tickets.filter((t) => t.status === "OPEN").length;
  const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS" || t.status === "ASSIGNED").length;
  const urgentCount = tickets.filter((t) => t.priority === "URGENT" || t.priority === "HIGH").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Defect Tickets
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {tickets.length}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              Hostel Facilities
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Open & Unassigned
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
              {openCount}
            </h3>
            <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
              Awaiting Technician
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Urgent / High Priority
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-rose-600 dark:text-rose-400 mt-1">
              {urgentCount}
            </h3>
            <span className="badge-subtle bg-rose-500/10 text-rose-700 dark:text-rose-300 mt-1 inline-block">
              Priority SLA Target
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Resolved & Verified
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {resolvedCount}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Work Completed
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
              placeholder="Search tickets, rooms, defects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "PLUMBING", "ELECTRICAL", "CARPENTRY", "AIR_CONDITIONING", "INTERNET_WIFI", "HOUSEKEEPING"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    categoryFilter === cat
                      ? "bg-rose-primary text-white"
                      : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                  }`}
                >
                  {cat === "ALL" ? "All Categories" : cat.replace("_", " ")}
                </button>
              )
            )}
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
            <span>Report Maintenance Defect</span>
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/70 dark:bg-charcoal-800/50 border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Ticket & Location</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Defect Description</th>
                <th className="p-3.5">Reported By</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Maintenance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Loading maintenance tickets...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    No maintenance tickets found matching selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-rose-primary dark:text-rose-accent">
                        {t.ticketNumber}
                      </div>
                      <div className="font-semibold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                        Room {t.roomNumber} {t.bedNumber ? `(Bed ${t.bedNumber})` : ""}
                      </div>
                      <div className="text-[11px] text-charcoal-500">{t.blockName}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ivory-100 dark:bg-charcoal-800 font-semibold text-[11px]">
                        {getCategoryIcon(t.category)}
                        <span>{t.category.replace("_", " ")}</span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {t.priority === "URGENT" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 inline-flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-600 animate-pulse" /> URGENT SLA
                        </span>
                      )}
                      {t.priority === "HIGH" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          HIGH
                        </span>
                      )}
                      {t.priority === "MEDIUM" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          MEDIUM
                        </span>
                      )}
                      {t.priority === "LOW" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          LOW
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-charcoal-700 dark:text-ivory-300 font-medium">
                        {t.description}
                      </p>
                      {t.resolutionNotes && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ Resolution: {t.resolutionNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold">{t.reportedBy}</div>
                      <div className="text-[10px] text-charcoal-400">
                        {new Date(t.reportedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {t.status === "OPEN" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          OPEN
                        </span>
                      )}
                      {t.status === "IN_PROGRESS" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          IN PROGRESS
                        </span>
                      )}
                      {t.status === "RESOLVED" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          RESOLVED
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {t.status === "OPEN" && (
                          <button
                            disabled={actioningId === t.id}
                            onClick={() => handleUpdateStatus(t.id, "IN_PROGRESS")}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Assign / In-Progress
                          </button>
                        )}
                        {t.status !== "RESOLVED" && (
                          <button
                            disabled={actioningId === t.id}
                            onClick={() => handleUpdateStatus(t.id, "RESOLVED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                          >
                            Mark Resolved
                          </button>
                        )}
                        {t.status === "RESOLVED" && (
                          <span className="text-[11px] text-emerald-600 font-semibold">Closed & Verified</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Report Defect Ticket */}
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
                  <Wrench className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Log Hostel Maintenance & Repair Ticket
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Hostel Block <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.blockId}
                  onChange={(e) => setForm({ ...form, blockId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                >
                  {blocks.map((blk) => (
                    <option key={blk.id} value={blk.id}>
                      {blk.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A-101"
                    value={form.roomNumber}
                    onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Bed Designation
                  </label>
                  <select
                    value={form.bedNumber}
                    onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="A">Bed A</option>
                    <option value="B">Bed B</option>
                    <option value="C">Bed C</option>
                    <option value="D">Bed D</option>
                    <option value="">Common Room Area</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="ELECTRICAL">Electrical (Lights/Fan/Sockets)</option>
                    <option value="PLUMBING">Plumbing (Tap/Geyser/Drain)</option>
                    <option value="CARPENTRY">Carpentry (Bed/Wardrobe/Door)</option>
                    <option value="AIR_CONDITIONING">Air Conditioning / HVAC</option>
                    <option value="INTERNET_WIFI">Internet / LAN / WiFi</option>
                    <option value="HOUSEKEEPING">Housekeeping / Sanitation</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Priority Level <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="LOW">Low (Routine maintenance)</option>
                    <option value="MEDIUM">Medium (Within 24 hours)</option>
                    <option value="HIGH">High (Within 6 hours)</option>
                    <option value="URGENT">Urgent (Immediate SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Defect Description & Issue Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the issue in detail (e.g., ceiling fan regulator sparking, tap leaking in bathroom)..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                  <span>{isSubmitting ? "Dispatching..." : "Dispatch Defect Ticket"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
