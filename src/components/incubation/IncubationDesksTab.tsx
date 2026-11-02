// SPDX-License-Identifier: Apache-2.0
/**
 * IncubationDesksTab Component
 * Real-time workspace desk allocation matrix across innovation pods in the incubator.
 */

"use client";

import React, { useState } from "react";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  PlusCircle,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { LabDeskAllocation, IncubatedStartup } from "@/lib/incubation/incubation-engine";

interface IncubationDesksTabProps {
  desks: LabDeskAllocation[];
  startups: IncubatedStartup[];
  onRefresh: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export default function IncubationDesksTab({
  desks,
  startups,
  onRefresh,
  showToast,
}: IncubationDesksTabProps) {
  const [selectedPod, setSelectedPod] = useState<string>("ALL");
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [targetDeskCode, setTargetDeskCode] = useState<string>("");
  const [targetStartupId, setTargetStartupId] = useState<string>(startups[0]?.id || "");

  const totalDesks = desks.length;
  const occupiedDesks = desks.filter((d) => d.status === "OCCUPIED").length;
  const vacantDesks = totalDesks - occupiedDesks;
  const occupancyRate = totalDesks > 0 ? Math.round((occupiedDesks / totalDesks) * 100) : 0;

  const pods = Array.from(new Set(desks.map((d) => d.podName)));

  const filteredDesks = desks.filter((d) => {
    if (selectedPod === "ALL") return true;
    return d.podName === selectedPod;
  });

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeskCode || !targetStartupId) {
      showToast("Please select both a desk and a startup", "error");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ALLOCATE_DESK",
          deskCode: targetDeskCode,
          startupId: targetStartupId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to allocate desk");
      }

      showToast(data.message || "Desk allocated successfully", "success");
      setShowAllocateModal(false);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeallocate = async (deskCode: string) => {
    if (!confirm(`Are you sure you want to release desk ${deskCode}?`)) return;

    try {
      const res = await fetch("/api/incubation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DEALLOCATE_DESK",
          deskCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to release desk");
      }

      showToast(data.message || "Desk marked vacant", "success");
      onRefresh();
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Innovation Desks</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-primary">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {totalDesks}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Across {pods.length} specialized pods</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Occupied Desks</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
            {occupiedDesks}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Active venture teams working on-site</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Vacant Capacity</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
            {vacantDesks}
          </div>
          <p className="text-xs text-charcoal-400 mt-1">Ready for incoming cohort allocation</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Lab Occupancy Rate</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
            {occupancyRate}%
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Optimal density maintained</p>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Filter Pod:</span>
          <select
            value={selectedPod}
            onChange={(e) => setSelectedPod(e.target.value)}
            className="px-3 py-1.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs font-medium text-charcoal-900 dark:text-ivory-100"
          >
            <option value="ALL">All Innovation Pods ({desks.length})</option>
            {pods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            const firstVacant = desks.find((d) => d.status === "VACANT");
            setTargetDeskCode(firstVacant ? firstVacant.deskCode : "");
            setShowAllocateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Allocate Lab Desk</span>
        </button>
      </div>

      {/* Desks Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDesks.map((desk) => {
          const isOccupied = desk.status === "OCCUPIED";
          return (
            <div
              key={desk.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isOccupied
                  ? "bg-white dark:bg-charcoal-900 border-border dark:border-charcoal-800 shadow-xs"
                  : "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 border-dashed"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-charcoal-900 dark:text-ivory-100 bg-ivory-100 dark:bg-charcoal-800 px-2 py-0.5 rounded-md">
                    {desk.deskCode}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isOccupied
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                    }`}
                  >
                    {desk.status}
                  </span>
                </div>

                <p className="text-[11px] font-semibold text-charcoal-500 dark:text-charcoal-400 mb-3">
                  {desk.podName}
                </p>

                {isOccupied ? (
                  <div className="space-y-1 p-2.5 bg-ivory-50 dark:bg-charcoal-800/50 rounded-xl border border-border/40 dark:border-charcoal-700/50 text-xs">
                    <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Assigned Startup</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                      {desk.startupName}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block">
                      Allocated: {desk.allocatedDate}
                    </span>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                    Available for booking
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-border/60 dark:border-charcoal-800 flex justify-end">
                {isOccupied ? (
                  <button
                    onClick={() => handleDeallocate(desk.deskCode)}
                    className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Vacate Desk</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setTargetDeskCode(desk.deskCode);
                      setShowAllocateModal(true);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Assign Now</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Allocate Desk Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 shadow-elevated border border-border dark:border-charcoal-800 space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-primary" />
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                  Allocate Workspace Desk
                </h3>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Select Innovation Desk *
                </label>
                <select
                  required
                  value={targetDeskCode}
                  onChange={(e) => setTargetDeskCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="">-- Choose Vacant Desk --</option>
                  {desks
                    .filter((d) => d.status === "VACANT" || d.deskCode === targetDeskCode)
                    .map((d) => (
                      <option key={d.id} value={d.deskCode}>
                        {d.deskCode} - {d.podName} {d.status === "OCCUPIED" ? "(Current)" : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Select Cohort Startup *
                </label>
                <select
                  required
                  value={targetStartupId}
                  onChange={(e) => setTargetStartupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.startupName} ({s.companyRef}) - {s.founderName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? "Allocating..." : "Confirm Desk Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
