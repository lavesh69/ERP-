"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Siren,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Flame,
  CloudLightning,
  Lock,
  HeartPulse,
  Send,
  Users,
  CheckCircle2,
  Clock,
  Volume2,
  PhoneCall,
  Download,
  Search,
  Filter,
} from "lucide-react";

interface Alert {
  id: string;
  alertCode: string;
  category: string;
  severity: string;
  headline: string;
  instructions: string;
  affectedZones: string[];
  dispatchedChannels: string[];
  initiatedBy: string;
  initiatedAt: string;
  isActive: boolean;
  resolvedAt?: string;
  cryptographicBroadcastSeal: string;
}

interface MusterPoint {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  currentEvacueesCount: number;
  assignedWarden: string;
  wardenPhone: string;
  status: string;
}

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<"alerts" | "muster">("alerts");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [musterPoints, setMusterPoints] = useState<MusterPoint[]>([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");

  const EMERGENCY_TEMPLATES = [
    {
      label: "Fire Evacuation",
      category: "FIRE_EVACUATION",
      severity: "CRITICAL_EVACUATION",
      headline: "Immediate Building Evacuation Ordered - Fire Alarm Triggered",
      instructions: "Evacuate using nearest fire exit stairs. DO NOT use elevators. Report immediately to outdoor muster assembly points.",
      affectedZones: ["Central Academic Block", "Science Quad"],
      channels: ["SMS_GATEWAY", "CAMPUS_SIRENS", "MOBILE_APP_PUSH", "PA_AUDIO_SYSTEM"],
    },
    {
      label: "Severe Tornado / Cyclone",
      category: "SEVERE_WEATHER_ALERT",
      severity: "CRITICAL_EVACUATION",
      headline: "Tornado Warning Active - Seek Immediate Reinforced Shelter",
      instructions: "Take shelter immediately in lowest floor interior rooms away from glass windows. Cover heads.",
      affectedZones: ["All Campus Quads", "Hostels"],
      channels: ["SMS_GATEWAY", "CAMPUS_SIRENS", "MOBILE_APP_PUSH", "EMERGENCY_EMAILS"],
    },
    {
      label: "Security Lockdown",
      category: "CAMPUS_SECURITY_LOCKDOWN",
      severity: "CRITICAL_EVACUATION",
      headline: "Active Perimeter Lockdown - Shelter in Place",
      instructions: "Lock all doors, turn off lights, silence cellphones, and stay out of sight until official ALL CLEAR is broadcast.",
      affectedZones: ["All Campus Facilities"],
      channels: ["SMS_GATEWAY", "MOBILE_APP_PUSH", "CAMPUS_SIRENS"],
    },
    {
      label: "Chemical Hazard",
      category: "MEDICAL_HAZARD",
      severity: "HIGH_WARNING",
      headline: "Hazardous Chemical / Gas Release - Science Complex Evacuation",
      instructions: "Do not enter Chemistry Building A. Avoid downwind perimeter. Facilities HAZMAT teams deployed.",
      affectedZones: ["Chemistry Complex", "Engineering Labs"],
      channels: ["SMS_GATEWAY", "MOBILE_APP_PUSH", "EMERGENCY_EMAILS"],
    },
  ];

  const handleApplyTemplate = (tmpl: any) => {
    setFormData({
      category: tmpl.category,
      severity: tmpl.severity,
      headline: tmpl.headline,
      instructions: tmpl.instructions,
      affectedZones: tmpl.affectedZones,
      dispatchedChannels: tmpl.channels,
    });
  };

  const handleExportCleryLogCsv = () => {
    const headers = "Incident Code,Category,Severity,Headline,Instructions,Zones,Channels,Initiated By,Timestamp,Active,Seal Checksum\n";
    const rows = alerts
      .map((a) => `"${a.alertCode}","${a.category}","${a.severity}","${a.headline}","${(a.instructions || "").replace(/"/g, '""')}","${a.affectedZones.join("; ")}","${a.dispatchedChannels.join("; ")}","${a.initiatedBy}","${a.initiatedAt}",${a.isActive},"${a.cryptographicBroadcastSeal}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Clery_Act_EOC_Incident_Audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [formData, setFormData] = useState({
    category: "FIRE_EVACUATION",
    severity: "CRITICAL_EVACUATION",
    headline: "Immediate Building Evacuation Ordered - Fire Alarm Triggered",
    instructions: "Evacuate using nearest fire exit stairs. DO NOT use elevators. Report immediately to assigned outdoor muster point.",
    affectedZones: ["Central Academic Block A", "Science Complex"],
    dispatchedChannels: ["SMS_GATEWAY", "CAMPUS_SIRENS", "MOBILE_APP_PUSH", "PA_AUDIO_SYSTEM"],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, alRes, muRes] = await Promise.all([
        fetch("/api/emergency?tab=summary"),
        fetch("/api/emergency?tab=alerts"),
        fetch("/api/emergency?tab=muster"),
      ]);

      const sumData = await sumRes.json();
      const alData = await alRes.json();
      const muData = await muRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (alData.success) setAlerts(alData.alerts || []);
      if (muData.success) setMusterPoints(muData.musterPoints || []);
    } catch (err) {
      console.error("Error fetching emergency data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BROADCAST_ALERT",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: data.message || "Emergency broadcast dispatched!", type: "success" });
        setShowBroadcastModal(false);
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to dispatch alert", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveAlert = async (id: string) => {
    try {
      const res = await fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE_ALERT",
          id,
          allClearNotes: "Situation resolved and normalized by Campus Safety Wardens.",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: "Alert resolved with ALL CLEAR broadcast.", type: "success" });
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to resolve alert", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    }
  };

  const activeAlert = alerts.find((a) => a.isActive);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Active Critical Incident Banner if Live */}
      {activeAlert && (
        <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Siren className="w-6 h-6 animate-spin" />
              <span className="font-mono text-xs uppercase tracking-widest font-black bg-red-800 px-2.5 py-0.5 rounded">
                LIVE {activeAlert.severity}
              </span>
              <span className="font-mono text-xs text-red-200">{activeAlert.alertCode}</span>
            </div>
            <h2 className="text-xl font-black">{activeAlert.headline}</h2>
            <p className="text-sm text-red-100">{activeAlert.instructions}</p>
          </div>
          <button
            onClick={() => handleResolveAlert(activeAlert.id)}
            className="px-5 py-2.5 bg-white text-red-700 font-bold rounded-xl text-sm hover:bg-red-50 transition shadow"
          >
            Issue ALL CLEAR &amp; Deactivate
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/50 rounded-xl text-red-600 dark:text-red-400">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Campus Emergency Operations Center (EOC)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Clery Act Disaster Management, Multi-Channel Mass Broadcast & Evacuation Telemetry
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCleryLogCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-all border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            Export Clery Audit Log (CSV)
          </button>
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-red-600/30"
          >
            <Radio className="w-4 h-4" />
            Broadcast Emergency SOS
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
            <span className="text-xs font-semibold uppercase tracking-wider">Active Threat Level</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeAlert ? "CRITICAL ALERT" : "NORMAL (GREEN)"}
          </div>
          <p className="text-xs text-slate-400 mt-1">24/7 Perimeter Surveillance</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Muster Accountability</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : `${summary?.totalAccountedPercentage || 100}%`}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {summary?.totalEvacuatedCount || 1770} Persons Accounted For
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Muster Points</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : `${summary?.safePointsCount || 3} / ${summary?.totalMusterPoints || 3}`}
          </div>
          <p className="text-xs text-slate-400 mt-1">Wardens On Active Duty</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Multi-Channel Gateways</span>
            <Volume2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">5 Gateways Active</div>
          <p className="text-xs text-slate-400 mt-1">Sirens, SMS, Push, PA, Email</p>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search alerts, zones, incident codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Categories</option>
            <option value="FIRE_EVACUATION">Fire Evacuation</option>
            <option value="SEVERE_WEATHER_ALERT">Severe Weather</option>
            <option value="CAMPUS_SECURITY_LOCKDOWN">Security Lockdown</option>
            <option value="MEDICAL_HAZARD">Medical / Hazmat</option>
            <option value="DRILL_SIMULATION">Safety Drills</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "alerts"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Radio className="w-4 h-4" />
          Emergency Alert Dispatches ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("muster")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "muster"
              ? "border-red-600 text-red-600 dark:text-red-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          Muster Point Assembly &amp; Wardens ({musterPoints.length})
        </button>
      </div>

      {/* Tab 1: Alerts History */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {alerts
            .filter((al) => {
              const q = searchQuery.toLowerCase();
              const matchesSearch =
                !q ||
                al.alertCode.toLowerCase().includes(q) ||
                al.headline.toLowerCase().includes(q) ||
                al.instructions.toLowerCase().includes(q) ||
                al.affectedZones.some((z) => z.toLowerCase().includes(q));
              const matchesCategory = filterCategory === "ALL" || al.category === filterCategory;
              return matchesSearch && matchesCategory;
            })
            .map((al) => (
            <div
              key={al.id}
              className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-sm space-y-3 ${
                al.isActive
                  ? "border-red-500 bg-red-50/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                      al.severity === "CRITICAL_EVACUATION"
                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    }`}
                  >
                    {al.severity.replace("_", " ")}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-500">{al.alertCode}</span>
                  <span className="text-xs text-slate-400">• {new Date(al.initiatedAt).toLocaleString()}</span>
                </div>

                {al.isActive ? (
                  <button
                    onClick={() => handleResolveAlert(al.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Mark ALL CLEAR
                  </button>
                ) : (
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-xs font-medium">
                    Resolved &amp; Logged
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{al.headline}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{al.instructions}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Affected Zones:</span>
                {al.affectedZones.map((z, i) => (
                  <span key={i} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {z}
                  </span>
                ))}
                <span className="mx-2">•</span>
                <span className="font-mono text-[11px] text-slate-400">Seal: {al.cryptographicBroadcastSeal}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Muster Points */}
      {activeTab === "muster" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {musterPoints.map((mp) => (
            <div
              key={mp.id}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{mp.name}</h3>
                  <p className="text-xs text-slate-500">Zone: {mp.zone}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold">
                  {mp.status.replace("_", " ")}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Evacuees Assembled:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {mp.currentEvacueesCount} / {mp.capacity} Max
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(mp.currentEvacueesCount / mp.capacity) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between pt-2">
                  <span>Assigned Warden:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {mp.assignedWarden}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Hotline:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {mp.wardenPhone}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Broadcast SOS Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-600">
                <Siren className="w-5 h-5 animate-spin" />
                <h2 className="text-lg font-bold">Dispatch Campus Emergency Alert</h2>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  ⚡ Quick Response Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {EMERGENCY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 transition"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Emergency Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="FIRE_EVACUATION">Fire / Hazardous Gas Leak</option>
                    <option value="SEVERE_WEATHER_ALERT">Severe Cyclone / Flood Warning</option>
                    <option value="CAMPUS_SECURITY_LOCKDOWN">Perimeter Security Lockdown</option>
                    <option value="MEDICAL_HAZARD">Medical Outbreak / Hazmat</option>
                    <option value="DRILL_SIMULATION">Statutory Safety Drill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Severity Tier
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="CRITICAL_EVACUATION">Critical Evacuation</option>
                    <option value="HIGH_WARNING">High Warning</option>
                    <option value="ADVISORY">Campus Advisory</option>
                    <option value="CAMPUS_ALL_CLEAR">All Clear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Alert Headline
                </label>
                <input
                  type="text"
                  required
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Actionable Safety Instructions
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 text-xs text-red-700 dark:text-red-300">
                ⚠️ This alert will immediately trigger SMS dispatches, sound campus sirens, and broadcast push notifications to all enrolled students and staff.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submitting ? "Transmitting..." : "DISPATCH MASS BROADCAST"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
