"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
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
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  contentType: string;
  durationMins: string;
  completed: boolean;
}

interface Module {
  id: string;
  title: string;
  duration: string;
  chapters: Chapter[];
}

export default function LMSPage() {
  const { showToast, setIsAIChatOpen, refreshTrigger, triggerRefresh } = useApp();
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [activeChapterId, setActiveChapterId] = useState<string>("");
  const [modules, setModules] = useState<Module[]>([]);
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  useEffect(() => {
    async function loadLMS() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/lms?courseCode=${selectedCourse}`);
        if (res.ok) {
          const data = await res.json();
          setCourseInfo(data.course);
          setModules(data.modules || []);
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Learning Management System (LMS)
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
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
        <div className="bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider">
              Enrolled Course
            </span>
            <h2 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
              {courseInfo?.title || "CS-402: Advanced Neural Networks & Multi-Agent Systems"}
            </h2>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
              Instructor: Prof. Sarah Chen • Department of Computer Science • 4 Credits
            </p>
          </div>

          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <div className="flex justify-between text-xs font-bold text-charcoal-800 dark:text-ivory-200">
              <span>Course Progress</span>
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
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-4">
                <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider mb-3">
                  Curriculum Syllabus
                </h3>

                <div className="flex flex-col gap-3">
                  {modules.map((mod) => (
                    <div key={mod.id} className="flex flex-col gap-1.5">
                      <div className="p-2.5 rounded-xl bg-ivory-100/70 dark:bg-charcoal-800/70 border border-border/70 dark:border-charcoal-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                          {mod.title}
                        </span>
                        <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 font-semibold shrink-0">
                          {mod.duration}
                        </span>
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
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-6 flex flex-col gap-4">
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
    </AppShell>
  );
}
