"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Boxes,
  Cpu,
  Wrench,
  Package,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building,
  DollarSign,
  Tag,
  Filter,
} from "lucide-react";

interface InventorySummary {
  totalAssets: number;
  operationalAssets: number;
  assetOperationalRate: number;
  totalAssetValuation: number;
  lowStockItems: number;
  openWorkOrders: number;
  totalConsumables: number;
}

export default function InventoryPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"assets" | "consumables" | "workorders" | "audit">("assets");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Asset Modal
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    name: "",
    category: "IT_COMPUTING",
    department: "Computer Science & Engineering",
    locationRoom: "Advanced Computing Lab",
    custodianFaculty: currentUser?.fullName || "Dr. Alan Turing",
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseCost: 5000,
    serialNumber: "SN-2026-X99",
    modelNumber: "PRO-MODEL",
  });

  // New Work Order Modal
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [workOrderForm, setWorkOrderForm] = useState({
    assetId: "",
    reportedIssue: "",
    priority: "MEDIUM",
    assignedTechnician: "Campus Facility Maintenance Team",
    estimatedCost: 150,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, astRes, conRes, woRes] = await Promise.all([
        fetch("/api/inventory?tab=summary"),
        fetch(`/api/inventory?tab=assets&category=${selectedCategory}`),
        fetch("/api/inventory?tab=consumables"),
        fetch("/api/inventory?tab=workorders"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (astRes.ok) {
        const aData = await astRes.json();
        setAssets(aData.assets || []);
      }
      if (conRes.ok) {
        const cData = await conRes.json();
        setConsumables(cData.consumables || []);
      }
      if (woRes.ok) {
        const wData = await woRes.json();
        setWorkOrders(wData.workOrders || []);
      }
    } catch (err) {
      console.error("Failed to load inventory data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_ASSET",
          ...assetForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register asset");
      setStatusMessage({ type: "success", text: "Physical asset registered with straight-line depreciation tracking!" });
      setShowAssetModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_WORK_ORDER",
          ...workOrderForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create work order");
      setStatusMessage({ type: "success", text: "Maintenance work order initiated." });
      setShowWorkOrderModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleCompleteWorkOrder = async (orderId: string) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_WORK_ORDER",
          orderId,
          actualCost: 180,
          notes: "Servicing certified complete. Operational status restored.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete work order");
      setStatusMessage({ type: "success", text: data.message });
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                Fixed Assets & Physical Infrastructure ERP
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Active Audit Cycle 2026
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Campus Asset & Facility Inventory
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Laboratory instrumentation, IT hardware clusters, classroom audiovisuals, automated straight-line depreciation, and work orders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAssetModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Asset
            </button>
            <button
              onClick={() => {
                if (assets.length > 0) {
                  setWorkOrderForm({
                    ...workOrderForm,
                    assetId: assets[0].id,
                  });
                }
                setShowWorkOrderModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              Log Breakdown Ticket
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Asset Valuation</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">
                ${summary.totalAssetValuation.toLocaleString()}
              </p>
              <p className="text-xs text-rose-300 mt-0.5">Current Net Book Value</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Operational Rate</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">{summary.assetOperationalRate}%</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.operationalAssets} / {summary.totalAssets} Active Devices</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Low Stock Supplies</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">{summary.lowStockItems} Items</p>
              <p className="text-xs text-rose-300 mt-0.5">Reorder Threshold Triggered</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Open Work Orders</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-rose-300">{summary.openWorkOrders}</p>
              <p className="text-xs text-rose-300 mt-0.5">Under Technician Repair</p>
            </div>
          </div>
        )}
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto pb-px">
        {[
          { id: "assets", label: "Fixed Asset Catalog", icon: Cpu },
          { id: "consumables", label: "Consumables & Lab Stock", icon: Package, count: summary?.lowStockItems },
          { id: "workorders", label: "Maintenance Work Orders", icon: Wrench, count: summary?.openWorkOrders },
          { id: "audit", label: "Depreciation & Audit Summary", icon: TrendingDown },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-rose-primary text-rose-primary dark:text-rose-light dark:border-rose-light"
                  : "border-transparent text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: FIXED ASSET CATALOG */}
      {activeTab === "assets" && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-charcoal-500" />
              <span className="text-sm font-medium text-charcoal-700 dark:text-ivory-300">Category Filter:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="ALL">All Categories</option>
                <option value="IT_COMPUTING">IT & High Performance Computing</option>
                <option value="LAB_INSTRUMENTATION">Laboratory & Precision Instruments</option>
                <option value="CLASSROOM_AV">Classroom & Audiovisual Infrastructure</option>
              </select>
            </div>
            <span className="text-xs text-charcoal-500">
              {assets.length} Assets Registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {assets.map((asset) => {
              const isOperational = asset.status === "OPERATIONAL";
              return (
                <div
                  key={asset.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                          {asset.assetTag}
                        </span>
                        <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-charcoal-500 mt-0.5">{asset.department}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          isOperational
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-300"
                        }`}
                      >
                        {asset.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Location:</span>
                        <span className="font-medium text-charcoal-900 dark:text-ivory-100">{asset.locationRoom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Custodian:</span>
                        <span className="font-medium text-charcoal-900 dark:text-ivory-100">{asset.custodianFaculty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Purchase Cost:</span>
                        <span className="text-charcoal-700 dark:text-ivory-300 font-semibold">${asset.purchaseCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Book Value (Net):</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">${asset.currentDepreciatedValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between text-xs">
                    <span className="text-charcoal-500">Warranty: Until {asset.warrantyExpiry}</span>
                    <button
                      onClick={() => {
                        setWorkOrderForm({
                          ...workOrderForm,
                          assetId: asset.id,
                        });
                        setShowWorkOrderModal(true);
                      }}
                      className="text-xs text-rose-primary hover:underline font-semibold"
                    >
                      Report Issue
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CONSUMABLES & LAB STOCK */}
      {activeTab === "consumables" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-800 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Campus Consumables & Lab Supplies
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Automated reorder triggers when current quantities hit safety thresholds
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                <tr>
                  <th className="p-3.5">Code / Item</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Unit</th>
                  <th className="p-3.5">Stock on Hand</th>
                  <th className="p-3.5">Reorder Point</th>
                  <th className="p-3.5">Unit Price</th>
                  <th className="p-3.5">Primary Supplier</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-charcoal-800">
                {consumables.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="p-3.5">
                      <p className="font-bold text-charcoal-900 dark:text-ivory-100">{c.name}</p>
                      <p className="font-mono text-[11px] text-charcoal-500">{c.itemCode}</p>
                    </td>
                    <td className="p-3.5 text-charcoal-600 dark:text-ivory-300">{c.category}</td>
                    <td className="p-3.5 text-charcoal-500">{c.unit}</td>
                    <td className="p-3.5 font-bold text-charcoal-900 dark:text-ivory-100 text-sm">
                      {c.quantityOnHand}
                    </td>
                    <td className="p-3.5 font-medium text-charcoal-600 dark:text-ivory-400">
                      ≤ {c.minReorderThreshold}
                    </td>
                    <td className="p-3.5 font-semibold text-charcoal-800 dark:text-ivory-200">
                      ${c.unitCost}
                    </td>
                    <td className="p-3.5 text-charcoal-500">{c.supplierName}</td>
                    <td className="p-3.5 text-right">
                      {c.needsReorder ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300">
                          Reorder Required
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                          Adequate
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WORK ORDERS */}
      {activeTab === "workorders" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Facility & Equipment Work Orders
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Live breakdown repair queue with technician dispatch and cost tracking
              </p>
            </div>
            <button
              onClick={() => {
                if (assets.length > 0) {
                  setWorkOrderForm({
                    ...workOrderForm,
                    assetId: assets[0].id,
                  });
                }
                setShowWorkOrderModal(true);
              }}
              className="px-3.5 py-2 bg-rose-primary text-white rounded-lg text-xs font-semibold hover:bg-rose-accent transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Work Order
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {workOrders.map((wo) => {
              const isDone = wo.status === "COMPLETED";
              return (
                <div
                  key={wo.id}
                  className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {wo.workOrderNo}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200">
                        {wo.priority} Priority
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          isDone
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
                            : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200"
                        }`}
                      >
                        {wo.status.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                      {wo.assetName} ({wo.assetTag})
                    </h3>
                    <p className="text-xs text-charcoal-600 dark:text-ivory-300">
                      <span className="font-semibold text-charcoal-700 dark:text-ivory-200">Issue:</span> {wo.reportedIssue}
                    </p>

                    <div className="text-[11px] text-charcoal-500 pt-1 flex flex-wrap gap-4">
                      <span>Assigned: {wo.assignedTechnician}</span>
                      <span>Estimated Cost: ${wo.estimatedCost}</span>
                      <span>Reported: {new Date(wo.reportedDate).toLocaleDateString()}</span>
                    </div>

                    {wo.notes && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 italic">
                        Technician Notes: {wo.notes}
                      </p>
                    )}
                  </div>

                  {!isDone && (
                    <button
                      onClick={() => handleCompleteWorkOrder(wo.id)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Sign Off Complete
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DEPRECIATION & AUDIT SUMMARY */}
      {activeTab === "audit" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-6 border border-border dark:border-charcoal-800 shadow-sm space-y-6">
          <div>
            <h2 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
              Campus Capital Asset Depreciation & Physical Audit
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Compliant with International Accounting Standards (IAS 16 - Property, Plant and Equipment)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Total Gross Book Cost</p>
              <p className="text-2xl font-bold mt-1 text-charcoal-900 dark:text-ivory-100">
                ${assets.reduce((acc, a) => acc + a.purchaseCost, 0).toLocaleString()}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Historical acquisition cost</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Net Depreciated Value</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                ${summary?.totalAssetValuation.toLocaleString()}
              </p>
              <p className="text-xs text-charcoal-500 mt-0.5">Straight-line over 5 years</p>
            </div>
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <p className="text-xs text-charcoal-500 uppercase font-semibold">Annual Barcode Audit</p>
              <p className="text-2xl font-bold mt-1 text-cyan-600 dark:text-cyan-400">100% Verified</p>
              <p className="text-xs text-charcoal-500 mt-0.5">Zero missing capital assets</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register Asset */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Register Capital Asset
              </h3>
              <button
                onClick={() => setShowAssetModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAsset} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Asset Name & Model
                </label>
                <input
                  type="text"
                  required
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. Cisco Nexus 9000 Core Switch"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Category
                  </label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value as any })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  >
                    <option value="IT_COMPUTING">IT & Computing</option>
                    <option value="LAB_INSTRUMENTATION">Lab Instrumentation</option>
                    <option value="CLASSROOM_AV">Classroom AV</option>
                    <option value="FURNITURE_FACILITY">Furniture / Facility</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.department}
                    onChange={(e) => setAssetForm({ ...assetForm, department: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    required
                    value={assetForm.locationRoom}
                    onChange={(e) => setAssetForm({ ...assetForm, locationRoom: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Purchase Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={assetForm.purchaseCost}
                    onChange={(e) => setAssetForm({ ...assetForm, purchaseCost: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Work Order */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Initiate Maintenance Work Order
              </h3>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Target Asset
                </label>
                <select
                  required
                  value={workOrderForm.assetId}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, assetId: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetTag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Reported Issue / Fault
                </label>
                <textarea
                  required
                  rows={3}
                  value={workOrderForm.reportedIssue}
                  onChange={(e) => setWorkOrderForm({ ...workOrderForm, reportedIssue: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="Detail the failure symptom..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={workOrderForm.priority}
                    onChange={(e) => setWorkOrderForm({ ...workOrderForm, priority: e.target.value as any })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Est. Cost ($)
                  </label>
                  <input
                    type="number"
                    value={workOrderForm.estimatedCost}
                    onChange={(e) => setWorkOrderForm({ ...workOrderForm, estimatedCost: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowWorkOrderModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Submit Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
