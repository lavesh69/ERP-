import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { UserRole } from "@/types";

import { sanitizeRedirectPath, checkClientRateLimit, recordSecurityAudit } from "@/lib/security";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle, selectedRole, setSelectedRole, isLoading, error, clearError } = useAuth();

  const [authInProgress, setAuthInProgress] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // 1. Sanitize redirect destination against Open-Redirect attacks
  const rawTarget = (location.state as any)?.from?.pathname || "/dashboard";
  const from = sanitizeRedirectPath(rawTarget, "/dashboard");

  // Check for inactivity timeout query parameter
  const isTimeout = new URLSearchParams(location.search).get("timeout") === "inactivity";

  // If already authenticated, redirect to safe destination
  React.useEffect(() => {
    if (user && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  const handleGoogleLogin = async () => {
    // 2. Anti-Brute-Force & Flood Rate Limiter
    const rateCheck = checkClientRateLimit("google_sign_in", 5, 60000, 120000);
    if (!rateCheck.allowed) {
      setRateLimitError(`Security lock active: Too many authentication requests. Please wait ${rateCheck.retryAfterSeconds} seconds.`);
      recordSecurityAudit("LOGIN_RATE_LIMITED", { retryAfter: rateCheck.retryAfterSeconds });
      return;
    }

    setRateLimitError(null);
    setAuthInProgress(true);
    clearError();

    try {
      const profile = await signInWithGoogle();
      if (profile) {
        recordSecurityAudit("LOGIN_SUCCESS", { uid: profile.uid, role: profile.role });
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      recordSecurityAudit("LOGIN_ERROR", { message: err?.message });
    } finally {
      setAuthInProgress(false);
    }
  };

  const roleOptions: { role: UserRole; title: string; desc: string }[] = [
    { role: "STUDENT", title: "Scholar", desc: "Access enrolled courses, exams, attendance & timetable" },
    { role: "FACULTY", title: "Faculty", desc: "Manage classes, grade assignments & lecture schedules" },
    { role: "INSTITUTION_ADMIN", title: "Administrator", desc: "Campus governance, academic calendar & staff records" },
    { role: "PARENT", title: "Guardian", desc: "Monitor student progress, attendance alerts & transcripts" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 via-ivory-100 to-ivory-200 dark:from-charcoal-950 dark:via-charcoal-900 dark:to-charcoal-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-charcoal-900 dark:text-ivory-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-3xl bg-rose-primary text-white flex items-center justify-center shadow-elevated shadow-rose-primary/25 ring-4 ring-rose-primary/10">
            <GraduationCap className="h-9 w-9" />
          </div>
        </div>

        <h2 className="mt-5 text-center text-3xl font-display font-bold tracking-tight text-charcoal-900 dark:text-ivory-50">
          CLASSROOM ERP
        </h2>
        <p className="mt-1.5 text-center text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
          Autonomous Academic OS • Firebase Authentication Core
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-charcoal-900 py-8 px-6 shadow-elevated rounded-3xl sm:px-10 border border-border dark:border-charcoal-800 flex flex-col gap-6">
          {/* Security Guarantee Badge */}
          <div className="p-3 rounded-2xl bg-rose-container/50 dark:bg-rose-dark/20 border border-rose-accent/30 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-rose-primary dark:text-rose-accent shrink-0 mt-0.5" />
            <div className="text-xs text-charcoal-700 dark:text-ivory-200 leading-relaxed">
              <span className="font-bold text-rose-primary dark:text-rose-accent">
                Production-Ready Google Authentication
              </span>
              <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 mt-0.5">
                Zero passwords stored • Firebase OAuth 2.0 Token Isolation • Cloud Firestore Sync
              </p>
            </div>
          </div>

          {/* Inactivity Auto-Logout Banner */}
          {isTimeout && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">Session Timed Out:</span> You have been securely signed out due to inactivity on a shared campus workstation. Please sign in again.
              </div>
            </div>
          )}

          {/* Rate Limiting Protection Banner */}
          {rateLimitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">Rate Limit Enforced:</span> {rateLimitError}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-academic-danger/10 border border-academic-danger/30 text-academic-danger text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-bold">Authentication Notice:</span> {error}
              </div>
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300 block mb-2">
              Select Initial Academic Role:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((opt) => (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => setSelectedRole(opt.role)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedRole === opt.role
                      ? "bg-rose-container border-rose-primary dark:bg-rose-dark/30 dark:border-rose-accent shadow-sm"
                      : "bg-ivory-50 dark:bg-charcoal-800 border-border dark:border-charcoal-700 hover:bg-ivory-100"
                  }`}
                >
                  <div className="font-bold text-xs text-charcoal-900 dark:text-ivory-100 flex items-center justify-between">
                    <span>{opt.title}</span>
                    {selectedRole === opt.role && (
                      <CheckCircle2 className="h-3 w-3 text-rose-primary dark:text-rose-accent" />
                    )}
                  </div>
                  <p className="text-[10px] text-charcoal-500 dark:text-charcoal-400 line-clamp-1 mt-0.5">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={authInProgress || isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white dark:bg-charcoal-800 border-2 border-border dark:border-charcoal-700 hover:border-rose-primary hover:bg-ivory-50 dark:hover:bg-charcoal-700 text-charcoal-900 dark:text-ivory-100 font-bold text-xs shadow-soft transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {authInProgress ? "Connecting with Google..." : "Sign in with Google"}
              </span>
              <ArrowRight className="h-4 w-4 ml-auto text-charcoal-400" />
            </button>
          </div>

          {/* Self-Registration Notice & Link */}
          <div className="pt-2 text-center border-t border-stone-100 dark:border-stone-800">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              New Scholar, Faculty or Staff member?{" "}
              <Link to="/register" className="font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400">
                Self-Register for Approval →
              </Link>
            </p>
          </div>

          {/* Privacy & Compliance Assurance */}
          <div className="pt-2 border-t border-border/60 dark:border-charcoal-800 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-charcoal-500">
              <ShieldCheck className="h-3.5 w-3.5 text-academic-success" />
              <span>OAuth 2.0 Protected • Cloud Firestore Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
