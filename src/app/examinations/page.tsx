"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
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
} from "lucide-react";

export default function ExaminationsPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh, currentRole } = useApp();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isStudent = currentRole === "STUDENT";
  const canEditExams = ["SUPER_ADMIN", "INSTITUTION_ADMIN", "EXAMINATION_CONTROLLER", "FACULTY", "HOD", "PRINCIPAL"].includes(
    currentRole
  );

  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  // Batch Roster Grading state
  const [batchMarks, setBatchMarks] = useState<Record<string, string>>({});
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [curveAmount, setCurveAmount] = useState<string>("5");

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

    showToast(`Moderated +${addMarks} marks for ${adjustedCount} candidates (clamped to max ${maxMarks})`, "success");
  };

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

  useEffect(() => {
    fetchExams();
  }, [refreshTrigger]);

  const handleOpenMarksModal = (exam: any) => {
    setSelectedExam(exam);
    const initialBatch: Record<string, string> = {};
    if (exam.classRoster && exam.classRoster.length > 0) {
      exam.classRoster.forEach((r: any) => {
        initialBatch[r.studentId] = r.currentMarks !== null && r.currentMarks !== undefined ? String(r.currentMarks) : "";
      });
    }
    setBatchMarks(initialBatch);
    setIsMarksModalOpen(true);
  };

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
        showToast(data.message || (publish ? "Grades officially certified & published!" : "Draft grades saved."), "success");
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
        setExamForm({ title: "", courseCode: "CS-402", type: "MID_TERM", totalMarks: "100", weightage: "30", examDate: "", durationMins: "120" });
        triggerRefresh();
      } else {
        showToast("Failed to schedule exam", "danger");
      }
    } catch {
      showToast("Error scheduling exam", "danger");
    }
  };

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

  const [isSubmittingPetition, setIsSubmittingPetition] = useState(false);

  const handleRequestReEvaluation = async (examTitle: string, courseCode: string, marks: number, total: number) => {
    setIsSubmittingPetition(true);
    try {
      const res = await fetch("/api/students/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "RE_EVALUATION",
          title: `Re-evaluation: ${courseCode} - ${examTitle}`,
          reason: `Formal application for answer script scrutiny and mark re-tabulation for ${examTitle}. Scored: ${marks}/${total}.`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Formal re-evaluation petition submitted to Controller of Examinations", "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to submit petition", "danger");
      }
    } catch {
      showToast("Network error submitting re-evaluation request", "danger");
    } finally {
      setIsSubmittingPetition(false);
    }
  };

  const handleDownloadAdmitCard = () => {
    if (!hallTicketData) return;
    const t = hallTicketData;
    const isDefaulter = t.verification?.isDefaulter;
    const content = `================================================================================
                    APEX UNIVERSITY OF SCIENCE & TECHNOLOGY
                       OFFICE OF THE REGISTRAR & CONTROLLER
                      OFFICIAL EXAMINATION HALL TICKET / ADMIT CARD
================================================================================
HALL TICKET NUMBER : ${t.ticketNumber}
DATE OF ISSUE      : ${new Date(t.verification.issuedAt).toLocaleDateString("en-US", { dateStyle: "full" })}
VERIFICATION CODE  : ${t.verification.authSignature}
STATUS             : ${t.verification.status}
${isDefaulter ? `WATERMARK          : *** PROVISIONAL — SUBJECT TO DEAN CONDONATION (ATTENDANCE: ${t.verification.attendanceRate}%) ***\nCONDITIONAL NOTE   : ${t.verification.conditionNote}\n` : ""}
--------------------------------------------------------------------------------
1. CANDIDATE PROFILE
--------------------------------------------------------------------------------
Candidate Name     : ${t.candidate.name}
Roll Number        : ${t.candidate.rollNumber}
Program            : ${t.candidate.program}
Term / Semester    : ${t.candidate.semester}
Registered Email   : ${t.candidate.email}

--------------------------------------------------------------------------------
2. EXAMINATION DETAILS
--------------------------------------------------------------------------------
Examination Title  : ${t.examination.title} (${t.examination.type})
Course Code & Name : ${t.examination.courseCode} - ${t.examination.courseTitle}
Academic Dept      : ${t.examination.department}
Scheduled Date     : ${t.examination.date}
Reporting Time     : ${t.examination.reportingTime}
Allotted Venue     : ${t.examination.hallLocation}
Assigned Seat/Desk : ${t.examination.seatNumber}
Duration & Marks   : ${t.examination.duration} | Maximum Marks: ${t.examination.totalMarks}

--------------------------------------------------------------------------------
3. INSTRUCTIONS TO CANDIDATE
--------------------------------------------------------------------------------
${t.guidelines.join("\n")}

================================================================================
Digitally certified by Autonomous Examination Engine
Controller Seal: [APEX-SEAL-VERIFIED]
${isDefaulter ? "WARNING: Candidate attendance is below 75% Senate threshold. Subject to Dean condonation." : ""}
================================================================================`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AdmitCard_${t.candidate.rollNumber}_${t.examination.courseCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded verified Examination Hall Ticket (Admit Card)", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Examination Management & GPA Controller
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Question banks, hall ticket generator, continuous assessment, and SGPA/CGPA evaluation
              </p>
            </div>
          </div>

          {canEditExams && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-light dark:hover:bg-rose-dark/50 text-rose-primary dark:text-rose-accent text-xs font-bold border border-rose-accent/30 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Bloom&apos;s AI Questions</span>
              </button>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Exam</span>
              </button>
            </div>
          )}
        </div>

        {/* Student Published Grades & Certified Results Dossier */}
        {isStudent && (
          <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                    My Certified Examination Results
                  </h3>
                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                    Official grades verified by Apex Academic Senate &amp; Examination Controller
                  </p>
                </div>
              </div>
            </div>

            {exams.flatMap((e) => e.results || []).length === 0 ? (
              <div className="text-center py-6 text-xs text-charcoal-500">
                No certified grades published yet. Once faculty evaluates and publishes assessments, your marks and grade letters will appear here.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {exams.flatMap((e) =>
                  (e.results || []).map((r: any) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                          {e.title}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200">
                          {r.gradeLetter} Grade
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-charcoal-600 dark:text-charcoal-400">
                        <span>Course: {e.courseCode}</span>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {r.marksObtained} / {e.totalMarks} Marks
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-charcoal-800">
                        <span className="text-[10px] text-charcoal-400 italic">
                          {r.remarks || "Certified Academic Record"}
                        </span>
                        <button
                          disabled={isSubmittingPetition}
                          onClick={() => handleRequestReEvaluation(e.title, e.courseCode, r.marksObtained, e.totalMarks)}
                          className="text-[10px] font-bold text-rose-primary dark:text-rose-accent hover:underline flex items-center gap-1"
                        >
                          Request Scrutiny →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Examination Registry Cards */}
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : exams.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No exams scheduled yet"
            description="Schedule mid-terms, practicals, or end-semester assessments."
            actionLabel={canEditExams ? "Schedule First Exam" : undefined}
            onAction={canEditExams ? () => setIsScheduleModalOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                      {exam.courseCode}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-academic-info-subtle text-academic-info border border-blue-200">
                      {exam.type}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-2">
                    {exam.title}
                  </h3>

                  <div className="flex flex-col gap-2 mt-4 text-xs text-charcoal-600 dark:text-charcoal-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-rose-accent" />
                      <span>Date: {exam.examDate}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-rose-accent" />
                      <span>Duration: {exam.durationMins} Mins ({exam.weightage}% weightage)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-rose-accent" />
                      <span>
                        Total Marks: {exam.totalMarks} • Graded: {exam.results?.length || 0} students
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {canEditExams && (
                      <>
                        <button
                          onClick={() => handleOpenMarksModal(exam)}
                          className="flex items-center gap-1 text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Batch Grading</span>
                        </button>
                        <span>•</span>
                      </>
                    )}
                    <button
                      disabled={isLoadingTicket}
                      onClick={() => handleOpenHallTicket(exam.id)}
                      className="flex items-center gap-1 text-xs font-bold text-charcoal-700 dark:text-ivory-200 hover:text-rose-primary dark:hover:text-rose-accent transition-colors"
                    >
                      <QrCode className="h-3.5 w-3.5 text-rose-primary" />
                      <span>Hall Ticket</span>
                    </button>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                    {exam.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Exam Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule New Examination"
        description="Creates official examination event and computes grade weightage."
      >
        <form onSubmit={handleScheduleExam} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Exam Title
            </label>
            <input
              type="text"
              required
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Mid-Term Assessment Fall 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Course
              </label>
              <select
                value={examForm.courseCode}
                onChange={(e) => setExamForm({ ...examForm, courseCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CS-402">CS-402: Advanced Neural Networks</option>
                <option value="BIO-210">BIO-210: Cellular Genomics & CRISPR</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Exam Type
              </label>
              <select
                value={examForm.type}
                onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="MID_TERM">Mid Term</option>
                <option value="END_TERM">End Term</option>
                <option value="PRACTICAL">Practical / Lab</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Total Marks
              </label>
              <input
                type="number"
                value={examForm.totalMarks}
                onChange={(e) => setExamForm({ ...examForm, totalMarks: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Weightage %
              </label>
              <input
                type="number"
                value={examForm.weightage}
                onChange={(e) => setExamForm({ ...examForm, weightage: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                value={examForm.durationMins}
                onChange={(e) => setExamForm({ ...examForm, durationMins: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Schedule Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* Batch Roster Marks Entry Modal */}
      <Modal
        isOpen={isMarksModalOpen}
        onClose={() => setIsMarksModalOpen(false)}
        title={`Class Roster Grading: ${selectedExam?.title || "Exam"}`}
        description={`Record student marks out of ${selectedExam?.totalMarks || 100}. Save drafts or publish officially to student transcripts.`}
        maxWidth="2xl"
      >
        <div className="flex flex-col gap-4 mt-2">
          {(!selectedExam?.classRoster || selectedExam.classRoster.length === 0) ? (
            <p className="text-xs text-charcoal-500 py-6 text-center">
              No students enrolled in this course roster yet.
            </p>
          ) : (
            <>
              {/* Batch Grade Moderation / Curve Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-primary" />
                  <span className="font-bold text-charcoal-800 dark:text-ivory-200">
                    Faculty Moderation / Curve Tool:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-charcoal-500">Uniform Curve:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={curveAmount}
                    onChange={(e) => setCurveAmount(e.target.value)}
                    className="w-16 px-2 py-1 text-xs font-bold rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCurve}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-primary hover:text-white text-rose-primary dark:text-rose-accent border border-rose-accent/30 transition-all"
                  >
                    Apply Curve (+{curveAmount})
                  </button>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto rounded-xl border border-border dark:border-charcoal-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-soft dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold border-b border-border dark:border-charcoal-700">
                    <th className="p-3">Student Candidate</th>
                    <th className="p-3">Roll Number</th>
                    <th className="p-3 w-36">Marks (Max {selectedExam?.totalMarks || 100})</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-charcoal-800">
                  {selectedExam.classRoster.map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                      <td className="p-3 font-bold text-charcoal-900 dark:text-ivory-100">
                        <div className="flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.isAttendanceDefaulter ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-academic-danger-subtle text-academic-danger border border-red-200" title="Course attendance below 75% cutoff">
                              Shortage ({st.attendancePercent}%)
                            </span>
                          ) : st.attendancePercent ? (
                            <span className="text-[10px] text-charcoal-400 font-mono font-normal">
                              ({st.attendancePercent}%)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-charcoal-600 dark:text-charcoal-400">
                        {st.rollNumber}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max={selectedExam?.totalMarks || 100}
                          value={batchMarks[st.studentId] ?? ""}
                          onChange={(e) =>
                            setBatchMarks((prev) => ({
                              ...prev,
                              [st.studentId]: e.target.value,
                            }))
                          }
                          placeholder="—"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none focus:border-rose-primary"
                        />
                      </td>
                      <td className="p-3">
                        {st.isPublished ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200">
                            Certified ({st.gradeLetter})
                          </span>
                        ) : st.currentMarks !== null && st.currentMarks !== undefined ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200">
                            Draft ({st.gradeLetter})
                          </span>
                        ) : (
                          <span className="text-[10px] text-charcoal-400 font-medium">
                            Not Graded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border dark:border-charcoal-800">
            <span className="text-[11px] text-charcoal-500">
              Draft saves progress locally. Publishing locks grades to student academic dossiers and computes SGPA.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMarksModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-surface-soft rounded-xl border border-border dark:border-charcoal-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingBatch}
                onClick={() => handleSaveBatchMarks(false)}
                className="px-3.5 py-2 text-xs font-bold bg-surface-soft hover:bg-ivory-100 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-900 dark:text-ivory-100 rounded-xl border border-border dark:border-charcoal-700 disabled:opacity-50"
              >
                {isSavingBatch ? "Saving..." : "Save Draft"}
              </button>
              <button
                type="button"
                disabled={isSavingBatch}
                onClick={() => handleSaveBatchMarks(true)}
                className="px-4 py-2 text-xs font-bold bg-academic-success hover:bg-green-700 text-white rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isSavingBatch ? "Publishing..." : "Publish Official Grades"}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 3. Official Examination Hall Ticket Modal */}
      <Modal
        isOpen={isHallTicketModalOpen}
        onClose={() => setIsHallTicketModalOpen(false)}
        title="Official Examination Hall Ticket / Admit Card"
        description="Digitally verified examination pass with biometrics, seat allocation, and integrity seal."
      >
        {hallTicketData && (
          <div className="flex flex-col gap-4 text-xs">
            {/* Ticket Header & Verification Banner */}
            <div className="p-4 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-charcoal-500 uppercase block">Ticket Identifier</span>
                <span className="text-sm font-mono font-bold text-rose-primary dark:text-rose-accent">
                  {hallTicketData.ticketNumber}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                hallTicketData.verification.isDefaulter
                  ? "bg-academic-danger-subtle text-academic-danger border border-red-300 dark:border-red-800"
                  : "bg-academic-success-subtle text-academic-success border border-green-300 dark:border-green-800"
              }`}>
                {hallTicketData.verification.isDefaulter ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-academic-danger" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                <span>{hallTicketData.verification.status}</span>
              </span>
            </div>

            {hallTicketData.verification?.isDefaulter && (
              <div className="p-3.5 rounded-xl bg-academic-danger-subtle dark:bg-red-950/40 border border-red-300 dark:border-red-800 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-academic-danger shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-academic-danger uppercase text-[10px] tracking-wider">
                    PROVISIONAL ADMIT CARD — ATTENDANCE CONDONATION REQUIRED
                  </span>
                  <p className="text-[11px] text-charcoal-700 dark:text-ivory-200">
                    Candidate course attendance ({hallTicketData.verification.attendanceRate}%) is below the mandatory 75% Senate threshold. Entry to exam hall is conditional upon Dean condonation approval.
                  </p>
                </div>
              </div>
            )}

            {/* Candidate & Seat Allotment Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-ivory-50/70 dark:bg-charcoal-800/60 border border-border/60 dark:border-charcoal-700">
              <div>
                <span className="text-[10px] text-charcoal-500 block uppercase">Candidate Name</span>
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">{hallTicketData.candidate.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 block uppercase">Roll / Register Number</span>
                <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">{hallTicketData.candidate.rollNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 block uppercase">Academic Program</span>
                <span className="font-medium text-charcoal-800 dark:text-ivory-200">{hallTicketData.candidate.program}</span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 block uppercase">Allotted Seat & Desk</span>
                <span className="font-mono font-bold text-rose-primary dark:text-rose-accent">{hallTicketData.examination.seatNumber}</span>
              </div>
            </div>

            {/* Exam Schedule Details */}
            <div className="p-3.5 rounded-xl border border-border dark:border-charcoal-700 flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-border/60 dark:border-charcoal-800 pb-2">
                <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                  [{hallTicketData.examination.courseCode}] {hallTicketData.examination.courseTitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  {hallTicketData.examination.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-rose-accent" />
                  <span>Date: {hallTicketData.examination.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-rose-accent" />
                  <span>Reporting: {hallTicketData.examination.reportingTime}</span>
                </div>
                <div className="col-span-2 text-charcoal-700 dark:text-ivory-200 font-medium">
                  Venue: {hallTicketData.examination.hallLocation}
                </div>
              </div>
            </div>

            {/* Verification Barcode Visual */}
            <div className="p-3 rounded-xl bg-charcoal-950 text-white flex flex-col items-center justify-center gap-1.5 text-center">
              <span className="font-mono text-[9px] tracking-[0.3em] text-charcoal-400">
                |||||| | |||||||| |||| ||||||||| ||| |||||||| ||||
              </span>
              <span className="text-[10px] font-mono text-charcoal-300">
                {hallTicketData.verification.authSignature}
              </span>
            </div>

            {/* Candidate Guidelines */}
            <div className="text-[10px] text-charcoal-500 dark:text-charcoal-400 flex flex-col gap-1">
              <span className="font-bold uppercase text-charcoal-700 dark:text-charcoal-300">Examination Protocol:</span>
              <p>• Mandatory to carry this admit card along with your RFID Biometric ID card.</p>
              <p>• Desk entry strictly barred 15 minutes post official commencement time.</p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-border dark:border-charcoal-800">
              <button
                type="button"
                onClick={() => setIsHallTicketModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 hover:bg-ivory-100 text-charcoal-800 dark:text-ivory-200 rounded-xl transition-all"
              >
                <Printer className="h-4 w-4" />
                <span>Print Admit Card</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadAdmitCard}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Download Admit Card</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
