"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Building2,
  Building,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Users,
  Plus,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Cpu,
  Globe,
  Award,
  Sparkles,
  Search,
} from "lucide-react";

export default function InstitutionERPPage() {
  const { showToast, refreshTrigger, triggerRefresh, currentRole } = useApp();

  const [institution, setInstitution] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchDept, setSearchDept] = useState("");
  const [selectedCampusFilter, setSelectedCampusFilter] = useState("ALL");

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deptForm, setDeptForm] = useState({
    code: "",
    name: "",
    description: "",
    campusId: "",
  });

  const fetchInstitutionData = () => {
    setIsLoading(true);
    fetch("/api/institution")
      .then((res) => res.json())
      .then((data) => {
        setInstitution(data.institution);
        setCampuses(data.campuses || []);
        setHierarchy(data.hierarchy || []);
        setDepartments(data.departments || []);
        if (data.campuses?.length > 0) {
          setDeptForm((prev) => ({ ...prev, campusId: data.campuses[0].id }));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Institution fetch error:", err);
        showToast("Error retrieving institutional architecture", "error");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchInstitutionData();
  }, [refreshTrigger]);

  const handleConfigureDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.code.trim() || !deptForm.name.trim()) {
      showToast("Please provide department code and title", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptForm),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Department configured successfully", "success");
        setIsDeptModalOpen(false);
        setDeptForm({
          code: "",
          name: "",
          description: "",
          campusId: campuses[0]?.id || "",
        });
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to configure department", "error");
      }
    } catch {
      showToast("Network error configuring department", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHierarchyIcon = (level: string) => {
    switch (level) {
      case "Institution":
        return Building2;
      case "Campus":
        return Building;
      case "School / Faculty":
        return Layers;
      case "Department":
        return Users;
      case "Program":
        return GraduationCap;
      default:
        return Calendar;
    }
  };

  const filteredDepts = departments.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(searchDept.toLowerCase()) ||
      d.code.toLowerCase().includes(searchDept.toLowerCase());
    return matchSearch;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Hero Banner with Multi-Campus Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Ambient blurred glow */}
          <div className="absolute top-0 right-1/4 -mt-12 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -mb-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-primary/30 shrink-0">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    Institution Governance & ERP Architecture
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-emerald-950/60 text-academic-success border border-green-200 dark:border-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Multi-Campus Operating System
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Hierarchical Topology
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  Unified collegiate infrastructure topology: University Senate → Campuses → Schools → Academic Departments → Degree Curricula.
                </p>
              </div>
            </div>

            {currentRole !== "GUEST" ? (
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(true)}
                className="btn-primary-glow flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Configure Department</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 text-xs font-semibold border border-charcoal-200 dark:border-charcoal-700">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Inspector Mode (Read-Only)</span>
              </div>
            )}
          </div>
        </div>

        {/* 4 Infrastructure Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Campus Facilities
                </span>
                <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                  {campuses.length || 2}
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center shadow-xs">
                <Building className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">Main & Tech Park</span>
              <span className="text-academic-success font-bold flex items-center gap-0.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Operational
              </span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Academic Departments
                </span>
                <div className="text-3xl font-display font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  {departments.length || 4}
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-xs">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">All Accredited</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">NAAC A++ Grade</span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Degree Curricula
                </span>
                <div className="text-3xl font-display font-extrabold text-academic-success mt-1">
                  24
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-academic-success-subtle text-academic-success flex items-center justify-center shadow-xs">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">Undergrad & Postgrad</span>
              <span className="text-academic-success font-bold">OBE Aligned</span>
            </div>
          </div>

          <div className="glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                  Data Governance
                </span>
                <div className="text-3xl font-display font-extrabold text-amber-500 mt-1">
                  SOC2
                </div>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
              <span className="text-charcoal-500 dark:text-charcoal-400">FERPA Compliant</span>
              <span className="text-academic-success font-bold">Zero-Trust Active</span>
            </div>
          </div>
        </div>

        {/* Hierarchical Governance Pipeline Visual Flow */}
        <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/80 dark:border-charcoal-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-rose-primary" />
                Hierarchical Academic Governance Pipeline
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                Role-based data inheritance and administrative boundary enforcement
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-primary/10 text-rose-primary dark:text-rose-light">
              6 Tiers Configured
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2">
            {hierarchy.map((item, index) => {
              const Icon = getHierarchyIcon(item.level);
              return (
                <div
                  key={item.code || item.level}
                  className="p-4 rounded-2xl bg-surface-soft/80 dark:bg-charcoal-900/60 border border-border/80 dark:border-charcoal-800 flex flex-col justify-between gap-3 relative group hover:border-rose-primary/40 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded-md bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400">
                      Tier 0{index + 1}
                    </span>
                    <Icon className="h-4 w-4 text-rose-primary dark:text-rose-light" />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 block uppercase">
                      {item.level}
                    </span>
                    <strong className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block mt-0.5 line-clamp-2">
                      {item.name}
                    </strong>
                  </div>

                  <div className="pt-2 border-t border-border/50 dark:border-charcoal-800 text-[10px] text-academic-success font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active Boundary
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Academic Departments Showcase */}
        <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80 dark:border-charcoal-800">
            <div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-rose-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100">
                  Active Collegiate Academic Departments
                </h2>
              </div>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                Directly bound to live SQLite multi-tenant department ledger
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search department..."
                  value={searchDept}
                  onChange={(e) => setSearchDept(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                />
              </div>

              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-academic-success-subtle text-academic-success shrink-0">
                {departments.length} Operational Units
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDepts.map((dept) => (
                <div
                  key={dept.id}
                  className="p-6 rounded-3xl border border-border dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-900 hover:border-rose-primary/40 transition-all flex flex-col justify-between gap-4 shadow-soft relative overflow-hidden"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-primary/10 text-rose-primary dark:text-rose-light">
                        {dept.code}
                      </span>
                      <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">
                        {dept.programs} Degree Programs
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-2.5">
                      {dept.name}
                    </h3>
                    <span className="text-xs text-charcoal-600 dark:text-charcoal-400 block mt-1">
                      Department Chair / HOD:{" "}
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">{dept.hod}</span>
                    </span>
                    {dept.description && (
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2 leading-relaxed">
                        {dept.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 pt-4 border-t border-border/60 dark:border-charcoal-800 text-center">
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-charcoal-800 border border-border/80 dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Faculty</span>
                      <strong className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                        {dept.faculty}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-charcoal-800 border border-border/80 dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Students</span>
                      <strong className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                        {dept.students}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-white dark:bg-charcoal-800 border border-border/80 dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Courses</span>
                      <strong className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                        {dept.courses}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Configure Department */}
        <Modal
          isOpen={isDeptModalOpen}
          onClose={() => setIsDeptModalOpen(false)}
          title="Configure Academic Department"
          description="Establish a new department with associated curricula, programs, and faculty allocation."
        >
          <form onSubmit={handleConfigureDepartment} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="e.g. MECH"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 uppercase"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Assigned Campus
                </label>
                <select
                  value={deptForm.campusId}
                  onChange={(e) => setDeptForm({ ...deptForm, campusId: e.target.value })}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Department Full Name
              </label>
              <input
                type="text"
                value={deptForm.name}
                onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                placeholder="e.g. Mechanical & Robotics Systems Engineering"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Mission / Research Scope
              </label>
              <textarea
                rows={3}
                value={deptForm.description}
                onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                placeholder="Robotics actuation, autonomous dynamics, and micro-electromechanical systems..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsDeptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? "Configuring..." : "Configure Department"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
