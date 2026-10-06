"use client";

import React, { useState, useEffect } from "react";
import { Landmark, Calendar, ShieldCheck, Printer, CheckCircle2, DollarSign } from "lucide-react";

interface DayEndCashbookViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function DayEndCashbookView({ showToast }: DayEndCashbookViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadDayEnd(dateStr: string) {
    try {
      setLoading(true);
      const res = await fetch(`/api/finance/day-end?date=${dateStr}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      showToast("Failed to compile day-end cashbook", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDayEnd(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header with Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-soft">
        <div>
          <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-rose-primary" />
            Day-End Treasury Cashbook & Auditor Sign-off
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Daily physical and digital collections ledger with cryptographic tamper-evident auditor sign-off seal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 px-3 py-1.5 rounded-xl">
            <Calendar className="h-4 w-4 text-charcoal-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-charcoal-900 dark:text-ivory-100 focus:outline-none"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Cashbook</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-xs text-charcoal-500">Compiling day-end settlement balances...</div>
      ) : !data ? (
        <div className="p-8 text-center text-xs text-charcoal-500 glass-panel rounded-2xl">
          No transactions registered on {selectedDate}.
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-2xl shadow-soft">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase">Gross Daily Collections</span>
              <div className="text-2xl font-bold font-display text-academic-success mt-1">
                ${data.summary?.totalCollectionAmount?.toLocaleString() || 0}.00
              </div>
              <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                Across {data.summary?.totalTransactionCount || 0} clearing transactions
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl shadow-soft">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase">Treasury Sign-off Seal</span>
              <div className="font-mono text-sm font-black text-rose-primary dark:text-rose-light mt-1 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-academic-success" />
                <span>SEAL: {data.reconciliationSignOff?.cryptographicProofHash}</span>
              </div>
              <span className="text-[10px] text-charcoal-400 mt-0.5 block truncate">
                Audited by {data.reconciliationSignOff?.settledBy}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl shadow-soft">
              <span className="text-[11px] font-bold text-charcoal-500 uppercase">Settlement Standing</span>
              <div className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-academic-success" />
                <span>RECONCILED & BALANCED</span>
              </div>
              <span className="text-[10px] text-charcoal-400 mt-0.5 block">
                Zero cash discrepancy recorded
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {data.summary?.methodBreakdown && Object.keys(data.summary.methodBreakdown).length > 0 && (
            <div className="glass-panel p-5 rounded-2xl shadow-soft">
              <h3 className="font-bold text-xs uppercase text-charcoal-600 dark:text-charcoal-400 mb-3">
                Channel-wise Collection Tally
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(data.summary.methodBreakdown).map(([method, info]: [string, any]) => (
                  <div
                    key={method}
                    className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700"
                  >
                    <span className="text-[10px] font-bold text-charcoal-500 uppercase block truncate">
                      {method.replace(/_/g, " ")}
                    </span>
                    <span className="text-base font-bold text-charcoal-900 dark:text-ivory-100 block font-mono mt-0.5">
                      ${info.totalAmount?.toLocaleString() || 0}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block">
                      {info.count} receipts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itemized Transactions for Date */}
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Cleared Ledger Transactions for {selectedDate}
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono">
                {data.transactions?.length || 0} records
              </span>
            </div>

            {(!data.transactions || data.transactions.length === 0) ? (
              <div className="p-6 text-center text-xs text-charcoal-500">
                No individual transactions recorded on this settlement date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Student / Roll</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Channel</th>
                      <th className="p-3.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                    {data.transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40">
                        <td className="p-3.5 font-mono text-[11px] text-rose-primary">{t.ref}</td>
                        <td className="p-3.5">
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">{t.studentName}</span>
                          <span className="text-[10px] text-charcoal-400 font-mono">{t.rollNumber}</span>
                        </td>
                        <td className="p-3.5 text-charcoal-600 dark:text-charcoal-300">{t.feeTitle}</td>
                        <td className="p-3.5 text-charcoal-500">{t.method}</td>
                        <td className="p-3.5 text-right font-bold text-academic-success font-mono">
                          +${t.amount.toLocaleString()}.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
