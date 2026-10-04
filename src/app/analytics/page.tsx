"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useApp } from "@/context/AppContext";
import { SkeletonCard } from "@/components/common/SkeletonLoader";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  BarChart3,
  TrendingUp,
  Users,
  Award,
  DollarSign,
  Download,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  GraduationCap,
  Activity,
  Search,
  Building2,
} from "lucide-react";

export default function AnalyticsPage() {
  const { showToast, refreshTrigger } = useApp();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"fall2026" | "spring2026" | "ay2025" | "all">("fall2026");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("ALL");
  const [sortField, setSortField] = useState<"name" | "students" | "passRate" | "attendance">("passRate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchDept, setSearchDept] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        } else {
          showToast("Failed to compile institutional analytics", "error");
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
        showToast("Network error retrieving BI metrics", "error");
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [refreshTrigger]);

  const handleExportBI = () => {
    let csv = "Institutional Executive BI Analytics & Telemetry Report\n";
    csv += `Generated On,${new Date().toISOString()}\n`;
    csv += `Reporting Institution,Apex University of Science & Technology\n\n`;
    csv += "Executive Key Performance Indicators\n";
    csv += `Gross Retention Rate,${data?.kpis?.retentionRate || "97.4%"}\n`;
    csv += `Average Campus GPA,${data?.kpis?.averageGpa || "3.52 / 4.0"}\n`;
    csv += `Research Capital Influx,${data?.kpis?.researchFunding || "$5.62M"}\n`;
    csv += `Placement Conversion,${data?.kpis?.placementConversion || "94.8%"}\n\n`;
    csv += "Department,Enrollment,Pass Rate (%),Biometric Attendance (%),Funded Research\n";

    (data?.deptMetrics || []).forEach((dm: any) => {
      csv += `"${dm.name}",${dm.students},${dm.passRate}%,${dm.attendance}%,${dm.grants}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Institutional_Executive_BI_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported Institutional Executive BI Dashboard (CSV)", "success");
  };

  // Trajectory points for multi-term line chart (Terms 1 to 6)
  const trajectoryData = [
    { term: "Term 1", retention: 91.2, passRate: 88.4, gpa: 3.24, label: "Fall '23" },
    { term: "Term 2", retention: 93.0, passRate: 89.8, gpa: 3.32, label: "Spring '24" },
    { term: "Term 3", retention: 94.5, passRate: 91.5, gpa: 3.41, label: "Fall '24" },
    { term: "Term 4", retention: 95.8, passRate: 92.9, gpa: 3.46, label: "Spring '25" },
    { term: "Term 5", retention: 96.6, passRate: 94.1, gpa: 3.49, label: "Fall '25" },
    { term: "Term 6", retention: 97.4, passRate: 95.3, gpa: 3.52, label: "Current (Fall '26)" },
  ];

  // SVG coordinate helpers for area/line
  const chartWidth = 600;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const getSvgCoordinates = (index: number, val: number, min = 85, max = 100) => {
    const x = paddingX + (index / (trajectoryData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((val - min) / (max - min)) * (chartHeight - paddingY * 2);
    return { x, y };
  };

  const retentionPoints = trajectoryData.map((d, i) => getSvgCoordinates(i, d.retention));
  const passRatePoints = trajectoryData.map((d, i) => getSvgCoordinates(i, d.passRate));

  const retentionPath = retentionPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
  const passRatePath = passRatePoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");

  const retentionAreaPath = `${retentionPath} L ${retentionPoints[retentionPoints.length - 1].x} ${chartHeight - paddingY} L ${retentionPoints[0].x} ${chartHeight - paddingY} Z`;

  // Grade honors distribution
  const honorsBreakdown = [
    { label: "Distinction (>3.8)", pct: 42, color: "#E11D48", stroke: "stroke-rose-primary" },
    { label: "First Class (3.4-3.79)", pct: 38, color: "#10B981", stroke: "stroke-emerald-500" },
    { label: "Second Class (3.0-3.39)", pct: 16, color: "#3B82F6", stroke: "stroke-blue-500" },
    { label: "Academic Warning (<3.0)", pct: 4, color: "#F59E0B", stroke: "stroke-amber-500" },
  ];

  // Department sorting & filtering
  const rawDepts = data?.deptMetrics || [
    { name: "Computer Science & Engineering", code: "CSE", students: 620, passRate: 96.2, attendance: 95.4, grants: "$2.85M" },
    { name: "Biomedical Engineering", code: "BME", students: 380, passRate: 93.8, attendance: 93.9, grants: "$2.40M" },
    { name: "Mechanical & Robotics Systems", code: "MECH", students: 440, passRate: 94.7, attendance: 94.1, grants: "$1.45M" },
    { name: "Electrical & Computer Eng", code: "ECE", students: 510, passRate: 95.1, attendance: 94.8, grants: "$1.90M" },
  ];

  const filteredDepts = rawDepts
    .filter((dm: any) => {
      const matchSearch =
        dm.name.toLowerCase().includes(searchDept.toLowerCase()) ||
        dm.code.toLowerCase().includes(searchDept.toLowerCase());
      const matchFilter = selectedDeptFilter === "ALL" || dm.code === selectedDeptFilter;
      return matchSearch && matchFilter;
    })
    .sort((a: any, b: any) => {
      const mult = sortOrder === "asc" ? 1 : -1;
      if (sortField === "name") return mult * a.name.localeCompare(b.name);
      return mult * ((a[sortField] || 0) - (b[sortField] || 0));
    });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Breadcrumbs />

        {/* Hero Section with Luxury Glassmorphic Header */}
        <div className="relative overflow-hidden rounded-3xl border border-border dark:border-charcoal-700/80 bg-gradient-to-br from-white via-rose-primary/[0.03] to-white dark:from-[#171219] dark:via-[#1e141a] dark:to-[#171219] p-6 lg:p-8 shadow-elevated">
          {/* Ambient decorative glow orbs */}
          <div className="absolute top-0 right-1/4 -mt-12 h-64 w-64 rounded-full bg-rose-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 -mb-10 h-48 w-48 rounded-full bg-academic-success/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-rose-primary to-rose-accent text-white flex items-center justify-center shadow-lg shadow-rose-primary/30 shrink-0">
                <BarChart3 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-display font-extrabold tracking-tight text-charcoal-900 dark:text-ivory-100">
                    Institutional Intelligence & BI Telemetry
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-academic-success-subtle dark:bg-emerald-950/60 text-academic-success border border-green-200 dark:border-green-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Database Aggregates
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-primary/10 text-rose-primary dark:text-rose-light border border-rose-primary/20">
                    NIRF & ABET Compliant
                  </span>
                </div>
                <p className="text-xs text-charcoal-600 dark:text-charcoal-400 max-w-2xl leading-relaxed">
                  Real-time multi-cohort retention modeling, pass-rate trajectory analysis, research grant allocation metrics, and early warning risk indicators.
                </p>
              </div>
            </div>

            {/* Quick Actions & Range Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-2xl bg-ivory-100 dark:bg-charcoal-900/90 p-1 border border-border dark:border-charcoal-800 text-[11px] font-bold shadow-xs">
                <button
                  type="button"
                  onClick={() => setTimeRange("fall2026")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    timeRange === "fall2026"
                      ? "bg-white dark:bg-charcoal-800 text-rose-primary dark:text-rose-light shadow-xs"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white"
                  }`}
                >
                  Fall 2026
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("spring2026")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    timeRange === "spring2026"
                      ? "bg-white dark:bg-charcoal-800 text-rose-primary dark:text-rose-light shadow-xs"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white"
                  }`}
                >
                  Spring 2026
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("ay2025")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    timeRange === "ay2025"
                      ? "bg-white dark:bg-charcoal-800 text-rose-primary dark:text-rose-light shadow-xs"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white"
                  }`}
                >
                  AY 2025
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportBI}
                className="btn-primary-glow flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-primary hover:bg-rose-dark active:scale-[0.98] text-white text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Export Executive BI (CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Luxury Key Performance Indicator Cards with Sparklines */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Gross Retention Rate */}
            <div className="relative overflow-hidden glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Gross Retention Rate
                  </span>
                  <div className="text-3xl font-display font-extrabold text-academic-success mt-1">
                    {data?.kpis?.retentionRate || "97.4%"}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-academic-success-subtle text-academic-success flex items-center justify-center shadow-xs">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-charcoal-700 dark:text-ivory-200">
                  {data?.kpis?.activeStudents || 18} of {data?.kpis?.totalStudents || 18} Active
                </span>
                <span className="inline-flex items-center gap-0.5 text-academic-success font-bold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +2.1% YoY
                </span>
              </div>
            </div>

            {/* KPI 2: Campus Average GPA */}
            <div className="relative overflow-hidden glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Average Campus GPA
                  </span>
                  <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                    {data?.kpis?.averageGpa || "3.52 / 4.0"}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center shadow-xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Scale 4.00 Alpha</span>
                <span className="inline-flex items-center gap-0.5 text-academic-success font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Top 5% Decile
                </span>
              </div>
            </div>

            {/* KPI 3: Research Capital Influx */}
            <div className="relative overflow-hidden glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Research Capital Influx
                  </span>
                  <div className="text-3xl font-display font-extrabold text-rose-primary dark:text-rose-light mt-1">
                    {data?.kpis?.researchFunding || "$5.62M"}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-rose-primary/10 text-rose-primary flex items-center justify-center shadow-xs">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">NSF & Corporate Grants</span>
                <span className="inline-flex items-center gap-0.5 text-rose-primary dark:text-rose-light font-bold">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +14.2% Inflow
                </span>
              </div>
            </div>

            {/* KPI 4: Placement Conversion */}
            <div className="relative overflow-hidden glass-panel glass-card-hover p-5 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-charcoal-500 dark:text-charcoal-400 uppercase tracking-wider block">
                    Placement Conversion
                  </span>
                  <div className="text-3xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100 mt-1">
                    {data?.kpis?.placementConversion || "94.8%"}
                  </div>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-xs">
                  <Award className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 dark:border-charcoal-800/80 flex items-center justify-between text-[11px]">
                <span className="text-charcoal-500 dark:text-charcoal-400">Tier-1 Industry Offers</span>
                <span className="inline-flex items-center gap-0.5 text-academic-success font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 16 Days Avg Cycle
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mid Row: Visual Interactive SVG Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Multi-Term Retention & Pass-Rate Trajectory Chart (8 Cols) */}
          <div className="lg:col-span-8 glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 dark:border-charcoal-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100">
                    Multi-Term Academic Trajectory (2023 - 2026)
                  </h3>
                </div>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                  Cohort retention rate versus cumulative pass rate across 6 consecutive academic terms
                </p>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-primary shadow-xs" />
                  <span className="text-charcoal-700 dark:text-ivory-200">Retention %</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-xs" />
                  <span className="text-charcoal-700 dark:text-ivory-200">Pass Rate %</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Chart Canvas */}
            <div className="w-full overflow-x-auto py-2">
              <div className="min-w-[500px]">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-44 overflow-visible"
                >
                  <defs>
                    <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E11D48" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#E11D48" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {[85, 90, 95, 100].map((v) => {
                    const y = chartHeight - paddingY - ((v - 85) / 15) * (chartHeight - paddingY * 2);
                    return (
                      <g key={v}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="4 4"
                          className="text-border dark:text-charcoal-800"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3}
                          fontSize="9"
                          textAnchor="end"
                          className="fill-charcoal-400 font-mono"
                        >
                          {v}%
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill for retention */}
                  <path d={retentionAreaPath} fill="url(#retentionGrad)" />

                  {/* Line for Pass Rate */}
                  <path
                    d={passRatePath}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Line for Retention */}
                  <path
                    d={retentionPath}
                    fill="none"
                    stroke="#E11D48"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Points with hover tooltips */}
                  {trajectoryData.map((d, i) => {
                    const pRet = retentionPoints[i];
                    const pPass = passRatePoints[i];
                    const isHovered = hoveredPoint === i;

                    return (
                      <g
                        key={d.term}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Vertical line indicator on hover */}
                        {isHovered && (
                          <line
                            x1={pRet.x}
                            y1={paddingY}
                            x2={pRet.x}
                            y2={chartHeight - paddingY}
                            stroke="#E11D48"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.6"
                          />
                        )}

                        {/* Retention dot */}
                        <circle
                          cx={pRet.x}
                          cy={pRet.y}
                          r={isHovered ? 6 : 4}
                          className="fill-white dark:fill-charcoal-900 stroke-rose-primary transition-all"
                          strokeWidth="2.5"
                        />

                        {/* Pass rate dot */}
                        <circle
                          cx={pPass.x}
                          cy={pPass.y}
                          r={isHovered ? 6 : 4}
                          className="fill-white dark:fill-charcoal-900 stroke-emerald-500 transition-all"
                          strokeWidth="2.5"
                        />

                        {/* Term Label on X-axis */}
                        <text
                          x={pRet.x}
                          y={chartHeight - 6}
                          fontSize="9"
                          textAnchor="middle"
                          className={`font-semibold ${
                            isHovered ? "fill-rose-primary font-bold" : "fill-charcoal-500 dark:fill-charcoal-400"
                          }`}
                        >
                          {d.label}
                        </text>

                        {/* Floating tooltip box on hover */}
                        {isHovered && (
                          <g>
                            <rect
                              x={Math.min(chartWidth - 110, Math.max(10, pRet.x - 55))}
                              y={Math.max(5, pRet.y - 48)}
                              width="110"
                              height="42"
                              rx="8"
                              className="fill-charcoal-900/95 dark:fill-charcoal-950/95 stroke-rose-primary/50"
                              strokeWidth="1"
                            />
                            <text
                              x={Math.min(chartWidth - 55, Math.max(65, pRet.x))}
                              y={Math.max(5, pRet.y - 48) + 14}
                              fontSize="9"
                              textAnchor="middle"
                              className="fill-white font-bold"
                            >
                              {d.term} • GPA {d.gpa}
                            </text>
                            <text
                              x={Math.min(chartWidth - 55, Math.max(65, pRet.x))}
                              y={Math.max(5, pRet.y - 48) + 26}
                              fontSize="8"
                              textAnchor="middle"
                              className="fill-rose-300 font-mono"
                            >
                              Ret: {d.retention}% | Pass: {d.passRate}%
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Bottom Telemetry Insight Bar */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-ivory-50/70 dark:bg-charcoal-900/60 border border-border/70 dark:border-charcoal-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-charcoal-600 dark:text-charcoal-400">Peak Retention:</span>
                <strong className="text-charcoal-900 dark:text-ivory-100 font-bold">97.4% (Term 6)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-primary" />
                <span className="text-charcoal-600 dark:text-charcoal-400">Gain Over AY23:</span>
                <strong className="text-rose-primary dark:text-rose-light font-bold">+6.2% Overall</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-charcoal-600 dark:text-charcoal-400">Median GPA Drift:</span>
                <strong className="text-charcoal-900 dark:text-ivory-100 font-bold">+0.28 Points</strong>
              </div>
            </div>
          </div>

          {/* Right: Academic Honors & Grade Breakdown Radial (4 Cols) */}
          <div className="lg:col-span-4 glass-panel p-6 rounded-3xl border border-border dark:border-charcoal-800 shadow-soft flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between border-b border-border/80 dark:border-charcoal-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-rose-primary" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100">
                    Grade Honors Split
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-academic-success">Fall 2026</span>
              </div>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-2">
                Academic standing distribution across all enrolled students
              </p>
            </div>

            {/* Circular Visual Gauge */}
            <div className="flex flex-col items-center justify-center relative py-2">
              <div className="relative h-36 w-36 flex items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-ivory-200 dark:text-charcoal-800"
                  />
                  {/* Distinction 42% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#E11D48"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="145.7"
                    strokeLinecap="round"
                  />
                  {/* First Class 38% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="155.7"
                    className="-rotate-45 origin-center"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-display font-extrabold text-charcoal-900 dark:text-ivory-100">
                    80%
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-500">
                    Honors Grade
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Legend with bars */}
            <div className="space-y-2 text-xs">
              {honorsBreakdown.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-charcoal-600 dark:text-charcoal-400 font-semibold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </span>
                    <strong className="text-charcoal-900 dark:text-ivory-100 font-bold">{item.pct}%</strong>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Performance Matrix Table with Interactive Filtering & Sort */}
        <div className="glass-panel rounded-3xl border border-border dark:border-charcoal-800 shadow-soft overflow-hidden">
          {/* Header & Controls */}
          <div className="p-6 border-b border-border/80 dark:border-charcoal-800 bg-surface-soft/60 dark:bg-charcoal-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-charcoal-900 dark:text-ivory-100">
                  Academic Department Performance Matrix
                </h2>
              </div>
              <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                Evaluated against campus median pass benchmark and external sponsored grant influx
              </p>
            </div>

            {/* Search and Dept Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-charcoal-400" />
                <input
                  type="text"
                  placeholder="Search department..."
                  value={searchDept}
                  onChange={(e) => setSearchDept(e.target.value)}
                  className="pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 text-xs text-charcoal-900 dark:text-ivory-100 focus:outline-none focus:ring-1 focus:ring-rose-primary"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-white dark:bg-charcoal-900 p-1 border border-border dark:border-charcoal-700 text-[11px] font-bold">
                {["ALL", "CSE", "BME", "MECH", "ECE"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedDeptFilter(code)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      selectedDeptFilter === code
                        ? "bg-rose-primary text-white shadow-xs"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-white"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ivory-100/90 dark:bg-charcoal-900/90 border-b border-border dark:border-charcoal-800 text-charcoal-600 dark:text-charcoal-400 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th
                    className="p-4 cursor-pointer hover:text-rose-primary transition-colors"
                    onClick={() => {
                      if (sortField === "name") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else { setSortField("name"); setSortOrder("asc"); }
                    }}
                  >
                    Department Entity
                  </th>
                  <th
                    className="p-4 text-center cursor-pointer hover:text-rose-primary transition-colors"
                    onClick={() => {
                      if (sortField === "students") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else { setSortField("students"); setSortOrder("desc"); }
                    }}
                  >
                    Enrollment Volume
                  </th>
                  <th
                    className="p-4 text-center cursor-pointer hover:text-rose-primary transition-colors"
                    onClick={() => {
                      if (sortField === "passRate") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else { setSortField("passRate"); setSortOrder("desc"); }
                    }}
                  >
                    Cohort Pass Rate
                  </th>
                  <th
                    className="p-4 text-center cursor-pointer hover:text-rose-primary transition-colors"
                    onClick={() => {
                      if (sortField === "attendance") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                      else { setSortField("attendance"); setSortOrder("desc"); }
                    }}
                  >
                    Biometric Attendance
                  </th>
                  <th className="p-4 text-right">Sponsored Research</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-charcoal-800 text-charcoal-900 dark:text-ivory-100">
                {filteredDepts.map((dm: any) => (
                  <tr
                    key={dm.code || dm.name}
                    className="hover:bg-rose-primary/[0.02] dark:hover:bg-charcoal-800/40 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-xl bg-rose-primary/10 text-rose-primary dark:text-rose-light flex items-center justify-center font-mono font-bold text-xs shrink-0">
                          {dm.code || "DEP"}
                        </span>
                        <div>
                          <strong className="font-bold text-charcoal-900 dark:text-ivory-100 block">
                            {dm.name}
                          </strong>
                          <span className="text-[10px] text-charcoal-500 font-mono">
                            Accredited Tier-1 Division
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className="font-bold text-charcoal-800 dark:text-ivory-100 text-sm">
                        {dm.students}
                      </span>
                      <span className="text-[10px] text-charcoal-500 block">Scholars</span>
                    </td>

                    <td className="p-4">
                      <div className="max-w-[140px] mx-auto space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-academic-success font-bold">{dm.passRate}%</strong>
                          <span className="text-[10px] text-charcoal-400">Target 90%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-academic-success transition-all duration-500"
                            style={{ width: `${Math.min(100, dm.passRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="max-w-[140px] mx-auto space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-charcoal-800 dark:text-ivory-100 font-bold">{dm.attendance}%</strong>
                          <span className="text-[10px] text-charcoal-400">Min 75%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-ivory-200 dark:bg-charcoal-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-primary transition-all duration-500"
                            style={{ width: `${Math.min(100, dm.attendance)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-right">
                      <span className="font-mono font-bold text-rose-primary dark:text-rose-light text-sm block">
                        {dm.grants}
                      </span>
                      <span className="text-[10px] text-academic-success font-semibold">Active Drawdown</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Alert / Executive Recommendation Ribbon */}
        <div className="rounded-3xl border border-academic-success/30 bg-academic-success-subtle/40 dark:bg-green-950/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-academic-success text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-charcoal-900 dark:text-ivory-100">
                Institutional Quality Assurance Audit Status: ACCREDITED EXCELLENCE
              </h4>
              <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400">
                All 4 divisions surpass NAAC A++ continuous performance thresholds for retention (97.4%) and faculty research publication output.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-charcoal-900 text-charcoal-800 dark:text-ivory-200 border border-border dark:border-charcoal-700 shadow-xs shrink-0 self-start sm:self-auto">
            Senate Approved 2026
          </span>
        </div>
      </div>
    </AppShell>
  );
}
