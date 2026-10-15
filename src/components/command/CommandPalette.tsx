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
  UserPlus,
  FlaskConical,
  HeartPulse,
  Bed,
  Bus,
  Briefcase,
  ShieldCheck,
  Siren,
  UtensilsCrossed,
  FileText,
  Building2,
  FolderLock,
  Scale,
  Compass,
  Gift,
  HeartHandshake,
  ShieldAlert,
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
    // --- Academics & Students ---
    {
      id: "nav-students",
      category: "Navigation",
      title: "Students SIS Directory & 360 Profile",
      description: "Look up student profiles, attendance, CGPA, APAAR ID, and admission files",
      href: "/students",
      icon: GraduationCap,
    },
    {
      id: "nav-faculty",
      category: "Navigation",
      title: "Faculty Directory & Workload",
      description: "View department professors, designations, lesson plans, and research",
      href: "/faculty",
      icon: Users,
    },
    {
      id: "nav-attendance",
      category: "Navigation",
      title: "Mark Attendance & QR Scanner",
      description: "Live RFID tap check-in, record attendance, BLE beacon, and defaulters",
      href: "/attendance",
      icon: CheckSquare,
    },
    {
      id: "nav-timetable",
      category: "Navigation",
      title: "Timetable & Conflict Engine",
      description: "Inspect schedules and detect room/faculty clashes with heatmaps",
      href: "/timetable",
      icon: Calendar,
    },
    {
      id: "nav-exams",
      category: "Navigation",
      title: "Examinations, Moderation & OBE",
      description: "Mid-terms, question banks, GPA calculations, alternate seating, and results",
      href: "/examinations",
      icon: Award,
    },
    {
      id: "nav-lms",
      category: "Navigation",
      title: "Courses, LMS & CBCS Electives",
      description: "Digital course units, syllabus, submissions, and assignment rubrics",
      href: "/lms",
      icon: BookOpen,
    },

    // --- Institutional & Statutory Governance ---
    {
      id: "nav-admissions",
      category: "Navigation",
      title: "Admissions Counseling & Quota Allotment",
      description: "Statutory Composite Merit Ranking, reservation quotas (UR, OBC, SC, ST, EWS, PwD), and sealed orders",
      href: "/admissions?tab=counseling",
      icon: UserPlus,
    },
    {
      id: "nav-research",
      category: "Navigation",
      title: "Research Ethics & Institutional Review Board (IRB)",
      description: "3-tier statutory risk triage, quorum deliberation voting, and IRB clearance certificates",
      href: "/research?tab=ethics",
      icon: FlaskConical,
    },
    {
      id: "nav-elibrary",
      category: "Navigation",
      title: "Digital E-Library & Institutional Repository (IR)",
      description: "ISO 26324 DOI assignment, theses catalog, BibTeX/APA 7th citations, and secured passes",
      href: "/library?tab=elibrary",
      icon: Library,
    },
    {
      id: "nav-clinic",
      category: "Navigation",
      title: "Student Health Clinic & Medical Clearance",
      description: "Health Passports, mandatory immunization records, allergy alerts, and sports fitness seals",
      href: "/clinic?tab=clearance",
      icon: HeartPulse,
    },
    {
      id: "nav-hostel",
      category: "Navigation",
      title: "Hostel Move-In/Out Audit & Caution Deposit",
      description: "Room inventory checklist, condition comparison, damage levies, and refund vouchers",
      href: "/hostel?tab=asset-audit",
      icon: Bed,
    },
    {
      id: "nav-transport",
      category: "Navigation",
      title: "Transport Fleet & Driver Safety Compliance",
      description: "RTO Fitness Certificates, PUC, Speed Governor (40 km/h) calibration, and roadworthiness seals",
      href: "/transport?tab=compliance",
      icon: Bus,
    },
    {
      id: "nav-hr-cpc",
      category: "Navigation",
      title: "HR 7th CPC Academic Pay Matrix & Increments",
      description: "Levels 10–14 pay scales, 3% vertical step increments, Rule 13 CAS fixation, and DA arrears",
      href: "/hr?tab=cpc-increment",
      icon: Briefcase,
    },
    {
      id: "nav-hr-tds",
      category: "Navigation",
      title: "Income Tax TDS Planner & Form 16 Part B",
      description: "Section 115BAC New vs Old Regime comparison, monthly TDS deductions, and Form 16 seals",
      href: "/hr?tab=income-tax",
      icon: FileText,
    },

    // --- Campus Services & Operations ---
    {
      id: "nav-finance",
      category: "Navigation",
      title: "Fees & Finance ERP",
      description: "Tuition ledgers, Flexi-Pay installments, late fines, BRS, and receipt generation",
      href: "/finance",
      icon: CreditCard,
    },
    {
      id: "nav-security",
      category: "Navigation",
      title: "Campus Gate Security & Visitor E-Passes",
      description: "RFID turnstile logs, visitor vehicle registration, and digital QR security entry passes",
      href: "/security",
      icon: ShieldCheck,
    },
    {
      id: "nav-emergency",
      category: "Navigation",
      title: "Campus Emergency Operations (EOC & Clery Act)",
      description: "Multi-channel mass alerts (SMS, WhatsApp, Email, Banner) and safety beacon muster roll",
      href: "/emergency",
      icon: Siren,
    },
    {
      id: "nav-canteen",
      category: "Navigation",
      title: "Canteen & Smart RFID POS",
      description: "10% student welfare dietary subsidy, order tokens, and contactless meal card top-ups",
      href: "/canteen",
      icon: UtensilsCrossed,
    },
    {
      id: "nav-grievances",
      category: "Navigation",
      title: "Grievance Redressal & Anti-Ragging POSH",
      description: "Confidential ICC harassment reporting, statutory SLA timers, and ombudsperson escalation",
      href: "/grievances",
      icon: Scale,
    },
    {
      id: "nav-compliance",
      category: "Navigation",
      title: "Statutory Anti-Ragging & Proctorial Disciplinary Governance",
      description: "UGC 2009 oath affidavits, formal Show-Cause Notices (72h), and Chief Proctor sanction orders",
      href: "/compliance",
      icon: ShieldAlert,
    },
    {
      id: "nav-careers",
      category: "Navigation",
      title: "Career Hub & Placement ATS",
      description: "AI Career Roadmap, interview schedules, ATS resume seals, and corporate recruitment",
      href: "/careers",
      icon: Compass,
    },
    {
      id: "nav-accreditation",
      category: "Navigation",
      title: "Accreditation IQAC & NAAC 7 Criteria",
      description: "NAAC Criteria 1–7 SSR dossier builder, NBA SAR Outcome-Based Education, and AQAR seal",
      href: "/accreditation",
      icon: Award,
    },

    // --- One-Click Institutional Quick Actions ---
    {
      id: "act-counseling",
      category: "Quick Action",
      title: "Simulate Admissions Seat Allotment (Round 1)",
      description: "Execute JoSAA/Central counseling algorithm across General, OBC, SC, ST, EWS quotas",
      href: "/admissions?tab=counseling",
      icon: UserPlus,
    },
    {
      id: "act-exam-gen",
      category: "Quick Action",
      title: "Generate Autonomous Question Paper Studio",
      description: "AI synthesized exam paper with Bloom taxonomy balance and cryptographic verification seal",
      href: "/faculty?tab=exam-generator",
      icon: FilePlus,
    },
    {
      id: "act-roadworthy",
      category: "Quick Action",
      title: "Inspect & Certify Bus Fleet Roadworthiness",
      description: "Stamps APEX-BUS-FIT-SEAL- upon verifying RTO FC, PUC, and 40 km/h speed governor",
      href: "/transport?tab=compliance",
      icon: Bus,
    },
    {
      id: "act-medical",
      category: "Quick Action",
      title: "Issue Student Medical Fitness Clearance",
      description: "Validates HepB, MMR, MenACWY vaccines and issues APEX-MED-FIT-SEAL- health certificate",
      href: "/clinic?tab=clearance",
      icon: HeartPulse,
    },
    {
      id: "act-hostel-audit",
      category: "Quick Action",
      title: "Conduct Hostel Room Move-Out Audit",
      description: "Compares room furniture condition, levies damage charge, and releases caution deposit",
      href: "/hostel?tab=asset-audit",
      icon: Bed,
    },
    {
      id: "act-emergency",
      category: "Quick Action",
      title: "Broadcast Campus Emergency Alert (Clery Act)",
      description: "Initiates mass alert broadcast across SMS, WhatsApp, Email, and web portal banner",
      href: "/emergency",
      icon: Siren,
    },

    // --- Autonomous Copilot ---
    {
      id: "act-ai",
      category: "AI Command",
      title: "Ask CLASSROOM Autonomous Copilot",
      description: "Query attendance defaulters, GPA trends, NEP 2020 compliance, or institutional regulations",
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
