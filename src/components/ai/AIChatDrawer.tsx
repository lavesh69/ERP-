"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AI_AGENTS, AgentId } from "@/lib/ai/agents";
import {
  X,
  Send,
  Bot,
  Sparkles,
  BookOpen,
  FileCheck,
  ShieldAlert,
  GraduationCap,
  ExternalLink,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agentName?: string;
  citations?: Array<{
    documentTitle: string;
    category: string;
    excerpt: string;
  }>;
  isGuardrailBlocked?: boolean;
}

export function AIChatDrawer() {
  const { isAIChatOpen, setIsAIChatOpen, currentUser, currentRole } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("academic");
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      agentName: "CLASSROOM Academic Agent",
      content: `Hello ${currentUser.firstName}! I am your autonomous academic copilot. I can explain complex syllabus topics, synthesize practice questions, trace university regulations, or formulate personalized study schedules.\n\nHow can I support your academic progress today?`,
    },
  ]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isAIChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isAIChatOpen]);

  if (!isAIChatOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          prompt: textToSend,
          userId: currentUser.id,
          userRole: currentRole,
          actionRequested: textToSend.toLowerCase().includes("change grade") ? "ALTER_GRADE_CURVE" : undefined,
        }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(36),
        role: "assistant",
        agentName: AI_AGENTS.find((a) => a.id === selectedAgent)?.name,
        content: data.content,
        citations: data.citations || [],
        isGuardrailBlocked: data.status === "BLOCKED",
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36),
          role: "assistant",
          content: "Encountered a network latency issue connecting to the AI Agent Gateway. Please retry.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/70 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full sm:max-w-lg bg-white dark:bg-charcoal-900 h-full shadow-elevated border-l border-border dark:border-charcoal-800 flex flex-col justify-between pt-[max(0rem,env(safe-area-inset-top))] transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-4 border-b border-border dark:border-charcoal-800 bg-ivory-100/60 dark:bg-charcoal-950/60 backdrop-blur-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                  CLASSROOM AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-primary text-white shrink-0">
                  Grounded RAG
                </span>
              </div>
              <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400 truncate">
                12 Autonomous Agents • Zero Hallucination
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAIChatOpen(false)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-xl text-charcoal-400 hover:text-charcoal-800 dark:hover:text-ivory-200 hover:bg-white dark:hover:bg-charcoal-800 transition-all shrink-0"
            aria-label="Close Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Agent Selector Ribbon */}
        <div className="px-4 py-2 border-b border-border dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-500 uppercase tracking-wider shrink-0">
            Agent:
          </span>
          {AI_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedAgent === agent.id
                  ? "bg-rose-primary text-white shadow-xs"
                  : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container dark:hover:bg-charcoal-700"
              }`}
            >
              {agent.name.replace("CLASSROOM ", "").replace(" Agent", "")}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-ivory-50/50 dark:bg-charcoal-950/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[88%] ${
                msg.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              {msg.agentName && (
                <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent pl-1">
                  {msg.agentName}
                </span>
              )}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-rose-primary text-white rounded-tr-none shadow-sm"
                    : msg.isGuardrailBlocked
                    ? "bg-academic-danger-subtle dark:bg-red-950/40 text-charcoal-900 dark:text-ivory-100 border border-red-200 dark:border-red-800 rounded-tl-none"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 border border-border dark:border-charcoal-700 shadow-soft rounded-tl-none"
                }`}
              >
                {msg.isGuardrailBlocked && (
                  <div className="flex items-center gap-1.5 text-academic-danger dark:text-red-400 font-bold mb-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Security Guardrail Enforced</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounded Citations Section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/80 dark:border-charcoal-700/80 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-rose-primary dark:text-rose-accent" />
                      Grounded Institutional Sources:
                    </span>
                    {msg.citations.map((c, i) => (
                      <div
                        key={i}
                        className="bg-surface-soft dark:bg-charcoal-900 p-2 rounded-lg border border-border/60 dark:border-charcoal-700/60 text-[11px]"
                      >
                        <span className="font-bold text-rose-primary dark:text-rose-accent">{c.documentTitle}</span>
                        <p className="text-charcoal-600 dark:text-charcoal-400 italic mt-0.5">&quot;{c.excerpt}&quot;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-xs text-charcoal-600 dark:text-charcoal-300">
              <Sparkles className="h-4 w-4 text-rose-accent animate-spin" />
              <span>Querying verified knowledge base & formulating response...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2 border-t border-border/60 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSendMessage("Explain Attention Mechanisms in CS-402")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container dark:hover:bg-charcoal-700 whitespace-nowrap transition-colors"
          >
            💡 CS-402 Attention
          </button>
          <button
            onClick={() => handleSendMessage("What is the mandatory attendance requirement?")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container dark:hover:bg-charcoal-700 whitespace-nowrap transition-colors"
          >
            📋 Attendance Policy
          </button>
          <button
            onClick={() => handleSendMessage("Synthesize 3 practice questions for Mid-Term")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container dark:hover:bg-charcoal-700 whitespace-nowrap transition-colors"
          >
            📝 Practice Quiz
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-border dark:border-charcoal-800 bg-white dark:bg-charcoal-900 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask ${AI_AGENTS.find((a) => a.id === selectedAgent)?.name}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 bg-ivory-100 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl px-3.5 py-2.5 text-xs text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 dark:placeholder:text-charcoal-500 focus:outline-none focus:ring-1 focus:ring-rose-primary"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="h-10 w-10 rounded-xl bg-rose-primary hover:bg-rose-dark disabled:opacity-50 text-white flex items-center justify-center transition-all shrink-0"
            aria-label="Send Message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
