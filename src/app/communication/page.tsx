"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Bell,
  Send,
  Radio,
  AlertTriangle,
  Mail,
  Smartphone,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Users,
  Search,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
}

export default function CommunicationPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAudience, setFilterAudience] = useState("ALL");

  // Broadcast Modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        setLoading(true);
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements || []);
        }
      } catch (err) {
        console.error("Failed to load announcements:", err);
        showToast("Error retrieving campus announcements", "error");
      } finally {
        setLoading(false);
      }
    }
    loadAnnouncements();
  }, [refreshTrigger]);

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast("Please provide both a title and message body", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          content: broadcastMessage,
          targetAudience,
          priority,
        }),
      });

      if (res.ok) {
        showToast(
          `Broadcast circular dispatched across In-App, SMS, and Email channels!`,
          "success"
        );
        setIsBroadcastModalOpen(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to broadcast circular", "error");
      }
    } catch (err) {
      showToast("Network error broadcasting message", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast(`Announcement "${title}" removed from dispatch`, "info");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete announcement", "error");
      }
    } catch (err) {
      showToast("Network error removing announcement", "error");
    }
  };

  const filtered = announcements.filter((a) => {
    const matchesAudience = filterAudience === "ALL" || a.targetAudience === filterAudience;
    const matchesQuery =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAudience && matchesQuery;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Centralized Communication & Broadcast Dispatch
                </h1>
                <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Multi-Channel Active
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Multi-channel dispatch: Push notifications, Twilio SMS architecture, in-app circulars, and emergency sirens
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Send className="h-4 w-4" />
            <span>Broadcast Circular</span>
          </button>
        </div>

        {/* 4 Telemetry KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Active Circulars
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                {announcements.length}
              </div>
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-2">
                SQLite Database Backed
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                  Emergency Siren
                </span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 beacon-pulse" />
              </div>
              <div className="text-2xl font-display font-bold text-academic-success mt-1">
                STANDBY
              </div>
              <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 mt-2">
                Push Relay Ready
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Delivery Success
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                99.8%
              </div>
              <span className="badge-subtle bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-2">
                SMS & Mobile Push
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider">
                Broadcast Reach
              </span>
              <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                1,420+
              </div>
              <span className="badge-subtle bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 mt-2">
                Verified Campus Nodes
              </span>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {["ALL", "STUDENTS", "FACULTY", "PARENTS"].map((aud) => (
              <button
                key={aud}
                onClick={() => setFilterAudience(aud)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filterAudience === aud
                    ? "bg-rose-primary text-white shadow-sm"
                    : "bg-surface-soft dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {aud}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search circulars by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
            />
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Circulars Found"
            description="No notices match the filter or search query. Create a new circular to notify scholars and faculty."
            actionLabel="Broadcast Circular"
            onAction={() => setIsBroadcastModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft flex flex-col gap-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.priority === "URGENT"
                          ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                          : a.priority === "HIGH"
                          ? "bg-academic-warning-subtle text-academic-warning border border-yellow-200"
                          : "bg-academic-success-subtle text-academic-success border border-green-200"
                      }`}
                    >
                      {a.priority} PRIORITY
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                      Audience: {a.targetAudience}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-charcoal-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <button
                      onClick={() => handleDelete(a.id, a.title)}
                      className="p-1.5 rounded-lg text-charcoal-400 hover:text-academic-danger hover:bg-ivory-100 dark:hover:bg-charcoal-700 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {a.title}
                </h3>
                <p className="text-xs text-charcoal-700 dark:text-charcoal-300 leading-relaxed">
                  {a.content}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-border/50 dark:border-charcoal-700 text-[11px] text-charcoal-500">
                  <Radio className="h-3.5 w-3.5 text-rose-primary" />
                  <span>Channels Dispatched: In-App Banner, Automated Email Digest, Campus SMS</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Broadcast Notice */}
        <Modal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          title="Broadcast Campus Circular"
        >
          <form onSubmit={handleSendBroadcast} className="flex flex-col gap-4 text-xs">
            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Notice Title / Subject
              </label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Schedule for Fall 2026 Practical Labs"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="ALL">All Campus (Everyone)</option>
                  <option value="STUDENTS">Students Only</option>
                  <option value="FACULTY">Faculty & Staff Only</option>
                  <option value="PARENTS">Parents & Guardians</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="NORMAL">Normal Advisory</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Siren Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Circular Message Body
              </label>
              <textarea
                rows={4}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write the complete announcement text..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmitting ? "Broadcasting..." : "Dispatch Broadcast"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
