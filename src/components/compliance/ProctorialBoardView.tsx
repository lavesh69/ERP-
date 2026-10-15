"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Gavel,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  UserX,
  X,
  Send,
  Building,
  Award,
  DollarSign,
  AlertTriangle,
  FileCheck2,
} from "lucide-react";
import {
  AntiRaggingAffidavit,
  DisciplinaryIncident,
  ProctorialAnalytics,
  IncidentCategory,
  DisciplinaryVerdict,
} from "@/lib/compliance/proctorial-engine";

export function ProctorialBoardView() {
  const { currentUser, currentRole, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<"incidents" | "affidavits">("incidents");
  const [incidents, setIncidents] = useState<DisciplinaryIncident[]>([]);
  const [affidavits, setAffidavits] = useState<AntiRaggingAffidavit[]>([]);
  const [analytics, setAnalytics] = useState<ProctorialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isScnModalOpen, setIsScnModalOpen] = useState(false);
  const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isAffidavitModalOpen, setIsAffidavitModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<DisciplinaryIncident | null>(null);

  // Forms
  const [reportForm, setReportForm] = useState({
    category: "CAMPUS_MISCONDUCT" as IncidentCategory,
    reportedBy: "Campus Vigilance Security Officer",
    respondentStudentId: "STD-2024-009",
    respondentRollNumber: "2024-CS-009",
    respondentName: "Devansh Patel",
    incidentDate: new Date().toISOString().split("T")[0],
    location: "Academic Block 4 Corridor",
    description: "Unauthorized assembly and defiance of campus security after curfew hours.",
    severity: "MEDIUM" as "LOW" | "MEDIUM" | "SEVERE",
  });

  const [scnForm, setScnForm] = useState({
    chargeSheet: "It has been reported that on the stated date and place you engaged in unauthorized behavior violating Code of Conduct Section 4.2. Explain why disciplinary action should not be taken.",
    replyDeadlineHours: 72,
  });

  const [defenseForm, setDefenseForm] = useState({
    explanationText: "I was present at the location solely to return library books before gate closing and did not take part in any intentional misconduct.",
    witnessStatement: "Confirmed by Library Assistant Mr. K. Sharma who saw respondent checking out at 20:45.",
  });

  const [orderForm, setOrderForm] = useState({
    verdict: "DISCIPLINARY_FINE" as DisciplinaryVerdict,
    penaltyFineInr: 2500,
    suspensionDays: 0,
    communityServiceHours: 10,
    chiefProctorSignatory: "Prof. M. S. Ranganathan (Chief Proctor)",
  });

  const [affidavitForm, setAffidavitForm] = useState({
    studentId: currentUser?.id || "STD-2025-001",
    rollNumber: (currentUser as any)?.rollNumber || "2025-CS-101",
    studentName: currentUser?.name || "Aarav Sharma",
    academicYear: "2026-2027",
    parentGuardianName: "Sunil Sharma",
    parentPhone: "+91 98765 43210",
  });

  const isProctor = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "CHIEF_PROCTOR",
    "PROCTOR",
    "PRINCIPAL",
    "DEAN",
  ].includes(currentRole);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/proctorial");
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data.incidents || []);
        setAffidavits(json.data.affidavits || []);
        setAnalytics(json.data.analytics || null);
      }
    } catch {
      showToast?.("Error fetching proctorial compliance records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const isAnyModalOpen = isReportModalOpen || isScnModalOpen || isDefenseModalOpen || isOrderModalOpen || isAffidavitModalOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsReportModalOpen(false);
        setIsScnModalOpen(false);
        setIsDefenseModalOpen(false);
        setIsOrderModalOpen(false);
        setIsAffidavitModalOpen(false);
      }
    };
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyModalOpen]);

  // Handlers
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/compliance/proctorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REPORT_INCIDENT",
          ...reportForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Incident reported successfully to Proctorial Board", "success");
        setIsReportModalOpen(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to report incident", "error");
      }
    } catch {
      showToast?.("Network error reporting incident", "error");
    }
  };

  const handleIssueScn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await fetch("/api/compliance/proctorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_SCN",
          incidentId: selectedIncident.id,
          chargeSheet: scnForm.chargeSheet,
          replyDeadlineHours: Number(scnForm.replyDeadlineHours),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Show-Cause Notice issued with mandatory countdown", "success");
        setIsScnModalOpen(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to issue SCN", "error");
      }
    } catch {
      showToast?.("Network error issuing SCN", "error");
    }
  };

  const handleSubmitDefense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await fetch("/api/compliance/proctorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_DEFENSE",
          incidentId: selectedIncident.id,
          explanationText: defenseForm.explanationText,
          witnessStatement: defenseForm.witnessStatement,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Defense statement registered for inquiry committee", "success");
        setIsDefenseModalOpen(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to submit defense", "error");
      }
    } catch {
      showToast?.("Network error submitting defense", "error");
    }
  };

  const handlePronounceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      const res = await fetch("/api/compliance/proctorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PRONOUNCE_ORDER",
          incidentId: selectedIncident.id,
          verdict: orderForm.verdict,
          penaltyFineInr: orderForm.penaltyFineInr ? Number(orderForm.penaltyFineInr) : 0,
          suspensionDays: orderForm.suspensionDays ? Number(orderForm.suspensionDays) : 0,
          communityServiceHours: orderForm.communityServiceHours ? Number(orderForm.communityServiceHours) : 0,
          chiefProctorSignatory: orderForm.chiefProctorSignatory,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Proctorial Sanction Order pronounced with cryptographic seal", "success");
        setIsOrderModalOpen(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to pronounce order", "error");
      }
    } catch {
      showToast?.("Network error pronouncing order", "error");
    }
  };

  const handleSubmitAffidavit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/compliance/proctorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_AFFIDAVIT",
          ...affidavitForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("UGC Anti-Ragging Oath Affidavit submitted & cryptographically verified", "success");
        setIsAffidavitModalOpen(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to submit affidavit", "error");
      }
    } catch {
      showToast?.("Network error submitting affidavit", "error");
    }
  };

  // Filtered lists
  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.incidentNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.respondentName.toLowerCase().includes(search.toLowerCase()) ||
      item.respondentRollNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredAffidavits = affidavits.filter((item) => {
    return (
      item.studentName.toLowerCase().includes(search.toLowerCase()) ||
      item.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.antiRaggingReferenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.affidavitId.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-neutral-900 to-amber-950/30 p-6 rounded-2xl border border-red-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
              Statutory University Governance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              UGC 2009 Regulations Compliance
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-red-400" />
            Statutory Anti-Ragging & Proctorial Disciplinary Governance
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Zero-Tolerance Anti-Ragging Affidavit registry, formal Show-Cause Notice issuance,
            student defense proceedings, and Chief Proctor sanction orders with statutory integrity seals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAffidavitModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Sign Anti-Ragging Oath
          </button>
          {isProctor && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              Report Disciplinary Breach
            </button>
          )}
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-red-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Oaths Signed</span>
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalAffidavitsSigned}</div>
            <div className="text-xs text-emerald-400 font-semibold mt-1">100% Verified</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Ragging Rate</span>
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">0.0%</div>
            <div className="text-xs text-neutral-400 mt-1">Zero-Tolerance Enforced</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Incidents</span>
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalIncidentsReported}</div>
            <div className="text-xs text-neutral-400 mt-1">Recorded this Session</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active SCNs</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{analytics.activeShowCauseNotices}</div>
            <div className="text-xs text-amber-400/80 mt-1">72h Notice Window</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Sanction Orders</span>
              <Gavel className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{analytics.ordersExecuted}</div>
            <div className="text-xs text-neutral-400 mt-1">{analytics.exoneratedCases} Exonerated</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Fines Levied</span>
              <DollarSign className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-red-300">₹{analytics.totalFinesLeviedInr.toLocaleString()}</div>
            <div className="text-xs text-red-400 mt-1">Direct Bursar Charge</div>
          </div>
        </div>
      )}

      {/* Main Tab Bar */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "incidents"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            }`}
          >
            <Gavel className="w-4 h-4" />
            Disciplinary Proceedings & Inquiry ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab("affidavits")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === "affidavits"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            UGC Anti-Ragging Affidavit Registry ({affidavits.length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, roll, ID..."
            className="w-full bg-neutral-900 border border-neutral-800 pl-9 pr-3 py-1.5 rounded-xl text-sm text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* TAB 1: INCIDENTS & HEARINGS */}
      {activeTab === "incidents" && (
        <div className="space-y-4">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-neutral-400 uppercase font-semibold">Filter:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="RAGGING_ZERO_TOLERANCE">Anti-Ragging Violations</option>
              <option value="ACADEMIC_DISHONESTY">Academic Dishonesty</option>
              <option value="HOSTEL_PROPERTY_DAMAGE">Hostel Property Damage</option>
              <option value="SUBSTANCE_ABUSE">Substance Abuse</option>
              <option value="CYBER_HARASSMENT">Cyber Harassment</option>
              <option value="CAMPUS_MISCONDUCT">Campus Misconduct</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="REPORTED">Reported</option>
              <option value="SHOW_CAUSE_ISSUED">Show-Cause Issued</option>
              <option value="EXPLANATION_RECEIVED">Defense Received</option>
              <option value="ORDER_EXECUTED">Order Executed</option>
              <option value="EXONERATED">Exonerated</option>
            </select>
          </div>

          {/* Incidents Table */}
          <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400">
                    <th className="px-4 py-3">Incident Number</th>
                    <th className="px-4 py-3">Respondent Student</th>
                    <th className="px-4 py-3">Category & Severity</th>
                    <th className="px-4 py-3">Date & Location</th>
                    <th className="px-4 py-3">Status & Proceedings</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                        No disciplinary incident records found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-neutral-800/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-xs font-semibold text-neutral-200">{inc.incidentNumber}</div>
                          <div className="text-[11px] text-neutral-500">Reported by: {inc.reportedBy}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-white">{inc.respondentName}</div>
                          <div className="text-xs text-neutral-400 font-mono">{inc.respondentRollNumber}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-neutral-300">
                              {inc.category.replace(/_/g, " ")}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold uppercase ${
                              inc.severity === "SEVERE"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : inc.severity === "MEDIUM"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            {inc.severity} Severity
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-neutral-300 text-xs">{inc.incidentDate}</div>
                          <div className="text-[11px] text-neutral-500">{inc.location}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${
                                inc.status === "ORDER_EXECUTED"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : inc.status === "SHOW_CAUSE_ISSUED"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : inc.status === "EXPLANATION_RECEIVED"
                                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                  : inc.status === "EXONERATED"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-neutral-800 text-neutral-300"
                              }`}
                            >
                              {inc.status.replace(/_/g, " ")}
                            </span>
                            {inc.disciplinaryOrder && (
                              <div className="text-[11px] text-neutral-400 font-mono">
                                Verdict: {inc.disciplinaryOrder.verdict}
                                {inc.disciplinaryOrder.penaltyFineInr
                                  ? ` (₹${inc.disciplinaryOrder.penaltyFineInr.toLocaleString()})`
                                  : ""}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Proctor Actions */}
                            {isProctor && inc.status === "REPORTED" && (
                              <button
                                onClick={() => {
                                  setSelectedIncident(inc);
                                  setIsScnModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-600/30 hover:bg-amber-600 text-amber-200 transition"
                              >
                                Issue SCN
                              </button>
                            )}

                            {/* Defense Submission */}
                            {inc.status === "SHOW_CAUSE_ISSUED" && (
                              <button
                                onClick={() => {
                                  setSelectedIncident(inc);
                                  setIsDefenseModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/30 hover:bg-blue-600 text-blue-200 transition"
                              >
                                Submit Defense
                              </button>
                            )}

                            {/* Final Pronouncement */}
                            {isProctor &&
                              ["EXPLANATION_RECEIVED", "SHOW_CAUSE_ISSUED"].includes(inc.status) && (
                                <button
                                  onClick={() => {
                                    setSelectedIncident(inc);
                                    setIsOrderModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1"
                                >
                                  <Gavel className="w-3 h-3" />
                                  Pronounce Order
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

      {/* TAB 2: AFFIDAVITS */}
      {activeTab === "affidavits" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-emerald-300">
                Statutory UGC Anti-Ragging Regulatory Verification Portal
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                All registered undergraduate and postgraduate candidates have submitted electronic affidavits
                in compliance with UGC Regulations on Curbing the Menace of Ragging in Higher Educational Institutions, 2009.
              </p>
            </div>
            <button
              onClick={() => setIsAffidavitModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
            >
              + Submit New Affidavit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAffidavits.map((aff) => (
              <div
                key={aff.id}
                className="bg-neutral-900/70 p-5 rounded-2xl border border-neutral-800 space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      {aff.antiRaggingReferenceNumber}
                    </span>
                    <h4 className="text-base font-bold text-white mt-2">{aff.studentName}</h4>
                    <p className="text-xs text-neutral-400 font-mono">
                      Roll: {aff.rollNumber} | AY {aff.academicYear}
                    </p>
                  </div>
                  <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                </div>

                <div className="text-xs space-y-1 text-neutral-400 border-t border-neutral-800 pt-3">
                  <div>
                    <span className="text-neutral-500">Parent/Guardian:</span>{" "}
                    <span className="text-neutral-300 font-medium">{aff.parentGuardianName}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Emergency Phone:</span>{" "}
                    <span className="text-neutral-300 font-mono">{aff.parentPhone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Signed Date:</span>{" "}
                    <span className="text-neutral-300">
                      {new Date(aff.undertakingSignedDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800/80">
                  <div className="text-[10px] text-neutral-500 uppercase font-semibold">
                    Digital Oath Integrity Seal
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 break-all select-all">
                    {aff.signedOathHash}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: REPORT INCIDENT */}
      {isReportModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report Disciplinary Infraction"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-red-400" />
                Report Disciplinary Infraction
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportIncident} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300">Category of Violation</label>
                <select
                  value={reportForm.category}
                  onChange={(e) => setReportForm({ ...reportForm, category: e.target.value as IncidentCategory })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                >
                  <option value="CAMPUS_MISCONDUCT">Campus Misconduct & Indiscipline</option>
                  <option value="RAGGING_ZERO_TOLERANCE">Anti-Ragging Zero Tolerance</option>
                  <option value="ACADEMIC_DISHONESTY">Academic Dishonesty & Plagiarism</option>
                  <option value="HOSTEL_PROPERTY_DAMAGE">Hostel & Property Damage</option>
                  <option value="SUBSTANCE_ABUSE">Substance Abuse</option>
                  <option value="CYBER_HARASSMENT">Cyber Harassment & Defamation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Respondent Roll No</label>
                  <input
                    type="text"
                    required
                    value={reportForm.respondentRollNumber}
                    onChange={(e) => setReportForm({ ...reportForm, respondentRollNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Respondent Name</label>
                  <input
                    type="text"
                    required
                    value={reportForm.respondentName}
                    onChange={(e) => setReportForm({ ...reportForm, respondentName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Incident Date</label>
                  <input
                    type="date"
                    required
                    value={reportForm.incidentDate}
                    onChange={(e) => setReportForm({ ...reportForm, incidentDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Severity Assessment</label>
                  <select
                    value={reportForm.severity}
                    onChange={(e) => setReportForm({ ...reportForm, severity: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="LOW">Low (First warning)</option>
                    <option value="MEDIUM">Medium (Inquiry required)</option>
                    <option value="SEVERE">Severe (Expulsion risk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Location</label>
                <input
                  type="text"
                  required
                  value={reportForm.location}
                  onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Detailed Description / Charge Summary</label>
                <textarea
                  required
                  rows={3}
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg"
                >
                  Submit Incident to Proctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE SHOW CAUSE NOTICE */}
      {isScnModalOpen && selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Issue Show Cause Notice"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsScnModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Issue Formal Show-Cause Notice
              </h3>
              <button
                onClick={() => setIsScnModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <div><span className="text-neutral-500">Incident:</span> {selectedIncident.incidentNumber}</div>
              <div><span className="text-neutral-500">Respondent:</span> {selectedIncident.respondentName} ({selectedIncident.respondentRollNumber})</div>
            </div>

            <form onSubmit={handleIssueScn} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300">Formal Charge Sheet</label>
                <textarea
                  required
                  rows={4}
                  value={scnForm.chargeSheet}
                  onChange={(e) => setScnForm({ ...scnForm, chargeSheet: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Reply Deadline (Hours)</label>
                <input
                  type="number"
                  min="24"
                  max="168"
                  value={scnForm.replyDeadlineHours}
                  onChange={(e) => setScnForm({ ...scnForm, replyDeadlineHours: Number(e.target.value) })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
                <span className="text-[11px] text-neutral-500">Standard statutory statutory window is 72 hours.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScnModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  Issue SCN & Start Countdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUBMIT DEFENSE */}
      {isDefenseModalOpen && selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submit Student Written Defense"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDefenseModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Submit Student Written Defense
              </h3>
              <button
                onClick={() => setIsDefenseModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDefense} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300">Written Explanation & Justification</label>
                <textarea
                  required
                  rows={4}
                  value={defenseForm.explanationText}
                  onChange={(e) => setDefenseForm({ ...defenseForm, explanationText: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Witness or Corroborating Statement (Optional)</label>
                <textarea
                  rows={2}
                  value={defenseForm.witnessStatement}
                  onChange={(e) => setDefenseForm({ ...defenseForm, witnessStatement: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDefenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                >
                  Register Defense Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PRONOUNCE DISCIPLINARY ORDER */}
      {isOrderModalOpen && selectedIncident && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pronounce Final Disciplinary Order"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOrderModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-purple-400" />
                Pronounce Final Disciplinary Order
              </h3>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePronounceOrder} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300">Sanction Verdict</label>
                <select
                  value={orderForm.verdict}
                  onChange={(e) => setOrderForm({ ...orderForm, verdict: e.target.value as DisciplinaryVerdict })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                >
                  <option value="EXONERATED">Exonerated (All charges cleared)</option>
                  <option value="FORMAL_REPRIMAND">Formal Written Reprimand</option>
                  <option value="DISCIPLINARY_FINE">Disciplinary Monetary Fine</option>
                  <option value="COMMUNITY_SERVICE">Campus Community Service</option>
                  <option value="HOSTEL_SUSPENSION">Hostel Eviction / Suspension</option>
                  <option value="SEMESTER_RUSTICATION">Semester Rustication</option>
                </select>
              </div>

              {orderForm.verdict === "DISCIPLINARY_FINE" && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Penalty Fine (INR)</label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={orderForm.penaltyFineInr}
                    onChange={(e) => setOrderForm({ ...orderForm, penaltyFineInr: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                  <span className="text-[11px] text-neutral-500">
                    Automatically billed to student ledger account in University Bursar.
                  </span>
                </div>
              )}

              {orderForm.verdict === "COMMUNITY_SERVICE" && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Community Service (Hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={orderForm.communityServiceHours}
                    onChange={(e) => setOrderForm({ ...orderForm, communityServiceHours: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              )}

              {["HOSTEL_SUSPENSION", "SEMESTER_RUSTICATION"].includes(orderForm.verdict) && (
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Suspension Duration (Days)</label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    value={orderForm.suspensionDays}
                    onChange={(e) => setOrderForm({ ...orderForm, suspensionDays: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-neutral-300">Chief Proctor Signatory</label>
                <input
                  type="text"
                  value={orderForm.chiefProctorSignatory}
                  onChange={(e) => setOrderForm({ ...orderForm, chiefProctorSignatory: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
                >
                  Execute Order & Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SIGN ANTI-RAGGING AFFIDAVIT */}
      {isAffidavitModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="UGC Anti-Ragging Oath Undertaking"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAffidavitModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                UGC Anti-Ragging Oath Undertaking
              </h3>
              <button
                onClick={() => setIsAffidavitModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              In accordance with the Supreme Court directives and UGC Regulations 2009, each candidate
              and parent must register this digital undertaking affirming zero tolerance toward ragging.
            </p>

            <form onSubmit={handleSubmitAffidavit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Student Roll Number</label>
                  <input
                    type="text"
                    required
                    value={affidavitForm.rollNumber}
                    onChange={(e) => setAffidavitForm({ ...affidavitForm, rollNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Candidate Full Name</label>
                  <input
                    type="text"
                    required
                    value={affidavitForm.studentName}
                    onChange={(e) => setAffidavitForm({ ...affidavitForm, studentName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    value={affidavitForm.parentGuardianName}
                    onChange={(e) => setAffidavitForm({ ...affidavitForm, parentGuardianName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Parent Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={affidavitForm.parentPhone}
                    onChange={(e) => setAffidavitForm({ ...affidavitForm, parentPhone: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs text-neutral-300">
                I hereby declare that I will neither indulge in nor abet ragging in any form on or off
                campus premises. Violation will subject me to criminal prosecution and rustication.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAffidavitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                >
                  Sign Oath & Generate Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
