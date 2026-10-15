"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Building,
  GraduationCap,
  FileCheck,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  DollarSign,
  Award,
  Calendar,
  X,
  FileText,
  UserCheck,
  Globe,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  InternshipApplication,
  InternshipAnalytics,
  NocStatus,
} from "@/lib/careers/internship-engine";

export function InternshipPortalView() {
  const { currentUser, currentRole, showToast } = useApp();
  const [internships, setInternships] = useState<InternshipApplication[]>([]);
  const [analytics, setAnalytics] = useState<InternshipAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showNocModal, setShowNocModal] = useState(false);
  const [showLogbookModal, setShowLogbookModal] = useState(false);
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);

  // Forms
  const [applyForm, setApplyForm] = useState({
    studentId: currentUser?.id || "STD-2025-001",
    rollNumber: (currentUser as any)?.rollNumber || "2025-CS-101",
    studentName: currentUser?.name || currentUser?.fullName || "Aarav Sharma",
    department: "Computer Science & Engineering",
    currentSemester: 6,
    academicYear: "2026-2027",
    companyName: "Microsoft India R&D",
    companyAddress: "Vigyan Nagar, Gachibowli, Hyderabad, Telangana 500032",
    companyWebsite: "https://www.microsoft.com",
    industrySupervisorName: "Ananya Deshmukh (Principal Engineering Manager)",
    industrySupervisorEmail: "adeshmukh@microsoft.com",
    industrySupervisorPhone: "+91 40 6694 0000",
    internshipRole: "Azure Cloud Native Engineering Intern",
    stipendInrPerMonth: 60000,
    startDate: "2026-06-01",
    endDate: "2026-08-15",
    durationWeeks: 10,
    mode: "HYBRID" as "ON_SITE" | "HYBRID" | "REMOTE",
    facultyMentorName: "Dr. Arvind Swaminathan (Assoc. Prof, CSE)",
  });

  const [logbookForm, setLogbookForm] = useState({
    weekNumber: 1,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 86400000 * 6).toISOString().split("T")[0],
    tasksCompleted: "Configured microservice event bus and automated test suites for continuous deployment.",
    hoursWorked: 40,
  });

  const [evalForm, setEvalForm] = useState({
    industryMentorScore: 45,
    facultyVivaScore: 45,
    academicCreditsAwarded: 4,
    evaluatorSignatory: "Prof. S. K. Bose & Department Viva Panel",
  });

  const isCoordinator = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "PLACEMENT_OFFICER",
    "HOD",
    "FACULTY",
    "PRINCIPAL",
  ].includes(currentRole);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/careers/internships");
      const json = await res.json();
      if (json.success) {
        setInternships(json.data.internships || []);
        setAnalytics(json.data.analytics || null);
      }
    } catch {
      showToast?.("Error fetching internship registry records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/careers/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY",
          ...applyForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Internship application registered! Pending University NOC.", "success");
        setShowApplyModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to submit application", "error");
      }
    } catch {
      showToast?.("Network error submitting internship application", "error");
    }
  };

  const handleIssueNoc = async (applicationId: string) => {
    try {
      const res = await fetch("/api/careers/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_NOC",
          applicationId,
          authorizedSignatory: "Prof. S. K. Bose (Dean, Corporate Relations & T&P)",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("University NOC issued with statutory certificate number!", "success");
        setShowNocModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to issue NOC", "error");
      }
    } catch {
      showToast?.("Network error issuing NOC", "error");
    }
  };

  const handleLogWeek = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const res = await fetch("/api/careers/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_WEEK",
          applicationId: selectedApp.id,
          ...logbookForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.(`Week ${logbookForm.weekNumber} progress logbook recorded!`, "success");
        setShowLogbookModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to log week", "error");
      }
    } catch {
      showToast?.("Network error logging week", "error");
    }
  };

  const handleFinalizeEval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    try {
      const res = await fetch("/api/careers/internships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FINALIZE_EVALUATION",
          applicationId: selectedApp.id,
          ...evalForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Internship viva completed & 4 academic credits transferred to SIS!", "success");
        setShowEvalModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to finalize evaluation", "error");
      }
    } catch {
      showToast?.("Network error finalizing evaluation", "error");
    }
  };

  const filtered = internships.filter((app) => {
    const matchesSearch =
      app.studentName.toLowerCase().includes(search.toLowerCase()) ||
      app.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.companyName.toLowerCase().includes(search.toLowerCase()) ||
      app.internshipRole.toLowerCase().includes(search.toLowerCase()) ||
      app.applicationNo.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "ALL" || app.department === deptFilter;
    const matchesStatus = statusFilter === "ALL" || app.nocStatus === statusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/40 via-neutral-900 to-indigo-950/30 p-6 rounded-2xl border border-blue-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              NEP 2020 Statutory Curricular Mandate
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Corporate Relations & T&P
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            Mandatory Industrial Internship & Apprenticeship Portal
          </h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            University No-Objection Certificate (NOC) issuance, bi-weekly student activity logbooks,
            industry supervisor appraisal, and 4-credit academic degree transfer with tamper-evident seals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Apply For Internship / NOC
          </button>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Interns</span>
              <GraduationCap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalApplications}</div>
            <div className="text-xs text-neutral-400 mt-1">Undergraduate / PG</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">NOCs Cleared</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.nocIssuedCount}</div>
            <div className="text-xs text-emerald-400/80 mt-1">Dean Endorsed</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">In Progress</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{analytics.activeInProgress}</div>
            <div className="text-xs text-neutral-400 mt-1">Active Industry Stints</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Credits Awarded</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{analytics.completedWithCredits}</div>
            <div className="text-xs text-purple-400/80 mt-1">4 Credits in SIS</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Stipends</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">
              ₹{(analytics.totalStipendMobilizedInr / 100000).toFixed(1)}L
            </div>
            <div className="text-xs text-neutral-400 mt-1">Mobilized for Scholars</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Duration</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">{analytics.averageDurationWeeks} Wks</div>
            <div className="text-xs text-neutral-400 mt-1">{analytics.industryPartnersCount} Corporate Partners</div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-neutral-400 uppercase font-semibold">Filter:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science & Engineering">Computer Science</option>
            <option value="Electronics & Communication">Electronics & Comm</option>
            <option value="Mechanical Engineering">Mechanical Engg</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied (Awaiting NOC)</option>
            <option value="NOC_ISSUED">NOC Issued</option>
            <option value="IN_PROGRESS">In Progress (Logbooks Active)</option>
            <option value="CREDITS_AWARDED">Credits Awarded (Completed)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student, company, role..."
            className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400">
                <th className="px-4 py-3">Scholar & Dept</th>
                <th className="px-4 py-3">Corporate Partner & Role</th>
                <th className="px-4 py-3">Duration & Mode</th>
                <th className="px-4 py-3">Stipend</th>
                <th className="px-4 py-3">Status & NOC</th>
                <th className="px-4 py-3">Credits & Viva</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                    No industrial internship records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-neutral-800/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white">{app.studentName}</div>
                      <div className="text-xs text-neutral-400 font-mono">
                        {app.rollNumber} • Sem {app.currentSemester}
                      </div>
                      <div className="text-[11px] text-neutral-500">{app.department}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-200 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-blue-400" />
                        {app.companyName}
                      </div>
                      <div className="text-xs text-neutral-400">{app.internshipRole}</div>
                      <div className="text-[11px] text-neutral-500">Supervisor: {app.industrySupervisorName}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-neutral-300 text-xs font-semibold">{app.durationWeeks} Weeks</div>
                      <div className="text-[11px] text-neutral-400">
                        {app.startDate} to {app.endDate}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300 mt-0.5">
                        {app.mode}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-emerald-400">
                        ₹{app.stipendInrPerMonth.toLocaleString()}
                        <span className="text-[10px] text-neutral-500 font-normal">/mo</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          app.nocStatus === "CREDITS_AWARDED"
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            : app.nocStatus === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : app.nocStatus === "NOC_ISSUED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {app.nocStatus.replace(/_/g, " ")}
                      </span>
                      {app.nocCertificateNumber && (
                        <div className="text-[10px] text-neutral-400 font-mono mt-1">
                          NOC: {app.nocCertificateNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {app.evaluation ? (
                        <div>
                          <div className="font-semibold text-purple-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            Grade: {app.evaluation.grade} ({app.evaluation.totalScore}/100)
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            {app.evaluation.academicCreditsAwarded} Credits Transferred
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-500 italic">Pending Completion</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Dean / Coordinator Action: Issue NOC */}
                        {isCoordinator && app.nocStatus === "APPLIED" && (
                          <button
                            onClick={() => handleIssueNoc(app.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                          >
                            <FileCheck className="w-3 h-3" />
                            Issue NOC
                          </button>
                        )}

                        {/* Student Action: Weekly Logbook */}
                        {["NOC_ISSUED", "IN_PROGRESS"].includes(app.nocStatus) && (
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setLogbookForm({
                                ...logbookForm,
                                weekNumber: (app.logbookEntries.length || 0) + 1,
                              });
                              setShowLogbookModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            + Logbook
                          </button>
                        )}

                        {/* Coordinator / Faculty Action: Finalize Viva */}
                        {isCoordinator &&
                          ["NOC_ISSUED", "IN_PROGRESS"].includes(app.nocStatus) && (
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setShowEvalModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              Viva Voce
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

      {/* MODAL 1: APPLY FOR INTERNSHIP */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                NEP 2020 Industrial Internship Application
              </h3>
              <button onClick={() => setShowApplyModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Scholar Roll Number</label>
                  <input
                    type="text"
                    required
                    value={applyForm.rollNumber}
                    onChange={(e) => setApplyForm({ ...applyForm, rollNumber: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Scholar Full Name</label>
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
                  <label className="text-neutral-300 font-semibold">Department</label>
                  <select
                    value={applyForm.department}
                    onChange={(e) => setApplyForm({ ...applyForm, department: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engg</option>
                    <option value="Electronics & Communication">Electronics & Comm</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Current Semester</label>
                  <input
                    type="number"
                    min="4"
                    max="8"
                    value={applyForm.currentSemester}
                    onChange={(e) => setApplyForm({ ...applyForm, currentSemester: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Hiring Organization / Corporate Partner</label>
                <input
                  type="text"
                  required
                  value={applyForm.companyName}
                  onChange={(e) => setApplyForm({ ...applyForm, companyName: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Internship Designation / Role</label>
                  <input
                    type="text"
                    required
                    value={applyForm.internshipRole}
                    onChange={(e) => setApplyForm({ ...applyForm, internshipRole: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Monthly Stipend (INR)</label>
                  <input
                    type="number"
                    step="1000"
                    value={applyForm.stipendInrPerMonth}
                    onChange={(e) => setApplyForm({ ...applyForm, stipendInrPerMonth: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Work Mode</label>
                  <select
                    value={applyForm.mode}
                    onChange={(e) => setApplyForm({ ...applyForm, mode: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                    <option value="REMOTE">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Faculty Mentor</label>
                  <input
                    type="text"
                    value={applyForm.facultyMentorName}
                    onChange={(e) => setApplyForm({ ...applyForm, facultyMentorName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                >
                  Register & Request University NOC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUBMIT WEEKLY LOGBOOK */}
      {showLogbookModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Submit Weekly Training Logbook
              </h3>
              <button onClick={() => setShowLogbookModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <div><span className="text-neutral-500">Student:</span> {selectedApp.studentName} ({selectedApp.rollNumber})</div>
              <div><span className="text-neutral-500">Company:</span> {selectedApp.companyName} ({selectedApp.internshipRole})</div>
            </div>

            <form onSubmit={handleLogWeek} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Week Number</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={logbookForm.weekNumber}
                    onChange={(e) => setLogbookForm({ ...logbookForm, weekNumber: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Hours Worked</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={logbookForm.hoursWorked}
                    onChange={(e) => setLogbookForm({ ...logbookForm, hoursWorked: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Engineering Tasks & Learning Deliverables</label>
                <textarea
                  required
                  rows={4}
                  value={logbookForm.tasksCompleted}
                  onChange={(e) => setLogbookForm({ ...logbookForm, tasksCompleted: e.target.value })}
                  placeholder="Detail systems built, APIs integrated, unit tests authored, algorithms evaluated..."
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowLogbookModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
                >
                  Save Logbook Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FINALIZE EVALUATION & AWARD CREDITS */}
      {showEvalModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                Internship Viva Voce & Academic Credit Award
              </h3>
              <button onClick={() => setShowEvalModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFinalizeEval} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Industry Mentor Score (out of 50)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={evalForm.industryMentorScore}
                    onChange={(e) =>
                      setEvalForm({ ...evalForm, industryMentorScore: Number(e.target.value) })
                    }
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Faculty Viva Score (out of 50)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={evalForm.facultyVivaScore}
                    onChange={(e) => setEvalForm({ ...evalForm, facultyVivaScore: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 text-purple-300">
                <div className="font-semibold">
                  Total Composite Score: {evalForm.industryMentorScore + evalForm.facultyVivaScore} / 100
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Degree Credits Transferred to SIS: {evalForm.academicCreditsAwarded} Credits
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Examination Board Signatory</label>
                <input
                  type="text"
                  value={evalForm.evaluatorSignatory}
                  onChange={(e) => setEvalForm({ ...evalForm, evaluatorSignatory: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEvalModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg"
                >
                  Finalize & Seal Academic Credits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
