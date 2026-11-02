"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Award,
  DollarSign,
  GraduationCap,
  Sparkles,
  Calculator,
  ArrowRight,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface ProgramEligibilityResult {
  programCode: string;
  programTitle: string;
  cutoffRequired: number;
  candidatePercentage: number;
  marginAboveCutoff: number;
  isScholarshipGranted: boolean;
  scholarshipGrant: string;
  standardTuition: string;
  effectiveNetTuition: string;
  mandatorySubjects: string[];
}

interface AdmissionsEligibilityTabProps {
  onSelectProgram?: (programCode: string) => void;
}

export default function AdmissionsEligibilityTab({ onSelectProgram }: AdmissionsEligibilityTabProps) {
  const { showToast } = useApp();
  const [twelfthScore, setTwelfthScore] = useState<number>(88.5);
  const [category, setCategory] = useState<string>("GENERAL");
  const [entranceExam, setEntranceExam] = useState<string>("JEE_MAIN");
  const [entranceScore, setEntranceScore] = useState<string>("92.4 Percentile");
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<ProgramEligibilityResult[] | null>(null);

  const calculateEligibility = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setCalculating(true);
      const res = await fetch("/api/admissions/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twelfthPercentage: twelfthScore,
          category,
          entranceExamScore: `${entranceExam}: ${entranceScore}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.eligiblePrograms)) {
        setResults(data.eligiblePrograms);
        showToast(`Eligibility computed: ${data.eligiblePrograms.length} qualified programs!`, "success");
      } else {
        showToast(data.error || "Failed to evaluate eligibility", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to evaluate eligibility", "error");
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-rose-primary dark:text-rose-light" />
            <span>Merit Eligibility & Institutional Scholarship Engine</span>
          </h2>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
            Simulate cutoffs, category quota relaxations, and merit fee waivers based on Class 12 board marks and national entrance test percentiles.
          </p>
        </div>

        <button
          onClick={() => calculateEligibility()}
          disabled={calculating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-semibold text-xs shadow-md transition-all self-stretch sm:self-auto justify-center"
        >
          <Sparkles className="w-4 h-4" />
          <span>{calculating ? "Evaluating..." : "Run Assessment"}</span>
        </button>
      </div>

      {/* Input Parameters Form */}
      <form
        onSubmit={calculateEligibility}
        className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-4"
      >
        <div>
          <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
            Class 12th Board Marks (%)
          </label>
          <input
            type="number"
            min="40"
            max="100"
            step="0.1"
            value={twelfthScore}
            onChange={(e) => setTwelfthScore(parseFloat(e.target.value) || 0)}
            className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 font-bold outline-none focus:border-rose-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
            Statutory Reservation Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 font-medium outline-none"
          >
            <option value="GENERAL">General (Unreserved)</option>
            <option value="OBC">OBC (Non-Creamy Layer - 5% waiver)</option>
            <option value="SC">Scheduled Caste (SC - 10% waiver)</option>
            <option value="ST">Scheduled Tribe (ST - 10% waiver)</option>
            <option value="EWS">Economically Weaker Section (EWS)</option>
            <option value="SPORTS">Sports & National Talent Quota</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
            Entrance Examination
          </label>
          <select
            value={entranceExam}
            onChange={(e) => setEntranceExam(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 font-medium outline-none"
          >
            <option value="JEE_MAIN">JEE Main (Engineering)</option>
            <option value="SAT">SAT International</option>
            <option value="CUET">CUET (Undergraduate)</option>
            <option value="STATE_CET">State CET / Lateral</option>
            <option value="INSTITUTIONAL_TEST">University Entrance Exam</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
            Score / Percentile
          </label>
          <input
            type="text"
            value={entranceScore}
            onChange={(e) => setEntranceScore(e.target.value)}
            placeholder="e.g. 94.2 Percentile"
            className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
          />
        </div>
      </form>

      {/* Program Results Grid */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
              Assessed Programs & Fee Structures ({results.length})
            </h3>
            <span className="text-xs text-charcoal-500">
              Calculated for candidate with {twelfthScore}% Class XII score
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((prog) => (
              <div
                key={prog.programCode}
                className="p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-xs bg-white dark:bg-charcoal-900 transition-all flex flex-col justify-between hover:border-rose-primary/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-surface-soft dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 font-bold">
                        {prog.programCode}
                      </span>
                      <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mt-1.5">
                        {prog.programTitle}
                      </h4>
                    </div>

                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Eligible (+{prog.marginAboveCutoff}%)
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-charcoal-600 dark:text-charcoal-300">
                      <span>Cutoff Threshold:</span>
                      <strong className="text-charcoal-900 dark:text-ivory-100">{prog.cutoffRequired}%</strong>
                    </div>

                    <div className="flex items-center justify-between text-charcoal-600 dark:text-charcoal-300">
                      <span>Standard Tuition:</span>
                      <span className="font-semibold text-charcoal-900 dark:text-ivory-100">
                        {prog.standardTuition} / yr
                      </span>
                    </div>

                    {prog.isScholarshipGranted ? (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-[11px]">
                          <Award className="w-3.5 h-3.5" />
                          <span>Merit Scholarship Awarded!</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>Award:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {prog.scholarshipGrant}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-surface-soft dark:bg-charcoal-800 text-[11px] text-charcoal-500 flex items-center justify-between">
                        <span>Merit Scholarship:</span>
                        <span>Standard Academic Fee</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between">
                      <span className="font-bold text-charcoal-800 dark:text-ivory-200">Net Payable Tuition:</span>
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {prog.effectiveNetTuition}
                        <span className="text-[10px] text-charcoal-400 font-normal"> / year</span>
                      </span>
                    </div>

                    <div className="text-[10px] text-charcoal-400 pt-1">
                      <span>Mandatory Subjects: </span>
                      <span className="font-medium text-charcoal-600 dark:text-charcoal-300">{prog.mandatorySubjects.join(", ")}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/50 dark:border-charcoal-800">
                  <button
                    onClick={() => onSelectProgram && onSelectProgram(prog.programCode)}
                    className="w-full py-2 px-3 rounded-xl bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-900 font-semibold text-xs shadow-xs hover:bg-rose-primary dark:hover:bg-rose-primary dark:hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Apply for Program</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
