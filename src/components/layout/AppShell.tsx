"use client";

import React from "react";
import { SideNavBar } from "@/components/layout/SideNavBar";
import { TopNavBar } from "@/components/layout/TopNavBar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { AIChatDrawer } from "@/components/ai/AIChatDrawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex transition-colors duration-200">
      {/* Left Navigation Sidebar */}
      <SideNavBar />

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-64 flex-1 flex flex-col min-w-0">
        <TopNavBar />
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <CommandPalette />
      <AIChatDrawer />
    </div>
  );
}
