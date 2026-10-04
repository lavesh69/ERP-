"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import PasswordStrengthMeter, { evaluatePassword } from "@/components/auth/PasswordStrengthMeter";
import {
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  BookOpen,
  Briefcase,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Award,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface UserProfileResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phone: string;
    avatarUrl: string;
    role: string;
    institutionName: string;
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  profile: any;
}

export default function ProfileHubPage() {
  const { showToast, currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "security">("personal");

  // Base profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [institutionName, setInstitutionName] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // Role-specific fields
  // Faculty
  const [officeRoom, setOfficeRoom] = useState("");
  const [designation, setDesignation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(18);
  const [employeeCode, setEmployeeCode] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  // Student
  const [rollNumber, setRollNumber] = useState("");
  const [programName, setProgramName] = useState("");
  const [currentSemester, setCurrentSemester] = useState(1);
  const [cgpa, setCgpa] = useState<number>(0.0);
  const [attendanceRate, setAttendanceRate] = useState<number>(100.0);

  // Parent
  const [relation, setRelation] = useState("GUARDIAN");
  const [occupation, setOccupation] = useState("");

  // Security tab state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data: UserProfileResponse = await res.json();
        const u = data.user;
        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setRole(u.role || "STUDENT");
        setInstitutionName(u.institutionName || "Apex Institute of Science & Technology");
        setCreatedAt(u.createdAt || "");

        if (data.profile) {
          const p = data.profile;
          if (u.role === "FACULTY" || u.role === "PROFESSOR" || u.role === "HOD") {
            setOfficeRoom(p.officeRoom || "");
            setDesignation(p.designation || "Assistant Professor");
            setSpecialization(p.specialization || "");
            setQualification(p.qualification || "");
            setWeeklyHours(p.weeklyHours || 18);
            setEmployeeCode(p.employeeCode || "");
            setDepartmentName(p.departmentName || "Computer Science");
          } else if (u.role === "STUDENT") {
            setRollNumber(p.rollNumber || "");
            setProgramName(p.programName || "B.Tech Computer Science");
            setCurrentSemester(p.currentSemester || 1);
            setCgpa(p.cgpa || 0.0);
            setAttendanceRate(p.attendanceRate || 100.0);
            setDepartmentName(p.departmentName || "Computer Science");
          } else if (u.role === "PARENT") {
            setRelation(p.relation || "GUARDIAN");
            setOccupation(p.occupation || "");
          }
        }
      } else {
        // Fallback to Context User
        if (currentUser) {
          setFirstName(currentUser.firstName || "");
          setLastName(currentUser.lastName || "");
          setEmail(currentUser.email || "");
          setRole(currentUser.role || "STUDENT");
        }
      }
    } catch {
      showToast("Error retrieving profile dossier", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        firstName,
        lastName,
        phone,
      };

      if (role === "FACULTY" || role === "PROFESSOR" || role === "HOD") {
        payload.officeRoom = officeRoom;
        payload.designation = designation;
        payload.specialization = specialization;
        payload.qualification = qualification;
        payload.weeklyHours = Number(weeklyHours);
      } else if (role === "STUDENT") {
        payload.currentSemester = Number(currentSemester);
      } else if (role === "PARENT") {
        payload.relation = relation;
        payload.occupation = occupation;
      }

      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Profile dossier updated and synced successfully!", "success");
        fetchProfile();
      } else {
        showToast(data.error || "Failed to update profile", "danger");
      }
    } catch {
      showToast("Network error saving profile changes", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "danger");
      return;
    }

    const { metCount } = evaluatePassword(newPassword);
    if (metCount < 3) {
      showToast("New password does not satisfy security strength policy", "danger");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Security password updated successfully!", "success");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.error || "Failed to change password", "danger");
      }
    } catch {
      showToast("Network error changing password", "danger");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "My Profile & Identity Hub" },
          ]}
        />

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* Header Identity Card */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-rose-primary/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center text-3xl font-display font-bold shadow-lg shadow-rose-primary/25 shrink-0">
                  {firstName && lastName ? `${firstName[0]}${lastName[0]}` : "U"}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {firstName} {lastName}
                    </h1>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-primary text-white shadow-xs">
                      {role.replace("_", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Active Member
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
                    {institutionName} • Registered Since {createdAt || "2026"}
                  </p>

                  <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-charcoal-600 dark:text-charcoal-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-rose-primary" />
                      <span className="font-mono">{email}</span>
                    </div>
                    {phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-rose-primary" />
                        <span>{phone}</span>
                      </div>
                    )}
                    {employeeCode && (
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Emp ID: <strong>{employeeCode}</strong></span>
                      </div>
                    )}
                    {rollNumber && (
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Roll No: <strong>{rollNumber}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex rounded-2xl bg-ivory-100 dark:bg-charcoal-900 p-1.5 border border-border dark:border-charcoal-700 max-w-md">
              <button
                type="button"
                onClick={() => setActiveTab("personal")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "personal"
                    ? "bg-rose-primary text-white shadow-xs"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                <span>Personal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("academic")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "academic"
                    ? "bg-rose-primary text-white shadow-xs"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Academic & Role</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "security"
                    ? "bg-rose-primary text-white shadow-xs"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Security</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === "personal" && (
              <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                <div>
                  <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100">
                    Personal Identity & Contact Information
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Update your primary personal profile credentials stored in the institutional ledger.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-200/50 dark:bg-charcoal-800/50 text-xs font-semibold opacity-70 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-charcoal-500 mt-1 block">
                      Email address is managed by institutional authentication authority.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Mobile / WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 (555) 018-4921"
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Saving Changes..." : "Save Personal Profile"}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === "academic" && (
              <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                <div>
                  <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100">
                    Academic Role & Institutional Specifications
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Configure your teaching credentials, department designations, and student parameters.
                  </p>
                </div>

                {/* FACULTY PROFILE CONFIGURATION */}
                {(role === "FACULTY" || role === "PROFESSOR" || role === "HOD") && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Academic Designation
                        </label>
                        <select
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        >
                          <option value="Assistant Professor">Assistant Professor</option>
                          <option value="Associate Professor">Associate Professor</option>
                          <option value="Professor">Professor</option>
                          <option value="Head of Department">Head of Department (HOD)</option>
                          <option value="Senior Lecturer">Senior Lecturer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Office Room / Cabin Location
                        </label>
                        <input
                          type="text"
                          value={officeRoom}
                          onChange={(e) => setOfficeRoom(e.target.value)}
                          placeholder="e.g. Science Block C, Cabin 402"
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Highest Academic Qualification
                        </label>
                        <input
                          type="text"
                          value={qualification}
                          onChange={(e) => setQualification(e.target.value)}
                          placeholder="e.g. Ph.D. in Computer Science & AI"
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Domain Specialization
                        </label>
                        <input
                          type="text"
                          value={specialization}
                          onChange={(e) => setSpecialization(e.target.value)}
                          placeholder="e.g. Distributed Systems & Machine Learning"
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Weekly Teaching Load (Hours)
                        </label>
                        <input
                          type="number"
                          value={weeklyHours}
                          onChange={(e) => setWeeklyHours(Number(e.target.value))}
                          min={6}
                          max={36}
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Department
                        </label>
                        <input
                          type="text"
                          value={departmentName}
                          disabled
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-200/50 dark:bg-charcoal-800/50 text-xs font-semibold opacity-70 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STUDENT PROFILE CONFIGURATION */}
                {role === "STUDENT" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Degree & Program
                        </label>
                        <input
                          type="text"
                          value={programName}
                          disabled
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-200/50 dark:bg-charcoal-800/50 text-xs font-semibold opacity-70 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Current Semester
                        </label>
                        <select
                          value={currentSemester}
                          onChange={(e) => setCurrentSemester(Number(e.target.value))}
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <option key={s} value={s}>
                              Semester {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Recorded CGPA
                        </label>
                        <div className="mt-1 p-2.5 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs font-bold text-rose-primary">
                          {cgpa.toFixed(2)} / 4.00 (Senate Verified)
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          Biometric Attendance Standing
                        </label>
                        <div className="mt-1 p-2.5 rounded-xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {attendanceRate.toFixed(1)}% Satisfactory
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PARENT PROFILE CONFIGURATION */}
                {role === "PARENT" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                        Relationship to Ward
                      </label>
                      <select
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      >
                        <option value="FATHER">Father</option>
                        <option value="MOTHER">Mother</option>
                        <option value="GUARDIAN">Legal Guardian</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                        Primary Occupation
                      </label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Software Architect, Physician"
                        className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? "Saving Changes..." : "Save Academic Specifications"}</span>
                  </button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <form onSubmit={handleChangePassword} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                <div>
                  <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100">
                    Account Security & Credentials
                  </h3>
                  <p className="text-xs text-charcoal-500 mt-0.5">
                    Update your account password following NIST SP 800-63B standards.
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                      placeholder="Enter current password"
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter at least 8 characters"
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                    {newPassword && <PasswordStrengthMeter password={newPassword} />}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Lock className="h-4 w-4" />
                    <span>{changingPassword ? "Updating Password..." : "Update Security Password"}</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
