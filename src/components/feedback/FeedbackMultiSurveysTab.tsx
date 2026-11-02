"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Building,
  BookOpen,
  Award,
  Star,
  Users,
  Search,
  Download,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SurveyResponse } from "@/lib/feedback/feedback-engine";

interface FeedbackMultiSurveysTabProps {
  onOpenSurveyModal: (surveyType: string) => void;
}

export default function FeedbackMultiSurveysTab({ onOpenSurveyModal }: FeedbackMultiSurveysTabProps) {
  const { showToast } = useApp();
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback?tab=multi-stakeholder");
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
      }
    } catch (err) {
      console.error("Failed to load multi-stakeholder surveys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const handleExportCsv = () => {
    if (!surveys.length) {
      showToast("No survey records to export", "error");
      return;
    }
    const headers = ["Survey Ref", "Survey Type", "Course/Program", "Stakeholder Target", "Overall Rating", "Remarks", "Date"];
    const rows = surveys.map((s) => [
      s.surveyRef,
      s.surveyType,
      `"${s.courseName}"`,
      `"${s.facultyName}"`,
      s.overallScore,
      `"${(s.qualitativeRemarks || "").replace(/"/g, '""')}"`,
      s.submittedAt,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Multi_Stakeholder_Surveys_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    showToast("Downloaded Multi-Stakeholder Surveys CSV", "success");
  };

  const filtered = surveys.filter((s) => {
    if (typeFilter !== "ALL" && s.surveyType !== typeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRef = s.surveyRef?.toLowerCase().includes(q);
      const matchCourse = s.courseName?.toLowerCase().includes(q);
      const matchTarget = s.facultyName?.toLowerCase().includes(q);
      const matchRemarks = s.qualitativeRemarks?.toLowerCase().includes(q);
      return matchRef || matchCourse || matchTarget || matchRemarks;
    }
    return true;
  });

  const exitCount = surveys.filter((s) => s.surveyType === "EXIT_SURVEY_SENIORS").length;
  const alumniCount = surveys.filter((s) => s.surveyType === "ALUMNI_CURRICULUM_SURVEY").length;
  const infraCount = surveys.filter((s) => s.surveyType === "FACILITY_INFRASTRUCTURE").length;
  const empCount = surveys.filter((s) => s.surveyType === "EMPLOYER_FEEDBACK_SURVEY").length;
  const parCount = surveys.filter((s) => s.surveyType === "PARENT_FEEDBACK_SURVEY").length;

  return (
    <div className="space-y-6">
      {/* Telemetry Strip - 5 NAAC Criterion 1.4 Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Senior Exit
            </p>
            <h3 className="text-2xl font-display font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {exitCount}
            </h3>
            <span className="badge-subtle bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 mt-1 inline-block">
              NBA POs Attainment
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Alumni Curriculum
            </p>
            <h3 className="text-2xl font-display font-bold text-rose-primary dark:text-rose-accent mt-1">
              {alumniCount}
            </h3>
            <span className="badge-subtle bg-rose-container/60 dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent mt-1 inline-block">
              NEP 2020 Readiness
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-rose-container text-rose-primary dark:text-rose-accent flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Campus Facilities
            </p>
            <h3 className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {infraCount}
            </h3>
            <span className="badge-subtle bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 mt-1 inline-block">
              Smart Labs &amp; WiFi
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Building className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Corporate Employers
            </p>
            <h3 className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
              {empCount}
            </h3>
            <span className="badge-subtle bg-amber-500/10 text-amber-700 dark:text-amber-300 mt-1 inline-block">
              Recruiter Feedback
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel glass-card-hover p-4 sm:p-5 rounded-2xl shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-charcoal-500 dark:text-charcoal-400">
              Parents &amp; Guardians
            </p>
            <h3 className="text-2xl font-display font-bold text-purple-600 dark:text-purple-400 mt-1">
              {parCount}
            </h3>
            <span className="badge-subtle bg-purple-500/10 text-purple-700 dark:text-purple-300 mt-1 inline-block">
              Welfare &amp; Discipline
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-border dark:border-charcoal-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search surveys, remarks, programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-ivory-50 dark:bg-charcoal-800 border border-border dark:border-charcoal-700 focus:outline-none focus:ring-2 focus:ring-rose-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL", label: "All Stakeholders" },
              { id: "EXIT_SURVEY_SENIORS", label: "Senior Exit" },
              { id: "ALUMNI_CURRICULUM_SURVEY", label: "Alumni" },
              { id: "FACILITY_INFRASTRUCTURE", label: "Infrastructure" },
              { id: "EMPLOYER_FEEDBACK_SURVEY", label: "Employers" },
              { id: "PARENT_FEEDBACK_SURVEY", label: "Parents" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  typeFilter === t.id
                    ? "bg-rose-primary text-white"
                    : "bg-ivory-100 dark:bg-charcoal-800 text-charcoal-600 dark:text-charcoal-300 hover:bg-rose-container"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-ivory-100 dark:bg-charcoal-800 hover:bg-rose-container text-charcoal-700 dark:text-ivory-200 border border-border dark:border-charcoal-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onOpenSurveyModal("EXIT_SURVEY_SENIORS")}
            className="btn-primary-glow flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Stakeholder Survey</span>
          </button>
        </div>
      </div>

      {/* Surveys List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-xs text-charcoal-400 p-8 col-span-3 text-center">Loading multi-stakeholder surveys...</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-charcoal-400 p-8 col-span-3 text-center">No surveys found matching filter.</p>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-charcoal-900 rounded-2xl p-5 border border-border dark:border-charcoal-800 shadow-sm flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-900 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] font-bold text-rose-primary dark:text-rose-accent bg-rose-container/50 px-2 py-0.5 rounded">
                    {s.surveyRef}
                  </span>
                  <div className="flex items-center gap-1 font-bold text-amber-500 text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{s.overallScore.toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-charcoal-900 dark:text-ivory-100 mb-1">
                  {s.courseName}
                </h4>
                <p className="text-[11px] text-charcoal-500 mb-3">
                  Target: {s.facultyName} • {s.departmentCode}
                </p>

                {s.qualitativeRemarks && (
                  <div className="p-3 rounded-xl bg-ivory-50 dark:bg-charcoal-800/60 text-xs text-charcoal-700 dark:text-ivory-300 border border-border dark:border-charcoal-800 mb-3 italic">
                    &ldquo;{s.qualitativeRemarks}&rdquo;
                  </div>
                )}

                {s.emergingTechRecommended && (
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mb-2">
                    <span className="font-semibold">Industry Tech Recommended: </span>
                    <span>{s.emergingTechRecommended}</span>
                  </div>
                )}

                {s.futureAspirations && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mb-2">
                    <span className="font-semibold">Career Aspiration: </span>
                    <span>{s.futureAspirations}</span>
                  </div>
                )}

                {s.employerCompanyName && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 mb-2">
                    <span className="font-semibold">Recruiting Partner: </span>
                    <span>{s.employerCompanyName} ({s.employerDesignation || "HR Lead"})</span>
                  </div>
                )}

                {s.parentWardName && (
                  <div className="text-[11px] text-purple-700 dark:text-purple-300 mb-2">
                    <span className="font-semibold">Parent of Scholar: </span>
                    <span>{s.parentWardName} ({s.parentWardRoll || "Enrolled Student"})</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60 dark:border-charcoal-800 flex items-center justify-between text-[10px] text-charcoal-400">
                <span className="capitalize">{s.surveyType.replace(/_/g, " ").toLowerCase()}</span>
                <span>{new Date(s.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
