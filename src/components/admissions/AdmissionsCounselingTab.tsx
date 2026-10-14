"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  Users,
  Search,
  Filter,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import {
  RankedApplicant,
  ProgramQuotaAllocation,
  SeatAllotmentOrder,
} from "@/lib/admissions/counseling-engine";

export function AdmissionsCounselingTab() {
  const [loading, setLoading] = useState(true);
  const [seatMatrix, setSeatMatrix] = useState<ProgramQuotaAllocation[]>([]);
  const [rankedCohort, setRankedCohort] = useState<RankedApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<RankedApplicant | null>(null);
  const [allotmentOrder, setAllotmentOrder] = useState<SeatAllotmentOrder | null>(null);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // Merit Score Interactive Calculator state
  const [calcBoard, setCalcBoard] = useState(92.5);
  const [calcEntrance, setCalcEntrance] = useState(96.0);
  const [calcComposite, setCalcComposite] = useState<number | null>(null);

  useEffect(() => {
    fetchCounselingData();
  }, []);

  const fetchCounselingData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admissions/counseling");
      const data = await res.json();
      if (data.success) {
        setSeatMatrix(data.seatMatrix || []);
        setRankedCohort(data.sampleRankedCohort || []);
      }
    } catch (err) {
      console.error("Failed to load counseling data:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMerit = async () => {
    try {
      const res = await fetch("/api/admissions/counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPUTE_MERIT_SCORE",
          boardExamPercent: calcBoard,
          entranceScore: calcEntrance,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCalcComposite(data.compositeScore);
      }
    } catch (err) {
      console.error("Calculation failed:", err);
    }
  };

  const handleGenerateOrder = async (applicant: RankedApplicant) => {
    try {
      setGeneratingOrder(true);
      setSelectedApplicant(applicant);
      const res = await fetch("/api/admissions/counseling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_ORDER",
          applicant,
          roundNumber: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAllotmentOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to generate allotment order:", err);
    } finally {
      setGeneratingOrder(false);
    }
  };

  const filteredApplicants = rankedCohort.filter((app) => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "ALL" || app.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-charcoal-500 animate-pulse">
        Loading Admissions Merit Rankings & Counseling Seat Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-md border border-emerald-700/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              Statutory Reservation & Merit Allocation Engine
            </div>
            <h2 className="text-xl font-bold tracking-tight">Centralized Counseling & Seat Allotment Portal</h2>
            <p className="text-xs text-emerald-100/80 mt-1 max-w-2xl">
              Composite merit ranking (Board 40% + Entrance 60%), statutory reservation quotas (UR, OBC-NCL, SC, ST, EWS), and multi-round seat allotment orders with SHA-256 digital seals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCounselingData}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur transition-colors"
            >
              Refresh Allotments
            </button>
          </div>
        </div>
      </div>

      {/* Quota Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {seatMatrix.map((prog) => (
          <div
            key={prog.programCode}
            className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                  {prog.programCode}
                </span>
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mt-1">
                  {prog.programTitle}
                </h3>
              </div>
              <span className="text-xs font-semibold text-charcoal-500">
                {prog.totalSeats} Total Seats
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800 text-[11px]">
              <div className="bg-ivory-50 dark:bg-charcoal-800/60 p-2 rounded">
                <span className="text-charcoal-400 block text-[10px]">Open (UR)</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{prog.filled.GENERAL} / {prog.quotas.GENERAL}</span>
              </div>
              <div className="bg-ivory-50 dark:bg-charcoal-800/60 p-2 rounded">
                <span className="text-charcoal-400 block text-[10px]">OBC-NCL</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{prog.filled.OBC_NCL} / {prog.quotas.OBC_NCL}</span>
              </div>
              <div className="bg-ivory-50 dark:bg-charcoal-800/60 p-2 rounded">
                <span className="text-charcoal-400 block text-[10px]">SC / ST</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{prog.filled.SC + prog.filled.ST} / {prog.quotas.SC + prog.quotas.ST}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-charcoal-500 pt-2 border-t border-dashed border-border dark:border-charcoal-800">
              <span>Opening: <strong className="text-charcoal-800 dark:text-ivory-200">{prog.openingRank ?? "N/A"}</strong></span>
              <span>Closing: <strong className="text-charcoal-800 dark:text-ivory-200">{prog.closingRank ?? "N/A"}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Composite Score Calculator */}
      <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Interactive Composite Merit Index Calculator
        </h3>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Standard formula: Composite = (12th Board Score &times; 0.40) + (Entrance Percentile &times; 0.60)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4 items-end">
          <div>
            <label className="text-[11px] font-semibold text-charcoal-600 dark:text-ivory-300 block mb-1">
              12th Board Exam (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={calcBoard}
              onChange={(e) => setCalcBoard(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-charcoal-600 dark:text-ivory-300 block mb-1">
              Entrance Percentile / Score
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={calcEntrance}
              onChange={(e) => setCalcEntrance(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
            />
          </div>
          <div>
            <button
              onClick={calculateMerit}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Compute Composite Score
            </button>
          </div>
          <div>
            {calcComposite !== null && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-center">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">Composite Score</span>
                <span className="text-base font-bold text-emerald-900 dark:text-emerald-100">{calcComposite} / 100</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ranked Applicants Table */}
      <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border dark:border-charcoal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
              Ranked Candidate Roster (Round 1 Allocation)
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              General Merit Rank (GMR) & Category Rank (CR) matching with preference choices
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or application no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2 py-1.5 text-xs bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
            >
              <option value="ALL">All Categories</option>
              <option value="GENERAL">General (UR)</option>
              <option value="OBC_NCL">OBC-NCL</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-ivory-50 dark:bg-charcoal-800/60 text-charcoal-600 dark:text-ivory-400 font-semibold border-b border-border dark:border-charcoal-800">
              <tr>
                <th className="p-3">GMR Rank</th>
                <th className="p-3">Candidate</th>
                <th className="p-3">Category (CR)</th>
                <th className="p-3">Scores (Board / Entrance)</th>
                <th className="p-3">Composite</th>
                <th className="p-3">Preferences</th>
                <th className="p-3">Allocation</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-charcoal-800">
              {filteredApplicants.map((app) => (
                <tr key={app.applicantId} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                  <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    #{app.generalMeritRank}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100 block">{app.fullName}</span>
                    <span className="text-[10px] text-charcoal-500 font-mono">{app.applicationNo}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300">
                      {app.category} (CR #{app.categoryRank})
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-charcoal-600 dark:text-ivory-400">
                    {app.boardExamPercent}% / {app.entranceScore}
                  </td>
                  <td className="p-3 font-bold font-mono text-emerald-800 dark:text-emerald-300">
                    {app.compositeScore}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {app.preferredPrograms.map((pref, i) => (
                        <span key={i} className="text-[10px] px-1 bg-ivory-100 dark:bg-charcoal-800 rounded font-mono">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    {app.status === "ALLOCATED" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        {app.allottedProgram} ({app.allottedCategory})
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                        Waitlisted
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleGenerateOrder(app)}
                      className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" />
                      Allotment Order
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seat Allotment Order Modal */}
      {allotmentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase">
                  Apex University Admissions Directorate
                </span>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Provisional Seat Allotment Order
                </h3>
              </div>
              <button
                onClick={() => setAllotmentOrder(null)}
                className="text-charcoal-400 hover:text-charcoal-700 text-xs px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-charcoal-500">Order ID:</span>
                <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">{allotmentOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Candidate Name:</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{allotmentOrder.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Application Number:</span>
                <span className="font-mono text-charcoal-900 dark:text-ivory-100">{allotmentOrder.applicationNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">General Merit Rank (GMR):</span>
                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">#{allotmentOrder.generalMeritRank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Allotted Program:</span>
                <span className="font-bold text-emerald-900 dark:text-emerald-100">{allotmentOrder.allottedProgram} ({allotmentOrder.allottedCategory})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Reporting Deadline:</span>
                <span className="font-semibold text-rose-600">{allotmentOrder.reportingDeadline}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-500">Seat Acceptance Fee:</span>
                <span className="font-mono font-bold">₹{allotmentOrder.seatAcceptanceFeeInr.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-3 bg-ivory-100 dark:bg-charcoal-800 rounded-lg text-[10px] font-mono break-all text-charcoal-600 dark:text-ivory-300">
              <span className="font-bold text-emerald-700 block mb-0.5">Cryptographic Verification Seal:</span>
              {allotmentOrder.verificationSeal}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAllotmentOrder(null)}
                className="px-4 py-2 border rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-ivory-100"
              >
                Dismiss
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Allotment Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdmissionsCounselingTab;
