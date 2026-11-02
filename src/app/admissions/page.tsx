"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
  Eye,
  Printer,
  Mail,
  CheckSquare,
  Square,
  ExternalLink,
  UserCheck,
  X,
} from "lucide-react";
import AdmissionsCounselingTab from "@/components/admissions/AdmissionsCounselingTab";
import AdmissionsEnquiriesTab from "@/components/admissions/AdmissionsEnquiriesTab";
import AdmissionsEligibilityTab from "@/components/admissions/AdmissionsEligibilityTab";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";

interface AdmissionsSummary {
  totalApplicants: number;
  confirmedSeats: number;
  offersExtended: number;
  totalSeatCapacity: number;
  enrollmentRate: number;
  quotas: any[];
}

export default function AdmissionsPage() {
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<"pipeline" | "register" | "quotas" | "analytics" | "counseling" | "enquiries" | "eligibility">("pipeline");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AdmissionsSummary | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicantDossier, setSelectedApplicantDossier] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOfferDispatchModal, setShowOfferDispatchModal] = useState(false);
  const [targetOfferApplicant, setTargetOfferApplicant] = useState<any | null>(null);
  const [dispatchLog, setDispatchLog] = useState<string[]>([]);
  const [dispatching, setDispatching] = useState(false);
  const [quotaSearchQuery, setQuotaSearchQuery] = useState("");
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [editingQuota, setEditingQuota] = useState<any | null>(null);

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuota || !summary) return;
    const exists = summary.quotas.some((q) => q.programCode === editingQuota.programCode);
    const updatedQuotas = exists
      ? summary.quotas.map((q) => (q.programCode === editingQuota.programCode ? editingQuota : q))
      : [...summary.quotas, editingQuota];
    setSummary({
      ...summary,
      quotas: updatedQuotas,
      totalSeatCapacity: updatedQuotas.reduce((acc, q) => acc + q.totalSeats, 0),
    });

    try {
      await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_QUOTA",
          quota: editingQuota,
        }),
      });
    } catch (err) {
      console.warn("Could not persist quota update to backend", err);
    }

    showToast(
      `Updated institutional intake quota for ${editingQuota.programName} (${editingQuota.programCode})!`,
      "success"
    );
    setShowQuotaModal(false);
    setEditingQuota(null);
  };

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

  useEffect(() => {
    const isAnyModalOpen = showAppModal || showOfferDispatchModal || showQuotaModal || !!selectedApplicantDossier;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAppModal(false);
        setShowOfferDispatchModal(false);
        setShowQuotaModal(false);
        setSelectedApplicantDossier(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showAppModal, showOfferDispatchModal, showQuotaModal, selectedApplicantDossier]);

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
      showToast(data.message, "success");
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
      showToast(err.message, "error");
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
      showToast(data.message, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleProvisionStudent = async (applicantId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROVISION_STUDENT",
          applicantId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to provision student");
      showToast(data.message, "success");
      fetchData();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredApplicants.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplicants.map((a) => a.id));
    }
  };

  const handleBulkStage = async (stage: string, depositPaid?: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(
        selectedIds.map((applicantId) =>
          fetch("/api/admissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "UPDATE_STAGE",
              applicantId,
              stage,
              depositPaid,
            }),
          })
        )
      );
      showToast(
        `Successfully updated ${selectedIds.length} applicants to ${stage.replace(/_/g, " ")}`,
        "success"
      );
      setSelectedIds([]);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Bulk stage update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocument = async (
    docType: "transcriptsVerified" | "identityProofVerified" | "recommendationLettersVerified"
  ) => {
    if (!selectedApplicantDossier) return;
    const currentVal = !!selectedApplicantDossier.documentsStatus?.[docType];
    const newVal = !currentVal;

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_DOCUMENT_STATUS",
          applicantId: selectedApplicantDossier.id,
          documentType: docType,
          isVerified: newVal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedApplicantDossier(data.applicant);
        showToast(data.message, "success");
        fetchData();
      } else {
        showToast(data.error || "Failed to update document verification", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update document", "error");
    }
  };

  const handleSimulateOfferDispatch = async (applicant: any) => {
    setTargetOfferApplicant(applicant);
    setShowOfferDispatchModal(true);
    setDispatchLog([`[1/4] Connecting to university SMTP relay mail.apex.edu:587 for ${applicant.email}...`]);
    setDispatching(true);

    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_OFFER_LETTER",
          applicantId: applicant.id,
          deadlineDays: 14,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDispatchLog([
          `[1/4] Connected to campus SMTP relay mail.apex.edu:587`,
          `[2/4] Cryptographic admission seal generated: ${data.offerSeal}`,
          `[3/4] Attached signed scholarship confirmation & fee schedule for ${applicant.programName}`,
          `[4/4] 250 OK: Digital offer letter successfully queued and dispatched to ${applicant.email} (Email ID: ${data.emailId || "OUTBOX-QUEUED"})`,
        ]);
        showToast(data.message || `Offer letter dispatched to ${applicant.email}`, "success");
        fetchData();
      } else {
        setDispatchLog((prev) => [...prev, `[ERROR] Dispatch failed: ${data.error || "Unknown error"}`]);
        showToast(data.error || "Failed to dispatch offer letter", "error");
      }
    } catch (err: any) {
      setDispatchLog((prev) => [...prev, `[ERROR] Network failure: ${err.message}`]);
      showToast(err.message || "Network error", "error");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <AppShell>
      <Breadcrumbs />
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner - Academic OS Native Glassmorphism */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                Admissions CRM
              </span>
              <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Cohort Fall 2026-27 Open
              </span>
            </div>
            <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Admissions & Student Enrollment
            </h1>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
              Applicant pipeline tracking, standardized entrance examination scoring, merit rank cutoffs, and digital offer letters.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAdmissionsCsv}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Applicants
          </button>
          <a
            href="/admissions/apply"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Portal
          </a>
          <button
            onClick={() => setShowAppModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Application
          </button>
        </div>
      </div>

      {/* 4-Card KPI Telemetry Strip */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                Total Applicants
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                {summary.totalApplicants}
              </h3>
              <span className="badge-subtle bg-surface-soft text-charcoal-600 dark:text-charcoal-300 mt-1 inline-block">
                All Degree Quotas
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                Confirmed Seats
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {summary.confirmedSeats}
              </h3>
              <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
                {summary.totalSeatCapacity} Intake Capacity
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                Enrolment Fill Rate
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-sky-600 dark:text-sky-400 mt-1">
                {summary.enrollmentRate}%
              </h3>
              <span className="badge-subtle bg-sky-500/10 text-sky-700 dark:text-sky-300 mt-1 inline-block">
                High Yield Conversion
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                Offers Extended
              </p>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
                {summary.offersExtended}
              </h3>
              <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
                Awaiting Deposit Settlement
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs - Clean Unified Pills Strip */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-soft/60 dark:bg-charcoal-900 border border-border/80 dark:border-charcoal-800 overflow-x-auto no-scrollbar">
        {[
          { id: "pipeline", label: "Applicant Pipeline", icon: UserPlus, count: summary?.totalApplicants },
          { id: "enquiries", label: "Prospective Leads & Inquiries", icon: Mail },
          { id: "eligibility", label: "Eligibility & Merit Calculator", icon: CheckCircle2 },
          { id: "quotas", label: "Program Quotas & Cutoffs", icon: GraduationCap },
          { id: "counseling", label: "Merit & Counseling Allotment", icon: Award },
          { id: "analytics", label: "Enrollment Funnel Analytics", icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm border border-border/50 dark:border-charcoal-700"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-rose-primary dark:text-rose-accent" : "text-charcoal-500 dark:text-charcoal-400"}`} />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-container text-rose-primary dark:bg-rose-dark/40 dark:text-rose-accent">
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
                  <option value="REJECTED">Declined / Rejected</option>
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

              <button
                onClick={handleSelectAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
              >
                {selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 text-rose-primary" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {selectedIds.length === filteredApplicants.length && filteredApplicants.length > 0 ? "Deselect All" : "Select All"}
              </button>
            </div>
            <span className="text-xs text-charcoal-500">
              Showing {filteredApplicants.length} of {applicants.length} Applicant Dossiers
            </span>
          </div>

          {/* Sticky Floating Bulk Operations Bar */}
          {selectedIds.length > 0 && (
            <div className="sticky top-20 z-30 bg-charcoal-900 text-white rounded-2xl p-4 shadow-2xl border border-rose-500/40 flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-sm">
                  {selectedIds.length} Applicants Selected
                </span>
                <span className="text-xs text-rose-200 hidden sm:inline">Bulk Pipeline Actions:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkStage("MERIT_SHORTLISTED")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-primary hover:bg-rose-600 text-white transition-all shadow-sm"
                >
                  Bulk Shortlist
                </button>
                <button
                  onClick={() => handleBulkStage("OFFER_EXTENDED")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm"
                >
                  Bulk Issue Offers
                </button>
                <button
                  onClick={() => handleBulkStage("SEAT_CONFIRMED", true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                >
                  Bulk Confirm Enrolment
                </button>
                <button
                  onClick={() => handleBulkStage("REJECTED")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-900 hover:bg-rose-800 text-white transition-all"
                >
                  Bulk Decline
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {filteredApplicants.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No Applicant Dossiers Found"
                description="No applicant records match your current stage filter or search keyword. Try clearing filters or searching with a different term."
                actionLabel="Reset Filters"
                onAction={() => {
                  setSelectedStage("ALL");
                  setSearchQuery("");
                }}
              />
            ) : (
              filteredApplicants.map((lead) => {
                const isEnrolled = lead.stage === "SEAT_CONFIRMED";
                const isSelected = selectedIds.includes(lead.id);
                return (
                  <div
                    key={lead.id}
                    className={`bg-white dark:bg-charcoal-900 rounded-xl p-5 border transition-all ${
                      isSelected
                        ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                        : "border-border dark:border-charcoal-800 shadow-sm"
                    } flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
                  >
                    <div className="flex items-start gap-3 max-w-2xl">
                      <button
                        onClick={() => handleToggleSelect(lead.id)}
                        className="mt-1 text-charcoal-400 hover:text-rose-primary transition-colors focus:outline-none"
                        title={isSelected ? "Deselect applicant" : "Select applicant"}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-rose-primary" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1.5">
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
                              Deposit Cleared (₹{lead.depositAmount?.toLocaleString("en-IN")})
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
                    </div>

                    {/* Stage Transition Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {lead.stage === "APPLICATION_SUBMITTED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "MERIT_SHORTLISTED")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors"
                          >
                            Shortlist for Merit
                          </button>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "REJECTED")}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {lead.stage === "MERIT_SHORTLISTED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "OFFER_EXTENDED")}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                          >
                            Release Offer Letter
                          </button>
                          <button
                            onClick={() => handleSimulateOfferDispatch(lead)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email Offer
                          </button>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "REJECTED")}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            Decline
                          </button>
                        </>
                      )}
                      {lead.stage === "OFFER_EXTENDED" && (
                        <>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "SEAT_CONFIRMED", true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            Confirm Seat Deposit
                          </button>
                          <button
                            onClick={() => handleSimulateOfferDispatch(lead)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 transition-colors flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Resend Offer
                          </button>
                          <button
                            onClick={() => handleUpdateStage(lead.id, "REJECTED")}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            Decline Offer
                          </button>
                        </>
                      )}
                      {lead.stage === "SEAT_CONFIRMED" && (
                        <button
                          onClick={() => handleProvisionStudent(lead.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Enroll in SIS
                        </button>
                      )}
                      {lead.stage === "ENROLLED" && (
                        <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Enrolled in SIS
                        </span>
                      )}
                      {lead.stage === "REJECTED" && (
                        <span className="text-xs text-rose-500 font-medium px-2 py-1 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
                          Application Closed
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedApplicantDossier(lead)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 dark:text-ivory-200 bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 transition-colors border border-border dark:border-charcoal-700 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-primary dark:text-rose-light" />
                        View Dossier
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM QUOTAS & CUTOFFS */}
      {activeTab === "quotas" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search program name or code..."
                value={quotaSearchQuery}
                onChange={(e) => setQuotaSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500 w-56 sm:w-72"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-charcoal-500">
                Total Seat Capacity: <strong>{summary?.totalSeatCapacity} Seats</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingQuota({
                    programCode: `NEW-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                    programName: "New Academic Degree Program",
                    totalSeats: 60,
                    confirmedSeats: 0,
                    cutoffScore: 1300,
                    applicationFee: 75,
                  });
                  setShowQuotaModal(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary hover:bg-rose-600 text-white shadow-sm transition-all flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Quota Program
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {summary?.quotas.filter((q) =>
              q.programName.toLowerCase().includes(quotaSearchQuery.toLowerCase()) ||
              q.programCode.toLowerCase().includes(quotaSearchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  icon={GraduationCap}
                  title="No Quota Programs Found"
                  description="No academic degree quota matches your search criteria."
                  actionLabel="Add Quota Program"
                  onAction={() => {
                    setEditingQuota({
                      programCode: `NEW-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                      programName: "New Academic Degree Program",
                      totalSeats: 60,
                      confirmedSeats: 0,
                      cutoffScore: 1300,
                      applicationFee: 75,
                    });
                    setShowQuotaModal(true);
                  }}
                />
              </div>
            ) : (
              summary?.quotas
                .filter((q) =>
                  q.programName.toLowerCase().includes(quotaSearchQuery.toLowerCase()) ||
                  q.programCode.toLowerCase().includes(quotaSearchQuery.toLowerCase())
                )
                .map((q) => {
                  const fillRate = Math.round((q.confirmedSeats / q.totalSeats) * 100);
                  return (
                    <div
                      key={q.programCode}
                      className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between space-y-4"
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

                      <div className="pt-3 border-t border-border dark:border-charcoal-800 flex justify-between items-center text-xs">
                        <span className="text-charcoal-500">App Fee: ₹{q.applicationFee}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQuota({ ...q });
                              setShowQuotaModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
                          >
                            Adjust Quota
                          </button>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
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
                ₹{((summary?.confirmedSeats || 0) * 1500).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Confirmation seat reserves</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STATUTORY MERIT & COUNSELING ALLOTMENT */}
      {activeTab === "counseling" && <AdmissionsCounselingTab />}

      {/* TAB: PROSPECTIVE INQUIRIES & LEADS CRM */}
      {activeTab === "enquiries" && (
        <AdmissionsEnquiriesTab
          onPromoteSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* TAB: LIVE ELIGIBILITY & MERIT SCHOLARSHIP CALCULATOR */}
      {activeTab === "eligibility" && (
        <AdmissionsEligibilityTab
          onSelectProgram={(_progCode) => {
            setActiveTab("pipeline");
            setShowAppModal(true);
          }}
        />
      )}

      {/* MODAL: New Applicant */}
      {showAppModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register New Prospective Applicant"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAppModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Register New Prospective Applicant
              </h3>
              <button
                onClick={() => setShowAppModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
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

      {/* Applicant Dossier Inspection Modal */}
      {selectedApplicantDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Applicant Dossier Inspection"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApplicantDossier(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div>
                <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                  {selectedApplicantDossier.applicationNo}
                </span>
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                  {selectedApplicantDossier.fullName}
                </h2>
                <p className="text-xs text-charcoal-500">
                  {selectedApplicantDossier.programName} • Enrolment Cohort 2026-27
                </p>
              </div>
              <button
                onClick={() => setSelectedApplicantDossier(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <span className="text-charcoal-500 block text-[11px]">Merit Rank</span>
                <span className="font-bold text-base text-rose-primary dark:text-rose-light">#{selectedApplicantDossier.meritRank}</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <span className="text-charcoal-500 block text-[11px]">High School GPA</span>
                <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">{selectedApplicantDossier.highSchoolGpa} / 4.0</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <span className="text-charcoal-500 block text-[11px]">Entrance Score</span>
                <span className="font-bold text-base text-charcoal-900 dark:text-ivory-100">{selectedApplicantDossier.entranceExamScore} pts</span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <span className="text-charcoal-500 block text-[11px]">Current Stage</span>
                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mt-1">{selectedApplicantDossier.stage.replace(/_/g, " ")}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-charcoal-800 dark:text-ivory-200">Candidate Contact & Origin</h4>
              <div className="p-3.5 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Email Address:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedApplicantDossier.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Phone Number:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedApplicantDossier.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Lead Source Channel:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedApplicantDossier.source}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border dark:border-charcoal-700">
                  <span className="text-charcoal-500">Academic Background / Board:</span>
                  <span className="font-semibold text-rose-primary dark:text-rose-light">STEM Major • Central Board / IB Honor Roll</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-charcoal-800 dark:text-ivory-200">Institutional Document Verification Ledger</h4>
                <span className="text-[10px] text-charcoal-400 italic">Click badges to toggle audit status</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateDocument("transcriptsVerified")}
                  className="p-2.5 rounded-lg border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 flex items-center justify-between text-left hover:border-rose-300 transition-colors"
                >
                  <span>High School Transcripts</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedApplicantDossier.documentsStatus?.transcriptsVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedApplicantDossier.documentsStatus?.transcriptsVerified ? '✓ Verified' : '⧖ Pending'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDocument("identityProofVerified")}
                  className="p-2.5 rounded-lg border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 flex items-center justify-between text-left hover:border-rose-300 transition-colors"
                >
                  <span>National Identity Proof</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedApplicantDossier.documentsStatus?.identityProofVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedApplicantDossier.documentsStatus?.identityProofVerified ? '✓ Verified' : '⧖ Pending'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDocument("recommendationLettersVerified")}
                  className="p-2.5 rounded-lg border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 flex items-center justify-between text-left hover:border-rose-300 transition-colors"
                >
                  <span>Letters of Reference</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedApplicantDossier.documentsStatus?.recommendationLettersVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedApplicantDossier.documentsStatus?.recommendationLettersVerified ? '✓ Verified' : '⧖ Pending'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-charcoal-800 dark:text-ivory-200 block">Seat Reservation Commitment Fee</span>
                <span className="text-[11px] text-charcoal-500">Required to confirm enrolment and assign institutional student roll number</span>
              </div>
              <span className={`px-3 py-1 rounded-full font-bold text-xs ${selectedApplicantDossier.seatDepositPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                {selectedApplicantDossier.seatDepositPaid ? `Paid (₹${selectedApplicantDossier.depositAmount?.toLocaleString("en-IN")})` : 'Awaiting Payment'}
              </span>
            </div>

            {/* Stage Decision Actions */}
            <div className="pt-2 border-t border-border dark:border-charcoal-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-charcoal-400 text-[11px] font-semibold mr-1">Decision:</span>
                <button
                  onClick={async () => {
                    await handleUpdateStage(selectedApplicantDossier.id, "MERIT_SHORTLISTED");
                    setSelectedApplicantDossier((prev: any) => ({ ...prev, stage: "MERIT_SHORTLISTED" }));
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Shortlist
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStage(selectedApplicantDossier.id, "OFFER_EXTENDED");
                    setSelectedApplicantDossier((prev: any) => ({ ...prev, stage: "OFFER_EXTENDED" }));
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg font-medium transition-colors"
                >
                  Release Offer
                </button>
                <button
                  onClick={() => handleSimulateOfferDispatch(selectedApplicantDossier)}
                  className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200 rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email Dispatch
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStage(selectedApplicantDossier.id, "SEAT_CONFIRMED", true);
                    setSelectedApplicantDossier((prev: any) => ({ ...prev, stage: "SEAT_CONFIRMED", seatDepositPaid: true }));
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium transition-colors"
                >
                  Confirm Seat
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStage(selectedApplicantDossier.id, "REJECTED");
                    setSelectedApplicantDossier((prev: any) => ({ ...prev, stage: "REJECTED" }));
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg font-medium transition-colors"
                >
                  Decline
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Dossier
                </button>
                <button
                  onClick={() => setSelectedApplicantDossier(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-900 hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated Email Offer Letter Dispatch Simulator Modal */}
      {showOfferDispatchModal && targetOfferApplicant && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Digital Offer Letter Dispatch Simulator"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowOfferDispatchModal(false);
              setTargetOfferApplicant(null);
            }
          }}
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-2xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-primary">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Digital Offer Letter Dispatch Simulator
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Automated SMTP Relay & Cryptographic Admissions Package
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowOfferDispatchModal(false);
                  setTargetOfferApplicant(null);
                }}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Offer Letter Document Preview */}
            <div className="p-4 rounded-xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 text-xs space-y-3 font-sans">
              <div className="flex justify-between items-start border-b border-rose-200 dark:border-rose-900/50 pb-2">
                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] text-rose-900 dark:text-rose-200 block">
                    Apex Institutional Institute of Technology & Research
                  </span>
                  <span className="text-[10px] text-charcoal-500">Office of the Registrar & Admissions Deanery</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                  PROVISIONAL OFFER
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-charcoal-700 dark:text-ivory-200">
                  <b>Candidate:</b> {targetOfferApplicant.fullName} (Ref: {targetOfferApplicant.applicationNo})
                </p>
                <p className="text-charcoal-700 dark:text-ivory-200">
                  <b>Program Admitted:</b> {targetOfferApplicant.programName}
                </p>
                <p className="text-charcoal-700 dark:text-ivory-200">
                  <b>Merit Rank:</b> #{targetOfferApplicant.meritRank} • <b>High School GPA:</b> {targetOfferApplicant.highSchoolGpa}
                </p>
                <p className="text-charcoal-600 dark:text-ivory-300 text-[11px] pt-1">
                  We are delighted to extend you provisional admission for the Academic Year 2026-27. To reserve your matriculation seat, please confirm the admission deposit within 14 calendar days.
                </p>
              </div>
            </div>

            {/* Live SMTP Dispatch Simulator Stream */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-charcoal-700 dark:text-ivory-300">
                <span>SMTP Relay Dispatch Log:</span>
                {dispatching ? (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3 animate-spin" /> In Progress...
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Relay Confirmed (250 OK)
                  </span>
                )}
              </div>
              <div className="bg-charcoal-950 text-emerald-400 font-mono text-[11px] p-3 rounded-xl border border-charcoal-800 space-y-1 max-h-36 overflow-y-auto">
                {dispatchLog.map((line, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border dark:border-charcoal-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOfferDispatchModal(false);
                  setTargetOfferApplicant(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-900 hover:opacity-90 transition-opacity"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Program Quota & Cutoff Adjustment Modal */}
      {showQuotaModal && editingQuota && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Adjust Program Intake Quota"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQuotaModal(false);
              setEditingQuota(null);
            }
          }}
          className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-primary">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Adjust Program Intake Quota
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    {editingQuota.programCode} • Academic Cohort 2026-27
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowQuotaModal(false);
                  setEditingQuota(null);
                }}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Program Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingQuota.programName}
                  onChange={(e) => setEditingQuota({ ...editingQuota, programName: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Total Seat Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editingQuota.totalSeats}
                    onChange={(e) => setEditingQuota({ ...editingQuota, totalSeats: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Confirmed / Enrolled
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingQuota.confirmedSeats}
                    onChange={(e) => setEditingQuota({ ...editingQuota, confirmedSeats: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Entrance Exam Cutoff Score
                  </label>
                  <input
                    type="number"
                    required
                    value={editingQuota.cutoffScore}
                    onChange={(e) => setEditingQuota({ ...editingQuota, cutoffScore: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Application Fee (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingQuota.applicationFee}
                    onChange={(e) => setEditingQuota({ ...editingQuota, applicationFee: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuotaModal(false);
                    setEditingQuota(null);
                  }}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent shadow-sm"
                >
                  Save Quota Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
