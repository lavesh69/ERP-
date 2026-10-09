"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Gift,
  Award,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  FileCheck,
  Building,
  GraduationCap,
  Percent,
  Upload,
  FileText,
} from "lucide-react";

export default function ScholarshipsPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh, currentRole } = useApp();
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Application form
  const [statement, setStatement] = useState("");
  const [documentsUrl, setDocumentsUrl] = useState("/uploads/scholarships/alex_mercer_transcript.pdf");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `${file.name.replace(/\.[^/.]+$/, "")} - Transcript`);
      formData.append("category", "TRANSCRIPT");

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.document) {
        setDocumentsUrl(data.document.fileUrl);
        setUploadedFileName(file.name);
        showToast("Transcript document encrypted and uploaded successfully!", "success");
      } else {
        showToast(data.error || "File upload failed", "error");
      }
    } catch {
      showToast("Network error uploading transcript document", "error");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    async function loadScholarships() {
      try {
        setLoading(true);
        const res = await fetch("/api/scholarships");
        if (res.ok) {
          const data = await res.json();
          setScholarships(data.scholarships || []);
          setAllApplications(data.allApplications || []);
          setStudentProfile(data.studentProfile || null);
        }
      } catch (err) {
        console.error("Failed to load scholarships:", err);
      } finally {
        setLoading(false);
      }
    }
    loadScholarships();
  }, [refreshTrigger]);

  const handleReviewApplication = async (applicationId: string, status: "APPROVED" | "REJECTED") => {
    setReviewingId(applicationId);
    try {
      const res = await fetch("/api/scholarships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Application marked as ${status}`, "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to update application", "error");
      }
    } catch {
      showToast("Network error updating application status", "error");
    } finally {
      setReviewingId(null);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScholarship) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scholarshipId: selectedScholarship.id,
          statement,
          documentsUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Application submitted for ${selectedScholarship.title}`, "success");
        setIsApplyModalOpen(false);
        setStatement("");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to submit scholarship application", "error");
      }
    } catch {
      showToast("Network error submitting scholarship application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const studentCgpa = studentProfile?.cgpa || 3.88;

  // Filtered scholarships
  const filteredScholarships = scholarships.filter((s) => {
    const matchSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eligibility.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;
    if (selectedCategory === "ALL") return true;
    if (selectedCategory === "MERIT") return s.minCgpa >= 3.75;
    if (selectedCategory === "NEED") return s.title.toLowerCase().includes("need") || s.title.toLowerCase().includes("equity") || s.title.toLowerCase().includes("access");
    if (selectedCategory === "STEM") return s.title.toLowerCase().includes("science") || s.title.toLowerCase().includes("stem") || s.title.toLowerCase().includes("engineering") || s.title.toLowerCase().includes("research");
    return true;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Hero Header with Endowment Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Decorative ambient blurred lights */}
          <div className="absolute top-0 right-10 -mt-10 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 -mb-10 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-primary text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Gift className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    Scholarship & Endowment Fellowship Hub
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-emerald-950/60 text-academic-success border border-green-200 dark:border-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Automated Eligibility Active
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Fall 2026 Endowment Cycle
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  Institutional grants, Dean&apos;s merit honors, philanthropic research endowments, and tuition bursaries with live GPA parity checking.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAIChatOpen(true)}
                className="btn-primary-glow flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-primary to-rose-dark hover:brightness-110 active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Ask AI Eligibility Advisor</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Telemetry Metrics Ribbon */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Total Endowment Pool
                  </span>
                  <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                    $2.45M
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">AY 2026 Committed</span>
                <span className="text-academic-success font-bold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> 96.8% Disbursed
                </span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Active Funded Fellows
                  </span>
                  <div className="text-3xl font-display font-extrabold text-rose-primary dark:text-rose-light mt-1">
                    142
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary flex items-center justify-center shadow-xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Across 8 Programs</span>
                <span className="text-rose-primary dark:text-rose-light font-bold">Top 12% Cohort</span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Average Grant Per Scholar
                  </span>
                  <div className="text-3xl font-display font-extrabold text-academic-success mt-1">
                    $12,500
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-academic-success-subtle text-academic-success flex items-center justify-center shadow-xs">
                  <Award className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Direct Fee Offset</span>
                <span className="text-academic-success font-bold">100% Tuition Waiver</span>
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Your Academic Parity
                  </span>
                  <div className="text-3xl font-display font-extrabold text-blue-500 mt-1">
                    {studentCgpa.toFixed(2)}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Verified CGPA</span>
                <span className="text-academic-success font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> High Match
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Officer Review Queue (Visible to Admins & Faculty) */}
        {["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD", "ACCOUNTANT"].includes(currentRole) && (
          <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-primary dark:text-rose-accent" />
                <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                  Fellowship Officer Review Queue ({allApplications.length} Submissions)
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-academic-info-subtle text-academic-info border border-blue-200">
                Institutional Financial Aid Desk
              </span>
            </div>

            {allApplications.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-3">No pending student fellowship applications found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                          {app.studentName} ({app.rollNumber})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            app.status === "APPROVED"
                              ? "bg-academic-success-subtle text-academic-success"
                              : app.status === "REJECTED"
                              ? "bg-academic-danger-subtle text-academic-danger"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="text-xs text-charcoal-600 dark:text-charcoal-400 flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-rose-primary dark:text-rose-light">{app.scholarshipTitle}</span>
                        <span>•</span>
                        <span>CGPA: {app.cgpa.toFixed(2)}</span>
                        <span>•</span>
                        <span className="font-semibold text-charcoal-900 dark:text-white">{app.amount}</span>
                      </div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 italic bg-white dark:bg-charcoal-800 p-3 rounded-xl border border-border/60 dark:border-charcoal-700">
                        &quot;{app.statement}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60 dark:border-charcoal-800">
                      {app.status !== "APPROVED" && (
                        <button
                          type="button"
                          disabled={reviewingId === app.id}
                          onClick={() => handleReviewApplication(app.id, "APPROVED")}
                          className="px-4 py-2 text-xs font-bold bg-academic-success hover:bg-green-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {reviewingId === app.id ? "Processing..." : "Approve Fellowship"}
                        </button>
                      )}
                      {app.status !== "REJECTED" && (
                        <button
                          type="button"
                          disabled={reviewingId === app.id}
                          onClick={() => handleReviewApplication(app.id, "REJECTED")}
                          className="px-4 py-2 text-xs font-bold bg-ivory-200 dark:bg-charcoal-800 hover:bg-academic-danger hover:text-white text-charcoal-700 dark:text-ivory-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "ALL", label: "All Grants" },
              { id: "MERIT", label: "Dean's Merit" },
              { id: "STEM", label: "STEM & Research" },
              { id: "NEED", label: "Need-Based Aid" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-rose-primary text-white shadow-xs"
                    : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search fellowships..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary font-medium"
            />
          </div>
        </div>

        {/* Scholarships Grid Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredScholarships.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={Gift}
                title="No Available Scholarships"
                description="Endowment fellowships and institutional grants will be announced at the start of the semester."
              />
            </div>
          ) : (
            filteredScholarships.map((s) => {
              const isEligible = studentCgpa >= s.minCgpa;
              const gpaPct = Math.min(100, Math.round((studentCgpa / s.minCgpa) * 100));

              return (
                <div
                  key={s.id}
                  className="glass-panel glass-card-hover rounded-3xl border border-border dark:border-charcoal-800 shadow-soft p-6 flex flex-col justify-between gap-5 transition-all relative overflow-hidden"
                >
                  {/* Decorative badge corner */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 leading-snug">
                          {s.title}
                        </h3>
                        <span className="text-xs font-semibold text-rose-primary dark:text-rose-light block mt-0.5">
                          {s.provider}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 shrink-0">
                      {s.amount}
                    </span>
                  </div>

                  {/* Description & Requirements */}
                  <div className="space-y-3 text-xs">
                    <p className="text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                      {s.eligibility}
                    </p>

                    {/* GPA Progress Bar & Matcher */}
                    <div className="p-3.5 rounded-2xl bg-ivory-50/80 dark:bg-charcoal-900/60 border border-border/70 dark:border-charcoal-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-charcoal-600 dark:text-charcoal-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${isEligible ? "text-academic-success" : "text-amber-500"}`} />
                          Minimum CGPA Requirement: <strong>{s.minCgpa.toFixed(2)}</strong>
                        </span>
                        <span className={`font-bold ${isEligible ? "text-academic-success" : "text-amber-500"}`}>
                          Your CGPA: {studentCgpa.toFixed(2)} ({isEligible ? "Eligible" : "Need improvement"})
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isEligible ? "bg-academic-success" : "bg-amber-500"
                          }`}
                          style={{ width: `${gpaPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-charcoal-500 pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-rose-primary" /> Application Deadline: <strong>{s.deadline}</strong>
                      </span>
                      <span className="text-[10px] text-charcoal-400">Direct Bursar Credit</span>
                    </div>

                    {s.myApplication && (
                      <div className="p-3 rounded-2xl bg-academic-info-subtle border border-blue-200 dark:border-blue-800 text-xs text-academic-info font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" /> Application Submitted
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-blue-500 text-white text-[10px]">
                          {s.myApplication.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedScholarship(s);
                        setIsApplyModalOpen(true);
                      }}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold shadow-xs transition-all text-center cursor-pointer ${
                        s.myApplication
                          ? "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-300"
                          : isEligible
                          ? "bg-rose-primary hover:bg-rose-dark text-white btn-primary-glow"
                          : "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 hover:bg-rose-primary hover:text-white"
                      }`}
                    >
                      {s.myApplication ? "Inspect My Application Details" : "Apply for Fellowship Grant"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Fellowship Dossier: ${selectedScholarship?.title || "Scholarship"}`}
        description={`Endowed by ${selectedScholarship?.provider || "Endowment Foundation"} • Value: ${selectedScholarship?.amount || "$0"}`}
      >
        <form onSubmit={handleApply} className="flex flex-col gap-4 text-xs">
          <div>
            <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Verified Academic Transcript / Credential Dossier
            </label>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-rose-primary/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 text-rose-primary dark:text-rose-accent text-xs font-bold cursor-pointer transition-all">
                  <Upload className="h-4 w-4" />
                  <span>{isUploading ? "Uploading & Encrypting..." : "Upload Official Transcript (PDF/DOCX)"}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                  />
                </label>
                {uploadedFileName && (
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-academic-success bg-academic-success-subtle px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    {uploadedFileName}
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={documentsUrl}
                onChange={(e) => setDocumentsUrl(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-700 bg-surface-ground text-charcoal-700 dark:text-ivory-200 font-mono text-[11px]"
                placeholder="e.g. /uploads/documents/transcript.pdf"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Statement of Purpose & Institutional Contribution
            </label>
            <textarea
              required
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 leading-relaxed"
              placeholder="Detail your research endeavors, academic achievements, and how this endowment will advance your trajectory..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Encrypting & Submitting..." : "Submit Fellowship Dossier"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
