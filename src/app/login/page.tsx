"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ROLE_CONFIGS } from "@/lib/auth/roles";
import { UserRole } from "@/types/auth";
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  X,
  CheckCircle2,
  RotateCcw,
  Sun,
  Moon,
  Globe,
  Flame,
  Building2,
  Zap,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import PasswordStrengthMeter from "@/components/auth/PasswordStrengthMeter";
import { FirebaseAuthCard } from "@/components/auth/FirebaseAuthCard";
import { SupabaseAuthCard } from "@/components/auth/SupabaseAuthCard";

export default function LoginPage() {
  const router = useRouter();
  const { showToast, setCurrentRole, setAuthSession, theme, toggleTheme } = useApp();

  const [showDevSandbox, setShowDevSandbox] = useState<boolean>(false);
  const [sandboxTab, setSandboxTab] = useState<"TEST_OTP" | "PERSONAS">("TEST_OTP");
  const [email, setEmail] = useState("provost.evans@classroom.edu");
  const [password, setPassword] = useState("Classroom@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [fromRedirect, setFromRedirect] = useState<string | null>(null);

  // 2FA Challenge State
  const [pending2FA, setPending2FA] = useState<{
    email: string;
    role: UserRole;
    fullName: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [generatedResetToken, setGeneratedResetToken] = useState("");
  const [resetTokenInput, setResetTokenInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);

  // Must Change Password State
  const [showMustChangeModal, setShowMustChangeModal] = useState(false);
  const [changePwdInput, setChangePwdInput] = useState("");
  const [confirmChangePwdInput, setConfirmChangePwdInput] = useState("");
  const [changePwdError, setChangePwdError] = useState<string | null>(null);

  const [inactivityReason, setInactivityReason] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from");
      if (from && from.startsWith("/")) {
        setFromRedirect(from);
      }
      if (params.get("reason") === "inactivity") {
        setInactivityReason(true);
      }
    }
  }, []);

  const allPersonas: Array<{
    role: UserRole;
    title: string;
    email: string;
    category: "LEADERSHIP" | "ACADEMIC" | "LEARNERS" | "OPERATIONS";
    desc: string;
    badge: string;
  }> = [
    // 1. Leadership
    {
      role: "SUPER_ADMIN",
      title: "Super Administrator (Provost Elena Evans)",
      email: "provost.evans@classroom.edu",
      category: "LEADERSHIP",
      desc: "Full SaaS governance, multi-tenancy & audit logging",
      badge: "Root Control",
    },
    {
      role: "INSTITUTION_ADMIN",
      title: "Campus Registrar (Marcus Vance)",
      email: "admin@apex.edu",
      category: "LEADERSHIP",
      desc: "Campus operations, department provisioning & settings",
      badge: "Campus Admin",
    },
    {
      role: "PRINCIPAL",
      title: "Director (Arthur Pendleton)",
      email: "director@apex.edu",
      category: "LEADERSHIP",
      desc: "Executive BI, accreditation metrics & institutional GPA",
      badge: "Director",
    },
    {
      role: "HOD",
      title: "HOD Computer Science (Dr. Radhika Gupta)",
      email: "hod.cs@apex.edu",
      category: "LEADERSHIP",
      desc: "Department courses, faculty workload & scheduling",
      badge: "Dept Head",
    },

    // 2. Academic & Faculty
    {
      role: "FACULTY",
      title: "Faculty (Prof. Sarah Chen)",
      email: "sarah.chen@apex.edu",
      category: "ACADEMIC",
      desc: "Lectures, LMS modules, assignment grading & attendance",
      badge: "Professor",
    },
    {
      role: "CLASS_TEACHER",
      title: "Class Teacher (Prof. David Miller)",
      email: "david.miller@apex.edu",
      category: "ACADEMIC",
      desc: "Section mentoring, daily attendance audits & parent sync",
      badge: "Mentor",
    },

    // 3. Learners & Family
    {
      role: "STUDENT",
      title: "Scholar (Alex Mercer)",
      email: "alex.mercer@apex.edu",
      category: "LEARNERS",
      desc: "Student 360 dossier, coursework, hall tickets & careers",
      badge: "Scholar",
    },
    {
      role: "PARENT",
      title: "Parent (Katherine Mercer)",
      email: "katherine.mercer@gmail.com",
      category: "LEARNERS",
      desc: "Child attendance rate, term reports & bursar fee receipts",
      badge: "Guardian",
    },
    {
      role: "ALUMNI",
      title: "Alumni Member (Tariq Mansoor)",
      email: "tariq.alumni@techcorp.io",
      category: "LEARNERS",
      desc: "Alumni network, mentorship & transcript re-issue",
      badge: "Alumni",
    },

    // 4. Operations & Officers
    {
      role: "ACCOUNTANT",
      title: "Bursar & Finance Officer (Robert Sterling)",
      email: "bursar@apex.edu",
      category: "OPERATIONS",
      desc: "Tuition ledgers, offline fees & fellowship approvals",
      badge: "Finance",
    },
    {
      role: "EXAMINATION_CONTROLLER",
      title: "Exam Controller (Dr. Vikram Sarin)",
      email: "coe@apex.edu",
      category: "OPERATIONS",
      desc: "Exam schedules, hall tickets & official GPA transcripts",
      badge: "Exams",
    },
    {
      role: "PLACEMENT_OFFICER",
      title: "Placement Officer (Jessica Alvarez)",
      email: "careers@apex.edu",
      category: "OPERATIONS",
      desc: "Corporate recruitment drives, internships & applicant tracking",
      badge: "Placements",
    },
    {
      role: "LIBRARIAN",
      title: "Head Librarian (Eleanor Vane)",
      email: "library@apex.edu",
      category: "OPERATIONS",
      desc: "Book loans, ISBN cataloging & overdue fine calculations",
      badge: "Library",
    },
    {
      role: "RESEARCH_COORDINATOR",
      title: "Dean of Research (Dr. Alan Kowalski)",
      email: "research@apex.edu",
      category: "OPERATIONS",
      desc: "Funded research projects, grant reviews & publications",
      badge: "Research",
    },
    {
      role: "HR_STAFF",
      title: "HR & Staff Manager (Samantha Brooks)",
      email: "hr@apex.edu",
      category: "OPERATIONS",
      desc: "Faculty leave management, service books & personnel appraisals",
      badge: "HR Staff",
    },
    {
      role: "GUEST",
      title: "Auditor / Guest (ABET/NAAC Team)",
      email: "guest@accreditation-board.org",
      category: "OPERATIONS",
      desc: "Public course offerings & institutional campus inspection",
      badge: "Auditor",
    },
  ];

  const filteredPersonas = allPersonas.filter((p) => {
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleLogin = async (
    loginEmail: string,
    customPassword?: string,
    role?: UserRole,
    override2FACode?: string
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const pwd = customPassword !== undefined ? customPassword : password;
      const codeToSubmit = override2FACode !== undefined ? override2FACode : twoFactorCode;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: pwd,
          role,
          rememberMe,
          twoFactorCode: codeToSubmit || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.mustChangePassword) {
          setShowMustChangeModal(true);
          setPending2FA(null);
          setIsLoading(false);
          return;
        }

        if (data.requires2FA) {
          setPending2FA({
            email: data.email,
            role: data.role as UserRole,
            fullName: data.fullName,
          });
          showToast(`2FA required for privileged role (${data.role})`, "info");
          setIsLoading(false);
          return;
        }

        setPending2FA(null);
        setTwoFactorCode("");
        if (data.user) {
          setAuthSession(data.user);
        } else if (role) {
          setCurrentRole(role);
        }
        showToast(`Authenticated as ${data.user.fullName}!`, "success");
        const targetPath = fromRedirect || ROLE_CONFIGS[data.user.role as UserRole]?.dashboardPath || "/";
        router.push(targetPath);
        router.refresh();
      } else {
        setErrorMessage(data.error || "Authentication failed");
        showToast(data.error || "Login failed", "error");
      }
    } catch {
      setErrorMessage("Network error connecting to auth service");
      showToast("Network error connecting to auth service", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  const handleSendResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.resetToken) {
          setGeneratedResetToken(data.resetToken);
          setResetTokenInput(data.resetToken);
        }
        setForgotSuccessMsg(data.message || "Reset token generated successfully.");
        setForgotStep(2);
      } else {
        setForgotError(data.error || "Failed to initiate password reset.");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleApplyNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput !== confirmPasswordInput) {
      setForgotError("New passwords do not match.");
      return;
    }
    if (newPasswordInput.length < 8) {
      setForgotError("Password must be at least 8 characters long.");
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: resetTokenInput,
          newPassword: newPasswordInput,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Password updated successfully! You may now log in.", "success");
        setPassword(newPasswordInput);
        setEmail(forgotEmail);
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail("");
        setResetTokenInput("");
        setNewPasswordInput("");
        setConfirmPasswordInput("");
        setForgotSuccessMsg(null);
      } else {
        setForgotError(data.error || "Password reset verification failed.");
      }
    } catch {
      setForgotError("Network error during password reset.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleMustChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changePwdInput !== confirmChangePwdInput) {
      setChangePwdError("New passwords do not match.");
      return;
    }
    setChangePwdError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: password, newPassword: changePwdInput }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Password changed successfully.", "success");
        setShowMustChangeModal(false);
        setPassword(changePwdInput);
        setChangePwdInput("");
        setConfirmChangePwdInput("");
        handleLogin(email, changePwdInput); // re-login with new password
      } else {
        setChangePwdError(data.error || "Failed to change password.");
      }
    } catch {
      setChangePwdError("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 via-ivory-100 to-ivory-200 dark:from-charcoal-950 dark:via-charcoal-900 dark:to-charcoal-950 ambient-glow-mesh flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-charcoal-900 dark:text-ivory-100 transition-colors duration-300 relative selection:bg-rose-light selection:text-rose-primary">
      {/* Top Header Bar with Theme Switcher & Status */}
      <div className="absolute top-4 sm:top-6 left-4 right-4 sm:left-8 sm:right-8 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border border-border/80 dark:border-charcoal-800 shadow-soft text-[11px] font-semibold text-charcoal-600 dark:text-charcoal-300">
          <span className="h-2 w-2 rounded-full bg-academic-success animate-pulse" />
          <span>Apex Institute of Science & Technology</span>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-charcoal-900/80 hover:bg-white dark:hover:bg-charcoal-800 backdrop-blur-md border border-border/80 dark:border-charcoal-800 shadow-soft text-xs font-semibold text-charcoal-700 dark:text-ivory-200 transition-all hover:scale-105"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 text-charcoal-600" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 sm:mt-0">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-3xl bg-rose-primary text-white flex items-center justify-center shadow-elevated shadow-rose-primary/25 ring-4 ring-rose-primary/10">
            <GraduationCap className="h-9 w-9" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-display font-bold tracking-tight text-charcoal-900 dark:text-ivory-50">
          CLASSROOM ERP
        </h2>
        <p className="mt-1 text-center text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
          Autonomous Academic OS • Enterprise Multi-Tenant Core
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        {/* Unified Primary Login Card */}
        <div className="glass-panel py-8 px-6 shadow-elevated rounded-3xl sm:px-10 flex flex-col gap-6">
          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {inactivityReason && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>Session timed out due to inactivity. Please sign in again.</span>
            </div>
          )}

          {/* 2FA Challenge Box OR Standard Credentials Form */}
          {pending2FA ? (
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                      Two-Factor Authentication (2FA) Required
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                      Privileged Role
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                    Secondary authorization required for <strong className="text-rose-primary">{pending2FA.fullName}</strong> ({pending2FA.role}).
                  </p>
                </div>
              </div>

              {/* Master Emergency 2FA helper */}
              <div className="p-3 rounded-xl bg-white dark:bg-charcoal-900 border border-amber-200/70 dark:border-amber-900/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="text-charcoal-700 dark:text-charcoal-300">
                    Master Demo 2FA Passkey: <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded">260926</code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorCode("260926")}
                  className="text-[10px] font-bold text-rose-primary hover:underline px-2 py-1 rounded bg-rose-container/30"
                >
                  Auto-Fill
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="260926"
                  className="mt-1 block w-full tracking-widest text-center text-xl font-mono font-bold py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 focus:outline-none focus:ring-2 focus:ring-rose-primary"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPending2FA(null);
                    setTwoFactorCode("");
                  }}
                  className="w-1/3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 text-xs font-bold text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-100 dark:hover:bg-charcoal-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isLoading || twoFactorCode.length < 6}
                  onClick={() => handleLogin(pending2FA.email, password, pending2FA.role, twoFactorCode)}
                  className="w-2/3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark text-white text-xs font-bold shadow disabled:opacity-50 transition-colors"
                >
                  <span>{isLoading ? "Verifying Token..." : "Verify & Authorize Session"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Standard Unified Email + Password Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1">
                  Email Address
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    placeholder="example@gmail.com, name@college.edu"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setForgotError(null);
                      setForgotSuccessMsg(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-rose-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-10 py-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & From Redirect Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-charcoal-600 dark:text-charcoal-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-border text-rose-primary focus:ring-rose-primary h-4 w-4"
                  />
                  <span>Remember me (7 days)</span>
                </label>

                {fromRedirect && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    Redirecting to: <code className="bg-amber-100/60 dark:bg-amber-950/40 px-1 py-0.5 rounded">{fromRedirect}</code>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-rose-primary hover:bg-rose-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-primary transition-all duration-150 min-h-[44px]"
              >
                <span>{isLoading ? "Authenticating Session..." : "Sign In"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {/* Enterprise SSO Options */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2">
                <a
                  href="/api/auth/oauth/google"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900/60 hover:bg-ivory-50 dark:hover:bg-charcoal-800 text-[11px] font-semibold text-charcoal-700 dark:text-ivory-200 transition-all shadow-xs min-h-[38px]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google Workspace</span>
                </a>

                <a
                  href="/api/auth/oauth/microsoft"
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900/60 hover:bg-ivory-50 dark:hover:bg-charcoal-800 text-[11px] font-semibold text-charcoal-700 dark:text-ivory-200 transition-all shadow-xs min-h-[38px]"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 21 21">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
                  </svg>
                  <span>Microsoft 365</span>
                </a>
              </div>

              {/* Student Self-Registration CTA */}
              <div className="pt-2 text-center border-t border-border/60 dark:border-charcoal-700">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-primary dark:text-rose-accent hover:underline py-1"
                >
                  <span>Don&apos;t have an account? Create Account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </form>
          )}

          <div className="flex items-center justify-center gap-2 pt-1 border-t border-border/60 dark:border-charcoal-700 text-[11px] text-charcoal-500">
            <ShieldCheck className="h-4 w-4 text-academic-success" />
            <span>Encrypted HTTP-Only Token Session • Role-Based Access Control</span>
          </div>
        </div>

        {/* Developer & Sandbox Access Drawer (Preserved Test OTP & Personas) */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowDevSandbox(!showDevSandbox)}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-charcoal-900/70 border border-border/80 dark:border-charcoal-800 text-xs font-semibold text-charcoal-700 dark:text-charcoal-300 hover:bg-white dark:hover:bg-charcoal-800 transition-colors shadow-soft"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-primary" />
              <span>Developer &amp; Testing Sandbox (Test OTP &amp; 16 Personas)</span>
            </div>
            <span className="text-[11px] text-charcoal-500 font-mono">
              {showDevSandbox ? "Hide Sandbox ▲" : "Open Sandbox ▼"}
            </span>
          </button>

          {showDevSandbox && (
            <div className="mt-3 p-5 rounded-3xl bg-white/90 dark:bg-charcoal-800/90 border border-border dark:border-charcoal-700 shadow-elevated space-y-4">
              <div className="flex bg-charcoal-100/70 dark:bg-charcoal-900/60 p-1 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setSandboxTab("TEST_OTP")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    sandboxTab === "TEST_OTP"
                      ? "bg-rose-primary text-white shadow-sm"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-300" />
                    <span>Preserved Test OTP System</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSandboxTab("PERSONAS")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    sandboxTab === "PERSONAS"
                      ? "bg-rose-primary text-white shadow-sm"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900"
                  }`}
                >
                  <span className="flex items-center justify-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>16 Institutional Personas</span>
                  </span>
                </button>
              </div>

              {sandboxTab === "TEST_OTP" ? (
                <div className="pt-2">
                  <FirebaseAuthCard onSuccessRedirect={fromRedirect || undefined} />
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {/* Master Password Callout */}
                  <div className="bg-rose-container/30 dark:bg-charcoal-900/90 p-3 rounded-2xl border border-rose-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-rose-primary shrink-0" />
                      <span className="text-charcoal-700 dark:text-charcoal-200">
                        Master Password: <code className="font-bold text-rose-primary font-mono bg-white dark:bg-charcoal-800 px-1.5 py-0.5 rounded border border-rose-primary/30">Classroom@2026</code>
                      </span>
                    </div>
                    <span className="text-[10px] text-charcoal-500 font-medium">Valid for all 16 accounts</span>
                  </div>

                  {/* Category Filter Pills & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                      {[
                        { id: "ALL", label: "All Roles (16)" },
                        { id: "LEADERSHIP", label: "Leadership (4)" },
                        { id: "ACADEMIC", label: "Academic (2)" },
                        { id: "LEARNERS", label: "Learners (3)" },
                        { id: "OPERATIONS", label: "Operations (7)" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                            selectedCategory === cat.id
                              ? "bg-rose-primary text-white shadow-sm"
                              : "bg-ivory-100 dark:bg-charcoal-700/60 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container/50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search role, name, email..."
                      className="w-full sm:w-48 px-3 py-1 text-[11px] rounded-lg border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                    />
                  </div>

                  {/* 16 Roles Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
                    {filteredPersonas.map((persona) => (
                      <button
                        key={persona.role}
                        type="button"
                        onClick={() => {
                          setEmail(persona.email);
                          setPassword("Classroom@2026");
                          handleLogin(persona.email, "Classroom@2026", persona.role);
                        }}
                        disabled={isLoading}
                        className="flex items-start gap-2.5 p-2.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900/60 hover:bg-rose-container/40 dark:hover:bg-charcoal-700/60 border border-border dark:border-charcoal-700 text-left transition-all group"
                      >
                        <div className="h-7 w-7 rounded-lg bg-rose-container dark:bg-rose-primary/20 text-rose-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform mt-0.5">
                          <UserCheck className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[11px] text-charcoal-900 dark:text-ivory-100 truncate">
                              {persona.title}
                            </span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-primary/10 dark:bg-rose-primary/30 text-rose-primary shrink-0">
                              {persona.badge}
                            </span>
                          </div>
                          <span className="text-[10px] text-charcoal-500 block truncate font-mono">
                            {persona.email}
                          </span>
                          <span className="text-[9.5px] text-charcoal-400 dark:text-charcoal-500 block truncate mt-0.5">
                            {persona.desc}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl border border-border dark:border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                    Password Recovery
                  </h3>
                  <p className="text-[11px] text-charcoal-500">
                    Step {forgotStep} of 2: {forgotStep === 1 ? "Request Reset Token" : "Set New Password"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {forgotError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                <span>{forgotSuccessMsg}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleSendResetToken} className="space-y-4">
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  Enter your institutional email address. In local environment, the cryptographically signed reset token will be automatically populated.
                </p>
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Account Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@apex.edu"
                    className="mt-1 block w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-charcoal-600 dark:text-charcoal-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-bold shadow hover:bg-rose-dark disabled:opacity-50"
                  >
                    {forgotLoading ? "Generating..." : "Generate Reset Token"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleApplyNewPassword} className="space-y-3">
                {generatedResetToken && (
                  <div className="p-2 rounded-xl bg-rose-container/30 border border-rose-primary/20 text-[11px]">
                    <span className="text-charcoal-600 dark:text-charcoal-300 block font-medium">Auto-Captured Reset Token:</span>
                    <code className="text-rose-primary font-mono text-[10px] break-all select-all font-bold">
                      {generatedResetToken.slice(0, 32)}...
                    </code>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={resetTokenInput}
                    onChange={(e) => setResetTokenInput(e.target.value)}
                    required
                    placeholder="Paste reset token here"
                    className="mt-1 block w-full px-3 py-2 text-xs font-mono rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    New Password (Min 8 Characters)
                  </label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                    placeholder="Enter strong password"
                    className="mt-1 block w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                  />
                  {newPasswordInput && (
                    <PasswordStrengthMeter password={newPasswordInput} showCriteria={true} />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="mt-1 block w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-3 py-2 rounded-xl border border-border text-xs font-bold text-charcoal-600 dark:text-charcoal-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-bold shadow hover:bg-rose-dark disabled:opacity-50"
                  >
                    {forgotLoading ? "Updating..." : "Update Password & Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Must Change Password Mandatory Modal */}
      {showMustChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-charcoal-800 rounded-3xl shadow-2xl border border-border dark:border-charcoal-700 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  Mandatory Password Update
                </h3>
                <p className="text-[11px] text-charcoal-500">
                  First-time login or administrative policy requires setting a new password.
                </p>
              </div>
            </div>

            {changePwdError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{changePwdError}</span>
              </div>
            )}

            <form onSubmit={handleMustChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  New Secure Password
                </label>
                <input
                  type="password"
                  value={changePwdInput}
                  onChange={(e) => setChangePwdInput(e.target.value)}
                  required
                  placeholder="Enter new password"
                  className="mt-1 block w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                />
                {changePwdInput && (
                  <PasswordStrengthMeter password={changePwdInput} showCriteria={true} />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmChangePwdInput}
                  onChange={(e) => setConfirmChangePwdInput(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="mt-1 block w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 focus:ring-2 focus:ring-rose-primary"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMustChangeModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-charcoal-600 dark:text-charcoal-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-rose-primary text-white text-xs font-bold shadow hover:bg-rose-dark disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Update & Sign In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
