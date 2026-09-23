"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { UserRole } from "@/types/auth";
import { ROLE_CONFIGS } from "@/lib/auth/roles";
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Calendar,
  FileText,
  Award,
  CreditCard,
  Library,
  FlaskConical,
  Briefcase,
  Gift,
  Bell,
  BarChart3,
  Bot,
  FolderLock,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Settings,
  ShieldCheck,
  Radio,
  FileCode2,
} from "lucide-react";

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    roles?: UserRole[];
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Executive Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "ACADEMIC",
    items: [
      {
        name: "Students",
        href: "/students",
        icon: GraduationCap,
        badge: "SIS",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER", "STUDENT", "LIBRARIAN", "PLACEMENT_OFFICER"],
      },
      {
        name: "Faculty",
        href: "/faculty",
        icon: Users,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "HR_STAFF"],
      },
      {
        name: "Courses & LMS",
        href: "/lms",
        icon: BookOpen,
        badge: "Live",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "STUDENT"],
      },
      {
        name: "Attendance",
        href: "/attendance",
        icon: CheckSquare,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER", "STUDENT", "PARENT"],
      },
      {
        name: "Timetable",
        href: "/timetable",
        icon: Calendar,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HOD", "FACULTY", "CLASS_TEACHER", "STUDENT"],
      },
      {
        name: "Assignments",
        href: "/assignments",
        icon: FileText,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "STUDENT"],
      },
      {
        name: "Exams & Results",
        href: "/examinations",
        icon: Award,
        badge: "GPA",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "STUDENT", "EXAMINATION_CONTROLLER"],
      },
    ],
  },
  {
    title: "CAMPUS",
    items: [
      {
        name: "Library ERP",
        href: "/library",
        icon: Library,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "LIBRARIAN", "STUDENT", "GUEST"],
      },
      {
        name: "Fees & Finance",
        href: "/finance",
        icon: CreditCard,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "STUDENT", "PARENT"],
      },
      {
        name: "Documents Vault",
        href: "/documents",
        icon: FolderLock,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "STUDENT", "ACCOUNTANT", "HR_STAFF"],
      },
      {
        name: "Scholarships",
        href: "/scholarships",
        icon: Gift,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "ACCOUNTANT", "STUDENT"],
      },
    ],
  },
  {
    title: "CAREER",
    items: [
      {
        name: "Career Hub & Jobs",
        href: "/careers",
        icon: Briefcase,
        badge: "ATS",
        roles: ["SUPER_ADMIN", "PLACEMENT_OFFICER", "STUDENT", "ALUMNI"],
      },
    ],
  },
  {
    title: "RESEARCH",
    items: [
      {
        name: "Research & Grants",
        href: "/research",
        icon: FlaskConical,
        badge: "NSF",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "RESEARCH_COORDINATOR"],
      },
    ],
  },
  {
    title: "COMMUNICATION",
    items: [
      {
        name: "Announcements",
        href: "/communication",
        icon: Bell,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "FACULTY", "CLASS_TEACHER", "PARENT", "HR_STAFF", "ALUMNI"],
      },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      {
        name: "CLASSROOM AI",
        href: "/ai-assistant",
        icon: Bot,
        badge: "12 Agents",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "FACULTY", "CLASS_TEACHER", "STUDENT", "PARENT"],
      },
      {
        name: "Analytics & BI",
        href: "/analytics",
        icon: BarChart3,
        badge: "BI",
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "ACCOUNTANT", "PLACEMENT_OFFICER"],
      },
    ],
  },
  {
    title: "ADMIN",
    items: [
      {
        name: "Super Admin",
        href: "/admin",
        icon: ShieldAlert,
        badge: "Root",
        roles: ["SUPER_ADMIN"],
      },
      {
        name: "Institution ERP",
        href: "/institution",
        icon: Building2,
        roles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD"],
      },
    ],
  },
];

export function SideNavBar() {
  const pathname = usePathname();
  const { currentRole, setCurrentRole, currentUser, setIsAIChatOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useApp();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-charcoal-950/60 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md border-r border-border dark:border-charcoal-800 shadow-soft z-40 flex flex-col justify-between shrink-0 select-none transition-transform duration-200 lg:translate-x-0 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
      {/* Brand Header */}
      <div className="flex flex-col">
        <div className="p-4 border-b border-border/60 dark:border-charcoal-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-display text-lg font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight leading-tight">
                CLASSROOM
              </span>
              <span className="text-[11px] font-semibold text-rose-accent uppercase tracking-wider">
                Academic OS
              </span>
            </div>
          </Link>
        </div>

        {/* Verified Institutional Role & Persona Badge */}
        <div className="px-3 pt-3 pb-2">
          <div className="bg-rose-container/50 dark:bg-charcoal-900/60 border border-border dark:border-charcoal-800 p-2.5 rounded-xl flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-rose-primary dark:text-rose-accent" />
                Verified Session
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-charcoal-800 text-rose-primary dark:text-rose-accent border border-border dark:border-charcoal-700">
                {ROLE_CONFIGS[currentRole]?.displayName || currentRole}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <div className="h-7 w-7 rounded-lg bg-rose-primary/10 dark:bg-rose-primary/20 text-rose-primary dark:text-rose-accent flex items-center justify-center font-bold text-xs shrink-0">
                {(currentUser.fullName || currentUser.firstName || "U")[0]}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate">
                  {currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`}
                </span>
                <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 truncate">
                  {currentUser.email}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Categorized 8-Section Navigation */}
        <nav className="flex flex-col gap-3 px-3 overflow-y-auto max-h-[calc(100vh-270px)] pt-1 pb-4">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.roles || item.roles.includes(currentRole)
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-charcoal-400 dark:text-charcoal-600 tracking-wider px-3 py-1 uppercase">
                  {section.title}
                </span>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-rose-primary text-white shadow-sm shadow-rose-primary/20"
                          : "text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-100 dark:hover:bg-charcoal-800 hover:text-charcoal-900 dark:hover:text-ivory-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-white" : "text-charcoal-400 dark:text-charcoal-500"
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-border/60 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Copilot Trigger */}
      <div className="p-3 border-t border-border/70 dark:border-charcoal-800 bg-ivory-50/60 dark:bg-charcoal-950/60 flex flex-col gap-2">
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="w-full flex items-center justify-center gap-2 bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md shadow-rose-primary/20 transition-all duration-150"
        >
          <Bot className="h-4 w-4" />
          <span>Ask CLASSROOM AI</span>
        </button>

        <div className="flex items-center gap-2.5 px-2 py-1 rounded-lg">
          <div className="h-8 w-8 rounded-full bg-rose-container dark:bg-charcoal-800 border border-border dark:border-charcoal-700 flex items-center justify-center text-xs font-bold text-rose-primary dark:text-rose-accent shrink-0">
            {(currentUser.fullName || currentUser.firstName || "Admin")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate">
              {currentUser.fullName || `${currentUser.firstName} ${currentUser.lastName}`}
            </span>
            <span className="text-[10px] font-medium text-charcoal-600 dark:text-charcoal-400 truncate">
              {currentUser.email}
            </span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
