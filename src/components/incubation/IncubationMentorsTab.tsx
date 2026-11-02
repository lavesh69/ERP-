// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationMentorsTab Component
 * Entrepreneur-in-Residence (EIR) network, mentor advisory profiles,
 * and 1:1 venture office hours scheduling & takeaway action items.
 */

"use client";

import React, { useState } from "react";
import {
  Users,
  Star,
  Clock,
  Calendar,
  PlusCircle,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building,
  Sparkles,
  ArrowRight,
  UserCheck,
  FileText,
} from "lucide-react";
import { IncubationMentor, MentorSession, IncubatedStartup } from "@/lib/incubation/incubation-engine";
import { EmptyState } from "@/components/common/EmptyState";

interface IncubationMentorsTabProps {
  mentors: IncubationMentor[];
  sessions: MentorSession[];
  startups: IncubatedStartup[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationMentorsTab({
  mentors,
  sessions,
  startups,
  onRefresh,
  showToast,
}: IncubationMentorsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"mentors" | "sessions">("mentors");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showMentorModal, setShowMentorModal] = useState<boolean>(false);
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [completingSession, setCompletingSession] = useState<MentorSession | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New Mentor Form State
  const [mentorForm, setMentorForm] = useState({
    mentorName: "",
    title: "",
    organization: "",
    expertiseRaw: "DeepTech, Venture Strategy, Product-Market Fit",
    email: "",
    phone: "",
    availabilityStatus: "AVAILABLE" as "AVAILABLE" | "ENGAGED" | "ON_LEAVE",
  });

  // Schedule Session Form State
  const [sessionForm, setSessionForm] = useState({
    mentorId: mentors[0]?.id || "",
    startupId: startups[0]?.id || "",
    scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    durationMinutes: 45,
    discussionTopic: "",
  });

  // Complete Session Form State
  const [takeaways, setTakeaways] = useState("");
  const [actionItems, setActionItems] = useState("");

  const totalMentors = mentors.length;
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === "COMPLETED").length;
  const scheduledUpcoming = sessions.filter((s) => s.status === "SCHEDULED").length;

  const handleRegisterMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorForm.mentorName.trim() || !mentorForm.title.trim()) {
      showToast("Mentor name and title are required", "error");
      return;
    }

    try {
      setSubmitting(true);
      const expertise = mentorForm.expertiseRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_MENTOR",
          mentorName: mentorForm.mentorName,
          title: mentorForm.title,
          organization: mentorForm.organization,
          expertise,
          email: mentorForm.email,
          phone: mentorForm.phone,
          availabilityStatus: mentorForm.availabilityStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register mentor");
      }

      showToast(`Mentor ${data.mentor.mentorName} onboarded to advisory network!`, "success");
      setShowMentorModal(false);
      setMentorForm({
        mentorName: "",
        title: "",
        organization: "",
        expertiseRaw: "DeepTech, Venture Strategy, Product-Market Fit",
        email: "",
        phone: "",
        availabilityStatus: "AVAILABLE",
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to register mentor", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionForm.mentorId || !sessionForm.startupId || !sessionForm.discussionTopic.trim()) {
      showToast("Please fill in mentor, venture, and discussion agenda", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCHEDULE_MENTOR_SESSION",
          mentorId: sessionForm.mentorId,
          startupId: sessionForm.startupId,
          scheduledDate: new Date(sessionForm.scheduledDate).toISOString(),
          durationMinutes: Number(sessionForm.durationMinutes),
          discussionTopic: sessionForm.discussionTopic,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule office hours");
      }

      showToast(`Office hours session scheduled! (${data.session.sessionRef})`, "success");
      setShowSessionModal(false);
      setSessionForm({
        mentorId: mentors[0]?.id || "",
        startupId: startups[0]?.id || "",
        scheduledDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
        durationMinutes: 45,
        discussionTopic: "",
      });
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to schedule session", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingSession) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_MENTOR_SESSION",
          id: completingSession.id,
          keyTakeaways: takeaways,
          actionItems: actionItems,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete session");
      }

      showToast(`Session ${data.session.sessionRef} marked COMPLETED!`, "success");
      setCompletingSession(null);
      setTakeaways("");
      setActionItems("");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Failed to complete session", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4-Card Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Advisory Mentors & EIRs
            </p>
            <h3 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
              {totalMentors}
            </h3>
            <span className="text-[10px] text-charcoal-500">Domain Specialists</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Sessions Completed
            </p>
            <h3 className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedSessions}
            </h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Advisory Clinics Logged</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Scheduled Upcoming
            </p>
            <h3 className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {scheduledUpcoming}
            </h3>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Upcoming Office Hours</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Average Mentor Rating
            </p>
            <h3 className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              4.9 ★
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400">Founder Feedback</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Star className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
          <button
            onClick={() => setActiveSubTab("mentors")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "mentors"
                ? "bg-rose-primary text-white shadow-xs"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            Advisory Council ({totalMentors})
          </button>
          <button
            onClick={() => setActiveSubTab("sessions")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === "sessions"
                ? "bg-rose-primary text-white shadow-xs"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            Office Hours Ledger ({totalSessions})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input
              type="text"
              placeholder={activeSubTab === "mentors" ? "Search mentors, firms..." : "Search sessions, topics..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-primary text-charcoal-900 dark:text-ivory-100"
            />
          </div>

          {activeSubTab === "mentors" ? (
            <button
              onClick={() => setShowMentorModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Mentor</span>
            </button>
          ) : (
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all shrink-0"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Office Hours</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: MENTOR DIRECTORY */}
      {activeSubTab === "mentors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mentors
            .filter((m) => {
              const q = searchQuery.toLowerCase();
              return (
                !q ||
                m.mentorName.toLowerCase().includes(q) ||
                m.title.toLowerCase().includes(q) ||
                m.organization.toLowerCase().includes(q) ||
                m.expertise.some((e) => e.toLowerCase().includes(q))
              );
            })
            .map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary flex items-center justify-center font-bold text-lg">
                      {mentor.mentorName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {mentor.rating.toFixed(1)}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                      {mentor.mentorName}
                    </h4>
                    <p className="text-xs text-rose-primary dark:text-rose-400 font-semibold mt-0.5">
                      {mentor.title}
                    </p>
                    <p className="text-xs text-charcoal-500">
                      {mentor.organization}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider block mb-1">
                      Domain Expertise
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.map((exp, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 font-medium"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-xs text-charcoal-500">
                  <span>{mentor.totalSessionsConducted} sessions conducted</span>
                  <button
                    onClick={() => {
                      setSessionForm({
                        ...sessionForm,
                        mentorId: mentor.id,
                      });
                      setShowSessionModal(true);
                    }}
                    className="text-rose-primary hover:underline font-bold text-xs"
                  >
                    Book Session &rarr;
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* SUB-TAB 2: OFFICE HOURS SESSIONS LEDGER */}
      {activeSubTab === "sessions" && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Advisory Sessions Scheduled"
              description="Schedule a 1:1 office hours clinic between an EIR mentor and an incubated venture."
              actionLabel="Schedule Session"
              onAction={() => setShowSessionModal(true)}
            />
          ) : (
            <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-50 dark:bg-charcoal-800/60 border-b border-border dark:border-charcoal-800 text-charcoal-500 uppercase tracking-wider text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Reference</th>
                      <th className="p-3.5">Venture & Mentor</th>
                      <th className="p-3.5">Topic & Agenda</th>
                      <th className="p-3.5">Date & Duration</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-800">
                    {sessions
                      .filter((s) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          !q ||
                          s.startupName.toLowerCase().includes(q) ||
                          s.mentorName.toLowerCase().includes(q) ||
                          s.discussionTopic.toLowerCase().includes(q)
                        );
                      })
                      .map((session) => (
                        <tr key={session.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                          <td className="p-3.5 font-mono text-charcoal-400 font-semibold">
                            {session.sessionRef}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {session.startupName}
                            </span>
                            <span className="text-charcoal-500 text-[11px]">
                              Mentor: {session.mentorName}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <span className="font-medium text-charcoal-800 dark:text-ivory-200 block truncate">
                              {session.discussionTopic}
                            </span>
                            {session.keyTakeaways && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">
                                Takeaway: {session.keyTakeaways}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-charcoal-800 dark:text-ivory-200 block">
                              {new Date(session.scheduledDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            <span className="text-charcoal-500 text-[11px]">
                              {session.durationMinutes} mins
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                session.status === "COMPLETED"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200"
                              }`}
                            >
                              {session.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {session.status === "SCHEDULED" ? (
                              <button
                                onClick={() => setCompletingSession(session)}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-primary rounded-lg text-xs font-semibold transition-colors"
                              >
                                Log Takeaways
                              </button>
                            ) : (
                              <span className="text-xs text-charcoal-400 font-semibold">Done</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Register Mentor */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Register Advisory Mentor / EIR
              </h3>
              <button onClick={() => setShowMentorModal(false)} className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterMentor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={mentorForm.mentorName}
                  onChange={(e) => setMentorForm({ ...mentorForm, mentorName: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Chander"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Title / Designation *
                </label>
                <input
                  type="text"
                  required
                  value={mentorForm.title}
                  onChange={(e) => setMentorForm({ ...mentorForm, title: e.target.value })}
                  placeholder="e.g. Managing Partner & EIR"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Affiliated Organization *
                </label>
                <input
                  type="text"
                  required
                  value={mentorForm.organization}
                  onChange={(e) => setMentorForm({ ...mentorForm, organization: e.target.value })}
                  placeholder="e.g. Silicon Valley Seed Fund / Apex Law"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Domain Expertise (Comma separated)
                </label>
                <input
                  type="text"
                  value={mentorForm.expertiseRaw}
                  onChange={(e) => setMentorForm({ ...mentorForm, expertiseRaw: e.target.value })}
                  placeholder="DeepTech, Patent Law, B2B Sales"
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={mentorForm.email}
                    onChange={(e) => setMentorForm({ ...mentorForm, email: e.target.value })}
                    placeholder="mentor@firm.com"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={mentorForm.phone}
                    onChange={(e) => setMentorForm({ ...mentorForm, phone: e.target.value })}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Onboard Mentor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Office Hours */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Schedule Advisory Office Hours
              </h3>
              <button onClick={() => setShowSessionModal(false)} className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Designated Advisory Mentor *
                </label>
                <select
                  value={sessionForm.mentorId}
                  onChange={(e) => setSessionForm({ ...sessionForm, mentorId: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mentorName} — {m.title} ({m.organization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Incubated Venture *
                </label>
                <select
                  value={sessionForm.startupId}
                  onChange={(e) => setSessionForm({ ...sessionForm, startupId: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-semibold"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startupName} ({s.companyRef})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={sessionForm.scheduledDate}
                    onChange={(e) => setSessionForm({ ...sessionForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={sessionForm.durationMinutes}
                    onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Discussion Agenda & Goal *
                </label>
                <textarea
                  required
                  rows={2}
                  value={sessionForm.discussionTopic}
                  onChange={(e) => setSessionForm({ ...sessionForm, discussionTopic: e.target.value })}
                  placeholder="e.g. Series-A Term Sheet negotiation, ESOP pool dilution, and patent claim scoping..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Booking..." : "Confirm & Send Calendar Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Takeaways / Complete Session */}
      {completingSession && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
              <div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                  Log Session Takeaways
                </h3>
                <p className="text-xs text-charcoal-500">{completingSession.sessionRef} • {completingSession.startupName}</p>
              </div>
              <button onClick={() => setCompletingSession(null)} className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Key Strategic Advice & Takeaways *
                </label>
                <textarea
                  required
                  rows={3}
                  value={takeaways}
                  onChange={(e) => setTakeaways(e.target.value)}
                  placeholder="Summarize mentor guidance, tactical pivots, and valuation benchmarks discussed..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Action Items for Founding Team
                </label>
                <textarea
                  rows={2}
                  value={actionItems}
                  onChange={(e) => setActionItems(e.target.value)}
                  placeholder="1. Revise customer persona doc. 2. Clean up ESOP pool by Friday..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setCompletingSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Mark Session Completed"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
