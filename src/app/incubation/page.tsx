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
  const [activeTab, setActiveTab] = useState<"ventures" | "portfolio">("ventures");
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

      {/* Onboard Modal */}
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
                  {selectedStartupDossier.labDesksAllocated} Dedicated Hardware Desks
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium block">
                  {selectedStartupDossier.patentsFiled} Patents Under Review
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Assigned Lead Mentor</span>
                <span className="font-semibold text-slate-900 dark:text-white block truncate">
                  {selectedStartupDossier.mentorName}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium block">Weekly Advisory Review</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
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
      )}
    </div>
  );
}
