"use client";

import React, { useState, useEffect } from "react";
import {
  FileHeart,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Syringe,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Calendar,
  UserCheck,
  Heart,
  QrCode,
  Sparkles,
} from "lucide-react";
import { StudentHealthPassport, FitnessCategory } from "@/lib/clinic/medical-clearance-engine";

export default function MedicalClearanceTab() {
  const [passports, setPassports] = useState<StudentHealthPassport[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("ALL");
  const [fitnessFilter, setFitnessFilter] = useState("ALL");

  // Vaccine modal
  const [targetStudentForVaccine, setTargetStudentForVaccine] = useState<StudentHealthPassport | null>(null);
  const [vaccineForm, setVaccineForm] = useState({
    vaccineName: "Hepatitis B",
    doseDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmittingVaccine, setIsSubmittingVaccine] = useState(false);

  // Certify modal
  const [targetStudentForCert, setTargetStudentForCert] = useState<StudentHealthPassport | null>(null);
  const [certForm, setCertForm] = useState({
    officerName: "Dr. Arvind Swaminathan, MD (Chief Medical Officer)",
    fitnessCategory: "FIT_FOR_ALL" as FitnessCategory,
    physicianNotes: "Comprehensive physical and immunization screening complete. Cleared for all campus and varsity activities.",
  });
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  // Passport modal
  const [viewingPassport, setViewingPassport] = useState<StudentHealthPassport | null>(null);

  const isAnyModalOpen = !!(targetStudentForVaccine || targetStudentForCert || viewingPassport);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setTargetStudentForVaccine(null);
        setTargetStudentForCert(null);
        setViewingPassport(null);
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

  const fetchPassports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clinic/medical-clearance");
      if (res.ok) {
        const data = await res.json();
        setPassports(data.passports || []);
        setAnalytics(data.analytics || null);
      }
    } catch (err) {
      console.error("Failed to fetch health passports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassports();
  }, []);

  const handleRecordVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentForVaccine) return;
    setIsSubmittingVaccine(true);
    try {
      const res = await fetch("/api/clinic/medical-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_IMMUNIZATION",
          studentId: targetStudentForVaccine.studentId,
          ...vaccineForm,
        }),
      });
      if (res.ok) {
        setTargetStudentForVaccine(null);
        fetchPassports();
      }
    } catch (err) {
      console.error("Failed to record immunization:", err);
    } finally {
      setIsSubmittingVaccine(false);
    }
  };

  const handleCertifyFitness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentForCert) return;
    setIsSubmittingCert(true);
    try {
      const res = await fetch("/api/clinic/medical-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CERTIFY_FITNESS",
          studentId: targetStudentForCert.studentId,
          ...certForm,
        }),
      });
      if (res.ok) {
        setTargetStudentForCert(null);
        fetchPassports();
      }
    } catch (err) {
      console.error("Failed to issue medical fitness certificate:", err);
    } finally {
      setIsSubmittingCert(false);
    }
  };

  const filtered = passports.filter((p) => {
    if (complianceFilter !== "ALL" && p.immunizationComplianceStatus !== complianceFilter) return false;
    if (fitnessFilter !== "ALL" && p.fitnessCategory !== fitnessFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        p.studentName.toLowerCase().includes(q) ||
        p.rollNo.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.bloodGroup.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 4 Health Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Health Passports</span>
            <FileHeart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-2">
            {analytics?.total || passports.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Enrolled student medical profiles</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Immunization Compliance</span>
            <Syringe className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {analytics?.complianceRate || 0}%
          </div>
          <p className="text-xs text-slate-500 mt-1">HepB, MMR, Tdap & MenACWY verified</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Fitness Certified</span>
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            {analytics?.certified || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Official cryptographic seals active</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Critical Allergies</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-2">
            {analytics?.allergyCount || 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Anaphylaxis & drug precautions</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student name, roll number, or blood group..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <select
            value={complianceFilter}
            onChange={(e) => setComplianceFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="ALL">All Immunization Statuses</option>
            <option value="COMPLIANT">Fully Compliant</option>
            <option value="PROVISIONAL">Provisional / Incomplete</option>
          </select>

          <select
            value={fitnessFilter}
            onChange={(e) => setFitnessFilter(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="ALL">All Fitness Categories</option>
            <option value="FIT_FOR_ALL">Fit for All (Hostel & Varsity)</option>
            <option value="RESTRICTED_SPORTS">Restricted High-Impact Sports</option>
            <option value="FIT_HOSTEL_ONLY">Fit for Hostel Only</option>
            <option value="MEDICAL_HOLD">Medical Hold</option>
          </select>
        </div>
      </div>

      {/* Student Health Passports Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-xs text-slate-500">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading student health passports...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileHeart className="h-10 w-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Health Passports Found</h3>
          <p className="text-xs text-slate-500 mt-1">Adjust search parameters or refresh the registry.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Student & Roll No</th>
                  <th className="py-3 px-4">Blood Group</th>
                  <th className="py-3 px-4">Allergies & Pre-existing</th>
                  <th className="py-3 px-4">Vaccine Compliance</th>
                  <th className="py-3 px-4">Statutory Fitness</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">{p.studentName}</div>
                      <div className="font-mono text-[10px] text-slate-500">{p.rollNo} • {p.department}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {p.knownAllergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.knownAllergies.map((a, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            >
                              ⚠ {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">None reported</span>
                      )}
                      {p.chronicConditions.length > 0 && (
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                          {p.chronicConditions.join(", ")}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.immunizationComplianceStatus === "COMPLIANT"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {p.immunizationComplianceStatus === "COMPLIANT" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        {p.immunizationComplianceStatus}
                      </span>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {p.immunizations.filter((i) => i.compliant).length} / {p.immunizations.length} vaccines verified
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.fitnessCategory === "FIT_FOR_ALL"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : p.fitnessCategory === "RESTRICTED_SPORTS"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        }`}
                      >
                        {p.fitnessCategory.replace(/_/g, " ")}
                      </span>
                      {p.medicalClearanceSeal && (
                        <div className="text-[9px] font-mono text-emerald-600 font-bold mt-0.5">
                          ✓ SEALED
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setTargetStudentForVaccine(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold"
                        >
                          <Syringe className="h-3.5 w-3.5 text-rose-600" />
                          <span>Dose</span>
                        </button>
                        <button
                          onClick={() => setTargetStudentForCert(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Certify</span>
                        </button>
                        <button
                          onClick={() => setViewingPassport(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                        >
                          <FileHeart className="h-3.5 w-3.5" />
                          <span>Passport</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Record Immunization Dose */}
      {targetStudentForVaccine && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Record Immunization Dose"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetStudentForVaccine(null);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Syringe className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Record Immunization Dose
                </h3>
              </div>
              <button
                onClick={() => setTargetStudentForVaccine(null)}
                className="text-slate-500 hover:text-slate-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <span className="font-bold">{targetStudentForVaccine.studentName}</span> (
              {targetStudentForVaccine.rollNo})
            </div>

            <form onSubmit={handleRecordVaccine} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Vaccine Classification</label>
                <select
                  value={vaccineForm.vaccineName}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, vaccineName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Hepatitis B">Hepatitis B (Recombinant)</option>
                  <option value="MMR (Measles, Mumps, Rubella)">MMR (Measles, Mumps, Rubella)</option>
                  <option value="Tdap (Tetanus Booster)">Tdap (Tetanus, Diphtheria, Pertussis)</option>
                  <option value="Meningococcal (MenACWY)">Meningococcal (MenACWY - Residential)</option>
                  <option value="Influenza / COVID Booster">Annual Influenza / COVID Booster</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Dose Administration Date</label>
                <input
                  type="date"
                  required
                  value={vaccineForm.doseDate}
                  onChange={(e) => setVaccineForm({ ...vaccineForm, doseDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetStudentForVaccine(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVaccine}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingVaccine ? "Saving..." : "Log Verified Dose"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Certify Medical Fitness */}
      {targetStudentForCert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Issue Statutory Medical Fitness Clearance"
          onClick={(e) => {
            if (e.target === e.currentTarget) setTargetStudentForCert(null);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Issue Statutory Medical Fitness Clearance
                </h3>
              </div>
              <button
                onClick={() => setTargetStudentForCert(null)}
                className="text-slate-500 hover:text-slate-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
              <p>
                <strong>Student:</strong> {targetStudentForCert.studentName} ({targetStudentForCert.rollNo})
              </p>
              <p>
                <strong>Blood Group:</strong> {targetStudentForCert.bloodGroup} •{" "}
                <strong>Allergies:</strong> {targetStudentForCert.knownAllergies.join(", ") || "None"}
              </p>
            </div>

            <form onSubmit={handleCertifyFitness} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Certifying Medical Officer</label>
                <input
                  type="text"
                  required
                  value={certForm.officerName}
                  onChange={(e) => setCertForm({ ...certForm, officerName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Fitness Clearance Classification</label>
                <select
                  value={certForm.fitnessCategory}
                  onChange={(e) => setCertForm({ ...certForm, fitnessCategory: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="FIT_FOR_ALL">Fit for All (Hostel Residence + Competitive Sports)</option>
                  <option value="FIT_HOSTEL_ONLY">Fit for Hostel Only (Exempt from Heavy Athletics)</option>
                  <option value="RESTRICTED_SPORTS">Restricted High-Impact Sports</option>
                  <option value="MEDICAL_HOLD">Medical Hold (Requires Specialist Review)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physician Clinical Remarks</label>
                <textarea
                  rows={3}
                  value={certForm.physicianNotes}
                  onChange={(e) => setCertForm({ ...certForm, physicianNotes: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTargetStudentForCert(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  {isSubmittingCert ? "Sealing..." : "Affix Seal & Issue Certificate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Student Health Passport Card */}
      {viewingPassport && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Institutional Health Passport"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingPassport(null);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-8 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-600 text-white rounded-2xl">
                  <FileHeart className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    INSTITUTIONAL HEALTH PASSPORT
                  </h2>
                  <p className="text-[11px] text-slate-500">Apex Institute Campus Infirmary & Health Services</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPassport(null)}
                className="text-slate-500 hover:text-slate-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Student Name</p>
                <p className="font-bold text-sm text-slate-900 dark:text-white">{viewingPassport.studentName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{viewingPassport.rollNo} • {viewingPassport.department}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Blood Group & Emergency</p>
                <p className="font-bold text-sm text-rose-600">{viewingPassport.bloodGroup}</p>
                <p className="text-slate-500 text-[11px]">{viewingPassport.emergencyContact}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                Immunization Register
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {viewingPassport.immunizations.map((imm, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{imm.vaccineName}</p>
                      <p className="text-[10px] text-slate-500">
                        {imm.dosesReceived}/{imm.dosesRequired} doses ({imm.lastDoseDate})
                      </p>
                    </div>
                    {imm.compliant ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 dark:text-emerald-200">
                  Fitness Clearance: {viewingPassport.fitnessCategory.replace(/_/g, " ")}
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {viewingPassport.medicalClearanceSeal || "PROVISIONAL"}
                </span>
              </div>
              {viewingPassport.physicianNotes && (
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic">
                  "{viewingPassport.physicianNotes}"
                </p>
              )}
              <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 pt-1 border-t border-emerald-200 dark:border-emerald-800">
                <span>Certified By: {viewingPassport.certifiedBy || "Campus Medical Officer"}</span>
                <span>Valid: 1 Academic Year</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setViewingPassport(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Health Passport</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
