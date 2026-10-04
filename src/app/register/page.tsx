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
  Briefcase,
  Building,
  Award,
  MapPin,
  Users,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useApp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<
    "STUDENT" | "FACULTY" | "PARENT" | "ALUMNI" | "HR_STAFF"
  >("STUDENT");

  // Student specific
  const [programCode, setProgramCode] = useState("BTECH-CS");
  const [currentSemester, setCurrentSemester] = useState(1);

  // Faculty specific
  const [departmentCode, setDepartmentCode] = useState("CSE");
  const [designation, setDesignation] = useState("Assistant Professor");
  const [qualification, setQualification] = useState("Ph.D. / M.Tech in Discipline");
  const [specialization, setSpecialization] = useState("Computer Systems & AI");
  const [officeRoom, setOfficeRoom] = useState("Academic Block A, Cabin 302");
  const [employeeCode, setEmployeeCode] = useState("");

  // Parent specific
  const [wardRollNumber, setWardRollNumber] = useState("");
  const [relation, setRelation] = useState<"FATHER" | "MOTHER" | "GUARDIAN">("GUARDIAN");

  // Alumni specific
  const [graduationBatch, setGraduationBatch] = useState(2024);
  const [degree, setDegree] = useState("B.Tech in Computer Science");
  const [currentCompany, setCurrentCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  // Passwords
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<{
    email: string;
    identifier?: string;
    fullName: string;
    role: string;
    detail?: string;
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
      const payload: any = {
        firstName,
        lastName,
        email,
        phone,
        role,
        password,
      };

      if (role === "STUDENT") {
        payload.programCode = programCode;
        payload.currentSemester = Number(currentSemester);
      } else if (role === "FACULTY") {
        payload.departmentCode = departmentCode;
        payload.designation = designation;
        payload.qualification = qualification;
        payload.specialization = specialization;
        payload.officeRoom = officeRoom;
        if (employeeCode) payload.employeeCode = employeeCode;
      } else if (role === "PARENT") {
        payload.wardRollNumber = wardRollNumber;
        payload.relation = relation;
      } else if (role === "ALUMNI") {
        payload.graduationBatch = Number(graduationBatch);
        payload.degree = degree;
        payload.currentCompany = currentCompany;
        payload.jobTitle = jobTitle;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message || "Account registered successfully!", "success");
        setRegisteredData({
          email: data.user.email,
          identifier:
            data.user.employeeCode ||
            data.user.applicationNumber ||
            data.user.id,
          fullName: data.user.fullName,
          role: data.user.role || role,
          detail: data.user.department || data.user.program || undefined,
        });
      } else {
        setErrorMessage(data.error || "Registration failed. Please try again.");
        showToast(data.error || "Registration error", "error");
      }
    } catch {
      setErrorMessage("Network error connecting to institutional registry.");
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
          CLASSROOM ERP
        </h2>
        <p className="mt-1 text-center text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
          Institutional Member Self-Registration & Profile Onboarding
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
                  Profile Registered Successfully!
                </h3>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
                  Welcome to Apex Institute, <strong>{registeredData.fullName}</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-container/30 border border-rose-primary/20 text-left space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 font-medium">Profile Reference / Code:</span>
                  <span className="font-mono font-bold text-rose-primary text-sm">
                    {registeredData.identifier}
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
                  <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full bg-rose-primary text-white">
                    {registeredData.role}
                  </span>
                </div>
                {registeredData.detail && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-charcoal-500 font-medium">Department / Unit:</span>
                    <span className="font-semibold text-charcoal-700 dark:text-charcoal-300">
                      {registeredData.detail}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow text-xs font-bold text-white bg-rose-primary hover:bg-rose-dark transition-all cursor-pointer"
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

              {/* Multi-Role Switcher Tabs */}
              <div>
                <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 mb-1.5">
                  Select Your Member Role
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700">
                  <button
                    type="button"
                    onClick={() => setRole("STUDENT")}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === "STUDENT"
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("FACULTY")}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === "FACULTY"
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span>Teacher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("PARENT")}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === "PARENT"
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <Users className="h-3.5 w-3.5 shrink-0" />
                    <span>Parent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("ALUMNI")}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      role === "ALUMNI"
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <Award className="h-3.5 w-3.5 shrink-0" />
                    <span>Alumni</span>
                  </button>
                </div>
              </div>

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
                    Email Address
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
                      placeholder="e.g. member@apex.edu"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Phone Number
                  </label>
                  <div className="mt-1 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 (555) 019-2834"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>
              </div>

              {/* ROLE SPECIFIC FIELDS */}
              {/* 1. STUDENT FIELDS */}
              {role === "STUDENT" && (
                <div className="p-3.5 rounded-2xl bg-rose-container/20 border border-rose-primary/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-primary">
                    <GraduationCap className="h-4 w-4" />
                    <span>Student Academic Program Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Academic Program
                      </label>
                      <select
                        value={programCode}
                        onChange={(e) => setProgramCode(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        <option value="BTECH-CS">B.Tech in Computer Science & Engineering</option>
                        <option value="BTECH-AI">B.Tech in Artificial Intelligence & ML</option>
                        <option value="BTECH-EC">B.Tech in Electronics & Communication</option>
                        <option value="MBA-FIN">MBA in Finance & Business Analytics</option>
                        <option value="BSC-DS">B.Sc in Data Science</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Current Semester
                      </label>
                      <select
                        value={currentSemester}
                        onChange={(e) => setCurrentSemester(Number(e.target.value))}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                          <option key={s} value={s}>
                            Semester {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. FACULTY FIELDS */}
              {role === "FACULTY" && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <BookOpen className="h-4 w-4" />
                    <span>Teacher Academic Dossier Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Department
                      </label>
                      <select
                        value={departmentCode}
                        onChange={(e) => setDepartmentCode(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        <option value="CSE">Computer Science & Engineering</option>
                        <option value="ECE">Electronics & Communication</option>
                        <option value="MECH">Mechanical Engineering</option>
                        <option value="MATH">Mathematics & Computational Science</option>
                        <option value="MGMT">School of Business Management</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Academic Designation
                      </label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Senior Lecturer">Senior Lecturer</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Highest Qualification
                      </label>
                      <input
                        type="text"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. Ph.D. in Computer Science (MIT)"
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Office Room / Cabin
                      </label>
                      <input
                        type="text"
                        value={officeRoom}
                        onChange={(e) => setOfficeRoom(e.target.value)}
                        placeholder="e.g. Block A, Cabin 304"
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PARENT FIELDS */}
              {role === "PARENT" && (
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                    <Users className="h-4 w-4" />
                    <span>Parent / Guardian Ward Linkage</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Relationship
                      </label>
                      <select
                        value={relation}
                        onChange={(e) => setRelation(e.target.value as any)}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        <option value="FATHER">Father</option>
                        <option value="MOTHER">Mother</option>
                        <option value="GUARDIAN">Legal Guardian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Ward Roll Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={wardRollNumber}
                        onChange={(e) => setWardRollNumber(e.target.value)}
                        placeholder="e.g. 2024-CSE-042"
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. ALUMNI FIELDS */}
              {role === "ALUMNI" && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                    <Award className="h-4 w-4" />
                    <span>Alumni Network Information</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Graduation Batch Year
                      </label>
                      <input
                        type="number"
                        value={graduationBatch}
                        onChange={(e) => setGraduationBatch(Number(e.target.value))}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Current Company / Employer
                      </label>
                      <input
                        type="text"
                        value={currentCompany}
                        onChange={(e) => setCurrentCompany(e.target.value)}
                        placeholder="e.g. Google, Stripe, Microsoft"
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Job Title / Designation
                      </label>
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300">
                        Degree Conferred
                      </label>
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Security Password
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
                      placeholder="Minimum 8 characters"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && <PasswordStrengthMeter password={password} />}
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
                      placeholder="Re-enter password"
                      className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-100 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-rose-primary hover:bg-rose-dark active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Registering Member Profile...</span>
                ) : (
                  <>
                    <span>Create My Profile & Register</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-charcoal-500">Already registered with an institutional account? </span>
                <Link
                  href="/login"
                  className="text-xs font-bold text-rose-primary dark:text-rose-accent hover:underline cursor-pointer"
                >
                  Sign In Directly
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
