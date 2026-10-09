"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Users,
  ShieldCheck,
  AlertCircle,
  Plus,
  Sparkles,
  Printer,
  X,
  Search,
  Filter,
  Check,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface ElectiveCourse {
  code: string;
  title: string;
  type: string;
  department: string;
  faculty: string;
  credits: number;
  maxSeats: number;
  enrolledCount: number;
  schedule: string;
  prerequisites: string;
  description: string;
}

interface StudentRegistration {
  id: string;
  studentRoll: string;
  studentName: string;
  registeredTerm: string;
  priorityChoices: Array<{
    preference: number;
    courseCode: string;
    courseTitle?: string;
    credits?: number;
    status: string;
  }>;
  totalCreditsRegistered: number;
  status: string;
  enrolledAt: string;
  sealHash: string;
}

interface Props {
  showToast: (msg: string, type?: "success" | "error" | "warning" | "info") => void;
  currentUser: any;
}

export function CBCSElectiveChoiceView({ showToast, currentUser }: Props) {
  const [electives, setElectives] = useState<ElectiveCourse[]>([]);
  const [semesterTerm, setSemesterTerm] = useState("Fall 2026 - CBCS Phase II");
  const [minCredits, setMinCredits] = useState(18);
  const [maxCredits, setMaxCredits] = useState(24);
  const [deadline, setDeadline] = useState("2026-10-31T23:59:59Z");
  const [pastRegistrations, setPastRegistrations] = useState<StudentRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");

  // Student Choice Selections
  const [choice1, setChoice1] = useState<string>("OE-501");
  const [choice2, setChoice2] = useState<string>("PE-601");
  const [choice3, setChoice3] = useState<string>("OE-502");
  const [candidateRoll, setCandidateRoll] = useState(
    currentUser?.email?.includes("student") ? "APX2026-CS-042" : "APX2026-CS-042"
  );
  const [candidateName, setCandidateName] = useState(
    currentUser?.fullName || currentUser?.firstName || "Alex Rivera"
  );

  // Success Slip Modal
  const [receiptModal, setReceiptModal] = useState<StudentRegistration | null>(null);

  const fetchElectiveData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/courses/registration");
      const data = await res.json();
      if (data.success && data.data) {
        setElectives(data.data.availableElectives || []);
        setSemesterTerm(data.data.semesterTerm || "Fall 2026");
        setMinCredits(data.data.minCreditsRequired || 18);
        setMaxCredits(data.data.maxCreditsAllowed || 24);
        setDeadline(data.data.registrationDeadline || "2026-10-31");
        setPastRegistrations(data.data.studentRegistrations || []);
      }
    } catch (err) {
      console.error("Elective fetch error", err);
      showToast("Unable to fetch elective options", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchElectiveData();
  }, []);

  const calculateTotalCredits = () => {
    const baseCoreCredits = 14; // Mandatory core subjects
    const c1 = electives.find((e) => e.code === choice1)?.credits || 0;
    const c2 = electives.find((e) => e.code === choice2)?.credits || 0;
    return baseCoreCredits + c1 + c2;
  };

  const totalCalculatedCredits = calculateTotalCredits();
  const isCreditCompliant =
    totalCalculatedCredits >= minCredits && totalCalculatedCredits <= maxCredits;

  const handleSubmitChoices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choice1 || !choice2) {
      showToast("Please pick at least your 1st and 2nd elective preferences", "error");
      return;
    }
    if (choice1 === choice2 || choice1 === choice3 || (choice2 && choice2 === choice3)) {
      showToast("Please choose different subjects for your preferences", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        action: "SUBMIT_CHOICE_FILLING",
        studentRoll: candidateRoll,
        studentName: candidateName,
        totalCredits: totalCalculatedCredits,
        choices: [
          { preference: 1, courseCode: choice1 },
          { preference: 2, courseCode: choice2 },
          ...(choice3 ? [{ preference: 3, courseCode: choice3 }] : []),
        ],
      };

      const res = await fetch("/api/courses/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("CBCS Course Registration submitted successfully!", "success");
        if (data.registration) {
          setReceiptModal(data.registration);
          setPastRegistrations([data.registration, ...pastRegistrations]);
        }
        if (data.availableElectives) {
          setElectives(data.availableElectives);
        }
      } else {
        showToast(data.error || "Failed to submit course choices", "error");
      }
    } catch (err) {
      console.error("Registration error", err);
      showToast("Network error submitting registration", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredElectives = electives.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.faculty.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedTypeFilter === "ALL" || e.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & CBCS Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <Sparkles className="h-4 w-4" />
            Choice Based Credit System (CBCS) &bull; {semesterTerm}
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">
            Open &amp; Professional Elective Choice Filling Portal
          </h2>
          <p className="text-xs text-charcoal-600 dark:text-charcoal-300 mt-1 max-w-2xl leading-relaxed">
            In compliance with NEP/UGC CBCS guidelines, scholars select Open Electives across departments
            and discipline-specific Professional Electives. Seats are allotted on a first-preference,
            merit-and-seat-quota basis with real-time seat lock.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-xs text-center">
            <div className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
              {totalCalculatedCredits} / {maxCredits}
            </div>
            <div className="text-[10px] text-charcoal-500 uppercase font-semibold">Semester Credits</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-xs text-center">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {electives.length}
            </div>
            <div className="text-[10px] text-charcoal-500 uppercase font-semibold">Offered Courses</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Elective Options Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-charcoal-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search electives by title, code, instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="ALL">All Elective Types</option>
                <option value="OPEN_ELECTIVE">Open Electives (Interdisciplinary)</option>
                <option value="PROFESSIONAL_ELECTIVE">Professional Electives</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-charcoal-400 animate-pulse">
              Loading elective options...
            </div>
          ) : filteredElectives.length === 0 ? (
            <div className="py-12 text-center text-xs text-charcoal-400">
              No elective courses match your search criteria.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredElectives.map((course) => {
                const isFull = course.enrolledCount >= course.maxSeats;
                const percentFilled = Math.min(
                  100,
                  Math.round((course.enrolledCount / course.maxSeats) * 100)
                );

                return (
                  <div
                    key={course.code}
                    className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 hover:border-emerald-500/40 transition-all shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                          {course.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            course.type === "OPEN_ELECTIVE"
                              ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {course.type.replace("_", " ")}
                        </span>
                        <span className="text-xs font-bold text-charcoal-500">
                          &bull; {course.credits} Credits
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setChoice1(course.code);
                            showToast(`Set ${course.code} as 1st Preference`, "info");
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            choice1 === course.code
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          }`}
                        >
                          {choice1 === course.code ? "1st Choice ✓" : "Set 1st Choice"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setChoice2(course.code);
                            showToast(`Set ${course.code} as 2nd Preference`, "info");
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            choice2 === course.code
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          }`}
                        >
                          {choice2 === course.code ? "2nd Choice ✓" : "Set 2nd Choice"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                        {course.title}
                      </h4>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-charcoal-500 pt-1">
                      <div>
                        <span className="font-semibold text-charcoal-700 dark:text-ivory-300">Department:</span>{" "}
                        {course.department}
                      </div>
                      <div>
                        <span className="font-semibold text-charcoal-700 dark:text-ivory-300">Faculty:</span>{" "}
                        {course.faculty}
                      </div>
                      <div>
                        <span className="font-semibold text-charcoal-700 dark:text-ivory-300">Timing:</span>{" "}
                        {course.schedule}
                      </div>
                    </div>

                    {/* Seat Occupancy Meter */}
                    <div className="pt-2 border-t border-border/40 dark:border-charcoal-800/60">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-charcoal-700 dark:text-ivory-300 flex items-center gap-1">
                          <Users className="h-3 w-3 text-emerald-500" />
                          Seat Capacity: {course.enrolledCount} of {course.maxSeats} Enrolled
                        </span>
                        <span
                          className={`font-bold ${
                            isFull
                              ? "text-rose-600"
                              : percentFilled > 80
                              ? "text-orange-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {isFull ? "CAPACITY REACHED" : `${course.maxSeats - course.enrolledCount} Seats Available`}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-ivory-200 dark:bg-charcoal-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFull
                              ? "bg-rose-500"
                              : percentFilled > 80
                              ? "bg-orange-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${percentFilled}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Choice Filing Submission Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-border/60 dark:border-charcoal-800">
              <Award className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                Your CBCS Registration Card
              </h3>
            </div>

            <form onSubmit={handleSubmitChoices} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Candidate Roll Number
                </label>
                <input
                  type="text"
                  required
                  value={candidateRoll}
                  onChange={(e) => setCandidateRoll(e.target.value)}
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
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              {/* Priority Choices Summary */}
              <div className="space-y-2 pt-2 border-t border-border/40 dark:border-charcoal-800/60">
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <span>1st Priority Choice</span>
                    <span className="font-mono">{choice1 || "None Selected"}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-500 truncate mt-0.5">
                    {electives.find((e) => e.code === choice1)?.title || "Select from catalog on left"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-400">
                    <span>2nd Priority Choice</span>
                    <span className="font-mono">{choice2 || "None Selected"}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-500 truncate mt-0.5">
                    {electives.find((e) => e.code === choice2)?.title || "Select from catalog on left"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                  <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-400">
                    <span>3rd Reserve / Backup Choice</span>
                    <span className="font-mono">{choice3 || "None Selected"}</span>
                  </div>
                  <div className="text-[10px] text-charcoal-500 truncate mt-0.5">
                    {electives.find((e) => e.code === choice3)?.title || "Select from catalog on left"}
                  </div>
                </div>
              </div>

              {/* Credit Calculation Summary */}
              <div className="p-3.5 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-charcoal-700 dark:text-ivory-300">
                  <span>Mandatory Core Credits:</span>
                  <span>14 Credits</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-charcoal-700 dark:text-ivory-300">
                  <span>Elective Credits:</span>
                  <span>+{totalCalculatedCredits - 14} Credits</span>
                </div>
                <div className="pt-1.5 border-t border-border/60 dark:border-charcoal-700 flex items-center justify-between font-bold text-charcoal-900 dark:text-ivory-100">
                  <span>Total Semester Load:</span>
                  <span className={isCreditCompliant ? "text-emerald-600" : "text-rose-600"}>
                    {totalCalculatedCredits} Credits ({minCredits}-{maxCredits} Allowed)
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isCreditCompliant}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Locking Seats &amp; Verifying Credits...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Submit &amp; Lock Elective Enrollment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Past / Confirmed Registrations list */}
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase text-charcoal-500 mb-3">
              Confirmed CBCS Registrations ({pastRegistrations.length})
            </h4>

            {pastRegistrations.length === 0 ? (
              <p className="text-xs text-charcoal-400">No active registrations recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {pastRegistrations.slice(0, 3).map((reg) => (
                  <div
                    key={reg.id}
                    onClick={() => setReceiptModal(reg)}
                    className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/40 border border-border/40 dark:border-charcoal-800 hover:border-emerald-500/40 transition-all cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-charcoal-900 dark:text-ivory-100">
                      <span>{reg.studentName}</span>
                      <span className="text-[10px] text-emerald-600 font-mono">
                        {reg.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-charcoal-400 flex items-center justify-between mt-1">
                      <span>Roll: {reg.studentRoll}</span>
                      <span>{reg.totalCreditsRegistered} Credits</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION REGISTRATION SLIP MODAL */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Official Course Enrollment Acknowledgment Slip
                  </h3>
                  <p className="text-[10px] text-charcoal-400">
                    NEP-2020 Choice Based Credit System Registry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setReceiptModal(null)}
                className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="my-5 p-5 rounded-2xl bg-gradient-to-b from-ivory-50 to-white dark:from-charcoal-800/80 dark:to-charcoal-800/30 border border-dashed border-border dark:border-charcoal-700 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                    Student Scholar
                  </span>
                  <div className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                    {receiptModal.studentName}
                  </div>
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {receiptModal.studentRoll} &bull; {receiptModal.registeredTerm}
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center">
                  <div>{receiptModal.totalCreditsRegistered} Credits</div>
                  <div className="text-[9px] uppercase font-semibold">Verified Load</div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 dark:border-charcoal-700/60">
                <span className="text-[10px] text-charcoal-400 font-semibold uppercase block mb-1.5">
                  Allotted Courses &amp; Preference Priority
                </span>
                <div className="space-y-1.5">
                  {receiptModal.priorityChoices.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-charcoal-900 border border-border/60 dark:border-charcoal-800"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full bg-emerald-500/20 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                          {c.preference}
                        </span>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {c.courseCode}
                        </span>
                        {c.courseTitle && (
                          <span className="text-[11px] text-charcoal-500 truncate max-w-[180px]">
                            {c.courseTitle}
                          </span>
                        )}
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.status === "ALLOTTED"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-orange-500/10 text-orange-600 border border-orange-500/20"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/40 dark:border-charcoal-700/60">
                <span className="text-charcoal-400">Cryptographic Seal:</span>
                <span className="font-mono text-[10px] text-charcoal-600 dark:text-charcoal-400">
                  {receiptModal.sealHash}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-charcoal-400">
                Issued on {new Date(receiptModal.enrolledAt).toLocaleDateString()}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReceiptModal(null)}
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
