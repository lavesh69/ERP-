"use client";

import React, { useState, useEffect } from "react";
import { Landmark, CheckCircle2, AlertCircle, DollarSign, Calculator, ShieldCheck, Printer, ArrowRight, Lock } from "lucide-react";

export function IncomeTaxTdsTab() {
  const [loading, setLoading] = useState(true);
  const [taxData, setTaxData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [locking, setLocking] = useState(false);

  // Form State
  const [form, setForm] = useState({
    employeeId: "EMP-FAC-01",
    employeeName: "Dr. Rajesh K. Sharma",
    panNumber: "ABCDE1234F",
    financialYear: "2025-26",
    annualGrossSalary: 1450000,
    basicSalary: 850000,
    daAmount: 425000,
    hraReceived: 170000,
    rentPaidAnnual: 240000,
    isMetroCity: true,
    section80C: 150000,
    section80D: 25000,
    section80CCD1B_Nps: 50000,
    section24HomeLoanInterest: 180000,
    otherTaxSavingInvestments: 0,
  });

  const fetchTax = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/income-tax");
      const json = await res.json();
      if (json.success) {
        setTaxData(json.taxData);
      }
    } catch (err) {
      console.error("Failed to load income tax data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTax();
  }, []);

  const handleCompute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/hr/income-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ANALYZE_TAX",
          ...form,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaxData(json.taxData);
      }
    } catch (err) {
      console.error("Failed to compute tax analysis", err);
    } finally {
      setSaving(false);
    }
  };

  const handleLockRegime = async (regime: "NEW_REGIME" | "OLD_REGIME") => {
    setLocking(true);
    try {
      const res = await fetch("/api/hr/income-tax", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOCK_TAX_REGIME",
          selectedRegime: regime,
          ...form,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTaxData(json.taxData);
      }
    } catch (err) {
      console.error("Failed to lock tax regime", err);
    } finally {
      setLocking(false);
    }
  };

  const handlePrintForm16 = (form16: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>FORM NO. 16 - Part B - ${form.employeeName}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #111; line-height: 1.5; font-size: 13px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
            .form-title { font-size: 16px; font-weight: bold; }
            .form-sub { font-size: 12px; color: #444; margin-top: 4px; }
            .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .meta-table td { border: 1px solid #aaa; padding: 6px 10px; }
            .main-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .main-table th, .main-table td { border: 1px solid #aaa; padding: 6px 10px; }
            .main-table th { background: #f0f0f0; text-align: left; }
            .total-row { font-weight: bold; background: #fafafa; }
            .seal-box { margin-top: 30px; border: 1px dashed #666; padding: 15px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="form-title">FORM NO. 16 — PART B</div>
            <div class="form-sub">[See rule 31(1)(a)] Certificate under section 203 of the Income-tax Act, 1961 for tax deducted at source on salary</div>
          </div>
          <table class="meta-table">
            <tr>
              <td><strong>Employer:</strong> ${form16.employerName}</td>
              <td><strong>Employer TAN:</strong> ${form16.employerTan}</td>
            </tr>
            <tr>
              <td><strong>Employee:</strong> ${form.employeeName}</td>
              <td><strong>Employee PAN:</strong> ${form.panNumber}</td>
            </tr>
            <tr>
              <td><strong>Assessment Year:</strong> ${form16.assessmentYear}</td>
              <td><strong>Financial Year:</strong> ${form.financialYear}</td>
            </tr>
          </table>

          <table class="main-table">
            <thead>
              <tr>
                <th>Particulars</th>
                <th style="text-align: right;">Amount (Rs.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1. Gross Salary (under section 17(1))</td>
                <td style="text-align: right;">${form16.grossTotalIncome?.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>2. Total Deductions (Standard Deduction + HRA + Chapter VI-A)</td>
                <td style="text-align: right;">${form16.totalDeductions?.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td>3. Total Taxable Income (1 - 2)</td>
                <td style="text-align: right;">${form16.totalTaxableIncome?.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>4. Tax on Total Income</td>
                <td style="text-align: right;">${form16.taxOnTotalIncome?.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>5. Rebate under section 87A</td>
                <td style="text-align: right;">${form16.rebateUnderSection87A?.toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td>6. Health & Education Cess (4%)</td>
                <td style="text-align: right;">${form16.cessAmount?.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td>7. Net Tax Payable</td>
                <td style="text-align: right;">${form16.netTaxPayable?.toLocaleString("en-IN")}</td>
              </tr>
              <tr class="total-row">
                <td>8. Total Tax Deducted at Source (TDS)</td>
                <td style="text-align: right;">${form16.totalTaxDeductedAtSource?.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          <div class="seal-box">
            <div>
              <strong>Cryptographic Verification Seal:</strong><br/>
              <code>${form16.digitalSeal}</code><br/>
              <span style="color: #666;">Generated by Classroom ERP Payroll & Tax Engine</span>
            </div>
            <div style="text-align: right;">
              <strong>Authorized Signatory</strong><br/>
              DDO & Finance Officer<br/>
              Apex University
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading && !taxData) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Loading Income Tax Section 192 Tax Regimes and Slabs...
      </div>
    );
  }

  const newR = taxData?.newRegime || {};
  const oldR = taxData?.oldRegime || {};
  const recommended = taxData?.recommendedRegime || "NEW_REGIME";
  const savings = taxData?.annualTaxSavings || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <Landmark className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Income Tax Section 192 TDS Planner &amp; Form 16 Part B
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                AY 2026-27 / FY 2025-26
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Automated side-by-side comparison of Old vs New Tax Regime (Section 115BAC), Chapter VI-A investment audits, monthly withholding scheduling, and statutory Form 16 Part B synthesis.
            </p>
          </div>
        </div>

        {taxData?.form16PartB && (
          <button
            onClick={() => handlePrintForm16(taxData.form16PartB)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-ground hover:bg-rose-container border border-border dark:border-charcoal-600 text-charcoal-900 dark:text-ivory-100 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Printer className="h-4 w-4 text-rose-primary" />
            <span>Print Form 16 Part B</span>
          </button>
        )}
      </div>

      {/* Comparison Recommendation Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          recommended === "NEW_REGIME"
            ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            : "bg-green-50/80 dark:bg-green-950/20 border-green-200 dark:border-green-800"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                Recommended Tax Regime: {recommended === "NEW_REGIME" ? "NEW REGIME (Section 115BAC)" : "OLD TAX REGIME"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-600 text-white">
                SAVE ₹{savings.toLocaleString("en-IN")}/YEAR
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Currently Selected: <strong>{taxData?.selectedRegime?.replace(/_/g, " ") || recommended}</strong> • Monthly Scheduled TDS Withholding: <strong>₹{taxData?.monthlyTdsWithholding?.toLocaleString("en-IN")}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleLockRegime("NEW_REGIME")}
            disabled={locking || taxData?.selectedRegime === "NEW_REGIME"}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-all shadow-xs"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock New Regime</span>
          </button>
          <button
            onClick={() => handleLockRegime("OLD_REGIME")}
            disabled={locking || taxData?.selectedRegime === "OLD_REGIME"}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all shadow-xs"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Lock Old Regime</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Slabs & Calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* NEW REGIME CARD */}
        <div className={`bg-white dark:bg-charcoal-800 p-6 rounded-2xl border shadow-soft flex flex-col justify-between ${recommended === "NEW_REGIME" ? "border-blue-400 ring-2 ring-blue-400/20" : "border-border dark:border-charcoal-700"}`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-700">
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  New Tax Regime (Section 115BAC)
                </h4>
                <span className="text-xs text-charcoal-500">Standard Deduction: ₹75,000 • Rebate u/s 87A up to ₹7L</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                FY 2025-26 Default
              </span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Gross Salary</span>
                <span className="font-semibold">₹{newR.grossSalary?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Standard Deduction</span>
                <span className="font-semibold text-green-600">-₹{newR.standardDeduction?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Total Taxable Income</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">₹{newR.totalTaxableIncome?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Base Tax</span>
                <span>₹{newR.baseTax?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Rebate under 87A</span>
                <span className="text-green-600">-₹{newR.rebate87A?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Health &amp; Education Cess (4%)</span>
                <span>₹{newR.healthAndEducationCess4Pct?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border dark:border-charcoal-700 mt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Total Annual Tax</span>
              <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
                ₹{newR.totalAnnualTaxPayable?.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Monthly TDS</span>
              <span className="text-sm font-bold text-blue-600">
                ₹{newR.monthlyTdsWithholding?.toLocaleString("en-IN")}/mo
              </span>
            </div>
          </div>
        </div>

        {/* OLD REGIME CARD */}
        <div className={`bg-white dark:bg-charcoal-800 p-6 rounded-2xl border shadow-soft flex flex-col justify-between ${recommended === "OLD_REGIME" ? "border-green-400 ring-2 ring-green-400/20" : "border-border dark:border-charcoal-700"}`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-700">
              <div>
                <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  Old Tax Regime
                </h4>
                <span className="text-xs text-charcoal-500">Standard Deduction: ₹50,000 • Chapter VI-A &amp; HRA Allowed</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                Deductions Enabled
              </span>
            </div>

            <div className="space-y-2 mt-4 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Gross Salary</span>
                <span className="font-semibold">₹{oldR.grossSalary?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Standard Deduction</span>
                <span className="font-semibold text-green-600">-₹{oldR.standardDeduction?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">HRA Exemption Sec 10(13A)</span>
                <span className="font-semibold text-green-600">-₹{oldR.exemptionsUnderSection10?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Chapter VI-A (80C, 80D, NPS, Sec 24)</span>
                <span className="font-semibold text-green-600">-₹{oldR.chapterVIA_Deductions?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Total Taxable Income</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">₹{oldR.totalTaxableIncome?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-charcoal-500">Health &amp; Education Cess (4%)</span>
                <span>₹{oldR.healthAndEducationCess4Pct?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border dark:border-charcoal-700 mt-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Total Annual Tax</span>
              <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
                ₹{oldR.totalAnnualTaxPayable?.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Monthly TDS</span>
              <span className="text-sm font-bold text-green-600">
                ₹{oldR.monthlyTdsWithholding?.toLocaleString("en-IN")}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tax Input & Re-computation Form */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-rose-primary" />
          <h4 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
            Recompute &amp; Audit Tax Declarations
          </h4>
        </div>

        <form onSubmit={handleCompute} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Annual Gross Salary (₹)</label>
              <input
                type="number"
                required
                value={form.annualGrossSalary}
                onChange={(e) => setForm({ ...form, annualGrossSalary: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Annual Basic Pay (₹)</label>
              <input
                type="number"
                required
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Dearness Allowance (DA) (₹)</label>
              <input
                type="number"
                required
                value={form.daAmount}
                onChange={(e) => setForm({ ...form, daAmount: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">HRA Received (₹)</label>
              <input
                type="number"
                required
                value={form.hraReceived}
                onChange={(e) => setForm({ ...form, hraReceived: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Actual Rent Paid (₹)</label>
              <input
                type="number"
                value={form.rentPaidAnnual}
                onChange={(e) => setForm({ ...form, rentPaidAnnual: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Section 80C (Max ₹1.5L)</label>
              <input
                type="number"
                value={form.section80C}
                onChange={(e) => setForm({ ...form, section80C: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">Section 80D Mediclaim (₹)</label>
              <input
                type="number"
                value={form.section80D}
                onChange={(e) => setForm({ ...form, section80D: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">80CCD(1B) NPS (Max ₹50k)</label>
              <input
                type="number"
                value={form.section80CCD1B_Nps}
                onChange={(e) => setForm({ ...form, section80CCD1B_Nps: Number(e.target.value) })}
                className="w-full text-xs p-2 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              <span>{saving ? "Recomputing..." : "Recompute Section 192 Tax"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
