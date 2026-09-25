"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { Modal } from "@/components/common/Modal";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  BookOpen,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Lock,
  Download,
  Sparkles,
  Flame,
  Award,
  ChevronRight,
  MessageSquare,
  Check,
  Plus,
  Edit3,
  Sliders,
  FileCode,
  Video,
  Trash2,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  contentType: string;
  contentUrl?: string | null;
  fileSizeKb?: number;
  durationMins: string;
  completed: boolean;
  isPublished?: boolean;
}

interface Module {
  id: string;
  title: string;
  duration: string;
  progressPercent?: number;
  learningObjectives?: string | null;
  courseOutcomes?: string | null;
  chapters: Chapter[];
}

export default function LMSPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh, currentRole } = useApp();
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [availableCourses, setAvailableCourses] = useState<{ id: string; code: string; title: string }[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Faculty Syllabus & Material Management State
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [progressInput, setProgressInput] = useState(0);
  const [learningObjectivesInput, setLearningObjectivesInput] = useState("");
  
  const [isAddMaterialModalOpen, setIsAddMaterialModalOpen] = useState(false);
  const [materialModuleId, setMaterialModuleId] = useState("");
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialType, setMaterialType] = useState("PDF");
  const [materialUrl, setMaterialUrl] = useState("");
  const [materialFileSize, setMaterialFileSize] = useState("1500");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Module Creation State
  const [isCreateModuleModalOpen, setIsCreateModuleModalOpen] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDuration, setNewModuleDuration] = useState("4 hours • 3 Topics");
  const [newModuleObjectives, setNewModuleObjectives] = useState("");

  const isFacultyOrAdmin = ["FACULTY", "PROFESSOR", "HOD", "PRINCIPAL", "SUPER_ADMIN", "INSTITUTION_ADMIN"].includes(
    currentRole
  );

  useEffect(() => {
    async function loadLMS() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/lms?courseCode=${selectedCourse}`);
        if (res.ok) {
          const data = await res.json();
          setCourseInfo(data.course);
          setModules(data.modules || []);
          if (data.availableCourses?.length > 0) {
            setAvailableCourses(data.availableCourses);
          }
          if (data.modules?.length > 0 && !activeChapterId) {
            const firstCh = data.modules[0].chapters[0];
            if (firstCh) setActiveChapterId(firstCh.id);
          }
        } else {
          showToast("Failed to load LMS curriculum from database", "error");
        }
      } catch (err) {
        console.error("LMS load error:", err);
        showToast("Network error fetching courseware", "error");
      } finally {
        setIsLoading(false);
      }
    }

    loadLMS();
  }, [selectedCourse, refreshTrigger]);

  const activeChapter = modules
    .flatMap((m) => m.chapters)
    .find((ch) => ch.id === activeChapterId) || modules[0]?.chapters[0];

  const handleToggleCompletion = async (chapterId: string, currentStatus: boolean) => {
    try {
      setIsUpdatingProgress(true);
      const res = await fetch("/api/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          completed: !currentStatus,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message, "success");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update progress", "error");
      }
    } catch {
      showToast("Network error updating chapter progress", "error");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleUpdateSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SYLLABUS_PROGRESS",
          moduleId: selectedModule.id,
          progressPercent: Number(progressInput),
          learningObjectives: learningObjectivesInput,
        }),
      });
      if (res.ok) {
        showToast("Syllabus progress updated successfully", "success");
        setIsSyllabusModalOpen(false);
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update syllabus", "error");
      }
    } catch {
      showToast("Network error updating syllabus", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialModuleId || !materialTitle) {
      showToast("Module and Material Title are required", "warning");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_MATERIAL",
          moduleId: materialModuleId,
          title: materialTitle,
          contentType: materialType,
          contentUrl: materialUrl,
          fileSizeKb: Number(materialFileSize) || 1200,
        }),
      });
      if (res.ok) {
        showToast("Learning material uploaded to courseware", "success");
        setIsAddMaterialModalOpen(false);
        setMaterialTitle("");
        setMaterialUrl("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to add material", "error");
      }
    } catch {
      showToast("Network error adding learning material", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle) {
      showToast("Unit Title is required", "warning");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/lms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_MODULE",
          courseCode: selectedCourse,
          title: newModuleTitle,
          description: newModuleDuration,
          learningObjectives: newModuleObjectives,
        }),
      });
      if (res.ok) {
        showToast("New curriculum unit created successfully", "success");
        setIsCreateModuleModalOpen(false);
        setNewModuleTitle("");
        setNewModuleObjectives("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to create unit", "error");
      }
    } catch {
      showToast("Network error creating unit", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string, title: string) => {
    if (!confirm(`Delete chapter "${title}"?`)) return;
    try {
      const res = await fetch(`/api/lms?chapterId=${chapterId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Chapter deleted from curriculum", "success");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete chapter", "error");
      }
    } catch {
      showToast("Network error deleting chapter", "error");
    }
  };

  const handleDeleteModule = async (moduleId: string, title: string) => {
    if (!confirm(`Delete unit "${title}" and all its chapters?`)) return;
    try {
      const res = await fetch(`/api/lms?moduleId=${moduleId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Curriculum unit deleted", "success");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete unit", "error");
      }
    } catch {
      showToast("Network error deleting unit", "error");
    }
  };

  const handleDownloadSlides = () => {
    const chapterTitle = activeChapter?.title || "1.1 High-Dimensional Matrix Calculus & Backpropagation";
    const content = `=====================================================
            APEX ACADEMIC LECTURE SLIDE DECK
=====================================================
Course: CS-402 Advanced Neural Networks & Multi-Agent Systems
Instructor: Prof. Sarah Chen
Department: Department of Computer Science & Engineering
Chapter: ${chapterTitle}
Academic Term: Fall 2026
Verified by: Apex Academic Senate
Verification Code: APX-LMS-2026-${Date.now()}
=====================================================

1. High-Dimensional Matrix Calculus & Backpropagation
- Gradient of scalar loss function L with respect to weight matrix W:
  d(L)/d(W) = (1/m) * delta * A^(T)
- Jacobian matrices for vector-valued activations and Hadamard products.
- Optimization dynamics: AdamW with decoupled weight decay.

2. Numerical Stability & Mixed-Precision:
- FP16 & BF16 gradient scaling to prevent underflow.
- Dynamic loss scale manager.
- Gradient norm clipping threshold: max_norm = 1.0.

3. Distributed Training & Sharded Optimizers:
- ZeRO Stage 1-3 memory reduction profiles.
- All-reduce gradient synchronization ring topology.
- Pipeline parallelism across Tensor Core accelerators.

4. Reading & Laboratory Assignments:
- Problem Set 4: Implement attention assertions in Triton/PyTorch.
- Reference: Vaswani et al. (2017) "Attention Is All You Need".
=====================================================`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CS-402_Lecture_SlideDeck_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded verified lecture slide deck", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Learning Management System (LMS)
                </h1>
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  Interactive Courseware
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Course modules, video streams, lab notes, reading materials, quizzes, and live database progress tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-xs font-bold">
              <Flame className="h-4 w-4 text-amber-600" />
              <span>12 Day Learning Streak</span>
            </div>
          </div>
        </div>

        {/* Course Banner & Progress */}
        <div className="glass-panel p-6 rounded-2xl shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider">
                {isFacultyOrAdmin ? "Assigned Course" : "Enrolled Course"}
              </span>
              {availableCourses.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-charcoal-500 font-semibold">Switch:</span>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-2 py-0.5 text-xs rounded-lg border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none focus:border-rose-primary"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
              {courseInfo?.title || "CS-402: Advanced Neural Networks & Multi-Agent Systems"}
            </h2>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
              Department of Computer Science • 4 Credits • Theory & Laboratory Integrated
            </p>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <div className="flex justify-between text-xs font-bold text-charcoal-800 dark:text-ivory-200">
              <span>{isFacultyOrAdmin ? "Curriculum Delivery Rate" : "Course Progress"}</span>
              <span className="text-rose-primary dark:text-rose-accent">
                {courseInfo?.progressPercent || 0}% Complete
              </span>
            </div>
            <div className="w-full h-2.5 bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden border border-border dark:border-charcoal-700">
              <div
                className="h-full bg-rose-primary rounded-full transition-all duration-500"
                style={{ width: `${courseInfo?.progressPercent || 0}%` }}
              />
            </div>
            <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 text-right font-medium">
              {courseInfo?.completedCount || 0} of {courseInfo?.totalChapters || 0} Chapters Verified
            </span>
          </div>
        </div>

        {/* 2-Column LMS Workspace */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5"><SkeletonCard /></div>
            <div className="lg:col-span-7"><SkeletonCard /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Modules List (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="glass-panel rounded-2xl shadow-soft p-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-3">
                  <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                    Curriculum Syllabus
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400 font-semibold">
                      {modules.length} Units
                    </span>
                    {isFacultyOrAdmin && (
                      <button
                        onClick={() => setIsCreateModuleModalOpen(true)}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-primary text-white hover:bg-rose-dark flex items-center gap-1 shadow-2xs transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Add Unit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {modules.map((mod) => (
                    <div key={mod.id} className="flex flex-col gap-1.5">
                      <div className="p-3 rounded-xl bg-ivory-100/70 dark:bg-charcoal-800/70 border border-border/70 dark:border-charcoal-700 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                            {mod.title}
                          </span>
                          <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-semibold shrink-0">
                            {mod.duration}
                          </span>
                        </div>

                        {/* Module Progress Bar */}
                        <div className="flex items-center gap-2">
                          <div className="w-full h-1.5 bg-border/40 dark:bg-charcoal-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-primary rounded-full transition-all"
                              style={{ width: `${mod.progressPercent ?? 0}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400 shrink-0">
                            {mod.progressPercent ?? 0}%
                          </span>
                        </div>

                        {/* Faculty Unit Management Controls */}
                        {isFacultyOrAdmin && (
                          <div className="flex items-center justify-end gap-2 pt-1.5 border-t border-border/40 dark:border-charcoal-700/60">
                            <button
                              onClick={() => {
                                setSelectedModule(mod);
                                setProgressInput(mod.progressPercent ?? 0);
                                setLearningObjectivesInput(mod.learningObjectives || "");
                                setIsSyllabusModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:text-rose-primary flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Sliders className="h-3 w-3" />
                              <span>Update Syllabus %</span>
                            </button>
                            <button
                              onClick={() => {
                                setMaterialModuleId(mod.id);
                                setIsAddMaterialModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 border border-rose-accent/30 text-rose-primary dark:text-rose-accent hover:opacity-85 flex items-center gap-1 transition-colors shadow-2xs"
                            >
                              <Plus className="h-3 w-3" />
                              <span>+ Material</span>
                            </button>
                            <button
                              onClick={() => handleDeleteModule(mod.id, mod.title)}
                              title="Delete Unit"
                              className="p-1 rounded text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 pl-2">
                        {mod.chapters.map((ch) => (
                          <div
                            key={ch.id}
                            className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                              activeChapter?.id === ch.id
                                ? "bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent font-bold border border-rose-accent/30"
                                : "hover:bg-ivory-50 dark:hover:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 font-medium"
                            }`}
                          >
                            <button
                              onClick={() => {
                                setActiveChapterId(ch.id);
                                showToast(`Loaded lecture: ${ch.title}`, "info");
                              }}
                              className="flex items-center gap-2 min-w-0 flex-1 text-left"
                            >
                              {ch.completed ? (
                                <CheckCircle2 className="h-4 w-4 text-academic-success shrink-0" />
                              ) : (
                                <PlayCircle className="h-4 w-4 text-charcoal-400 shrink-0" />
                              )}
                              <span className="truncate">{ch.title}</span>
                            </button>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-charcoal-400">
                                {ch.durationMins}
                              </span>
                              <button
                                onClick={() => handleToggleCompletion(ch.id, ch.completed)}
                                disabled={isUpdatingProgress}
                                title={ch.completed ? "Mark as Incomplete" : "Mark as Completed"}
                                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                                  ch.completed
                                    ? "bg-academic-success text-white"
                                    : "border border-border dark:border-charcoal-600 hover:border-rose-primary text-charcoal-400"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              {isFacultyOrAdmin && (
                                <button
                                  onClick={() => handleDeleteChapter(ch.id, ch.title)}
                                  title="Delete Chapter"
                                  className="h-5 w-5 rounded flex items-center justify-center text-charcoal-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Active Lecture Player / Reader Workspace (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="glass-panel rounded-2xl shadow-soft p-6 flex flex-col gap-4">
                {/* Simulated Lecture Media Player Container */}
                <div className="w-full aspect-video rounded-xl bg-charcoal-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden group shadow-md">
                  <PlayCircle className="h-16 w-16 text-rose-accent group-hover:scale-110 transition-transform cursor-pointer" />
                  <span className="text-xs font-bold mt-2 text-center px-4">
                    {activeChapter?.title || "1.1 High-Dimensional Matrix Calculus & Backpropagation"}
                  </span>
                  <span className="text-[10px] text-charcoal-400">
                    Lecturer: Prof. Sarah Chen • Recorded in Alan Turing Hall (LH-4B)
                  </span>
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono">
                      1080p HD
                    </span>
                  </div>
                </div>

                {/* Lecture Notes & Downloads */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-b border-border dark:border-charcoal-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                      Lecture Notes & Syllabus References
                    </h3>
                    <span className="text-[11px] text-charcoal-500 dark:text-charcoal-400">
                      Verified university courseware • Licensed for enrolled scholars
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeChapter && (
                      <button
                        onClick={() => handleToggleCompletion(activeChapter.id, activeChapter.completed)}
                        disabled={isUpdatingProgress}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          activeChapter.completed
                            ? "bg-academic-success-subtle text-academic-success border border-green-300"
                            : "bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{activeChapter.completed ? "Completed" : "Mark Complete"}</span>
                      </button>
                    )}

                    <button
                      onClick={handleDownloadSlides}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-xs font-bold text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-all"
                    >
                      <Download className="h-3.5 w-3.5 text-charcoal-600 dark:text-charcoal-400" />
                      <span>Download Slides</span>
                    </button>
                    <button
                      onClick={() => setIsAIChatOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-primary hover:bg-rose-dark text-xs font-bold text-white shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Explain via AI</span>
                    </button>
                  </div>
                </div>

                {/* Key Concept Summaries */}
                <div className="p-4 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 text-xs text-charcoal-800 dark:text-ivory-200 flex flex-col gap-2">
                  <span className="font-bold text-rose-primary dark:text-rose-accent uppercase text-[10px] tracking-wider">
                    Core Mathematical Theorem
                  </span>
                  <p className="leading-relaxed">
                    Backpropagation computes the gradient of the loss function with respect to each weight matrix by recursive application of the chain rule:
                  </p>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 font-mono text-[11px] text-charcoal-900 dark:text-ivory-100">
                    {"d(L)/d(W) = (1/m) * delta * A^(T)"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Faculty Modal 1: Update Syllabus Progress */}
      <Modal
        isOpen={isSyllabusModalOpen}
        onClose={() => setIsSyllabusModalOpen(false)}
        title="Update Syllabus Coverage (%)"
        description="Update lecture delivery progress and accredited course outcomes for this academic unit."
      >
        <form onSubmit={handleUpdateSyllabus} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Unit / Module Title
            </label>
            <input
              type="text"
              disabled
              value={selectedModule?.title || ""}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-charcoal-500 font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-charcoal-700 dark:text-ivory-200">
                Delivery Progress (% Completed)
              </label>
              <span className="text-xs font-mono font-bold text-rose-primary dark:text-rose-accent">
                {progressInput}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressInput}
              onChange={(e) => setProgressInput(Number(e.target.value))}
              className="w-full accent-rose-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Accredited Learning Objectives / Key Outlines
            </label>
            <textarea
              rows={3}
              value={learningObjectivesInput}
              onChange={(e) => setLearningObjectivesInput(e.target.value)}
              placeholder="e.g. Mastered RoPE positional encodings, KV-cache quantization, and FlashAttention-2 benchmarks."
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsSyllabusModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : "Save Syllabus Progress"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Faculty Modal 2: Add Learning Material */}
      <Modal
        isOpen={isAddMaterialModalOpen}
        onClose={() => setIsAddMaterialModalOpen(false)}
        title="Upload Academic Material"
        description="Publish lecture slides, lab code, syllabus notes, or video lectures for enrolled students."
      >
        <form onSubmit={handleAddMaterial} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Select Module
            </label>
            <select
              value={materialModuleId}
              onChange={(e) => setMaterialModuleId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary"
            >
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Material Title *
            </label>
            <input
              type="text"
              required
              value={materialTitle}
              onChange={(e) => setMaterialTitle(e.target.value)}
              placeholder="e.g. Unit 2 Laboratory Manual: Attention Kernels"
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
                Content Type
              </label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary"
              >
                <option value="PDF">PDF Document</option>
                <option value="SLIDES">Lecture Slide Deck</option>
                <option value="VIDEO">Video Lecture Stream</option>
                <option value="CODE">Lab Code / Repository</option>
                <option value="QUIZ">Interactive Quiz</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
                Est. File Size (KB)
              </label>
              <input
                type="number"
                value={materialFileSize}
                onChange={(e) => setMaterialFileSize(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Resource URL / Storage Path (Optional)
            </label>
            <input
              type="text"
              value={materialUrl}
              onChange={(e) => setMaterialUrl(e.target.value)}
              placeholder="e.g. /materials/cs402_attention_lab.py or YouTube URL"
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsAddMaterialModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Uploading..." : "Publish Material"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Faculty Modal 3: Create Curriculum Unit / Module */}
      <Modal
        isOpen={isCreateModuleModalOpen}
        onClose={() => setIsCreateModuleModalOpen(false)}
        title="Add Curriculum Unit"
        description="Structure a new syllabus unit, topic outlines, and accredited course learning outcomes."
      >
        <form onSubmit={handleCreateModule} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Unit Title *
            </label>
            <input
              type="text"
              required
              value={newModuleTitle}
              onChange={(e) => setNewModuleTitle(e.target.value)}
              placeholder="e.g. Unit IV: Graph Neural Networks & Geometric Deep Learning"
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Duration & Estimated Topics
            </label>
            <input
              type="text"
              value={newModuleDuration}
              onChange={(e) => setNewModuleDuration(e.target.value)}
              placeholder="e.g. 5 hours • 3 Topics"
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-ivory-200 mb-1">
              Learning Objectives & Accredited Outcomes (Optional)
            </label>
            <textarea
              rows={3}
              value={newModuleObjectives}
              onChange={(e) => setNewModuleObjectives(e.target.value)}
              placeholder="Describe foundational principles and accredited course outcomes (e.g. CO4: Formulate spectral graph convolutions)..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateModuleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Unit"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
