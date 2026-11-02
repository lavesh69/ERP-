// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationPatentsTab Component
 * Technology Transfer Office (TTO) patent filings, invention disclosures, and university IP ownership.
 */

"use client";

import React, { useState } from "react";
import {
  Lightbulb,
  Award,
  ShieldCheck,
  PlusCircle,
  X,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
} from "lucide-react";
import { PatentDisclosure, IncubatedStartup } from "@/lib/incubation/incubation-engine";

interface IncubationPatentsTabProps {
  patents: PatentDisclosure[];
  startups: IncubatedStartup[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationPatentsTab({
  patents,
  startups,
  onRefresh,
  showToast,
}: IncubationPatentsTabProps) {
  const [showFileModal, setShowFileModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    startupId: startups[0]?.id || "",
    inventionTitle: "",
    applicationNumber: "",
    jurisdiction: "INDIAN_PATENT_OFFICE" as const,
    universitySharePercentage: 50,
    inventorNames: "",
  });

  const totalPatents = patents.length;
  const publishedOrGranted = patents.filter((p) => p.status === "PUBLISHED" || p.status === "GRANTED").length;

  const handleFilePatent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startupId || !form.inventionTitle.trim()) {
      showToast("Venture and invention title are required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const inventors = form.inventorNames
        ? form.inventorNames.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FILE_PATENT",
          startupId: form.startupId,
          inventionTitle: form.inventionTitle,
          applicationNumber: form.applicationNumber || `IN-${Date.now().toString().slice(-8)}`,
          jurisdiction: form.jurisdiction,
          universitySharePercentage: form.universitySharePercentage,
          inventors,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to file patent disclosure");
      }

      showToast(data.message || "Invention disclosure submitted to TTO", "success");
      setShowFileModal(false);
      setForm({
        startupId: startups[0]?.id || "",
        inventionTitle: "",
        applicationNumber: "",
        jurisdiction: "INDIAN_PATENT_OFFICE",
        universitySharePercentage: 50,
        inventorNames: "",
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = "Disclosure Ref,Invention Title,Startup Name,Application #,Jurisdiction,University Share %,Status,Filing Date\n";
    const rows = patents
      .map((p) => `"${p.disclosureRef}","${p.inventionTitle.replace(/"/g, '""')}","${p.startupName}","${p.applicationNumber}","${p.jurisdiction}",${p.universitySharePercentage},"${p.status}","${p.filingDate}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `TTO_Patent_Registry_${new Date().toISOString().split("T")[0]}.csv`);
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total IP Disclosures</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Lightbulb className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {totalPatents}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Patents & proprietary trade secrets filed</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Published / Granted</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            {publishedOrGranted}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Gazette published or formally granted</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average University Stake</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            47.5%
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Commercialization royalty agreement</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">International Filings</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-primary">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {patents.filter((p) => p.jurisdiction !== "INDIAN_PATENT_OFFICE").length}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">USPTO & PCT Global</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
            Technology Transfer Office (TTO) Patent Registry
          </h3>
          <p className="text-xs text-charcoal-400">Institutional joint intellectual property disclosures and patent applications</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-charcoal-700 text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Registry</span>
          </button>
          <button
            onClick={() => setShowFileModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>File Invention Disclosure</span>
          </button>
        </div>
      </div>

      {/* Patents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patents.map((pat) => (
          <div
            key={pat.id}
            className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="font-mono text-[11px] font-bold text-rose-primary dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                    {pat.disclosureRef}
                  </span>
                  <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                    {pat.inventionTitle}
                  </h3>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                    pat.status === "GRANTED" || pat.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                  }`}
                >
                  {pat.status.replace(/_/g, " ")}
                </span>
              </div>

              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mb-3">
                Assigned Venture: <strong className="text-charcoal-700 dark:text-ivory-200">{pat.startupName}</strong>
              </p>

              <div className="bg-ivory-50 dark:bg-charcoal-800/60 p-3 rounded-xl border border-border/50 dark:border-charcoal-700/50 space-y-1.5 text-xs mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500 font-medium">Application No:</span>
                  <span className="font-mono font-bold text-charcoal-800 dark:text-ivory-200">{pat.applicationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500 font-medium">Jurisdiction:</span>
                  <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{pat.jurisdiction.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500 font-medium">University Royalty Share:</span>
                  <span className="font-bold text-rose-primary dark:text-rose-400">{pat.universitySharePercentage}%</span>
                </div>
              </div>

              <div className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Inventors: <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{pat.inventors.join(", ")}</span>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between text-xs text-charcoal-400">
              <span>Filing Date: {pat.filingDate}</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>TTO Protected</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* File Patent Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  File Intellectual Property Disclosure
                </h3>
              </div>
              <button
                onClick={() => setShowFileModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFilePatent} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Cohort Venture *
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

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Invention Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Ultra-Low Power Neural Signal Processor for Wearables"
                  value={form.inventionTitle}
                  onChange={(e) => setForm({ ...form, inventionTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Application / Docket Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. IN-2026410889"
                    value={form.applicationNumber}
                    onChange={(e) => setForm({ ...form, applicationNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Filing Jurisdiction
                  </label>
                  <select
                    value={form.jurisdiction}
                    onChange={(e) => setForm({ ...form, jurisdiction: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="INDIAN_PATENT_OFFICE">Indian Patent Office (IPO)</option>
                    <option value="USPTO">United States (USPTO)</option>
                    <option value="PCT_INTERNATIONAL">PCT International (WIPO)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    University Royalty / Equity Share (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.universitySharePercentage}
                    onChange={(e) => setForm({ ...form, universitySharePercentage: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Inventors (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins, Alex Mercer"
                    value={form.inventorNames}
                    onChange={(e) => setForm({ ...form, inventorNames: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowFileModal(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Filing..." : "Register Patent with TTO"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
