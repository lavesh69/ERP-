"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  Plane,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  ExternalLink,
  Search,
  BookOpen,
  Calendar,
  FileCheck,
  Download,
  Filter,
  Eye,
  Printer,
  X,
  RotateCcw,
  DollarSign,
  Coins,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";

interface Partner {
  id: string;
  institutionName: string;
  country: string;
  city: string;
  qsWorldRanking: number;
  mouSigningDate: string;
  mouExpiryDate: string;
  isActive: boolean;
  cooperationAreas: string[];
  exchangeSeatsPerYear: number;
}

interface Student {
  id: string;
  applicationRef: string;
  type: "OUTBOUND" | "INBOUND";
  studentName: string;
  studentRollOrId: string;
  homeUniversity: string;
  hostUniversity: string;
  program: string;
  targetSemester: string;
  creditsMapped: number;
  status: string;
  passportNumber: string;
  visaExpiryDate: string;
  frroStatus: string;
  scholarshipGrantAmount: number;
  createdAt: string;
}

export default function InternationalPage() {
  const [activeTab, setActiveTab] = useState<"partners" | "students" | "visa" | "forex">("partners");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExchangeDossier, setSelectedExchangeDossier] = useState<Student | null>(null);
  const [selectedPartnerDossier, setSelectedPartnerDossier] = useState<Partner | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showForexModal, setShowForexModal] = useState(false);
  const [forexAmount, setForexAmount] = useState<number>(5000);
  const [forexCurrency, setForexCurrency] = useState<"USD" | "EUR" | "GBP" | "SGD" | "AUD" | "CAD">("USD");

  const forexRates: Record<string, { inr: number; symbol: string; name: string; trend: string }> = {
    USD: { inr: 86.50, symbol: "$", name: "US Dollar", trend: "+0.12%" },
    EUR: { inr: 91.20, symbol: "€", name: "Euro", trend: "+0.08%" },
    GBP: { inr: 109.80, symbol: "£", name: "British Pound", trend: "-0.05%" },
    SGD: { inr: 64.10, symbol: "S$", name: "Singapore Dollar", trend: "+0.15%" },
    AUD: { inr: 55.40, symbol: "A$", name: "Australian Dollar", trend: "+0.04%" },
    CAD: { inr: 60.30, symbol: "C$", name: "Canadian Dollar", trend: "-0.02%" },
  };
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCountry, setFilterCountry] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterVisaCompliance, setFilterVisaCompliance] = useState<"ALL" | "EXPIRING_SOON" | "COMPLIANT">("ALL");

  const handleUpdateStudentStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/international", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STATUS",
          id,
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || `Status updated to ${newStatus}`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to update status", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    }
  };

  const handleExportInternationalCsv = () => {
    if (activeTab === "partners") {
      const filtered = partners.filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          p.institutionName.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q);
        const matchesCountry = filterCountry === "ALL" || p.country.toLowerCase().includes(filterCountry.toLowerCase());
        return matchesSearch && matchesCountry;
      });
      const headers = "Partner University,Country,City,QS Rank,MoU Signed,MoU Expiry,Exchange Seats/Yr,Active\n";
      const rows = filtered
        .map((p) => `"${p.institutionName}","${p.country}","${p.city}",${p.qsWorldRanking},"${p.mouSigningDate}","${p.mouExpiryDate}",${p.exchangeSeatsPerYear},${p.isActive}`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Global_Partner_Universities_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const filtered = students.filter((s) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          !q ||
          s.studentName.toLowerCase().includes(q) ||
          s.studentRollOrId.toLowerCase().includes(q) ||
          s.hostUniversity.toLowerCase().includes(q) ||
          s.applicationRef.toLowerCase().includes(q);
        const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
        return matchesSearch && matchesStatus;
      });
      const headers = "App Ref,Type,Student Name,Roll/ID,Home University,Host University,Program,Semester,Credits Mapped,Passport,Visa Expiry,FRRO Status,Grant Amount\n";
      const rows = filtered
        .map((s) => `"${s.applicationRef}","${s.type}","${s.studentName}","${s.studentRollOrId}","${s.homeUniversity}","${s.hostUniversity}","${s.program}","${s.targetSemester}",${s.creditsMapped},"${s.passportNumber}","${s.visaExpiryDate}","${s.frroStatus}",${s.scholarshipGrantAmount}`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `International_Exchange_Students_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const [formData, setFormData] = useState({
    studentName: "",
    studentRollOrId: "CS2026-001",
    type: "OUTBOUND" as "OUTBOUND" | "INBOUND",
    homeUniversity: "Apex Autonomous University",
    hostUniversity: "Technical University of Munich (TUM)",
    program: "B.Tech Computer Science & Engineering",
    targetSemester: "Spring 2027",
    creditsMapped: 16,
    passportNumber: "Z9921448",
    visaExpiryDate: "2027-08-31",
    scholarshipGrantAmount: 2500,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, partRes, studRes] = await Promise.all([
        fetch("/api/international?tab=summary"),
        fetch("/api/international?tab=partners"),
        fetch("/api/international?tab=students"),
      ]);

      const sumData = await sumRes.json();
      const partData = await partRes.json();
      const studData = await studRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (partData.success) setPartners(partData.partners || []);
      if (studData.success) setStudents(studData.students || []);
    } catch (err) {
      console.error("Error fetching international data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/international", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_EXCHANGE",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Nomination submitted successfully!", type: "success" });
        setShowApplyModal(false);
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to submit", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExchangeStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/international", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE_STATUS", id, status }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || `Status updated to ${status}`, type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to update status", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    }
  };

  const availableCountries = Array.from(new Set(partners.map((p) => p.country))).filter(Boolean);

  const filteredVisaStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      s.studentName.toLowerCase().includes(q) ||
      s.passportNumber.toLowerCase().includes(q) ||
      s.studentRollOrId.toLowerCase().includes(q) ||
      s.hostUniversity.toLowerCase().includes(q);

    const now = new Date();
    const expiry = new Date(s.visaExpiryDate);
    const daysUntilExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const isExpiringSoon = daysUntilExpiry <= 180;

    if (filterVisaCompliance === "EXPIRING_SOON") return matchesSearch && isExpiringSoon;
    if (filterVisaCompliance === "COMPLIANT") return matchesSearch && !isExpiringSoon;
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 rounded-xl text-cyan-600 dark:text-cyan-400">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                International Relations & Study Abroad Suite
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Global University MoUs, Inbound/Outbound Exchange & Visa/FRRO Compliance Monitor
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowForexModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-600/20"
          >
            <Coins className="w-4 h-4" />
            Forex Calculator
          </button>
          <button
            onClick={handleExportInternationalCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export Exchange Dossier (CSV)
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-cyan-600/20"
          >
            <Plane className="w-4 h-4" />
            Nominate Exchange Student
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Partner Universities</span>
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.totalPartnerUniversities || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Active Global Bilateral MoUs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outbound Scholars</span>
            <Plane className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.outboundExchangeStudents || 0}
          </div>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Studying Overseas</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inbound Foreign Students</span>
            <Globe2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.inboundForeignStudents || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Hosting on Campus</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Visa/FRRO Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.visaRegulatoryAlerts || 0}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">100% Fully Compliant</p>
        </div>
      </div>

      {/* Search & Country Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search partners, students, countries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Country:</span>
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Countries ({partners.length})</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {activeTab === "students" && (
            <>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider sm:ml-2">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPLICATION_SUBMITTED">Submitted</option>
                <option value="NOMINATED">Nominated</option>
                <option value="VISA_GRANTED">Visa Granted</option>
                <option value="STUDYING_ABROAD">Studying Abroad</option>
                <option value="TRANSCRIPT_TRANSFERRED">Transcript Transferred</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </>
          )}

          {activeTab === "visa" && (
            <>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider sm:ml-2">Compliance:</span>
              <select
                value={filterVisaCompliance}
                onChange={(e) => setFilterVisaCompliance(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
              >
                <option value="ALL">All Compliance Records ({students.length})</option>
                <option value="EXPIRING_SOON">Expiring Soon (&lt; 6 Mos)</option>
                <option value="COMPLIANT">Active & Compliant</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "partners"
              ? "border-cyan-600 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Global Partner Universities ({partners.length})
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "students"
              ? "border-cyan-600 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Plane className="w-4 h-4" />
          Exchange Student Ledger ({students.length})
        </button>
        <button
          onClick={() => setActiveTab("visa")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "visa"
              ? "border-cyan-600 text-cyan-600 dark:text-cyan-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Visa & FRRO Compliance Desk
        </button>
        <button
          onClick={() => setActiveTab("forex")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "forex"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Forex & Grants Desk
        </button>
      </div>

      {/* Tab 1: Partner Universities */}
      {activeTab === "partners" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {partners
            .filter((p) => {
              const q = searchQuery.toLowerCase();
              const matchesSearch =
                !q ||
                p.institutionName.toLowerCase().includes(q) ||
                p.country.toLowerCase().includes(q) ||
                p.city.toLowerCase().includes(q);
              const matchesCountry = filterCountry === "ALL" || p.country.toLowerCase().includes(filterCountry.toLowerCase());
              return matchesSearch && matchesCountry;
            })
            .map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {p.institutionName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {p.city}, {p.country}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold">
                  QS #{p.qsWorldRanking}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Exchange Quota:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {p.exchangeSeatsPerYear} Students / Year
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MoU Validity:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Until {new Date(p.mouExpiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">Collaboration Scope:</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.cooperationAreas.map((area, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 rounded-md text-[11px] font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedPartnerDossier(p)}
                  className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Inspect MoU
                </button>
              </div>
            </div>
          ))}

          {partners.filter((p) => {
            const q = searchQuery.toLowerCase();
            const matchesSearch =
              !q ||
              p.institutionName.toLowerCase().includes(q) ||
              p.country.toLowerCase().includes(q) ||
              p.city.toLowerCase().includes(q);
            const matchesCountry = filterCountry === "ALL" || p.country.toLowerCase().includes(filterCountry.toLowerCase());
            return matchesSearch && matchesCountry;
          }).length === 0 && (
            <div className="col-span-1 md:col-span-3 py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Partner Universities Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No international partners match query &ldquo;{searchQuery}&rdquo; and country &ldquo;{filterCountry}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterCountry("ALL");
                }}
                className="mt-4 px-4 py-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-cyan-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Students Ledger */}
      {activeTab === "students" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Ref</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Host Institution</th>
                  <th className="py-3 px-4">Credits Mapped</th>
                  <th className="py-3 px-4">Target Semester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Grant</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {students
                  .filter((s) => {
                    const q = searchQuery.toLowerCase();
                    const matchesSearch =
                      !q ||
                      s.studentName.toLowerCase().includes(q) ||
                      s.studentRollOrId.toLowerCase().includes(q) ||
                      s.hostUniversity.toLowerCase().includes(q) ||
                      s.applicationRef.toLowerCase().includes(q);
                    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
                    return matchesSearch && matchesStatus;
                  })
                  .map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                      {s.applicationRef}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{s.studentName}</div>
                      <div className="text-xs text-slate-400">{s.studentRollOrId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          s.type === "OUTBOUND"
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {s.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{s.hostUniversity}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.creditsMapped} ECTS / Credits
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-slate-500">{s.targetSemester}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 rounded-lg text-xs font-semibold">
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      ${s.scholarshipGrantAmount}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedExchangeDossier(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          Dossier
                        </button>
                        <select
                          value={s.status}
                          onChange={(e) => handleUpdateStudentStatus(s.id, e.target.value)}
                          className="px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                        >
                          <option value="APPLICATION_SUBMITTED">Submitted</option>
                          <option value="NOMINATED">Nominated</option>
                          <option value="VISA_GRANTED">Visa Granted</option>
                          <option value="STUDYING_ABROAD">Studying Abroad</option>
                          <option value="TRANSCRIPT_TRANSFERRED">Transcript Transferred</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {students.filter((s) => {
            const q = searchQuery.toLowerCase();
            return (
              !q ||
              s.studentName.toLowerCase().includes(q) ||
              s.studentRollOrId.toLowerCase().includes(q) ||
              s.hostUniversity.toLowerCase().includes(q) ||
              s.applicationRef.toLowerCase().includes(q)
            );
          }).length === 0 && (
            <div className="py-16 text-center border-t border-slate-100 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Exchange Students Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No outbound or inbound students match query &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("ALL");
                }}
                className="mt-4 px-4 py-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-cyan-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Visa Desk */}
      {activeTab === "visa" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVisaStudents.map((s) => {
              const now = new Date();
              const expiry = new Date(s.visaExpiryDate);
              const daysUntilExpiry = Math.round((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
              const isExpiringSoon = daysUntilExpiry <= 180;

              return (
                <div
                  key={s.id}
                  className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all shadow-sm space-y-3 ${
                    isExpiringSoon
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{s.studentName}</h3>
                      <p className="text-xs text-slate-500">
                        Passport: <span className="font-mono">{s.passportNumber}</span> • Roll: {s.studentRollOrId}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {s.frroStatus}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Host University:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{s.hostUniversity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Visa Validity Date:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-slate-900 dark:text-white">{s.visaExpiryDate}</span>
                        {isExpiringSoon ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry}d left` : "Expired"}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Valid
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Immigration FRRO Status:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        Verified &amp; Certified
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">
                      Scholarship Grant: ${s.scholarshipGrantAmount}
                    </span>
                    <button
                      onClick={() => setSelectedExchangeDossier(s)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      Visa Portfolio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVisaStudents.length === 0 && (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-base">No Visa Records Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No visa profiles match your search or compliance filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterVisaCompliance("ALL");
                }}
                className="mt-4 px-4 py-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-cyan-100 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Forex & Grants Desk */}
      {activeTab === "forex" && (
        <div className="space-y-6">
          {/* Real-time Ticker Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(forexRates).map(([cur, data]) => (
              <div
                key={cur}
                onClick={() => {
                  setForexCurrency(cur as any);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  forexCurrency === cur
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cur} / INR</span>
                  <span className={`text-[10px] font-semibold ${data.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {data.trend}
                  </span>
                </div>
                <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                  ₹{data.inr.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{data.name}</p>
              </div>
            ))}
          </div>

          {/* Interactive Live Converter Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  International Study Abroad Tuition & Stipend Converter
                </h3>
                <p className="text-xs text-slate-500">
                  Instant calculation of institutional travel grants, tuition waivers, and monthly subsistence in INR.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                RBI Reference Rate Benchmarked
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              {/* Input Form */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Foreign Currency</label>
                    <select
                      value={forexCurrency}
                      onChange={(e) => setForexCurrency(e.target.value as any)}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                    >
                      {Object.keys(forexRates).map((cur) => (
                        <option key={cur} value={cur}>
                          {cur} ({forexRates[cur].name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Amount ({forexRates[forexCurrency].symbol})</label>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={forexAmount}
                      onChange={(e) => setForexAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full mt-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-500 font-medium">Quick Grant Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Semester Stipend", amount: 6000, cur: "USD" },
                      { label: "Erasmus Mobility", amount: 4500, cur: "EUR" },
                      { label: "NUS Living Cost", amount: 5500, cur: "SGD" },
                      { label: "UK Travel Allowance", amount: 3000, cur: "GBP" },
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setForexCurrency(p.cur as any);
                          setForexAmount(p.amount);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      >
                        {p.label} ({p.amount} {p.cur})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversion Result Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300 dark:border-emerald-700/60 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Equivalent Value in Indian Rupees</span>
                    <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      ₹{(forexAmount * forexRates[forexCurrency].inr).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold">
                    1 {forexCurrency} = ₹{forexRates[forexCurrency].inr.toFixed(2)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50">
                  <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl space-y-0.5">
                    <span className="text-slate-500 text-[11px] block">Monthly Living Equivalency</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{((forexAmount * forexRates[forexCurrency].inr) / 5).toLocaleString("en-IN", { maximumFractionDigits: 0 })} / mo
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl space-y-0.5">
                    <span className="text-slate-500 text-[11px] block">Statutory Forex Surcharge</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">0% (UGC University Exempt)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nomination Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Nominate Exchange Student
              </h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Student Roll No
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentRollOrId}
                    onChange={(e) => setFormData({ ...formData, studentRollOrId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Host University
                  </label>
                  <select
                    value={formData.hostUniversity}
                    onChange={(e) => setFormData({ ...formData, hostUniversity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.institutionName}>
                        {p.institutionName} ({p.country})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Target Semester
                  </label>
                  <input
                    type="text"
                    value={formData.targetSemester}
                    onChange={(e) => setFormData({ ...formData, targetSemester: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Credits Pre-Mapped
                  </label>
                  <input
                    type="number"
                    value={formData.creditsMapped}
                    onChange={(e) =>
                      setFormData({ ...formData, creditsMapped: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Scholarship Grant ($)
                  </label>
                  <input
                    type="number"
                    value={formData.scholarshipGrantAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, scholarshipGrantAmount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Nominate Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner University MoU Dossier Modal */}
      {selectedPartnerDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selectedPartnerDossier.institutionName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">
                      QS #{selectedPartnerDossier.qsWorldRanking}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPartnerDossier.city}, {selectedPartnerDossier.country}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartnerDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Exchange Quota</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">
                  {selectedPartnerDossier.exchangeSeatsPerYear} Students / Year
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold block">Full Tuition Waiver</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Bilateral MoU Validity</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Until {new Date(selectedPartnerDossier.mouExpiryDate).toLocaleDateString()}
                </span>
                <span className="text-slate-400 block">Signed: {new Date(selectedPartnerDossier.mouSigningDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Approved Areas of Academic & Research Cooperation
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedPartnerDossier.cooperationAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 rounded-xl text-xs font-medium border border-cyan-200 dark:border-cyan-800/60"
                  >
                    ✓ {area}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200">Credit Reciprocity & Accreditation Status</div>
              <p className="text-[11px] text-slate-500">
                Course syllabi mapped to European Credit Transfer and Accumulation System (ECTS) and ABET engineering criteria. Grades directly convert to 10-point CGPA scale without loss of academic terms.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Agreement Brief
              </button>
              <button
                onClick={() => setSelectedPartnerDossier(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exchange Student & Visa Dossier Modal */}
      {selectedExchangeDossier && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-xl">
                  <Plane className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{selectedExchangeDossier.studentName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                      {selectedExchangeDossier.type}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">
                    Ref: {selectedExchangeDossier.applicationRef} • Roll: {selectedExchangeDossier.studentRollOrId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExchangeDossier(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Host Institution</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">{selectedExchangeDossier.hostUniversity}</span>
                <span className="text-slate-500 block">Home: {selectedExchangeDossier.homeUniversity}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Academic Progression</span>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {selectedExchangeDossier.creditsMapped} ECTS Credits Mapped
                </span>
                <span className="text-indigo-600 dark:text-indigo-400 font-medium block">
                  Target: {selectedExchangeDossier.targetSemester}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium block">Travel & Visa Document</span>
                <span className="font-semibold text-slate-900 dark:text-white block">Passport: {selectedExchangeDossier.passportNumber}</span>
                <span className="text-slate-500 block">Visa Expiry: {selectedExchangeDossier.visaExpiryDate}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 uppercase font-medium block">FRRO / Global Grant</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForexAmount(selectedExchangeDossier.scholarshipGrantAmount || 2500);
                      setShowForexModal(true);
                    }}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Forex Converter
                  </button>
                </div>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 block">
                  Status: {selectedExchangeDossier.frroStatus}
                </span>
                <span className="text-slate-900 dark:text-white font-bold block">
                  Grant Disbursed: ${selectedExchangeDossier.scholarshipGrantAmount}
                </span>
              </div>
            </div>

            {/* Overseas Travel Medical Insurance & Host Emergency Contact */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-cyan-950 dark:text-cyan-200 block">
                  Overseas Medical Health Insurance:
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200 block text-[11px]">
                  Policy: ALLIANZ-GLOB-{(selectedExchangeDossier.id || "001").replace(/\D/g, "") || "8921"}
                </span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block">
                  Allianz Worldwide Care • $500,000 USD Medical Evacuation Covered
                </span>
              </div>
              <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-cyan-950 dark:text-cyan-200 block">
                  Host IRO Emergency Contact:
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200 block text-[11px]">
                  Dr. Hans Schmidt (Dean International)
                </span>
                <span className="text-[10px] text-cyan-700 dark:text-cyan-400 block font-mono">
                  +49 89 289 01 • 24/7 Desk Active
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <div className="font-bold text-slate-800 dark:text-slate-200">International Affairs Office Verification</div>
              <p className="text-[11px] text-slate-500">
                Dean of International Affairs & Host Exchange Coordinator have reviewed and endorsed the learning agreement, emergency health coverage, and credit equivalence transcript transfer.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">Status:</span>
                <button
                  onClick={async () => {
                    await handleUpdateExchangeStatus(selectedExchangeDossier.id, "VISA_CLEARED");
                    setSelectedExchangeDossier((prev: any) => ({ ...prev, status: "VISA_CLEARED" }));
                  }}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg font-medium transition-colors"
                >
                  Clear Visa
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateExchangeStatus(selectedExchangeDossier.id, "CURRENTLY_ABROAD");
                    setSelectedExchangeDossier((prev: any) => ({ ...prev, status: "CURRENTLY_ABROAD" }));
                  }}
                  className="px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 rounded-lg font-medium transition-colors"
                >
                  Active Abroad
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateExchangeStatus(selectedExchangeDossier.id, "COMPLETED");
                    setSelectedExchangeDossier((prev: any) => ({ ...prev, status: "COMPLETED" }));
                  }}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-lg font-medium transition-colors"
                >
                  Completed
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateExchangeStatus(selectedExchangeDossier.id, "OVERSTAY_ALERT");
                    setSelectedExchangeDossier((prev: any) => ({ ...prev, status: "OVERSTAY_ALERT" }));
                  }}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg font-medium transition-colors"
                >
                  Flag Overstay
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Exchange Dossier
                </button>
                <button
                  onClick={() => setSelectedExchangeDossier(null)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Forex Calculator Modal */}
      {showForexModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Coins className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Forex & Global Grant Converter
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live currency valuation & living cost equivalency for study abroad
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForexModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Grant / Currency
                </label>
                <select
                  value={forexCurrency}
                  onChange={(e) => setForexCurrency(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="SGD">SGD (S$) - Singapore Dollar</option>
                  <option value="AUD">AUD (A$) - Australian Dollar</option>
                  <option value="CAD">CAD (C$) - Canadian Dollar</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Foreign Amount ({forexRates[forexCurrency]?.symbol})
                </label>
                <input
                  type="number"
                  min="1"
                  value={forexAmount}
                  onChange={(e) => setForexAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quick Grant Presets</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "$1,000 Travel Stmt", amount: 1000 },
                  { label: "$2,500 Erasmus Grant", amount: 2500 },
                  { label: "$5,000 Semester Living", amount: 5000 },
                  { label: "$10,000 Full Fellowship", amount: 10000 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setForexAmount(preset.amount)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Converted Summary Card */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Equivalence in INR
                </span>
                <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  Rate: 1 {forexCurrency} = ₹{forexRates[forexCurrency]?.inr.toFixed(2)}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-950 dark:text-emerald-200">
                ₹{(forexAmount * (forexRates[forexCurrency]?.inr || 86.5)).toLocaleString("en-IN", {
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Covers approx. {Math.max(1, Math.round(forexAmount / 1200))} months of living and academic expenditures abroad based on standard overseas stipend allowances.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowForexModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `${forexRates[forexCurrency]?.symbol}${forexAmount.toLocaleString()} ${forexCurrency} = ₹${(
                      forexAmount * (forexRates[forexCurrency]?.inr || 86.5)
                    ).toLocaleString("en-IN")} INR (Forex Rate: ₹${forexRates[forexCurrency]?.inr})`
                  );
                  alert("Forex calculation copied to clipboard!");
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                Copy Calculation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
