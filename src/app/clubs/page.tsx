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

  // New Claim Modal
  const [showModal, setShowModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    studentRoll: "CS2026-001",
    studentName: currentUser?.fullName || "Alex Mercer",
    clubCode: "IEEE-SB",
    activityTitle: "",
    description: "",
    participationHours: 12,
    pointsClaimed: 15,
    evidenceReference: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, clmRes, clbRes] = await Promise.all([
        fetch("/api/clubs?tab=summary&roll=CS2026-001"),
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
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <strong>Faculty Advisor Notice:</strong> Review student activity claims against physical attendance logs and participation certificates before granting institutional activity credits.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims
              .filter((c) => c.status === "PENDING_FACULTY_REVIEW")
              .map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{c.activityTitle}</h4>
                      <p className="text-xs text-slate-400">{c.studentName} ({c.studentRoll})</p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                      {c.pointsClaimed} Pts Claimed
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>

                  <div className="text-xs text-slate-400 flex justify-between">
                    <span>Society: {c.clubName}</span>
                    <span>Hours: {c.participationHours} hrs</span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
              ))}

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

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Evidence Certificate ID / URL</label>
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
                <div className="flex justify-between">
                  <span className="text-slate-500">Activity Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedClaimDossier.activityTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hosting Club / Society:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedClaimDossier.clubName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Point Category:</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{selectedClaimDossier.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Participation Effort:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedClaimDossier.participationHours} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Points Awarded / Claimed:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedClaimDossier.pointsAwarded || selectedClaimDossier.pointsClaimed} Points</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Verification State:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedClaimDossier.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedClaimDossier.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedClaimDossier.status}
                  </span>
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
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs">
                {selectedClaimDossier.status === "PENDING_FACULTY_REVIEW" && (
                  <>
                    <button
                      onClick={async () => {
                        await handleVerifyClaim(selectedClaimDossier.id, "APPROVED", selectedClaimDossier.pointsClaimed);
                        setSelectedClaimDossier((prev: any) => ({ ...prev, status: "APPROVED", pointsAwarded: prev.pointsClaimed }));
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Approve Points
                    </button>
                    <button
                      onClick={async () => {
                        await handleVerifyClaim(selectedClaimDossier.id, "REJECTED");
                        setSelectedClaimDossier((prev: any) => ({ ...prev, status: "REJECTED" }));
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg font-semibold transition-colors"
                    >
                      Reject Claim
                    </button>
                  </>
                )}
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
    </div>
  );
}
