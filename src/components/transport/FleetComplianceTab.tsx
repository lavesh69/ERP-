"use client";

import React, { useState, useEffect } from "react";
import {
  Bus,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Radio,
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Sparkles,
  Phone,
  UserCheck,
  AlertOctagon,
  X,
} from "lucide-react";
import { VehicleComplianceRecord, ComplianceStatus } from "@/lib/transport/fleet-compliance-engine";

export default function FleetComplianceTab() {
  const [records, setRecords] = useState<VehicleComplianceRecord[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Inspect modal
  const [targetVehicleForCert, setTargetVehicleForCert] = useState<VehicleComplianceRecord | null>(null);
  const [officerName, setOfficerName] = useState("Transport Safety Director Major K. S. Rao");
  const [inspectionNotes, setInspectionNotes] = useState("Complete physical roadworthiness checklist verified. AIS-140 telematics active.");
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  // Update policy modal
  const [targetVehicleForUpdate, setTargetVehicleForUpdate] = useState<VehicleComplianceRecord | null>(null);
  const [updateForm, setUpdateForm] = useState({
    fitnessExpiryDate: "",
    pucExpiryDate: "",
    insuranceExpiryDate: "",
    driverLicenseExpiry: "",
    speedGovernorCertified: true,
  });
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);

  // Certificate modal
  const [viewingCertificate, setViewingCertificate] = useState<VehicleComplianceRecord | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transport/compliance");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to fetch fleet compliance records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const isAnyModalOpen = !!(targetVehicleForCert || targetVehicleForUpdate || viewingCertificate);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTargetVehicleForCert(null);
        setTargetVehicleForUpdate(null);
        setViewingCertificate(null);
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

  const handleInspectAndCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVehicleForCert) return;
    setIsSubmittingCert(true);
    try {
      const res = await fetch("/api/transport/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INSPECT_AND_CERTIFY",
          vehicleId: targetVehicleForCert.vehicleId,
          officerName,
          inspectionNotes,
        }),
      });
      if (res.ok) {
        setTargetVehicleForCert(null);
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to certify roadworthiness:", err);
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const handleOpenUpdateModal = (veh: VehicleComplianceRecord) => {
    setTargetVehicleForUpdate(veh);
    setUpdateForm({
      fitnessExpiryDate: veh.fitnessExpiryDate,
      pucExpiryDate: veh.pucExpiryDate,
      insuranceExpiryDate: veh.insuranceExpiryDate,
      driverLicenseExpiry: veh.driverLicenseExpiry,
      speedGovernorCertified: veh.speedGovernorCertified,
    });
  };

  const handleSaveDocumentUpdates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVehicleForUpdate) return;
    setIsSubmittingUpdate(true);
    try {
      const res = await fetch("/api/transport/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_DOCUMENTS",
          vehicleId: targetVehicleForUpdate.vehicleId,
          ...updateForm,
        }),
      });
      if (res.ok) {
        setTargetVehicleForUpdate(null);
        fetchRecords();
      }
    } catch (err) {
      console.error("Failed to update certificates:", err);
    } finally {
      setIsSubmittingUpdate(false);
    }
  };

  const filtered = records.filter((r) => {
    if (statusFilter !== "ALL" && r.complianceStatus !== statusFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        r.busNumber.toLowerCase().includes(q) ||
        r.registrationNumber.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl shadow-sm border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Fleet Roster</span>
            <Bus className="h-4 w-4 text-rose-primary" />
          </div>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
            {analytics?.total || records.length}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Passenger buses & university vans</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl shadow-sm border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Certified Roadworthy</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.fullyCompliant || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">100% statutory clearance & seals</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl shadow-sm border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Renewals Due (30D)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-2">
            {analytics?.renewalDue || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">FC or PUC expiring shortly</p>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl shadow-sm border border-border dark:border-charcoal-800">
          <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 uppercase tracking-wider">
            <span>Grounded Deficiencies</span>
            <AlertOctagon className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400 mt-2">
            {analytics?.grounded || 0}
          </div>
          <p className="text-xs text-charcoal-500 mt-1">Safety lockout active</p>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl shadow-sm border border-border dark:border-charcoal-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search bus number, registration plate, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700"
          >
            <option value="ALL">All Compliance Statuses</option>
            <option value="FULLY_COMPLIANT_FIT">Fully Compliant & Roadworthy</option>
            <option value="RENEWAL_DUE_30_DAYS">Renewal Due (Within 30 Days)</option>
            <option value="GROUNDED_NON_COMPLIANT">Grounded / Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-charcoal-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading transport compliance registry...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-charcoal-900 rounded-2xl border border-dashed border-border dark:border-charcoal-800">
          <Bus className="h-10 w-10 text-charcoal-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-charcoal-800 dark:text-ivory-200">No Vehicles Found</h3>
          <p className="text-xs text-charcoal-500 mt-1">Adjust your search query or status filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-soft dark:bg-charcoal-800/80 border-b border-border dark:border-charcoal-800 text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Vehicle & Registration</th>
                  <th className="py-3 px-4">Commercial Driver</th>
                  <th className="py-3 px-4">Fitness Certificate (FC)</th>
                  <th className="py-3 px-4">PUC & Insurance</th>
                  <th className="py-3 px-4">Speed Gov & Safety</th>
                  <th className="py-3 px-4">Roadworthiness</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800/60">
                {filtered.map((item) => (
                  <tr key={item.vehicleId} className="hover:bg-surface-soft/40 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{item.busNumber}</div>
                      <div className="font-mono text-[10px] text-rose-primary font-bold">
                        {item.registrationNumber} • {item.seatingCapacity} Seats
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-charcoal-800 dark:text-ivory-200">{item.driverName}</div>
                      <div className="text-[10px] text-charcoal-500">
                        {item.driverLicenseNumber} (Exp: {item.driverLicenseExpiry})
                      </div>
                      {item.driverMedicalFitnessValid ? (
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                          ✓ Medical Fit
                        </span>
                      ) : (
                        <span className="text-[9px] text-rose-600 font-bold flex items-center gap-0.5">
                          ⚠ Medical Exam Expired
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-charcoal-900 dark:text-ivory-100">{item.fitnessCertificateNumber}</div>
                      <div className="text-[10px] text-charcoal-500">Expires: {item.fitnessExpiryDate}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[11px] font-medium text-charcoal-800 dark:text-ivory-200">
                        PUC: {item.pucExpiryDate}
                      </div>
                      <div className="text-[10px] text-charcoal-500">Ins: {item.insuranceExpiryDate}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {item.speedGovernorCertified ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            40km/h GOV
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            NO GOVERNOR
                          </span>
                        )}
                        {item.ais140GpsCompliant && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            AIS-140 GPS
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.complianceStatus === "FULLY_COMPLIANT_FIT"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : item.complianceStatus === "RENEWAL_DUE_30_DAYS"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {item.complianceStatus === "FULLY_COMPLIANT_FIT" && <CheckCircle2 className="h-3 w-3" />}
                        {item.complianceStatus === "GROUNDED_NON_COMPLIANT" && <AlertOctagon className="h-3 w-3" />}
                        {item.complianceStatus.replace(/_/g, " ")}
                      </span>
                      {item.complianceSeal && (
                        <div className="text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                          ✓ SEALED
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenUpdateModal(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-50 hover:text-rose-600 border border-border dark:border-charcoal-700 font-semibold"
                        >
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Renew</span>
                        </button>
                        <button
                          onClick={() => setTargetVehicleForCert(item)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-rose-50 hover:text-rose-600 border border-border dark:border-charcoal-700 font-semibold"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Audit</span>
                        </button>
                        {item.complianceSeal && (
                          <button
                            onClick={() => setViewingCertificate(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-primary hover:bg-rose-dark text-white font-semibold shadow-xs"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Certificate</span>
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

      {/* Modal: Roadworthiness Safety Audit & Seal */}
      {targetVehicleForCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Conduct Roadworthiness & Safety Inspection"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetVehicleForCert(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Conduct Roadworthiness & Safety Inspection
                </h3>
              </div>
              <button
                onClick={() => setTargetVehicleForCert(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-surface-soft dark:bg-charcoal-800 rounded-xl text-xs space-y-1">
              <p>
                <strong>Vehicle:</strong> {targetVehicleForCert.busNumber} ({targetVehicleForCert.registrationNumber})
              </p>
              <p>
                <strong>Driver:</strong> {targetVehicleForCert.driverName} •{" "}
                <strong>FC Expiry:</strong> {targetVehicleForCert.fitnessExpiryDate}
              </p>
            </div>

            <form onSubmit={handleInspectAndCertify} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Certifying Transport Safety Officer</label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Safety Officer Remarks</label>
                <textarea
                  rows={3}
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setTargetVehicleForCert(null)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingCert ? "Auditing..." : "Certify Roadworthiness"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Certificates & Expiry */}
      {targetVehicleForUpdate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Update RTO & Insurance Documents"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetVehicleForUpdate(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-rose-primary" />
                <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  Update RTO & Insurance Documents
                </h3>
              </div>
              <button
                onClick={() => setTargetVehicleForUpdate(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocumentUpdates} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fitness Certificate (FC) Expiry</label>
                  <input
                    type="date"
                    required
                    value={updateForm.fitnessExpiryDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, fitnessExpiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">PUC Emissions Expiry</label>
                  <input
                    type="date"
                    required
                    value={updateForm.pucExpiryDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, pucExpiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Commercial Insurance Expiry</label>
                  <input
                    type="date"
                    required
                    value={updateForm.insuranceExpiryDate}
                    onChange={(e) => setUpdateForm({ ...updateForm, insuranceExpiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Driver Commercial DL Expiry</label>
                  <input
                    type="date"
                    required
                    value={updateForm.driverLicenseExpiry}
                    onChange={(e) => setUpdateForm({ ...updateForm, driverLicenseExpiry: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-800 border"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="govCert"
                  checked={updateForm.speedGovernorCertified}
                  onChange={(e) => setUpdateForm({ ...updateForm, speedGovernorCertified: e.target.checked })}
                  className="rounded text-rose-primary"
                />
                <label htmlFor="govCert" className="font-semibold text-charcoal-800 dark:text-ivory-200">
                  Electronic Speed Governor calibrated & sealed to 40 km/h
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setTargetVehicleForUpdate(null)}
                  className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUpdate}
                  className="px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingUpdate ? "Saving..." : "Save Updated Records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Roadworthiness Certificate */}
      {viewingCertificate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fleet Roadworthiness and Regulatory Compliance Certificate"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingCertificate(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl max-w-xl w-full p-8 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="text-center space-y-1 pb-4 border-b border-border dark:border-charcoal-800">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                FLEET ROADWORTHINESS & REGULATORY COMPLIANCE CERTIFICATE
              </h2>
              <p className="text-xs text-charcoal-500 font-semibold tracking-wider uppercase">
                Apex Institute of Technology • Department of Transportation & Fleet Safety
              </p>
            </div>

            <div className="space-y-3 text-xs text-charcoal-700 dark:text-ivory-300">
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Vehicle Unit:</span>
                <span className="font-bold">{viewingCertificate.busNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Registration Mark:</span>
                <span className="font-mono font-bold text-rose-primary">{viewingCertificate.registrationNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Passenger Capacity:</span>
                <span>{viewingCertificate.seatingCapacity} Seated Scholars</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Commercial Driver:</span>
                <span>{viewingCertificate.driverName} ({viewingCertificate.driverLicenseNumber})</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">RTO Fitness Cert (FC):</span>
                <span>{viewingCertificate.fitnessCertificateNumber} (Valid to {viewingCertificate.fitnessExpiryDate})</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-border/60 dark:border-charcoal-800">
                <span className="font-semibold text-charcoal-500">Cryptographic Roadworthiness Seal:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {viewingCertificate.complianceSeal}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300">
              ✓ Verified: Vehicle speed governor calibrated, emergency exits functional, fire extinguisher and first aid kits inspected, and driver background check cleared.
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setViewingCertificate(null)}
                className="px-4 py-2 bg-surface-soft dark:bg-charcoal-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Regulatory Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
