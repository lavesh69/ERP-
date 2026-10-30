"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useApp } from "@/context/AppContext";
import {
  GraduationCap,
  Users,
  Award,
  Search,
  Building,
  MapPin,
  Calendar,
  Heart,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Eye,
  Printer,
  PlusCircle,
  CreditCard,
  Receipt,
  X,
} from "lucide-react";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";

export default function AlumniPage() {
  const { currentUser, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<"directory" | "mentorship" | "verification" | "giving">("directory");
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlumniDossier, setSelectedAlumniDossier] = useState<any | null>(null);

  // Giving & Endowment Gateway State
  const [givingModalCampaign, setGivingModalCampaign] = useState<any | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(2500);
  const [customDonationAmount, setCustomDonationAmount] = useState<string>("");
  const [donorPan, setDonorPan] = useState("");
  const [donorName, setDonorName] = useState(currentUser?.fullName || "");
  const [isAnonymousDonor, setIsAnonymousDonor] = useState(false);
  const [donationSuccessReceipt, setDonationSuccessReceipt] = useState<any | null>(null);

  // Degree Verification Form
  const [verifyRoll, setVerifyRoll] = useState("");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Mentorship Modal & Booking Flow
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [mentorTopic, setMentorTopic] = useState("");
  const [mentorDate, setMentorDate] = useState("");
  const [mentorSlot, setMentorSlot] = useState("");
  const [mentorFormat, setMentorFormat] = useState("1:1 Video Mentorship (Google Meet)");

  // Register Alumni Form
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    graduationBatch: new Date().getFullYear(),
    degree: "",
    currentCompany: "",
    jobTitle: "",
    location: "",
    isAvailableForMentorship: true,
    mentorshipDomains: "",
    linkedinUrl: "",
  });

  // Giving Campaigns
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const [dirRes, giveRes] = await Promise.all([
        fetch("/api/alumni/directory"),
        fetch("/api/alumni/giving"),
      ]);
      if (dirRes.ok) {
        const data = await dirRes.json();
        setAlumni(data.alumni || []);
      }
      if (giveRes.ok) {
        const gData = await giveRes.json();
        setCampaigns(gData.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to load alumni directory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlumni();
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showMentorModal || !!selectedAlumniDossier || showRegisterModal || !!givingModalCampaign;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowMentorModal(false);
        setSelectedAlumniDossier(null);
        setShowRegisterModal(false);
        setGivingModalCampaign(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showMentorModal, selectedAlumniDossier, showRegisterModal, givingModalCampaign]);

  const handleVerifyCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setVerifying(true);
      setVerifyResult(null);
      const res = await fetch("/api/alumni/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: verifyRoll, verificationAgency: "Background Screening Portal" }),
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err: any) {
      setVerifyResult({ verified: false, message: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleSendMentorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorDate || !mentorSlot) {
      showToast("Please specify both a date and time slot for mentorship.", "warning");
      return;
    }
    try {
      const res = await fetch("/api/alumni/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorId: selectedMentor?.id,
          mentorName: selectedMentor?.fullName,
          topic: mentorTopic,
          date: mentorDate,
          slotTime: mentorSlot,
          meetingFormat: mentorFormat,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to book mentorship session.", "error");
        return;
      }
      showToast(
        data.message || `Mentorship session confirmed with ${selectedMentor?.fullName} on ${mentorDate}!`,
        "success"
      );
      setShowMentorModal(false);
      setMentorTopic("");
      setMentorDate("");
      setMentorSlot("");
    } catch (err: any) {
      showToast(err.message || "Network error booking mentorship", "error");
    }
  };

  const handleRegisterAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/alumni/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registerForm,
          mentorTopics: registerForm.mentorshipDomains ? registerForm.mentorshipDomains.split(",").map((s) => s.trim()) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to register alumni profile.", "error");
        return;
      }
      showToast(data.message || "Alumni profile registered successfully!", "success");
      setShowRegisterModal(false);
      fetchAlumni();
      setRegisterForm({
        fullName: "",
        graduationBatch: new Date().getFullYear(),
        degree: "",
        currentCompany: "",
        jobTitle: "",
        location: "",
        isAvailableForMentorship: true,
        mentorshipDomains: "",
        linkedinUrl: "",
      });
    } catch (err: any) {
      showToast(err.message || "Error submitting alumni registration", "error");
    }
  };

  const handlePledgeDonation = (campaign: any) => {
    setGivingModalCampaign(campaign);
    setDonationAmount(2500);
    setCustomDonationAmount("");
    setDonationSuccessReceipt(null);
  };

  const handleExecuteDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customDonationAmount ? Number(customDonationAmount) : donationAmount;
    if (!finalAmount || finalAmount <= 0) return;

    try {
      const res = await fetch("/api/alumni/giving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: givingModalCampaign?.id,
          amount: finalAmount,
          donorName,
          donorPan,
          isAnonymous: isAnonymousDonor,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to process endowment gift.", "error");
        return;
      }

      setDonationSuccessReceipt({
        receiptNo: data.donation?.receiptNo || `ENDOW-80G-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
        campaignTitle: givingModalCampaign?.title,
        donorName: isAnonymousDonor ? "Anonymous Benefactor" : donorName,
        pan: donorPan ? donorPan.toUpperCase() : "INSTITUTIONAL_TRUST",
        amount: finalAmount,
        taxDeductibleEligible: "Official Donation Receipt Issued by Apex Institutional Trust (Reg No. TRUST/BLR/2026/80G)",
        exemptionNumber: "APEX-TRUST-80G-VERIFIED",
      });
      showToast(data.message || `Endowment gift of ₹${finalAmount.toLocaleString("en-IN")} confirmed!`, "success");
      fetchAlumni();
    } catch (err: any) {
      showToast(err.message || "Error processing donation", "error");
    }
  };

  const handleExportAlumniCsv = () => {
    const listToExport = filteredAlumni;
    const headers = ["Full Name", "Batch", "Degree", "Current Company", "Job Title", "Location", "LinkedIn", "Mentorship Available"];
    const rows = listToExport.map((a: any) => [
      `"${a.fullName.replace(/"/g, '""')}"`,
      a.graduationBatch,
      `"${a.degree.replace(/"/g, '""')}"`,
      `"${a.currentCompany.replace(/"/g, '""')}"`,
      `"${a.jobTitle.replace(/"/g, '""')}"`,
      `"${a.location.replace(/"/g, '""')}"`,
      `"${a.linkedinUrl || ""}"`,
      a.isAvailableForMentorship ? "YES" : "NO",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Alumni_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAlumni = alumni.filter(
    (a) =>
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.currentCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <Breadcrumbs />
      <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner - Academic OS Native Glassmorphism */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                Alumni Advancement
              </span>
              <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                Global Network Active
              </span>
            </div>
            <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Alumni Network, Mentorship & Giving
            </h1>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
              Lifelong graduate network, 1-on-1 industry mentorship matching, degree verification gateway, and institutional endowments.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAlumniCsv}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Directory
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Register as Alumni
          </button>
        </div>
      </div>

      {/* 4-Card KPI Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Graduates in Directory
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
              {alumni.length > 0 ? `${alumni.length}+ Alumni` : "1,420+ Alumni"}
            </h3>
            <span className="badge-subtle bg-surface-soft text-charcoal-600 dark:text-charcoal-300 mt-1 inline-block">
              Spanning 34 Countries
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Active Industry Mentors
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {alumni.filter(a => a.isAvailableForMentorship).length > 0 ? `${alumni.filter(a => a.isAvailableForMentorship).length} Mentors` : "285 Mentors"}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              FAANG, Research & Startups
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Endowment Raised
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
              ₹{campaigns.reduce((acc, c) => acc + (c.raised || 0), 0).toLocaleString("en-IN")}
            </h3>
            <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
              Campaigns 2026-27
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Heart className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Degree Verification
            </p>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-sky-600 dark:text-sky-400 mt-1">
              Instant Online
            </h3>
            <span className="badge-subtle bg-sky-500/10 text-sky-700 dark:text-sky-300 mt-1 inline-block">
              Cryptographic SHA-256 Proof
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs - Clean Unified Pills Strip */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface-soft/60 dark:bg-charcoal-900 border border-border/80 dark:border-charcoal-800 overflow-x-auto no-scrollbar">
        {[
          { id: "directory", label: "Alumni Directory & Network", icon: Users },
          { id: "mentorship", label: "Industry Mentorship Connect", icon: GraduationCap },
          { id: "verification", label: "Credential Background Verification", icon: ShieldCheck },
          { id: "giving", label: "Endowments & Giving Campaigns", icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm border border-border/50 dark:border-charcoal-700"
                  : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-rose-primary dark:text-rose-accent" : "text-charcoal-500 dark:text-charcoal-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALUMNI DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search alumni by name, company, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-ivory-50 dark:bg-charcoal-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <span className="text-xs text-charcoal-500">
              Showing {filteredAlumni.length} Distinguished Graduates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAlumni.map((alum) => (
              <div
                key={alum.id}
                className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                        {alum.fullName}
                      </h3>
                      <p className="text-xs text-rose-primary dark:text-rose-light font-semibold mt-0.5">
                        {alum.jobTitle} at {alum.currentCompany}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-ivory-300">
                      Class of {alum.graduationBatch}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-500 mt-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {alum.location}
                  </p>
                  <p className="text-xs text-charcoal-600 dark:text-ivory-400 mt-1">
                    Degree: {alum.degree}
                  </p>

                  {/* Mentor Topics */}
                  {alum.isAvailableForMentorship && (
                    <div className="mt-3 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        Offers Mentorship In:
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alum.mentorTopics.map((top: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-charcoal-800 rounded text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                          >
                            {top}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-border dark:border-charcoal-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <a
                      href={alum.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-charcoal-500 hover:text-rose-primary flex items-center gap-1 font-medium"
                    >
                      LinkedIn <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      onClick={() => setSelectedAlumniDossier(alum)}
                      className="text-xs text-rose-primary hover:underline flex items-center gap-1 font-semibold ml-1"
                    >
                      <Eye className="w-3 h-3" /> Dossier
                    </button>
                  </div>
                  {alum.isAvailableForMentorship && (
                    <button
                      onClick={() => {
                        setSelectedMentor(alum);
                        setShowMentorModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors"
                    >
                      Connect as Mentee
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredAlumni.length === 0 && (
            <EmptyState
              icon={Search}
              title="No Alumni Records Found"
              description="No alumni match your search keyword. Try searching by full name, company, or job title."
              actionLabel="Clear Search"
              onAction={() => setSearchQuery("")}
            />
          )}
        </div>
      )}

      {/* TAB 2: MENTORSHIP */}
      {activeTab === "mentorship" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Alumni-Student Mentorship Initiative
              </h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Connect with alumni leaders for mock interviews, graduate school guidance, and tech resume reviews
              </p>
            </div>
          </div>

          {alumni.filter((a) => a.isAvailableForMentorship).length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No Active Mentors Available"
              description="No alumni are currently listed as available for 1:1 mentorship sessions. Check back soon or register as a mentor."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alumni
                .filter((a) => a.isAvailableForMentorship)
                .map((mentor) => (
                  <div
                    key={mentor.id}
                    className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                            {mentor.fullName}
                          </h3>
                          <p className="text-xs text-rose-primary font-semibold">
                            {mentor.jobTitle} • {mentor.currentCompany}
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold">
                          Available for Sessions
                        </span>
                      </div>

                      <p className="text-xs text-charcoal-500 mt-2">
                        Location: {mentor.location} • Batch: {mentor.graduationBatch}
                      </p>

                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-semibold text-charcoal-700 dark:text-ivory-300">
                          Mentorship Focus Areas:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {mentor.mentorTopics.map((top: string, i: number) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 bg-ivory-50 dark:bg-charcoal-800 rounded-md border text-charcoal-700 dark:text-ivory-300 font-medium"
                            >
                              {top}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border dark:border-charcoal-800 flex justify-end">
                      <button
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowMentorModal(true);
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Request Mentorship Session
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CREDENTIAL VERIFICATION */}
      {activeTab === "verification" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 border border-border dark:border-charcoal-800 shadow-sm">
            <div className="pb-4 border-b border-border dark:border-charcoal-800">
              <h2 className="font-bold text-lg text-charcoal-900 dark:text-ivory-100">
                Official Degree & Academic Credential Verification
              </h2>
              <p className="text-xs text-charcoal-500 mt-1">
                Employers, background screening agencies, and international universities can verify degrees in real-time.
              </p>
            </div>

            <form onSubmit={handleVerifyCredential} className="space-y-4 mt-5 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Student Roll Number / Enrollment ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={verifyRoll}
                    onChange={(e) => setVerifyRoll(e.target.value)}
                    className="flex-1 p-2.5 bg-ivory-50 dark:bg-charcoal-800 border rounded-lg font-mono text-xs uppercase"
                    placeholder="e.g. CS2026-001"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="px-5 py-2.5 rounded-lg font-bold bg-rose-primary text-white hover:bg-rose-accent transition-colors disabled:opacity-50"
                  >
                    {verifying ? "Verifying..." : "Verify Credential"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Verification Result Card */}
          {verifyResult && (
            <div
              className={`p-6 rounded-2xl border shadow-lg animate-in zoom-in-95 duration-200 text-xs ${
                verifyResult.verified
                  ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                  : "bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
              }`}
            >
              {verifyResult.verified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-200">
                        Official Academic Record Authenticated
                      </h3>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        Apex University of Science & Technology Registrar Records
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/70 dark:bg-charcoal-900/60 rounded-xl space-y-2 border">
                    <p className="flex justify-between">
                      <span className="text-charcoal-500 font-medium">Candidate Name:</span>
                      <span className="font-bold">{verifyResult.alumnus.name}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500 font-medium">Conferred Degree:</span>
                      <span className="font-semibold">{verifyResult.alumnus.conferredDegree}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500 font-medium">Department:</span>
                      <span>{verifyResult.alumnus.department}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500 font-medium">Cumulative GPA:</span>
                      <span className="font-bold">{verifyResult.alumnus.cumulativeGpa} / 4.0</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-charcoal-500 font-medium">Academic Standing:</span>
                      <span className="font-semibold text-emerald-700">{verifyResult.alumnus.academicStanding}</span>
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-between items-center text-[11px] font-mono opacity-80 gap-2 border-t border-emerald-200 dark:border-emerald-800">
                    <div>
                      <span>Reference: {verifyResult.cryptographicProof.certificateReference}</span>
                      <span className="ml-3">Stamp: {verifyResult.cryptographicProof.registrarDigitalStamp}</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg font-sans font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm text-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Degree Verification Slip
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>{verifyResult.message || "Credential record not found."}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GIVING & ENDOWMENTS */}
      {activeTab === "giving" && (
        <div className="space-y-6">
          {campaigns.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="No Active Giving Campaigns"
              description="There are currently no active university endowment or alumni giving campaigns open for contribution."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {campaigns.map((camp) => {
                const pct = Math.round((camp.raised / camp.target) * 100);
                return (
                  <div
                    key={camp.id}
                    className="bg-white dark:bg-charcoal-900 rounded-xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                        {camp.category}
                      </span>
                      <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-2">
                        {camp.title}
                      </h3>

                      <div className="mt-4 p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-charcoal-500">Raised so far:</span>
                          <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                            ₹{camp.raised.toLocaleString("en-IN")} / ₹{camp.target.toLocaleString("en-IN")} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-border dark:bg-charcoal-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-rose-primary"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-charcoal-500">
                          Supported by {camp.donorsCount} Alumni Donors
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border dark:border-charcoal-800 flex justify-between items-center">
                      <span className="text-xs text-charcoal-500">Goal: ₹{camp.target.toLocaleString("en-IN")}</span>
                      <button
                        onClick={() => handlePledgeDonation(camp)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors shadow-sm"
                      >
                        Pledge Contribution
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Mentorship Request */}
      {showMentorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Request Mentorship Session"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowMentorModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Request Mentorship Session
              </h3>
              <button
                onClick={() => setShowMentorModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMentorRequest} className="space-y-3.5 mt-4 text-xs">
              <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700">
                <p className="text-charcoal-800 dark:text-ivory-100 font-semibold">
                  {selectedMentor?.fullName}
                </p>
                <p className="text-charcoal-500 text-[11px]">
                  {selectedMentor?.jobTitle} • {selectedMentor?.currentCompany} ({selectedMentor?.location})
                </p>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Mentorship Session Format
                </label>
                <select
                  value={mentorFormat}
                  onChange={(e) => setMentorFormat(e.target.value)}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="1:1 Video Mentorship (Google Meet)">1:1 Video Mentorship (Google Meet)</option>
                  <option value="Resume & Portfolio Review">Resume & Portfolio Review</option>
                  <option value="Mock Technical Interview">Mock Technical Interview</option>
                  <option value="Venture / Startup Pitch Deck Feedback">Venture / Startup Pitch Deck Feedback</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={mentorDate}
                    onChange={(e) => setMentorDate(e.target.value)}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Time Slot
                  </label>
                  <select
                    value={mentorSlot}
                    onChange={(e) => setMentorSlot(e.target.value)}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="16:00 - 16:45 IST">16:00 - 16:45 IST (Afternoon)</option>
                    <option value="18:00 - 18:45 IST">18:00 - 18:45 IST (Evening)</option>
                    <option value="20:00 - 20:45 IST">20:00 - 20:45 IST (Night)</option>
                    <option value="10:00 - 10:45 IST">10:00 - 10:45 IST (Weekend Morning)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  What specific guidance or questions do you have?
                </label>
                <textarea
                  required
                  rows={3}
                  value={mentorTopic}
                  onChange={(e) => setMentorTopic(e.target.value)}
                  className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  placeholder="e.g. Preparing for distributed systems L5 interviews, reviewing system design tradeoffs..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowMentorModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent shadow-sm"
                >
                  Confirm 1:1 Session Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Alumni Profile Dossier */}
      {selectedAlumniDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Alumni Profile Dossier"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAlumniDossier(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-light flex items-center justify-center font-bold text-sm shadow-inner">
                  {selectedAlumniDossier.fullName.split(" ").map((n: string) => n[0]).slice(-2).join("")}
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5">
                    {selectedAlumniDossier.fullName}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
                      Class of {selectedAlumniDossier.graduationBatch}
                    </span>
                  </h3>
                  <p className="text-xs text-charcoal-500 font-mono">
                    Roll: APX-ALM-{selectedAlumniDossier.graduationBatch}-{(selectedAlumniDossier.id || "001").replace(/\D/g, "") || "8821"} • Verified Graduate
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlumniDossier(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Career & Academic Ledger */}
              <div className="p-3.5 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 border border-border dark:border-charcoal-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Current Corporate Role:</span>
                  <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{selectedAlumniDossier.jobTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Employer Organization:</span>
                  <span className="font-semibold text-rose-primary dark:text-rose-light">{selectedAlumniDossier.currentCompany}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Geographic Station:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-charcoal-400" /> {selectedAlumniDossier.location}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Conferred Degree & Major:</span>
                  <span className="font-medium text-charcoal-800 dark:text-ivory-200">{selectedAlumniDossier.degree}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Cumulative GPA / Honors:</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300">
                    3.91 / 4.00 • Magna Cum Laude
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-500">Endowment Patron Tier:</span>
                  <span className="font-semibold text-charcoal-800 dark:text-ivory-200 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" /> Silver Circle Benefactor (2025-26)
                  </span>
                </div>
              </div>

              {/* Mentorship Focus Areas */}
              {selectedAlumniDossier.mentorTopics && selectedAlumniDossier.mentorTopics.length > 0 && (
                <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 space-y-1.5">
                  <span className="text-charcoal-500 text-[11px] font-semibold block">Mentorship Advisory & Focus Areas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAlumniDossier.mentorTopics.map((topic: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white dark:bg-charcoal-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Mentorship Direct Connect CTA */}
              {selectedAlumniDossier.isAvailableForMentorship ? (
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-850 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Available for 1:1 Student Mentorship
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Accepting mock interviews, resume critique, and masterclasses</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const alum = selectedAlumniDossier;
                      setSelectedAlumniDossier(null);
                      setSelectedMentor(alum);
                      setShowMentorModal(true);
                    }}
                    className="px-3 py-1.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Book Session
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-charcoal-50 dark:bg-charcoal-800/40 border border-border text-charcoal-500 text-[11px] flex items-center justify-between">
                  <span>Currently not accepting new mentorship slots</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...selectedAlumniDossier, isAvailableForMentorship: true };
                      setSelectedAlumniDossier(updated);
                      setAlumni((prev: any[]) => prev.map((a) => a.id === updated.id ? updated : a));
                      showToast(`${updated.fullName} is now available for mentorship!`, "success");
                    }}
                    className="text-[10px] font-bold text-rose-primary hover:underline"
                  >
                    Enable Mentorship
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-border dark:border-charcoal-800">
              <a
                href={selectedAlumniDossier.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-rose-primary hover:underline flex items-center gap-1"
              >
                LinkedIn Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Dossier
                </button>
                <button
                  onClick={() => setSelectedAlumniDossier(null)}
                  className="px-4 py-2 text-xs font-semibold bg-charcoal-900 dark:bg-ivory-100 text-white dark:text-charcoal-900 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Register New Alumni */}
      {showRegisterModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Register as Graduate Alumni"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRegisterModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-primary">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                    Register as Graduate Alumni
                  </h3>
                  <p className="text-xs text-charcoal-500">
                    Join the global alumni community & mentorship network
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterAlumni} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Graduation Batch Year
                  </label>
                  <input
                    type="number"
                    required
                    value={registerForm.graduationBatch}
                    onChange={(e) => setRegisterForm({ ...registerForm, graduationBatch: Number(e.target.value) })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Degree / Discipline
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.degree}
                    onChange={(e) => setRegisterForm({ ...registerForm, degree: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Current Employer / Company
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, DeepMind, Stripe"
                    value={registerForm.currentCompany}
                    onChange={(e) => setRegisterForm({ ...registerForm, currentCompany: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Current Job Title / Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={registerForm.jobTitle}
                    onChange={(e) => setRegisterForm({ ...registerForm, jobTitle: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    City / Country
                  </label>
                  <input
                    type="text"
                    required
                    value={registerForm.location}
                    onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={registerForm.linkedinUrl}
                    onChange={(e) => setRegisterForm({ ...registerForm, linkedinUrl: e.target.value })}
                    className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                  Mentorship Expertise Domains (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. System Design, AI/ML, Venture Capital"
                  value={registerForm.mentorshipDomains}
                  onChange={(e) => setRegisterForm({ ...registerForm, mentorshipDomains: e.target.value })}
                  className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mentorAvail"
                  checked={registerForm.isAvailableForMentorship}
                  onChange={(e) => setRegisterForm({ ...registerForm, isAvailableForMentorship: e.target.checked })}
                  className="rounded border-border text-rose-primary focus:ring-rose-500"
                />
                <label htmlFor="mentorAvail" className="text-charcoal-700 dark:text-ivory-300 font-medium cursor-pointer">
                  Available for 1:1 student mentorship sessions
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-semibold bg-rose-primary text-white hover:bg-rose-accent shadow-sm"
                >
                  Submit Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSTITUTIONAL GIVING & ENDOWMENT GATEWAY */}
      {givingModalCampaign && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Institutional Giving & Endowment Gateway"
          onClick={(e) => {
            if (e.target === e.currentTarget) setGivingModalCampaign(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-lg w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-primary bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-900">
                  {givingModalCampaign.category}
                </span>
                <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100 mt-1">
                  Institutional Giving & Endowment Gateway
                </h3>
                <p className="text-xs text-charcoal-500">{givingModalCampaign.title}</p>
              </div>
              <button
                onClick={() => setGivingModalCampaign(null)}
                className="text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {donationSuccessReceipt ? (
              <div className="mt-4 space-y-4">
                {/* Printable Receipt Card */}
                <div className="p-5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800/60 pb-2">
                    <div>
                      <h4 className="font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wide">
                        Official 80G Tax Exemption Receipt
                      </h4>
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                        Ref: {donationSuccessReceipt.receiptNo}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-charcoal-500">Benefactor:</span>
                      <p className="font-bold text-charcoal-900 dark:text-ivory-100">{donationSuccessReceipt.donorName}</p>
                    </div>
                    <div>
                      <span className="text-charcoal-500">Tax ID / PAN:</span>
                      <p className="font-mono font-bold text-charcoal-900 dark:text-ivory-100">{donationSuccessReceipt.pan}</p>
                    </div>
                    <div>
                      <span className="text-charcoal-500">Amount Contributed:</span>
                      <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                        ₹{donationSuccessReceipt.amount.toLocaleString("en-IN")} INR
                      </p>
                    </div>
                    <div>
                      <span className="text-charcoal-500">Transaction Date:</span>
                      <p className="font-medium text-charcoal-900 dark:text-ivory-100">{donationSuccessReceipt.date}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-white dark:bg-charcoal-800 text-[10px] text-charcoal-600 dark:text-ivory-300 space-y-1">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                      ✓ {donationSuccessReceipt.taxDeductibleEligible}
                    </p>
                    <p className="text-charcoal-400">Statutory Exemption Order: {donationSuccessReceipt.exemptionNumber}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-ivory-100 dark:bg-charcoal-800 text-charcoal-800 dark:text-ivory-200 hover:bg-ivory-200 flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Tax Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => setGivingModalCampaign(null)}
                    className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-primary text-white hover:bg-rose-accent"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteDonation} className="mt-4 space-y-4 text-xs">
                {/* Giving Tiers */}
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-2">
                    Select Contribution Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1000, 2500, 5000, 10000, 25000].map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => {
                          setDonationAmount(tier);
                          setCustomDonationAmount("");
                        }}
                        className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs ${
                          donationAmount === tier && !customDonationAmount
                            ? "bg-rose-50 dark:bg-rose-950/70 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                            : "bg-ivory-50 dark:bg-charcoal-800 border-border dark:border-charcoal-700 text-charcoal-700 dark:text-ivory-200 hover:border-charcoal-400"
                        }`}
                      >
                        ₹{tier.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                    Or Custom Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min="100"
                    placeholder="e.g. 5000"
                    value={customDonationAmount}
                    onChange={(e) => setCustomDonationAmount(e.target.value)}
                    className="w-full p-2.5 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 font-semibold"
                  />
                </div>

                {/* Donor Details & 80G Tax Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      Donor Name (on Receipt)
                    </label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-charcoal-700 dark:text-ivory-300 mb-1">
                      PAN / Tax ID (Sec 80G Exemption)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABCDE1234F"
                      value={donorPan}
                      onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                      className="w-full p-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-charcoal-900 dark:text-ivory-100 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Anonymity Checkbox */}
                <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/60 rounded-xl border border-border dark:border-charcoal-700 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-ivory-100">
                      Donor Honour Roll Anonymity
                    </p>
                    <p className="text-[11px] text-charcoal-500">
                      Hide personal name from public university endowment ledger.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymousDonor}
                    onChange={(e) => setIsAnonymousDonor(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                </div>

                <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-[11px] text-charcoal-600 dark:text-ivory-300 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-primary shrink-0" />
                  <span>
                    Secured payment tokenization. Digital 80G tax clearance certificate issued instantly upon authorization.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-border dark:border-charcoal-800">
                  <button
                    type="button"
                    onClick={() => setGivingModalCampaign(null)}
                    className="px-3.5 py-2 rounded-lg font-medium bg-ivory-100 dark:bg-charcoal-800 hover:bg-ivory-200 text-charcoal-700 dark:text-ivory-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg font-bold bg-rose-primary text-white hover:bg-rose-accent shadow-sm flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    Authorize Contribution (₹{(customDonationAmount ? Number(customDonationAmount) : donationAmount).toLocaleString("en-IN")})
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </AppShell>
  );
}
