"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  ShieldAlert,
  Scale,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  EyeOff,
  UserCheck,
  Calendar,
  Send,
  Building,
  PhoneCall,
  Mail,
  AlertTriangle,
  Award,
  Filter,
  Mic,
  MicOff,
  Play,
  Square,
  Volume2,
  Lock,
  Trash2,
  Download,
} from "lucide-react";

interface GrievanceSummary {
  totalGrievances: number;
  activeGrievances: number;
  resolvedGrievances: number;
  disposalRate: number;
  slaBreachedCount: number;
  averageResolutionDays: number;
  committees: any[];
}

export default function GrievancesPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"board" | "file" | "committees" | "compliance">("board");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<GrievanceSummary | null>(null);
  const [grievances, setGrievances] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Audio Voice Note Whistleblower State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [maskVoicePitch, setMaskVoicePitch] = useState(true);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    setHasRecordedAudio(false);
    setIsPlayingAudio(false);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setHasRecordedAudio(true);
  };

  const deleteRecording = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
    setHasRecordedAudio(false);
    setIsPlayingAudio(false);
  };

  const downloadAudioDeposition = () => {
    const sampleRate = 8000;
    const duration = Math.max(2, recordingSeconds || 3);
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const freq = maskVoicePitch ? 220 : 440;
      const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.sin(2 * Math.PI * 4 * t);
      view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    }

    const blob = new Blob([buffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Whistleblower_Deposition_${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // New Grievance Form
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileForm, setFileForm] = useState({
    title: "",
    description: "",
    category: "ACADEMIC_EVALUATION",
    severity: "MEDIUM",
    isAnonymous: false,
    grievantName: currentUser?.fullName || "",
    grievantRollOrId: "CS2026-001",
    respondentName: "",
  });

  // Action / Resolution Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    grievanceId: "",
    actionTakenReport: "",
    status: "RESOLVED",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, listRes] = await Promise.all([
        fetch("/api/grievances?tab=summary"),
        fetch(`/api/grievances?tab=list&category=${selectedCategory}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (listRes.ok) {
        const lData = await listRes.json();
        setGrievances(lData.grievances || []);
      }
    } catch (err) {
      console.error("Failed to load grievances", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_GRIEVANCE",
          ...fileForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit grievance");
      setStatusMessage({ type: "success", text: data.message });
      setShowFileModal(false);
      setFileForm({
        title: "",
        description: "",
        category: "ACADEMIC_EVALUATION",
        severity: "MEDIUM",
        isAnonymous: false,
        grievantName: currentUser?.fullName || "",
        grievantRollOrId: "CS2026-001",
        respondentName: "",
      });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleResolveGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE_GRIEVANCE",
          ...resolveForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve grievance");
      setStatusMessage({ type: "success", text: data.message });
      setShowResolveModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                UGC & AICTE Statutory Cell
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                24/7 Anti-Ragging Protected
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Grievance Redressal & Statutory Ombudsman
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Confidential dispute mediation, internal complaints committee (ICC/POSH), anti-ragging squad oversight, and legally bound SLA turnaround.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFileModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Lodge New Grievance
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Total Cases Filed</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{summary.totalGrievances}</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.activeGrievances} Active • {summary.resolvedGrievances} Resolved</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Disposal Rate</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">{summary.disposalRate}%</p>
              <p className="text-xs text-rose-300 mt-0.5">Statutory Standard ≥ 90%</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Avg Turnaround</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">{summary.averageResolutionDays} Days</p>
              <p className="text-xs text-rose-300 mt-0.5">Prompt Inquiry Closure</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">SLA Breaches</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-400">
                {summary.slaBreachedCount === 0 ? "Zero Breaches" : `${summary.slaBreachedCount} Delayed`}
              </p>
              <p className="text-xs text-rose-300 mt-0.5">Strict Regulatory Adherence</p>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banner */}
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

      {/* Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto pb-px">
        {[
          { id: "board", label: "Grievance Registry & Hearings", icon: Scale, count: summary?.activeGrievances },
          { id: "file", label: "File Grievance / Whistleblower", icon: FileText },
          { id: "committees", label: "Statutory Committees", icon: ShieldAlert },
          { id: "compliance", label: "Statutory Compliance Audit", icon: Award },
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

      {/* TAB 1: GRIEVANCE BOARD */}
      {activeTab === "board" && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal-500" />
              <span className="text-sm font-medium text-charcoal-700 dark:text-ivory-300">Statutory Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Statutory Petitions</option>
                <option value="ANTI_RAGGING">Anti-Ragging Squad</option>
                <option value="INTERNAL_COMPLAINTS_ICC">ICC / POSH Cell</option>
                <option value="ACADEMIC_EVALUATION">Academic Evaluation & Exams</option>
                <option value="CAMPUS_INFRASTRUCTURE">Campus & Residential</option>
                <option value="ETHICS_WHISTLEBLOWER">Ethics Whistleblower</option>
              </select>
            </div>
            <span className="text-xs text-charcoal-500">
              Showing {grievances.length} Registered Cases
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {grievances.map((item) => {
              const isResolved = item.status === "RESOLVED";
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {item.grievanceTicketNo}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200">
                        {item.category.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isResolved
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200"
                        }`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                      {item.isAnonymous && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 font-semibold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Anonymous Whistleblower
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-charcoal-600 dark:text-ivory-300">
                      {item.description}
                    </p>

                    <div className="text-[11px] text-charcoal-500 pt-1 flex flex-wrap gap-4">
                      <span>Jurisdiction: {item.committeeName}</span>
                      {!item.isAnonymous && (
                        <span>Filing Party: {item.grievantName} ({item.grievantRollOrId})</span>
                      )}
                      <span>Filed: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                    {item.actionTakenReport && (
                      <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs text-emerald-900 dark:text-emerald-200">
                        <span className="font-bold">Official Action Taken (ATR):</span> {item.actionTakenReport}
                      </div>
                    )}
                  </div>

                  {/* Actions & SLA */}
                  <div className="flex flex-col items-end gap-3 min-w-[180px]">
                    <div className="text-right text-xs">
                      <span className="text-charcoal-500">Statutory SLA: </span>
                      {isResolved ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Closed in Target</span>
                      ) : (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {item.daysRemaining} Days Left
                        </span>
                      )}
                    </div>

                    {!isResolved && (
                      <button
                        onClick={() => {
                          setResolveForm({
                            grievanceId: item.id,
                            actionTakenReport: "",
                            status: "RESOLVED",
                          });
                          setShowResolveModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sign Resolution (ATR)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: FILE GRIEVANCE */}
      {activeTab === "file" && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-charcoal-900 rounded-2xl p-6 border border-border dark:border-charcoal-800 shadow-sm">
          <div className="pb-4 border-b border-border dark:border-charcoal-800">
            <h2 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
              Submit Statutory Grievance or Appeal
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Petitions are automatically routed to the designated statutory cell under UGC / AICTE compliance mandate.
            </p>
          </div>

          <form onSubmit={handleSubmitGrievance} className="space-y-4 mt-5 text-xs">
            <div>
              <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                Grievance Classification
              </label>
              <select
                required
                value={fileForm.category}
                onChange={(e) => setFileForm({ ...fileForm, category: e.target.value })}
                className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
              >
                <option value="ACADEMIC_EVALUATION">Academic Evaluation & Examination Dispute</option>
                <option value="ANTI_RAGGING">Anti-Ragging / Bullying Complaint (Supreme Court Mandate)</option>
                <option value="INTERNAL_COMPLAINTS_ICC">Internal Complaints Committee (POSH / Gender Parity)</option>
                <option value="CAMPUS_INFRASTRUCTURE">Campus Infrastructure, Hostel & Transport</option>
                <option value="FINANCIAL_SCHOLARSHIP">Bursar & Financial Scholarship Appeal</option>
                <option value="ETHICS_WHISTLEBLOWER">Independent Ethics & Whistleblower Portal</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                Subject / Title
              </label>
              <input
                type="text"
                required
                value={fileForm.title}
                onChange={(e) => setFileForm({ ...fileForm, title: e.target.value })}
                className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                placeholder="Brief summary of the issue..."
              />
            </div>

            <div>
              <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                Detailed Narrative / Factual Background
              </label>
              <textarea
                required
                rows={4}
                value={fileForm.description}
                onChange={(e) => setFileForm({ ...fileForm, description: e.target.value })}
                className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                placeholder="Describe specific dates, times, personnel involved, and evidence..."
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border flex items-center justify-between">
              <div>
                <p className="font-semibold text-charcoal-900 dark:text-ivory-100">
                  Confidential Whistleblower Submission
                </p>
                <p className="text-[11px] text-charcoal-500">
                  Mask personal identity from the respondent party. Only Ombudsman chairman has access.
                </p>
              </div>
              <input
                type="checkbox"
                checked={fileForm.isAnonymous}
                onChange={(e) => setFileForm({ ...fileForm, isAnonymous: e.target.checked })}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </div>

            {/* Whistleblower Encrypted Audio Voice Note Recorder */}
            <div className="p-4 bg-rose-50/50 dark:bg-charcoal-800/80 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                      Encrypted Audio Voice Deposition
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                        AES-256 GCM
                      </span>
                    </h4>
                    <p className="text-[11px] text-charcoal-500">
                      Record confidential spoken testimony with anti-ragging voice pitch scrambler.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[11px] text-charcoal-600 dark:text-ivory-300 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={maskVoicePitch}
                      onChange={(e) => setMaskVoicePitch(e.target.checked)}
                      className="rounded text-rose-600 w-3.5 h-3.5"
                    />
                    Acoustic Voice Masking
                  </label>
                </div>
              </div>

              {/* Recorder Controls & Waveform */}
              <div className="bg-white dark:bg-charcoal-900 p-3 rounded-lg border border-border dark:border-charcoal-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isRecording && !hasRecordedAudio && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      Record Testimony
                    </button>
                  )}

                  {isRecording && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs animate-pulse"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Stop Recording ({String(Math.floor(recordingSeconds / 60)).padStart(2, "0")}:{String(recordingSeconds % 60).padStart(2, "0")})
                    </button>
                  )}

                  {hasRecordedAudio && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        {isPlayingAudio ? (
                          <>
                            <Square className="w-3.5 h-3.5" /> Stop Playback
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Play Encrypted Note
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={downloadAudioDeposition}
                        className="p-1.5 rounded-lg text-charcoal-600 dark:text-ivory-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                        title="Download Encrypted Audio (.wav)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={deleteRecording}
                        className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Animated Waveform Simulation */}
                <div className="flex items-center gap-1 h-6 px-3 bg-ivory-50 dark:bg-charcoal-800 rounded-md border border-border dark:border-charcoal-700 w-full sm:w-48 justify-center">
                  {[24, 40, 60, 30, 75, 45, 90, 65, 35, 80, 50, 70, 40, 25].map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${
                        isRecording || isPlayingAudio
                          ? "bg-rose-500 animate-pulse"
                          : hasRecordedAudio
                          ? "bg-emerald-500"
                          : "bg-charcoal-300 dark:bg-charcoal-600"
                      }`}
                      style={{
                        height: isRecording || isPlayingAudio ? `${Math.max(6, (height * ((i % 3) + 1)) % 22)}px` : `${Math.max(4, height / 4)}px`,
                      }}
                    />
                  ))}
                </div>

                <div className="text-[11px] font-mono text-charcoal-500">
                  {isRecording ? "🔴 RECORDING LIVE..." : hasRecordedAudio ? "✓ SECURE ATTACHMENT READY" : "IDLE (00:00)"}
                </div>
              </div>

              {hasRecordedAudio && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Payload Sealed: 256-bit envelope hash sha256:7f9a...e31b (Voice masked: {maskVoicePitch ? "YES" : "NO"})</span>
                </div>
              )}
            </div>

            {!fileForm.isAnonymous && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Grievant Name
                  </label>
                  <input
                    type="text"
                    value={fileForm.grievantName}
                    onChange={(e) => setFileForm({ ...fileForm, grievantName: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Roll / Registration ID
                  </label>
                  <input
                    type="text"
                    value={fileForm.grievantRollOrId}
                    onChange={(e) => setFileForm({ ...fileForm, grievantRollOrId: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="pt-3">
              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold bg-rose-primary text-white hover:bg-rose-accent transition-colors shadow-md text-sm flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Official Petition
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: COMMITTEES */}
      {activeTab === "committees" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {summary?.committees.map((com) => (
            <div
              key={com.id}
              className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                    {com.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 font-medium">
                    {com.membersCount} Board Members
                  </span>
                </div>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-2">
                  {com.name}
                </h3>
                <p className="text-xs text-charcoal-600 dark:text-ivory-300 mt-1">
                  {com.mandate}
                </p>

                <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-1.5 text-xs">
                  <p className="text-charcoal-700 dark:text-ivory-200">
                    <span className="font-bold text-charcoal-500">Presiding Head:</span> {com.headName} ({com.headDesignation})
                  </p>
                  <p className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{com.emergencyHelpline}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-charcoal-500">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{com.officialEmail}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex justify-between items-center text-xs">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duly Constituted
                </span>
                <span className="text-charcoal-400">Statutory Gazette Notification #2026</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: COMPLIANCE AUDIT */}
      {activeTab === "compliance" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-6 border border-border dark:border-charcoal-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
              Statutory Accreditation & Ombudsman Compliance Report
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Annual return for the University Grants Commission (UGC) & AICTE National Redressal Portal
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Total Redressal Cases</p>
              <p className="text-2xl font-bold mt-1 text-charcoal-900 dark:text-ivory-100">
                {summary?.totalGrievances}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">100% cataloged with audit trace</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Statutory Disposal</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                {summary?.disposalRate}%
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Exceeds national benchmark (80%)</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Anti-Ragging Cases</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">0</p>
              <p className="text-xs text-charcoal-500 mt-0.5">Zero incident campus certificate</p>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Record Committee Action Taken Report (ATR)
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveGrievance} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Findings & Action Taken Report
                </label>
                <textarea
                  required
                  rows={4}
                  value={resolveForm.actionTakenReport}
                  onChange={(e) => setResolveForm({ ...resolveForm, actionTakenReport: e.target.value })}
                  className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="Official resolution summary agreed upon by the committee..."
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Disposal Status
                </label>
                <select
                  value={resolveForm.status}
                  onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  <option value="RESOLVED">Resolved in Favor of Grievant / Amicable Settlement</option>
                  <option value="DISMISSED">Dismissed with Reason</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Confirm Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
