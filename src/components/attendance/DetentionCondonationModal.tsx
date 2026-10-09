"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Printer,
  X,
  Search,
  Filter,
  CreditCard,
  Building2,
  Calendar,
  Percent,
  Clock,
  Sparkles,
} from "lucide-react";

interface DetainedStudent {
  studentRoll: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  status: string;
  category: string;
  shortfallClasses: number;
}

interface CondonationRecord {
  id: string;
  studentRoll: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  attendancePercentage: number;
  status: string;
  medicalCertRef: string;
  hospitalName: string;
  condonationFeeReceipt: string;
  condonationFeeAmount: number;
  approvedBy: string;
  approvedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
  canApprove: boolean;
}

export function DetentionCondonationModal({
  isOpen,
  onClose,
  showToast,
  canApprove,
}: Props) {
  const [detainedStudents, setDetainedStudents] = useState<DetainedStudent[]>([]);
  const [condonations, setCondonations] = useState<CondonationRecord[]>([]);
  const [statutoryThreshold, setStatutoryThreshold] = useState(75.0);
  const [condonationFloor, setCondonationFloor] = useState(65.0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Apply Condonation Form State
  const [selectedStudent, setSelectedStudent] = useState<DetainedStudent | null>(null);
  const [medicalCertRef, setMedicalCertRef] = useState("MED-HSP-2026-9041");
  const [hospitalName, setHospitalName] = useState("Apollo Multi-Specialty University Health Center");
  const [feeReceipt, setFeeReceipt] = useState("REC-CND-7712");
  const [approvingNotes, setApprovingNotes] = useState("Approved by Academic Senate Standing Committee");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDetentionData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/attendance/detention");
      const data = await res.json();
      if (data.success && data.data) {
        setDetainedStudents(data.data.sampleDetainedStudents || []);
        setCondonations(data.data.condonations || []);
        setStatutoryThreshold(data.data.statutoryThresholdPercent || 75.0);
        setCondonationFloor(data.data.medicalCondonationFloorPercent || 65.0);
      }
    } catch (err) {
      console.error("Failed to load detention data", err);
      showToast("Unable to fetch attendance detention list", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDetentionData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyCondonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/attendance/detention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_CONDONATION",
          studentRoll: selectedStudent.studentRoll,
          studentName: selectedStudent.studentName,
          courseCode: selectedStudent.courseCode,
          courseTitle: selectedStudent.courseTitle,
          attendancePercentage: selectedStudent.attendancePercentage,
          medicalCertRef,
          hospitalName,
          condonationFeeReceipt: feeReceipt,
          approvedBy: approvingNotes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Medical Condonation granted successfully!", "success");
        if (data.condonation) {
          setCondonations([data.condonation, ...condonations]);
        }
        if (data.detainedStudents) {
          setDetainedStudents(data.detainedStudents);
        } else {
          setDetainedStudents((prev) =>
            prev.map((s) =>
              s.studentRoll === selectedStudent.studentRoll
                ? { ...s, status: "CONDONED_EXAM_PERMITTED" }
                : s
            )
          );
        }
        setSelectedStudent(null);
      } else {
        showToast(data.error || "Failed to record medical condonation", "error");
      }
    } catch (err) {
      console.error("Condonation error", err);
      showToast("Network error submitting condonation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = detainedStudents.filter((s) => {
    const matchesSearch =
      s.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.courseCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "CONDONABLE" && s.attendancePercentage >= condonationFloor && s.attendancePercentage < statutoryThreshold) ||
      (statusFilter === "DETAINED" && s.attendancePercentage < condonationFloor) ||
      (statusFilter === "CONDONED" && s.status === "CONDONED_EXAM_PERMITTED");

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative my-8 max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-border/60 dark:border-charcoal-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  Academic Senate Attendance Detention &amp; Condonation Center
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    Statutory &lt;75% Cutoff
                  </span>
                </h3>
                <p className="text-xs text-charcoal-500">
                  UGC/Senate Ordinance: Students with attendance between 65%&ndash;74.9% may apply for medical condonation. Students below 65% are strictly detained.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Stat Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700">
              <span className="text-[10px] uppercase font-bold text-charcoal-500">Statutory Threshold</span>
              <div className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                {statutoryThreshold}%
              </div>
              <span className="text-[10px] text-charcoal-400">Mandatory Attendance</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20">
              <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400">
                Condonable Window
              </span>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-300 mt-0.5">
                {condonationFloor}% &ndash; {statutoryThreshold - 0.1}%
              </div>
              <span className="text-[10px] text-orange-600/80">Eligible via Medical Cert</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                Critical Detention
              </span>
              <div className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                &lt; {condonationFloor}%
              </div>
              <span className="text-[10px] text-rose-600/80">Barred from Examinations</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                Granted Condonations
              </span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {condonations.length}
              </div>
              <span className="text-[10px] text-emerald-600/80">Hall Ticket Unblocked</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-ivory-50 dark:bg-charcoal-800/40 border border-border dark:border-charcoal-800 mb-4">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by student roll, name, course code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="ALL">All Categories</option>
                <option value="CONDONABLE">Condonable Window (65-75%)</option>
                <option value="DETAINED">Critical Detained (&lt;65%)</option>
                <option value="CONDONED">Granted Condonation</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Gazette
              </button>
            </div>
          </div>

          {/* Detained Students Registry Table */}
          <div className="overflow-x-auto max-h-[42vh] overflow-y-auto border border-border/60 dark:border-charcoal-800 rounded-2xl">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-charcoal-400 animate-pulse">
                Auditing institutional attendance logs...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-xs text-charcoal-400">
                No students found in the selected detention filter.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-ivory-100 dark:bg-charcoal-800 z-10">
                  <tr className="border-b border-border dark:border-charcoal-700 text-[10px] font-bold text-charcoal-500 uppercase">
                    <th className="py-2.5 px-3">Roll &amp; Candidate</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Attended / Total</th>
                    <th className="py-2.5 px-3">Percentage</th>
                    <th className="py-2.5 px-3">Ordinance Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 dark:divide-charcoal-800/60 bg-white dark:bg-charcoal-900">
                  {filteredStudents.map((s) => {
                    const isCondoned = s.status === "CONDONED_EXAM_PERMITTED";
                    const isEligibleForCondonation =
                      !isCondoned &&
                      s.attendancePercentage >= condonationFloor &&
                      s.attendancePercentage < statutoryThreshold;
                    const isStrictlyDetained =
                      !isCondoned && s.attendancePercentage < condonationFloor;

                    return (
                      <tr key={s.studentRoll} className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40">
                        <td className="py-3 px-3">
                          <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                            {s.studentName}
                          </div>
                          <div className="text-[10px] font-mono text-charcoal-400">
                            {s.studentRoll}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {s.courseCode}
                          </span>
                          <div className="text-[10px] text-charcoal-500 truncate max-w-[150px]">
                            {s.courseTitle}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-charcoal-800 dark:text-ivory-200">
                            {s.attendedClasses} / {s.totalClasses}
                          </span>
                          <div className="text-[10px] text-rose-500">
                            Shortfall: {s.shortfallClasses} classes
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-xs font-bold ${
                                isCondoned
                                  ? "text-emerald-600"
                                  : isStrictlyDetained
                                  ? "text-rose-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {s.attendancePercentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-1.5 w-24 bg-ivory-200 dark:bg-charcoal-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${
                                isCondoned
                                  ? "bg-emerald-500"
                                  : isStrictlyDetained
                                  ? "bg-rose-500"
                                  : "bg-orange-500"
                              }`}
                              style={{ width: `${s.attendancePercentage}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {isCondoned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Condoned (Exam Allowed)
                            </span>
                          ) : isStrictlyDetained ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <XCircle className="h-2.5 w-2.5" />
                              Strictly Detained (&lt;65%)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Condonable (65&ndash;75%)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          {isCondoned ? (
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Waiver Granted ✓
                            </span>
                          ) : isEligibleForCondonation && canApprove ? (
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 transition-all cursor-pointer"
                            >
                              <FileCheck className="h-3 w-3" />
                              Apply Condonation
                            </button>
                          ) : (
                            <span className="text-[10px] text-charcoal-400">
                              No Waiver Permitted
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-xs text-charcoal-500">
          <span>Official Senate Examination Detention Registry &bull; Ordinance Section 12-A</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
          >
            Close Center
          </button>
        </div>

        {/* APPLY CONDONATION SUB-MODAL */}
        {selectedStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-xs">
            <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 dark:border-charcoal-800">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="h-5 w-5 text-orange-500" />
                  <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Grant Medical Condonation Waiver
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleApplyCondonation} className="space-y-3.5 my-4">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
                  <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                    {selectedStudent.studentName} ({selectedStudent.studentRoll})
                  </div>
                  <div className="text-[11px] text-charcoal-600 dark:text-charcoal-300 mt-0.5">
                    Course: {selectedStudent.courseCode} &bull; Attendance: {selectedStudent.attendancePercentage.toFixed(1)}% (Shortfall: {selectedStudent.shortfallClasses} classes)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Registered Medical Certificate No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={medicalCertRef}
                    onChange={(e) => setMedicalCertRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                    Issuing Hospital / Clinic
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                      Condonation Fee ($25)
                    </label>
                    <input
                      type="text"
                      required
                      value={feeReceipt}
                      onChange={(e) => setFeeReceipt(e.target.value)}
                      placeholder="Receipt Ref"
                      className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                      Approving Authority
                    </label>
                    <input
                      type="text"
                      required
                      value={approvingNotes}
                      onChange={(e) => setApprovingNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Certifying Waiver..." : "Grant Condonation & Allow Exam"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
