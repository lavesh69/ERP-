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
  PlusCircle,
  FileCheck,
  Landmark,
  Download,
  Check,
  X,
} from "lucide-react";
import { QuestionPaperStudioTab } from "@/components/faculty/tabs/QuestionPaperStudioTab";
import { ResearchGrantsPortfolioTab } from "@/components/faculty/tabs/ResearchGrantsPortfolioTab";

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
  const [activeTab, setActiveTab] = useState<
    "teaching" | "mentees" | "workload" | "research" | "advising" | "lesson-plan" | "substitutions" | "asar-appraisal" | "question-paper" | "research-portfolio"
  >("teaching");

  // Lesson Plan & Syllabus Coverage State
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [coverageData, setCoverageData] = useState<any>(null);
  const [isLoadingLessonPlan, setIsLoadingLessonPlan] = useState(false);

  // Substitutions & Duty Credits State
  const [substitutions, setSubstitutions] = useState<any[]>([]);
  const [isLoadingSubstitutions, setIsLoadingSubstitutions] = useState(false);

  // UGC ASAR Appraisal State
  const [asarData, setAsarData] = useState<any>(null);
  const [isGeneratingAsar, setIsGeneratingAsar] = useState(false);

  // Official Printable Payslip Modal
  const [payslipModal, setPayslipModal] = useState<{ isOpen: boolean; data: any; loading: boolean }>({
    isOpen: false,
    data: null,
    loading: false,
  });

  // Seed Money & Conference Grant Modal
  const [isSeedGrantModalOpen, setIsSeedGrantModalOpen] = useState(false);
  const [seedGrantTitle, setSeedGrantTitle] = useState("");
  const [seedGrantAmount, setSeedGrantAmount] = useState(150000);
  const [seedGrantRemarks, setSeedGrantRemarks] = useState("");
  const [isSubmittingSeed, setIsSubmittingSeed] = useState(false);

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

  const loadLessonPlans = async () => {
    setIsLoadingLessonPlan(true);
    try {
      const res = await fetch(`/api/faculty?action=LESSON_PLAN&courseCode=CS301&facultyEmail=${faculty?.email || ""}`);
      if (res.ok) {
        const data = await res.json();
        setLessonPlans(data.lessonPlans || []);
        setCoverageData(data.coverage || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLessonPlan(false);
    }
  };

  const loadSubstitutions = async () => {
    setIsLoadingSubstitutions(true);
    try {
      const res = await fetch(`/api/faculty?action=SUBSTITUTIONS&facultyEmail=${faculty?.email || ""}`);
      if (res.ok) {
        const data = await res.json();
        setSubstitutions(data.substitutions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSubstitutions(false);
    }
  };

  const handleRespondSubstitution = async (subId: string, decision: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESPOND_SUBSTITUTION_CONSENT",
          substitutionId: subId,
          decision,
          responseNotes: `Delegation response: ${decision}`,
        }),
      });
      if (res.ok) {
        showToast(`Lecture substitution ${decision === "ACCEPT" ? "accepted (+1.0 Duty Credit)" : "declined"}`, "success");
        loadSubstitutions();
      }
    } catch {
      showToast("Failed to respond to substitution", "error");
    }
  };

  const handleGenerateAsar = async () => {
    setIsGeneratingAsar(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_UGC_ASAR",
          facultyName: faculty?.name,
          facultyEmail: faculty?.email,
          employeeCode: faculty?.employeeCode,
          designation: faculty?.designation,
          department: faculty?.departmentName,
          allocatedHoursPerWeek: 16,
          deliveredHoursPerWeek: 16,
          syllabusCompletionRate: 94,
          examDutyDays: 5,
          institutionalCommitteeRoles: 2,
          menteeCount: faculty?.mentees?.length || 20,
          publicationsCount: faculty?.publications?.length || 5,
          firstAuthorCount: 3,
          sponsoredGrantsLakhs: 20,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAsarData(data.asarDossier);
        showToast("UGC 2018 Annual Self-Appraisal Dossier compiled successfully", "success");
      }
    } catch {
      showToast("Failed to compile ASAR report", "error");
    } finally {
      setIsGeneratingAsar(false);
    }
  };

  const handleOpenPrintPayslip = async () => {
    setPayslipModal({ isOpen: true, data: null, loading: true });
    try {
      const res = await fetch(`/api/faculty?action=PRINT_PAYSLIP&facultyEmail=${faculty?.email || ""}`);
      if (res.ok) {
        const data = await res.json();
        setPayslipModal({ isOpen: true, data, loading: false });
      } else {
        setPayslipModal({ isOpen: false, data: null, loading: false });
        showToast("Failed to load payslip data", "error");
      }
    } catch {
      setPayslipModal({ isOpen: false, data: null, loading: false });
      showToast("Network error loading payslip", "error");
    }
  };

  const handleApplySeedGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seedGrantTitle.trim()) return;
    setIsSubmittingSeed(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "APPLY_SEED_GRANT",
          title: seedGrantTitle.trim(),
          amountRequested: Number(seedGrantAmount),
          remarks: seedGrantRemarks.trim(),
        }),
      });
      if (res.ok) {
        showToast("Internal Seed Money Research Proposal submitted to Dean (Research)", "success");
        setIsSeedGrantModalOpen(false);
        setSeedGrantTitle("");
      }
    } catch {
      showToast("Failed to submit grant proposal", "error");
    } finally {
      setIsSubmittingSeed(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lesson-plan" && lessonPlans.length === 0) {
      loadLessonPlans();
    } else if (activeTab === "substitutions" && substitutions.length === 0) {
      loadSubstitutions();
    }
  }, [activeTab]);

  // Advising Booking Modal State
  const [isAdvisingModalOpen, setIsAdvisingModalOpen] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState("");
  const [advisingPurpose, setAdvisingPurpose] = useState("Academic & Research Mentorship");
  const [isSubmittingAdvising, setIsSubmittingAdvising] = useState(false);

  const handleBookAdvisingSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty || !selectedSlotTime) return;
    setIsSubmittingAdvising(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BOOK_ADVISING_SLOT",
          facultyId: faculty.id,
          slotTime: selectedSlotTime,
          purpose: advisingPurpose,
          studentName: currentUser?.name || "Current Scholar",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Office hours advising slot confirmed", "success");
        setIsAdvisingModalOpen(false);
      } else {
        showToast(data.error || "Failed to book advising slot", "error");
      }
    } catch {
      showToast("Network error booking advising slot", "error");
    } finally {
      setIsSubmittingAdvising(false);
    }
  };

  // Add Publication Modal State
  const [isAddPubModalOpen, setIsAddPubModalOpen] = useState(false);
  const [newPubTitle, setNewPubTitle] = useState("");
  const [newPubJournal, setNewPubJournal] = useState("");
  const [newPubDoi, setNewPubDoi] = useState("");
  const [newPubYear, setNewPubYear] = useState(new Date().getFullYear());
  const [newPubCitations, setNewPubCitations] = useState(0);
  const [isSubmittingPub, setIsSubmittingPub] = useState(false);

  const handleAddPublication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty || !newPubTitle.trim() || !newPubJournal.trim()) return;
    setIsSubmittingPub(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_PUBLICATION",
          facultyId: faculty.id,
          title: newPubTitle.trim(),
          journalName: newPubJournal.trim(),
          doi: newPubDoi.trim() || undefined,
          year: Number(newPubYear),
          citationCount: Number(newPubCitations),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Peer-reviewed paper recorded successfully!", "success");
        setIsAddPubModalOpen(false);
        setNewPubTitle("");
        setNewPubJournal("");
        setNewPubDoi("");
        loadFaculty();
      } else {
        showToast(data.error || "Failed to add publication", "error");
      }
    } catch {
      showToast("Network error recording publication", "error");
    } finally {
      setIsSubmittingPub(false);
    }
  };

  // Add Research Grant Modal State
  const [isAddGrantModalOpen, setIsAddGrantModalOpen] = useState(false);
  const [newGrantTitle, setNewGrantTitle] = useState("");
  const [newGrantAmount, setNewGrantAmount] = useState("75000");
  const [newGrantAgency, setNewGrantAgency] = useState("National Science Foundation (NSF)");
  const [newGrantAbstract, setNewGrantAbstract] = useState("");
  const [isSubmittingGrant, setIsSubmittingGrant] = useState(false);

  const handleAddGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faculty || !newGrantTitle.trim() || !newGrantAbstract.trim()) return;
    setIsSubmittingGrant(true);
    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_RESEARCH_PROJECT",
          facultyId: faculty.id,
          title: newGrantTitle.trim(),
          grantAmount: parseFloat(newGrantAmount) || 50000,
          fundingAgency: newGrantAgency.trim(),
          abstract: newGrantAbstract.trim(),
          startDate: new Date().toISOString().split("T")[0],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Funded research project registered successfully!", "success");
        setIsAddGrantModalOpen(false);
        setNewGrantTitle("");
        setNewGrantAbstract("");
        loadFaculty();
      } else {
        showToast(data.error || "Failed to register research project", "error");
      }
    } catch {
      showToast("Network error registering research project", "error");
    } finally {
      setIsSubmittingGrant(false);
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
        <div className="bg-white dark:bg-charcoal-800 bg-gradient-to-br from-white via-surface-ground to-rose-container/15 dark:from-charcoal-800 dark:via-charcoal-800 dark:to-charcoal-900/40 rounded-3xl p-6 border border-border dark:border-charcoal-700 shadow-soft glass-card-hover flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary text-white hover:bg-rose-deep shadow-sm transition-all btn-primary-glow"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Contact Faculty</span>
            </a>
          </div>
        </div>

        {/* 4 Performance & Workload KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Weekly Teaching Load</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-rose-primary" />
              <span>{faculty.weeklyHours} hrs/wk</span>
            </div>
            <span className="text-[10px] text-academic-success font-semibold">
              Senate Norm Compliant
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Active Course Load</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-academic-info" />
              <span>{faculty.courses?.length || 0} Subjects</span>
            </div>
            <span className="text-[10px] text-charcoal-500 font-medium">
              Synchronized with Timetable
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Lectures Delivered</span>
            <div className="text-2xl font-display font-bold text-rose-primary dark:text-rose-light mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{faculty.stats?.totalSessionsConducted || 12} Sessions</span>
            </div>
            <span className="text-[10px] text-academic-success font-semibold">
              Avg {faculty.stats?.avgClassAttendanceRate || 91.5}% Class Attendance
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
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
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-700 pb-2 overflow-x-auto no-scrollbar flex-nowrap">
          {[
            { id: "teaching", label: "Teaching & Timetable", icon: BookOpen },
            { id: "question-paper", label: "Autonomous Exam Paper Studio", icon: Sparkles },
            { id: "research-portfolio", label: "UGC Research & Grants Portfolio", icon: FlaskConical },
            { id: "lesson-plan", label: "Course File & Lesson Plans", icon: FileCheck },
            { id: "substitutions", label: "Lecture Swapping & Duty Credits", icon: Clock },
            { id: "asar-appraisal", label: "UGC ASAR & Payslip", icon: Award },
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
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
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
                  <div key={course.id} className="p-4 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-rose-primary dark:text-rose-light">
                            {course.code}
                          </span>
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                            {course.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-charcoal-500 mt-0.5 block">
                          Type: {course.type} • {course.credits} Credits • {course.enrolledCount} Enrolled Scholars
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800 shrink-0">
                        LEAD INSTRUCTOR
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/40 dark:border-charcoal-700/60">
                      <div className="flex items-center justify-between text-[10px] text-charcoal-500 mb-1">
                        <span className="font-semibold">Curriculum Syllabus Progression</span>
                        <span className="font-mono font-bold text-rose-primary">78% Covered (Module 4 of 5)</span>
                      </div>
                      <div className="w-full bg-surface-soft dark:bg-charcoal-700 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-primary h-full rounded-full" style={{ width: "78%" }} />
                      </div>
                    </div>
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
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-academic-success">
                    Total Funding: ${faculty.stats?.totalGrantAmount.toLocaleString()}
                  </span>
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => setIsAddGrantModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Grant
                    </button>
                  )}
                </div>
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
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => setIsAddPubModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-primary hover:bg-rose-600 text-white font-bold text-xs shadow-xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Publication
                  </button>
                )}
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
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-primary px-2.5 py-1 rounded-lg bg-rose-container/50">
                        {adh.time}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSlotTime(`${adh.day} ${adh.time}`);
                          setIsAdvisingModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-primary hover:bg-rose-deep text-white font-bold text-[11px] transition-all shadow-xs"
                      >
                        Reserve Slot
                      </button>
                    </div>
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
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Lecture Hours (L)</span>
                <div className="text-2xl font-bold font-display text-rose-primary mt-1">
                  {faculty.workloadBreakdown?.lectureHours || 10} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Theory & Core Delivery</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Tutorial Hours (T)</span>
                <div className="text-2xl font-bold font-display text-academic-info mt-1">
                  {faculty.workloadBreakdown?.tutorialHours || 4} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Problem Solving & Mentoring</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
                <span className="text-[10px] font-bold text-charcoal-500 uppercase block">Practical / Lab (P)</span>
                <div className="text-2xl font-bold font-display text-academic-success mt-1">
                  {faculty.workloadBreakdown?.labHours || 4} hrs/wk
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">Hands-on Laboratory Sessions</span>
              </div>
              <div className="bg-white dark:bg-charcoal-800 p-5 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft glass-card-hover">
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

        {/* Tab: Course File & Lesson Plans */}
        {activeTab === "lesson-plan" && (
          <div className="space-y-6">
            {/* Syllabus Coverage KPI Bar */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-700">
                <div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-rose-primary" />
                    <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                      Digital Course File & Lesson Plan Delivery Tracker
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    NBA/NAAC Criteria 2 Compliant • Planned vs Actual Delivery with Bloom's Taxonomy Tagging
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300">
                    Syllabus Health: {coverageData?.status || "ON_TRACK"}
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-primary">
                    {coverageData?.completionPercentage || 80}% Completed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="p-3 bg-surface-soft dark:bg-charcoal-900 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Course Code</span>
                  <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">CS301 (Algorithms)</span>
                </div>
                <div className="p-3 bg-surface-soft dark:bg-charcoal-900 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Planned Lectures</span>
                  <span className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">{coverageData?.totalPlannedLectures || 10} Units</span>
                </div>
                <div className="p-3 bg-surface-soft dark:bg-charcoal-900 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Delivered on Time</span>
                  <span className="font-bold text-sm text-emerald-600">{coverageData?.completedLectures || 8} Lectures</span>
                </div>
                <div className="p-3 bg-surface-soft dark:bg-charcoal-900 rounded-xl">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Deviation / Rescheduled</span>
                  <span className="font-bold text-sm text-amber-600">{coverageData?.delayedLectures || 0} Lectures</span>
                </div>
              </div>
            </div>

            {/* Lesson Plan Units Table */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                  Lecture-by-Lecture Planned Delivery Matrix (15-Week Term)
                </span>
                <button
                  onClick={loadLessonPlans}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-ivory-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-300"
                >
                  Refresh Tracker
                </button>
              </div>

              {isLoadingLessonPlan ? (
                <div className="p-8 text-center text-xs text-charcoal-500">Loading course lesson plan telemetry...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-ivory-50 dark:bg-charcoal-900 text-charcoal-500 font-semibold border-b border-border dark:border-charcoal-700">
                      <tr>
                        <th className="p-3">Wk / Lec #</th>
                        <th className="p-3">Topic & Syllabus Domain</th>
                        <th className="p-3">Planned Date</th>
                        <th className="p-3">Actual Date</th>
                        <th className="p-3">Bloom's Taxonomy</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                      {lessonPlans.map((unit: any, idx: number) => (
                        <tr key={idx} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/50">
                          <td className="p-3 font-mono font-bold">W{unit.weekNumber}.L{unit.lectureNumber}</td>
                          <td className="p-3 font-semibold text-charcoal-900 dark:text-ivory-100">{unit.topic}</td>
                          <td className="p-3 text-charcoal-600 font-mono">{unit.plannedDate}</td>
                          <td className="p-3 font-mono">{unit.actualDate || "—"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200">
                              {unit.bloomLevel}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-ivory-200 dark:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200">
                              {unit.deliveryMode}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              unit.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              {unit.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Lecture Swapping & Duty Credits */}
        {activeTab === "substitutions" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-700">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                      Timetable Lecture Substitution & Compensatory Duty Credits
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Peer-to-peer lecture delegation consent with automated timetable swapping and compensatory duty credits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-blue-800 dark:text-blue-200 font-bold text-xs">
                    Earned Duty Credits: 2.0 Units
                  </span>
                </div>
              </div>

              {isLoadingSubstitutions ? (
                <div className="p-8 text-center text-xs text-charcoal-500">Checking pending substitution requests...</div>
              ) : substitutions.length === 0 ? (
                <div className="p-8 text-center text-xs text-charcoal-500 italic">
                  No active or pending lecture substitution delegations found for this semester.
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {substitutions.map((sub: any) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl bg-ivory-50 dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100">{sub.courseCode} ({sub.courseTitle})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-charcoal-500 mt-1 font-mono">
                          Delegating Faculty: {sub.originalFacultyEmail} • Scheduled: {new Date(sub.scheduledDate).toLocaleDateString()} ({sub.slotTime})
                        </p>
                      </div>

                      {sub.status === "PENDING_CONSENT" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRespondSubstitution(sub.id, "ACCEPT")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept Lecture (+1.0 Credit)
                          </button>
                          <button
                            onClick={() => handleRespondSubstitution(sub.id, "DECLINE")}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: UGC ASAR 2018 Appraisal & Payslip */}
        {activeTab === "asar-appraisal" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-700">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    <h3 className="text-base font-bold text-charcoal-900 dark:text-ivory-100">
                      UGC Regulations 2018 PBAS Annual Self-Appraisal (ASAR)
                    </h3>
                  </div>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Direct Promotion & CAS Screening Dossier • Ministry of Education & Vidwan Linked
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpenPrintPayslip}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border flex items-center gap-1.5 hover:bg-ivory-200"
                  >
                    <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Print Official Payslip</span>
                  </button>
                  <button
                    onClick={() => setIsSeedGrantModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border flex items-center gap-1.5 hover:bg-ivory-200"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                    <span>Apply Seed Grant</span>
                  </button>
                  <button
                    onClick={handleGenerateAsar}
                    disabled={isGeneratingAsar}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAsar ? "Compiling Dossier..." : "Compile UGC ASAR Dossier"}</span>
                  </button>
                </div>
              </div>

              {/* Research Profiles IDs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border text-xs">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Government Vidwan ID</span>
                  <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">VID-2026-9812</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border text-xs">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">ORCID Identifier</span>
                  <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">0000-0002-1825-0097</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border text-xs">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Scopus Author ID</span>
                  <span className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">57201948291</span>
                </div>
                <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border text-xs">
                  <span className="text-[10px] text-charcoal-500 uppercase font-bold block">Google Scholar h-index</span>
                  <span className="font-mono font-bold text-emerald-600">18 (i10-index: 24)</span>
                </div>
              </div>

              {asarData && (
                <div className="mt-6 p-5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-amber-200 dark:border-amber-800">
                    <div>
                      <span className="font-bold text-sm text-amber-950 dark:text-amber-200 block">
                        Annual Performance Appraisal Report (Academic Year {asarData.academicYear})
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-300 font-mono">
                        Verification Seal: {asarData.verificationHash}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                      Overall Grading: {asarData.overallGrading}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-white dark:bg-charcoal-900 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-charcoal-500 font-bold block">Category I: Teaching Activities</span>
                      <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">{asarData.category1Score} / 100</span>
                      <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Grading: {asarData.category1Grading}</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-charcoal-900 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-charcoal-500 font-bold block">Category II: University Governance</span>
                      <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">{asarData.category2Score} / 50</span>
                      <span className="text-[10px] text-charcoal-500 block mt-1">Exams, Mentoring, Committees</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-charcoal-900 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-charcoal-500 font-bold block">Category III: Research Contributions</span>
                      <span className="text-xl font-bold text-charcoal-900 dark:text-ivory-100">{asarData.category3ResearchScore} Pts</span>
                      <span className="text-[10px] text-charcoal-500 block mt-1">70:30 Author Rule Applied</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Autonomous Examination Question Paper Studio */}
        {activeTab === "question-paper" && (
          <QuestionPaperStudioTab facultyId={faculty.id} facultyName={faculty.name} />
        )}

        {/* Tab: UGC Research, Grants, Patents & Consultancy Portfolio */}
        {activeTab === "research-portfolio" && (
          <ResearchGrantsPortfolioTab facultyId={faculty.id} facultyName={faculty.name} />
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

      {/* Advising Office Hours Slot Booking Modal */}
      {isAdvisingModalOpen && (
        <Modal
          isOpen={isAdvisingModalOpen}
          onClose={() => setIsAdvisingModalOpen(false)}
          title={`Reserve Office Hours: ${faculty.name}`}
          description={`Confirm your 1-on-1 academic consultation or research advising slot with ${faculty.designation}.`}
        >
          <form onSubmit={handleBookAdvisingSlot} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Selected Advisory Slot *
              </label>
              <input
                type="text"
                readOnly
                value={selectedSlotTime}
                className="w-full px-3 py-2 rounded-xl bg-surface-soft dark:bg-charcoal-900 border border-border dark:border-charcoal-700 font-mono font-bold text-rose-primary"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Consultation Agenda / Purpose *
              </label>
              <select
                value={advisingPurpose}
                onChange={(e) => setAdvisingPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-charcoal-900 dark:text-ivory-100"
              >
                <option value="Academic & Research Mentorship">Academic & Research Mentorship</option>
                <option value="Midterm & Exam Revision Queries">Midterm & Exam Revision Queries</option>
                <option value="Capstone & Final Project Guidance">Capstone & Final Project Guidance</option>
                <option value="Career & Graduate School Recommendation">Career & Graduate School Recommendation</option>
                <option value="Coursework & Lab Assignment Clarification">Coursework & Lab Assignment Clarification</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-900/60 border border-border text-[11px] text-charcoal-600 dark:text-charcoal-400">
              <span>Location: <strong>{faculty.officeRoom}</strong></span>
              <span className="block mt-0.5">Direct Intercom / Desk: <strong>{faculty.phone}</strong></span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsAdvisingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingAdvising}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSubmittingAdvising ? "Reserving..." : "Confirm Reservation"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Publication Modal */}
      {isAddPubModalOpen && (
        <Modal
          isOpen={isAddPubModalOpen}
          onClose={() => setIsAddPubModalOpen(false)}
          title="Submit New Journal Publication"
          description="Record a peer-reviewed research publication into the institutional faculty Scopus profile."
        >
          <form onSubmit={handleAddPublication} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Paper / Article Title *
              </label>
              <input
                type="text"
                required
                value={newPubTitle}
                onChange={(e) => setNewPubTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus in Asynchronous Byzantine Networks"
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Journal / Conference Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPubJournal}
                  onChange={(e) => setNewPubJournal(e.target.value)}
                  placeholder="e.g. IEEE Transactions on Software Engineering"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  DOI Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={newPubDoi}
                  onChange={(e) => setNewPubDoi(e.target.value)}
                  placeholder="10.1109/TSE.2026.104928"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Publication Year
                </label>
                <input
                  type="number"
                  value={newPubYear}
                  onChange={(e) => setNewPubYear(parseInt(e.target.value) || 2026)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Initial Scopus Citations
                </label>
                <input
                  type="number"
                  value={newPubCitations}
                  onChange={(e) => setNewPubCitations(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsAddPubModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPub}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSubmittingPub ? "Recording..." : "Record Publication"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Research Grant Modal */}
      {isAddGrantModalOpen && (
        <Modal
          isOpen={isAddGrantModalOpen}
          onClose={() => setIsAddGrantModalOpen(false)}
          title="Register Funded Research Project"
          description="Submit a sponsored research grant project to the institutional grants management ledger."
        >
          <form onSubmit={handleAddGrant} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Project Title *
              </label>
              <input
                type="text"
                required
                value={newGrantTitle}
                onChange={(e) => setNewGrantTitle(e.target.value)}
                placeholder="e.g. Next-Generation Post-Quantum Cryptographic Protocols"
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Funding Agency / Sponsor *
                </label>
                <input
                  type="text"
                  required
                  value={newGrantAgency}
                  onChange={(e) => setNewGrantAgency(e.target.value)}
                  placeholder="e.g. DARPA / NSF / DST SERB"
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Sanctioned Grant Amount ($) *
                </label>
                <input
                  type="number"
                  required
                  value={newGrantAmount}
                  onChange={(e) => setNewGrantAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Project Abstract & Deliverables *
              </label>
              <textarea
                required
                rows={3}
                value={newGrantAbstract}
                onChange={(e) => setNewGrantAbstract(e.target.value)}
                placeholder="Summarize research scope, experimental testbed, and milestone outputs..."
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 outline-none focus:ring-2 focus:ring-rose-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsAddGrantModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingGrant}
                className="px-4 py-2 rounded-xl bg-rose-primary text-white font-bold hover:bg-rose-deep disabled:opacity-50"
              >
                {isSubmittingGrant ? "Registering..." : "Register Research Project"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Internal Seed Money Grant Application Modal */}
      {isSeedGrantModalOpen && (
        <Modal
          isOpen={isSeedGrantModalOpen}
          onClose={() => setIsSeedGrantModalOpen(false)}
          title="Apply for Internal Seed Money Research Grant"
          description="Institutional research stimulus funding for faculty researchers under Dean (R&D) guidelines."
        >
          <form onSubmit={handleApplySeedGrant} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Research Project Title *
              </label>
              <input
                type="text"
                required
                value={seedGrantTitle}
                onChange={(e) => setSeedGrantTitle(e.target.value)}
                placeholder="e.g. Distributed Consensus Architectures for Fault-Tolerant Edge Computing"
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Requested Seed Funding (₹ INR) *
              </label>
              <input
                type="number"
                required
                min={25000}
                max={500000}
                value={seedGrantAmount}
                onChange={(e) => setSeedGrantAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 font-mono"
              />
              <span className="text-[10px] text-charcoal-400 mt-1 block">Maximum seed grant limit: ₹5,00,000 per tenure</span>
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                Proposal Summary & Equipment Utilization *
              </label>
              <textarea
                rows={3}
                required
                value={seedGrantRemarks}
                onChange={(e) => setSeedGrantRemarks(e.target.value)}
                placeholder="Detail planned hardware procurement, journal publication targets, and student research assistant roles..."
                className="w-full px-3 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
              <button
                type="button"
                onClick={() => setIsSeedGrantModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSeed || !seedGrantTitle.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50 shadow-sm"
              >
                {isSubmittingSeed ? "Submitting..." : "Submit Proposal"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Official Bilingual University Crest Payslip Modal */}
      {payslipModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-2xl w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Official Salary Payslip • वेतन पर्ची
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    APEX INSTITUTE OF HIGHER EDUCATION & RESEARCH • NAAC 'A++'
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayslipModal({ isOpen: false, data: null, loading: false })}
                className="text-charcoal-400 hover:text-charcoal-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {payslipModal.loading ? (
              <div className="p-8 text-center text-xs text-charcoal-500">Generating cryptographic payslip...</div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Employee Info Header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/80 border border-border dark:border-charcoal-700">
                  <div>
                    <span className="text-[10px] text-charcoal-500 block">Staff Name</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100">{payslipModal.data?.payslip?.staffName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block">Designation</span>
                    <span className="font-bold text-charcoal-900 dark:text-ivory-100">{payslipModal.data?.payslip?.designation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block">Pay Period</span>
                    <span className="font-mono font-bold text-rose-primary">{payslipModal.data?.payslip?.payPeriod}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-charcoal-500 block">Bank Account</span>
                    <span className="font-mono text-charcoal-900 dark:text-ivory-100">{payslipModal.data?.payslip?.bankAccount}</span>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="rounded-xl border border-border dark:border-charcoal-700 overflow-hidden">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold border-b border-border dark:border-charcoal-700 flex justify-between">
                      <span>Gross Earnings (वेतन)</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="p-3 space-y-2 text-charcoal-700 dark:text-charcoal-300">
                      <div className="flex justify-between">
                        <span>Basic Pay (7th CPC)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.basicPay?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>House Rent Allowance (HRA)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.houseRentAllowance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dearness Allowance (DA)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.dearnessAllowance?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Academic Special Allowance</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.specialAllowance?.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-border flex justify-between font-bold text-charcoal-900 dark:text-ivory-100">
                        <span>Total Gross Salary</span>
                        <span className="font-mono text-emerald-600">₹{payslipModal.data?.payslip?.grossSalary?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="rounded-xl border border-border dark:border-charcoal-700 overflow-hidden">
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 font-bold border-b border-border dark:border-charcoal-700 flex justify-between">
                      <span>Deductions (कटौतियां)</span>
                      <span>Amount (₹)</span>
                    </div>
                    <div className="p-3 space-y-2 text-charcoal-700 dark:text-charcoal-300">
                      <div className="flex justify-between">
                        <span>Provident Fund (12%)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.providentFund?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax Deducted (Sec 192 TDS)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.taxDeductedAtSource?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Tax (PT)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.professionalTax?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Loss of Pay (LOP)</span>
                        <span className="font-mono">₹{payslipModal.data?.payslip?.lopDeduction?.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-border flex justify-between font-bold text-charcoal-900 dark:text-ivory-100">
                        <span>Total Deductions</span>
                        <span className="font-mono text-rose-600">₹{payslipModal.data?.payslip?.totalDeductions?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Pay Callout */}
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex justify-between items-center text-emerald-950 dark:text-emerald-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider block">Net Disbursed Amount (शुद्ध देय राशि)</span>
                    <span className="text-xl font-bold font-mono">₹{payslipModal.data?.payslip?.netPay?.toLocaleString()}</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                    DISBURSED & VERIFIED
                  </span>
                </div>

                {/* QR Seal & Digital Hash */}
                <div className="p-2.5 rounded-lg bg-surface-soft dark:bg-charcoal-800 border border-border flex items-center justify-between font-mono text-[10px] text-charcoal-500">
                  <span>Digital Hash: {payslipModal.data?.payslip?.verificationHash}</span>
                  <span>Seal: {payslipModal.data?.qrSeal}</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setPayslipModal({ isOpen: false, data: null, loading: false })}
                    className="px-3 py-2 text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 rounded-xl hover:bg-ivory-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
