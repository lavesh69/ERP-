"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldCheck,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Car,
  KeyRound,
  LogOut,
  MapPin,
  Lock,
} from "lucide-react";
import { VisitorPass, SecurityGate, PassStatus } from "@/lib/security/security-engine";

interface SecuritySummary {
  totalGates: number;
  activeVisitors: number;
  checkedOutToday: number;
  totalPassesIssued: number;
  gates: SecurityGate[];
}

export default function SecurityPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"passes" | "gates">("passes");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SecuritySummary | null>(null);
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [gates, setGates] = useState<SecurityGate[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Pass Modal
  const [showModal, setShowModal] = useState(false);
  const [passForm, setPassForm] = useState({
    visitorName: "",
    contactPhone: "",
    idProofType: "NATIONAL_ID" as const,
    idProofNumber: "",
    visitorType: "GUEST_SPEAKER" as const,
    hostName: currentUser?.fullName || "Prof. Sarah Chen",
    hostDepartment: "Computer Science & Engineering",
    purposeOfVisit: "Academic Guest Lecture & Lab Tour",
    vehicleNumber: "",
    entryGate: "Main North Arch Gate",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, pRes, gRes] = await Promise.all([
        fetch("/api/security?tab=summary"),
        fetch("/api/security?tab=passes"),
        fetch("/api/security?tab=gates"),
      ]);

      if (sumRes.ok) {
        const sData = await sumRes.json();
        setSummary(sData.summary);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPasses(pData.passes || []);
      }
      if (gRes.ok) {
        const gData = await gRes.json();
        setGates(gData.gates || []);
      }
    } catch (err) {
      console.error("Failed to load security data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_PASS",
          ...passForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue visitor pass");

      setStatusMessage({ type: "success", text: data.message });
      setShowModal(false);
      setPassForm({
        visitorName: "",
        contactPhone: "",
        idProofType: "NATIONAL_ID",
        idProofNumber: "",
        visitorType: "GUEST_SPEAKER",
        hostName: currentUser?.fullName || "Prof. Sarah Chen",
        hostDepartment: "Computer Science & Engineering",
        purposeOfVisit: "Academic Guest Lecture & Lab Tour",
        vehicleNumber: "",
        entryGate: "Main North Arch Gate",
      });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCheckOut = async (passId: string) => {
    try {
      const res = await fetch("/api/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CHECK_OUT",
          passId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check out visitor");

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
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Gate Security & Visitor Access Suite
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cryptographic digital QR passes, vehicle license monitoring, and real-time perimeter surveillance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Issue Visitor Pass
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
            <span className="text-xs font-semibold uppercase tracking-wider">Active On-Campus</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.activeVisitors ?? "--"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">visitors</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Currently inside institutional premises</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Security Gates</span>
            <Lock className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalGates ?? "--"}
            </span>
            <span className="text-xs text-slate-500">manned posts</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Active perimeter barriers & kiosks</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Checked Out</span>
            <LogOut className="w-5 h-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.checkedOutToday ?? 0}
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400">departures</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Safely concluded visits today</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Passes Issued</span>
            <KeyRound className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalPassesIssued ?? "--"}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">passes</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Cryptographically signed access badges</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("passes")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "passes"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Visitor Passes Ledger ({passes.length})
        </button>

        <button
          onClick={() => setActiveTab("gates")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "gates"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Lock className="w-4 h-4" />
          Perimeter Gates ({gates.length})
        </button>
      </div>

      {/* Tab 1: Visitor Passes Ledger */}
      {activeTab === "passes" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-slate-900 dark:text-white">Active & Historical Passes</h3>
            <span className="text-xs text-slate-400">{passes.length} badges issued</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Pass #</th>
                  <th className="p-4">Visitor & Contact</th>
                  <th className="p-4">Host & Purpose</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Security QR Seal</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-medium text-xs text-emerald-600 dark:text-emerald-400">
                      {p.passNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.visitorName}</div>
                      <div className="text-xs text-slate-400 font-mono">{p.contactPhone}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded text-slate-500">
                        {p.visitorType}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">Host: {p.hostName}</div>
                      <div className="text-xs text-slate-400 truncate" title={p.purposeOfVisit}>
                        {p.purposeOfVisit}
                      </div>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-slate-400" />
                        {p.vehicleNumber || "Pedestrian"}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                      {p.digitalSeal}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          p.status === "ACTIVE_ON_CAMPUS"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {p.status === "ACTIVE_ON_CAMPUS" ? "Active Inside" : "Checked Out"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {p.status === "ACTIVE_ON_CAMPUS" && (
                        <button
                          onClick={() => handleCheckOut(p.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 rounded-lg text-xs font-semibold transition-all"
                        >
                          Check Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Perimeter Gates */}
      {activeTab === "gates" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {gates.map((gate) => (
            <div
              key={gate.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  24/7 Monitored
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">{gate.name}</h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {gate.location}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                <div>Duty Officer: <span className="font-semibold text-slate-800 dark:text-slate-200">{gate.guardOnDuty}</span></div>
                <div>Automated Boom Barrier: <span className="text-emerald-600 font-semibold">Active & Armed</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Pass Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Issue Cryptographic Visitor Gate Pass
            </h3>

            <form onSubmit={handleIssuePass} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visitor Legal Name</label>
                  <input
                    type="text"
                    required
                    value={passForm.visitorName}
                    onChange={(e) => setPassForm({ ...passForm, visitorName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. Dr. Alan Turing"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={passForm.contactPhone}
                    onChange={(e) => setPassForm({ ...passForm, contactPhone: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="+1 (555) 019-2834"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">ID Proof Type</label>
                  <select
                    value={passForm.idProofType}
                    onChange={(e) => setPassForm({ ...passForm, idProofType: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="NATIONAL_ID">National ID / Aadhaar</option>
                    <option value="DRIVING_LICENSE">Driver's License</option>
                    <option value="PASSPORT">Passport</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Visitor Category</label>
                  <select
                    value={passForm.visitorType}
                    onChange={(e) => setPassForm({ ...passForm, visitorType: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="GUEST_SPEAKER">Guest Speaker / Academic</option>
                    <option value="OFFICIAL_DELEGATION">Accreditation / Official Delegation</option>
                    <option value="PARENT">Parent / Guardian</option>
                    <option value="VENDOR_DELIVERY">Vendor / Delivery</option>
                    <option value="CONTRACTOR">Estate Contractor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Host Person Name</label>
                  <input
                    type="text"
                    required
                    value={passForm.hostName}
                    onChange={(e) => setPassForm({ ...passForm, hostName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Host Department</label>
                  <input
                    type="text"
                    required
                    value={passForm.hostDepartment}
                    onChange={(e) => setPassForm({ ...passForm, hostDepartment: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  value={passForm.purposeOfVisit}
                  onChange={(e) => setPassForm({ ...passForm, purposeOfVisit: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Deliberation with Vice Chancellor"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Vehicle Number (Optional)</label>
                  <input
                    type="text"
                    value={passForm.vehicleNumber}
                    onChange={(e) => setPassForm({ ...passForm, vehicleNumber: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. MA-882-QX (or leave blank)"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Entry Gate</label>
                  <select
                    value={passForm.entryGate}
                    onChange={(e) => setPassForm({ ...passForm, entryGate: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="Main North Arch Gate">Main North Arch Gate</option>
                    <option value="South Technology Park Gate">South Technology Park Gate</option>
                    <option value="Residential Halls Perimeter Kiosk">Residential Halls Perimeter Kiosk</option>
                  </select>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Generate Digital Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
