"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function AlumniPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"directory" | "mentorship" | "verification" | "giving">("directory");
  const [loading, setLoading] = useState(true);
  const [alumni, setAlumni] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedAlumniDossier, setSelectedAlumniDossier] = useState<any | null>(null);

  // Degree Verification Form
  const [verifyRoll, setVerifyRoll] = useState("CS2026-001");
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Mentorship Modal & Booking Flow
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [mentorTopic, setMentorTopic] = useState("");
  const [mentorDate, setMentorDate] = useState("2026-11-15");
  const [mentorSlot, setMentorSlot] = useState("16:00 - 16:45 IST");
  const [mentorFormat, setMentorFormat] = useState("1:1 Video Mentorship (Google Meet)");

  // Register Alumni Form
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    graduationBatch: 2024,
    degree: "B.Tech Computer Science",
    currentCompany: "",
    jobTitle: "",
    location: "Bengaluru, India",
    isAvailableForMentorship: true,
    mentorshipDomains: "Cloud Architecture, Career Guidance",
    linkedinUrl: "https://linkedin.com/in/",
  });

  // Giving Campaigns
  const [campaigns, setCampaigns] = useState([
    {
      id: "camp-01",
      title: "Dean's Merit Scholarship Endowment Fund",
      target: 250000,
      raised: 184500,
      donorsCount: 312,
      category: "Student Financial Aid",
      deadline: "2026-12-31",
    },
    {
      id: "camp-02",
      title: "High Performance AI & Quantum Compute Cluster",
      target: 500000,
      raised: 412000,
      donorsCount: 148,
      category: "Research Infrastructure",
      deadline: "2026-11-30",
    },
    {
      id: "camp-03",
      title: "Olympic Standard Student Gymnasium & Athletics Pavillion",
      target: 150000,
      raised: 92400,
      donorsCount: 220,
      category: "Campus Sports",
      deadline: "2027-03-31",
    },
  ]);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alumni/directory");
      if (res.ok) {
        const data = await res.json();
        setAlumni(data.alumni || []);
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

  const handleSendMentorRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const meetLink = `https://meet.apex.edu/alumni-${Math.random().toString(36).substring(2, 7)}`;
    setStatusMessage({
      type: "success",
      text: `1:1 Mentorship session confirmed with ${selectedMentor?.fullName} on ${mentorDate} at ${mentorSlot}! Meeting Link: ${meetLink}`,
    });
    setShowMentorModal(false);
    setMentorTopic("");
  };

  const handleRegisterAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlumnus = {
      id: `alm-${Date.now().toString().slice(-4)}`,
      fullName: registerForm.fullName,
      graduationBatch: Number(registerForm.graduationBatch),
      degree: registerForm.degree,
      currentCompany: registerForm.currentCompany,
      jobTitle: registerForm.jobTitle,
      location: registerForm.location,
      isAvailableForMentorship: registerForm.isAvailableForMentorship,
      mentorshipDomains: registerForm.mentorshipDomains.split(",").map((s) => s.trim()),
      linkedinUrl: registerForm.linkedinUrl,
    };
    setAlumni([newAlumnus, ...alumni]);
    setStatusMessage({
      type: "success",
      text: `Congratulations! ${registerForm.fullName} has been officially registered in the Institutional Alumni Directory.`,
    });
    setShowRegisterModal(false);
    setRegisterForm({
      fullName: "",
      graduationBatch: 2024,
      degree: "B.Tech Computer Science",
      currentCompany: "",
      jobTitle: "",
      location: "Bengaluru, India",
      isAvailableForMentorship: true,
      mentorshipDomains: "Cloud Architecture, Career Guidance",
      linkedinUrl: "https://linkedin.com/in/",
    });
  };

  const handlePledgeDonation = (campaignTitle: string) => {
    setStatusMessage({
      type: "success",
      text: `Thank you for contributing to "${campaignTitle}"! Endowment acknowledgment receipt sent.`,
    });
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
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-charcoal-900 via-rose-950 to-charcoal-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-200 border border-rose-400/30">
                Alumni Relations & Institutional Advancement
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Global Network Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Alumni Network, Mentorship & Giving
            </h1>
            <p className="text-sm md:text-base text-rose-100/80 mt-1 max-w-2xl">
              Lifelong graduate network, 1-on-1 industry mentorship matching, degree verification gateway, and institutional endowments.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportAlumniCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-sm transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              Export Directory (CSV)
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-rose-primary hover:bg-rose-600 text-white shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Register as Alumni
            </button>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-rose-900/50">
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Graduates in Directory</p>
            <p className="text-xl md:text-2xl font-bold mt-1">1,420+ Alumni</p>
            <p className="text-xs text-rose-300 mt-0.5">Spanning 34 Countries</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Active Industry Mentors</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-emerald-300">285 Mentors</p>
            <p className="text-xs text-rose-300 mt-0.5">FAANG, Research & Startups</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Endowment Raised</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-amber-300">
              ${campaigns.reduce((acc, c) => acc + c.raised, 0).toLocaleString()}
            </p>
            <p className="text-xs text-rose-300 mt-0.5">Campaigns 2026-27</p>
          </div>
          <div>
            <p className="text-xs text-rose-200 uppercase tracking-wider font-semibold">Degree Verification</p>
            <p className="text-xl md:text-2xl font-bold mt-1 text-cyan-300">Instant Online</p>
            <p className="text-xs text-rose-300 mt-0.5">Cryptographic SHA-256 Proof</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline hover:opacity-80 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border dark:border-charcoal-800 space-x-2 overflow-x-auto pb-px">
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
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-rose-primary text-rose-primary dark:text-rose-light dark:border-rose-light"
                  : "border-transparent text-charcoal-600 dark:text-ivory-400 hover:text-charcoal-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
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
            <div className="bg-white dark:bg-charcoal-900 rounded-xl p-12 border border-border dark:border-charcoal-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mx-auto text-rose-primary dark:text-rose-light">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                No Alumni Records Found
              </h3>
              <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
                No alumni match your search keyword. Try searching by full name, company, or job title.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 text-xs font-semibold bg-rose-primary text-white rounded-lg hover:bg-rose-accent transition-colors shadow-sm"
              >
                Clear Search
              </button>
            </div>
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
                          ${camp.raised.toLocaleString()} / ${camp.target.toLocaleString()} ({pct}%)
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
                    <span className="text-xs text-charcoal-500">Goal: ${camp.target.toLocaleString()}</span>
                    <button
                      onClick={() => handlePledgeDonation(camp.title)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-primary text-white hover:bg-rose-accent transition-colors shadow-sm"
                    >
                      Pledge Contribution
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Mentorship Request */}
      {showMentorModal && (
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl max-w-md w-full p-6 border border-border dark:border-charcoal-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-charcoal-800">
              <h3 className="font-bold text-base text-charcoal-900 dark:text-ivory-100">
                Request Mentorship Session
              </h3>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
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
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
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
                      setStatusMessage({ type: "success", text: `${updated.fullName} is now available for mentorship!` });
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
        <div className="fixed inset-0 z-50 bg-charcoal-950/70 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="text-charcoal-500 hover:text-charcoal-900 text-sm font-bold"
              >
                ✕
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
    </div>
  );
}
