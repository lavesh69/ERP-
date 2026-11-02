"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  MapPin,
  Award,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  X,
  Send,
  Building,
  Bed,
  Users,
  Compass,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HostelWaitlistEntry, GenderAllowed, RoomType } from "@/lib/hostel/hostel-engine";

interface HostelWaitlistTabProps {
  blocks: any[];
  onRefresh?: () => void;
}

export default function HostelWaitlistTab({ blocks, onRefresh }: HostelWaitlistTabProps) {
  const { showToast, currentUser, currentRole } = useApp();
  const [waitlist, setWaitlist] = useState<HostelWaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roomTypeFilter, setRoomTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    studentName: "",
    studentRoll: "",
    gender: "COED" as GenderAllowed,
    branch: "Computer Science & Engineering",
    preferredBlockId: blocks[0]?.id || "block-a",
    preferredRoomType: "DOUBLE_AC" as RoomType,
    distanceFromHomeKm: 450,
  });

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hostel?tab=waitlist");
      if (res.ok) {
        const data = await res.json();
        setWaitlist(data.waitlist || []);
      }
    } catch (err) {
      console.error("Failed to load waitlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
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

  const handleSubmitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentName.trim() || !form.studentRoll.trim()) {
      showToast("Student name and roll number are required", "error");
      return;
    }

    const selBlock = blocks.find((b) => b.id === form.preferredBlockId);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "JOIN_WAITLIST",
          ...form,
          preferredBlockName: selBlock?.name || "Nelson Mandela Hall (Block A)",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join waitlist");

      showToast(data.message || "Enrolled into hostel accommodation priority queue", "success");
      setShowModal(false);
      setForm({
        studentName: "",
        studentRoll: "",
        gender: "COED",
        branch: "Computer Science & Engineering",
        preferredBlockId: blocks[0]?.id || "block-a",
        preferredRoomType: "DOUBLE_AC",
        distanceFromHomeKm: 450,
      });
      fetchWaitlist();
      onRefresh?.();
    } catch (err: any) {
      showToast(err.message || "Error submitting waitlist entry", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    if (!waitlist.length) {
      showToast("No waitlist records to export", "error");
      return;
    }
    const headers = [
      "Token ID",
      "Roll Number",
      "Student Name",
      "Branch",
      "Gender",
      "Distance (km)",
      "Priority Score",
      "Preferred Block",
      "Preferred Room Type",
      "Status",
      "Applied Date",
    ];
    const rows = waitlist.map((w) => [
      w.waitlistToken,
      w.studentRoll,
      `"${w.studentName}"`,
      `"${w.branch}"`,
      w.gender,
      w.distanceFromHomeKm,
      w.priorityScore,
      `"${w.preferredBlockName}"`,
      w.preferredRoomType,
      w.status,
      w.appliedAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Hostel_Waitlist_Queue_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Waitlist Queue CSV", "success");
  };

  const filtered = waitlist.filter((w) => {
    if (statusFilter !== "ALL" && w.status !== statusFilter) return false;
    if (roomTypeFilter !== "ALL" && w.preferredRoomType !== roomTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = w.studentName?.toLowerCase().includes(q);
      const matchRoll = w.studentRoll?.toLowerCase().includes(q);
      const matchBranch = w.branch?.toLowerCase().includes(q);
      const matchToken = w.waitlistToken?.toLowerCase().includes(q);
      return matchName || matchRoll || matchBranch || matchToken;
    }
    return true;
  });

  const waitingCount = waitlist.filter((w) => w.status === "WAITLISTED").length;
  const outstationCount = waitlist.filter((w) => w.distanceFromHomeKm > 300).length;
  const allottedCount = waitlist.filter((w) => w.status === "ALLOTTED").length;

  return (
    <div className="space-y-6">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Active Waitlist Queue
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
              {waitingCount}
            </h3>
            <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
              Awaiting Bed Release
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Applicants Logged
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {waitlist.length}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              Priority Registered
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Outstation (&gt;300km)
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {outstationCount}
            </h3>
            <span className="badge-subtle bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 mt-1 inline-block">
              High Priority Tier
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Allotted from Queue
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {allottedCount}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Converted to Resident
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Institutional Policy Notice */}
      <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-850 border border-border dark:border-charcoal-750 flex items-start gap-3 text-xs">
        <Sparkles className="w-5 h-5 text-rose-primary shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-charcoal-900 dark:text-ivory-100">
            Statutory Housing Priority Ranking Policy
          </h4>
          <p className="text-charcoal-600 dark:text-charcoal-300 mt-0.5 leading-relaxed">
            Hostel accommodation allocations are prioritized algorithmically based on residential distance from campus:
            <code className="mx-1 px-1.5 py-0.5 bg-white dark:bg-charcoal-800 rounded font-mono text-[11px]">
              PriorityScore = min(100, Math.round(DistanceKm / 10))
            </code>
            . Non-local and international scholars (&gt;500 km) receive priority admission to available dormitory inventory.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student, roll, branch, token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "WAITLISTED", "ALLOTTED", "CANCELLED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-rose-primary text-white"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {st === "ALL" ? "All Queue" : st}
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
            <span>Export Waitlist</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Join Waitlist</span>
          </button>
        </div>
      </div>

      {/* Waitlist Queue Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/70 dark:bg-charcoal-800/50 border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Rank & Token</th>
                <th className="p-3.5">Student Scholar</th>
                <th className="p-3.5">Hometown Distance</th>
                <th className="p-3.5">Priority Score</th>
                <th className="p-3.5">Preferred Allotment</th>
                <th className="p-3.5">Applied Date</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    Loading priority waitlist queue...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-charcoal-400">
                    No waitlisted applicants found matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((w, idx) => (
                  <tr key={w.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-container text-rose-primary font-bold flex items-center justify-center text-[11px]">
                          #{idx + 1}
                        </span>
                        <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">
                          {w.waitlistToken}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">{w.studentName}</div>
                      <div className="font-mono text-[11px] text-rose-primary dark:text-rose-accent">
                        {w.studentRoll}
                      </div>
                      <div className="text-[10px] text-charcoal-400">{w.branch}</div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold flex items-center gap-1 text-charcoal-800 dark:text-ivory-200">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{w.distanceFromHomeKm} km</span>
                      </div>
                      <span className="text-[10px] text-charcoal-400">
                        {w.distanceFromHomeKm > 300 ? "Outstation Scholar" : "Regional Resident"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-ivory-200 dark:bg-charcoal-700 overflow-hidden">
                          <div
                            className="h-full bg-rose-primary rounded-full"
                            style={{ width: `${Math.min(100, w.priorityScore)}%` }}
                          />
                        </div>
                        <span className="font-bold font-mono text-rose-primary dark:text-rose-accent">
                          {w.priorityScore}/100
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-charcoal-900 dark:text-ivory-100">
                        {w.preferredBlockName}
                      </div>
                      <span className="badge-subtle bg-rose-container/50 text-rose-primary text-[10px]">
                        {w.preferredRoomType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-charcoal-500">
                      {new Date(w.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {w.status === "WAITLISTED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Queued
                        </span>
                      )}
                      {w.status === "ALLOTTED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Room Allocated
                        </span>
                      )}
                      {w.status === "CANCELLED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Join Waitlist */}
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
                  <ClipboardList className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Hostel Accommodation Waitlist Application
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWaitlist} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Jenkins"
                    value={form.studentName}
                    onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS2026-099"
                    value={form.studentRoll}
                    onChange={(e) => setForm({ ...form, studentRoll: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Gender Allotment <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="MALE">Male Resident</option>
                    <option value="FEMALE">Female Resident</option>
                    <option value="COED">Co-Ed / All</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Academic Branch
                  </label>
                  <input
                    type="text"
                    value={form.branch}
                    onChange={(e) => setForm({ ...form, branch: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Preferred Block <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.preferredBlockId}
                    onChange={(e) => setForm({ ...form, preferredBlockId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    {blocks.map((blk) => (
                      <option key={blk.id} value={blk.id}>
                        {blk.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Preferred Room Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.preferredRoomType}
                    onChange={(e) => setForm({ ...form, preferredRoomType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="SINGLE_AC">Single Occupancy (AC)</option>
                    <option value="DOUBLE_AC">Double Sharing (AC)</option>
                    <option value="TRIPLE_NON_AC">Triple Sharing (Non-AC)</option>
                    <option value="FOUR_SHARING">Four Sharing Dormitory</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Distance from Hometown: {form.distanceFromHomeKm} km
                  </label>
                  <span className="font-mono font-bold text-xs bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300">
                    Priority Score: {Math.min(100, Math.round(form.distanceFromHomeKm / 10))}/100
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1200"
                  step="10"
                  value={form.distanceFromHomeKm}
                  onChange={(e) => setForm({ ...form, distanceFromHomeKm: Number(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-charcoal-500">
                  <span>20 km (Local)</span>
                  <span>500 km (Statewide)</span>
                  <span>1,200+ km (National / International)</span>
                </div>
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
                  <span>{isSubmitting ? "Enrolling..." : "Submit to Queue"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
