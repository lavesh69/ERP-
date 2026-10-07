import fs from "fs";
import path from "path";
import {
  SurveyResponse,
  FacultyPerformanceIndex,
  calculateFacultyPerformanceIndex,
  validateSurveySubmission,
} from "./feedback-engine";

const DATA_DIR = path.join(process.cwd(), "data", "feedback");
const STORE_FILE = path.join(DATA_DIR, "feedback_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface FeedbackStoreSchema {
  responses: SurveyResponse[];
}

const DEFAULT_RESPONSES: SurveyResponse[] = [
  {
    id: "fb-01",
    surveyRef: "SET-2026-101",
    surveyType: "COURSE_FACULTY_EVALUATION",
    courseCode: "CS301",
    courseName: "Distributed Systems & Cloud Computing",
    facultyId: "fac-01",
    facultyName: "Dr. Sarah Jenkins",
    departmentCode: "CSE",
    semester: 5,
    academicYear: "2025-2026",
    ratingPedagogy: 5,
    ratingSyllabus: 5,
    ratingPunctuality: 5,
    ratingDoubtClearing: 4,
    ratingCourseMaterial: 5,
    overallScore: 4.8,
    qualitativeRemarks: "Superb coverage of Raft consensus and practical labs on Kubernetes.",
    isAnonymized: true,
    submittedAt: "2026-10-01T10:15:00.000Z",
  },
  {
    id: "fb-02",
    surveyRef: "SET-2026-102",
    surveyType: "COURSE_FACULTY_EVALUATION",
    courseCode: "CS301",
    courseName: "Distributed Systems & Cloud Computing",
    facultyId: "fac-01",
    facultyName: "Dr. Sarah Jenkins",
    departmentCode: "CSE",
    semester: 5,
    academicYear: "2025-2026",
    ratingPedagogy: 4,
    ratingSyllabus: 4,
    ratingPunctuality: 5,
    ratingDoubtClearing: 5,
    ratingCourseMaterial: 4,
    overallScore: 4.4,
    qualitativeRemarks: "Very helpful doubt clearing during office hours.",
    isAnonymized: true,
    submittedAt: "2026-10-02T14:20:00.000Z",
  },
  {
    id: "fb-03",
    surveyRef: "SET-2026-103",
    surveyType: "COURSE_FACULTY_EVALUATION",
    courseCode: "CS204",
    courseName: "Algorithms & Complexity Theory",
    facultyId: "fac-02",
    facultyName: "Prof. Arthur Vance",
    departmentCode: "CSE",
    semester: 3,
    academicYear: "2025-2026",
    ratingPedagogy: 4,
    ratingSyllabus: 4,
    ratingPunctuality: 4,
    ratingDoubtClearing: 4,
    ratingCourseMaterial: 5,
    overallScore: 4.2,
    qualitativeRemarks: "Dynamic programming assignments were challenging and insightful.",
    isAnonymized: true,
    submittedAt: "2026-10-03T11:00:00.000Z",
  },
];

function readStore(): FeedbackStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: FeedbackStoreSchema = { responses: DEFAULT_RESPONSES };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("[FeedbackStore Read Error]:", err);
    return { responses: DEFAULT_RESPONSES };
  }
}

function writeStore(data: FeedbackStoreSchema) {
  ensureDirectory();
  fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export const feedbackStore = {
  getSummary() {
    const store = readStore();
    const totalResponses = store.responses.length;
    const avgOverallScore =
      totalResponses > 0
        ? Math.round(
            (store.responses.reduce((sum, r) => sum + r.overallScore, 0) / totalResponses) * 100
          ) / 100
        : 0;

    const facultyIndices = this.getAllFacultyIndices();

    return {
      totalResponses,
      averageSatisfactionRating: avgOverallScore,
      facultyEvaluatedCount: facultyIndices.length,
      topRatedFacultyCount: facultyIndices.filter((f) => f.performanceBand === "EXCELLENT" || f.performanceBand === "VERY_GOOD").length,
    };
  },

  getResponses(facultyId?: string, courseCode?: string) {
    const store = readStore();
    return store.responses.filter((r) => {
      if (facultyId && r.facultyId !== facultyId) return false;
      if (courseCode && r.courseCode !== courseCode) return false;
      return true;
    });
  },

  getAllFacultyIndices(): FacultyPerformanceIndex[] {
    const store = readStore();
    const facultyMap = new Map<string, { facultyName: string; departmentCode: string }>();

    for (const r of store.responses) {
      if (!facultyMap.has(r.facultyId)) {
        facultyMap.set(r.facultyId, { facultyName: r.facultyName, departmentCode: r.departmentCode });
      }
    }

    const indices: FacultyPerformanceIndex[] = [];
    facultyMap.forEach(({ facultyName, departmentCode }, facultyId) => {
      indices.push(
        calculateFacultyPerformanceIndex(store.responses, facultyId, facultyName, departmentCode)
      );
    });

    return indices.sort((a, b) => b.overallFPI - a.overallFPI);
  },

  submitSurvey(payload: Partial<SurveyResponse>): SurveyResponse {
    const validation = validateSurveySubmission(payload);
    if (!validation.isValid) {
      throw new Error(`Survey Submission Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const overallScore =
      Math.round(
        ((payload.ratingPedagogy! +
          payload.ratingSyllabus! +
          payload.ratingPunctuality! +
          payload.ratingDoubtClearing! +
          payload.ratingCourseMaterial!) /
          5) *
          100
      ) / 100;

    const newResponse: SurveyResponse = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      surveyRef: `SET-2026-${Math.floor(100 + Math.random() * 900)}`,
      surveyType: payload.surveyType || "COURSE_FACULTY_EVALUATION",
      courseCode: payload.courseCode!,
      courseName: payload.courseName || "Institutional Course",
      facultyId: payload.facultyId!,
      facultyName: payload.facultyName || "Faculty Instructor",
      departmentCode: payload.departmentCode || "CSE",
      semester: payload.semester || 5,
      academicYear: payload.academicYear || "2025-2026",
      ratingPedagogy: payload.ratingPedagogy!,
      ratingSyllabus: payload.ratingSyllabus!,
      ratingPunctuality: payload.ratingPunctuality!,
      ratingDoubtClearing: payload.ratingDoubtClearing!,
      ratingCourseMaterial: payload.ratingCourseMaterial!,
      overallScore,
      qualitativeRemarks: payload.qualitativeRemarks,
      isAnonymized: true,
      submittedAt: new Date().toISOString(),
    };

    store.responses.unshift(newResponse);
    writeStore(store);
    return newResponse;
  },
};
