"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import {
  ShieldAlert,
  Building2,
  Users,
  Settings,
  Database,
  Cpu,
  Lock,
  Activity,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Plus,
  Play,
  RefreshCw,
  Clock,
  Sparkles,
  Calendar,
} from "lucide-react";

export default function SuperAdminPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<"tenants" | "features" | "audit" | "system">("tenants");

  // Feature Flags State (Persisted)
  const [flags, setFlags] = useState({
    aiQuestionGeneration: true,
    rfidAttendanceSync: true,
    strictGradeVerification: true,
  });

  // Tenants State
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [activeTenantCode, setActiveTenantCode] = useState<string>("APEX-UNIV");

  // Provision Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    name: "",
    code: "",
    motto: "",
    campusName: "",
    location: "",
  });

  // Automation Jobs
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastJobResult, setLastJobResult] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSwitchingTenant, setIsSwitchingTenant] = useState(false);

  // 1. Fetch persisted settings, tenants, and audit logs on mount
  useEffect(() => {
    async function loadAdminData() {
      try {
        // Load Settings
        const settingsRes = await fetch("/api/admin/settings");
        if (settingsRes.ok) {
          const sData = await settingsRes.json();
          if (sData.settings) setFlags(sData.settings);
        }

        // Load Tenants
        const tenantsRes = await fetch("/api/admin/tenants");
        if (tenantsRes.ok) {
          const tData = await tenantsRes.json();
          if (tData.institutions) setInstitutions(tData.institutions);
        }

        // Load Live Database Audit Logs
        const logsRes = await fetch("/api/admin/audit-logs");
        if (logsRes.ok) {
          const lData = await logsRes.json();
          if (lData.logs) setAuditLogs(lData.logs);
        }
      } catch (err) {
        console.error("Admin data load error:", err);
      }
    }
    loadAdminData();
  }, [refreshTrigger]);

  const handleToggleFlag = async (key: keyof typeof flags) => {
    const updated = { ...flags, [key]: !flags[key] };
    setFlags(updated);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        showToast(`Persisted flag update: ${key}`, "success");
      } else {
        showToast("Failed to save setting to database", "error");
      }
    } catch {
      showToast("Network error updating feature flags", "error");
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provisionForm.name.trim() || !provisionForm.code.trim()) {
      showToast("Please provide institution name and identifier code", "error");
      return;
    }

    setIsProvisioning(true);
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(provisionForm),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Institution provisioned successfully!", "success");
        setIsProvisionModalOpen(false);
        setProvisionForm({ name: "", code: "", motto: "", campusName: "", location: "" });
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to provision institution", "error");
      }
    } catch {
      showToast("Network error during provisioning", "error");
    } finally {
      setIsProvisioning(false);
    }
  };

  const handleRunJob = async (jobName: string) => {
    try {
      setRunningJob(jobName);
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobName }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastJobResult(data.result);
        showToast(`Automation job "${jobName}" completed successfully!`, "success");
      } else {
        showToast(data.error || "Job execution failed", "error");
      }
    } catch {
      showToast("Network error executing automation job", "error");
    } finally {
      setRunningJob(null);
    }
  };

  const handleSwitchTenant = async (id: string, name: string, code: string) => {
    setIsSwitchingTenant(true);
    try {
      const res = await fetch("/api/admin/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setActiveTenantCode(code);
        showToast(data.message || `Switched context to ${name}`, "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to switch tenant context", "error");
      }
    } catch {
      showToast("Network error switching tenant context", "error");
    } finally {
      setIsSwitchingTenant(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Super Admin Console
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-primary text-white">
                  Multi-Tenant Root
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Governance over institutions, campus tenancies, security audit trails, and autonomous AI subsystems
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Provision Institution</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-800 pb-2">
          {[
            { id: "tenants", label: "Institutions & Campuses", icon: Building2 },
            { id: "features", label: "Feature Flags & AI Config", icon: Settings },
            { id: "audit", label: "Security & Audit Logs", icon: Lock },
            { id: "system", label: "Database & Telemetry Health", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-rose-primary text-white shadow-sm"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-200 hover:bg-ivory-100 border border-border dark:border-charcoal-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Tenants */}
        {activeTab === "tenants" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(institutions.length > 0
              ? institutions
              : [
                  {
                    id: "inst-1",
                    code: "APEX-UNIV",
                    name: "Apex University of Science & Technology",
                    motto: "Veritas, Scientia, Progressus",
                    campuses: "Main Campus, Tech Innovation Campus",
                    studentCount: 18420,
                    facultyCount: 1240,
                    status: "ACTIVE",
                  },
                ]
            ).map((inst) => (
              <div
                key={inst.id}
                className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider">
                      {inst.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                      {inst.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                    {inst.name}
                  </h3>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Motto: <span className="italic">{inst.motto}</span>
                  </p>

                  <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex flex-col gap-1.5 text-xs text-charcoal-700 dark:text-ivory-200">
                    <div className="flex justify-between">
                      <span className="text-charcoal-500 dark:text-charcoal-400">Campuses:</span>
                      <span className="font-semibold">{inst.campuses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500 dark:text-charcoal-400">Scholars:</span>
                      <span className="font-semibold">{inst.studentCount} Enrolled</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500 dark:text-charcoal-400">Faculty:</span>
                      <span className="font-semibold">{inst.facultyCount} Verified</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border dark:border-charcoal-800 flex justify-end gap-2">
                  <button
                    disabled={isSwitchingTenant}
                    onClick={() => handleSwitchTenant(inst.id, inst.name, inst.code)}
                    className="px-3 py-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all disabled:opacity-50"
                  >
                    {activeTenantCode === inst.code ? "✓ Active Context" : isSwitchingTenant ? "Switching..." : "Switch Context"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Feature Flags & AI Config */}
        {activeTab === "features" && (
          <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-4">
            <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 border-b border-border dark:border-charcoal-800 pb-3">
              Platform Feature Flags & AI Guardrails (Persisted in Data Store)
            </h3>

            <div className="flex flex-col gap-3 divide-y divide-border/60 dark:divide-charcoal-800">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    AI Question Paper Formulation
                  </h4>
                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                    Allow faculty to formulate Bloom&apos;s-aligned exam questions using CLASSROOM AI
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFlag("aiQuestionGeneration")}
                  className="text-rose-primary dark:text-rose-accent"
                >
                  {flags.aiQuestionGeneration ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-charcoal-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    RFID Turnstile & IoT Sync
                  </h4>
                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                    Automated background ingestion of classroom RFID tap telemetry
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFlag("rfidAttendanceSync")}
                  className="text-rose-primary dark:text-rose-accent"
                >
                  {flags.rfidAttendanceSync ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-charcoal-400" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    Strict Grade Modification Guardrail
                  </h4>
                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                    Enforce human Controller of Examinations approval on all grade overrides
                  </p>
                </div>
                <button
                  onClick={() => handleToggleFlag("strictGradeVerification")}
                  className="text-rose-primary dark:text-rose-accent"
                >
                  {flags.strictGradeVerification ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-charcoal-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security & Audit Logs */}
        {activeTab === "audit" && (
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">Immutable Audit Trail</span>
              <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                All actions logged with IP, actor, and payload metadata
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Actor</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-charcoal-500">
                        No audit events recorded in database yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-900/40 transition-colors">
                        <td className="p-3 font-semibold">{log.actor}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 text-charcoal-700 dark:text-ivory-200">{log.target}</td>
                        <td className="p-3 font-mono text-charcoal-500 text-[11px]">{log.ip}</td>
                        <td className="p-3 text-charcoal-500">{log.time}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Database & Telemetry Health */}
        {activeTab === "system" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">Database Engine</span>
                  <Database className="h-4 w-4 text-rose-primary" />
                </div>
                <span className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  SQLite / Prisma 6.4.1
                </span>
                <span className="text-xs text-academic-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 40+ Normalized Tables Synchronized
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">AI Agent Layer</span>
                  <Cpu className="h-4 w-4 text-rose-accent" />
                </div>
                <span className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  12 Autonomous Agents
                </span>
                <span className="text-xs text-academic-success font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Grounded RAG + Guardrails Online
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">API Gateway Latency</span>
                  <Activity className="h-4 w-4 text-academic-info" />
                </div>
                <span className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  14 ms (p99)
                </span>
                <span className="text-xs text-charcoal-600 dark:text-charcoal-400 font-semibold">
                  Zero Dropped Frames • 99.98% Uptime
                </span>
              </div>
            </div>

            {/* Automation Engine Card */}
            <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                      Autonomous Institutional Automation & Cron Scheduler
                    </h3>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                      Zero-maintenance background routines for attendance aggregation, defaulter alerts, and fee ledger reconciliation
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunJob("all")}
                  disabled={runningJob !== null}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${runningJob === "all" ? "animate-spin" : ""}`} />
                  <span>{runningJob === "all" ? "Executing Full Batch..." : "Run All Routines"}</span>
                </button>
              </div>

              {/* Job Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "biometric",
                    title: "Biometric Attendance Sync",
                    freq: "Hourly (0 * * * *)",
                    desc: "Recalculates student aggregate attendance percentages from biometric logs & attendance sessions.",
                  },
                  {
                    id: "defaulters",
                    title: "Defaulter Risk Screening (<75%)",
                    freq: "Daily at 08:00 (0 8 * * *)",
                    desc: "Scans for scholars below 75% attendance, applies DEFAULTER_ALERT status, and issues urgent notices.",
                  },
                  {
                    id: "fees",
                    title: "Fee Ledger Reconciliation",
                    freq: "Daily at 00:00 (0 0 * * *)",
                    desc: "Evaluates term due dates, transitions unpaid accounts to OVERDUE, and delivers Bursar notices.",
                  },
                ].map((job) => (
                  <div
                    key={job.id}
                    className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-900/40 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">{job.title}</span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200">
                          {job.freq}
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 leading-relaxed">{job.desc}</p>
                    </div>

                    <button
                      onClick={() => handleRunJob(job.id)}
                      disabled={runningJob !== null}
                      className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-white dark:bg-charcoal-800 hover:bg-rose-container text-rose-primary dark:text-rose-accent border border-border dark:border-charcoal-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Play className={`h-3.5 w-3.5 ${runningJob === job.id ? "animate-spin" : ""}`} />
                      <span>{runningJob === job.id ? "Running..." : "Execute Routine"}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Results telemetry banner */}
              {lastJobResult && (
                <div className="p-4 rounded-xl bg-academic-success-subtle border border-green-200 text-academic-success flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Telemetry Report: Routine Executed Successfully</span>
                  </div>
                  <pre className="text-[11px] font-mono bg-white/80 dark:bg-charcoal-900 p-2.5 rounded-lg overflow-x-auto text-charcoal-800 dark:text-ivory-100 border border-green-100 dark:border-green-900">
                    {JSON.stringify(lastJobResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Provision New Institution */}
        <Modal
          isOpen={isProvisionModalOpen}
          onClose={() => setIsProvisionModalOpen(false)}
          title="Provision New University Tenant"
          description="Provision an independent multi-tenant educational institution with dedicated schemas and campuses."
        >
          <form onSubmit={handleProvisionSubmit} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={provisionForm.name}
                  onChange={(e) => setProvisionForm({ ...provisionForm, name: e.target.value })}
                  placeholder="e.g. Apex Medical Sciences"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Tenant Code (Unique)
                </label>
                <input
                  type="text"
                  value={provisionForm.code}
                  onChange={(e) => setProvisionForm({ ...provisionForm, code: e.target.value })}
                  placeholder="e.g. APEX-MED"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Institutional Motto
              </label>
              <input
                type="text"
                value={provisionForm.motto}
                onChange={(e) => setProvisionForm({ ...provisionForm, motto: e.target.value })}
                placeholder="e.g. Salus Populi Suprema Lex"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Primary Campus Name
                </label>
                <input
                  type="text"
                  value={provisionForm.campusName}
                  onChange={(e) => setProvisionForm({ ...provisionForm, campusName: e.target.value })}
                  placeholder="e.g. Hospital Teaching Campus"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Campus City / Location
                </label>
                <input
                  type="text"
                  value={provisionForm.location}
                  onChange={(e) => setProvisionForm({ ...provisionForm, location: e.target.value })}
                  placeholder="e.g. Medical Innovation District"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProvisioning}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isProvisioning ? "Provisioning..." : "Provision Tenant"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
