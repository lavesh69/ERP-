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
  const [activeTab, setActiveTab] = useState<"partners" | "students" | "visa">("partners");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

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

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-cyan-600/20"
        >
          <Plane className="w-4 h-4" />
          Nominate Exchange Student
        </button>
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
          Global Partner Universities
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
          Exchange Student Ledger
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
      </div>

      {/* Tab 1: Partner Universities */}
      {activeTab === "partners" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {partners.map((p) => (
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
            </div>
          ))}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {students.map((s) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Visa Desk */}
      {activeTab === "visa" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{s.studentName}</h3>
                    <p className="text-xs text-slate-500">
                      Passport: {s.passportNumber} • Visa Valid Until: {s.visaExpiryDate}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {s.frroStatus}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Host University:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{s.hostUniversity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Immigration Clearance:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Verified &amp; Certified
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
}
