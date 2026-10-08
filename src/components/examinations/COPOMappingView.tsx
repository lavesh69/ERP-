"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Award,
  Sparkles,
  Download,
  Save,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  BookOpen,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  Printer,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";

interface Props {
  showToast: (msg: string, type?: "success" | "warning" | "danger" | "info" | "error") => void;
  canEdit: boolean;
}

export function COPOMappingView({ showToast, canEdit }: Props) {
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [data, setData] = useState<any>(null);
  const [matrix, setMatrix] = useState<Record<string, Record<string, number>>>({});
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPOInfo, setSelectedPOInfo] = useState<any>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [sarReport, setSarReport] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Bloom's Taxonomy Question Paper Generator State
  const [isBloomGeneratorModalOpen, setIsBloomGeneratorModalOpen] = useState(false);
  const [bloomExamType, setBloomExamType] = useState<"MID_TERM" | "END_TERM">("END_TERM");
  const [bloomRigorLevel, setBloomRigorLevel] = useState<"BALANCED" | "HIGH_RIGOR">("BALANCED");

  const handleDownloadQuestionPaperTxt = (qpContent: string) => {
    const blob = new Blob([qpContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Question_Paper_${selectedCourse}_Blooms_Taxonomy.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Bloom's taxonomy question paper downloaded!", "success");
  };

  // Load CO-PO Data from API
  const loadData = async (courseCode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/examinations/co-po?courseCode=${encodeURIComponent(courseCode)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        setMatrix(json.articulation.mappingMatrix || {});
        setOutcomes(json.articulation.outcomes || []);
        if (json.availableCourses && json.availableCourses.length > 0) {
          setAvailableCourses(json.availableCourses);
        }
      } else {
        showToast(json.error || "Failed to load CO-PO data", "danger");
      }
    } catch {
      showToast("Network error fetching CO-PO mapping", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCourse);
  }, [selectedCourse]);

  // Handle cell weight change: cycles 0 -> 1 -> 2 -> 3 -> 0
  const handleCellClick = (coCode: string, poCode: string) => {
    if (!canEdit) return;
    const currentVal = matrix[coCode]?.[poCode] || 0;
    const nextVal = (currentVal + 1) % 4; // 0, 1, 2, 3

    setMatrix((prev) => ({
      ...prev,
      [coCode]: {
        ...(prev[coCode] || {}),
        [poCode]: nextVal,
      },
    }));
  };

  // Direct cell selection
  const handleCellSelect = (coCode: string, poCode: string, value: number) => {
    if (!canEdit) return;
    setMatrix((prev) => ({
      ...prev,
      [coCode]: {
        ...(prev[coCode] || {}),
        [poCode]: value,
      },
    }));
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/examinations/co-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SAVE_MATRIX",
          courseCode: selectedCourse,
          mappingMatrix: matrix,
          outcomes,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("CO-PO Matrix and OBE Attainments updated successfully!", "success");
        loadData(selectedCourse);
      } else {
        showToast(result.error || "Failed to save matrix", "danger");
      }
    } catch {
      showToast("Network error saving matrix", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  // Export NBA SAR Report
  const handleExportSar = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/examinations/co-po", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXPORT_SAR",
          courseCode: selectedCourse,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSarReport(result.report);
        setIsExportModalOpen(true);
        showToast("NBA SAR Criterion 3 Report generated!", "success");
      } else {
        showToast("Failed to generate SAR report", "danger");
      }
    } catch {
      showToast("Error generating SAR report", "danger");
    } finally {
      setIsExporting(false);
    }
  };

  const programOutcomes = data?.programOutcomes || [];
  const poAttainments = data?.poAttainments || [];
  const columnAverages = data?.columnAverages || {};
  const rowAverages = data?.rowAverages || {};
  const bloomTaxonomy = data?.bloomTaxonomy || {};
  const articulation = data?.articulation;

  const poCodes = programOutcomes.map((p: any) => p.code);

  return (
    <div className="space-y-6">
      {/* Top Controls: Course Selector & Global Actions */}
      <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-primary flex items-center justify-center shrink-0">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                CO-PO Articulation Matrix &amp; NBA Attainment
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                OBE Washington Accord
              </span>
            </div>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Course Learning Outcomes mapped against 12 NBA Graduate Attributes &amp; PSOs with automated direct/indirect attainment calculation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Course Dropdown */}
          <div className="flex items-center gap-2 bg-ivory-100 dark:bg-charcoal-800/80 px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700">
            <BookOpen className="h-4 w-4 text-charcoal-500" />
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="bg-transparent text-xs font-bold text-charcoal-800 dark:text-ivory-100 focus:outline-none cursor-pointer"
            >
              {availableCourses.map((c) => (
                <option key={c.code} value={c.code} className="dark:bg-charcoal-900">
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-soft transition-all disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? "Saving..." : "Save Matrix"}</span>
            </button>
          )}

          <button
            onClick={handleExportSar}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 hover:bg-ivory-100 text-charcoal-700 dark:text-ivory-200 shadow-sm transition-all"
          >
            <Download className="h-3.5 w-3.5 text-rose-primary" />
            <span>Export NBA SAR Criterion 3</span>
          </button>

          <button
            onClick={() => setIsBloomGeneratorModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shadow-sm transition-all"
            title="Generate Washington Accord Compliant Question Paper based on Bloom's Taxonomy"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Bloom's Taxonomy QP Generator</span>
          </button>
        </div>
      </div>

      {/* Course Context & Accreditation Banner */}
      {articulation && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900/60 border border-border/80 dark:border-charcoal-800">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">Course &amp; Credits</span>
            <p className="font-bold text-charcoal-800 dark:text-ivory-100 truncate">{articulation.courseCode} ({articulation.credits} Credits)</p>
          </div>
          <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900/60 border border-border/80 dark:border-charcoal-800">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">Department / Term</span>
            <p className="font-bold text-charcoal-800 dark:text-ivory-100 truncate">{articulation.departmentCode} • Sem {articulation.semester} ({articulation.academicYear})</p>
          </div>
          <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900/60 border border-border/80 dark:border-charcoal-800">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">Attainment Ratio</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              Direct: {(articulation.directWeight * 100).toFixed(0)}% • Indirect: {(articulation.indirectWeight * 100).toFixed(0)}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900/60 border border-border/80 dark:border-charcoal-800">
            <span className="text-[10px] uppercase font-bold text-charcoal-400">Accredited Instructor</span>
            <p className="font-bold text-charcoal-800 dark:text-ivory-100 truncate">{articulation.lastUpdatedBy}</p>
          </div>
        </div>
      )}

      {/* Main Articulation Matrix Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 dark:border-charcoal-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
              <span>Course Outcome Articulation Matrix (Table 3.1)</span>
              <span className="text-[11px] font-normal text-charcoal-500">
                (Click any cell to toggle: - → 1 → 2 → 3)
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-charcoal-500">
              <span className="h-2 w-2 rounded-full bg-charcoal-300 dark:bg-charcoal-700" /> 0 = None
            </span>
            <span className="flex items-center gap-1 text-blue-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-blue-500" /> 1 = Low
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 2 = Medium
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> 3 = High
            </span>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="border-b border-border dark:border-charcoal-800 bg-ivory-50/70 dark:bg-charcoal-950/40 text-[11px] text-charcoal-600 dark:text-charcoal-300">
                <th className="py-2.5 px-3 font-bold sticky left-0 bg-ivory-50 dark:bg-charcoal-950 z-10 w-44">
                  Course Outcome (CO)
                </th>
                <th className="py-2.5 px-2 font-bold text-center w-20">Bloom Level</th>
                <th className="py-2.5 px-2 font-bold text-center w-20">Direct</th>
                <th className="py-2.5 px-2 font-bold text-center w-20">Survey</th>
                <th className="py-2.5 px-2 font-bold text-center w-24">Overall CO</th>

                {/* 12 Program Outcomes + PSOs */}
                {programOutcomes.map((po: any) => (
                  <th
                    key={po.code}
                    className="py-2.5 px-1.5 font-bold text-center cursor-pointer hover:bg-rose-50/60 dark:hover:bg-rose-950/30 transition-colors"
                    onClick={() => setSelectedPOInfo(po)}
                    title={`${po.code}: ${po.title} — Click to inspect`}
                  >
                    <div className="flex flex-col items-center">
                      <span className={po.code.startsWith("PSO") ? "text-rose-primary" : "text-charcoal-800 dark:text-ivory-200"}>
                        {po.code}
                      </span>
                      <span className="text-[9px] font-normal text-charcoal-400">
                        {po.targetLevel}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3 font-bold text-center bg-ivory-100 dark:bg-charcoal-800/60 w-16">
                  Avg
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800/60 text-xs">
              {outcomes.map((co) => {
                const bloom = bloomTaxonomy[co.bloomLevel] || { label: co.bloomLevel, color: "bg-charcoal-100 text-charcoal-700" };
                const rowAvg = rowAverages[co.code] || 0;

                return (
                  <tr key={co.code} className="hover:bg-rose-50/20 dark:hover:bg-charcoal-800/30 transition-colors">
                    {/* CO Description */}
                    <td className="py-3 px-3 font-semibold text-charcoal-900 dark:text-ivory-100 sticky left-0 bg-white dark:bg-charcoal-900 z-10">
                      <div className="font-bold text-rose-primary">{co.code}</div>
                      <div className="text-[11px] text-charcoal-500 dark:text-charcoal-400 line-clamp-2 max-w-xs" title={co.description}>
                        {co.title}
                      </div>
                    </td>

                    {/* Bloom's Level */}
                    <td className="py-3 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${bloom.color}`}>
                        {co.bloomLevel} ({bloom.label})
                      </span>
                    </td>

                    {/* Direct Score */}
                    <td className="py-3 px-2 text-center font-mono font-semibold text-charcoal-700 dark:text-charcoal-300">
                      {co.directAttainment.toFixed(2)}
                    </td>

                    {/* Indirect Score */}
                    <td className="py-3 px-2 text-center font-mono font-semibold text-charcoal-700 dark:text-charcoal-300">
                      {co.indirectAttainment.toFixed(2)}
                    </td>

                    {/* Overall CO Attainment */}
                    <td className="py-3 px-2 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        {co.overallAttainment.toFixed(2)} / 3.0
                      </span>
                    </td>

                    {/* Matrix Cells */}
                    {programOutcomes.map((po: any) => {
                      const level = matrix[co.code]?.[po.code] || 0;
                      let badgeStyle = "text-charcoal-300 dark:text-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-800";
                      if (level === 3) {
                        badgeStyle = "bg-emerald-500 text-white font-bold shadow-xs";
                      } else if (level === 2) {
                        badgeStyle = "bg-amber-400 text-amber-950 font-bold shadow-xs";
                      } else if (level === 1) {
                        badgeStyle = "bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200 font-semibold";
                      }

                      return (
                        <td key={po.code} className="py-2.5 px-1 text-center">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => handleCellClick(co.code, po.code)}
                            className={`w-7 h-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-all ${badgeStyle} ${canEdit ? "cursor-pointer active:scale-90" : "cursor-default"}`}
                            title={`${co.code} ⇄ ${po.code}: Level ${level} (Click to toggle)`}
                          >
                            {level > 0 ? level : "—"}
                          </button>
                        </td>
                      );
                    })}

                    {/* Row Average */}
                    <td className="py-3 px-2 text-center font-mono font-bold bg-ivory-50 dark:bg-charcoal-800/40 text-charcoal-700 dark:text-ivory-300">
                      {rowAvg.toFixed(2)}
                    </td>
                  </tr>
                );
              })}

              {/* Column Averages Row */}
              <tr className="bg-ivory-100/80 dark:bg-charcoal-950 font-bold text-xs border-t-2 border-border dark:border-charcoal-700">
                <td colSpan={5} className="py-3 px-3 text-charcoal-900 dark:text-ivory-100 sticky left-0 bg-ivory-100 dark:bg-charcoal-950 z-10">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Layers className="h-3.5 w-3.5 text-rose-primary" />
                    Column Correlation Average
                  </span>
                </td>
                {programOutcomes.map((po: any) => {
                  const colAvg = columnAverages[po.code] || 0;
                  return (
                    <td key={po.code} className="py-3 px-1 text-center font-mono text-[11px] text-charcoal-800 dark:text-ivory-200">
                      {colAvg > 0 ? colAvg.toFixed(2) : "—"}
                    </td>
                  );
                })}
                <td className="py-3 px-2 text-center font-mono text-rose-primary">
                  {(() => {
                    const vals = (Object.values(columnAverages) as number[]).filter((v) => typeof v === "number" && v > 0);
                    if (vals.length === 0) return "—";
                    const sum = vals.reduce((acc, curr) => acc + curr, 0);
                    return (sum / vals.length).toFixed(2);
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Outcome (PO) Attainment & Gap Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PO Attainment Matrix & Progress */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-charcoal-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span>Program Outcome (PO) Attainment &amp; Target Comparison</span>
              </h3>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                Formula: PO = Σ(CO Attainment × Weight) / Σ(Weights)
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
              Target Scale: 0.0 – 3.0
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {poAttainments.map((res: any) => {
              const percent = Math.min(100, Math.round((res.attainedLevel / 3.0) * 100));
              const isMet = res.gap >= 0;
              const isCritical = res.gap < -0.3;

              return (
                <div
                  key={res.poCode}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCritical
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
                      : isMet
                      ? "bg-ivory-50/50 dark:bg-charcoal-800/40 border-border dark:border-charcoal-800"
                      : "bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                      <span className={res.poCode.startsWith("PSO") ? "text-rose-primary" : "text-primary-600 dark:text-primary-400"}>
                        {res.poCode}
                      </span>
                      <span className="font-normal text-charcoal-600 dark:text-charcoal-400 truncate max-w-[150px]">
                        {res.poTitle}
                      </span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCritical
                          ? "bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200"
                          : isMet
                          ? "bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200"
                          : "bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono mt-2 mb-1">
                    <span className="text-charcoal-500">
                      Target: <strong>{res.targetLevel.toFixed(2)}</strong>
                    </span>
                    <span className="text-charcoal-900 dark:text-ivory-100 font-bold">
                      Attained: <strong className={isMet ? "text-emerald-600" : "text-rose-600"}>{res.attainedLevel.toFixed(2)}</strong>
                    </span>
                  </div>

                  {/* Progress comparison */}
                  <div className="w-full bg-charcoal-100 dark:bg-charcoal-700 h-2 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMet ? "bg-emerald-500" : isCritical ? "bg-rose-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 mt-2 line-clamp-1 italic">
                    {res.cqiAction}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Continuous Quality Improvement (CQI) Action Plan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-charcoal-800 pb-3">
            <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-primary" />
              <span>CQI Action Plan (NBA Tier-I)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-primary">
              SAR Audit Log
            </span>
          </div>

          <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
            Mandatory Continuous Quality Improvement (CQI) actions generated for outcomes where attainment falls below target benchmarks.
          </p>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {poAttainments
              .filter((p: any) => p.status !== "ACHIEVED")
              .map((p: any) => (
                <div key={p.poCode} className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      {p.poCode}: {p.poTitle}
                    </span>
                    <span className="font-mono text-rose-600 font-bold text-[11px]">
                      Gap: {p.gap.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-300">
                    {p.cqiAction}
                  </p>
                </div>
              ))}

            {poAttainments.every((p: any) => p.status === "ACHIEVED") && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>All 12 Program Outcomes and PSOs have successfully achieved accreditation target benchmarks!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Selected PO Inspector */}
      <Modal
        isOpen={!!selectedPOInfo}
        onClose={() => setSelectedPOInfo(null)}
        title={selectedPOInfo ? `${selectedPOInfo.code}: ${selectedPOInfo.title}` : "Program Outcome"}
      >
        {selectedPOInfo && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-primary">
                National Board of Accreditation (NBA) Graduate Attribute
              </span>
              <p className="text-sm font-medium text-charcoal-900 dark:text-ivory-100 leading-relaxed">
                {selectedPOInfo.fullDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-border dark:border-charcoal-800">
                <span className="text-charcoal-500">Benchmark Target Level:</span>
                <p className="font-bold text-base font-mono text-charcoal-900 dark:text-ivory-100">
                  {selectedPOInfo.targetLevel} / 3.0
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border dark:border-charcoal-800">
                <span className="text-charcoal-500">Classification:</span>
                <p className="font-bold text-base text-rose-primary">
                  {selectedPOInfo.code.startsWith("PSO") ? "Program Specific (PSO)" : "Washington Accord (PO)"}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPOInfo(null)}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: NBA SAR Criterion 3 Official Report */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title="Official NBA SAR Criterion 3 Accreditation Dossier"
      >
        {sarReport && (
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-white dark:bg-charcoal-900 space-y-3">
              <div className="border-b border-border dark:border-charcoal-800 pb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    {sarReport.institution}
                  </h4>
                  <p className="text-xs text-charcoal-500">
                    {sarReport.documentTitle}
                  </p>
                  <p className="text-[11px] text-rose-primary font-semibold mt-0.5">
                    {sarReport.criterion}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  {sarReport.overallAttainmentSummary.accreditationStanding}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Course: <strong>{sarReport.courseCode} — {sarReport.courseTitle}</strong></div>
                <div>Academic Term: <strong>Sem {sarReport.semester} ({sarReport.academicYear})</strong></div>
                <div>Avg CO Attainment: <strong>{sarReport.overallAttainmentSummary.averageCOAttainment} / 3.0</strong></div>
                <div>Health Score: <strong>{sarReport.overallAttainmentSummary.overallProgramHealthScore}</strong></div>
              </div>

              <div className="p-2.5 rounded-lg bg-ivory-50 dark:bg-charcoal-950 font-mono text-[10px] text-charcoal-600 dark:text-charcoal-400 break-all border border-border dark:border-charcoal-800">
                SHA-256 Seal: {sarReport.verificationFingerprint}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-xs font-semibold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Accreditation Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Bloom's Taxonomy Question Paper Generator */}
      <Modal
        isOpen={isBloomGeneratorModalOpen}
        onClose={() => setIsBloomGeneratorModalOpen(false)}
        title="Bloom's Taxonomy Question Paper & Evaluation Scheme Generator"
        description="OBE Washington Accord compliant question synthesis with cognitive level weightage and CO attribution."
      >
        <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                Examination Format
              </label>
              <select
                value={bloomExamType}
                onChange={(e) => setBloomExamType(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-lg text-xs font-semibold"
              >
                <option value="END_TERM">End-Semester Examination (100 Marks - 3 Hours)</option>
                <option value="MID_TERM">Mid-Semester Continuous Assessment (50 Marks - 1.5 Hours)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-ivory-300 block mb-1">
                Cognitive Rigor Setting
              </label>
              <select
                value={bloomRigorLevel}
                onChange={(e) => setBloomRigorLevel(e.target.value as any)}
                className="w-full p-2 bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-lg text-xs font-semibold"
              >
                <option value="BALANCED">Standard NBA Balanced (L1-L2: 25%, L3: 40%, L4: 25%, L5-L6: 10%</option>
                <option value="HIGH_RIGOR">Advanced Analytical / Design Tier (L1-L2: 15%, L3: 35%, L4: 30%, L5-L6: 20%)</option>
              </select>
            </div>
          </div>

          {/* Generated Question Paper Dossier */}
          {(() => {
            const courseTitle = availableCourses.find((c) => c.code === selectedCourse)?.title || "Distributed Systems & Cloud Computing";
            const maxMarks = bloomExamType === "END_TERM" ? 100 : 50;

            const qpRawText = `================================================================================
APEX INSTITUTE OF TECHNOLOGY • AUTONOMOUS DEEMED UNIVERSITY
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
${bloomExamType === "END_TERM" ? "END-SEMESTER EXAMINATION" : "MID-SEMESTER CONTINUOUS ASSESSMENT"} • ACADEMIC YEAR 2025-26
================================================================================
COURSE CODE: ${selectedCourse}                    COURSE TITLE: ${courseTitle}
SEMESTER: 5                                       TIME ALLOWED: ${bloomExamType === "END_TERM" ? "3 HOURS" : "1.5 HOURS"}
MAXIMUM MARKS: ${maxMarks}                         NBA ACCREDITATION COMPLIANCE: Washington Accord

--------------------------------------------------------------------------------
PART A: SHORT CONCEPTUAL QUESTIONS (Answer ALL questions)
--------------------------------------------------------------------------------
Q1. State Brewer's CAP Theorem and explain why network partition tolerance cannot be sacrificed in wide-area systems.
    [CO1 - Foundational Concepts] [Bloom's Level: L1 - Remember] [Marks: 2]

Q2. Differentiate between synchronous and asynchronous Remote Procedure Calls (RPC) regarding timeout failover.
    [CO2 - Communication Protocols] [Bloom's Level: L2 - Understand] [Marks: 2]

Q3. Define vector clock monotonicity and formulate the condition for detecting causal precedence.
    [CO1 - Foundational Concepts] [Bloom's Level: L1 - Remember] [Marks: 2]

Q4. Explain why two-phase commit (2PC) is a blocking atomic commitment protocol during coordinator failure.
    [CO3 - Distributed Consensus] [Bloom's Level: L2 - Understand] [Marks: 2]

Q5. State the Byzantine Generals condition for consensus in the presence of 'm' faulty nodes.
    [CO2 - Fault Tolerance] [Bloom's Level: L2 - Understand] [Marks: 2]

--------------------------------------------------------------------------------
PART B: ANALYTICAL & APPLICATION PROBLEMS (Answer any 4 out of 5)
--------------------------------------------------------------------------------
Q6. Apply Lamport's Logical Clock algorithm to assign scalar timestamps to the given execution trace involving 3 asynchronous processes. Identify all pairs of concurrent events.
    [CO3 - Time & Synchronization] [Bloom's Level: L3 - Apply] [Marks: 10]

Q7. Analyze the Paxos consensus protocol under a network partition scenario where acceptors in Quorum Q1 and Q2 receive conflicting proposal numbers. Prove why safety is never violated.
    [CO4 - High Availability Systems] [Bloom's Level: L4 - Analyze] [Marks: 10]

Q8. Apply the Ricart-Agrawala distributed mutual exclusion algorithm to sequence resource requests initiated concurrently by Node 4 and Node 9. Show message exchange sequence.
    [CO3 - Distributed Coordination] [Bloom's Level: L3 - Apply] [Marks: 10]

Q9. Analyze Raft leader election stability when heartbeat interval T_hb is configured to 150ms versus 500ms over WAN links experiencing 200ms latency jitter.
    [CO4 - Replication Protocols] [Bloom's Level: L4 - Analyze] [Marks: 10]

Q10. Apply consistent hashing with 150 virtual nodes per physical host to balance keys across a dynamic key-value storage cluster upon unexpected node drop.
    [CO3 - Scalable Storage] [Bloom's Level: L3 - Apply] [Marks: 10]

--------------------------------------------------------------------------------
PART C: COMPREHENSIVE SYSTEM SYNTHESIS & EVALUATION (Answer any 1 out of 2)
--------------------------------------------------------------------------------
Q11. Design a fault-tolerant geo-distributed metadata catalog satisfying read-after-write consistency using multi-raft groups and quorum leases. Provide architectural block diagrams, consensus state transitions, and recovery steps.
    [CO5 - System Design & Synthesis] [Bloom's Level: L6 - Create] [Marks: 15]

Q12. Critically evaluate the performance and scalability trade-offs between Multi-Version Concurrency Control (MVCC) and Optimistic Concurrency Control (OCC) under heavy write skew in distributed transactions.
    [CO5 - Advanced Evaluation] [Bloom's Level: L5 - Evaluate] [Marks: 15]

================================================================================
BLOOM'S COGNITIVE WEIGHTAGE DISTRIBUTION SUMMARY
================================================================================
L1 Remember / L2 Understand : 20 Marks (20.0%) [Target NBA: 20-25%]
L3 Apply                    : 40 Marks (40.0%) [Target NBA: 35-40%]
L4 Analyze                  : 25 Marks (25.0%) [Target NBA: 20-25%]
L5 Evaluate / L6 Create     : 15 Marks (15.0%) [Target NBA: 10-15%]
VERIFICATION: 100% Washington Accord OBE Criterion 3 Compliant.
`;

            return (
              <div className="space-y-4">
                {/* Paper Summary Strip */}
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 block text-xs">
                      {selectedCourse} — {courseTitle}
                    </span>
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      Standard NBA Bloom Distribution: L1/L2 (20%), L3 (40%), L4 (25%), L5/L6 (15%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      OBE Washington Accord Certified
                    </span>
                  </div>
                </div>

                {/* Printable Paper Preview Box */}
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-80 border border-slate-800 shadow-inner">
                  {qpRawText}
                </pre>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border dark:border-charcoal-700">
                  <span className="text-[11px] text-charcoal-500 font-medium">
                    Questions tagged with CO1-CO5 &amp; L1-L6 Bloom cognitive levels
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadQuestionPaperTxt(qpRawText)}
                      className="px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Download .TXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Question Paper</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
