"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Building2,
  BookOpen,
  DollarSign,
  Utensils,
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { SkeletonCard } from "@/components/common/SkeletonLoader";

export function PredictiveRadarView() {
  const [forecast, setForecast] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubTab, setSelectedSubTab] = useState<
    "academic" | "treasury" | "space" | "library" | "hostel"
  >("academic");

  useEffect(() => {
    async function loadForecast() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/analytics/predictive");
        if (res.ok) {
          const json = await res.json();
          setForecast(json.data || json);
        }
      } catch (err) {
        console.error("Error loading predictive telemetry:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadForecast();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const academic = forecast?.academicRisk;
  const fee = forecast?.feeCollection;
  const space = forecast?.spaceUtilization;
  const library = forecast?.libraryDemand;
  const hostel = forecast?.hostelDiningDemand;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner: Statutory Governance & Correlation Disclaimer */}
      <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <div className="h-9 w-9 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Info className="h-5 w-5" />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-2">
            <span>Statutory Governance & DPDP Act 2023 Compliance</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[10px] font-mono">
              Mandatory Human Review Gate
            </span>
          </div>
          <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            {forecast?.disclaimer ||
              "Predictive models provide statistical pattern indicators. They do not establish causal certainty and must never be used as autonomous grounds for disciplinary action or dismissal."}
          </p>
        </div>
      </div>

      {/* 4 Multi-Factor Forecasting KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Retention Probability */}
        <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-charcoal-500">
              <span className="font-bold uppercase tracking-wider">Cohort Retention Forecast</span>
              <span className="px-2 py-0.5 rounded-full bg-academic-success-subtle text-academic-success font-bold text-[10px]">
                92% Conf.
              </span>
            </div>
            <div className="text-3xl font-display font-extrabold text-academic-success mt-2">
              {academic?.cohortRetentionForecastPercent || 96.8}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] flex justify-between text-charcoal-600 dark:text-charcoal-400">
            <span>Critical Defaulters: <strong className="text-rose-primary">{academic?.criticalRiskCount || 0}</strong></span>
            <span>Evaluated: {academic?.totalEvaluatedStudents || 70}</span>
          </div>
        </div>

        {/* Card 2: 30-Day Treasury Inflow */}
        <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-charcoal-500">
              <span className="font-bold uppercase tracking-wider">30-Day Dues Inflow Proj.</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                INR (₹)
              </span>
            </div>
            <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-2">
              ₹{(fee?.forecastNext30Days?.expected || 528000).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] flex justify-between text-charcoal-600 dark:text-charcoal-400">
            <span>Conf. Range:</span>
            <span className="font-mono text-charcoal-900 dark:text-ivory-100 font-semibold">
              ₹{(fee?.forecastNext30Days?.low || 448000).toLocaleString("en-IN")} – ₹
              {(fee?.forecastNext30Days?.high || 607000).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Card 3: Spatial Bottleneck Load */}
        <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-charcoal-500">
              <span className="font-bold uppercase tracking-wider">Peak Room Utilization</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                Peak Alert
              </span>
            </div>
            <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-2">
              {space?.peakHourUtilizationPercent || 91.2}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] flex justify-between text-charcoal-600 dark:text-charcoal-400">
            <span>Bottleneck Rooms: <strong className="text-rose-primary">{space?.bottleneckRooms?.length || 2}</strong></span>
            <span>Avg Weekly: {space?.averageWeeklyUtilizationPercent || 71.4}%</span>
          </div>
        </div>

        {/* Card 4: Library Circulation Surge */}
        <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-charcoal-500">
              <span className="font-bold uppercase tracking-wider">Exam Circulation Surge</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                In 14 Days
              </span>
            </div>
            <div className="text-3xl font-display font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              +{library?.anticipatedCirculationSurgePercent || 42}%
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 text-[11px] flex justify-between text-charcoal-600 dark:text-charcoal-400">
            <span>High-Demand Titles: <strong className="text-amber-500">{library?.highDemandTitles?.length || 3}</strong></span>
            <span>Tracked: {library?.totalTitlesTracked || 10}</span>
          </div>
        </div>
      </div>

      {/* Sub-Domain Forecast Tabs */}
      <div className="glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 dark:border-charcoal-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-primary" />
            <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
              Predictive Intelligence Domain Explorer
            </h3>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-ivory-100 dark:bg-charcoal-900 border border-border/60 dark:border-charcoal-800 text-xs">
            <button
              onClick={() => setSelectedSubTab("academic")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSubTab === "academic"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
              }`}
            >
              Academic Retention
            </button>
            <button
              onClick={() => setSelectedSubTab("treasury")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSubTab === "treasury"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
              }`}
            >
              Treasury Cashflow
            </button>
            <button
              onClick={() => setSelectedSubTab("space")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSubTab === "space"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
              }`}
            >
              Spatial Bottlenecks
            </button>
            <button
              onClick={() => setSelectedSubTab("library")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSubTab === "library"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
              }`}
            >
              Library Reserve
            </button>
            <button
              onClick={() => setSelectedSubTab("hostel")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedSubTab === "hostel"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
              }`}
            >
              Dining Logistics
            </button>
          </div>
        </div>

        {/* Tab 1: Academic Retention */}
        {selectedSubTab === "academic" && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] font-bold text-rose-600 uppercase">Critical Risk</span>
                <div className="text-2xl font-bold text-rose-600 mt-1">{academic?.criticalRiskCount || 0}</div>
                <span className="text-[10px] text-charcoal-500">Dual Deficit (Att + GPA)</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] font-bold text-amber-600 uppercase">High Risk</span>
                <div className="text-2xl font-bold text-amber-600 mt-1">{academic?.highRiskCount || 0}</div>
                <span className="text-[10px] text-charcoal-500">Single Flag (&lt;75% Att)</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-bold text-blue-600 uppercase">Moderate Watch</span>
                <div className="text-2xl font-bold text-blue-600 mt-1">{academic?.moderateRiskCount || 4}</div>
                <span className="text-[10px] text-charcoal-500">Borderline 75-80%</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Stable Cohort</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">{academic?.lowRiskCount || 66}</div>
                <span className="text-[10px] text-charcoal-500">Compliant Attendance</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-ivory-300">
                Primary Risk Drivers & Recommended Interventions
              </h4>
              <div className="divide-y divide-border/60 dark:divide-charcoal-800 rounded-2xl border border-border dark:border-charcoal-800 overflow-hidden">
                {(academic?.primaryRiskDrivers || []).map((d: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-card flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">{d.factor}</div>
                      <div className="text-charcoal-500 text-[11px]">{d.recommendedInstitutionalAction}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-ivory-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 font-mono font-bold shrink-0">
                      {d.affectedStudentCount} Scholars
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Treasury Inflow */}
        {selectedSubTab === "treasury" && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-card border border-border dark:border-charcoal-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-charcoal-700 dark:text-ivory-200">Next 30 Days</span>
                  <span className="text-[10px] font-mono text-emerald-600">90% Conf.</span>
                </div>
                <div className="text-2xl font-bold font-mono text-charcoal-900 dark:text-ivory-100">
                  ₹{(fee?.forecastNext30Days?.expected || 528000).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-500">
                  Range: ₹{(fee?.forecastNext30Days?.low || 448000).toLocaleString("en-IN")} – ₹
                  {(fee?.forecastNext30Days?.high || 607000).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border dark:border-charcoal-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-charcoal-700 dark:text-ivory-200">Next 60 Days</span>
                  <span className="text-[10px] font-mono text-emerald-600">90% Conf.</span>
                </div>
                <div className="text-2xl font-bold font-mono text-charcoal-900 dark:text-ivory-100">
                  ₹{(fee?.forecastNext60Days?.expected || 836000).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-500">
                  Range: ₹{(fee?.forecastNext60Days?.low || 685000).toLocaleString("en-IN")} – ₹
                  {(fee?.forecastNext60Days?.high || 986000).toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border dark:border-charcoal-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-charcoal-700 dark:text-ivory-200">Next 90 Days</span>
                  <span className="text-[10px] font-mono text-emerald-600">90% Conf.</span>
                </div>
                <div className="text-2xl font-bold font-mono text-charcoal-900 dark:text-ivory-100">
                  ₹{(fee?.forecastNext90Days?.expected || 1001000).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-charcoal-500">
                  Range: ₹{(fee?.forecastNext90Days?.low || 800000).toLocaleString("en-IN")} – ₹
                  {(fee?.forecastNext90Days?.high || 1201000).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-charcoal-500 block">Overall Projected Realization Rate</span>
                <strong className="text-academic-success font-bold text-base">
                  {fee?.projectedCollectionRatePercent || 94.6}%
                </strong>
              </div>
              <div>
                <span className="text-charcoal-500 block">High Overdue Accounts</span>
                <strong className="text-rose-primary font-bold text-base">
                  {fee?.highDefaultRiskCount || 3} Ledgers
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Spatial Bottlenecks */}
        {selectedSubTab === "space" && (
          <div className="pt-5 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-primary">
                High-Demand & Bottleneck Classrooms (&gt;85% Load)
              </h4>
              <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
                {(space?.bottleneckRooms || []).map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-card flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {r.name} ({r.roomCode})
                      </div>
                      <div className="text-charcoal-500 text-[11px]">Seat Capacity: {r.capacity} seats</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-bold font-mono">
                        {r.peakUtilizationPercent}% Peak
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Underutilized Spaces Available for Reallocation (&lt;30% Load)
              </h4>
              <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
                {(space?.underutilizedRooms || []).map((r: any, idx: number) => (
                  <div key={idx} className="p-3.5 bg-card flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {r.name} ({r.roomCode})
                      </div>
                      <div className="text-charcoal-500 text-[11px]">{r.optimizationRecommendation}</div>
                    </div>
                    <div className="text-right">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-bold font-mono">
                        {r.averageUtilizationPercent}% Avg
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Library Reserve */}
        {selectedSubTab === "library" && (
          <div className="pt-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-ivory-300">
              High-Demand Exam Reserve Circulation Projections
            </h4>
            <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
              {(library?.highDemandTitles || []).map((t: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-card flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-charcoal-900 dark:text-ivory-100">{t.title}</div>
                    <div className="text-charcoal-500 text-[11px]">
                      ISBN: {t.isbn} • {t.availableCopies} of {t.totalCopies} available
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="font-mono font-bold text-charcoal-700 dark:text-ivory-200">
                      Demand Ratio: {t.projectDemandRatio || t.projectedDemandRatio}x
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        t.actionRequired === "ACQUIRE_RESERVE_COPIES"
                          ? "bg-rose-500/10 text-rose-600"
                          : t.actionRequired === "EXTEND_DIGITAL_LICENSES"
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}
                    >
                      {t.actionRequired.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Hostel & Dining Logistics */}
        {selectedSubTab === "hostel" && (
          <div className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-card border border-border">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase">Boarder Headcount</span>
                <div className="text-2xl font-bold mt-1">
                  {hostel?.currentOccupancy || 412} / {hostel?.totalHostelCapacity || 500}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {hostel?.occupancyRatePercent || 82.4}% Occupancy
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase">Projected Daily Diets</span>
                <div className="text-2xl font-bold mt-1">
                  {hostel?.projectedMealCountDaily?.dinner || 395} Dinners
                </div>
                <span className="text-[10px] text-charcoal-500">
                  B: {hostel?.projectedMealCountDaily?.breakfast || 380} | L:{" "}
                  {hostel?.projectedMealCountDaily?.lunch || 345}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Food Wastage Prevention</span>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {hostel?.anticipatedFoodWastageSavingsKg || 34.5} kg/day
                </div>
                <span className="text-[10px] text-charcoal-500">Weekend drop-off: {hostel?.weekendDropOffPercent || 28}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
