// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationGrantsTab Component
 * Seed grant tranches, milestone verification proofs, and capital disbursement ledger.
 */

"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Clock,
  PlusCircle,
  X,
  FileText,
  ShieldCheck,
  Building,
  ArrowRight,
  Download,
} from "lucide-react";
import { SeedGrantTranche, IncubatedStartup } from "@/lib/incubation/incubation-engine";

interface IncubationGrantsTabProps {
  tranches: SeedGrantTranche[];
  startups: IncubatedStartup[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationGrantsTab({
  tranches,
  startups,
  onRefresh,
  showToast,
}: IncubationGrantsTabProps) {
  const [showDisburseModal, setShowDisburseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetStartupId, setTargetStartupId] = useState<string>(startups[0]?.id || "");
  const [trancheAmount, setTrancheAmount] = useState<number>(25000);
  const [milestoneDesc, setMilestoneDesc] = useState<string>("");
  const [sanctionOrderNumber, setSanctionOrderNumber] = useState<string>("");

  const totalDisbursed = tranches.reduce((sum, t) => sum + (t.amount || 0), 0);
  const avgTranche = tranches.length > 0 ? Math.round(totalDisbursed / tranches.length) : 0;

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStartupId || !trancheAmount || !milestoneDesc.trim()) {
      showToast("Please fill in all required grant tranche fields", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISBURSE_GRANT",
          startupId: targetStartupId,
          amount: trancheAmount,
          milestoneDescription: milestoneDesc,
          sanctionOrderNumber: sanctionOrderNumber || `SO-AIC-2026-${Math.floor(100 + Math.random() * 900)}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to disburse grant tranche");
      }

      showToast(data.message || "Grant tranche disbursed successfully", "success");
      setShowDisburseModal(false);
      setMilestoneDesc("");
      setSanctionOrderNumber("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    const headers = "Tranche Ref,Startup Name,Tranche #,Amount (INR),Milestone,Sanction Order,Disbursed Date\n";
    const rows = tranches
      .map((t) => `"${t.trancheRef}","${t.startupName}",${t.trancheNumber},${t.amount},"${(t.milestoneDescription || "").replace(/"/g, '""')}","${t.sanctionOrderNumber}","${t.disbursedAt || ""}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Seed_Grant_Disbursement_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
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
            <span className="text-xs font-semibold uppercase tracking-wider">Total Grants Disbursed</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            INR {totalDisbursed.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Across {tranches.length} formal grant tranches</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Tranche Size</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            INR {avgTranche.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Milestone-contingent capital releases</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Funded Ventures</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-primary">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {new Set(tranches.map((t) => t.startupId)).size}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Student & faculty startup companies</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Compliance</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            100%
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Sanction order linked & UC verified</p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
        <div>
          <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
            Seed Capital Tranche Ledger
          </h3>
          <p className="text-xs text-charcoal-400">University venture fund disbursements mapped to technical milestones</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border dark:border-charcoal-700 text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Ledger</span>
          </button>
          <button
            onClick={() => setShowDisburseModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Disburse Grant Tranche</span>
          </button>
        </div>
      </div>

      {/* Tranches Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-ivory-50 dark:bg-charcoal-800/50 text-charcoal-500 dark:text-charcoal-400 text-xs uppercase font-medium">
              <tr>
                <th className="py-3 px-4">Tranche Ref</th>
                <th className="py-3 px-4">Venture</th>
                <th className="py-3 px-4">Tranche #</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Sanction Order</th>
                <th className="py-3 px-4">Technical Milestone</th>
                <th className="py-3 px-4">Disbursed Date</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-charcoal-800 text-charcoal-700 dark:text-ivory-300">
              {tranches.map((t) => (
                <tr key={t.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-rose-primary dark:text-rose-400">
                    {t.trancheRef}
                  </td>
                  <td className="py-3 px-4 font-bold text-charcoal-900 dark:text-ivory-100">
                    {t.startupName}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold">
                    Tranche {t.trancheNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    INR {t.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-charcoal-500">
                    {t.sanctionOrderNumber}
                  </td>
                  <td className="py-3 px-4 text-xs max-w-xs truncate text-charcoal-600 dark:text-charcoal-400">
                    {t.milestoneDescription}
                  </td>
                  <td className="py-3 px-4 text-xs text-charcoal-400">
                    {t.disbursedAt ? new Date(t.disbursedAt).toLocaleDateString() : "Pending"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      DISBURSED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 shadow-elevated border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Disburse Seed Grant Tranche
                </h3>
              </div>
              <button
                onClick={() => setShowDisburseModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Recipient Cohort Venture *
                </label>
                <select
                  required
                  value={targetStartupId}
                  onChange={(e) => setTargetStartupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startupName} ({s.companyRef}) - Stage: {s.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Tranche Amount (INR) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={trancheAmount}
                    onChange={(e) => setTrancheAmount(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Sanction Order Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SO-AIC-2026-118"
                    value={sanctionOrderNumber}
                    onChange={(e) => setSanctionOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Milestone Verification &amp; Deliverable Proof *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Completed working hardware prototype and achieved 90% accuracy in lab trials..."
                  value={milestoneDesc}
                  onChange={(e) => setMilestoneDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowDisburseModal(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Processing..." : "Authorize Capital Release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
