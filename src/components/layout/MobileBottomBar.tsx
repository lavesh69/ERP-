"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  GraduationCap,
  CheckSquare,
  BookOpen,
  Sparkles,
} from "lucide-react";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { setIsAIChatOpen, currentRole } = useApp();

  const isStudent = currentRole === "STUDENT";

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      isActive: pathname === "/",
    },
    {
      name: "Students",
      href: isStudent ? "/students/profile" : "/students",
      icon: GraduationCap,
      isActive: pathname.startsWith("/students"),
    },
    {
      name: "Attendance",
      href: "/attendance",
      icon: CheckSquare,
      isActive: pathname.startsWith("/attendance"),
    },
    {
      name: "LMS",
      href: "/lms",
      icon: BookOpen,
      isActive: pathname.startsWith("/lms"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-charcoal-900/95 backdrop-blur-md border-t border-border dark:border-charcoal-800 lg:hidden flex items-center justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg transition-colors duration-200"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] rounded-xl transition-all duration-150 active:scale-95 ${
              item.isActive
                ? "text-rose-primary dark:text-rose-accent font-bold"
                : "text-charcoal-500 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
            }`}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-rose-primary dark:bg-rose-accent" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
          </Link>
        );
      })}

      {/* AI Assistant Quick Trigger */}
      <button
        type="button"
        onClick={() => setIsAIChatOpen(true)}
        aria-label="Ask Classroom AI"
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[44px] rounded-xl text-rose-primary dark:text-rose-accent hover:opacity-80 active:scale-95 transition-all duration-150"
      >
        <div className="h-7 w-7 rounded-lg bg-rose-container dark:bg-rose-dark/40 flex items-center justify-center border border-rose-primary/20 shadow-xs">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-[10px] font-bold tracking-tight mt-0.5">AI Copilot</span>
      </button>
    </nav>
  );
}
