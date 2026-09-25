"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import {
  FlaskConical,
  BookOpen,
  Award,
  Sparkles,
  Download,
  Plus,
  ExternalLink,
  Users,
} from "lucide-react";

export default function ResearchPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh } = useApp();

  const [projects, setProjects] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Proposal modal state
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    grantAmount: "185000",
    fundingAgency: "National Science Foundation (NSF)",
    abstract: "",
  });

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

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Research & Grants Hub
                </h1>
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  Verifiable Citations
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Peer-reviewed publications, external grant tracking, patents, and AI literature synthesis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
            >
              <Plus className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
              <span>Submit Proposal</span>
            </button>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Literature Discovery</span>
            </button>
          </div>
        </div>

        {/* Funded Projects Section */}
        <div className="glass-panel rounded-2xl shadow-soft p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
            <h2 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              Funded Research Projects & Milestones
            </h2>
            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="flex items-center gap-1 text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Submit Grant Proposal</span>
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-500">
              No research projects cataloged yet. Submit a proposal to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-900 hover:border-rose-accent/40 transition-all flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                        {proj.status}
                      </span>
                      <span className="font-display font-bold text-rose-primary dark:text-rose-accent text-sm">
                        {proj.grant} Grant
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      {proj.title}
                    </h3>
                    <span className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">
                      {proj.pi}
                    </span>
                    <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-1 line-clamp-3">
                      {proj.abstract}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-[11px] text-charcoal-600 dark:text-charcoal-400">
                    <span>
                      Funding: <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{proj.agency}</span>
                    </span>
                    <span className="font-bold text-rose-primary dark:text-rose-accent">{proj.milestones}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Peer-Reviewed Publications Table */}
        <div className="glass-panel rounded-2xl shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
              Peer-Reviewed Publications & Transcripts
            </span>
            <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
              Indexed in IEEE, ACM & Institutional Registry
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-ivory-100/90 dark:bg-charcoal-900/90 backdrop-blur-md border-b border-border/80 dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Publication Title</th>
                  <th className="p-3.5">Authors</th>
                  <th className="p-3.5">Journal / Conference</th>
                  <th className="p-3.5 font-mono">DOI</th>
                  <th className="p-3.5 text-center">Citations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                {publications.map((p) => (
                  <tr key={p.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-900/40 transition-colors">
                    <td className="p-3.5 font-bold">{p.title}</td>
                    <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">{p.authors}</td>
                    <td className="p-3.5 text-charcoal-700 dark:text-ivory-200 font-medium">
                      {p.journal} ({p.year})
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-rose-primary dark:text-rose-accent">
                      {p.doi}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-academic-info-subtle text-academic-info">
                        {p.citations} Citations
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Submit Grant Proposal */}
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
                  placeholder="NSF / NIH / Corporate"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Research Abstract & Methodology
              </label>
              <textarea
                rows={4}
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder="Describe hypothesis, system architecture, accelerator requirements, and target milestones..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
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
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmitting ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
