"use client";

import React, { useState, useEffect } from "react";
import { Target, CheckCircle2, AlertTriangle, BookOpen, Award, Copy, Check, Sparkles, ShieldCheck } from "lucide-react";

interface CareerRoadmapTabProps {
  studentId: string;
  studentName: string;
}

export function CareerRoadmapTab({ studentId, studentName }: CareerRoadmapTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [targetRole, setTargetRole] = useState("FULL_STACK_CLOUD_ARCHITECT");
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchRoadmap = async (role?: string) => {
    setLoading(true);
    try {
      const url = role
        ? `/api/students/career-roadmap?studentId=${studentId}&targetRole=${role}`
        : `/api/students/career-roadmap?studentId=${studentId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.roadmap);
        setTargetRole(json.roadmap.targetRole);
      }
    } catch (err) {
      console.error("Failed to load career roadmap", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [studentId]);

  const handleRoleChange = async (newRole: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/students/career-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          targetRole: newRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.roadmap);
        setTargetRole(newRole);
      }
    } catch (err) {
      console.error("Failed to update target role", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleCopyAts = () => {
    if (data?.atsResumeSummary) {
      navigator.clipboard.writeText(data.atsResumeSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Synthesizing transcript and running AI career matching radar...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        No career roadmap profile available for this scholar.
      </div>
    );
  }

  const matchScore = data.overallMatchPercentage || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-container dark:bg-rose-primary/20 text-rose-primary dark:text-rose-light flex items-center justify-center shrink-0">
            <Target className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                AI Career Roadmap & Skill Gap Radar
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                AI POWERED
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Evaluates completed course credits against industry skill benchmarks and curates personalized elective pathways.
            </p>
          </div>
        </div>

        {/* Target Role Selector */}
        <div className="flex flex-col gap-1 sm:w-72">
          <label className="text-[10px] font-bold text-charcoal-500 uppercase">Target Industry Role</label>
          <select
            value={targetRole}
            disabled={updating}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full text-xs font-bold p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:border-rose-primary"
          >
            <option value="FULL_STACK_CLOUD_ARCHITECT">Full-Stack Cloud Architect</option>
            <option value="AI_LLM_SYSTEMS_ENGINEER">AI / LLM Systems Engineer</option>
            <option value="CYBERSECURITY_DEVSECOPS_SPECIALIST">Cybersecurity & DevSecOps Specialist</option>
            <option value="QUANTITATIVE_FINTECH_ENGINEER">Quantitative & FinTech Systems Engineer</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match Percentage */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-charcoal-500 uppercase">Role Readiness Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100">
                {matchScore}%
              </span>
              <span className="text-xs font-bold text-academic-success">
                {matchScore >= 75 ? "Strong Candidate" : matchScore >= 50 ? "Moderate Gap" : "Early Stage"}
              </span>
            </div>
            <div className="w-full bg-charcoal-100 dark:bg-charcoal-700 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  matchScore >= 75 ? "bg-academic-success" : matchScore >= 50 ? "bg-amber-500" : "bg-rose-primary"
                }`}
                style={{ width: `${matchScore}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-charcoal-500 mt-4 leading-relaxed">
            Derived from validated coursework, laboratory performance, and project portfolios.
          </p>
        </div>

        {/* Mastered Skills */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-academic-success" /> Mastered Competencies ({data.masteredSkills?.length || 0})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.masteredSkills?.map((skill: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Critical Skill Gaps */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Critical Skill Gaps ({data.missingSkills?.length || 0})
          </span>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.missingSkills?.map((skill: string, i: number) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Curated Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recommended University Electives */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-rose-primary" /> Recommended Institutional Electives
          </h4>
          <div className="space-y-3">
            {data.recommendedElectives?.map((el: any, i: number) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-ground dark:bg-charcoal-900/50 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    {el.courseCode}: {el.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container text-rose-primary">
                    +{el.expectedSkillPoints}% Match
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-500">{el.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Industry MOOCs & Certifications */}
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-4">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" /> Recommended Industry Certifications
          </h4>
          <div className="space-y-3">
            {data.recommendedMoocs?.map((m: any, i: number) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border dark:border-charcoal-700 bg-surface-ground dark:bg-charcoal-900/50 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                    {m.platform} • {m.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                    {m.estimatedHours} Hrs
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-500">Skills: {m.skillsGained.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ATS Resume Summary Snippet */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-rose-primary" /> Generated ATS Resume Summary Snippet
          </h4>
          <button
            onClick={handleCopyAts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-ground hover:bg-rose-container border border-border dark:border-charcoal-600 transition-all text-charcoal-800 dark:text-ivory-100"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-rose-primary" />}
            <span>{copied ? "Copied!" : "Copy Snippet"}</span>
          </button>
        </div>
        <div className="p-4 rounded-xl bg-charcoal-50 dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs font-mono text-charcoal-800 dark:text-charcoal-200 whitespace-pre-wrap leading-relaxed">
          {data.atsResumeSummary}
        </div>
        <div className="flex items-center justify-between pt-2 text-[10px] text-charcoal-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-academic-success" />
            Integrity Seal: {data.verificationSeal}
          </span>
          <span>Last Computed: {new Date(data.lastEvaluatedAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
