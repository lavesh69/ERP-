"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
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
} from "lucide-react";

export default function ParentPortalPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh } = useApp();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Message Advisor Modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [advisorMessage, setAdvisorMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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
          message: advisorMessage,
          advisorEmail: data?.child?.advisor?.email,
        }),
      });

      if (res.ok) {
        showToast("Inquiry delivered to Course Advisor's secure portal", "success");
        setIsMessageModalOpen(false);
        setAdvisorMessage("");
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

  const handleDownloadBursarStatement = () => {
    const child = data?.child;
    const finances = data?.finances;

    const content = `=====================================================
            APEX UNIVERSITY BURSAR'S FINANCIAL STATEMENT
=====================================================
Institution: Apex University of Science & Technology
Academic Term: Fall 2026
Student: ${child?.name || "Alex Mercer"} (Roll: ${child?.rollNo || "2024-CSE-042"})
Program: ${child?.program || "B.Tech Computer Science"}
Guardian: ${child?.guardianName || "Katherine Mercer"}
Date Generated: ${new Date().toLocaleDateString()}
Statement Verification Hash: ${Date.now()}-APX-BURSAR-VERIFIED
=====================================================
TUITION & FEE BREAKDOWN:
- Academic Tuition Fee:         $3,800.00
- Computing & AI Lab Levy:        $650.00
- Digital Library & Research:     $250.00
- Campus Infrastructure:          $150.00
-----------------------------------------------------
TOTAL ASSESSED:                 $${finances?.totalAmount?.toLocaleString() || "4,850.00"}
AMOUNT SETTLED:                 $${finances?.paidAmount?.toLocaleString() || "4,850.00"}
OUTSTANDING BALANCE:            $${finances?.outstandingBalance?.toLocaleString() || "0.00"}
STATUS:                         ${finances?.status || "PAID IN FULL"}
=====================================================
Official Seal: Office of the Bursar, Apex University
This electronic statement certifies full fiscal clearance.
=====================================================`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bursar_Statement_${(child?.name || "Alex Mercer").replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Official Bursar Financial Statement downloaded", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
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
                Live child biometric attendance, academic grade progress, pending fees, and faculty communication
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMessageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <Mail className="h-4 w-4" />
            <span>Message Course Advisor</span>
          </button>
        </div>

        {/* Child Profile Card */}
        {isLoading ? (
          <SkeletonCard />
        ) : (
          <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent font-bold text-xl flex items-center justify-center">
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
                <span className="text-[11px] text-charcoal-400 mt-0.5">
                  Guardian on Record: {data?.child?.guardianName} • Advisor: {data?.child?.advisor?.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-charcoal-500 uppercase font-bold">Current CGPA</span>
                <span className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.child?.cgpa} / 4.0
                </span>
              </div>
              <div className="text-right border-l border-border dark:border-charcoal-700 pl-3">
                <span className="text-[10px] text-charcoal-500 uppercase font-bold">Attendance</span>
                <span className="text-2xl font-display font-bold text-academic-success">
                  {data?.child?.attendanceRate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3 Telemetry Summary Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Today's Classes & Attendance Alert */}
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Today&apos;s Class Attendance
              </span>
              <span className="text-[10px] font-bold text-academic-success flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All Attended
              </span>
            </div>
            <div className="flex flex-col gap-2 text-xs">
              {(data?.todayClasses || []).map((cls: any) => (
                <div
                  key={cls.code}
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
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-academic-success-subtle text-academic-success">
                    {cls.status}
                  </span>
                </div>
              ))}
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
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success text-white">
                  {data?.finances?.status || "PAID IN FULL"}
                </span>
              </div>
              <div className="mt-3 text-xs text-charcoal-700 dark:text-ivory-200 flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-charcoal-500 dark:text-charcoal-400">Fall 2026 Total:</span>
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
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                    ${data?.finances?.outstandingBalance?.toLocaleString() || "0.00"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadBursarStatement}
              className="w-full py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-rose-primary dark:text-rose-accent text-xs font-bold border border-border dark:border-charcoal-700 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Bursar Statement</span>
            </button>
          </div>
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
                Inquiry Message
              </label>
              <textarea
                rows={4}
                value={advisorMessage}
                onChange={(e) => setAdvisorMessage(e.target.value)}
                placeholder="Dear Professor, I would like to inquire about Alex's upcoming mid-term exam preparation and practical sessions..."
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
      </div>
    </AppShell>
  );
}
