"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
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

  // Application form
  const [statement, setStatement] = useState("");
  const [documentsUrl, setDocumentsUrl] = useState("/uploads/scholarships/alex_mercer_transcript.pdf");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Scholarship & Endowment Hub
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200">
                  Eligibility Engine Online
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Endowed fellowships, merit grants, need-based subsidies, and automated eligibility verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask AI Eligibility Advisor</span>
            </button>
          </div>
        </div>

        {/* Officer Review Queue (Visible to Admins & Faculty) */}
        {["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD", "ACCOUNTANT"].includes(currentRole) && (
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-primary dark:text-rose-accent" />
                <h2 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                  Fellowship Officer Review Queue ({allApplications.length} Submissions)
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-info-subtle text-academic-info border border-blue-200">
                Institutional Financial Aid Desk
              </span>
            </div>

            {allApplications.length === 0 ? (
              <p className="text-xs text-charcoal-500 py-2">No pending student fellowship applications found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {allApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl border border-border/70 dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-900/40 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-charcoal-900 dark:text-ivory-100">
                          {app.studentName} ({app.rollNumber})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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
                      <div className="text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2 mb-2">
                        <span className="font-semibold text-rose-primary">{app.scholarshipTitle}</span>
                        <span>•</span>
                        <span>CGPA: {app.cgpa.toFixed(2)}</span>
                        <span>•</span>
                        <span>{app.amount}</span>
                      </div>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 line-clamp-2 italic bg-white dark:bg-charcoal-800 p-2 rounded-lg border border-border/40">
                        &quot;{app.statement}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50 dark:border-charcoal-800">
                      {app.status !== "APPROVED" && (
                        <button
                          disabled={reviewingId === app.id}
                          onClick={() => handleReviewApplication(app.id, "APPROVED")}
                          className="px-3 py-1.5 text-[11px] font-bold bg-academic-success hover:bg-green-700 text-white rounded-lg shadow-xs transition-all disabled:opacity-50"
                        >
                          {reviewingId === app.id ? "Processing..." : "Approve Fellowship"}
                        </button>
                      )}
                      {app.status !== "REJECTED" && (
                        <button
                          disabled={reviewingId === app.id}
                          onClick={() => handleReviewApplication(app.id, "REJECTED")}
                          className="px-3 py-1.5 text-[11px] font-bold bg-ivory-200 dark:bg-charcoal-700 hover:bg-academic-danger hover:text-white text-charcoal-700 dark:text-ivory-200 rounded-lg transition-all disabled:opacity-50"
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

        {/* Scholarships List */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : scholarships.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="No Available Scholarships"
              description="Endowment fellowships and institutional grants will be announced at the start of the semester."
            />
          ) : (
            scholarships.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-rose-accent/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    <Award className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{s.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container text-rose-primary">
                        Min CGPA: {s.minCgpa.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-rose-primary">{s.provider}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-charcoal-500 mt-0.5">
                      <span className="font-bold text-academic-success">{s.amount}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Deadline: {s.deadline}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 mt-1">{s.eligibility}</p>

                    {s.studentMatch && (
                      <div className="mt-2 p-2 rounded-lg bg-academic-success-subtle border border-green-200 text-[11px] text-academic-success font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{s.studentMatch}</span>
                      </div>
                    )}

                    {s.myApplication && (
                      <div className="mt-2 p-2 rounded-lg bg-academic-info-subtle border border-blue-200 text-[11px] text-academic-info font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>
                          Application Status: {s.myApplication.status} (Applied: {s.myApplication.appliedAt})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={() => {
                      setSelectedScholarship(s);
                      setIsApplyModalOpen(true);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      s.myApplication
                        ? "bg-ivory-200 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-300"
                        : "bg-rose-primary hover:bg-rose-dark text-white"
                    }`}
                  >
                    {s.myApplication ? "View Application" : "Apply for Fellowship"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply: ${selectedScholarship?.title || "Scholarship"}`}
        description={`Endowed by ${selectedScholarship?.provider || "Endowment Foundation"}`}
      >
        <form onSubmit={handleApply} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Academic Transcript / Portfolio Link
            </label>
            <input
              type="text"
              required
              value={documentsUrl}
              onChange={(e) => setDocumentsUrl(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. /uploads/scholarships/transcript.pdf"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Statement of Purpose / Research Contributions
            </label>
            <textarea
              required
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Detail your academic milestones, financial circumstances, and planned research focus..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsApplyModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
