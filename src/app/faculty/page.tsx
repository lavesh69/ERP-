"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  Users,
  Calendar,
  BookOpen,
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Plus,
  Mail,
  Award,
  Building,
  Search,
  ArrowUpRight,
} from "lucide-react";

interface FacultyItem {
  id: string;
  userId: string;
  name: string;
  email: string;
  employeeCode: string;
  department: string;
  departmentName: string;
  designation: string;
  specialization: string;
  officeRoom: string;
  weeklyHours: number;
  coursesCount: number;
  courses: string[];
}

export default function FacultyPage() {
  const { showToast, refreshTrigger, triggerRefresh } = useApp();

  const [loading, setLoading] = useState(true);
  const [facultyList, setFacultyList] = useState<FacultyItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");

  // Onboard Faculty Modal
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [departmentCode, setDepartmentCode] = useState("CSE");
  const [designation, setDesignation] = useState("Associate Professor");
  const [specialization, setSpecialization] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Faculty Schedule Modal State
  const [selectedFacultyForSchedule, setSelectedFacultyForSchedule] = useState<FacultyItem | null>(null);
  const [facultySchedule, setFacultySchedule] = useState<any[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const handleOpenSchedule = async (faculty: FacultyItem) => {
    setSelectedFacultyForSchedule(faculty);
    setIsLoadingSchedule(true);
    try {
      const res = await fetch("/api/timetable");
      if (res.ok) {
        const data = await res.json();
        const allSlots: any[] = data.slots || [];
        const slotsForProf = allSlots.filter(
          (s) =>
            s.facultyId === faculty.id ||
            s.facultyName?.toLowerCase().includes(faculty.name.toLowerCase()) ||
            (faculty.courses && faculty.courses.includes(s.courseCode))
        );
        setFacultySchedule(slotsForProf);
      }
    } catch (e) {
      console.error("Failed to load faculty schedule:", e);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    async function loadFaculty() {
      try {
        setLoading(true);
        const res = await fetch("/api/faculty");
        if (res.ok) {
          const data = await res.json();
          setFacultyList(data.faculty || []);
        }
      } catch (err) {
        console.error("Failed to load faculty:", err);
        showToast("Error retrieving faculty directory", "error");
      } finally {
        setLoading(false);
      }
    }
    loadFaculty();
  }, [refreshTrigger]);

  const handleOnboardFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showToast("Please provide first name, last name, and email", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          departmentCode,
          designation,
          specialization,
        }),
      });

      if (res.ok) {
        showToast(`Successfully onboarded Prof. ${firstName} ${lastName}!`, "success");
        setIsOnboardModalOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setSpecialization("");
        triggerRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to onboard faculty", "error");
      }
    } catch (err) {
      showToast("Network error onboarding faculty", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const departments = ["ALL", ...Array.from(new Set(facultyList.map((f) => f.department)))];

  const filtered = facultyList.filter((f) => {
    const matchesDept = selectedDept === "ALL" || f.department === selectedDept;
    const matchesQuery =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const totalWeeklyHours = facultyList.reduce((acc, f) => acc + f.weeklyHours, 0);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  Faculty Hub & Workload Telemetry
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                  Live SQLite Registry
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Academic faculty directory, weekly teaching workloads, course allocations, and contact channels
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOnboardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Onboard Faculty Member</span>
          </button>
        </div>

        {/* 3 Workload KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Active Faculty Members
              </span>
              <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                {facultyList.length}
              </div>
              <span className="text-xs text-rose-primary dark:text-rose-light font-semibold">
                Across {departments.length - 1} Academic Departments
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Weekly Teaching Hours
              </span>
              <div className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-2">
                {totalWeeklyHours} hrs
              </div>
              <span className="text-xs text-academic-success font-semibold">
                Average {facultyList.length > 0 ? (totalWeeklyHours / facultyList.length).toFixed(1) : 0} hrs/week
              </span>
            </div>

            <div className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft">
              <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase">
                Course Allocations
              </span>
              <div className="text-3xl font-display font-bold text-rose-primary dark:text-rose-light mt-2">
                {facultyList.reduce((acc, f) => acc + f.coursesCount, 0)} Sections
              </div>
              <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Synchronized with Timetable Matrix
              </span>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-charcoal-800 p-4 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedDept === dept
                    ? "bg-rose-primary text-white shadow-sm"
                    : "bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {dept === "ALL" ? "All Departments" : dept}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by faculty name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
            />
          </div>
        </div>

        {/* Faculty Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Faculty Members Found"
            description="No faculty profiles matched your department or search query."
            actionLabel="Onboard Faculty"
            onAction={() => setIsOnboardModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="glass-panel glass-card-hover p-5 rounded-2xl shadow-soft flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-rose-container dark:bg-rose-primary/20 text-rose-primary font-bold text-base flex items-center justify-center shrink-0">
                      {f.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                        {f.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-semibold text-charcoal-600 dark:text-charcoal-400">
                          {f.designation}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] font-mono text-charcoal-500">
                          {f.employeeCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                    {f.department}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-surface-soft dark:bg-charcoal-900 p-3 rounded-xl border border-border/50 dark:border-charcoal-700">
                  <div>
                    <span className="text-[10px] text-charcoal-500 block uppercase">Specialization</span>
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">
                      {f.specialization}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block uppercase">Workload</span>
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">
                      {f.weeklyHours} teaching hrs/wk
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-charcoal-500 block uppercase">Courses Taught</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {f.courses.length > 0 ? (
                        f.courses.map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-primary/30 text-rose-primary dark:text-rose-light"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">No courses allocated</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 dark:border-charcoal-700 text-xs">
                  <span className="text-[11px] text-charcoal-500 flex items-center gap-1">
                    <Building className="h-3 w-3 text-rose-primary" />
                    {f.officeRoom}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenSchedule(f)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container dark:hover:bg-charcoal-600 text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 transition-all"
                      title="View Faculty Timetable"
                    >
                      <Calendar className="h-3.5 w-3.5 text-rose-primary dark:text-rose-accent" />
                      <span>Schedule</span>
                    </button>
                    <Link
                      href={`/faculty/${f.id}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-primary hover:text-white text-rose-primary dark:text-rose-accent text-xs font-bold border border-rose-primary/20 transition-all"
                    >
                      <span>Dossier</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                    <a
                      href={`mailto:${f.email}?subject=${encodeURIComponent(`Academic Inquiry - ${f.name}`)}&body=${encodeURIComponent(`Dear ${f.name},\n\nI am writing regarding academic advisement and coursework at Apex University.\n\nBest regards,\n`)}`}
                      onClick={() =>
                        showToast(`Opening secure email dispatch to ${f.email}`, "success")
                      }
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 transition-all"
                    >
                      <Mail className="h-3.5 w-3.5 text-rose-primary" />
                      <span>Contact</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Onboard Faculty */}
        <Modal
          isOpen={isOnboardModalOpen}
          onClose={() => setIsOnboardModalOpen(false)}
          title="Onboard Faculty Member"
        >
          <form onSubmit={handleOnboardFaculty} className="flex flex-col gap-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Radhika"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Gupta"
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                University Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="radhika.gupta@apex.edu"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Department
                </label>
                <select
                  value={departmentCode}
                  onChange={(e) => setDepartmentCode(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="CSE">Computer Science & Engineering (CSE)</option>
                  <option value="BIO">Biotechnology & Genomics (BIO)</option>
                </select>
              </div>
              <div>
                <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Designation
                </label>
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Domain / Research Specialization
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Distributed Consensus & Cloud Infrastructure"
                className="w-full bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 rounded-xl p-2.5 font-medium text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsOnboardModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
              >
                {isSubmitting ? "Onboarding..." : "Onboard Faculty"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Faculty Timetable & Schedule Dossier */}
        <Modal
          isOpen={Boolean(selectedFacultyForSchedule)}
          onClose={() => setSelectedFacultyForSchedule(null)}
          title={selectedFacultyForSchedule ? `Teaching Schedule: ${selectedFacultyForSchedule.name}` : "Faculty Timetable"}
          description="Synchronized weekly lecture slots and classroom hall allocations."
        >
          {selectedFacultyForSchedule && (
            <div className="flex flex-col gap-4 text-xs">
              {/* Faculty Summary Banner */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                <div className="h-12 w-12 rounded-xl bg-rose-container dark:bg-rose-primary/20 text-rose-primary font-bold text-base flex items-center justify-center shrink-0">
                  {selectedFacultyForSchedule.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 truncate">
                      {selectedFacultyForSchedule.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                      {selectedFacultyForSchedule.department}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-charcoal-500 mt-0.5">
                    <span className="font-semibold text-charcoal-700 dark:text-ivory-300">{selectedFacultyForSchedule.designation}</span>
                    <span>•</span>
                    <span className="font-mono">{selectedFacultyForSchedule.employeeCode}</span>
                    <span>•</span>
                    <span>{selectedFacultyForSchedule.officeRoom}</span>
                  </div>
                </div>
              </div>

              {/* Workload & Courses Strip */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Assigned Workload</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5 block">
                    {selectedFacultyForSchedule.weeklyHours} Teaching hrs/week
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Specialization</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100 mt-0.5 block truncate">
                    {selectedFacultyForSchedule.specialization}
                  </span>
                </div>
              </div>

              {/* Weekly Timetable Schedule Slots */}
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border dark:border-charcoal-700 mb-2.5">
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider text-[11px]">
                    Synchronized Lecture Slots
                  </span>
                  <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent">
                    {facultySchedule.length} Slot(s) Active
                  </span>
                </div>

                {isLoadingSchedule ? (
                  <div className="py-8 text-center text-charcoal-400">Loading timetable slots...</div>
                ) : facultySchedule.length === 0 ? (
                  <div className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-center">
                    <p className="text-charcoal-500 text-xs">No active timetable slots allocated to this professor yet.</p>
                    <Link
                      href="/timetable"
                      className="text-rose-primary dark:text-rose-accent font-bold mt-1 inline-block hover:underline text-xs"
                    >
                      Allocate slots in Timetable Engine →
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {facultySchedule.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="px-2 py-1 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent font-bold text-[10px] uppercase shrink-0">
                            {slot.dayOfWeek?.slice(0, 3)}
                          </span>
                          <div className="min-w-0">
                            <span className="font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                              {slot.courseCode}: {slot.courseTitle}
                            </span>
                            <span className="text-[10px] text-charcoal-500 block">
                              Venue: {slot.roomName} • {slot.sectionName || "Section 5-A"}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 shrink-0">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border dark:border-charcoal-700">
                <button
                  type="button"
                  onClick={() => setSelectedFacultyForSchedule(null)}
                  className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
                >
                  Close
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${selectedFacultyForSchedule.email}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600"
                  >
                    <Mail className="h-3.5 w-3.5 text-rose-primary" />
                    <span>Email</span>
                  </a>
                  <Link
                    href={`/faculty/${selectedFacultyForSchedule.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all"
                  >
                    <span>Full Faculty Dossier</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
