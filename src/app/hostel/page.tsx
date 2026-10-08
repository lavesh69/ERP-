"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Building,
  Bed,
  Users,
  Clock,
  Utensils,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
  Check,
  Send,
  Calendar,
  Sparkles,
  Search,
  QrCode,
  Activity,
} from "lucide-react";

interface HostelSummary {
  totalBlocks: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  pendingGatePasses: number;
  activeMessSubscribers: number;
  blocks: any[];
}

export default function HostelPage() {
  const { currentUser, currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<"matrix" | "allocations" | "gatepass" | "mess">("matrix");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<HostelSummary | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);
  const [messPlans, setMessPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Mess Biometric State
  const [punchedMeals, setPunchedMeals] = useState<any[]>([
    {
      id: "tok-101",
      studentRoll: "CS2026-001",
      studentName: "Alex Rivera",
      plan: "All-Access Premium Buffet",
      mealType: "Dinner (Executive)",
      timestamp: "Just now",
      lane: "Turnstile Gate #02 (Optical)",
      tokenHash: "0x89f4b...3e1a",
    },
    {
      id: "tok-102",
      studentRoll: "ME2025-042",
      studentName: "Priya Sharma",
      plan: "South Indian Vegetarian",
      mealType: "Dinner (Executive)",
      timestamp: "3 mins ago",
      lane: "Turnstile Gate #01 (Biometric)",
      tokenHash: "0x12c8a...9f00",
    },
    {
      id: "tok-103",
      studentRoll: "EE2024-019",
      studentName: "Marcus Vance",
      plan: "Continental & Halal Fusion",
      mealType: "Dinner (Executive)",
      timestamp: "7 mins ago",
      lane: "Turnstile Gate #03 (RFID Card)",
      tokenHash: "0x44d1e...bc27",
    },
  ]);
  const [hasPunchedThisSession, setHasPunchedThisSession] = useState(false);
  const [diningHeadcount, setDiningHeadcount] = useState(384);

  // New Gate Pass Form
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({
    studentName: currentUser?.fullName || "",
    studentRoll: "CS2026-001",
    roomNumber: "A-101",
    blockName: "Nelson Mandela Hall (Block A)",
    reason: "",
    destination: "",
    departureTime: "",
    expectedReturnTime: "",
    emergencyContact: "+1 (555) 000-0000",
    parentConsentVerified: true,
  });

  // Bed Allocation Form
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocateForm, setAllocateForm] = useState({
    roomId: "",
    bedNumber: "A",
    studentName: "",
    studentRoll: "",
    branch: "Computer Science & Engineering",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, roomsRes, passRes, messRes] = await Promise.all([
        fetch("/api/hostel?tab=summary"),
        fetch("/api/hostel?tab=rooms"),
        fetch("/api/hostel?tab=gate-passes"),
        fetch("/api/hostel?tab=mess"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (roomsRes.ok) {
        const rData = await roomsRes.json();
        setRooms(rData.rooms || []);
      }
      if (passRes.ok) {
        const pData = await passRes.json();
        setGatePasses(pData.passes || []);
      }
      if (messRes.ok) {
        const mData = await messRes.json();
        setMessPlans(mData.plans || []);
        setSubscriptions(mData.subscriptions || []);
      }
    } catch (err) {
      console.error("Failed to fetch hostel data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_GATE_PASS",
          ...passForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit gate pass");
      setStatusMessage({ type: "success", text: "Outpass submitted successfully! Warden notified." });
      setShowPassModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleProcessPass = async (passId: string, passAction: "APPROVE" | "REJECT" | "CHECK_OUT" | "RETURN") => {
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PROCESS_GATE_PASS",
          passId,
          passAction,
          remarks: `Action recorded by ${currentUser?.fullName || "Authority"}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      setStatusMessage({ type: "success", text: data.message });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleAllocateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ALLOCATE_BED",
          ...allocateForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bed allocation failed");
      setStatusMessage({ type: "success", text: data.message });
      setShowAllocateModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleSubscribeMess = async (planId: string) => {
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBSCRIBE_MESS",
          studentId: currentUser?.id || "stu-alex-01",
          studentName: currentUser?.fullName || "Alex Mercer",
          studentRoll: "CS2026-001",
          planId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mess subscription failed");
      setStatusMessage({ type: "success", text: "Mess plan subscription updated!" });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleBiometricPunch = () => {
    if (hasPunchedThisSession) {
      setStatusMessage({
        type: "error",
        text: "Double-Punch Lockout Active: You have already punched your meal token for this dining session.",
      });
      return;
    }
    const newPunch = {
      id: `tok-${Date.now()}`,
      studentRoll: currentUser?.email?.split("@")[0] || "CS2026-001",
      studentName: currentUser?.fullName || "Alex Rivera",
      plan: "All-Access Premium Buffet",
      mealType: "Dinner (Executive)",
      timestamp: "Just now",
      lane: "Turnstile Gate #01 (Biometric Optical)",
      tokenHash: `0x${Math.random().toString(16).substring(2, 8)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setPunchedMeals((prev) => [newPunch, ...prev]);
    setHasPunchedThisSession(true);
    setDiningHeadcount((prev) => prev + 1);
    setStatusMessage({
      type: "success",
      text: "Biometric Turnstile Token Validated! Meal voucher deducted & barrier opened.",
    });
  };

  const filteredRooms = selectedBlockId === "all" ? rooms : rooms.filter((r) => r.blockId === selectedBlockId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900 via-rose-800 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                Residence Life & Housing ERP
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Active Term 2026-27
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Hostel & Dormitory Management
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Real-time room matrix, bi-directional warden gate pass approval, biometric mess subscriptions, and residential welfare oversight.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPassModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white text-rose-900 hover:bg-rose-50 shadow-md transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              Request Outpass
            </button>
            <button
              onClick={() => setShowAllocateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-700 hover:bg-rose-600 text-white border border-rose-500/30 shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Allocate Bed
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbons */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-700/50">
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Total Capacity</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{summary.totalBeds} Beds</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.totalRooms} Rooms across {summary.totalBlocks} Blocks</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Occupancy Rate</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">{summary.occupancyRate}%</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.occupiedBeds} Occupied / {summary.availableBeds} Vacant</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Pending Outpasses</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">{summary.pendingGatePasses}</p>
              <p className="text-xs text-rose-300 mt-0.5">Awaiting Warden Clearance</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Mess Dining</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">{summary.activeMessSubscribers}</p>
              <p className="text-xs text-rose-300 mt-0.5">Active Meal Subscriptions</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto pb-px">
        {[
          { id: "matrix", label: "Room Matrix & Layout", icon: Building },
          { id: "allocations", label: "Bed Allocation Registry", icon: Bed },
          { id: "gatepass", label: "Gate Pass & Night Outpass", icon: Clock, count: summary?.pendingGatePasses },
          { id: "mess", label: "Dining & Mess Management", icon: Utensils },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-rose-primary text-rose-primary dark:text-rose-light dark:border-rose-light"
                  : "border-transparent text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROOM MATRIX & LAYOUT */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Block Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal-500" />
              <span className="text-sm font-medium text-charcoal-700 dark:text-ivory-300">Filter by Block:</span>
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="text-sm bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">All Residence Halls (Total {rooms.length} Rooms)</option>
                {summary?.blocks.map((blk) => (
                  <option key={blk.id} value={blk.id}>
                    {blk.name} ({blk.stats.occupancyRate}% Full)
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 text-xs text-charcoal-600 dark:text-ivory-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" /> Vacant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Partially Occupied
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" /> Full
              </span>
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => {
              const statusBadgeColor =
                room.status === "VACANT"
                  ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200"
                  : room.status === "PARTIALLY_OCCUPIED"
                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200"
                  : "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200";

              return (
                <div
                  key={room.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">{room.roomNumber}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusBadgeColor}`}>
                          {room.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 dark:text-ivory-400 mt-0.5">
                        {room.blockName} • Floor {room.floor}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 rounded-md">
                      {room.roomType.replace("_", " ")}
                    </span>
                  </div>

                  {/* Bed Breakdown */}
                  <div className="mt-4 space-y-2 border-t border-border dark:border-charcoal-800 pt-3">
                    <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                      Beds ({room.occupiedCount}/{room.capacity} Occupied)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {room.beds.map((bed: any) => (
                        <div
                          key={bed.id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                            bed.isOccupied
                              ? "bg-ivory-50 dark:bg-charcoal-800/60 border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-200"
                              : "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Bed {bed.bedNumber}</span>
                            {bed.isOccupied ? (
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">VACANT</span>
                            )}
                          </div>
                          {bed.isOccupied ? (
                            <div className="mt-1">
                              <p className="font-semibold truncate">{bed.studentName}</p>
                              <p className="text-[10px] text-charcoal-500 dark:text-ivory-400">{bed.studentRoll}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setAllocateForm({
                                  ...allocateForm,
                                  roomId: room.id,
                                  bedNumber: bed.bedNumber,
                                });
                                setShowAllocateModal(true);
                              }}
                              className="mt-1 text-left text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                            >
                              + Assign Student
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="mt-4 flex flex-wrap gap-1.5 pt-2 border-t border-border dark:border-charcoal-800">
                    {room.amenities.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 rounded"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BED ALLOCATIONS REGISTRY */}
      {activeTab === "allocations" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-800 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Active Student Residence Allocations
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Official institutional bed records with fee ledger reconciliation
              </p>
            </div>
            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Allocation
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                <tr>
                  <th className="p-3.5">Student / Roll</th>
                  <th className="p-3.5">Block / Room</th>
                  <th className="p-3.5">Bed</th>
                  <th className="p-3.5">Academic Branch</th>
                  <th className="p-3.5">Allocated On</th>
                  <th className="p-3.5">Fee Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-charcoal-800">
                {rooms.flatMap((r) =>
                  r.beds
                    .filter((b: any) => b.isOccupied)
                    .map((bed: any) => (
                      <tr key={bed.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="p-3.5">
                          <p className="font-semibold text-charcoal-900 dark:text-ivory-100">{bed.studentName}</p>
                          <p className="text-[11px] text-charcoal-500">{bed.studentRoll}</p>
                        </td>
                        <td className="p-3.5">
                          <p className="font-medium text-charcoal-900 dark:text-ivory-200">{r.roomNumber}</p>
                          <p className="text-[11px] text-charcoal-500">{r.blockName}</p>
                        </td>
                        <td className="p-3.5 font-bold text-rose-primary dark:text-rose-light">
                          Bed {bed.bedNumber}
                        </td>
                        <td className="p-3.5 text-charcoal-600 dark:text-ivory-300">
                          {bed.branch || "General Program"}
                        </td>
                        <td className="p-3.5 text-charcoal-500">
                          {bed.allocatedDate || "2026-08-01"}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                            {bed.feeStatus || "PAID"}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setStatusMessage({ type: "success", text: `Room clearance pass printed for ${bed.studentName}` });
                            }}
                            className="px-2 py-1 rounded text-[11px] font-medium text-rose-primary hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900"
                          >
                            No Dues Clearance
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GATE PASS & OUTPASS */}
      {activeTab === "gatepass" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Warden Digital Outpass & Leave Gate
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Real-time security check-in/out and parent verified emergency authorization
              </p>
            </div>
            <button
              onClick={() => setShowPassModal(true)}
              className="px-4 py-2 bg-rose-primary text-white rounded-lg text-xs font-semibold hover:bg-rose-accent transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Outpass Request
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {gatePasses.map((pass) => {
              const statusPill =
                pass.status === "APPROVED"
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300"
                  : pass.status === "PENDING_WARDEN"
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300"
                  : pass.status === "CHECKED_OUT"
                  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300"
                  : pass.status === "RETURNED"
                  ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 border-purple-300"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-300";

              return (
                <div
                  key={pass.id}
                  className="bg-white dark:bg-charcoal-900 p-5 rounded-xl border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {pass.passNumber}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${statusPill}`}>
                        {pass.status.replace("_", " ")}
                      </span>
                      {pass.parentConsentVerified && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Parent Consent Verified
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                      {pass.studentName} ({pass.studentRoll}) — Room {pass.roomNumber}, {pass.blockName}
                    </h3>
                    <p className="text-xs text-charcoal-600 dark:text-ivory-300 font-medium">
                      <span className="text-charcoal-400">Destination:</span> {pass.destination} •{" "}
                      <span className="text-charcoal-400">Reason:</span> {pass.reason}
                    </p>
                    <div className="text-[11px] text-charcoal-500 dark:text-ivory-400 flex flex-wrap gap-4 pt-1">
                      <span>Departure: {new Date(pass.departureTime).toLocaleString()}</span>
                      <span>Expected Return: {new Date(pass.expectedReturnTime).toLocaleString()}</span>
                      <span>Emergency Tel: {pass.emergencyContact}</span>
                    </div>
                    {pass.remarks && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                        Warden Notes: {pass.remarks}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons for Warden / Guard */}
                  <div className="flex flex-wrap items-center gap-2">
                    {pass.status === "PENDING_WARDEN" && (
                      <>
                        <button
                          onClick={() => handleProcessPass(pass.id, "APPROVE")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleProcessPass(pass.id, "REJECT")}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </>
                    )}
                    {pass.status === "APPROVED" && (
                      <button
                        onClick={() => handleProcessPass(pass.id, "CHECK_OUT")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                      >
                        Guard Check-Out
                      </button>
                    )}
                    {pass.status === "CHECKED_OUT" && (
                      <button
                        onClick={() => handleProcessPass(pass.id, "RETURN")}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                      >
                        Register Return
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DINING & MESS MANAGEMENT */}
      {activeTab === "mess" && (
        <div className="space-y-6">
          {/* Live Dining Session & Turnstile Card */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-border dark:border-charcoal-800">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    SESSION ACTIVE: EXECUTIVE DINNER (19:30 – 22:00)
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 font-medium">
                    Closing in 1h 42m
                  </span>
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
                  Smart Dining Hall Headcount & Biometric Turnstile Terminal
                </h3>
                <p className="text-xs text-charcoal-500 max-w-xl">
                  Automated optical turnstile with biometric token validation, anti-passback double-punch prevention, and HACCP dietary compliance tracking.
                </p>
              </div>

              {/* Headcount Gauge */}
              <div className="w-full lg:w-72 bg-ivory-50 dark:bg-charcoal-800/60 p-4 rounded-xl border border-border dark:border-charcoal-700/80">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-charcoal-500 font-medium">Live Seating Occupancy:</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                    {diningHeadcount} / 450 ({Math.round((diningHeadcount / 450) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-border dark:bg-charcoal-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (diningHeadcount / 450) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Normal dining throughput • Lane 1-4 active
                </p>
              </div>
            </div>

            {/* Turnstile Punch Station */}
            <div className="mt-6 bg-gradient-to-r from-rose-50/50 via-ivory-50 to-rose-50/50 dark:from-rose-950/20 dark:via-charcoal-850 dark:to-rose-950/20 p-5 rounded-xl border border-rose-100 dark:border-rose-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-charcoal-800 rounded-xl shadow-xs border border-border dark:border-charcoal-700">
                  <QrCode className="w-7 h-7 text-rose-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                    Biometric Turnstile Gate #01 (Optical/RFID)
                  </h4>
                  <p className="text-xs text-charcoal-500">
                    Resident: <span className="font-semibold text-charcoal-700 dark:text-ivory-200">{currentUser?.fullName || "Alex Rivera"}</span> • Plan: All-Access Buffet
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleBiometricPunch}
                  disabled={hasPunchedThisSession}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
                    hasPunchedThisSession
                      ? "bg-emerald-600 text-white cursor-not-allowed opacity-90"
                      : "bg-rose-primary text-white hover:bg-rose-accent active:scale-95 hover:shadow-md"
                  }`}
                >
                  {hasPunchedThisSession ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      Turnstile Token Redeemed (Gate Passed)
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4" />
                      Punch Biometric Meal Token
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Recent Biometric Token Logs */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-charcoal-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-primary" /> Recent Biometric Turnstile Token Log
                </h4>
                <span className="text-[11px] text-charcoal-400">Anti-Passback Verification: Active</span>
              </div>
              <div className="overflow-x-auto border border-border dark:border-charcoal-800 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-500">
                    <tr>
                      <th className="p-3">Student / Resident</th>
                      <th className="p-3">Plan Enrolled</th>
                      <th className="p-3">Meal Session</th>
                      <th className="p-3">Verified Lane</th>
                      <th className="p-3">Cryptographic Token</th>
                      <th className="p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-charcoal-800">
                    {punchedMeals.map((punch) => (
                      <tr key={punch.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                        <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100">
                          {punch.studentName} <span className="font-normal text-charcoal-400">({punch.studentRoll})</span>
                        </td>
                        <td className="p-3 text-charcoal-600 dark:text-ivory-300">{punch.plan}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                            {punch.mealType}
                          </span>
                        </td>
                        <td className="p-3 text-charcoal-500 font-mono text-[11px]">{punch.lane}</td>
                        <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">{punch.tokenHash}</td>
                        <td className="p-3 text-charcoal-500 font-medium">{punch.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Mess Subscriptions Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {messPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-6 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        {plan.dietType.replace("_", " ")}
                      </span>
                      <h3 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100 mt-2">
                        {plan.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100">
                        ${plan.monthlyFee}
                      </p>
                      <p className="text-xs text-charcoal-500">per calendar month</p>
                    </div>
                  </div>
                  <p className="text-xs text-charcoal-600 dark:text-ivory-300 mt-2">
                    {plan.description}
                  </p>

                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-1.5 text-xs">
                    <p className="font-semibold text-charcoal-800 dark:text-ivory-200">Weekly Menu Highlights:</p>
                    <p><span className="text-charcoal-500 font-medium">Breakfast:</span> {plan.weeklyHighlights.breakfast}</p>
                    <p><span className="text-charcoal-500 font-medium">Lunch:</span> {plan.weeklyHighlights.lunch}</p>
                    <p><span className="text-charcoal-500 font-medium">Snacks:</span> {plan.weeklyHighlights.snacks}</p>
                    <p><span className="text-charcoal-500 font-medium">Dinner:</span> {plan.weeklyHighlights.dinner}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border dark:border-charcoal-800 flex items-center justify-between">
                  <span className="text-xs text-charcoal-500">
                    {plan.activeSubscribers} Active Residents Enrolled
                  </span>
                  <button
                    onClick={() => handleSubscribeMess(plan.id)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors shadow-sm"
                  >
                    Select Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Request Outpass */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                New Hostel Leave & Outpass Application
              </h3>
              <button
                onClick={() => setShowPassModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePass} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Student Name & Roll
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={passForm.studentName}
                    onChange={(e) => setPassForm({ ...passForm, studentName: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="Full Name"
                  />
                  <input
                    type="text"
                    required
                    value={passForm.studentRoll}
                    onChange={(e) => setPassForm({ ...passForm, studentRoll: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="Roll No"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Reason for Outpass
                </label>
                <input
                  type="text"
                  required
                  value={passForm.reason}
                  onChange={(e) => setPassForm({ ...passForm, reason: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g., Hackathon Competition / Family Event"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Destination Address
                </label>
                <input
                  type="text"
                  required
                  value={passForm.destination}
                  onChange={(e) => setPassForm({ ...passForm, destination: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g., Boston, MA / Home"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Departure Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={passForm.departureTime}
                    onChange={(e) => setPassForm({ ...passForm, departureTime: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Expected Return Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={passForm.expectedReturnTime}
                    onChange={(e) => setPassForm({ ...passForm, expectedReturnTime: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Parent / Emergency Telephone
                </label>
                <input
                  type="text"
                  required
                  value={passForm.emergencyContact}
                  onChange={(e) => setPassForm({ ...passForm, emergencyContact: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Allocate Bed */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Allocate Bed to Student
              </h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAllocateBed} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Select Room
                </label>
                <select
                  required
                  value={allocateForm.roomId}
                  onChange={(e) => setAllocateForm({ ...allocateForm, roomId: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  <option value="">-- Choose Room --</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.roomNumber} ({rm.blockName}) - {rm.occupiedCount}/{rm.capacity} Occupied
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Bed Letter
                </label>
                <select
                  value={allocateForm.bedNumber}
                  onChange={(e) => setAllocateForm({ ...allocateForm, bedNumber: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  <option value="A">Bed A</option>
                  <option value="B">Bed B</option>
                  <option value="C">Bed C</option>
                  <option value="D">Bed D</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={allocateForm.studentName}
                    onChange={(e) => setAllocateForm({ ...allocateForm, studentName: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="e.g. Jordan Lee"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Roll / Registration No
                  </label>
                  <input
                    type="text"
                    required
                    value={allocateForm.studentRoll}
                    onChange={(e) => setAllocateForm({ ...allocateForm, studentRoll: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                    placeholder="e.g. CS2026-044"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  required
                  value={allocateForm.branch}
                  onChange={(e) => setAllocateForm({ ...allocateForm, branch: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. B.Tech Computer Science"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
