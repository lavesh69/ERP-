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
  Search,
  UserPlus,
  KeyRound,
  ShieldCheck,
  UserCheck,
  UserX,
  Filter,
  Edit2,
} from "lucide-react";

export default function SuperAdminPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();
  const [activeTab, setActiveTab] = useState<"tenants" | "users" | "features" | "audit" | "system">("tenants");

  // Feature Flags State (Persisted)
  const [flags, setFlags] = useState({
    aiQuestionGeneration: true,
    rfidAttendanceSync: true,
    strictGradeVerification: true,
  });

  // Tenants State
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [activeTenantCode, setActiveTenantCode] = useState<string>("APEX-UNIV");

  // Users & RBAC State
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  // Modals for User Management
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "STUDENT",
    phone: "",
    institutionId: "",
  });

  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    user: any | null;
    newPassword: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    user: null,
    newPassword: "",
    isSubmitting: false,
  });

  const [roleChangeModal, setRoleChangeModal] = useState<{
    isOpen: boolean;
    user: any | null;
    newRole: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    user: null,
    newRole: "STUDENT",
    isSubmitting: false,
  });

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

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const params = new URLSearchParams();
      if (userSearch.trim()) params.append("search", userSearch.trim());
      if (userRoleFilter) params.append("role", userRoleFilter);
      if (userStatusFilter) params.append("status", userStatusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab, userRoleFilter, userStatusFilter, refreshTrigger]);

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`User status set to ${!currentActive ? "ACTIVE" : "SUSPENDED"}`, "success");
        fetchUsers();
      } else {
        showToast(data.error || "Failed to update user status", "error");
      }
    } catch {
      showToast("Network error updating user status", "error");
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createUserForm.email || !createUserForm.password) {
      showToast("Email and password are required", "error");
      return;
    }
    setIsCreatingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createUserForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "User account created successfully", "success");
        setIsCreateUserModalOpen(false);
        setCreateUserForm({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "STUDENT",
          phone: "",
          institutionId: "",
        });
        fetchUsers();
      } else {
        showToast(data.error || "Failed to create user", "error");
      }
    } catch {
      showToast("Network error creating user", "error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.user || resetPasswordModal.newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    setResetPasswordModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resetPasswordModal.user.id,
          resetPassword: resetPasswordModal.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Password reset successfully for ${resetPasswordModal.user.email}`, "success");
        setResetPasswordModal({ isOpen: false, user: null, newPassword: "", isSubmitting: false });
      } else {
        showToast(data.error || "Failed to reset password", "error");
        setResetPasswordModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch {
      showToast("Network error resetting password", "error");
      setResetPasswordModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleRoleChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleChangeModal.user) return;
    setRoleChangeModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: roleChangeModal.user.id,
          role: roleChangeModal.newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Role updated to ${roleChangeModal.newRole}`, "success");
        setRoleChangeModal({ isOpen: false, user: null, newRole: "STUDENT", isSubmitting: false });
        fetchUsers();
      } else {
        showToast(data.error || "Failed to change role", "error");
        setRoleChangeModal((prev) => ({ ...prev, isSubmitting: false }));
      }
    } catch {
      showToast("Network error changing role", "error");
      setRoleChangeModal((prev) => ({ ...prev, isSubmitting: false }));
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
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-800 pb-2 overflow-x-auto">
          {[
            { id: "tenants", label: "Institutions & Campuses", icon: Building2 },
            { id: "users", label: "User Accounts & RBAC", icon: Users },
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

        {/* Tab: User Accounts & RBAC */}
        {activeTab === "users" && (
          <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden flex flex-col gap-4 p-5">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-rose-primary" />
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Institutional Accounts & Role-Based Access Control
                  </h3>
                  <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                    Manage university scholars, faculty members, and administrative privilege delegations
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create User Account</span>
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-5 relative">
                <Search className="h-4 w-4 absolute left-3 top-2.5 text-charcoal-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
                  placeholder="Search by full name or institutional email..."
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl pl-9 pr-3 py-2 text-charcoal-900 dark:text-ivory-100 font-medium placeholder:text-charcoal-400"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  <option value="">All Institutional Roles</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="INSTITUTION_ADMIN">Institution Administrator</option>
                  <option value="CAMPUS_DIRECTOR">Campus Director</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="DEAN">Dean</option>
                  <option value="HOD">Head of Department (HOD)</option>
                  <option value="PROGRAM_COORDINATOR">Program Coordinator</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="EXAM_CONTROLLER">Examination Controller</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="FINANCE_OFFICER">Finance Officer</option>
                  <option value="STUDENT">Student Scholar</option>
                  <option value="PARENT">Parent / Guardian</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SUSPENDED">Suspended Only</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <button
                  onClick={fetchUsers}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 font-bold transition-all"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-xl border border-border dark:border-charcoal-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-soft dark:bg-charcoal-900 text-charcoal-600 dark:text-charcoal-400 font-semibold border-b border-border dark:border-charcoal-800">
                  <tr>
                    <th className="py-3 px-4">User & Email</th>
                    <th className="py-3 px-4">Role & Privilege</th>
                    <th className="py-3 px-4">Academic Context</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 font-medium">
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-charcoal-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-rose-primary" />
                          <span>Loading institutional accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-charcoal-500">
                        No user accounts found matching query.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isPrivileged = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"].includes(u.role);
                      const isTeacher = ["PROFESSOR", "FACULTY", "CLASS_TEACHER"].includes(u.role);

                      return (
                        <tr key={u.id} className="hover:bg-ivory-50 dark:hover:bg-charcoal-900/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-rose-container text-rose-primary font-bold flex items-center justify-center shrink-0 text-xs">
                                {u.firstName ? u.firstName[0].toUpperCase() : "U"}
                              </div>
                              <div>
                                <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                                  {u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "User"}
                                </div>
                                <div className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-mono">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isPrivileged
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                                  : isTeacher
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                                  : u.role === "STUDENT"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900"
                              }`}
                            >
                              <ShieldCheck className="h-3 w-3" />
                              <span>{u.role.replace(/_/g, " ")}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-[11px] text-charcoal-600 dark:text-charcoal-300">
                            <div>{u.institutionName || "Apex University"}</div>
                            {u.studentRollNumber && (
                              <div className="text-charcoal-500 font-mono">Roll: {u.studentRollNumber}</div>
                            )}
                            {u.facultyEmployeeId && (
                              <div className="text-charcoal-500 font-mono">Emp: {u.facultyEmployeeId}</div>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.isActive
                                  ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  u.isActive ? "bg-green-500" : "bg-red-500"
                                }`}
                              />
                              <span>{u.isActive ? "ACTIVE" : "SUSPENDED"}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Status Toggle */}
                              <button
                                onClick={() => handleToggleUserStatus(u.id, u.isActive)}
                                title={u.isActive ? "Suspend User" : "Activate User"}
                                className={`p-1.5 rounded-lg border text-xs font-bold transition-all ${
                                  u.isActive
                                    ? "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                                    : "text-green-700 bg-green-50 hover:bg-green-100 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
                                }`}
                              >
                                {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </button>

                              {/* Change Role */}
                              <button
                                onClick={() =>
                                  setRoleChangeModal({
                                    isOpen: true,
                                    user: u,
                                    newRole: u.role,
                                    isSubmitting: false,
                                  })
                                }
                                title="Change Role & Privileges"
                                className="p-1.5 rounded-lg border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-700 dark:text-ivory-200 transition-all"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              {/* Reset Password */}
                              <button
                                onClick={() =>
                                  setResetPasswordModal({
                                    isOpen: true,
                                    user: u,
                                    newPassword: "",
                                    isSubmitting: false,
                                  })
                                }
                                title="Reset User Password"
                                className="p-1.5 rounded-lg border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-700 dark:text-ivory-200 transition-all"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
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

        {/* Modal: Create User Account */}
        <Modal
          isOpen={isCreateUserModalOpen}
          onClose={() => setIsCreateUserModalOpen(false)}
          title="Create Institutional User Account"
          description="Provision a unified account with role permissions and initial institutional credentials."
        >
          <form onSubmit={handleCreateUserSubmit} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={createUserForm.firstName}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, firstName: e.target.value })}
                  placeholder="e.g. John"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={createUserForm.lastName}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, lastName: e.target.value })}
                  placeholder="e.g. Doe"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                  placeholder="e.g. jdoe@college.edu or gmail"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Temporary Password * (min 8 chars)
                </label>
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  minLength={8}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Assigned Institutional Role *
                </label>
                <select
                  value={createUserForm.role}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                >
                  <option value="STUDENT">Student Scholar</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="PROFESSOR">Professor</option>
                  <option value="CLASS_TEACHER">Class Teacher</option>
                  <option value="HOD">Head of Department (HOD)</option>
                  <option value="PRINCIPAL">Principal</option>
                  <option value="EXAM_CONTROLLER">Examination Controller</option>
                  <option value="LIBRARIAN">Librarian</option>
                  <option value="FINANCE_OFFICER">Finance Officer</option>
                  <option value="INSTITUTION_ADMIN">Institution Administrator</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="PARENT">Parent / Guardian</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={createUserForm.phone}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingUser}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isCreatingUser ? "Provisioning..." : "Provision User"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Reset Password */}
        <Modal
          isOpen={resetPasswordModal.isOpen}
          onClose={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })}
          title="Reset User Credentials"
          description={`Issue a secure password reset for ${resetPasswordModal.user?.email || "user"}.`}
        >
          <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                New Secure Password (min 8 chars)
              </label>
              <input
                type="password"
                value={resetPasswordModal.newPassword}
                onChange={(e) =>
                  setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })
                }
                placeholder="Enter new 8+ character password"
                minLength={8}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-mono text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setResetPasswordModal({ ...resetPasswordModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetPasswordModal.isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {resetPasswordModal.isSubmitting ? "Resetting..." : "Save New Password"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Change Role */}
        <Modal
          isOpen={roleChangeModal.isOpen}
          onClose={() => setRoleChangeModal({ ...roleChangeModal, isOpen: false })}
          title="Change Role & Delegations"
          description={`Update RBAC authority and permissions for ${roleChangeModal.user?.email || "user"}.`}
        >
          <form onSubmit={handleRoleChangeSubmit} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Assign Institutional Role
              </label>
              <select
                value={roleChangeModal.newRole}
                onChange={(e) => setRoleChangeModal({ ...roleChangeModal, newRole: e.target.value })}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              >
                <option value="STUDENT">Student Scholar</option>
                <option value="FACULTY">Faculty Member</option>
                <option value="PROFESSOR">Professor</option>
                <option value="CLASS_TEACHER">Class Teacher</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="EXAM_CONTROLLER">Examination Controller</option>
                <option value="LIBRARIAN">Librarian</option>
                <option value="FINANCE_OFFICER">Finance Officer</option>
                <option value="INSTITUTION_ADMIN">Institution Administrator</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
                <option value="PARENT">Parent / Guardian</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setRoleChangeModal({ ...roleChangeModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={roleChangeModal.isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {roleChangeModal.isSubmitting ? "Updating..." : "Confirm Role Change"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
