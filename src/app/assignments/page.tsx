"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Award,
  Sparkles,
  Check,
  Edit3,
  Lock,
} from "lucide-react";

export default function AssignmentsPage() {
  const { showToast, currentRole, setIsAIChatOpen, refreshTrigger, triggerRefresh } = useApp();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isStudent = currentRole === "STUDENT" || currentRole === "PARENT";

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Student Submission Form State
  const [submitContent, setSubmitContent] = useState("");
  const [submitFileUrl, setSubmitFileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Faculty Grading Form State: { [submissionId: string]: { points: string; feedback: string } }
  const [gradesMap, setGradesMap] = useState<Record<string, { points: string; feedback: string }>>({});
  const [isSavingGrade, setIsSavingGrade] = useState<Record<string, boolean>>({});

  // Create Assignment Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    courseCode: "CS-402",
    dueDate: "",
    maxPoints: "100",
  });

  const fetchAssignments = () => {
    setIsLoading(true);
    fetch("/api/assignments")
      .then((res) => res.json())
      .then((data) => {
        setAssignments(data.assignments || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Assignments fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAssignments();
  }, [refreshTrigger]);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Assignment published and dispatched to student LMS", "success");
        setIsCreateModalOpen(false);
        setForm({ title: "", description: "", courseCode: "CS-402", dueDate: "", maxPoints: "100" });
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create assignment", "error");
      }
    } catch {
      showToast("Error creating assignment", "error");
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: selectedAssignment.id,
          content: submitContent || "Student completed coursework solution",
          fileUrl: submitFileUrl || "/uploads/submissions/assignment-solution.pdf",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Solution submitted successfully", "success");
        setIsSubmitModalOpen(false);
        setSubmitContent("");
        setSubmitFileUrl("");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to submit assignment", "error");
      }
    } catch {
      showToast("Network error submitting assignment", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeChange = (submissionId: string, field: "points" | "feedback", value: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [submissionId]: {
        points: field === "points" ? value : prev[submissionId]?.points ?? "",
        feedback: field === "feedback" ? value : prev[submissionId]?.feedback ?? "",
      },
    }));
  };

  const handleSaveGrade = async (submissionId: string, maxPoints: number, lock: boolean = false) => {
    const input = gradesMap[submissionId];
    if (!input || input.points === "") {
      showToast("Please enter marks before saving", "error");
      return;
    }

    const pts = Number(input.points);
    if (isNaN(pts) || pts < 0 || pts > maxPoints) {
      showToast(`Marks must be between 0 and ${maxPoints}`, "error");
      return;
    }

    setIsSavingGrade((prev) => ({ ...prev, [submissionId]: true }));
    try {
      const res = await fetch("/api/assignments/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          gradePoints: pts,
          feedback: input.feedback || "Evaluated by faculty.",
          lock,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || (lock ? "Grade finalized and locked" : "Grade recorded successfully"), "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to record grade", "error");
      }
    } catch {
      showToast("Network error submitting grade", "error");
    } finally {
      setIsSavingGrade((prev) => ({ ...prev, [submissionId]: false }));
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Course Assignments & Submissions
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Rubric-based evaluation, student code artifact submissions, and faculty feedback loop
              </p>
            </div>
          </div>

          {!isStudent && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assignment</span>
            </button>
          )}
        </div>

        {/* Assignment Cards */}
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No assignments posted yet"
            description="Publish your first syllabus assignment for students to submit coursework."
            actionLabel={!isStudent ? "Create First Assignment" : undefined}
            onAction={!isStudent ? () => setIsCreateModalOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assignments.map((asg) => {
              const mySub = asg.submissions && asg.submissions.length > 0 ? asg.submissions[0] : null;

              return (
                <div
                  key={asg.id}
                  className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                        {asg.courseCode}
                      </span>
                      <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                        {asg.maxPoints} Points
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-2">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-2 line-clamp-3">
                      {asg.description}
                    </p>

                    <div className="mt-4 flex flex-col gap-1 text-[11px] text-charcoal-500 dark:text-charcoal-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-rose-accent" />
                        <span>Due: {asg.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-rose-accent" />
                        <span>Submissions: {asg.submissionCount} students</span>
                      </div>
                    </div>

                    {/* Student Status Badge */}
                    {isStudent && mySub && (
                      <div className="mt-3 p-2 rounded-xl bg-academic-success-subtle border border-green-200 text-[11px] text-academic-success font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Submitted
                        </span>
                        {mySub.gradePoints !== null && mySub.gradePoints !== undefined ? (
                          <span className="font-bold">
                            Score: {mySub.gradePoints} / {asg.maxPoints}
                          </span>
                        ) : (
                          <span className="text-charcoal-500 font-normal">Pending Faculty Review</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between">
                    {isStudent ? (
                      <button
                        onClick={() => {
                          setSelectedAssignment(asg);
                          setIsSubmitModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{mySub ? "Resubmit Work" : "Submit Work"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAssignment(asg);
                          // Initialize gradesMap with existing grades
                          const initialGrades: Record<string, { points: string; feedback: string }> = {};
                          (asg.submissions || []).forEach((s: any) => {
                            initialGrades[s.id] = {
                              points: s.gradePoints !== null && s.gradePoints !== undefined ? String(s.gradePoints) : "",
                              feedback: s.feedback || "",
                            };
                          });
                          setGradesMap(initialGrades);
                          setIsGradeModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Grade Submissions ({asg.submissionCount})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setIsAIChatOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 hover:text-rose-primary"
                    >
                      <Sparkles className="h-3 w-3 text-rose-accent" />
                      <span>AI Rubric</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Publish Course Assignment"
        description="Creates course coursework deliverable in the database."
      >
        <form onSubmit={handleCreateAssignment} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Multi-Head Scaled Attention from Scratch"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Course
              </label>
              <select
                value={form.courseCode}
                onChange={(e) => setForm({ ...form, courseCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CS-402">CS-402: Advanced Neural Networks</option>
                <option value="BIO-210">BIO-210: Cellular Genomics & CRISPR</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Max Marks
              </label>
              <input
                type="number"
                value={form.maxPoints}
                onChange={(e) => setForm({ ...form, maxPoints: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Assignment Description & Deliverables
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Detail required code submissions, PDF reports, or dataset configurations..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Assignment Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Submit: ${selectedAssignment?.title || "Assignment"}`}
        description="Submit your coursework solution writeup or repository URL."
      >
        <form onSubmit={handleSubmitAssignment} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Deliverable File / GitHub Repository URL
            </label>
            <input
              type="text"
              value={submitFileUrl}
              onChange={(e) => setSubmitFileUrl(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. https://github.com/student/neural-net or /uploads/submissions/sol.pdf"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Solution Description & Student Notes
            </label>
            <textarea
              required
              rows={3}
              value={submitContent}
              onChange={(e) => setSubmitContent(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Detail your solution, architectural trade-offs, and test passes..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Confirm Submission"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Faculty Grading Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={`Grading: ${selectedAssignment?.title || "Assignment"}`}
        description={`Evaluate student submissions out of ${selectedAssignment?.maxPoints || 100} points.`}
      >
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-1">
          {(!selectedAssignment?.submissions || selectedAssignment.submissions.length === 0) ? (
            <div className="p-4 text-center text-xs text-charcoal-500 italic">
              No student has submitted coursework for this assignment yet.
            </div>
          ) : (
            selectedAssignment.submissions.map((sub: any) => {
              const currentInput = gradesMap[sub.id] || { points: "", feedback: "" };
              const saving = !!isSavingGrade[sub.id];

              return (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-900/50 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-charcoal-900 dark:text-ivory-100 block">
                        {sub.studentName}
                      </span>
                      <span className="text-[10px] text-charcoal-500">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    {sub.gradePoints !== null && sub.gradePoints !== undefined && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                        Graded: {sub.gradePoints} / {selectedAssignment.maxPoints}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-charcoal-600 block mb-0.5">
                        Marks (Max {selectedAssignment.maxPoints})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={selectedAssignment.maxPoints}
                        value={currentInput.points}
                        onChange={(e) => handleGradeChange(sub.id, "points", e.target.value)}
                        placeholder="e.g. 92"
                        className="w-full text-xs p-1.5 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-charcoal-600 block mb-0.5">
                        Faculty Feedback
                      </label>
                      <input
                        type="text"
                        value={currentInput.feedback}
                        onChange={(e) => handleGradeChange(sub.id, "feedback", e.target.value)}
                        placeholder="Excellent attention implementation..."
                        className="w-full text-xs p-1.5 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    {sub.feedback?.includes("[LOCKED]") && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                    <button
                      onClick={() => handleSaveGrade(sub.id, selectedAssignment.maxPoints, false)}
                      disabled={saving}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-charcoal-800 hover:bg-surface-soft text-charcoal-700 dark:text-ivory-200 border border-border dark:border-charcoal-700 rounded-lg shadow-2xs disabled:opacity-50 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                      <span>{saving ? "Saving..." : "Save Draft"}</span>
                    </button>
                    <button
                      onClick={() => handleSaveGrade(sub.id, selectedAssignment.maxPoints, true)}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-lg shadow-xs disabled:opacity-50 transition-colors"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Lock & Finalize</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
