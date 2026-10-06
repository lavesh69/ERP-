"use client";

import React, { useState } from "react";
import { Percent, CheckCircle2, ShieldCheck, DollarSign, Search, Gift } from "lucide-react";

interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  dueDate: string;
}

interface ConcessionsViewProps {
  studentFees: StudentFeeRecord[];
  showToast: (msg: string, type: "success" | "error" | "info") => void;
  onConcessionApplied?: () => void;
}

export function ConcessionsView({ studentFees, showToast, onConcessionApplied }: ConcessionsViewProps) {
  const [selectedFeeId, setSelectedFeeId] = useState(studentFees[0]?.id || "");
  const [concessionAmount, setConcessionAmount] = useState(500);
  const [category, setCategory] = useState("MERIT_FELLOWSHIP");
  const [reason, setReason] = useState("Academic Dean's List top 5% merit waiver");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentGranted, setRecentGranted] = useState<any[]>([]);

  const handleApplyConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeId || concessionAmount <= 0) {
      showToast("Please choose a student fee account and valid concession amount", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/concessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentFeeId: selectedFeeId,
          concessionAmount,
          category,
          reason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Fee concession granted successfully!", "success");
        const student = studentFees.find((s) => s.id === selectedFeeId);
        setRecentGranted([
          {
            id: `conc_${Date.now()}`,
            studentName: student?.studentName || "Scholar Beneficiary",
            rollNo: student?.rollNo || "",
            amount: concessionAmount,
            category,
            reason,
            grantedAt: new Date().toLocaleTimeString(),
          },
          ...recentGranted,
        ]);
        if (onConcessionApplied) onConcessionApplied();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to grant concession", "error");
      }
    } catch {
      showToast("Network error granting concession", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl shadow-soft">
        <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
          <Gift className="h-5 w-5 text-rose-primary" />
          Scholarship Waivers & Fee Concessions
        </h2>
        <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
          Grant institutional merit waivers, economically weaker section (EWS) subsidies, and sports endowments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Concession Grant Form */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl shadow-soft border border-border dark:border-charcoal-700">
          <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mb-4 flex items-center gap-2">
            <Percent className="h-4 w-4 text-rose-primary" />
            Authorize Tuition Concession / Waiver
          </h3>

          <form onSubmit={handleApplyConcession} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Beneficiary Student Account
              </label>
              <select
                value={selectedFeeId}
                onChange={(e) => setSelectedFeeId(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium"
              >
                {studentFees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.studentName} ({f.rollNo}) — {f.title} [Due: ${f.pendingAmount}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Concession Amount ($ USD)
                </label>
                <input
                  type="number"
                  min="1"
                  value={concessionAmount}
                  onChange={(e) => setConcessionAmount(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold font-mono text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Waiver Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium"
                >
                  <option value="MERIT_FELLOWSHIP">Academic Merit Scholarship</option>
                  <option value="EWS_FINANCIAL_AID">EWS Needs-Based Financial Aid</option>
                  <option value="SPORTS_EXCELLENCE">National Sports Quota Concession</option>
                  <option value="STAFF_WARD_SUBSIDY">University Faculty / Staff Ward</option>
                  <option value="CHANCELLOR_DISCRETIONARY">Chancellor Discretionary Relief</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Official Justification / Senate Approval Minute
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 text-xs"
                placeholder="Reference board approval memo number or scholarship scheme ID"
                required
              />
            </div>

            <div className="pt-3 border-t border-border dark:border-charcoal-700 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-academic-success hover:bg-green-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {isSubmitting ? "Applying Waiver..." : `Apply $${concessionAmount.toLocaleString()} Concession`}
              </button>
            </div>
          </form>
        </div>

        {/* Audit Log Card */}
        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-700 space-y-3">
          <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">Recent Granted Waivers</h3>
          {recentGranted.length === 0 ? (
            <div className="p-4 text-center text-xs text-charcoal-400">
              No concessions granted during this session.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {recentGranted.map((r) => (
                <div
                  key={r.id}
                  className="p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-border/60 dark:border-charcoal-700 text-xs space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100">{r.studentName}</span>
                    <span className="font-mono font-bold text-academic-success">+${r.amount}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-400 uppercase font-semibold">
                    {r.category.replace("_", " ")}
                  </div>
                  <div className="text-[11px] text-charcoal-500 line-clamp-1 italic">
                    &ldquo;{r.reason}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
