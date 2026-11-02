"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  BarChart3,
  QrCode,
  Tag,
  ArrowRight,
  Check,
  X,
} from "lucide-react";

export default function StoreIndentView() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [indents, setIndents] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"catalog" | "indents" | "movements">("catalog");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Indent Modal State
  const [showIndentModal, setShowIndentModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ itemId: string; requestedQuantity: number }[]>([]);
  const [indentForm, setIndentForm] = useState({
    department: "Department of Computer Science & Engineering",
    indentorId: "fac-cse-101",
    indentorName: "Prof. Arvind Trivedi",
    indentorRole: "Professor & Lab Head",
    purpose: "Mid-Term Examination Answer Booklets & Lab Attendance Registers",
    examSessionCode: "MID-SEM-FALL-2026",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedIndentForDispatch, setSelectedIndentForDispatch] = useState<any>(null);
  const [dispatchData, setDispatchData] = useState<{
    [itemId: string]: {
      dispatchedQuantity: number;
      barcodeRangeStart: string;
      barcodeRangeEnd: string;
    };
  }>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/inventory/store");
      const json = await res.json();
      if (json.success) {
        setItems(json.items || []);
        setIndents(json.indents || []);
        setMovements(json.movements || []);
        setAnalytics(json.analytics || null);
      }
    } catch (err: any) {
      console.error("Failed to fetch store data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!showIndentModal && !showDispatchModal) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIndentModal(false);
        setShowDispatchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showIndentModal, showDispatchModal]);

  const handleOpenIndentModal = () => {
    if (items.length > 0) {
      setSelectedItems([{ itemId: items[0].id, requestedQuantity: 50 }]);
    }
    setShowIndentModal(true);
  };

  const handleAddItemToIndent = () => {
    if (items.length > 0) {
      setSelectedItems([...selectedItems, { itemId: items[0].id, requestedQuantity: 20 }]);
    }
  };

  const handleRemoveItemFromIndent = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const submitIndent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/inventory/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_INDENT",
          ...indentForm,
          items: selectedItems,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: `Indent Requisition ${data.indent.indentNumber} logged successfully!` });
        setShowIndentModal(false);
        fetchData();
      } else {
        setStatusMessage({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveHOD = async (indentId: string) => {
    try {
      const res = await fetch("/api/inventory/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPROVE_HOD",
          indentId,
          approvedBy: "Prof. Arvind Trivedi (HOD)",
          remarks: "Requirement verified with class roll strength. Recommended for store release.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Indent endorsed by HOD successfully!" });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenDispatchModal = (indent: any) => {
    setSelectedIndentForDispatch(indent);
    const initialDispatches: any = {};
    indent.items.forEach((item: any) => {
      initialDispatches[item.itemId] = {
        dispatchedQuantity: item.requestedQuantity,
        barcodeRangeStart: item.itemCode.startsWith("BKLT") ? `BKLT-2026-${Math.floor(100000 + Math.random() * 900000)}` : "",
        barcodeRangeEnd: item.itemCode.startsWith("BKLT") ? `BKLT-2026-${Math.floor(200000 + Math.random() * 900000)}` : "",
      };
    });
    setDispatchData(initialDispatches);
    setShowDispatchModal(true);
  };

  const submitDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIndentForDispatch) return;
    try {
      const dispatches = selectedIndentForDispatch.items.map((i: any) => ({
        itemId: i.itemId,
        dispatchedQuantity: Number(dispatchData[i.itemId]?.dispatchedQuantity) || i.requestedQuantity,
        barcodeRangeStart: dispatchData[i.itemId]?.barcodeRangeStart,
        barcodeRangeEnd: dispatchData[i.itemId]?.barcodeRangeEnd,
      }));

      const res = await fetch("/api/inventory/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH_STORE",
          indentId: selectedIndentForDispatch.id,
          dispatchedBy: "Mr. B. K. Joshi (Chief Storekeeper)",
          dispatches,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Voucher ${data.indent.dispatchVoucher?.voucherNumber} issued with tamper-evident seal!`,
        });
        setShowDispatchModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAcknowledgeReceipt = async (indentId: string) => {
    try {
      const res = await fetch("/api/inventory/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECEIVE_INDENT",
          indentId,
          receivedBy: "Faculty Laboratory In-Charge",
          remarks: "Materials verified against barcode manifests and placed in department locker.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Physical delivery acknowledged & fulfilled!" });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Academic OS Native Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl glass-panel shadow-soft border border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                Central Store
              </span>
              <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Serialized Barcode Security
              </span>
            </div>
            <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100">Central Store &amp; Examination Stationery Desk</h2>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
              Automated requisitions for 32-page Examination Answer Booklets, supplementary sheets, continuous assessment ledgers, and lab consumables.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenIndentModal}
          className="btn-primary text-xs flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Raise Department Indent
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/60"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm">
            <span className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 block mb-1">Exam Booklets In Vault</span>
            <div className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 flex items-center justify-between">
              <span>{analytics.totalBookletsOnHand.toLocaleString()}</span>
              <FileText className="w-5 h-5 text-rose-primary dark:text-rose-400 opacity-60" />
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Barcoded 32p &amp; 8p sheets</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm">
            <span className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 block mb-1">Store Inventory Valuation</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>₹{analytics.totalInventoryValuation.toLocaleString()}</span>
              <DollarSign className="w-5 h-5 text-emerald-500 opacity-60" />
            </div>
            <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-1 block">{analytics.totalItemCategories} Catalog SKUs</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm">
            <span className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 block mb-1">Pending Indents</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>{analytics.pendingIndents}</span>
              <Clock className="w-5 h-5 text-amber-500 opacity-60" />
            </div>
            <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-1 block">HOD / Store review queue</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm">
            <span className="text-xs font-medium text-charcoal-500 dark:text-charcoal-400 block mb-1">Low Stock Alerts</span>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>{analytics.lowStockAlertsCount}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500 opacity-60" />
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block">Threshold breach</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 gap-6 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "catalog"
              ? "border-rose-primary text-rose-primary dark:text-rose-400"
              : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:text-charcoal-400 dark:hover:text-ivory-200"
          }`}
        >
          Store Inventory &amp; Stock Levels ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("indents")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "indents"
              ? "border-rose-primary text-rose-primary dark:text-rose-400"
              : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:text-charcoal-400 dark:hover:text-ivory-200"
          }`}
        >
          Department Indents &amp; Dispatch Vouchers ({indents.length})
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap shrink-0 ${
            activeTab === "movements"
              ? "border-rose-primary text-rose-primary dark:text-rose-400"
              : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:text-charcoal-400 dark:hover:text-ivory-200"
          }`}
        >
          Stock Audit Ledger ({movements.length})
        </button>
      </div>

      {/* Tab 1: Inventory Catalog */}
      {activeTab === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isLow = item.quantityOnHand <= item.reorderThreshold;
            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 hover:border-rose-300 dark:hover:border-rose-900/50 shadow-sm transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-primary dark:text-rose-300 font-mono font-bold border border-rose-200 dark:border-rose-800">
                      {item.code}
                    </span>
                    {item.securityControlled && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-semibold flex items-center gap-1">
                        <QrCode className="w-3 h-3" /> Encrypted
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">{item.name}</h3>
                  <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 leading-relaxed line-clamp-2">
                    {item.specifications}
                  </p>

                  <div className="pt-2 border-t border-border/60 dark:border-charcoal-800 space-y-1 text-xs">
                    <div className="flex justify-between text-charcoal-500 dark:text-charcoal-400">
                      <span>On-Hand:</span>
                      <span className={`font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-charcoal-900 dark:text-ivory-100"}`}>
                        {item.quantityOnHand.toLocaleString()} {item.unitOfMeasurement}
                      </span>
                    </div>
                    <div className="flex justify-between text-charcoal-400 dark:text-charcoal-500 text-[11px]">
                      <span>Reorder Buffer:</span>
                      <span>{item.reorderThreshold.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-charcoal-400 dark:text-charcoal-500 text-[11px]">
                      <span>Unit Value:</span>
                      <span className="text-charcoal-700 dark:text-ivory-300 font-medium">₹{item.unitCost}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isLow ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    }`}
                  >
                    {isLow ? "Low Stock Alert" : "Adequate Vault Buffer"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Indents */}
      {activeTab === "indents" && (
        <div className="space-y-3">
          {indents.map((indent) => (
            <div
              key={indent.id}
              className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-rose-primary dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                    {indent.indentNumber}
                  </span>
                  <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">{indent.department}</span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      indent.status === "FULFILLED"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : indent.status === "DISPATCHED"
                        ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                        : indent.status === "HOD_APPROVED"
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {indent.status}
                  </span>
                  {indent.examSessionCode && (
                    <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      {indent.examSessionCode}
                    </span>
                  )}
                </div>

                <p className="text-xs text-charcoal-700 dark:text-ivory-300">
                  <span className="text-charcoal-400">Purpose: </span>{indent.purpose}
                </p>

                <div className="flex items-center gap-4 text-xs text-charcoal-500 dark:text-charcoal-400 flex-wrap">
                  <span>Indentor: {indent.indentorName} ({indent.indentorRole})</span>
                  <span>Items: {indent.items.map((i: any) => `${i.requestedQuantity}x ${i.itemCode}`).join(", ")}</span>
                </div>

                {indent.dispatchVoucher && (
                  <div className="p-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800/50 border border-border dark:border-charcoal-700 text-[11px] text-charcoal-700 dark:text-ivory-300 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Voucher: {indent.dispatchVoucher.voucherNumber} (GP: {indent.dispatchVoucher.gatePassNumber})</span>
                      <span>Dispatched By: {indent.dispatchVoucher.dispatchedBy}</span>
                    </div>
                    {indent.items.some((i: any) => i.barcodeRangeStart) && (
                      <div className="text-purple-600 dark:text-purple-400">
                        Barcodes: {indent.items.filter((i: any) => i.barcodeRangeStart).map((i: any) => `${i.itemCode}: [${i.barcodeRangeStart} to ${i.barcodeRangeEnd}]`).join("; ")}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {indent.status === "SUBMITTED" && (
                  <button
                    onClick={() => handleApproveHOD(indent.id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    HOD Endorse
                  </button>
                )}
                {indent.status === "HOD_APPROVED" && (
                  <button
                    onClick={() => handleOpenDispatchModal(indent)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary hover:bg-rose-primary/90 text-white transition flex items-center gap-1 shadow-sm"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Dispatch from Store
                  </button>
                )}
                {indent.status === "DISPATCHED" && (
                  <button
                    onClick={() => handleAcknowledgeReceipt(indent.id)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Acknowledge Delivery
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Stock Movement Ledger */}
      {activeTab === "movements" && (
        <div className="p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border dark:border-charcoal-800 text-charcoal-500 dark:text-charcoal-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">SKU Code</th>
                <th className="pb-3">Transaction</th>
                <th className="pb-3 text-right">Quantity</th>
                <th className="pb-3 text-right">Balance After</th>
                <th className="pb-3">Reference Voucher</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-charcoal-800">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                  <td className="py-2.5 text-charcoal-500 dark:text-charcoal-400 font-mono text-[11px]">
                    {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 font-bold text-charcoal-900 dark:text-ivory-100 font-mono">{m.itemCode}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        m.transactionType === "INDENT_ISSUE"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {m.transactionType}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-bold text-charcoal-900 dark:text-ivory-100">
                    {m.transactionType === "INDENT_ISSUE" ? `-${m.quantity}` : `+${m.quantity}`}
                  </td>
                  <td className="py-2.5 text-right font-mono text-charcoal-800 dark:text-ivory-200 font-bold">
                    {m.balanceAfter.toLocaleString()}
                  </td>
                  <td className="py-2.5 font-mono text-rose-primary dark:text-rose-400 text-[11px]">{m.referenceDoc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Indent Modal */}
      {showIndentModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Raise Departmental Store Indent"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIndentModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-xl p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">Raise Departmental Store Indent</h3>
              <button
                onClick={() => setShowIndentModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitIndent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-charcoal-600 dark:text-charcoal-400 block mb-1 font-medium">Department</label>
                  <input
                    type="text"
                    value={indentForm.department}
                    onChange={(e) => setIndentForm({ ...indentForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-charcoal-600 dark:text-charcoal-400 block mb-1 font-medium">Indentor Name</label>
                  <input
                    type="text"
                    value={indentForm.indentorName}
                    onChange={(e) => setIndentForm({ ...indentForm, indentorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-charcoal-600 dark:text-charcoal-400 block mb-1 font-medium">Purpose / End-Use</label>
                  <input
                    type="text"
                    value={indentForm.purpose}
                    onChange={(e) => setIndentForm({ ...indentForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-charcoal-600 dark:text-charcoal-400 block mb-1 font-medium">Exam Session Code (Optional)</label>
                  <input
                    type="text"
                    value={indentForm.examSessionCode}
                    onChange={(e) => setIndentForm({ ...indentForm, examSessionCode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    placeholder="e.g. END-SEM-NOV-2026"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-border dark:border-charcoal-800">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal-700 dark:text-ivory-300">Requisition Items</span>
                  <button
                    type="button"
                    onClick={handleAddItemToIndent}
                    className="text-rose-primary dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                {selectedItems.map((sel, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={sel.itemId}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[idx].itemId = e.target.value;
                        setSelectedItems(updated);
                      }}
                      className="flex-1 px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.code} - {i.name} (On-Hand: {i.quantityOnHand})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={sel.requestedQuantity}
                      onChange={(e) => {
                        const updated = [...selectedItems];
                        updated[idx].requestedQuantity = Number(e.target.value);
                        setSelectedItems(updated);
                      }}
                      className="w-24 px-3 py-2 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 text-right focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromIndent(idx)}
                        className="p-2 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowIndentModal(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-primary/90 font-bold text-white transition disabled:opacity-50 shadow-md shadow-rose-950/20"
                >
                  {isSubmitting ? "Logging Indent..." : "Submit Requisition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && selectedIndentForDispatch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Store Dispatch Voucher & Barcode Range"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDispatchModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">Store Dispatch Voucher &amp; Barcode Range</h3>
                <p className="text-xs text-rose-primary dark:text-rose-400 font-medium">{selectedIndentForDispatch.indentNumber} • {selectedIndentForDispatch.department}</p>
              </div>
              <button
                onClick={() => setShowDispatchModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitDispatch} className="space-y-4 text-xs">
              {selectedIndentForDispatch.items.map((item: any) => (
                <div key={item.itemId} className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/50 border border-border dark:border-charcoal-700 space-y-2">
                  <div className="flex justify-between items-center font-semibold text-charcoal-900 dark:text-ivory-100">
                    <span>{item.itemName}</span>
                    <span className="text-rose-primary dark:text-rose-400 font-bold">Req: {item.requestedQuantity}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-charcoal-500 dark:text-charcoal-400 block text-[10px] font-medium">Dispatch Qty</label>
                      <input
                        type="number"
                        value={dispatchData[item.itemId]?.dispatchedQuantity ?? item.requestedQuantity}
                        onChange={(e) => {
                          setDispatchData({
                            ...dispatchData,
                            [item.itemId]: {
                              ...dispatchData[item.itemId],
                              dispatchedQuantity: Number(e.target.value),
                            },
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-charcoal-500 dark:text-charcoal-400 block text-[10px] font-medium">Barcode From</label>
                      <input
                        type="text"
                        placeholder="BKLT-2026-0001"
                        value={dispatchData[item.itemId]?.barcodeRangeStart || ""}
                        onChange={(e) => {
                          setDispatchData({
                            ...dispatchData,
                            [item.itemId]: {
                              ...dispatchData[item.itemId],
                              barcodeRangeStart: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-charcoal-500 dark:text-charcoal-400 block text-[10px] font-medium">Barcode To</label>
                      <input
                        type="text"
                        placeholder="BKLT-2026-1000"
                        value={dispatchData[item.itemId]?.barcodeRangeEnd || ""}
                        onChange={(e) => {
                          setDispatchData({
                            ...dispatchData,
                            [item.itemId]: {
                              ...dispatchData[item.itemId],
                              barcodeRangeEnd: e.target.value,
                            },
                          });
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-primary/90 font-bold text-white transition shadow-md shadow-rose-950/20"
                >
                  Confirm Dispatch &amp; Seal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
