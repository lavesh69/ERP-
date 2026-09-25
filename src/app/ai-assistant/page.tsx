"use client";

import React, { useState } from "react";
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

  const [conversation, setConversation] = useState<StudioMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Welcome to the CLASSROOM AI Academic Studio, ${currentUser.firstName}! I am linked with your Fall 2026 courses (CS-402, BIO-210, CS-301). How can I assist your revision or academic preparation today?`,
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
  ];

  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleSend = async () => {
    if (!inputQuery.trim() || isLoading) return;

    const query = inputQuery.trim();
    setInputQuery("");

    const userMsg: StudioMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    setConversation((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          agentId: selectedAgent,
          context: {
            role: currentRole,
            userEmail: currentUser.email,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const assistantMsg: StudioMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer,
          citations: data.citations,
        };
        setConversation((prev) => [...prev, assistantMsg]);
      } else {
        showToast(data.error || "Autonomous copilot failed to formulate response", "danger");
      }
    } catch {
      showToast("Network connection error to AI knowledge engine", "danger");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  CLASSROOM AI Academic Studio
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-primary text-white">
                  12 Specialized Autonomous Agents
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Grounded academic tutoring, weak-topic diagnostics, interactive flashcard recall, and personalized study paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-200 dark:border-green-800 text-xs font-bold">
              <ShieldCheck className="h-4 w-4" />
              <span>Zero-Hallucination Guard Active</span>
            </span>
          </div>
        </div>

        {/* 2-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Chat & Citations (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Agent Selector */}
            <div className="glass-panel p-3 rounded-2xl shadow-soft flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider shrink-0">
                Agent:
              </span>
              {AI_AGENTS.map((ag) => (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgent(ag.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedAgent === ag.id
                      ? "bg-rose-primary text-white shadow-xs"
                      : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container dark:hover:bg-charcoal-700"
                  }`}
                >
                  {ag.name.replace("CLASSROOM ", "")}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="glass-panel rounded-2xl shadow-soft p-5 h-[500px] overflow-y-auto flex flex-col gap-4">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 max-w-[85%] ${
                    msg.role === "user" ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-rose-primary text-white rounded-tr-none shadow-sm"
                        : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 border border-border dark:border-charcoal-700 rounded-tl-none shadow-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/70 dark:border-charcoal-700/70 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase">
                          Grounded Citations:
                        </span>
                        {msg.citations.map((c: any, i: number) => (
                          <div key={i} className="bg-white dark:bg-charcoal-900 p-2 rounded-lg border border-border dark:border-charcoal-700 text-[11px]">
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100">{c.documentTitle}</span>
                            <p className="text-charcoal-600 dark:text-charcoal-400 italic mt-0.5">&quot;{c.excerpt}&quot;</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex items-center gap-2 p-3.5 rounded-2xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-xs text-charcoal-600 dark:text-charcoal-300">
                  <Sparkles className="h-4 w-4 text-rose-accent animate-spin" />
                  <span>Synthesizing grounded response...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="glass-panel rounded-2xl shadow-soft p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Ask ${AI_AGENTS.find((a) => a.id === selectedAgent)?.name}...`}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                className="flex-1 bg-ivory-100 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-4 py-2.5 text-xs text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 focus:outline-none focus:ring-1 focus:ring-rose-primary font-medium"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isLoading}
                className="px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0 btn-primary-glow"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Right Column: Flashcards & Study Planner (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Interactive Flashcard Deck */}
            <div className="glass-panel rounded-2xl shadow-soft p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500" />
                  Active Recall Flashcards
                </span>
                <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500">
                  Card {cardIndex + 1} of {flashcards.length}
                </span>
              </div>

              <div
                onClick={() => setShowAnswer(!showAnswer)}
                className="p-6 rounded-2xl border-2 border-dashed border-rose-accent/40 dark:border-rose-accent/30 bg-ivory-50/70 dark:bg-charcoal-900/60 hover:bg-rose-container/20 dark:hover:bg-charcoal-800/80 transition-all flex flex-col items-center justify-center text-center min-h-[160px] cursor-pointer"
              >
                <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider mb-2">
                  {showAnswer ? "Answer" : "Question (Click to Flip)"}
                </span>
                <p className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  {showAnswer ? flashcards[cardIndex].a : flashcards[cardIndex].q}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowAnswer(false);
                    setCardIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    setShowAnswer(false);
                    setCardIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-xs btn-primary-glow"
                >
                  Next Card
                </button>
              </div>
            </div>

            {/* Personalized AI Study Plan */}
            <div className="glass-panel rounded-2xl shadow-soft p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                  Personalized Mid-Term Study Plan
                </span>
                <span className="text-[10px] font-bold text-academic-success">On Schedule</span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">Today: CS-402 Attention Tensors</span>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">45 mins active problem formulation</span>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-academic-success" />
                </div>

                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">Tomorrow: Raft Consensus Invariants</span>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">60 mins distributed systems drill</span>
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
