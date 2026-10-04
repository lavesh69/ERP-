"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  FlaskConical,
  BookOpen,
  Award,
  Sparkles,
  Download,
  Plus,
  ExternalLink,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Star,
  Search,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  GraduationCap,
  FileCheck,
} from "lucide-react";

export default function ResearchPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh } = useApp();

  const [projects, setProjects] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "publications">("projects");
  const [searchQuery, setSearchQuery] = useState("");

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    grantAmount: "185000",
    fundingAgency: "National Science Foundation (NSF)",
    abstract: "",
  });

  // Double-Blind Peer Review Modal State
  const [isPeerReviewModalOpen, setIsPeerReviewModalOpen] = useState(false);
  const [selectedPubForReview, setSelectedPubForReview] = useState<any>(null);
  const [reviewOriginality, setReviewOriginality] = useState(9);
  const [reviewMethodology, setReviewMethodology] = useState(9);
  const [reviewRigor, setReviewRigor] = useState(8);
  const [reviewEthical, setReviewEthical] = useState("PASS");
  const [reviewRec, setReviewRec] = useState("ACCEPT");
  const [reviewComments, setReviewComments] = useState("Excellent empirical derivation. Results reproducible across GPU clusters.");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchResearch = () => {
    setIsLoading(true);
    fetch("/api/research")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setPublications(data.publications || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Research fetch error:", err);
        showToast("Error retrieving research repository", "error");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchResearch();
  }, [refreshTrigger]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.abstract.trim()) {
      showToast("Please provide project title and research abstract", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Grant proposal submitted successfully!", "success");
        setIsProposalModalOpen(false);
        setFormData({
          title: "",
          grantAmount: "185000",
          fundingAgency: "National Science Foundation (NSF)",
          abstract: "",
        });
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to submit proposal", "error");
      }
    } catch {
      showToast("Network error submitting grant proposal", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPubForReview || !reviewComments.trim()) {
      showToast("Please provide detailed referee commentary", "error");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_PEER_REVIEW",
          publicationId: selectedPubForReview.id,
          originalityScore: reviewOriginality,
          methodologyScore: reviewMethodology,
          empiricalRigorScore: reviewRigor,
          ethicalCompliance: reviewEthical,
          recommendation: reviewRec,
          comments: reviewComments.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Peer evaluation officially recorded into Editorial Ledger", "success");
        setIsPeerReviewModalOpen(false);
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to submit peer review", "error");
      }
    } catch {
      showToast("Network error recording peer review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.pi?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.agency?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPubs = publications.filter((p) =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.doi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Hero Banner Section */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Ambient blurred glow */}
          <div className="absolute top-0 right-1/4 -mt-10 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -mb-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-primary/30 shrink-0">
                <FlaskConical className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    Research Enterprise & Grants Directorate
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ISO 26324 DOI Verified
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-primary/10 text-rose-primary dark:text-rose-light">
                    Double-Blind Peer Review Ledger
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  External grant lifecycle management, CrossRef-indexed DOI publications, referee evaluation rubrics, and intellectual patent portfolios.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(true)}
                className="btn-primary-glow flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Submit Grant Proposal</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAIChatOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:border-rose-primary text-xs font-bold border border-border dark:border-charcoal-700 shadow-xs transition-all shrink-0 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-rose-primary" />
                <span>AI Literature Discovery</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Research Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Active Sponsored Grants
                </span>
                <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                  $5.62M
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center shadow-xs">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">NSF & NIH Awarded</span>
              <span className="text-academic-success font-bold flex items-center gap-0.5">
                <ArrowUpRight className="h-3.5 w-3.5" /> +14.2% YoY
              </span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Archival Publications
                </span>
                <div className="text-3xl font-display font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {publications.length || 18}
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">IEEE, ACM & Nature</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">100% Peer-Reviewed</span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Collegiate H-Index
                </span>
                <div className="text-3xl font-display font-extrabold text-academic-success mt-1">
                  28.4
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-academic-success-subtle text-academic-success flex items-center justify-center shadow-xs">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">1,480+ Total Citations</span>
              <span className="text-academic-success font-bold">Top 5% Faculty</span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Patents & Disclosures
                </span>
                <div className="text-3xl font-display font-extrabold text-amber-500 mt-1">
                  12
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">USPTO Registered</span>
              <span className="text-academic-success font-bold">8 Commercialized</span>
            </div>
          </div>
        </div>

        {/* View Switcher & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-3xl shadow-soft">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("projects")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "projects"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
              }`}
            >
              Sponsored Grant Projects ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("publications")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "publications"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
              }`}
            >
              Archival Publications & DOIs ({publications.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search projects or papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary font-medium"
            />
          </div>
        </div>

        {/* Tab 1: Funded Projects Section */}
        {activeTab === "projects" && (
          <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-rose-primary" />
                  Funded Faculty Research Initiatives & Milestones
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                  Multi-year research investigations funded by national endowments and corporate labs
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-academic-success-subtle text-academic-success">
                {filteredProjects.length} Active Grants
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center text-xs text-charcoal-500">
                No research projects cataloged yet. Submit a proposal to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-6 rounded-3xl border border-border dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-900 hover:border-rose-primary/40 transition-all flex flex-col justify-between gap-4 shadow-soft relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                          {proj.status}
                        </span>
                        <span className="font-display font-extrabold text-rose-primary dark:text-rose-light text-base">
                          {proj.grant}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-2.5 leading-snug">
                        {proj.title}
                      </h3>
                      <span className="text-xs text-charcoal-600 dark:text-charcoal-400 font-bold block mt-1">
                        Lead PI: <span className="text-charcoal-900 dark:text-ivory-100">{proj.pi}</span>
                      </span>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2 line-clamp-3 leading-relaxed">
                        {proj.abstract}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-xs text-charcoal-600 dark:text-charcoal-400">
                      <span>
                        Sponsor: <strong className="text-charcoal-900 dark:text-ivory-100">{proj.agency}</strong>
                      </span>
                      <span className="font-mono font-bold text-rose-primary dark:text-rose-light">
                        {proj.milestones}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Peer-Reviewed Publications Table with DOI & Review Pipeline */}
        {activeTab === "publications" && (
          <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-border/80 dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-rose-primary" />
                  Peer-Reviewed Archival Publications & DOI Registry
                </span>
                <span className="text-xs text-charcoal-500 block">
                  CrossRef Indexed • ISO 26324 Standards Compliant
                </span>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-academic-info-subtle text-academic-info">
                {filteredPubs.length} Archival Papers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-ivory-100/90 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-border/80 dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Publication Title & Authors</th>
                    <th className="p-4">Journal / Conference</th>
                    <th className="p-4 font-mono">Standard DOI</th>
                    <th className="p-4 text-center">Editorial Status</th>
                    <th className="p-4 text-center">Citations</th>
                    <th className="p-4 text-right">Referee Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                  {filteredPubs.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-rose-primary/[0.02] dark:hover:bg-charcoal-800/40 transition-colors"
                    >
                      <td className="p-4 max-w-sm">
                        <strong className="font-bold text-charcoal-900 dark:text-ivory-100 block text-xs">
                          {p.title}
                        </strong>
                        <span className="text-[11px] text-charcoal-500 block mt-0.5">{p.authors}</span>
                      </td>
                      <td className="p-4 text-charcoal-700 dark:text-ivory-200 font-medium">
                        {p.journal} ({p.year})
                      </td>
                      <td className="p-4 font-mono text-[11px]">
                        <a
                          href={p.doiUrl || `https://doi.org/${p.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-rose-primary dark:text-rose-light hover:underline flex items-center gap-1 font-bold"
                          title={`Verified CrossRef DOI. SHA-256: ${p.sha256Checksum || "verified"}`}
                        >
                          <span>{p.doi}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            p.reviewStatus === "ACCEPTED"
                              ? "bg-academic-success-subtle text-academic-success border border-emerald-300"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300"
                          }`}
                        >
                          {p.reviewStatus} ({p.averageReviewScore || 8.5}/10)
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-academic-info-subtle text-academic-info">
                          {p.citations} Citations
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPubForReview(p);
                            setIsPeerReviewModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-primary hover:text-white text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-rose-primary" />
                          <span>Peer Review</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal 1: Submit Grant Proposal */}
        <Modal
          isOpen={isProposalModalOpen}
          onClose={() => setIsProposalModalOpen(false)}
          title="Submit Research Grant Proposal"
          description="Submit a verified faculty research proposal for institutional endorsement and external funding review."
        >
          <form onSubmit={handleSubmitProposal} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Project Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Distributed Consensus in Resource-Constrained Edge Swarms"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Requested Grant ($)
                </label>
                <input
                  type="number"
                  value={formData.grantAmount}
                  onChange={(e) => setFormData({ ...formData, grantAmount: e.target.value })}
                  placeholder="185000"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Funding Agency
                </label>
                <input
                  type="text"
                  value={formData.fundingAgency}
                  onChange={(e) => setFormData({ ...formData, fundingAgency: e.target.value })}
                  placeholder="e.g. National Science Foundation (NSF)"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Scientific Abstract & Scope
              </label>
              <textarea
                rows={4}
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder="Describe methodology, anticipated deliverables, and theoretical impact..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsProposalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal 2: Submit Double-Blind Peer Review */}
        <Modal
          isOpen={isPeerReviewModalOpen}
          onClose={() => setIsPeerReviewModalOpen(false)}
          title={`Double-Blind Peer Review Rubric`}
          description={`Paper: "${selectedPubForReview?.title || "Scientific Publication"}" • Anonymous Referee Protocol`}
        >
          <form onSubmit={handleSubmitReview} className="flex flex-col gap-4 text-xs mt-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Originality (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reviewOriginality}
                  onChange={(e) => setReviewOriginality(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Methodology (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reviewMethodology}
                  onChange={(e) => setReviewMethodology(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Empirical Rigor (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={reviewRigor}
                  onChange={(e) => setReviewRigor(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Ethical & Plagiarism Check
                </label>
                <select
                  value={reviewEthical}
                  onChange={(e) => setReviewEthical(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="PASS">PASS (Complies with IEEE/ACM Standards)</option>
                  <option value="FAIL">FAIL (Suspected Unattributed Text)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Editorial Recommendation
                </label>
                <select
                  value={reviewRec}
                  onChange={(e) => setReviewRec(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="ACCEPT">ACCEPT (Publish as Archival Paper)</option>
                  <option value="MINOR_REVISION">MINOR REVISION</option>
                  <option value="MAJOR_REVISION">MAJOR REVISION</option>
                  <option value="REJECT">REJECT</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Confidential Referee Evaluation Commentary
              </label>
              <textarea
                rows={3}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Critique theoretical foundation, clarity of proofs, and empirical validity..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsPeerReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isSubmittingReview ? "Recording..." : "Submit Official Peer Review"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
