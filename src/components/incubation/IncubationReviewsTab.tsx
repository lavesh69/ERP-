// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationReviewsTab Component
 * Quarterly milestone reviews, technical velocity assessments, and mentor evaluation records.
 */

"use client";

import React, { useState } from "react";
import {
  Award,
  Star,
  TrendingUp,
  Clock,
  PlusCircle,
  X,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  Building,
} from "lucide-react";
import { QuarterlyMilestoneReview, IncubatedStartup } from "@/lib/incubation/incubation-engine";

interface IncubationReviewsTabProps {
  reviews: QuarterlyMilestoneReview[];
  startups: IncubatedStartup[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationReviewsTab({
  reviews,
  startups,
  onRefresh,
  showToast,
}: IncubationReviewsTabProps) {
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    startupId: startups[0]?.id || "",
    quarter: "Q3 2026-27",
    reviewerName: "",
    mrrAchieved: 5000,
    prototypeStage: "Production Beta Pilot",
    overallRating: 5,
    mentorRemarks: "",
    recommendedAction: "CONTINUE_INCUBATION" as const,
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews).toFixed(1)
    : "5.0";

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startupId || !form.quarter.trim() || !form.mentorRemarks.trim()) {
      showToast("Venture, quarter, and mentor remarks are required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_REVIEW",
          ...form,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record milestone review");
      }

      showToast(data.message || "Quarterly milestone review logged", "success");
      setShowModal(false);
      setForm({
        startupId: startups[0]?.id || "",
        quarter: "Q3 2026-27",
        reviewerName: "",
        mrrAchieved: 5000,
        prototypeStage: "Production Beta Pilot",
        overallRating: 5,
        mentorRemarks: "",
        recommendedAction: "CONTINUE_INCUBATION",
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = "Review Ref,Startup Name,Quarter,Reviewer,MRR (INR),Rating,Recommendation,Remarks,Date\n";
    const rows = reviews
      .map((r) => `"${r.reviewRef}","${r.startupName}","${r.quarter}","${r.reviewerName}",${r.mrrAchieved},${r.overallRating},"${r.recommendedAction}","${(r.mentorRemarks || "").replace(/"/g, '""')}","${r.reviewDate}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Milestone_Reviews_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Milestone Reviews Logged</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-primary">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {totalReviews}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Formal advisory committee assessments</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Cohort Velocity</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {avgRating} / 5.0
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Strong product-market fit trajectory</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fast-Track Accelerated</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            {reviews.filter((r) => r.recommendedAction === "FAST_TRACK_ACCELERATION").length}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Ready for Series A co-investment</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">EIR & Mentor Density</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            100%
          </div>
          <p className="text-xs text-charcoal-400 mt-1">All ventures mapped to industry EIRs</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
            Quarterly Milestone Evaluation Registry
          </h3>
          <p className="text-xs text-charcoal-400">Venture velocity, revenue traction, and committee steering recommendations</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-charcoal-700 text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Reviews</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Quarterly Review</span>
          </button>
        </div>
      </div>

      {/* Reviews Cards */}
      <div className="space-y-4">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                  {rev.reviewRef}
                </span>
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                  {rev.startupName}
                </span>
                <span className="text-xs font-semibold text-charcoal-400">• {rev.quarter}</span>
              </div>

              <p className="text-xs text-charcoal-700 dark:text-ivory-200 italic">
                &ldquo;{rev.mentorRemarks}&rdquo;
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-500 pt-1">
                <span>Reviewer: <strong className="text-charcoal-800 dark:text-ivory-200">{rev.reviewerName}</strong></span>
                <span>Stage: <strong className="text-charcoal-800 dark:text-ivory-200">{rev.prototypeStage}</strong></span>
                <span>Monthly Revenue (MRR): <strong className="text-emerald-600 dark:text-emerald-400">INR {rev.mrrAchieved.toLocaleString("en-IN")}</strong></span>
              </div>
            </div>

            <div className="flex flex-col md:items-end gap-2 shrink-0">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= rev.overallRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-charcoal-300 dark:text-charcoal-700"
                    }`}
                  />
                ))}
              </div>

              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  rev.recommendedAction === "FAST_TRACK_ACCELERATION"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                    : rev.recommendedAction === "CONTINUE_INCUBATION"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {rev.recommendedAction.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Record Review Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-rose-primary" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Record Quarterly Milestone Review
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Target Cohort Venture *
                </label>
                <select
                  required
                  value={form.startupId}
                  onChange={(e) => setForm({ ...form, startupId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startupName} ({s.companyRef})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Quarter *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 2026-27"
                    value={form.quarter}
                    onChange={(e) => setForm({ ...form, quarter: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Lead Reviewer / EIR Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Arvind Gupta"
                    value={form.reviewerName}
                    onChange={(e) => setForm({ ...form, reviewerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Current Monthly Revenue / MRR (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.mrrAchieved}
                    onChange={(e) => setForm({ ...form, mrrAchieved: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Velocity Rating (1 to 5)
                  </label>
                  <select
                    value={form.overallRating}
                    onChange={(e) => setForm({ ...form, overallRating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value={5}>5 - Outstanding (Exceeding Milestones)</option>
                    <option value={4}>4 - Strong (On Track)</option>
                    <option value={3}>3 - Acceptable (Minor Delays)</option>
                    <option value={2}>2 - At Risk (Pivot / Support Needed)</option>
                    <option value={1}>1 - Stalled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Committee Steering Recommendation
                </label>
                <select
                  value={form.recommendedAction}
                  onChange={(e) => setForm({ ...form, recommendedAction: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="CONTINUE_INCUBATION">Continue Standard Incubation</option>
                  <option value="FAST_TRACK_ACCELERATION">Fast-Track Acceleration & Seed Co-Investment</option>
                  <option value="PROBATION_SUPPORT">Probation Mentoring & Technical Support</option>
                  <option value="GRADUATION_READY">Ready for Institutional Graduation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Mentor Remarks &amp; Technical Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail key milestone progress, prototype deployment feedback, and next sprint goals..."
                  value={form.mentorRemarks}
                  onChange={(e) => setForm({ ...form, mentorRemarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Logging..." : "Save Milestone Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
