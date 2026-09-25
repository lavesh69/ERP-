"use client";

import React from "react";
import { SideNavBar } from "@/components/layout/SideNavBar";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { AIChatDrawer } from "@/components/ai/AIChatDrawer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex transition-colors duration-200 relative selection:bg-rose-accent/25 selection:text-rose-primary dark:selection:text-rose-light">
      {/* Ambient Atmospheric Lights */}
      <div className="fixed top-0 right-10 w-[500px] h-[500px] bg-gradient-to-br from-rose-accent/8 via-rose-primary/4 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed -bottom-20 left-10 w-[420px] h-[420px] bg-gradient-to-tr from-rose-primary/5 via-rose-accent/4 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Left Navigation Sidebar */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-72 flex-1 flex flex-col min-w-0">
        <TopNavBar />
        <main className="flex-1 p-3 sm:p-5 md:p-8 pb-24 lg:pb-8 max-w-[1600px] w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phones/Tablets only) */}
      <MobileBottomBar />

      {/* Global Modals & Drawers */}
      <CommandPalette />
      <AIChatDrawer />
    </div>
  );
}
