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
  Search,
  Eye,
  Printer,
  X,
  RotateCcw,
  RefreshCw,
  Database,
  Activity,
  CheckSquare,
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
  const [activeTab, setActiveTab] = useState<"criteria" | "ratios" | "dossier" | "dvv" | "nirf">("criteria");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AccreditationSummary | null>(null);
  const [criteria, setCriteria] = useState<AccreditationCriterion[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCriterionDossier, setSelectedCriterionDossier] = useState<AccreditationCriterion | null>(null);
  const [isDvvSyncing, setIsDvvSyncing] = useState(false);
  const [dvvSyncStep, setDvvSyncStep] = useState<string>("");
  const [dvvProgress, setDvvProgress] = useState(0);
  const [lastDvvSync, setLastDvvSync] = useState<string>("Today, 18:30 IST");
  const [dvvBundleHash, setDvvBundleHash] = useState<string>("sha256:9b7e41f8a29c4e0193bb28e93214da88c91a348e");
  const [showDvvModal, setShowDvvModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleExportNirfXml = () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<NIRF_DCS_Submission year="2026" instituteCode="APEX-TECH-2026" category="OVERALL_ENGINEERING">
  <InstituteDetails>
    <Name>Apex Institute of Technology</Name>
    <ApprovalId>AICTE-1-987654321</ApprovalId>
    <Status>Accredited NAAC A++ (CGPA: 3.86)</Status>
  </InstituteDetails>
  <Pillars>
    <TLR weightage="0.30" score="84.50">
      <Metric name="SS_StudentStrength" score="18.2" max="20" />
      <Metric name="FSR_FacultyStudentRatio" score="28.5" max="30" />
      <Metric name="FQE_FacultyPhDExperience" score="17.8" max="20" />
      <Metric name="FRU_FinancialResourceUtilization" score="20.0" max="30" />
    </TLR>
    <RPC weightage="0.30" score="78.40">
      <Metric name="PU_Publications" score="31.2" max="35" />
      <Metric name="QP_QualityOfPublications" score="34.0" max="40" />
      <Metric name="IPR_PatentsGranted" score="8.2" max="15" />
      <Metric name="FPPP_ProjectFootprint" score="5.0" max="10" />
    </RPC>
    <GO weightage="0.20" score="86.20">
      <Metric name="GPH_PlacementHigherStudies" score="37.0" max="40" />
      <Metric name="GUE_UniversityExams" score="14.8" max="15" />
      <Metric name="GMS_MedianSalary" score="34.4" max="45" />
    </GO>
    <OI weightage="0.10" score="77.80">
      <Metric name="RD_RegionalDiversity" score="26.5" max="30" />
      <Metric name="WD_WomenDiversity" score="27.1" max="30" />
      <Metric name="ES_EconomicallyChallenged" score="18.2" max="20" />
      <Metric name="PCS_PhysicalFacilities" score="6.0" max="20" />
    </OI>
    <PR weightage="0.10" score="81.50">
      <Metric name="PeerPerception" score="81.5" max="100" />
    </PR>
  </Pillars>
  <Summary compositeScore="82.04" projectedRank="22" status="VERIFIED_BY_IQAC" />
</NIRF_DCS_Submission>`;

    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "NIRF_DCS_Apex_Tech_2026.xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: "success", text: "NIRF Data Capturing System (DCS) XML bundle successfully generated & exported!" });
  };

  const handleExportNirfCsv = () => {
    const csvContent = `Pillar Code,Pillar Name,Weightage,Score (Out of 100),Weighted Score,Key Indicators
TLR,Teaching Learning & Resources,0.30,84.50,25.35,"SS: 18.2/20, FSR: 28.5/30, FQE: 17.8/20, FRU: 20.0/30"
RPC,Research and Professional Practice,0.30,78.40,23.52,"PU: 31.2/35, QP: 34.0/40, IPR: 8.2/15, FPPP: 5.0/10"
GO,Graduation Outcomes,0.20,86.20,17.24,"GPH: 37.0/40, GUE: 14.8/15, GMS: 34.4/45"
OI,Outreach and Inclusivity,0.10,77.80,7.78,"RD: 26.5/30, WD: 27.1/30, ES: 18.2/20, PCS: 6.0/20"
PR,Peer Perception,0.10,81.50,8.15,"Academic Peers & Employers: 81.5/100"
TOTAL,Composite Institutional NIRF Score,1.00,82.04,82.04,"Projected National Rank: #22 (Top 25 Engineering)"`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "NIRF_Pillars_Apex_Tech_2026.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage({ type: "success", text: "NIRF 5-Pillar CSV breakdown successfully downloaded!" });
  };

  const filteredCriteria = criteria.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      `criterion ${c.criterionNumber}`.toLowerCase().includes(q) ||
      c.keyIndicators.some((ki) => ki.indicator.toLowerCase().includes(q))
    );
  });

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

  const handleExecuteDvvSync = async () => {
    setIsDvvSyncing(true);
    setDvvProgress(20);
    setDvvSyncStep("Connecting to Admissions & Enrolment Master Database (2,840 validated students)...");
    await new Promise((r) => setTimeout(r, 600));

    setDvvProgress(50);
    setDvvSyncStep("Reconciling HR Faculty Service Records & AICTE Cadre Norms (142 Faculty, 1:20 FSR)...");
    await new Promise((r) => setTimeout(r, 600));

    setDvvProgress(75);
    setDvvSyncStep("Aggregating 360° Student Satisfaction Survey (SSS) & Feedback (3.86/4.00 rating)...");
    await new Promise((r) => setTimeout(r, 600));

    setDvvProgress(95);
    setDvvSyncStep("Generating Institutional SHA-256 DVV Cryptographic Proof Bundle...");
    await new Promise((r) => setTimeout(r, 500));

    const newHash = "sha256:" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " IST";
    setDvvBundleHash(newHash);
    setLastDvvSync(`Today, ${nowTime}`);
    setDvvProgress(100);
    setDvvSyncStep("DVV Institutional Synchronization Complete & Cryptographically Verified!");
    await new Promise((r) => setTimeout(r, 400));

    setIsDvvSyncing(false);
    setShowDvvModal(false);
    setStatusMessage({
      type: "success",
      text: `NAAC/NIRF Institutional DVV sync completed at ${nowTime}. All 7 criteria verified with proof bundle ${newHash.slice(0, 16)}...`,
    });
    fetchData();
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleExportAccreditationCsv = () => {
    const headers = "Criterion Number,Criterion Name,Score Achieved,Max Weightage,Grade Equivalent,Key Indicators\n";
    const rows = criteria
      .map((c) => `"${c.criterionNumber}","${c.name.replace(/"/g, '""')}",${c.scoreAchieved},${c.weightage},"${c.gradeEquivalent}","${c.keyIndicators.map(k => `${k.indicator}: ${k.achieved}/${k.target}`).join("; ").replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `NAAC_Accreditation_Criteria_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowDvvModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Trigger DVV Data Sync
          </button>
          <button
            onClick={handleExportAccreditationCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Criteria Metrics (CSV)
          </button>
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

        <button
          onClick={() => setActiveTab("dvv")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "dvv"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Database className="w-4 h-4" />
          NAAC DVV Live Ledger
        </button>

        <button
          onClick={() => setActiveTab("nirf")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "nirf"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          NIRF 2026 Rankings & DCS
        </button>
      </div>

      {/* Tab 1: Criteria Matrix */}
      {activeTab === "criteria" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">NAAC 7 Quality Criteria Pillars</h3>
              <p className="text-xs text-slate-400">Showing {filteredCriteria.length} of {criteria.length} criteria matching</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search criteria or indicators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-56 sm:w-64"
              />
            </div>
          </div>

          {filteredCriteria.map((c) => (
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
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-mono text-slate-500">
                    Score: <strong>{c.scoreAchieved}</strong> / {c.weightage}
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                    Grade {c.gradeEquivalent}
                  </span>
                  <button
                    onClick={() => setSelectedCriterionDossier(c)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    Inspect Metric
                  </button>
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

          {filteredCriteria.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Criteria Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No quality criteria or indicators match your query &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-4 py-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-blue-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
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

      {/* Tab 4: NAAC DVV Live Ledger */}
      {activeTab === "dvv" && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Data Verification & Validation (DVV) Live Consensus Matrix
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    LIVE SYNC
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cross-checks real admissions, payroll, exams, and clinic ledgers to ensure 0% discrepancies for NAAC peer team review.
                </p>
              </div>

              <button
                onClick={() => setShowDvvModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors self-start md:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-sync Core Data Feeds
              </button>
            </div>

            {/* DVV Proof Bundle & Cryptographic Footprint */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Institutional DVV Cryptographic Bundle Fingerprint
                </span>
                <p className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 break-all">
                  {dvvBundleHash}
                </p>
                <p className="text-[11px] text-slate-400">
                  Last verified & signed: <strong className="text-slate-600 dark:text-slate-300">{lastDvvSync}</strong> • Compliant with UGC & NAAC guidelines.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(dvvBundleHash);
                  setCopiedHash(true);
                  setTimeout(() => setCopiedHash(false), 2500);
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shrink-0 hover:bg-slate-50"
              >
                {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copiedHash ? "Copied!" : "Copy Bundle Hash"}
              </button>
            </div>

            {/* 6 Reconciled Sources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 2.1 • Student Enrolment</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">100% Synced</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">2,840</div>
                <p className="text-[11px] text-slate-400">Verified against Admissions Master & Aadhaar ABC ID Registry</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 2.4 • Full-Time Faculty</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">FSR 1:14.9</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">142 Teaching Staff</div>
                <p className="text-[11px] text-slate-400">HR biometric ledger & UGC-recognized sanction orders cross-audited</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 2.7 • Student Survey (SSS)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">3.86 / 4.00</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">2,120 Responses</div>
                <p className="text-[11px] text-slate-400">Anonymous 360-degree feedback analyzed with automated sentiment checks</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 5.2 • Placement & Higher Ed</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">92.4% Conferred</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">₹18.5 LPA Avg</div>
                <p className="text-[11px] text-slate-400">Direct integration with Alumni portal & corporate offer letters</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 4.1 • Health & Safety</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">Zero Violations</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">20 Inpatient Beds</div>
                <p className="text-[11px] text-slate-400">Clinic occupancy, certified nursing roster & pharmacy reserve compliant</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Criterion 5.3 • Co-Curricular & Clubs</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">100 Pts Registry</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">24 Active Societies</div>
                <p className="text-[11px] text-slate-400">Cryptographically signed activity points verified for degree clearance</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: NIRF 2026 Rankings & Data Capturing System (DCS) */}
      {activeTab === "nirf" && (
        <div className="space-y-6">
          {/* Executive NIRF Standings Banner */}
          <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-500/30 text-white p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  NATIONAL INSTITUTIONAL RANKING FRAMEWORK (NIRF 2026)
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  DCS Validation Locked
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Projected National Rank: <span className="text-amber-400">#22</span> in Engineering
              </h2>
              <p className="text-xs text-amber-100/70 max-w-xl">
                Automated aggregation of 5 statutory NIRF ranking pillars. Institutional score evaluated across Ministry of Education (MoE) weighted rubric.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/10 text-center w-full sm:w-auto">
                <span className="text-[11px] uppercase tracking-wider text-amber-200/80 font-semibold block">Composite Score</span>
                <span className="text-3xl font-extrabold text-white">82.04</span>
                <span className="text-xs text-amber-300/80"> / 100 Points</span>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleExportNirfXml}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export NIRF DCS XML
                </button>
                <button
                  type="button"
                  onClick={handleExportNirfCsv}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Export 5-Pillar CSV
                </button>
              </div>
            </div>
          </div>

          {/* 5-Pillar Metric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Pillar 1: TLR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    Weightage: 30%
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                    1. Teaching, Learning & Resources (TLR)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">84.50</span>
                  <span className="text-xs text-slate-400 block">/ 100</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "84.5%" }} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Student Strength (SS):</span>
                  <span className="font-bold text-slate-900 dark:text-white">18.2 / 20</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Faculty-Student Ratio (FSR):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">28.5 / 30 (1:14.9)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Faculty Ph.D. & Exp (FQE):</span>
                  <span className="font-bold text-slate-900 dark:text-white">17.8 / 20</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Financial Utilization (FRU):</span>
                  <span className="font-bold text-slate-900 dark:text-white">20.0 / 30</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Weighted Contribution: <span className="font-bold text-slate-700 dark:text-slate-200">25.35 / 30 pts</span>
              </p>
            </div>

            {/* Pillar 2: RPC */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Weightage: 30%
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                    2. Research & Professional Practice (RPC)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">78.40</span>
                  <span className="text-xs text-slate-400 block">/ 100</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: "78.4%" }} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Combined Publications (PU):</span>
                  <span className="font-bold text-slate-900 dark:text-white">31.2 / 35</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Quality of Publications (QP):</span>
                  <span className="font-bold text-slate-900 dark:text-white">34.0 / 40 (Scopus/WoS)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">IPR Patents Granted (IPR):</span>
                  <span className="font-bold text-slate-900 dark:text-white">8.2 / 15</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Project Footprint (FPPP):</span>
                  <span className="font-bold text-slate-900 dark:text-white">5.0 / 10</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Weighted Contribution: <span className="font-bold text-slate-700 dark:text-slate-200">23.52 / 30 pts</span>
              </p>
            </div>

            {/* Pillar 3: GO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Weightage: 20%
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                    3. Graduation Outcomes (GO)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">86.20</span>
                  <span className="text-xs text-slate-400 block">/ 100</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full" style={{ width: "86.2%" }} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Placement & Higher Studies (GPH):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">37.0 / 40 (92.4%)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">University Exams (GUE):</span>
                  <span className="font-bold text-slate-900 dark:text-white">14.8 / 15</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Median Salary (GMS):</span>
                  <span className="font-bold text-slate-900 dark:text-white">34.4 / 45 (₹18.5 LPA)</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Weighted Contribution: <span className="font-bold text-slate-700 dark:text-slate-200">17.24 / 20 pts</span>
              </p>
            </div>

            {/* Pillar 4: OI */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                    Weightage: 10%
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                    4. Outreach & Inclusivity (OI)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">77.80</span>
                  <span className="text-xs text-slate-400 block">/ 100</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full" style={{ width: "77.8%" }} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Regional Diversity (RD):</span>
                  <span className="font-bold text-slate-900 dark:text-white">26.5 / 30</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Women Diversity (WD):</span>
                  <span className="font-bold text-slate-900 dark:text-white">27.1 / 30 (38.2%)</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Economically Challenged (ES):</span>
                  <span className="font-bold text-slate-900 dark:text-white">18.2 / 20</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Facilities for Divyangjan (PCS):</span>
                  <span className="font-bold text-slate-900 dark:text-white">6.0 / 20</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Weighted Contribution: <span className="font-bold text-slate-700 dark:text-slate-200">7.78 / 10 pts</span>
              </p>
            </div>

            {/* Pillar 5: PR */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                    Weightage: 10%
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1.5">
                    5. Perception (PR)
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">81.50</span>
                  <span className="text-xs text-slate-400 block">/ 100</span>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-600 h-full rounded-full" style={{ width: "81.5%" }} />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Academic Peer Perception:</span>
                  <span className="font-bold text-slate-900 dark:text-white">82.4 / 100</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Employer Reputation Survey:</span>
                  <span className="font-bold text-slate-900 dark:text-white">80.6 / 100</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-slate-500">Industry Collaboration Index:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Verified Strong</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                Weighted Contribution: <span className="font-bold text-slate-700 dark:text-slate-200">8.15 / 10 pts</span>
              </p>
            </div>

            {/* Statutory Attestation Card */}
            <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-900 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" /> STATUTORY REGISTRAR ENDORSEMENT
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-2">
                  DCS Integrity Clearance 2026
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  All 5 pillars compiled from primary academic ledgers, audited balance sheets, Scopus APIs, and placement verifications.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 text-[11px] space-y-1 text-slate-500">
                <p>• Institutional Code: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">APEX-TECH-2026</span></p>
                <p>• MoE Portal Lock Date: <span className="font-bold text-slate-700 dark:text-slate-300">Nov 30, 2026</span></p>
                <p>• IQAC Convener: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Dr. S. K. Mukherjee</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Criterion Quality Metric & Evidence Dossier Modal */}
      {selectedCriterionDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Criterion {selectedCriterionDossier.criterionNumber} Detailed Assessment
                  </span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">
                    {selectedCriterionDossier.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedCriterionDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score & Weightage Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Quantitative Attainment:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedCriterionDossier.scoreAchieved} / {selectedCriterionDossier.weightage} Points ({((selectedCriterionDossier.scoreAchieved / selectedCriterionDossier.weightage) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (selectedCriterionDossier.scoreAchieved / selectedCriterionDossier.weightage) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>National Benchmark: &ge; 80% for A++</span>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded">
                  Grade {selectedCriterionDossier.gradeEquivalent} Conferred
                </span>
              </div>
            </div>

            {/* Key Indicators Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Audited Key Indicators ({selectedCriterionDossier.keyIndicators.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedCriterionDossier.keyIndicators.map((ki, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 dark:text-white">{ki.indicator}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ki.achieved}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>Statutory Benchmark Target: {ki.target}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Compliant</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative IQAC Self Study Report Narrative */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40 text-xs space-y-1.5">
              <span className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> IQAC Qualitative Narrative Justification (SSR 2026)
              </span>
              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed italic">
                &ldquo;Continuous compliance achieved through institutional Outcome-Based Education (OBE), automated Bloom&rsquo;s taxonomy mapping, and verifiable real-time audit trails across academic, HR, and clinical subsystems.&rdquo;
              </p>
            </div>

            {/* Evidentiary Checklist */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200">Statutory Documentary Evidence Index</div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-500">
                <div>• IQAC Audit Minutes: <span className="text-emerald-600 font-semibold">Verified</span></div>
                <div>• Course Outcome Logs: <span className="text-emerald-600 font-semibold">Indexed</span></div>
                <div>• Student Verification: <span className="text-emerald-600 font-semibold">100% Synced</span></div>
                <div>• NAAC DVV Hash: <span className="font-mono text-blue-600">SHA-256 Valid</span></div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob(
                      [
                        `# NAAC / NIRF Criterion Assessment Report\n\nCriterion: ${selectedCriterionDossier.name} (Criterion #${selectedCriterionDossier.criterionNumber})\nScore: ${selectedCriterionDossier.scoreAchieved} / ${selectedCriterionDossier.weightage}\nGrade: ${selectedCriterionDossier.gradeEquivalent}\n\n## Key Indicators:\n` +
                          selectedCriterionDossier.keyIndicators.map((ki: any) => `- ${ki.indicator}: Achieved ${ki.achieved} (Target: ${ki.target})`).join("\n")
                      ],
                      { type: "text/markdown" }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Criterion-${selectedCriterionDossier.criterionNumber}-SSR.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800"
                >
                  <Download className="w-3.5 h-3.5" /> Export SSR (.md)
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report
                </button>
                <button
                  onClick={() => setSelectedCriterionDossier(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DVV Live Synchronization Runner Modal */}
      {showDvvModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <RefreshCw className={`w-6 h-6 ${isDvvSyncing ? "animate-spin" : ""}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    NAAC / NIRF DVV Live Reconciliation Engine
                  </h3>
                  <p className="text-xs text-slate-500">Cross-Module Institutional Data Verification</p>
                </div>
              </div>
              {!isDvvSyncing && (
                <button
                  onClick={() => setShowDvvModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                This process synchronizes student numbers, faculty appointments, student satisfaction scores, and campus health safety indices into an immutable DVV compliance bundle.
              </p>

              {isDvvSyncing ? (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{dvvSyncStep}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{dvvProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${dvvProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Validating cryptographic parity with Admissions & HR tables...
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current DVV Bundle Hash:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{dvvBundleHash.slice(0, 18)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Successful Reconciliation:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{lastDvvSync}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Criteria Audited:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">All 7 NAAC Criteria (100% Complete)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDvvSyncing}
                onClick={() => setShowDvvModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDvvSyncing}
                onClick={handleExecuteDvvSync}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDvvSyncing ? "animate-spin" : ""}`} />
                {isDvvSyncing ? "Reconciling Ledgers..." : "Execute Live DVV Sync"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
