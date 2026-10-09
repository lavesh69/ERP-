"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Printer,
  Calendar,
  Clock,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  X,
  Phone,
  ArrowRightLeft,
} from "lucide-react";

interface InvigilationRoster {
  id: string;
  dutyCode: string;
  date: string;
  session: string;
  hallCode: string;
  hallName: string;
  capacity: number;
  chiefInvigilator: {
    id: string;
    name: string;
    department: string;
    phone: string;
  };
  assistantInvigilator: {
    id: string;
    name: string;
    department: string;
    phone: string;
  };
  reliever: {
    id: string;
    name: string;
    department: string;
    phone: string;
  };
  status: string;
  dutiesDelivered: boolean;
}

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
  canEdit: boolean;
}

export function InvigilationRosterView({ showToast, canEdit }: Props) {
  const [rosters, setRosters] = useState<InvigilationRoster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState("ALL");
  const [selectedHallFilter, setSelectedHallFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Assign / Swap Duty Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<InvigilationRoster | null>(null);

  // Form Fields
  const [formDutyCode, setFormDutyCode] = useState("");
  const [formDate, setFormDate] = useState("2026-11-15");
  const [formSession, setFormSession] = useState("MORNING (09:30 - 12:30)");
  const [formHallCode, setFormHallCode] = useState("LH-101");
  const [formHallName, setFormHallName] = useState("Lecture Hall Complex LH-101");
  const [formChiefName, setFormChiefName] = useState("Dr. Sarah Jenkins");
  const [formChiefDept, setFormChiefDept] = useState("Computer Science");
  const [formAssistantName, setFormAssistantName] = useState("Prof. David Miller");
  const [formAssistantDept, setFormAssistantDept] = useState("Mechanical Engineering");

  const fetchRosters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/examinations?tab=invigilation");
      const data = await res.json();
      if (data.success) {
        setRosters(data.rosters || []);
      }
    } catch (err) {
      console.error("Failed to load invigilation rosters", err);
      showToast("Unable to load invigilation duty records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRosters();
  }, []);

  const openAssignModal = (roster?: InvigilationRoster) => {
    if (roster) {
      setSelectedDuty(roster);
      setFormDutyCode(roster.dutyCode);
      setFormDate(roster.date);
      setFormSession(roster.session);
      setFormHallCode(roster.hallCode);
      setFormHallName(roster.hallName);
      setFormChiefName(roster.chiefInvigilator?.name || "");
      setFormChiefDept(roster.chiefInvigilator?.department || "");
      setFormAssistantName(roster.assistantInvigilator?.name || "");
      setFormAssistantDept(roster.assistantInvigilator?.department || "");
    } else {
      setSelectedDuty(null);
      setFormDutyCode("");
      setFormDate("2026-11-18");
      setFormSession("MORNING (09:30 - 12:30)");
      setFormHallCode("AUD-HALL-A");
      setFormHallName("Central Auditorium Hall A");
      setFormChiefName("Dr. Sarah Jenkins");
      setFormChiefDept("Computer Science");
      setFormAssistantName("Prof. David Miller");
      setFormAssistantDept("Mechanical Engineering");
    }
    setIsModalOpen(true);
  };

  const handleDutySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_INVIGILATION",
          dutyCode: formDutyCode || undefined,
          date: formDate,
          session: formSession,
          hallCode: formHallCode,
          hallName: formHallName,
          capacity: 80,
          chiefInvigilator: {
            id: `fac-${Math.floor(10 + Math.random() * 90)}`,
            name: formChiefName,
            department: formChiefDept,
            phone: "+1 (555) 019-2831",
          },
          assistantInvigilator: {
            id: `fac-${Math.floor(10 + Math.random() * 90)}`,
            name: formAssistantName,
            department: formAssistantDept,
            phone: "+1 (555) 019-7721",
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Invigilation duty updated successfully!", "success");
        setIsModalOpen(false);
        fetchRosters();
      } else {
        showToast(data.error || "Failed to update invigilation duty", "error");
      }
    } catch (err) {
      console.error("Duty submission error:", err);
      showToast("Network error while updating duty", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRosters = rosters.filter((r) => {
    const matchesSearch =
      r.hallName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.dutyCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.chiefInvigilator?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.assistantInvigilator?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSession = selectedSessionFilter === "ALL" || r.session.includes(selectedSessionFilter);
    const matchesHall = selectedHallFilter === "ALL" || r.hallCode === selectedHallFilter;

    return matchesSearch && matchesSession && matchesHall;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <Users className="h-4 w-4" />
            Controller of Examinations &bull; Faculty Invigilation Roster
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
            Examination Hall Supervision &amp; Invigilator Duty Matrix
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
            Statutory faculty supervisory allocation across examination halls. Automatically enforces
            prohibition of faculty invigilating their own department courses to ensure anti-bias integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Duty Gazette
          </button>

          {canEdit && (
            <button
              onClick={() => openAssignModal()}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Hall Invigilator
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
        <div className="relative flex-1 max-w-md">
          <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by faculty name, hall, or duty ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSessionFilter}
            onChange={(e) => setSelectedSessionFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
          >
            <option value="ALL">All Sessions</option>
            <option value="MORNING">Morning (09:30 AM)</option>
            <option value="AFTERNOON">Afternoon (02:00 PM)</option>
          </select>

          <select
            value={selectedHallFilter}
            onChange={(e) => setSelectedHallFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
          >
            <option value="ALL">All Examination Halls</option>
            <option value="AUD-HALL-A">Auditorium Hall A</option>
            <option value="LH-101">LH-101 Complex</option>
            <option value="LH-102">LH-102 Complex</option>
          </select>

          <button
            onClick={fetchRosters}
            className="p-2 rounded-xl border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-800 text-charcoal-500"
            title="Refresh Roster"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Roster Duty Cards / Table */}
      <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-charcoal-400 animate-pulse">
            Loading invigilation matrix...
          </div>
        ) : filteredRosters.length === 0 ? (
          <div className="py-12 text-center text-xs text-charcoal-400">
            No invigilation duty rosters match the active filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 dark:border-charcoal-800 text-[10px] font-bold text-charcoal-500 uppercase">
                  <th className="py-2.5 px-3">Duty Code</th>
                  <th className="py-2.5 px-3">Date &amp; Timing</th>
                  <th className="py-2.5 px-3">Examination Center</th>
                  <th className="py-2.5 px-3">Chief Invigilator</th>
                  <th className="py-2.5 px-3">Assistant / Reliever</th>
                  <th className="py-2.5 px-3">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-charcoal-800/60">
                {filteredRosters.map((duty) => (
                  <tr key={duty.id} className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {duty.dutyCode}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-charcoal-900 dark:text-ivory-100">
                        <Calendar className="h-3 w-3 text-primary-500" />
                        {new Date(duty.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-charcoal-500 mt-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {duty.session}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {duty.hallName}
                      </div>
                      <div className="text-[10px] text-charcoal-400">
                        Code: {duty.hallCode} &bull; Capacity: {duty.capacity} candidates
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                        {duty.chiefInvigilator?.name}
                      </div>
                      <div className="text-[10px] text-charcoal-400">
                        Dept: {duty.chiefInvigilator?.department}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-charcoal-800 dark:text-ivory-200">
                        {duty.assistantInvigilator?.name}
                      </div>
                      <div className="text-[10px] text-charcoal-400">
                        Reliever: {duty.reliever?.name}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        {duty.status}
                      </span>
                    </td>

                    {canEdit && (
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => openAssignModal(duty)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          Swap / Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGN / SWAP DUTY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    {selectedDuty ? "Modify Invigilation Roster" : "Assign Faculty to Exam Hall"}
                  </h3>
                  <p className="text-[10px] text-charcoal-400">
                    Clash-free scheduling with automated department conflict detection
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleDutySubmit} className="space-y-4 my-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Examination Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Session Slot
                  </label>
                  <select
                    value={formSession}
                    onChange={(e) => setFormSession(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="MORNING (09:30 - 12:30)">Morning (09:30 - 12:30)</option>
                    <option value="AFTERNOON (14:00 - 17:00)">Afternoon (14:00 - 17:00)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Examination Hall
                </label>
                <select
                  value={formHallCode}
                  onChange={(e) => {
                    setFormHallCode(e.target.value);
                    if (e.target.value === "AUD-HALL-A") setFormHallName("Central Auditorium Hall A");
                    if (e.target.value === "LH-101") setFormHallName("Lecture Hall Complex LH-101");
                    if (e.target.value === "LH-102") setFormHallName("Lecture Hall Complex LH-102");
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="AUD-HALL-A">Central Auditorium Hall A (Cap: 120)</option>
                  <option value="LH-101">Lecture Hall Complex LH-101 (Cap: 60)</option>
                  <option value="LH-102">Lecture Hall Complex LH-102 (Cap: 60)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Chief Invigilator
                  </label>
                  <input
                    type="text"
                    required
                    value={formChiefName}
                    onChange={(e) => setFormChiefName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formChiefDept}
                    onChange={(e) => setFormChiefDept(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Assistant Invigilator
                  </label>
                  <input
                    type="text"
                    required
                    value={formAssistantName}
                    onChange={(e) => setFormAssistantName(e.target.value)}
                    placeholder="e.g. Prof. David Miller"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={formAssistantDept}
                    onChange={(e) => setFormAssistantDept(e.target.value)}
                    placeholder="e.g. Mechanical Engg"
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Anti-Cheating Ordinance #08: System validates that no invigilator is assigned to halls
                  where their own department majors are writing examinations.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Updating Roster..." : "Confirm & Dispatch Duty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
