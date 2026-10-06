"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Play, ShieldAlert, CheckCircle2, Clock, Settings2 } from "lucide-react";
import { LateFineRule } from "@/lib/finance/finance-engine";

interface LateFinesViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function LateFinesView({ showToast }: LateFinesViewProps) {
  const [rule, setRule] = useState<LateFineRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<any | null>(null);

  // Form states
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [model, setModel] = useState<LateFineRule["model"]>("DAILY");
  const [dailyRate, setDailyRate] = useState(10);
  const [flatAmount, setFlatAmount] = useState(50);
  const [percentageRate, setPercentageRate] = useState(2);
  const [maxCap, setMaxCap] = useState(200);

  async function loadRule() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/late-fines");
      if (res.ok) {
        const data = await res.json();
        if (data.rule) {
          setRule(data.rule);
          setGracePeriodDays(data.rule.gracePeriodDays);
          setModel(data.rule.model);
          setDailyRate(data.rule.dailyRate);
          setFlatAmount(data.rule.flatAmount);
          setPercentageRate(data.rule.percentageRate);
          setMaxCap(data.rule.maxCap);
        }
      }
    } catch {
      showToast("Failed to load late fine policy", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRule();
  }, []);

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/finance/late-fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_RULE",
          rule: {
            gracePeriodDays,
            model,
            dailyRate,
            flatAmount,
            percentageRate,
            maxCap,
            isActive: true,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRule(data.rule);
        showToast("Late fine policy configuration updated!", "success");
      } else {
        showToast("Failed to save fine policy", "error");
      }
    } catch {
      showToast("Network error saving fine policy", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAssessmentBatch = async () => {
    setIsAssessing(true);
    try {
      const res = await fetch("/api/finance/late-fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_ASSESSMENT_BATCH" }),
      });

      if (res.ok) {
        const data = await res.json();
        setLastAssessment(data.assessment);
        showToast(data.message || "Fine assessment batch completed!", "success");
      } else {
        showToast("Error executing fine assessment batch", "error");
      }
    } catch {
      showToast("Network error executing fine batch", "error");
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-soft">
        <div>
          <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Automated Late Fee & Penalty Rules Engine
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Institutional overdue grace periods, daily linear penalties, and batch assessment execution
          </p>
        </div>

        <button
          onClick={handleRunAssessmentBatch}
          disabled={isAssessing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
        >
          <Play className="h-4 w-4" />
          <span>{isAssessing ? "Scanning Ledgers..." : "Run Assessment Batch"}</span>
        </button>
      </div>

      {/* Main Configuration Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl shadow-soft border border-border dark:border-charcoal-700">
          <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mb-4 flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-rose-primary" />
            Late Fee Assessment Parameters
          </h3>

          <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Grace Period (Days from Due Date)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={gracePeriodDays}
                    onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                    className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold"
                    required
                  />
                  <span className="text-charcoal-500 text-xs shrink-0">days</span>
                </div>
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  No penalty charged during this window
                </span>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Penalty Calculation Model
                </label>
                <select
                  value={model}
                  onChange={(e: any) => setModel(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold"
                >
                  <option value="DAILY">Daily Rate ($ / Day Overdue)</option>
                  <option value="FLAT">Flat Fixed Penalty Fee</option>
                  <option value="PERCENTAGE">Percentage of Overdue Balance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {model === "DAILY" && (
                <div>
                  <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Daily Fine Rate ($ / Day)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold font-mono"
                    required
                  />
                </div>
              )}

              {model === "FLAT" && (
                <div>
                  <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Flat Penalty ($ Fixed)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={flatAmount}
                    onChange={(e) => setFlatAmount(Number(e.target.value))}
                    className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold font-mono"
                    required
                  />
                </div>
              )}

              {model === "PERCENTAGE" && (
                <div>
                  <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Monthly Percentage Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={percentageRate}
                    onChange={(e) => setPercentageRate(Number(e.target.value))}
                    className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold font-mono"
                    required
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Maximum Penalty Cap ($ Ceiling)
                </label>
                <input
                  type="number"
                  min="10"
                  value={maxCap}
                  onChange={(e) => setMaxCap(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold font-mono"
                  required
                />
                <span className="text-[10px] text-charcoal-400 mt-1 block">
                  Prevents exorbitant accumulation
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-border dark:border-charcoal-700 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold transition-all"
              >
                {isSaving ? "Saving Policy..." : "Save Fine Policy"}
              </button>
            </div>
          </form>
        </div>

        {/* Policy Summary Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-soft border border-border dark:border-charcoal-700 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mb-2">Policy Overview</h3>
            <div className="space-y-3 text-xs text-charcoal-600 dark:text-charcoal-300">
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700">
                <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Status</span>
                <span className="font-bold text-academic-success flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enforced Across All Term Ledgers
                </span>
              </div>
              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700">
                <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Current Formula</span>
                <span className="font-medium text-charcoal-800 dark:text-ivory-100 block mt-0.5">
                  Grace: {gracePeriodDays} Days • Rate: {model === "DAILY" ? `$${dailyRate}/day` : model === "FLAT" ? `$${flatAmount} flat` : `${percentageRate}%/mo`} • Cap: ${maxCap}
                </span>
              </div>
            </div>
          </div>

          {lastAssessment && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200 block mb-1">
                Last Batch Result:
              </span>
              <div className="text-[11px] text-amber-800 dark:text-amber-300">
                Scanned {lastAssessment.scannedAccounts} ledgers • Assessed ${lastAssessment.totalFinesAssessed} on {lastAssessment.finesAppliedCount} accounts.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
