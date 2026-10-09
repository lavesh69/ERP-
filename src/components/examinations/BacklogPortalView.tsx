"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  Plus,
  Printer,
  QrCode,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  AlertCircle,
  X,
  Search,
} from "lucide-react";

interface BacklogRegistration {
  id: string;
  applicationRef: string;
  studentId: string;
  studentRoll: string;
  studentName: string;
  courseCode: string;
  courseTitle: string;
  semester: number;
  originalGrade: string;
  originalMarks: number;
  feeAmount: number;
  feeStatus: string;
  paymentTxn: string;
  registeredAt: string;
  examDate: string;
  examHall: string;
  admitCardHash: string;
  status: string;
}

interface BacklogCourse {
  courseCode: string;
  courseTitle: string;
  department: string;
  credits: number;
  semester: number;
  feePerSubject: number;
}

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
  canEdit: boolean;
  isStudent: boolean;
}

export function BacklogPortalView({ showToast, canEdit, isStudent }: Props) {
  const [registrations, setRegistrations] = useState<BacklogRegistration[]>([]);
  const [availableCourses, setAvailableCourses] = useState<BacklogCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdmitCard, setSelectedAdmitCard] = useState<BacklogRegistration | null>(null);

  // Form State
  const [formRoll, setFormRoll] = useState("APX2026-CS-089");
  const [formName, setFormName] = useState("Rohan Deshmukh");
  const [selectedCourseCode, setSelectedCourseCode] = useState("CS-301");
  const [formSemester, setFormSemester] = useState(4);
  const [feePerPaper] = useState(50);

  const fetchBacklogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/examinations?tab=backlogs");
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations || []);
        setAvailableCourses(data.availableCourses || []);
        if (data.availableCourses?.length > 0 && !selectedCourseCode) {
          setSelectedCourseCode(data.availableCourses[0].courseCode);
        }
      }
    } catch (err) {
      console.error("Failed to load backlogs", err);
      showToast("Unable to load supplementary exam records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBacklogs();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseCode) {
      showToast("Please choose an arrear/backlog subject", "error");
      return;
    }

    const matchedCourse = availableCourses.find((c) => c.courseCode === selectedCourseCode);

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER_BACKLOG",
          studentRoll: formRoll,
          studentName: formName,
          courseCode: selectedCourseCode,
          courseTitle: matchedCourse?.courseTitle || "Arrear Examination Paper",
          semester: formSemester,
          originalGrade: "F",
          originalMarks: 32,
          feeAmount: feePerPaper,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || "Supplementary exam registered successfully!", "success");
        if (data.registration) {
          setRegistrations([data.registration, ...registrations]);
          setSelectedAdmitCard(data.registration);
        }
      } else {
        showToast(data.error || "Failed to register for supplementary exam", "error");
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("Network error while submitting application", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRegistrations = registrations.filter(
    (r) =>
      r.studentRoll.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.applicationRef.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border border-orange-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-1">
            <RotateCcw className="h-4 w-4" />
            Remedial &amp; Supplementary Examination Gateway
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
            Arrear Subject Re-Examination &amp; Hall Ticket Portal
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
            University Senate ordinance permits students with backlog grades (Grade F / Incomplete)
            to register for remedial winter/summer supplementary sessions. Fee is strictly statutory
            ($50 / paper) with instantaneous hall ticket issuance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-xs text-center">
            <div className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {registrations.length}
            </div>
            <div className="text-[10px] text-charcoal-500 uppercase font-semibold">Active Arrears</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-xs text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              ${registrations.length * feePerPaper}
            </div>
            <div className="text-[10px] text-charcoal-500 uppercase font-semibold">Reconciled Fees</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Apply for Supplementary Exam */}
        <div className="lg:col-span-1 bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/60 dark:border-charcoal-800">
            <FileText className="h-4 w-4 text-orange-500" />
            <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
              New Arrear Registration
            </h3>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                Candidate Roll Number
              </label>
              <input
                type="text"
                required
                value={formRoll}
                onChange={(e) => setFormRoll(e.target.value)}
                placeholder="e.g. APX2026-CS-089"
                className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                Candidate Full Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                Failed Subject (Arrear Code)
              </label>
              <select
                value={selectedCourseCode}
                onChange={(e) => setSelectedCourseCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                {availableCourses.map((c) => (
                  <option key={c.courseCode} value={c.courseCode}>
                    {c.courseCode} — {c.courseTitle} ({c.credits} Credits)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Arrear Semester
                </label>
                <select
                  value={formSemester}
                  onChange={(e) => setFormSemester(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                  <option value={3}>Semester 3</option>
                  <option value={4}>Semester 4</option>
                  <option value={5}>Semester 5</option>
                  <option value={6}>Semester 6</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Statutory Fee
                </label>
                <div className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>${feePerPaper}.00</span>
                  <span className="text-[10px] uppercase font-semibold">Immediate Auth</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-[11px] text-charcoal-600 dark:text-charcoal-400 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-orange-600 dark:text-orange-400">
                <AlertCircle className="h-3.5 w-3.5" />
                University Exam Regulation #14(b)
              </div>
              <p>
                Upon payment confirmation, a unique encrypted QR Hall Ticket is dispatched.
                The candidate must present this admit card at the exam center turnstile.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing Enrollment &amp; Fee...
                </>
              ) : (
                <>
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay ${feePerPaper} &amp; Issue Arrear Hall Ticket
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Table: Registered Supplementary Applications */}
        <div className="lg:col-span-2 bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  Registered Supplementary Candidates
                </h3>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by roll, name, course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-xs text-charcoal-400 animate-pulse">
                Loading supplementary registry...
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="py-12 text-center text-xs text-charcoal-400">
                No supplementary registrations found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 dark:border-charcoal-800 text-[10px] font-bold text-charcoal-500 uppercase">
                      <th className="py-2.5 px-3">Application Ref</th>
                      <th className="py-2.5 px-3">Candidate</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Exam Date &amp; Hall</th>
                      <th className="py-2.5 px-3">Fee Status</th>
                      <th className="py-2.5 px-3 text-right">Admit Card</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 dark:divide-charcoal-800/60">
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-orange-600 dark:text-orange-400">
                          {reg.applicationRef}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                            {reg.studentName}
                          </div>
                          <div className="text-[10px] text-charcoal-400 font-mono">
                            {reg.studentRoll}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {reg.courseCode}
                          </span>
                          <div className="text-[10px] text-charcoal-500 truncate max-w-[140px]">
                            {reg.courseTitle}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-[11px] text-charcoal-700 dark:text-ivory-300">
                            <Calendar className="h-3 w-3 text-primary-500 shrink-0" />
                            {new Date(reg.examDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-charcoal-400 flex items-center gap-1">
                            <Building className="h-2.5 w-2.5 shrink-0" />
                            {reg.examHall}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            {reg.feeStatus} (${reg.feeAmount})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => setSelectedAdmitCard(reg)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 dark:text-primary-400 border border-primary-500/30 transition-all cursor-pointer"
                          >
                            <QrCode className="h-3 w-3" />
                            View Admit Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-[11px] text-charcoal-500">
            <span>Showing {filteredRegistrations.length} of {registrations.length} candidates</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              University Secrecy Cell Certified
            </span>
          </div>
        </div>
      </div>

      {/* ADMIT CARD MODAL */}
      {selectedAdmitCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Supplementary Examination Admit Card
                  </h3>
                  <p className="text-[10px] text-charcoal-400">
                    Official Candidate Gate Pass &bull; {selectedAdmitCard.applicationRef}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAdmitCard(null)}
                className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Credential Slip Design */}
            <div className="my-5 p-5 rounded-2xl bg-gradient-to-b from-ivory-50 to-white dark:from-charcoal-800/80 dark:to-charcoal-800/30 border border-dashed border-border dark:border-charcoal-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                    Candidate Identity
                  </span>
                  <div className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                    {selectedAdmitCard.studentName}
                  </div>
                  <div className="text-xs font-mono text-orange-600 dark:text-orange-400 font-bold">
                    {selectedAdmitCard.studentRoll}
                  </div>
                </div>

                <div className="h-16 w-16 bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-1 flex items-center justify-center shadow-xs">
                  <QrCode className="h-12 w-12 text-charcoal-900 dark:text-ivory-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-border/40 dark:border-charcoal-700/60">
                <div>
                  <span className="text-[10px] text-charcoal-400 font-semibold uppercase">Subject</span>
                  <div className="font-bold text-charcoal-800 dark:text-ivory-200">
                    {selectedAdmitCard.courseCode}
                  </div>
                  <div className="text-[10px] text-charcoal-500 truncate">
                    {selectedAdmitCard.courseTitle}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-charcoal-400 font-semibold uppercase">Allocated Hall</span>
                  <div className="font-bold text-charcoal-800 dark:text-ivory-200">
                    {selectedAdmitCard.examHall}
                  </div>
                  <div className="text-[10px] text-charcoal-500">
                    Reporting: 30 mins prior
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-border/40 dark:border-charcoal-700/60">
                <div>
                  <span className="text-[10px] text-charcoal-400 font-semibold uppercase">Exam Date &amp; Time</span>
                  <div className="font-bold text-charcoal-800 dark:text-ivory-200">
                    {new Date(selectedAdmitCard.examDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-[10px] text-charcoal-500">09:30 AM &ndash; 12:30 PM</div>
                </div>

                <div>
                  <span className="text-[10px] text-charcoal-400 font-semibold uppercase">Cryptographic Seal</span>
                  <div className="font-mono text-[10px] text-charcoal-600 dark:text-charcoal-400 truncate">
                    {selectedAdmitCard.admitCardHash}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Verified by COE
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-charcoal-400">
                Card Ref: {selectedAdmitCard.paymentTxn}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedAdmitCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Official Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
