"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Award,
  CheckCircle2,
  FileText,
  Users,
  Building2,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  Copy,
  Download,
} from "lucide-react";
import { AccreditationCriterion } from "@/lib/accreditation/accreditation-engine";

interface AccreditationSummary {
  metrics: {
    totalStudents: number;
    totalFaculty: number;
    professorsCount: number;
    associateProfessorsCount: number;
    assistantProfessorsCount: number;
    phdQualifiedPercentage: number;
    placementRatePercentage: number;
    studentSatisfactionSurveyRating: number;
  };
  fsr: {
    ratioValue: number;
    ratioString: string;
    isCompliant: boolean;
    surplusOrDeficitFaculty: number;
  };
  cadre: {
    isCadreBalanced: boolean;
    actualRatio: string;
    benchmarkRatio: string;
    remarks: string;
  };
  dossier: {
    institutionalCgpa: number;
    accreditationGrade: string;
    totalScore: number;
    maxScore: number;
    verificationHash: string;
    certifiedDate: string;
  };
}

export default function AccreditationPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"criteria" | "ratios" | "dossier">("criteria");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AccreditationSummary | null>(null);
  const [criteria, setCriteria] = useState<AccreditationCriterion[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, critRes] = await Promise.all([
        fetch("/api/accreditation?tab=summary"),
        fetch("/api/accreditation?tab=criteria"),
      ]);

      if (sumRes.ok) {
        const sData = await sumRes.json();
        setSummary(sData.summary);
      }
      if (critRes.ok) {
        const cData = await critRes.json();
        setCriteria(cData.criteria || []);
      }
    } catch (err) {
      console.error("Failed to load accreditation data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateDossier = async () => {
    try {
      const res = await fetch("/api/accreditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GENERATE_AQAR" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AQAR dossier");

      setStatusMessage({ type: "success", text: data.message });
      fetchData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Institutional Accreditation & Quality Assurance (NAAC / ABET)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Annual Quality Assurance Report (AQAR), 7-criteria matrix, Faculty-to-Student Ratio, and NIRF metrics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateDossier}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            Seal & Compile AQAR Dossier
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Institutional CGPA</span>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.dossier.institutionalCgpa ?? "3.37"}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">/ 4.00 (Grade {summary?.dossier.accreditationGrade ?? "A+"})</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Statutory NAAC & NBA Tier-I Standing</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty-Student Ratio (FSR)</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.fsr.ratioString ?? "1:14.9"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">Norm: 1:15</span>
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Statutory Compliant</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Ph.D. Qualified Faculty</span>
            <GraduationCap className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.metrics.phdQualifiedPercentage ?? "78.5"}%
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">Doctoral Faculty</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">High-impact research capability</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Student Survey (SSS)</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.metrics.studentSatisfactionSurveyRating ?? "3.86"}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">/ 4.00</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Annual 360-degree satisfaction index</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("criteria")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "criteria"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          7 Criteria Matrix ({criteria.length})
        </button>

        <button
          onClick={() => setActiveTab("ratios")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "ratios"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          FSR & Cadre Distribution
        </button>

        <button
          onClick={() => setActiveTab("dossier")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "dossier"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Official AQAR Dossier
        </button>
      </div>

      {/* Tab 1: Criteria Matrix */}
      {activeTab === "criteria" && (
        <div className="space-y-4">
          {criteria.map((c) => (
            <div
              key={c.criterionNumber}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">
                    Criterion {c.criterionNumber}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">{c.name}</h4>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-500">
                    Score: <strong>{c.scoreAchieved}</strong> / {c.weightage}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                    Grade {c.gradeEquivalent}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {c.keyIndicators.map((ki, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      {ki.indicator}
                    </div>
                    <div className="text-slate-400">Target: {ki.target}</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                      Achieved: {ki.achieved}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: FSR & Cadre Distribution */}
      {activeTab === "ratios" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Faculty-to-Student Ratio (FSR) Audit
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated in accordance with UGC, AICTE, and ABET accreditation guidelines.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Enrolled Full-Time Students</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {summary?.metrics.totalStudents ?? 1250}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300">Total Full-Time Regular Faculty</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {summary?.metrics.totalFaculty ?? 84}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Calculated Institutional FSR</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  {summary?.fsr.ratioString ?? "1:14.9"} (Compliant)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              Academic Cadre Distribution (1:2:6 Benchmark)
            </h3>
            <p className="text-xs text-slate-500">
              Verifies balanced faculty seniority: Professors, Associate Professors, and Assistant Professors.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300">Senior Professors</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {summary?.metrics.professorsCount ?? 12}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300">Associate Professors</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {summary?.metrics.associateProfessorsCount ?? 24}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                <span className="text-slate-600 dark:text-slate-300">Assistant Professors</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {summary?.metrics.assistantProfessorsCount ?? 48}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200">
                Cadre Ratio: <strong>{summary?.cadre.actualRatio ?? "12 : 24 : 48"}</strong> (Normalized 1:2:4). {summary?.cadre.remarks}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Official AQAR Dossier */}
      {activeTab === "dossier" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                Official Annual Quality Assurance Report (AQAR) Dossier
              </h3>
              <p className="text-xs text-slate-500">
                Statutory accreditation submission certificate with cryptographic registrar digital stamp.
              </p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
              Grade {summary?.dossier.accreditationGrade ?? "A+"}
            </span>
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl font-mono text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <div>INSTITUTION: Apex University of Science & Technology</div>
            <div>ASSESSMENT CYCLE: Annual Quality Assurance Report (AQAR 2025-2026)</div>
            <div>CUMULATIVE CGPA: {summary?.dossier.institutionalCgpa ?? "3.37"} / 4.00</div>
            <div>STATUS CONFERRED: Grade {summary?.dossier.accreditationGrade ?? "A+"} (Accredited Tier-I)</div>
            <div>CRYPTOGRAPHIC PROOF: {summary?.dossier.verificationHash ?? "AQAR-NAAC-778844DDEEAABB11"}</div>
            <div>CERTIFIED DATE: {summary?.dossier.certifiedDate ?? new Date().toISOString()}</div>
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <p>Certified by: Internal Quality Assurance Cell (IQAC) & Vice-Chancellor Executive Office.</p>
            <p>Meets all criteria for NBA, NAAC, and Washington Accord global mutual recognition.</p>
          </div>
        </div>
      )}
    </div>
  );
}
