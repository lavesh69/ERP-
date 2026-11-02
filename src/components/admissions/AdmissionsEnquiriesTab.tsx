"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Search,
  Filter,
  PlusCircle,
  Phone,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  MapPin,
  GraduationCap,
  X,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

export interface AdmissionLead {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  targetProgram: string;
  twelfthPercentage: number;
  entranceExamScore: string;
  city: string;
  status: "NEW_ENQUIRY" | "CONTACTED" | "COUNSELED" | "ADMITTED";
  counselorNotes?: string;
  submittedAt: string;
}

interface AdmissionsEnquiriesTabProps {
  onPromoteSuccess?: () => void;
}

export default function AdmissionsEnquiriesTab({ onPromoteSuccess }: AdmissionsEnquiriesTabProps) {
  const { showToast } = useApp();
  const [leads, setLeads] = useState<AdmissionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Note/Status Update Modal
  const [selectedLead, setSelectedLead] = useState<AdmissionLead | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [counselorNotes, setCounselorNotes] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // New Enquiry Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    applicantName: "",
    email: "",
    phone: "",
    targetProgram: "B.Tech Computer Science & Engineering",
    twelfthPercentage: 85,
    entranceExamScore: "JEE Main",
    city: "New Delhi",
  });
  const [creating, setCreating] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admissions/enquiry");
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error("Failed to load admission enquiries", err);
      showToast("Unable to fetch prospective enquiries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;
    try {
      setUpdating(true);
      const res = await fetch("/api/admissions/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          enquiryId: selectedLead.id,
          status: newStatus || selectedLead.status,
          counselorNotes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Lead notes and status updated successfully", "success");
        setSelectedLead(null);
        fetchLeads();
      } else {
        showToast(data.error || "Failed to update lead", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update lead", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handlePromoteToApplicant = async (lead: AdmissionLead) => {
    try {
      const res = await fetch("/api/admissions/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONVERT_TO_APPLICANT",
          enquiryId: lead.id,
          programCode: lead.targetProgram.toLowerCase().includes("ai") ? "BTECH-AI" : "BTECH-CSE",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `Candidate promoted! Formal Application #${data.applicant?.applicationNo || ""} generated.`,
          "success"
        );
        fetchLeads();
        if (onPromoteSuccess) onPromoteSuccess();
      } else {
        showToast(data.error || "Promotion failed", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Promotion failed", "error");
    }
  };

  const handleCreateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await fetch("/api/admissions/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLeadForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("New prospective lead registered successfully", "success");
        setShowNewModal(false);
        setNewLeadForm({
          applicantName: "",
          email: "",
          phone: "",
          targetProgram: "B.Tech Computer Science & Engineering",
          twelfthPercentage: 85,
          entranceExamScore: "JEE Main",
          city: "New Delhi",
        });
        fetchLeads();
      } else {
        showToast(data.error || "Failed to create lead", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to create lead", "error");
    } finally {
      setCreating(false);
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = statusFilter === "ALL" || l.status === statusFilter;
    const matchesSearch =
      l.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetProgram.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW_ENQUIRY":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "CONTACTED":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "COUNSELED":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
      case "ADMITTED":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-charcoal-100 text-charcoal-600 border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-primary dark:text-rose-light" />
            <span>Prospective Inquiries & Outreach CRM</span>
          </h2>
          <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
            Track walk-in inquiries, portal leads, qualification assessments, and promote qualified prospects directly to the admissions pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border dark:border-charcoal-700 hover:bg-surface-soft dark:hover:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 transition-colors"
            title="Refresh Leads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-semibold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Walk-In Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
          <span className="text-xs text-charcoal-500 uppercase font-semibold">Total Leads</span>
          <p className="text-2xl font-black text-charcoal-900 dark:text-ivory-100 mt-1">{leads.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
          <span className="text-xs text-charcoal-500 uppercase font-semibold">New Inquiries</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {leads.filter((l) => l.status === "NEW_ENQUIRY").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
          <span className="text-xs text-charcoal-500 uppercase font-semibold">Counseled</span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
            {leads.filter((l) => l.status === "COUNSELED").length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
          <span className="text-xs text-charcoal-500 uppercase font-semibold">Promoted to Applicant</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {leads.filter((l) => l.status === "ADMITTED").length}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, program, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 outline-none focus:border-rose-primary"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {["ALL", "NEW_ENQUIRY", "CONTACTED", "COUNSELED", "ADMITTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? "bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900"
                  : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft/80"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Grid */}
      {loading ? (
        <div className="p-12 text-center text-charcoal-400">Loading prospective enquiries...</div>
      ) : filteredLeads.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
          <Mail className="w-10 h-10 text-charcoal-300 mx-auto mb-2" />
          <p className="font-bold text-sm text-charcoal-700 dark:text-ivory-200">No prospective leads match filter</p>
          <p className="text-xs text-charcoal-400 mt-1">Try adjusting the search criteria or record a new walk-in lead.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs hover:border-rose-primary/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{lead.applicantName}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-charcoal-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-charcoal-400" />
                      <span>{lead.city}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                      lead.status
                    )}`}
                  >
                    {lead.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-charcoal-600 dark:text-charcoal-300">
                    <GraduationCap className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span className="font-medium truncate">{lead.targetProgram}</span>
                  </div>
                  <div className="flex items-center justify-between text-charcoal-600 dark:text-charcoal-300 pt-1 border-t border-border/50 dark:border-charcoal-800/80">
                    <span>12th Score: <strong className="text-charcoal-900 dark:text-ivory-100">{lead.twelfthPercentage}%</strong></span>
                    <span className="text-[11px] text-charcoal-500 truncate max-w-[140px]">{lead.entranceExamScore}</span>
                  </div>
                  <div className="flex items-center justify-between text-charcoal-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </span>
                    <span>{lead.email}</span>
                  </div>
                </div>

                {lead.counselorNotes && (
                  <div className="mt-3 p-2.5 rounded-xl bg-surface-soft/60 dark:bg-charcoal-800/50 border border-border/50 dark:border-charcoal-700/50 text-[11px] text-charcoal-600 dark:text-charcoal-300 flex items-start gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-rose-primary shrink-0 mt-0.5" />
                    <p className="line-clamp-2">{lead.counselorNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedLead(lead);
                    setNewStatus(lead.status);
                    setCounselorNotes(lead.counselorNotes || "");
                  }}
                  className="flex-1 py-1.5 px-3 rounded-lg border border-border dark:border-charcoal-700 hover:bg-surface-soft dark:hover:bg-charcoal-800 text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 transition-colors"
                >
                  Counselor Notes
                </button>
                {lead.status !== "ADMITTED" ? (
                  <button
                    onClick={() => handlePromoteToApplicant(lead)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Promote</span>
                  </button>
                ) : (
                  <span className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center border border-emerald-200 dark:border-emerald-800">
                    Formal Applicant
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note / Status Update Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                Update Lead: {selectedLead.applicantName}
              </h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1 text-charcoal-400 hover:text-charcoal-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Enquiry Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="NEW_ENQUIRY">New Enquiry</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="COUNSELED">Counseled</option>
                  <option value="ADMITTED">Admitted / Promoted</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Counselor Assessment & Follow-up Notes
                </label>
                <textarea
                  rows={3}
                  value={counselorNotes}
                  onChange={(e) => setCounselorNotes(e.target.value)}
                  placeholder="Record discussion on program interests, fee concessions, scholarship eligibility..."
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none focus:border-rose-primary resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-charcoal-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-semibold shadow-xs"
                >
                  {updating ? "Saving..." : "Save Assessment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Enquiry Walk-In Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                Record Walk-In / Phone Lead
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEnquiry} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Candidate Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.applicantName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, applicantName: e.target.value })}
                  placeholder="e.g. Rohan Verma"
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="rohan@example.com"
                    className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Target Academic Program
                </label>
                <select
                  value={newLeadForm.targetProgram}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, targetProgram: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                >
                  <option value="B.Tech Computer Science & Engineering">B.Tech Computer Science & Engineering</option>
                  <option value="B.Tech in Artificial Intelligence & Robotics">B.Tech in Artificial Intelligence & Robotics</option>
                  <option value="B.Tech Electronics & Communication">B.Tech Electronics & Communication</option>
                  <option value="Bachelor of Computer Applications (Honors)">Bachelor of Computer Applications (Honors)</option>
                  <option value="Bachelor of Business Administration (FinTech)">Bachelor of Business Administration (FinTech)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                    12th Board Score (%)
                  </label>
                  <input
                    type="number"
                    min="35"
                    max="100"
                    step="0.1"
                    value={newLeadForm.twelfthPercentage}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, twelfthPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 mb-1">
                    Home City / State
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    placeholder="e.g. Pune"
                    className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft/40 dark:bg-charcoal-800 text-xs text-charcoal-900 dark:text-ivory-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-charcoal-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-semibold shadow-xs"
                >
                  {creating ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
