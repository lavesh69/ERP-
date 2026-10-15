"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Bed,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Printer,
  DollarSign,
  Layers,
  Key,
  Wrench,
  Sparkles,
  X,
} from "lucide-react";
import { RoomInspectionRecord, AssetCheckItem } from "@/lib/hostel/hostel-inventory-engine";

export default function HostelAssetAuditTab() {
  const [inspections, setInspections] = useState<RoomInspectionRecord[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Move-out modal
  const [targetInspection, setTargetInspection] = useState<RoomInspectionRecord | null>(null);
  const [auditAssets, setAuditAssets] = useState<AssetCheckItem[]>([]);
  const [wardenName, setWardenName] = useState("Chief Warden Dr. H. C. Verma");
  const [wardenNotes, setWardenNotes] = useState("");
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);

  // Voucher modal
  const [viewingVoucher, setViewingVoucher] = useState<RoomInspectionRecord | null>(null);

  // Move-in modal
  const [showMoveInModal, setShowMoveInModal] = useState(false);
  const [moveInForm, setMoveInForm] = useState({
    studentName: "",
    rollNo: "",
    roomNumber: "",
    blockName: "Mandela International House",
    cautionDepositAmount: 500,
  });
  const [isSubmittingMoveIn, setIsSubmittingMoveIn] = useState(false);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hostel/inventory-audit");
      if (res.ok) {
        const data = await res.json();
        setInspections(data.inspections || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to load hostel inspections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const isAnyModalOpen = !!(targetInspection || viewingVoucher || showMoveInModal);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTargetInspection(null);
        setViewingVoucher(null);
        setShowMoveInModal(false);
      }
    };
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnyModalOpen]);

  const handleOpenAuditModal = (record: RoomInspectionRecord) => {
    setTargetInspection(record);
    setAuditAssets(
      record.assets.map((a) => ({
        ...a,
        moveOutStatus: a.moveOutStatus || a.moveInStatus || "GOOD",
        damageCharge: a.damageCharge || 0,
      }))
    );
    setWardenNotes(record.wardenNotes || "Full inventory re-verified. Condition consistent with acceptable wear.");
  };

  const handleItemStatusChange = (index: number, status: "PRISTINE" | "GOOD" | "DAMAGED" | "MISSING") => {
    const updated = [...auditAssets];
    updated[index].moveOutStatus = status;
    if (status === "DAMAGED") {
      updated[index].damageCharge = updated[index].damageCharge || 30;
    } else if (status === "MISSING") {
      updated[index].damageCharge = updated[index].damageCharge || 50;
    } else {
      updated[index].damageCharge = 0;
    }
    setAuditAssets(updated);
  };

  const handleItemChargeChange = (index: number, charge: number) => {
    const updated = [...auditAssets];
    updated[index].damageCharge = Math.max(0, charge);
    setAuditAssets(updated);
  };

  const handleSaveMoveOutAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInspection) return;
    setIsSubmittingAudit(true);
    try {
      const res = await fetch("/api/hostel/inventory-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONDUCT_MOVE_OUT_AUDIT",
          inspectionId: targetInspection.id,
          assets: auditAssets,
          wardenName,
          wardenNotes,
        }),
      });
      if (res.ok) {
        setTargetInspection(null);
        fetchInspections();
      }
    } catch (err) {
      console.error("Failed to submit move-out audit:", err);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  const handleCreateMoveIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMoveIn(true);
    try {
      const res = await fetch("/api/hostel/inventory-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MOVE_IN",
          ...moveInForm,
        }),
      });
      if (res.ok) {
        setShowMoveInModal(false);
        setMoveInForm({
          studentName: "",
          rollNo: "",
          roomNumber: "",
          blockName: "Mandela International House",
          cautionDepositAmount: 500,
        });
        fetchInspections();
      }
    } catch (err) {
      console.error("Failed to register move-in baseline:", err);
    } finally {
      setIsSubmittingMoveIn(false);
    }
  };

  const filtered = inspections.filter((i) => {
    if (statusFilter !== "ALL" && i.inspectionStatus !== statusFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        i.roomNumber.toLowerCase().includes(q) ||
        i.studentName.toLowerCase().includes(q) ||
        i.rollNo.toLowerCase().includes(q) ||
        i.blockName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Room Audits</span>
            <Building className="h-4 w-4 text-rose-primary" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.totalAudits || inspections.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Recorded residential rooms</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Clearances Issued</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.cleared || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Sealed deposit authorizations</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Damages Levied</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-2">
            ${analytics?.totalDamagesLevied || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Deducted from caution deposits</p>
        </div>

        <div className="glass-panel p-5 rounded-2xl shadow-soft border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Refunds Approved</span>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            ${(analytics?.totalRefundableApproved || 0).toLocaleString()}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Cleared for accounts payout</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl shadow-soft border border-border dark:border-charcoal-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search room number, student name, or block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Audit Statuses</option>
            <option value="MOVE_IN_VERIFIED">Move-In Verified (Occupied)</option>
            <option value="CLEARED_REFUND_APPROVED">Cleared & Refund Approved</option>
          </select>
        </div>

        <button
          onClick={() => setShowMoveInModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          <span>Register Move-In Baseline</span>
        </button>
      </div>

      {/* Inspections Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-charcoal-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading hostel room audits...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl border border-dashed border-border dark:border-charcoal-800">
          <Building className="h-10 w-10 text-charcoal-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-charcoal-800 dark:text-ivory-200">No Audits Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">Adjust search query or register a new room move-in.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft/80 dark:bg-charcoal-900/80 border-b border-border dark:border-charcoal-800 text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Room & Residence Block</th>
                  <th className="py-3 px-4">Student Scholar</th>
                  <th className="py-3 px-4">Caution Deposit</th>
                  <th className="py-3 px-4">Damage Deductions</th>
                  <th className="py-3 px-4">Net Refundable</th>
                  <th className="py-3 px-4">Audit Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800/60">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-soft/40 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                        Room {item.roomNumber}
                      </div>
                      <div className="text-[10px] text-charcoal-500">{item.blockName}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-charcoal-800 dark:text-ivory-200">{item.studentName}</div>
                      <div className="font-mono text-[10px] text-slate-500">{item.rollNo}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium">
                      ${item.cautionDepositAmount}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={item.totalDamageDeductions > 0 ? "text-rose-600 font-bold" : "text-emerald-600 font-medium"}>
                        -${item.totalDamageDeductions}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      ${item.refundableAmount}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.inspectionStatus === "CLEARED_REFUND_APPROVED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {item.inspectionStatus === "CLEARED_REFUND_APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                        {item.inspectionStatus.replace(/_/g, " ")}
                      </span>
                      {item.clearanceSeal && (
                        <div className="text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                          ✓ SEALED
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAuditModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-50 hover:text-rose-600 border border-border dark:border-charcoal-700 font-semibold"
                        >
                          <Wrench className="h-3.5 w-3.5 text-rose-primary" />
                          <span>Audit</span>
                        </button>
                        {item.clearanceSeal && (
                          <button
                            onClick={() => setViewingVoucher(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Voucher</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Move-Out Joint Inspection Audit */}
      {targetInspection && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hostel Room Move-Out Inventory Inspection"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetInspection(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Hostel Room Move-Out Inventory Inspection
                </h3>
              </div>
              <button
                onClick={() => setTargetInspection(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-surface-soft dark:bg-charcoal-800 rounded-xl text-xs space-y-1">
              <p>
                <strong>Room:</strong> {targetInspection.roomNumber} ({targetInspection.blockName})
              </p>
              <p>
                <strong>Occupant:</strong> {targetInspection.studentName} ({targetInspection.rollNo})
              </p>
              <p>
                <strong>Caution Deposit Escrow:</strong> ${targetInspection.cautionDepositAmount}
              </p>
            </div>

            <form onSubmit={handleSaveMoveOutAudit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-charcoal-500">
                  Physical Assets Verification Checklist
                </h4>
                <div className="space-y-2">
                  {auditAssets.map((asset, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal-900 dark:text-ivory-100">{asset.itemName}</p>
                        <p className="text-[10px] text-charcoal-500">
                          Category: {asset.category} • Move-In: {asset.moveInStatus}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={asset.moveOutStatus}
                          onChange={(e) => handleItemStatusChange(idx, e.target.value as any)}
                          className="text-xs p-1.5 rounded-lg bg-white dark:bg-charcoal-900 border"
                        >
                          <option value="PRISTINE">Pristine</option>
                          <option value="GOOD">Good (Normal Wear)</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="MISSING">Missing / Lost</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <span className="text-charcoal-500">$</span>
                          <input
                            type="number"
                            min="0"
                            value={asset.damageCharge}
                            onChange={(e) => handleItemChargeChange(idx, Number(e.target.value))}
                            className="w-16 p-1.5 rounded-lg bg-white dark:bg-charcoal-900 border text-right font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Calculation summary */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between font-bold text-xs">
                <span>Total Deductions: -${auditAssets.reduce((sum, a) => sum + (a.damageCharge || 0), 0)}</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  Net Refundable Caution: $
                  {Math.max(
                    0,
                    targetInspection.cautionDepositAmount -
                      auditAssets.reduce((sum, a) => sum + (a.damageCharge || 0), 0)
                  )}
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Caretaker / Warden Sign-Off Name</label>
                <input
                  type="text"
                  required
                  value={wardenName}
                  onChange={(e) => setWardenName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Inspection Sign-Off Notes</label>
                <textarea
                  rows={2}
                  value={wardenNotes}
                  onChange={(e) => setWardenNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setTargetInspection(null)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAudit}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingAudit ? "Authorizing..." : "Issue Clearance & Release Deposit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Clearance Voucher */}
      {viewingVoucher && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Hostel Clearance and Deposit Refund Voucher"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingVoucher(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-xl w-full p-8 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1 pb-4 border-b border-border dark:border-charcoal-800">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                HOSTEL CLEARANCE & DEPOSIT REFUND VOUCHER
              </h2>
              <p className="text-xs text-charcoal-500 font-semibold tracking-wider uppercase">
                Apex Institute of Technology • Office of Residential Life
              </p>
            </div>

            <div className="space-y-3 text-xs text-charcoal-700 dark:text-ivory-300">
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Student Scholar:</span>
                <span className="font-bold">{viewingVoucher.studentName} ({viewingVoucher.rollNo})</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Residence Hall & Room:</span>
                <span>Room {viewingVoucher.roomNumber} • {viewingVoucher.blockName}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Move-In / Vacate Dates:</span>
                <span>{viewingVoucher.moveInDate} to {viewingVoucher.moveOutDate || "Current"}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Caution Deposit Received:</span>
                <span>${viewingVoucher.cautionDepositAmount}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Inventory Damage Deductions:</span>
                <span className="text-rose-600 font-bold">-${viewingVoucher.totalDamageDeductions}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800 text-sm">
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">Net Deposit Refund Approved:</span>
                <span className="font-bold text-emerald-600">${viewingVoucher.refundableAmount}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Cryptographic Clearance Seal:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingVoucher.clearanceSeal}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
              ✓ This clearance certificate confirms that Room {viewingVoucher.roomNumber} has been inspected and handed over. The Finance Office is authorized to credit ${viewingVoucher.refundableAmount} to the student's bank account.
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setViewingVoucher(null)}
                className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Official Voucher</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Register Move-In Baseline */}
      {showMoveInModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register Room Move-In Baseline"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMoveInModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Register Room Move-In Baseline
                </h3>
              </div>
              <button
                onClick={() => setShowMoveInModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMoveIn} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={moveInForm.studentName}
                  onChange={(e) => setMoveInForm({ ...moveInForm, studentName: e.target.value })}
                  placeholder="e.g. Liam Zhang"
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Student Roll No</label>
                  <input
                    type="text"
                    required
                    value={moveInForm.rollNo}
                    onChange={(e) => setMoveInForm({ ...moveInForm, rollNo: e.target.value })}
                    placeholder="CS2026-118"
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={moveInForm.roomNumber}
                    onChange={(e) => setMoveInForm({ ...moveInForm, roomNumber: e.target.value })}
                    placeholder="B-301"
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Residence Block</label>
                <select
                  value={moveInForm.blockName}
                  onChange={(e) => setMoveInForm({ ...moveInForm, blockName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                >
                  <option value="Mandela International House">Mandela International House</option>
                  <option value="Curie Women's Hall">Curie Women's Hall</option>
                  <option value="Aryabhata Engineering Hall">Aryabhata Engineering Hall</option>
                  <option value="Tagore Postgraduate Wing">Tagore Postgraduate Wing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Caution Deposit ($)</label>
                <input
                  type="number"
                  required
                  value={moveInForm.cautionDepositAmount}
                  onChange={(e) => setMoveInForm({ ...moveInForm, cautionDepositAmount: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowMoveInModal(false)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMoveIn}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingMoveIn ? "Registering..." : "Lock Move-In Inventory"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
