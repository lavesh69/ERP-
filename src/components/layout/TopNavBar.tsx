"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Search,
  Bell,
  Sparkles,
  Plus,
  Building,
  Calendar,
  Sun,
  Moon,
  CheckCircle2,
  AlertTriangle,
  FileText,
  LogOut,
  Menu,
} from "lucide-react";

export function TopNavBar() {
  const {
    currentUser,
    currentRole,
    theme,
    toggleTheme,
    setIsCommandPaletteOpen,
    setIsAIChatOpen,
    showToast,
    unreadNotificationsCount,
    setUnreadNotificationsCount,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    logout,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.notifications) {
          setNotificationsList(data.notifications);
          setUnreadNotificationsCount(
            data.notifications.filter((n: any) => !n.isRead).length
          );
        }
      })
      .catch(() => {
        // Fallback default notifications if DB table is initializing
        setNotificationsList([
          { id: "1", title: "Mid-Term Schedules Published", message: "Fall 2026 examination timetables are released.", isRead: false },
          { id: "2", title: "Attendance Defaulter Warning", message: "Ethan Hunt flagged below 75% cutoff threshold.", isRead: false },
          { id: "3", title: "CS-402 Attention Submission Graded", message: "48 out of 50 student submissions graded.", isRead: true },
        ]);
      });
  }, [setUnreadNotificationsCount]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
      showToast("Marked all notifications as read", "success");
    } catch {
      setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotificationsCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/85 dark:bg-charcoal-900/85 backdrop-blur-md border-b border-border dark:border-charcoal-800 px-4 md:px-6 flex items-center justify-between shadow-soft transition-colors duration-200">
      {/* Search Input triggering Command Palette */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 shrink-0"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-ivory-100/80 dark:bg-charcoal-900/80 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 text-xs text-charcoal-600 dark:text-charcoal-300 font-medium transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-charcoal-400 group-hover:text-rose-primary dark:group-hover:text-rose-accent transition-colors" />
            <span>Search students, faculty, courses, rooms, or actions...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold bg-white dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 border border-border dark:border-charcoal-700 rounded-md shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Campus & Term Selector Pills */}
        <div className="hidden lg:flex items-center gap-2 border-r border-border dark:border-charcoal-800 pr-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-[11px] font-semibold text-charcoal-800 dark:text-ivory-200">
            <Building className="h-3.5 w-3.5 text-rose-accent" />
            <span>Main Campus</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-[11px] font-semibold text-charcoal-800 dark:text-ivory-200">
            <Calendar className="h-3.5 w-3.5 text-rose-primary dark:text-rose-accent" />
            <span>Fall 2026 (Sem V)</span>
          </div>
        </div>

        {/* System Telemetry Pulse */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-200 dark:border-green-800 text-[11px] font-bold">
          <span className="h-2 w-2 rounded-full bg-academic-success animate-pulse" />
          <span>IoT Telemetry Online</span>
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 transition-all"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-charcoal-600" />
          )}
        </button>

        {/* AI Quick Prompt Button */}
        <button
          onClick={() => setIsAIChatOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-light dark:hover:bg-rose-dark/50 text-rose-primary dark:text-rose-accent text-xs font-bold transition-all border border-rose-accent/30"
        >
          <Sparkles className="h-3.5 w-3.5 text-rose-primary dark:text-rose-accent" />
          <span className="hidden md:inline">CLASSROOM AI</span>
        </button>

        {/* Quick Action Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-sm shadow-rose-primary/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Actions</span>
        </button>

        {/* Notifications Popover Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-border dark:border-charcoal-700 transition-all"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-primary ring-2 ring-white dark:ring-charcoal-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#231E21] rounded-2xl shadow-elevated border border-border dark:border-charcoal-800 p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800 mb-2">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-rose-accent hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                {notificationsList.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs flex flex-col gap-0.5 transition-colors ${
                      n.isRead
                        ? "bg-ivory-50/60 dark:bg-charcoal-900/40 text-charcoal-600 dark:text-charcoal-400"
                        : "bg-rose-container/50 dark:bg-rose-dark/20 text-charcoal-900 dark:text-ivory-100 font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] truncate">{n.title}</span>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400 line-clamp-2">
                      {n.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Logout */}
        <div className="flex items-center gap-2 pl-1">
          <div
            title={`Signed in as ${currentUser.fullName || currentUser.firstName} (${currentRole})`}
            className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer"
          >
            {(currentUser.fullName || currentUser.firstName || "Admin")
              .split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2)}
          </div>
          <button
            onClick={() => logout()}
            title="Sign Out"
            className="p-2 rounded-xl text-charcoal-600 dark:text-charcoal-400 hover:text-academic-danger hover:bg-rose-50 dark:hover:bg-charcoal-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
