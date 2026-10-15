"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Zap,
  Droplet,
  Flame,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  User,
  ShieldCheck,
  Star,
  Activity,
  Calendar,
  Check,
  Search,
  Filter,
} from "lucide-react";

export default function EstateWorksView() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"orders" | "assets" | "preventive">("orders");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Work Order Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    discipline: "ELECTRICAL",
    priority: "HIGH_PRIORITY",
    location: "Lecture Hall Complex - Auditorium A",
    issueTitle: "Stage Interactive Audio-Visual Panel & Projector Tripping",
    issueDescription: "Main projection screen powers off after 10 minutes of display; possible thermal overload.",
    requesterId: "staff-audi-01",
    requesterName: "Dr. Sandeep Deshmukh",
    requesterDepartment: "Department of Performing Arts & Cultural Committee",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Engineer Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({
    engineerName: "Er. Pradeep Nair (JE Electrical)",
    engineerRole: "Junior Engineer (Electrical & Automation)",
    estimatedMaterialCost: 2500,
  });

  // Completion Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOrderForComplete, setSelectedOrderForComplete] = useState<any>(null);
  const [completeForm, setCompleteForm] = useState({
    actualCost: 2200,
    engineerNotes: "Replaced faulty cooling fan assembly and re-terminated power feed.",
  });

  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<any>(null);
  const [ratingForm, setRatingForm] = useState({
    ratingStars: 5,
    satisfactionFeedback: "Repaired expeditiously with minimal lecture downtime.",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/estate/workorders");
      const json = await res.json();
      if (json.success) {
        setAssets(json.assets || []);
        setWorkOrders(json.workOrders || []);
        setAnalytics(json.analytics || null);
      }
    } catch (err: any) {
      console.error("Failed to fetch estate data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowOrderModal(false);
        setShowAssignModal(false);
        setShowCompleteModal(false);
        setShowRatingModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/estate/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RAISE_WORK_ORDER",
          ...orderForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Work order ${data.workOrder.workOrderNumber} registered with ${data.workOrder.slaHours}h SLA timer!`,
        });
        setShowOrderModal(false);
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

  const submitAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAssign) return;
    try {
      const res = await fetch("/api/estate/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_ENGINEER",
          workOrderId: selectedOrderForAssign.id,
          ...assignForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Junior Engineer assigned successfully!" });
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleStartWork = async (orderId: string) => {
    try {
      const res = await fetch("/api/estate/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "START_WORK",
          workOrderId: orderId,
          materialsBOQ: [
            { materialName: "Circuit Breaker & Relays", quantity: 1, cost: 1200 },
            { materialName: "Wiring & Terminals", quantity: 1, cost: 500 },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Work commenced and materials BOQ logged!" });
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const submitComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForComplete) return;
    try {
      const res = await fetch("/api/estate/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "COMPLETE_WORK",
          workOrderId: selectedOrderForComplete.id,
          ...completeForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Work certified! Certificate: ${data.workOrder.completionDetails?.completionCertificateNumber}`,
        });
        setShowCompleteModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForRating) return;
    try {
      const res = await fetch("/api/estate/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CLOSE_ORDER",
          workOrderId: selectedOrderForRating.id,
          ...ratingForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: "success", text: "Work order closed with customer satisfaction sign-off!" });
        setShowRatingModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const getDisciplineIcon = (disc: string) => {
    switch (disc) {
      case "ELECTRICAL":
        return <Zap className="w-4 h-4 text-amber-400" />;
      case "HVAC":
        return <Activity className="w-4 h-4 text-cyan-400" />;
      case "PLUMBING_WATER":
        return <Droplet className="w-4 h-4 text-blue-400" />;
      case "FIRE_SAFETY":
        return <Flame className="w-4 h-4 text-rose-400" />;
      default:
        return <Building2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/50 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wrench className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Estate Office & Infrastructure Engineering Works
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
              CPWD Maintenance SLA
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Lifecycle engineering maintenance for 11kV Substation, 500kVA Genset, 100kLD STP, Central HVAC Chillers, Civil & Plumbing.
          </p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg shadow-emerald-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Raise Maintenance Work Order
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            statusMessage.type === "success"
              ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
              : "bg-rose-950/40 text-rose-300 border-rose-800/60"
          }`}
        >
          <div className="flex items-center gap-3 text-sm font-medium">
            {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
        </div>
      )}

      {/* KPI Ribbon */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Campus Assets Reliability</span>
            <div className="text-2xl font-bold text-emerald-400 flex items-center justify-between">
              <span>{analytics.assetReliabilityRate}%</span>
              <Activity className="w-5 h-5 text-emerald-500 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {analytics.operationalAssets} / {analytics.totalAssets} Utilities Active
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Pending Work Orders</span>
            <div className="text-2xl font-bold text-amber-400 flex items-center justify-between">
              <span>{analytics.pendingWorkOrders}</span>
              <Clock className="w-5 h-5 text-amber-500 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Under JE resolution</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Critical Emergencies</span>
            <div className="text-2xl font-bold text-rose-400 flex items-center justify-between">
              <span>{analytics.criticalOrdersCount}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500 opacity-60" />
            </div>
            <span className="text-[11px] text-rose-400 mt-1 block">2-Hour SLA Target</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Requester Satisfaction</span>
            <div className="text-2xl font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                {analytics.averageSatisfactionRating}
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              </span>
              <ShieldCheck className="w-5 h-5 text-indigo-400 opacity-60" />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Verified post-repair ratings</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "orders"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Engineering Work Orders ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "assets"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Campus Heavy Assets & Plants ({assets.length})
        </button>
      </div>

      {/* Tab 1: Work Orders */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {workOrders.map((wo) => {
            const isEmergency = wo.priority === "CRITICAL_EMERGENCY";
            return (
              <div
                key={wo.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                      {wo.workOrderNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-200 bg-slate-800 px-2.5 py-0.5 rounded">
                      {getDisciplineIcon(wo.discipline)}
                      {wo.discipline}
                    </span>
                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                        isEmergency
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {wo.priority} ({wo.slaHours}h SLA)
                    </span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                        wo.status === "CLOSED"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : wo.status === "COMPLETED"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : wo.status === "IN_PROGRESS"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{wo.issueTitle}</h4>
                  <p className="text-xs text-slate-300">{wo.issueDescription}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span>Location: <span className="text-slate-200 font-medium">{wo.location}</span></span>
                    <span>Requester: {wo.requesterName} ({wo.requesterDepartment})</span>
                    {wo.assignedEngineer && (
                      <span className="text-indigo-300">
                        Assigned: {wo.assignedEngineer.engineerName}
                      </span>
                    )}
                  </div>

                  {wo.completionDetails && (
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[11px] text-emerald-300 space-y-1 font-mono">
                      <div>Cert: {wo.completionDetails.completionCertificateNumber} · Cost: ₹{wo.completionDetails.actualCost}</div>
                      <div>Seal: {wo.completionDetails.cryptographicSeal.slice(0, 24)}... (Verified)</div>
                    </div>
                  )}

                  {wo.userClosureRating && (
                    <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-900/40">
                      <span className="flex">
                        {Array.from({ length: wo.userClosureRating.ratingStars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </span>
                      <span>"{wo.userClosureRating.satisfactionFeedback}"</span>
                    </div>
                  )}
                </div>

                {/* Lifecycle Controls */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {wo.status === "LOGGED" && (
                    <button
                      onClick={() => {
                        setSelectedOrderForAssign(wo);
                        setShowAssignModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1"
                    >
                      <User className="w-3.5 h-3.5" />
                      Assign JE
                    </button>
                  )}

                  {wo.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStartWork(wo.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Start Work & BOQ
                    </button>
                  )}

                  {wo.status === "IN_PROGRESS" && (
                    <button
                      onClick={() => {
                        setSelectedOrderForComplete(wo);
                        setShowCompleteModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Certify Completion
                    </button>
                  )}

                  {wo.status === "COMPLETED" && (
                    <button
                      onClick={() => {
                        setSelectedOrderForRating(wo);
                        setShowRatingModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Rate & Close Order
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Assets */}
      {activeTab === "assets" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {asset.assetCode}
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      asset.status === "OPERATIONAL"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{asset.name}</h3>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    {getDisciplineIcon(asset.discipline)} {asset.discipline}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {asset.specifications}
                </p>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Location: <span className="text-slate-200">{asset.location}</span></div>
                  <div>Installed: <span className="text-slate-200">{asset.installedYear}</span></div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Last Serviced: {asset.lastServicedDate}</span>
                <span className="text-emerald-400 font-medium">Due: {asset.nextPreventiveServiceDue}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Raise Work Order */}
      {showOrderModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOrderModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Raise Maintenance Work Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Discipline</label>
                  <select
                    value={orderForm.discipline}
                    onChange={(e) => setOrderForm({ ...orderForm, discipline: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="ELECTRICAL">Electrical & Power</option>
                    <option value="HVAC">HVAC & Air Conditioning</option>
                    <option value="CIVIL">Civil & Carpentry</option>
                    <option value="PLUMBING_WATER">Plumbing & Water Supply</option>
                    <option value="FIRE_SAFETY">Fire Safety & Alarms</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">SLA Priority Tier</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="CRITICAL_EMERGENCY">Emergency (2-Hour SLA)</option>
                    <option value="HIGH_PRIORITY">High Priority (6-Hour SLA)</option>
                    <option value="MEDIUM_PRIORITY">Medium (24-Hour SLA)</option>
                    <option value="ROUTINE_PLANNED">Routine Planned (72-Hour SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Precise Campus Location</label>
                <input
                  type="text"
                  value={orderForm.location}
                  onChange={(e) => setOrderForm({ ...orderForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Issue Title</label>
                <input
                  type="text"
                  value={orderForm.issueTitle}
                  onChange={(e) => setOrderForm({ ...orderForm, issueTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Problem Description</label>
                <textarea
                  rows={3}
                  value={orderForm.issueDescription}
                  onChange={(e) => setOrderForm({ ...orderForm, issueDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Dispatch Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Engineer */}
      {showAssignModal && selectedOrderForAssign && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAssignModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Assign Junior Engineer (JE)</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitAssign} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Junior Engineer Name</label>
                <input
                  type="text"
                  value={assignForm.engineerName}
                  onChange={(e) => setAssignForm({ ...assignForm, engineerName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Designation & Discipline</label>
                <input
                  type="text"
                  value={assignForm.engineerRole}
                  onChange={(e) => setAssignForm({ ...assignForm, engineerRole: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Estimated Materials Cost (₹)</label>
                <input
                  type="number"
                  value={assignForm.estimatedMaterialCost}
                  onChange={(e) => setAssignForm({ ...assignForm, estimatedMaterialCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Certify Completion */}
      {showCompleteModal && selectedOrderForComplete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCompleteModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Certify Work Completion</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitComplete} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Actual Materials & Labor Cost (₹)</label>
                <input
                  type="number"
                  value={completeForm.actualCost}
                  onChange={(e) => setCompleteForm({ ...completeForm, actualCost: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Engineer Notes & Verification</label>
                <textarea
                  rows={3}
                  value={completeForm.engineerNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, engineerNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white transition"
                >
                  Affix Seal & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Rate & Close */}
      {showRatingModal && selectedOrderForRating && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRatingModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Requester Satisfaction Sign-Off</h3>
              <button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-white text-lg">×</button>
            </div>

            <form onSubmit={submitRating} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Satisfaction Rating</label>
                <select
                  value={ratingForm.ratingStars}
                  onChange={(e) => setRatingForm({ ...ratingForm, ratingStars: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Outstanding & Prompt</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Stars - Very Good</option>
                  <option value={3}>⭐⭐⭐ 3 Stars - Satisfactory</option>
                  <option value={2}>⭐⭐ 2 Stars - Delayed Resolution</option>
                  <option value={1}>⭐ 1 Star - Unsatisfactory</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Requester Feedback</label>
                <textarea
                  rows={3}
                  value={ratingForm.satisfactionFeedback}
                  onChange={(e) => setRatingForm({ ...ratingForm, satisfactionFeedback: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white transition"
                >
                  Sign Off & Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
