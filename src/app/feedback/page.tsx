"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

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
}

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<"faculty" | "responses">("faculty");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [facultyIndices, setFacultyIndices] = useState<FacultyIndex[]>([]);
  const [responses, setResponses] = useState<SurveyRecord[]>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
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
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, facRes, respRes] = await Promise.all([
        fetch("/api/feedback?tab=summary"),
        fetch("/api/feedback?tab=faculty"),
        fetch("/api/feedback?tab=responses"),
      ]);

      const sumData = await sumRes.json();
      const facData = await facRes.json();
      const respData = await respRes.json();

      if (sumData.success) setSummary(sumData.summary);
      if (facData.success) setFacultyIndices(facData.facultyIndices || []);
      if (respData.success) setResponses(respData.responses || []);
    } catch (err) {
      console.error("Error fetching feedback data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

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
        setMessage({ text: data.message || "Feedback submitted anonymously!", type: "success" });
        setShowSurveyModal(false);
        fetchData();
      } else {
        setMessage({ text: data.error || "Failed to submit survey", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl text-rose-600 dark:text-rose-400">
              <MessageSquareHeart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Course Evaluation & 360 Faculty Feedback
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Continuous Student Evaluation of Teaching (SET) & NAAC Criterion 1.4 Quality Analytics
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSurveyModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-rose-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Course Evaluation
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Submissions</span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.totalResponses || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">100% Anonymized & Tamper-proof</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Institutional Satisfaction</span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : `${summary?.averageSatisfactionRating || 0} / 5.0`}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">92% Positive Rating</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty Evaluated</span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.facultyEvaluatedCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all departments</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Distinction Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "..." : summary?.topRatedFacultyCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">FPI Score &ge; 4.0 / 5.0</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("faculty")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "faculty"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Award className="w-4 h-4" />
          Faculty Performance Indices (FPI)
        </button>
        <button
          onClick={() => setActiveTab("responses")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "responses"
              ? "border-rose-600 text-rose-600 dark:text-rose-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          Anonymous Evaluation Responses
        </button>
      </div>

      {/* Tab 1: Faculty FPI Cards */}
      {activeTab === "faculty" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facultyIndices.map((fac) => (
            <div
              key={fac.facultyId}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">{fac.facultyName}</h3>
                  <p className="text-xs text-slate-500">
                    Dept: {fac.departmentCode} • {fac.totalSubmissions} Student Evaluations
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {fac.overallFPI.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 block font-semibold">{fac.performanceBand}</span>
                </div>
              </div>

              {/* 5-Criteria Rating Bars */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Pedagogy & Teaching Quality</span>
                  <span className="font-semibold">{fac.avgPedagogy} / 5</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(fac.avgPedagogy / 5) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Syllabus Coverage</span>
                  <span className="font-semibold">{fac.avgSyllabus} / 5</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(fac.avgSyllabus / 5) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Punctuality & Regularity</span>
                  <span className="font-semibold">{fac.avgPunctuality} / 5</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(fac.avgPunctuality / 5) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Doubt Clearing & Accessibility</span>
                  <span className="font-semibold">{fac.avgDoubtClearing} / 5</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${(fac.avgDoubtClearing / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Anonymous Survey Responses */}
      {activeTab === "responses" && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Recent Anonymized Course Feedback Entries
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Student identity encrypted & masked
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="py-3 px-4">Survey Ref</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Faculty Instructor</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Student Comments</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {responses.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
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
                    <td className="py-3 px-4 text-xs italic text-slate-500 max-w-xs truncate">
                      {r.qualitativeRemarks || "No qualitative remarks recorded."}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Course & Faculty Evaluation
              </h2>
              <button
                onClick={() => setShowSurveyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitSurvey} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Course Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.courseCode}
                    onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Faculty Instructor
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.facultyName}
                    onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* 5 Likert Ratings */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide block">
                  Evaluation Criteria (1 = Poor, 5 = Excellent)
                </span>

                {[
                  { key: "ratingPedagogy", label: "Pedagogy & Clarity of Concepts" },
                  { key: "ratingSyllabus", label: "Pacing & Syllabus Coverage" },
                  { key: "ratingPunctuality", label: "Punctuality & Classroom Discipline" },
                  { key: "ratingDoubtClearing", label: "Doubt Resolution & Office Hours" },
                  { key: "ratingCourseMaterial", label: "Quality of Slides, Notes & Lab Sheets" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 dark:text-slate-400">{label}</span>
                    <select
                      value={(formData as any)[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: Number(e.target.value) })
                      }
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg font-semibold"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Very Good</option>
                      <option value={3}>3 - Good</option>
                      <option value={2}>2 - Satisfactory</option>
                      <option value={1}>1 - Needs Improvement</option>
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Qualitative Feedback / Suggestions (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.qualitativeRemarks}
                  onChange={(e) => setFormData({ ...formData, qualitativeRemarks: e.target.value })}
                  placeholder="Share constructive feedback regarding teaching pace or lab assignments..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Anonymous Evaluation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
