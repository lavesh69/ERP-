"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  BoSProposal,
  BoSAnalytics,
  CourseModification,
} from "@/lib/curriculum/bos-engine";

export function BoSGovernanceView() {
  const { currentUser, currentRole, showToast } = useApp();
  const [proposals, setProposals] = useState<BoSProposal[]>([]);
  const [analytics, setAnalytics] = useState<BoSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddModModal, setShowAddModModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<BoSProposal | null>(null);

  // Forms
  const [createForm, setCreateForm] = useState({
    department: "Computer Science & Engineering",
    regulation: "Regulation R2026 - NEP 2020 CBCS Scheme",
    chairpersonName: currentUser?.name || currentUser?.fullName || "Dr. Arvind Swaminathan (HOD)",
    externalAcademicNominees: "Prof. Dr. N. K. Sharma (IIT Bombay), Prof. Sunita Sundaram (IISc)",
    industryExpertNominee: "Rajeshwar Rao (Chief Technology Architect, Infosys Labs)",
    alumniNominee: "Meera Krishnan (Principal Systems Engineer, Google Cloud)",
    meetingDate: new Date().toISOString().split("T")[0],
  });

  const [modForm, setModForm] = useState({
    type: "NEW_COURSE" as CourseModification["type"],
    courseCode: "CSE-425",
    courseTitle: "Autonomous Agentic AI & Swarm Systems",
    credits: 4,
    ltpPattern: "3-0-2",
    justification: "To address emerging AI agent architectures, tool execution protocols, and memory hierarchies.",
    stakeholderFeedbackRef: "National AI Mission Curriculum Directive 2026",
    prerequisites: "CSE-301 Data Structures, CSE-418 GenAI Systems",
    syllabusUnitsSummary: "Unit I: Agent Foundations; Unit II: Tool Calling & MCP; Unit III: Graph-based Planners; Unit IV: Safety & Self-Healing Workflows.",
  });

  const isCouncilAdmin = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "VICE_CHANCELLOR",
    "DIRECTOR",
    "DEAN_ACADEMICS",
    "REGISTRAR",
    "HOD",
  ].includes(currentRole);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/curriculum/bos");
      const json = await res.json();
      if (json.success) {
        setProposals(json.data.proposals || []);
        setAnalytics(json.data.analytics || null);
      }
    } catch {
      showToast?.("Error fetching BoS governance records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/curriculum/bos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_PROPOSAL",
          ...createForm,
          externalAcademicNominees: createForm.externalAcademicNominees.split(",").map((s) => s.trim()),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("New BoS meeting proposal initialized!", "success");
        setShowCreateModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to create BoS proposal", "error");
      }
    } catch {
      showToast?.("Network error creating BoS proposal", "error");
    }
  };

  const handleAddModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal) return;
    try {
      const res = await fetch("/api/curriculum/bos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_MODIFICATION",
          proposalId: selectedProposal.id,
          ...modForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.(`Course ${modForm.courseCode} added to resolution!`, "success");
        setShowAddModModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to add course modification", "error");
      }
    } catch {
      showToast?.("Network error adding course modification", "error");
    }
  };

  const handleApproveBoS = async (proposalId: string) => {
    try {
      const res = await fetch("/api/curriculum/bos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_BOS",
          proposalId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("BoS resolution endorsed & submitted to Academic Council!", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "BoS approval failed", "error");
      }
    } catch {
      showToast?.("Network error approving BoS proposal", "error");
    }
  };

  const handleRatifyCouncil = async (proposalId: string) => {
    try {
      const res = await fetch("/api/curriculum/bos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RATIFY_COUNCIL",
          proposalId,
          ratifiedBy: "Academic Council (Chaired by Vice-Chancellor & Director)",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Curriculum ratified! Official Gazette notification released.", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Council ratification failed", "error");
      }
    } catch {
      showToast?.("Network error ratifying in Academic Council", "error");
    }
  };

  const filteredProposals = proposals.filter((p) => {
    const matchesSearch =
      p.department.toLowerCase().includes(search.toLowerCase()) ||
      p.resolutionNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.regulation.toLowerCase().includes(search.toLowerCase()) ||
      p.chairpersonName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-950/40 via-neutral-900 to-indigo-950/30 p-6 rounded-2xl border border-teal-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Statutory Curricular Governance
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              UGC / AICTE Regulation Scheme
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-teal-400" />
            Academic Council & Board of Studies (BoS) Portal
          </h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            Departmental Board of Studies (BoS) resolutions, external academic and industry expert consensus,
            syllabus credit restructuring, and Academic Council Vice-Chancellor gazette ratifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isCouncilAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg transition"
            >
              <Plus className="w-4 h-4" />
              Convene Board of Studies
            </button>
          )}
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">BoS Resolutions</span>
              <FileText className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalProposals} Total</div>
            <div className="text-xs text-neutral-400 mt-1">Across Faculties</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Council Ratified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.ratifiedCount} Gazetted</div>
            <div className="text-xs text-emerald-400/80 mt-1">Legally Active</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Awaiting Council</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{analytics.pendingCouncilRatification} Queued</div>
            <div className="text-xs text-neutral-400 mt-1">For Senate Meeting</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">New Courses</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">{analytics.newCoursesIntroduced} Created</div>
            <div className="text-xs text-purple-400/80 mt-1">Industry Aligned</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Courses Revised</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-300">{analytics.coursesRevised} Syllabi</div>
            <div className="text-xs text-neutral-400 mt-1">Modernized Units</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Regulations</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">{analytics.activeRegulationsCount} Active</div>
            <div className="text-xs text-neutral-400 mt-1">R2024 / R2026 NEP</div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-neutral-400 uppercase font-semibold">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft Resolution</option>
            <option value="BOS_APPROVED">BoS Approved (Awaiting Council)</option>
            <option value="ACADEMIC_COUNCIL_RATIFIED">Academic Council Ratified</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department, resolution, course..."
            className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.length === 0 ? (
          <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 p-8 text-center text-neutral-500 text-sm">
            No Board of Studies resolutions found.
          </div>
        ) : (
          filteredProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-6 space-y-4 hover:border-neutral-700 transition"
            >
              {/* Header Info */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-neutral-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                      {proposal.resolutionNumber}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        proposal.status === "ACADEMIC_COUNCIL_RATIFIED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : proposal.status === "BOS_APPROVED"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-neutral-800 text-neutral-300 border border-neutral-700"
                      }`}
                    >
                      {proposal.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-2">{proposal.department}</h3>
                  <div className="text-xs text-neutral-400 font-medium">{proposal.regulation}</div>
                </div>

                <div className="flex flex-col md:items-end gap-1 text-xs text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>BoS Meeting: {proposal.meetingDate}</span>
                  </div>
                  {proposal.ratificationGazetteNumber && (
                    <div className="text-emerald-400 font-mono font-bold">
                      Gazette: {proposal.ratificationGazetteNumber}
                    </div>
                  )}
                  {proposal.ratifiedAt && (
                    <div className="text-[11px] text-neutral-500">
                      Ratified: {new Date(proposal.ratifiedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Nominees Consensus Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Chairperson (HOD)
                  </span>
                  <span className="text-neutral-200 font-medium">{proposal.chairpersonName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    External Academic Nominees (IIT / IISc)
                  </span>
                  <div className="text-neutral-200 font-medium space-y-0.5">
                    {proposal.externalAcademicNominees.map((n, i) => (
                      <div key={i}>{n}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-500 block">
                    Industry & Alumni Experts
                  </span>
                  <div className="text-neutral-200 font-medium">
                    <div>{proposal.industryExpertNominee}</div>
                    <div className="text-neutral-400 text-[11px]">{proposal.alumniNominee}</div>
                  </div>
                </div>
              </div>

              {/* Curricular Modifications Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                    Curricular Additions & Revisions ({proposal.courseModifications.length})
                  </span>
                  {proposal.status === "DRAFT" && isCouncilAdmin && (
                    <button
                      onClick={() => {
                        setSelectedProposal(proposal);
                        setShowAddModModal(true);
                      }}
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Course Modification
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {proposal.courseModifications.map((mod) => (
                    <div
                      key={mod.id}
                      className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex flex-col md:flex-row md:items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              mod.type === "NEW_COURSE"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : mod.type === "SYLLABUS_REVISION"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-neutral-800 text-neutral-300"
                            }`}
                          >
                            {mod.type.replace(/_/g, " ")}
                          </span>
                          <span className="font-bold text-white text-sm">
                            {mod.courseCode}: {mod.courseTitle}
                          </span>
                          <span className="text-neutral-400 font-mono">
                            ({mod.credits} Credits • L-T-P: {mod.ltpPattern})
                          </span>
                        </div>
                        <p className="text-neutral-400 text-xs">{mod.justification}</p>
                        <div className="text-[11px] text-teal-400/90 font-medium">
                          Units: {mod.syllabusUnitsSummary}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Feedback Ref: {mod.stakeholderFeedbackRef}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <div className="text-[10px] font-mono text-neutral-500">
                  BoS Consensus Hash: {proposal.minutesOfMeetingHash.substring(0, 32)}...
                </div>

                <div className="flex items-center gap-2">
                  {/* Department BoS Approval */}
                  {proposal.status === "DRAFT" && isCouncilAdmin && (
                    <button
                      onClick={() => handleApproveBoS(proposal.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition flex items-center gap-1.5 shadow"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve in BoS & Recommend to Council
                    </button>
                  )}

                  {/* Academic Council Ratification */}
                  {proposal.status === "BOS_APPROVED" && isCouncilAdmin && (
                    <button
                      onClick={() => handleRatifyCouncil(proposal.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-lg"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Ratify in Academic Council (VC Seal)
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: CONVENE BOARD OF STUDIES */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-400" />
                Convene Department Board of Studies (BoS)
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold">Department</label>
                <input
                  type="text"
                  required
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Academic Regulation Scheme</label>
                <input
                  type="text"
                  required
                  value={createForm.regulation}
                  onChange={(e) => setCreateForm({ ...createForm, regulation: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">BoS Chairperson (HOD)</label>
                  <input
                    type="text"
                    required
                    value={createForm.chairpersonName}
                    onChange={(e) => setCreateForm({ ...createForm, chairpersonName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={createForm.meetingDate}
                    onChange={(e) => setCreateForm({ ...createForm, meetingDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">External Academic Nominees (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={createForm.externalAcademicNominees}
                  onChange={(e) => setCreateForm({ ...createForm, externalAcademicNominees: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  placeholder="Prof. A (IIT Bombay), Prof. B (IISc)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Industry Expert Nominee</label>
                  <input
                    type="text"
                    required
                    value={createForm.industryExpertNominee}
                    onChange={(e) => setCreateForm({ ...createForm, industryExpertNominee: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Meritorious Alumni Nominee</label>
                  <input
                    type="text"
                    required
                    value={createForm.alumniNominee}
                    onChange={(e) => setCreateForm({ ...createForm, alumniNominee: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg"
                >
                  Convene & Issue Resolution Number
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD COURSE MODIFICATION */}
      {showAddModModal && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                Add Curricular Modification
              </h3>
              <button onClick={() => setShowAddModModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300">
              <span className="text-neutral-500">BoS Resolution:</span> {selectedProposal.resolutionNumber} ({selectedProposal.department})
            </div>

            <form onSubmit={handleAddModification} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Modification Type</label>
                  <select
                    value={modForm.type}
                    onChange={(e) => setModForm({ ...modForm, type: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="NEW_COURSE">New Course Introduction</option>
                    <option value="SYLLABUS_REVISION">Syllabus Content Revision</option>
                    <option value="CREDIT_RESTRUCTURE">Credit Restructure</option>
                    <option value="COURSE_DEPRECATION">Course Deprecation</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Course Code</label>
                  <input
                    type="text"
                    required
                    value={modForm.courseCode}
                    onChange={(e) => setModForm({ ...modForm, courseCode: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Course Title</label>
                <input
                  type="text"
                  required
                  value={modForm.courseTitle}
                  onChange={(e) => setModForm({ ...modForm, courseTitle: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Credits</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={modForm.credits}
                    onChange={(e) => setModForm({ ...modForm, credits: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">L-T-P Pattern</label>
                  <input
                    type="text"
                    value={modForm.ltpPattern}
                    onChange={(e) => setModForm({ ...modForm, ltpPattern: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 font-mono"
                    placeholder="3-0-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Academic Justification</label>
                <textarea
                  rows={2}
                  required
                  value={modForm.justification}
                  onChange={(e) => setModForm({ ...modForm, justification: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Syllabus Units Summary</label>
                <textarea
                  rows={2}
                  required
                  value={modForm.syllabusUnitsSummary}
                  onChange={(e) => setModForm({ ...modForm, syllabusUnitsSummary: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-lg"
                >
                  Add To Resolution Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
