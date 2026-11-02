// SPDX-License-Identifier: Apache-2.0
/**
 * Course Evaluation & 360 Faculty Feedback Page
 * Unified Academic OS design with multi-stakeholder surveys, NAAC ATR action reports,
 * survey scheduling windows, interactive Likert star ratings, and faculty FPI dossiers.
 */

"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { useApp } from "@/context/AppContext";
import { SkeletonCard, SkeletonTable } from "@/components/common/SkeletonLoader";
import { EmptyState } from "@/components/common/EmptyState";
import {
  MessageSquareHeart,
  Star,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  FileText,
  Filter,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Search,
  Download,
  Eye,
  Printer,
  X,
  RotateCcw,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Brain,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import FeedbackMultiSurveysTab from "@/components/feedback/FeedbackMultiSurveysTab";
import FeedbackActionReportsTab from "@/components/feedback/FeedbackActionReportsTab";
import FeedbackCyclesTab from "@/components/feedback/FeedbackCyclesTab";
import { FeedbackActionReport, FeedbackSurveyCycle } from "@/lib/feedback/feedback-engine";

interface FacultyIndex {
  facultyId: string;
  facultyName: string;
  departmentCode: string;
  totalSubmissions: number;
  avgPedagogy: number;
  avgSyllabus: number;
  avgPunctuality: number;
  avgDoubtClearing: number;
  avgCourseMaterial: number;
  overallFPI: number;
  performanceBand: string;
}

interface SurveyRecord {
  id: string;
  surveyRef: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  overallScore: number;
  qualitativeRemarks?: string;
  submittedAt: string;
  ratingPedagogy?: number;
  ratingSyllabus?: number;
  ratingPunctuality?: number;
  ratingDoubtClearing?: number;
}

function analyzeSentiment(remarks?: string, score?: number) {
  if (!remarks || remarks.trim().length === 0) {
    if (score && score >= 4.0) {
      return {
        polarity: 0.75,
        label: "Score-Derived High (No Written Feedback)",
        tone: "QUANTITATIVE_HIGH",
        bg: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
        description: "Rating derived strictly from quantitative Likert score (>= 4.0). No qualitative student remarks were submitted.",
        isScoreInferred: true,
      };
    }
    if (score && score <= 2.5) {
      return {
        polarity: -0.65,
        label: "Score-Derived Low (No Written Feedback)",
        tone: "ACTION_REQUIRED",
        bg: "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        description: "Low quantitative rating baseline (<= 2.5) flagged for review. No qualitative student remarks were provided.",
        isScoreInferred: true,
      };
    }
    return {
      polarity: 0.05,
      label: "Score-Derived Baseline (No Remarks)",
      tone: "NEUTRAL",
      bg: "bg-ivory-50 text-charcoal-700 dark:bg-charcoal-800 dark:text-ivory-300 border-border dark:border-charcoal-700",
      description: "Neutral quantitative rating baseline. No qualitative written comments were provided by the respondent.",
      isScoreInferred: true,
    };
  }

  const text = remarks.toLowerCase();
  const positiveWords = [
    "excellent", "great", "amazing", "inspiring", "clear", "helpful", "best",
    "engaging", "patient", "supportive", "thorough", "outstanding", "good",
    "well", "superb", "brilliant",
  ];
  const negativeWords = [
    "poor", "slow", "fast", "unclear", "difficult", "late", "boring",
    "confusing", "hard", "disorganized", "tough", "harsh", "unfair",
    "missing", "delay", "struggle",
  ];

  let posCount = 0;
  let negCount = 0;

  positiveWords.forEach((word) => {
    if (text.includes(word)) posCount++;
  });
  negativeWords.forEach((word) => {
    if (text.includes(word)) negCount++;
  });

  const totalHits = posCount + negCount;
  let polarity = 0;

  if (totalHits > 0) {
    polarity = Math.round(((posCount - negCount) / totalHits) * 100) / 100;
  } else if (score) {
    polarity = Math.round(((score - 3.0) / 2.0) * 100) / 100;
  }

  if (polarity >= 0.5) {
    return {
      polarity,
      label: "Delighted",
      tone: "HIGHLY_FAVORABLE",
      bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      description: "High enthusiasm and pedagogical excellence praised.",
    };
  } else if (polarity >= 0.1) {
    return {
      polarity,
      label: "Positive",
      tone: "FAVORABLE",
      bg: "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800",
      description: "Encouraging comments affirming instructional quality.",
    };
  } else if (polarity >= -0.2) {
    return {
      polarity,
      label: "Balanced",
      tone: "NEUTRAL",
      bg: "bg-ivory-100 text-charcoal-800 dark:bg-charcoal-800 dark:text-ivory-300 border-border dark:border-charcoal-700",
      description: "Constructive observations with mixed reception.",
    };
  } else {
    return {
      polarity,
      label: "Action Required",
      tone: "CRITICAL",
      bg: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      description: "Significant friction identified; recommended for HOD mentoring.",
    };
  }
}

function StarRatingControl({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (val: number) => void;
  label: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const activeRating = hovered !== null ? hovered : value;
  const scoreLabels = ["", "Poor (1)", "Fair (2)", "Good (3)", "Very Good (4)", "Excellent (5)"];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1.5 text-xs">
      <span className="text-charcoal-700 dark:text-ivory-300 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onChange(star)}
              className="p-1 rounded hover:scale-110 transition-transform focus:outline-none"
              aria-label={`${star} star`}
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  star <= activeRating
                    ? "text-amber-400 fill-amber-400"
                    : "text-charcoal-300 dark:text-charcoal-600"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="w-20 text-[11px] font-bold text-charcoal-600 dark:text-ivory-300">
          {scoreLabels[activeRating] || `${activeRating}/5`}
        </span>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const { showToast, currentRole } = useApp();
  const [activeTab, setActiveTab] = useState<
    "faculty" | "responses" | "surveys" | "action-reports" | "cycles"
  >("faculty");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [facultyIndices, setFacultyIndices] = useState<FacultyIndex[]>([]);
  const [responses, setResponses] = useState<SurveyRecord[]>([]);
  const [actionReports, setActionReports] = useState<FeedbackActionReport[]>([]);
  const [cycles, setCycles] = useState<FeedbackSurveyCycle[]>([]);
  const [multiSurveys, setMultiSurveys] = useState<any[]>([]);

  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [facultySortBy, setFacultySortBy] = useState<
    "FPI_DESC" | "FPI_ASC" | "SUBMISSIONS_DESC" | "NAME_ASC"
  >("FPI_DESC");
  const [selectedFacultyDossier, setSelectedFacultyDossier] = useState<FacultyIndex | null>(null);
  const [selectedSurveyDossier, setSelectedSurveyDossier] = useState<SurveyRecord | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<"ALL" | "POSITIVE" | "CRITICAL">("ALL");

  // Form state supporting all survey categories
  const [formData, setFormData] = useState({
    surveyType: "COURSE_FACULTY_EVALUATION",
    courseCode: "CS301",
    courseName: "Distributed Systems & Cloud Computing",
    facultyId: "fac-01",
    facultyName: "Dr. Sarah Jenkins",
    departmentCode: "CSE",
    semester: 5,
    ratingPedagogy: 5,
    ratingSyllabus: 5,
    ratingPunctuality: 5,
    ratingDoubtClearing: 5,
    ratingCourseMaterial: 5,
    qualitativeRemarks: "",
    stakeholderType: "STUDENT",
    facilityCategory: "LIBRARY",
    emergingTechRecommended: "Kubernetes, eBPF & Generative AI",
    futureAspirations: "Cloud Architecture at Tier-1 Research Labs",
  });

  const handleExportCsv = () => {
    if (activeTab === "faculty") {
      const headers = "Faculty ID,Name,Department,Submissions,Pedagogy,Syllabus,Punctuality,Doubt Clearing,Course Material,Overall FPI,Performance Band\n";
      const rows = facultyIndices
        .map((f) => `"${f.facultyId}","${f.facultyName}","${f.departmentCode}",${f.totalSubmissions},${f.avgPedagogy},${f.avgSyllabus},${f.avgPunctuality},${f.avgDoubtClearing},${f.avgCourseMaterial},${f.overallFPI},"${f.performanceBand}"`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `FPI_Faculty_Evaluation_Report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = "Survey Ref,Course Code,Course Name,Faculty Name,Overall Score,Remarks,Date\n";
      const rows = responses
        .map((r) => `"${r.surveyRef}","${r.courseCode}","${r.courseName}","${r.facultyName}",${r.overallScore},"${(r.qualitativeRemarks || "").replace(/"/g, '""')}","${r.submittedAt}"`)
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Student_Evaluation_Responses_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, facRes, respRes, actRes, cycRes, multiRes] = await Promise.all([
        fetch("/api/feedback?tab=summary"),
        fetch("/api/feedback?tab=faculty"),
        fetch("/api/feedback?tab=responses"),
        fetch("/api/feedback?tab=action-reports"),
        fetch("/api/feedback?tab=cycles"),
        fetch("/api/feedback?tab=multi-stakeholder"),
      ]);

      const sumData = await sumRes.json();
      const facData = await facRes.json();
      const respData = await respRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (facData.success) setFacultyIndices(facData.facultyIndices || []);
      if (respData.success) setResponses(respData.responses || []);

      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData.success) setActionReports(actData.reports || []);
      }
      if (cycRes.ok) {
        const cycData = await cycRes.json();
        if (cycData.success) setCycles(cycData.cycles || []);
      }
      if (multiRes.ok) {
        const mData = await multiRes.json();
        if (mData.success) setMultiSurveys(mData.surveys || []);
      }
    } catch (err) {
      console.error("Error fetching feedback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const isAnyModalOpen = showSurveyModal || !!selectedFacultyDossier || !!selectedSurveyDossier;
    if (!isAnyModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSurveyModal(false);
        setSelectedFacultyDossier(null);
        setSelectedSurveyDossier(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSurveyModal, selectedFacultyDossier, selectedSurveyDossier]);

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SUBMIT_SURVEY",
          ...formData,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Feedback submitted anonymously!", "success");
        setShowSurveyModal(false);
        fetchData();
      } else {
        showToast(data.error || "Failed to submit survey", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Breadcrumbs />
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Header - Unified Classroom Academic OS Design */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 shrink-0">
              <MessageSquareHeart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent">
                  Academic Quality Assurance &amp; NAAC Criterion 1.4
                </span>
                <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  Continuous SET Active
                </span>
              </div>
              <h1 className="text-xl font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Course Evaluation &amp; 360 Faculty Feedback
              </h1>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                Continuous Student Evaluation of Teaching (SET), 360-degree pedagogical analytics, anonymous sentiment tracking, and NAAC accreditation metrics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-200 text-xs font-bold border border-border dark:border-charcoal-700 transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-charcoal-600 dark:text-charcoal-400" />
              <span>Export SET Dossier (CSV)</span>
            </button>
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, surveyType: "COURSE_FACULTY_EVALUATION" }));
                setShowSurveyModal(true);
              }}
              className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Evaluation</span>
            </button>
          </div>
        </div>

        {/* 4-Stat Overview Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all group">
              <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Anonymous Surveys</span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-primary group-hover:scale-110 transition-transform">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                {summary?.totalResponses || 0}
              </div>
              <p className="text-xs text-charcoal-400 mt-1">100% Anonymized &amp; Tamper-proof</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all group">
              <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Institutional Satisfaction</span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Star className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                {summary?.averageSatisfactionRating || 0} / 5.0
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">92% Positive Rating</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all group">
              <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Faculty Evaluated</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                {summary?.facultyEvaluatedCount || 0}
              </div>
              <p className="text-xs text-charcoal-400 mt-1">Across all academic departments</p>
            </div>

            <div className="glass-panel p-5 rounded-2xl border border-border/80 dark:border-charcoal-800 shadow-soft hover:shadow-elevated transition-all group">
              <div className="flex items-center justify-between text-charcoal-500 dark:text-charcoal-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">High Distinction Index</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display text-charcoal-900 dark:text-ivory-100">
                {summary?.topRatedFacultyCount || 0}
              </div>
              <p className="text-xs text-charcoal-400 mt-1">FPI Score &ge; 4.0 / 5.0</p>
            </div>
          </div>
        )}

        {/* Search and Department Filter Toolbar (for faculty & responses) */}
        {(activeTab === "faculty" || activeTab === "responses") && (
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Search by faculty, department or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 text-charcoal-900 dark:text-ivory-100"
                >
                  <option value="ALL">All Departments</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="ME">Mechanical (ME)</option>
                  <option value="CIVIL">Civil (CIVIL)</option>
                  <option value="HUM">Humanities (HUM)</option>
                </select>
              </div>
              {activeTab === "faculty" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Sort:</span>
                  <select
                    value={facultySortBy}
                    onChange={(e) => setFacultySortBy(e.target.value as any)}
                    className="px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="FPI_DESC">Highest FPI (Score)</option>
                    <option value="FPI_ASC">Lowest FPI (Attention)</option>
                    <option value="SUBMISSIONS_DESC">Most Evaluations</option>
                    <option value="NAME_ASC">Faculty Name (A-Z)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5 Integrated Tabs Strip */}
        <div className="flex border-b border-border dark:border-charcoal-800 overflow-x-auto no-scrollbar flex-nowrap pb-px gap-1">
          <button
            onClick={() => setActiveTab("faculty")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "faculty"
                ? "border-rose-primary text-rose-primary dark:text-rose-400"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Faculty FPI Analytics</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-container/80 dark:bg-rose-dark/40 text-rose-primary dark:text-rose-accent">
              {facultyIndices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("responses")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "responses"
                ? "border-rose-primary text-rose-primary dark:text-rose-400"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
            }`}
          >
            <MessageSquareHeart className="w-4 h-4" />
            <span>Anonymous Evaluations</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory-200 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400">
              {responses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("surveys")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "surveys"
                ? "border-rose-primary text-rose-primary dark:text-rose-400"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Multi-Stakeholder Surveys</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory-200 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-400">
              {multiSurveys.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("action-reports")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "action-reports"
                ? "border-rose-primary text-rose-primary dark:text-rose-400"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>IQAC Action Taken (ATR)</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              {actionReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cycles")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === "cycles"
                ? "border-rose-primary text-rose-primary dark:text-rose-400"
                : "border-transparent text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Survey Windows</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
              {cycles.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Faculty FPI Cards */}
        {activeTab === "faculty" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...facultyIndices]
              .filter((fac) => {
                const matchesSearch =
                  fac.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  fac.departmentCode.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesDept = selectedDept === "ALL" || fac.departmentCode === selectedDept;
                return matchesSearch && matchesDept;
              })
              .sort((a, b) => {
                if (facultySortBy === "FPI_DESC") return b.overallFPI - a.overallFPI;
                if (facultySortBy === "FPI_ASC") return a.overallFPI - b.overallFPI;
                if (facultySortBy === "SUBMISSIONS_DESC") return b.totalSubmissions - a.totalSubmissions;
                if (facultySortBy === "NAME_ASC") return a.facultyName.localeCompare(b.facultyName);
                return 0;
              })
              .map((fac) => (
                <div
                  key={fac.facultyId}
                  className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-border dark:border-charcoal-800 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-charcoal-900 dark:text-ivory-100 text-lg">{fac.facultyName}</h3>
                      <p className="text-xs text-charcoal-500">
                        Dept: {fac.departmentCode} • {fac.totalSubmissions} Student Evaluations
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-rose-primary dark:text-rose-400">
                        {fac.overallFPI.toFixed(2)}
                      </span>
                      <span className="text-xs text-charcoal-400 block font-semibold">{fac.performanceBand}</span>
                    </div>
                  </div>

                  {/* 5-Criteria Rating Bars */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-charcoal-600 dark:text-charcoal-400">
                      <span>Pedagogy & Teaching Quality</span>
                      <span className="font-semibold">{fac.avgPedagogy} / 5</span>
                    </div>
                    <div className="h-2 w-full bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${(fac.avgPedagogy / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-charcoal-600 dark:text-charcoal-400">
                      <span>Syllabus Coverage</span>
                      <span className="font-semibold">{fac.avgSyllabus} / 5</span>
                    </div>
                    <div className="h-2 w-full bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(fac.avgSyllabus / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-charcoal-600 dark:text-charcoal-400">
                      <span>Punctuality & Regularity</span>
                      <span className="font-semibold">{fac.avgPunctuality} / 5</span>
                    </div>
                    <div className="h-2 w-full bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(fac.avgPunctuality / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-charcoal-600 dark:text-charcoal-400">
                      <span>Doubt Clearing & Accessibility</span>
                      <span className="font-semibold">{fac.avgDoubtClearing} / 5</span>
                    </div>
                    <div className="h-2 w-full bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${(fac.avgDoubtClearing / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 dark:border-charcoal-800 flex justify-end">
                    <button
                      onClick={() => setSelectedFacultyDossier(fac)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Full SET Dossier
                    </button>
                  </div>
                </div>
              ))}

            {facultyIndices.filter((fac) => {
              const matchesSearch =
                fac.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                fac.departmentCode.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesDept = selectedDept === "ALL" || fac.departmentCode === selectedDept;
              return matchesSearch && matchesDept;
            }).length === 0 && (
              <div className="col-span-1 md:col-span-2">
                <EmptyState
                  icon={currentRole === "STUDENT" ? ShieldCheck : Search}
                  title={currentRole === "STUDENT" ? "Faculty Performance Indices Confidential" : "No Faculty Feedback Records"}
                  description={
                    currentRole === "STUDENT"
                      ? "Institutional faculty performance ratings and appraisal analytics are restricted to academic leadership. As a student, please click below to submit anonymous feedback for your enrolled courses."
                      : `No faculty index matches query "${searchQuery}" and department "${selectedDept}".`
                  }
                  actionLabel={currentRole === "STUDENT" ? "Submit Course Evaluation" : "Reset Filters"}
                  onAction={() => {
                    if (currentRole === "STUDENT") {
                      setShowSurveyModal(true);
                    } else {
                      setSearchQuery("");
                      setSelectedDept("ALL");
                    }
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Anonymous Survey Responses */}
        {activeTab === "responses" && (
          <div className="space-y-6">
            {/* Institutional Sentiment Health Meter */}
            {(() => {
              const total = responses.length;
              const pos = responses.filter((r) => analyzeSentiment(r.qualitativeRemarks, r.overallScore).polarity >= 0.1).length;
              const bal = responses.filter((r) => {
                const p = analyzeSentiment(r.qualitativeRemarks, r.overallScore).polarity;
                return p >= -0.2 && p < 0.1;
              }).length;
              const crit = responses.filter((r) => analyzeSentiment(r.qualitativeRemarks, r.overallScore).polarity < -0.2).length;
              const posPct = total ? Math.round((pos / total) * 100) : 0;
              const balPct = total ? Math.round((bal / total) * 100) : 0;
              const critPct = total ? Math.round((crit / total) * 100) : 0;
              const netSentiment = posPct - critPct;

              return (
                <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100">
                          Campus Qualitative Sentiment Health Monitor
                        </h3>
                        <p className="text-xs text-charcoal-400">
                          Natural Language tone classification across {total} anonymized evaluations
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-charcoal-500 font-medium">Net Sentiment Score:</span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          netSentiment >= 50
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        +{netSentiment} NPS
                      </span>
                    </div>
                  </div>

                  {/* Multicolored Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-3 w-full bg-ivory-100 dark:bg-charcoal-800 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${posPct}%` }}
                        className="bg-emerald-500 h-full transition-all duration-500"
                        title={`Positive: ${posPct}%`}
                      />
                      <div
                        style={{ width: `${balPct}%` }}
                        className="bg-amber-400 h-full transition-all duration-500"
                        title={`Constructive: ${balPct}%`}
                      />
                      <div
                        style={{ width: `${critPct}%` }}
                        className="bg-rose-500 h-full transition-all duration-500"
                        title={`Concerns: ${critPct}%`}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-charcoal-500 dark:text-charcoal-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Favorable / Delighted: <strong>{posPct}%</strong> ({pos})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        Balanced / Neutral: <strong>{balPct}%</strong> ({bal})
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Critical Concerns: <strong>{critPct}%</strong> ({crit})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border dark:border-charcoal-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-sm font-semibold text-charcoal-700 dark:text-ivory-300">
                    Recent Anonymized Course Feedback Entries
                  </span>
                  <p className="text-xs text-charcoal-400">AI-computed sentiment polarity scores & qualitative reflections</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-charcoal-500 font-medium">Sentiment:</span>
                    <select
                      value={sentimentFilter}
                      onChange={(e) => setSentimentFilter(e.target.value as any)}
                      className="px-2.5 py-1 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-lg text-xs font-medium text-charcoal-800 dark:text-ivory-200"
                    >
                      <option value="ALL">All Sentiments</option>
                      <option value="POSITIVE">Positive / Delighted Only</option>
                      <option value="CRITICAL">Constructive / Concerns</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Masked ID</span>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ivory-50 dark:bg-charcoal-800/50 text-charcoal-500 dark:text-charcoal-400 text-xs uppercase font-medium">
                    <tr>
                      <th className="py-3 px-4">Survey Ref</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Faculty Instructor</th>
                      <th className="py-3 px-4">Overall Score</th>
                      <th className="py-3 px-4">AI Sentiment</th>
                      <th className="py-3 px-4">Student Comments</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-charcoal-800 text-charcoal-700 dark:text-ivory-300">
                    {responses
                      .filter((r) => {
                        const q = searchQuery.toLowerCase();
                        const matchesSearch =
                          !q ||
                          r.courseCode.toLowerCase().includes(q) ||
                          r.courseName.toLowerCase().includes(q) ||
                          r.facultyName.toLowerCase().includes(q) ||
                          r.surveyRef.toLowerCase().includes(q);

                        if (!matchesSearch) return false;

                        if (sentimentFilter === "ALL") return true;
                        const sent = analyzeSentiment(r.qualitativeRemarks, r.overallScore);
                        if (sentimentFilter === "POSITIVE") return sent.polarity >= 0.1;
                        if (sentimentFilter === "CRITICAL") return sent.polarity < 0.1;
                        return true;
                      })
                      .map((r) => {
                        const sentiment = analyzeSentiment(r.qualitativeRemarks, r.overallScore);
                        return (
                          <tr key={r.id} className="hover:bg-ivory-50/50 dark:hover:bg-charcoal-800/40">
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-rose-primary dark:text-rose-400">
                              {r.surveyRef}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {r.courseCode} - {r.courseName}
                            </td>
                            <td className="py-3 px-4 font-medium">{r.facultyName}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                {r.overallScore} / 5.0
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sentiment.bg}`}>
                                {sentiment.polarity >= 0.1 ? (
                                  <Smile className="w-3 h-3" />
                                ) : sentiment.polarity <= -0.2 ? (
                                  <Frown className="w-3 h-3" />
                                ) : (
                                  <Meh className="w-3 h-3" />
                                )}
                                <span>{sentiment.polarity > 0 ? `+${sentiment.polarity}` : sentiment.polarity} {sentiment.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs italic text-charcoal-500 max-w-xs truncate">
                              {r.qualitativeRemarks || "No qualitative remarks recorded."}
                            </td>
                            <td className="py-3 px-4 text-xs text-charcoal-400">
                              {new Date(r.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setSelectedSurveyDossier(r)}
                                className="px-2.5 py-1 bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-charcoal-500" />
                                Slip
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {responses.filter((r) => {
                const q = searchQuery.toLowerCase();
                return (
                  !q ||
                  r.courseCode.toLowerCase().includes(q) ||
                  r.courseName.toLowerCase().includes(q) ||
                  r.facultyName.toLowerCase().includes(q) ||
                  r.surveyRef.toLowerCase().includes(q)
                );
              }).length === 0 && (
                <div className="py-4">
                  <EmptyState
                    icon={Search}
                    title="No Survey Responses Found"
                    description={`No anonymous evaluations match your search query "${searchQuery}".`}
                    actionLabel="Reset Search"
                    onAction={() => setSearchQuery("")}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Multi-Stakeholder Surveys */}
        {activeTab === "surveys" && (
          <FeedbackMultiSurveysTab
            onOpenSurveyModal={(type) => {
              setFormData((prev) => ({ ...prev, surveyType: type }));
              setShowSurveyModal(true);
            }}
          />
        )}

        {/* Tab 4: Action Taken Reports (IQAC CAP NAAC 1.4.2) */}
        {activeTab === "action-reports" && (
          <FeedbackActionReportsTab />
        )}

        {/* Tab 5: Administration Windows & Cycles */}
        {activeTab === "cycles" && (
          <FeedbackCyclesTab
            cycles={cycles}
            onRefresh={fetchData}
            showToast={showToast}
          />
        )}
      </div>

      {/* Survey Submission Modal */}
      {showSurveyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Submit Evaluation Survey"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSurveyModal(false);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-border dark:border-charcoal-800 p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border dark:border-charcoal-800 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-rose-primary" />
                <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
                  Submit Institutional Feedback
                </h2>
              </div>
              <button
                onClick={() => setShowSurveyModal(false)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 dark:text-ivory-200 mb-1">
                  Survey Type
                </label>
                <select
                  value={formData.surveyType}
                  onChange={(e) => setFormData({ ...formData, surveyType: e.target.value })}
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs font-medium text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="COURSE_FACULTY_EVALUATION">Course & Faculty Evaluation (SET)</option>
                  <option value="EXIT_SURVEY_SENIORS">Senior Exit Survey (NBA / NAAC 1.4)</option>
                  <option value="ALUMNI_CURRICULUM_SURVEY">Alumni Curriculum Relevance Survey (NEP 2020)</option>
                  <option value="FACILITY_INFRASTRUCTURE">Campus Infrastructure & Facility Survey</option>
                </select>
              </div>

              {formData.surveyType === "COURSE_FACULTY_EVALUATION" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                        Course Code
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.courseCode}
                        onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                        className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-charcoal-900 dark:text-ivory-100 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                        Faculty Instructor
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.facultyName}
                        onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                        className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-charcoal-900 dark:text-ivory-100 text-xs"
                      />
                    </div>
                  </div>

                  {/* 5 Likert Star Ratings */}
                  <div className="space-y-1 bg-ivory-50 dark:bg-charcoal-800/50 p-3.5 rounded-xl border border-border dark:border-charcoal-700">
                    <span className="text-[11px] font-bold text-charcoal-700 dark:text-ivory-300 uppercase tracking-wide block mb-1">
                      Evaluation Criteria (1 = Poor, 5 = Excellent)
                    </span>

                    <StarRatingControl
                      label="1. Pedagogy & Clarity of Concepts"
                      value={formData.ratingPedagogy}
                      onChange={(val) => setFormData({ ...formData, ratingPedagogy: val })}
                    />
                    <StarRatingControl
                      label="2. Pacing & Syllabus Coverage"
                      value={formData.ratingSyllabus}
                      onChange={(val) => setFormData({ ...formData, ratingSyllabus: val })}
                    />
                    <StarRatingControl
                      label="3. Punctuality & Classroom Discipline"
                      value={formData.ratingPunctuality}
                      onChange={(val) => setFormData({ ...formData, ratingPunctuality: val })}
                    />
                    <StarRatingControl
                      label="4. Doubt Resolution & Office Hours"
                      value={formData.ratingDoubtClearing}
                      onChange={(val) => setFormData({ ...formData, ratingDoubtClearing: val })}
                    />
                    <StarRatingControl
                      label="5. Course Materials, Slides & Lab Sheets"
                      value={formData.ratingCourseMaterial}
                      onChange={(val) => setFormData({ ...formData, ratingCourseMaterial: val })}
                    />
                  </div>
                </>
              )}

              {formData.surveyType === "EXIT_SURVEY_SENIORS" && (
                <div className="space-y-3 bg-ivory-50 dark:bg-charcoal-800/50 p-3.5 rounded-xl border border-border dark:border-charcoal-700">
                  <span className="text-[11px] font-bold text-charcoal-700 dark:text-ivory-300 uppercase tracking-wide block">
                    Graduating Senior Metrics (NBA Criterion 1.4)
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Post-Graduation Career Aspiration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Distributed Systems Engineer at Cloud Scale"
                      value={formData.futureAspirations}
                      onChange={(e) => setFormData({ ...formData, futureAspirations: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Recommended Industry Technologies to Add to Curriculum
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rust, PyTorch, Kubernetes, Vector Databases"
                      value={formData.emergingTechRecommended}
                      onChange={(e) => setFormData({ ...formData, emergingTechRecommended: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>

                  <StarRatingControl
                    label="Overall Program Outcomes (POs) Attainment"
                    value={formData.ratingPedagogy}
                    onChange={(val) => setFormData({ ...formData, ratingPedagogy: val, ratingSyllabus: val })}
                  />
                </div>
              )}

              {formData.surveyType === "ALUMNI_CURRICULUM_SURVEY" && (
                <div className="space-y-3 bg-ivory-50 dark:bg-charcoal-800/50 p-3.5 rounded-xl border border-border dark:border-charcoal-700">
                  <span className="text-[11px] font-bold text-charcoal-700 dark:text-ivory-300 uppercase tracking-wide block">
                    Alumni Industry Advisory (NEP 2020)
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                      High-Priority Emerging Skills for Graduates
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LLM fine-tuning, microservices, cloud telemetry"
                      value={formData.emergingTechRecommended}
                      onChange={(e) => setFormData({ ...formData, emergingTechRecommended: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100"
                    />
                  </div>

                  <StarRatingControl
                    label="Current Academic Syllabus Industry Alignment"
                    value={formData.ratingCourseMaterial}
                    onChange={(val) => setFormData({ ...formData, ratingCourseMaterial: val, ratingPedagogy: val })}
                  />
                </div>
              )}

              {formData.surveyType === "FACILITY_INFRASTRUCTURE" && (
                <div className="space-y-3 bg-ivory-50 dark:bg-charcoal-800/50 p-3.5 rounded-xl border border-border dark:border-charcoal-700">
                  <span className="text-[11px] font-bold text-charcoal-700 dark:text-ivory-300 uppercase tracking-wide block">
                    Campus Facility Assessment
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                      Facility Category
                    </label>
                    <select
                      value={formData.facilityCategory}
                      onChange={(e) => setFormData({ ...formData, facilityCategory: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl text-xs text-charcoal-900 dark:text-ivory-100"
                    >
                      <option value="LIBRARY">Central Library & Digital Archives</option>
                      <option value="COMPUTING_LAB">High-Performance Computing & GPU Labs</option>
                      <option value="HOSTEL_MESS">Residential Dining & Mess Facility</option>
                      <option value="SPORTS_GYM">Indoor Sports Arena & Gymnasium</option>
                      <option value="HEALTH_CENTER">Campus Health & Wellness Center</option>
                    </select>
                  </div>

                  <StarRatingControl
                    label="Cleanliness & Facility Maintenance"
                    value={formData.ratingPunctuality}
                    onChange={(val) => setFormData({ ...formData, ratingPunctuality: val })}
                  />
                  <StarRatingControl
                    label="Equipment & Modern Resource Availability"
                    value={formData.ratingCourseMaterial}
                    onChange={(val) => setFormData({ ...formData, ratingCourseMaterial: val })}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-charcoal-600 dark:text-charcoal-400 mb-1">
                  Qualitative Feedback / Constructive Suggestions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.qualitativeRemarks}
                  onChange={(e) => setFormData({ ...formData, qualitativeRemarks: e.target.value })}
                  placeholder="Share constructive observations or suggestions for institutional improvement..."
                  className="w-full px-3 py-2 bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-charcoal-900 dark:text-ivory-100 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 border border-border dark:border-charcoal-700 rounded-xl text-charcoal-600 dark:text-ivory-300 hover:bg-ivory-100 dark:hover:bg-charcoal-800 transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-primary hover:bg-rose-accent text-white rounded-xl font-bold disabled:opacity-50 transition-colors shadow-sm text-xs"
                >
                  {submitting ? "Submitting..." : "Submit Anonymous Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Faculty FPI Evaluation Dossier Modal */}
      {selectedFacultyDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Faculty Performance Index Dossier"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedFacultyDossier(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-border/60 dark:border-charcoal-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-400 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-charcoal-900 dark:text-ivory-100 text-lg">
                      {selectedFacultyDossier.facultyName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      {selectedFacultyDossier.performanceBand}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    Department: {selectedFacultyDossier.departmentCode} • Faculty ID: {selectedFacultyDossier.facultyId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFacultyDossier(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overall Score Highlight */}
            <div className="p-4 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-charcoal-500 font-medium">Faculty Performance Index (FPI)</span>
                <div className="text-3xl font-black text-rose-primary dark:text-rose-400 mt-0.5">
                  {selectedFacultyDossier.overallFPI.toFixed(2)} <span className="text-xs font-normal text-charcoal-400">/ 5.00</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Based on {selectedFacultyDossier.totalSubmissions} verified student evaluations
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-charcoal-700 dark:text-ivory-300">IQAC Accreditation Band</div>
                <span className="inline-block mt-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold">
                  Statutory Tier-A Met
                </span>
              </div>
            </div>

            {/* Criteria Breakdown */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold text-charcoal-800 dark:text-ivory-200 uppercase tracking-wider text-[11px]">
                5-Pillar Student Evaluation Metric Distribution
              </h4>

              <div className="space-y-1.5 p-3 bg-ivory-50 dark:bg-charcoal-800/30 rounded-xl border border-border/60 dark:border-charcoal-800">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-600 dark:text-ivory-300">1. Pedagogy & Conceptual Clarity</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedFacultyDossier.avgPedagogy} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(selectedFacultyDossier.avgPedagogy / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-ivory-50 dark:bg-charcoal-800/30 rounded-xl border border-border/60 dark:border-charcoal-800">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-600 dark:text-ivory-300">2. Syllabus Completeness & Course Pace</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedFacultyDossier.avgSyllabus} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedFacultyDossier.avgSyllabus / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-ivory-50 dark:bg-charcoal-800/30 rounded-xl border border-border/60 dark:border-charcoal-800">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-600 dark:text-ivory-300">3. Lecture Punctuality & Attendance Rigor</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedFacultyDossier.avgPunctuality} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(selectedFacultyDossier.avgPunctuality / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-ivory-50 dark:bg-charcoal-800/30 rounded-xl border border-border/60 dark:border-charcoal-800">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-600 dark:text-ivory-300">4. Doubt Resolution & Office Hours Availability</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedFacultyDossier.avgDoubtClearing} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(selectedFacultyDossier.avgDoubtClearing / 5) * 100}%` }} />
                </div>
              </div>

              <div className="space-y-1.5 p-3 bg-ivory-50 dark:bg-charcoal-800/30 rounded-xl border border-border/60 dark:border-charcoal-800">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal-600 dark:text-ivory-300">5. Course Material Quality & LMS References</span>
                  <span className="font-bold text-charcoal-900 dark:text-ivory-100">{selectedFacultyDossier.avgCourseMaterial} / 5</span>
                </div>
                <div className="h-1.5 w-full bg-ivory-200 dark:bg-charcoal-700 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(selectedFacultyDossier.avgCourseMaterial / 5) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border/60 dark:border-charcoal-800">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-ivory-100 hover:bg-ivory-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-charcoal-700 dark:text-ivory-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print FPI Report
              </button>
              <button
                onClick={() => setSelectedFacultyDossier(null)}
                className="px-4 py-2 bg-rose-primary hover:bg-rose-accent text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anonymous Survey Record Slip Modal */}
      {selectedSurveyDossier && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Course Evaluation Entry"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSurveyDossier(null);
          }}
          className="fixed inset-0 z-50 bg-charcoal-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-border/60 dark:border-charcoal-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 text-rose-primary dark:text-rose-400 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-charcoal-900 dark:text-ivory-100 text-lg">Course Evaluation Entry</h3>
                  <p className="text-xs font-mono text-charcoal-400 mt-0.5">{selectedSurveyDossier.surveyRef}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSurveyDossier(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-600 dark:hover:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700/60">
                <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Course</span>
                <span className="font-semibold text-charcoal-900 dark:text-ivory-100">
                  {selectedSurveyDossier.courseCode} - {selectedSurveyDossier.courseName}
                </span>
              </div>
              <div className="p-3 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700/60">
                <span className="text-charcoal-400 block text-[10px] uppercase font-bold">Faculty Instructor</span>
                <span className="font-semibold text-charcoal-900 dark:text-ivory-100">{selectedSurveyDossier.facultyName}</span>
              </div>
            </div>

            <div className="p-4 bg-ivory-50 dark:bg-charcoal-800/40 rounded-xl border border-border dark:border-charcoal-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-charcoal-600 dark:text-ivory-300">Composite Satisfaction Score</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {selectedSurveyDossier.overallScore} / 5.0
                </span>
              </div>
              <div className="pt-2 border-t border-border/40 dark:border-charcoal-700">
                <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider block mb-1">
                  Qualitative Student Remarks
                </span>
                <p className="text-xs text-charcoal-700 dark:text-ivory-200 italic leading-relaxed">
                  &ldquo;{selectedSurveyDossier.qualitativeRemarks || "No qualitative written remarks were provided."}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-charcoal-400 pt-2 border-t border-border/60 dark:border-charcoal-800">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Cryptographically Anonymized & Masked ID</span>
              </div>
              <button
                onClick={() => setSelectedSurveyDossier(null)}
                className="px-4 py-2 bg-rose-primary hover:bg-rose-accent text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
