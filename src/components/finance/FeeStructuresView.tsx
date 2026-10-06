"use client";

import React, { useState, useEffect } from "react";
import { Plus, Layers, DollarSign, Calendar, ShieldCheck, Check, Trash2 } from "lucide-react";
import { MasterFeeStructure, FeeHeadItem } from "@/lib/finance/finance-engine";
import { Modal } from "@/components/common/Modal";

interface FeeStructuresViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function FeeStructuresView({ showToast }: FeeStructuresViewProps) {
  const [structures, setStructures] = useState<MasterFeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<MasterFeeStructure | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [programCode, setProgramCode] = useState("BTECH-CSE");
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [quotaType, setQuotaType] = useState<MasterFeeStructure["quotaType"]>("MERIT_GENERAL");
  const [studentType, setStudentType] = useState<MasterFeeStructure["studentType"]>("DAY_SCHOLAR");
  const [dueDate, setDueDate] = useState("2026-11-15");
  const [heads, setHeads] = useState<FeeHeadItem[]>([
    { id: "h1", name: "Academic Tuition & Instruction", category: "TUITION", amount: 6000 },
    { id: "h2", name: "Advanced Computing Labs", category: "LAB", amount: 1000 },
    { id: "h3", name: "Library & Digital Journals", category: "LIBRARY", amount: 400 },
    { id: "h4", name: "Caution Deposit (Refundable)", category: "CAUTION_DEPOSIT", amount: 500, isRefundable: true },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadStructures() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/structures");
      if (res.ok) {
        const data = await res.json();
        setStructures(data.structures || []);
      }
    } catch {
      showToast("Failed to load fee structures", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStructures();
  }, []);

  const totalCalculated = heads.reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

  const handleAddHead = () => {
    setHeads([
      ...heads,
      {
        id: `h_${Date.now()}`,
        name: "New Fee Head",
        category: "OTHER",
        amount: 500,
        isRefundable: false,
      },
    ]);
  };

  const handleRemoveHead = (idx: number) => {
    if (heads.length <= 1) return;
    setHeads(heads.filter((_, i) => i !== idx));
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) {
      showToast("Please provide both structure code and title", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          title,
          programCode,
          academicYear,
          quotaType,
          studentType,
          dueDate,
          heads,
        }),
      });

      if (res.ok) {
        showToast(`Master Fee Structure ${code} successfully configured!`, "success");
        setIsCreateModalOpen(false);
        loadStructures();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create fee structure", "error");
      }
    } catch {
      showToast("Network error creating fee structure", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-soft">
        <div>
          <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-rose-primary" />
            Master Fee Structure & Quota Catalog
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Institutional fee heads, quota pricing tiers, and hosteller/day scholar schedule definitions
          </p>
        </div>
        <button
          onClick={() => {
            setCode(`FEE-${Date.now().toString().slice(-4)}`);
            setTitle("");
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Fee Structure</span>
        </button>
      </div>

      {/* Grid of Fee Structure Cards */}
      {loading ? (
        <div className="text-center py-10 text-xs text-charcoal-500">Loading master structures...</div>
      ) : structures.length === 0 ? (
        <div className="p-8 text-center text-xs text-charcoal-500 glass-panel rounded-2xl">
          No fee structures configured yet. Click above to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {structures.map((s) => (
            <div
              key={s.id}
              className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-700 flex flex-col justify-between hover:border-rose-primary/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-[11px] font-bold text-rose-primary dark:text-rose-light px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                    {s.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200">
                    {s.academicYear}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                  {s.title}
                </h3>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {s.quotaType.replace("_", " ")}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900">
                    {s.studentType.replace("_", " ")}
                  </span>
                </div>

                {/* Head Breakdown Preview */}
                <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-700 space-y-1.5">
                  <div className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">
                    Fee Heads ({s.heads.length})
                  </div>
                  {s.heads.slice(0, 3).map((h) => (
                    <div key={h.id} className="flex justify-between text-xs text-charcoal-600 dark:text-charcoal-300">
                      <span className="truncate pr-2">{h.name}</span>
                      <span className="font-mono font-medium">${h.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {s.heads.length > 3 && (
                    <div className="text-[10px] text-charcoal-400 italic">
                      + {s.heads.length - 3} more line items
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border dark:border-charcoal-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-400 block uppercase font-bold">Total Annual Fee</span>
                  <span className="text-xl font-bold text-academic-success font-display">
                    ${s.totalAmount.toLocaleString()}.00
                  </span>
                </div>
                <button
                  onClick={() => setSelectedStructure(s)}
                  className="px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold transition-all"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Details */}
      <Modal
        isOpen={selectedStructure !== null}
        onClose={() => setSelectedStructure(null)}
        title="Fee Structure Breakdown"
      >
        {selectedStructure && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{selectedStructure.title}</span>
                <span className="font-mono text-xs font-bold text-rose-primary">{selectedStructure.code}</span>
              </div>
              <div className="text-charcoal-500 text-[11px]">
                Program: {selectedStructure.programCode} • Academic Year: {selectedStructure.academicYear} • Due Date: {selectedStructure.dueDate}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 uppercase">
                Itemized Fee Heads
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700 border border-border dark:border-charcoal-700 rounded-xl overflow-hidden">
                {selectedStructure.heads.map((h) => (
                  <div key={h.id} className="p-2.5 flex justify-between items-center bg-white dark:bg-charcoal-800">
                    <div>
                      <span className="font-medium text-charcoal-900 dark:text-ivory-100 block">{h.name}</span>
                      <span className="text-[10px] text-charcoal-400 uppercase">{h.category} {h.isRefundable && "• Refundable"}</span>
                    </div>
                    <span className="font-bold font-mono text-charcoal-900 dark:text-ivory-100">${h.amount.toLocaleString()}.00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-academic-success-subtle text-academic-success font-bold flex justify-between items-center text-sm">
              <span>Gross Total Assessment</span>
              <span>${selectedStructure.totalAmount.toLocaleString()}.00 USD</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Create New Structure */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Master Fee Structure"
      >
        <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Structure Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. BTECH-CSE-2026"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-mono"
                required
              />
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Program</label>
              <select
                value={programCode}
                onChange={(e) => setProgramCode(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2"
              >
                <option value="BTECH-CSE">B.Tech Computer Science</option>
                <option value="BTECH-ECE">B.Tech Electronics & Comm</option>
                <option value="MBA-EXEC">MBA Executive Business</option>
                <option value="MCA-CLOUD">MCA Cloud Computing</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Structure Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. B.Tech Computer Science (Regular Merit Quota)"
              className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Quota Tier</label>
              <select
                value={quotaType}
                onChange={(e: any) => setQuotaType(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-1.5 text-[11px]"
              >
                <option value="MERIT_GENERAL">Merit / General</option>
                <option value="MANAGEMENT">Management Quota</option>
                <option value="NRI_INTERNATIONAL">NRI / Global</option>
                <option value="EWS_SPORTS">EWS / Sports</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Residency</label>
              <select
                value={studentType}
                onChange={(e: any) => setStudentType(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-1.5 text-[11px]"
              >
                <option value="DAY_SCHOLAR">Day Scholar</option>
                <option value="HOSTELLER_STANDARD">Hostel (Standard)</option>
                <option value="HOSTELLER_PREMIUM">Hostel (Premium AC)</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-1.5 text-[11px]"
                required
              />
            </div>
          </div>

          {/* Dynamic Fee Heads Table */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-charcoal-700 dark:text-charcoal-300">Itemized Fee Heads</span>
              <button
                type="button"
                onClick={handleAddHead}
                className="text-[11px] font-bold text-rose-primary hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Head
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {heads.map((h, idx) => (
                <div key={h.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={h.name}
                    onChange={(e) => {
                      const updated = [...heads];
                      updated[idx].name = e.target.value;
                      setHeads(updated);
                    }}
                    placeholder="Head Name"
                    className="flex-1 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-lg p-1.5 text-[11px]"
                  />
                  <input
                    type="number"
                    min="0"
                    value={h.amount}
                    onChange={(e) => {
                      const updated = [...heads];
                      updated[idx].amount = Number(e.target.value);
                      setHeads(updated);
                    }}
                    placeholder="Amount"
                    className="w-24 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-lg p-1.5 text-[11px] font-mono text-right"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHead(idx)}
                    disabled={heads.length <= 1}
                    className="p-1 text-charcoal-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-border dark:border-charcoal-700 flex justify-between items-center font-bold">
            <span className="text-charcoal-600 dark:text-charcoal-400">Total Calculated:</span>
            <span className="text-base font-black text-rose-primary">${totalCalculated.toLocaleString()}.00</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Fee Structure"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
