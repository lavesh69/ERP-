"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  DollarSign,
  FileCheck,
  FileText,
  Hotel,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Utensils,
  X,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  GuestHouseRoom,
  GuestHouseBooking,
  GuestHouseAnalytics,
} from "@/lib/campus/guesthouse-engine";

export function GuestHouseView() {
  const { currentUser, currentRole, showToast } = useApp();
  const [rooms, setRooms] = useState<GuestHouseRoom[]>([]);
  const [bookings, setBookings] = useState<GuestHouseBooking[]>([]);
  const [analytics, setAnalytics] = useState<GuestHouseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"rooms" | "bookings">("bookings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [showReqModal, setShowReqModal] = useState(false);
  const [showDiningModal, setShowDiningModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<GuestHouseBooking | null>(null);

  // Forms
  const [reqForm, setReqForm] = useState({
    roomId: "RM-102",
    guestName: "Prof. Arvind Ramanujan",
    guestAffiliation: "Cambridge University / IIT Madras",
    guestDesignation: "Chair Professor of Theoretical Computer Science",
    guestPhone: "+91 94440 98765",
    guestEmail: "arvind.r@cam.ac.uk",
    purpose: "GUEST_LECTURE" as GuestHouseBooking["purpose"],
    sponsoringDepartment: "School of Computing & Data Science",
    sponsorFacultyName: currentUser?.name || currentUser?.fullName || "Prof. Department Coordinator",
    checkInDate: new Date().toISOString().split("T")[0],
    checkOutDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    billingMode: "DEPT_BUDGET" as GuestHouseBooking["billingMode"],
    departmentBudgetCode: "CS-VISITING-EXP-2026",
    remarks: "Requires airport pickup and high-speed fiber terminal for seminar prep.",
  });

  const [diningForm, setDiningForm] = useState({
    mealType: "DINNER" as "BREAKFAST" | "LUNCH" | "HIGH_TEA" | "DINNER",
    amountInr: 450,
    description: "North Indian Deluxe Thali & Fresh Fruit Platter",
  });

  const isEstateAdmin = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "REGISTRAR",
    "ESTATE_OFFICER",
    "BURSAR",
    "HOD",
  ].includes(currentRole);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campus/guesthouse");
      const json = await res.json();
      if (json.success) {
        setRooms(json.data.rooms || []);
        setBookings(json.data.bookings || []);
        setAnalytics(json.data.analytics || null);
      }
    } catch {
      showToast?.("Error fetching guest house records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowReqModal(false);
        setShowDiningModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleRequestBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/campus/guesthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_BOOKING",
          ...reqForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Guest house requisition submitted for Estate Officer approval!", "success");
        setShowReqModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to submit booking", "error");
      }
    } catch {
      showToast?.("Network error submitting requisition", "error");
    }
  };

  const handleApprove = async (bookingId: string) => {
    try {
      const res = await fetch("/api/campus/guesthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_BOOKING",
          bookingId,
          approvedBy: "Col. Sanjeev Nair (Estate Officer & Registrar)",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Booking approved & Allotment Order issued!", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Approval failed", "error");
      }
    } catch {
      showToast?.("Network error approving booking", "error");
    }
  };

  const handleCheckIn = async (bookingId: string) => {
    try {
      const res = await fetch("/api/campus/guesthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_IN",
          bookingId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Guest checked in! Room key issued.", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Check-in failed", "error");
      }
    } catch {
      showToast?.("Network error checking in", "error");
    }
  };

  const handleAddDining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await fetch("/api/campus/guesthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_DINING",
          bookingId: selectedBooking.id,
          ...diningForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Dining charge posted to guest room folio!", "success");
        setShowDiningModal(false);
        fetchRecords();
      } else {
        showToast?.(json.error || "Failed to post dining charge", "error");
      }
    } catch {
      showToast?.("Network error posting dining charge", "error");
    }
  };

  const handleCheckOut = async (bookingId: string) => {
    try {
      const res = await fetch("/api/campus/guesthouse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_OUT_INVOICE",
          bookingId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast?.("Guest checked out & final Bursar invoice generated!", "success");
        fetchRecords();
      } else {
        showToast?.(json.error || "Check-out failed", "error");
      }
    } catch {
      showToast?.("Network error checking out", "error");
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.guestName.toLowerCase().includes(search.toLowerCase()) ||
      b.guestAffiliation.toLowerCase().includes(search.toLowerCase()) ||
      b.requisitionNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      b.sponsoringDepartment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-neutral-900 to-rose-950/30 p-6 rounded-2xl border border-amber-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Campus Estates & Works Directorate
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Hospitality & Transit Wing
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Hotel className="w-6 h-6 text-amber-400" />
            University Guest House & Transit Accommodation Portal
          </h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
            V.I.P. Presidential Suites, Visiting Professor transit flats, and External Examiner lodging with
            departmental budget debiting, mess dining billing, and Estate Officer cryptographic allotment seals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowReqModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            Book Suite / Requisition
          </button>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white border border-neutral-700 transition"
            title="Refresh Records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Inventory</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{analytics.totalRooms} Rooms</div>
            <div className="text-xs text-neutral-400 mt-1">Across 3 Campus Wings</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Vacant & Ready</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{analytics.availableRooms} Available</div>
            <div className="text-xs text-emerald-400/80 mt-1">Ready for Check-In</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Residents</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-300">{analytics.activeResidents} In House</div>
            <div className="text-xs text-neutral-400 mt-1">Occupying Suites</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Estate Queue</span>
              <Clock className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-300">{analytics.pendingApprovals} Pending</div>
            <div className="text-xs text-neutral-400 mt-1">Awaiting Allotment</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Billing</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">
              ₹{(analytics.revenueTotalInr / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-neutral-400 mt-1">Tariffs & Dining Folio</div>
          </div>

          <div className="bg-neutral-900/80 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Dept Debited</span>
              <FileCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-300">
              ₹{(analytics.deptDebitedInr / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-purple-400/80 mt-1">Charged to Exam/Depts</div>
          </div>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "bookings"
              ? "bg-amber-600 text-white"
              : "bg-neutral-900 text-neutral-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Requisitions & Stays ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "rooms"
              ? "bg-amber-600 text-white"
              : "bg-neutral-900 text-neutral-400 hover:text-white"
          }`}
        >
          <Hotel className="w-4 h-4" />
          Suite & Transit Inventory ({rooms.length})
        </button>
      </div>

      {activeTab === "rooms" ? (
        /* Room Inventory View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-5 rounded-2xl border transition ${
                room.isAvailable
                  ? "bg-neutral-900/80 border-neutral-800 hover:border-amber-500/50"
                  : "bg-neutral-950/90 border-neutral-800/80"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      room.category === "VIP_SUITE"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : room.category === "FACULTY_TRANSIT"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-neutral-800 text-neutral-300"
                    }`}
                  >
                    {room.category.replace(/_/g, " ")}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">{room.roomNumber}</h3>
                  <div className="text-xs text-neutral-400">
                    Floor {room.floor} • {room.wing.replace(/_/g, " ")}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    room.isAvailable
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {room.isAvailable ? "Vacant" : "Occupied"}
                </span>
              </div>

              <div className="my-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs text-neutral-400">Statutory Tariff:</span>
                <span className="text-sm font-bold text-amber-400">
                  ₹{room.baseTariffPerNight.toLocaleString()}{" "}
                  <span className="text-xs text-neutral-500 font-normal">/ night</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-2 py-0.5 rounded text-[10px] bg-neutral-950 text-neutral-400 border border-neutral-800"
                  >
                    {amenity}
                  </span>
                ))}
              </div>

              {room.isAvailable && (
                <button
                  onClick={() => {
                    setReqForm({ ...reqForm, roomId: room.id });
                    setShowReqModal(true);
                  }}
                  className="w-full mt-4 py-2 rounded-xl text-xs font-bold bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Requisition This Suite
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Bookings List View */
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-neutral-400 uppercase font-semibold">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING_ESTATE_APPROVAL">Pending Estate Approval</option>
                <option value="CONFIRMED">Confirmed / Allotted</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search guest, department, requisition..."
                className="w-full bg-neutral-950 border border-neutral-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-neutral-900/60 rounded-xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/90 text-xs uppercase tracking-wider text-neutral-400">
                    <th className="px-4 py-3">Guest & Purpose</th>
                    <th className="px-4 py-3">Suite / Wing</th>
                    <th className="px-4 py-3">Stay Dates</th>
                    <th className="px-4 py-3">Billing Head</th>
                    <th className="px-4 py-3">Folio Total</th>
                    <th className="px-4 py-3">Status & Order</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                        No guest house requisitions found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-800/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-white">{b.guestName}</div>
                          <div className="text-xs text-neutral-400">{b.guestAffiliation}</div>
                          <div className="text-[11px] text-amber-400/90 font-medium mt-0.5">
                            {b.purpose.replace(/_/g, " ")} • Sponsoring: {b.sponsoringDepartment}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-medium text-neutral-200 flex items-center gap-1.5">
                            <Hotel className="w-3.5 h-3.5 text-amber-400" />
                            {b.roomNumber}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {b.roomCategory.replace(/_/g, " ")}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-xs text-neutral-300 font-semibold">{b.numberOfNights} Nights</div>
                          <div className="text-[11px] text-neutral-400">
                            {b.checkInDate} → {b.checkOutDate}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-300">
                            {b.billingMode.replace(/_/g, " ")}
                          </span>
                          {b.departmentBudgetCode && (
                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {b.departmentBudgetCode}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-bold text-amber-400">
                            ₹{b.grandTotalInr.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Tariff: ₹{b.roomChargesTotal} | Mess: ₹{b.diningChargesTotal}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              b.status === "CHECKED_IN"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : b.status === "CHECKED_OUT"
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : b.status === "CONFIRMED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {b.status.replace(/_/g, " ")}
                          </span>
                          {b.allotmentNumber && (
                            <div className="text-[10px] text-neutral-400 font-mono mt-1">
                              {b.allotmentNumber}
                            </div>
                          )}
                          {b.invoiceNumber && (
                            <div className="text-[10px] text-emerald-400 font-mono">
                              Inv: {b.invoiceNumber}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Estate Officer Approval */}
                            {isEstateAdmin && b.status === "PENDING_ESTATE_APPROVAL" && (
                              <button
                                onClick={() => handleApprove(b.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                              >
                                <FileCheck className="w-3 h-3" />
                                Approve
                              </button>
                            )}

                            {/* Check In Action */}
                            {b.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleCheckIn(b.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                Check-In
                              </button>
                            )}

                            {/* Dining Charge & Check Out */}
                            {b.status === "CHECKED_IN" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setShowDiningModal(true);
                                  }}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition flex items-center gap-1"
                                >
                                  <Utensils className="w-3 h-3 text-amber-400" />
                                  + Dining
                                </button>
                                <button
                                  onClick={() => handleCheckOut(b.id)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center gap-1"
                                >
                                  <LogOut className="w-3 h-3" />
                                  Check-Out
                                </button>
                              </>
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

      {/* MODAL 1: REQUEST SUITE REQUISITION */}
      {showReqModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReqModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Hotel className="w-5 h-5 text-amber-400" />
                Guest House Suite Requisition
              </h3>
              <button onClick={() => setShowReqModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestBooking} className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-300 font-semibold">Select Available Suite / Flat</label>
                <select
                  value={reqForm.roomId}
                  onChange={(e) => setReqForm({ ...reqForm, roomId: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} disabled={!r.isAvailable}>
                      {r.roomNumber} ({r.category.replace(/_/g, " ")}) — ₹{r.baseTariffPerNight}/night {r.isAvailable ? "(Vacant)" : "(Occupied)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Guest Full Name</label>
                  <input
                    type="text"
                    required
                    value={reqForm.guestName}
                    onChange={(e) => setReqForm({ ...reqForm, guestName: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Affiliation / University</label>
                  <input
                    type="text"
                    required
                    value={reqForm.guestAffiliation}
                    onChange={(e) => setReqForm({ ...reqForm, guestAffiliation: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Official Purpose</label>
                  <select
                    value={reqForm.purpose}
                    onChange={(e) => setReqForm({ ...reqForm, purpose: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="EXTERNAL_EXAMINER">External Examiner (PhD/Viva)</option>
                    <option value="VISITING_PROFESSOR">Visiting Professor</option>
                    <option value="ACCREDITATION_TEAM">NAAC / NBA Accreditation Peer</option>
                    <option value="GUEST_LECTURE">Invited Distinguished Lecture</option>
                    <option value="OFFICIAL_CONFERENCE">Official University Conference</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Sponsoring Department</label>
                  <input
                    type="text"
                    required
                    value={reqForm.sponsoringDepartment}
                    onChange={(e) => setReqForm({ ...reqForm, sponsoringDepartment: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Check-In Date</label>
                  <input
                    type="date"
                    required
                    value={reqForm.checkInDate}
                    onChange={(e) => setReqForm({ ...reqForm, checkInDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Check-Out Date</label>
                  <input
                    type="date"
                    required
                    value={reqForm.checkOutDate}
                    onChange={(e) => setReqForm({ ...reqForm, checkOutDate: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Billing Mode</label>
                  <select
                    value={reqForm.billingMode}
                    onChange={(e) => setReqForm({ ...reqForm, billingMode: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="DEPT_BUDGET">Department Budget Debit</option>
                    <option value="PROJECT_GRANT">Sponsored Research Grant</option>
                    <option value="SELF_PAID">Self Paid by Guest</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Budget Account Code</label>
                  <input
                    type="text"
                    value={reqForm.departmentBudgetCode}
                    onChange={(e) => setReqForm({ ...reqForm, departmentBudgetCode: e.target.value })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  Submit For Estate Officer Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD DINING CHARGE */}
      {showDiningModal && selectedBooking && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDiningModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-400" />
                Add Guest Dining Charge
              </h3>
              <button onClick={() => setShowDiningModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 space-y-1">
              <div><span className="text-neutral-500">Guest:</span> {selectedBooking.guestName}</div>
              <div><span className="text-neutral-500">Suite:</span> {selectedBooking.roomNumber}</div>
            </div>

            <form onSubmit={handleAddDining} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-neutral-300 font-semibold">Meal Type</label>
                  <select
                    value={diningForm.mealType}
                    onChange={(e) => setDiningForm({ ...diningForm, mealType: e.target.value as any })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  >
                    <option value="BREAKFAST">Breakfast</option>
                    <option value="LUNCH">Lunch</option>
                    <option value="HIGH_TEA">High Tea & Snacks</option>
                    <option value="DINNER">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="text-neutral-300 font-semibold">Amount (INR)</label>
                  <input
                    type="number"
                    step="10"
                    value={diningForm.amountInr}
                    onChange={(e) => setDiningForm({ ...diningForm, amountInr: Number(e.target.value) })}
                    className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold">Meal Description</label>
                <input
                  type="text"
                  required
                  value={diningForm.description}
                  onChange={(e) => setDiningForm({ ...diningForm, description: e.target.value })}
                  className="w-full mt-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowDiningModal(false)}
                  className="px-4 py-2 rounded-xl text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-lg"
                >
                  Post To Room Folio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
