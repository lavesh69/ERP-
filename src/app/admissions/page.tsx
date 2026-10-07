"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  UserPlus,
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  PlusCircle,
  Filter,
  DollarSign,
  TrendingUp,
  BarChart,
  ChevronRight,
  Send,
  Building,
  Download,
  Search,
} from "lucide-react";

interface AdmissionsSummary {
  totalApplicants: number;
  confirmedSeats: number;
  offersExtended: number;
  totalSeatCapacity: number;
  enrollmentRate: number;
  quotas: any[];
}

export default function AdmissionsPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"pipeline" | "register" | "quotas" | "analytics">("pipeline");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdmissionsSummary | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExportAdmissionsCsv = () => {
    const listToExport = filteredApplicants;
    const headers = ["Application No", "Full Name", "Program", "Merit Rank", "Stage", "Deposit Paid", "GPA", "Exam Score", "Email", "Phone"];
    const rows = listToExport.map((a: any) => [
      a.applicationNo,
      `"${a.fullName.replace(/"/g, '""')}"`,
      `"${a.programName.replace(/"/g, '""')}"`,
      a.meritRank,
      a.stage,
      a.seatDepositPaid ? "YES" : "NO",
      a.highSchoolGpa,
      a.entranceExamScore,
      `"${a.email}"`,
      `"${a.phone}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Admissions_Applicants_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredApplicants = applicants.filter((a: any) => {
    return (
      a.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.applicationNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.programName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // New Application Form
  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    programCode: "BTECH-CSE",
    highSchoolGpa: 3.8,
    entranceExamScore: 1420,
    source: "WEBSITE",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, appRes] = await Promise.all([
        fetch("/api/admissions?tab=summary"),
        fetch(`/api/admissions?tab=applicants&stage=${selectedStage}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (appRes.ok) {
        const aData = await appRes.json();
        setApplicants(aData.applicants || []);
      }
    } catch (err) {
      console.error("Failed to load admissions data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStage]);

  const handleRegisterApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_APPLICATION",
          ...appForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit application");
      setStatusMessage({ type: "success", text: data.message });
      setShowAppModal(false);
      setAppForm({
        fullName: "",
        email: "",
        phone: "",
        programCode: "BTECH-CSE",
        highSchoolGpa: 3.8,
        entranceExamScore: 1420,
        source: "WEBSITE",
      });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleUpdateStage = async (applicantId: string, stage: string, depositPaid?: boolean) => {
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          applicantId,
          stage,
          depositPaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Stage update failed");
      setStatusMessage({ type: "success", text: data.message });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                Admissions CRM & Enrollment Management
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Cohort Fall 2026-27 Open
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Admissions & Student Enrollment
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Applicant pipeline tracking, standardized entrance examination scoring, merit rank cutoffs, and digital offer letters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportAdmissionsCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Export Applicants (CSV)
            </button>
            <button
              onClick={() => setShowAppModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              New Application
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Total Applicants</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{summary.totalApplicants}</p>
              <p className="text-xs text-rose-300 mt-0.5">Across All Degree Quotas</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Confirmed Seats</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">{summary.confirmedSeats}</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.totalSeatCapacity} Total Intake Capacity</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Enrolment Fill Rate</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">{summary.enrollmentRate}%</p>
              <p className="text-xs text-rose-300 mt-0.5">High Yield Conversion</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Offers Extended</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">{summary.offersExtended}</p>
              <p className="text-xs text-rose-300 mt-0.5">Awaiting Deposit Settlement</p>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto pb-px">
        {[
          { id: "pipeline", label: "Applicant Pipeline", icon: UserPlus, count: summary?.totalApplicants },
          { id: "quotas", label: "Program Quotas & Cutoffs", icon: GraduationCap },
          { id: "analytics", label: "Enrollment Funnel Analytics", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-rose-primary text-rose-primary dark:text-rose-light dark:border-rose-light"
                  : "border-transparent text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPLICANT PIPELINE */}
      {activeTab === "pipeline" && (
        <div className="space-y-4">
          {/* Stage & Search Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-charcoal-500" />
                <span className="text-sm font-medium text-charcoal-700 dark:text-ivory-300">Stage:</span>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="text-sm bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="ALL">All Applicants</option>
                  <option value="APPLICATION_SUBMITTED">Submitted</option>
                  <option value="MERIT_SHORTLISTED">Merit Shortlisted</option>
                  <option value="OFFER_EXTENDED">Offer Extended</option>
                  <option value="SEAT_CONFIRMED">Seat Confirmed (Enrolled)</option>
                </select>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, app #, program..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500 w-48 sm:w-56"
                />
              </div>
            </div>
            <span className="text-xs text-charcoal-500">
              Showing {filteredApplicants.length} of {applicants.length} Applicant Dossiers
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredApplicants.map((lead) => {
              const isEnrolled = lead.stage === "SEAT_CONFIRMED";
              return (
                <div
                  key={lead.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {lead.applicationNo}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                        Rank #{lead.meritRank}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isEnrolled
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300"
                        }`}
                      >
                        {lead.stage.replace(/_/g, " ")}
                      </span>
                      {lead.seatDepositPaid && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                          Deposit Cleared (${lead.depositAmount})
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                      {lead.fullName} — {lead.programName}
                    </h3>
                    <div className="text-xs text-charcoal-600 dark:text-ivory-300 flex flex-wrap gap-4 pt-0.5">
                      <span>High School GPA: <b>{lead.highSchoolGpa}</b></span>
                      <span>SAT / Entrance Score: <b>{lead.entranceExamScore}</b></span>
                      <span>Contact: {lead.email} • {lead.phone}</span>
                    </div>

                    {/* Document Verification Checks */}
                    <div className="text-[11px] text-charcoal-500 pt-1 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Transcripts: {lead.documentsStatus.transcriptsVerified ? "Verified" : "Pending"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Identity: {lead.documentsStatus.identityProofVerified ? "Verified" : "Pending"}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Recommendations: {lead.documentsStatus.recommendationLettersVerified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Stage Transition Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.stage === "APPLICATION_SUBMITTED" && (
                      <button
                        onClick={() => handleUpdateStage(lead.id, "MERIT_SHORTLISTED")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors"
                      >
                        Shortlist for Merit
                      </button>
                    )}
                    {lead.stage === "MERIT_SHORTLISTED" && (
                      <button
                        onClick={() => handleUpdateStage(lead.id, "OFFER_EXTENDED")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        Release Offer Letter
                      </button>
                    )}
                    {lead.stage === "OFFER_EXTENDED" && (
                      <button
                        onClick={() => handleUpdateStage(lead.id, "SEAT_CONFIRMED", true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Confirm Seat Deposit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM QUOTAS & CUTOFFS */}
      {activeTab === "quotas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {summary?.quotas.map((q) => {
            const fillRate = Math.round((q.confirmedSeats / q.totalSeats) * 100);
            return (
              <div
                key={q.programCode}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {q.programCode}
                      </span>
                      <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                        {q.programName}
                      </h3>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Cutoff: {q.cutoffScore}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500">Seat Capacity:</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {q.confirmedSeats} / {q.totalSeats} Enrolled ({fillRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-border dark:bg-charcoal-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${fillRate >= 90 ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(100, fillRate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex justify-between items-center text-xs">
                  <span className="text-charcoal-500">App Fee: ${q.applicationFee}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Admissions Active
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-6 border border-border dark:border-charcoal-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
              Admissions Yield & Conversion Funnel
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              End-to-end recruitment conversion metrics from prospect lead to confirmed matriculation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Total Intake</p>
              <p className="text-2xl font-bold mt-1 text-charcoal-900 dark:text-ivory-100">
                {summary?.totalSeatCapacity} Seats
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Approved University Quota</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Total Admitted</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {summary?.confirmedSeats}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Deposit Verified Students</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Yield Rate</p>
              <p className="text-2xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">
                {summary?.enrollmentRate}%
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Offer-to-enrollment conversion</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Revenue Generated</p>
              <p className="text-2xl font-bold mt-1 text-rose-primary dark:text-rose-light">
                ${((summary?.confirmedSeats || 0) * 1500).toLocaleString()}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Confirmation seat reserves</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Applicant */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Register New Prospective Applicant
              </h3>
              <button
                onClick={() => setShowAppModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterApplicant} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Applicant Legal Full Name
                </label>
                <input
                  type="text"
                  required
                  value={appForm.fullName}
                  onChange={(e) => setAppForm({ ...appForm, fullName: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. Jordan Lee"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={appForm.email}
                    onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={appForm.phone}
                    onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Target Degree Program
                </label>
                <select
                  required
                  value={appForm.programCode}
                  onChange={(e) => setAppForm({ ...appForm, programCode: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  <option value="BTECH-CSE">B.Tech Computer Science & Engineering</option>
                  <option value="BTECH-AI">B.Tech Artificial Intelligence & Robotics</option>
                  <option value="BTECH-MECH">B.Tech Mechanical & Mechatronics</option>
                  <option value="MBA-TECH">Master of Business Administration (Tech)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    High School GPA (out of 4.0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={appForm.highSchoolGpa}
                    onChange={(e) => setAppForm({ ...appForm, highSchoolGpa: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    SAT / Entrance Score
                  </label>
                  <input
                    type="number"
                    required
                    value={appForm.entranceExamScore}
                    onChange={(e) => setAppForm({ ...appForm, entranceExamScore: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowAppModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
