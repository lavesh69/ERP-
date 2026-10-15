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
  CreditCard,
  Library,
  Award,
  Briefcase,
  Users,
} from "lucide-react";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { setIsAIChatOpen, currentRole } = useApp();

  // Role-adaptive mobile navigation items
  const getNavItems = () => {
    switch (currentRole) {
      case "STUDENT":
        return [
          { name: "My 360", href: "/students/profile", icon: GraduationCap, isActive: pathname.startsWith("/students") },
          { name: "LMS", href: "/lms", icon: BookOpen, isActive: pathname.startsWith("/lms") },
          { name: "Attendance", href: "/attendance", icon: CheckSquare, isActive: pathname.startsWith("/attendance") },
          { name: "Fees", href: "/finance", icon: CreditCard, isActive: pathname.startsWith("/finance") },
        ];
      case "PARENT":
        return [
          { name: "Ward Home", href: "/parent", icon: LayoutDashboard, isActive: pathname === "/parent" },
          { name: "Attendance", href: "/attendance", icon: CheckSquare, isActive: pathname.startsWith("/attendance") },
          { name: "Fees & Pay", href: "/finance", icon: CreditCard, isActive: pathname.startsWith("/finance") },
          { name: "Hostel", href: "/hostel", icon: BookOpen, isActive: pathname.startsWith("/hostel") },
        ];
      case "ACCOUNTANT":
        return [
          { name: "Treasury", href: "/finance", icon: CreditCard, isActive: pathname.startsWith("/finance") },
          { name: "Students", href: "/students", icon: GraduationCap, isActive: pathname.startsWith("/students") },
          { name: "Scholarships", href: "/scholarships", icon: BookOpen, isActive: pathname.startsWith("/scholarships") },
          { name: "Store", href: "/inventory", icon: LayoutDashboard, isActive: pathname.startsWith("/inventory") },
        ];
      case "LIBRARIAN":
        return [
          { name: "Library", href: "/library", icon: Library, isActive: pathname.startsWith("/library") },
          { name: "Circulation", href: "/library?tab=circulation", icon: BookOpen, isActive: pathname.includes("circulation") },
          { name: "Students", href: "/students", icon: GraduationCap, isActive: pathname.startsWith("/students") },
          { name: "Fines", href: "/library?tab=fines", icon: CreditCard, isActive: pathname.includes("fines") },
        ];
      case "EXAMINATION_CONTROLLER":
        return [
          { name: "Exams", href: "/examinations", icon: Award, isActive: pathname.startsWith("/examinations") },
          { name: "Timetable", href: "/timetable", icon: BookOpen, isActive: pathname.startsWith("/timetable") },
          { name: "Students", href: "/students", icon: GraduationCap, isActive: pathname.startsWith("/students") },
          { name: "Convocation", href: "/convocation", icon: LayoutDashboard, isActive: pathname.startsWith("/convocation") },
        ];
      case "HR_STAFF":
        return [
          { name: "HR & Pay", href: "/hr", icon: Briefcase, isActive: pathname.startsWith("/hr") },
          { name: "Faculty", href: "/faculty", icon: Users, isActive: pathname.startsWith("/faculty") },
          { name: "Attendance", href: "/attendance", icon: CheckSquare, isActive: pathname.startsWith("/attendance") },
          { name: "Clinic", href: "/clinic", icon: LayoutDashboard, isActive: pathname.startsWith("/clinic") },
        ];
      case "FACULTY":
      case "CLASS_TEACHER":
        return [
          { name: "Home", href: "/", icon: LayoutDashboard, isActive: pathname === "/" },
          { name: "Attendance", href: "/attendance", icon: CheckSquare, isActive: pathname.startsWith("/attendance") },
          { name: "LMS", href: "/lms", icon: BookOpen, isActive: pathname.startsWith("/lms") },
          { name: "Exams", href: "/examinations", icon: Award, isActive: pathname.startsWith("/examinations") },
        ];
      default:
        return [
          { name: "Dashboard", href: "/", icon: LayoutDashboard, isActive: pathname === "/" },
          { name: "Students", href: "/students", icon: GraduationCap, isActive: pathname.startsWith("/students") },
          { name: "Faculty", href: "/faculty", icon: Users, isActive: pathname.startsWith("/faculty") },
          { name: "Finance", href: "/finance", icon: CreditCard, isActive: pathname.startsWith("/finance") },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-2.5 left-3 right-3 z-30 h-16 glass-panel rounded-2xl shadow-elevated border border-border/80 dark:border-charcoal-700/80 lg:hidden flex items-center justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] transition-all duration-200"
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
