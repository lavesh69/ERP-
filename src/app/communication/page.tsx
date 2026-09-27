"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
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
  ShieldAlert,
  Printer,
  Volume2,
  VolumeX,
  MessageSquare,
  LifeBuoy,
  PhoneCall,
  CheckCircle,
  FileText,
  AlertCircle,
  Inbox,
  RefreshCw,
  KeyRound,
  Sparkles,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  priority: "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
}

interface StudentInquiry {
  id: string;
  studentId: string;
  studentName?: string;
  rollNumber?: string;
  program?: string;
  type: string;
  title: string;
  reason: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "COMPLETED";
  attachmentUrl?: string;
  reviewerRemarks?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CommunicationPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<"CIRCULARS" | "EMERGENCY" | "INQUIRIES" | "OUTBOX">("CIRCULARS");
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAudience, setFilterAudience] = useState("ALL");

  // Inquiries State
  const [inquiries, setInquiries] = useState<StudentInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquiryFilterStatus, setInquiryFilterStatus] = useState("ALL");
  const [selectedInquiry, setSelectedInquiry] = useState<StudentInquiry | null>(null);
  const [inquiryRemarks, setInquiryRemarks] = useState("");
  const [inquiryNewStatus, setInquiryNewStatus] = useState<"UNDER_REVIEW" | "APPROVED" | "REJECTED">("APPROVED");
  const [isUpdatingInquiry, setIsUpdatingInquiry] = useState(false);

  // Outbox & Telemetry State
  const [outboxMessages, setOutboxMessages] = useState<any[]>([]);
  const [outboxStats, setOutboxStats] = useState<any>({
    totalMessages: 0,
    typesCount: {},
    lastDispatchedAt: null,
    relayStatus: "OFFLINE_OUTBOX",
  });
  const [loadingOutbox, setLoadingOutbox] = useState(false);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [selectedOutboxEmail, setSelectedOutboxEmail] = useState<any | null>(null);

  // Broadcast Modal state
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [priority, setPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Official Print Circular Modal
  const [selectedCircularForPrint, setSelectedCircularForPrint] = useState<AnnouncementItem | null>(null);

  // Siren Audio simulation
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  const urgentAlerts = announcements.filter((a) => a.priority === "URGENT");
  const hasActiveUrgent = urgentAlerts.length > 0;

  // Sound synthesizer for emergency audio
  const triggerAudioSiren = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.35);
      osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.7);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch {
      // Audio autoplay policy fallback
    }
  };

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

  useEffect(() => {
    if (activeTab === "INQUIRIES") {
      loadInquiries();
    } else if (activeTab === "OUTBOX") {
      loadOutbox();
    }
  }, [activeTab, refreshTrigger]);

  const loadInquiries = async () => {
    try {
      setLoadingInquiries(true);
      const res = await fetch("/api/students/requests");
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load inquiries:", err);
      showToast("Error fetching student/parent inquiries", "error");
    } finally {
      setLoadingInquiries(false);
    }
  };

  const loadOutbox = async () => {
    try {
      setLoadingOutbox(true);
      const res = await fetch("/api/communication/outbox");
      if (res.ok) {
        const data = await res.json();
        setOutboxMessages(data.outbox || []);
        if (data.stats) setOutboxStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load outbox:", err);
      showToast("Error loading outbox telemetry", "error");
    } finally {
      setLoadingOutbox(false);
    }
  };

  const handleRetryMessage = async (msgId: string) => {
    setRetryingMessageId(msgId);
    try {
      const res = await fetch("/api/communication/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RETRY", messageId: msgId }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Message re-dispatched successfully", "success");
        loadOutbox();
      } else {
        showToast(data.error || "Failed to re-dispatch message", "error");
      }
    } catch {
      showToast("Network error re-dispatching message", "error");
    } finally {
      setRetryingMessageId(null);
    }
  };

  const handleClearOutbox = async () => {
    if (!confirm("Are you sure you want to clear the outbox queue?")) return;
    try {
      const res = await fetch("/api/communication/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CLEAR" }),
      });
      if (res.ok) {
        showToast("Outbox queue cleared", "success");
        loadOutbox();
      }
    } catch {
      showToast("Failed to clear outbox", "error");
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const res = await fetch("/api/communication/outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TEST_DISPATCH",
          subject: "Campus Notification Engine Telemetry Verification",
          html: "<p>Automated test dispatch: verified secure transport across outbox telemetry pipeline.</p>",
          type: "NOTIFICATION",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Test dispatch recorded in outbox", "success");
        loadOutbox();
      } else {
        showToast(data.error || "Failed to dispatch test notification", "error");
      }
    } catch {
      showToast("Network error sending test notification", "error");
    }
  };

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
        const data = await res.json();
        showToast(
          `Broadcast circular dispatched! ${data.telemetry?.notifiedUsersCount || 0} In-App alerts & ${data.telemetry?.smsRecipientsCount || 0} SMS relay delivered.`,
          "success"
        );
        setIsBroadcastModalOpen(false);
        setBroadcastTitle("");
        setBroadcastMessage("");
        triggerRefresh();

        if (priority === "URGENT" && !isAudioMuted) {
          triggerAudioSiren();
        }
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

  const handleDispatchPresetEmergency = async (
    title: string,
    message: string,
    presetAudience: string = "ALL"
  ) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: message,
          targetAudience: presetAudience,
          priority: "URGENT",
        }),
      });

      if (res.ok) {
        showToast(`RED ALERT ACTIVATED: Circular broadcasted with high-priority SMS relay!`, "success");
        triggerRefresh();
        if (!isAudioMuted) {
          triggerAudioSiren();
        }
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to dispatch emergency alert", "error");
      }
    } catch (err) {
      showToast("Network error dispatching emergency alert", "error");
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

  const handleUpdateInquiryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    setIsUpdatingInquiry(true);
    try {
      const res = await fetch("/api/students/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedInquiry.id,
          status: inquiryNewStatus,
          reviewerRemarks: inquiryRemarks.trim() || `Processed by Academic Dean / Registrar on ${new Date().toLocaleDateString()}`,
        }),
      });

      if (res.ok) {
        showToast(`Inquiry status updated to ${inquiryNewStatus}`, "success");
        setSelectedInquiry(null);
        setInquiryRemarks("");
        loadInquiries();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update inquiry", "error");
      }
    } catch (err) {
      showToast("Network error updating inquiry", "error");
    } finally {
      setIsUpdatingInquiry(false);
    }
  };

  const filtered = announcements.filter((a) => {
    const matchesAudience = filterAudience === "ALL" || a.targetAudience === filterAudience;
    const matchesQuery =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAudience && matchesQuery;
  });

  const filteredInquiries = inquiries.filter((inq) => {
    if (inquiryFilterStatus === "ALL") return true;
    return inq.status === inquiryFilterStatus;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: "Administration" }, { label: "Communication Center" }]} />

        {/* Top Emergency Red Alert Banner (Visible when any URGENT notice is active) */}
        {hasActiveUrgent && (
          <div className="p-4 rounded-2xl bg-academic-danger/10 dark:bg-academic-danger/20 border-2 border-academic-danger/40 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-academic-danger text-white flex items-center justify-center shrink-0 shadow-md shadow-academic-danger/30">
                <ShieldAlert className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-academic-danger text-white">
                    LIVE CAMPUS ALERT
                  </span>
                  <span className="text-xs font-bold text-academic-danger dark:text-red-300">
                    {urgentAlerts[0].title}
                  </span>
                </div>
                <p className="text-xs text-charcoal-700 dark:text-charcoal-200 mt-1 line-clamp-1">
                  {urgentAlerts[0].content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  triggerAudioSiren();
                  setIsAudioMuted(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-academic-danger/20 dark:bg-academic-danger/40 text-academic-danger dark:text-red-300 text-xs font-bold hover:bg-academic-danger hover:text-white transition-all"
                title="Test Siren Tone"
              >
                <Volume2 className="h-3.5 w-3.5" />
                <span>Test Siren</span>
              </button>
              <button
                onClick={() => setSelectedCircularForPrint(urgentAlerts[0])}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-academic-danger text-white text-xs font-bold hover:bg-red-700 transition-all shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Full Directive</span>
              </button>
            </div>
          </div>
        )}

        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Central Communication & Broadcast Dispatch
                </h1>
                <span className="badge-subtle bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Multi-Channel Active
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Live dispatch engine: Push notifications, Twilio SMS architecture, in-app circulars, and emergency sirens
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBroadcastModalOpen(true)}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Broadcast Circular</span>
            </button>
          </div>
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
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    hasActiveUrgent ? "bg-red-500 beacon-pulse animate-ping" : "bg-emerald-500 beacon-pulse"
                  }`}
                />
              </div>
              <div
                className={`text-2xl font-display font-bold mt-1 ${
                  hasActiveUrgent ? "text-academic-danger" : "text-academic-success"
                }`}
              >
                {hasActiveUrgent ? "ACTIVE ALERT" : "STANDBY"}
              </div>
              <span
                className={`badge-subtle mt-2 border ${
                  hasActiveUrgent
                    ? "bg-academic-danger-subtle text-academic-danger border-red-200 dark:border-red-800"
                    : "bg-academic-success-subtle text-academic-success border-green-200 dark:border-green-800"
                }`}
              >
                {hasActiveUrgent ? "Live Siren & SMS Triggered" : "Push Relay Ready"}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-800 pb-2">
          <button
            onClick={() => setActiveTab("CIRCULARS")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "CIRCULARS"
                ? "bg-rose-primary text-white shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-surface-soft dark:hover:bg-charcoal-800"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Campus Circulars & Notices</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-charcoal-700 text-current">
              {announcements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("EMERGENCY")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "EMERGENCY"
                ? "bg-academic-danger text-white shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-surface-soft dark:hover:bg-charcoal-800"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Incident Command & Siren SOS</span>
            {hasActiveUrgent && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white text-red-600 font-extrabold animate-pulse">
                LIVE
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("INQUIRIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "INQUIRIES"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-surface-soft dark:hover:bg-charcoal-800"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Pastoral & Scholar Advisory Helpdesk</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-charcoal-700 text-current">
              {inquiries.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("OUTBOX")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "OUTBOX"
                ? "bg-rose-primary text-white shadow-sm"
                : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-surface-soft dark:hover:bg-charcoal-800"
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>Outbox &amp; Delivery Telemetry</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 dark:bg-charcoal-700 text-current">
              {outboxMessages.length || outboxStats.totalMessages || 0}
            </span>
          </button>
        </div>

        {/* TAB 1: CIRCULARS & NOTICES */}
        {activeTab === "CIRCULARS" && (
          <div className="flex flex-col gap-4">
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
                        : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
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
                              ? "bg-academic-danger-subtle text-academic-danger border border-red-200 dark:border-red-800"
                              : a.priority === "HIGH"
                              ? "bg-academic-warning-subtle text-academic-warning border border-yellow-200 dark:border-yellow-800"
                              : "bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800"
                          }`}
                        >
                          {a.priority} PRIORITY
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700">
                          Audience: {a.targetAudience}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-charcoal-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(a.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <button
                          onClick={() => setSelectedCircularForPrint(a)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-200 hover:bg-rose-container transition-colors border border-border dark:border-charcoal-700"
                          title="Print Official Circular"
                        >
                          <Printer className="h-3.5 w-3.5 text-rose-primary" />
                          <span>Official Print</span>
                        </button>
                        <button
                          onClick={() => handleDelete(a.id, a.title)}
                          className="p-1.5 rounded-lg text-charcoal-400 hover:text-academic-danger hover:bg-ivory-100 dark:hover:bg-charcoal-800 transition-colors"
                          title="Delete Notice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {a.title}
                    </h3>
                    <p className="text-xs text-charcoal-700 dark:text-charcoal-300 leading-relaxed whitespace-pre-line">
                      {a.content}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 dark:border-charcoal-800 text-[11px] text-charcoal-500 dark:text-charcoal-400">
                      <div className="flex items-center gap-2">
                        <Radio className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Channels Dispatched: In-App Push, SMS Gateway, Email Digest</span>
                      </div>
                      <span className="text-[10px] font-mono opacity-60">ID: {a.id.substring(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: EMERGENCY INCIDENT COMMAND & SIREN SOS */}
        {activeTab === "EMERGENCY" && (
          <div className="flex flex-col gap-6">
            <div className="glass-panel p-6 rounded-2xl shadow-soft border-2 border-red-200 dark:border-red-900/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-academic-danger" />
                    <span>Emergency Incident Command & Rapid SOS Dispatch</span>
                  </h2>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1 max-w-2xl">
                    One-click high-priority crisis broadcasts override silent profiles, trigger in-app sirens, and dispatch high-throughput SMS alerts to all campus emergency contacts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerAudioSiren();
                      setIsAudioMuted(false);
                      showToast("Audible alert siren pulsed successfully", "info");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-academic-danger/10 dark:bg-academic-danger/20 text-academic-danger dark:text-red-300 text-xs font-bold hover:bg-academic-danger hover:text-white transition-all border border-academic-danger/30"
                  >
                    <Volume2 className="h-4 w-4" />
                    <span>Trigger Audible Beacon</span>
                  </button>
                </div>
              </div>

              {/* 4 Emergency Rapid-Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-danger text-white uppercase">
                      Code Red Drill
                    </span>
                    <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      Fire Evacuation & Assembly Protocol
                    </h4>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                      Orders immediate orderly evacuation to designated Assembly Zones A & B. Security and wardens dispatched.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDispatchPresetEmergency(
                        "CAMPUS EVACUATION DIRECTIVE: Assembly Protocol Activated",
                        "All faculty, students, and campus personnel are instructed to immediately evacuate academic buildings in an orderly manner and proceed to designated Assembly Points A and B. Wardens are on site."
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-academic-danger hover:bg-red-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Dispatch Fire Evacuation Alert</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white uppercase">
                      Weather Advisory
                    </span>
                    <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      Severe Weather Storm / Flash Flood Warning
                    </h4>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                      Instructs students to remain sheltered indoors; shifts subsequent lectures to synchronous virtual classrooms.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDispatchPresetEmergency(
                        "SEVERE WEATHER ADVISORY: Indoor Shelter In Place",
                        "Due to incoming torrential storm warnings, all outdoor activities and physical laboratory sessions are suspended. Scholars are advised to remain indoors. Evening classes will transition to virtual mode."
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Dispatch Storm Advisory</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">
                      Medical SOS
                    </span>
                    <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      Emergency Medical Bay & Paramedic Dispatch
                    </h4>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                      Alerts campus paramedics and health center response teams with immediate corridor right-of-way.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDispatchPresetEmergency(
                        "MEDICAL UNIT DISPATCH: Priority Corridor Clearance",
                        "Campus emergency medical response has been summoned to Academic Block B. Please keep central access corridors clear for paramedic transit.",
                        "ALL"
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Dispatch Medical Advisory</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 flex flex-col justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white uppercase">
                      Security Alert
                    </span>
                    <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                      Campus Access Lockdown & ID Verification
                    </h4>
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                      Restricts exterior gates to biometric and smart card pass verification only. Halts unbadged vehicular entry.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      handleDispatchPresetEmergency(
                        "SECURITY DIRECTIVE: Mandatory Smart ID Screening at Gates",
                        "All perimeter campus entry gates have been placed on Level 2 security verification. Please present your digital or physical university identity card upon entry."
                      )
                    }
                    className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    <span>Dispatch Security Protocol</span>
                  </button>
                </div>
              </div>

              {/* Emergency Directory Hotlines */}
              <div className="mt-6 pt-4 border-t border-border dark:border-charcoal-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 text-xs">
                  <div className="font-bold text-charcoal-900 dark:text-ivory-100">Campus Security Control</div>
                  <div className="text-charcoal-500 font-mono mt-0.5">+1 (800) 555-0199 (24/7 Hotline)</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 text-xs">
                  <div className="font-bold text-charcoal-900 dark:text-ivory-100">Health Clinic / Medical Bay</div>
                  <div className="text-charcoal-500 font-mono mt-0.5">Ext. 911 / +1 (800) 555-0188</div>
                </div>
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 text-xs">
                  <div className="font-bold text-charcoal-900 dark:text-ivory-100">Dean of Students Pastoral Care</div>
                  <div className="text-charcoal-500 font-mono mt-0.5">dean.pastoral@apex.edu</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PASTORAL & SCHOLAR ADVISORY HELPDESK */}
        {activeTab === "INQUIRIES" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-soft">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                {["ALL", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setInquiryFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      inquiryFilterStatus === st
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <span className="text-xs text-charcoal-500 dark:text-charcoal-400 font-medium">
                Showing {filteredInquiries.length} requests
              </span>
            </div>

            {loadingInquiries ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : filteredInquiries.length === 0 ? (
              <EmptyState
                icon={LifeBuoy}
                title="No Pending Pastoral Inquiries"
                description="All student and parent advisory tickets have been addressed."
              />
            ) : (
              <div className="space-y-4">
                {filteredInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft flex flex-col gap-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            inq.status === "APPROVED"
                              ? "bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800"
                              : inq.status === "UNDER_REVIEW"
                              ? "bg-academic-warning-subtle text-academic-warning border border-yellow-200 dark:border-yellow-800"
                              : inq.status === "REJECTED"
                              ? "bg-academic-danger-subtle text-academic-danger border border-red-200 dark:border-red-800"
                              : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          }`}
                        >
                          {inq.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700">
                          {inq.type.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-charcoal-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedInquiry(inq);
                            setInquiryRemarks(inq.reviewerRemarks || "");
                            setInquiryNewStatus(
                              inq.status === "SUBMITTED" ? "UNDER_REVIEW" : (inq.status as any)
                            );
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Respond / Review</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                        {inq.studentName || "Enrolled Candidate"} {inq.rollNumber ? `(${inq.rollNumber})` : ""}
                        {inq.program ? ` · ${inq.program}` : ""}
                      </div>
                      <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                        {inq.title}
                      </h3>
                      <p className="text-xs text-charcoal-700 dark:text-charcoal-300 mt-1 leading-relaxed">
                        {inq.reason}
                      </p>
                    </div>

                    {inq.reviewerRemarks && (
                      <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 text-xs">
                        <span className="font-bold text-charcoal-800 dark:text-ivory-200">
                          Official Dean / Faculty Remark:
                        </span>{" "}
                        <span className="text-charcoal-600 dark:text-charcoal-400">
                          {inq.reviewerRemarks}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: OUTBOX & DELIVERY TELEMETRY */}
        {activeTab === "OUTBOX" && (
          <div className="flex flex-col gap-4">
            {/* Control Bar & Driver Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl shadow-soft">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-primary/10 text-rose-primary flex items-center justify-center font-bold">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      Message Outbox Queue &amp; Dispatch Pipeline
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                      Active Driver: {outboxStats.relayStatus || "OFFLINE_OUTBOX"}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-500 dark:text-charcoal-400">
                    Inspecting all automated outbound emails, OTP security tokens, billing invoices, and notices.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSendTestNotification}
                  className="px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold hover:bg-rose-primary hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-rose-primary" />
                  <span>Send Test Ping</span>
                </button>
                <button
                  onClick={loadOutbox}
                  disabled={loadingOutbox}
                  className="p-2 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-surface-elevated transition-all"
                  title="Refresh Queue"
                >
                  <RefreshCw className={`h-4 w-4 ${loadingOutbox ? "animate-spin" : ""}`} />
                </button>
                {outboxMessages.length > 0 && (
                  <button
                    onClick={handleClearOutbox}
                    className="p-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                    title="Clear Outbox History"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Outbox Content List */}
            {loadingOutbox ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : outboxMessages.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="Outbox Queue Empty"
                description="No outbound emails or notifications have been dispatched yet in this environment."
                actionLabel="Dispatch Test Notification"
                onAction={handleSendTestNotification}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {outboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="glass-panel p-4 rounded-2xl shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-border/80 dark:border-charcoal-700 hover:border-rose-primary/40 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="h-4 w-4 text-rose-primary" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                            {msg.type}
                          </span>
                          {msg.otpCode && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <KeyRound className="h-3 w-3" />
                              OTP: {msg.otpCode}
                            </span>
                          )}
                          <span className="text-[10px] text-charcoal-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
                          {msg.subject}
                        </h4>
                        <p className="text-[11px] text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                          Recipient: <span className="font-semibold text-charcoal-700 dark:text-charcoal-300">{msg.to}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => setSelectedOutboxEmail(msg)}
                        className="px-3 py-1.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold hover:bg-surface-elevated transition-all flex items-center gap-1"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Inspect HTML</span>
                      </button>
                      <button
                        onClick={() => handleRetryMessage(msg.id)}
                        disabled={retryingMessageId === msg.id}
                        className="px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${retryingMessageId === msg.id ? "animate-spin" : ""}`} />
                        <span>Re-dispatch</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODAL: BROADCAST CIRCULAR */}
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
                placeholder="e.g. Schedule for Fall 2026 Comprehensive Examinations"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
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
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                >
                  <option value="ALL">All Campus (Scholars & Faculty)</option>
                  <option value="STUDENTS">Scholars & Students Only</option>
                  <option value="FACULTY">Faculty & Research Staff Only</option>
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
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                >
                  <option value="NORMAL">Normal Advisory</option>
                  <option value="HIGH">High Priority Notice</option>
                  <option value="URGENT">Urgent Red Alert Siren</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Circular Message Body
              </label>
              <textarea
                rows={5}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write the complete official notice text..."
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800/70 border border-border dark:border-charcoal-700 text-[11px] text-charcoal-600 dark:text-charcoal-400">
              <span className="font-bold text-charcoal-800 dark:text-ivory-200">Automated Dispatch Channels:</span> In-App Push notifications fan-out, Twilio SMS broadcast relay, and campus email notification digest.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
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

        {/* MODAL: RESPOND TO PASTORAL INQUIRY */}
        <Modal
          isOpen={!!selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          title="Review & Respond to Scholar Inquiry"
        >
          {selectedInquiry && (
            <form onSubmit={handleUpdateInquiryStatus} className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <div className="font-bold text-charcoal-900 dark:text-ivory-100">
                  {selectedInquiry.studentName || "Candidate"} ({selectedInquiry.rollNumber || "N/A"})
                </div>
                <div className="text-charcoal-500 mt-0.5">
                  Type: <span className="font-semibold text-rose-primary">{selectedInquiry.type}</span> · Submitted on {new Date(selectedInquiry.createdAt).toLocaleDateString()}
                </div>
                <div className="mt-2 text-charcoal-800 dark:text-charcoal-200 italic">
                  &ldquo;{selectedInquiry.reason}&rdquo;
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Update Resolution Status
                </label>
                <select
                  value={inquiryNewStatus}
                  onChange={(e) => setInquiryNewStatus(e.target.value as any)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="UNDER_REVIEW">Under Review / In Progress</option>
                  <option value="APPROVED">Approved & Granted</option>
                  <option value="REJECTED">Declined / Needs Resubmission</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Official Advisory Remarks / Feedback
                </label>
                <textarea
                  rows={3}
                  value={inquiryRemarks}
                  onChange={(e) => setInquiryRemarks(e.target.value)}
                  placeholder="Provide guidance or condition of approval..."
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingInquiry}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  {isUpdatingInquiry ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* MODAL: OFFICIAL PRINTABLE CIRCULAR */}
        <Modal
          isOpen={!!selectedCircularForPrint}
          onClose={() => setSelectedCircularForPrint(null)}
          title="Official University Circular Document"
        >
          {selectedCircularForPrint && (
            <div className="flex flex-col gap-4 text-xs">
              <div
                id="printable-circular"
                className="p-6 rounded-2xl bg-white text-black border border-gray-300 shadow-sm font-serif print:m-0 print:border-none print:shadow-none"
              >
                {/* University Letterhead */}
                <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <div className="text-xl font-bold tracking-widest uppercase">
                    APEX UNIVERSITY OF TECHNOLOGY & MANAGEMENT
                  </div>
                  <div className="text-[11px] font-sans text-gray-700 uppercase tracking-wider mt-0.5">
                    Office of the Registrar & Controller of Examinations
                  </div>
                  <div className="text-[10px] font-sans text-gray-500">
                    Administrative Secretariat · Knowledge Corridor · ISO 9001:2026 Certified
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex justify-between items-center text-[11px] font-sans mb-4 border-b border-gray-200 pb-2">
                  <div>
                    <span className="font-bold">REF NO:</span> APX/CIRCULAR/2026/
                    {selectedCircularForPrint.id.substring(0, 6).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold">DATE:</span>{" "}
                    {new Date(selectedCircularForPrint.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Subject */}
                <div className="mb-4">
                  <span className="font-bold uppercase tracking-wide font-sans text-xs">
                    SUBJECT: {selectedCircularForPrint.title}
                  </span>
                  <div className="text-[10px] text-gray-600 font-sans mt-0.5">
                    Target Distribution: {selectedCircularForPrint.targetAudience} · Priority:{" "}
                    {selectedCircularForPrint.priority}
                  </div>
                </div>

                {/* Content */}
                <div className="text-sm leading-relaxed text-gray-900 whitespace-pre-line mb-8">
                  {selectedCircularForPrint.content}
                </div>

                {/* Sign-off & Seal */}
                <div className="flex justify-between items-end pt-6 border-t border-gray-200 font-sans">
                  <div>
                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-[8px] font-bold text-gray-400 uppercase text-center rotate-[-12deg]">
                      OFFICIAL<br />SEAL
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs uppercase">Dr. Arthur Pendelton, Ph.D.</div>
                    <div className="text-[10px] text-gray-600">Registrar & Dean of Academic Governance</div>
                    <div className="text-[9px] text-gray-500">Apex University Central Secretariat</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setSelectedCircularForPrint(null)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL: OUTBOX EMAIL PREVIEW */}
        <Modal
          isOpen={!!selectedOutboxEmail}
          onClose={() => setSelectedOutboxEmail(null)}
          title={`Outbox Message: ${selectedOutboxEmail?.subject || "Preview"}`}
        >
          {selectedOutboxEmail && (
            <div className="flex flex-col gap-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-800 border border-border dark:border-charcoal-700 flex flex-col gap-1">
                <div>
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-300">Recipient:</span>{" "}
                  <span className="text-charcoal-900 dark:text-ivory-100 font-semibold">{selectedOutboxEmail.to}</span>
                </div>
                <div>
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-300">Subject:</span>{" "}
                  <span className="text-charcoal-900 dark:text-ivory-100">{selectedOutboxEmail.subject}</span>
                </div>
                <div>
                  <span className="font-bold text-charcoal-700 dark:text-charcoal-300">Timestamp:</span>{" "}
                  <span className="text-charcoal-500">{new Date(selectedOutboxEmail.createdAt).toLocaleString()}</span>
                </div>
                {selectedOutboxEmail.otpCode && (
                  <div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Security Token / OTP:</span>{" "}
                    <code className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-bold">
                      {selectedOutboxEmail.otpCode}
                    </code>
                  </div>
                )}
              </div>

              <div>
                <span className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Rendered Email HTML Body
                </span>
                <div
                  className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 overflow-auto max-h-[300px]"
                  dangerouslySetInnerHTML={{ __html: selectedOutboxEmail.html }}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setSelectedOutboxEmail(null)}
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRetryMessage(selectedOutboxEmail.id);
                    setSelectedOutboxEmail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold"
                >
                  Re-dispatch Now
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
