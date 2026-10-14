"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, FileText, CheckCircle2, ShieldCheck, Printer, Plus, Download, BrainCircuit } from "lucide-react";

interface QuestionPaperStudioTabProps {
  facultyId: string;
  facultyName: string;
}

export function QuestionPaperStudioTab({ facultyId, facultyName }: QuestionPaperStudioTabProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("CS-402");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);
  const [activeSet, setActiveSet] = useState<"SET_A" | "SET_B">("SET_A");

  // Add Question State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQ, setNewQ] = useState({
    courseCode: "CS-402",
    unitNumber: 1,
    questionText: "",
    bloomLevel: "L3_APPLY",
    difficulty: "MEDIUM",
    marks: 6,
    coMapping: "CO1",
    modelAnswerSummary: "",
  });
  const [savingQ, setSavingQ] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faculty/question-paper-generator");
      const json = await res.json();
      if (json.success) {
        setStats(json.stats);
        setAvailableCourses(json.availableCourses || ["CS-402"]);
        if (json.recentPapers && json.recentPapers.length > 0) {
          setGeneratedResult({ setA: json.recentPapers[0] });
        }
      }
    } catch (err) {
      console.error("Failed to load question generator stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [facultyId]);

  const handleGeneratePaper = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/faculty/question-paper-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_PAPER",
          courseCode: selectedCourse,
          courseTitle: "Advanced Distributed Systems & Cloud Architecture",
          departmentCode: "CSE",
          examinationTitle: "Summative End-Semester University Examination 2026",
          totalMarks: 100,
          durationHours: 3,
          facultyName,
          generateParallelSets: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGeneratedResult(json);
        setActiveSet("SET_A");
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to generate question paper", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQ(true);
    try {
      const res = await fetch("/api/faculty/question-paper-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_QUESTION",
          ...newQ,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewQ({
          courseCode: selectedCourse,
          unitNumber: 1,
          questionText: "",
          bloomLevel: "L3_APPLY",
          difficulty: "MEDIUM",
          marks: 6,
          coMapping: "CO1",
          modelAnswerSummary: "",
        });
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to add question to bank", err);
    } finally {
      setSavingQ(false);
    }
  };

  const handlePrintPaper = (paper: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${paper.examinationTitle} - ${paper.paperSet}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .inst-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
            .exam-name { font-size: 16px; font-weight: bold; margin-top: 4px; }
            .meta { display: flex; justify-content: space-between; font-size: 14px; margin-top: 10px; font-weight: bold; }
            .section { margin-top: 25px; }
            .section-title { font-weight: bold; text-decoration: underline; margin-bottom: 8px; font-size: 15px; }
            .q-item { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .q-text { flex: 1; padding-right: 20px; }
            .q-marks { font-weight: bold; white-space: nowrap; }
            .footer { margin-top: 40px; border-top: 1px dashed #888; padding-top: 15px; font-size: 11px; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="inst-name">APEX INSTITUTE OF TECHNOLOGY & MANAGEMENT</div>
            <div class="exam-name">${paper.examinationTitle} (${paper.paperSet})</div>
            <div class="meta">
              <span>Course: ${paper.courseCode} - ${paper.courseTitle}</span>
              <span>Time: ${paper.durationHours} Hours | Max Marks: ${paper.totalMarks}</span>
            </div>
          </div>
          ${paper.sections.map((sec: any) => `
            <div class="section">
              <div class="section-title">${sec.sectionName} [Total: ${sec.totalMarks} Marks]</div>
              <div style="font-size: 12px; font-style: italic; margin-bottom: 10px;">${sec.instructions}</div>
              ${sec.questions.map((q: any) => `
                <div class="q-item">
                  <div class="q-text"><strong>${q.qNumber}.</strong> ${q.text} <span style="font-size: 11px; color: #555;">[${q.coCode} | ${q.bloomLevel.split("_")[0]}]</span></div>
                  <div class="q-marks">[${q.marks} Marks]</div>
                </div>
              `).join("")}
            </div>
          `).join("")}
          <div class="footer">
            <div>Paper Controller Seal: <strong>${paper.cryptographicPaperSeal}</strong></div>
            <div>Generated by: ${paper.generatedByFaculty}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-charcoal-800 p-8 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-charcoal-500 text-xs">
        Connecting to Examination Question Bank & Bloom Taxonomy Engine...
      </div>
    );
  }

  const activePaper = generatedResult?.setA && activeSet === "SET_A"
    ? generatedResult.setA
    : generatedResult?.setB && activeSet === "SET_B"
    ? generatedResult.setB
    : generatedResult?.setA || null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <BrainCircuit className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
                Autonomous Examination Question Paper Studio
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                BLOOM&apos;S TAXONOMY VERIFIED
              </span>
            </div>
            <p className="text-xs text-charcoal-600 dark:text-charcoal-400 mt-1">
              Autonomous generation of parallel Set A & Set B university examination papers enforcing ~25% L1/L2, ~45% L3/L4, and ~30% L5/L6 Bloom weights with cryptographic SHA-256 seals.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-ivory-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 border border-border dark:border-charcoal-600 hover:bg-rose-container transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
          <button
            onClick={handleGeneratePaper}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-primary hover:bg-rose-deep text-white text-xs font-bold transition-all shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generating ? "Synthesizing Papers..." : "Generate Set A & Set B"}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Question Bank Size</span>
          <div className="text-2xl font-display font-bold text-charcoal-900 dark:text-ivory-100 mt-1">
            {stats?.totalQuestionsInBank || 0} Questions
          </div>
          <span className="text-[10px] text-academic-success font-semibold">Ready for Summative Exams</span>
        </div>

        <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Bloom L1-L2 (Remember/Understand)</span>
          <div className="text-2xl font-display font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats?.bloomBreakdown?.L1_REMEMBER || 0} + {stats?.bloomBreakdown?.L2_UNDERSTAND || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Target Weight: ~25%</span>
        </div>

        <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Bloom L3-L4 (Apply/Analyze)</span>
          <div className="text-2xl font-display font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats?.bloomBreakdown?.L3_APPLY || 0} + {stats?.bloomBreakdown?.L4_ANALYZE || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Target Weight: ~45%</span>
        </div>

        <div className="bg-white dark:bg-charcoal-800 p-4 rounded-xl border border-border dark:border-charcoal-700 shadow-soft">
          <span className="text-[10px] font-bold text-charcoal-500 uppercase">Bloom L5-L6 (Evaluate/Create)</span>
          <div className="text-2xl font-display font-bold text-rose-primary dark:text-rose-light mt-1">
            {stats?.bloomBreakdown?.L5_EVALUATE || 0} + {stats?.bloomBreakdown?.L6_CREATE || 0}
          </div>
          <span className="text-[10px] text-charcoal-500">Target Weight: ~30%</span>
        </div>
      </div>

      {/* Generated Paper View */}
      {activePaper ? (
        <div className="bg-white dark:bg-charcoal-800 p-6 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-charcoal-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-charcoal-900 dark:text-ivory-100">
                  {activePaper.examinationTitle}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-container text-rose-primary">
                  {activePaper.paperSet}
                </span>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Course: {activePaper.courseCode} • {activePaper.courseTitle} • Total: {activePaper.totalMarks} Marks • Duration: {activePaper.durationHours} Hours
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Set A vs Set B Toggle */}
              {generatedResult?.setB && (
                <div className="flex rounded-xl bg-surface-ground p-1 border border-border dark:border-charcoal-700">
                  <button
                    onClick={() => setActiveSet("SET_A")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeSet === "SET_A" ? "bg-rose-primary text-white" : "text-charcoal-600"
                    }`}
                  >
                    Set A
                  </button>
                  <button
                    onClick={() => setActiveSet("SET_B")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeSet === "SET_B" ? "bg-rose-primary text-white" : "text-charcoal-600"
                    }`}
                  >
                    Set B
                  </button>
                </div>
              )}

              <button
                onClick={() => handlePrintPaper(activePaper)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-surface-ground hover:bg-rose-container border border-border dark:border-charcoal-600 transition-all text-charcoal-800 dark:text-ivory-100"
              >
                <Printer className="h-4 w-4 text-rose-primary" />
                <span>Print Official Paper</span>
              </button>
            </div>
          </div>

          {/* Achieved Bloom and Difficulty Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-ground dark:bg-charcoal-900/60 border border-border dark:border-charcoal-700 text-xs">
            <div>
              <span className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Achieved Bloom&apos;s Taxonomy Distribution:
              </span>
              <div className="flex items-center gap-4 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                <span>Remember/Understand: <strong>{activePaper.bloomDistributionAchieved.rememberUnderstandPercent}%</strong></span>
                <span>Apply/Analyze: <strong>{activePaper.bloomDistributionAchieved.applyAnalyzePercent}%</strong></span>
                <span>Evaluate/Create: <strong>{activePaper.bloomDistributionAchieved.evaluateCreatePercent}%</strong></span>
              </div>
            </div>
            <div>
              <span className="font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Achieved Difficulty Profile:
              </span>
              <div className="flex items-center gap-4 text-[11px] text-charcoal-600 dark:text-charcoal-400">
                <span>Easy: <strong>{activePaper.difficultyDistributionAchieved.easyPercent}%</strong></span>
                <span>Medium: <strong>{activePaper.difficultyDistributionAchieved.mediumPercent}%</strong></span>
                <span>Hard: <strong>{activePaper.difficultyDistributionAchieved.hardPercent}%</strong></span>
              </div>
            </div>
          </div>

          {/* Sections and Questions */}
          <div className="space-y-6">
            {activePaper.sections.map((section: any, idx: number) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/60 dark:border-charcoal-700">
                  <div>
                    <h4 className="text-xs font-display font-bold text-charcoal-900 dark:text-ivory-100 uppercase tracking-wider">
                      {section.sectionName}
                    </h4>
                    <p className="text-[11px] text-charcoal-500">{section.instructions}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100">
                    Total: {section.totalMarks} Marks
                  </span>
                </div>

                <div className="space-y-3">
                  {section.questions.map((q: any) => (
                    <div
                      key={q.qNumber}
                      className="p-4 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900/40 flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-rose-primary shrink-0">{q.qNumber}.</span>
                          <span className="text-xs text-charcoal-900 dark:text-ivory-100 font-medium">
                            {q.text}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-container text-rose-primary shrink-0">
                          {q.marks} Marks
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[10px] text-charcoal-500 border-t border-border/40 dark:border-charcoal-800">
                        <span>Course Outcome: <strong>{q.coCode}</strong></span>
                        <span>•</span>
                        <span>Bloom Level: <strong>{q.bloomLevel}</strong></span>
                        <span>•</span>
                        <span>Difficulty: <strong>{q.difficulty}</strong></span>
                        <span>•</span>
                        <span className="truncate max-w-md">Rubric: <em>{q.rubric}</em></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-border dark:border-charcoal-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-charcoal-400">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              Cryptographic Paper Seal: {activePaper.cryptographicPaperSeal}
            </span>
            <span>Generated By: {activePaper.generatedByFaculty}</span>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-charcoal-800 p-12 rounded-2xl border border-border dark:border-charcoal-700 shadow-soft text-center text-xs text-charcoal-500">
          Click &quot;Generate Set A &amp; Set B&quot; to synthesize balanced university examination question papers.
        </div>
      )}

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-border dark:border-charcoal-700 shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4">
            <h3 className="text-base font-display font-bold text-charcoal-900 dark:text-ivory-100">
              Add Question to Institutional Repository
            </h3>
            <form onSubmit={handleAddQuestion} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newQ.courseCode}
                    onChange={(e) => setNewQ({ ...newQ, courseCode: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Unit Number *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={6}
                    value={newQ.unitNumber}
                    onChange={(e) => setNewQ({ ...newQ, unitNumber: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Question Text *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="State problem, scenario, or analytical derivation requirement..."
                  value={newQ.questionText}
                  onChange={(e) => setNewQ({ ...newQ, questionText: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Bloom Level *
                  </label>
                  <select
                    value={newQ.bloomLevel}
                    onChange={(e) => setNewQ({ ...newQ, bloomLevel: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="L1_REMEMBER">L1 Remember</option>
                    <option value="L2_UNDERSTAND">L2 Understand</option>
                    <option value="L3_APPLY">L3 Apply</option>
                    <option value="L4_ANALYZE">L4 Analyze</option>
                    <option value="L5_EVALUATE">L5 Evaluate</option>
                    <option value="L6_CREATE">L6 Create</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Difficulty *
                  </label>
                  <select
                    value={newQ.difficulty}
                    onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    required
                    min={2}
                    max={20}
                    value={newQ.marks}
                    onChange={(e) => setNewQ({ ...newQ, marks: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Model Answer / Evaluation Rubric *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Key points, diagrams, and proof steps required for full marks..."
                  value={newQ.modelAnswerSummary}
                  onChange={(e) => setNewQ({ ...newQ, modelAnswerSummary: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-600 bg-surface-ground dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQ}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-primary hover:bg-rose-deep text-white transition-all shadow-sm"
                >
                  {savingQ ? "Saving..." : "Add to Question Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
