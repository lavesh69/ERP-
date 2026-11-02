// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationApplicationsTab Component
 * Comprehensive startup intake funnel, applicant screening, pitch committee evaluations,
 * and seamless one-click cohort onboarding.
 */

"use client";

import React, { useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  X,
  Search,
  Filter,
  Eye,
  Rocket,
  ArrowRight,
  Sparkles,
  Building,
  DollarSign,
  UserCheck,
  Award,
} from "lucide-react";
import { IncubationApplication, StartupSector, ApplicationStatus } from "@/lib/incubation/incubation-engine";
import { EmptyState } from "@/components/common/EmptyState";

interface IncubationApplicationsTabProps {
  applications: IncubationApplication[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationApplicationsTab({
  applications,
  onRefresh,
  showToast,
}: IncubationApplicationsTabProps) {
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [evaluatingApp, setEvaluatingApp] = useState<IncubationApplication | null>(null);
  const [onboardingApp, setOnboardingApp] = useState<IncubationApplication | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Application Form State
  const [applyForm, setApplyForm] = useState({
    startupName: "",
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantRole: "STUDENT" as "STUDENT" | "ALUMNI" | "FACULTY",
    department: "Computer Science & Engineering",
    sector: "AI_ML" as StartupSector,
    problemStatement: "",
    proposedSolution: "",
    prototypeUrl: "",
    requestedGrant: 500000,
    requestedDesks: 2,
  });

  // Evaluation Form State
  const [evalStatus, setEvalStatus] = useState<ApplicationStatus>("APPROVED");
  const [evalScore, setEvalScore] = useState<number>(85);
  const [evalNotes, setEvalNotes] = useState<string>("");

  // Cohort Onboard Form State
  const [onboardStage, setOnboardStage] = useState<string>("INCUBATED_PROTOTYPE");
  const [onboardDesks, setOnboardDesks] = useState<number>(2);
  const [onboardMentor, setOnboardMentor] = useState<string>("Dr. Arvind Gupta");

  const totalApps = applications.length;
  const underScreening = applications.filter((a) => a.status === "UNDER_SCREENING" || a.status === "SUBMITTED").length;
  const pitchScheduled = applications.filter((a) => a.status === "PITCH_SCHEDULED").length;
  const approvedApps = applications.filter((a) => a.status === "APPROVED").length;

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      app.startupName.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.problemStatement.toLowerCase().includes(q) ||
      app.applicationRef.toLowerCase().includes(q);
    const matchesStatus = activeStatusFilter === "ALL" || app.status === activeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.startupName.trim() || !applyForm.applicantName.trim()) {
      showToast("Please provide both startup and applicant founder names", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_APPLICATION",
          ...applyForm,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit application");
      }

      showToast(`Incubation Application submitted! (${data.application.applicationRef})`, "success");
      setShowApplyModal(false);
      setApplyForm({
        startupName: "",
        applicantName: "",
        applicantEmail: "",
        applicantPhone: "",
        applicantRole: "STUDENT",
        department: "Computer Science & Engineering",
        sector: "AI_ML",
        problemStatement: "",
        proposedSolution: "",
        prototypeUrl: "",
        requestedGrant: 500000,
        requestedDesks: 2,
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to submit application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluatingApp) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EVALUATE_APPLICATION",
          id: evaluatingApp.id,
          status: evalStatus,
          score: evalScore,
          notes: evalNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record evaluation");
      }

      showToast(`Application ${data.application.applicationRef} transitioned to ${evalStatus}`, "success");
      setEvaluatingApp(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to evaluate application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingApp) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONVERT_APPLICATION",
          applicationId: onboardingApp.id,
          initialStage: onboardStage,
          labDesksAllocated: onboardDesks,
          mentorName: onboardMentor,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to onboard venture");
      }

      showToast(`Venture '${data.venture.startupName}' successfully onboarded into Cohort!`, "success");
      setOnboardingApp(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to onboard venture", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Card Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Applications
            </p>
            <h3 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
              {totalApps}
            </h3>
            <span className="text-[10px] text-charcoal-500">Intake Cycle 2026-27</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Under Screening
            </p>
            <h3 className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {underScreening}
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Preliminary review</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Pitch Scheduled
            </p>
            <h3 className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {pitchScheduled}
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Committee presentations</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Approved for Cohort
            </p>
            <h3 className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {approvedApps}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Eligible to onboard</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by venture, founder, or proposal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-primary text-charcoal-900 dark:text-ivory-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-ivory-50 dark:bg-charcoal-800 p-1 rounded-xl border border-border dark:border-charcoal-700 overflow-x-auto">
            {["ALL", "SUBMITTED", "UNDER_SCREENING", "PITCH_SCHEDULED", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setActiveStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeStatusFilter === st
                    ? "bg-rose-primary text-white shadow-xs"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all shrink-0 ml-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Application</span>
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      {filteredApps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Incubation Applications Found"
          description={`No applications match your active filter "${activeStatusFilter}".`}
          actionLabel="Clear Filter"
          onAction={() => {
            setActiveStatusFilter("ALL");
            setSearchQuery("");
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const statusBadge =
              app.status === "APPROVED"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                : app.status === "PITCH_SCHEDULED"
                ? "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200"
                : app.status === "UNDER_SCREENING"
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200"
                : app.status === "REJECTED"
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200"
                : "bg-surface-soft text-charcoal-700 dark:text-charcoal-300 border-border";

            return (
              <div
                key={app.id}
                className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] text-charcoal-400 block font-semibold">
                        {app.applicationRef}
                      </span>
                      <h4 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                        {app.startupName}
                      </h4>
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        {app.applicantName} • {app.applicantRole} ({app.department})
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${statusBadge} shrink-0`}>
                      {app.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-charcoal-600 dark:text-charcoal-400">
                    <p className="line-clamp-2">
                      <span className="font-semibold text-charcoal-800 dark:text-ivory-200">Problem: </span>
                      {app.problemStatement}
                    </p>
                    <p className="line-clamp-2">
                      <span className="font-semibold text-charcoal-800 dark:text-ivory-200">Solution: </span>
                      {app.proposedSolution}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 dark:border-charcoal-800 text-xs">
                    <div className="p-2 bg-ivory-50 dark:bg-charcoal-800/50 rounded-lg">
                      <span className="text-[10px] text-charcoal-400 block">Requested Seed</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                        INR {app.requestedGrant.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-2 bg-ivory-50 dark:bg-charcoal-800/50 rounded-lg">
                      <span className="text-[10px] text-charcoal-400 block">Committee Score</span>
                      <span className="font-bold text-rose-primary dark:text-rose-400">
                        {app.committeeScore ? `${app.committeeScore} / 100` : "Pending"}
                      </span>
                    </div>
                  </div>

                  {app.committeeNotes && (
                    <div className="p-2.5 rounded-lg bg-surface-soft text-[11px] text-charcoal-600 dark:text-charcoal-300 border border-border/60 italic">
                      &quot;{app.committeeNotes}&quot;
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 dark:border-charcoal-800 gap-2">
                  <button
                    onClick={() => {
                      setEvaluatingApp(app);
                      setEvalStatus(app.status);
                      setEvalScore(app.committeeScore || 80);
                      setEvalNotes(app.committeeNotes || "");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-ivory-100 hover:bg-rose-50 dark:bg-charcoal-800 dark:hover:bg-rose-950/60 text-xs font-semibold text-charcoal-800 dark:text-ivory-200 hover:text-rose-primary transition-colors flex items-center gap-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Evaluate</span>
                  </button>

                  {app.status === "APPROVED" && (
                    <button
                      onClick={() => {
                        setOnboardingApp(app);
                        setOnboardDesks(app.requestedDesks || 2);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Onboard to Cohort</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Submit New Application */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border dark:border-charcoal-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-container text-rose-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Submit Incubation Application
                  </h3>
                  <p className="text-xs text-charcoal-500">Apply for university AIC incubation & grant support</p>
                </div>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-lg hover:bg-surface-soft text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Startup / Venture Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applyForm.startupName}
                    onChange={(e) => setApplyForm({ ...applyForm, startupName: e.target.value })}
                    placeholder="e.g. BioSens Health"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Sector *
                  </label>
                  <select
                    value={applyForm.sector}
                    onChange={(e) => setApplyForm({ ...applyForm, sector: e.target.value as any })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs focus:ring-2 focus:ring-rose-primary"
                  >
                    <option value="AI_ML">AI & Machine Learning</option>
                    <option value="HEALTHTECH">HealthTech</option>
                    <option value="CLEANTECH">CleanTech</option>
                    <option value="ROBOTICS_IOT">Robotics & IoT</option>
                    <option value="FINTECH">FinTech</option>
                    <option value="AGRITECH">AgriTech</option>
                    <option value="EDTECH">EdTech</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Lead Founder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={applyForm.applicantName}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Applicant Role *
                  </label>
                  <select
                    value={applyForm.applicantRole}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantRole: e.target.value as any })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  >
                    <option value="STUDENT">Student Scholar</option>
                    <option value="FACULTY">Faculty Researcher</option>
                    <option value="ALUMNI">University Alumni</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={applyForm.department}
                    onChange={(e) => setApplyForm({ ...applyForm, department: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={applyForm.applicantEmail}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantEmail: e.target.value })}
                    placeholder="founder@students.apex.edu"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={applyForm.applicantPhone}
                    onChange={(e) => setApplyForm({ ...applyForm, applicantPhone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Problem Statement (Min 15 chars) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={applyForm.problemStatement}
                  onChange={(e) => setApplyForm({ ...applyForm, problemStatement: e.target.value })}
                  placeholder="Detail the real-world friction, clinical bottleneck, or market inefficiency you are tackling..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Proposed Solution & Tech Novelty (Min 15 chars) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={applyForm.proposedSolution}
                  onChange={(e) => setApplyForm({ ...applyForm, proposedSolution: e.target.value })}
                  placeholder="Explain your technical novelty, prototype architecture, and defensible IP advantage..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Requested Grant (INR)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={applyForm.requestedGrant}
                    onChange={(e) => setApplyForm({ ...applyForm, requestedGrant: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Requested Desks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={applyForm.requestedDesks}
                    onChange={(e) => setApplyForm({ ...applyForm, requestedDesks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Prototype URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={applyForm.prototypeUrl}
                    onChange={(e) => setApplyForm({ ...applyForm, prototypeUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit to Screening Committee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Evaluate Application */}
      {evaluatingApp && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Evaluate: {evaluatingApp.startupName}
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">{evaluatingApp.applicationRef}</p>
              </div>
              <button
                onClick={() => setEvaluatingApp(null)}
                className="p-1 rounded-lg hover:bg-surface-soft text-charcoal-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Committee Decision / Workflow Stage *
                </label>
                <select
                  value={evalStatus}
                  onChange={(e) => setEvalStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  <option value="UNDER_SCREENING">Under Preliminary Screening</option>
                  <option value="PITCH_SCHEDULED">Invite for In-Person Pitch Presentation</option>
                  <option value="APPROVED">Approve for Incubation Cohort Admission</option>
                  <option value="REJECTED">Reject Application (Outside Scope / Low Moat)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-charcoal-700 dark:text-ivory-300">
                    Evaluation Committee Score (0–100)
                  </label>
                  <span className="text-sm font-bold text-rose-primary">{evalScore} / 100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={evalScore}
                  onChange={(e) => setEvalScore(Number(e.target.value))}
                  className="w-full accent-rose-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Committee Appraisal Remarks & Feedback
                </label>
                <textarea
                  rows={3}
                  value={evalNotes}
                  onChange={(e) => setEvalNotes(e.target.value)}
                  placeholder="Note jury feedback, IP strength, technical feasibility, and required refinements..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setEvaluatingApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Record Committee Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Onboard to Active Cohort */}
      {onboardingApp && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Onboard into Cohort
                  </h3>
                  <p className="text-xs text-charcoal-500">{onboardingApp.startupName}</p>
                </div>
              </div>
              <button
                onClick={() => setOnboardingApp(null)}
                className="p-1 rounded-lg hover:bg-surface-soft text-charcoal-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConvert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Starting Incubation Stage
                </label>
                <select
                  value={onboardStage}
                  onChange={(e) => setOnboardStage(e.target.value)}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  <option value="PRE_INCUBATION">Pre-Incubation (Idea & Customer Discovery)</option>
                  <option value="INCUBATED_PROTOTYPE">Incubated Prototype (Bench Testing)</option>
                  <option value="SEED_FUNDED">Seed Funded (Commercial Proof-of-Concept)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Allocated Innovation Lab Desks
                </label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={onboardDesks}
                  onChange={(e) => setOnboardDesks(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Designated Advisory Mentor / EIR
                </label>
                <input
                  type="text"
                  value={onboardMentor}
                  onChange={(e) => setOnboardMentor(e.target.value)}
                  placeholder="e.g. Dr. Arvind Gupta"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs leading-relaxed">
                This will automatically create a formal venture ledger entity, assign a permanent company registration code, and grant innovation pod keycards.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setOnboardingApp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Onboarding..." : "Confirm & Launch Venture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
