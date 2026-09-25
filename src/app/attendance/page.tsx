"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import {
  CheckSquare,
  QrCode,
  AlertTriangle,
  Calendar,
  Send,
  Download,
  Filter,
  Save,
  CheckCircle2,
  Scan,
} from "lucide-react";
import QRScannerModal from "@/components/attendance/QRScannerModal";
import ProjectorModeModal from "@/components/attendance/ProjectorModeModal";

export default function AttendancePage() {
  const { showToast, triggerRefresh, currentRole, currentUser } = useApp();
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [availableCourses, setAvailableCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [studentRoster, setStudentRoster] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [sessionExists, setSessionExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatchingAlerts, setIsDispatchingAlerts] = useState(false);

  // Smart Attendance: Projector & Scanner States
  const [isProjectorOpen, setIsProjectorOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Correction Request State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    courseCode: "CS-402",
    date: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

  const handleDispatchGuardianAlerts = async (defaultersList: any[]) => {
    try {
      setIsDispatchingAlerts(true);
      const res = await fetch("/api/attendance/defaulters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          defaulters: defaultersList.map((d) => ({ name: d.name, aggregate: d.aggregate })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Pastoral guardian notifications dispatched!", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to dispatch alerts", "error");
      }
    } catch {
      showToast("Network error dispatching guardian alerts", "error");
    } finally {
      setIsDispatchingAlerts(false);
    }
  };

  const fetchRoster = () => {
    setIsLoading(true);
    fetch(`/api/attendance?courseCode=${selectedCourse}&date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "STUDENT") {
          setStudentData(data);
        } else {
          if (data.roster) {
            setStudentRoster(data.roster);
          }
          if (data.availableCourses && data.availableCourses.length > 0) {
            setAvailableCourses(data.availableCourses);
          }
          setSessionExists(Boolean(data.sessionExists));
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Attendance fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchRoster();
  }, [selectedCourse, selectedDate, currentRole]);

  const handleOpenProjector = async () => {
    setIsStartingSession(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          method: "SMART_COMBO",
          qrRotationSeconds: 15,
          allowedRadiusMeters: 100,
          bleRequired: false,
          geofenceRequired: false,
        }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSessionId(data.session.id);
        setIsProjectorOpen(true);
      } else {
        showToast(data.error || "Failed to initialize attendance session", "danger");
      }
    } catch {
      showToast("Network error starting smart session", "danger");
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleScanSuccess = (data: any) => {
    showToast(data.message || "Attendance recorded successfully!", "success");
    fetchRoster();
    triggerRefresh();
  };

  const toggleStatus = (studentId: string, newStatus: "PRESENT" | "ABSENT" | "LATE") => {
    setStudentRoster((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const markAll = (status: "PRESENT" | "ABSENT") => {
    setStudentRoster((prev) => prev.map((s) => ({ ...s, status })));
    showToast(`Marked all students as ${status}`, "info");
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: selectedCourse,
          date: selectedDate,
          records: studentRoster.map((s) => ({
            studentId: s.studentId,
            status: s.status,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Attendance recorded for ${data.recordedCount} students in database`, "success");
        triggerRefresh();
        fetchRoster();
      } else {
        showToast(data.error || "Failed to save attendance", "danger");
      }
    } catch {
      showToast("Network error saving attendance", "danger");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionForm.reason.trim()) {
      showToast("Please provide justification for the correction petition", "warning");
      return;
    }
    setIsSubmittingCorrection(true);
    try {
      const res = await fetch("/api/students/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ATTENDANCE_CORRECTION",
          subject: `Attendance Discrepancy: ${correctionForm.courseCode}`,
          description: `Date: ${correctionForm.date} - ${correctionForm.reason}`,
          requestedDate: correctionForm.date,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Attendance correction petition filed with Faculty & Dean", "success");
        setIsCorrectionModalOpen(false);
        setCorrectionForm({ ...correctionForm, reason: "" });
      } else {
        showToast(data.error || "Failed to submit petition", "danger");
      }
    } catch {
      showToast("Network error submitting petition", "danger");
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  const presentCount = studentRoster.filter((s) => s.status === "PRESENT" || s.status === "LATE").length;
  const attendancePercent =
    studentRoster.length > 0 ? ((presentCount / studentRoster.length) * 100).toFixed(1) : "0.0";
  const defaulters = studentRoster.filter((s) => s.aggregate < 75);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                {currentRole === "STUDENT"
                  ? "My Academic Attendance Record"
                  : "Attendance Management & Telemetry"}
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                {currentRole === "STUDENT"
                  ? "Biometric RFID check-ins, subject-wise attendance percentages, and examination eligibility standing"
                  : "Biometric RFID check-ins, dynamic QR code scanners, and automated pastoral defaulter flags"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentRole === "STUDENT" ? (
              <>
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Scan className="h-4 w-4 animate-pulse" />
                  <span>Scan Attendance QR</span>
                </button>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                >
                  <span>Request Correction</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleOpenProjector}
                  disabled={isStartingSession}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" />
                  <span>{isStartingSession ? "Launching..." : "Project Dynamic QR"}</span>
                </button>
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all"
                  title="Test in-browser camera scanner"
                >
                  <Scan className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Scanner</span>
                </button>
                <button
                  onClick={handleSaveAttendance}
                  disabled={isSaving || studentRoster.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save to Database"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* STUDENT PERSPECTIVE: Personal Attendance Dossier */}
        {currentRole === "STUDENT" ? (
          <div className="flex flex-col gap-6">
            {/* Student Attendance KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Cumulative Attendance</span>
                <div className="text-3xl font-display font-bold mt-2 flex items-baseline gap-2">
                  <span className={`${
                    (studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                      ? "text-academic-success"
                      : "text-academic-danger"
                  }`}>
                    {(studentData?.overallAttendance?.aggregateRate ?? 95).toFixed(1)}%
                  </span>
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  {(studentData?.overallAttendance?.aggregateRate ?? 95) >= 75
                    ? "Safe above 75% Cutoff"
                    : "Defaulter Warning Triggered"}
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Lectures Attended</span>
                <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                  {studentData?.overallAttendance?.attendedLectures ?? 0} / {studentData?.overallAttendance?.totalLectures ?? 0}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  Total term lectures logged
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Senate Threshold</span>
                <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                  75.0%
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  Mandatory exam appearance cutoff
                </span>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 uppercase">Examination Clearance</span>
                <div className={`text-2xl font-display font-bold mt-2 ${
                  studentData?.overallAttendance?.isDefaulter
                    ? "text-academic-danger"
                    : "text-academic-success"
                }`}>
                  {studentData?.overallAttendance?.isDefaulter ? "DEFAULTER" : "ELIGIBLE"}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  {studentData?.overallAttendance?.isDefaulter
                    ? "Admit card withheld pending review"
                    : "Hall ticket clearance granted"}
                </span>
              </div>
            </div>

            {/* Subject-Wise Attendance Breakdown */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
              <div className="p-5 border-b border-border/70 dark:border-charcoal-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Subject-Wise Attendance Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Continuous monitoring per course as registered by respective professors
                  </p>
                </div>
                <button
                  onClick={() => setIsCorrectionModalOpen(true)}
                  className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                >
                  File Discrepancy Petition →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Course Code &amp; Title</th>
                      <th className="p-3.5">Credits</th>
                      <th className="p-3.5">Faculty</th>
                      <th className="p-3.5 text-center">Lectures Attended</th>
                      <th className="p-3.5 text-center">Attendance %</th>
                      <th className="p-3.5 text-center">Eligibility Standing</th>
                      <th className="p-3.5 text-center">Recovery / Safe Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                    {studentData?.courseWiseAttendance?.map((c: any) => (
                      <tr key={c.courseCode} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40">
                        <td className="p-3.5">
                          <span className="font-bold block">{c.courseCode}: {c.courseTitle}</span>
                        </td>
                        <td className="p-3.5 font-mono">{c.credits}</td>
                        <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">{c.facultyName}</td>
                        <td className="p-3.5 text-center font-mono font-bold">
                          {c.attendedClasses} / {c.totalClasses}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold font-mono">{c.attendanceRate.toFixed(1)}%</span>
                            <div className="w-16 bg-ivory-200 dark:bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.attendanceRate >= 75 ? "bg-academic-success" : "bg-academic-danger"
                                }`}
                                style={{ width: `${Math.min(c.attendanceRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              c.isDefaulter
                                ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                                : "bg-academic-success-subtle text-academic-success border border-green-200"
                            }`}
                          >
                            {c.isDefaulter ? "DEFAULTER" : "ELIGIBLE"}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          {(() => {
                            const att = c.attendedClasses || 0;
                            const tot = c.totalClasses || 0;
                            if (tot === 0) return <span className="text-charcoal-400 text-[10px]">No sessions</span>;
                            if (c.attendanceRate < 75) {
                              const needed = Math.max(1, Math.ceil((0.75 * tot - att) / 0.25));
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Must attend next consecutive classes without missing">
                                  Attend next {needed} classes
                                </span>
                              );
                            } else {
                              const canMiss = Math.floor((att - 0.75 * tot) / 0.75);
                              return (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Can safely miss classes and remain >= 75%">
                                  {canMiss > 0 ? `Can miss ${canMiss} safely` : "On threshold"}
                                </span>
                              );
                            }
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Attendance Sessions Log */}
            <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
              <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mb-3">
                Recent Class Sessions &amp; Turnstile Logs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {studentData?.recentSessions?.slice(0, 6).map((session: any) => (
                  <div
                    key={session.id}
                    className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {session.courseCode}: {session.courseTitle}
                      </span>
                      <span className="text-[10px] text-charcoal-500 font-mono">
                        Date: {new Date(session.date).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        session.status === "PRESENT"
                          ? "bg-academic-success-subtle text-academic-success"
                          : session.status === "LATE"
                          ? "bg-academic-warning-subtle text-academic-warning"
                          : "bg-academic-danger-subtle text-academic-danger"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* FACULTY / ADMIN ATTENDANCE MANAGEMENT */
          <>
            {/* Session Exists Warning Banner */}
            {sessionExists && (
              <div className="p-3.5 rounded-xl bg-academic-info-subtle dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between text-xs text-academic-info">
                <span>
                  Notice: An attendance session has already been recorded for this course on {selectedDate}. Submitting will update existing records.
                </span>
                <span className="font-bold">Session Exists</span>
              </div>
            )}

            {/* Course & Date Filter Strip */}
            <div className="bg-white dark:bg-[#1E191C] p-4 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-charcoal-400" />
                <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">Course:</span>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100"
                >
                  {availableCourses.length > 0 ? (
                    availableCourses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code}: {c.title}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="CS-402">CS-402: Advanced Neural Networks</option>
                      <option value="BIO-210">BIO-210: Cellular Genomics &amp; CRISPR</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">Session Date:</span>
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3 py-2 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => markAll("PRESENT")}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-300 dark:border-green-800 hover:bg-green-100 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => markAll("ABSENT")}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-academic-danger-subtle dark:bg-red-950/40 text-academic-danger border border-rose-300 dark:border-rose-800 hover:bg-rose-100 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* Live Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400 block uppercase">
                  Today&apos;s Attendance Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                    {attendancePercent}%
                  </span>
                  <span className="text-xs font-medium text-academic-success">
                    {presentCount} of {studentRoster.length} Present
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400 block uppercase">
                  RFID Turnstiles
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                    42 Active
                  </span>
                  <span className="text-xs font-medium text-academic-success">
                    Zero Sync Latency
                  </span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E191C] p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-soft">
                <span className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400 block uppercase">
                  Defaulter Risk (&lt; 75%)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-display font-bold text-academic-danger">
                    {defaulters.length} Flagged
                  </span>
                  <span className="text-xs font-medium text-academic-danger">
                    Pastoral Outreach Required
                  </span>
                </div>
                {defaulters.length > 0 && (
                  <button
                    onClick={() => handleDispatchGuardianAlerts(defaulters)}
                    disabled={isDispatchingAlerts}
                    className="mt-2 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-academic-danger hover:bg-red-700 active:scale-[0.98] text-white shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="h-3 w-3" />
                    <span>{isDispatchingAlerts ? "Dispatching..." : "Send Guardian Notice"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Student Roster Table */}
            {isLoading ? (
              <SkeletonTable rows={4} />
            ) : (
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/40 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                      Class Roster: {selectedCourse} • {selectedDate}
                    </span>
                    <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                      Tap status to record attendance. Changes persist on save.
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent shrink-0">
                    Section 5-A
                  </span>
                </div>

                {/* Mobile Touch-First Roster Cards (< md) */}
                <div className="md:hidden divide-y divide-border/60 dark:divide-charcoal-800">
                  {studentRoster.map((s) => (
                    <div key={s.studentId} className="p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 block">{s.name}</span>
                          <span className="text-[11px] font-mono text-charcoal-500">{s.rollNo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">{Number(s.aggregate).toFixed(1)}%</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              s.aggregate >= 75
                                ? "bg-academic-success-subtle text-academic-success"
                                : "bg-academic-danger-subtle text-academic-danger"
                            }`}
                          >
                            {s.aggregate >= 75 ? "ELIGIBLE" : "DEFAULTER"}
                          </span>
                        </div>
                      </div>

                      {/* 3 Large Touch-Target Status Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "PRESENT")}
                          className={`min-h-[40px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            s.status === "PRESENT"
                              ? "bg-academic-success text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "LATE")}
                          className={`min-h-[40px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            s.status === "LATE"
                              ? "bg-academic-warning text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(s.studentId, "ABSENT")}
                          className={`min-h-[40px] flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                            s.status === "ABSENT"
                              ? "bg-academic-danger text-white shadow-xs"
                              : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-800"
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Full Table (>= md) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100 dark:bg-charcoal-900 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Student Name</th>
                        <th className="p-3.5">Roll Number</th>
                        <th className="p-3.5 text-center">Semester Aggregate</th>
                        <th className="p-3.5 text-center">Eligibility Status</th>
                        <th className="p-3.5 text-center">Session Attendance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                      {studentRoster.map((s) => (
                        <tr
                          key={s.studentId}
                          className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-900/40 transition-colors"
                        >
                          <td className="p-3.5 font-bold">{s.name}</td>
                          <td className="p-3.5 font-mono text-charcoal-600 dark:text-charcoal-400 font-medium">
                            {s.rollNo}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="font-bold text-xs">{Number(s.aggregate).toFixed(1)}%</span>
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                                s.aggregate >= 75
                                  ? "bg-academic-success-subtle text-academic-success border border-green-200"
                                  : "bg-academic-danger-subtle text-academic-danger border border-red-200"
                              }`}
                            >
                              {s.aggregate >= 75 ? "ELIGIBLE" : "DEFAULTER"}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="inline-flex rounded-xl border border-border dark:border-charcoal-700 p-0.5 bg-ivory-50 dark:bg-charcoal-800">
                              <button
                                onClick={() => toggleStatus(s.studentId, "PRESENT")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  s.status === "PRESENT"
                                    ? "bg-academic-success text-white shadow-xs"
                                    : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                onClick={() => toggleStatus(s.studentId, "LATE")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  s.status === "LATE"
                                    ? "bg-academic-warning text-white shadow-xs"
                                    : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                }`}
                              >
                                Late
                              </button>
                              <button
                                onClick={() => toggleStatus(s.studentId, "ABSENT")}
                                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  s.status === "ABSENT"
                                    ? "bg-academic-danger text-white shadow-xs"
                                    : "text-charcoal-600 dark:text-charcoal-400 hover:bg-white dark:hover:bg-charcoal-700"
                                }`}
                              >
                                Absent
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

            {/* Defaulter Alert Banner */}
            {defaulters.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-academic-warning text-white flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                      {defaulters.length} Student(s) Below 75% Examination Attendance Threshold
                    </span>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300">
                      Students: {defaulters.map((d) => `${d.name} (${d.aggregate}%)`).join(", ")}. Automated pastoral alert can be sent to guardians.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDispatchGuardianAlerts(defaulters)}
                  disabled={isDispatchingAlerts}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-academic-warning hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isDispatchingAlerts ? "Dispatching..." : "Dispatch Guardian Alerts"}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Attendance Correction Modal for Students */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        title="File Attendance Discrepancy Petition"
        description="Formal petition to course professor and Dean to review an unrecorded attendance session."
      >
        <form onSubmit={handleCorrectionSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Course Code
            </label>
            <input
              type="text"
              required
              value={correctionForm.courseCode}
              onChange={(e) => setCorrectionForm({ ...correctionForm, courseCode: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. CS-402"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Session Date
            </label>
            <input
              type="date"
              required
              value={correctionForm.date}
              onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Justification &amp; Evidence
            </label>
            <textarea
              rows={3}
              required
              value={correctionForm.reason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Present in LH-4B from 10:00 AM to 11:30 AM; turnstile RFID card failed to scan. Attached medical leave approved by Dean."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCorrectionModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingCorrection}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmittingCorrection ? "Submitting..." : "Submit Formal Petition"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Smart Attendance Projector Mode Modal */}
      {activeSessionId && (
        <ProjectorModeModal
          isOpen={isProjectorOpen}
          onClose={() => setIsProjectorOpen(false)}
          sessionId={activeSessionId}
          courseCode={selectedCourse}
          courseTitle={availableCourses.find((c) => c.code === selectedCourse)?.title || "Lecture"}
          onSessionUpdated={fetchRoster}
        />
      )}

      {/* Smart Attendance Real Camera Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onSuccess={handleScanSuccess}
      />
    </AppShell>
  );
}
