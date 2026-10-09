"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable, SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Award,
  Plus,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  FileCheck,
  Edit,
  TrendingUp,
  QrCode,
  Download,
  ShieldCheck,
  Ticket,
  Printer,
  AlertTriangle,
  Grid,
  Users,
  Search,
  BookOpen,
  Check,
  Building,
  RefreshCw,
  Scale,
  ShieldAlert,
  Percent,
  Target,
  RotateCcw,
} from "lucide-react";
import { COPOMappingView } from "@/components/examinations/COPOMappingView";
import { BacklogPortalView } from "@/components/examinations/BacklogPortalView";
import { InvigilationRosterView } from "@/components/examinations/InvigilationRosterView";

type ExamTab = "schedules" | "evaluations" | "seating" | "transcript" | "scanner" | "obe-mapping" | "backlog-portal" | "invigilation";

export default function ExaminationsPage() {
  const { currentUser, showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh, currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<ExamTab>("schedules");

  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isStudent = currentRole === "STUDENT" || currentRole === "PARENT";
  const canEditExams = [
    "SUPER_ADMIN",
    "INSTITUTION_ADMIN",
    "EXAMINATION_CONTROLLER",
    "FACULTY",
    "HOD",
    "PRINCIPAL",
    "CLASS_TEACHER",
  ].includes(currentRole);

  // 1. Modals & Forms State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Batch Roster Grading state
  const [batchMarks, setBatchMarks] = useState<Record<string, string>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [curveAmount, setCurveAmount] = useState<string>("5");
  const [graceLimit, setGraceLimit] = useState<string>("3");

  // Hall Ticket state
  const [isHallTicketModalOpen, setIsHallTicketModalOpen] = useState(false);
  const [hallTicketData, setHallTicketData] = useState<any>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  // Schedule Exam Form
  const [examForm, setExamForm] = useState({
    title: "",
    courseCode: "CS-402",
    type: "MID_TERM",
    totalMarks: "100",
    weightage: "30",
    examDate: "",
    durationMins: "120",
  });

  // Seating Allocation State
  const [seatingData, setSeatingData] = useState<any>(null);
  const [selectedHallId, setSelectedHallId] = useState<string>("");
  const [isLoadingSeating, setIsLoadingSeating] = useState(false);

  // Transcript State
  const [transcriptData, setTranscriptData] = useState<any>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  // Gate Scanner Simulator State
  const userRoll = (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber || "APX2026-CS-001";
  const [scannerRoll, setScannerRoll] = useState(userRoll);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const activeRoll = (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber;
      if (activeRoll) setScannerRoll(activeRoll);
    }
  }, [currentUser]);

  // Load Examinations
  const fetchExams = () => {
    setIsLoading(true);
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        setExams(data.exams || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Examinations fetch error:", err);
        setIsLoading(false);
      });
  };

  // Load Seating Plan
  const fetchSeating = () => {
    setIsLoadingSeating(true);
    fetch("/api/examinations/seating")
      .then((res) => res.json())
      .then((data) => {
        if (data.allocation) {
          setSeatingData(data.allocation);
          if (data.allocation.plans?.length > 0 && !selectedHallId) {
            setSelectedHallId(data.allocation.plans[0].hallId);
          }
        }
      })
      .catch((err) => console.error("Seating fetch error:", err))
      .finally(() => setIsLoadingSeating(false));
  };

  // Load Transcript
  const fetchTranscript = () => {
    setIsLoadingTranscript(true);
    fetch("/api/examinations/transcripts")
      .then((res) => res.json())
      .then((data) => {
        if (data.transcript) {
          setTranscriptData(data.transcript);
        }
      })
      .catch((err) => console.error("Transcript fetch error:", err))
      .finally(() => setIsLoadingTranscript(false));
  };

  useEffect(() => {
    fetchExams();
    fetchSeating();
    fetchTranscript();
  }, [refreshTrigger]);

  // Open marks evaluation modal
  const handleOpenMarksModal = (exam: any) => {
    setSelectedExam(exam);
    const initialBatch: Record<string, string> = {};
    if (exam.classRoster && exam.classRoster.length > 0) {
      exam.classRoster.forEach((r: any) => {
        initialBatch[r.studentId] =
          r.currentMarks !== null && r.currentMarks !== undefined ? String(r.currentMarks) : "";
      });
    }
    setBatchMarks(initialBatch);
    setIsMarksModalOpen(true);
  };

  // Apply Curve Moderation
  const handleApplyCurve = () => {
    if (!selectedExam) return;
    const addMarks = Number(curveAmount);
    if (isNaN(addMarks) || addMarks <= 0) {
      showToast("Please enter a positive number of moderation marks", "error");
      return;
    }

    const maxMarks = selectedExam.totalMarks || 100;
    let adjustedCount = 0;

    setBatchMarks((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((stId) => {
        if (updated[stId] !== "" && !isNaN(Number(updated[stId]))) {
          const current = Number(updated[stId]);
          const curved = Math.min(maxMarks, current + addMarks);
          updated[stId] = String(curved);
          adjustedCount++;
        }
      });
      return updated;
    });

    showToast(
      `Moderated +${addMarks} marks for ${adjustedCount} candidates (clamped to max ${maxMarks})`,
      "success"
    );
  };

  // Apply Senate Grace Marks API
  const handleApplySenateGrace = async () => {
    if (!selectedExam) return;
    try {
      const res = await fetch("/api/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_GRACE_MARKS",
          examId: selectedExam.id,
          maxGraceAllowed: Number(graceLimit) || 3,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        setIsMarksModalOpen(false);
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to apply grace marks", "danger");
      }
    } catch {
      showToast("Network error applying grace marks", "danger");
    }
  };

  // Save Batch Marks
  const handleSaveBatchMarks = async (publish: boolean) => {
    if (!selectedExam) return;
    setIsSavingBatch(true);
    try {
      const batchEntries = Object.entries(batchMarks).map(([studentId, marks]) => ({
        studentId,
        marksObtained: marks,
      }));

      const res = await fetch("/api/examinations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: selectedExam.id,
          batchEntries,
          publish,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          data.message ||
            (publish ? "Grades officially certified & published!" : "Draft grades saved."),
          "success"
        );
        setIsMarksModalOpen(false);
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to update grades", "danger");
      }
    } catch {
      showToast("Error updating exam marks", "danger");
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Schedule Exam
  const handleScheduleExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examForm),
      });
      if (res.ok) {
        showToast("Examination scheduled and published to student Hall Tickets", "success");
        setIsScheduleModalOpen(false);
        setExamForm({
          title: "",
          courseCode: "CS-402",
          type: "MID_TERM",
          totalMarks: "100",
          weightage: "30",
          examDate: "",
          durationMins: "120",
        });
        triggerRefresh();
      } else {
        showToast("Failed to schedule exam", "danger");
      }
    } catch {
      showToast("Error scheduling exam", "danger");
    }
  };

  // Fetch Hall Ticket
  const handleOpenHallTicket = async (examId: string) => {
    setIsLoadingTicket(true);
    try {
      const res = await fetch(`/api/examinations/hall-ticket?examId=${examId}`);
      if (res.ok) {
        const data = await res.json();
        setHallTicketData(data.hallTicket);
        setIsHallTicketModalOpen(true);
      } else {
        showToast("Failed to generate official hall ticket", "danger");
      }
    } catch {
      showToast("Network error fetching hall ticket", "danger");
    } finally {
      setIsLoadingTicket(false);
    }
  };

  // Gate Security QR Verify
  const handleGateScanVerify = async () => {
    if (!scannerRoll.trim()) {
      showToast("Please enter a candidate roll number or scan a token", "error");
      return;
    }
    setIsScanning(true);
    try {
      const res = await fetch("/api/examinations/hall-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: scannerRoll.trim() }),
      });
      const data = await res.json();
      setScanResult(data);
      if (res.ok && data.verified) {
        showToast(
          data.gateAction === "ADMIT_CLEARED"
            ? "Candidate verified. Admittance granted!"
            : "Candidate verified with provisional condonation note.",
          "success"
        );
      } else {
        showToast(data.message || "Gate clearance failed", "danger");
      }
    } catch {
      showToast("Error executing gate verification", "danger");
    } finally {
      setIsScanning(false);
    }
  };

  // Active Seating Plan Filter
  const activeHallPlan = seatingData?.plans?.find((p: any) => p.hallId === selectedHallId) ||
    seatingData?.plans?.[0];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/" },
                { label: "Examinations & Controller of Examinations" },
              ]}
            />
            <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 dark:text-ivory-100 flex items-center gap-2.5 mt-1">
              <Award className="h-6 w-6 text-primary-500" />
              Examination Governance & CoE Suite
            </h1>
            <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-0.5">
              Comprehensive examination scheduling, anti-cheating seating matrices, UGC 10-point
              CBCS grading, and cryptographic admit card verification.
            </p>
          </div>

          {canEditExams && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-soft transition-colors"
              >
                <Plus className="h-4 w-4" />
                Schedule Examination
              </button>
            </div>
          )}
        </div>

        {/* Global Summary Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">
                Active Exams
              </span>
              <Calendar className="h-4 w-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
              {exams.length}
            </p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
              Mid & End-Term Roster
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">
                Grading Standard
              </span>
              <Scale className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
              UGC 10-Pt CBCS
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              O, A+, A, B+, B, C, P, F
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">
                Anti-Cheat Interleave
              </span>
              <Grid className="h-4 w-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
              {seatingData?.antiCheatingMetrics?.interleavingRatio || 100}%
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Checkerboard Multi-Course
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 dark:text-charcoal-400">
                CoE Admit Verification
              </span>
              <ShieldCheck className="h-4 w-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
              HMAC Signed
            </p>
            <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-1">
              QR Gate Security
            </p>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-ivory-100 dark:bg-charcoal-950/80 rounded-2xl border border-border dark:border-charcoal-800 max-w-full overflow-x-auto">
          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "schedules"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Calendar className="h-4 w-4 text-primary-500" />
            Examination Rosters ({exams.length})
          </button>

          {canEditExams && (
            <button
              onClick={() => setActiveTab("evaluations")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === "evaluations"
                  ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
              }`}
            >
              <FileCheck className="h-4 w-4 text-emerald-500" />
              CoE Marks & Moderation
            </button>
          )}

          <button
            onClick={() => setActiveTab("seating")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "seating"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Grid className="h-4 w-4 text-indigo-500" />
            Anti-Cheating Seating Matrix
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "transcript"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Award className="h-4 w-4 text-amber-500" />
            Student Grade Card & Transcript
          </button>

          <button
            onClick={() => setActiveTab("scanner")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "scanner"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <QrCode className="h-4 w-4 text-rose-500" />
            Admit Card & Gate Scanner
          </button>

          <button
            onClick={() => setActiveTab("obe-mapping")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "obe-mapping"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Target className="h-4 w-4 text-rose-primary" />
            CO-PO Mapping &amp; NBA Attainment
          </button>

          <button
            onClick={() => setActiveTab("backlog-portal")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "backlog-portal"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <RotateCcw className="h-4 w-4 text-orange-500" />
            Backlogs &amp; Supplementary
          </button>

          <button
            onClick={() => setActiveTab("invigilation")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === "invigilation"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Users className="h-4 w-4 text-blue-500" />
            Invigilation Duty Matrix
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: EXAMINATION ROSTERS & SCHEDULES                   */}
        {/* ======================================================== */}
        {activeTab === "schedules" && (
          <div className="space-y-4">
            {isLoading ? (
              <SkeletonTable rows={5} />
            ) : exams.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Examinations Scheduled"
                description="Currently there are no active examination schedules found for this semester."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="p-5 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                          {exam.type}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            exam.status === "PUBLISHED"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 mt-3 line-clamp-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                        {exam.courseCode} · {exam.courseTitle}
                      </p>

                      <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 space-y-2 text-xs text-charcoal-600 dark:text-charcoal-400">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary-500" /> Date
                          </span>
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {exam.examDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary-500" /> Duration
                          </span>
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {exam.durationMins} Mins
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 text-primary-500" /> Total Marks
                          </span>
                          <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                            {exam.totalMarks} (Weightage: {exam.weightage}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border dark:border-charcoal-800 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenHallTicket(exam.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
                      >
                        <Ticket className="h-3.5 w-3.5 text-primary-500" />
                        Admit Card
                      </button>

                      {canEditExams && (
                        <button
                          onClick={() => handleOpenMarksModal(exam)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors shadow-sm"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          CoE Grades
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: COE MARKS EVALUATION & MODERATION                 */}
        {/* ======================================================== */}
        {activeTab === "evaluations" && canEditExams && (
          <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-500" />
                  Controller of Examinations — Marks Evaluation & Moderation Studio
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                  Select an examination to enter candidate scores, apply statistical bell-curve
                  moderation, and officially certify UGC 10-point grades.
                </p>
              </div>

              {exams.length > 0 && (
                <div className="flex items-center gap-3">
                  <select
                    value={selectedExam?.id || exams[0]?.id || ""}
                    onChange={(e) => {
                      const ex = exams.find((x) => x.id === e.target.value);
                      if (ex) handleOpenMarksModal(ex);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-800 dark:text-ivory-200"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.courseCode} — {ex.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-950/60 border border-border dark:border-charcoal-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-charcoal-600 dark:text-charcoal-400">
                    Curve Moderation:
                  </span>
                  <input
                    type="number"
                    value={curveAmount}
                    onChange={(e) => setCurveAmount(e.target.value)}
                    className="w-16 px-2 py-1 text-xs rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                    placeholder="+5"
                  />
                  <button
                    onClick={handleApplyCurve}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800"
                  >
                    Apply Curve (+{curveAmount})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-charcoal-600 dark:text-charcoal-400">
                    Senate Grace Limit:
                  </span>
                  <input
                    type="number"
                    value={graceLimit}
                    onChange={(e) => setGraceLimit(e.target.value)}
                    className="w-16 px-2 py-1 text-xs rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                    placeholder="3"
                  />
                  <button
                    onClick={handleApplySenateGrace}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    Clear Borderline Failures (Grace ≤ {graceLimit})
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveBatchMarks(false)}
                  disabled={isSavingBatch}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => handleSaveBatchMarks(true)}
                  disabled={isSavingBatch}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-soft transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Certify & Publish to Portals
                </button>
              </div>
            </div>

            {/* Candidate Roster Table */}
            <div className="overflow-x-auto rounded-xl border border-border dark:border-charcoal-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-ivory-100/70 dark:bg-charcoal-800/70 text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-800">
                  <tr>
                    <th className="py-3 px-4">Candidate Roll No</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Attendance Standing</th>
                    <th className="py-3 px-4">Marks Obtained (/100)</th>
                    <th className="py-3 px-4">UGC 10-Pt Grade</th>
                    <th className="py-3 px-4">Clearance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-charcoal-800 text-charcoal-700 dark:text-ivory-200">
                  {selectedExam?.classRoster?.length > 0 ? (
                    selectedExam.classRoster.map((candidate: any) => {
                      const score = Number(batchMarks[candidate.studentId] || 0);
                      const isPassing = score >= 40;
                      let gradeLetter = "F";
                      if (score >= 90) gradeLetter = "O (10.0)";
                      else if (score >= 80) gradeLetter = "A+ (9.0)";
                      else if (score >= 70) gradeLetter = "A (8.0)";
                      else if (score >= 60) gradeLetter = "B+ (7.0)";
                      else if (score >= 55) gradeLetter = "B (6.0)";
                      else if (score >= 50) gradeLetter = "C (5.0)";
                      else if (score >= 40) gradeLetter = "P (4.0)";
                      else gradeLetter = "F (0.0)";

                      return (
                        <tr
                          key={candidate.studentId}
                          className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                            {candidate.rollNumber}
                          </td>
                          <td className="py-3 px-4 font-medium">{candidate.name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                candidate.isAttendanceDefaulter
                                  ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}
                            >
                              {candidate.attendancePercent}%{" "}
                              {candidate.isAttendanceDefaulter
                                ? "(Provisional Defaulter)"
                                : "(Eligible)"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={batchMarks[candidate.studentId] ?? ""}
                              onChange={(e) =>
                                setBatchMarks({
                                  ...batchMarks,
                                  [candidate.studentId]: e.target.value,
                                })
                              }
                              className="w-20 px-2.5 py-1 text-xs rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 font-semibold"
                            />
                          </td>
                          <td className="py-3 px-4 font-bold text-primary-600 dark:text-primary-400">
                            {gradeLetter}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                isPassing
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isPassing ? (
                                <>
                                  <Check className="h-3 w-3" /> Cleared
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3" /> Arrear
                                </>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-charcoal-500">
                        Select an exam above to load class roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ANTI-CHEATING SEATING ALLOCATION MATRIX           */}
        {/* ======================================================== */}
        {activeTab === "seating" && (
          <div className="space-y-6">
            {isLoadingSeating ? (
              <SkeletonCard />
            ) : (
              <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                      <Grid className="h-5 w-5 text-indigo-500" />
                      Anti-Cheating Checkerboard Seating Plan
                    </h2>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                      Multi-course interleaving ensures students seated adjacent (horizontally and
                      vertically) answer different question papers.
                    </p>
                  </div>

                  {/* Hall Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
                      Hall Venue:
                    </span>
                    <select
                      value={selectedHallId}
                      onChange={(e) => setSelectedHallId(e.target.value)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-charcoal-800 dark:text-ivory-200"
                    >
                      {seatingData?.plans?.map((p: any) => (
                        <option key={p.hallId} value={p.hallId}>
                          {p.hallName} ({p.occupiedSeats}/{p.capacity} Desks)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hall Meta Banner */}
                {activeHallPlan && (
                  <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        {activeHallPlan.hallName} · {activeHallPlan.building}
                      </p>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">
                        Chief Invigilator:{" "}
                        <span className="font-semibold">
                          {activeHallPlan.invigilator?.name || "Dr. Vikram Raman"}
                        </span>{" "}
                        ({activeHallPlan.invigilator?.department || "Examinations Board"})
                      </p>
                      {activeHallPlan.invigilator?.conflictWarning && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {activeHallPlan.invigilator.conflictWarning}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-charcoal-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {activeHallPlan.occupiedSeats} / {activeHallPlan.capacity} Desks Allotted
                      </span>
                    </div>
                  </div>
                )}

                {/* 2D Checkerboard Desk Grid Visualizer */}
                {activeHallPlan && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3 flex items-center justify-between">
                      <span>Examination Hall Desk Layout (Checkerboard Distribution)</span>
                      <span className="flex items-center gap-3 lowercase font-normal">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-blue-500 inline-block" /> CS-402
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 rounded bg-purple-500 inline-block" /> EC-301
                        </span>
                      </span>
                    </h3>

                    <div className="space-y-3 overflow-x-auto pb-2">
                      {activeHallPlan.grid.map((row: any[], rIdx: number) => (
                        <div key={rIdx} className="flex items-center gap-3 min-w-max">
                          <span className="w-6 text-xs font-bold font-mono text-charcoal-400 text-right">
                            {String.fromCharCode(65 + rIdx)}
                          </span>

                          <div className="flex items-center gap-2">
                            {row.map((seat: any) => {
                              const isCS = seat.student?.courseCode === "CS-402";
                              const isEC = seat.student?.courseCode === "EC-301";
                              return (
                                <div
                                  key={seat.seatNumber}
                                  className={`w-36 p-2 rounded-xl border transition-all text-left flex flex-col justify-between ${
                                    seat.student
                                      ? isCS
                                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                                        : "bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100"
                                      : "bg-ivory-100/50 dark:bg-charcoal-800/40 border-border dark:border-charcoal-700 text-charcoal-400 opacity-60"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-mono font-bold">
                                      {seat.seatNumber}
                                    </span>
                                    {seat.student && (
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                          isCS ? "bg-blue-200 text-blue-800" : "bg-purple-200 text-purple-800"
                                        }`}
                                      >
                                        {seat.student.courseCode}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] font-bold truncate mt-1">
                                    {seat.student?.studentName || "Vacant"}
                                  </p>
                                  <p className="text-[10px] font-mono opacity-80 truncate">
                                    {seat.student?.rollNumber || "—"}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Door Notice Chart */}
                {activeHallPlan?.doorNotice && (
                  <div className="pt-4 border-t border-border dark:border-charcoal-800">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 dark:text-ivory-300 mb-2">
                      Exam Entrance Door Notice (Roll Number Distribution)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeHallPlan.doorNotice.map((notice: any) => (
                        <div
                          key={notice.courseCode}
                          className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-950/60 border border-border dark:border-charcoal-800 text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-primary-600 dark:text-primary-400">
                              {notice.courseCode}
                            </span>{" "}
                            — {notice.courseTitle}
                            <p className="text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                              Roll Range: <span className="font-mono font-semibold">{notice.rollRange}</span>
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                            {notice.allocatedCount} Candidates
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: STUDENT GRADE CARD & TRANSCRIPT                   */}
        {/* ======================================================== */}
        {activeTab === "transcript" && (
          <div className="space-y-6">
            {isLoadingTranscript ? (
              <SkeletonCard />
            ) : !transcriptData ? (
              <EmptyState
                icon={Award}
                title="Transcript Not Generated"
                description="Unable to load grade card for the current student profile."
              />
            ) : (
              <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                {/* Official University Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border dark:border-charcoal-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 flex items-center justify-center text-primary-600 font-bold text-lg">
                      APX
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                        {transcriptData.institution.name}
                      </h2>
                      <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                        {transcriptData.institution.controllerOffice} · Official Academic Transcript
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${transcriptData.performance.standingBadgeColor}`}
                    >
                      {transcriptData.performance.academicStanding}
                    </span>
                    <p className="text-[11px] font-mono text-charcoal-500 mt-1">
                      Seal: {transcriptData.verification.sealNumber}
                    </p>
                  </div>
                </div>

                {/* Candidate & Term Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-950/60 border border-border dark:border-charcoal-800">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-charcoal-500">
                      Candidate Name
                    </span>
                    <p className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                      {transcriptData.student.name}
                    </p>
                    <p className="text-xs font-mono text-primary-600 dark:text-primary-400">
                      {transcriptData.student.rollNumber}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-charcoal-500">
                      Academic Program
                    </span>
                    <p className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                      {transcriptData.student.program}
                    </p>
                    <p className="text-xs text-charcoal-500">
                      Semester {transcriptData.student.currentSemester}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-charcoal-500">
                      Current Semester SGPA
                    </span>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {transcriptData.performance.currentSemesterSGPA}
                    </p>
                    <p className="text-[11px] text-charcoal-500">UGC 10-Point Scale</p>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-charcoal-500">
                      Cumulative CGPA
                    </span>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                      {transcriptData.performance.cumulativeCGPA}
                    </p>
                    <p className="text-[11px] text-charcoal-500">
                      {transcriptData.performance.totalCreditsEarned} Credits Earned (0 Arrears)
                    </p>
                  </div>
                </div>

                {/* Course Breakdown Table */}
                <div className="overflow-x-auto rounded-xl border border-border dark:border-charcoal-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100/70 dark:bg-charcoal-800/70 text-charcoal-600 dark:text-charcoal-300 uppercase tracking-wider font-semibold border-b border-border dark:border-charcoal-800">
                      <tr>
                        <th className="py-3 px-4">Course Code & Title</th>
                        <th className="py-3 px-4">Credits</th>
                        <th className="py-3 px-4">Marks Obtained</th>
                        <th className="py-3 px-4">UGC Grade Letter</th>
                        <th className="py-3 px-4">Grade Points</th>
                        <th className="py-3 px-4">Credit Points (C × G)</th>
                        <th className="py-3 px-4">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-charcoal-800 text-charcoal-700 dark:text-ivory-200">
                      {transcriptData.courses.map((course: any) => (
                        <tr
                          key={course.courseCode}
                          className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40"
                        >
                          <td className="py-3 px-4">
                            <span className="font-bold text-primary-600 dark:text-primary-400">
                              {course.courseCode}
                            </span>{" "}
                            — {course.courseTitle}
                          </td>
                          <td className="py-3 px-4 font-semibold">{course.credits}</td>
                          <td className="py-3 px-4 font-semibold">
                            {course.marksObtained} / {course.totalMarks} ({course.percentage}%)
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {course.letterGrade}
                          </td>
                          <td className="py-3 px-4 font-semibold">{course.gradePoints}</td>
                          <td className="py-3 px-4 font-bold">{course.creditPoints}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {course.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Sign-off */}
                <div className="pt-4 border-t border-border dark:border-charcoal-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-charcoal-500 gap-2">
                  <p>
                    Verified digitally by:{" "}
                    <span className="font-semibold text-charcoal-700 dark:text-ivory-300">
                      {transcriptData.verification.authenticatedBy}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <a
                      href="/api/examinations/transcripts/pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs shadow-soft transition-colors w-fit"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Official PDF Dossier
                    </a>
                    <button
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors w-fit"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print Official Mark Sheet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ADMIT CARD & GATE SECURITY SCANNER                */}
        {/* ======================================================== */}
        {activeTab === "scanner" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gate Scanner Simulator Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-rose-500" />
                  Examination Gate Security & Entrance Scanner
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300">
                  Live Scanner
                </span>
              </div>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                Security guards and chief invigilators scan candidate admit card QR barcodes at the
                entrance to verify digital signatures, seat numbers, and attendance eligibility.
              </p>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={scannerRoll}
                  onChange={(e) => setScannerRoll(e.target.value)}
                  placeholder="Enter candidate roll number e.g. APX2026-CS-001"
                  className="flex-1 px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 font-mono"
                />
                <button
                  onClick={handleGateScanVerify}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white transition-colors flex items-center gap-1.5"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Verify Gate Access
                </button>
              </div>

              {scanResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border text-xs space-y-2 ${
                    scanResult.verified
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100"
                      : "bg-rose-50/70 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>
                      {scanResult.verified ? "ADMITTANCE GRANTED" : "CLEARANCE REJECTED"}
                    </span>
                    <span className="font-mono">{scanResult.gateAction}</span>
                  </div>

                  {scanResult.candidate && (
                    <div className="pt-2 border-t border-current/20 space-y-1">
                      <p>
                        Candidate:{" "}
                        <span className="font-bold">{scanResult.candidate.name}</span> (
                        {scanResult.candidate.rollNumber})
                      </p>
                      <p>Program: {scanResult.candidate.program}</p>
                      {scanResult.examination && (
                        <p>
                          Allocated Venue:{" "}
                          <span className="font-bold">
                            {scanResult.examination.allocatedHall} — {scanResult.examination.seatNumber}
                          </span>
                        </p>
                      )}
                      <p>
                        Attendance Clearance:{" "}
                        <span className="font-bold">
                          {scanResult.verificationCheck.attendanceRate}%
                        </span>{" "}
                        {scanResult.verificationCheck.isDefaulter &&
                          "(Warning: Provisional Dean Condonation Required)"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admit Card Preview Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary-500" />
                  Official Admit Card Preview
                </h2>
                <button
                  onClick={() => exams[0] && handleOpenHallTicket(exams[0].id)}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Open Full Admit Card
                </button>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-border dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-950/40 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary-600 text-white font-bold flex items-center justify-center text-xs">
                      APX
                    </div>
                    <div>
                      <p className="font-bold text-charcoal-800 dark:text-ivory-200">
                        Apex University
                      </p>
                      <p className="text-[10px] text-charcoal-500">Hall Ticket Token</p>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-charcoal-800 dark:text-ivory-200" />
                  </div>
                </div>

                <div className="space-y-1 text-charcoal-600 dark:text-charcoal-400 text-[11px]">
                  <p>
                    Candidate: <span className="font-bold">Ethan Hunt (APX2026-CS-001)</span>
                  </p>
                  <p>
                    Subject: <span className="font-bold">CS-402 Neural Networks</span>
                  </p>
                  <p>
                    Venue:{" "}
                    <span className="font-bold">Main Academic Complex — Desk DESK-001</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: CO-PO ARTICULATION & NBA ATTAINMENT MATRIX        */}
        {/* ======================================================== */}
        {activeTab === "obe-mapping" && (
          <COPOMappingView showToast={showToast} canEdit={canEditExams} />
        )}

        {/* ======================================================== */}
        {/* TAB 7: BACKLOGS & REMEDIAL EXAM PORTAL                    */}
        {/* ======================================================== */}
        {activeTab === "backlog-portal" && (
          <BacklogPortalView showToast={showToast} canEdit={canEditExams} isStudent={isStudent} />
        )}

        {/* ======================================================== */}
        {/* TAB 8: FACULTY INVIGILATION DUTY MATRIX                   */}
        {/* ======================================================== */}
        {activeTab === "invigilation" && (
          <InvigilationRosterView showToast={showToast} canEdit={canEditExams} />
        )}

        {/* ======================================================== */}
        {/* SCHEDULE EXAM MODAL                                      */}
        {/* ======================================================== */}
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          title="Schedule New Examination"
        >
          <form onSubmit={handleScheduleExam} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                Examination Title
              </label>
              <input
                type="text"
                required
                value={examForm.title}
                onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                placeholder="e.g. End-Term Comprehensive Exam Fall 2026"
                className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  required
                  value={examForm.courseCode}
                  onChange={(e) => setExamForm({ ...examForm, courseCode: e.target.value })}
                  placeholder="CS-402"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Examination Type
                </label>
                <select
                  value={examForm.type}
                  onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                >
                  <option value="MID_TERM">MID_TERM</option>
                  <option value="END_TERM">END_TERM</option>
                  <option value="PRACTICAL">PRACTICAL</option>
                  <option value="QUIZ">QUIZ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={examForm.totalMarks}
                  onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Weightage (%)
                </label>
                <input
                  type="number"
                  value={examForm.weightage}
                  onChange={(e) => setExamForm({ ...examForm, weightage: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  value={examForm.durationMins}
                  onChange={(e) => setExamForm({ ...examForm, durationMins: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-300 mb-1">
                Examination Date
              </label>
              <input
                type="date"
                required
                value={examForm.examDate}
                onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl text-xs border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-soft"
              >
                Schedule & Publish
              </button>
            </div>
          </form>
        </Modal>

        {/* ======================================================== */}
        {/* OFFICIAL ADMIT CARD MODAL                                */}
        {/* ======================================================== */}
        <Modal
          isOpen={isHallTicketModalOpen}
          onClose={() => setIsHallTicketModalOpen(false)}
          title="Official Examination Hall Ticket"
        >
          {isLoadingTicket ? (
            <SkeletonCard />
          ) : hallTicketData ? (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 space-y-3">
                <div className="flex items-center justify-between border-b pb-3 border-border dark:border-charcoal-800">
                  <div>
                    <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                      {hallTicketData.candidate.institutionName}
                    </h3>
                    <p className="text-[11px] text-charcoal-500">
                      Admit Card Token: {hallTicketData.ticketNumber}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      hallTicketData.verification.isDefaulter
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {hallTicketData.verification.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-charcoal-400">Candidate:</span>
                    <p className="font-bold">{hallTicketData.candidate.name}</p>
                    <p className="font-mono text-primary-600">
                      {hallTicketData.candidate.rollNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Subject:</span>
                    <p className="font-bold">{hallTicketData.examination.courseCode}</p>
                    <p>{hallTicketData.examination.title}</p>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Venue & Desk:</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">
                      {hallTicketData.examination.seatNumber}
                    </p>
                    <p>{hallTicketData.examination.hallLocation}</p>
                  </div>
                  <div>
                    <span className="text-charcoal-400">Schedule:</span>
                    <p className="font-bold">{hallTicketData.examination.date}</p>
                    <p>Reporting: {hallTicketData.examination.reportingTime}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-ivory-50 dark:bg-charcoal-950 font-mono text-[10px] text-charcoal-600 dark:text-charcoal-400 break-all">
                  Sig: {hallTicketData.verification.authSignature}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Admit Card
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      </div>
    </AppShell>
  );
}
