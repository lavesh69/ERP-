"use client";

import React, { useState, useEffect } from "react";
import {
  Moon,
  Clock,
  Building,
  Users,
  CheckCircle2,
  AlertTriangle,
  Siren,
  ShieldCheck,
  Search,
  Filter,
  Save,
  Check,
  X,
  PhoneCall,
  Bed,
  Sparkles,
  Lock,
} from "lucide-react";

interface RollCallEntry {
  studentRoll: string;
  studentName: string;
  roomNumber: string;
  bedId: string;
  status: "IN_ROOM" | "PERMITTED_LATE_PASS" | "UNAUTHORIZED_ABSENT" | "HOME_LEAVE";
  updatedAt: string;
  remarks?: string;
}

interface RollCallRecord {
  id: string;
  date: string;
  curfewTime: string;
  blockId: string;
  blockName: string;
  wardenOnDuty: string;
  status: string;
  totalResidents: number;
  inRoomCount: number;
  permittedOutpassCount: number;
  unauthorizedAbsentCount: number;
  roster: RollCallEntry[];
}

interface Props {
  blocks: any[];
  currentUser: any;
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
}

export function NightRollCallView({ blocks, currentUser, showToast }: Props) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>("blk-a");
  const [roster, setRoster] = useState<RollCallEntry[]>([]);
  const [curfewRecord, setCurfewRecord] = useState<RollCallRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  const fetchNightRollCall = async (blockId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/hostel?tab=night-rollcall&blockId=${blockId}`);
      const data = await res.json();
      if (data.success && data.rollCalls?.length > 0) {
        const active = data.rollCalls[0];
        setCurfewRecord(active);
        setRoster(active.roster || []);
      }
    } catch (err) {
      console.error("Night roll call error", err);
      showToast("Unable to fetch night curfew roll call", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNightRollCall(selectedBlockId);
  }, [selectedBlockId]);

  const updateResidentStatus = (
    roll: string,
    newStatus: "IN_ROOM" | "PERMITTED_LATE_PASS" | "UNAUTHORIZED_ABSENT" | "HOME_LEAVE"
  ) => {
    setRoster((prev) =>
      prev.map((r) =>
        r.studentRoll === roll
          ? {
              ...r,
              status: newStatus,
              updatedAt: new Date().toISOString(),
              remarks:
                newStatus === "IN_ROOM"
                  ? "Physically verified in dorm room"
                  : newStatus === "PERMITTED_LATE_PASS"
                  ? "Approved library/lab outpass active"
                  : newStatus === "UNAUTHORIZED_ABSENT"
                  ? "Missing at curfew roll-call, emergency alert logged"
                  : "Sanctioned home leave active",
            }
          : r
      )
    );
  };

  const handleSaveRollCall = async () => {
    setIsSaving(true);
    try {
      const currentBlock = blocks.find((b) => b.id === selectedBlockId);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_NIGHT_ROLLCALL",
          blockId: selectedBlockId,
          blockName: currentBlock?.name || "Hostel Block A",
          wardenOnDuty: currentUser?.fullName || "Dr. Arthur Pendelton (Chief Warden)",
          roster,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Curfew night roll-call locked and synchronized!", "success");
        if (data.record) setCurfewRecord(data.record);
      } else {
        showToast(data.error || "Failed to synchronize roll-call", "error");
      }
    } catch (err) {
      console.error("Error saving roll-call", err);
      showToast("Network error synchronizing curfew register", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const inRoomCount = roster.filter((r) => r.status === "IN_ROOM").length;
  const latePassCount = roster.filter((r) => r.status === "PERMITTED_LATE_PASS").length;
  const unauthorizedCount = roster.filter((r) => r.status === "UNAUTHORIZED_ABSENT").length;
  const homeLeaveCount = roster.filter((r) => r.status === "HOME_LEAVE").length;

  const totalResidents = roster.length || 1;
  const inRoomPercent = Math.round((inRoomCount / totalResidents) * 100);

  const filteredRoster = roster.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Curfew Countdown */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/10 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <Moon className="h-4 w-4" />
            Curfew Operations &bull; Mandatory 21:30 Daily Verification
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
            Hostel Night Roll-Call &amp; Curfew Headcount Ledger
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
            Statutory door-to-door physical verification of dorm occupants conducted nightly by the
            Chief Resident Warden. Students not in rooms without valid gate pass triggers instantaneous
            parent alert and campus security perimeter notification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unauthorizedCount > 0 && (
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Siren className="h-4 w-4" />
              SOS: {unauthorizedCount} Missing Curfew
            </button>
          )}

          <button
            onClick={handleSaveRollCall}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {isSaving ? "Locking Register..." : "Lock & Certify Tonight's Roll-Call"}
          </button>
        </div>
      </div>

      {/* Real-time Headcount Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-charcoal-500">In Room (Verified)</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {inRoomCount} <span className="text-xs text-charcoal-400 font-normal">({inRoomPercent}%)</span>
          </div>
          <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-800 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${inRoomPercent}%` }} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-charcoal-500">Permitted Outpass</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {latePassCount}
          </div>
          <span className="text-[10px] text-charcoal-400">Library / Lab sanctioned</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-charcoal-500">Unauthorized Night-Out</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {unauthorizedCount}
          </div>
          <span className="text-[10px] text-rose-500 font-semibold">Immediate Security Notice</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-charcoal-500">Sanctioned Home Leave</span>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {homeLeaveCount}
          </div>
          <span className="text-[10px] text-charcoal-400">Parent consent confirmed</span>
        </div>
      </div>

      {/* Control Bar: Block Selector & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">Hostel Block:</span>
          <select
            value={selectedBlockId}
            onChange={(e) => setSelectedBlockId(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
          >
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student name, roll number, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_ROOM">In Room</option>
            <option value="PERMITTED_LATE_PASS">Permitted Outpass</option>
            <option value="UNAUTHORIZED_ABSENT">Unauthorized Absent</option>
            <option value="HOME_LEAVE">Home Leave</option>
          </select>
        </div>
      </div>

      {/* Resident Roll-Call Cards Grid */}
      <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-charcoal-400 animate-pulse">
            Loading night curfew roll-call ledger...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="py-12 text-center text-xs text-charcoal-400">
            No residents match the active search and filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRoster.map((entry) => (
              <div
                key={entry.studentRoll}
                className={`p-4 rounded-2xl border transition-all ${
                  entry.status === "IN_ROOM"
                    ? "border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : entry.status === "PERMITTED_LATE_PASS"
                    ? "border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10"
                    : entry.status === "UNAUTHORIZED_ABSENT"
                    ? "border-rose-500/50 bg-rose-50/30 dark:bg-rose-950/20 ring-1 ring-rose-500/30"
                    : "border-purple-500/30 bg-purple-50/20 dark:bg-purple-950/10"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                        {entry.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                        {entry.roomNumber} &bull; {entry.bedId}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-charcoal-400 mt-0.5">
                      Roll No: {entry.studentRoll}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      entry.status === "IN_ROOM"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : entry.status === "PERMITTED_LATE_PASS"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : entry.status === "UNAUTHORIZED_ABSENT"
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    }`}
                  >
                    {entry.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="text-[11px] text-charcoal-500 dark:text-charcoal-400 italic mt-2">
                  &ldquo;{entry.remarks}&rdquo;
                </div>

                {/* 4 Quick Action Curfew Status Buttons */}
                <div className="grid grid-cols-4 gap-1.5 pt-3 mt-2 border-t border-border/40 dark:border-charcoal-800/60">
                  <button
                    type="button"
                    onClick={() => updateResidentStatus(entry.studentRoll, "IN_ROOM")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      entry.status === "IN_ROOM"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-border dark:border-charcoal-700"
                    }`}
                  >
                    In Room ✓
                  </button>

                  <button
                    type="button"
                    onClick={() => updateResidentStatus(entry.studentRoll, "PERMITTED_LATE_PASS")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      entry.status === "PERMITTED_LATE_PASS"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-border dark:border-charcoal-700"
                    }`}
                  >
                    Late Pass
                  </button>

                  <button
                    type="button"
                    onClick={() => updateResidentStatus(entry.studentRoll, "UNAUTHORIZED_ABSENT")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      entry.status === "UNAUTHORIZED_ABSENT"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white dark:bg-charcoal-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900"
                    }`}
                  >
                    Missing SOS
                  </button>

                  <button
                    type="button"
                    onClick={() => updateResidentStatus(entry.studentRoll, "HOME_LEAVE")}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer text-center ${
                      entry.status === "HOME_LEAVE"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-border dark:border-charcoal-700"
                    }`}
                  >
                    Home Leave
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOS MODAL */}
      {isSosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-charcoal-900 border border-rose-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-2.5 text-rose-600">
                <Siren className="h-5 w-5 animate-pulse" />
                <h4 className="text-sm font-bold">Dispatch Unauthorized Night-Out Alert</h4>
              </div>
              <button
                onClick={() => setIsSosModalOpen(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <p className="text-charcoal-600 dark:text-charcoal-300 leading-relaxed">
                The following {unauthorizedCount} resident(s) are unaccounted for at curfew roll-call:
              </p>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1.5">
                {roster
                  .filter((r) => r.status === "UNAUTHORIZED_ABSENT")
                  .map((r) => (
                    <div key={r.studentRoll} className="flex items-center justify-between font-bold text-rose-700 dark:text-rose-300">
                      <span>{r.studentName} ({r.roomNumber})</span>
                      <span className="font-mono text-[10px]">{r.studentRoll}</span>
                    </div>
                  ))}
              </div>

              <div className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-[11px] text-charcoal-500 space-y-1">
                <div>&bull; SMS notification to registered parent mobile emergency contacts</div>
                <div>&bull; Security gate turnstile log flag &amp; barrier hold</div>
                <div>&bull; Formal disciplinary curfew violation notice issued to Proctor Office</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60 dark:border-charcoal-800">
              <button
                onClick={() => setIsSosModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast("Emergency Parent & Security Curfew Dispatch executed!", "success");
                  setIsSosModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Siren className="h-4 w-4" />
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
