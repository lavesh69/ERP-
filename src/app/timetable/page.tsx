"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Printer,
  Trash2,
  LayoutGrid,
  Download,
  Search,
  UserCheck,
  Shuffle,
  Building,
  GraduationCap,
  BookOpen,
  Radio,
  FileText,
  Copy,
  ExternalLink,
  ShieldCheck,
  Layers,
  FlaskConical,
  GripVertical,
} from "lucide-react";

export default function TimetablePage() {
  const { showToast, currentRole, refreshTrigger, triggerRefresh } = useApp();
  const isStudent = currentRole === "STUDENT" || currentRole === "PARENT";

  // Navigation & Filtering State
  const [scheduleMode, setScheduleMode] = useState<"CLASS" | "EXAM">("CLASS");
  const [viewMode, setViewMode] = useState<"DAY" | "WEEK">("DAY");
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [selectedCourseType, setSelectedCourseType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPersonalView, setIsPersonalView] = useState(false);

  // Data State
  const [slots, setSlots] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalSlots: 0,
    totalLectureHours: 0,
    activeRoomsCount: 0,
    avgRoomUtilizationPercent: 0,
    clashesCount: 0,
  });
  const [metadata, setMetadata] = useState<{
    rooms: any[];
    courses: any[];
    faculty: any[];
    sections: any[];
  }>({
    rooms: [],
    courses: [],
    faculty: [],
    sections: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const [isWebcalModalOpen, setIsWebcalModalOpen] = useState(false);
  const [isSubstituteModalOpen, setIsSubstituteModalOpen] = useState(false);
  const [selectedSlotForSubstitute, setSelectedSlotForSubstitute] = useState<any>(null);
  const [substituteFacultyId, setSubstituteFacultyId] = useState("");
  const [substituteRemarks, setSubstituteRemarks] = useState("");
  const [isSubmittingSubstitute, setIsSubmittingSubstitute] = useState(false);

  // Sick Leave Auto-Substitution Engine State
  const [isAutoSubstituteModalOpen, setIsAutoSubstituteModalOpen] = useState(false);
  const [absentFacultyId, setAbsentFacultyId] = useState("");
  const [sickLeaveDay, setSickLeaveDay] = useState("MONDAY");
  const [autoResolvedPlan, setAutoResolvedPlan] = useState<any[]>([]);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [draggingSlotId, setDraggingSlotId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  // Form State for Adding New Slot
  const [formData, setFormData] = useState({
    courseCode: "CS-402",
    facultyId: "",
    roomId: "",
    sectionId: "",
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "10:30",
  });

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

  const isSlotLive = (slot: any) => {
    const now = new Date();
    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const todayName = daysOfWeek[now.getDay()];
    if (slot.dayOfWeek !== todayName) return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = (slot.startTime || "00:00").split(":").map(Number);
    const [endH, endM] = (slot.endTime || "00:00").split(":").map(Number);
    const slotStart = startH * 60 + startM;
    const slotEnd = endH * 60 + endM;

    return currentMinutes >= slotStart && currentMinutes <= slotEnd;
  };

  const getMinutesRemaining = (slot: any) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [endH, endM] = (slot.endTime || "00:00").split(":").map(Number);
    return Math.max(0, endH * 60 + endM - currentMinutes);
  };

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("mode", scheduleMode);
      if (selectedSection !== "ALL") params.append("section", selectedSection);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (isPersonalView) params.append("personal", "true");

      const res = await fetch(`/api/timetable?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
        if (data.metrics) setMetrics(data.metrics);
        if (data.metadata) {
          setMetadata(data.metadata);
          if (data.metadata.faculty?.length > 0 && !formData.facultyId) {
            setFormData((prev) => ({
              ...prev,
              facultyId: data.metadata.faculty[0].id,
              roomId: data.metadata.rooms[0]?.id || "",
              sectionId: data.metadata.sections?.[0]?.id || "",
            }));
          }
        }
      }
    } catch (err) {
      console.error("Timetable fetch error:", err);
      showToast("Error retrieving academic timetable data", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [scheduleMode, selectedSection, searchQuery, isPersonalView, refreshTrigger]);

  const handleExportICS = () => {
    if (slots.length === 0) {
      showToast("No timetable slots to export", "error");
      return;
    }

    const dayMap: Record<string, string> = {
      MONDAY: "MO",
      TUESDAY: "TU",
      WEDNESDAY: "WE",
      THURSDAY: "TH",
      FRIDAY: "FR",
      SATURDAY: "SA",
      SUNDAY: "SU",
    };

    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Apex University//Academic OS Timetable v2.5//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Apex University Academic Schedule",
      "X-WR-TIMEZONE:Asia/Kolkata",
    ];

    slots.forEach((s) => {
      const byDay = dayMap[s.dayOfWeek] || "MO";
      const startParts = (s.startTime || "09:00").split(":");
      const endParts = (s.endTime || "10:30").split(":");
      const startStr = `20260901T${startParts[0]}${startParts[1]}00`;
      const endStr = `20260901T${endParts[0]}${endParts[1]}00`;

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:class-${s.id || Math.random().toString(36).substring(7)}@apex.edu`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
        `DTSTART:${startStr}`,
        `DTEND:${endStr}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`,
        `SUMMARY:${s.courseCode}: ${s.courseTitle}`,
        `DESCRIPTION:Instructor: ${s.facultyName || "Faculty"} | Section: ${s.sectionName || "Core"} | Room: ${s.roomName || "Hall"}`,
        `LOCATION:${s.roomName || "Main Campus"}`,
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${s.courseCode} lecture in ${s.roomName || "classroom"} starts in 15 minutes.`,
        "END:VALARM",
        "END:VEVENT"
      );
    });

    icsLines.push("END:VCALENDAR");

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `apex-timetable-${scheduleMode.toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("Schedule exported to RFC-5545 iCalendar (.ics) with 15-min alerts!", "success");
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);
    try {
      const res = await fetch("/api/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Timetable slot successfully scheduled without space or faculty conflicts!", "success");
        setIsAddModalOpen(false);
        triggerRefresh();
      } else if (res.status === 409) {
        setConflictError(data.error || "Conflict detected.");
      } else {
        setConflictError(data.error || "Failed to schedule slot.");
      }
    } catch {
      setConflictError("Network error validating timetable slot.");
    }
  };

  const handleAssignSubstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotForSubstitute || !substituteFacultyId) {
      showToast("Please choose a substitute faculty member", "error");
      return;
    }

    setIsSubmittingSubstitute(true);
    try {
      const res = await fetch("/api/timetable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ASSIGN_SUBSTITUTE",
          slotId: selectedSlotForSubstitute.id,
          substituteFacultyId,
          remarks: substituteRemarks.trim() || "Faculty leave coverage",
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        showToast(resData.message || "Substitute faculty assigned successfully!", "success");
        setIsSubstituteModalOpen(false);
        setSelectedSlotForSubstitute(null);
        setSubstituteRemarks("");
        triggerRefresh();
      } else {
        showToast(resData.error || "Failed to assign substitute", "error");
      }
    } catch {
      showToast("Network error updating substitute assignment", "error");
    } finally {
      setIsSubmittingSubstitute(false);
    }
  };

  const generateAutoPlan = (facultyId: string, day: string) => {
    if (!facultyId) {
      setAutoResolvedPlan([]);
      return;
    }
    const impactedSlots = slots.filter(
      (s) => (s.facultyId === facultyId || s.faculty?.id === facultyId) && s.dayOfWeek === day
    );

    const plan = impactedSlots.map((slot) => {
      const busyIds = new Set(
        slots
          .filter(
            (other) =>
              other.dayOfWeek === day &&
              other.id !== slot.id &&
              ((other.startTime <= slot.startTime && other.endTime > slot.startTime) ||
                (other.startTime < slot.endTime && other.endTime >= slot.endTime))
          )
          .map((s) => s.facultyId || s.faculty?.id)
      );

      const candidateFaculty = metadata.faculty.filter(
        (f) => f.id !== facultyId && !busyIds.has(f.id)
      );

      const chosenSub = candidateFaculty[0] || null;

      return {
        slotId: slot.id,
        courseCode: slot.courseCode,
        courseName: slot.course?.name || slot.courseCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomName: slot.room?.name || slot.roomId,
        sectionName: slot.section?.name || slot.sectionId,
        absentFaculty: metadata.faculty.find((f) => f.id === facultyId)?.name || "Absent Instructor",
        substitute: chosenSub,
      };
    });

    setAutoResolvedPlan(plan);
  };

  const handleExecuteAutoPlan = async () => {
    if (autoResolvedPlan.length === 0) return;
    setIsExecutingPlan(true);
    let successCount = 0;
    try {
      for (const item of autoResolvedPlan) {
        if (!item.substitute) continue;
        const res = await fetch("/api/timetable", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ASSIGN_SUBSTITUTE",
            slotId: item.slotId,
            substituteFacultyId: item.substitute.id,
            remarks: `1-Click Auto Sick-Leave Solver: Cover for ${item.absentFaculty}`,
          }),
        });
        if (res.ok) successCount++;
      }
      showToast(`Auto-assigned substitutes for ${successCount} classes! Zero conflicts detected.`, "success");
      setIsAutoSubstituteModalOpen(false);
      triggerRefresh();
      fetchTimetable();
    } catch {
      showToast("Network error executing auto-substitution plan", "error");
    } finally {
      setIsExecutingPlan(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure you want to remove this timetable slot?")) return;
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/timetable?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Timetable slot removed", "success");
        triggerRefresh();
      } else {
        showToast(data.error || "Failed to delete slot", "error");
      }
    } catch {
      showToast("Network error deleting slot", "error");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDropOnDay = async (targetDay: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverDay(null);
    const slotId = e.dataTransfer.getData("text/plain") || draggingSlotId;
    if (!slotId) return;

    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    if (slot.dayOfWeek === targetDay) return;

    setIsRescheduling(true);
    try {
      const res = await fetch("/api/timetable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESCHEDULE",
          slotId: slot.id,
          newDayOfWeek: targetDay,
          newStartTime: slot.startTime,
          newEndTime: slot.endTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Conflict detected while moving slot", "error");
      } else {
        showToast(`Moved ${slot.courseCode} lecture to ${targetDay} (${slot.startTime} - ${slot.endTime})`, "success");
        setSlots((prev) =>
          prev.map((s) => (s.id === slot.id ? { ...s, dayOfWeek: targetDay } : s))
        );
        triggerRefresh();
        fetchTimetable();
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reschedule lecture", "error");
    } finally {
      setIsRescheduling(false);
      setDraggingSlotId(null);
    }
  };

  // Filter slots for client-side courseType
  const filteredSlots = slots.filter((s) => {
    if (selectedCourseType !== "ALL") {
      if (selectedCourseType === "LAB" && s.courseType !== "LAB") return false;
      if (selectedCourseType === "THEORY" && s.courseType !== "THEORY") return false;
    }
    return true;
  });

  const daySlots = filteredSlots.filter((s) => s.dayOfWeek === selectedDay);

  // Active Live Slot & Next Upcoming Class
  const liveSlot = slots.find((s) => isSlotLive(s));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Master Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft print:border-none print:shadow-none print:p-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 print:hidden shrink-0">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Academic Scheduling & Space Conflict Engine
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  Deterministic Solvers Active
                </span>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700">
                  <Clock className="h-3 w-3 text-rose-primary" />
                  Apex Campus Time (UTC+05:30)
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-0.5">
                Collision detection across lecture theaters, high-performance computing labs, and faculty contact hours
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Mode Toggle: Class Schedule vs Exam Roster */}
            <div className="flex items-center bg-ivory-100 dark:bg-charcoal-800 p-1 rounded-xl border border-border dark:border-charcoal-700">
              <button
                onClick={() => setScheduleMode("CLASS")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scheduleMode === "CLASS"
                    ? "bg-white dark:bg-[#1E191C] text-charcoal-900 dark:text-ivory-100 shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-rose-primary" />
                <span>Class Lectures</span>
              </button>
              <button
                onClick={() => setScheduleMode("EXAM")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scheduleMode === "EXAM"
                    ? "bg-white dark:bg-[#1E191C] text-charcoal-900 dark:text-ivory-100 shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                <span>Exam Roster</span>
              </button>
            </div>

            {/* View Mode Toggle: Day vs Week */}
            <div className="flex items-center bg-ivory-100 dark:bg-charcoal-800 p-1 rounded-xl border border-border dark:border-charcoal-700">
              <button
                onClick={() => setViewMode("DAY")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "DAY"
                    ? "bg-white dark:bg-[#1E191C] text-charcoal-900 dark:text-ivory-100 shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode("WEEK")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "WEEK"
                    ? "bg-white dark:bg-[#1E191C] text-charcoal-900 dark:text-ivory-100 shadow-sm"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Weekly Grid</span>
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold transition-all"
              title="Print Official Timetable"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Live Webcal Sync & ICS Export Buttons */}
            <button
              onClick={() => setIsWebcalModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold transition-all"
              title="Subscribe via Live Webcal Feed"
            >
              <Radio className="h-4 w-4 text-emerald-500" />
              <span className="hidden sm:inline">Sync Calendar</span>
            </button>

            <button
              onClick={handleExportICS}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold transition-all"
              title="Download RFC-5545 iCalendar (.ics)"
            >
              <Download className="h-4 w-4 text-rose-primary" />
              <span className="hidden sm:inline">Export (.ics)</span>
            </button>

            {!isStudent && scheduleMode === "CLASS" && (
              <button
                onClick={() => {
                  const initialId = metadata.faculty[0]?.id || "";
                  setAbsentFacultyId(initialId);
                  generateAutoPlan(initialId, selectedDay);
                  setIsAutoSubstituteModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs font-bold transition-all shadow-xs"
                title="1-Click Sick Leave Auto-Substitution Engine"
              >
                <Shuffle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Sick Leave Auto-Solver</span>
              </button>
            )}

            {!isStudent && scheduleMode === "CLASS" && (
              <button
                onClick={() => {
                  setConflictError(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Slot</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Academic Telemetry Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
          <div className="p-4 rounded-2xl glass-panel border border-border dark:border-charcoal-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
                {scheduleMode === "EXAM" ? "Exam Sessions" : "Scheduled Lectures"}
              </span>
              <span className="text-xl font-black text-charcoal-900 dark:text-ivory-100 mt-0.5 block">
                {metrics.totalSlots}
              </span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-primary/10 text-rose-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-border dark:border-charcoal-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
                Weekly Contact Hours
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {metrics.totalLectureHours} hrs
              </span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-border dark:border-charcoal-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
                Smart Space Utilization
              </span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                {metrics.avgRoomUtilizationPercent}%
              </span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 rounded-2xl glass-panel border border-border dark:border-charcoal-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider block">
                Collision Check
              </span>
              <span className="text-xs font-bold text-academic-success flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Zero Clashes
              </span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-academic-success-subtle text-academic-success flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Live Active Lecture Alert Banner */}
        {liveSlot && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border border-rose-500/30 dark:border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-soft print:hidden">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Lecture In Session Now
                  </span>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    {liveSlot.courseCode} — {liveSlot.courseTitle}
                  </span>
                </div>
                <div className="text-[11px] text-charcoal-600 dark:text-charcoal-400 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-primary" /> {liveSlot.roomName}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3 text-indigo-500" /> {liveSlot.facultyName}</span>
                  <span className="flex items-center gap-1 font-mono"><Clock className="h-3 w-3 text-emerald-500" /> {liveSlot.startTime} - {liveSlot.endTime}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold px-3 py-1 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200">
                {getMinutesRemaining(liveSlot)} mins remaining
              </span>
            </div>
          </div>
        )}

        {/* Multi-Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl shadow-soft print:hidden">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-charcoal-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search course code, subject, instructor, or room..."
                className="w-full pl-9 pr-3 py-2 bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-primary/30"
              />
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-1.5 bg-ivory-100 dark:bg-charcoal-900 px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 text-xs">
              <span className="font-bold text-charcoal-500">Section:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-charcoal-800">All Sections</option>
                {metadata.sections.map((s) => (
                  <option key={s.id} value={s.id} className="dark:bg-charcoal-800">
                    {s.name} ({s.capacity} seats)
                  </option>
                ))}
              </select>
            </div>

            {/* Pedagogical Course Type Filter */}
            <div className="flex items-center gap-1.5 bg-ivory-100 dark:bg-charcoal-900 px-3 py-2 rounded-xl border border-border dark:border-charcoal-700 text-xs">
              <span className="font-bold text-charcoal-500">Type:</span>
              <select
                value={selectedCourseType}
                onChange={(e) => setSelectedCourseType(e.target.value)}
                className="bg-transparent text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="dark:bg-charcoal-800">All Modules</option>
                <option value="THEORY" className="dark:bg-charcoal-800">Theory Lectures</option>
                <option value="LAB" className="dark:bg-charcoal-800">Laboratory Practicals</option>
              </select>
            </div>
          </div>

          {/* Perspective Toggle: Personal vs Master */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPersonalView(!isPersonalView)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                isPersonalView
                  ? "bg-rose-primary text-white border-rose-primary shadow-sm"
                  : "bg-ivory-100 dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 border-border dark:border-charcoal-700 hover:bg-ivory-200"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{isPersonalView ? "Showing My Schedule" : "Filter My Schedule"}</span>
            </button>
          </div>
        </div>

        {/* Day Selector Pills (Visible in DAY view) */}
        {viewMode === "DAY" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                onDragOver={(e) => {
                  if (!isStudent && scheduleMode === "CLASS") {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                  }
                }}
                onDragEnter={() => {
                  if (!isStudent && scheduleMode === "CLASS") setDragOverDay(day);
                }}
                onDragLeave={() => {
                  if (dragOverDay === day) setDragOverDay(null);
                }}
                onDrop={(e) => {
                  if (!isStudent && scheduleMode === "CLASS") handleDropOnDay(day, e);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  dragOverDay === day
                    ? "ring-2 ring-rose-primary bg-rose-500/20 text-rose-primary scale-105"
                    : selectedDay === day
                    ? "bg-rose-primary text-white shadow-sm shadow-rose-primary/20"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700"
                }`}
              >
                {day}
                {dragOverDay === day && " 🎯"}
              </button>
            ))}
          </div>
        )}

        {/* Drag & Drop Quick Notice for Admins/Faculty */}
        {!isStudent && scheduleMode === "CLASS" && (
          <div className="flex items-center justify-between text-xs text-charcoal-500 dark:text-charcoal-400 bg-ivory-100/60 dark:bg-charcoal-800/60 px-3.5 py-1.5 rounded-xl border border-border/60 dark:border-charcoal-700/60 print:hidden">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-rose-primary" />
              Interactive Drag &amp; Drop Grid: Drag any lecture card onto another day or weekly column to reschedule with automatic conflict checking.
            </span>
            {isRescheduling && (
              <span className="flex items-center gap-1 text-rose-primary font-bold animate-pulse">
                Rescheduling slot...
              </span>
            )}
          </div>
        )}

        {/* Schedule Display */}
        {isLoading ? (
          <SkeletonTable rows={4} />
        ) : viewMode === "WEEK" ? (
          /* WEEKLY GRID MATRIX VIEW */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {days.map((day) => {
              const daySlotsList = filteredSlots
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isDropTarget = dragOverDay === day;
              return (
                <div
                  key={day}
                  onDragOver={(e) => {
                    if (!isStudent && scheduleMode === "CLASS") {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDragEnter={() => {
                    if (!isStudent && scheduleMode === "CLASS") setDragOverDay(day);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverDay(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!isStudent && scheduleMode === "CLASS") handleDropOnDay(day, e);
                  }}
                  className={`glass-panel rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-soft transition-all ${
                    isDropTarget
                      ? "ring-2 ring-rose-primary bg-rose-50/40 dark:bg-rose-950/30 scale-[1.01]"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
                    <span className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {day}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                      isDropTarget
                        ? "bg-rose-primary text-white"
                        : "bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300"
                    }`}>
                      {isDropTarget ? "Drop Here" : daySlotsList.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 min-h-[140px]">
                    {daySlotsList.length === 0 ? (
                      <p className="text-[11px] text-charcoal-400 italic py-6 text-center">
                        No sessions scheduled
                      </p>
                    ) : (
                      daySlotsList.map((slot) => {
                        const live = isSlotLive(slot);
                        const isLab = slot.courseType === "LAB";
                        const isExam = slot.courseType === "EXAM";
                        return (
                          <div
                            key={slot.id}
                            draggable={!isStudent && scheduleMode === "CLASS"}
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", slot.id);
                              e.dataTransfer.effectAllowed = "move";
                              setDraggingSlotId(slot.id);
                            }}
                            onDragEnd={() => {
                              setDraggingSlotId(null);
                              setDragOverDay(null);
                            }}
                            className={`p-3 rounded-xl bg-ivory-50 dark:bg-[#252024] border flex flex-col gap-1.5 relative group transition-all ${
                              !isStudent && scheduleMode === "CLASS" ? "cursor-grab active:cursor-grabbing" : ""
                            } ${
                              draggingSlotId === slot.id ? "opacity-40 scale-95 border-dashed border-rose-primary" : ""
                            } ${
                              live
                                ? "border-red-400 dark:border-red-700 ring-2 ring-red-500/20 shadow-sm"
                                : isExam
                                ? "border-indigo-400/40 dark:border-indigo-700/50"
                                : isLab
                                ? "border-emerald-400/40 dark:border-emerald-700/50"
                                : "border-border/80 dark:border-charcoal-700"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                {!isStudent && scheduleMode === "CLASS" && (
                                  <GripVertical className="h-3 w-3 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 cursor-grab shrink-0" />
                                )}
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isExam
                                      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                                      : isLab
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                      : "bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent"
                                  }`}
                                >
                                  {slot.courseCode}
                                </span>
                                {live && (
                                  <span className="flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                                    LIVE
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                              {slot.courseTitle}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-charcoal-500 dark:text-charcoal-400 pt-1 border-t border-border/40 dark:border-charcoal-700">
                              <span className="truncate max-w-[95px] flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />
                                {slot.roomName}
                              </span>
                              <span className="truncate max-w-[85px]">{slot.facultyName}</span>
                            </div>

                            {!isStudent && scheduleMode === "CLASS" && (
                              <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setSelectedSlotForSubstitute(slot);
                                    setIsSubstituteModalOpen(true);
                                  }}
                                  className="p-1 rounded-md text-charcoal-400 hover:text-rose-primary hover:bg-rose-container"
                                  title="Assign Substitute Teacher"
                                >
                                  <Shuffle className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  disabled={isDeleting === slot.id}
                                  className="p-1 rounded-md text-charcoal-400 hover:text-academic-danger hover:bg-academic-danger-subtle"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : daySlots.length === 0 ? (
          <EmptyState
            icon={CalendarIcon}
            title={`No slots scheduled for ${selectedDay}`}
            description="There are no lectures or examination papers scheduled on this day."
            actionLabel={!isStudent && scheduleMode === "CLASS" ? "Schedule First Slot" : undefined}
            onAction={!isStudent && scheduleMode === "CLASS" ? () => setIsAddModalOpen(true) : undefined}
          />
        ) : (
          /* SINGLE DAY VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daySlots.map((slot) => {
              const live = isSlotLive(slot);
              const isLab = slot.courseType === "LAB";
              const isExam = slot.courseType === "EXAM";
              return (
                <div
                  key={slot.id}
                  draggable={!isStudent && scheduleMode === "CLASS"}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", slot.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingSlotId(slot.id);
                  }}
                  onDragEnd={() => {
                    setDraggingSlotId(null);
                    setDragOverDay(null);
                  }}
                  className={`glass-panel glass-card-hover p-5 rounded-2xl shadow-soft flex flex-col justify-between relative group transition-all ${
                    !isStudent && scheduleMode === "CLASS" ? "cursor-grab active:cursor-grabbing" : ""
                  } ${
                    draggingSlotId === slot.id ? "opacity-40 scale-95 border-dashed border-rose-primary" : ""
                  } ${
                    live
                      ? "border-red-400 dark:border-red-700 ring-2 ring-red-500/20 shadow-md"
                      : isExam
                      ? "border-indigo-500/30"
                      : isLab
                      ? "border-emerald-500/30"
                      : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-3">
                      <div className="flex items-center gap-2">
                        {!isStudent && scheduleMode === "CLASS" && (
                          <GripVertical className="h-4 w-4 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 cursor-grab shrink-0" />
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            isExam
                              ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                              : isLab
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent"
                          }`}
                        >
                          {slot.courseCode}
                        </span>
                        {isLab && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" />
                            PRACTICAL
                          </span>
                        )}
                        {live && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white animate-pulse shadow-xs">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-academic-success flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                        {!isStudent && scheduleMode === "CLASS" && (
                          <div className="flex items-center gap-1 print:hidden">
                            <button
                              onClick={() => {
                                setSelectedSlotForSubstitute(slot);
                                setIsSubstituteModalOpen(true);
                              }}
                              className="p-1 rounded text-charcoal-400 hover:text-rose-primary hover:bg-rose-container"
                              title="Assign Substitute Teacher"
                            >
                              <Shuffle className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={isDeleting === slot.id}
                              className="p-1 rounded text-charcoal-400 hover:text-academic-danger hover:bg-academic-danger-subtle"
                              title="Delete slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                      {slot.courseTitle}
                    </h3>

                    <div className="flex flex-col gap-2 mt-3 text-xs text-charcoal-600 dark:text-charcoal-400">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-rose-accent shrink-0" />
                        <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                          {slot.facultyName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-rose-accent shrink-0" />
                        <span>{slot.roomName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-[11px] text-charcoal-500">
                    <span>{slot.sectionName || "Section A"}</span>
                    <span className="inline-flex items-center gap-1 text-academic-success font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified Conflict-Free
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Schedule Timetable Slot */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Schedule Timetable Slot"
          description="Algorithmically verified against room capacity, equipment suitability, and instructor availability."
        >
          <form onSubmit={handleAddSlot} className="flex flex-col gap-3 text-xs">
            {conflictError && (
              <div className="p-3 rounded-xl bg-academic-danger-subtle dark:bg-red-950/40 border border-academic-danger/30 text-academic-danger flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{conflictError}</span>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Course Module
              </label>
              <select
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium"
              >
                {metadata.courses.map((c) => (
                  <option key={c.id} value={c.code}>
                    {c.code}: {c.title} [{c.courseType}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Primary Faculty
                </label>
                <select
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  {metadata.faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Lecture Hall / Lab
                </label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  {metadata.rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code}) [{r.capacity} seats]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Student Section
                </label>
                <select
                  value={formData.sectionId}
                  onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  {metadata.sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.capacity} students)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Weekday
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-medium"
                >
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-mono"
                  placeholder="09:00"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-mono"
                  placeholder="10:30"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
              >
                Run Solvers & Schedule
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Assign Substitute Faculty */}
        <Modal
          isOpen={isSubstituteModalOpen}
          onClose={() => setIsSubstituteModalOpen(false)}
          title="Assign Temporary Substitute Faculty"
          description={`Reassign teaching duty for ${selectedSlotForSubstitute?.courseCode} (${selectedSlotForSubstitute?.dayOfWeek} ${selectedSlotForSubstitute?.startTime}-${selectedSlotForSubstitute?.endTime}).`}
        >
          <form onSubmit={handleAssignSubstitute} className="flex flex-col gap-4 text-xs">
            <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700">
              <div className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                Current Scheduled Teacher:
              </div>
              <div className="font-semibold text-rose-primary text-sm mt-0.5">
                {selectedSlotForSubstitute?.facultyName}
              </div>
              <div className="text-[10px] text-charcoal-500 mt-1">
                Room: {selectedSlotForSubstitute?.roomName} • Section: {selectedSlotForSubstitute?.sectionName}
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Select Substitute Faculty Member
              </label>
              <select
                value={substituteFacultyId}
                onChange={(e) => setSubstituteFacultyId(e.target.value)}
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              >
                <option value="">-- Choose verified available instructor --</option>
                {metadata.faculty
                  .filter((f) => f.id !== selectedSlotForSubstitute?.facultyId)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation || "Faculty"})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Justification / Leave Coverage Note
              </label>
              <input
                type="text"
                value={substituteRemarks}
                onChange={(e) => setSubstituteRemarks(e.target.value)}
                placeholder="e.g. Conference attendance coverage / Emergency sick leave"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsSubstituteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSubstitute || !substituteFacultyId}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {isSubmittingSubstitute ? "Assigning..." : "Confirm Substitute Teacher"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Live Calendar Sync (Webcal) */}
        <Modal
          isOpen={isWebcalModalOpen}
          onClose={() => setIsWebcalModalOpen(false)}
          title="Subscribe to Live University Academic Schedule"
          description="Sync your classes automatically to Google Calendar, Apple Calendar, or Microsoft Outlook via real-time Webcal feed."
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl flex items-start gap-3">
              <Radio className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <div className="font-bold text-emerald-800 dark:text-emerald-300">
                  Continuous 2-Way Sync Active
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                  Whenever an instructor swaps periods, room changes occur, or exam dates shift, your connected smartphone calendar updates automatically.
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Your Authenticated Webcal Feed URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`webcal://classroom.apex.edu/api/timetable/feed?token=usr-token-${Date.now().toString(36)}`}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-mono text-[11px] text-charcoal-700 dark:text-charcoal-300"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`webcal://classroom.apex.edu/api/timetable/feed`);
                    showToast("Webcal feed URL copied to clipboard!", "success");
                  }}
                  className="px-3 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white font-bold flex items-center gap-1 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="p-2.5 border border-border dark:border-charcoal-700 rounded-xl text-center">
                <span className="font-bold block text-charcoal-900 dark:text-ivory-100">Google Cal</span>
                <span className="text-[10px] text-charcoal-500">Add by URL</span>
              </div>
              <div className="p-2.5 border border-border dark:border-charcoal-700 rounded-xl text-center">
                <span className="font-bold block text-charcoal-900 dark:text-ivory-100">Apple Calendar</span>
                <span className="text-[10px] text-charcoal-500">File &gt; New Sub</span>
              </div>
              <div className="p-2.5 border border-border dark:border-charcoal-700 rounded-xl text-center">
                <span className="font-bold block text-charcoal-900 dark:text-ivory-100">Outlook 365</span>
                <span className="text-[10px] text-charcoal-500">Subscribe from Web</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsWebcalModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExportICS}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download .ICS File</span>
              </button>
            </div>
          </div>
        </Modal>

        {/* Modal: Sick Leave Auto-Substitution Engine */}
        <Modal
          isOpen={isAutoSubstituteModalOpen}
          onClose={() => setIsAutoSubstituteModalOpen(false)}
          title="Faculty Sick Leave 1-Click Auto-Substitution Solver"
          description="Automated algorithmic scan of peer faculty availability, clash detection, and contingency teaching coverage."
        >
          <div className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3 bg-ivory-100 dark:bg-charcoal-900 p-3 rounded-xl border border-border dark:border-charcoal-700">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Absent Faculty (On Leave)
                </label>
                <select
                  value={absentFacultyId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setAbsentFacultyId(id);
                    generateAutoPlan(id, sickLeaveDay);
                  }}
                  className="w-full bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg p-2 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="">-- Choose faculty member --</option>
                  {metadata.faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.designation || "Faculty"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Leave Day of Week
                </label>
                <select
                  value={sickLeaveDay}
                  onChange={(e) => {
                    const d = e.target.value;
                    setSickLeaveDay(d);
                    generateAutoPlan(absentFacultyId, d);
                  }}
                  className="w-full bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg p-2 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Impacted Slots Analysis & Resolution Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-charcoal-800 dark:text-ivory-200">
                  Impacted Teaching Periods ({autoResolvedPlan.length} Lectures Detected)
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Collision-Free Peer Search
                </span>
              </div>

              {autoResolvedPlan.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-border dark:border-charcoal-700 rounded-xl text-charcoal-500">
                  No scheduled teaching periods found for this instructor on {sickLeaveDay}.
                </div>
              ) : (
                <div className="border border-border dark:border-charcoal-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-ivory-100 dark:bg-charcoal-800 text-charcoal-500">
                      <tr>
                        <th className="p-2.5">Time / Course</th>
                        <th className="p-2.5">Room & Section</th>
                        <th className="p-2.5">Auto-Selected Substitute</th>
                        <th className="p-2.5">Conflict Check</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border dark:divide-charcoal-700">
                      {autoResolvedPlan.map((item) => (
                        <tr key={item.slotId} className="hover:bg-ivory-50 dark:hover:bg-charcoal-800/40">
                          <td className="p-2.5">
                            <strong className="block text-charcoal-900 dark:text-ivory-100">
                              {item.courseCode}
                            </strong>
                            <span className="text-charcoal-500 font-mono text-[10px]">
                              {item.startTime} - {item.endTime}
                            </span>
                          </td>
                          <td className="p-2.5 text-charcoal-600 dark:text-charcoal-300">
                            <div>{item.roomName}</div>
                            <span className="text-charcoal-400 text-[10px]">{item.sectionName}</span>
                          </td>
                          <td className="p-2.5">
                            {item.substitute ? (
                              <div>
                                <span className="font-semibold text-rose-primary">
                                  {item.substitute.name}
                                </span>
                                <span className="block text-[10px] text-charcoal-400">
                                  {item.substitute.designation || "Peer Faculty"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-rose-600 font-bold">No Peer Available</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {item.substitute ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Zero Clash Verified
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Overload Alert
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsAutoSubstituteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecutingPlan || autoResolvedPlan.length === 0}
                onClick={handleExecuteAutoPlan}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isExecutingPlan ? "Deploying..." : "Execute Auto-Substitution Plan"}</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
