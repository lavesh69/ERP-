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
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-900/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white h-full shadow-elevated border-l border-border flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-border bg-ivory-100/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm text-charcoal-900">
                  CLASSROOM AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-primary text-white">
                  Grounded RAG
                </span>
              </div>
              <span className="text-[11px] text-charcoal-600">
                12 Specialized Autonomous Agents • Zero Hallucination Guard
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsAIChatOpen(false)}
            className="p-1.5 rounded-lg text-charcoal-400 hover:text-charcoal-800 hover:bg-white transition-all"
            aria-label="Close Drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Agent Selector Ribbon */}
        <div className="px-4 py-2 border-b border-border bg-white flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider shrink-0">
            Agent:
          </span>
          {AI_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedAgent === agent.id
                  ? "bg-rose-primary text-white shadow-xs"
                  : "bg-ivory-100 text-charcoal-600 hover:bg-rose-container"
              }`}
            >
              {agent.name.replace("CLASSROOM ", "").replace(" Agent", "")}
            </button>
          ))}
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-ivory-50/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 max-w-[88%] ${
                msg.role === "user" ? "self-end items-end" : "self-start items-start"
              }`}
            >
              {msg.agentName && (
                <span className="text-[10px] font-bold text-rose-primary pl-1">
                  {msg.agentName}
                </span>
              )}
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-rose-primary text-white rounded-tr-none shadow-sm"
                    : msg.isGuardrailBlocked
                    ? "bg-academic-danger-subtle text-charcoal-900 border border-red-200 rounded-tl-none"
                    : "bg-white text-charcoal-900 border border-border shadow-soft rounded-tl-none"
                }`}
              >
                {msg.isGuardrailBlocked && (
                  <div className="flex items-center gap-1.5 text-academic-danger font-bold mb-1.5">
                    <ShieldAlert className="h-4 w-4" />
                    <span>Security Guardrail Enforced</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Grounded Citations Section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-border/80 flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-charcoal-600 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-rose-primary" />
                      Grounded Institutional Sources:
                    </span>
                    {msg.citations.map((c, i) => (
                      <div
                        key={i}
                        className="bg-surface-soft p-2 rounded-lg border border-border/60 text-[11px]"
                      >
                        <span className="font-bold text-rose-primary">{c.documentTitle}</span>
                        <p className="text-charcoal-600 italic mt-0.5">&quot;{c.excerpt}&quot;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="self-start flex items-center gap-2 p-3 rounded-2xl bg-white border border-border text-xs text-charcoal-600">
              <Sparkles className="h-4 w-4 text-rose-accent animate-spin" />
              <span>Querying verified knowledge base & formulating response...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2 border-t border-border/60 bg-white flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <button
            onClick={() => handleSendMessage("Explain Attention Mechanisms in CS-402")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 text-charcoal-700 hover:bg-rose-container whitespace-nowrap"
          >
            💡 CS-402 Attention
          </button>
          <button
            onClick={() => handleSendMessage("What is the mandatory attendance requirement?")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 text-charcoal-700 hover:bg-rose-container whitespace-nowrap"
          >
            📋 Attendance Policy
          </button>
          <button
            onClick={() => handleSendMessage("Synthesize 3 practice questions for Mid-Term")}
            className="px-2.5 py-1 rounded-full bg-ivory-100 text-charcoal-700 hover:bg-rose-container whitespace-nowrap"
          >
            📝 Practice Quiz
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-border bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={`Ask ${AI_AGENTS.find((a) => a.id === selectedAgent)?.name}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
            className="flex-1 bg-ivory-100 border border-border rounded-xl px-3.5 py-2.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-1 focus:ring-rose-primary"
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
