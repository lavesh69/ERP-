"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Bot,
  Calendar,
  CheckSquare,
  GraduationCap,
  Users,
  Award,
  CreditCard,
  FilePlus,
  BellPlus,
  ArrowRight,
  Sparkles,
  BookOpen,
  Library,
  X,
} from "lucide-react";

interface CommandOption {
  id: string;
  category: "Navigation" | "Quick Action" | "AI Command";
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export function CommandPalette() {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setIsAIChatOpen, showToast } = useApp();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery("");
      setSearchResults([]);
    }
  }, [isCommandPaletteOpen]);

  // Dynamic live search against backend database
  useEffect(() => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSearchResults(data.results || []);
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const commands: CommandOption[] = [
    {
      id: "nav-students",
      category: "Navigation",
      title: "Students SIS Directory",
      description: "Look up student profiles, attendance, CGPA, and admission files",
      href: "/students",
      icon: GraduationCap,
    },
    {
      id: "nav-faculty",
      category: "Navigation",
      title: "Faculty Directory & Workload",
      description: "View department professors, designations, and workload",
      href: "/faculty",
      icon: Users,
    },
    {
      id: "nav-attendance",
      category: "Navigation",
      title: "Mark Attendance & QR Scanner",
      description: "Live RFID tap check-in, record attendance, and defaulters",
      href: "/attendance",
      icon: CheckSquare,
    },
    {
      id: "nav-timetable",
      category: "Navigation",
      title: "Timetable & Conflict Engine",
      description: "Inspect schedules and detect room/faculty clashes",
      href: "/timetable",
      icon: Calendar,
    },
    {
      id: "nav-exams",
      category: "Navigation",
      title: "Examinations & Grading",
      description: "Mid-terms, question banks, GPA calculations, and results",
      href: "/examinations",
      icon: Award,
    },
    {
      id: "nav-finance",
      category: "Navigation",
      title: "Fees & Finance ERP",
      description: "Tuition ledgers, installment schedules, and receipts",
      href: "/finance",
      icon: CreditCard,
    },
    {
      id: "nav-library",
      category: "Navigation",
      title: "Library Catalog & RFID",
      description: "Search books, issue loans, and track return deadlines",
      href: "/library",
      icon: Library,
    },
    {
      id: "act-ai",
      category: "AI Command",
      title: "Ask CLASSROOM Autonomous Copilot",
      description: "Query attendance defaulters, GPA trends, or institutional regulations",
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsAIChatOpen(true);
      },
      icon: Sparkles,
    },
  ];

  const filteredCommands = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (item: { href?: string; action?: () => void }) => {
    setIsCommandPaletteOpen(false);
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-20 px-3 sm:px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsCommandPaletteOpen(false)}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl glass-panel rounded-3xl border border-border/80 dark:border-charcoal-700/80 shadow-elevated overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[calc(100dvh-2rem)] flex flex-col">
        {/* Search Bar Input */}
        <div className="flex items-center px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-border dark:border-charcoal-800 gap-2.5 sm:gap-3">
          <Search className="h-4 sm:h-5 w-4 sm:w-5 text-charcoal-400 dark:text-charcoal-500 shrink-0" />
          <input
            type="text"
            placeholder="Type a command, student, course, room..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 min-w-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            aria-label="Close"
            className="sm:hidden min-h-[36px] min-w-[36px] flex items-center justify-center p-1 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200"
          >
            <X className="h-4 w-4" />
          </button>
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border border-border dark:border-charcoal-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto p-2 divide-y divide-border/40 dark:divide-charcoal-800">
          {/* Live Database Entity Results */}
          {searchResults.length > 0 && (
            <div className="pb-2">
              <div className="px-3 py-1 text-[10px] font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider">
                Database Records ({searchResults.length})
              </div>
              {searchResults.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelect({ href: r.href })}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-rose-container/50 dark:hover:bg-charcoal-800/60 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center text-xs font-bold shrink-0">
                      {r.category[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400 truncate">
                        {r.subtitle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400 border border-border dark:border-charcoal-700">
                    {r.category}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions & Navigation Options */}
          <div className="pt-2">
            <div className="px-3 py-1 text-[10px] font-bold text-charcoal-400 dark:text-charcoal-600 uppercase tracking-wider">
              {query ? "Matching Actions" : "Commands & Workflows"}
            </div>
            {filteredCommands.length === 0 && searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-charcoal-500">
                No matching results found for &quot;{query}&quot;
              </div>
            ) : (
              filteredCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <div
                    key={cmd.id}
                    onClick={() => handleSelect(cmd)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-ivory-100 dark:hover:bg-charcoal-800 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                          {cmd.title}
                        </span>
                        <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400 truncate">
                          {cmd.description}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-charcoal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-surface-soft dark:bg-[#1C171A] border-t border-border dark:border-charcoal-800 flex items-center justify-between text-[11px] text-charcoal-600 dark:text-charcoal-400">
          <span>Navigate with <b>↑</b> <b>↓</b>, select with <b>ENTER</b></span>
          <span>CLASSROOM Global Search</span>
        </div>
      </div>
    </div>
  );
}
