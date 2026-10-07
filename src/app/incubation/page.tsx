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
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-violet-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Onboard Startup Venture
        </button>
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
          Active Startup Ventures
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
          {startups.map((s) => (
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
            </div>
          ))}
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
    </div>
  );
}
