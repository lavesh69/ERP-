"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Briefcase,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Sparkles,
  Search,
  ExternalLink,
  Plus,
  Send,
} from "lucide-react";

export default function CareersPage() {
  const { showToast, setIsAIChatOpen, currentRole, refreshTrigger, triggerRefresh } = useApp();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Dynamic placement metrics from live DB
  const [metrics, setMetrics] = useState({
    activeDrivesCount: 0,
    totalApplicationsCount: 0,
    topRecruitersCount: 0,
    placementRate: "95.6%",
    averageCtc: "$148,500",
  });

  // Admin Job creation form
  const [jobForm, setJobForm] = useState({
    companyName: "",
    jobTitle: "",
    type: "FULL_TIME",
    location: "Hybrid / Global Labs",
    stipend: "$140,000 / year",
    requirements: "Strong fundamentals in algorithms, neural networks, or systems engineering.",
    deadline: "",
  });

  // Application form state
  const [resumeUrl, setResumeUrl] = useState("/uploads/resumes/alex_mercer_cv.pdf");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadCareers() {
      try {
        setLoading(true);
        const res = await fetch("/api/careers");
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
          if (data.metrics) setMetrics(data.metrics);
        }
      } catch (err) {
        console.error("Failed to load careers:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCareers();
  }, [refreshTrigger]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.companyName.trim() || !jobForm.jobTitle.trim()) {
      showToast("Please provide company name and job designation", "error");
      return;
    }
    setIsCreatingJob(true);
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_JOB",
          ...jobForm,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Placement drive created successfully!", "success");
        setIsCreateJobModalOpen(false);
        setJobForm({
          companyName: "",
          jobTitle: "",
          type: "FULL_TIME",
          location: "Hybrid / Global Labs",
          stipend: "$140,000 / year",
          requirements: "Strong fundamentals in algorithms, neural networks, or systems engineering.",
          deadline: "",
        });
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to create placement drive", "error");
      }
    } catch {
      showToast("Network error creating placement drive", "error");
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob.id,
          resumeUrl,
          notes: applicationNotes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Application submitted for ${selectedJob.title}`, "success");
        setIsApplyModalOpen(false);
        setApplicationNotes("");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to submit application", "error");
      }
    } catch {
      showToast("Network error submitting application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Career, Internship & Placement Hub
                </h1>
                <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200">
                  AI Career Coach Active
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Corporate placement drives, internship matching, AI resume tailoring, and mock technical interviews
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD"].includes(currentRole) && (
              <button
                onClick={() => setIsCreateJobModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-soft dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-900 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 shadow-sm transition-all"
              >
                <Plus className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                <span>Post Placement Drive</span>
              </button>
            )}
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Resume & Mock Interview</span>
            </button>
          </div>
        </div>

        {/* 4 Career Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
              Campus Placement Rate
            </span>
            <div className="text-2xl font-display font-bold text-academic-success mt-1">
              {metrics.placementRate}
            </div>
            <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 mt-2">
              Graduating Cohort Verified
            </span>
          </div>
          <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
              Average Tier-1 CTC
            </span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {metrics.averageCtc}
            </div>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-2">
              Tier-1 Corporate Offers
            </span>
          </div>
          <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
              Active Corporate Drives
            </span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {metrics.activeDrivesCount || jobs.length} Drives
            </div>
            <span className="badge-subtle bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-2">
              {metrics.totalApplicationsCount} Applications
            </span>
          </div>
          <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
              Recruitment Partners
            </span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              45+ Labs
            </div>
            <span className="badge-subtle bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 mt-2">
              Fortune 500 Network
            </span>
          </div>
        </div>

        {/* Listings */}
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No Active Job Drives"
              description="New campus recruitment drives and internships are announced regularly."
            />
          ) : (
            jobs.map((j) => (
              <div
                key={j.id}
                className="glass-panel glass-card-hover rounded-2xl shadow-soft p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    <Building className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{j.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-600">
                        {j.type}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-rose-primary">{j.company}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-charcoal-500 mt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-rose-accent" /> {j.location}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{j.stipend}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Deadline: {j.deadline}
                      </span>
                    </div>

                    <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 mt-1">
                      Requirements: {j.requirements}
                    </p>

                    {j.myApplication && (
                      <div className="mt-2 p-2 rounded-lg bg-academic-info-subtle border border-blue-200 text-[11px] text-academic-info font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>
                          Status: {j.myApplication.status} (Applied: {j.myApplication.appliedAt})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  {["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD"].includes(currentRole) && (
                    <button
                      onClick={() => {
                        setSelectedJob(j);
                        setIsApplicantsModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-600 transition-all"
                    >
                      Applicants ({j.applications?.length || 0})
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedJob(j);
                      setIsApplyModalOpen(true);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${
                      j.myApplication
                        ? "bg-ivory-200 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-300"
                        : "bg-rose-primary hover:bg-rose-dark text-white"
                    }`}
                  >
                    {j.myApplication ? "View / Update" : "Apply Now"}
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
        title={`Apply: ${selectedJob?.title || "Position"}`}
        description={`Submit application to ${selectedJob?.company || "Company"}`}
      >
        <form onSubmit={handleApply} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Resume / Portfolio URL
            </label>
            <input
              type="text"
              required
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. https://linkedin.com/in/student or /uploads/cv.pdf"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Cover Note / Relevant Projects
            </label>
            <textarea
              rows={3}
              value={applicationNotes}
              onChange={(e) => setApplicationNotes(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Highlight research experience, open-source PRs, and system programming skills..."
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

      {/* 2. Admin: Post New Placement Drive Modal */}
      <Modal
        isOpen={isCreateJobModalOpen}
        onClose={() => setIsCreateJobModalOpen(false)}
        title="Post Corporate Placement Drive"
        description="Launch an official campus recruitment drive or internship opportunity for students."
      >
        <form onSubmit={handleCreateJob} className="flex flex-col gap-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Company Name
              </label>
              <input
                type="text"
                required
                value={jobForm.companyName}
                onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
                className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Anthropic, Google DeepMind"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Job Title / Role
              </label>
              <input
                type="text"
                required
                value={jobForm.jobTitle}
                onChange={(e) => setJobForm({ ...jobForm, jobTitle: e.target.value })}
                className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. AI Systems Resident, Research Engineer"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Employment Type
              </label>
              <select
                value={jobForm.type}
                onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
                className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CO_OP">Co-Op</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Compensation / CTC
              </label>
              <input
                type="text"
                value={jobForm.stipend}
                onChange={(e) => setJobForm({ ...jobForm, stipend: e.target.value })}
                className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. $140,000 / year"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Location
              </label>
              <input
                type="text"
                value={jobForm.location}
                onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Hybrid / SF or Cambridge"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Prerequisites & Technical Requirements
            </label>
            <textarea
              rows={3}
              value={jobForm.requirements}
              onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
              className="w-full p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="List required courses, CGPA minimum, language proficiencies..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateJobModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreatingJob}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isCreatingJob ? "Publishing Drive..." : "Publish Placement Drive"}
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Admin: Candidate Applicants Modal */}
      <Modal
        isOpen={isApplicantsModalOpen}
        onClose={() => setIsApplicantsModalOpen(false)}
        title={`Candidate Submissions: ${selectedJob?.title || "Role"}`}
        description={`${selectedJob?.company || "Company"} • ${selectedJob?.applications?.length || 0} scholars applied.`}
      >
        <div className="flex flex-col gap-3 text-xs">
          {(!selectedJob?.applications || selectedJob.applications.length === 0) ? (
            <p className="text-center py-6 text-charcoal-500">
              No candidates have submitted dossiers for this drive yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
              {selectedJob.applications.map((app: any) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl border border-border/70 dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {app.studentName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {app.studentName}
                      </span>
                      <span className="text-[11px] text-charcoal-500">
                        {app.rollNumber} • CGPA: {Number(app.cgpa).toFixed(2)} • Applied: {app.appliedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-info-subtle text-academic-info">
                      {app.status}
                    </span>
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-[11px] font-bold border border-border dark:border-charcoal-600 transition-all flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3 text-rose-primary" />
                      <span>Resume</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsApplicantsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
