"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Building,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Volume2,
  Download,
  Eye,
  Printer,
} from "lucide-react";
import { CampusVenue, EventBooking, BookingStatus } from "@/lib/events/events-engine";

interface EventsSummary {
  totalVenues: number;
  totalCapacity: number;
  totalBookings: number;
  confirmedCount: number;
  pendingCount: number;
  venues: CampusVenue[];
}

export default function EventsPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"bookings" | "venues" | "calendar">("bookings");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EventsSummary | null>(null);
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [venues, setVenues] = useState<CampusVenue[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedBookingDossier, setSelectedBookingDossier] = useState<EventBooking | null>(null);

  // New Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    eventTitle: "",
    organizingDepartmentOrClub: "Computer Science Society",
    category: "ACADEMIC_SYMPOSIUM",
    venueId: "vn-01",
    eventDate: "2026-11-20",
    timeSlot: "09:00 - 13:00",
    expectedAttendees: 200,
    contactPersonName: currentUser?.fullName || "Prof. Sarah Chen",
    contactPersonEmail: currentUser?.email || "sarah.chen@apex.edu",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const handleExportEventsCsv = () => {
    const listToExport = filteredBookings;
    const headers = ["Booking Ref", "Event Title", "Organizing Unit", "Category", "Venue", "Event Date", "Time Slot", "Attendees", "Status", "Contact Person", "Contact Email"];
    const rows = listToExport.map((b) => [
      b.bookingRef,
      `"${b.eventTitle.replace(/"/g, '""')}"`,
      `"${b.organizingDepartmentOrClub.replace(/"/g, '""')}"`,
      b.category,
      `"${b.venueName.replace(/"/g, '""')}"`,
      b.eventDate,
      `"${b.timeSlot}"`,
      b.expectedAttendees,
      b.status,
      `"${b.contactPersonName || ""}"`,
      `"${b.contactPersonEmail || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Campus_Events_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.organizingDepartmentOrClub.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, bRes, vRes] = await Promise.all([
        fetch("/api/events?tab=summary"),
        fetch("/api/events?tab=bookings"),
        fetch("/api/events?tab=venues"),
      ]);

      if (sumRes.ok) {
        const sData = await sumRes.json();
        setSummary(sData.summary);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
      if (vRes.ok) {
        const vData = await vRes.json();
        setVenues(vData.venues || []);
      }
    } catch (err) {
      console.error("Failed to load events data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_BOOKING",
          ...bookingForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reserve venue");

      setStatusMessage({ type: "success", text: data.message });
      setShowModal(false);
      setBookingForm({
        eventTitle: "",
        organizingDepartmentOrClub: "Computer Science Society",
        category: "ACADEMIC_SYMPOSIUM",
        venueId: "vn-01",
        eventDate: "2026-11-20",
        timeSlot: "09:00 - 13:00",
        expectedAttendees: 200,
        contactPersonName: currentUser?.fullName || "Prof. Sarah Chen",
        contactPersonEmail: currentUser?.email || "sarah.chen@apex.edu",
      });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDecideBooking = async (bookingId: string, status: BookingStatus) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DECIDE_BOOKING",
          bookingId,
          status,
          remarks: status === "CONFIRMED" ? "Sanctioned by Campus Estate Officer." : "Declined due to facility maintenance.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update reservation");

      setStatusMessage({ type: "success", text: data.message });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Events & Venue Reservation Suite
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Auditoriums, seminar halls, sports arenas, conflict-free booking scheduler, and estate approvals.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportEventsCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Bookings (CSV)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Book Campus Venue
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Campus Venues</span>
            <Building className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalVenues ?? "--"}
            </span>
            <span className="text-xs text-slate-500">halls & arenas</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Auditoriums, seminar halls & sports complexes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Seating Capacity</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalCapacity?.toLocaleString() ?? "--"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">seats</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Combined spectator & attendee capacity</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Confirmed Bookings</span>
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.confirmedCount ?? "--"}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">events active</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Sanctioned university calendar fixtures</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Clearance</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.pendingCount ?? "--"}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">requests</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Awaiting Estate Officer approval</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "bookings"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Event Reservations ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab("venues")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "venues"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Building className="w-4 h-4" />
          Venues & Specifications ({venues.length})
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "calendar"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Campus Event Highlights
        </button>
      </div>

      {/* Tab 1: Bookings Table */}
      {activeTab === "bookings" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Venue Reservation Ledger</h3>
              <p className="text-xs text-slate-400">{filteredBookings.length} of {bookings.length} reservations matching</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search events, venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48 sm:w-56"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Ref #</th>
                  <th className="p-4">Event & Organizer</th>
                  <th className="p-4">Venue</th>
                  <th className="p-4">Date & Slot</th>
                  <th className="p-4">Attendees</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-medium text-xs text-indigo-600 dark:text-indigo-400">
                      {b.bookingRef}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{b.eventTitle}</div>
                      <div className="text-xs text-slate-400">{b.organizingDepartmentOrClub}</div>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        {b.venueName}
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-medium">{b.eventDate}</div>
                      <div className="text-slate-400">{b.timeSlot}</div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      {b.expectedAttendees} pax
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : b.status === "CANCELLED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBookingDossier(b)}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Dossier
                        </button>
                        {b.status === "PENDING_APPROVAL" && (
                          <>
                            <button
                              onClick={() => handleDecideBooking(b.id, "CONFIRMED")}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:hover:bg-emerald-900 rounded-lg text-xs"
                              title="Approve Booking"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDecideBooking(b.id, "CANCELLED")}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 rounded-lg text-xs"
                              title="Decline Booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Event Bookings Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No event bookings match your current search query or status filter.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Venues Catalog */}
      {activeTab === "venues" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{venue.name}</h4>
                  <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-xs">
                    {venue.seatingCapacity} Seats
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {venue.building}
                </p>

                <div className="mt-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Equipped Amenities & AV Tech
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {venue.amenities.map((item, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Custodian: {venue.custodianOfficer}</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Operational
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Highlights & Public Calendar */}
      {activeTab === "calendar" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Institutional Flagship Events 2026</h3>
            <p className="text-xs text-slate-500">Major academic conventions, research symposiums, and cultural festivals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings
              .filter((b) => b.status === "CONFIRMED")
              .map((b) => (
                <div key={b.id} className="p-5 border border-indigo-100 dark:border-indigo-950/60 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold rounded">
                      {b.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{b.eventDate}</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{b.eventTitle}</h4>
                  <p className="text-xs text-slate-500">Venue: {b.venueName} ({b.timeSlot})</p>
                  <div className="text-xs text-slate-400 pt-2 border-t border-indigo-100 dark:border-indigo-950/60 flex justify-between">
                    <span>Host: {b.organizingDepartmentOrClub}</span>
                    <span>Expected: {b.expectedAttendees} Attendees</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Book Venue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              Book Campus Facility or Auditorium
            </h3>

            <form onSubmit={handleCreateBooking} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Title</label>
                <input
                  type="text"
                  required
                  value={bookingForm.eventTitle}
                  onChange={(e) => setBookingForm({ ...bookingForm, eventTitle: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. International Conference on Robotics"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organizing Dept / Club</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.organizingDepartmentOrClub}
                    onChange={(e) => setBookingForm({ ...bookingForm, organizingDepartmentOrClub: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={bookingForm.category}
                    onChange={(e) => setBookingForm({ ...bookingForm, category: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="ACADEMIC_SYMPOSIUM">Academic Symposium</option>
                    <option value="GUEST_LECTURE">Guest Lecture</option>
                    <option value="CULTURAL_FEST">Cultural Fest</option>
                    <option value="SPORTS_TOURNAMENT">Sports Tournament</option>
                    <option value="HACKATHON">Hackathon / Sprint</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Venue</label>
                <select
                  value={bookingForm.venueId}
                  onChange={(e) => setBookingForm({ ...bookingForm, venueId: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (Cap: {v.seatingCapacity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Event Date</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.eventDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time Slot</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="09:00 - 13:00">Morning (09:00 - 13:00)</option>
                    <option value="14:00 - 18:00">Afternoon (14:00 - 18:00)</option>
                    <option value="18:30 - 22:00">Evening (18:30 - 22:00)</option>
                    <option value="FULL_DAY">Full Day Booking</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Expected Attendees</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={bookingForm.expectedAttendees}
                    onChange={(e) => setBookingForm({ ...bookingForm, expectedAttendees: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.contactPersonEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, contactPersonEmail: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Dossier Inspection Modal */}
      {selectedBookingDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedBookingDossier.bookingRef}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {selectedBookingDossier.eventTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Facility Reservation Dossier • Campus Venues Desk
                </p>
              </div>
              <button
                onClick={() => setSelectedBookingDossier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Reserved Facility:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBookingDossier.venueName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Event Date & Schedule:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{selectedBookingDossier.eventDate} ({selectedBookingDossier.timeSlot})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Organizing Department / Club:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedBookingDossier.organizingDepartmentOrClub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Attendance:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedBookingDossier.expectedAttendees} Attendees</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Reservation Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedBookingDossier.status === 'CONFIRMED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedBookingDossier.status === 'CANCELLED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedBookingDossier.status}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Organizer Contact:</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Officer:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedBookingDossier.contactPersonName || "Event Convener"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedBookingDossier.contactPersonEmail || "events@classroom.edu"}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                {selectedBookingDossier.status === "PENDING_APPROVAL" && (
                  <>
                    <button
                      onClick={async () => {
                        await handleDecideBooking(selectedBookingDossier.id, "CONFIRMED");
                        setSelectedBookingDossier((prev: any) => ({ ...prev, status: "CONFIRMED" }));
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Approve Booking
                    </button>
                    <button
                      onClick={async () => {
                        await handleDecideBooking(selectedBookingDossier.id, "CANCELLED");
                        setSelectedBookingDossier((prev: any) => ({ ...prev, status: "CANCELLED" }));
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg font-semibold transition-colors"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Sanction Order
                </button>
                <button
                  onClick={() => setSelectedBookingDossier(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
