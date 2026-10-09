"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Zap,
} from "lucide-react";

import { CBCSElectiveChoiceView } from "@/components/lms/CBCSElectiveChoiceView";

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
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh, currentRole, currentUser } = useApp();
  const [lmsViewMode, setLmsViewMode] = useState<"courseware" | "cbcs-electives">("courseware");
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

  // HTML5 Video Player & Telemetry State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(180);
  const [streamQuality, setStreamQuality] = useState<string>("1080p HD");
  const [isMuted, setIsMuted] = useState(false);
  const [hasTriggeredAutoMilestone, setHasTriggeredAutoMilestone] = useState(false);

  // In-Video Interactive Comprehension Checkpoint State
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizEarnedXp, setQuizEarnedXp] = useState(false);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 180;
    setCurrentTimeSec(current);
    setDurationSec(dur);
    const progress = Math.min(100, (current / dur) * 100);
    setVideoProgress(progress);

    // Auto completion when watch time reaches >= 80%
    if (progress >= 80 && !hasTriggeredAutoMilestone && activeChapter && !activeChapter.completed) {
      setHasTriggeredAutoMilestone(true);
      handleToggleCompletion(activeChapter.id, false);
      showToast("🎉 80% Lecture milestone reached! Database progress automatically recorded.", "success");
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(true);
        });
    }
  };

  const handleSetSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    showToast(`Playback speed set to ${speed}x`, "info");
  };

  const handleSeek = (deltaSeconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(durationSec, videoRef.current.currentTime + deltaSeconds));
    videoRef.current.currentTime = newTime;
    setCurrentTimeSec(newTime);
  };

  const handleSeekToPercent = (percent: number) => {
    if (!videoRef.current) return;
    const targetTime = (percent / 100) * durationSec;
    videoRef.current.currentTime = targetTime;
    setCurrentTimeSec(targetTime);
    setVideoProgress(percent);
  };

  const checkpointQuiz = {
    title: "Comprehension Checkpoint: Matrix Gradient Formulations",
    question: "In high-dimensional backpropagation, how is the weight gradient computed using batch size m, activation matrix A, and error delta?",
    options: [
      { text: "d(L)/d(W) = (1/m) * delta * A^(T)", correct: true, explanation: "Correct! The batch gradient is the outer product of incoming delta and transpose of preceding activation matrix A." },
      { text: "d(L)/d(W) = delta + A^(T)", correct: false, explanation: "Incorrect: Activation scaling requires matrix multiplication with transposed activations, not vector addition." },
      { text: "d(L)/d(W) = delta * (1 / ||A||)", correct: false, explanation: "Incorrect: Loss gradients depend directly on activations A rather than its Euclidean norm inverse." },
    ],
  };

  const handleQuizSubmit = () => {
    if (quizSelectedOption === null) {
      showToast("Please choose an answer option", "warning");
      return;
    }
    setQuizSubmitted(true);
    if (checkpointQuiz.options[quizSelectedOption].correct) {
      setQuizEarnedXp(true);
      showToast("⭐ Correct derivation! +10 XP awarded to your learning profile.", "success");
    } else {
      showToast("Review the mathematical derivation below and retry.", "warning");
    }
  };

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

        {/* LMS Mode Navigation Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-ivory-100 dark:bg-charcoal-950/80 rounded-2xl border border-border dark:border-charcoal-800 max-w-full overflow-x-auto">
          <button
            onClick={() => setLmsViewMode("courseware")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              lmsViewMode === "courseware"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <BookOpen className="h-4 w-4 text-rose-primary" />
            Courseware &amp; Learning Modules ({selectedCourse})
          </button>

          <button
            onClick={() => setLmsViewMode("cbcs-electives")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              lmsViewMode === "cbcs-electives"
                ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <Sparkles className="h-4 w-4 text-emerald-500" />
            CBCS Elective Choice Filling (Semester Enrollment)
          </button>
        </div>

        {lmsViewMode === "cbcs-electives" ? (
          <CBCSElectiveChoiceView showToast={showToast} currentUser={currentUser} />
        ) : (
          <>
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
                {/* Real HTML5 Lecture Media Player Container */}
                <div className="w-full aspect-video rounded-xl bg-charcoal-950 text-white flex flex-col justify-between p-4 relative overflow-hidden group shadow-lg border border-charcoal-800">
                  {/* HTML5 Video Element */}
                  <video
                    ref={videoRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => {
                      setIsPlaying(false);
                      if (activeChapter && !activeChapter.completed) {
                        handleToggleCompletion(activeChapter.id, false);
                      }
                    }}
                    poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop"
                    className="absolute inset-0 w-full h-full object-cover"
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    muted={isMuted}
                    playsInline
                  />

                  {/* Gradient Overlay for Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none" />

                  {/* Top Bar: Title & Quality Selector */}
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white drop-shadow truncate max-w-md">
                        {activeChapter?.title || "1.1 High-Dimensional Matrix Calculus & Backpropagation"}
                      </span>
                      <span className="text-[10px] text-ivory-300 drop-shadow">
                        Prof. Sarah Chen • Alan Turing Hall (LH-4B) • Stream Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsCheckpointModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-rose-primary/90 hover:bg-rose-primary text-white text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors backdrop-blur-sm"
                      >
                        <Zap className="h-3 w-3 text-amber-300" />
                        <span>Checkpoint Quiz</span>
                      </button>

                      <select
                        value={streamQuality}
                        onChange={(e) => {
                          setStreamQuality(e.target.value);
                          showToast(`Stream calibrated to ${e.target.value}`, "info");
                        }}
                        className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono border border-white/20 text-white outline-none cursor-pointer"
                      >
                        <option value="1080p HD">1080p HD</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                      </select>
                    </div>
                  </div>

                  {/* Center Play Button Overlay (when paused) */}
                  {!isPlaying && (
                    <button
                      onClick={handleTogglePlay}
                      className="absolute inset-0 m-auto h-16 w-16 rounded-full bg-rose-primary/90 hover:bg-rose-primary text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 z-10"
                    >
                      <Play className="h-7 w-7 ml-1 text-white fill-white" />
                    </button>
                  )}

                  {/* Bottom Controls Bar */}
                  <div className="relative z-10 flex flex-col gap-2">
                    {/* Scrubbing Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const pct = (clickX / rect.width) * 100;
                          handleSeekToPercent(pct);
                        }}
                        className="flex-1 h-2 bg-white/25 rounded-full overflow-hidden cursor-pointer relative group/bar"
                      >
                        <div
                          className="h-full bg-rose-primary rounded-full transition-all duration-100"
                          style={{ width: `${videoProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-white/90 shrink-0">
                        {formatTime(currentTimeSec)} / {formatTime(durationSec)}
                      </span>
                    </div>

                    {/* Button Row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleTogglePlay}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title={isPlaying ? "Pause" : "Play"}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                        </button>

                        <button
                          onClick={() => handleSeek(-10)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold"
                          title="Rewind 10 seconds"
                        >
                          -10s
                        </button>

                        <button
                          onClick={() => handleSeek(10)}
                          className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold"
                          title="Forward 10 seconds"
                        >
                          +10s
                        </button>

                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                          title={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/70 font-semibold mr-1">Speed:</span>
                        {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => handleSetSpeed(spd)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                              playbackSpeed === spd
                                ? "bg-rose-primary text-white"
                                : "bg-white/10 hover:bg-white/20 text-white/80"
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}

                        <div className="ml-2 pl-2 border-l border-white/20 flex items-center gap-1">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold">
                            {Math.round(videoProgress)}%
                          </span>
                          {videoProgress >= 80 && (
                            <span title="80% Milestone Reached">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
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
          </>
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

      {/* Interactive Comprehension Checkpoint Quiz Modal */}
      <Modal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        title={checkpointQuiz.title}
        description="Verify your comprehension of the core mathematical principles from this lecture segment to earn course mastery points."
      >
        <div className="flex flex-col gap-4 mt-2">
          <div className="p-3.5 rounded-xl bg-surface-soft dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700">
            <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider block mb-1">
              Lecture Checkpoint Question
            </span>
            <p className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 leading-relaxed">
              {checkpointQuiz.question}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {checkpointQuiz.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (!quizSubmitted) setQuizSelectedOption(idx);
                }}
                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                  quizSelectedOption === idx
                    ? "border-rose-primary bg-rose-container/40 dark:bg-rose-dark/20 text-rose-primary dark:text-rose-accent font-bold"
                    : "border-border dark:border-charcoal-700 hover:bg-surface-soft dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200"
                } ${
                  quizSubmitted && opt.correct
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 font-bold"
                    : ""
                }`}
              >
                <span className="h-5 w-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  {String.fromCharCode(65 + idx)}
                </span>
                <div className="flex flex-col gap-1">
                  <span>{opt.text}</span>
                  {quizSubmitted && (
                    <span className={`text-[10px] ${opt.correct ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-charcoal-500"}`}>
                      {opt.explanation}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {quizEarnedXp && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
              <Award className="h-5 w-5 text-emerald-600" />
              <span>Checkpoint Cleared! +10 XP awarded to your academic transcript.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCheckpointModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Close
            </button>
            {!quizSubmitted ? (
              <button
                type="button"
                onClick={handleQuizSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-xs"
              >
                Submit Answer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setQuizSubmitted(false);
                  setQuizSelectedOption(null);
                  setQuizEarnedXp(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-surface-soft text-charcoal-800 dark:text-ivory-100 hover:bg-rose-container"
              >
                Retry Checkpoint
              </button>
            )}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
