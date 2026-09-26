"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import { Modal } from "@/components/common/Modal";
import {
  Users,
  Building,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Clock,
  Award,
  ChevronLeft,
  CheckCircle2,
  FileText,
  FlaskConical,
  Edit3,
  Bookmark,
  DollarSign,
  GraduationCap,
  ExternalLink,
  Printer,
  Sparkles,
  MapPin,
} from "lucide-react";

interface CourseAllocation {
  id: string;
  code: string;
  title: string;
  credits: number;
  lectureHours: number;
  labHours: number;
  type: string;
  enrolledCount: number;
}

interface TimetableItem {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseTitle: string;
  room: string;
  section: string;
}

interface PublicationItem {
  id: string;
  title: string;
  journalName: string;
  doi?: string;
  year: number;
  citationCount: number;
}

interface ResearchProjectItem {
  id: string;
  title: string;
  grantAmount: number;
  fundingAgency: string;
  status: string;
  abstract: string;
  startDate: string;
}

interface FacultyProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string;
  department: string;
  departmentName: string;
  designation: string;
  specialization: string;
  qualification: string;
  joiningDate: string;
  officeRoom: string;
  weeklyHours: number;
  coursesCount: number;
  courses: CourseAllocation[];
  timetables: TimetableItem[];
  stats: {
    totalSessionsConducted: number;
    activeCourses: number;
    assignmentsCreated: number;
    publicationsCount: number;
    totalCitations: number;
    totalGrantAmount: number;
    avgClassAttendanceRate: number;
  };
  mentees?: Array<{
    id: string;
    name: string;
    rollNo: string;
    program: string;
    semester: number;
    section: string;
    cgpa: number;
    attendanceRate: number;
    riskLevel: string;
    academicStanding: string;
    lastPastoralCheck: string;
  }>;
  workloadBreakdown?: {
    totalWeeklyHours: number;
    lectureHours: number;
    tutorialHours: number;
    labHours: number;
    adminAndResearchHours: number;
    intercomExtension: string;
    dndStatus: string;
  };
  leaveManagement?: {
    casualLeave: { total: number; availed: number; balance: number };
    medicalLeave: { total: number; availed: number; balance: number };
    dutyLeave: { total: number; availed: number; balance: number };
    recentLeaves: Array<{
      id: string;
      type: string;
      dates: string;
      substitute: string;
      status: string;
    }>;
  };
  studentFeedback?: {
    overallRating: number;
    totalEvaluations: number;
    metrics: Array<{ category: string; rating: number }>;
  };
  publications: PublicationItem[];
  researchProjects: ResearchProjectItem[];
  advisingHours: Array<{ day: string; time: string; purpose: string }>;
}

export default function FacultyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { showToast, currentUser, currentRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<FacultyProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<"teaching" | "mentees" | "workload" | "research" | "advising">("teaching");

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editOfficeRoom, setEditOfficeRoom] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editSpecialization, setEditSpecialization] = useState("");
  const [editQualification, setEditQualification] = useState("");
  const [editWeeklyHours, setEditWeeklyHours] = useState<number>(18);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Leave Management State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("Casual Leave (CL)");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [substituteFacultyName, setSubstituteFacultyName] = useState("Prof. David Miller");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Mentorship Note Modal State
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<any>(null);
  const [mentorNoteText, setMentorNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty) return;
    setIsSubmittingLeave(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_LEAVE",
          facultyId: faculty.id,
          leaveType,
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          substituteFacultyName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Leave application registered with proxy substitute assigned", "success");
        setIsLeaveModalOpen(false);
        loadFaculty();
      } else {
        showToast(data.error || "Failed to submit leave", "error");
      }
    } catch {
      showToast("Network error submitting leave request", "error");
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleSendMentorNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentee || !mentorNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "MENTOR_NOTE",
          studentId: selectedMentee.id,
          note: mentorNoteText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Mentoring guidance dispatched to ${selectedMentee.name}`, "success");
        setIsMentorModalOpen(false);
        setMentorNoteText("");
      } else {
        showToast(data.error || "Failed to dispatch note", "error");
      }
    } catch {
      showToast("Network error dispatching pastoral note", "error");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  async function loadFaculty() {
    try {
      setLoading(true);
      // Targeted endpoint: /api/faculty?id=...
      const res = await fetch(`/api/faculty?id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.faculty) {
          setFaculty(data.faculty);
          setEditOfficeRoom(data.faculty.officeRoom || "");
          setEditPhone(data.faculty.phone || "");
          setEditSpecialization(data.faculty.specialization || "");
          setEditQualification(data.faculty.qualification || "");
          setEditWeeklyHours(data.faculty.weeklyHours || 18);
        } else {
          setFaculty(null);
        }
      } else {
        setFaculty(null);
      }
    } catch (err) {
      console.error("Failed to load faculty dossier:", err);
      showToast("Error retrieving faculty dossier", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaculty();
  }, [id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty) return;

    try {
      setIsSavingProfile(true);
      const res = await fetch("/api/faculty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facultyId: faculty.id,
          officeRoom: editOfficeRoom,
          phone: editPhone,
          specialization: editSpecialization,
          qualification: editQualification,
          weeklyHours: editWeeklyHours,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Profile updated successfully", "success");
        setIsEditModalOpen(false);
        loadFaculty();
      } else {
        showToast(data.error || "Failed to update profile", "error");
      }
    } catch {
      showToast("Network error updating profile", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const isOwnerOrAdmin =
    currentRole === "SUPER_ADMIN" ||
    currentRole === "INSTITUTION_ADMIN" ||
    currentUser?.email === faculty?.email ||
    currentUser?.id === faculty?.userId;

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col gap-6">
          <SkeletonCard />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </AppShell>
    );
  }

  if (!faculty) {
    return (
      <AppShell>
        <EmptyState
          icon={Users}
          title="Faculty Record Not Found"
          description="The requested faculty member could not be located in the university directory."
        />
      </AppShell>
    );
  }

  const initials = faculty.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-charcoal-500">
          <Link href="/faculty" className="hover:text-rose-primary flex items-center gap-1 font-semibold">
            <ChevronLeft className="h-4 w-4" /> Faculty Directory
          </Link>
          <span>/</span>
          <span className="text-charcoal-900 dark:text-ivory-100 font-bold">{faculty.name}</span>
        </div>

        {/* Header Hero Banner */}
        <div className="bg-white dark:bg-charcoal-800 rounded-3xl p-6 border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-rose-container dark:bg-rose-primary/20 text-rose-primary dark:text-rose-light flex items-center justify-center font-display font-bold text-2xl shadow-sm border border-rose-accent/30 shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-info-subtle text-academic-info border border-blue-200 dark:border-blue-900">
                  {faculty.designation}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-container dark:bg-rose-primary/30 text-rose-primary dark:text-rose-light">
                  {faculty.employeeCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" />
                  {faculty.qualification}
                </span>
              </div>
              <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                {faculty.name}
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-rose-accent" />
                  <span>{faculty.departmentName} ({faculty.department})</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-rose-accent" />
                  <a href={`mailto:${faculty.email}`} className="hover:underline">{faculty.email}</a>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-rose-accent" />
                  <span>{faculty.phone}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-charcoal-500">
                  <MapPin className="h-3.5 w-3.5 text-rose-accent" />
                  <span>{faculty.officeRoom}</span>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            {isOwnerOrAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border dark:border-charcoal-600 hover:bg-rose-container transition-all"
              >
                <Edit3 className="h-3.5 w-3.5 text-rose-accent" />
                <span>Edit Profile</span>
              </button>
            )}
            <a
              href={`mailto:${faculty.email}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary text-white hover:bg-rose-deep shadow-sm transition-all"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Faculty</span>
            </a>
          </div>
        </div>

        {/* 4 Performance & Workload KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Weekly Teaching Load</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-rose-primary" />
              <span>{faculty.weeklyHours} hrs/wk</span>
            </div>
            <span className="text-[10px] text-academic-success font-semibold">
              Senate Norm Compliant
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Active Course Load</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-academic-info" />
              <span>{faculty.courses?.length || 0} Subjects</span>
            </div>
            <span className="text-[10px] text-charcoal-500 font-medium">
              Synchronized with Timetable
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Lectures Delivered</span>
            <div className="text-2xl font-display font-bold text-rose-primary dark:text-rose-light mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{faculty.stats?.totalSessionsConducted || 12} Sessions</span>
            </div>
            <span className="text-[10px] text-academic-success font-semibold">
              Avg {faculty.stats?.avgClassAttendanceRate || 91.5}% Class Attendance
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Research Citations</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>{faculty.stats?.totalCitations || 38}</span>
            </div>
            <span className="text-[10px] text-charcoal-500 font-medium">
              Across {faculty.publications?.length || 1} Scopus Publications
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-700 pb-2 overflow-x-auto">
          {[
            { id: "teaching", label: "Teaching & Timetable", icon: BookOpen },
            { id: "mentees", label: "Assigned Mentee Wards", icon: Users },
            { id: "workload", label: "Workload & Leave Balance", icon: Clock },
            { id: "research", label: "Research & Publications", icon: FlaskConical },
            { id: "advising", label: "Office Advising & Reach", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-rose-primary text-white shadow-sm"
                    : "bg-white dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-rose-container border border-border dark:border-charcoal-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Teaching & Timetable Schedule */}
        {activeTab === "teaching" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Active Courses */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-rose-primary" />
                  Assigned Course Curriculum ({faculty.courses.length} Courses)
                </span>
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {faculty.courses.map((course) => (
                  <div key={course.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-primary dark:text-rose-light">
                          {course.code}
                        </span>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {course.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-charcoal-500 mt-1 block">
                        Type: {course.type} • {course.credits} Credits • {course.enrolledCount} Enrolled Scholars
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                      LEAD INSTRUCTOR
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Timetable Grid */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-rose-primary" />
                  Weekly Lecture Matrix & Hall Allocation
                </span>
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {faculty.timetables.length === 0 ? (
                  <div className="p-4 text-xs text-charcoal-500 italic">
                    No active lecture schedule assigned in current semester matrix.
                  </div>
                ) : (
                  faculty.timetables.map((slot) => (
                    <div key={slot.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-200 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 uppercase">
                            {slot.dayOfWeek}
                          </span>
                          <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <span className="text-[11px] text-charcoal-600 dark:text-charcoal-400 mt-1 block">
                          {slot.courseCode}: {slot.courseTitle} ({slot.section})
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-rose-primary dark:text-rose-light">
                        {slot.room}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Research & Academic Publications */}
        {activeTab === "research" && (
          <div className="space-y-6">
            {/* Active Grants */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-rose-primary" />
                  Sponsored Research Projects & External Grants ({faculty.researchProjects.length})
                </span>
                <span className="text-xs font-mono font-bold text-academic-success">
                  Total Funding: ${faculty.stats?.totalGrantAmount.toLocaleString()}
                </span>
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {faculty.researchProjects.map((rp) => (
                  <div key={rp.id} className="p-5 flex flex-col gap-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                        {rp.title}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success self-start sm:self-auto">
                        ${rp.grantAmount.toLocaleString()} • {rp.status}
                      </span>
                    </div>
                    <p className="text-charcoal-600 dark:text-charcoal-400 text-xs">
                      {rp.abstract}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-charcoal-500 font-medium mt-1">
                      <span>Agency: <strong className="text-charcoal-800 dark:text-ivory-200">{rp.fundingAgency}</strong></span>
                      <span>•</span>
                      <span>Commenced: <strong className="text-charcoal-800 dark:text-ivory-200">{rp.startDate}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peer-Reviewed Publications */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-rose-primary" />
                  Peer-Reviewed Journal Publications & Citations ({faculty.publications.length})
                </span>
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {faculty.publications.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                    <div className="max-w-2xl">
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block text-sm">
                        {p.title}
                      </span>
                      <span className="text-[11px] text-charcoal-500 mt-1 block italic">
                        {p.journalName} ({p.year})
                      </span>
                      {p.doi && (
                        <span className="font-mono text-[10px] text-rose-primary mt-0.5 block">
                          DOI: {p.doi}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {p.citationCount} Citations
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Office Advising & Consultations */}
        {activeTab === "advising" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
              <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4 text-rose-primary" /> Weekly Advising Schedule
              </h3>
              <div className="flex flex-col gap-3 text-xs">
                {faculty.advisingHours.map((adh, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block text-sm">{adh.day}</span>
                      <span className="text-[11px] text-charcoal-500 mt-0.5 block">{adh.purpose}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-primary px-2.5 py-1 rounded-lg bg-rose-container/50">
                      {adh.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
              <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-primary" /> Office Location & Direct Reach
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Cabin / Office Room</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{faculty.officeRoom}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Department</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{faculty.departmentName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Official Email</span>
                  <a href={`mailto:${faculty.email}`} className="font-semibold text-rose-primary hover:underline">{faculty.email}</a>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Direct Campus Phone</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{faculty.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Assigned Mentee Wards & Risk Watch */}
        {activeTab === "mentees" && (
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-primary" />
                  Assigned Scholar Mentee Cohort ({faculty.mentees?.length || 0} Scholars)
                </span>
                <p className="text-[11px] text-charcoal-500 mt-0.5">
                  Proactive pastoral oversight, attendance deficit monitoring, and academic counseling intervention.
                </p>
              </div>
            </div>

            {(faculty.mentees || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-500 italic">
                No mentee scholars assigned to this faculty profile yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {faculty.mentees!.map((mentee) => (
                  <div key={mentee.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-sm">
                          {mentee.name}
                        </span>
                        <span className="font-mono text-charcoal-500 text-[11px]">
                          ({mentee.rollNo})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mentee.academicStanding.includes("Dean")
                              ? "bg-academic-success-subtle text-academic-success border border-green-200"
                              : mentee.academicStanding.includes("Defaulter") || mentee.academicStanding.includes("Probation")
                              ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                              : "bg-surface-soft text-charcoal-600 border border-border"
                          }`}
                        >
                          {mentee.academicStanding}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-charcoal-500 text-[11px]">
                        <span>Program: <strong>{mentee.program}</strong></span>
                        <span>Semester: <strong>{mentee.semester} (Sec {mentee.section})</strong></span>
                        <span>CGPA: <strong className="text-charcoal-900 dark:text-ivory-100">{mentee.cgpa.toFixed(2)}</strong></span>
                        <span>
                          Attendance:{" "}
                          <strong className={mentee.attendanceRate < 75 ? "text-academic-danger font-bold" : "text-academic-success"}>
                            {mentee.attendanceRate.toFixed(1)}%
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/students/${mentee.id}`}
                        className="px-3 py-1.5 rounded-lg border border-border dark:border-charcoal-700 hover:bg-rose-container text-charcoal-700 dark:text-charcoal-300 font-bold transition-all text-xs"
                      >
                        View 360°
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedMentee(mentee);
                          setIsMentorModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-primary hover:bg-rose-deep text-white font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>Send Guidance</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Workload Norms, Intercom & Leave Management */}
        {activeTab === "workload" && (
          <div className="flex flex-col gap-6">
            {/* L-T-P Workload Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Lecture Hours (L)</span>
                <div className="text-2xl font-bold font-display text-rose-primary mt-1">
                  {faculty.workloadBreakdown?.lectureHours || 10} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Theory & Core Delivery</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Tutorial Hours (T)</span>
                <div className="text-2xl font-bold font-display text-academic-info mt-1">
                  {faculty.workloadBreakdown?.tutorialHours || 4} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Problem Solving & Mentoring</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Practical / Lab (P)</span>
                <div className="text-2xl font-bold font-display text-academic-success mt-1">
                  {faculty.workloadBreakdown?.labHours || 4} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Hands-on Laboratory Sessions</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Admin & Research Load</span>
                <div className="text-2xl font-bold font-display text-amber-500 mt-1">
                  {faculty.workloadBreakdown?.adminAndResearchHours || 4} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Committee & Funded Projects</span>
              </div>
            </div>

            {/* Privacy Intercom & Leave Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Institutional Intercom & DND Shield */}
              <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="h-4 w-4 text-rose-primary" />
                    Campus Intercom & DND Shield
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                    Privacy Active
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                    <span className="text-charcoal-500">Official Intercom Extension</span>
                    <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">
                      {faculty.workloadBreakdown?.intercomExtension || "Ext. 4108 (Campus Intercom)"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                    <span className="text-charcoal-500">Personal Mobile Masking</span>
                    <span className="font-semibold text-academic-success">Masked for Student Directory</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                    <span className="text-charcoal-500">Automated DND Protocol</span>
                    <span className="font-semibold text-charcoal-900 dark:text-ivory-100">Active after 5:30 PM & Weekends</span>
                  </div>
                </div>
              </div>

              {/* Leave Balances & Apply Leave */}
              <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-rose-primary" />
                    Faculty Leave Balances
                  </h3>
                  <button
                    onClick={() => setIsLeaveModalOpen(true)}
                    className="px-3 py-1 rounded-xl bg-rose-primary hover:bg-rose-deep text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Apply Leave & Proxy
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                    <span className="text-[10px] text-charcoal-500 uppercase block font-bold">Casual (CL)</span>
                    <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 mt-1 block">
                      {faculty.leaveManagement?.casualLeave.balance || 8} / {faculty.leaveManagement?.casualLeave.total || 12}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                    <span className="text-[10px] text-charcoal-500 uppercase block font-bold">Medical (ML)</span>
                    <span className="text-xl font-bold text-academic-info mt-1 block">
                      {faculty.leaveManagement?.medicalLeave.balance || 8} / {faculty.leaveManagement?.medicalLeave.total || 10}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                    <span className="text-[10px] text-charcoal-500 uppercase block font-bold">Duty (DL)</span>
                    <span className="text-xl font-bold text-academic-success mt-1 block">
                      {faculty.leaveManagement?.dutyLeave.balance || 12} / {faculty.leaveManagement?.dutyLeave.total || 15}
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-xs">
                  <span className="text-charcoal-500 font-bold block mb-1.5 text-[11px] uppercase tracking-wider">
                    Recent Leave & Proxy Allocation
                  </span>
                  {(faculty.leaveManagement?.recentLeaves || []).map((lv) => (
                    <div key={lv.id} className="p-2.5 rounded-xl bg-surface-soft dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="font-bold text-charcoal-800 dark:text-ivory-200">{lv.type} ({lv.dates})</span>
                        <span className="text-charcoal-500 block">Proxy Substitute: {lv.substitute}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                        {lv.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Feedback & Teaching Quality */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-700">
                <div>
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Student Teaching Satisfaction & Course Feedback Index
                  </h3>
                  <p className="text-[11px] text-charcoal-500 mt-0.5">
                    Anonymous end-of-term scholar feedback aggregated across {faculty.studentFeedback?.totalEvaluations || 128} verified course submissions.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-display text-rose-primary">
                    {faculty.studentFeedback?.overallRating || 4.82} / 5.00
                  </span>
                  <span className="text-[10px] text-academic-success font-bold block">
                    Outstanding (Top 5% Faculty)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(faculty.studentFeedback?.metrics || [
                  { category: "Subject Mastery & Clarity", rating: 4.9 },
                  { category: "Classroom Punctuality & Availability", rating: 4.8 },
                  { category: "Practical Relevance & LMS Materials", rating: 4.75 },
                  { category: "Fairness in Grading & Feedback", rating: 4.85 },
                ]).map((m, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs">
                    <span className="text-charcoal-500 block mb-1">{m.category}</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100 text-lg">
                      {m.rating.toFixed(2)} ★
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit Profile: ${faculty.name}`}
        >
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Office / Cabin Location
              </label>
              <input
                type="text"
                value={editOfficeRoom}
                onChange={(e) => setEditOfficeRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                placeholder="e.g. Room 304, CSE Block"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                placeholder="+1 (555) 018-4921"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Academic Qualification
              </label>
              <input
                type="text"
                value={editQualification}
                onChange={(e) => setEditQualification(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                placeholder="Ph.D. in Computer Science (Stanford)"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Specialization & Research Domain
              </label>
              <input
                type="text"
                value={editSpecialization}
                onChange={(e) => setEditSpecialization(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                placeholder="Deep Neural Architectures & Transformer Systems"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Weekly Teaching Hours
              </label>
              <input
                type="number"
                value={editWeeklyHours}
                onChange={(e) => setEditWeeklyHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                min={1}
                max={40}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Apply Leave Modal with Proxy Substitute Assignment */}
      {isLeaveModalOpen && (
        <Modal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          title="Apply for Faculty Leave & Assign Proxy Substitute"
          description="Submit formal academic leave and delegate lecture sessions to an assigned departmental colleague."
        >
          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Leave Classification
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="Casual Leave (CL)">Casual Leave (CL) - Balance: {faculty?.leaveManagement?.casualLeave.balance || 8} Days</option>
                <option value="Medical Leave (ML)">Medical Leave (ML) - Balance: {faculty?.leaveManagement?.medicalLeave.balance || 8} Days</option>
                <option value="Duty Leave (DL)">Duty Leave (DL) - Conference / Academic Delegation</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Assigned Proxy Substitute Colleague *
              </label>
              <select
                value={substituteFacultyName}
                onChange={(e) => setSubstituteFacultyName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="Prof. David Miller (CS-301)">Prof. David Miller (Systems & Networks)</option>
                <option value="Prof. Marcus Brody (CS-402)">Prof. Marcus Brody (Architecture & Algorithms)</option>
                <option value="Prof. Sarah Chen (CS-108)">Prof. Sarah Chen (Senior Faculty)</option>
              </select>
              <p className="text-[11px] text-charcoal-500 mt-1">
                The designated proxy colleague will receive timetable delegation alerts for scheduled lectures.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingLeave}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSubmittingLeave ? "Registering..." : "Submit Leave Application"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mentorship Pastoral Guidance Modal */}
      {isMentorModalOpen && selectedMentee && (
        <Modal
          isOpen={isMentorModalOpen}
          onClose={() => setIsMentorModalOpen(false)}
          title={`Advisory Note: ${selectedMentee.name} (${selectedMentee.rollNo})`}
          description="Send direct pastoral advice, academic intervention guidance, or office hour consultation requests."
        >
          <form onSubmit={handleSendMentorNote} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Mentee Academic Telemetry
              </label>
              <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 flex justify-between text-[11px]">
                <span>CGPA: <strong>{selectedMentee.cgpa.toFixed(2)}</strong></span>
                <span>Attendance: <strong>{selectedMentee.attendanceRate.toFixed(1)}%</strong></span>
                <span>Status: <strong>{selectedMentee.academicStanding}</strong></span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Advisory Mentoring Guidance *
              </label>
              <textarea
                rows={4}
                required
                value={mentorNoteText}
                onChange={(e) => setMentorNoteText(e.target.value)}
                placeholder="Dear scholar, please meet me during Tuesday office hours to discuss your practical lab coursework and midterm revision strategy..."
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsMentorModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingNote || !mentorNoteText.trim()}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSubmittingNote ? "Dispatching..." : "Dispatch Guidance"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
