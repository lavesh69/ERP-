"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface Startup {
  id: string;
  companyRef: string;
  startupName: string;
  founderName: string;
  founderRollOrStaffId: string;
  founderRole: string;
  sector: string;
  stage: string;
  pitchDeckSummary: string;
  seedGrantDisbursed: number;
  universityEquityPercentage: number;
  externalFundingRaised: number;
  patentsFiled: number;
  labDesksAllocated: number;
  mentorName: string;
  status: string;
  incubatedDate: string;
}

export default function IncubationPage() {
  const [activeTab, setActiveTab] = useState<"ventures" | "portfolio" | "investor">("ventures");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [startups, setStartups] = useState<Startup[]>([]);
  const [selectedStartupDossier, setSelectedStartupDossier] = useState<Startup | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("ALL");
  const [filterStage, setFilterStage] = useState("ALL");

  // Investor Scorecard Evaluation Rubric State
  const [evalVentureId, setEvalVentureId] = useState<string>("");
  const [evalTeam, setEvalTeam] = useState<number>(85);
  const [evalTam, setEvalTam] = useState<number>(80);
  const [evalMoat, setEvalMoat] = useState<number>(75);
  const [evalTraction, setEvalTraction] = useState<number>(70);
  const [evalUnitEcon, setEvalUnitEcon] = useState<number>(80);
  const [evalValuationCap, setEvalValuationCap] = useState<number>(3000000);
  const [evalSeedTicket, setEvalSeedTicket] = useState<number>(50000);
  const [evalCommitteeNotes, setEvalCommitteeNotes] = useState<string>(
    "Defensible deep-tech solution with strong faculty-student founding team. Lab trials completed with high efficiency."
  );

  const handleUpdateStartupStage = async (id: string, stage: string) => {
    try {
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          id,
          stage,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || `Startup stage transitioned to ${stage}`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to update stage", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
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
    const headers = "Company Ref,Startup Name,Founder,Role,Staff/Roll ID,Sector,Stage,Seed Disbursed,Univ Equity %,External Funding,Patents,Lab Desks,Mentor,Status\n";
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
    seedGrantDisbursed: 15000,
    universityEquityPercentage: 2.0,
    labDesksAllocated: 2,
    mentorName: "Dr. Arvind Gupta (Angel Investor)",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, stRes] = await Promise.all([
        fetch("/api/incubation?tab=summary"),
        fetch("/api/incubation?tab=startups"),
      ]);

      const sumData = await sumRes.json();
      const stData = await stRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (stData.success) setStartups(stData.startups || []);
    } catch (err) {
      console.error("Error fetching incubation data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

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
        setMessage({ text: data.message || "Startup registered into incubator!", type: "success" });
        setShowModal(false);
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to register startup", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-50 dark:bg-violet-950/50 rounded-xl text-violet-600 dark:text-violet-400">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                University Incubation Center & Venture Accelerator
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Atal Incubation Center (AIC), Student Ventures, Seed Capital & Technology Transfer Office
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportIncubationCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export Portfolio (CSV)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-violet-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            Onboard Startup Venture
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Incubated Startups</span>
            <Rocket className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.totalVentures || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">{summary?.activeVentures || 0} Currently Active in Cohort</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Seed Grants Disbursed</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${loading ? "..." : (summary?.totalSeedCapitalDisbursed || 0).toLocaleString()}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">University Venture Fund</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">External Capital Raised</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            ${loading ? "..." : (summary?.totalExternalFundingRaised || 0).toLocaleString()}
          </div>
          <p className="text-xs text-slate-400 mt-1">VC & Angel Syndicates</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Patents & IP Filed</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.totalPatentsFiled || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Tech Transfer Office (TTO)</p>
        </div>
      </div>

      {/* Search & Sector Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search startups, founders, technologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sector:</span>
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Sectors</option>
            <option value="AI_ML">AI & Machine Learning</option>
            <option value="ROBOTICS_IOT">Robotics & IoT</option>
            <option value="FINTECH">Fintech & Blockchain</option>
            <option value="CLEANTECH">CleanTech & Energy</option>
            <option value="HEALTH_TECH">HealthTech & Bio</option>
            <option value="EDTECH">EdTech & Platforms</option>
          </select>

          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider sm:ml-2">Stage:</span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
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

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("ventures")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ventures"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Rocket className="w-4 h-4" />
          Active Startup Ventures ({startups.length})
        </button>
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "portfolio"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Portfolio Valuation & Cap-Table
        </button>
        <button
          onClick={() => setActiveTab("investor")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "investor"
              ? "border-violet-600 text-violet-600 dark:text-violet-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          Angel & VC Investor Scorecard
        </button>
      </div>

      {/* Tab 1: Ventures Grid */}
      {activeTab === "ventures" && (
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
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {s.startupName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Founder: {s.founderName} ({s.founderRole})
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
                  {s.sector.replace("_", " ")}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                {s.pitchDeckSummary}
              </p>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span>Current Stage:</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">
                    {s.stage.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Seed Disbursed:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    ${s.seedGrantDisbursed.toLocaleString()} ({s.universityEquityPercentage}% Equity)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>External Raised:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ${s.externalFundingRaised.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Workspaces / Desks:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {s.labDesksAllocated} Desks (MakerSpace)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lead Mentor:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {s.mentorName}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  onClick={() => setSelectedStartupDossier(s)}
                  className="px-2.5 py-1 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Term Sheet
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Stage:</span>
                  <select
                    value={s.stage}
                    onChange={(e) => handleUpdateStartupStage(s.id, e.target.value)}
                    className="px-2.5 py-1 text-xs font-semibold bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="PRE_INCUBATION">Pre-Incubation</option>
                    <option value="INCUBATED_PROTOTYPE">Incubated Prototype</option>
                    <option value="SEED_FUNDED">Seed Funded</option>
                    <option value="ACCELERATOR_GROWTH">Accelerator Growth</option>
                    <option value="GRADUATED_VENTURE">Graduated Venture</option>
                  </select>
                </div>
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
            <div className="col-span-1 md:col-span-3 py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Rocket className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Ventures Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No startup ventures match your search &ldquo;{searchQuery}&rdquo; and active filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterSector("ALL");
                  setFilterStage("ALL");
                }}
                className="mt-4 px-4 py-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-violet-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Portfolio Analysis */}
      {activeTab === "portfolio" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Institutional Venture Fund & Capital Overview
            </h2>
            <p className="text-sm text-slate-500">
              Equity Stakes, Technology Transfer Filings & Co-Investment Multipliers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estimated Portfolio Valuation
              </span>
              <div className="text-3xl font-extrabold text-violet-600 dark:text-violet-400">
                ${(summary?.estimatedPortfolioValuation || 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-400">Across active incubated companies</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Innovation Workspace Density
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {summary?.totalWorkspacesAllocated || 0} Desks
              </div>
              <p className="text-xs text-slate-400">Cleanroom & prototyping benches occupied</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Capital Multiplier Ratio
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                11.7x
              </div>
              <p className="text-xs text-slate-400">External VC dollars raised per $1 seed grant</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Angel & VC Investor Scorecard */}
      {activeTab === "investor" && (
        <div className="space-y-6">
          {/* Header & Venture Selector */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl">
                  <Award className="w-5 h-5" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Angel & VC Investor Evaluation Scorecard
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Institutional Investment Committee Due Diligence Rubric (5-Pillars Weighted Matrix)
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                Target Venture:
              </span>
              <select
                value={evalVentureId || (startups[0]?.id || "")}
                onChange={(e) => setEvalVentureId(e.target.value)}
                className="w-full md:w-64 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
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

            const handleDownloadMemo = () => {
              if (!currentVenture) return;
              const memoContent = `# INSTITUTIONAL INVESTMENT COMMITTEE EVALUATION MEMO
--------------------------------------------------
VENTURE: ${currentVenture.startupName} (${currentVenture.companyRef})
FOUNDER: ${currentVenture.founderName} (${currentVenture.founderRole})
SECTOR: ${currentVenture.sector} | STAGE: ${currentVenture.stage}
DATE: ${new Date().toLocaleDateString()}

==================================================
DILIGENCE RUBRIC SCORES (WEIGHTED 5-PILLARS)
==================================================
1. Team Pedigree & Execution (25%): ${evalTeam}/100
2. Market Size & TAM Opportunity (20%): ${evalTam}/100
3. IP Moat & Tech Defensibility (20%): ${evalMoat}/100
4. Traction & Commercial Velocity (20%): ${evalTraction}/100
5. Unit Economics & Capital Runway (15%): ${evalUnitEcon}/100

COMPOSITE SCORE: ${compositeScore}%
COMMITTEE VERDICT: ${isTier1 ? "TIER 1: HIGH CONVICTION SEED ALLOCATION" : isTier2 ? "TIER 2: CONDITIONAL DUE DILIGENCE" : "TIER 3: INCUBATION PROTOTYPE ITERATION"}

==================================================
TERM SHEET RECOMMENDATION
==================================================
- SAFE Valuation Cap: $${evalValuationCap.toLocaleString()}
- Seed Grant Ticket: $${evalSeedTicket.toLocaleString()}
- University Equity Stake: ${currentVenture.universityEquityPercentage}%
- Hardware Desks Assigned: ${currentVenture.labDesksAllocated} Desks
- Assigned Advisory Mentor: ${currentVenture.mentorName}

COMMITTEE NOTES:
${evalCommitteeNotes}
`;
              const blob = new Blob([memoContent], { type: "text/markdown;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `Investment_Memo_${currentVenture.startupName.replace(/\s+/g, "_")}.md`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            };

            return (
              <div className="space-y-6">
                {currentVenture && (
                  <div className="p-4 bg-violet-50/60 dark:bg-violet-950/30 rounded-2xl border border-violet-200/80 dark:border-violet-800/50 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-sm">
                        {currentVenture.startupName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {currentVenture.startupName}
                        </div>
                        <div className="text-slate-500">
                          Founder: {currentVenture.founderName} • Sector: {currentVenture.sector} • Ref: {currentVenture.companyRef}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700 dark:text-slate-300">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Seed Disbursed</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          ${currentVenture.seedGrantDisbursed.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">External Funding</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          ${currentVenture.externalFundingRaised.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Equity Stake</span>
                        <span className="font-extrabold text-violet-600 dark:text-violet-400">
                          {currentVenture.universityEquityPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Score & Verdict Banner */}
                <div className={`p-6 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
                  isTier1
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                    : isTier2
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60"
                    : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                }`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-extrabold text-2xl shadow-inner ${
                      isTier1
                        ? "bg-emerald-500 text-white"
                        : isTier2
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white"
                    }`}>
                      <span>{compositeScore}</span>
                      <span className="text-[10px] uppercase font-semibold tracking-wider">Score</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isTier1
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                            : isTier2
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300"
                        }`}>
                          {isTier1 ? "Tier 1: High Conviction" : isTier2 ? "Tier 2: Conditional Diligence" : "Tier 3: Needs Iteration"}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {compositeScore >= 80 ? "Fast-Track Seed Qualified" : compositeScore >= 65 ? "Requires Milestone Audit" : "Lab Mentorship Track"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {isTier1
                          ? "Approved for Fast-Track Institutional Seed Allocation ($50,000 - $100,000)"
                          : isTier2
                          ? "Conditionally Approved Pending Customer Pilot Verification & Patent Filing"
                          : "Incubation Lab Mentorship Required Before Seed Committee Review"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                        {isTier1
                          ? "Exceptional score across team execution, defensible technical IP, and TAM scale. Recommendation: Sanction SAFE agreement and assign Demo Day key pitch slot."
                          : isTier2
                          ? "Strong fundamentals identified. Recommendation: Complete customer pilot references and verify patent defensibility before capital release."
                          : "Prototype shows promise but requires technical derisking. Retain in hardware workspace with dedicated faculty mentor."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap md:flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setMessage({
                          text: `Investment Committee Verdict recorded for ${currentVenture?.startupName}: Score ${compositeScore}% (${isTier1 ? 'TIER 1 APPROVED' : isTier2 ? 'TIER 2 CONDITIONAL' : 'TIER 3 LAB ITERATION'})`,
                          type: "success",
                        });
                      }}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all text-center"
                    >
                      Record Committee Vote
                    </button>
                    <button
                      onClick={handleDownloadMemo}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Memo (.md)
                    </button>
                  </div>
                </div>

                {/* 5-Pillars Evaluation Sliders */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        5-Pillar Investment Diligence Rubric
                      </h3>
                      <p className="text-xs text-slate-500">
                        Adjust individual weights to evaluate startup readiness and defensibility
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEvalTeam(85);
                        setEvalTam(80);
                        setEvalMoat(75);
                        setEvalTraction(70);
                        setEvalUnitEcon(80);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Rubric
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pillar 1 */}
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          1. Team Pedigree & Domain Grit (25% Weight)
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          {evalTeam} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evalTeam}
                        onChange={(e) => setEvalTeam(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400">
                        Technical founder depth, student-faculty cohesion, past publications & hackathon track record.
                      </p>
                    </div>

                    {/* Pillar 2 */}
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          2. Market Size & TAM Scale (20% Weight)
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          {evalTam} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evalTam}
                        onChange={(e) => setEvalTam(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400">
                        Total addressable market ($500M+), annual CAGR {">"} 18%, macro economic tailwinds & urgency.
                      </p>
                    </div>

                    {/* Pillar 3 */}
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          3. IP Moat & Tech Defensibility (20% Weight)
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          {evalMoat} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evalMoat}
                        onChange={(e) => setEvalMoat(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400">
                        Indian/PCT patents, proprietary datasets, proprietary hardware architectures & high switching cost.
                      </p>
                    </div>

                    {/* Pillar 4 */}
                    <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          4. Traction & Commercial Velocity (20% Weight)
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          {evalTraction} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evalTraction}
                        onChange={(e) => setEvalTraction(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400">
                        Active enterprise pilots, signed Letters of Intent (LOIs), MoM usage velocity & beta retention.
                      </p>
                    </div>

                    {/* Pillar 5 */}
                    <div className="col-span-1 md:col-span-2 space-y-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          5. Unit Economics & Capital Runway (15% Weight)
                        </span>
                        <span className="px-2 py-0.5 rounded-md font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          {evalUnitEcon} / 100
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={evalUnitEcon}
                        onChange={(e) => setEvalUnitEcon(Number(e.target.value))}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400">
                        Gross margins {">"} 65%, low churn, customer payback {"<"} 12 months & runway duration post-grant.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Term Sheet Sanction & Committee Notes */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Term Sheet Parameters & Committee Notes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        SAFE Valuation Cap ($)
                      </label>
                      <input
                        type="number"
                        step="250000"
                        value={evalValuationCap}
                        onChange={(e) => setEvalValuationCap(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Seed Check Allocation ($)
                      </label>
                      <input
                        type="number"
                        step="10000"
                        value={evalSeedTicket}
                        onChange={(e) => setEvalSeedTicket(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        University Equity Stake
                      </label>
                      <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-violet-600 dark:text-violet-400">
                        {currentVenture?.universityEquityPercentage || 3}% Institutional Common
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Diligence Committee Synthesis & Rationale
                    </label>
                    <textarea
                      rows={2}
                      value={evalCommitteeNotes}
                      onChange={(e) => setEvalCommitteeNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
                      placeholder="Add specific investor committee observations, milestones, or risk disclosures..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Dossier
                    </button>
                    <button
                      onClick={() => {
                        setMessage({
                          text: `Term Sheet of $${evalSeedTicket.toLocaleString()} at $${(evalValuationCap / 1000000).toFixed(1)}M Valuation Cap sanctioned for ${currentVenture?.startupName}!`,
                          type: "success",
                        });
                      }}
                      className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                    >
                      Sanction Deal Term Sheet
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Onboard Startup into Incubator
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Startup Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startupName}
                    onChange={(e) => setFormData({ ...formData, startupName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Founder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.founderName}
                    onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Sector
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
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
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Founder Affiliation
                  </label>
                  <select
                    value={formData.founderRole}
                    onChange={(e) => setFormData({ ...formData, founderRole: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="STUDENT">Enrolled Student</option>
                    <option value="ALUMNI">Alumni Graduate</option>
                    <option value="FACULTY">Faculty Researcher</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Problem Statement & Pitch Summary
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.pitchDeckSummary}
                  onChange={(e) => setFormData({ ...formData, pitchDeckSummary: e.target.value })}
                  placeholder="Summarize product value proposition, market size, and technology differentiation..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Seed Grant ($)
                  </label>
                  <input
                    type="number"
                    value={formData.seedGrantDisbursed}
                    onChange={(e) =>
                      setFormData({ ...formData, seedGrantDisbursed: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Lab Desks
                  </label>
                  <input
                    type="number"
                    value={formData.labDesksAllocated}
                    onChange={(e) =>
                      setFormData({ ...formData, labDesksAllocated: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 rounded-xl">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selectedStartupDossier.startupName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                      {selectedStartupDossier.sector.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Ref: {selectedStartupDossier.companyRef} • Stage: {selectedStartupDossier.stage.replace(/_/g, " ")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStartupDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Founder Identity Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-medium">Founding Principal</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedStartupDossier.founderName}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  {selectedStartupDossier.founderRole} • ID: {selectedStartupDossier.founderRollOrStaffId}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Incubated Date</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(selectedStartupDossier.incubatedDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Pitch Summary */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
              <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block">Executive Pitch Thesis</span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedStartupDossier.pitchDeckSummary}</p>
            </div>

            {/* Cap Table & Capital Structure */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Capital Structure & Cap Table Ledger
              </h4>
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-violet-50/50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">Seed Grant</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm block mt-0.5">
                    ${selectedStartupDossier.seedGrantDisbursed.toLocaleString()}
                  </span>
                  <span className="text-violet-600 dark:text-violet-400 font-semibold text-[10px] block">Non-Dilutive</span>
                </div>
                <div className="p-3 bg-violet-50/50 dark:bg-violet-950/30 rounded-xl border border-violet-100 dark:border-violet-900/50">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">University Equity</span>
                  <span className="font-extrabold text-violet-600 dark:text-violet-400 text-sm block mt-0.5">
                    {selectedStartupDossier.universityEquityPercentage}%
                  </span>
                  <span className="text-slate-500 text-[10px] block">Institutional Stake</span>
                </div>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">External Funding</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm block mt-0.5">
                    ${selectedStartupDossier.externalFundingRaised.toLocaleString()}
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-[10px] block">Angel & VC Rounds</span>
                </div>
              </div>
            </div>

            {/* IP & Mentorship Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">MakerSpace & IP</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {selectedStartupDossier.labDesksAllocated} Hardware Desks • Cleanroom B-12
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium block">
                  PCT/US2026/049102 • {selectedStartupDossier.patentsFiled} Patents Filed
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 uppercase font-medium block">Lead Mentor</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEvalVentureId(selectedStartupDossier.id);
                      setActiveTab("investor");
                      setSelectedStartupDossier(null);
                    }}
                    className="text-[10px] font-bold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Open in Scorecard →
                  </button>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {selectedStartupDossier.mentorName}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium block">Weekly Advisory Review</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">Stage:</span>
                <button
                  onClick={async () => {
                    await handleUpdateStartupStage(selectedStartupDossier.id, "MVP_BUILD");
                    setSelectedStartupDossier((prev: any) => ({ ...prev, stage: "MVP_BUILD" }));
                  }}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-lg font-medium transition-colors"
                >
                  MVP Build
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStartupStage(selectedStartupDossier.id, "PILOT_DEPLOYED");
                    setSelectedStartupDossier((prev: any) => ({ ...prev, stage: "PILOT_DEPLOYED" }));
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Pilot Deployed
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStartupStage(selectedStartupDossier.id, "EXTERNAL_FUNDED");
                    setSelectedStartupDossier((prev: any) => ({ ...prev, stage: "EXTERNAL_FUNDED" }));
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium transition-colors"
                >
                  External Funded
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStartupStage(selectedStartupDossier.id, "GRADUATED");
                    setSelectedStartupDossier((prev: any) => ({ ...prev, stage: "GRADUATED" }));
                  }}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 rounded-lg font-medium transition-colors"
                >
                  Graduate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Term Sheet
                </button>
                <button
                  onClick={() => setSelectedStartupDossier(null)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
