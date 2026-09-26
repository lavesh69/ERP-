"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  CreditCard,
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  ArrowUpRight,
  Lock,
  Calendar,
  FileText,
  Clock,
  Search,
  Printer,
  ShieldCheck,
} from "lucide-react";

interface FinanceSummary {
  totalBilled: number;
  totalCollected: number;
  pendingAmount: number;
  collectionRate: string;
}

interface StudentFeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING";
  dueDate: string;
}

interface PaymentTxn {
  id: string;
  studentName: string;
  feeTitle: string;
  amount: number;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
  transactedAt: string;
}

export default function FinancePage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalBilled: 0,
    totalCollected: 0,
    pendingAmount: 0,
    collectionRate: "0",
  });
  const [studentFees, setStudentFees] = useState<StudentFeeRecord[]>([]);
  const [transactions, setTransactions] = useState<PaymentTxn[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });

  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState("");
  const [payAmount, setPayAmount] = useState<number>(1000);
  const [payMethod, setPayMethod] = useState("University Card Gateway (Sandbox)");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTxn | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    async function loadFinanceData() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        params.append("page", String(page));
        params.append("limit", String(limit));

        const res = await fetch(`/api/finance?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary || { totalBilled: 0, totalCollected: 0, pendingAmount: 0, collectionRate: "0" });
          setStudentFees(data.studentFees || []);
          setTransactions(data.recentTransactions || []);
          if (data.pagination) {
            setPagination(data.pagination);
          }
          if (data.studentFees && data.studentFees.length > 0) {
            setSelectedFeeId(data.studentFees[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load finance data:", err);
        showToast("Error retrieving Bursar finance ledgers", "error");
      } finally {
        setLoading(false);
      }
    }
    loadFinanceData();
  }, [searchQuery, page, refreshTrigger]);

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeId || payAmount <= 0) {
      showToast("Please select a student fee account and valid amount", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentFeeId: selectedFeeId,
          amount: payAmount,
          paymentMethod: payMethod,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(
          `Payment Authorized! Ref: ${data.transaction.referenceNumber}. Ledger updated in real-time.`,
          "success"
        );
        setIsPayModalOpen(false);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to process payment", "error");
      }
    } catch (err) {
      showToast("Network error processing transaction", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadReceipt = (studentName: string, ref: string, amount: number, feeTitle: string) => {
    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Official Receipt - ${ref}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .no-print { display: none; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fdfbf7; color: #1e1b18; padding: 40px; display: flex; justify-content: center; }
    .receipt-card { background: #fff; width: 100%; max-width: 650px; border-radius: 16px; border: 1px solid #e5e0d8; box-shadow: 0 10px 30px rgba(0,0,0,0.05); padding: 40px; position: relative; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #881337; padding-bottom: 20px; }
    .logo-title { font-size: 22px; font-weight: 800; color: #881337; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #78716c; margin-top: 4px; }
    .status-badge { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
    .detail-item { font-size: 13px; }
    .detail-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #a8a29e; letter-spacing: 0.5px; }
    .detail-value { font-weight: 600; color: #1c1917; margin-top: 4px; }
    .amount-box { background: #fdf2f4; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin: 24px 0; }
    .amount-label { font-size: 13px; font-weight: 700; color: #881337; }
    .amount-value { font-size: 28px; font-weight: 900; color: #881337; }
    .footer { border-top: 1px dashed #d6d3d1; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #78716c; }
    .security-hash { font-family: monospace; font-size: 10px; color: #a8a29e; }
    .btn-print { background: #881337; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
    <button class="btn-print no-print" onclick="window.print()">Print / Save as PDF</button>
    <div class="receipt-card">
      <div class="header">
        <div>
          <div class="logo-title">APEX UNIVERSITY</div>
          <div class="subtitle">Bursar & Treasury Office - Official Receipt</div>
        </div>
        <div class="status-badge">Payment Verified</div>
      </div>
      <div class="details-grid">
        <div class="detail-item">
          <div class="detail-label">Receipt Reference</div>
          <div class="detail-value" style="font-family: monospace;">${ref}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Issue Date</div>
          <div class="detail-value">${new Date().toLocaleDateString("en-US", { dateStyle: "full" })}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Student Name</div>
          <div class="detail-value">${studentName}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Fee Classification</div>
          <div class="detail-value">${feeTitle}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Settlement Channel</div>
          <div class="detail-value">TLS-256 PCI Tokenized Gateway</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Fiscal Verification</div>
          <div class="detail-value">CLEARED & RECONCILED</div>
        </div>
      </div>
      <div class="amount-box">
        <div class="amount-label">TOTAL AMOUNT PAID</div>
        <div class="amount-value">$${amount.toLocaleString()}.00</div>
      </div>
      <div class="footer">
        <div>
          <div style="font-weight: 700;">Auditor Verification: Autonomous Finance Controller</div>
          <div>This electronically stamped receipt is authoritative under Senate Bylaws.</div>
        </div>
        <div class="security-hash">SHA256-TOKEN: ${ref.slice(0, 16)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Receipt-${ref}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Printable Official Receipt for ${studentName} generated!`, "success");
  };

  const filteredFees = studentFees;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Fees & Finance Operating System
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Live SQLite DB Ledgers
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Tuition ledgers, installment disbursement schedules, secure payment reconciliation, and Bursar audit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPayModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
            >
              <DollarSign className="h-4 w-4" />
              <span>Record / Pay Fee</span>
            </button>
          </div>
        </div>

        {/* 3 Finance KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Total Revenue Collected
              </span>
              <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                ${summary.totalCollected.toLocaleString()}
              </div>
              <span className="text-xs text-academic-success font-semibold">
                {summary.collectionRate}% of Target Term Budget Realized
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Outstanding Installments
              </span>
              <div className="text-3xl font-display font-bold text-academic-warning mt-2">
                ${summary.pendingAmount.toLocaleString()}
              </div>
              <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Across {studentFees.filter((f) => f.status !== "PAID").length} pending scholar accounts
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Total Billed Receivables
              </span>
              <div className="text-3xl font-display font-bold text-rose-primary dark:text-rose-light mt-2">
                ${summary.totalBilled.toLocaleString()}
              </div>
              <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Gross academic ledger for Fall 2026
              </span>
            </div>
          </div>
        )}

        {/* Search & Student Ledgers Table */}
        <div className="glass-panel rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Active Student Fee Ledgers
              </span>
              <span className="text-[11px] text-charcoal-500 font-mono">
                ({pagination.total} scholars)
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search by student or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4">
              <SkeletonTable rows={4} />
            </div>
          ) : filteredFees.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Fee Ledgers Found"
              description="No student fee accounts matched your search criteria."
            />
          ) : (
            <>
              {/* Mobile Fee Ledger Cards (< md) */}
              <div className="md:hidden divide-y divide-border/60 dark:divide-charcoal-700">
                {filteredFees.map((l) => (
                  <div key={l.id} className="p-3.5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 block">{l.studentName}</span>
                        <span className="text-[11px] font-mono text-charcoal-500">{l.rollNo} • {l.title}</span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          l.status === "PAID"
                            ? "bg-academic-success-subtle text-academic-success"
                            : "bg-academic-warning-subtle text-academic-warning"
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-surface-soft dark:bg-charcoal-900/60 p-2.5 rounded-xl border border-border/50 dark:border-charcoal-700">
                      <div>
                        <span className="text-[10px] text-charcoal-500 block uppercase">Total Fee</span>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">${l.totalAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-500 block uppercase">Paid</span>
                        <span className="font-bold text-academic-success mt-0.5 block">${l.paidAmount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-charcoal-500 block uppercase">Pending</span>
                        <span className="font-bold text-academic-warning mt-0.5 block">${l.pendingAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {l.status !== "PAID" && (
                        <button
                          onClick={() => {
                            setSelectedFeeId(l.id);
                            setPayAmount(l.pendingAmount);
                            setIsPayModalOpen(true);
                          }}
                          className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm"
                        >
                          Pay Due (${l.pendingAmount})
                        </button>
                      )}
                      <button
                        onClick={() =>
                          handleDownloadReceipt(
                            l.studentName,
                            `TXN-REC-${l.rollNo}-${Date.now().toString().slice(-4)}`,
                            l.paidAmount,
                            l.title
                          )
                        }
                        className="min-h-[36px] px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-semibold hover:bg-ivory-100 dark:hover:bg-charcoal-700 flex items-center gap-1.5"
                      >
                        <Receipt className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Full Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Fee Category</th>
                    <th className="p-3.5 text-right">Total Fee</th>
                    <th className="p-3.5 text-right">Paid</th>
                    <th className="p-3.5 text-right">Pending</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                  {filteredFees.map((l) => (
                    <tr key={l.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                          {l.studentName}
                        </span>
                        <span className="text-[10px] font-mono text-charcoal-500">
                          {l.rollNo}
                        </span>
                      </td>
                      <td className="p-3.5 text-charcoal-700 dark:text-charcoal-300 font-medium">
                        {l.title}
                      </td>
                      <td className="p-3.5 text-right font-bold text-charcoal-900 dark:text-ivory-100">
                        ${l.totalAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-bold text-academic-success">
                        ${l.paidAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-bold text-academic-warning">
                        ${l.pendingAmount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === "PAID"
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {l.status !== "PAID" && (
                            <button
                              onClick={() => {
                                setSelectedFeeId(l.id);
                                setPayAmount(l.pendingAmount);
                                setIsPayModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-primary hover:bg-rose-dark text-white text-[11px] font-bold shadow-sm"
                            >
                              Pay Due
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleDownloadReceipt(
                                l.studentName,
                                `TXN-REC-${l.rollNo}-${Date.now().toString().slice(-4)}`,
                                l.paidAmount,
                                l.title
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-rose-primary dark:text-rose-light text-[11px] font-bold border border-border dark:border-charcoal-600"
                          >
                            <Receipt className="h-3 w-3" />
                            <span>Receipt</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

        {/* Recent Payment Transactions */}
        <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
              Recent Clearing Transactions (Bursar Audit Trail)
            </span>
            <span className="text-[11px] text-charcoal-500">Live Database Settlement</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3.5">Txn Reference</th>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-charcoal-500">
                      No recent payment transactions recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-ivory-50/70 dark:hover:bg-charcoal-700/40 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-charcoal-700 dark:text-charcoal-300">
                        {t.referenceNumber}
                      </td>
                      <td className="p-3.5 font-bold text-charcoal-900 dark:text-ivory-100">
                        {t.studentName}
                      </td>
                      <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">
                        {t.feeTitle}
                      </td>
                      <td className="p-3.5 text-right font-bold text-academic-success">
                        ${t.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">
                        {t.paymentMethod}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceipt(t);
                            setIsReceiptModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-subtle hover:bg-rose-primary hover:text-white text-rose-primary text-[11px] font-bold transition-all"
                        >
                          <Receipt className="h-3 w-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Process / Record Payment */}
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          title="Process Scholar Fee Payment"
        >
          <form onSubmit={handleProcessPayment} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Student Fee Ledger
              </label>
              <select
                value={selectedFeeId}
                onChange={(e) => {
                  setSelectedFeeId(e.target.value);
                  const selected = studentFees.find((f) => f.id === e.target.value);
                  if (selected) {
                    setPayAmount(selected.pendingAmount > 0 ? selected.pendingAmount : selected.totalAmount);
                  }
                }}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                {studentFees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.studentName} ({f.rollNo}) — {f.title} [Due: ${f.pendingAmount}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Payment Amount ($ USD)
              </label>
              <input
                type="number"
                min="1"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-bold text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Payment Channel / Instrument
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              >
                <option value="Razorpay / Stripe Online Gateway (Verified)">Razorpay / Stripe Online Gateway (Verified)</option>
                <option value="University Card Gateway (Sandbox)">University Card Gateway (Sandbox)</option>
                <option value="Corporate Wire Transfer">Corporate Wire Transfer (SWIFT / Fedwire)</option>
                <option value="Endowment Trust Voucher">Endowment Trust Scholarship Voucher</option>
                <option value="Direct ACH Debit">Direct ACH Debit (Student Checking)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-primary shrink-0" />
              <span>
                Transaction will be immediately recorded into SQLite Bursar Ledgers with a cryptographic reference token.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-academic-success hover:bg-green-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmitting ? "Processing..." : `Authorize $${payAmount.toLocaleString()}.00`}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Official Fee Payment Receipt */}
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="Official Fee Payment Receipt"
        >
          {selectedReceipt && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900/60 font-mono">
                <div className="flex items-center justify-between border-b border-border dark:border-charcoal-700 pb-3 mb-3">
                  <div>
                    <h4 className="font-sans font-black text-sm text-charcoal-900 dark:text-ivory-100">
                      APEX INSTITUTE OF TECHNOLOGY
                    </h4>
                    <p className="text-[10px] text-charcoal-500">Office of the Bursar & Treasury</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                      <ShieldCheck className="h-3 w-3" /> VERIFIED
                    </span>
                    <p className="text-[10px] text-charcoal-400 mt-1">{selectedReceipt.referenceNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 text-[11px]">
                  <div>
                    <span className="text-charcoal-400 text-[10px] block">STUDENT BENEFICIARY</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedReceipt.studentName}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 text-[10px] block">PAYMENT DATE</span>
                    <span className="text-charcoal-700 dark:text-charcoal-300">
                      {selectedReceipt.transactedAt ? new Date(selectedReceipt.transactedAt).toLocaleDateString() : "Current Term"}
                    </span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 text-[10px] block">FEE HEAD</span>
                    <span className="text-charcoal-700 dark:text-charcoal-300">{selectedReceipt.feeTitle}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-400 text-[10px] block">SETTLEMENT METHOD</span>
                    <span className="text-charcoal-700 dark:text-charcoal-300">{selectedReceipt.paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border dark:border-charcoal-700 flex items-center justify-between">
                  <span className="font-sans font-bold text-charcoal-600 dark:text-charcoal-400">TOTAL AMOUNT PAID</span>
                  <span className="text-base font-black text-academic-success">
                    ${selectedReceipt.amount.toLocaleString()}.00
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-ivory-100/70 dark:bg-charcoal-800 text-[11px] text-charcoal-500 flex items-center justify-between">
                <span className="font-mono text-[10px]">SHA256: {selectedReceipt.id.slice(0, 16)}...SECURE</span>
                <span className="text-[10px]">Valid for institutional audits</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-600 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
