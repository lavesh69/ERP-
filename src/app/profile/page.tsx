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
  Layers,
  Compass,
  Activity,
  ChevronRight,
  RotateCcw,
  Zap,
  TrendingUp,
  BadgeCheck,
  Star,
  Crown,
  Fingerprint,
  Palette,
  Eye,
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

type ThemePalette = "rose" | "emerald" | "amber" | "violet";

export default function ProfileHubPage() {
  const { showToast, currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileViewMode, setProfileViewMode] = useState<"macro" | "micro">("micro");
  const [activeTab, setActiveTab] = useState<"personal" | "academic" | "security">("personal");
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const [idCardFlipped, setIdCardFlipped] = useState(false);
  const [embeddedCardFlipped, setEmbeddedCardFlipped] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [themePalette, setThemePalette] = useState<ThemePalette>("rose");

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
    showToast(`Copied ${label} to clipboard!`, "info");
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
  const attendanceVal = profileData?.attendanceRate ?? 100.0;
  const strokeDashoffsetVal = 163 - (163 * Math.min(100, Math.max(0, attendanceVal))) / 100;

  // Dynamic Theme Gradients
  const themeBackdrops: Record<ThemePalette, string> = {
    rose: "from-[#2A0E1C] via-[#5C1F3A] to-[#993A60]",
    emerald: "from-[#0A2619] via-[#144D34] to-[#1E7B54]",
    amber: "from-[#2A1D0B] via-[#5C3F18] to-[#9E6C26]",
    violet: "from-[#1D0E2B] via-[#401C5E] to-[#7232A8]",
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Top Control Navigation & Perspective Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "My Profile Hub" },
            ]}
          />

          <div className="flex items-center gap-3">
            {/* Theme Mood Selector */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft">
              <span className="text-[10px] font-bold text-charcoal-400 pl-2 pr-1 uppercase tracking-wider">
                Mood:
              </span>
              <button
                type="button"
                onClick={() => setThemePalette("rose")}
                className={`h-4 w-4 rounded-full bg-rose-primary transition-all ${
                  themePalette === "rose" ? "ring-2 ring-rose-primary/50 scale-110" : "opacity-60"
                }`}
                title="Rose Academic"
              />
              <button
                type="button"
                onClick={() => setThemePalette("emerald")}
                className={`h-4 w-4 rounded-full bg-emerald-600 transition-all ${
                  themePalette === "emerald" ? "ring-2 ring-emerald-500/50 scale-110" : "opacity-60"
                }`}
                title="Emerald Sovereign"
              />
              <button
                type="button"
                onClick={() => setThemePalette("amber")}
                className={`h-4 w-4 rounded-full bg-amber-500 transition-all ${
                  themePalette === "amber" ? "ring-2 ring-amber-500/50 scale-110" : "opacity-60"
                }`}
                title="Imperial Gold"
              />
              <button
                type="button"
                onClick={() => setThemePalette("violet")}
                className={`h-4 w-4 rounded-full bg-purple-600 transition-all ${
                  themePalette === "violet" ? "ring-2 ring-purple-500/50 scale-110" : "opacity-60"
                }`}
                title="Midnight Violet"
              />
            </div>

            {/* Perspective View Switcher: Micro vs Macro */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 shadow-soft self-start sm:self-auto backdrop-blur-md">
              <button
                type="button"
                onClick={() => setProfileViewMode("micro")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  profileViewMode === "micro"
                    ? "bg-gradient-to-r from-rose-primary to-rose-hover text-white shadow-md shadow-rose-primary/25 scale-[1.02]"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Micro Snapshot</span>
              </button>

              <button
                type="button"
                onClick={() => setProfileViewMode("macro")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  profileViewMode === "macro"
                    ? "bg-gradient-to-r from-rose-primary to-rose-hover text-white shadow-md shadow-rose-primary/25 scale-[1.02]"
                    : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Macro 360 Dossier</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <>
            {/* ========================================================================= */}
            {/* LUXURY EDITORIAL COVER BANNER & IDENTITY CARD                            */}
            {/* ========================================================================= */}
            <div className="rounded-3xl border border-border dark:border-charcoal-800 shadow-elevated bg-white dark:bg-charcoal-950 overflow-hidden relative">
              {/* Dynamic Atmospheric Gradient Backdrop */}
              <div
                className={`h-40 sm:h-52 w-full bg-gradient-to-br ${themeBackdrops[themePalette]} relative overflow-hidden transition-colors duration-700`}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#FAF0F4_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 left-1/4 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Institutional Insignia */}
                <div className="absolute top-4 left-6 flex items-center gap-2.5 text-white/90 text-[11px] font-mono tracking-widest uppercase">
                  <div className="p-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/20">
                    <Sparkles className="h-3.5 w-3.5 text-rose-300" />
                  </div>
                  <span className="font-semibold drop-shadow-xs">Apex Autonomous University</span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[9px] bg-white/15 border border-white/20 text-rose-100 font-bold">
                    NAAC A++ • ISO 9001
                  </span>
                </div>

                {/* ID Card Floating Action Button */}
                <div className="absolute top-4 right-4">
                  <button
                    type="button"
                    onClick={() => setShowIdCardModal(true)}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-charcoal-950/80 hover:bg-charcoal-950 text-white backdrop-blur-md text-xs font-bold transition-all border border-white/15 cursor-pointer shadow-lg hover:shadow-glow hover:scale-105 active:scale-95"
                  >
                    <QrCode className="h-4 w-4 text-rose-300" />
                    <span>Collegiate ID Card</span>
                  </button>
                </div>
              </div>

              {/* Profile Details Layer */}
              <div className="p-6 sm:p-8 pt-0 relative">
                <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 -mt-16 sm:-mt-22">
                  {/* Glowing Dual-Ring Avatar Frame */}
                  <div className="relative group shrink-0">
                    <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-3xl p-1.5 bg-white dark:bg-charcoal-950 shadow-elevated ring-4 ring-rose-primary/30 relative">
                      <div className="h-full w-full rounded-[22px] bg-gradient-to-tr from-rose-primary via-rose-hover to-rose-accent text-white flex items-center justify-center text-4xl sm:text-5xl font-display font-bold overflow-hidden shadow-inner">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={`${firstName} ${lastName}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span>{firstName && lastName ? `${firstName[0]}${lastName[0]}` : "U"}</span>
                        )}
                      </div>

                      {/* Online Status Pulse Orb */}
                      <span
                        className="absolute top-3 right-3 flex h-3.5 w-3.5"
                        title="Online on Institutional Grid"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-charcoal-950 shadow-xs" />
                      </span>
                    </div>

                    {/* Camera Action Button */}
                    <button
                      type="button"
                      onClick={() => setShowAvatarModal(true)}
                      className="absolute bottom-1 right-1 p-2.5 rounded-2xl bg-charcoal-900 text-white dark:bg-ivory-100 dark:text-charcoal-900 shadow-elevated hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/20"
                      title="Upload Photo or Choose Preset"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Profile Health Meter Pill */}
                  <div className="w-full sm:w-72 p-4 rounded-3xl bg-ivory-50 dark:bg-charcoal-900/90 border border-border dark:border-charcoal-800 shadow-soft space-y-2 self-center sm:self-end">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Dossier Health</span>
                      </span>
                      <span className="text-rose-primary font-display">{completeness}% Complete</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-rose-accent to-rose-primary rounded-full transition-all duration-700 ease-out shadow-xs"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-charcoal-500">
                      <span>{completeness >= 90 ? "Senate Verified" : "Needs bio/address"}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3" /> Tier 1 Record
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary User Header Info */}
                <div className="mt-5 space-y-2 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                      {firstName} {lastName}
                    </h1>
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-rose-primary text-white shadow-xs">
                      {role.replace("_", " ")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active Member
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-600 dark:text-charcoal-400 font-medium">
                    {institutionName} • Identifier:{" "}
                    <button
                      type="button"
                      onClick={() => handleCopy(profileData?.rollNumber || profileData?.employeeCode || currentUser?.id || "", "ID")}
                      className="font-mono font-bold text-rose-primary hover:underline cursor-pointer inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md"
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
                  <div className="pt-3 flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-charcoal-600 dark:text-charcoal-300">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
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
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800">
                        <Phone className="h-3.5 w-3.5 text-rose-primary" />
                        <span>{phone}</span>
                      </div>
                    )}

                    {bloodGroup && (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                        <HeartPulse className="h-3.5 w-3.5" />
                        <span>Blood: {bloodGroup}</span>
                      </div>
                    )}

                    {emergencyContactPhone && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900">
                        <Phone className="h-3.5 w-3.5" />
                        <span>SOS: {emergencyContactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* GAMIFIED INSTITUTIONAL HONORS & MERIT RIBBON                             */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <Crown className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                    Senate Merit List
                  </span>
                  <span className="text-[9px] text-charcoal-500 block truncate">Top 5% Cohort Tier</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <Fingerprint className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                    Turnstile Streak
                  </span>
                  <span className="text-[9px] text-charcoal-500 block truncate">Zero Defaulter Flag</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-primary shrink-0">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                    Curriculum Verified
                  </span>
                  <span className="text-[9px] text-charcoal-500 block truncate">Prerequisites Cleared</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-charcoal-900 dark:text-ivory-100 block truncate">
                    FERPA & SOC2
                  </span>
                  <span className="text-[9px] text-charcoal-500 block truncate">Security Clearance</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VIEW MODE 1: MICRO PROFILE SNAPSHOT                                     */}
            {/* ========================================================================= */}
            {profileViewMode === "micro" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Micro Key Performance Pulse Grid with Circular Rings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Circular Biometric Attendance Gauge */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                        Biometric Pulse
                      </span>
                      <div className="mt-1 text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                        {attendanceVal.toFixed(1)}%
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-charcoal-500">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        <span>Turnstile Clear</span>
                      </div>
                    </div>

                    <div className="relative shrink-0">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="5"
                          className="text-ivory-200 dark:text-charcoal-800"
                          fill="transparent"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="currentColor"
                          strokeWidth="5"
                          strokeDasharray={163}
                          strokeDashoffset={strokeDashoffsetVal}
                          strokeLinecap="round"
                          className="text-emerald-500 transition-all duration-1000 ease-out"
                          fill="transparent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓
                      </div>
                    </div>
                  </div>

                  {/* Academic / Senate Gauge */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                        {role === "STUDENT" ? "Senate Standing" : "Teaching Load"}
                      </span>
                      <div className="mt-1 text-2xl font-bold font-display text-rose-primary">
                        {role === "STUDENT"
                          ? profileData?.cgpa
                            ? profileData.cgpa.toFixed(2)
                            : "0.00"
                          : `${weeklyHours || 18} hrs`}
                        {role === "STUDENT" && <span className="text-xs text-charcoal-400 font-normal"> / 4.00</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-charcoal-500">
                        <ShieldCheck className="h-3 w-3 text-rose-primary" />
                        <span>{role === "STUDENT" ? "Verified CGPA" : "Weekly Allocation"}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-primary border border-rose-200 dark:border-rose-900 shrink-0">
                      <Award className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Campus Desk / Room */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                        Assigned Campus Base
                      </span>
                      <div className="mt-1 text-sm font-bold text-charcoal-900 dark:text-ivory-100 line-clamp-1">
                        {profileData?.officeRoom || profileData?.sectionName || "Academic Complex A"}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-charcoal-500">
                        <MapPin className="h-3 w-3 text-rose-primary" />
                        <span>Main Academic Zone</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-ivory-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-200 border border-border dark:border-charcoal-700 shrink-0">
                      <Building className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Ledger / Fees Status */}
                  <div className="glass-panel p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft hover:shadow-card transition-all relative overflow-hidden flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block">
                        Ledger Standing
                      </span>
                      <div className="mt-1 text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                        {role === "STUDENT"
                          ? profileData?.feeSummary?.isCleared
                            ? "Clear / No Dues"
                            : `₹${profileData?.feeSummary?.pendingDues?.toLocaleString() || "0"} Due`
                          : "Institutional Officer"}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Active Standing</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shrink-0">
                      <CreditCard className="h-6 w-6" />
                    </div>
                  </div>
                </div>

                {/* Embedded Collegiate Smartcard + Bento Information */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Interactive Live Smartcard Widget */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
                        <QrCode className="h-3.5 w-3.5 text-rose-primary" />
                        <span>Smart RFID Card Preview</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEmbeddedCardFlipped(!embeddedCardFlipped)}
                        className="text-xs font-bold text-rose-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Flip ({embeddedCardFlipped ? "Front" : "Back"})</span>
                      </button>
                    </div>

                    {/* LIVE INTERACTIVE FLIPPABLE CARD ON PAGE */}
                    {!embeddedCardFlipped ? (
                      <div className="w-full rounded-3xl bg-gradient-to-br from-[#1C161D] via-[#2D1C26] to-[#171219] text-white p-5 shadow-elevated border border-charcoal-700 relative overflow-hidden space-y-4">
                        <div className="flex items-center justify-between border-b border-charcoal-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-rose-primary flex items-center justify-center text-[10px] font-bold">
                              AU
                            </div>
                            <span className="text-xs font-bold truncate max-w-[150px]">
                              {institutionName || "APEX UNIVERSITY"}
                            </span>
                          </div>
                          <div className="h-5 w-8 rounded-sm bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 p-0.5">
                            <div className="w-full h-full border border-amber-600/50 rounded-[2px]" />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 rounded-2xl bg-rose-primary/20 border border-rose-primary/50 flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
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
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="font-bold text-sm text-white truncate">
                              {firstName} {lastName}
                            </h4>
                            <p className="text-[10px] text-rose-300 font-mono">
                              {profileData?.rollNumber
                                ? `ROLL: ${profileData.rollNumber}`
                                : profileData?.employeeCode
                                ? `EMP: ${profileData.employeeCode}`
                                : "ID: ADM-2026"}
                            </p>
                            <span className="inline-block px-2 py-0.2 rounded-full text-[9px] font-bold bg-rose-primary text-white">
                              {role}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-charcoal-900/80 border border-charcoal-800 text-[9px]">
                          <div>
                            <span className="text-charcoal-400 block">Blood:</span>
                            <strong className="text-white font-bold">{bloodGroup || "O+"}</strong>
                          </div>
                          <div>
                            <span className="text-charcoal-400 block">Status:</span>
                            <strong className="text-emerald-400 font-bold">Active</strong>
                          </div>
                          <div>
                            <span className="text-charcoal-400 block">Exp:</span>
                            <strong className="text-white font-bold">2030</strong>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[8px] font-mono text-charcoal-500 pt-1 border-t border-charcoal-800">
                          <span>||||| ||| |||||||</span>
                          <span className="text-emerald-400">CRYPTOGRAPHIC CHIP</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full rounded-3xl bg-gradient-to-br from-[#171219] via-[#241720] to-[#1C161D] text-white p-5 shadow-elevated border border-charcoal-700 relative overflow-hidden space-y-3">
                        <div className="-mx-5 -mt-2 h-7 bg-charcoal-950 border-y border-charcoal-800" />
                        <div className="text-[9px] text-charcoal-400 space-y-1">
                          <div className="flex justify-between border-b border-charcoal-800 pb-1">
                            <span className="text-white font-bold">EMERGENCY SOS:</span>
                            <span className="text-rose-300 font-bold font-mono">
                              {emergencyContactPhone || "+91 99887 76655"}
                            </span>
                          </div>
                          <p>Turnstile authentication is registered on campus network.</p>
                          <p>Found cards to be surrendered to Campus Security.</p>
                        </div>
                        <div className="flex items-end justify-between pt-1 border-t border-charcoal-800">
                          <div className="p-1 rounded-lg bg-white">
                            <QrCode className="h-7 w-7 text-charcoal-900" />
                          </div>
                          <span className="text-[8px] text-charcoal-500 uppercase tracking-widest font-mono">
                            Dean of Academic Senate
                          </span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowIdCardModal(true)}
                      className="w-full py-2 px-3 rounded-2xl bg-ivory-100 dark:bg-charcoal-900 hover:bg-rose-primary hover:text-white text-charcoal-800 dark:text-ivory-100 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer border border-border dark:border-charcoal-700 shadow-xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Full Printable Smartcard View</span>
                    </button>
                  </div>

                  {/* Right: Active Portfolio / Registered Courses */}
                  <div className="glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft space-y-4 lg:col-span-2">
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
                        className="text-xs font-bold text-rose-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Manage in Macro 360</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Courses or Modules Mini List */}
                    <div className="space-y-2.5">
                      {role === "STUDENT" && profileData?.enrolledCourses && profileData.enrolledCourses.length > 0 ? (
                        profileData.enrolledCourses.slice(0, 4).map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center justify-between hover:border-rose-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-rose-primary px-2.5 py-1 rounded-xl bg-rose-primary/10">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 truncate max-w-xs">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-500 font-semibold px-2 py-0.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800">
                              {c.credits} Credits • {c.status}
                            </span>
                          </div>
                        ))
                      ) : role === "FACULTY" && profileData?.assignedCourses && profileData.assignedCourses.length > 0 ? (
                        profileData.assignedCourses.slice(0, 4).map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3.5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 flex items-center justify-between hover:border-rose-primary/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-rose-primary px-2.5 py-1 rounded-xl bg-rose-primary/10">
                                {c.code}
                              </span>
                              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                                {c.title}
                              </span>
                            </div>
                            <span className="text-[10px] text-charcoal-500 font-semibold px-2 py-0.5 rounded-lg bg-ivory-100 dark:bg-charcoal-800">
                              {c.credits} Credits
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-5 rounded-2xl bg-ivory-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-800 text-xs text-charcoal-500 text-center">
                          {role === "PARENT"
                            ? `${profileData?.linkedWards?.length || 0} Connected Wards actively monitored.`
                            : "Enterprise governance clearance active across institution."}
                        </div>
                      )}
                    </div>

                    {/* Portfolios Row */}
                    {(linkedin || github || website) && (
                      <div className="pt-3 flex flex-wrap items-center gap-3 border-t border-border dark:border-charcoal-800 text-xs">
                        <span className="text-[11px] text-charcoal-400 font-bold uppercase tracking-wider">
                          Portfolios:
                        </span>
                        {linkedin && (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-primary/10 text-rose-primary hover:bg-rose-primary hover:text-white transition-all font-semibold"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-primary/10 text-rose-primary hover:bg-rose-primary hover:text-white transition-all font-semibold"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-primary/10 text-rose-primary hover:bg-rose-primary hover:text-white transition-all font-semibold"
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
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                {/* Navigation Tabs */}
                <div className="flex rounded-2xl bg-white dark:bg-charcoal-900 p-1.5 border border-border dark:border-charcoal-800 shadow-soft max-w-md">
                  <button
                    type="button"
                    onClick={() => setActiveTab("personal")}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "personal"
                        ? "bg-rose-primary text-white shadow-md shadow-rose-primary/25"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    <span>Personal & Bio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("academic")}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "academic"
                        ? "bg-rose-primary text-white shadow-md shadow-rose-primary/25"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Academic & Role</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("security")}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "security"
                        ? "bg-rose-primary text-white shadow-md shadow-rose-primary/25"
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
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-md animate-in fade-in">
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
                      className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-rose-primary/40 hover:border-rose-primary bg-rose-primary/5 hover:bg-rose-primary/10 transition-all text-rose-primary text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Photo from Device (Max 2MB)</span>
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

            {/* FLIPPABLE DIGITAL INSTITUTIONAL ID CARD MODAL */}
            {showIdCardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-in fade-in">
                <div className="w-full max-w-md space-y-4">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between text-white px-2">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-rose-accent" />
                      Digital Collegiate Smartcard
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIdCardFlipped(!idCardFlipped)}
                        className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/15"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Flip ({idCardFlipped ? "Front" : "Back"})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowIdCardModal(false);
                          setIdCardFlipped(false);
                        }}
                        className="p-1 rounded-xl hover:bg-white/10 transition-all cursor-pointer text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* ID CARD VISUAL CANVAS (FRONT / BACK) */}
                  {!idCardFlipped ? (
                    /* FRONT OF SMART CARD */
                    <div
                      id="institutional-id-card-front"
                      className="w-full rounded-3xl bg-gradient-to-br from-[#1C161D] via-[#2D1C26] to-[#171219] text-white p-6 shadow-2xl border border-charcoal-700 relative overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-200"
                    >
                      {/* Security Holographic Radial Accents */}
                      <div className="absolute top-0 right-0 w-52 h-52 bg-rose-primary/30 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                      <div className="absolute bottom-0 left-0 w-44 h-44 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

                      {/* Card Header with Smart Chip & Logo */}
                      <div className="flex items-start justify-between relative z-10 border-b border-charcoal-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-rose-primary to-rose-accent flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20">
                            AU
                          </div>
                          <div>
                            <span className="font-display font-bold text-sm tracking-wide block">
                              {institutionName || "APEX UNIVERSITY"}
                            </span>
                            <span className="text-[10px] text-charcoal-400 block">
                              Autonomous Academic Senate
                            </span>
                          </div>
                        </div>

                        {/* Gold Security Smart Chip Graphic */}
                        <div className="h-7 w-10 rounded-md bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-500 border border-amber-300 shadow-inner flex items-center justify-center p-1">
                          <div className="w-full h-full border border-amber-600/50 rounded-xs flex items-center justify-center">
                            <span className="text-[8px] font-mono text-amber-900 font-bold">RFID</span>
                          </div>
                        </div>
                      </div>

                      {/* Member Photo & Vitals */}
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="h-20 w-20 rounded-2xl bg-rose-primary/20 text-rose-primary border-2 border-rose-primary/50 flex items-center justify-center text-2xl font-bold overflow-hidden shrink-0 shadow-lg">
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
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-white truncate">
                              {firstName} {lastName}
                            </h4>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-primary text-white">
                              {role}
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-300 font-mono font-semibold">
                            {profileData?.rollNumber
                              ? `ROLL: ${profileData.rollNumber}`
                              : profileData?.employeeCode
                              ? `EMP ID: ${profileData.employeeCode}`
                              : `ID: ${currentUser?.id?.slice(-8).toUpperCase() || "ADM-2026"}`}
                          </p>
                          <p className="text-[10px] text-charcoal-300 truncate">
                            {profileData?.programName || profileData?.departmentName || "Academic Officer"}
                          </p>
                        </div>
                      </div>

                      {/* Attributes Bar */}
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-charcoal-900/80 border border-charcoal-800 text-[10px] relative z-10 backdrop-blur-sm">
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

                        <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-mono font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>CRYPTOGRAPHIC CHIP</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BACK OF SMART CARD */
                    <div
                      id="institutional-id-card-back"
                      className="w-full rounded-3xl bg-gradient-to-br from-[#171219] via-[#241720] to-[#1C161D] text-white p-6 shadow-2xl border border-charcoal-700 relative overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-200"
                    >
                      {/* Magnetic Stripe Graphic */}
                      <div className="-mx-6 -mt-2 h-10 bg-charcoal-950 border-y border-charcoal-800 flex items-center px-4">
                        <div className="w-full h-2 bg-charcoal-800/50 rounded-full" />
                      </div>

                      <div className="space-y-2 pt-2 text-[10px] text-charcoal-300">
                        <div className="flex items-center justify-between border-b border-charcoal-800/80 pb-2">
                          <span className="font-bold text-white uppercase tracking-wider">
                            Emergency Response Hotline
                          </span>
                          <span className="font-mono text-rose-300 font-bold">
                            {emergencyContactPhone || "+91 99887 76655"}
                          </span>
                        </div>

                        <p className="leading-relaxed text-charcoal-400">
                          1. This card is official property of Apex University and must be surrendered upon departure.
                        </p>
                        <p className="leading-relaxed text-charcoal-400">
                          2. Turnstile biometric authentication is tied to embedded RFID credentials.
                        </p>
                        <p className="leading-relaxed text-charcoal-400">
                          3. If found, please return to: Security Directorate, Academic Square, Main Campus.
                        </p>
                      </div>

                      {/* Official Signature Block & QR Code */}
                      <div className="flex items-end justify-between pt-3 border-t border-charcoal-800/80">
                        <div className="p-2 rounded-xl bg-white text-charcoal-900">
                          <QrCode className="h-10 w-10 text-charcoal-900" />
                        </div>

                        <div className="text-right space-y-1">
                          <span className="text-[10px] font-script font-bold italic text-rose-accent block text-sm">
                            Dr. A. K. Sen
                          </span>
                          <span className="text-[9px] text-charcoal-400 uppercase tracking-widest block">
                            Dean of Academic Senate
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="flex-1 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      <Printer className="h-4 w-4" />
                      <span>Print / Save ID Card (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowIdCardModal(false);
                        setIdCardFlipped(false);
                      }}
                      className="px-5 py-2.5 rounded-2xl bg-charcoal-800 text-white text-xs font-bold hover:bg-charcoal-700 cursor-pointer transition-all"
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
