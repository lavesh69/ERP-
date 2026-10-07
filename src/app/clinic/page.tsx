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
  const [activeTab, setActiveTab] = useState<"consultations" | "beds" | "profiles" | "triage">("consultations");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ClinicSummary | null>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <p className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                  Ready for admission. Sanitized and equipped with oxygen monitor.
                </p>
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
    </div>
  );
}
