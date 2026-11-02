// SPDX-License-Identifier: Apache-2.0
/**
 * University Incubation Center & Venture Accelerator Page
 * Unified Academic OS design with venture cohort tracking, co-working desk allocation matrix,
 * seed grant tranches, patent disclosures, milestone velocity reviews, and cap-table dilution.
 */

"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Rocket,
  TrendingUp,
  DollarSign,
  Lightbulb,
  Award,
  Users,
  PlusCircle,
  CheckCircle2,
  Building,
  Target,
  FileText,
  Briefcase,
  Download,
  Search,
  Filter,
  Eye,
  Printer,
  X,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sliders,
  Layers,
  Calculator,
  PieChart,
  ArrowRight,
} from "lucide-react";
import IncubationDesksTab from "@/components/incubation/IncubationDesksTab";
import IncubationGrantsTab from "@/components/incubation/IncubationGrantsTab";
import IncubationPatentsTab from "@/components/incubation/IncubationPatentsTab";
import IncubationReviewsTab from "@/components/incubation/IncubationReviewsTab";
import {
  IncubatedStartup,
  LabDeskAllocation,
  SeedGrantTranche,
  PatentDisclosure,
  QuarterlyMilestoneReview,
} from "@/lib/incubation/incubation-engine";

type Startup = IncubatedStartup;

export default function IncubationPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState<
    "ventures" | "portfolio" | "desks" | "grants" | "patents" | "reviews" | "investor"
  >("ventures");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [desks, setDesks] = useState<LabDeskAllocation[]>([]);
  const [tranches, setTranches] = useState<SeedGrantTranche[]>([]);
  const [patents, setPatents] = useState<PatentDisclosure[]>([]);
  const [reviews, setReviews] = useState<QuarterlyMilestoneReview[]>([]);

  const [selectedStartupDossier, setSelectedStartupDossier] = useState<Startup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("ALL");
  const [filterStage, setFilterStage] = useState("ALL");

  // Stage Progression Modal State
  const [stageModalStartup, setStageModalStartup] = useState<Startup | null>(null);
  const [nextStage, setNextStage] = useState<string>("INCUBATED_PROTOTYPE");
  const [fundingSeedDelta, setFundingSeedDelta] = useState<number>(0);
  const [fundingExternalDelta, setFundingExternalDelta] = useState<number>(0);

  // Investor Scorecard Evaluation Rubric State
  const [evalVentureId, setEvalVentureId] = useState<string>("");
  const [evalTeam, setEvalTeam] = useState<number>(85);
  const [evalTam, setEvalTam] = useState<number>(80);
  const [evalMoat, setEvalMoat] = useState<number>(75);
  const [evalTraction, setEvalTraction] = useState<number>(70);
  const [evalUnitEcon, setEvalUnitEcon] = useState<number>(80);
  const [evalValuationCap, setEvalValuationCap] = useState<number>(25000000);
  const [evalSeedTicket, setEvalSeedTicket] = useState<number>(2500000);
  const [evalCommitteeNotes, setEvalCommitteeNotes] = useState<string>(
    "Defensible deep-tech solution with strong faculty-student founding team. Lab trials completed with high efficiency."
  );

  // Cap Table & SAFE Dilution Calculator State
  const [capFounderShare, setCapFounderShare] = useState<number>(85);
  const [capUnivStake, setCapUnivStake] = useState<number>(5);
  const [capEsopShare, setCapEsopShare] = useState<number>(10);
  const [capPreMoneyVal, setCapPreMoneyVal] = useState<number>(40000000);
  const [capInvestmentAmt, setCapInvestmentAmt] = useState<number>(10000000);
  const [capEsopExpansion, setCapEsopExpansion] = useState<number>(5);

  const handleUpdateStartupStage = async (id: string, stage: string, seed?: number, external?: number) => {
    try {
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          id,
          stage,
          seedGrantDisbursed: seed,
          externalFundingRaised: external,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Startup stage transitioned to ${stage}`, "success");
        setStageModalStartup(null);
        fetchData();
      } else {
        showToast(data.error || "Failed to update stage", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };

  const handleExportIncubationCsv = () => {
    const filtered = startups.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        s.startupName.toLowerCase().includes(q) ||
        s.founderName.toLowerCase().includes(q) ||
        s.pitchDeckSummary.toLowerCase().includes(q) ||
        s.companyRef.toLowerCase().includes(q);
      const matchesSector = filterSector === "ALL" || s.sector === filterSector;
      const matchesStage = filterStage === "ALL" || s.stage === filterStage;
      return matchesSearch && matchesSector && matchesStage;
    });
    const headers = "Company Ref,Startup Name,Founder,Role,Staff/Roll ID,Sector,Stage,Seed Disbursed (INR),Univ Equity %,External Funding (INR),Patents,Lab Desks,Mentor,Status\n";
    const rows = filtered
      .map((s) => `"${s.companyRef}","${s.startupName}","${s.founderName}","${s.founderRole}","${s.founderRollOrStaffId}","${s.sector}","${s.stage}",${s.seedGrantDisbursed},${s.universityEquityPercentage},${s.externalFundingRaised},${s.patentsFiled},${s.labDesksAllocated},"${s.mentorName}","${s.status}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `University_Incubator_Portfolio_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [formData, setFormData] = useState({
    startupName: "",
    founderName: "",
    founderRollOrStaffId: "CS2026-001",
    founderRole: "STUDENT" as "STUDENT" | "ALUMNI" | "FACULTY",
    sector: "AI_ML",
    stage: "INCUBATED_PROTOTYPE",
    pitchDeckSummary: "",
    seedGrantDisbursed: 1000000,
    universityEquityPercentage: 2.0,
    labDesksAllocated: 2,
    mentorName: "Dr. Arvind Gupta (Angel Investor)",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, stRes, deskRes, grantRes, patRes, revRes] = await Promise.all([
        fetch("/api/incubation?tab=summary"),
        fetch("/api/incubation?tab=startups"),
        fetch("/api/incubation?tab=desks"),
        fetch("/api/incubation?tab=grants"),
        fetch("/api/incubation?tab=patents"),
        fetch("/api/incubation?tab=reviews"),
      ]);

      const sumData = await sumRes.json();
      const stData = await stRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (stData.success) setStartups(stData.startups || []);

      if (deskRes.ok) {
        const dData = await deskRes.json();
        if (dData.success) setDesks(dData.desks || []);
      }
      if (grantRes.ok) {
        const gData = await grantRes.json();
        if (gData.success) setTranches(gData.tranches || []);
      }
      if (patRes.ok) {
        const pData = await patRes.json();
        if (pData.success) setPatents(pData.patents || []);
      }
      if (revRes.ok) {
        const rData = await revRes.json();
        if (rData.success) setReviews(rData.reviews || []);
      }
    } catch (err) {
      console.error("Error fetching incubation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showModal || !!selectedStartupDossier || !!stageModalStartup;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setSelectedStartupDossier(null);
        setStageModalStartup(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showModal, selectedStartupDossier, stageModalStartup]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_VENTURE",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Startup registered into incubator!", "success");
        setShowModal(false);
        fetchData();
      } else {
        showToast(data.error || "Failed to register startup", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Breadcrumbs />
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Banner - Academic OS Native Glassmorphism */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <Rocket className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  AIC & Venture Accelerator
                </span>
                <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  Cohort 2026-27 Active
                </span>
              </div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                University Incubation Center & Venture Accelerator
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Atal Incubation Center (AIC), Student Ventures, Seed Capital & Technology Transfer Office
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportIncubationCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Portfolio</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Onboard Startup</span>
            </button>
          </div>
        </div>

        {/* 4-Card KPI Telemetry Strip */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Incubated Startups
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                  {summary?.totalVentures || 0}
                </h3>
                <span className="badge-subtle bg-surface-soft text-charcoal-600 dark:text-charcoal-300 mt-1 inline-block">
                  {summary?.activeVentures || 0} Active in Cohort
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
                <Rocket className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Seed Grants Disbursed
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  INR {(summary?.totalSeedCapitalDisbursed || 0).toLocaleString("en-IN")}
                </h3>
                <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
                  University Venture Fund
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  External Capital Raised
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  INR {(summary?.totalExternalFundingRaised || 0).toLocaleString("en-IN")}
                </h3>
                <span className="badge-subtle bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 mt-1 inline-block">
                  VC & Angel Syndicates
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
                  Patents & IP Filed
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {summary?.totalPatentsFiled || 0}
                </h3>
                <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
                  Tech Transfer Office (TTO)
                </span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs - 7 Clean Unified Academic OS Tabs Strip */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-soft/60 dark:bg-charcoal-900 border border-border/80 dark:border-charcoal-800 overflow-x-auto no-scrollbar">
          {[
            { id: "ventures", label: "Cohort Ventures", icon: Rocket, count: startups.length },
            { id: "portfolio", label: "Portfolio & SAFE Dilution", icon: TrendingUp },
            { id: "desks", label: "Innovation Desks & Pods", icon: Building, count: desks.length },
            { id: "grants", label: "Seed Capital Tranches", icon: DollarSign, count: tranches.length },
            { id: "patents", label: "TTO Patent Registry", icon: Lightbulb, count: patents.length },
            { id: "reviews", label: "Milestone Reviews", icon: Layers, count: reviews.length },
            { id: "investor", label: "Angel & VC Scorecard", icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm border border-border/50 dark:border-charcoal-700"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-rose-primary dark:text-rose-accent" : "text-charcoal-500 dark:text-charcoal-400"}`} />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && tab.count > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-container text-rose-primary dark:bg-rose-dark/40 dark:text-rose-accent">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Ventures Grid */}
        {activeTab === "ventures" && (
          <div className="space-y-4">
            {/* Search & Sector Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
              <div className="relative w-full sm:w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search startups, founders, technologies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-primary text-charcoal-900 dark:text-ivory-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Sector:</span>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-primary text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="ALL">All Sectors</option>
                  <option value="AI_ML">AI & Machine Learning</option>
                  <option value="HEALTHTECH">HealthTech</option>
                  <option value="CLEANTECH">CleanTech</option>
                  <option value="FINTECH">FinTech</option>
                  <option value="ROBOTICS_IOT">Robotics & IoT</option>
                  <option value="EDTECH">EdTech</option>
                </select>

                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider ml-2">Stage:</span>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-primary text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PRE_INCUBATION">Pre-Incubation</option>
                  <option value="INCUBATED_PROTOTYPE">Incubated Prototype</option>
                  <option value="SEED_FUNDED">Seed Funded</option>
                  <option value="ACCELERATOR_GROWTH">Accelerator Growth</option>
                  <option value="GRADUATED_VENTURE">Graduated Venture</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {startups
                .filter((s) => {
                  const q = searchQuery.toLowerCase();
                  const matchesSearch =
                    !q ||
                    s.startupName.toLowerCase().includes(q) ||
                    s.founderName.toLowerCase().includes(q) ||
                    s.pitchDeckSummary.toLowerCase().includes(q) ||
                    s.companyRef.toLowerCase().includes(q);
                  const matchesSector = filterSector === "ALL" || s.sector === filterSector;
                  const matchesStage = filterStage === "ALL" || s.stage === filterStage;
                  return matchesSearch && matchesSector && matchesStage;
                })
                .map((s) => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-4 hover:shadow-elevated transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-charcoal-400 block font-semibold">
                            {s.companyRef}
                          </span>
                          <h3 className="font-bold text-charcoal-900 dark:text-ivory-100 text-base">
                            {s.startupName}
                          </h3>
                          <p className="text-xs text-charcoal-500">
                            Founder: {s.founderName} ({s.founderRole})
                          </p>
                        </div>
                        <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-primary dark:text-rose-300 rounded-lg text-xs font-bold shrink-0">
                          {s.sector.replace("_", " ")}
                        </span>
                      </div>

                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed line-clamp-3">
                        {s.pitchDeckSummary}
                      </p>

                      <div className="space-y-1.5 text-xs text-charcoal-600 dark:text-charcoal-400 border-t border-border/60 dark:border-charcoal-800 pt-3">
                        <div className="flex justify-between">
                          <span>Current Stage:</span>
                          <span className="font-semibold text-rose-primary dark:text-rose-400">
                            {s.stage.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Seed Disbursed:</span>
                          <span className="font-semibold text-charcoal-900 dark:text-ivory-100">
                            INR {s.seedGrantDisbursed.toLocaleString("en-IN")} ({s.universityEquityPercentage}% Equity)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>External Raised:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            INR {s.externalFundingRaised.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Workspaces / Desks:</span>
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {s.labDesksAllocated} Desks (Innovation Pod)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lead Mentor:</span>
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200 truncate max-w-[150px]">
                            {s.mentorName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/60 dark:border-charcoal-800 pt-3 gap-2">
                      <button
                        onClick={() => setSelectedStartupDossier(s)}
                        className="px-2.5 py-1 bg-ivory-100 hover:bg-rose-50 dark:bg-charcoal-800 dark:hover:bg-rose-950/60 text-charcoal-800 dark:text-ivory-200 hover:text-rose-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Term Sheet
                      </button>

                      <button
                        onClick={() => {
                          setStageModalStartup(s);
                          setNextStage(
                            s.stage === "PRE_INCUBATION"
                              ? "INCUBATED_PROTOTYPE"
                              : s.stage === "INCUBATED_PROTOTYPE"
                              ? "SEED_FUNDED"
                              : s.stage === "SEED_FUNDED"
                              ? "ACCELERATOR_GROWTH"
                              : "GRADUATED_VENTURE"
                          );
                          setFundingSeedDelta(s.seedGrantDisbursed);
                          setFundingExternalDelta(s.externalFundingRaised);
                        }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-primary rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>Progress Stage</span>
                      </button>
                    </div>
                  </div>
                ))}

              {startups.filter((s) => {
                const q = searchQuery.toLowerCase();
                const matchesSearch =
                  !q ||
                  s.startupName.toLowerCase().includes(q) ||
                  s.founderName.toLowerCase().includes(q) ||
                  s.pitchDeckSummary.toLowerCase().includes(q) ||
                  s.companyRef.toLowerCase().includes(q);
                const matchesSector = filterSector === "ALL" || s.sector === filterSector;
                const matchesStage = filterStage === "ALL" || s.stage === filterStage;
                return matchesSearch && matchesSector && matchesStage;
              }).length === 0 && (
                <div className="col-span-1 md:col-span-3">
                  <EmptyState
                    icon={Rocket}
                    title="No Startup Ventures Found"
                    description={`No startup ventures match your search "${searchQuery}" and active filters.`}
                    actionLabel="Reset Filters"
                    onAction={() => {
                      setSearchQuery("");
                      setFilterSector("ALL");
                      setFilterStage("ALL");
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Portfolio Analysis & Cap-Table Waterfall */}
        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                  Institutional Venture Fund & Capital Overview
                </h2>
                <p className="text-sm text-charcoal-500">
                  Equity Stakes, Technology Transfer Filings & Co-Investment Multipliers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                    Estimated Portfolio Valuation
                  </span>
                  <div className="text-3xl font-extrabold text-rose-primary dark:text-rose-400">
                    INR {(summary?.estimatedPortfolioValuation || 0).toLocaleString("en-IN")}
                  </div>
                  <p className="text-xs text-charcoal-400">Across active incubated companies</p>
                </div>

                <div className="p-4 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                    Innovation Workspace Density
                  </span>
                  <div className="text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
                    {summary?.totalWorkspacesAllocated || 0} Desks
                  </div>
                  <p className="text-xs text-charcoal-400">Cleanroom & prototyping benches occupied</p>
                </div>

                <div className="p-4 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide">
                    Capital Multiplier Ratio
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    11.7x
                  </div>
                  <p className="text-xs text-charcoal-400">External VC capital raised per INR 1 seed grant</p>
                </div>
              </div>
            </div>

            {/* Equity Cap Table Waterfall & SAFE Dilution Calculator */}
            {(() => {
              const postMoneyValuation = capPreMoneyVal + capInvestmentAmt;
              const investorEquityPct = (capInvestmentAmt / postMoneyValuation) * 100;
              const dilutionMultiplier = (100 - investorEquityPct - capEsopExpansion) / 100;

              const postFounderPct = Number((capFounderShare * dilutionMultiplier).toFixed(2));
              const postUnivPct = Number((capUnivStake * dilutionMultiplier).toFixed(2));
              const postEsopPct = Number(((capEsopShare * dilutionMultiplier) + capEsopExpansion).toFixed(2));
              const postInvestorPct = Number(investorEquityPct.toFixed(2));

              const founderVal = Math.round((postFounderPct / 100) * postMoneyValuation);
              const univVal = Math.round((postUnivPct / 100) * postMoneyValuation);
              const esopVal = Math.round((postEsopPct / 100) * postMoneyValuation);
              const investorVal = Math.round((postInvestorPct / 100) * postMoneyValuation);

              return (
                <div className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-800">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-400 rounded-xl">
                        <Calculator className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
                            Startup Cap Table Waterfall & SAFE Dilution Engine
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/40 text-rose-primary dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            YC Post-Money SAFE Standard
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-500 mt-0.5">
                          Dynamic equity retention modeling for institutional venture seed & Series-A rounds
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Waterfall Simulation Control Sliders */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-charcoal-600 dark:text-ivory-300">Pre-Money Valuation</span>
                        <span className="font-bold font-mono text-charcoal-900 dark:text-ivory-100">
                          INR {(capPreMoneyVal / 10000000).toFixed(1)} Cr
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10000000"
                        max="200000000"
                        step="5000000"
                        value={capPreMoneyVal}
                        onChange={(e) => setCapPreMoneyVal(Number(e.target.value))}
                        className="w-full accent-rose-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-charcoal-600 dark:text-ivory-300">New Round Investment Amount</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          INR {(capInvestmentAmt / 10000000).toFixed(1)} Cr
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2000000"
                        max="50000000"
                        step="2000000"
                        value={capInvestmentAmt}
                        onChange={(e) => setCapInvestmentAmt(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-charcoal-600 dark:text-ivory-300">ESOP Pool Expansion</span>
                        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                          +{capEsopExpansion}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="1"
                        value={capEsopExpansion}
                        onChange={(e) => setCapEsopExpansion(Number(e.target.value))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Visual Cap Table Bar */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-charcoal-700 dark:text-ivory-200 uppercase tracking-wide">
                      Post-Round Ownership Structure
                    </span>
                    <div className="h-6 w-full rounded-xl overflow-hidden flex text-[10px] font-bold text-white shadow-xs">
                      <div style={{ width: `${postFounderPct}%` }} className="bg-rose-primary flex items-center justify-center">
                        Founders {postFounderPct}%
                      </div>
                      <div style={{ width: `${postUnivPct}%` }} className="bg-indigo-600 flex items-center justify-center">
                        Univ {postUnivPct}%
                      </div>
                      <div style={{ width: `${postEsopPct}%` }} className="bg-emerald-600 flex items-center justify-center">
                        ESOP {postEsopPct}%
                      </div>
                      <div style={{ width: `${postInvestorPct}%` }} className="bg-amber-500 flex items-center justify-center">
                        New Investors {postInvestorPct}%
                      </div>
                    </div>
                  </div>

                  {/* Stakeholder Ledger */}
                  <div className="overflow-x-auto border border-border dark:border-charcoal-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-500">
                        <tr>
                          <th className="p-3">Stakeholder Class</th>
                          <th className="p-3">Pre-Round %</th>
                          <th className="p-3">Post-Round %</th>
                          <th className="p-3">Dilution Impact</th>
                          <th className="p-3 text-right">Implied Equity Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-charcoal-800">
                        <tr className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                          <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-rose-primary" />
                            Founders & Core Leadership
                          </td>
                          <td className="p-3 font-mono">{capFounderShare}%</td>
                          <td className="p-3 font-mono font-bold text-rose-primary dark:text-rose-400">{postFounderPct}%</td>
                          <td className="p-3 font-mono text-rose-500">{(postFounderPct - capFounderShare).toFixed(2)}%</td>
                          <td className="p-3 font-mono font-bold text-right text-charcoal-900 dark:text-ivory-100">
                            INR {founderVal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                          <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-indigo-600" />
                            University Incubator AIC Fund
                          </td>
                          <td className="p-3 font-mono">{capUnivStake}%</td>
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{postUnivPct}%</td>
                          <td className="p-3 font-mono text-rose-500">{(postUnivPct - capUnivStake).toFixed(2)}%</td>
                          <td className="p-3 font-mono font-bold text-right text-charcoal-900 dark:text-ivory-100">
                            INR {univVal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                          <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-emerald-600" />
                            Employee ESOP Option Pool
                          </td>
                          <td className="p-3 font-mono">{capEsopShare}%</td>
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{postEsopPct}%</td>
                          <td className="p-3 font-mono text-emerald-600">+{capEsopExpansion}% Top-Up</td>
                          <td className="p-3 font-mono font-bold text-right text-charcoal-900 dark:text-ivory-100">
                            INR {esopVal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                        <tr className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 bg-amber-50/40 dark:bg-amber-950/20">
                          <td className="p-3 font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                            <span className="w-3 h-3 rounded bg-amber-500" />
                            New SAFE / Seed Syndicate Investors
                          </td>
                          <td className="p-3 font-mono text-charcoal-400">0.00%</td>
                          <td className="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">{postInvestorPct}%</td>
                          <td className="p-3 font-mono text-amber-600 font-bold">+{postInvestorPct}% New Issue</td>
                          <td className="p-3 font-mono font-bold text-right text-amber-600 dark:text-amber-400">
                            INR {investorVal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 3: Co-Working Innovation Desks */}
        {activeTab === "desks" && (
          <IncubationDesksTab
            desks={desks}
            startups={startups}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}

        {/* Tab 4: Seed Capital Tranches */}
        {activeTab === "grants" && (
          <IncubationGrantsTab
            tranches={tranches}
            startups={startups}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}

        {/* Tab 5: Tech Transfer Office (TTO) Patent Registry */}
        {activeTab === "patents" && (
          <IncubationPatentsTab
            patents={patents}
            startups={startups}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}

        {/* Tab 6: Milestone Velocity Reviews */}
        {activeTab === "reviews" && (
          <IncubationReviewsTab
            reviews={reviews}
            startups={startups}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}

        {/* Tab 7: Angel & VC Investor Scorecard */}
        {activeTab === "investor" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-primary dark:text-rose-400 rounded-xl">
                    <Award className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                    Angel & VC Investor Evaluation Scorecard
                  </h2>
                </div>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
                  Institutional Investment Committee Due Diligence Rubric (5-Pillars Weighted Matrix)
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider shrink-0">
                  Target Venture:
                </span>
                <select
                  value={evalVentureId || (startups[0]?.id || "")}
                  onChange={(e) => setEvalVentureId(e.target.value)}
                  className="w-full md:w-64 px-3.5 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-semibold text-charcoal-800 dark:text-ivory-200 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startupName} ({s.companyRef})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Venture Summary Dossier Strip */}
            {(() => {
              const currentVenture = startups.find((s) => s.id === (evalVentureId || startups[0]?.id)) || startups[0];
              const compositeScore = Math.round(
                evalTeam * 0.25 +
                evalTam * 0.20 +
                evalMoat * 0.20 +
                evalTraction * 0.20 +
                evalUnitEcon * 0.15
              );

              const isTier1 = compositeScore >= 80;
              const isTier2 = compositeScore >= 65 && compositeScore < 80;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: 5 Diligence Sliders */}
                  <div className="lg:col-span-2 bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-5">
                    <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider border-b border-border dark:border-charcoal-800 pb-2">
                      Investment Committee Diligence Rubric
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                            1. Founding Team &amp; Execution Pedigree (25% Weight)
                          </span>
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-400">{evalTeam}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={evalTeam}
                          onChange={(e) => setEvalTeam(Number(e.target.value))}
                          className="w-full accent-rose-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                            2. Total Addressable Market (TAM) &amp; Scalability (20% Weight)
                          </span>
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-400">{evalTam}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={evalTam}
                          onChange={(e) => setEvalTam(Number(e.target.value))}
                          className="w-full accent-rose-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                            3. IP Moat &amp; Technology Defensibility (20% Weight)
                          </span>
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-400">{evalMoat}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={evalMoat}
                          onChange={(e) => setEvalMoat(Number(e.target.value))}
                          className="w-full accent-rose-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                            4. Traction Velocity &amp; Pilot Validation (20% Weight)
                          </span>
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-400">{evalTraction}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={evalTraction}
                          onChange={(e) => setEvalTraction(Number(e.target.value))}
                          className="w-full accent-rose-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                            5. Unit Economics &amp; Capital Runway (15% Weight)
                          </span>
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-400">{evalUnitEcon}/100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={evalUnitEcon}
                          onChange={(e) => setEvalUnitEcon(Number(e.target.value))}
                          className="w-full accent-rose-primary"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                        Investment Committee Synthesis Notes
                      </label>
                      <textarea
                        rows={3}
                        value={evalCommitteeNotes}
                        onChange={(e) => setEvalCommitteeNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>
                  </div>

                  {/* Right Column: Score & Committee Verdict */}
                  <div className="bg-white dark:bg-charcoal-900 p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between space-y-6">
                    <div>
                      <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider block">
                        Composite Investment Score
                      </span>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-5xl font-black text-rose-primary dark:text-rose-400">
                          {compositeScore}
                        </span>
                        <span className="text-charcoal-400 font-semibold text-sm">/ 100</span>
                      </div>

                      <div className="mt-4 p-4 rounded-xl border space-y-2 bg-ivory-50 dark:bg-charcoal-800/40 border-border dark:border-charcoal-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block">
                          Syndicate Recommendation
                        </span>
                        <div className={`text-sm font-bold ${isTier1 ? "text-emerald-600" : isTier2 ? "text-amber-600" : "text-rose-600"}`}>
                          {isTier1 ? "Tier-1: High Conviction Seed Round" : isTier2 ? "Tier-2: Conditional Acceleration" : "Tier-3: Prototyping Mentorship"}
                        </div>
                        <p className="text-xs text-charcoal-500">
                          {isTier1
                            ? "Approved for institutional venture capital syndication and full incubator resources."
                            : isTier2
                            ? "Recommended for proof-of-concept milestone grants and follow-up evaluation."
                            : "Venture requires further customer discovery and prototype iterations before capital release."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border dark:border-charcoal-800 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-charcoal-500 font-medium">Recommended Valuation Cap:</span>
                        <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">
                          INR {(evalValuationCap / 10000000).toFixed(2)} Cr
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-charcoal-500 font-medium">Target Seed Ticket:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          INR {(evalSeedTicket / 100000).toFixed(1)} Lakhs
                        </span>
                      </div>

                      <button
                        onClick={() => showToast(`Investment memo generated for ${currentVenture?.startupName}`, "success")}
                        className="w-full py-2.5 bg-rose-primary hover:bg-rose-dark text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Export Investment Memo</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Stage Progression Modal */}
      {stageModalStartup && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Progress Startup Incubation Stage"
          onClick={(e) => {
            if (e.target === e.currentTarget) setStageModalStartup(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-rose-primary" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Progress Incubation Stage
                </h3>
              </div>
              <button
                onClick={() => setStageModalStartup(null)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border/50 dark:border-charcoal-700/50">
                <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Startup</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm block">
                  {stageModalStartup.startupName} ({stageModalStartup.companyRef})
                </span>
                <span className="text-charcoal-500 block mt-0.5">
                  Current Stage: <strong className="text-rose-primary">{stageModalStartup.stage}</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Target Next Stage *
                </label>
                <select
                  value={nextStage}
                  onChange={(e) => setNextStage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 font-semibold"
                >
                  <option value="INCUBATED_PROTOTYPE">Incubated Prototype</option>
                  <option value="SEED_FUNDED">Seed Funded</option>
                  <option value="ACCELERATOR_GROWTH">Accelerator Growth</option>
                  <option value="GRADUATED_VENTURE">Graduated Venture</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Cumulative Seed (INR)
                  </label>
                  <input
                    type="number"
                    value={fundingSeedDelta}
                    onChange={(e) => setFundingSeedDelta(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    External Funding (INR)
                  </label>
                  <input
                    type="number"
                    value={fundingExternalDelta}
                    onChange={(e) => setFundingExternalDelta(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setStageModalStartup(null)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStartupStage(stageModalStartup.id, nextStage, fundingSeedDelta, fundingExternalDelta)}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold flex items-center gap-1.5"
                >
                  <span>Authorize Transition</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboard Startup Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Onboard Startup into Incubator"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-rose-primary" />
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                  Onboard Startup into Incubator
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Startup Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startupName}
                    onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Founder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.founderName}
                    onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Sector
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="AI_ML">AI & Machine Learning</option>
                    <option value="HEALTHTECH">HealthTech & BioTech</option>
                    <option value="CLEANTECH">CleanTech & Energy</option>
                    <option value="FINTECH">FinTech</option>
                    <option value="ROBOTICS_IOT">Robotics & IoT</option>
                    <option value="EDTECH">EdTech</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Founder Affiliation
                  </label>
                  <select
                    value={formData.founderRole}
                    onChange={(e) => setFormData({ ...formData, founderRole: e.target.value as any })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="STUDENT">Enrolled Student</option>
                    <option value="ALUMNI">Alumni Graduate</option>
                    <option value="FACULTY">Faculty Researcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Problem Statement & Pitch Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.pitchDeckSummary}
                  onChange={(e) => setFormData({ ...formData, pitchDeckSummary: e.target.value })}
                  placeholder="Summarize product value proposition, market size, and technology differentiation..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Seed Grant (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.seedGrantDisbursed}
                    onChange={(e) =>
                      setFormData({ ...formData, seedGrantDisbursed: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Univ Equity (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.universityEquityPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        universityEquityPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                    Lab Desks
                  </label>
                  <input
                    type="number"
                    value={formData.labDesksAllocated}
                    onChange={(e) =>
                      setFormData({ ...formData, labDesksAllocated: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-600 dark:text-ivory-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-primary hover:bg-rose-dark text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submitting ? "Onboarding..." : "Admit to Incubator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Venture Term Sheet & Cap Table Dossier Modal */}
      {selectedStartupDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Venture Term Sheet and Cap Table Dossier"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedStartupDossier(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-border/60 dark:border-charcoal-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-400 rounded-xl">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-charcoal-900 dark:text-ivory-100 text-lg">
                      {selectedStartupDossier.startupName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-300">
                      {selectedStartupDossier.sector.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-charcoal-400 mt-0.5">
                    Ref: {selectedStartupDossier.companyRef} • Stage: {selectedStartupDossier.stage.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStartupDossier(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Founder Identity Card */}
            <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-charcoal-400 uppercase font-medium">Founding Principal</span>
                <div className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm">{selectedStartupDossier.founderName}</div>
                <div className="text-charcoal-500 font-mono text-[11px]">
                  {selectedStartupDossier.founderRole} • ID: {selectedStartupDossier.founderRollOrStaffId}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-charcoal-400 uppercase font-medium">Incubated Date</span>
                <div className="font-semibold text-charcoal-800 dark:text-ivory-200">
                  {new Date(selectedStartupDossier.incubatedDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Pitch Summary */}
            <div className="p-3.5 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl text-xs space-y-1">
              <span className="text-[11px] text-charcoal-400 uppercase font-bold tracking-wider block">Executive Pitch Thesis</span>
              <p className="text-charcoal-700 dark:text-ivory-300 leading-relaxed">{selectedStartupDossier.pitchDeckSummary}</p>
            </div>

            {/* Cap Table & Capital Structure */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-charcoal-800 dark:text-ivory-200 uppercase tracking-wider">
                Capital Structure & Cap Table Ledger
              </h4>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <span className="text-[10px] text-charcoal-400 uppercase font-medium block">Seed Grant</span>
                  <span className="font-extrabold text-charcoal-900 dark:text-ivory-100 text-sm block mt-0.5">
                    INR {selectedStartupDossier.seedGrantDisbursed.toLocaleString("en-IN")}
                  </span>
                  <span className="text-rose-primary dark:text-rose-400 font-semibold text-[10px] block">Non-Dilutive</span>
                </div>
                <div className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900/50">
                  <span className="text-[10px] text-charcoal-400 uppercase font-medium block">University Equity</span>
                  <span className="font-extrabold text-rose-primary dark:text-rose-400 text-sm block mt-0.5">
                    {selectedStartupDossier.universityEquityPercentage}%
                  </span>
                  <span className="text-charcoal-500 text-[10px] block">Institutional Stake</span>
                </div>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-[10px] text-charcoal-400 uppercase font-medium block">External Funding</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
                    INR {selectedStartupDossier.externalFundingRaised.toLocaleString("en-IN")}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] block">Angel & VC Rounds</span>
                </div>
              </div>
            </div>

            {/* IP & Mentorship Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-charcoal-400 uppercase font-medium block">Innovation Pod Desks</span>
                <span className="font-semibold text-charcoal-900 dark:text-ivory-100 block">
                  {selectedStartupDossier.labDesksAllocated} Hardware Desks • Bay B
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium block">
                  {selectedStartupDossier.patentsFiled} Patents &amp; Disclosures Filed
                </span>
              </div>
              <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-charcoal-400 uppercase font-medium block">Industry Lead Mentor</span>
                <span className="font-semibold text-charcoal-900 dark:text-ivory-100 block truncate">
                  {selectedStartupDossier.mentorName}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium block">
                  Bi-Weekly Sprints Active
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60 dark:border-charcoal-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Term Sheet
              </button>
              <button
                onClick={() => setSelectedStartupDossier(null)}
                className="px-4 py-2 bg-rose-primary hover:bg-rose-accent text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
