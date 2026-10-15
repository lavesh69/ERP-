"use client";

import React, { useState, useEffect } from "react";
import {
  Utensils,
  Receipt,
  Ticket,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  Search,
  Building,
  DollarSign,
  Leaf,
  ShieldCheck,
  UserCheck,
  X,
  CreditCard,
  QrCode,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  HostelMessRebateApplication,
  MessDiningMealToken,
  MessRebateAnalytics,
  MealType,
  RebateStatus,
} from "@/lib/hostel/mess-rebate-engine";

export default function MessRebateTab() {
  const { currentUser, currentRole, showToast } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<"rebates" | "tokens">("rebates");
  const [rebates, setRebates] = useState<HostelMessRebateApplication[]>([]);
  const [tokens, setTokens] = useState<MessDiningMealToken[]>([]);
  const [analytics, setAnalytics] = useState<MessRebateAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hostelFilter, setHostelFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showGenerateTokenModal, setShowGenerateTokenModal] = useState(false);
  const [selectedRebate, setSelectedRebate] = useState<HostelMessRebateApplication | null>(null);

  // Forms
  const [applyForm, setApplyForm] = useState({
    studentId: currentUser?.id || "STD-2025-001",
    rollNumber: (currentUser as any)?.rollNumber || "2025-CS-101",
    studentName: currentUser?.name || currentUser?.fullName || "Aarav Sharma",
    hostelName: "Aryabhatta Hall of Residence",
    roomNumber: "B-204",
    leaveStartDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    leaveEndDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    leaveReason: "ACADEMIC_INTERNSHIP" as HostelMessRebateApplication["leaveReason"],
    dailyDietRateInr: 160,
  });

  const [reviewForm, setReviewForm] = useState({
    approved: true,
    wardenApprovalNotes: "Official academic leave verified. Mess dining tokens suspended for absence period.",
    wardenSignatory: "Dr. Alok Verma (Chief Warden)",
  });

  const [tokenForm, setTokenForm] = useState({
    studentId: currentUser?.id || "STD-2025-001",
    studentRollNumber: (currentUser as any)?.rollNumber || "2025-CS-101",
    studentName: currentUser?.name || currentUser?.fullName || "Aarav Sharma",
    hostelName: "Aryabhatta Hall of Residence",
    date: new Date().toISOString().split("T")[0],
    mealType: "DINNER" as MealType,
  });

  const isWarden = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "CHIEF_WARDEN",
    "WARDEN",
    "PRINCIPAL",
  ].includes(currentRole);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hostel/mess-rebate");
      const json = await res.json();
      if (json.success) {
        setRebates(json.data.rebates || []);
        setTokens(json.data.tokens || []);
        setAnalytics(json.data.analytics || null);
      }
    } catch {
      showToast?.("Error fetching hostel mess rebate records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleApplyRebate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel/mess-rebate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_REBATE",
          ...applyForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Mess rebate claim registered successfully!", "success");
        setShowApplyModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to submit rebate application", "error");
      }
    } catch {
      showToast?.("Network error applying for mess rebate", "error");
    }
  };

  const handleReviewRebate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRebate) return;
    try {
      const res = await fetch("/api/hostel/mess-rebate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_REBATE",
          rebateId: selectedRebate.id,
          ...reviewForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.(
          reviewForm.approved
            ? "Rebate approved & bursar credit voucher issued!"
            : "Rebate application rejected.",
          "success"
        );
        setShowReviewModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to review rebate", "error");
      }
    } catch {
      showToast?.("Network error reviewing rebate", "error");
    }
  };

  const handleBursarCredit = async (rebateId: string) => {
    try {
      const res = await fetch("/api/hostel/mess-rebate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREDIT_BURSAR",
          rebateId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Mess rebate credited to student bursar ledger account!", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to credit bursar", "error");
      }
    } catch {
      showToast?.("Network error crediting bursar", "error");
    }
  };

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel/mess-rebate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_TOKEN",
          ...tokenForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Dining meal token generated with QR authentication seal!", "success");
        setShowGenerateTokenModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to generate dining token", "error");
      }
    } catch {
      showToast?.("Network error generating token", "error");
    }
  };

  const handleConsumeToken = async (tokenId: string) => {
    try {
      const res = await fetch("/api/hostel/mess-rebate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONSUME_TOKEN",
          tokenId,
          messManager: currentUser?.name || "Mess Supervisor",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Dining token verified & consumed at mess turnstile!", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to consume meal token", "error");
      }
    } catch {
      showToast?.("Network error verifying token", "error");
    }
  };

  // Filtered
  const filteredRebates = rebates.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rebateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHostel = hostelFilter === "ALL" || r.hostelName === hostelFilter;
    const matchesStatus = statusFilter === "ALL" || r.approvalStatus === statusFilter;
    return matchesSearch && matchesHostel && matchesStatus;
  });

  const filteredTokens = tokens.filter((t) => {
    return (
      t.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.studentRollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate live days in apply form
  const applyStart = new Date(applyForm.leaveStartDate);
  const applyEnd = new Date(applyForm.leaveEndDate);
  const diffDays = Math.ceil((applyEnd.getTime() - applyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const estAmount = diffDays > 0 ? diffDays * applyForm.dailyDietRateInr : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-rose-950/40 via-neutral-900 to-amber-950/30 p-6 rounded-2xl border border-rose-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Hostel Welfare & Sustainability
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SDG-12 Zero Food Waste
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-rose-400" />
            Hostel Mess Rebate & Dining Token Engine
          </h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Automated collegiate diet rebate calculation for absences $\ge 3$ days, warden verification,
            bursar credit ledger sync, and turnstile meal token suspension preventing kitchen food waste.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Apply For Mess Rebate
          </button>
          <button
            onClick={() => setShowGenerateTokenModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            <Ticket className="w-4 h-4 text-amber-400" />
            Issue Meal Token
          </button>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Claims Filed</span>
              <Receipt className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalRebatesClaimed}</div>
            <div className="text-xs text-neutral-400 mt-1">Absences $\ge 3$ Days</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Approved</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.approvedRebates}</div>
            <div className="text-xs text-emerald-400/80 mt-1">Warden Endorsed</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Rebate Value</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">₹{analytics.totalRebateAmountInr.toLocaleString()}</div>
            <div className="text-xs text-amber-400/80 mt-1">Bursar Diet Credits</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Tokens Suspended</span>
              <Ticket className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-300">{analytics.activeSuspendedTokens}</div>
            <div className="text-xs text-neutral-400 mt-1">Locked on Leave</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Food Saved</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">{analytics.kitchenFoodWasteSavedKg} kg</div>
            <div className="text-xs text-emerald-400/80 mt-1">Surplus Avoided</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Absence</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{analytics.averageLeaveDays} Days</div>
            <div className="text-xs text-neutral-400 mt-1">Per Claim</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("rebates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "rebates"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            }`}
          >
            <Receipt className="w-4 h-4" />
            Mess Diet Rebate Applications ({rebates.length})
          </button>
          <button
            onClick={() => setActiveSubTab("tokens")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeSubTab === "tokens"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            }`}
          >
            <Ticket className="w-4 h-4" />
            Meal Dining Tokens & Turnstile Seals ({tokens.length})
          </button>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, roll, rebate #..."
            className="w-full bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-1.5 rounded-xl text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* SUBTAB 1: REBATE APPLICATIONS */}
      {activeSubTab === "rebates" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-400 uppercase font-semibold">Filter:</span>
            <select
              value={hostelFilter}
              onChange={(e) => setHostelFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Hostels</option>
              <option value="Aryabhatta Hall of Residence">Aryabhatta Hall</option>
              <option value="Gargi Hall of Residence">Gargi Hall</option>
              <option value="APJ Abdul Kalam Hostel">APJ Abdul Kalam Hostel</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="WARDEN_APPROVED">Warden Approved</option>
              <option value="BURSAR_CREDITED">Bursar Credited</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400">
                    <th className="px-4 py-3">Rebate Number</th>
                    <th className="px-4 py-3">Student & Hostel</th>
                    <th className="px-4 py-3">Leave Period</th>
                    <th className="px-4 py-3">Days & Diet Credit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredRebates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                        No mess rebate claims found.
                      </td>
                    </tr>
                  ) : (
                    filteredRebates.map((reb) => (
                      <tr key={reb.id} className="hover:bg-neutral-800/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-semibold text-neutral-200">{reb.rebateNumber}</div>
                          <div className="text-[11px] text-neutral-500">{reb.leaveReason.replace(/_/g, " ")}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white">{reb.studentName}</div>
                          <div className="text-xs text-neutral-400 font-mono">
                            {reb.rollNumber} • {reb.hostelName} ({reb.roomNumber})
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-neutral-300 text-xs">
                            {reb.leaveStartDate} to {reb.leaveEndDate}
                          </div>
                          <div className="text-[11px] text-neutral-500">Ref: {reb.leaveApplicationRef}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-amber-300">₹{reb.calculatedRebateAmountInr.toLocaleString()}</div>
                          <div className="text-[11px] text-neutral-400">
                            {reb.daysAbsent} days @ ₹{reb.dailyDietRateInr}/day
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              reb.approvalStatus === "BURSAR_CREDITED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : reb.approvalStatus === "WARDEN_APPROVED"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : reb.approvalStatus === "SUBMITTED"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            {reb.approvalStatus.replace(/_/g, " ")}
                          </span>
                          {reb.bursarCreditVoucherNo && (
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                              {reb.bursarCreditVoucherNo}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isWarden && reb.approvalStatus === "SUBMITTED" && (
                              <button
                                onClick={() => {
                                  setSelectedRebate(reb);
                                  setShowReviewModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition"
                              >
                                Review Claim
                              </button>
                            )}

                            {reb.approvalStatus === "WARDEN_APPROVED" && (
                              <button
                                onClick={() => handleBursarCredit(reb.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                Credit to Bursar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DINING TOKENS */}
      {activeSubTab === "tokens" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTokens.map((tok) => (
              <div
                key={tok.id}
                className="bg-neutral-900/70 p-5 rounded-2xl border border-neutral-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                      {tok.mealType}
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">{tok.tokenNumber}</h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      {tok.studentName} ({tok.studentRollNumber})
                    </p>
                  </div>
                  <Ticket className="w-6 h-6 text-amber-400 shrink-0" />
                </div>

                <div className="text-xs space-y-1 text-neutral-400 border-t border-neutral-800 pt-3">
                  <div>
                    <span className="text-neutral-500">Hostel Dining:</span>{" "}
                    <span className="text-neutral-300">{tok.hostelName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Meal Date:</span>{" "}
                    <span className="text-neutral-300 font-mono">{tok.date}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Token Status:</span>{" "}
                    <span
                      className={`font-semibold ${
                        tok.status === "ACTIVE"
                          ? "text-emerald-400"
                          : tok.status === "CONSUMED"
                          ? "text-neutral-400"
                          : "text-rose-400"
                      }`}
                    >
                      {tok.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Turnstile QR Digest Seal
                  </div>
                  <div className="text-[11px] font-mono text-neutral-300 break-all select-all">
                    {tok.qrDigest}
                  </div>
                </div>

                {tok.status === "ACTIVE" && (
                  <button
                    onClick={() => handleConsumeToken(tok.id)}
                    className="w-full mt-2 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    Verify & Mark Consumed
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: APPLY FOR MESS REBATE */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                Apply for Hostel Mess Diet Rebate
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Hostel statutes mandate a minimum of 3 consecutive absent days to qualify for dining diet
              rebates. Corresponding dining tokens will be suspended upon warden endorsement.
            </p>

            <form onSubmit={handleApplyRebate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    value={applyForm.rollNumber}
                    onChange={(e) => setApplyForm({ ...applyForm, rollNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={applyForm.studentName}
                    onChange={(e) => setApplyForm({ ...applyForm, studentName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Hostel Residence</label>
                  <select
                    value={applyForm.hostelName}
                    onChange={(e) => setApplyForm({ ...applyForm, hostelName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="Aryabhatta Hall of Residence">Aryabhatta Hall</option>
                    <option value="Gargi Hall of Residence">Gargi Hall</option>
                    <option value="APJ Abdul Kalam Hostel">APJ Abdul Kalam Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Room Number</label>
                  <input
                    type="text"
                    required
                    value={applyForm.roomNumber}
                    onChange={(e) => setApplyForm({ ...applyForm, roomNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Leave Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.leaveStartDate}
                    onChange={(e) => setApplyForm({ ...applyForm, leaveStartDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Leave End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.leaveEndDate}
                    onChange={(e) => setApplyForm({ ...applyForm, leaveEndDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Official Reason for Absence</label>
                <select
                  value={applyForm.leaveReason}
                  onChange={(e) =>
                    setApplyForm({
                      ...applyForm,
                      leaveReason: e.target.value as HostelMessRebateApplication["leaveReason"],
                    })
                  }
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                >
                  <option value="ACADEMIC_INTERNSHIP">Academic Internship / Fieldwork</option>
                  <option value="FESTIVAL_RECESS">Mid-Semester / Festival Recess</option>
                  <option value="MEDICAL_LEAVE">Medical Leave (Doctor Advised)</option>
                  <option value="SPORTS_TOURNAMENT">University Sports / Cultural Meet</option>
                  <option value="PERSONAL_EMERGENCY">Family Emergency</option>
                </select>
              </div>

              {/* Live Preview Box */}
              <div
                className={`p-3 rounded-xl border text-xs ${
                  diffDays >= 3
                    ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                    : "bg-rose-950/20 border-rose-800/40 text-rose-300"
                }`}
              >
                <div className="font-semibold">
                  Absence Calculation: {diffDays > 0 ? diffDays : 0} Days (Eligibility Threshold: $\ge 3$ Days)
                </div>
                <div className="text-neutral-400 mt-1">
                  Estimated Diet Rebate Credit: ₹{estAmount.toLocaleString()} (@ ₹{applyForm.dailyDietRateInr}/day)
                </div>
                {diffDays < 3 && (
                  <div className="text-rose-400 font-semibold mt-1">
                    Warning: Less than 3 days does not qualify for statutory mess rebate.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={diffDays < 3}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg"
                >
                  Submit Rebate Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WARDEN REVIEW REBATE */}
      {showReviewModal && selectedRebate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-rose-400" />
                Warden Endorsement & Token Suspension
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <div><span className="text-neutral-500">Rebate No:</span> {selectedRebate.rebateNumber}</div>
              <div><span className="text-neutral-500">Student:</span> {selectedRebate.studentName} ({selectedRebate.rollNumber})</div>
              <div><span className="text-neutral-500">Leave Period:</span> {selectedRebate.leaveStartDate} to {selectedRebate.leaveEndDate} ({selectedRebate.daysAbsent} days)</div>
              <div><span className="text-neutral-500">Rebate Amount:</span> ₹{selectedRebate.calculatedRebateAmountInr.toLocaleString()}</div>
            </div>

            <form onSubmit={handleReviewRebate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300">Decision</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm text-neutral-200">
                    <input
                      type="radio"
                      checked={reviewForm.approved}
                      onChange={() => setReviewForm({ ...reviewForm, approved: true })}
                    />
                    Approve & Issue Credit Voucher
                  </label>
                  <label className="flex items-center gap-2 text-sm text-neutral-200">
                    <input
                      type="radio"
                      checked={!reviewForm.approved}
                      onChange={() => setReviewForm({ ...reviewForm, approved: false })}
                    />
                    Reject Application
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Warden Verification Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={reviewForm.wardenApprovalNotes}
                  onChange={(e) => setReviewForm({ ...reviewForm, wardenApprovalNotes: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Warden Signatory</label>
                <input
                  type="text"
                  required
                  value={reviewForm.wardenSignatory}
                  onChange={(e) => setReviewForm({ ...reviewForm, wardenSignatory: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
                >
                  Submit Endorsement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: GENERATE DAILY MEAL TOKEN */}
      {showGenerateTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" />
                Generate Daily Meal Dining Token
              </h3>
              <button onClick={() => setShowGenerateTokenModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateToken} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={tokenForm.studentRollNumber}
                    onChange={(e) => setTokenForm({ ...tokenForm, studentRollNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Student Name</label>
                  <input
                    type="text"
                    required
                    value={tokenForm.studentName}
                    onChange={(e) => setTokenForm({ ...tokenForm, studentName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Dining Hall</label>
                  <select
                    value={tokenForm.hostelName}
                    onChange={(e) => setTokenForm({ ...tokenForm, hostelName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="Aryabhatta Hall of Residence">Aryabhatta Hall</option>
                    <option value="Gargi Hall of Residence">Gargi Hall</option>
                    <option value="APJ Abdul Kalam Hostel">APJ Abdul Kalam Hostel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Meal Session</label>
                  <select
                    value={tokenForm.mealType}
                    onChange={(e) => setTokenForm({ ...tokenForm, mealType: e.target.value as MealType })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="BREAKFAST">Breakfast (07:30 - 09:30)</option>
                    <option value="LUNCH">Lunch (12:30 - 14:30)</option>
                    <option value="EVENING_SNACKS">Evening Snacks (17:00 - 18:30)</option>
                    <option value="DINNER">Dinner (19:30 - 21:30)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Meal Date</label>
                <input
                  type="date"
                  required
                  value={tokenForm.date}
                  onChange={(e) => setTokenForm({ ...tokenForm, date: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateTokenModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  Issue Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
