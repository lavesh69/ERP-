"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Bus,
  Navigation,
  CreditCard,
  Wrench,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  QrCode,
  Gauge,
  Fuel,
  BatteryCharging,
  ArrowRight,
  User,
  Users,
} from "lucide-react";

interface FleetSummary {
  totalVehicles: number;
  activeEnRoute: number;
  onCampus: number;
  totalRoutes: number;
  totalCapacity: number;
  currentPassengers: number;
  fleetOccupancyRate: number;
  activeBusPasses: number;
  vehicles: any[];
}

export default function TransportPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"fleet" | "routes" | "passes" | "maintenance">("fleet");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New Pass Modal
  const [showPassModal, setShowPassModal] = useState(false);
  const [passForm, setPassForm] = useState({
    studentName: currentUser?.fullName || "",
    studentRoll: "CS2026-001",
    routeId: "rt-01",
    stopName: "Porter Square T-Station",
    feeAmount: 450,
  });

  // Maintenance Modal
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintForm, setMaintForm] = useState({
    vehicleId: "veh-01",
    vehicleCode: "BUS-01",
    serviceType: "Annual Brake & Suspension Overhaul",
    date: new Date().toISOString().split("T")[0],
    odometerKm: 35000,
    cost: 450,
    workshopName: "Apex EcoTransit OEM Service Center",
    notes: "Regular scheduled safety check.",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, rRes, pRes, mRes] = await Promise.all([
        fetch("/api/transport?tab=summary"),
        fetch("/api/transport?tab=routes"),
        fetch("/api/transport?tab=passes"),
        fetch("/api/transport?tab=maintenance"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (rRes.ok) {
        const rData = await rRes.json();
        setRoutes(rData.routes || []);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        setPasses(pData.passes || []);
      }
      if (mRes.ok) {
        const mData = await mRes.json();
        setMaintenance(mData.maintenance || []);
      }
    } catch (err) {
      console.error("Failed to load transport data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ISSUE_PASS",
          ...passForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue bus pass");
      setStatusMessage({ type: "success", text: "Digital transit pass issued with cryptographic QR fingerprint!" });
      setShowPassModal(false);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_MAINTENANCE",
          ...maintForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log maintenance");
      setStatusMessage({ type: "success", text: "Vehicle service record added successfully." });
      setShowMaintModal(false);
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
                Fleet Logistics & Transit ERP
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                GPS Telemetry Online
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Transport & Fleet Management
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Real-time campus transit telemetry, morning/evening route coordination, digital cryptographic bus passes, and vehicular safety audits.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPassModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Issue Bus Pass
            </button>
            <button
              onClick={() => setShowMaintModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              Log Maintenance
            </button>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Active Fleet</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{summary.totalVehicles} Vehicles</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.activeEnRoute} En Route • {summary.onCampus} On Campus</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Transit Routes</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">{summary.totalRoutes} Active Corridors</p>
              <p className="text-xs text-rose-300 mt-0.5">Connecting Greater Metro Area</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Fleet Utilization</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">{summary.fleetOccupancyRate}%</p>
              <p className="text-xs text-rose-300 mt-0.5">{summary.currentPassengers} / {summary.totalCapacity} Seated</p>
            </div>
            <div>
              <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Issued Bus Passes</p>
              <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">{summary.activeBusPasses}</p>
              <p className="text-xs text-rose-300 mt-0.5">Verified Digital Passes</p>
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
          { id: "fleet", label: "Fleet & GPS Telemetry", icon: Bus },
          { id: "routes", label: "Routes & Schedules", icon: Navigation },
          { id: "passes", label: "Digital Bus Passes", icon: CreditCard, count: summary?.activeBusPasses },
          { id: "maintenance", label: "Vehicle Safety & Service", icon: Wrench },
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

      {/* TAB 1: FLEET & TELEMETRY */}
      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {summary?.vehicles.map((veh) => {
            const isEnRoute = veh.status === "ACTIVE_EN_ROUTE";
            return (
              <div
                key={veh.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
                          {veh.vehicleCode}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${
                            isEnRoute
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-300"
                              : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 border-blue-300"
                          }`}
                        >
                          {isEnRoute ? "En Route (Live)" : "On Campus"}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-500 font-mono mt-0.5">
                        {veh.registrationNumber} • {veh.type.replace("_", " ")}
                      </p>
                    </div>

                    <div className="text-right">
                      {veh.fuelType === "ELECTRIC" ? (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                          <BatteryCharging className="w-4 h-4" />
                          <span>{veh.batteryOrFuelLevel}% EV</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
                          <Fuel className="w-4 h-4" />
                          <span>{veh.batteryOrFuelLevel}% {veh.fuelType}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telemetry Bar */}
                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500">Live Speed:</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-rose-primary" />
                        {veh.speedKmH} km/h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500">Passenger Load:</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                        {veh.currentPassengers} / {veh.capacity} Seats ({Math.round((veh.currentPassengers / veh.capacity) * 100)}%)
                      </span>
                    </div>
                    {/* Progress Track */}
                    <div className="w-full bg-border dark:bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          veh.currentPassengers / veh.capacity > 0.9 ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, (veh.currentPassengers / veh.capacity) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver & Attendant Contact */}
                  <div className="mt-4 space-y-1.5 text-xs">
                    <p className="flex items-center justify-between text-charcoal-700 dark:text-ivory-300">
                      <span className="text-charcoal-500">Driver:</span>
                      <span className="font-medium">{veh.driverName} ({veh.driverPhone})</span>
                    </p>
                    <p className="flex items-center justify-between text-charcoal-700 dark:text-ivory-300">
                      <span className="text-charcoal-500">Conductor:</span>
                      <span className="font-medium">{veh.attendantName}</span>
                    </p>
                  </div>
                </div>

                {/* Statutory Check */}
                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between text-[11px]">
                  <span className="text-charcoal-500">Fitness Expiry: {veh.nextFcDate}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Insured
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: ROUTES & SCHEDULES */}
      {activeTab === "routes" && (
        <div className="space-y-4">
          {routes.map((rt) => (
            <div
              key={rt.id}
              className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-3 border-b border-border dark:border-charcoal-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold text-xs">
                      {rt.routeNumber}
                    </span>
                    <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                      {rt.routeName}
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    {rt.startingPoint} <ArrowRight className="inline w-3 h-3 mx-1 text-charcoal-400" /> {rt.destination} • {rt.totalDistanceKm} km
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-right">
                    <p className="text-charcoal-500">Morning Pickup / Evening Drop</p>
                    <p className="font-bold text-charcoal-900 dark:text-ivory-100">
                      {rt.morningStartTime} / {rt.eveningDepartureTime}
                    </p>
                  </div>
                  <span className="px-3 py-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 font-semibold text-charcoal-800 dark:text-ivory-200">
                    Bus: {rt.assignedVehicleCode} ({rt.assignedDriverName})
                  </span>
                </div>
              </div>

              {/* Stop Sequence */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">
                  Stops & Timetable Sequence ({rt.stops.length} Boarding Points)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {rt.stops.map((stop: any) => (
                    <div
                      key={stop.sequenceOrder}
                      className="p-3 rounded-lg border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-800/40 text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-charcoal-900 dark:text-ivory-100">
                        <span>Stop #{stop.sequenceOrder}</span>
                        <span className="text-rose-primary text-[11px]">{stop.morningPickupTime}</span>
                      </div>
                      <p className="font-medium mt-1 truncate">{stop.stopName}</p>
                      <p className="text-[10px] text-charcoal-500 truncate mt-0.5">{stop.landmark}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: DIGITAL BUS PASSES */}
      {activeTab === "passes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Institutional Transit Passes
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Cryptographically sealed smart passes with conductor offline validation
              </p>
            </div>
            <button
              onClick={() => setShowPassModal(true)}
              className="px-3.5 py-2 bg-rose-primary text-white rounded-lg text-xs font-semibold hover:bg-rose-accent transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Apply New Transit Pass
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passes.map((pass) => (
              <div
                key={pass.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-rose-primary dark:text-rose-light">
                        {pass.passNumber}
                      </span>
                      <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                        {pass.studentName}
                      </h3>
                      <p className="text-xs text-charcoal-500">Roll: {pass.studentRoll}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                      {pass.status}
                    </span>
                  </div>

                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-1.5 text-xs">
                    <p className="flex justify-between">
                      <span className="text-charcoal-500">Assigned Route:</span>
                      <span className="font-semibold text-charcoal-900 dark:text-ivory-100">Route {pass.routeNumber}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500">Designated Stop:</span>
                      <span className="font-medium text-charcoal-900 dark:text-ivory-100">{pass.stopName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500">Pass Validity:</span>
                      <span className="text-charcoal-700 dark:text-ivory-300 font-medium">Until {pass.validUntil}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-charcoal-600 dark:text-ivory-400" />
                    <div>
                      <p className="text-[10px] text-charcoal-500 uppercase font-mono">SHA-256 Seal</p>
                      <p className="text-[10px] font-mono text-charcoal-600 dark:text-ivory-300">
                        {pass.qrCodeFingerprint?.slice(0, 16)}...
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Fee Cleared (${pass.feeAmount})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VEHICLE SAFETY & MAINTENANCE */}
      {activeTab === "maintenance" && (
        <div className="bg-white dark:bg-charcoal-900 rounded-xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border dark:border-charcoal-800 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                Fleet Maintenance & Roadworthiness Registry
              </h2>
              <p className="text-xs text-charcoal-500 dark:text-ivory-400">
                Statutory fitness logs, speed governor calibrations, and preventive service records
              </p>
            </div>
            <button
              onClick={() => setShowMaintModal(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Service Entry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-50 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-700">
                <tr>
                  <th className="p-3.5">Vehicle</th>
                  <th className="p-3.5">Service Type</th>
                  <th className="p-3.5">Service Date</th>
                  <th className="p-3.5">Odometer</th>
                  <th className="p-3.5">Workshop / Depot</th>
                  <th className="p-3.5">Cost</th>
                  <th className="p-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-charcoal-800">
                {maintenance.map((m) => (
                  <tr key={m.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-charcoal-900 dark:text-ivory-100">
                      {m.vehicleCode}
                    </td>
                    <td className="p-3.5 font-medium text-charcoal-800 dark:text-ivory-200">
                      {m.serviceType}
                    </td>
                    <td className="p-3.5 text-charcoal-500">{m.date}</td>
                    <td className="p-3.5 font-mono text-charcoal-700 dark:text-ivory-300">
                      {m.odometerKm.toLocaleString()} km
                    </td>
                    <td className="p-3.5 text-charcoal-600 dark:text-ivory-400">
                      {m.workshopName}
                    </td>
                    <td className="p-3.5 font-semibold text-rose-primary dark:text-rose-light">
                      ${m.cost}
                    </td>
                    <td className="p-3.5 text-charcoal-500 italic max-w-xs truncate">
                      {m.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Issue Bus Pass */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Issue Student Transit Pass
              </h3>
              <button
                onClick={() => setShowPassModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssuePass} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={passForm.studentName}
                  onChange={(e) => setPassForm({ ...passForm, studentName: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. Jordan Lee"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Student Roll / Registration No
                </label>
                <input
                  type="text"
                  required
                  value={passForm.studentRoll}
                  onChange={(e) => setPassForm({ ...passForm, studentRoll: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. CS2026-044"
                />
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Designated Transit Route
                </label>
                <select
                  required
                  value={passForm.routeId}
                  onChange={(e) => setPassForm({ ...passForm, routeId: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  {routes.map((rt) => (
                    <option key={rt.id} value={rt.id}>
                      Route {rt.routeNumber} — {rt.routeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Designated Boarding Stop
                </label>
                <input
                  type="text"
                  required
                  value={passForm.stopName}
                  onChange={(e) => setPassForm({ ...passForm, stopName: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. Union Square Metro / Porter Square"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowPassModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Issue Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Maintenance */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Log Fleet Maintenance
              </h3>
              <button
                onClick={() => setShowMaintModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMaintenance} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Vehicle
                </label>
                <select
                  required
                  value={maintForm.vehicleId}
                  onChange={(e) => {
                    const veh = summary?.vehicles.find((v) => v.id === e.target.value);
                    setMaintForm({
                      ...maintForm,
                      vehicleId: e.target.value,
                      vehicleCode: veh ? veh.vehicleCode : "BUS",
                    });
                  }}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                >
                  {summary?.vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleCode} ({v.registrationNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Service / Inspection Type
                </label>
                <input
                  type="text"
                  required
                  value={maintForm.serviceType}
                  onChange={(e) => setMaintForm({ ...maintForm, serviceType: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="e.g. Brake Pads, Oil Change, Battery Inspection"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Service Date
                  </label>
                  <input
                    type="date"
                    required
                    value={maintForm.date}
                    onChange={(e) => setMaintForm({ ...maintForm, date: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={maintForm.cost}
                    onChange={(e) => setMaintForm({ ...maintForm, cost: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Workshop / Notes
                </label>
                <input
                  type="text"
                  value={maintForm.notes}
                  onChange={(e) => setMaintForm({ ...maintForm, notes: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg"
                  placeholder="Notes from mechanic..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
