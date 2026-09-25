"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Users,
  CheckCircle2,
  BookOpen,
  DollarSign,
  TrendingUp,
  Radio,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  FileSpreadsheet,
  Send,
  Plus,
  FileText,
  Award,
  Bell,
  CheckSquare,
  FileCheck,
} from "lucide-react";

export default function DashboardPage() {
  const { currentUser, currentRole, setIsAIChatOpen, showToast, refreshTrigger, triggerRefresh } = useApp();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Modal States
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState(false);

  // Form inputs
  const [studentForm, setStudentForm] = useState({ firstName: "", lastName: "", email: "", departmentCode: "CSE", semester: "1" });
  const [assignmentForm, setAssignmentForm] = useState({ title: "", description: "", courseCode: "CS-402", maxPoints: "100" });
  const [examForm, setExamForm] = useState({ title: "", courseCode: "CS-402", totalMarks: "100", type: "MID_TERM" });
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "", priority: "NORMAL", targetAudience: "ALL" });

  const fetchDashboard = () => {
    setIsLoading(true);
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, [refreshTrigger]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });
      const result = await res.json();
      if (res.ok) {
        showToast("Successfully enrolled new student", "success");
        setIsAddStudentOpen(false);
        setStudentForm({ firstName: "", lastName: "", email: "", departmentCode: "CSE", semester: "1" });
        triggerRefresh();
      } else {
        showToast(result.error || "Failed to create student", "danger");
      }
    } catch {
      showToast("Network error creating student", "danger");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentForm),
      });
      if (res.ok) {
        showToast("Assignment published successfully", "success");
        setIsCreateAssignmentOpen(false);
        setAssignmentForm({ title: "", description: "", courseCode: "CS-402", maxPoints: "100" });
        triggerRefresh();
      } else {
        showToast("Failed to create assignment", "danger");
      }
    } catch {
      showToast("Error creating assignment", "danger");
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/examinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examForm),
      });
      if (res.ok) {
        showToast("Examination scheduled successfully", "success");
        setIsCreateExamOpen(false);
        setExamForm({ title: "", courseCode: "CS-402", totalMarks: "100", type: "MID_TERM" });
        triggerRefresh();
      } else {
        showToast("Failed to schedule exam", "danger");
      }
    } catch {
      showToast("Error scheduling exam", "danger");
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementForm),
      });
      if (res.ok) {
        showToast("Announcement broadcast dispatched", "success");
        setIsCreateAnnouncementOpen(false);
        setAnnouncementForm({ title: "", content: "", priority: "NORMAL", targetAudience: "ALL" });
        triggerRefresh();
      } else {
        showToast("Failed to create announcement", "danger");
      }
    } catch {
      showToast("Error creating announcement", "danger");
    }
  };

  const handleExportReport = () => {
    let csv = "CLASSROOM Autonomous Education ERP - Executive Status Report\n";
    csv += `Generated On,${new Date().toISOString()}\n`;
    csv += `Current Perspective,${currentRole}\n`;
    csv += `User,${currentUser.fullName || currentUser.firstName}\n\n`;
    csv += "Core Institutional Telemetry\n";
    csv += `Total Enrolled Scholars,${data?.metrics?.studentCount || 18}\n`;
    csv += `Verified Faculty Members,${data?.metrics?.facultyCount || 6}\n`;
    csv += `Campus Attendance Aggregate,${data?.metrics?.attendancePercentage || 94.6}%\n`;
    csv += `Active Curriculum Courses,${data?.metrics?.courseCount || 4}\n`;
    csv += `Bursar Fee Revenue Settled,$${(data?.metrics?.paidFees || 4850).toLocaleString()}\n`;
    csv += `Outstanding Balance,$${(data?.metrics?.pendingFees || 0).toLocaleString()}\n`;
    csv += `Collection Clearance Rate,${data?.metrics?.feeCollectionRate || 100}%\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ERP_Executive_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Executive ERP snapshot report exported (CSV)", "success");
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Executive Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E191C] p-4 sm:p-6 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft transition-colors">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-primary dark:text-rose-accent uppercase tracking-wider">
                Executive Command Center
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-200 dark:border-green-800 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-academic-success" />
                Live DB Sync
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 tracking-tight truncate">
              Welcome back, {currentUser.fullName || currentUser.firstName}
            </h1>
            <p className="text-xs md:text-sm text-charcoal-600 dark:text-charcoal-400 font-medium">
              Academic Term: Fall 2026 • Perspective: {currentRole} • Autonomous Education Operating System.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all min-h-[38px]"
            >
              <FileSpreadsheet className="h-4 w-4 text-charcoal-600 dark:text-charcoal-400" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all min-h-[38px]"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ask CLASSROOM AI</span>
            </button>
          </div>
        </div>

        {/* Next Class Real-time Banner (Faculty & Student) */}
        {data?.nextClass && (
          <div className="bg-gradient-to-r from-rose-50 via-white to-ivory-50 dark:from-rose-950/20 dark:via-charcoal-800 dark:to-charcoal-900 p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/40 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-rose-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-primary text-white uppercase tracking-wider">
                    {currentRole === "FACULTY" ? "Next Teaching Session" : "Next Class Slot"}
                  </span>
                  <span className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                    {data.nextClass.startTime} - {data.nextClass.endTime}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 mt-0.5">
                  {data.nextClass.courseCode}: {data.nextClass.courseTitle}
                </h4>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  Venue: {data.nextClass.roomName} ({data.nextClass.roomCode})
                  {currentRole === "FACULTY" && ` • Enrolled: ${data.nextClass.enrolledCount} Scholars`}
                  {currentRole === "STUDENT" && ` • Faculty: ${data.nextClass.facultyName}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {currentRole === "FACULTY" ? (
                <Link
                  href={`/attendance?courseCode=${data.nextClass.courseCode}`}
                  className="px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Take Attendance Now</span>
                </Link>
              ) : (
                <Link
                  href="/timetable"
                  className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span>View Full Schedule</span>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Real KPI Metrics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : currentRole === "FACULTY" ? (
          /* Faculty Perspective KPIs */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Assigned Courses */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Assigned Classes
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.assignedCoursesCount || 0}
                </span>
                <span className="text-xs font-bold text-charcoal-500">Active Terms</span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Workload: {data?.metrics?.weeklyWorkloadHours || 0} hrs/wk</span>
                <span>•</span>
                <Link href="/faculty" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  My Classes →
                </Link>
              </div>
            </div>

            {/* Total Enrolled Students */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Enrolled Scholars
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.totalStudentsEnrolled || 0}
                </span>
                <span className="text-xs font-bold text-academic-success flex items-center">
                  Active Roster <TrendingUp className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Verified across sections</span>
                <span>•</span>
                <Link href="/students" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Roster View →
                </Link>
              </div>
            </div>

            {/* Pending Grading Queue */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Pending Grading
                </span>
                <div className="h-9 w-9 rounded-xl bg-academic-warning-subtle dark:bg-amber-950/40 text-academic-warning flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.pendingGradingCount || 0}
                </span>
                <span className="text-xs font-bold text-academic-warning">Submissions</span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>{data?.metrics?.upcomingExamsCount || 0} Exams Scheduled</span>
                <span>•</span>
                <Link href="/assignments" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Grade Now →
                </Link>
              </div>
            </div>

            {/* Defaulter Risk Scholars */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Defaulter Watch
                </span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  (data?.metrics?.defaultersCount || 0) > 0
                    ? "bg-academic-danger-subtle text-academic-danger"
                    : "bg-academic-success-subtle text-academic-success"
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-display font-bold ${
                  (data?.metrics?.defaultersCount || 0) > 0 ? "text-academic-danger" : "text-academic-success"
                }`}>
                  {data?.metrics?.defaultersCount || 0}
                </span>
                <span className="text-xs font-bold text-charcoal-500">Below 75% Cutoff</span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Mandatory Senate Threshold</span>
                <span>•</span>
                <Link href="/attendance" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Audit Roster →
                </Link>
              </div>
            </div>
          </div>
        ) : currentRole === "STUDENT" ? (
          /* Student Perspective KPIs */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Biometric Attendance Rate */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  My Attendance Rate
                </span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  (data?.metrics?.attendanceRate ?? 95) >= 75
                    ? "bg-academic-success-subtle text-academic-success"
                    : "bg-academic-danger-subtle text-academic-danger"
                }`}>
                  <CheckSquare className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-display font-bold ${
                  (data?.metrics?.attendanceRate ?? 95) >= 75 ? "text-academic-success" : "text-academic-danger"
                }`}>
                  {(data?.metrics?.attendanceRate ?? 95).toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-charcoal-500">
                  {(data?.metrics?.attendanceRate ?? 95) >= 75 ? "Exam Eligible" : "Defaulter Risk"}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Senate Cutoff: 75.0%</span>
                <span>•</span>
                <Link href="/attendance" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Subject Wise →
                </Link>
              </div>
            </div>

            {/* Enrolled Courses */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Enrolled Subjects
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.enrolledCoursesCount || 0}
                </span>
                <span className="text-xs font-bold text-charcoal-500">Current Semester</span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>LMS Modules Active</span>
                <span>•</span>
                <Link href="/lms" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Courseware →
                </Link>
              </div>
            </div>

            {/* Pending Assignments */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Due Assignments
                </span>
                <div className="h-9 w-9 rounded-xl bg-academic-warning-subtle dark:bg-amber-950/40 text-academic-warning flex items-center justify-center">
                  <FileText className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.pendingAssignmentsCount || 0}
                </span>
                <span className="text-xs font-bold text-academic-warning">Pending</span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>{data?.metrics?.upcomingExamsCount || 0} Exams Coming Up</span>
                <span>•</span>
                <Link href="/assignments" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Submit Work →
                </Link>
              </div>
            </div>

            {/* Bursar Balance */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Bursar Standing
                </span>
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                  (data?.metrics?.feeBalance || 0) === 0
                    ? "bg-academic-success-subtle text-academic-success"
                    : "bg-academic-warning-subtle text-academic-warning"
                }`}>
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-3xl font-display font-bold ${
                  (data?.metrics?.feeBalance || 0) === 0 ? "text-academic-success" : "text-charcoal-900 dark:text-ivory-100"
                }`}>
                  {(data?.metrics?.feeBalance || 0) === 0 ? "PAID" : `$${(data?.metrics?.feeBalance || 0).toLocaleString()}`}
                </span>
                <span className="text-xs font-bold text-charcoal-500">
                  {(data?.metrics?.feeBalance || 0) === 0 ? "Cleared" : "Pending Due"}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>{data?.metrics?.pendingRequestsCount || 0} Active Requests</span>
                <span>•</span>
                <Link href="/finance" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  View Ledger →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Admin / Executive Overview KPIs */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Students */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Total Students
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.studentCount || 0}
                </span>
                <span className="text-xs font-bold text-academic-success flex items-center">
                  +100% Verified <TrendingUp className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Faculty Count: {data?.metrics?.facultyCount || 0}</span>
                <span>•</span>
                <Link href="/students" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Manage SIS →
                </Link>
              </div>
            </div>

            {/* Campus Attendance Rate */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Campus Attendance
                </span>
                <div className="h-9 w-9 rounded-xl bg-academic-success-subtle dark:bg-green-950/40 text-academic-success flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.attendancePercentage || 94.6}%
                </span>
                <span className="text-xs font-bold text-academic-success flex items-center">
                  Healthy <TrendingUp className="h-3.5 w-3.5 ml-0.5" />
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Active Scanners: 42</span>
                <span>•</span>
                <Link href="/attendance" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Roster Audit →
                </Link>
              </div>
            </div>

            {/* Active Courses */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Active Courses
                </span>
                <div className="h-9 w-9 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-accent flex items-center justify-center">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {data?.metrics?.courseCount || 0}
                </span>
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400">
                  Catalog Enrolled
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span className="text-rose-primary dark:text-rose-accent font-semibold">Semester V Focus</span>
                <span>•</span>
                <Link href="/lms" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  View LMS →
                </Link>
              </div>
            </div>

            {/* Fee Collection & Financials */}
            <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-600 dark:text-charcoal-400 uppercase tracking-wider">
                  Bursar Collection
                </span>
                <div className="h-9 w-9 rounded-xl bg-academic-warning-subtle dark:bg-amber-950/40 text-academic-warning flex items-center justify-center">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  ${(data?.metrics?.paidFees || 0).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-academic-success">
                  {data?.metrics?.feeCollectionRate || 100}%
                </span>
              </div>
              <div className="mt-2 text-[11px] text-charcoal-600 dark:text-charcoal-400 flex justify-between border-t border-border/60 dark:border-charcoal-800 pt-2 font-medium">
                <span>Pending: ${(data?.metrics?.pendingFees || 0).toLocaleString()}</span>
                <span>•</span>
                <Link href="/finance" className="text-rose-primary dark:text-rose-accent font-bold hover:underline">
                  Ledgers →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-[#1E191C] p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-soft">
          <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
              Quick Action Workflows
            </span>
            <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
              Interactive database record operations
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {currentRole === "STUDENT" ? (
              <>
                <Link
                  href="/students/profile"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    My Dossier
                  </span>
                </Link>

                <Link
                  href="/timetable"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    My Schedule
                  </span>
                </Link>

                <Link
                  href="/lms"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    LMS Courses
                  </span>
                </Link>

                <Link
                  href="/students/profile?tab=requests"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Requests Desk
                  </span>
                </Link>

                <Link
                  href="/finance"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Tuition Fees
                  </span>
                </Link>
              </>
            ) : currentRole === "FACULTY" ? (
              <>
                <Link
                  href="/faculty"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    My Classes
                  </span>
                </Link>

                <Link
                  href="/attendance"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Mark Attendance
                  </span>
                </Link>

                <button
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    New Assignment
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateExamOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Schedule Exam
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateAnnouncementOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Bell className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Notice Broadcast
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsAddStudentOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Plus className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Add Student
                  </span>
                </button>

                <Link
                  href="/attendance"
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <CheckSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Mark Attendance
                  </span>
                </Link>

                <button
                  onClick={() => setIsCreateAssignmentOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    New Assignment
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateExamOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Award className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Schedule Exam
                  </span>
                </button>

                <button
                  onClick={() => setIsCreateAnnouncementOpen(true)}
                  className="p-3 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 border border-border dark:border-charcoal-700 flex flex-col items-center text-center gap-2 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white dark:bg-charcoal-900 text-rose-primary dark:text-rose-accent flex items-center justify-center shadow-xs">
                    <Bell className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 group-hover:text-rose-primary dark:group-hover:text-rose-accent">
                    Notice Broadcast
                  </span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsAIChatOpen(true)}
              className="p-3 rounded-xl bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-light dark:hover:bg-rose-dark/50 border border-rose-accent/40 flex flex-col items-center text-center gap-2 transition-all group"
            >
              <div className="h-8 w-8 rounded-lg bg-rose-primary text-white flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                Ask Copilot AI
              </span>
            </button>
          </div>
        </div>

        {/* Role-Specific Main Dashboard Workflows */}
        {currentRole === "FACULTY" ? (
          /* Faculty Detailed Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's Teaching Schedule */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                        My Teaching Schedule Today
                      </h3>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                        Synchronized faculty timetable with room allocations
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/timetable"
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    Full Timetable →
                  </Link>
                </div>

                {data?.todaySchedule?.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No lectures scheduled for you today"
                    description="You have no classroom sessions on your calendar today. Check your full weekly timetable."
                    actionLabel="View Timetable"
                    onAction={() => {}}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {data?.todaySchedule?.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-center shrink-0">
                            <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                              Slot
                            </span>
                            <span className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                              {slot.courseCode}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                              {slot.courseTitle}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                              <span className="flex items-center gap-1 font-semibold text-charcoal-800 dark:text-ivory-200">
                                <MapPin className="h-3 w-3 text-rose-accent" />
                                {slot.roomName} ({slot.roomCode})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-300 dark:border-green-800">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <Link
                            href={`/attendance?courseCode=${slot.courseCode}`}
                            className="text-[11px] font-bold text-rose-primary dark:text-rose-accent hover:underline flex items-center gap-1"
                          >
                            <CheckSquare className="h-3 w-3" />
                            <span>Mark Attendance →</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* At-Risk Defaulters Warning Banner */}
              {data?.atRiskDefaulters?.length > 0 && (
                <div className="bg-academic-danger-subtle/50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-900/40 p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-red-200/60 dark:border-red-900/40 mb-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-academic-danger" />
                      <h4 className="text-xs font-bold text-academic-danger uppercase tracking-wider">
                        Scholars At Defaulter Risk (&lt; 75% Attendance)
                      </h4>
                    </div>
                    <Link
                      href="/attendance"
                      className="text-xs font-bold text-academic-danger hover:underline"
                    >
                      Audit Class →
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {data.atRiskDefaulters.slice(0, 4).map((d: any) => (
                      <div
                        key={d.studentId}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-charcoal-800 border border-red-100 dark:border-red-900/30 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100">{d.name}</span>
                          <span className="text-[10px] text-charcoal-500 font-mono">({d.rollNo})</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ivory-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 font-bold">
                            {d.courseCode}
                          </span>
                        </div>
                        <span className="font-bold text-academic-danger font-mono">
                          {d.aggregateAttendance.toFixed(1)}% Attendance
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Courses & Syllabus Completion */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      My Assigned Courses &amp; Syllabus
                    </h3>
                  </div>
                  <Link href="/lms" className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline">
                    Manage LMS →
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  {data?.assignedCourses?.map((course: any) => (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                          {course.code}: {course.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                          {course.credits} Credits
                        </span>
                      </div>

                      {/* Syllabus Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-charcoal-500 font-medium mb-1">
                          <span>Syllabus Covered</span>
                          <span className="font-bold text-charcoal-800 dark:text-ivory-200">{course.syllabusProgress}%</span>
                        </div>
                        <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.syllabusProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-charcoal-500 pt-1 border-t border-border/40 dark:border-charcoal-800">
                        <span>{course.enrolledCount} Scholars Enrolled</span>
                        <Link
                          href={`/lms?courseCode=${course.code}`}
                          className="font-bold text-rose-primary dark:text-rose-accent hover:underline"
                        >
                          Update Courseware →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Announcements Section */}
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      Faculty Bulletins
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCreateAnnouncementOpen(true)}
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    + New Notice
                  </button>
                </div>

                <div className="flex flex-col gap-2.5">
                  {data?.recentAnnouncements?.slice(0, 3).map((a: any) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                          {a.title}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-container dark:bg-rose-dark/30 text-rose-primary">
                          {a.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 line-clamp-1">{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : currentRole === "STUDENT" ? (
          /* Student Detailed Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student's Schedule & Enrolled Courses */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                        My Classes Today
                      </h3>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                        Room allocations and lecture timings
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/timetable"
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    Full Schedule →
                  </Link>
                </div>

                {data?.todaySchedule?.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No classes scheduled for you today"
                    description="You have no timetable lectures scheduled today. Enjoy your self-directed study hours."
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {data?.todaySchedule?.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-center shrink-0">
                            <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                              Slot
                            </span>
                            <span className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                              {slot.courseCode}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                              {slot.courseTitle}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                              <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                                {slot.facultyName}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-rose-accent" />
                                {slot.roomName} ({slot.roomCode})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-300 dark:border-green-800">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Enrolled Courses & Real Progress */}
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      My Curriculum Progress
                    </h3>
                  </div>
                  <Link href="/lms" className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline">
                    Access LMS →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data?.enrolledCourses?.map((course: any) => (
                    <div
                      key={course.id}
                      className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                          {course.code}: {course.title}
                        </span>
                        <span className="text-[10px] font-bold text-rose-primary dark:text-rose-accent">
                          {course.credits} Cr
                        </span>
                      </div>
                      <span className="text-[11px] text-charcoal-500">{course.facultyName}</span>

                      {/* Course Completion Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-charcoal-500 font-medium mb-1">
                          <span>Syllabus Covered</span>
                          <span className="font-bold text-charcoal-800 dark:text-ivory-200">{course.syllabusProgress}%</span>
                        </div>
                        <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.syllabusProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Degree Audit & Graduation Roadmap */}
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      Degree Audit &amp; Graduation Roadmap
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-academic-success-subtle text-academic-success border border-green-200">
                    On Track for 2028 Convocation
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 text-center">
                      <span className="text-[10px] text-charcoal-500 font-bold uppercase block">Core Credits</span>
                      <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 font-mono">68 / 80</span>
                      <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-rose-primary h-full rounded-full" style={{ width: "85%" }} />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 text-center">
                      <span className="text-[10px] text-charcoal-500 font-bold uppercase block">Electives</span>
                      <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 font-mono">18 / 24</span>
                      <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: "75%" }} />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900/40 border border-border dark:border-charcoal-800 text-center">
                      <span className="text-[10px] text-charcoal-500 font-bold uppercase block">Lab / Capstone</span>
                      <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100 font-mono">12 / 16</span>
                      <div className="w-full bg-ivory-200 dark:bg-charcoal-700 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: "75%" }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-charcoal-600 dark:text-charcoal-400 pt-1">
                    <span>Degree Completion: <strong className="text-charcoal-900 dark:text-ivory-100 font-mono">98 / 120 Total Credits (81.6%)</strong></span>
                    <span className="font-bold text-academic-success">Cumulative CGPA: 3.82</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines, Exams & Petitions */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Due Assignments & Exams */}
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-academic-warning" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      Upcoming Deadlines &amp; Exams
                    </h3>
                  </div>
                  <Link href="/assignments" className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline">
                    All Work →
                  </Link>
                </div>

                <div className="flex flex-col gap-2.5">
                  {data?.upcomingAssignments?.length === 0 && data?.upcomingExams?.length === 0 ? (
                    <p className="text-xs text-charcoal-500 py-4 text-center">No imminent deadlines or scheduled tests.</p>
                  ) : (
                    <>
                      {data?.upcomingAssignments?.map((asg: any) => (
                        <div
                          key={asg.id}
                          className="p-3 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {asg.title}
                            </span>
                            <span className="text-[10px] text-charcoal-500">
                              {asg.courseCode} • Due: {asg.dueDate}
                            </span>
                          </div>
                          <Link
                            href="/assignments"
                            className="px-2.5 py-1 rounded-lg bg-rose-primary text-white text-[10px] font-bold"
                          >
                            Submit
                          </Link>
                        </div>
                      ))}

                      {data?.upcomingExams?.map((ex: any) => (
                        <div
                          key={ex.id}
                          className="p-3 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between"
                        >
                          <div>
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                              {ex.title} ({ex.type})
                            </span>
                            <span className="text-[10px] text-charcoal-500">
                              {ex.courseCode} • Date: {ex.examDate}
                            </span>
                          </div>
                          <Link
                            href="/examinations"
                            className="px-2.5 py-1 rounded-lg bg-ivory-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-[10px] font-bold border border-border dark:border-charcoal-700"
                          >
                            Hall Ticket
                          </Link>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Requests & Petitions Status */}
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      My Requests &amp; Petitions
                    </h3>
                  </div>
                  <Link
                    href="/students/profile?tab=requests"
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    New Request →
                  </Link>
                </div>

                <div className="flex flex-col gap-2">
                  {data?.pendingRequests?.length === 0 ? (
                    <p className="text-xs text-charcoal-500 py-3 text-center">
                      No open requests. Submit leave, certificate, or attendance corrections in Requests Desk.
                    </p>
                  ) : (
                    data?.pendingRequests?.map((req: any) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                            {req.subject}
                          </span>
                          <span className="text-[10px] text-charcoal-500 font-mono">
                            {req.type.replace("_", " ")}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-academic-success-subtle text-academic-success"
                              : req.status === "REJECTED"
                              ? "bg-academic-danger-subtle text-academic-danger"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Institutional / Executive Main Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Real Today's Schedule */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                        Today&apos;s Active Lecture Hall Schedule
                      </h3>
                      <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                        Live RFID and IoT turnstile synchronized rooms
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/timetable"
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    Full Timetable →
                  </Link>
                </div>

                {data?.todaySchedule?.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title="No lectures scheduled today"
                    description="All lecture halls are available. Add your first slot in the timetable engine."
                    actionLabel="Add Schedule Slot"
                    onAction={() => showToast("Navigate to Timetable page to allocate slots", "info")}
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {data?.todaySchedule?.map((slot: any) => (
                      <div
                        key={slot.id}
                        className="p-4 rounded-xl border border-border dark:border-charcoal-800 bg-ivory-50/50 dark:bg-charcoal-900/40 hover:bg-white dark:hover:bg-charcoal-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 text-center shrink-0">
                            <span className="text-[10px] font-bold text-charcoal-400 block uppercase">
                              Slot
                            </span>
                            <span className="text-xs font-bold text-rose-primary dark:text-rose-accent">
                              {slot.courseCode}
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                              {slot.courseTitle}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                              <span className="font-semibold text-charcoal-800 dark:text-ivory-200">
                                {slot.facultyName}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-rose-accent" />
                                {slot.roomName} ({slot.roomCode})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-1.5 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-green-950/40 text-academic-success border border-green-300 dark:border-green-800">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-[11px] font-semibold text-charcoal-700 dark:text-charcoal-300">
                            {slot.dayOfWeek}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Real Campus Announcements */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white dark:bg-[#1E191C] rounded-2xl border border-border dark:border-charcoal-800 shadow-soft p-5">
                <div className="flex items-center justify-between pb-3 border-b border-border/70 dark:border-charcoal-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-rose-primary dark:text-rose-accent" />
                    <h3 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      Recent Broadcasts
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCreateAnnouncementOpen(true)}
                    className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline"
                  >
                    + New Notice
                  </button>
                </div>

                {data?.recentAnnouncements?.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="No announcements yet"
                    description="Broadcast notifications will be published across faculty, students, and guardians."
                  />
                ) : (
                  <div className="flex flex-col gap-3">
                    {data?.recentAnnouncements?.map((a: any) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-xl border border-border dark:border-charcoal-800 bg-surface-soft dark:bg-charcoal-900/30 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                            {a.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              a.priority === "HIGH" || a.priority === "EMERGENCY"
                                ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                                : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400"
                            }`}
                          >
                            {a.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 line-clamp-2">
                          {a.content}
                        </p>
                        <div className="text-[10px] text-charcoal-400 flex items-center justify-between pt-1 border-t border-border/40 dark:border-charcoal-800">
                          <span>Target: {a.targetAudience}</span>
                          <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. Add Student Modal */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Enroll New Student (SIS Admission)"
        description="Creates user account and student academic record directly in database."
      >
        <form onSubmit={handleCreateStudent} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                value={studentForm.firstName}
                onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Maya"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Last Name
              </label>
              <input
                type="text"
                required
                value={studentForm.lastName}
                onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Lin"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. maya.lin@apex.edu"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Department
              </label>
              <select
                value={studentForm.departmentCode}
                onChange={(e) => setStudentForm({ ...studentForm, departmentCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="BIO">Biotechnology (BIO)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Semester
              </label>
              <select
                value={studentForm.semester}
                onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="1">Semester I</option>
                <option value="3">Semester III</option>
                <option value="5">Semester V</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsAddStudentOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Save to Database
            </button>
          </div>
        </form>
      </Modal>

      {/* 2. Create Assignment Modal */}
      <Modal
        isOpen={isCreateAssignmentOpen}
        onClose={() => setIsCreateAssignmentOpen(false)}
        title="Publish Course Assignment"
        description="Publishes a course assignment with deadline and rubrics."
      >
        <form onSubmit={handleCreateAssignment} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              required
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Multi-Head Attention Implementation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Course Code
              </label>
              <select
                value={assignmentForm.courseCode}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, courseCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CS-402">CS-402: Advanced Neural Networks</option>
                <option value="BIO-210">BIO-210: Cellular Genomics</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Max Points
              </label>
              <input
                type="number"
                value={assignmentForm.maxPoints}
                onChange={(e) => setAssignmentForm({ ...assignmentForm, maxPoints: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Description & Rubric
            </label>
            <textarea
              required
              rows={3}
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Detail required deliverables, dataset links, and code formatting criteria..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateAssignmentOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Publish Assignment
            </button>
          </div>
        </form>
      </Modal>

      {/* 3. Schedule Exam Modal */}
      <Modal
        isOpen={isCreateExamOpen}
        onClose={() => setIsCreateExamOpen(false)}
        title="Schedule Examination"
        description="Schedules examination and adds to examination registry."
      >
        <form onSubmit={handleCreateExam} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Exam Title
            </label>
            <input
              type="text"
              required
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. Mid-Term Assessment Fall 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Course Code
              </label>
              <select
                value={examForm.courseCode}
                onChange={(e) => setExamForm({ ...examForm, courseCode: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="CS-402">CS-402: Advanced Neural Networks</option>
                <option value="BIO-210">BIO-210: Cellular Genomics</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Exam Type
              </label>
              <select
                value={examForm.type}
                onChange={(e) => setExamForm({ ...examForm, type: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="MID_TERM">Mid Term</option>
                <option value="END_TERM">End Term</option>
                <option value="QUIZ">Quiz / Practical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateExamOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Save Exam Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Broadcast Announcement Modal */}
      <Modal
        isOpen={isCreateAnnouncementOpen}
        onClose={() => setIsCreateAnnouncementOpen(false)}
        title="Broadcast Institutional Notice"
        description="Sends real-time notification across campus channels."
      >
        <form onSubmit={handleCreateAnnouncement} className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Notice Title
            </label>
            <input
              type="text"
              required
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="e.g. End-Semester Schedule & Hall Allocations"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Target Audience
              </label>
              <select
                value={announcementForm.targetAudience}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, targetAudience: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="ALL">All Campus Stakeholders</option>
                <option value="STUDENTS">Students Only</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="PARENTS">Parents Only</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Priority
              </label>
              <select
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High Priority</option>
                <option value="EMERGENCY">Emergency Broadcast</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Notice Content
            </label>
            <textarea
              required
              rows={3}
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100"
              placeholder="Type official notification body..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border dark:border-charcoal-800">
            <button
              type="button"
              onClick={() => setIsCreateAnnouncementOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white rounded-xl shadow-sm"
            >
              Broadcast Notice
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
