"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import PasswordStrengthMeter, { evaluatePassword } from "@/components/auth/PasswordStrengthMeter";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Phone,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useApp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [programCode, setProgramCode] = useState("BTECH-CS");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<{
    email: string;
    applicationNumber: string;
    fullName: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter.");
      return;
    }

    const { metCount } = evaluatePassword(password);
    if (metCount < 3) {
      setErrorMessage("Please choose a stronger password satisfying at least 3 security rules.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          programCode,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Application registered successfully!", "success");
        setRegisteredData({
          email: data.user.email,
          applicationNumber: data.user.applicationNumber,
          fullName: data.user.fullName,
        });
      } else {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        showToast(data.error || "Registration error", "error");
      }
    } catch {
      setErrorMessage("Network error connecting to admissions server.");
      showToast("Network error", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 via-ivory-100 to-ivory-200 dark:from-charcoal-950 dark:via-charcoal-900 dark:to-charcoal-950 ambient-glow-mesh flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-charcoal-900 dark:text-ivory-100 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-rose-primary text-white flex items-center justify-center shadow-lg shadow-rose-primary/30">
            <GraduationCap className="h-9 w-9" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-display font-bold tracking-tight">
          ADMISSIONS PORTAL
        </h2>
        <p className="mt-1 text-center text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
          Apex Institute of Science & Technology • Scholar Self-Registration
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="glass-panel py-8 px-6 shadow-elevated rounded-3xl sm:px-10">
          {registeredData ? (
            /* Success State */
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                  Application Dossier Created!
                </h3>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                  Welcome to Apex Institute, <strong>{registeredData.fullName}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-container/30 border border-rose-primary/20 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 font-medium">Application Number:</span>
                  <span className="font-mono font-bold text-rose-primary text-sm">
                    {registeredData.applicationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 font-medium">Registered Email:</span>
                  <span className="font-mono font-semibold text-charcoal-800 dark:text-charcoal-200">
                    {registeredData.email}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 font-medium">Assigned Role:</span>
                  <span className="font-semibold text-xs px-2 py-0.5 rounded bg-rose-primary text-white">
                    Scholar (STUDENT)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow text-xs font-bold text-white bg-rose-primary hover:bg-rose-dark transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    First Name
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      placeholder="e.g. Maya"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Last Name
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder="e.g. Sharma"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Applicant Email Address
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="maya.applicant@gmail.com"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Contact Phone (Optional)
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Degree Program */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                  Target Academic Degree Program
                </label>
                <div className="mt-1 relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <select
                    value={programCode}
                    onChange={(e) => setProgramCode(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                  >
                    <option value="BTECH-CS">B.Tech - Computer Science & Engineering</option>
                    <option value="BTECH-MECH">B.Tech - Mechanical Engineering & Robotics</option>
                    <option value="BTECH-EE">B.Tech - Electrical & Electronics Engineering</option>
                    <option value="MBA-TECH">MBA - Technology & Business Leadership</option>
                    <option value="MS-DATA">M.S. - Applied Artificial Intelligence & Data Science</option>
                  </select>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Create Password
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Min 8 characters"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
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

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat password"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Password strength meter */}
              <PasswordStrengthMeter password={password} />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-xs font-bold text-white bg-rose-primary hover:bg-rose-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-primary transition-all duration-150"
              >
                <span>{isLoading ? "Provisioning Student Account..." : "Submit Admission Registration"}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="text-center pt-2 border-t border-border dark:border-charcoal-700 text-xs">
                <span className="text-charcoal-500">Already registered or faculty member? </span>
                <Link href="/login" className="font-bold text-rose-primary hover:underline">
                  Sign In to ERP
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
