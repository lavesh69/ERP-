"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Briefcase,
  Gift,
  ShieldCheck,
  Download,
  Mail,
  Phone,
  Building,
  ExternalLink,
  Clock,
  Book,
  Laptop,
  Smartphone,
  Trash2,
  KeyRound,
  AlertCircle,
  User,
  QrCode,
  ShieldAlert,
} from "lucide-react";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { Modal } from "@/components/common/Modal";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

interface StudentProfileData {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  rollNo: string;
  admissionNo: string;
  program: string;
  department: string;
  departmentName: string;
  currentSemester: number;
  section: string;
  cgpa: number;
  attendanceRate: number;
  status: string;
  feeStatus: string;
  totalCredits: number;
  earnedCredits: number;
  courses: Array<{
    id: string;
    code: string;
    title: string;
    credits: number;
    type: string;
    status: string;
  }>;
  attendanceRecords: Array<{
    id: string;
    courseCode: string;
    courseTitle: string;
    date: string;
    status: string;
  }>;
  examResults: Array<{
    id: string;
    examTitle: string;
    courseCode: string;
    marks: number;
    totalMarks: number;
    grade: string;
    points: number;
  }>;
  fees: Array<{
    id: string;
    title: string;
    total: number;
    paid: number;
    status: string;
    dueDate: string;
    transactions: Array<{
      id: string;
      reference: string;
      amount: number;
      method: string;
      date: string;
    }>;
  }>;
  bookLoans: Array<{
    id: string;
    title: string;
    isbn: string;
    issuedAt: string;
    dueDate: string;
    status: string;
  }>;
}

function StudentProfileContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get("id");
  const tabParam = searchParams.get("tab");
  const { showToast, currentUser, currentRole } = useApp();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "academics" | "attendance" | "finance" | "library" | "security" | "requests">(
    tabParam === "requests" ? "requests" : "overview"
  );
  const [userSessions, setUserSessions] = useState<Array<{
    id: string;
    device: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
    lastActiveAt: string;
    isCurrent: boolean;
  }>>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [changingPwd, setChangingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Requests & Petitions State
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [newRequestForm, setNewRequestForm] = useState<{
    type: "LEAVE" | "ATTENDANCE_CORRECTION" | "DOCUMENT_REQUEST" | "CERTIFICATE" | "ACADEMIC_CORRECTION";
    title: string;
    reason: string;
    attachmentUrl: string;
  }>({
    type: "LEAVE",
    title: "",
    reason: "",
    attachmentUrl: "",
  });
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Faculty Review State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isSavingReview, setIsSavingReview] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await fetch("/api/students/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (tabParam === "requests") {
      setActiveTab("requests");
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests();
    }
  }, [activeTab]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestForm.title || !newRequestForm.reason) {
      showToast("Title and reason are required", "warning");
      return;
    }
    try {
      setIsSubmittingRequest(true);
      const res = await fetch("/api/students/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRequestForm),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Petition submitted successfully", "success");
        setIsNewRequestModalOpen(false);
        setNewRequestForm({ type: "LEAVE", title: "", reason: "", attachmentUrl: "" });
        fetchRequests();
      } else {
        showToast(data.error || "Failed to submit petition", "danger");
      }
    } catch {
      showToast("Network error submitting petition", "danger");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForReview) return;
    try {
      setIsSavingReview(true);
      const res = await fetch("/api/students/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequestForReview.id,
          status: reviewStatus,
          reviewerRemarks: reviewRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || `Request ${reviewStatus.toLowerCase()} successfully`, "success");
        setIsReviewModalOpen(false);
        fetchRequests();
      } else {
        showToast(data.error || "Failed to update petition status", "danger");
      }
    } catch {
      showToast("Network error reviewing petition", "danger");
    } finally {
      setIsSavingReview(false);
    }
  };

  // 2FA TOTP state
  const [twoFactorInfo, setTwoFactorInfo] = useState<{
    twoFactorEnabled: boolean;
    secret: string;
    qrCodeDataUrl: string;
    uri: string;
  } | null>(null);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [twoFactorCodeInput, setTwoFactorCodeInput] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState("");

  useEffect(() => {
    async function loadStudentProfile() {
      try {
        setLoading(true);
        // IDOR Defense: Students are strictly locked to their own dossier; ignore arbitrary ?id query parameter
        let targetId: string | null = null;
        if (currentRole === "STUDENT") {
          targetId = currentUser?.email || currentUser?.id || null;
          if (studentId && studentId !== targetId && studentId !== currentUser?.id) {
            showToast("Access restricted: Scholars can only view their personal academic dossier.", "warning");
          }
        } else {
          targetId = studentId;
        }

        if (targetId) {
          const res = await fetch(`/api/students?id=${encodeURIComponent(targetId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.student) {
              setStudent(data.student);
              return;
            }
          }
        }


        // 2. Fallback for administrative oversight: fetch directory first record
        const listRes = await fetch("/api/students");
        if (listRes.ok) {
          const listData = await listRes.json();
          if (listData.students && listData.students.length > 0) {
            const firstId = listData.students[0].id;
            const res = await fetch(`/api/students?id=${firstId}`);
            if (res.ok) {
              const data = await res.json();
              setStudent(data.student || null);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load student profile:", err);
        showToast("Error retrieving student 360 dossier", "error");
      } finally {
        setLoading(false);
      }
    }
    loadStudentProfile();
  }, [studentId, currentUser, currentRole]);

  useEffect(() => {
    if (activeTab === "security") {
      loadSessions();
      loadTwoFactorStatus();
    }
  }, [activeTab]);


  const handleDownloadTranscript = () => {
    if (!student) return;

    const transcriptContent = `=====================================================
            APEX UNIVERSITY BURSAR & REGISTRAR
             OFFICIAL STUDENT 360 TRANSCRIPT
=====================================================
Student Name: ${student.name}
Roll Number: ${student.rollNo}
Admission Number: ${student.admissionNo}
Program: ${student.program}
Department: ${student.departmentName} (${student.department})
Semester: Semester ${student.currentSemester} (${student.section})
Cumulative CGPA: ${student.cgpa.toFixed(2)} / 4.00
Biometric Attendance: ${student.attendanceRate.toFixed(1)}%
Credits Completed: ${student.earnedCredits} / ${student.totalCredits}
Financial Standing: ${student.feeStatus}

--- ENROLLED COURSE CURRICULUM ---
${student.courses.map((c) => `- [${c.code}] ${c.title} (${c.credits} Credits) - Status: ${c.status}`).join("\n")}

--- VERIFIED EXAMINATION RESULTS ---
${
  student.examResults.length > 0
    ? student.examResults
        .map(
          (r) =>
            `- [${r.courseCode}] ${r.examTitle}: ${r.marks}/${r.totalMarks} (Grade: ${r.grade} - ${r.points} Pts)`
        )
        .join("\n")
    : "- No official examination records published for this term yet."
}

=====================================================
Official Digitally Certified Record: ${Date.now()}-APX-TRANSCRIPT
Registrar Stamp: [APEX-ACADEMIC-SEAL]
=====================================================`;

    const blob = new Blob([transcriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Transcript-${student.rollNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded official transcript for ${student.name}`, "success");
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/auth/sessions");
      if (res.ok) {
        const data = await res.json();
        setUserSessions(data.sessions || []);
      }
    } catch { /* ignore */ }
    finally { setLoadingSessions(false); }
  };

  const handleRevokeAll = async () => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE_ALL_OTHERS" }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.revokedCount} other device session(s) terminated.`, "success");
        await loadSessions();
      } else {
        showToast(data.error || "Failed to revoke sessions", "error");
      }
    } catch { showToast("Network error", "error"); }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVOKE_SESSION", sessionId }),
      });
      if (res.ok) {
        showToast("Session revoked.", "success");
        await loadSessions();
      }
    } catch { showToast("Network error", "error"); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    setChangingPwd(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: currentUser?.email,
          currentPassword: currentPwd,
          newPassword: newPwd,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMsg({ type: "success", text: "Password updated successfully." });
        setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        setPwdMsg({ type: "error", text: data.error || "Password change failed." });
      }
    } catch { setPwdMsg({ type: "error", text: "Network error." }); }
    finally { setChangingPwd(false); }
  };

  const loadTwoFactorStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/setup");
      if (res.ok) {
        const data = await res.json();
        setTwoFactorInfo(data);
      }
    } catch { /* ignore */ }
  };

  const handleOpen2FASetup = async () => {
    setTwoFactorError("");
    setTwoFactorCodeInput("");
    await loadTwoFactorStatus();
    setIs2FAModalOpen(true);
  };

  const handleVerifyAndEnable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying2FA(true);
    setTwoFactorError("");
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCodeInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Two-factor authentication successfully enabled!", "success");
        setIs2FAModalOpen(false);
        setTwoFactorCodeInput("");
        if (twoFactorInfo) {
          setTwoFactorInfo({ ...twoFactorInfo, twoFactorEnabled: true });
        }
      } else {
        setTwoFactorError(data.error || "Failed to verify 2FA code");
      }
    } catch {
      setTwoFactorError("Network error verifying code");
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    const code = window.prompt("Enter your 6-digit authenticator code or master key to disable 2FA:");
    if (!code) return;
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Two-factor authentication disabled", "info");
        if (twoFactorInfo) {
          setTwoFactorInfo({ ...twoFactorInfo, twoFactorEnabled: false });
        }
      } else {
        showToast(data.error || "Failed to disable 2FA", "error");
      }
    } catch {
      showToast("Network error disabling 2FA", "error");
    }
  };

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
          <SkeletonTable rows={5} />
        </div>
      </AppShell>
    );
  }

  if (!student) {
    return (
      <AppShell>
        <EmptyState
          icon={User}
          title="Student Profile Not Found"
          description="The requested scholar profile could not be located in the database repository."
        />
      </AppShell>
    );
  }

  const initials = student.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/" },
            { label: "Students Directory", href: "/students" },
            { label: student.name },
          ]}
        />
        {/* Student 360 Header Profile Card */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-rose-container dark:bg-rose-primary/20 border-2 border-rose-accent text-rose-primary dark:text-rose-light font-bold text-2xl flex items-center justify-center shadow-md shadow-rose-primary/10 shrink-0">
              {initials}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                  {student.name}
                </h1>
                {student.cgpa >= 3.8 && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 dark:border-green-800">
                    Dean&apos;s Honor List
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-primary/30 text-rose-primary dark:text-rose-light">
                  Roll: {student.rollNo}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300">
                  Adm: {student.admissionNo}
                </span>
              </div>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
                {student.program} • Semester {student.currentSemester} ({student.section})
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-charcoal-500 font-medium">
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3 text-rose-accent" /> {student.departmentName}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-rose-accent" /> {student.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-rose-accent" /> {student.phone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleDownloadTranscript}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-700 hover:bg-rose-container text-charcoal-800 dark:text-ivory-100 text-xs font-bold border border-border dark:border-charcoal-600 transition-all"
            >
              <Download className="h-4 w-4 text-charcoal-600 dark:text-charcoal-300" />
              <span>Official Transcript</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase">Cumulative CGPA</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {student.cgpa.toFixed(2)} / 4.0
            </div>
            <span className="text-[10px] text-academic-success font-semibold">
              {student.cgpa >= 3.8 ? "Top 3% Percentile" : "Good Standing"}
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase">Biometric Attendance</span>
            <div
              className={`text-2xl font-display font-bold mt-1 ${
                student.attendanceRate >= 75 ? "text-academic-success" : "text-academic-danger"
              }`}
            >
              {student.attendanceRate.toFixed(1)}%
            </div>
            <span className="text-[10px] text-charcoal-500 font-medium">
              {student.attendanceRate >= 75
                ? "Clear of Defaulter Cutoff (75%)"
                : "Defaulter Warning Triggered"}
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase">Credits Completed</span>
            <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {student.earnedCredits} / {student.totalCredits}
            </div>
            <span className="text-[10px] text-rose-primary dark:text-rose-light font-semibold">
              Degree Pacing on Schedule
            </span>
          </div>

          <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
            <span className="text-[10px] font-bold text-charcoal-500 uppercase">Financial Clearance</span>
            <div
              className={`text-2xl font-display font-bold mt-1 ${
                student.feeStatus === "PAID" ? "text-academic-success" : "text-academic-warning"
              }`}
            >
              {student.feeStatus}
            </div>
            <span className="text-[10px] text-charcoal-500 font-medium">
              {student.feeStatus === "PAID" ? "All Semester Dues Cleared" : "Pending Installment"}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border dark:border-charcoal-700 pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Dossier", icon: User },
            { id: "academics", label: "Courses & Grades", icon: GraduationCap },
            { id: "attendance", label: "Attendance Records", icon: Clock },
            { id: "finance", label: "Bursar Ledgers", icon: DollarSign },
            { id: "library", label: "Library Circulation", icon: Book },
            { id: "requests", label: "Requests & Petitions", icon: FileText },
            { id: "security", label: "Security & Sessions", icon: ShieldCheck },
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

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
              <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Enrollment Dossier
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Degree Program</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{student.program}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Department</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{student.departmentName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Academic Standing</span>
                  <span className="font-semibold text-academic-success">Good Standing (Honors)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Active Section</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{student.section}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
              <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                Guardian & Emergency Info
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Guardian on Record</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">Katherine Mercer (Mother)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Guardian Email</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">katherine.m@apex-family.org</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Emergency Phone</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">+1 (555) 019-2831</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50 dark:border-charcoal-700">
                  <span className="text-charcoal-500">Campus Residence</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">West Campus Hall B, Room 314</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "academics" && (
          <div className="space-y-6">
            {/* Courses */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                  Enrolled Course Curriculum ({student.courses.length} Courses)
                </span>
              </div>
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {student.courses.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-primary dark:text-rose-light">
                          {c.code}
                        </span>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {c.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-charcoal-500 mt-0.5 block">
                        Type: {c.type} • {c.credits} Credits
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exam Results */}
            <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
              <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                  Examination Marks & Grade Points
                </span>
              </div>
              {student.examResults.length === 0 ? (
                <div className="p-4 text-xs text-charcoal-500 italic">
                  No published examination records for this semester yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3.5">Course</th>
                        <th className="p-3.5">Examination</th>
                        <th className="p-3.5 text-right">Score</th>
                        <th className="p-3.5 text-center">Letter Grade</th>
                        <th className="p-3.5 text-right">Grade Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                      {student.examResults.map((r) => (
                        <tr key={r.id}>
                          <td className="p-3.5 font-mono font-bold text-charcoal-800 dark:text-ivory-200">
                            {r.courseCode}
                          </td>
                          <td className="p-3.5 text-charcoal-700 dark:text-charcoal-300">
                            {r.examTitle}
                          </td>
                          <td className="p-3.5 text-right font-bold text-charcoal-900 dark:text-ivory-100">
                            {r.marks} / {r.totalMarks}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                              {r.grade}
                            </span>
                          </td>
                          <td className="p-3.5 text-right font-bold text-rose-primary dark:text-rose-light">
                            {r.points.toFixed(1)}
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

        {activeTab === "attendance" && (
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Biometric Session Logs
              </span>
              <span className="text-[11px] text-charcoal-500">
                Aggregated Rate: {student.attendanceRate.toFixed(1)}%
              </span>
            </div>
            {student.attendanceRecords.length === 0 ? (
              <div className="p-4 text-xs text-charcoal-500 italic">
                No attendance logs found in database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-ivory-100 dark:bg-charcoal-900/60 border-b border-border dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Course Code</th>
                      <th className="p-3.5">Course Title</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 dark:divide-charcoal-700">
                    {student.attendanceRecords.map((a) => (
                      <tr key={a.id}>
                        <td className="p-3.5 font-mono font-bold text-charcoal-800 dark:text-ivory-200">
                          {a.courseCode}
                        </td>
                        <td className="p-3.5 text-charcoal-700 dark:text-charcoal-300">
                          {a.courseTitle}
                        </td>
                        <td className="p-3.5 text-charcoal-600 dark:text-charcoal-400">
                          {a.date}
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === "PRESENT"
                                ? "bg-academic-success-subtle text-academic-success"
                                : a.status === "LATE"
                                ? "bg-academic-warning-subtle text-academic-warning"
                                : "bg-academic-danger-subtle text-academic-danger"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "finance" && (
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Tuition & Fee Ledgers
              </span>
            </div>
            {student.fees.length === 0 ? (
              <div className="p-4 text-xs text-charcoal-500 italic">
                No fee accounts recorded for this student.
              </div>
            ) : (
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {student.fees.map((f) => (
                  <div key={f.id} className="p-5 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100 block text-sm">
                          {f.title}
                        </span>
                        <span className="text-charcoal-500">Due Date: {f.dueDate}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-charcoal-500 block text-[10px] uppercase">Paid / Total</span>
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                            ${f.paid.toLocaleString()} / ${f.total.toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            f.status === "PAID"
                              ? "bg-academic-success-subtle text-academic-success"
                              : "bg-academic-warning-subtle text-academic-warning"
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>
                    </div>

                    {f.transactions.length > 0 && (
                      <div className="mt-2 bg-surface-soft dark:bg-charcoal-900 p-3 rounded-xl text-xs space-y-1">
                        <span className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">
                          Payment Clearing History
                        </span>
                        {f.transactions.map((t) => (
                          <div key={t.id} className="flex justify-between text-[11px] text-charcoal-600 dark:text-charcoal-400">
                            <span className="font-mono">{t.reference}</span>
                            <span>${t.amount.toLocaleString()} via {t.method} on {t.date}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "library" && (
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border dark:border-charcoal-700 bg-surface-soft dark:bg-charcoal-800/80">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Active Library Loans & Reserved Textbooks
              </span>
            </div>
            {student.bookLoans.length === 0 ? (
              <div className="p-4 text-xs text-charcoal-500 italic">
                No active book loans recorded for this student.
              </div>
            ) : (
              <div className="divide-y divide-border/60 dark:divide-charcoal-700">
                {student.bookLoans.map((l) => (
                  <div key={l.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                        {l.title}
                      </span>
                      <span className="text-[11px] font-mono text-charcoal-500">
                        ISBN: {l.isbn} • Issued: {l.issuedAt}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-charcoal-500 block">Due: {l.dueDate}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-academic-warning-subtle text-academic-warning">
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Security & Sessions Tab ─── */}
        {activeTab === "security" && (
          <div className="flex flex-col gap-6">
            {/* Active Sessions */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-rose-primary" /> Active Sessions
                </h3>
                <button
                  onClick={handleRevokeAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Terminate All Other Devices
                </button>
              </div>
              {loadingSessions ? (
                <div className="text-xs text-charcoal-500 py-4 text-center">Loading sessions…</div>
              ) : userSessions.length === 0 ? (
                <div className="text-xs text-charcoal-500 py-4 text-center">
                  <button onClick={loadSessions} className="underline text-rose-primary">Load sessions</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {userSessions.map((session: any) => (
                    <div
                      key={session.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        session.isCurrent
                          ? "border-rose-primary/40 bg-rose-50 dark:bg-rose-900/10"
                          : "border-border dark:border-charcoal-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-charcoal-100 dark:bg-charcoal-700 flex items-center justify-center">
                          {session.deviceLabel?.toLowerCase().includes("mobile") ? (
                            <Smartphone className="h-4 w-4 text-charcoal-500" />
                          ) : (
                            <Laptop className="h-4 w-4 text-charcoal-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                            {session.deviceLabel || "Unknown Device"}
                            {session.isCurrent && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-primary text-white">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-charcoal-500">
                            IP: {session.ipAddress} • Last active: {new Date(session.lastActiveAt || session.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 border border-red-200 dark:border-red-800 px-2 py-1 rounded-lg"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                <KeyRound className="h-4 w-4 text-rose-primary" /> Change Password
              </h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
                <div>
                  <label className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-600 bg-ivory-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-primary/40"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-600 bg-ivory-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-primary/40"
                  />
                  {newPwd && <PasswordStrengthMeter password={newPwd} showCriteria className="mt-2" />}
                </div>
                <div>
                  <label className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-600 bg-ivory-50 dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-primary/40"
                  />
                </div>
                {pwdMsg && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                      pwdMsg.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 border border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800"
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {pwdMsg.text}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={changingPwd}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-primary text-white hover:bg-rose-deep transition-all disabled:opacity-50"
                >
                  {changingPwd ? "Updating…" : "Update Password"}
                </button>
              </form>
            </div>

            {/* Two-Factor Authentication (2FA) */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-primary" /> Two-Factor Authentication (2FA)
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Secure your scholar dossier using standard TOTP apps (Google Authenticator, Microsoft Authenticator, 1Password).
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  twoFactorInfo?.twoFactorEnabled
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800"
                    : "bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-600 dark:text-charcoal-300 border border-border"
                }`}>
                  {twoFactorInfo?.twoFactorEnabled ? "2FA ACTIVE" : "2FA INACTIVE"}
                </span>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-border/60 dark:border-charcoal-700">
                {twoFactorInfo?.twoFactorEnabled ? (
                  <button
                    onClick={handleDisable2FA}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800 transition-all"
                  >
                    Disable Two-Factor Authentication
                  </button>
                ) : (
                  <button
                    onClick={handleOpen2FASetup}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                  >
                    <QrCode className="h-4 w-4" /> Set Up Authenticator App
                  </button>
                )}
              </div>
            </div>

            {/* Privacy & Regulatory Compliance (GDPR & FERPA) */}
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-rose-primary" /> Privacy & Statutory Compliance
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Manage your data access rights compliant with GDPR Article 15/17 and FERPA educational privacy guidelines.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-academic-success-subtle text-academic-success">
                  FERPA & GDPR CERTIFIED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block mb-1">
                      Download Personal Data Archive
                    </span>
                    <p className="text-[11px] text-charcoal-500 leading-relaxed">
                      Download a cryptographically sealed JSON archive containing your complete profile, enrollment records, attendance logs, and fee transactions.
                    </p>
                  </div>
                  <a
                    href="/api/compliance/gdpr/export"
                    download
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-ivory-200 dark:bg-charcoal-700 hover:bg-rose-subtle dark:hover:bg-charcoal-600 text-charcoal-800 dark:text-ivory-100 transition-all border border-border dark:border-charcoal-600"
                  >
                    <Download className="h-3.5 w-3.5" /> Export My Data (JSON)
                  </a>
                </div>

                <div className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block mb-1">
                      Right to Erasure (GDPR Art. 17)
                    </span>
                    <p className="text-[11px] text-charcoal-500 leading-relaxed">
                      Cryptographically pseudonymize your personal identifiable information. Academic transcripts are preserved in compliance with education accreditation rules.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to request data erasure? This action will pseudonymize your account and log you out.")) {
                        fetch("/api/compliance/gdpr/erasure", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ confirmationText: "CONFIRM_ERASURE" }),
                        }).then(() => {
                          window.location.href = "/login?msg=data_erased";
                        });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 border border-red-200 dark:border-red-800 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Request Erasure
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Requests & Petitions Tab Content */}
        {activeTab === "requests" && (
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                    Academic Petitions &amp; Requests Desk
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Formal petitions for Leave of Absence, Attendance Discrepancies, Bonafide Certificates, and Transcripts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsNewRequestModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white shadow-xs transition-all shrink-0"
              >
                <span>+ New Academic Petition</span>
              </button>
            </div>

            {loadingRequests ? (
              <SkeletonTable rows={4} />
            ) : requests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No active petitions or requests"
                description="Scholars can submit formal leave petitions, attendance discrepancy reviews, and document requests here."
                actionLabel="Submit First Petition"
                onAction={() => setIsNewRequestModalOpen(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 shadow-soft flex flex-col justify-between gap-4 hover:shadow-card transition-all"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent uppercase">
                          {req.type.replace(/_/g, " ")}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "APPROVED"
                              ? "bg-academic-success-subtle text-academic-success border border-green-200"
                              : req.status === "REJECTED"
                              ? "bg-academic-danger-subtle text-academic-danger border border-red-200"
                              : "bg-academic-warning-subtle text-academic-warning border border-amber-200"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                        {req.title}
                      </h4>

                      {req.studentName && (
                        <div className="text-[11px] text-charcoal-600 dark:text-charcoal-400 font-medium">
                          Submitted by: <span className="font-bold text-charcoal-800 dark:text-ivory-200">{req.studentName}</span> ({req.rollNumber})
                        </div>
                      )}

                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400 bg-surface-soft dark:bg-charcoal-900/40 p-3 rounded-xl border border-border/70 dark:border-charcoal-700 leading-relaxed">
                        {req.reason}
                      </p>

                      {req.reviewerRemarks && (
                        <div className="p-2.5 rounded-xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-[11px] text-academic-success">
                          <span className="font-bold block">Authority Resolution:</span>
                          <span>{req.reviewerRemarks}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/60 dark:border-charcoal-700 text-[10px] text-charcoal-400">
                      <span>Logged: {new Date(req.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}</span>

                      <div className="flex items-center gap-2">
                        {req.status === "APPROVED" && (
                          <button
                            onClick={() => {
                              const printWindow = window.open("", "_blank");
                              if (!printWindow) return;
                              printWindow.document.write(`
                                <html>
                                  <head>
                                    <title>Academic Resolution Certificate - ${req.title}</title>
                                    <style>
                                      body { font-family: 'Times New Roman', serif; padding: 40px; color: #1e191c; line-height: 1.6; }
                                      .header { text-align: center; border-bottom: 2px solid #9B1B30; padding-bottom: 20px; margin-bottom: 30px; }
                                      .badge { color: #9B1B30; font-size: 22px; font-weight: bold; letter-spacing: 1px; }
                                      .title { font-size: 18px; font-weight: bold; margin: 20px 0; text-align: center; text-transform: uppercase; }
                                      .content { margin: 20px 0; font-size: 14px; }
                                      .meta { background: #fdf6f0; padding: 15px; border-left: 4px solid #9B1B30; margin: 20px 0; font-size: 13px; }
                                      .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
                                      .seal { border: 1px dashed #9B1B30; padding: 15px; text-align: center; border-radius: 8px; width: 180px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="header">
                                      <div class="badge">APEX UNIVERSITY ACADEMIC SENATE</div>
                                      <div style="font-size: 12px; color: #666;">OFFICE OF THE ACADEMIC REGISTRAR & DEAN OF STUDIES</div>
                                    </div>
                                    <div class="title">OFFICIAL RESOLUTION & ACTION CERTIFICATE</div>
                                    <div class="content">
                                      <p>This document certifies that the formal academic petition filed by <strong>${req.studentName || student?.name || "Candidate"}</strong> (Roll Number: <strong>${req.rollNumber || student?.rollNo || "N/A"}</strong>) has undergone official administrative review and has been officially granted.</p>
                                    </div>
                                    <div class="meta">
                                      <strong>Petition Title:</strong> ${req.title}<br/>
                                      <strong>Category:</strong> ${req.type.replace(/_/g, " ")}<br/>
                                      <strong>Filing Date:</strong> ${new Date(req.createdAt).toLocaleDateString()}<br/>
                                      <strong>Resolution Status:</strong> GRANTED & RATIFIED<br/>
                                      <strong>Dean / Faculty Finding:</strong> ${req.reviewerRemarks || "Approved as per Academic Regulations and Senate Standing Order."}
                                    </div>
                                    <div class="content">
                                      <p>The student information system and academic transcripts have been synchronized accordingly.</p>
                                    </div>
                                    <div class="footer">
                                      <div>
                                        <p>Certified Electronic Record</p>
                                        <p>Reference: RES-${req.id.substring(0, 8).toUpperCase()}</p>
                                      </div>
                                      <div class="seal">
                                        <strong>OFFICIALLY SEALED</strong><br/>
                                        Classroom Academic OS<br/>
                                        Verified Digitally
                                      </div>
                                    </div>
                                    <script>window.print();</script>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-academic-success-subtle text-academic-success border border-green-200 hover:bg-green-100 transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            <span>Resolution Certificate</span>
                          </button>
                        )}

                        {currentRole !== "STUDENT" && req.status === "SUBMITTED" && (
                          <button
                            onClick={() => {
                              setSelectedRequestForReview(req);
                              setReviewStatus("APPROVED");
                              setReviewRemarks("");
                              setIsReviewModalOpen(true);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-container dark:bg-rose-dark/30 hover:bg-rose-primary hover:text-white text-rose-primary dark:text-rose-accent transition-colors border border-rose-accent/30"
                          >
                            Review &amp; Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      <Modal
        isOpen={isNewRequestModalOpen}
        onClose={() => setIsNewRequestModalOpen(false)}
        title="Submit Academic Petition / Request"
        description="Formal student petitions are routed directly to assigned course faculty, academic advisors, and the Registrar."
      >
        <form onSubmit={handleCreateRequest} className="flex flex-col gap-3 mt-2">
          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Petition Category *
            </label>
            <select
              value={newRequestForm.type}
              onChange={(e) =>
                setNewRequestForm({
                  ...newRequestForm,
                  type: e.target.value as any,
                })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary font-medium"
            >
              <option value="LEAVE">Leave of Absence / Medical Exemption</option>
              <option value="ATTENDANCE_CORRECTION">Attendance Discrepancy Rectification</option>
              <option value="DOCUMENT_REQUEST">Official Transcript / Credential Request</option>
              <option value="CERTIFICATE">Course Completion / Degree Verification</option>
              <option value="ACADEMIC_CORRECTION">Grade Discrepancy Rectification</option>
              <option value="RE_EVALUATION">Formal Exam Script Re-evaluation / Scrutiny</option>
              <option value="ELECTIVE_CHANGE">Elective Course Switch / Add-Drop Petition</option>
              <option value="BONAFIDE">Bonafide Student Certificate</option>
              <option value="FEE_CONCESSION">Pastoral Fee Concession / Financial Aid</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Petition Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Medical Leave Request for Lab Session (Sept 24)"
              value={newRequestForm.title}
              onChange={(e) =>
                setNewRequestForm({ ...newRequestForm, title: e.target.value })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Detailed Justification / Statement of Facts *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide a comprehensive academic explanation, dates affected, and course codes..."
              value={newRequestForm.reason}
              onChange={(e) =>
                setNewRequestForm({ ...newRequestForm, reason: e.target.value })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Evidence Document URL (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. /documents/medical_certificate_2026.pdf"
              value={newRequestForm.attachmentUrl}
              onChange={(e) =>
                setNewRequestForm({ ...newRequestForm, attachmentUrl: e.target.value })
              }
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
            <button
              type="button"
              onClick={() => setIsNewRequestModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingRequest}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-dark text-white shadow-xs disabled:opacity-50"
            >
              {isSubmittingRequest ? "Submitting..." : "Submit Official Petition"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Request Modal (Faculty/Authority) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review Petition: ${selectedRequestForReview?.title || "Request"}`}
        description="Verify evidence and issue an official resolution recorded in the academic audit log."
      >
        <form onSubmit={handleReviewRequest} className="flex flex-col gap-3 mt-2">
          <div className="p-3 rounded-xl bg-surface-soft dark:bg-charcoal-900 text-xs">
            <span className="font-bold block text-charcoal-900 dark:text-ivory-100">
              {selectedRequestForReview?.studentName} ({selectedRequestForReview?.rollNumber})
            </span>
            <p className="text-charcoal-600 dark:text-charcoal-400 mt-1">
              {selectedRequestForReview?.reason}
            </p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Determination / Action *
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-bold focus:outline-none focus:border-rose-primary"
            >
              <option value="APPROVED">APPROVE — Grant Academic Exemption / Certificate</option>
              <option value="REJECTED">REJECT — Request Ineligible / Insufficient Evidence</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Authority Remarks / Justification Note
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Approved: Medical certificate verified by health center. Attendance record credited."
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 placeholder:text-charcoal-400 focus:outline-none focus:border-rose-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-charcoal-700">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:bg-surface-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingReview}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs disabled:opacity-50 ${
                reviewStatus === "APPROVED" ? "bg-academic-success hover:bg-green-700" : "bg-academic-danger hover:bg-red-700"
              }`}
            >
              {isSavingReview ? "Saving Decision..." : `Confirm ${reviewStatus}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* 2FA Setup Modal */}
      <Modal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        title="Set Up Two-Factor Authentication"
        description="Scan the QR code with Google Authenticator, Microsoft Authenticator, or 1Password."
      >
        {twoFactorInfo && (
          <div className="flex flex-col items-center gap-4 text-center">
            {twoFactorInfo.qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-2xl border-2 border-rose-primary/20 shadow-sm">
                <img
                  src={twoFactorInfo.qrCodeDataUrl}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-ivory-100 rounded-xl text-xs text-charcoal-500">
                Generating QR...
              </div>
            )}

            <div className="w-full text-left bg-ivory-50 dark:bg-charcoal-900 p-3 rounded-xl border border-border dark:border-charcoal-700 text-xs">
              <span className="text-[10px] font-bold text-charcoal-500 uppercase block mb-1">
                Manual Entry Secret Key:
              </span>
              <code className="font-mono font-bold text-rose-primary dark:text-rose-accent break-all select-all">
                {twoFactorInfo.secret}
              </code>
            </div>

            <form onSubmit={handleVerifyAndEnable2FA} className="w-full flex flex-col gap-3">
              <div className="text-left">
                <label className="text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Enter 6-digit Authenticator Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCodeInput}
                  onChange={(e) => setTwoFactorCodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 123456"
                  required
                  className="w-full px-3 py-2 text-center font-mono tracking-widest text-lg rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 outline-none focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              {twoFactorError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xs text-left border border-red-200 dark:border-red-800">
                  {twoFactorError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setIs2FAModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying2FA || twoFactorCodeInput.length !== 6}
                  className="px-4 py-2 text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {verifying2FA ? "Verifying..." : "Verify & Enable 2FA"}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

export default function Student360ProfilePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-6">
            <SkeletonCard />
          </div>
        </AppShell>
      }
    >
      <StudentProfileContent />
    </Suspense>
  );
}
