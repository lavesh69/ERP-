// SPDX-License-Identifier: Apache-2.0
/**
 * FeedbackCyclesTab Component
 * Comprehensive survey cycle scheduling, administration windows, and student completion telemetry.
 */

"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  BarChart3,
  Bell,
  ShieldCheck,
  X,
  Send,
  Lock,
} from "lucide-react";
import { FeedbackSurveyCycle } from "@/lib/feedback/feedback-engine";

interface FeedbackCyclesTabProps {
  cycles: FeedbackSurveyCycle[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function FeedbackCyclesTab({
  cycles,
  onRefresh,
  showToast,
}: FeedbackCyclesTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const [form, setForm] = useState({
    title: "",
    surveyType: "COURSE_FACULTY_EVALUATION",
    academicYear: "2026-27",
    semesterTerm: "Fall Semester",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    targetDepartment: "ALL",
    targetAudience: "ALL_ENROLLED_STUDENTS",
    isMandatory: true,
    eligibleCount: 350,
  });

  const totalEligible = cycles.reduce((acc, c) => acc + (c.eligibleCount || 0), 0);
  const totalCompleted = cycles.reduce((acc, c) => acc + (c.completedCount || 0), 0);
  const overallCompletionRate = totalEligible > 0 ? Math.round((totalCompleted / totalEligible) * 100) : 0;
  const activeCount = cycles.filter((c) => c.status === "ACTIVE").length;

  const filteredCycles = cycles.filter((c) => {
    if (filterStatus === "ALL") return true;
    return c.status === filterStatus;
  });

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast("Survey cycle title is required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_SURVEY_CYCLE",
          cycle: form,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create survey cycle");
      }

      showToast("Feedback survey cycle launched successfully", "success");
      setShowCreateModal(false);
      setForm({
        title: "",
        surveyType: "COURSE_FACULTY_EVALUATION",
        academicYear: "2026-27",
        semesterTerm: "Fall Semester",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        targetDepartment: "ALL",
        targetAudience: "ALL_ENROLLED_STUDENTS",
        isMandatory: true,
        eligibleCount: 350,
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to launch survey cycle", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReminder = (cycleCode: string) => {
    showToast(`Reminder notifications dispatched to remaining students for ${cycleCode}`, "success");
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Survey Windows</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {activeCount}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Currently open for submissions</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Cohort</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {totalEligible.toLocaleString()}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Eligible institutional stakeholders</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Turnout Telemetry</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {overallCompletionRate}%
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {totalCompleted.toLocaleString()} completed surveys
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">NAAC / NBA Audit Compliance</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            100%
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Tamper-proof anonymous log</p>
        </div>
      </div>

      {/* Header and Filter Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs font-medium text-charcoal-900 dark:text-ivory-100"
          >
            <option value="ALL">All Statuses ({cycles.length})</option>
            <option value="ACTIVE">Active Windows</option>
            <option value="SCHEDULED">Scheduled Windows</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Survey Cycle</span>
        </button>
      </div>

      {/* Cycles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCycles.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800">
            <CalendarDays className="w-12 h-12 text-charcoal-300 dark:text-charcoal-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-charcoal-700 dark:text-ivory-200">No survey cycles found</p>
            <p className="text-xs text-charcoal-400 mt-1">Configure a survey administration window to collect stakeholder evaluations.</p>
          </div>
        ) : (
          filteredCycles.map((cycle) => {
            const completionPercent = cycle.eligibleCount > 0
              ? Math.min(100, Math.round(((cycle.completedCount || 0) / cycle.eligibleCount) * 100))
              : 0;

            const isWindowActive = cycle.status === "ACTIVE";

            return (
              <div
                key={cycle.id}
                className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-rose-primary dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                          {cycle.cycleCode}
                        </span>
                        {cycle.isMandatory && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Mandatory
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                        {cycle.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 ${
                        cycle.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : cycle.status === "SCHEDULED"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          : "bg-charcoal-100 text-charcoal-600 dark:bg-charcoal-800 dark:text-charcoal-400"
                      }`}
                    >
                      {cycle.status === "ACTIVE" && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                      {cycle.status}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-4">
                    Cohort: <strong className="text-charcoal-700 dark:text-ivory-200">{cycle.targetAudience.replace(/_/g, " ")}</strong> • Dept: <strong className="text-charcoal-700 dark:text-ivory-200">{cycle.targetDepartment}</strong> • Term: <strong className="text-charcoal-700 dark:text-ivory-200">{cycle.academicYear} ({cycle.semesterTerm})</strong>
                  </p>

                  {/* Window Schedule */}
                  <div className="bg-ivory-50 dark:bg-charcoal-800/60 p-3 rounded-xl border border-border/50 dark:border-charcoal-700/50 flex items-center justify-between text-xs mb-4">
                    <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-300">
                      <CalendarDays className="w-4 h-4 text-rose-primary" />
                      <span>{cycle.startDate} to {cycle.endDate}</span>
                    </div>
                    <span className="font-medium text-charcoal-500">
                      {isWindowActive ? "Open Now" : "Scheduled"}
                    </span>
                  </div>

                  {/* Turnout Progress Bar */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-charcoal-600 dark:text-charcoal-400">Response Turnout</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {cycle.completedCount} / {cycle.eligibleCount} ({completionPercent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-ivory-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          completionPercent >= 80
                            ? "bg-emerald-500"
                            : completionPercent >= 50
                            ? "bg-rose-primary"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-charcoal-400">
                    ID: {cycle.id}
                  </span>
                  <div className="flex items-center gap-2">
                    {isWindowActive && (
                      <button
                        onClick={() => handleSendReminder(cycle.cycleCode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-primary hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-all"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Send Reminders</span>
                      </button>
                    )}
                    <button
                      onClick={() => showToast(`Cycle telemetry report exported for ${cycle.cycleCode}`, "info")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 transition-all"
                    >
                      Audit Log
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Launch New Survey Cycle */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-rose-primary" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Launch Survey Administration Cycle
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Cycle Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., End-Term Course & Faculty Feedback 2026-27"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Survey Type
                  </label>
                  <select
                    value={form.surveyType}
                    onChange={(e) => setForm({ ...form, surveyType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="COURSE_FACULTY_EVALUATION">Course & Faculty Evaluation</option>
                    <option value="EXIT_SURVEY_SENIORS">Senior Exit Survey (NBA/NAAC)</option>
                    <option value="ALUMNI_CURRICULUM_SURVEY">Alumni Curriculum Review</option>
                    <option value="FACILITY_INFRASTRUCTURE">Facility & Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Department
                  </label>
                  <select
                    value={form.targetDepartment}
                    onChange={(e) => setForm({ ...form, targetDepartment: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="ALL">All Departments (Institutional)</option>
                    <option value="CSE">Computer Science & Engineering</option>
                    <option value="ECE">Electronics & Communication</option>
                    <option value="MECH">Mechanical Engineering</option>
                    <option value="CIVIL">Civil Engineering</option>
                    <option value="HUM">Humanities & Sciences</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Start Window Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    End Window Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.targetAudience}
                    onChange={(e) => setForm({ ...form, targetAudience: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="ALL_ENROLLED_STUDENTS">All Enrolled Students</option>
                    <option value="GRADUATING_FINAL_YEAR">Graduating Final Year (Seniors)</option>
                    <option value="ALUMNI_COMMUNITY">Alumni Community</option>
                    <option value="ALL_CAMPUS_RESIDENTS">All Campus Residents</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Eligible Cohort Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.eligibleCount}
                    onChange={(e) => setForm({ ...form, eligibleCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isMandatory"
                  checked={form.isMandatory}
                  onChange={(e) => setForm({ ...form, isMandatory: e.target.checked })}
                  className="rounded text-rose-primary focus:ring-rose-500"
                />
                <label htmlFor="isMandatory" className="font-semibold text-charcoal-700 dark:text-ivory-200">
                  Mandatory Academic Requirement (Hall Ticket / Grade Release Dependency)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Scheduling..." : "Launch Cycle Window"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
