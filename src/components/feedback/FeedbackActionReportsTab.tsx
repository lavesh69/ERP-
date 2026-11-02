"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
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
  ShieldCheck,
  UserCheck,
  Award,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FeedbackActionReport, ActionPlanStatus } from "@/lib/feedback/feedback-engine";

export default function FeedbackActionReportsTab() {
  const { showToast, currentUser, currentRole } = useApp();
  const [reports, setReports] = useState<FeedbackActionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const [form, setForm] = useState({
    targetType: "FACULTY_PEDAGOGY" as const,
    targetId: "fac-02",
    targetName: "Prof. Arthur Vance",
    departmentCode: "CSE",
    triggerReason: "Mid-Term SET feedback flagged doubt clearing responsiveness.",
    correctiveAction: "Assigned departmental peer mentor and scheduled bi-weekly tutorial sessions.",
    assignedAuthority: "HOD Computer Science",
    deadlineDate: "2026-12-15",
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback?tab=action-reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load action reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
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

  const handleSubmitAtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.targetName.trim() || !form.correctiveAction.trim()) {
      showToast("Please fill in target name and corrective action", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ACTION_REPORT",
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create ATR");

      showToast(data.message || "Action Taken Report logged successfully", "success");
      setShowModal(false);
      fetchReports();
    } catch (err: any) {
      showToast(err.message || "Error logging ATR", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ActionPlanStatus) => {
    let remarks = "";
    if (status === "VERIFIED_BY_IQAC") {
      remarks = prompt("Enter IQAC verification comments & resolution outcome:") || "Verified compliant with NAAC Criterion 1.4 by Dean Academics.";
    }

    try {
      setActioningId(id);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_ACTION_REPORT",
          id,
          status,
          iqacRemarks: remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ATR");

      showToast(data.message || "Report updated", "success");
      fetchReports();
    } catch (err: any) {
      showToast(err.message || "Error updating ATR", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleExportCsv = () => {
    if (!reports.length) {
      showToast("No action reports to export", "error");
      return;
    }
    const headers = ["Report Ref", "Target Type", "Target Name", "Dept", "Trigger Reason", "Corrective Action", "Responsible Authority", "Deadline", "Status", "IQAC Verification"];
    const rows = reports.map((r) => [
      r.reportRef,
      r.targetType,
      `"${r.targetName}"`,
      r.departmentCode,
      `"${r.triggerReason.replace(/"/g, '""')}"`,
      `"${r.correctiveAction.replace(/"/g, '""')}"`,
      `"${r.assignedAuthority}"`,
      r.deadlineDate,
      r.status,
      `"${r.iqacRemarks || ""}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IQAC_Action_Taken_Reports_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Action Taken Reports Register", "success");
  };

  const filtered = reports.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (deptFilter !== "ALL" && r.departmentCode !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = r.reportRef?.toLowerCase().includes(q);
      const matchTarget = r.targetName?.toLowerCase().includes(q);
      const matchReason = r.triggerReason?.toLowerCase().includes(q);
      const matchAction = r.correctiveAction?.toLowerCase().includes(q);
      return matchRef || matchTarget || matchReason || matchAction;
    }
    return true;
  });

  const plannedCount = reports.filter((r) => r.status === "ACTION_PLANNED").length;
  const implementedCount = reports.filter((r) => r.status === "IMPLEMENTED" || r.status === "VERIFIED_BY_IQAC").length;
  const verifiedCount = reports.filter((r) => r.status === "VERIFIED_BY_IQAC").length;

  return (
    <div className="space-y-6">
      {/* Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Action Reports
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {reports.length}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              NAAC Criterion 1.4.2
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Action Planned
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-blue-600 dark:text-blue-400 mt-1">
              {plannedCount}
            </h3>
            <span className="badge-subtle bg-blue-500/10 text-blue-700 dark:text-blue-300 mt-1 inline-block">
              Remediation In Progress
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Implemented
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {implementedCount}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Resolved in Department
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              IQAC Ratified
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {verifiedCount}
            </h3>
            <span className="badge-subtle bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 mt-1 inline-block">
              Audit Verified
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
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
              placeholder="Search ATRs, faculty, actions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {["ALL", "ACTION_PLANNED", "IMPLEMENTED", "VERIFIED_BY_IQAC"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? "bg-rose-primary text-white"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {st === "ALL" ? "All ATRs" : st.replace(/_/g, " ")}
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
            <span>Export ATR Register</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Action Taken Report</span>
          </button>
        </div>
      </div>

      {/* ATR Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-ivory-50/70 dark:bg-charcoal-800/50 border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Reference & Target</th>
                <th className="p-3.5">Trigger Feedback Issue</th>
                <th className="p-3.5">Corrective Action Taken</th>
                <th className="p-3.5">Authority & Deadline</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">IQAC Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-800 dark:text-ivory-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-charcoal-400">Loading action reports...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-charcoal-400">No action taken reports found.</td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/30 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono text-[11px] font-bold text-rose-primary dark:text-rose-accent">
                        {r.reportRef}
                      </div>
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm mt-0.5">
                        {r.targetName}
                      </div>
                      <div className="text-[10px] text-charcoal-400 uppercase tracking-wider">
                        {r.targetType.replace(/_/g, " ")} • {r.departmentCode}
                      </div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-charcoal-600 dark:text-charcoal-300">
                        {r.triggerReason}
                      </p>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-2 text-charcoal-800 dark:text-ivory-200 font-medium">
                        {r.correctiveAction}
                      </p>
                      {r.iqacRemarks && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                          ✓ IQAC: {r.iqacRemarks}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-semibold">{r.assignedAuthority}</div>
                      <div className="text-[10px] text-charcoal-400">
                        Target: {new Date(r.deadlineDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      {r.status === "ACTION_PLANNED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                          ACTION PLANNED
                        </span>
                      )}
                      {r.status === "IMPLEMENTED" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          IMPLEMENTED
                        </span>
                      )}
                      {r.status === "VERIFIED_BY_IQAC" && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" /> IQAC RATIFIED
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "ACTION_PLANNED" && (
                          <button
                            disabled={actioningId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "IMPLEMENTED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition-colors"
                          >
                            Mark Implemented
                          </button>
                        )}
                        {r.status === "IMPLEMENTED" && (
                          <button
                            disabled={actioningId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "VERIFIED_BY_IQAC")}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                          >
                            IQAC Verify
                          </button>
                        )}
                        {r.status === "VERIFIED_BY_IQAC" && (
                          <span className="text-[11px] text-emerald-600 font-semibold">Compliant</span>
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

      {/* Modal: New ATR */}
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
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  New Action Taken Report (ATR / CAP)
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAtr} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Target Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.targetType}
                    onChange={(e) => setForm({ ...form, targetType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="FACULTY_PEDAGOGY">Faculty Pedagogy & Teaching</option>
                    <option value="COURSE_CURRICULUM">Course & Curriculum Syllabus</option>
                    <option value="CAMPUS_FACILITY">Campus Facility & Lab</option>
                    <option value="DEPARTMENTAL_SLA">Department Academic SLA</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.departmentCode}
                    onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="ME">Mechanical (ME)</option>
                    <option value="CIVIL">Civil (CIVIL)</option>
                    <option value="HUM">Humanities (HUM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Target Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Arthur Vance, or CS204 Algorithms"
                  value={form.targetName}
                  onChange={(e) => setForm({ ...form, targetName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Trigger Reason / Evaluation Score Gap <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.triggerReason}
                  onChange={(e) => setForm({ ...form, triggerReason: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Corrective Action Plan (CAP) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={form.correctiveAction}
                  onChange={(e) => setForm({ ...form, correctiveAction: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Responsible Authority <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.assignedAuthority}
                    onChange={(e) => setForm({ ...form, assignedAuthority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Remediation Deadline <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.deadlineDate}
                    onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
                  />
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
                  <span>{isSubmitting ? "Logging..." : "Log Action Report"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
