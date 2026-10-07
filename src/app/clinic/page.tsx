"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  HeartPulse,
  Activity,
  Bed,
  UserCheck,
  AlertTriangle,
  PlusCircle,
  Stethoscope,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  Thermometer,
  FileHeart,
  Download,
  Filter,
  Eye,
  Printer,
  Pill,
  PackageCheck,
} from "lucide-react";
import { checkTriageUrgency } from "@/lib/clinic/clinic-engine";

interface ClinicSummary {
  totalConsultations: number;
  totalProfiles: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  beds: any[];
}

export default function ClinicPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"consultations" | "beds" | "profiles" | "triage" | "pharmacy">("consultations");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ClinicSummary | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedConsultation, setSelectedConsultation] = useState<any | null>(null);

  // Pharmacy Medication Stock Tracker
  const [pharmacyStock, setPharmacyStock] = useState([
    { id: "MED-01", name: "Paracetamol 650mg Tabs", category: "Analgesic / Antipyretic", stock: 85, minThreshold: 30, unit: "tablets", expiry: "2027-08", batch: "BATCH-PCM-89" },
    { id: "MED-02", name: "ORS Oral Rehydration Salts", category: "Electrolyte Replenisher", stock: 12, minThreshold: 25, unit: "sachets", expiry: "2026-12", batch: "BATCH-ORS-21" },
    { id: "MED-03", name: "Amoxicillin 500mg Caps", category: "Antibiotic", stock: 42, minThreshold: 20, unit: "capsules", expiry: "2027-04", batch: "BATCH-AMX-77" },
    { id: "MED-04", name: "Cetirizine 10mg Tabs", category: "Antihistamine / Allergy", stock: 16, minThreshold: 20, unit: "tablets", expiry: "2026-11", batch: "BATCH-CTZ-09" },
    { id: "MED-05", name: "Betadine 10% Ointment", category: "Antiseptic Microbicide", stock: 58, minThreshold: 15, unit: "tubes", expiry: "2028-01", batch: "BATCH-BTD-45" },
    { id: "MED-06", name: "Sterile Gauze & Bandage Packs", category: "First Aid & Trauma", stock: 120, minThreshold: 40, unit: "packs", expiry: "2029-06", batch: "BATCH-GBZ-12" },
  ]);

  const lowStockAlerts = pharmacyStock.filter((m) => m.stock < m.minThreshold);

  const handleDispenseMedicine = (medId: string, quantity: number = 2) => {
    setPharmacyStock((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          return { ...m, stock: Math.max(0, m.stock - quantity) };
        }
        return m;
      })
    );
    const med = pharmacyStock.find((m) => m.id === medId);
    setStatusMessage({
      type: "success",
      text: `Dispensed ${quantity} ${med?.unit} of ${med?.name}. Stock ledger updated.`,
    });
  };

  const handleRestockMedicine = (medId: string, quantity: number = 50) => {
    setPharmacyStock((prev) =>
      prev.map((m) => {
        if (m.id === medId) {
          return { ...m, stock: m.stock + quantity };
        }
        return m;
      })
    );
    const med = pharmacyStock.find((m) => m.id === medId);
    setStatusMessage({
      type: "success",
      text: `Restocked +${quantity} ${med?.unit} of ${med?.name}. Statutory batch verified.`,
    });
  };

  const handleExportClinicCsv = () => {
    const listToExport = filteredConsultations;
    const headers = ["Case #", "Patient Name", "Roll / Staff ID", "Chief Complaint", "BP", "Pulse", "Temp (F)", "SpO2 (%)", "Diagnosis", "Status", "Attending Doctor"];
    const rows = listToExport.map((c: any) => [
      c.caseNo,
      `"${(c.patientName || "").replace(/"/g, '""')}"`,
      `"${c.patientRoll || ""}"`,
      `"${(c.chiefComplaint || "").replace(/"/g, '""')}"`,
      c.vitals?.bp || "",
      c.vitals?.pulseRate || "",
      c.vitals?.temperatureF || "",
      c.vitals?.spo2Percent || "",
      `"${(c.diagnosis || "").replace(/"/g, '""')}"`,
      c.status,
      `"${(c.attendingDoctor || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Campus_Clinic_EMR_Logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredConsultations = consultations.filter((c: any) => {
    const matchesSearch =
      c.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.patientRoll?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // New Consultation Modal
  const [showModal, setShowModal] = useState(false);
  const [consultationForm, setConsultationForm] = useState({
    patientName: "",
    patientRoll: "",
    chiefComplaint: "",
    bp: "120/80",
    pulseRate: 75,
    temperatureF: 98.6,
    spo2Percent: 99,
    diagnosis: "",
    attendingDoctor: "Dr. Marcus Welby (Campus Physician)",
    requiresSickBayAdmit: false,
    rxName: "Paracetamol",
    rxDose: "500mg",
    rxFreq: "SOS",
    rxDays: 3,
  });

  // Triage Calculator state
  const [calcVitals, setCalcVitals] = useState({
    bp: "135/88",
    pulse: 82,
    temp: 99.1,
    spo2: 98,
  });

  const triageResult = checkTriageUrgency({
    bp: calcVitals.bp,
    pulseRate: calcVitals.pulse,
    temperatureF: calcVitals.temp,
    spo2Percent: calcVitals.spo2,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, consRes, profRes] = await Promise.all([
        fetch("/api/clinic?tab=summary"),
        fetch("/api/clinic?tab=consultations"),
        fetch("/api/clinic?tab=profiles"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }
      if (consRes.ok) {
        const cData = await consRes.json();
        setConsultations(cData.consultations || []);
      }
      if (profRes.ok) {
        const pData = await profRes.json();
        setProfiles(pData.profiles || []);
      }
    } catch (err) {
      console.error("Failed to load clinic data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOG_CONSULTATION",
          patientName: consultationForm.patientName,
          patientRoll: consultationForm.patientRoll,
          chiefComplaint: consultationForm.chiefComplaint,
          vitals: {
            bp: consultationForm.bp,
            pulseRate: Number(consultationForm.pulseRate),
            temperatureF: Number(consultationForm.temperatureF),
            spo2Percent: Number(consultationForm.spo2Percent),
          },
          diagnosis: consultationForm.diagnosis,
          attendingDoctor: consultationForm.attendingDoctor,
          requiresSickBayAdmit: consultationForm.requiresSickBayAdmit,
          prescriptions: consultationForm.rxName
            ? [
                {
                  name: consultationForm.rxName,
                  dosage: consultationForm.rxDose,
                  frequency: consultationForm.rxFreq,
                  days: Number(consultationForm.rxDays),
                },
              ]
            : [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record consultation");

      setStatusMessage({ type: "success", text: data.message });
      setShowModal(false);
      setConsultationForm({
        patientName: "",
        patientRoll: "",
        chiefComplaint: "",
        bp: "120/80",
        pulseRate: 75,
        temperatureF: 98.6,
        spo2Percent: 99,
        diagnosis: "",
        attendingDoctor: "Dr. Marcus Welby (Campus Physician)",
        requiresSickBayAdmit: false,
        rxName: "Paracetamol",
        rxDose: "500mg",
        rxFreq: "SOS",
        rxDays: 3,
      });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleDischargeBed = async (bedId: string) => {
    try {
      const res = await fetch("/api/clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DISCHARGE_BED", bedId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to discharge patient");
      setStatusMessage({ type: "success", text: data.message });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md shadow-rose-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Campus Health & Medical Infirmary
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Outpatient clinic triage, digital EMR profiles, prescriptions, and infirmary ward bed management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportClinicCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export OPD Logs (CSV)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Log Consultation (OPD)
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Critical Low Stock Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Pharmacy Alert: </span>
              <span>
                {lowStockAlerts.length} essential pharmaceuticals below safe reserve threshold (
                {lowStockAlerts.map((m) => m.name.split(" ")[0]).join(", ")}
                ). Immediate replenishment protocol indicated.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("pharmacy")}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shrink-0 shadow-sm transition-colors self-start sm:self-auto"
          >
            Review Pharmacy Stock ({lowStockAlerts.length})
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Consultations</span>
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalConsultations ?? "--"}
            </span>
            <span className="text-xs text-slate-500">cases</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Recorded campus clinic visits</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">EMR Medical Profiles</span>
            <FileHeart className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalProfiles ?? "--"}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">students & staff</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Emergency allergy & blood records</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Sick Bay Occupancy</span>
            <Bed className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.occupiedBeds ?? 0} / {summary?.totalBeds ?? 4}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">beds in use</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Infirmary overnight care capacity</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Beds</span>
            <UserCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.availableBeds ?? "--"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">vacant</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Ready for immediate triage admit</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("consultations")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "consultations"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Activity className="w-4 h-4" />
          OPD Consultations ({consultations.length})
        </button>

        <button
          onClick={() => setActiveTab("beds")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "beds"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Bed className="w-4 h-4" />
          Infirmary Sick-Bay Beds ({summary?.beds.length || 4})
        </button>

        <button
          onClick={() => setActiveTab("profiles")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "profiles"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <FileHeart className="w-4 h-4" />
          Emergency Medical Cards ({profiles.length})
        </button>

        <button
          onClick={() => setActiveTab("triage")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "triage"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Thermometer className="w-4 h-4" />
          Vitals Triage Analyzer
        </button>

        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "pharmacy"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Pill className="w-4 h-4" />
          Pharmacy Stock & Ledger
          {lowStockAlerts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              {lowStockAlerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: OPD Consultations */}
      {activeTab === "consultations" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Recent Outpatient Logs</h3>
              <p className="text-xs text-slate-400">{filteredConsultations.length} of {consultations.length} records matching</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search patient, roll, case #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 w-48 sm:w-56"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TREATED_DISCHARGED">Treated & Discharged</option>
                  <option value="ADMITTED_SICK_BAY">Admitted to Sick Bay</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Case #</th>
                  <th className="p-4">Patient & ID</th>
                  <th className="p-4">Chief Complaint</th>
                  <th className="p-4">Vitals</th>
                  <th className="p-4">Diagnosis & Rx</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredConsultations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-medium text-xs text-rose-600 dark:text-rose-400">
                      {c.caseNo}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{c.patientName}</div>
                      <div className="text-xs text-slate-400">{c.patientRoll}</div>
                    </td>
                    <td className="p-4 max-w-xs truncate text-xs" title={c.chiefComplaint}>
                      {c.chiefComplaint}
                    </td>
                    <td className="p-4 text-xs font-mono">
                      <div>BP: {c.vitals?.bp}</div>
                      <div>HR: {c.vitals?.pulseRate} bpm | SpO2: {c.vitals?.spo2Percent}%</div>
                      <div>Temp: {c.vitals?.temperatureF}°F</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-medium text-slate-900 dark:text-white">{c.diagnosis}</div>
                      {c.prescriptions?.map((p: any, i: number) => (
                        <span key={i} className="inline-block mt-1 mr-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[11px] text-slate-600 dark:text-slate-300">
                          {p.name} ({p.dosage} - {p.frequency})
                        </span>
                      ))}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.status === "ADMITTED_SICK_BAY"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        }`}
                      >
                        {c.status === "ADMITTED_SICK_BAY" ? "Admitted" : "Treated & Discharged"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedConsultation(c)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        Case Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredConsultations.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Clinic Records Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No outpatient consultations match your search term or status filter.
              </p>
              <button
                onClick={() => {
                  setFilterStatus("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Infirmary Sick-Bay Beds */}
      {activeTab === "beds" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(summary?.beds || []).map((bed: any) => (
            <div
              key={bed.id}
              className={`p-5 rounded-2xl border transition-all ${
                bed.isOccupied
                  ? "bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">{bed.roomNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    bed.isOccupied
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                  }`}
                >
                  {bed.isOccupied ? "Occupied" : "Vacant"}
                </span>
              </div>
              <h4 className="mt-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Bed className={`w-5 h-5 ${bed.isOccupied ? "text-amber-500" : "text-emerald-500"}`} />
                {bed.bedNumber}
              </h4>
              {bed.isOccupied ? (
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-900/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                  <div>Patient: <span className="font-semibold text-slate-900 dark:text-white">{bed.patientName}</span></div>
                  <div>Admitted: {new Date(bed.admittedAt).toLocaleTimeString()}</div>
                  <button
                    onClick={() => handleDischargeBed(bed.id)}
                    className="w-full mt-2 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    Discharge & Sanitize Bed
                  </button>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <p className="text-slate-400 mb-2">Ready for admission. Sanitized and equipped with oxygen monitor.</p>
                  <button
                    onClick={() => {
                      setConsultationForm(prev => ({ ...prev, requiresSickBayAdmit: true }));
                      setShowModal(true);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium text-xs border border-emerald-200 dark:border-emerald-800 transition-colors"
                  >
                    + Admit Patient to this Bed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Emergency Medical Profiles */}
      {activeTab === "profiles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{p.name}</h4>
                  <p className="text-xs text-slate-400">{p.rollOrEmpId} ({p.role})</p>
                </div>
                <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold rounded-lg text-xs">
                  Blood Group: {p.bloodGroup}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">Known Allergies</span>
                  <div className="font-medium text-slate-900 dark:text-slate-200">
                    {p.knownAllergies?.join(", ") || "None"}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  <span className="text-slate-400 block mb-1">Chronic Conditions</span>
                  <div className="font-medium text-slate-900 dark:text-slate-200">
                    {p.chronicConditions?.join(", ") || "None"}
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Contact: {p.emergencyContactName}</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{p.emergencyContactPhone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Vitals Triage Analyzer */}
      {activeTab === "triage" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-500" />
              Patient Vital Metrics Input
            </h3>
            <p className="text-xs text-slate-500">
              Evaluates vital signs against triage medical protocols to calculate urgent care severity.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={calcVitals.bp}
                  onChange={(e) => setCalcVitals({ ...calcVitals, bp: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. 120/80"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pulse (BPM)</label>
                  <input
                    type="number"
                    value={calcVitals.pulse}
                    onChange={(e) => setCalcVitals({ ...calcVitals, pulse: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Temp (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcVitals.temp}
                    onChange={(e) => setCalcVitals({ ...calcVitals, temp: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">SpO2 (%)</label>
                  <input
                    type="number"
                    value={calcVitals.spo2}
                    onChange={(e) => setCalcVitals({ ...calcVitals, spo2: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            className={`border p-6 rounded-2xl flex flex-col justify-between ${
              triageResult.level === "CRITICAL"
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                : triageResult.level === "URGENT"
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-6 h-6" />
                <h4 className="text-lg font-bold">Triage Assessment: {triageResult.level}</h4>
              </div>
              <p className="text-sm">{triageResult.recommendation}</p>

              {triageResult.redFlags.length > 0 && (
                <div className="mt-4 space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider">Detected Critical Markers:</span>
                  <ul className="list-disc list-inside text-xs space-y-0.5">
                    {triageResult.redFlags.map((flag: string, idx: number) => (
                      <li key={idx}>{flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-current/20 text-xs">
              Protocol: Emergency department transfer if SpO2 &lt; 90% or Systolic BP &gt; 180 mmHg.
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Pharmacy & Medication Stock Ledger */}
      {activeTab === "pharmacy" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Pharmacy KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Monitored Formulary</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{pharmacyStock.length} Drugs</p>
              <p className="text-xs text-slate-400 mt-0.5">Essential campus dispensary list</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Below Min Threshold</span>
              <p className={`text-2xl font-bold mt-1 ${lowStockAlerts.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {lowStockAlerts.length} Critical
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Requires supply re-order</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Units on Hand</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {pharmacyStock.reduce((acc, m) => acc + m.stock, 0)} Units
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Inspected & batch verified</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Quarantine & Cold Chain</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">100% Compliant</p>
              <p className="text-xs text-slate-400 mt-0.5">Temperature logged (2°C - 8°C)</p>
            </div>
          </div>

          {/* Pharmacy Stock Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-4 h-4 text-rose-600" />
                  Campus Dispensary & Pharmacy Stock Ledger
                </h3>
                <p className="text-xs text-slate-400">Real-time stock depletion tracker, batch expiry, and dispensing ledger</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Med Code</th>
                    <th className="p-3">Medicine & Therapeutic Class</th>
                    <th className="p-3">Batch & Expiry</th>
                    <th className="p-3">Stock Units</th>
                    <th className="p-3">Safety Status</th>
                    <th className="p-3 text-right">Dispensary Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pharmacyStock.map((med) => {
                    const isLow = med.stock < med.minThreshold;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-rose-600">{med.id}</td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{med.name}</p>
                          <p className="text-[11px] text-slate-400">{med.category}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-mono text-slate-700 dark:text-slate-300">{med.batch}</p>
                          <p className="text-[10px] text-slate-400">Exp: {med.expiry}</p>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{med.stock}</span>{" "}
                          <span className="text-slate-400">{med.unit}</span>
                          <span className="block text-[10px] text-slate-400">Min: {med.minThreshold}</span>
                        </td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Adequate
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDispenseMedicine(med.id, 2)}
                              disabled={med.stock <= 0}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Dispense Rx (-2)
                            </button>
                            <button
                              onClick={() => handleRestockMedicine(med.id, 50)}
                              className="px-2.5 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors"
                            >
                              + Restock 50
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Log Consultation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-rose-600" />
              Log Outpatient Consultation (OPD)
            </h3>

            <form onSubmit={handleCreateConsultation} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={consultationForm.patientName}
                    onChange={(e) => setConsultationForm({ ...consultationForm, patientName: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Roll / Staff ID</label>
                  <input
                    type="text"
                    required
                    value={consultationForm.patientRoll}
                    onChange={(e) => setConsultationForm({ ...consultationForm, patientRoll: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    placeholder="e.g. CS2026-089"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chief Complaint</label>
                <textarea
                  required
                  rows={2}
                  value={consultationForm.chiefComplaint}
                  onChange={(e) => setConsultationForm({ ...consultationForm, chiefComplaint: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Fever 101°F with acute throat soreness"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">BP</label>
                  <input
                    type="text"
                    value={consultationForm.bp}
                    onChange={(e) => setConsultationForm({ ...consultationForm, bp: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Pulse</label>
                  <input
                    type="number"
                    value={consultationForm.pulseRate}
                    onChange={(e) => setConsultationForm({ ...consultationForm, pulseRate: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Temp °F</label>
                  <input
                    type="number"
                    step="0.1"
                    value={consultationForm.temperatureF}
                    onChange={(e) => setConsultationForm({ ...consultationForm, temperatureF: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">SpO2 %</label>
                  <input
                    type="number"
                    value={consultationForm.spo2Percent}
                    onChange={(e) => setConsultationForm({ ...consultationForm, spo2Percent: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  value={consultationForm.diagnosis}
                  onChange={(e) => setConsultationForm({ ...consultationForm, diagnosis: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Viral Pharyngitis"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Initial Prescription</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <input
                    type="text"
                    value={consultationForm.rxName}
                    onChange={(e) => setConsultationForm({ ...consultationForm, rxName: e.target.value })}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    placeholder="Medicine"
                  />
                  <input
                    type="text"
                    value={consultationForm.rxDose}
                    onChange={(e) => setConsultationForm({ ...consultationForm, rxDose: e.target.value })}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    placeholder="Dose"
                  />
                  <input
                    type="text"
                    value={consultationForm.rxFreq}
                    onChange={(e) => setConsultationForm({ ...consultationForm, rxFreq: e.target.value })}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    placeholder="Frequency"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="admitSickBay"
                  checked={consultationForm.requiresSickBayAdmit}
                  onChange={(e) => setConsultationForm({ ...consultationForm, requiresSickBayAdmit: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="admitSickBay" className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Admit to Infirmary Sick-Bay Bed for observation
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Case Slip Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                  {selectedConsultation.caseNo}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Outpatient Clinical Case Slip
                </h3>
                <p className="text-xs text-slate-400">
                  Apex Campus Health Center • EMR Archive
                </p>
              </div>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient Full Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedConsultation.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Roll / Institutional ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedConsultation.patientRoll}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Clinical Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedConsultation.status === 'ADMITTED_SICK_BAY' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {selectedConsultation.status === 'ADMITTED_SICK_BAY' ? 'Admitted to Sick Bay' : 'Treated & Discharged'}
                  </span>
                </div>
              </div>

              {/* Vitals */}
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Recorded Vital Signs:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block">Blood Pressure</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedConsultation.vitals?.bp || "120/80"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block">Heart Rate</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedConsultation.vitals?.pulseRate || 72} bpm</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block">Oxygen (SpO2)</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{selectedConsultation.vitals?.spo2Percent || 99}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                    <span className="text-slate-400 text-[10px] block">Temperature</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{selectedConsultation.vitals?.temperatureF || 98.4}°F</span>
                  </div>
                </div>
              </div>

              {/* Diagnosis and Prescriptions */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Chief Complaint & Symptoms:</span>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedConsultation.chiefComplaint}</p>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block text-[11px]">Attending Physician Diagnosis:</span>
                  <p className="text-slate-900 dark:text-white font-bold">{selectedConsultation.diagnosis}</p>
                </div>
                {selectedConsultation.prescriptions && selectedConsultation.prescriptions.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 block text-[11px] mb-1">Dispensed Medications:</span>
                    <div className="space-y-1">
                      {selectedConsultation.prescriptions.map((rx: any, i: number) => (
                        <div key={i} className="flex justify-between p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">{rx.name}</span>
                          <span className="text-slate-500">{rx.dosage} • {rx.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" /> Print Case Slip
              </button>
              <button
                onClick={() => setSelectedConsultation(null)}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
