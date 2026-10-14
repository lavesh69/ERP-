import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/admin-guard";
import {
  generateAutonomousQuestionPaper,
  DEFAULT_QUESTION_BANK,
  ExamQuestionTemplate,
  GeneratedQuestionPaper,
} from "@/lib/faculty/exam-paper-generator-engine";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "faculty");
const PAPERS_FILE = path.join(DATA_DIR, "generated_question_papers.json");
const BANK_FILE = path.join(DATA_DIR, "question_bank.json");

function ensureFacultyStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PAPERS_FILE)) {
    fs.writeFileSync(PAPERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
  if (!fs.existsSync(BANK_FILE)) {
    fs.writeFileSync(BANK_FILE, JSON.stringify(DEFAULT_QUESTION_BANK, null, 2), "utf-8");
  }
}

function loadGeneratedPapers(): GeneratedQuestionPaper[] {
  ensureFacultyStorage();
  try {
    const raw = fs.readFileSync(PAPERS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveGeneratedPaper(paper: GeneratedQuestionPaper): void {
  const current = loadGeneratedPapers();
  current.unshift(paper);
  // Keep last 100 generated papers
  fs.writeFileSync(PAPERS_FILE, JSON.stringify(current.slice(0, 100), null, 2), "utf-8");
}

function loadCustomQuestionBank(): ExamQuestionTemplate[] {
  ensureFacultyStorage();
  try {
    const raw = fs.readFileSync(BANK_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_QUESTION_BANK;
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseCode = searchParams.get("courseCode");
    const mode = searchParams.get("mode"); // "bank", "history", or "stats"

    const bank = loadCustomQuestionBank();
    const history = loadGeneratedPapers();

    if (mode === "history") {
      const filtered = courseCode ? history.filter((p) => p.courseCode === courseCode) : history;
      return NextResponse.json({
        success: true,
        total: filtered.length,
        papers: filtered,
      });
    }

    // Default: Return stats and bank summary
    const bloomBreakdown: Record<string, number> = {};
    const difficultyBreakdown: Record<string, number> = {};
    const courses = Array.from(new Set(bank.map((q) => q.courseCode)));

    for (const q of bank) {
      bloomBreakdown[q.bloomLevel] = (bloomBreakdown[q.bloomLevel] || 0) + 1;
      difficultyBreakdown[q.difficulty] = (difficultyBreakdown[q.difficulty] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestionsInBank: bank.length,
        supportedCourses: courses,
        bloomBreakdown,
        difficultyBreakdown,
        totalPapersGenerated: history.length,
      },
      availableCourses: courses,
      recentPapers: history.slice(0, 5),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getOptionalSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    const bank = loadCustomQuestionBank();

    if (action === "ADD_QUESTION") {
      const {
        courseCode,
        unitNumber,
        questionText,
        bloomLevel,
        difficulty,
        marks,
        coMapping,
        modelAnswerSummary,
      } = body;

      if (!courseCode || !questionText || !bloomLevel || !difficulty || !marks) {
        return NextResponse.json(
          { error: "Missing required fields for question addition" },
          { status: 400 }
        );
      }

      const newQ: ExamQuestionTemplate = {
        id: `q-custom-${Date.now()}`,
        courseCode,
        unitNumber: Number(unitNumber) || 1,
        questionText,
        bloomLevel,
        difficulty,
        marks: Number(marks),
        coMapping: coMapping || "CO1",
        modelAnswerSummary: modelAnswerSummary || "Standard descriptive answer.",
      };

      bank.push(newQ);
      fs.writeFileSync(BANK_FILE, JSON.stringify(bank, null, 2), "utf-8");

      return NextResponse.json({
        success: true,
        message: "Question successfully registered in institutional examination bank",
        question: newQ,
      });
    }

    if (action === "GENERATE_PAPER" || !action) {
      const {
        courseCode = "CS-402",
        courseTitle = "Advanced Distributed Systems & Cloud Architecture",
        departmentCode = "CSE",
        examinationTitle = "Summative End-Semester Examination 2026",
        totalMarks = 100,
        durationHours = 3,
        facultyName = session.user?.name || "Dr. Rajesh K. Sharma, Professor & HoD",
        generateParallelSets = true,
      } = body;

      const setA = generateAutonomousQuestionPaper({
        courseCode,
        courseTitle,
        departmentCode,
        examinationTitle,
        paperSet: "SET_A",
        totalMarks,
        durationHours,
        facultyName,
        customQuestionBank: bank,
      });

      saveGeneratedPaper(setA);

      let setB: GeneratedQuestionPaper | null = null;
      if (generateParallelSets) {
        setB = generateAutonomousQuestionPaper({
          courseCode,
          courseTitle,
          departmentCode,
          examinationTitle,
          paperSet: "SET_B",
          totalMarks,
          durationHours,
          facultyName,
          customQuestionBank: bank,
        });
        saveGeneratedPaper(setB);
      }

      return NextResponse.json({
        success: true,
        message: "University examination papers successfully generated and sealed",
        setA,
        setB,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
