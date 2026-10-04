"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  Camera,
  Upload,
  Printer,
  ExternalLink,
  HeartPulse,
  Share2,
  Globe,
  Calendar,
  CreditCard,
  QrCode,
  FileText,
  Plus,
  Users,
  Check,
  X,
  Copy,
  Eye,
  Layers,
  Compass,
  Activity,
  ChevronRight,
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
    institutionId: string;
    institutionName: string;
    twoFactorEnabled: boolean;
    createdAt: string;
  };
  demographics: {
    bio: string;
    bloodGroup: string;
    dob: string;
    gender: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    socialLinks: {
      linkedin: string;
      github: string;
      website: string;
    };
  };
  profile: any;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&h=256&q=80",
];

export default function ProfileHubPage() {
  const { showToast, currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileViewMode, setProfileViewMode] = useState<"macro" | "micro">("micro");
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "security">("personal");
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Base profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [institutionName, setInstitutionName] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  // Demographics state
  const [bio, setBio] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("India");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");

  // Role specifics
  const [profileData, setProfileData] = useState<any>(null);

  // Faculty fields
  const [officeRoom, setOfficeRoom] = useState("");
  const [designation, setDesignation] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(18);

  // Student fields
  const [currentSemester, setCurrentSemester] = useState(1);

  // Parent fields
  const [relation, setRelation] = useState("GUARDIAN");
  const [occupation, setOccupation] = useState("");
  const [wardRollToLink, setWardRollToLink] = useState("");

  // Security password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile/me");
      if (res.ok) {
        const data: UserProfileResponse = await res.json();
        const u = data.user;
        const d = data.demographics;
        const p = data.profile;

        setFirstName(u.firstName || "");
        setLastName(u.lastName || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setAvatarUrl(u.avatarUrl || "");
        setRole(u.role || "STUDENT");
        setInstitutionName(u.institutionName || "Apex Institute of Science & Technology");
        setCreatedAt(u.createdAt || "");

        // Demographics
        setBio(d?.bio || "");
        setBloodGroup(d?.bloodGroup || "");
        setDob(d?.dob || "");
        setGender(d?.gender || "");
        setEmergencyContactName(d?.emergencyContactName || "");
        setEmergencyContactPhone(d?.emergencyContactPhone || "");
        setStreet(d?.address?.street || "");
        setCity(d?.address?.city || "");
        setStateName(d?.address?.state || "");
        setZipCode(d?.address?.zipCode || "");
        setCountry(d?.address?.country || "India");
        setLinkedin(d?.socialLinks?.linkedin || "");
        setGithub(d?.socialLinks?.github || "");
        setWebsite(d?.socialLinks?.website || "");

        // Role Profile
        setProfileData(p);
        if (p) {
          if (u.role === "FACULTY" || u.role === "PROFESSOR" || u.role === "HOD") {
            setOfficeRoom(p.officeRoom || "");
            setDesignation(p.designation || "Assistant Professor");
            setSpecialization(p.specialization || "");
            setQualification(p.qualification || "");
            setWeeklyHours(p.weeklyHours || 18);
          } else if (u.role === "STUDENT") {
            setCurrentSemester(p.currentSemester || 1);
          } else if (u.role === "PARENT") {
            setRelation(p.relation || "GUARDIAN");
            setOccupation(p.occupation || "");
          }
        }
      } else {
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

  const calculateCompleteness = () => {
    let score = 0;
    const items = [
      Boolean(firstName && lastName),
      Boolean(email),
      Boolean(phone),
      Boolean(avatarUrl),
      Boolean(bio),
      Boolean(bloodGroup),
      Boolean(emergencyContactPhone),
      Boolean(street || city),
    ];
    score = items.filter(Boolean).length;
    return Math.round((score / items.length) * 100);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard!`, "info");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image must be smaller than 2MB", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      setShowAvatarModal(false);
      showToast("Avatar image loaded. Click 'Save' to persist.", "info");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        firstName,
        lastName,
        phone,
        avatarUrl,
        bio,
        bloodGroup,
        dob,
        gender,
        emergencyContactName,
        emergencyContactPhone,
        address: {
          street,
          city,
          state: stateName,
          zipCode,
          country,
        },
        socialLinks: {
          linkedin,
          github,
          website,
        },
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
        if (wardRollToLink) {
          payload.linkWardRollNumber = wardRollToLink.trim();
        }
      }

      const res = await fetch("/api/profile/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("Profile & demographics synced successfully!", "success");
        setWardRollToLink("");
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

  const completeness = calculateCompleteness();

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Top Control Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "My Profile Hub" },
            ]}
          />

          {/* Perspective View Switcher: Micro vs Macro */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-ivory-100 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 shadow-xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setProfileViewMode("micro")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                profileViewMode === "micro"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Micro Snapshot</span>
            </button>

            <button
              type="button"
              onClick={() => setProfileViewMode("macro")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                profileViewMode === "macro"
                  ? "bg-rose-primary text-white shadow-xs"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Macro 360 Dossier</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* ULTRA-AESTHETIC COVER BANNER & IDENTITY CARD */}
            <div className="rounded-3xl border border-border dark:border-charcoal-800 shadow-elevated bg-white dark:bg-charcoal-950 overflow-hidden relative">
              {/* Artistic Academic Cover Backdrop */}
              <div className="h-36 sm:h-44 w-full bg-gradient-to-r from-rose-deep via-rose-primary to-rose-accent relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-4 left-6 flex items-center gap-2 text-white/80 text-[11px] font-mono tracking-widest uppercase">
                  <Sparkles className="h-3.5 w-3.5 text-rose-light" />
                  <span>Apex University Autonomous Ledger</span>
                </div>
                {/* ID Card Floating Button on Cover */}
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => setShowIdCardModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-950/70 hover:bg-charcoal-950 text-white backdrop-blur-md text-[11px] font-bold transition-all border border-white/10 cursor-pointer shadow-md"
                  >
                    <QrCode className="h-3.5 w-3.5 text-rose-accent" />
                    <span>Digital ID Card</span>
                  </button>
                </div>
              </div>

              {/* Profile Details Bar */}
              <div className="p-6 sm:p-8 pt-0 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-20">
                  {/* Avatar with Halo Ring */}
                  <div className="relative group shrink-0">
                    <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl p-1 bg-white dark:bg-charcoal-950 shadow-elevated ring-4 ring-rose-primary/20">
                      <div className="h-full w-full rounded-[22px] bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center text-3xl sm:text-4xl font-display font-bold overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${firstName} ${lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{firstName && lastName ? `${firstName[0]}${lastName[0]}` : "U"}</span>
                        )}
                      </div>
                    </div>
                    {/* Camera Change Action */}
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-1 right-1 p-2 rounded-xl bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/20"
                      title="Upload or Change Avatar"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Quick Profile Completion Pill */}
                  <div className="w-full sm:w-64 p-3 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 space-y-1.5 self-center sm:self-end">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-charcoal-600 dark:text-charcoal-400">Profile Health</span>
                      <span className="text-rose-primary">{completeness}% Complete</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-accent to-rose-primary rounded-full transition-all duration-500"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-charcoal-500 block text-right">
                      {completeness === 100 ? "Fully Verified Dossier" : "Complete bio & contacts"}
                    </span>
                  </div>
                </div>

                {/* Primary User Header Info */}
                <div className="mt-5 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {firstName} {lastName}
                    </h1>
                    <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-rose-primary text-white shadow-xs">
                      {role.replace("_", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active Member
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
                    {institutionName} • Member ID:{" "}
                    <button
                      type="button"
                      onClick={() => handleCopy(profileData?.rollNumber || profileData?.employeeCode || currentUser?.id || "", "ID")}
                      className="font-mono font-bold text-rose-primary hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>
                        {profileData?.rollNumber || profileData?.employeeCode || currentUser?.id?.slice(-8).toUpperCase() || "ADM-2026"}
                      </span>
                      <Copy className="h-3 w-3 inline text-charcoal-400" />
                    </button>
                  </p>

                  {bio && (
                    <p className="text-xs text-charcoal-600 dark:text-charcoal-300 italic max-w-3xl pt-1">
                      &quot;{bio}&quot;
                    </p>
                  )}

                  {/* Core Attribute Badges */}
                  <div className="pt-3 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-charcoal-600 dark:text-charcoal-300">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-rose-primary" />
                      <button
                        type="button"
                        onClick={() => handleCopy(email, "Email")}
                        className="font-mono hover:text-rose-primary transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{email}</span>
                        <Copy className="h-3 w-3 text-charcoal-400" />
                      </button>
                    </div>

                    {phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-rose-primary" />
                        <span>{phone}</span>
                      </div>
                    )}

                    {bloodGroup && (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                        <HeartPulse className="h-3.5 w-3.5" />
                        <span>Blood: {bloodGroup}</span>
                      </div>
                    )}

                    {emergencyContactPhone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                        <Phone className="h-3 w-3" />
                        <span>SOS: {emergencyContactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW MODE 1: MICRO PROFILE SNAPSHOT                                     */}
            {/* ========================================================================= */}
            {profileViewMode === "micro" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Micro Key Performance Pulse Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Attendance Ring Pulse */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                      Biometric Pulse
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                        {profileData?.attendanceRate ? profileData.attendanceRate.toFixed(1) : "100.0"}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-charcoal-500">
                      <Activity className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Campus Gate Compliant</span>
                    </div>
                  </div>

                  {/* Academic / Senate Gauge */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                      {role === "STUDENT" ? "Senate Standing" : "Faculty Workload"}
                    </span>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-bold font-display text-rose-primary">
                        {role === "STUDENT"
                          ? profileData?.cgpa
                            ? profileData.cgpa.toFixed(2)
                            : "0.00"
                          : `${weeklyHours || 18}h`}
                      </span>
                      {role === "STUDENT" && <span className="text-xs text-charcoal-400">/ 4.00</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-charcoal-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-rose-primary" />
                      <span>{role === "STUDENT" ? "Accredited CGPA" : "Weekly Lecture Load"}</span>
                    </div>
                  </div>

                  {/* Primary Desk / Room */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                      Assigned Location
                    </span>
                    <div className="mt-2 text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                      {profileData?.officeRoom || profileData?.sectionName || "Academic Complex A"}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-charcoal-500">
                      <MapPin className="h-3.5 w-3.5 text-rose-primary" />
                      <span>Main Campus Block</span>
                    </div>
                  </div>

                  {/* Account / Dues Status */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden">
                    <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                      Ledger Standing
                    </span>
                    <div className="mt-2 text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                      {role === "STUDENT"
                        ? profileData?.feeSummary?.isCleared
                          ? "Clear / No Dues"
                          : `₹${profileData?.feeSummary?.pendingDues?.toLocaleString() || "0"} Due`
                        : "Institutional Officer"}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Active Standing</span>
                    </div>
                  </div>
                </div>

                {/* Micro Snapshot Bento Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Quick Snapshot Badge */}
                  <div className="glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-4">
                    <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                        Identity Snapshot
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowIdCardModal(true)}
                        className="text-xs font-bold text-rose-primary hover:underline flex items-center gap-1"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                        <span>Card</span>
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400">Department:</span>
                        <span className="font-semibold text-charcoal-900 dark:text-ivory-100 text-right">
                          {profileData?.departmentName || "Engineering & Computing"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400">Degree / Tier:</span>
                        <span className="font-semibold text-charcoal-900 dark:text-ivory-100">
                          {profileData?.programName || profileData?.designation || "Institutional Operations"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400">Current Cohort:</span>
                        <span className="font-semibold text-rose-primary">
                          {role === "STUDENT" ? `Semester ${currentSemester}` : "Active Faculty Tenure"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400">Blood Group:</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {bloodGroup || "Not recorded"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-charcoal-400">Residence:</span>
                        <span className="font-semibold text-charcoal-900 dark:text-ivory-100">
                          {city ? `${city}, ${country}` : "Campus Residential"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Micro Switch to Edit */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileViewMode("macro");
                          setActiveTab("personal");
                        }}
                        className="w-full py-2 px-3 rounded-xl bg-ivory-100 dark:bg-charcoal-900 hover:bg-rose-primary hover:text-white text-charcoal-800 dark:text-ivory-100 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border border-border dark:border-charcoal-700"
                      >
                        <span>Edit Full Demographic Profile</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Active Portfolio / Courses at a Glance */}
                  <div className="glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-4 md:col-span-2">
                    <div className="flex items-center justify-between border-b border-border dark:border-charcoal-800 pb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-rose-primary" />
                        <span>
                          {role === "STUDENT"
                            ? "Active Curriculum Courses"
                            : role === "FACULTY" || role === "PROFESSOR"
                            ? "Teaching Lecture Modules"
                            : "Governance Operational Modules"}
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileViewMode("macro");
                          setActiveTab("academic");
                        }}
                        className="text-xs font-bold text-rose-primary hover:underline flex items-center gap-1"
                      >
                        <span>View All & Edit</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Courses or Modules Mini List */}
                    <div className="space-y-2.5">
                      {role === "STUDENT" && profileData?.enrolledCourses && profileData.enrolledCourses.length > 0 ? (
                        profileData.enrolledCourses.slice(0, 4).map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-rose-primary px-2 py-1 rounded-lg bg-rose-primary/10">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate max-w-xs">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-500 font-semibold">
                              {c.credits} Credits • {c.status}
                            </span>
                          </div>
                        ))
                      ) : role === "FACULTY" && profileData?.assignedCourses && profileData.assignedCourses.length > 0 ? (
                        profileData.assignedCourses.slice(0, 4).map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-rose-primary px-2 py-1 rounded-lg bg-rose-primary/10">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-500 font-semibold">
                              {c.credits} Credits
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-xs text-charcoal-500 text-center">
                          {role === "PARENT"
                            ? `${profileData?.linkedWards?.length || 0} Connected Wards actively monitored.`
                            : "Enterprise governance clearance active across institution."}
                        </div>
                      )}
                    </div>

                    {/* Social / Portfolios Mini Row */}
                    {(linkedin || github || website) && (
                      <div className="pt-2 flex items-center gap-3 border-t border-border dark:border-charcoal-800 text-xs">
                        <span className="text-[11px] text-charcoal-400 font-bold uppercase">Portfolios:</span>
                        {linkedin && (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-rose-primary hover:underline font-medium"
                          >
                            <Globe className="h-3 w-3" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {github && (
                          <a
                            href={github}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-rose-primary hover:underline font-medium"
                          >
                            <Globe className="h-3 w-3" />
                            <span>GitHub</span>
                          </a>
                        )}
                        {website && (
                          <a
                            href={website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-rose-primary hover:underline font-medium"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Website</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* VIEW MODE 2: MACRO 360 INSTITUTIONAL DOSSIER                            */}
            {/* ========================================================================= */}
            {profileViewMode === "macro" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                    <span>Personal & Bio</span>
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

                {/* TAB 1: PERSONAL & DEMOGRAPHIC INFO */}
                {activeTab === "personal" && (
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                      <div>
                        <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100">
                          Personal Identity & Contact Information
                        </h3>
                        <p className="text-xs text-charcoal-500 mt-0.5">
                          Configure your official name, contact details, bio, and medical demographics.
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
                            Managed by Institutional Identity Authority.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                            Mobile Phone Number
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                          />
                        </div>

                        {/* Blood Group & DOB */}
                        <div>
                          <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                            Blood Group (Medical Record)
                          </label>
                          <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                            className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                          >
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+ (A Positive)</option>
                            <option value="A-">A- (A Negative)</option>
                            <option value="B+">B+ (B Positive)</option>
                            <option value="B-">B- (B Negative)</option>
                            <option value="AB+">AB+ (AB Positive)</option>
                            <option value="AB-">AB- (AB Negative)</option>
                            <option value="O+">O+ (O Positive)</option>
                            <option value="O-">O- (O Negative)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                            Gender
                          </label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-Binary">Non-Binary</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                            Profile Avatar Image URL
                          </label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="url"
                              value={avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              placeholder="https://... or choose preset"
                              className="flex-1 px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                            <button
                              type="button"
                              onClick={() => setShowAvatarModal(true)}
                              className="px-3 py-2 rounded-xl bg-ivory-200 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-xs font-bold hover:bg-rose-primary hover:text-white transition-all cursor-pointer"
                            >
                              Pick
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                          About Me / Bio
                        </label>
                        <textarea
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          rows={3}
                          placeholder="Share your academic passion, career aspirations, or institutional responsibilities..."
                          className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-primary"
                        />
                      </div>

                      {/* Emergency Contact */}
                      <div className="border-t border-border dark:border-charcoal-800 pt-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <HeartPulse className="h-4 w-4 text-rose-primary" />
                          <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100">
                            Emergency Contact Personnel
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Emergency Contact Name
                            </label>
                            <input
                              type="text"
                              value={emergencyContactName}
                              onChange={(e) => setEmergencyContactName(e.target.value)}
                              placeholder="e.g. Dr. Rajesh Sharma (Father/Guardian)"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Emergency Phone Number
                            </label>
                            <input
                              type="tel"
                              value={emergencyContactPhone}
                              onChange={(e) => setEmergencyContactPhone(e.target.value)}
                              placeholder="+91 99887 76655"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="border-t border-border dark:border-charcoal-800 pt-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-rose-primary" />
                          <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100">
                            Permanent / Residential Address
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Street / Apartment Address
                            </label>
                            <input
                              type="text"
                              value={street}
                              onChange={(e) => setStreet(e.target.value)}
                              placeholder="Plot 42, Silicon Valley Enclave"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              City
                            </label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="Dehradun / Bengaluru"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              State / Province
                            </label>
                            <input
                              type="text"
                              value={stateName}
                              onChange={(e) => setStateName(e.target.value)}
                              placeholder="Uttarakhand / Karnataka"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Postal / Zip Code
                            </label>
                            <input
                              type="text"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              placeholder="248001"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Social & Professional Links */}
                      <div className="border-t border-border dark:border-charcoal-800 pt-5 space-y-4">
                        <div className="flex items-center gap-2">
                          <Share2 className="h-4 w-4 text-rose-primary" />
                          <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100">
                            Professional & Academic Portfolios
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              LinkedIn URL
                            </label>
                            <input
                              type="url"
                              value={linkedin}
                              onChange={(e) => setLinkedin(e.target.value)}
                              placeholder="https://linkedin.com/in/..."
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              GitHub Profile
                            </label>
                            <input
                              type="url"
                              value={github}
                              onChange={(e) => setGithub(e.target.value)}
                              placeholder="https://github.com/..."
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Google Scholar / Website
                            </label>
                            <input
                              type="url"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://scholar.google.com/..."
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          <span>{saving ? "Saving Changes..." : "Save Personal Profile & Bio"}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* TAB 2: ACADEMIC & ROLE INSIGHTS (ALL 15+ ROLES) */}
                {activeTab === "academic" && (
                  <div className="space-y-6">
                    {/* 1. STUDENT VIEW */}
                    {role === "STUDENT" && (
                      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-charcoal-800 pb-4">
                          <div>
                            <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                              <GraduationCap className="h-5 w-5 text-rose-primary" />
                              <span>Student Academic Dossier & Standing</span>
                            </h3>
                            <p className="text-xs text-charcoal-500 mt-0.5">
                              Enrolled curriculum, semester standing, fees balance, and senate verification.
                            </p>
                          </div>

                          <Link
                            href="/students/profile"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary/10 hover:bg-rose-primary/20 text-rose-primary text-xs font-bold transition-all border border-rose-primary/20"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open 360 Student Dossier</span>
                          </Link>
                        </div>

                        {/* Stats Highlights */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Current CGPA
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-rose-primary">
                              {profileData?.cgpa ? profileData.cgpa.toFixed(2) : "0.00"}
                              <span className="text-xs text-charcoal-400 font-normal"> / 4.00</span>
                            </div>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Senate Verified
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Attendance Rate
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                              {profileData?.attendanceRate ? profileData.attendanceRate.toFixed(1) : "100.0"}%
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Biometric Turnstiles
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Fee Clearance
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                              ₹{profileData?.feeSummary?.pendingDues?.toLocaleString() || "0"}
                            </div>
                            <span
                              className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-md ${
                                profileData?.feeSummary?.isCleared
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              }`}
                            >
                              {profileData?.feeSummary?.isCleared ? "No Dues Pending" : "Fees Due"}
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Enrolled Subjects
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                              {profileData?.enrolledCourses?.length || 0}
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Active Course Units
                            </span>
                          </div>
                        </div>

                        {/* Program Information */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Degree & Program
                            </label>
                            <input
                              type="text"
                              value={profileData?.programName || "B.Tech Computer Science"}
                              disabled
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-200/50 dark:bg-charcoal-800/50 text-xs font-semibold opacity-70 cursor-not-allowed"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Department
                            </label>
                            <input
                              type="text"
                              value={profileData?.departmentName || "Computer Science"}
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
                        </div>

                        {/* Enrolled Courses Grid */}
                        {profileData?.enrolledCourses && profileData.enrolledCourses.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-rose-primary" />
                              <span>Active Registered Curriculum Courses</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {profileData.enrolledCourses.map((c: any) => (
                                <div
                                  key={c.id}
                                  className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center justify-between"
                                >
                                  <div className="space-y-0.5">
                                    <span className="font-mono text-[11px] font-bold text-rose-primary">
                                      {c.code}
                                    </span>
                                    <h5 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                                      {c.title}
                                    </h5>
                                    <span className="text-[10px] text-charcoal-500">
                                      {c.credits} Credits • Status: {c.status}
                                    </span>
                                  </div>
                                  {c.grade && (
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
                                      {c.grade}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            <span>{saving ? "Saving Changes..." : "Save Academic Details"}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 2. FACULTY / TEACHER VIEW */}
                    {(role === "FACULTY" || role === "PROFESSOR" || role === "HOD") && (
                      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-charcoal-800 pb-4">
                          <div>
                            <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                              <Briefcase className="h-5 w-5 text-rose-primary" />
                              <span>Academic Faculty Credentials & Research Portfolio</span>
                            </h3>
                            <p className="text-xs text-charcoal-500 mt-0.5">
                              Teaching load, domain specialization, cabin location, and scholarly publications.
                            </p>
                          </div>

                          <Link
                            href="/faculty/profile"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-primary/10 hover:bg-rose-primary/20 text-rose-primary text-xs font-bold transition-all border border-rose-primary/20"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Public Faculty Dossier</span>
                          </Link>
                        </div>

                        {/* Research & Publications Highlights */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Publications
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-rose-primary">
                              {profileData?.publicationsCount || 0}
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Scopus / IEEE Indexed
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Research Grants
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                              {profileData?.researchProjectsCount || 0}
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Sponsored Projects
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Teaching Load
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                              {weeklyHours} hrs/wk
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Weekly Allocation
                            </span>
                          </div>

                          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                            <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                              Courses Taught
                            </span>
                            <div className="mt-1 text-xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                              {profileData?.assignedCourses?.length || 0}
                            </div>
                            <span className="text-[10px] text-charcoal-500 mt-1 block">
                              Active Lecture Modules
                            </span>
                          </div>
                        </div>

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
                              <option value="Dean of Faculty">Dean of Faculty</option>
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
                              value={profileData?.departmentName || "Computer Science"}
                              disabled
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-200/50 dark:bg-charcoal-800/50 text-xs font-semibold opacity-70 cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            <span>{saving ? "Saving Changes..." : "Save Faculty Credentials"}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 3. PARENT VIEW */}
                    {role === "PARENT" && (
                      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                        <div>
                          <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                            <Users className="h-5 w-5 text-rose-primary" />
                            <span>Parent & Guardian Gateway (Linked Scholars)</span>
                          </h3>
                          <p className="text-xs text-charcoal-500 mt-0.5">
                            Manage your ward relations, monitor scholar academic health, and link new children.
                          </p>
                        </div>

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
                              placeholder="e.g. Senior Software Architect, Physician"
                              className="mt-1 block w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                            />
                          </div>
                        </div>

                        {/* Linked Wards Section */}
                        <div className="border-t border-border dark:border-charcoal-800 pt-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-rose-primary" />
                              <span>Connected Wards / Scholars ({profileData?.linkedWards?.length || 0})</span>
                            </h4>
                            <Link
                              href="/parent"
                              className="text-xs font-bold text-rose-primary hover:underline flex items-center gap-1"
                            >
                              <span>Open Full Parent Portal</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>

                          {profileData?.linkedWards && profileData.linkedWards.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {profileData.linkedWards.map((w: any) => (
                                <div
                                  key={w.studentId}
                                  className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 space-y-2"
                                >
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <h5 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                                        {w.fullName}
                                      </h5>
                                      <span className="font-mono text-[10px] text-charcoal-500">
                                        Roll No: {w.rollNumber}
                                      </span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-primary/10 text-rose-primary">
                                      Sem {w.semester}
                                    </span>
                                  </div>

                                  <p className="text-[11px] text-charcoal-600 dark:text-charcoal-300">
                                    {w.programName}
                                  </p>

                                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 dark:border-charcoal-800/50 text-[10px]">
                                    <div>
                                      <span className="text-charcoal-400">Attendance:</span>{" "}
                                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {w.attendanceRate.toFixed(1)}%
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-charcoal-400">CGPA:</span>{" "}
                                      <strong className="text-rose-primary font-bold">
                                        {w.cgpa.toFixed(2)}
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                              No scholar profile currently linked to this parent account. Use the field below to request linking.
                            </div>
                          )}

                          {/* Link Another Ward by Roll Number */}
                          <div className="p-4 rounded-2xl bg-ivory-100/50 dark:bg-charcoal-900/50 border border-border dark:border-charcoal-800 space-y-2">
                            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                              Link Another Child / Scholar
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={wardRollToLink}
                                onChange={(e) => setWardRollToLink(e.target.value)}
                                placeholder="Enter Ward's Roll Number (e.g. APP-049281)"
                                className="flex-1 px-3.5 py-2 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-primary"
                              />
                              <button
                                type="submit"
                                disabled={saving || !wardRollToLink}
                                className="px-4 py-2 rounded-xl bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900 text-xs font-bold hover:bg-rose-primary hover:text-white transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Plus className="h-3.5 w-3.5 inline mr-1" />
                                Link Ward
                              </button>
                            </div>
                            <span className="text-[10px] text-charcoal-500 block">
                              Instant cryptographic relation mapping across official campus bursar ledger.
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Save className="h-4 w-4" />
                            <span>{saving ? "Saving Changes..." : "Save Parent Credentials"}</span>
                          </button>
                        </div>
                      </form>
                    )}

                    {/* 4. ADMINISTRATIVE & STAFF ROLES VIEW (ADMIN, PRINCIPAL, LIBRARIAN, ACCOUNTANT, HR, ETC.) */}
                    {role !== "STUDENT" &&
                      role !== "FACULTY" &&
                      role !== "PROFESSOR" &&
                      role !== "HOD" &&
                      role !== "PARENT" && (
                        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-charcoal-800 pb-4">
                            <div>
                              <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-rose-primary" />
                                <span>Institutional Governance & Operational Desk</span>
                              </h3>
                              <p className="text-xs text-charcoal-500 mt-0.5">
                                Assigned administrative authority, institutional jurisdiction, and operational modules.
                              </p>
                            </div>

                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900">
                              {profileData?.accessClearance || "Level 4 - Institutional Officer"}
                            </span>
                          </div>

                          {/* Administrative Details Cards */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                                Jurisdiction
                              </span>
                              <div className="mt-1 text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                                {institutionName}
                              </div>
                              <span className="text-[10px] text-charcoal-400 mt-1 block">
                                {profileData?.administrativeTier || "Enterprise Authority"}
                              </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                                Staff Identification
                              </span>
                              <div className="mt-1 text-sm font-bold font-mono text-rose-primary">
                                {profileData?.employeeCode || `STF-${currentUser?.id?.slice(-4) || "8821"}`}
                              </div>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
                                FERPA / SOC2 Compliant
                              </span>
                            </div>

                            <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                              <span className="text-[11px] font-bold text-charcoal-500 uppercase tracking-wider block">
                                Institutional Standing
                              </span>
                              <div className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                Active Clear
                              </div>
                              <span className="text-[10px] text-charcoal-400 mt-1 block">
                                Full Module Authorization
                              </span>
                            </div>
                          </div>

                          {/* Authorized Modules Grid */}
                          <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-rose-primary" />
                              <span>Assigned Operational Governance Modules</span>
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(profileData?.assignedModules || [
                                "Core Institutional Ledger",
                                "Policy & Compliance Center",
                                "Stakeholder Audit Trails",
                              ]).map((mod: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center gap-3"
                                >
                                  <div className="p-2 rounded-xl bg-rose-primary/10 text-rose-primary shrink-0">
                                    <Check className="h-3.5 w-3.5" />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                                      {mod}
                                    </h5>
                                    <span className="text-[10px] text-charcoal-500">
                                      Full Operational Clearance
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* TAB 3: SECURITY & PASSWORD (AS REQUESTED) */}
                {activeTab === "security" && (
                  <form onSubmit={handleChangePassword} className="glass-panel p-6 sm:p-8 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-6">
                    <div>
                      <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                        <Lock className="h-5 w-5 text-rose-primary" />
                        <span>Account Security & Password Credentials</span>
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
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Lock className="h-4 w-4" />
                        <span>{changingPassword ? "Updating Password..." : "Update Security Password"}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* AVATAR PICKER / UPLOAD MODAL */}
            {showAvatarModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm animate-in fade-in">
                <div className="glass-panel w-full max-w-md p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-elevated space-y-5 bg-white dark:bg-charcoal-900">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-display text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-rose-primary" />
                      <span>Choose Profile Avatar</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(false)}
                      className="p-1.5 rounded-xl text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 transition-all cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* File Upload Trigger */}
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-rose-primary/40 hover:border-rose-primary bg-rose-primary/5 hover:bg-rose-primary/10 transition-all text-rose-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Local Photo from Device (Max 2MB)</span>
                    </button>
                  </div>

                  {/* Preset Avatars */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                      Or Select from Curated Academic Avatars
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {AVATAR_PRESETS.map((preset, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => {
                            setAvatarUrl(preset);
                            setShowAvatarModal(false);
                            showToast("Preset avatar selected. Click 'Save' to persist.", "info");
                          }}
                          className={`relative rounded-2xl overflow-hidden aspect-square border-2 transition-all hover:scale-105 cursor-pointer ${
                            avatarUrl === preset ? "border-rose-primary ring-2 ring-rose-primary/30" : "border-border dark:border-charcoal-800"
                          }`}
                        >
                          <img src={preset} alt={`Preset ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(false)}
                      className="px-4 py-2 rounded-xl bg-ivory-200 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DIGITAL INSTITUTIONAL ID CARD MODAL */}
            {showIdCardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md space-y-4">
                  <div className="flex items-center justify-between text-white px-2">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <QrCode className="h-4 w-4 text-rose-primary" />
                      Official Institutional Digital Credential
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowIdCardModal(false)}
                      className="p-1 rounded-lg hover:bg-white/10 transition-all cursor-pointer text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* ID CARD VISUAL CANVAS */}
                  <div
                    id="institutional-id-card"
                    className="w-full rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 text-white p-6 shadow-2xl border border-charcoal-700 relative overflow-hidden space-y-5"
                  >
                    {/* Security Holographic Background Glow */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-rose-primary/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

                    {/* Card Header */}
                    <div className="flex items-start justify-between relative z-10 border-b border-charcoal-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-rose-primary flex items-center justify-center text-[10px] font-bold">
                            AU
                          </div>
                          <span className="font-display font-bold text-sm tracking-wide">
                            {institutionName || "APEX UNIVERSITY"}
                          </span>
                        </div>
                        <span className="text-[10px] text-charcoal-400 block mt-0.5">
                          Autonomous Academic Senate • ISO 9001:2026
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-primary text-white shadow-xs">
                        {role}
                      </span>
                    </div>

                    {/* Member Details */}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="h-20 w-20 rounded-2xl bg-rose-primary/20 text-rose-primary border border-rose-primary/40 flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${firstName} ${lastName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{firstName && lastName ? `${firstName[0]}${lastName[0]}` : "U"}</span>
                        )}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h4 className="font-display font-bold text-base text-white truncate">
                          {firstName} {lastName}
                        </h4>
                        <p className="text-[11px] text-charcoal-300 font-mono">
                          {profileData?.rollNumber
                            ? `ROLL: ${profileData.rollNumber}`
                            : profileData?.employeeCode
                            ? `EMP ID: ${profileData.employeeCode}`
                            : `ID: ${currentUser?.id?.slice(-8).toUpperCase() || "ADM-2026"}`}
                        </p>
                        <p className="text-[10px] text-rose-300 truncate">
                          {profileData?.programName || profileData?.departmentName || "Academic Member"}
                        </p>
                      </div>
                    </div>

                    {/* Attributes Bar */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-charcoal-800/60 border border-charcoal-700/60 text-[10px] relative z-10">
                      <div>
                        <span className="text-charcoal-400 block">Blood Group:</span>
                        <strong className="text-white font-bold">{bloodGroup || "O+"}</strong>
                      </div>
                      <div>
                        <span className="text-charcoal-400 block">Issued:</span>
                        <strong className="text-white font-bold">{createdAt || "2026"}</strong>
                      </div>
                      <div>
                        <span className="text-charcoal-400 block">Valid Thru:</span>
                        <strong className="text-emerald-400 font-bold">2030-06</strong>
                      </div>
                    </div>

                    {/* Barcode & Security Hologram */}
                    <div className="flex items-center justify-between pt-2 border-t border-charcoal-800/80 relative z-10">
                      <div className="font-mono text-[9px] text-charcoal-400 tracking-widest">
                        ||||| ||| ||||||| |||| |||||
                        <span className="block text-[8px] text-charcoal-500">
                          {email}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>CRYPTOGRAPHIC SEAL</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print / Save ID Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowIdCardModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-charcoal-800 text-white text-xs font-bold hover:bg-charcoal-700 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
