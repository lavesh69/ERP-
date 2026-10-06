"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Plus, CheckCircle2, ShieldCheck, AlertCircle, Check, DollarSign } from "lucide-react";
import { RefundVoucher } from "@/lib/finance/finance-engine";
import { Modal } from "@/components/common/Modal";

interface RefundsViewProps {
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export function RefundsView({ showToast }: RefundsViewProps) {
  const [vouchers, setVouchers] = useState<RefundVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form states
  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [program, setProgram] = useState("B.Tech Computer Science");
  const [type, setType] = useState<RefundVoucher["type"]>("CAUTION_MONEY");
  const [amount, setAmount] = useState(500);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscOrSwift, setIfscOrSwift] = useState("CHASUS33XXX");
  const [bankName, setBankName] = useState("Chase Manhattan Bank");
  const [remarks, setRemarks] = useState("Final graduation caution deposit clearance release");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadVouchers() {
    try {
      setLoading(true);
      const res = await fetch("/api/finance/refunds");
      if (res.ok) {
        const data = await res.json();
        setVouchers(data.vouchers || []);
      }
    } catch {
      showToast("Failed to load refund vouchers", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVouchers();
  }, []);

  const handleApprove = async (voucherId: string) => {
    try {
      const res = await fetch("/api/finance/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE_REFUND", voucherId }),
      });

      if (res.ok) {
        showToast("Refund voucher approved by Bursar!", "success");
        loadVouchers();
      }
    } catch {
      showToast("Failed to approve voucher", "error");
    }
  };

  const handleDisburse = async (voucherId: string) => {
    try {
      const res = await fetch("/api/finance/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISBURSE_REFUND", voucherId }),
      });

      if (res.ok) {
        showToast("Refund disbursed to student bank account!", "success");
        loadVouchers();
      }
    } catch {
      showToast("Failed to disburse refund", "error");
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !rollNo || amount <= 0) {
      showToast("Please provide scholar name, roll number, and valid amount", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_REFUND",
          studentName,
          rollNo,
          program,
          type,
          amount,
          bankDetails: {
            accountHolder: studentName,
            accountNumber,
            ifscOrSwift,
            bankName,
          },
          remarks,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Refund request registered!", "success");
        setIsNewModalOpen(false);
        loadVouchers();
      }
    } catch {
      showToast("Network error creating refund voucher", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl shadow-soft">
        <div>
          <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-primary" />
            Caution Money & Student Refund Lifecycle
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Institutional security deposits, excess fee reversals, and departmental clearance checklists (Library, Hostel, Labs)
          </p>
        </div>

        <button
          onClick={() => {
            setStudentName("");
            setRollNo("");
            setIsNewModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>New Refund Voucher</span>
        </button>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
            Active Refund & Caution Deposit Settlement Vouchers
          </span>
          <span className="text-[11px] text-charcoal-500 font-mono">
            {vouchers.length} vouchers
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-charcoal-500">Loading vouchers...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-xs text-charcoal-500">No refund vouchers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Voucher #</th>
                  <th className="p-3.5">Student / Beneficiary</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Clearance Sign-offs</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Bursar Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                {vouchers.map((v) => {
                  const allCleared =
                    v.clearanceStatus.libraryCleared &&
                    v.clearanceStatus.hostelCleared &&
                    v.clearanceStatus.labCleared;

                  return (
                    <tr key={v.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-rose-primary dark:text-rose-light">
                        {v.voucherNo}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">{v.studentName}</span>
                        <span className="text-[10px] font-mono text-charcoal-500">{v.rollNo} • {v.program}</span>
                      </td>
                      <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400 font-semibold text-[11px]">
                        {v.type.replace("_", " ")}
                      </td>
                      <td className="p-3.5 text-right font-bold text-academic-success font-mono">
                        ${v.amount.toLocaleString()}.00
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              v.clearanceStatus.libraryCleared
                                ? "bg-academic-success-subtle text-academic-success"
                                : "bg-academic-warning-subtle text-academic-warning"
                            }`}
                          >
                            LIB {v.clearanceStatus.libraryCleared ? "✓" : "✗"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              v.clearanceStatus.hostelCleared
                                ? "bg-academic-success-subtle text-academic-success"
                                : "bg-academic-warning-subtle text-academic-warning"
                            }`}
                          >
                            HST {v.clearanceStatus.hostelCleared ? "✓" : "✗"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              v.clearanceStatus.labCleared
                                ? "bg-academic-success-subtle text-academic-success"
                                : "bg-academic-warning-subtle text-academic-warning"
                            }`}
                          >
                            LAB {v.clearanceStatus.labCleared ? "✓" : "✗"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === "DISBURSED"
                              ? "bg-academic-success-subtle text-academic-success"
                              : v.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status === "PENDING_APPROVAL" && (
                            <button
                              onClick={() => handleApprove(v.id)}
                              disabled={!allCleared}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-40"
                              title={!allCleared ? "Requires all departmental clearances" : "Approve for treasury payout"}
                            >
                              Approve
                            </button>
                          )}
                          {v.status === "APPROVED" && (
                            <button
                              onClick={() => handleDisburse(v.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-primary hover:bg-rose-dark text-white text-[11px] font-bold"
                            >
                              Disburse
                            </button>
                          )}
                          {v.status === "DISBURSED" && (
                            <span className="text-[10px] text-academic-success font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Disbursed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: New Refund Voucher */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Student Refund Voucher"
      >
        <form onSubmit={handleCreateRefund} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Scholar Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-medium"
                required
              />
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Roll Number</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g. CS2026-001"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Refund Category</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2"
              >
                <option value="CAUTION_MONEY">Institutional Caution Deposit</option>
                <option value="EXCESS_PAYMENT">Excess / Double Payment Reversal</option>
                <option value="WITHDRAWAL">Course Withdrawal / Cancellation</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Refund Amount ($ USD)</label>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-bold font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Bank Account #</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Recipient Account Number"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-mono"
                required
              />
            </div>
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">IFSC / SWIFT Code</label>
              <input
                type="text"
                value={ifscOrSwift}
                onChange={(e) => setIfscOrSwift(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">Justification</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm"
            >
              {isSubmitting ? "Generating..." : "Submit Refund Voucher"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
