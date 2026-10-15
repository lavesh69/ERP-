"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  FileText,
  ShieldCheck,
  Eye,
  Plus,
  RefreshCw,
  Scale,
  DollarSign,
  UserCheck,
  Send,
  X,
  Printer,
  ChevronRight,
} from "lucide-react";
import {
  RevaluationApplication,
  RevaluationAnalytics,
  RevaluationType,
} from "@/lib/examinations/revaluation-engine";

export function RevaluationPortalView() {
  const { currentUser, currentRole, showToast } = useApp();
  const [applications, setApplications] = useState<RevaluationApplication[]>([]);
  const [analytics, setAnalytics] = useState<RevaluationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<RevaluationApplication | null>(null);

  // Forms
  const [applyForm, setApplyForm] = useState({
    courseCode: "CS-402",
    courseTitle: "Advanced Neural Networks",
    originalMarks: 68,
    originalGrade: "B",
    type: "DOUBLE_BLIND_REVALUATION" as RevaluationType,
    remarks: "Requesting double-blind scrutiny of Question 4 derivation.",
  });
  const [examinerName, setExaminerName] = useState("Dr. K. R. Meenakshi (External Examiner)");
  const [evalMarks, setEvalMarks] = useState<number>(75);
  const [evalNotes, setEvalNotes] = useState("");

  const isCoE = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "PRINCIPAL"].includes(currentRole);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/examinations/revaluation");
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to fetch revaluations:", err);
      showToast("Error retrieving revaluation records", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/examinations/revaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY",
          ...applyForm,
          studentName: currentUser?.fullName || "Scholar Candidate",
          rollNumber: (currentUser as any)?.rollNumber || "2026-CSE-001",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Revaluation application filed successfully", "success");
        setIsApplyModalOpen(false);
        fetchApplications();
      } else {
        showToast(data.error || "Failed to submit application", "danger");
      }
    } catch {
      showToast("Network error submitting application", "danger");
    }
  };

  const handleAssignExaminer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const res = await fetch("/api/examinations/revaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_EXAMINER",
          applicationId: selectedApp.id,
          examinerName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("External blind examiner assigned", "success");
        setIsAssignModalOpen(false);
        fetchApplications();
      } else {
        showToast(data.error || "Failed to assign examiner", "danger");
      }
    } catch {
      showToast("Network error assigning examiner", "danger");
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const res = await fetch("/api/examinations/revaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_EVALUATION",
          applicationId: selectedApp.id,
          revisedMarks: evalMarks,
          examinerNotes: evalNotes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Evaluation recorded successfully", "success");
        setIsEvalModalOpen(false);
        fetchApplications();
      } else {
        showToast(data.error || "Failed to record evaluation", "danger");
      }
    } catch {
      showToast("Network error recording evaluation", "danger");
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.courseCode.toLowerCase().includes(search.toLowerCase()) ||
      app.studentName.toLowerCase().includes(search.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.dummyNumber.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || app.type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-rose-950 to-charcoal-900 text-white rounded-2xl p-6 shadow-md border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Statutory Examination Grievance Redressal
              </span>
              <span className="text-[10px] font-mono text-charcoal-300">
                UGC & State Univ Examination Regulation Compliant
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <RotateCcw className="h-6 w-6 text-amber-400" />
              Post-Result Revaluation, Retotaling & Certified Script Photocopy
            </h2>
            <p className="text-xs text-charcoal-300 mt-1 max-w-3xl">
              Double-blind external examination scrutiny, arithmetic summation audits, certified photocopy watermarks, referee dispute arbitration, and automated grade sheet revision.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-charcoal-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Apply for Revaluation</span>
            </button>
            <button
              onClick={fetchApplications}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors"
              title="Refresh Registry"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Row */}
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Total Filed
            </span>
            <span className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">
              {analytics.totalApplications}
            </span>
            <span className="text-[10px] text-charcoal-400">Current Semester</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Certified Photocopies
            </span>
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              {analytics.photocopyCount}
            </span>
            <span className="text-[10px] text-indigo-500">Watermarked PDF</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Double-Blind Scrutiny
            </span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {analytics.revaluationCount}
            </span>
            <span className="text-[10px] text-amber-500">External Examiners</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Grade Improved
            </span>
            <span className="text-2xl font-bold text-academic-success mt-0.5 block">
              {analytics.gradeImprovedCount}
            </span>
            <span className="text-[10px] text-academic-success">SGPA Revised</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Referee Cases (&gt;15%)
            </span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
              {analytics.refereeCasesCount}
            </span>
            <span className="text-[10px] text-purple-500">Adjudicated</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
              Fees Refunded (≥10% Δ)
            </span>
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-0.5 block">
              ₹{analytics.totalFeesRefundedInr.toLocaleString()}
            </span>
            <span className="text-[10px] text-teal-500">Credited to Bursar</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-3 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate, roll, code, or dummy ID..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
          >
            <option value="ALL">All Redressal Types</option>
            <option value="DOUBLE_BLIND_REVALUATION">Double-Blind Revaluation</option>
            <option value="RETOTALING">Retotaling</option>
            <option value="CERTIFIED_PHOTOCOPY">Certified Photocopy</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="SCRUTINY_PENDING">Scrutiny Pending</option>
            <option value="EVALUATOR_ASSIGNED">Evaluator Assigned</option>
            <option value="REFEREE_REVIEW">Referee Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Applications Roster Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border dark:border-charcoal-800 bg-ivory-50 dark:bg-charcoal-800/50 text-charcoal-500 uppercase tracking-wider font-bold">
                <th className="p-3.5">App No & Scholar</th>
                <th className="p-3.5">Subject & Exam</th>
                <th className="p-3.5">Type & Fee</th>
                <th className="p-3.5">Blind Mask</th>
                <th className="p-3.5">Original vs Revised</th>
                <th className="p-3.5">Status & Seal</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100 block">
                      {app.applicationNumber}
                    </span>
                    <span className="text-charcoal-600 dark:text-charcoal-400 font-medium">
                      {app.studentName} ({app.rollNumber})
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                      {app.courseCode}: {app.courseTitle}
                    </span>
                    <span className="text-[11px] text-charcoal-400">{app.examId}</span>
                  </td>

                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 block w-fit">
                      {app.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-charcoal-500 font-medium mt-0.5 block">
                      Fee: ₹{app.feeAmount} • {app.paymentStatus}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200">
                      {app.dummyNumber}
                    </span>
                    {app.assignedExaminer && (
                      <span className="text-[10px] text-charcoal-500 block mt-1 line-clamp-1">
                        {app.assignedExaminer}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span>{app.originalMarks} ({app.originalGrade})</span>
                      {app.revisedMarks !== undefined && (
                        <>
                          <ChevronRight className="h-3 w-3 text-charcoal-400" />
                          <span className={app.marksDelta && app.marksDelta > 0 ? "text-academic-success font-bold" : "text-charcoal-700 font-bold"}>
                            {app.revisedMarks} ({app.revisedGrade})
                          </span>
                        </>
                      )}
                    </div>
                    {app.marksDelta !== undefined && (
                      <span className={`text-[10px] font-bold block ${app.marksDelta > 0 ? "text-academic-success" : "text-charcoal-500"}`}>
                        Delta: {app.marksDelta > 0 ? `+${app.marksDelta}` : app.marksDelta} ({app.percentageChange}%)
                      </span>
                    )}
                  </td>

                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold block w-fit ${
                      app.status === "COMPLETED"
                        ? "bg-academic-success-subtle text-academic-success"
                        : app.status === "REFEREE_REVIEW"
                        ? "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                        : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    }`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                    {app.completionSeal && (
                      <span className="font-mono text-[9px] text-charcoal-400 block mt-1 line-clamp-1" title={app.completionSeal}>
                        {app.completionSeal}
                      </span>
                    )}
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isCoE && app.status === "SCRUTINY_PENDING" && (
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[11px] font-bold"
                        >
                          Assign Examiner
                        </button>
                      )}

                      {isCoE && (app.status === "EVALUATOR_ASSIGNED" || app.status === "REFEREE_REVIEW") && (
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setEvalMarks(app.originalMarks);
                            setIsEvalModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-bold"
                        >
                          Enter Score
                        </button>
                      )}

                      {app.status === "COMPLETED" && (
                        <button
                          onClick={() => window.print()}
                          className="p-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 hover:bg-ivory-200"
                          title="Print Redressal Order"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                Apply for Revaluation / Photocopy
              </h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                  Redressal Service Type
                </label>
                <select
                  value={applyForm.type}
                  onChange={(e) => setApplyForm({ ...applyForm, type: e.target.value as RevaluationType })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                >
                  <option value="DOUBLE_BLIND_REVALUATION">Double-Blind Revaluation (₹1,000)</option>
                  <option value="RETOTALING">Arithmetic Retotaling (₹200)</option>
                  <option value="CERTIFIED_PHOTOCOPY">Certified Script Photocopy (₹300)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    value={applyForm.courseCode}
                    onChange={(e) => setApplyForm({ ...applyForm, courseCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                    Awarded Marks
                  </label>
                  <input
                    type="number"
                    value={applyForm.originalMarks}
                    onChange={(e) => setApplyForm({ ...applyForm, originalMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                  Specific Grievance / Scrutiny Reason
                </label>
                <textarea
                  value={applyForm.remarks}
                  onChange={(e) => setApplyForm({ ...applyForm, remarks: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                <p className="font-bold">Statutory Fee Refund Policy:</p>
                <p>If revaluation yields a score increase of 10% or more, 100% of the revaluation fee is automatically credited back to your bursar student fee ledger.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-ivory-300 hover:bg-ivory-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-charcoal-950 font-bold text-xs"
                >
                  Submit & Pay Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Examiner Modal */}
      {isAssignModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                Assign External Blind Examiner
              </h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssignExaminer} className="space-y-3">
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-xs">
                <span className="text-charcoal-500 block">Dummy Mask ID:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{selectedApp.dummyNumber}</span>
                <p className="text-[10px] text-charcoal-400 mt-1">Student identity is completely masked for examiner neutrality.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                  Examiner Name & Affiliation
                </label>
                <input
                  type="text"
                  value={examinerName}
                  onChange={(e) => setExaminerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 hover:bg-ivory-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evaluate Score Modal */}
      {isEvalModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                Record Revaluation Scrutiny Score
              </h3>
              <button onClick={() => setIsEvalModalOpen(false)} className="text-charcoal-400 hover:text-charcoal-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 text-xs">
                <div>
                  <span className="text-charcoal-500 block">Original Awarded:</span>
                  <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{selectedApp.originalMarks} Marks ({selectedApp.originalGrade})</span>
                </div>
                <div>
                  <span className="text-charcoal-500 block">Blind Mask:</span>
                  <span className="font-mono font-bold text-sm text-indigo-600">{selectedApp.dummyNumber}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                  Revised Scrutiny Marks
                </label>
                <input
                  type="number"
                  value={evalMarks}
                  onChange={(e) => setEvalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                  Examiner Adjudication Notes
                </label>
                <textarea
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800"
                  placeholder="Note specific sub-question discrepancies or mark adjustments..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 hover:bg-ivory-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-charcoal-950 font-bold text-xs"
                >
                  Submit & Finalize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
