"use client";

import React, { useState, useEffect } from "react";
import {
  Microscope,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Activity,
  FileText,
  User,
  Plus,
  Zap,
  Cpu,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Check,
} from "lucide-react";

export default function CIFPortalTab() {
  const [loading, setLoading] = useState(true);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [activeSubTab, setActiveSubTab] = useState<"catalog" | "bookings" | "calibrations">("catalog");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    userId: "scholar-phd-809",
    userName: "Vikramaditya Rathore",
    userEmail: "v.rathore@res.apex.edu",
    userCategory: "INTERNAL_SCHOLAR",
    departmentOrOrg: "Dept. of Metallurgical & Materials Engineering",
    grantCode: "",
    supervisorName: "Prof. Arvind Trivedi",
    bookingDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    timeSlot: "MORNING_0930_1300",
    sampleCount: 3,
    sampleState: "SOLID_POWDER",
    hazardLevel: "NON_HAZARDOUS",
    safetyDeclarationAccepted: true,
    samplePrepRequired: true,
    samplePrepDetails: "Gold sputter conductive coating required for SEM imaging.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calibration Modal
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [calForm, setCalForm] = useState({
    instrumentId: "",
    calibrationType: "ROUTINE_PREVENTATIVE",
    calibrationAgency: "OEM Precision Engineering Services Ltd.",
    technicianName: "Mr. M. Joseph (Certified Metrologist)",
    status: "PASSED",
    certificateNumber: `NABL-CAL-${Date.now().toString().slice(-6)}`,
    notes: "Laser optical alignment, vacuum chamber seals, and electron column beam stigmatism tuned.",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/research/cif");
      const json = await res.json();
      if (json.success) {
        setInstruments(json.instruments || []);
        setBookings(json.bookings || []);
        setCalibrations(json.calibrations || []);
        setAnalytics(json.analytics || null);
      }
    } catch (err: any) {
      console.error("Error fetching CIF data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!showBookingModal && !showCalibrationModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowBookingModal(false);
        setShowCalibrationModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showBookingModal, showCalibrationModal]);

  const handleOpenBooking = (inst: any) => {
    setSelectedInstrument(inst);
    setShowBookingModal(true);
  };

  const calculateEstimate = () => {
    if (!selectedInstrument) return 0;
    const hours = bookingForm.timeSlot === "FULL_DAY_0930_1730" ? 7.0 : 3.5;
    let rate = selectedInstrument.rates.internalScholarPerHour;
    if (bookingForm.userCategory === "FACULTY_GRANT") rate = selectedInstrument.rates.facultyGrantPerHour;
    else if (bookingForm.userCategory === "EXTERNAL_ACADEMIC") rate = selectedInstrument.rates.externalAcademicPerHour;
    else if (bookingForm.userCategory === "INDUSTRY_RND") rate = selectedInstrument.rates.industryRndPerHour;

    const prep = bookingForm.samplePrepRequired ? selectedInstrument.rates.samplePrepCharge * bookingForm.sampleCount : 0;
    return Math.round(rate * hours + prep);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstrument) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/research/cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_SLOT",
          instrumentId: selectedInstrument.id,
          ...bookingForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Slot requisition submitted successfully with token reference!" });
        setShowBookingModal(false);
        fetchData();
      } else {
        setStatusMessage({ type: "error", text: data.error || "Submission failed" });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSafety = async (bookingId: string) => {
    try {
      const res = await fetch("/api/research/cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLEAR_SAFETY",
          bookingId,
          clearedBy: "Prof. Arvind Trivedi (CIF Safety Chair)",
          remarks: "MSDS safety profile audited. Samples declared non-toxic and non-corrosive.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Safety clearance stamped successfully!" });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleConfirmSlot = async (bookingId: string) => {
    try {
      const res = await fetch("/api/research/cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_SLOT",
          bookingId,
          assignedOperator: "Dr. Rajesh Sharma (Sr. Scientific Officer)",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: `Slot confirmed! Token: ${data.booking.slotToken}` });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCompleteRun = async (bookingId: string) => {
    try {
      const res = await fetch("/api/research/cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_RUN",
          bookingId,
          beamHoursUsed: 3.5,
          operatorSignature: "Dr. Rajesh Sharma, SSO",
          dataFileUrls: ["/data/cif/export_raw_01.dm3", "/data/cif/eds_report.pdf"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Analysis run certified and cryptographic seal minted!" });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const submitCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/research/cif", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_CALIBRATION",
          ...calForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Calibration log saved and equipment operational status certified!" });
        setShowCalibrationModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Microscope className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Central Instrumentation Facility (CIF)</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
              DST-FIST / NAAC Pillar III
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Advanced characterization hub for High-Resolution SEM, 500 MHz NMR, Powder XRD, HRMS, and Nanomechanical Profiling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (instruments.length > 0) setCalForm({ ...calForm, instrumentId: instruments[0].id });
              setShowCalibrationModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Log Calibration
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
              : "bg-rose-950/40 text-rose-300 border-rose-800/60"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Analytical Instruments</span>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <span>{analytics.totalInstruments}</span>
              <Microscope className="w-5 h-5 text-indigo-400 opacity-60" />
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block font-medium">
              {analytics.operationalInstruments} Online ({analytics.uptimePercentage}% Uptime)
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Total Beam Hours</span>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <span>{analytics.totalBeamHours.toLocaleString()}</span>
              <Zap className="w-5 h-5 text-amber-400 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Logged machine operation</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Samples Characterized</span>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <span>{analytics.totalSamples.toLocaleString()}</span>
              <Cpu className="w-5 h-5 text-cyan-400 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Solid, thin film, liquid</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Active Slot Bookings</span>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <span>{analytics.activeBookingsCount}</span>
              <Calendar className="w-5 h-5 text-purple-400 opacity-60" />
            </div>
            <span className="text-[11px] text-purple-400 mt-1 block">Queue in progress</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Internal / Industry Revenue</span>
            <div className="text-2xl font-bold text-emerald-400 flex items-center justify-between">
              <span>₹{analytics.totalRevenue.toLocaleString()}</span>
              <DollarSign className="w-5 h-5 text-emerald-500 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Self-sustaining corpus</span>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 gap-6 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveSubTab("catalog")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeSubTab === "catalog"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Instrument Catalog & Tariffs ({instruments.length})
        </button>
        <button
          onClick={() => setActiveSubTab("bookings")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeSubTab === "bookings"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Slot Bookings & Access Tokens ({bookings.length})
        </button>
        <button
          onClick={() => setActiveSubTab("calibrations")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeSubTab === "calibrations"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Calibration & NABL Traceability ({calibrations.length})
        </button>
      </div>

      {/* SubTab 1: Instrument Catalog */}
      {activeSubTab === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instruments.map((inst) => (
            <div
              key={inst.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                      {inst.code} · {inst.category}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{inst.name}</h3>
                    <p className="text-xs text-indigo-300 font-medium">{inst.makeModel}</p>
                  </div>
                  <span
                    className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                      inst.status === "OPERATIONAL"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {inst.status === "OPERATIONAL" ? "Operational" : "Under Calibration"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
                  {inst.specifications}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Location</span>
                    <span className="font-medium">{inst.facilityLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Custodian In-Charge</span>
                    <span className="font-medium">{inst.technicianInCharge}</span>
                  </div>
                </div>

                {/* Rate Card Grid */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Hourly Tariff Schedule
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Scholar</span>
                      <span className="font-bold text-white">₹{inst.rates.internalScholarPerHour}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">PI Grant</span>
                      <span className="font-bold text-white">₹{inst.rates.facultyGrantPerHour}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Ext. Acad</span>
                      <span className="font-bold text-white">₹{inst.rates.externalAcademicPerHour}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Industry</span>
                      <span className="font-bold text-amber-400">₹{inst.rates.industryRndPerHour}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 flex items-center justify-between border-t border-slate-800">
                <div className="text-[11px] text-slate-400">
                  Next Calib: <span className="text-slate-300 font-medium">{inst.nextCalibrationDueDate}</span>
                </div>
                <button
                  onClick={() => handleOpenBooking(inst)}
                  disabled={inst.status !== "OPERATIONAL"}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Beam Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SubTab 2: Slot Bookings */}
      {activeSubTab === "bookings" && (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">
                    {b.bookingRef}
                  </span>
                  <span className="text-sm font-bold text-white">{b.instrumentName}</span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      b.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : b.status === "SLOT_CONFIRMED"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : b.status === "SAFETY_CLEARED"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {b.status}
                  </span>
                  {b.slotToken && (
                    <span className="text-xs font-mono bg-purple-950/60 text-purple-300 px-2 py-0.5 rounded border border-purple-800">
                      Token: {b.slotToken}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    {b.userName} ({b.userCategory})
                  </span>
                  <span>{b.departmentOrOrg}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {b.bookingDate} ({b.timeSlot})
                  </span>
                  <span>{b.sampleCount} Samples ({b.sampleState})</span>
                  <span className="font-semibold text-emerald-400">₹{b.calculatedTariff}</span>
                </div>

                {b.safetyOfficerApproval && (
                  <p className="text-[11px] text-blue-300/80 bg-blue-950/30 px-2 py-1 rounded border border-blue-900/40">
                    Safety Cleared: {b.safetyOfficerApproval.remarks}
                  </p>
                )}
                {b.completionData && (
                  <p className="text-[11px] text-emerald-300/90 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-900/40 font-mono">
                    Seal: {b.completionData.cryptographicSeal.slice(0, 24)}... (Verified)
                  </p>
                )}
              </div>

              {/* Action Buttons for Lifecycle */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {b.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleClearSafety(b.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Clear Safety
                  </button>
                )}
                {b.status === "SAFETY_CLEARED" && (
                  <button
                    onClick={() => handleConfirmSlot(b.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm & Mint Token
                  </button>
                )}
                {b.status === "SLOT_CONFIRMED" && (
                  <button
                    onClick={() => handleCompleteRun(b.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Certify Run Completion
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SubTab 3: Calibrations */}
      {activeSubTab === "calibrations" && (
        <div className="space-y-3">
          {calibrations.map((cal) => (
            <div key={cal.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {cal.certificateNumber}
                  </span>
                  <span className="text-sm font-semibold text-white">{cal.instrumentCode} · {cal.calibrationAgency}</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  {cal.status}
                </span>
              </div>
              <p className="text-xs text-slate-300">{cal.notes}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Certified By: {cal.technicianName}</span>
                <span>Cal Date: {cal.calibrationDate}</span>
                <span className="text-indigo-400">Valid Until: {cal.calibrationValidUntil}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slot Booking Modal */}
      {showBookingModal && selectedInstrument && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Book CIF Beam Time Slot"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Book CIF Beam Time Slot</h3>
                <p className="text-xs text-indigo-400">{selectedInstrument.name} ({selectedInstrument.code})</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitBooking} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Scholar / Investigator Name</label>
                  <input
                    type="text"
                    value={bookingForm.userName}
                    onChange={(e) => setBookingForm({ ...bookingForm, userName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">User Category</label>
                  <select
                    value={bookingForm.userCategory}
                    onChange={(e) => setBookingForm({ ...bookingForm, userCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="INTERNAL_SCHOLAR">Internal Scholar (PhD / MTech / MSc)</option>
                    <option value="FACULTY_GRANT">Faculty Grant (Funded Project)</option>
                    <option value="EXTERNAL_ACADEMIC">External Academic (Other Inst)</option>
                    <option value="INDUSTRY_RND">Industry R&D Organization</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Department / Organization</label>
                  <input
                    type="text"
                    value={bookingForm.departmentOrOrg}
                    onChange={(e) => setBookingForm({ ...bookingForm, departmentOrOrg: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Project Grant Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. DST-SERB-CRG-2026"
                    value={bookingForm.grantCode}
                    onChange={(e) => setBookingForm({ ...bookingForm, grantCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Desired Booking Date</label>
                  <input
                    type="date"
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Time Slot</label>
                  <select
                    value={bookingForm.timeSlot}
                    onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="MORNING_0930_1300">Morning Session (09:30 - 13:00) · 3.5 hrs</option>
                    <option value="AFTERNOON_1400_1730">Afternoon Session (14:00 - 17:30) · 3.5 hrs</option>
                    <option value="FULL_DAY_0930_1730">Full Day Session (09:30 - 17:30) · 7.0 hrs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Sample Count</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={bookingForm.sampleCount}
                    onChange={(e) => setBookingForm({ ...bookingForm, sampleCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sample State</label>
                  <select
                    value={bookingForm.sampleState}
                    onChange={(e) => setBookingForm({ ...bookingForm, sampleState: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="SOLID_POWDER">Solid / Powder</option>
                    <option value="THIN_FILM">Thin Film / Wafer</option>
                    <option value="LIQUID_SOLUTION">Liquid Solution</option>
                    <option value="BIOLOGICAL_CELLS">Biological Cells</option>
                    <option value="NANO_PARTICLES">Nano Particles</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Hazard Level</label>
                  <select
                    value={bookingForm.hazardLevel}
                    onChange={(e) => setBookingForm({ ...bookingForm, hazardLevel: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="NON_HAZARDOUS">Non-Hazardous</option>
                    <option value="FLAMMABLE">Flammable</option>
                    <option value="TOXIC">Toxic / Irritant</option>
                    <option value="CORROSIVE">Corrosive</option>
                    <option value="RADIOACTIVE_EXEMPT">Radioactive Exempt</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bookingForm.samplePrepRequired}
                    onChange={(e) => setBookingForm({ ...bookingForm, samplePrepRequired: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span className="text-slate-300 font-medium">
                    Sample Preparation Required (₹{selectedInstrument.rates.samplePrepCharge}/sample)
                  </span>
                </label>
                {bookingForm.samplePrepRequired && (
                  <input
                    type="text"
                    value={bookingForm.samplePrepDetails}
                    onChange={(e) => setBookingForm({ ...bookingForm, samplePrepDetails: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    placeholder="Details (e.g. Au/Pd sputtering, ultracentrifugation)"
                  />
                )}
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-indigo-300 block font-medium">Estimated Institutional Tariff</span>
                  <span className="text-lg font-bold text-white">₹{calculateEstimate()}</span>
                </div>
                <span className="text-[11px] text-slate-400">Automated Bursar / Grant Ledger Booking</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Calibration Modal */}
      {showCalibrationModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Log Instrument Calibration"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCalibrationModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Log Instrument Calibration</h3>
              <button onClick={() => setShowCalibrationModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitCalibration} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Instrument</label>
                <select
                  value={calForm.instrumentId}
                  onChange={(e) => setCalForm({ ...calForm, instrumentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Calibration Agency</label>
                <input
                  type="text"
                  value={calForm.calibrationAgency}
                  onChange={(e) => setCalForm({ ...calForm, calibrationAgency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Certificate Number</label>
                <input
                  type="text"
                  value={calForm.certificateNumber}
                  onChange={(e) => setCalForm({ ...calForm, certificateNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes & Metrology Observations</label>
                <textarea
                  rows={3}
                  value={calForm.notes}
                  onChange={(e) => setCalForm({ ...calForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCalibrationModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
