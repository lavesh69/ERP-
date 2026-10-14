"use client";

import React, { useState, useEffect } from "react";
import { Award, TrendingUp, DollarSign, ShieldCheck, Printer, CheckCircle2, Calculator, ArrowRight } from "lucide-react";

export function CpcIncrementTab() {
  const [loading, setLoading] = useState(true);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState("LEVEL_10");

  // Increment Simulator State
  const [incEmployeeId, setIncEmployeeId] = useState("EMP-FAC-01");
  const [incEmployeeName, setIncEmployeeName] = useState("Dr. Rajesh K. Sharma");
  const [incLevel, setIncLevel] = useState("LEVEL_12");
  const [incBasic, setIncBasic] = useState(84700);
  const [incResult, setIncResult] = useState<any>(null);
  const [simulatingInc, setSimulatingInc] = useState(false);

  // CAS Fixation State
  const [casFromLevel, setCasFromLevel] = useState("LEVEL_12");
  const [casToLevel, setCasToLevel] = useState("LEVEL_13A");
  const [casCurrentBasic, setCasCurrentBasic] = useState(95300);
  const [casResult, setCasResult] = useState<any>(null);
  const [simulatingCas, setSimulatingCas] = useState(false);

  // DA Arrears State
  const [daBasic, setDaBasic] = useState(87200);
  const [daFromMonth, setDaFromMonth] = useState("2026-01");
  const [daToMonth, setDaToMonth] = useState("2026-06");
  const [daOldPct, setDaOldPct] = useState(46);
  const [daNewPct, setDaNewPct] = useState(50);
  const [daResult, setDaResult] = useState<any>(null);
  const [computingDa, setComputingDa] = useState(false);

  const fetchMatrix = async (level = "LEVEL_10") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/cpc-increment?level=${level}`);
      const json = await res.json();
      if (json.success) {
        setMatrixData(json);
      }
    } catch (err) {
      console.error("Failed to load CPC pay matrix", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix(selectedLevel);
  }, [selectedLevel]);

  const handleSimulateIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatingInc(true);
    try {
      const res = await fetch("/api/hr/cpc-increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SIMULATE_ANNUAL_INCREMENT",
          employeeId: incEmployeeId,
          employeeName: incEmployeeName,
          academicLevel: incLevel,
          currentBasic: Number(incBasic),
          effectiveDate: "2026-07-01",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIncResult(json.incrementDetails);
      }
    } catch (err) {
      console.error("Failed to simulate annual increment", err);
    } finally {
      setSimulatingInc(false);
    }
  };

  const handleSimulateCas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatingCas(true);
    try {
      const res = await fetch("/api/hr/cpc-increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_CAS_PROMOTION",
          employeeId: incEmployeeId,
          employeeName: incEmployeeName,
          fromLevel: casFromLevel,
          toLevel: casToLevel,
          currentBasic: Number(casCurrentBasic),
          effectiveDate: "2026-08-01",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCasResult(json.promotionDetails);
      }
    } catch (err) {
      console.error("Failed to calculate CAS promotion fixation", err);
    } finally {
      setSimulatingCas(false);
    }
  };

  const handleComputeDaArrears = async (e: React.FormEvent) => {
    e.preventDefault();
    setComputingDa(true);
    try {
      const res = await fetch("/api/hr/cpc-increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPUTE_DA_ARREARS",
          employeeId: incEmployeeId,
          employeeName: incEmployeeName,
          academicLevel: incLevel,
          basicPay: Number(daBasic),
          fromMonth: daFromMonth,
          toMonth: daToMonth,
          oldDaPercent: Number(daOldPct),
          newDaPercent: Number(daNewPct),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDaResult(json.arrears);
      }
    } catch (err) {
      console.error("Failed to compute DA arrears", err);
    } finally {
      setComputingDa(false);
    }
  };

  if (loading && !matrixData) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Loading 7th CPC Academic Pay Matrix and UGC increment rules...
      </div>
    );
  }

  const currentLevel = matrixData?.currentLevelData || {};

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                7th Central Pay Commission (CPC) Academic Pay Matrix &amp; Increments
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                7TH CPC / UGC 2018
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Implements statutory 7th CPC Academic Pay Levels (10 to 14), 3% vertical annual increments, Rule 13 CAS promotion fixation, and multi-month retroactive DA arrears.
            </p>
          </div>
        </div>

        {/* Level Switcher */}
        <div className="flex flex-col gap-1 sm:w-64">
          <label className="text-[10px] font-bold text-charcoal-500 uppercase">View Academic Pay Level</label>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
          >
            {matrixData?.allLevels?.map((lvl: any) => (
              <option key={lvl.key} value={lvl.key}>
                {lvl.levelName} ({lvl.designation})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pay Matrix Overview Card */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border dark:border-charcoal-700">
          <div>
            <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
              {currentLevel.academicLevel}
            </h4>
            <span className="text-xs text-charcoal-500">
              Cadre: {currentLevel.designation} • AGP: ₹{currentLevel.academicGradePay?.toLocaleString("en-IN")} • Entry Pay: ₹{currentLevel.entryPay?.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-container text-rose-primary">
            {currentLevel.cells?.length || 0} Vertical Step Cells
          </span>
        </div>

        {/* Pay Matrix Cells Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {currentLevel.cells?.map((cellVal: number, idx: number) => (
            <div
              key={idx}
              className="p-2 rounded-lg border border-border dark:border-charcoal-700 bg-surface-ground dark:bg-charcoal-900/60 text-center flex flex-col items-center"
            >
              <span className="text-[9px] font-mono text-charcoal-400">Cell {idx + 1}</span>
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                ₹{(cellVal / 1000).toFixed(1)}k
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two Simulation Engines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Annual 3% Increment Simulator */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h4 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              Annual 3% Vertical Increment Engine
            </h4>
          </div>
          <p className="text-xs text-charcoal-500">
            Calculates next vertical progression cell on 1st July / 1st January and generates cryptographically signed sanction orders.
          </p>

          <form onSubmit={handleSimulateIncrement} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Pay Level</label>
                <select
                  value={incLevel}
                  onChange={(e) => setIncLevel(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="LEVEL_10">Level 10 (Entry)</option>
                  <option value="LEVEL_11">Level 11 (Sr Scale)</option>
                  <option value="LEVEL_12">Level 12 (Selection)</option>
                  <option value="LEVEL_13A">Level 13A (Associate)</option>
                  <option value="LEVEL_14">Level 14 (Professor)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Current Basic Pay (₹)</label>
                <input
                  type="number"
                  required
                  value={incBasic}
                  onChange={(e) => setIncBasic(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulatingInc}
              className="w-full py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Calculator className="h-4 w-4" />
              <span>{simulatingInc ? "Calculating..." : "Compute 3% Annual Increment"}</span>
            </button>
          </form>

          {incResult && (
            <div className="p-4 rounded-xl bg-green-50/70 dark:bg-green-950/20 border border-green-200 dark:border-green-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-green-900 dark:text-green-200">
                  New Basic Pay: ₹{incResult.newBasicPay?.toLocaleString("en-IN")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-600 text-white">
                  +₹{incResult.monthlyHike?.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                Progression to Cell {incResult.newCellIndex} • Annual Hike: ₹{incResult.annualGrossHike?.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-charcoal-400 font-mono pt-1 border-t border-green-200/60 truncate">
                Sanction Seal: {incResult.verificationSeal}
              </span>
            </div>
          )}
        </div>

        {/* 2. CAS Promotion Fixation Rule 13 */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            <h4 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              UGC CAS Promotion Fixation (Rule 13)
            </h4>
          </div>
          <p className="text-xs text-charcoal-500">
            Computes notional increment in existing band and fixes starting cell in the promoted academic level.
          </p>

          <form onSubmit={handleSimulateCas} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">From Level</label>
                <select
                  value={casFromLevel}
                  onChange={(e) => setCasFromLevel(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="LEVEL_10">Level 10</option>
                  <option value="LEVEL_11">Level 11</option>
                  <option value="LEVEL_12">Level 12</option>
                  <option value="LEVEL_13A">Level 13A</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Promoted Target Level</label>
                <select
                  value={casToLevel}
                  onChange={(e) => setCasToLevel(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="LEVEL_11">Level 11 (Sr Scale)</option>
                  <option value="LEVEL_12">Level 12 (Selection)</option>
                  <option value="LEVEL_13A">Level 13A (Associate Prof)</option>
                  <option value="LEVEL_14">Level 14 (Professor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Current Basic Pay (₹)</label>
              <input
                type="number"
                required
                value={casCurrentBasic}
                onChange={(e) => setCasCurrentBasic(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={simulatingCas}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="h-4 w-4" />
              <span>{simulatingCas ? "Fixing Pay..." : "Compute CAS Rule 13 Fixation"}</span>
            </button>
          </form>

          {casResult && (
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900 dark:text-purple-200">
                  Promoted Basic: ₹{casResult.promotedBasicPay?.toLocaleString("en-IN")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white">
                  +₹{casResult.monthlyPayJump?.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                Designation: {casResult.targetDesignation} • Fixed at Cell {casResult.promotedCellIndex}
              </span>
              <span className="text-[10px] text-charcoal-400 font-mono pt-1 border-t border-purple-200/60 truncate">
                Promotion Seal: {casResult.verificationSeal}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Retroactive DA Arrears Calculator */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-rose-primary" />
          <h4 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
            Retroactive Dearness Allowance (DA) Arrears Engine
          </h4>
        </div>
        <p className="text-xs text-charcoal-500">
          When the central or state government announces a retroactive DA hike, this engine calculates month-by-month gross arrears, automatically deduces 12% PF contribution, and yields net payable disbursement.
        </p>

        <form onSubmit={handleComputeDaArrears} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Basic Pay (₹)</label>
            <input
              type="number"
              required
              value={daBasic}
              onChange={(e) => setDaBasic(Number(e.target.value))}
              className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">From Period</label>
            <input
              type="month"
              required
              value={daFromMonth}
              onChange={(e) => setDaFromMonth(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">To Period</label>
            <input
              type="month"
              required
              value={daToMonth}
              onChange={(e) => setDaToMonth(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Old DA %</label>
              <input
                type="number"
                value={daOldPct}
                onChange={(e) => setDaOldPct(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">New DA %</label>
              <input
                type="number"
                value={daNewPct}
                onChange={(e) => setDaNewPct(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={computingDa}
            className="py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold transition-all shadow-sm"
          >
            {computingDa ? "Calculating..." : "Compute Arrears"}
          </button>
        </form>

        {daResult && (
          <div className="mt-2 space-y-3">
            <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-ground dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700 text-center">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Total Gross Arrears</span>
                <span className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  ₹{daResult.totalGrossArrears?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">12% PF Contribution</span>
                <span className="text-base font-bold text-amber-600">
                  ₹{daResult.totalPfDeduction?.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Net Arrears Payable</span>
                <span className="text-base font-bold text-academic-success">
                  ₹{daResult.totalNetArrears?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="divide-y divide-border/60 dark:divide-charcoal-700 text-xs">
              {daResult.monthlyBreakdowns?.map((m: any, i: number) => (
                <div key={i} className="py-2 flex items-center justify-between text-charcoal-700 dark:text-charcoal-300">
                  <span className="font-semibold">{m.monthYear}</span>
                  <div className="flex items-center gap-4">
                    <span>Gross: ₹{m.grossDaDifference?.toLocaleString("en-IN")}</span>
                    <span>PF: ₹{m.pfDeductionOnArrears?.toLocaleString("en-IN")}</span>
                    <span className="font-bold text-academic-success">Net: ₹{m.netArrearsPayable?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
