"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
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
} from "lucide-react";

export default function TimetablePage() {
  const { showToast, currentRole, refreshTrigger, triggerRefresh } = useApp();
  const isStudent = currentRole === "STUDENT" || currentRole === "PARENT";
  const [selectedDay, setSelectedDay] = useState("MONDAY");
  const [slots, setSlots] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<{ rooms: any[]; courses: any[]; faculty: any[] }>({
    rooms: [],
    courses: [],
    faculty: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<"DAY" | "WEEK">("DAY");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    courseCode: "CS-402",
    facultyId: "",
    roomId: "",
    dayOfWeek: "MONDAY",
    startTime: "09:00",
    endTime: "10:30",
  });

  const fetchTimetable = () => {
    setIsLoading(true);
    fetch("/api/timetable")
      .then((res) => res.json())
      .then((data) => {
        if (data.slots) setSlots(data.slots);
        if (data.metadata) {
          setMetadata(data.metadata);
          if (data.metadata.faculty.length > 0 && !formData.facultyId) {
            setFormData((prev) => ({
              ...prev,
              facultyId: data.metadata.faculty[0].id,
              roomId: data.metadata.rooms[0]?.id || "",
            }));
          }
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Timetable fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTimetable();
  }, [refreshTrigger]);

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
        showToast("Timetable slot successfully scheduled without conflicts", "success");
        setIsAddModalOpen(false);
        triggerRefresh();
      } else if (res.status === 409) {
        setConflictError(data.error);
      } else {
        setConflictError(data.error || "Failed to create slot");
      }
    } catch {
      setConflictError("Network error validating timetable slot");
    }
  };

  const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const daySlots = slots.filter((s) => s.dayOfWeek === selectedDay);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft print:border-none print:shadow-none print:p-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 print:hidden">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Timetable & Space Conflict Engine
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Deterministic conflict detection for lecture halls, laboratories, and faculty allocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            {/* View Mode Toggle */}
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

            {/* Print Schedule Button */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 text-xs font-bold transition-all"
              title="Print Schedule"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {!isStudent && (
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

        {/* Day Selector Pills (Visible in DAY view) */}
        {viewMode === "DAY" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedDay === day
                    ? "bg-rose-primary text-white shadow-sm shadow-rose-primary/20"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 border border-border dark:border-charcoal-700 hover:bg-ivory-100 dark:hover:bg-charcoal-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <SkeletonTable rows={3} />
        ) : viewMode === "WEEK" ? (
          /* WEEKLY GRID MATRIX VIEW */
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {days.map((day) => {
              const daySlotsList = slots
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div
                  key={day}
                  className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 p-4 flex flex-col gap-3 shadow-soft"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-800">
                    <span className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {day}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300">
                      {daySlotsList.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 min-h-[140px]">
                    {daySlotsList.length === 0 ? (
                      <p className="text-[11px] text-charcoal-400 italic py-6 text-center">
                        No classes scheduled
                      </p>
                    ) : (
                      daySlotsList.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-3 rounded-xl bg-ivory-50 dark:bg-[#252024] border border-border/80 dark:border-charcoal-700 flex flex-col gap-1.5 relative group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                              {slot.courseCode}
                            </span>
                            <span className="text-[10px] font-bold text-charcoal-600 dark:text-charcoal-400">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                            {slot.courseTitle}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-charcoal-500 dark:text-charcoal-400 pt-1 border-t border-border/40 dark:border-charcoal-700">
                            <span className="truncate max-w-[100px]">{slot.roomName}</span>
                            <span className="truncate max-w-[90px]">{slot.facultyName}</span>
                          </div>

                          {!isStudent && (
                            <button
                              onClick={() => handleDeleteSlot(slot.id)}
                              disabled={isDeleting === slot.id}
                              className="absolute top-2 right-2 p-1 rounded-md text-charcoal-400 hover:text-academic-danger hover:bg-academic-danger-subtle opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete Slot"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
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
            description="There are no classes scheduled for this day."
            actionLabel={!isStudent ? "Schedule First Slot" : undefined}
            onAction={!isStudent ? () => setIsAddModalOpen(true) : undefined}
          />
        ) : (
          /* SINGLE DAY VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all relative group"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800 mb-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                      {slot.courseCode}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-academic-success flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {!isStudent && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={isDeleting === slot.id}
                          className="p-1 rounded text-charcoal-400 hover:text-academic-danger hover:bg-academic-danger-subtle transition-all print:hidden"
                          title="Delete slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                    {slot.courseTitle}
                  </h3>

                  <div className="flex flex-col gap-2 mt-3 text-xs text-charcoal-600 dark:text-charcoal-400">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-rose-accent" />
                      <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                        {slot.facultyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-rose-accent" />
                      <span>{slot.roomName}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-[11px] text-charcoal-500">
                  <span>{slot.sectionName || "Section A"}</span>
                  <span className="inline-flex items-center gap-1 text-academic-success font-bold">
                    <CheckCircle2 className="h-3 w-3" />
                    No Clashes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Slot Modal with Conflict Alert */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Timetable Slot"
        description="Select room, faculty, and time slot. Our engine detects double-booking instantly."
      >
        <form onSubmit={handleAddSlot} className="flex flex-col gap-3">
          {conflictError && (
            <div className="p-3 rounded-xl bg-academic-danger-subtle dark:bg-red-950/40 border border-academic-danger/30 text-academic-danger text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{conflictError}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Course
            </label>
            <select
              value={formData.courseCode}
              onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
            >
              {metadata.courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Faculty Member
              </label>
              <select
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
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
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                {metadata.rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Day
              </label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                {days.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Start Time
              </label>
              <input
                type="text"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
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
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="10:30"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Verify & Schedule Slot
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
