// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationSchemesTab Component
 * Government & Institutional Seed Fund Schemes (DST NIDHI-PRAYAS, BIRAC BIG, SISFS,
 * and Apex University Innovation Corpus) treasury allocation and utilization tracking.
 */

"use client";

import React from "react";
import {
  Building,
  DollarSign,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  FileText,
  PieChart,
} from "lucide-react";
import { SeedFundScheme, SeedGrantTranche } from "@/lib/incubation/incubation-engine";

interface IncubationSchemesTabProps {
  schemes: SeedFundScheme[];
  tranches: SeedGrantTranche[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationSchemesTab({
  schemes,
  tranches,
  onRefresh,
  showToast,
}: IncubationSchemesTabProps) {
  const totalSanctioned = schemes.reduce((sum, s) => sum + s.sanctionedCorpus, 0);
  const totalDisbursed = schemes.reduce((sum, s) => sum + s.disbursedAmount, 0);
  const totalAvailable = totalSanctioned - totalDisbursed;
  const overallUtilization = totalSanctioned > 0 ? Math.round((totalDisbursed / totalSanctioned) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* 4-Card Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Total Sanctioned Corpus
            </p>
            <h3 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
              INR {(totalSanctioned / 10000000).toFixed(2)} Cr
            </h3>
            <span className="text-[10px] text-charcoal-500">Across 4 Sponsoring Bodies</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Capital Disbursed
            </p>
            <h3 className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              INR {(totalDisbursed / 10000000).toFixed(2)} Cr
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Milestone Validated Grants</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Remaining Treasury
            </p>
            <h3 className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              INR {(totalAvailable / 10000000).toFixed(2)} Cr
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Available for Allocation</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Overall Corpus Burn Rate
            </p>
            <h3 className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {overallUtilization}%
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Treasury Utilization</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <PieChart className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Grant Schemes Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schemes.map((scheme) => {
          const utilPct = scheme.sanctionedCorpus > 0
            ? Math.round((scheme.disbursedAmount / scheme.sanctionedCorpus) * 100)
            : 0;
          const available = scheme.sanctionedCorpus - scheme.disbursedAmount;

          return (
            <div
              key={scheme.id}
              className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[10px] text-charcoal-400 font-semibold block">
                    {scheme.schemeCode}
                  </span>
                  <h4 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    {scheme.schemeName}
                  </h4>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Sponsor: {scheme.sponsoringAgency}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 shrink-0">
                  {scheme.status}
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-charcoal-500">Utilization Progress</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{utilPct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-ivory-100 dark:bg-charcoal-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-primary to-emerald-500 transition-all duration-500"
                    style={{ width: `${utilPct}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 dark:border-charcoal-800 text-xs">
                <div className="p-2.5 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl">
                  <span className="text-[10px] text-charcoal-400 block">Sanctioned</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                    INR {(scheme.sanctionedCorpus / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="p-2.5 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl">
                  <span className="text-[10px] text-charcoal-400 block">Disbursed</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    INR {(scheme.disbursedAmount / 100000).toFixed(1)}L
                  </span>
                </div>
                <div className="p-2.5 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl">
                  <span className="text-[10px] text-charcoal-400 block">Available</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    INR {(available / 100000).toFixed(1)}L
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-charcoal-500 pt-1">
                <span>Max Cap: INR {(scheme.maxGrantPerVenture / 100000).toFixed(1)} Lakhs / venture</span>
                <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                  {scheme.activeVenturesFunded} Ventures Funded
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
