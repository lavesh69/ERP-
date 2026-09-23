"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
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
} from "lucide-react";

export default function InstitutionERPPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [institution, setInstitution] = useState<any>(null);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      case "Institution": return Building2;
      case "Campus": return Building;
      case "School / Faculty": return Layers;
      case "Department": return Users;
      case "Program": return GraduationCap;
      default: return Calendar;
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Institution ERP Architecture
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  Multi-Campus Governance
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Hierarchical structure: Campuses → Schools → Departments → Academic Programs → Cohort Sections
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Configure Department</span>
          </button>
        </div>

        {/* 6-Tier Hierarchy Breadcrumb Flow */}
        <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
          <h2 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider mb-3">
            Hierarchical Governance Pipeline
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {hierarchy.map((item, index) => {
              const Icon = getHierarchyIcon(item.level);
              return (
                <React.Fragment key={item.code || item.level}>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800">
                    <Icon className="h-4 w-4 text-rose-primary dark:text-rose-accent shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                        {item.level}
                      </span>
                      <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                        {item.name}
                      </span>
                    </div>
                  </div>
                  {index < hierarchy.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-charcoal-400 shrink-0 hidden md:block" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Departments Grid */}
        <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-4">
            <div>
              <h2 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Active Academic Departments
              </h2>
              <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                Managed in live SQLite database registry
              </span>
            </div>
            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
              {departments.length} Operational Units
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-900 hover:border-rose-accent/40 transition-all flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                        {dept.code}
                      </span>
                      <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">
                        {dept.programs} Degree Programs
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      {dept.name}
                    </h3>
                    <span className="text-xs text-charcoal-600 dark:text-charcoal-400 block mt-0.5">
                      HOD: <span className="font-semibold text-charcoal-800 dark:text-ivory-200">{dept.hod}</span>
                    </span>
                    {dept.description && (
                      <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-2">
                        {dept.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 dark:border-charcoal-800 text-center text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Faculty</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">{dept.faculty}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Students</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">{dept.students}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                      <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Courses</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">{dept.courses}</span>
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
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
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
