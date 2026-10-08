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
  Radio,
  Compass,
  X,
  Download,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
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
  const [activeTab, setActiveTab] = useState<"fleet" | "map" | "routes" | "passes" | "maintenance">("fleet");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedTelematicsVehicle, setSelectedTelematicsVehicle] = useState<any | null>(null);
  const [panicBeaconActive, setPanicBeaconActive] = useState(false);
  const [pingSent, setPingSent] = useState(false);

  // Live Map State
  const [selectedRouteId, setSelectedRouteId] = useState<string>("rt-01");
  const [selectedStopName, setSelectedStopName] = useState<string | null>(null);
  const [busProgress, setBusProgress] = useState<number>(45);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

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

  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      setBusProgress((prev) => (prev >= 96 ? 8 : prev + 1));
    }, 1200);
    return () => clearInterval(timer);
  }, [isSimulating]);

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

  const handleExportTransportCsv = () => {
    const headers = "Pass ID,Student Name,Roll No,Route ID,Boarding Stop,Fee,Validity,Status,Cryptographic Hash\n";
    const rows = passes
      .map((p) => `"${p.id}","${p.studentName}","${p.studentRoll}","${p.routeId}","${p.stopName}",${p.feeAmount},"${p.validUntil}","${p.status}","${p.qrToken}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Campus_Transit_Pass_Manifest_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              onClick={handleExportTransportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-md transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Export Manifest (CSV)
            </button>
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
          { id: "map", label: "Live Transit Route Map", icon: MapPin },
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

                {/* Statutory Check & Live Telematics */}
                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between text-[11px] gap-2">
                  <span className="text-charcoal-500 truncate">FC: {veh.nextFcDate}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Insured
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTelematicsVehicle(veh);
                        setPanicBeaconActive(false);
                        setPingSent(false);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900 transition-colors shadow-xs"
                    >
                      <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                      Live Radar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: INTERACTIVE CAMPUS TRANSIT ROUTE MAP */}
      {activeTab === "map" && (() => {
        const currentRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
        const assignedVeh = summary?.vehicles.find((v) => v.vehicleCode === currentRoute?.assignedVehicleCode || v.id === currentRoute?.assignedVehicleId) || summary?.vehicles?.[0];
        const currentStop = currentRoute?.stops?.find((s: any) => s.stopName === selectedStopName) || currentRoute?.stops?.[0];
        const assignedPasses = passes.filter((p) => p.routeId === currentRoute?.id || p.routeNumber === currentRoute?.routeNumber);
        const stopPasses = currentStop ? assignedPasses.filter((p) => p.stopName === currentStop.stopName) : [];
        const stopsCount = currentRoute?.stops?.length || 1;

        // Calculate animated bus coordinates on SVG track (800 x 220 viewBox)
        const trackStartX = 70;
        const trackEndX = 730;
        const trackY = 110;
        const busX = trackStartX + ((trackEndX - trackStartX) * (busProgress / 100));
        const busY = trackY - Math.sin((busProgress / 100) * Math.PI) * 12;

        return (
          <div className="space-y-6">
            {/* Top Toolbar: Route Selection & Live Controls */}
            <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Interactive Transit Map
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Telemetry Stream Active
                  </span>
                </div>
                <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
                  {currentRoute?.routeName || "Active Campus Corridor"}
                </h2>
                <p className="text-xs text-charcoal-500">
                  {currentRoute?.startingPoint} to {currentRoute?.destination} • {currentRoute?.totalDistanceKm} km corridor
                </p>
              </div>

              {/* Route Selector Pills & Simulation Toggle */}
              <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
                <div className="flex p-1 bg-ivory-100 dark:bg-charcoal-800 rounded-xl border border-border dark:border-charcoal-700">
                  {routes.map((rt) => (
                    <button
                      key={rt.id}
                      onClick={() => {
                        setSelectedRouteId(rt.id);
                        setSelectedStopName(rt.stops?.[0]?.stopName || null);
                        setBusProgress(25);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRouteId === rt.id
                          ? "bg-rose-primary text-white shadow-sm"
                          : "text-charcoal-600 dark:text-ivory-300 hover:text-charcoal-900"
                      }`}
                    >
                      {rt.routeNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsSimulating(!isSimulating)}
                  className="px-3 py-2 bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 rounded-xl text-xs font-semibold text-charcoal-800 dark:text-ivory-200 flex items-center gap-1.5 transition-all border border-border dark:border-charcoal-700"
                  title={isSimulating ? "Pause Bus Simulation" : "Resume Bus Simulation"}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5 text-amber-500" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
                  <span>{isSimulating ? "Live Motion" : "Paused"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBusProgress(10)}
                  className="p-2 bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 dark:hover:bg-charcoal-700 rounded-xl text-charcoal-600 dark:text-ivory-300 transition-all border border-border dark:border-charcoal-700"
                  title="Reset Corridor Tracking Position"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive High-Tech SVG Schematic Corridor Map */}
            <div className="relative bg-charcoal-950 rounded-3xl p-6 sm:p-8 border border-charcoal-800 shadow-2xl overflow-hidden">
              {/* Background Map Grid & Satellite Details */}
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f43f5e_1px,transparent_1px)] [background-size:24px_24px]" />
              
              {/* Top Map HUD */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-charcoal-800 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl border border-charcoal-700 font-mono text-[11px] text-rose-300">
                    <Compass className="w-3.5 h-3.5 text-rose-400" />
                    <span>CORRIDOR: {currentRoute?.routeNumber}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md rounded-xl border border-charcoal-700 font-mono text-[11px] text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>D-GPS ACCURACY ±1.5m</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-ivory-300 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-rose-400" />
                    <span>Avg Speed: <strong>{assignedVeh?.speedKmH || 38} km/h</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Next Stop ETA: <strong className="text-amber-300">~03 min</strong></span>
                  </div>
                </div>
              </div>

              {/* The Interactive SVG Track */}
              <div className="relative z-10 my-4 overflow-x-auto py-6">
                <svg
                  viewBox="0 0 800 220"
                  className="w-full min-w-[700px] h-52 select-none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="corridorGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#fb7185" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                    </linearGradient>
                    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Outer Guide Track */}
                  <line
                    x1={trackStartX}
                    y1={trackY}
                    x2={trackEndX}
                    y2={trackY}
                    stroke="#334155"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />

                  {/* Glowing Active Route Line */}
                  <line
                    x1={trackStartX}
                    y1={trackY}
                    x2={trackEndX}
                    y2={trackY}
                    stroke="url(#corridorGlow)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#neonGlow)"
                  />

                  {/* Completed Segment of Track */}
                  <line
                    x1={trackStartX}
                    y1={trackY}
                    x2={busX}
                    y2={trackY}
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  {/* Render Stop Nodes */}
                  {currentRoute?.stops?.map((stop: any, idx: number) => {
                    const stopX = trackStartX + (idx * ((trackEndX - trackStartX) / Math.max(1, stopsCount - 1)));
                    const isSelected = (currentStop?.stopName === stop.stopName);
                    const isPast = stopX <= busX;

                    return (
                      <g
                        key={stop.sequenceOrder}
                        className="cursor-pointer transition-transform hover:scale-110"
                        onClick={() => setSelectedStopName(stop.stopName)}
                      >
                        {/* Selected Ping Ring */}
                        {isSelected && (
                          <circle
                            cx={stopX}
                            cy={trackY}
                            r="18"
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            className="animate-spin"
                          />
                        )}

                        {/* Stop Circle */}
                        <circle
                          cx={stopX}
                          cy={trackY}
                          r={isSelected ? "11" : "8"}
                          fill={isSelected ? "#f43f5e" : isPast ? "#10b981" : "#1e293b"}
                          stroke={isSelected ? "#fff" : isPast ? "#34d399" : "#64748b"}
                          strokeWidth="2.5"
                        />

                        {/* Sequence Label inside node */}
                        <text
                          x={stopX}
                          y={trackY + 3.5}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {stop.sequenceOrder}
                        </text>

                        {/* Stop Name Label Above */}
                        <text
                          x={stopX}
                          y={trackY - 26}
                          textAnchor="middle"
                          fill={isSelected ? "#fda4af" : "#f1f5f9"}
                          fontSize={isSelected ? "12" : "11"}
                          fontWeight={isSelected ? "bold" : "600"}
                        >
                          {stop.stopName.length > 18 ? stop.stopName.slice(0, 16) + "…" : stop.stopName}
                        </text>

                        {/* Timetable Badge Below */}
                        <text
                          x={stopX}
                          y={trackY + 32}
                          textAnchor="middle"
                          fill="#94a3b8"
                          fontSize="10"
                          fontFamily="monospace"
                        >
                          {stop.morningPickupTime}
                        </text>

                        {/* Distance from Campus */}
                        <text
                          x={stopX}
                          y={trackY + 46}
                          textAnchor="middle"
                          fill={stop.distanceKmFromCampus === 0 ? "#34d399" : "#64748b"}
                          fontSize="9"
                          fontWeight="500"
                        >
                          {stop.distanceKmFromCampus === 0 ? "Campus Gate" : `${stop.distanceKmFromCampus} km`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Animated Moving Shuttle Marker */}
                  <g transform={`translate(${busX}, ${busY})`}>
                    {/* Glowing outer pulse halo */}
                    <circle cx="0" cy="0" r="22" fill="#e11d48" opacity="0.25" className="animate-ping" />
                    <circle cx="0" cy="0" r="16" fill="#e11d48" opacity="0.4" />
                    
                    {/* Main Shuttle Body */}
                    <circle cx="0" cy="0" r="12" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                    
                    {/* Bus Mini Emblem */}
                    <path
                      d="M -5 -4 L 5 -4 C 6 -4 6.5 -3.5 6.5 -2.5 L 6.5 3 C 6.5 4 6 4.5 5 4.5 L -5 4.5 C -6 4.5 -6.5 4 -6.5 3 L -6.5 -2.5 C -6.5 -3.5 -6 -4 -5 -4 Z"
                      fill="#ffffff"
                    />
                    <circle cx="-3.5" cy="4" r="1" fill="#1e293b" />
                    <circle cx="3.5" cy="4" r="1" fill="#1e293b" />

                    {/* Dynamic Tooltip Badge Above Bus */}
                    <g transform="translate(0, -32)">
                      <rect
                        x="-54"
                        y="-12"
                        width="108"
                        height="20"
                        rx="10"
                        fill="#090d16"
                        stroke="#f43f5e"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9.5"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        {assignedVeh?.vehicleCode || "BUS-01"} • {assignedVeh?.speedKmH || 38} km/h
                      </text>
                    </g>
                  </g>
                </svg>
              </div>

              {/* Bottom Instructions / Hint */}
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-charcoal-800 text-xs text-charcoal-400">
                <span className="flex items-center gap-1.5 text-ivory-300">
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  Click any boarding stop pin along the corridor to inspect students and timetable
                </span>
                <span className="font-mono text-emerald-400">
                  Route Progress: {busProgress}% Completed
                </span>
              </div>
            </div>

            {/* 3-Card Interactive Inspector: Stop Details, Vehicle Telematics & Corridor Safety */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Selected Boarding Stop Details */}
              <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200">
                        Stop #{currentStop?.sequenceOrder || 1} of {stopsCount}
                      </span>
                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                        {currentStop?.stopName || "Selected Stop"}
                      </h3>
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        Landmark: {currentStop?.landmark || "Main Road Junction"}
                      </p>
                    </div>
                    <MapPin className="w-5 h-5 text-rose-primary shrink-0" />
                  </div>

                  <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Morning Pickup:</span>
                      <strong className="text-rose-primary">{currentStop?.morningPickupTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Evening Dropoff:</span>
                      <strong className="text-charcoal-900 dark:text-ivory-100">{currentStop?.eveningDropTime}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Distance from Campus:</span>
                      <strong className="font-mono">{currentStop?.distanceKmFromCampus} km</strong>
                    </div>
                  </div>

                  {/* Registered Students at this Stop */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-charcoal-700 dark:text-ivory-300">
                        Boarding Pass Holders ({stopPasses.length})
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Verified Passes
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {stopPasses.length > 0 ? (
                        stopPasses.map((p) => (
                          <div
                            key={p.id}
                            className="p-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800/40 text-xs flex items-center justify-between border border-border dark:border-charcoal-800"
                          >
                            <div>
                              <span className="font-semibold block text-charcoal-900 dark:text-ivory-100">{p.studentName}</span>
                              <span className="text-[10px] font-mono text-charcoal-400">{p.studentRoll} • {p.passNumber}</span>
                            </div>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                              Valid
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-charcoal-400 italic py-2">
                          No students currently registered at this specific boarding stop.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => {
                      setPassForm((prev) => ({
                        ...prev,
                        routeId: currentRoute?.id || "rt-01",
                        stopName: currentStop?.stopName || "Porter Square T-Station",
                      }));
                      setShowPassModal(true);
                    }}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-800"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Issue Pass for This Stop
                  </button>
                </div>
              </div>

              {/* Card 2: Assigned Vehicle Telematics & Cockpit */}
              <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Assigned Shuttle
                      </span>
                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                        {assignedVeh?.vehicleCode || currentRoute?.assignedVehicleCode}
                      </h3>
                      <p className="text-xs font-mono text-charcoal-500 mt-0.5">
                        {assignedVeh?.registrationNumber} • {assignedVeh?.type?.replace("_", " ")}
                      </p>
                    </div>
                    {assignedVeh?.fuelType === "ELECTRIC" ? (
                      <BatteryCharging className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Fuel className="w-5 h-5 text-amber-500 shrink-0" />
                    )}
                  </div>

                  {/* Velocity & Fuel Gauges */}
                  <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                    <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl text-center">
                      <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block font-semibold">Speed</span>
                      <span className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 mt-1 block">
                        {assignedVeh?.speedKmH || 38} <span className="text-[10px] font-normal text-charcoal-400">km/h</span>
                      </span>
                    </div>
                    <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl text-center">
                      <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block font-semibold">
                        {assignedVeh?.fuelType === "ELECTRIC" ? "Charge" : "Fuel Level"}
                      </span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        {assignedVeh?.batteryOrFuelLevel || 82}%
                      </span>
                    </div>
                  </div>

                  {/* Seat Occupancy Bar */}
                  <div className="mt-3 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Passenger Load:</span>
                      <strong>
                        {assignedVeh?.currentPassengers || 42} / {assignedVeh?.capacity || 48} Seats
                      </strong>
                    </div>
                    <div className="w-full bg-border dark:bg-charcoal-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.round(((assignedVeh?.currentPassengers || 42) / (assignedVeh?.capacity || 48)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver Contact */}
                  <div className="mt-3 p-3 rounded-xl border border-border dark:border-charcoal-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block font-semibold">Driver in Cockpit</span>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100">{assignedVeh?.driverName}</span>
                      <span className="text-charcoal-500 block text-[11px] font-mono">{assignedVeh?.driverPhone}</span>
                    </div>
                    <a
                      href={`tel:${assignedVeh?.driverPhone}`}
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 rounded-xl transition"
                      title="Direct Driver Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => {
                      if (assignedVeh) {
                        setSelectedTelematicsVehicle(assignedVeh);
                        setPanicBeaconActive(false);
                        setPingSent(false);
                      }
                    }}
                    className="w-full py-2 bg-charcoal-900 hover:bg-black text-white dark:bg-rose-primary dark:hover:bg-rose-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    Open Live Radar Telematics
                  </button>
                </div>
              </div>

              {/* Card 3: Corridor Transit Safety & Logistics */}
              <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Corridor Logistics
                      </span>
                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                        Operational Safety
                      </h3>
                      <p className="text-xs text-charcoal-500 mt-0.5">
                        Morning Shift 07:15 AM — 08:30 AM
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                        <Activity className="w-4 h-4" />
                        <span>Corridor Flow: Optimal</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                        Speed governor engaged at 40 km/h. Zero traffic choke points detected on transit route.
                      </p>
                    </div>

                    <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Conductor on Board:</span>
                        <strong className="text-charcoal-900 dark:text-ivory-100">{assignedVeh?.attendantName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Inspection Fitness (FC):</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">Valid till {assignedVeh?.nextFcDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-500">Route Pass Capacity:</span>
                        <span className="font-semibold">{assignedPasses.length} Active Passes</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMessage({
                        type: "success",
                        text: `Telemetry ping broadcast sent to ${assignedVeh?.vehicleCode || "BUS-01"} transponder.`,
                      });
                    }}
                    className="flex-1 py-2 bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-border dark:border-charcoal-700"
                  >
                    <Radio className="w-3.5 h-3.5 text-rose-500" />
                    Ping Transponder
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("routes")}
                    className="flex-1 py-2 bg-rose-primary hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    All Routes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 2: ROUTES & SCHEDULES */}
      {activeTab === "routes" && (
        <div className="space-y-4">
          {/* Quick jump to Live Visual Map */}
          <div className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-charcoal-900 rounded-xl border border-rose-200 dark:border-rose-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-rose-primary shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
                  Live Interactive Transit Corridor Map Available
                </h4>
                <p className="text-[11px] text-rose-800 dark:text-rose-400">
                  Track animated bus movements, boarding stop ETA countdowns, and passenger manifests in real time.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("map")}
              className="px-3.5 py-1.5 bg-rose-primary hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <span>Open Visual Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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

      {/* MODAL: LIVE GPS TELEMATICS RADAR */}
      {selectedTelematicsVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-border dark:border-charcoal-800 flex items-start justify-between bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                    LIVE TELEMATICS RADAR
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Dual GNSS Lock • 14 Satellites
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-1 flex items-center gap-2">
                  <span>{selectedTelematicsVehicle.vehicleCode}</span>
                  <span className="text-sm font-normal text-rose-200">({selectedTelematicsVehicle.registrationNumber})</span>
                </h2>
                <p className="text-xs text-rose-200/80">
                  Assigned Route: {selectedTelematicsVehicle.currentRoute || "Campus Express Corridor A"} • Driver: {selectedTelematicsVehicle.driverName} ({selectedTelematicsVehicle.driverPhone})
                </p>
              </div>
              <button
                onClick={() => setSelectedTelematicsVehicle(null)}
                className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Emergency Banner if Active */}
              {panicBeaconActive && (
                <div className="p-4 bg-rose-600 text-white rounded-xl shadow-lg animate-pulse flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-white" />
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">SOS PANIC BEACON ACTIVE</h4>
                      <p className="text-xs text-rose-100">
                        Geo-coordinate emergency broadcast sent to Campus Security QRF and Central Fleet Dispatch.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPanicBeaconActive(false)}
                    className="px-3 py-1 bg-white text-rose-700 font-bold text-xs rounded-lg shadow hover:bg-rose-50"
                  >
                    Reset Beacon
                  </button>
                </div>
              )}

              {/* Ping Ack Banner */}
              {pingSent && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    High-priority dispatch tone transmitted to vehicle cockpit telematics terminal.
                  </span>
                  <button
                    onClick={() => setPingSent(false)}
                    className="text-xs text-emerald-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Simulated GPS Radar Grid */}
              <div className="relative h-48 md:h-56 bg-charcoal-950 rounded-xl overflow-hidden border border-charcoal-800 flex items-center justify-center p-4">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-72 h-72 border border-rose-500 rounded-full animate-ping [animation-duration:4s]" />
                  <div className="w-48 h-48 border border-rose-400 rounded-full" />
                  <div className="w-24 h-24 border border-rose-300 rounded-full" />
                  <div className="absolute w-full h-px bg-rose-500/30" />
                  <div className="absolute h-full w-px bg-rose-500/30" />
                </div>

                {/* Satellite Radar Readout Overlay */}
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-[11px] font-mono text-rose-300 space-y-0.5">
                  <div>LAT: 12.9731° N | LNG: 77.5960° E</div>
                  <div>ALT: 924m ASL | HEADING: 048° NNE</div>
                  <div>ACCURACY: ±1.8m (Differential GPS Lock)</div>
                </div>

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>TRANSPONDER ONLINE</span>
                </div>

                {/* Central Bus Marker on Radar */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="p-3 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-600/50 ring-4 ring-rose-400/30 animate-bounce">
                    <Bus className="w-6 h-6" />
                  </div>
                  <span className="mt-2 px-2.5 py-0.5 bg-black/80 text-white text-xs font-mono font-bold rounded-md border border-white/10">
                    {selectedTelematicsVehicle.vehicleCode} • {selectedTelematicsVehicle.speedKmH} km/h
                  </span>
                </div>
              </div>

              {/* Real-time Telematics Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700">
                  <p className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold">Live Velocity</p>
                  <p className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 flex items-center justify-center gap-1 mt-1">
                    <Gauge className="w-4 h-4 text-rose-primary" />
                    {selectedTelematicsVehicle.speedKmH} <span className="text-xs font-normal text-charcoal-400">km/h</span>
                  </p>
                </div>

                <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700">
                  <p className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold">Bearing</p>
                  <p className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 flex items-center justify-center gap-1 mt-1">
                    <Compass className="w-4 h-4 text-blue-500" />
                    048° <span className="text-xs font-normal text-charcoal-400">NNE</span>
                  </p>
                </div>

                <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700">
                  <p className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold">Fuel / Energy</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <BatteryCharging className="w-4 h-4" />
                    {selectedTelematicsVehicle.batteryOrFuelLevel}%
                  </p>
                </div>

                <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700">
                  <p className="text-[11px] text-charcoal-500 uppercase tracking-wider font-semibold">Delay Index</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-1">
                    <Clock className="w-4 h-4" />
                    -1 min <span className="text-xs font-normal text-emerald-500">(On-Time)</span>
                  </p>
                </div>
              </div>

              {/* Route Waypoint Sequence Track */}
              <div className="bg-ivory-50 dark:bg-charcoal-800/50 p-4 rounded-xl border border-border dark:border-charcoal-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-primary" /> Active Corridor Stoppage Timeline
                </h4>
                <div className="relative flex items-center justify-between">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-border dark:bg-charcoal-700 z-0" />
                  
                  {[
                    { label: "City North Terminal", status: "completed", time: "07:30 AM" },
                    { label: "Metro Junction", status: "completed", time: "07:45 AM" },
                    { label: "Tech Hub Stop", status: "current", time: "LIVE (07:58)" },
                    { label: "South Gate", status: "upcoming", time: "ETA 08:10 AM" },
                    { label: "Main Quad Terminal", status: "upcoming", time: "ETA 08:20 AM" },
                  ].map((stop, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                          stop.status === "completed"
                            ? "bg-emerald-500 border-white text-white"
                            : stop.status === "current"
                            ? "bg-rose-600 border-white text-white ring-4 ring-rose-500/30 animate-pulse"
                            : "bg-white dark:bg-charcoal-800 border-charcoal-400 text-charcoal-500"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[11px] font-semibold mt-1 text-charcoal-800 dark:text-ivory-200 text-center max-w-[80px] truncate">
                        {stop.label}
                      </span>
                      <span className="text-[10px] text-charcoal-500">{stop.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Control Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-border dark:border-charcoal-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPingSent(true)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-lg bg-ivory-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
                  >
                    Ping Cabin Headunit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPanicBeaconActive(!panicBeaconActive)}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      panicBeaconActive
                        ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200"
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {panicBeaconActive ? "Disengage SOS" : "Simulate SOS Panic Beacon"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTelematicsVehicle(null)}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-950 hover:opacity-90 transition-opacity"
                >
                  Close Radar Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
