"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Sparkles,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Building,
  Target,
  FileBadge,
  Check,
  X,
  Compass,
  Download,
  Search,
  Filter,
  Eye,
  Printer,
  CheckSquare,
  Square,
  Upload,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { StudentClub, ActivityPointClaim, DEGREE_REQUIRED_ACTIVITY_POINTS } from "@/lib/clubs/clubs-engine";

interface ClubsSummary {
  totalClubs: number;
  totalMembers: number;
  totalClaims: number;
  pendingReviewCount: number;
  studentProgress: {
    totalPoints: number;
    requiredPoints: number;
    completionPercentage: number;
    isEligibleForDegree: boolean;
    byCategory: Record<string, number>;
  };
  clubs: StudentClub[];
}

export default function ClubsPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"portfolio" | "directory" | "verify">("portfolio");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ClubsSummary | null>(null);
  const [claims, setClaims] = useState<ActivityPointClaim[]>([]);
  const [clubs, setClubs] = useState<StudentClub[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedClaimDossier, setSelectedClaimDossier] = useState<ActivityPointClaim | null>(null);
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedCertHash, setUploadedCertHash] = useState<string | null>(null);
  const [showHonoursCertModal, setShowHonoursCertModal] = useState(false);

  const filteredClaims = claims.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.activityTitle.toLowerCase().includes(q) ||
      c.clubName.toLowerCase().includes(q) ||
      c.claimRef.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.studentRoll.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "ALL" || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredClubs = clubs.filter((club) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      club.name.toLowerCase().includes(q) ||
      club.code.toLowerCase().includes(q) ||
      club.description.toLowerCase().includes(q) ||
      club.presidentName.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === "ALL" || club.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportClubsCsv = () => {
    const headers = "Claim ID,Student Roll,Student Name,Club Code,Activity Title,Points Claimed,Awarded Points,Status,Submission Date\n";
    const rows = filteredClaims
      .map((c) => `"${c.id}","${c.studentRoll}","${c.studentName}","${c.clubCode}","${c.activityTitle}",${c.pointsClaimed},${c.pointsAwarded},"${c.status}","${c.submittedAt}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Student_Activity_Points_Claims_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const userRoll = (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber || "CS2026-001";
  const userName = currentUser?.fullName || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ""}`.trim() : "Scholar Candidate");

  // New Claim Modal
  const [showModal, setShowModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    studentRoll: userRoll,
    studentName: userName,
    clubCode: "IEEE-SB",
    activityTitle: "",
    description: "",
    participationHours: 12,
    pointsClaimed: 15,
    evidenceReference: "",
  });

  // Sync claimForm when currentUser loads
  useEffect(() => {
    if (currentUser) {
      setClaimForm((prev) => ({
        ...prev,
        studentRoll: (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber || prev.studentRoll,
        studentName: currentUser.fullName || prev.studentName,
      }));
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const activeRoll = (currentUser as any)?.studentRollNumber || (currentUser as any)?.rollNo || (currentUser as any)?.rollNumber || "CS2026-001";
      const [sumRes, clmRes, clbRes] = await Promise.all([
        fetch(`/api/clubs?tab=summary&roll=${encodeURIComponent(activeRoll)}`),
        fetch("/api/clubs?tab=claims"),
        fetch("/api/clubs?tab=clubs"),
      ]);

      if (sumRes.ok) {
        const sData = await sumRes.json();
        setSummary(sData.summary);
      }
      if (clmRes.ok) {
        const cData = await clmRes.json();
        setClaims(cData.claims || []);
      }
      if (clbRes.ok) {
        const bData = await clbRes.json();
        setClubs(bData.clubs || []);
      }
    } catch (err) {
      console.error("Failed to load clubs data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_CLAIM",
          ...claimForm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit activity point claim");

      setStatusMessage({ type: "success", text: data.message });
      setShowModal(false);
      setClaimForm({
        studentRoll: "CS2026-001",
        studentName: currentUser?.fullName || "Alex Mercer",
        clubCode: "IEEE-SB",
        activityTitle: "",
        description: "",
        participationHours: 12,
        pointsClaimed: 15,
        evidenceReference: "",
      });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleVerifyClaim = async (claimId: string, status: "APPROVED" | "REJECTED", points?: number) => {
    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "VERIFY_CLAIM",
          claimId,
          status,
          pointsAwarded: points,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify claim");

      setStatusMessage({ type: "success", text: data.message });
      fetchData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleToggleSelectClaim = (id: string) => {
    setSelectedClaimIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSelectAllClaims = () => {
    const pendingClaims = claims.filter((c) => c.status === "PENDING_FACULTY_REVIEW");
    if (selectedClaimIds.length === pendingClaims.length) {
      setSelectedClaimIds([]);
    } else {
      setSelectedClaimIds(pendingClaims.map((c) => c.id));
    }
  };

  const handleBulkVerifyClaims = async (status: "APPROVED" | "REJECTED") => {
    if (selectedClaimIds.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(
        selectedClaimIds.map((claimId) => {
          const claim = claims.find((c) => c.id === claimId);
          return fetch("/api/clubs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "VERIFY_CLAIM",
              claimId,
              status,
              pointsAwarded: status === "APPROVED" ? (claim?.pointsClaimed || 10) : 0,
            }),
          });
        })
      );
      setStatusMessage({
        type: "success",
        text: `Successfully bulk ${status.toLowerCase()}d ${selectedClaimIds.length} student activity point claims.`,
      });
      setSelectedClaimIds([]);
      fetchData();
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Bulk claims verification failed" });
    } finally {
      setLoading(false);
    }
  };

  const progress = summary?.studentProgress;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Student Clubs & Activity Points Suite
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Societies, technical chapters, and statutory 100-point degree graduation accreditation.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search clubs, claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-48"
            />
          </div>
          <button
            onClick={handleExportClubsCsv}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" />
            Export Claims (CSV)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Claim Activity Points
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {statusMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Graduation Points Progress Hero Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Statutory Degree Accreditation Benchmark
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Activity Points Portfolio: {progress?.totalPoints ?? 40} / {DEGREE_REQUIRED_ACTIVITY_POINTS} Points
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowHonoursCertModal(true)}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Award className="w-3.5 h-3.5" />
              Official Honours Certificate
            </button>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold w-fit ${
                progress?.isEligibleForDegree
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              }`}
            >
              {progress?.isEligibleForDegree ? "✓ Degree Clearance Qualified" : "⏳ In Progress"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
          <div
            className="bg-amber-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress?.completionPercentage ?? 40}%` }}
          />
        </div>

        {/* Categories Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 block">Technical</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {progress?.byCategory?.TECHNICAL ?? 25} pts
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 block">Social Service</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {progress?.byCategory?.SOCIAL_SERVICE ?? 15} pts
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 block">Cultural</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {progress?.byCategory?.CULTURAL ?? 0} pts
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 block">Sports</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {progress?.byCategory?.SPORTS ?? 0} pts
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
            <span className="text-slate-400 block">Entrepreneurship</span>
            <span className="font-bold text-slate-900 dark:text-white text-base">
              {progress?.byCategory?.ENTREPRENEURSHIP ?? 0} pts
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recognized Clubs</span>
            <Compass className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalClubs ?? "--"}
            </span>
            <span className="text-xs text-slate-500">societies</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Active campus student bodies</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Members</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalMembers?.toLocaleString() ?? "--"}
            </span>
            <span className="text-xs text-indigo-600 dark:text-indigo-400">students</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Enrolled across clubs & teams</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Claims Submitted</span>
            <FileBadge className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.totalClaims ?? "--"}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400">certificates</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Logged co-curricular participations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Faculty Review</span>
            <Clock className="w-5 h-5 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {summary?.pendingReviewCount ?? "--"}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400">claims</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Awaiting advisor verification</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab("portfolio")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "portfolio"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          My Activity Portfolio ({claims.length})
        </button>

        <button
          onClick={() => setActiveTab("directory")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "directory"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <Compass className="w-4 h-4" />
          Campus Clubs Directory ({clubs.length})
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "verify"
              ? "border-amber-600 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Faculty Verification Desk ({summary?.pendingReviewCount || 0})
        </button>
      </div>

      {/* Tab 1: Activity Portfolio */}
      {activeTab === "portfolio" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Submitted Activity Records</h3>
              <p className="text-xs text-slate-400">{filteredClaims.length} of {claims.length} claims matching</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search activity, club, roll #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 w-48 sm:w-56"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="TECHNICAL">TECHNICAL</option>
                  <option value="CULTURAL">CULTURAL</option>
                  <option value="SPORTS">SPORTS</option>
                  <option value="SOCIAL_SERVICE">SOCIAL_SERVICE</option>
                  <option value="ENTREPRENEURSHIP">ENTREPRENEURSHIP</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="p-4">Claim Ref</th>
                  <th className="p-4">Activity & Description</th>
                  <th className="p-4">Club / Category</th>
                  <th className="p-4">Hours</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Status & Reviewer</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClaims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-4 font-mono font-medium text-xs text-amber-600 dark:text-amber-400">
                      {c.claimRef}
                    </td>
                    <td className="p-4 max-w-sm">
                      <div className="font-medium text-slate-900 dark:text-white">{c.activityTitle}</div>
                      <div className="text-xs text-slate-400 truncate">{c.description}</div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{c.clubName}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] text-slate-500 font-semibold">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono">
                      {c.participationHours} hrs
                    </td>
                    <td className="p-4 font-bold text-xs">
                      {c.status === "APPROVED" ? (
                        <span className="text-emerald-600 dark:text-emerald-400">+{c.pointsAwarded} pts</span>
                      ) : (
                        <span className="text-slate-400">{c.pointsClaimed} pts claimed</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          c.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : c.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}
                      >
                        {c.status === "APPROVED" ? "Approved" : c.status === "REJECTED" ? "Rejected" : "Pending Review"}
                      </span>
                      {c.reviewedBy && (
                        <div className="text-[11px] text-slate-400 mt-1">By: {c.reviewedBy}</div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedClaimDossier(c)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClaims.length === 0 && (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Activity Point Claims Found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No co-curricular activity claims match your search keywords or category filter.
              </p>
              <button
                onClick={() => {
                  setCategoryFilter("ALL");
                  setSearchQuery("");
                }}
                className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Clubs Directory */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClubs.map((club) => (
            <div
              key={club.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">{club.name}</h4>
                  <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold rounded-lg text-xs">
                    {club.category}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{club.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">President</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{club.presidentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Members</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{club.totalMembers} students</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                <span>Faculty Advisor: {club.facultyAdvisor}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Verification Desk */}
      {activeTab === "verify" && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Faculty Advisor Verification:</strong> Authenticate student claims against physical event attendance logs and digital participation certificate hashes before awarding degree activity credits.
              </span>
            </div>
            {claims.filter((c) => c.status === "PENDING_FACULTY_REVIEW").length > 0 && (
              <button
                onClick={handleSelectAllClaims}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-sm"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {selectedClaimIds.length === claims.filter((c) => c.status === "PENDING_FACULTY_REVIEW").length
                  ? "Deselect All"
                  : "Select All Pending"}
              </button>
            )}
          </div>

          {/* Sticky Bulk Action Bar */}
          {selectedClaimIds.length > 0 && (
            <div className="bg-slate-900 text-white p-3.5 px-5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xl border border-amber-500/40 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950">
                  {selectedClaimIds.length} Claims Selected
                </span>
                <span className="text-xs text-slate-300 hidden sm:inline">Bulk Accreditation Approval:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkVerifyClaims("APPROVED")}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Bulk Approve Claims
                </button>
                <button
                  onClick={() => handleBulkVerifyClaims("REJECTED")}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => setSelectedClaimIds([])}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims
              .filter((c) => c.status === "PENDING_FACULTY_REVIEW")
              .map((c) => {
                const isSelected = selectedClaimIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-3 transition-all ${
                      isSelected
                        ? "border-amber-500 ring-2 ring-amber-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <button
                          onClick={() => handleToggleSelectClaim(c.id)}
                          className="mt-0.5 text-slate-400 hover:text-amber-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{c.activityTitle}</h4>
                          <p className="text-xs text-slate-400">{c.studentName} ({c.studentRoll})</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded text-xs font-bold shrink-0">
                        {c.pointsClaimed} Pts Claimed
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>

                    {/* Certificate Digital Hash Proof */}
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500" /> Certificate Verified
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">SHA-256: 7f83b165...</span>
                    </div>

                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>Society: {c.clubName}</span>
                      <span>Hours: {c.participationHours} hrs</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => setSelectedClaimDossier(c)}
                        className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        Dossier
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVerifyClaim(c.id, "REJECTED")}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyClaim(c.id, "APPROVED", c.pointsClaimed)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Approve & Award {c.pointsClaimed} Pts
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

            {claims.filter((c) => c.status === "PENDING_FACULTY_REVIEW").length === 0 && (
              <div className="col-span-2 p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
                No pending activity point claims to review. All student petitions are up to date!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Claim Co-Curricular Activity Points
            </h3>

            <form onSubmit={handleSubmitClaim} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Student Roll #</label>
                  <input
                    type="text"
                    required
                    value={claimForm.studentRoll}
                    onChange={(e) => setClaimForm({ ...claimForm, studentRoll: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Club / Society</label>
                  <select
                    value={claimForm.clubCode}
                    onChange={(e) => setClaimForm({ ...claimForm, clubCode: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    {clubs.map((c) => (
                      <option key={c.id} value={c.code}>
                        {c.name} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Activity Title</label>
                <input
                  type="text"
                  required
                  value={claimForm.activityTitle}
                  onChange={(e) => setClaimForm({ ...claimForm, activityTitle: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. Lead Organizer - Inter-College Cultural Fest"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Brief Contribution Summary</label>
                <textarea
                  rows={2}
                  value={claimForm.description}
                  onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="Describe your role, responsibilities, and outcomes"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Participation Hours</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={claimForm.participationHours}
                    onChange={(e) => setClaimForm({ ...claimForm, participationHours: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Points Claimed (Max 30)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={claimForm.pointsClaimed}
                    onChange={(e) => setClaimForm({ ...claimForm, pointsClaimed: Number(e.target.value) })}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Certificate Upload Simulator */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evidence Certificate (PDF / Image)</label>
                <div className="mt-1 p-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center">
                  {uploadedFileName ? (
                    <div className="w-full flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-left">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">{uploadedFileName}</p>
                          <p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">Digest: {uploadedCertHash}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFileName(null);
                          setUploadedCertHash(null);
                        }}
                        className="text-xs text-rose-500 hover:text-rose-700 font-semibold px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-slate-400 dark:text-slate-500" />
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Upload participation certificate or event pass</p>
                      <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 10MB</p>
                      <button
                        type="button"
                        onClick={() => {
                          const fakeHash = "sha256:" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
                          const fakeName = `Certificate_${claimForm.clubCode || "CLUB"}_${Date.now().toString().slice(-4)}.pdf`;
                          setUploadedFileName(fakeName);
                          setUploadedCertHash(fakeHash);
                          if (!claimForm.evidenceReference) {
                            setClaimForm((prev) => ({ ...prev, evidenceReference: `${fakeName} [${fakeHash.slice(0, 15)}...]` }));
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-850 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Simulate Certificate Upload & Hash
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evidence Reference / URL</label>
                <input
                  type="text"
                  value={claimForm.evidenceReference}
                  onChange={(e) => setClaimForm({ ...claimForm, evidenceReference: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  placeholder="e.g. CERT-IEEE-2026-X8 or Google Drive URL"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Submit for Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Evidence Dossier Modal */}
      {selectedClaimDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  {selectedClaimDossier.claimRef}
                </span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Co-Curricular Claim Dossier
                </h3>
                <p className="text-xs text-slate-500">
                  100 Mandatory Student Activity Points Registry
                </p>
              </div>
              <button
                onClick={() => setSelectedClaimDossier(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Activity Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedClaimDossier.activityTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hosting Club / Society:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedClaimDossier.clubName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Point Category:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedClaimDossier.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Participation Effort:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedClaimDossier.participationHours} Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Points Awarded / Claimed:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedClaimDossier.pointsAwarded || selectedClaimDossier.pointsClaimed} Points</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Verification State:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedClaimDossier.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : selectedClaimDossier.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {selectedClaimDossier.status}
                  </span>
                </div>
              </div>

              {/* Verified Certificate Preview Block */}
              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" /> Official Co-Curricular Certificate of Merit
                  </span>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300">
                    CERT-{(selectedClaimDossier.claimRef || "001").replace(/\D/g, "") || "9982"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-950 dark:text-amber-200/90 leading-relaxed italic bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                  &ldquo;This is to certify active leadership & participation in {selectedClaimDossier.activityTitle} organized by {selectedClaimDossier.clubName}. Accredited towards mandatory university co-curricular activity points.&rdquo;
                </p>
                <div className="flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400 pt-0.5">
                  <span>AICTE Activity Point Multiplier: 1.25x</span>
                  <span>Dean of Student Affairs Signed</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Activity Brief & Outcomes:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{selectedClaimDossier.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 block text-[11px]">Certificate / Verification Evidence:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{selectedClaimDossier.evidenceReference || "Document Uploaded & Verified"}</span>
                </div>
              </div>

              {/* Cryptographic Verification Seal */}
              <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">Apex Institutional Credential Seal</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 rounded text-[9px] font-bold">SHA-256 VERIFIED</span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all">
                    Fingerprint: {selectedClaimDossier.evidenceReference ? "sha256:" + Array.from(selectedClaimDossier.evidenceReference).reduce((acc: number, char: string) => acc + char.charCodeAt(0), 1000).toString(16).repeat(4).slice(0, 32) : "sha256:d8c5f299104b901a884e91024bd320fa"}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Activity points credited to NIRF TLF / NAAC Criterion V Student Support & Progression audit ledger.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs">
                {(["APPROVED", "PENDING_FACULTY_REVIEW", "REJECTED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={async () => {
                      await handleVerifyClaim(selectedClaimDossier.id, st as any, selectedClaimDossier.pointsClaimed);
                      setSelectedClaimDossier((prev: any) => ({
                        ...prev,
                        status: st,
                        pointsAwarded: st === "APPROVED" ? prev.pointsClaimed : 0,
                      }));
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedClaimDossier.status === st
                        ? "bg-amber-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {st === "PENDING_FACULTY_REVIEW" ? "PENDING" : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Statement
                </button>
                <button
                  onClick={() => setSelectedClaimDossier(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Honours Certificate & Co-Curricular Transcript Modal */}
      {showHonoursCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-400/80 dark:border-amber-600/80 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 relative text-slate-900 dark:text-white">
            {/* Ambient Watermark Seal */}
            <div className="absolute top-6 right-8 text-amber-500/20 dark:text-amber-400/10 pointer-events-none select-none">
              <Award className="w-36 h-36" />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowHonoursCertModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg text-sm font-bold"
            >
              ✕
            </button>

            {/* Institutional Crest & Header */}
            <div className="text-center space-y-1.5 border-b border-amber-200 dark:border-amber-800/60 pb-5">
              <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-widest text-xs">
                <Building className="w-4 h-4" />
                Apex Autonomous University of Technology
              </div>
              <h2 className="text-2xl font-serif font-black tracking-wide text-slate-900 dark:text-amber-100 uppercase">
                Official Co-Curricular Honours Certificate
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                Directorate of Student Affairs &bull; Statutory 100 Activity Points Degree Registry
              </p>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-3 px-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">This is proudly presented and certified to</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {currentUser?.fullName || "Alex Mercer"}
              </h3>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                Enrollment Roll: <strong className="text-amber-600 dark:text-amber-400">CS2026-001</strong> &bull; Dept of Computer Science & Engineering
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto pt-1">
                for exemplary leadership, technical innovation, societal enrichment, and active contribution to campus student bodies. The candidate has accumulated co-curricular credits under AICTE / NBA Criterion V Statutory Guidelines.
              </p>
            </div>

            {/* Scorecard Matrix */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200 border-b border-amber-200/60 dark:border-amber-900/30 pb-1.5">
                <span>Accreditation Category</span>
                <span>Points Conferred</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] text-slate-400 block">Technical</span>
                  <span className="font-bold text-slate-900 dark:text-white">{progress?.byCategory?.TECHNICAL ?? 25} pts</span>
                </div>
                <div className="p-2 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] text-slate-400 block">Social Service</span>
                  <span className="font-bold text-slate-900 dark:text-white">{progress?.byCategory?.SOCIAL_SERVICE ?? 15} pts</span>
                </div>
                <div className="p-2 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] text-slate-400 block">Cultural</span>
                  <span className="font-bold text-slate-900 dark:text-white">{progress?.byCategory?.CULTURAL ?? 0} pts</span>
                </div>
                <div className="p-2 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] text-slate-400 block">Sports</span>
                  <span className="font-bold text-slate-900 dark:text-white">{progress?.byCategory?.SPORTS ?? 0} pts</span>
                </div>
                <div className="p-2 bg-white/80 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/20">
                  <span className="text-[10px] text-slate-400 block">Entrepreneurship</span>
                  <span className="font-bold text-slate-900 dark:text-white">{progress?.byCategory?.ENTREPRENEURSHIP ?? 0} pts</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Composite Accredited Balance:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {progress?.totalPoints ?? 40} / {DEGREE_REQUIRED_ACTIVITY_POINTS} Points
                </span>
              </div>
            </div>

            {/* Cryptographic Digital Signature & Verification */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold">Cryptographically Verified Credential</span>
                </div>
                <p className="font-mono text-[10px] text-slate-400">
                  Digest: sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
                </p>
                <p className="text-[10px] text-slate-500">
                  AICTE Activity ID: APEX-ACT-2026-9918 &bull; Verified by Registrar Examination Vault
                </p>
              </div>

              {/* Signatures */}
              <div className="flex items-center gap-6 text-center">
                <div className="space-y-1">
                  <div className="w-24 border-b border-slate-400 dark:border-slate-600 pb-1 font-serif text-[11px] italic text-slate-700 dark:text-slate-300">
                    Dr. H. Mehta
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Faculty Advisor</span>
                </div>
                <div className="space-y-1">
                  <div className="w-28 border-b border-slate-400 dark:border-slate-600 pb-1 font-serif text-[11px] italic text-amber-700 dark:text-amber-300 font-bold">
                    Prof. R. Sengupta
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Dean Student Affairs</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Certificate
              </button>
              <button
                onClick={() => setShowHonoursCertModal(false)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
