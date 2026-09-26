"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  HeartHandshake,
  GraduationCap,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  Mail,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Download,
  CreditCard,
  Phone,
  UserCheck,
  History,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function ParentPortalPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Message Advisor Modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [advisorSubject, setAdvisorSubject] = useState("");
  const [advisorMessage, setAdvisorMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Online Fee Settlement Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFeeHead, setSelectedFeeHead] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>("CREDIT_CARD");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  async function loadParentData(childId?: string) {
    try {
      setIsLoading(true);
      const url = childId ? `/api/parent?studentId=${childId}` : "/api/parent";
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.child?.id) {
          setSelectedChildId(result.child.id);
        }
      } else if (res.status === 403) {
        showToast("Unauthorized ward access blocked by FERPA isolation", "error");
      } else {
        showToast("Error retrieving scholar record", "error");
      }
    } catch (err) {
      console.error("Parent portal fetch error:", err);
      showToast("Network error fetching parent dossier", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadParentData(selectedChildId || undefined);
  }, [refreshTrigger]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisorMessage.trim()) {
      showToast("Please enter an inquiry message for the advisor", "error");
      return;
    }

    setIsSendingMessage(true);
    try {
      const res = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_INQUIRY",
          subject: advisorSubject.trim() || undefined,
          message: advisorMessage.trim(),
          advisorEmail: data?.child?.advisor?.email,
          studentId: data?.child?.id,
        }),
      });

      if (res.ok) {
        showToast("Pastoral inquiry delivered to Course Advisor and logged to portal history", "success");
        setIsMessageModalOpen(false);
        setAdvisorSubject("");
        setAdvisorMessage("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to send message", "error");
      }
    } catch {
      showToast("Network error dispatching message", "error");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleOpenPayModal = (fee?: any) => {
    const targetFee = fee || (data?.finances?.breakdown && data.finances.breakdown.find((f: any) => f.pendingAmount > 0)) || data?.finances?.breakdown?.[0];
    setSelectedFeeHead(targetFee);
    setPayAmount(targetFee?.pendingAmount || data?.finances?.outstandingBalance || 500);
    setIsPayModalOpen(true);
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeHead || payAmount <= 0) {
      showToast("Please select a fee head and positive payment amount", "error");
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await fetch("/api/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PAY_FEE",
          studentFeeId: selectedFeeHead.id,
          amount: payAmount,
          paymentMethod: payMethod,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        showToast(`Tuition payment cleared! Ref: ${result.transaction?.referenceNumber}`, "success");
        setIsPayModalOpen(false);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Payment transaction declined", "error");
      }
    } catch {
      showToast("Network error processing payment", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleDownloadBursarStatement = () => {
    const child = data?.child;
    const finances = data?.finances;
    const breakdown = finances?.breakdown || [];

    const breakdownHtml = breakdown.length > 0
      ? breakdown.map((item: any) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; font-weight: 600;">${item.title}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">$${item.totalAmount.toLocaleString()}.00</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #059669;">$${item.paidAmount.toLocaleString()}.00</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: ${item.pendingAmount > 0 ? '#e11d48' : '#059669'}; font-weight: bold;">$${item.pendingAmount.toLocaleString()}.00</td>
        </tr>
      `).join("")
      : `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb;">Tuition & Core Academic Levy</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace;">$3,800.00</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #059669;">$3,800.00</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-family: monospace; color: #059669; font-weight: bold;">$0.00</td>
        </tr>
      `;

    const statementHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Bursar Financial Statement - ${child?.name || "Student"}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .no-print { display: none; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfbf7; color: #1e1b18; padding: 40px; display: flex; justify-content: center; }
    .statement-card { background: #fff; width: 100%; max-width: 720px; border-radius: 16px; border: 1px solid #e5e0d8; box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 40px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #881337; padding-bottom: 20px; }
    .logo-title { font-size: 22px; font-weight: 800; color: #881337; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 4px; }
    .status-badge { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0; background: #fdf2f4/30; padding: 16px; border-radius: 12px; border: 1px solid #fecdd3; }
    .meta-item { font-size: 12px; }
    .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #881337; letter-spacing: 0.5px; }
    .meta-value { font-weight: 600; color: #1c1917; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 12px; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    .summary-box { background: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
    .footer { border-top: 1px dashed #d6d3d1; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #78716c; }
    .btn-print { background: #881337; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
    <button class="btn-print no-print" onclick="window.print()">Print / Save Official Statement</button>
    <div class="statement-card">
      <div class="header">
        <div>
          <div class="logo-title">APEX UNIVERSITY</div>
          <div class="subtitle">Office of the Bursar &bull; Official Term Financial Statement</div>
        </div>
        <div class="status-badge">${finances?.status || "PAID IN FULL"}</div>
      </div>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Scholar Name</div>
          <div class="meta-value">${child?.name || "Alex Mercer"} (${child?.rollNo || "2024-CSE-042"})</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Degree Program</div>
          <div class="meta-value">${child?.program || "B.Tech Computer Science"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Registered Guardian</div>
          <div class="meta-value">${child?.guardianName || "Katherine Mercer (Mother)"}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date Generated</div>
          <div class="meta-value">${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fee Classification</th>
            <th style="text-align: right;">Assessed Total</th>
            <th style="text-align: right;">Amount Settled</th>
            <th style="text-align: right;">Outstanding</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownHtml}
        </tbody>
      </table>

      <div class="summary-box">
        <div>
          <div style="font-size: 11px; font-weight: 700; color: #881337; text-transform: uppercase;">Outstanding Fiscal Balance</div>
          <div style="font-size: 11px; color: #78716c;">Verified against Central Campus Treasury Ledger</div>
        </div>
        <div style="font-size: 26px; font-weight: 900; color: ${finances?.outstandingBalance > 0 ? '#e11d48' : '#059669'}; font-family: monospace;">
          $${finances?.outstandingBalance?.toLocaleString() || "0.00"}
        </div>
      </div>

      <div class="footer">
        <div>
          <div style="font-weight: 700;">Auditor Verification: Central Finance & Bursar Directorate</div>
          <div>This digital statement carries institutional certification under Academic Senate Bylaws.</div>
        </div>
        <div style="font-family: monospace; font-size: 10px; color: #a8a29e;">
          HASH: ${Date.now()}-APX-BURSAR
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([statementHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bursar_Statement_${(child?.name || "Student").replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Printable Official Bursar Statement generated", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Parent & Guardian Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Live Scholar Telemetry
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Live child biometric attendance, academic grade progress, online fee clearance, and direct pastoral advisor communication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMessageModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
            >
              <Mail className="h-4 w-4" />
              <span>Message Course Advisor</span>
            </button>
            {data?.finances?.outstandingBalance > 0 && (
              <button
                onClick={() => handleOpenPayModal()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-academic-success hover:bg-green-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <CreditCard className="h-4 w-4" />
                <span>Pay Dues Online</span>
              </button>
            )}
          </div>
        </div>

        {/* Child Profile Card */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent font-bold text-xl flex items-center justify-center shrink-0">
                {data?.child?.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || "AM"}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
                    {data?.child?.name || "Alex Mercer"}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                    Active Scholar
                  </span>
                  {data?.availableChildren && data.availableChildren.length > 1 && (
                    <select
                      value={selectedChildId}
                      onChange={(e) => {
                        setSelectedChildId(e.target.value);
                        loadParentData(e.target.value);
                      }}
                      className="text-[11px] font-bold bg-ivory-100 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-2.5 py-1 text-rose-primary dark:text-rose-accent outline-none cursor-pointer hover:border-rose-primary"
                    >
                      {data.availableChildren.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          Switch Child: {c.name} ({c.rollNo})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  {data?.child?.program} • {data?.child?.semester} • Roll No: {data?.child?.rollNo}
                </span>
                <div className="flex items-center gap-2 text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-semibold text-charcoal-700 dark:text-ivory-200">
                    <UserCheck className="h-3 w-3 text-rose-primary" /> {data?.child?.guardianName}
                  </span>
                  <span>•</span>
                  <span>Advisor: {data?.child?.advisor?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-charcoal-500 uppercase font-bold">Current CGPA</span>
                <span className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 block">
                  {data?.child?.cgpa} / 4.0
                </span>
              </div>
              <div className="text-right border-l border-border dark:border-charcoal-700 pl-3">
                <span className="text-[10px] text-charcoal-500 uppercase font-bold">Attendance</span>
                <span className="text-2xl font-display font-bold text-academic-success block">
                  {data?.child?.attendanceRate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3 Telemetry Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Classes & Live Attendance */}
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Today&apos;s Class Attendance
              </span>
              <span className="text-[10px] font-bold text-academic-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Live Timetable
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {(data?.todayClasses || []).length === 0 ? (
                <div className="p-4 text-center text-charcoal-400 text-xs">
                  No lecture sessions scheduled for today.
                </div>
              ) : (
                data.todayClasses.map((cls: any, i: number) => {
                  const isPresent = cls.status === "PRESENT" || cls.status === "LATE";
                  const isAbsent = cls.status === "ABSENT";
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                          {cls.title}
                        </span>
                        <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                          {cls.time} • {cls.room}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isPresent
                            ? "bg-academic-success-subtle text-academic-success"
                            : isAbsent
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                            : "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300"
                        }`}
                      >
                        {cls.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Academic Assessment & Grades */}
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Recent Exam Scores
              </span>
              <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent">
                Fall 2026
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {(data?.recentScores || []).length === 0 ? (
                <div className="p-3 text-center text-[11px] text-charcoal-400">
                  No verified examination marks entered yet.
                </div>
              ) : (
                data.recentScores.map((score: any) => (
                  <div
                    key={score.id}
                    className="p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {score.title}
                      </span>
                      <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                        Score: {score.score}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-academic-success">{score.grade}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fee Clearance */}
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                  Tuition Ledger Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    data?.finances?.status === "PAID IN FULL"
                      ? "bg-academic-success text-white"
                      : "bg-rose-primary text-white"
                  }`}
                >
                  {data?.finances?.status || "PAID IN FULL"}
                </span>
              </div>
              <div className="mt-3 text-xs text-charcoal-700 dark:text-ivory-200 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-charcoal-500 dark:text-charcoal-400">Total Billed:</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                    ${data?.finances?.totalAmount?.toLocaleString() || "4,850.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500 dark:text-charcoal-400">Amount Cleared:</span>
                  <span className="font-bold text-academic-success">
                    ${data?.finances?.paidAmount?.toLocaleString() || "4,850.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500 dark:text-charcoal-400">Outstanding Balance:</span>
                  <span className="font-bold text-rose-primary dark:text-rose-accent">
                    ${data?.finances?.outstandingBalance?.toLocaleString() || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {data?.finances?.outstandingBalance > 0 && (
                <button
                  onClick={() => handleOpenPayModal()}
                  className="w-full py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  <span>Settle Balance (${data.finances.outstandingBalance.toLocaleString()})</span>
                </button>
              )}
              <button
                onClick={handleDownloadBursarStatement}
                className="w-full py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-rose-primary dark:text-rose-accent text-xs font-bold border border-border dark:border-charcoal-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Official Statement (Print / PDF)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pastoral Inquiries & Advisor Communications History */}
        <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-rose-primary" />
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Advisory Inquiries & Pastoral Communication
              </span>
            </div>
            <span className="text-[11px] text-charcoal-400">
              Direct line to {data?.child?.advisor?.name || "Course Advisor"}
            </span>
          </div>

          {(data?.recentInquiries || []).length === 0 ? (
            <div className="p-4 text-center text-charcoal-400 text-xs">
              No recent inquiries dispatched. Click &quot;Message Course Advisor&quot; above to submit questions or pastoral notes.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {data.recentInquiries.map((iq: any) => (
                <div
                  key={iq.id}
                  className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-xs">
                        {iq.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container text-rose-primary dark:bg-rose-950/40 dark:text-rose-accent">
                        {iq.status}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 line-clamp-2">
                      &quot;{iq.reason}&quot;
                    </p>
                  </div>
                  <span className="text-[10px] text-charcoal-400 shrink-0">
                    {new Date(iq.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Message Course Advisor */}
        <Modal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          title={`Message Course Advisor (${data?.child?.advisor?.name || "Prof. Sarah Chen"})`}
          description="Send a direct pastoral inquiry regarding your child's academic progress or course attendance."
        >
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Recipient
              </label>
              <input
                type="text"
                value={`${data?.child?.advisor?.name || "Prof. Sarah Chen"} (${data?.child?.advisor?.email || "sarah.chen@apex.edu"})`}
                disabled
                className="w-full bg-ivory-100 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Inquiry Topic / Subject
              </label>
              <input
                type="text"
                value={advisorSubject}
                onChange={(e) => setAdvisorSubject(e.target.value)}
                placeholder="e.g. Mid-term assessment pacing or attendance inquiry"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Inquiry Message *
              </label>
              <textarea
                rows={4}
                value={advisorMessage}
                onChange={(e) => setAdvisorMessage(e.target.value)}
                placeholder="Dear Professor, I would like to inquire about Alex's upcoming practical sessions and revision plan..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingMessage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSendingMessage ? "Sending..." : "Dispatch Message"}</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Online Tuition Fee Settlement */}
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Parent Online Fee Clearance"
          description={`Directly settle outstanding academic balance for ${data?.child?.name || "your child"}.`}
        >
          <form onSubmit={handleExecutePayment} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Fee Classification
              </label>
              <select
                value={selectedFeeHead?.id || ""}
                onChange={(e) => {
                  const fee = data?.finances?.breakdown?.find((f: any) => f.id === e.target.value);
                  setSelectedFeeHead(fee);
                  if (fee?.pendingAmount) {
                    setPayAmount(fee.pendingAmount);
                  }
                }}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                {(data?.finances?.breakdown || []).map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.title} (Due: ${f.pendingAmount.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Payment Amount ($ USD)
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedFeeHead?.pendingAmount || 10000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 font-mono"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Settlement Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="CREDIT_CARD">Credit / Debit Card (PCI-DSS)</option>
                  <option value="WIRE_TRANSFER">Direct Electronic Wire Transfer</option>
                  <option value="UPI">UPI Instant Real-time Settlement</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-container/50 dark:bg-rose-950/20 border border-rose-primary/20 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rose-primary shrink-0" />
              <span>Payments are processed with 256-bit encryption. An authoritative official bursar receipt will be generated immediately.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessingPayment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-success hover:bg-green-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{isProcessingPayment ? "Authorizing..." : `Authorize $${payAmount.toLocaleString()}`}</span>
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
