"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { AI_AGENTS, AgentId } from "@/lib/ai/agents";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Bot,
  Sparkles,
  BookOpen,
  Calendar,
  Award,
  Layers,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  RotateCw,
  Zap,
  Play,
  Pause,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

interface StudioMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    documentTitle: string;
    category: string;
    excerpt: string;
  }>;
}

export default function AIAssistantStudioPage() {
  const { currentUser, currentRole, showToast } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("academic");
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Focus Pomodoro Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      showToast("Academic Focus Interval Completed! Take a 5 min break.", "success");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const quickPrompts = [
    "Summarize CS-402 FlashAttention-2 online softmax tiling",
    "Explain Raft consensus leader election invariants",
    "What marks do I need in Mid-Term to maintain a 3.8+ GPA?",
    "Outline the 75% biometric attendance regulation policy",
  ];

  const [conversation, setConversation] = useState<StudioMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Welcome to the CLASSROOM AI Academic Studio, ${currentUser?.firstName || "Scholar"}! I am connected to your Fall 2026 courses (CS-402, BIO-210, CS-301) and institutional regulations. How can I assist your revision or research preparations today?`,
      citations: [
        {
          documentTitle: "CS-402 Advanced Neural Networks Syllabus & Schedule",
          category: "SYLLABUS",
          excerpt: "Mid-Term Examination is scheduled for Week 8 and accounts for 30% of total grade.",
        },
      ],
    },
  ]);

  const flashcards = [
    { q: "What is the key advantage of FlashAttention-2?", a: "Reduces memory reads/writes between GPU HBM and fast SRAM via online softmax tiling." },
    { q: "What is Bloom's Taxonomy Level 4?", a: "Analyze: Distinguishing, organizing, and relating components within a theoretical framework." },
    { q: "What is the mandatory attendance threshold at Apex University?", a: "75.0% minimum across lectures, tutorials, and labs." },
    { q: "In Raft consensus, when does a candidate become a leader?", a: "When it receives affirmative votes from a majority of servers for the same election term." },
  ];

  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    setInputQuery("");

    const userMsg: StudioMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
    };

    setConversation((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          prompt: textToSend,
          userId: currentUser?.id || "usr-anon-01",
          userRole: currentRole || "STUDENT",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMsg: StudioMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.content || data.answer || "Autonomous response formulation completed.",
          citations: data.citations || [],
        };
        setConversation((prev) => [...prev, assistantMsg]);
      } else {
        showToast(data.error || "Autonomous copilot failed to formulate response", "error");
      }
    } catch {
      showToast("Network connection error to AI knowledge engine", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Header Hero Section */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-1/4 -mt-10 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -mb-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-primary via-rose-accent to-purple-600 text-white flex items-center justify-center shadow-lg shadow-rose-primary/30 shrink-0">
                <Bot className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    CLASSROOM AI Academic Studio & Copilot
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-primary text-white shadow-xs">
                    <Sparkles className="h-3 w-3" /> 12 Autonomous Specialized Agents
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                    Grounded RAG Active
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  Hallucination-free academic tutoring, citation-grounded syllabus review, active recall flashcards, and personalized study pacing.
                </p>
              </div>
            </div>

            {/* Pomodoro Focus Mini Pill */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white dark:bg-charcoal-900/90 border border-border dark:border-charcoal-800 shadow-soft">
              <div className="flex items-center gap-2 px-2">
                <Clock className="h-4 w-4 text-rose-primary animate-pulse" />
                <div>
                  <span className="text-[9px] uppercase font-bold text-charcoal-400 block">Focus Timer</span>
                  <span className="text-sm font-mono font-bold text-charcoal-900 dark:text-ivory-100">
                    {formatTimer(timerSeconds)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-2 rounded-xl text-white transition-all shadow-xs cursor-pointer ${
                  isTimerRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-rose-primary hover:bg-rose-dark"
                }`}
              >
                {isTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(25 * 60);
                }}
                className="p-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-600 dark:text-charcoal-400 cursor-pointer"
                title="Reset Timer"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Studio Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Chat & Citations (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Agent Selector Bar */}
            <div className="glass-panel p-3 rounded-2xl shadow-soft flex items-center gap-2 overflow-x-auto border border-border dark:border-charcoal-800">
              <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider shrink-0 pl-1">
                Active Agent:
              </span>
              {AI_AGENTS.map((ag) => (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setSelectedAgent(ag.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedAgent === ag.id
                      ? "bg-rose-primary text-white shadow-xs"
                      : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container hover:text-rose-primary"
                  }`}
                >
                  {ag.name.replace("CLASSROOM ", "")}
                </button>
              ))}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-[11px] font-semibold text-charcoal-700 dark:text-charcoal-300 hover:border-rose-primary hover:text-rose-primary transition-all whitespace-nowrap shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-rose-primary shrink-0" />
                  <span>{prompt}</span>
                </button>
              ))}
            </div>

            {/* Chat Messages Log */}
            <div className="glass-panel rounded-3xl shadow-soft p-5 h-[520px] overflow-y-auto flex flex-col gap-4 border border-border dark:border-charcoal-800">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[88%] ${
                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 px-1 text-[10px] text-charcoal-400">
                    <span>{msg.role === "user" ? "You (Scholar)" : "AI Academic Copilot"}</span>
                  </div>

                  <div
                    className={`p-4 rounded-3xl text-xs leading-relaxed relative group ${
                      msg.role === "user"
                        ? "bg-rose-primary text-white rounded-tr-none shadow-md"
                        : "bg-surface-soft dark:bg-charcoal-800/90 text-charcoal-900 dark:text-ivory-100 border border-border dark:border-charcoal-700 rounded-tl-none shadow-soft"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Copy action */}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, msg.id)}
                      className={`absolute top-2 right-2 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
                        msg.role === "user" ? "hover:bg-white/20 text-white" : "hover:bg-charcoal-700/20 text-charcoal-400"
                      }`}
                      title="Copy text"
                    >
                      {copiedId === msg.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>

                    {/* Grounded Citations Section */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-border/70 dark:border-charcoal-700/70 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Grounded Archive Citations:
                        </span>
                        {msg.citations.map((c: any, i: number) => (
                          <div
                            key={i}
                            className="bg-white dark:bg-charcoal-900 p-2.5 rounded-xl border border-border dark:border-charcoal-700 text-[11px]"
                          >
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {c.documentTitle}
                            </span>
                            <p className="text-charcoal-600 dark:text-charcoal-400 italic mt-0.5">&quot;{c.excerpt}&quot;</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex items-center gap-3 p-4 rounded-3xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-xs text-charcoal-600 dark:text-charcoal-300 shadow-soft">
                  <Sparkles className="h-4 w-4 text-rose-primary animate-spin" />
                  <span>Synthesizing grounded multi-source response...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="glass-panel rounded-3xl shadow-soft p-3 flex items-center gap-2 border border-border dark:border-charcoal-800">
              <input
                type="text"
                placeholder={`Ask ${AI_AGENTS.find((a) => a.id === selectedAgent)?.name}...`}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="flex-1 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-2xl px-4 py-2.5 text-xs text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 focus:outline-none focus:ring-1 focus:ring-rose-primary font-medium"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isLoading}
                className="px-5 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark disabled:opacity-50 text-white font-bold text-xs shadow-md flex items-center gap-2 shrink-0 btn-primary-glow cursor-pointer transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Right Column: Flashcards & Study Planner (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Interactive Flashcard Deck */}
            <div className="glass-panel rounded-3xl shadow-soft p-6 flex flex-col gap-4 border border-border dark:border-charcoal-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Active Recall Flashcards
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Card {cardIndex + 1} of {flashcards.length}
                </span>
              </div>

              {/* Card Container with luxury hover */}
              <div
                onClick={() => setShowAnswer(!showAnswer)}
                className="p-6 rounded-3xl border-2 border-dashed border-rose-primary/30 bg-gradient-to-br from-ivory-50/90 to-rose-primary/[0.04] dark:from-charcoal-900/90 dark:to-charcoal-800/80 hover:border-rose-primary/60 transition-all flex flex-col items-center justify-center text-center min-h-[180px] cursor-pointer shadow-soft group"
              >
                <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {showAnswer ? "Answer Unlocked" : "Question (Click to Reveal Answer)"}
                </span>
                <p className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 leading-relaxed px-2">
                  {showAnswer ? flashcards[cardIndex].a : flashcards[cardIndex].q}
                </p>
                <span className="text-[9px] text-charcoal-400 mt-3 block group-hover:text-rose-primary transition-colors">
                  Tap to flip card
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnswer(false);
                    setCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAnswer(false);
                    setCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm btn-primary-glow cursor-pointer transition-all"
                >
                  Next Card
                </button>
              </div>
            </div>

            {/* Personalized AI Study Plan */}
            <div className="glass-panel rounded-3xl shadow-soft p-6 flex flex-col gap-4 border border-border dark:border-charcoal-800">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 dark:border-charcoal-800">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-rose-primary" />
                  Personalized Mid-Term Plan
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                  98% On Track
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-surface-soft/80 dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                      Today: CS-402 Attention Tensors
                    </span>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                      45 mins active problem formulation & tiling
                    </span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-academic-success" />
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-soft/80 dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                      Tomorrow: Raft Consensus Invariants
                    </span>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                      60 mins distributed systems drill
                    </span>
                  </div>
                  <Clock className="h-4 w-4 text-charcoal-400 dark:text-charcoal-500" />
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-soft/80 dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                      Friday: BIO-210 Genomics Variant Pipeline
                    </span>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                      30 mins statistical genetics revision
                    </span>
                  </div>
                  <Clock className="h-4 w-4 text-charcoal-400 dark:text-charcoal-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
