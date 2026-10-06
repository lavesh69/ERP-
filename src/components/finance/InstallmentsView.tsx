"use client";

import React, { useState, useEffect } from "react";
import { Calendar, CheckCircle2, Clock, DollarSign, Layers } from "lucide-react";
import { StudentInstallmentPlan } from "@/lib/finance/finance-engine";

interface InstallmentsViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function InstallmentsView({ showToast }: InstallmentsViewProps) {
  const [plans, setPlans] = useState<StudentInstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const res = await fetch("/api/finance/installments");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch {
        showToast("Failed to load installment plans", "error");
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl shadow-soft">
        <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-rose-primary" />
          Multi-Term Installment & Milestone EMI Plans
        </h2>
        <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
          Term-based milestone schedule splits (50% Term 1, 25% Term 2, 25% Term 3) with per-milestone reconciliation
        </p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-charcoal-500">Loading installment schedules...</div>
      ) : plans.length === 0 ? (
        <div className="p-8 text-center text-xs text-charcoal-500 glass-panel rounded-2xl">
          No student installment plans recorded yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {plans.map((p) => {
            const totalPaid = p.milestones.reduce((acc, m) => acc + (m.paidAmount || 0), 0);
            const percentPaid = p.totalFee > 0 ? Math.min(100, Math.round((totalPaid / p.totalFee) * 100)) : 0;

            return (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-700 space-y-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{p.studentName}</h3>
                    <span className="text-[11px] font-mono text-charcoal-500">{p.rollNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                      ${totalPaid.toLocaleString()} / ${p.totalFee.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-academic-success font-semibold block">
                      {percentPaid}% Cleared
                    </span>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-academic-success h-full transition-all duration-500"
                    style={{ width: `${percentPaid}%` }}
                  />
                </div>

                {/* Milestone breakdown list */}
                <div className="space-y-2 pt-1">
                  {p.milestones.map((m) => (
                    <div
                      key={m.milestoneNumber}
                      className="p-3 rounded-xl bg-white dark:bg-charcoal-800 border border-border/60 dark:border-charcoal-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            m.status === "PAID"
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {m.status === "PAID" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal-900 dark:text-ivory-100 block">
                            {m.title}
                          </span>
                          <span className="text-[10px] text-charcoal-500">
                            Due: {m.dueDate} • {m.percentage}% Split
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100 block">
                          ${m.amount.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            m.status === "PAID"
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
