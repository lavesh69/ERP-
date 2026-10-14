"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Vote,
  Award,
  Users,
  Search,
  Filter,
  RefreshCw,
  FileCheck,
  Printer,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { EthicsProtocol, RiskTier, StudyType } from "@/lib/research/ethics-clearance-engine";

export default function EthicsClearanceTab() {
  const [protocols, setProtocols] = useState<EthicsProtocol[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Vote modal
  const [selectedProtocolForVote, setSelectedProtocolForVote] = useState<EthicsProtocol | null>(null);
  const [voteForm, setVoteForm] = useState({
    memberName: "Dr. Robert Vance, MD",
    role: "CHAIRPERSON" as const,
    decision: "APPROVE" as "APPROVE" | "REVISE" | "REJECT",
    remarks: "Protocol methodology and informed consent disclosures meet ethical guidelines.",
  });
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Certificate modal
  const [certificateProtocol, setCertificateProtocol] = useState<EthicsProtocol | null>(null);

  // Submit protocol modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    principalInvestigator: "",
    piEmail: "",
    department: "Biomedical Engineering & Medicine",
    riskTier: "EXPEDITED" as RiskTier,
    studyType: "HUMAN_SUBJECTS" as StudyType,
    vulnerablePopulationsInvolved: false,
    dataPrivacyProtocol: "",
  });
  const [isSubmittingProtocol, setIsSubmittingProtocol] = useState(false);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/research/ethics-clearance");
      if (res.ok) {
        const data = await res.json();
        setProtocols(data.protocols || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to load ethics protocols:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProtocols();
  }, []);

  const handleCastVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtocolForVote) return;
    setIsSubmittingVote(true);
    try {
      const res = await fetch("/api/research/ethics-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CAST_VOTE",
          protocolId: selectedProtocolForVote.id,
          ...voteForm,
        }),
      });
      if (res.ok) {
        setSelectedProtocolForVote(null);
        fetchProtocols();
      }
    } catch (err) {
      console.error("Failed to cast vote:", err);
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleRegisterProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProtocol(true);
    try {
      const res = await fetch("/api/research/ethics-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_PROTOCOL",
          ...submitForm,
        }),
      });
      if (res.ok) {
        setShowSubmitModal(false);
        setSubmitForm({
          title: "",
          principalInvestigator: "",
          piEmail: "",
          department: "Biomedical Engineering & Medicine",
          riskTier: "EXPEDITED",
          studyType: "HUMAN_SUBJECTS",
          vulnerablePopulationsInvolved: false,
          dataPrivacyProtocol: "",
        });
        fetchProtocols();
      }
    } catch (err) {
      console.error("Failed to submit protocol:", err);
    } finally {
      setIsSubmittingProtocol(false);
    }
  };

  const filteredProtocols = protocols.filter((p) => {
    if (tierFilter !== "ALL" && p.riskTier !== tierFilter) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        p.id.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.principalInvestigator.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 IRB Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Registered Protocols</span>
            <ShieldCheck className="h-4 w-4 text-rose-primary" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.total || protocols.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Belmont Report & GCP Standard</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Cleared & Certified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.approved || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Cryptographic seals assigned</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Under Board Review</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-2">
            {analytics?.underReview || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Multi-member quorum voting</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Full Board Quorums</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {analytics?.fullBoard || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">High-risk clinical & biosafety</p>
        </div>
      </div>

      {/* Filter and Register Bar */}
      <div className="glass-panel p-4 rounded-2xl shadow-soft border border-border dark:border-charcoal-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search protocol ID, title, or principal investigator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="EXEMPT">Exempt (Minimal Risk)</option>
            <option value="EXPEDITED">Expedited Review</option>
            <option value="FULL_BOARD_REVIEW">Full Board Review</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved & Cleared</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="REVISIONS_REQUESTED">Revisions Requested</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Protocol</span>
        </button>
      </div>

      {/* Protocols Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-charcoal-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading IRB ethics registry...
        </div>
      ) : filteredProtocols.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl border border-dashed border-border dark:border-charcoal-800">
          <ShieldCheck className="h-10 w-10 text-charcoal-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-charcoal-800 dark:text-ivory-200">No Protocols Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">Adjust filters or register a research ethics protocol.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft/80 dark:bg-charcoal-900/80 border-b border-border dark:border-charcoal-800 text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Protocol ID & Title</th>
                  <th className="py-3 px-4">Principal Investigator</th>
                  <th className="py-3 px-4">Risk Tier & Type</th>
                  <th className="py-3 px-4">IRB Status</th>
                  <th className="py-3 px-4">Board Quorum</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800/60">
                {filteredProtocols.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-soft/40 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-mono text-[10px] font-bold text-rose-primary">{p.id}</div>
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1 mt-0.5">{p.title}</div>
                      <div className="text-[10px] text-charcoal-500 line-clamp-1 mt-0.5">{p.dataPrivacyProtocol}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-charcoal-800 dark:text-ivory-200">{p.principalInvestigator}</div>
                      <div className="text-[10px] text-charcoal-500">{p.department}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.riskTier === "FULL_BOARD_REVIEW"
                            ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
                            : p.riskTier === "EXPEDITED"
                            ? "bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                            : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
                        }`}
                      >
                        {p.riskTier.replace(/_/g, " ")}
                      </span>
                      <div className="text-[10px] text-charcoal-500 mt-1">{p.studyType.replace(/_/g, " ")}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          p.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : p.status === "REVISIONS_REQUESTED"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {p.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                        {p.status}
                      </span>
                      {p.ethicsClearanceSeal && (
                        <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                          SEALED
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] font-semibold text-charcoal-700 dark:text-ivory-300">
                        {p.boardVotes.length} Member{p.boardVotes.length === 1 ? "" : "s"} Voted
                      </div>
                      <div className="flex gap-1 mt-1">
                        {p.boardVotes.map((v, i) => (
                          <span
                            key={i}
                            title={`${v.memberName} (${v.role}): ${v.decision}`}
                            className={`w-2.5 h-2.5 rounded-full ${
                              v.decision === "APPROVE"
                                ? "bg-emerald-500"
                                : v.decision === "REVISE"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedProtocolForVote(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-50 hover:text-rose-600 border border-border dark:border-charcoal-700 font-semibold"
                        >
                          <Vote className="h-3.5 w-3.5 text-rose-primary" />
                          <span>Cast Vote</span>
                        </button>
                        {p.ethicsClearanceSeal && (
                          <button
                            onClick={() => setCertificateProtocol(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                          >
                            <FileCheck className="h-3.5 w-3.5" />
                            <span>Certificate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Cast Board Vote */}
      {selectedProtocolForVote && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  IRB Ethics Board Deliberation Vote
                </h3>
              </div>
              <button
                onClick={() => setSelectedProtocolForVote(null)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-surface-soft dark:bg-charcoal-800 rounded-xl text-xs space-y-1">
              <p>
                <strong>Protocol:</strong> {selectedProtocolForVote.id} — {selectedProtocolForVote.title}
              </p>
              <p>
                <strong>PI:</strong> {selectedProtocolForVote.principalInvestigator} ({selectedProtocolForVote.department})
              </p>
              <p>
                <strong>Statutory Risk Tier:</strong> {selectedProtocolForVote.riskTier}
              </p>
            </div>

            <form onSubmit={handleCastVote} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Board Member Name</label>
                  <input
                    type="text"
                    required
                    value={voteForm.memberName}
                    onChange={(e) => setVoteForm({ ...voteForm, memberName: e.target.value })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Committee Role</label>
                  <select
                    value={voteForm.role}
                    onChange={(e) => setVoteForm({ ...voteForm, role: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  >
                    <option value="CHAIRPERSON">IRB Chairperson</option>
                    <option value="CLINICAL_ETHICIST">Clinical Ethicist</option>
                    <option value="LEGAL_EXPERT">Legal Regulatory Counsel</option>
                    <option value="COMMUNITY_REPRESENTATIVE">Community Representative</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Deliberation Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "APPROVE", label: "Approve (Clear)", color: "text-emerald-600 border-emerald-500" },
                    { id: "REVISE", label: "Request Revisions", color: "text-amber-600 border-amber-500" },
                    { id: "REJECT", label: "Reject Protocol", color: "text-rose-600 border-rose-500" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setVoteForm({ ...voteForm, decision: d.id as any })}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        voteForm.decision === d.id
                          ? `${d.color} bg-rose-50 dark:bg-charcoal-800 ring-2 ring-rose-500/20`
                          : "border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-900"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Ethics Deliberation Remarks</label>
                <textarea
                  required
                  rows={3}
                  value={voteForm.remarks}
                  onChange={(e) => setVoteForm({ ...voteForm, remarks: e.target.value })}
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setSelectedProtocolForVote(null)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVote}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingVote ? "Recording..." : "Record Official Vote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Clearance Certificate */}
      {certificateProtocol && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-xl w-full p-8 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1 pb-4 border-b border-border dark:border-charcoal-800">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                INSTITUTIONAL REVIEW BOARD (IRB)
              </h2>
              <p className="text-xs text-charcoal-500 font-semibold tracking-wider uppercase">
                Apex Institute of Technology • Ethics & Biosafety Compliance Office
              </p>
            </div>

            <div className="space-y-3 text-xs text-charcoal-700 dark:text-ivory-300">
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Protocol Reference:</span>
                <span className="font-mono font-bold text-rose-primary">{certificateProtocol.id}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Study Title:</span>
                <span className="font-bold text-right max-w-xs">{certificateProtocol.title}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Principal Investigator:</span>
                <span>{certificateProtocol.principalInvestigator} ({certificateProtocol.department})</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Risk Categorization:</span>
                <span className="font-semibold">{certificateProtocol.riskTier}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Cryptographic Clearance Seal:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {certificateProtocol.ethicsClearanceSeal}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Valid Through:</span>
                <span className="font-bold">
                  {certificateProtocol.validUntil
                    ? new Date(certificateProtocol.validUntil).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "1 Year from issuance"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
              This certification confirms that the aforementioned study has undergone thorough evaluation in accordance with statutory guidelines for ethical conduct in human subjects and biomedical investigations.
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCertificateProtocol(null)}
                className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Clearance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Protocol */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Register Research Ethics Protocol (IRB)
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterProtocol} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Study Protocol Title</label>
                <input
                  type="text"
                  required
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm({ ...submitForm, title: e.target.value })}
                  placeholder="e.g. Clinical Assessment of Neuroplasticity under Transcranial Stimulation"
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Principal Investigator</label>
                  <input
                    type="text"
                    required
                    value={submitForm.principalInvestigator}
                    onChange={(e) => setSubmitForm({ ...submitForm, principalInvestigator: e.target.value })}
                    placeholder="e.g. Dr. Sunita Sen"
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">PI Institutional Email</label>
                  <input
                    type="email"
                    required
                    value={submitForm.piEmail}
                    onChange={(e) => setSubmitForm({ ...submitForm, piEmail: e.target.value })}
                    placeholder="s.sen@apex.edu"
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Department</label>
                  <select
                    value={submitForm.department}
                    onChange={(e) => setSubmitForm({ ...submitForm, department: e.target.value })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  >
                    <option value="Biomedical Engineering & Medicine">Biomedical Engineering & Medicine</option>
                    <option value="Computer Science & Cognitive Ergonomics">Computer Science & Cognitive Ergonomics</option>
                    <option value="Biotechnology & Microbiology">Biotechnology & Microbiology</option>
                    <option value="Psychology & Data Science">Psychology & Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Statutory Risk Tier</label>
                  <select
                    value={submitForm.riskTier}
                    onChange={(e) => setSubmitForm({ ...submitForm, riskTier: e.target.value as any })}
                    className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  >
                    <option value="EXEMPT">Exempt (Surveys, Public Data)</option>
                    <option value="EXPEDITED">Expedited (Minimal Invasive Risk)</option>
                    <option value="FULL_BOARD_REVIEW">Full Board Review (High Risk)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Investigation Classification</label>
                <select
                  value={submitForm.studyType}
                  onChange={(e) => setSubmitForm({ ...submitForm, studyType: e.target.value as any })}
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                >
                  <option value="HUMAN_SUBJECTS">Human Subjects Interventional Trial</option>
                  <option value="ANIMAL_RESEARCH">Animal Physiology Model</option>
                  <option value="GENOMICS_BIOSAFETY">Genomics & Biosafety Level 2/3</option>
                  <option value="BEHAVIORAL_SURVEY">Behavioral Survey & Psychometrics</option>
                  <option value="AI_CLINICAL_TRIAL">AI Diagnostic & Clinical Decision Trial</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Data Privacy & De-Identification Safeguards</label>
                <textarea
                  required
                  rows={2}
                  value={submitForm.dataPrivacyProtocol}
                  onChange={(e) => setSubmitForm({ ...submitForm, dataPrivacyProtocol: e.target.value })}
                  placeholder="e.g. Participant IDs hashed with salt, encrypted HIPAA vault storage, no external transmission..."
                  className="w-full p-2 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProtocol}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingProtocol ? "Registering..." : "Submit to Ethics Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
