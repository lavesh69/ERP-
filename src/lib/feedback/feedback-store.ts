import fs from "fs";
import path from "path";
import {
  SurveyResponse,
  FacultyPerformanceIndex,
  calculateFacultyPerformanceIndex,
  validateSurveySubmission,
  FeedbackActionReport,
  FeedbackSurveyCycle,
  ActionPlanStatus,
  SurveyCycleStatus,
  validateActionReport,
  validateSurveyCycle,
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
  actionReports: FeedbackActionReport[];
  surveyCycles: FeedbackSurveyCycle[];
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
  {
    id: "fb-exit-01",
    surveyRef: "EXIT-2026-001",
    surveyType: "EXIT_SURVEY_SENIORS",
    courseCode: "BTECH-CSE",
    courseName: "B.Tech Computer Science & Engineering",
    facultyId: "dept-cse",
    facultyName: "Department of Computer Science",
    departmentCode: "CSE",
    semester: 8,
    academicYear: "2025-2026",
    ratingPedagogy: 5,
    ratingSyllabus: 5,
    ratingPunctuality: 4,
    ratingDoubtClearing: 5,
    ratingCourseMaterial: 5,
    overallScore: 4.8,
    qualitativeRemarks: "Outstanding pre-placement training, industry guest lectures, and campus research labs.",
    futureAspirations: "Cloud & Systems Software Engineer at Enterprise",
    isAnonymized: true,
    submittedAt: "2026-09-18T16:00:00.000Z",
  },
  {
    id: "fb-alum-01",
    surveyRef: "ALUM-2026-001",
    surveyType: "ALUMNI_CURRICULUM_SURVEY",
    courseCode: "CURR-CSE",
    courseName: "Curriculum & Industry Relevance Evaluation",
    facultyId: "bos-cse",
    facultyName: "Board of Studies Committee",
    departmentCode: "CSE",
    semester: 8,
    academicYear: "2026-2027",
    ratingPedagogy: 4,
    ratingSyllabus: 5,
    ratingPunctuality: 4,
    ratingDoubtClearing: 4,
    ratingCourseMaterial: 5,
    overallScore: 4.4,
    qualitativeRemarks: "Strong foundational curriculum. Recommend introducing Rust and Kubernetes containers into 3rd year labs.",
    emergingTechRecommended: "Rust, Kubernetes, GenAI Agents, Distributed Database Architecture",
    isAnonymized: true,
    submittedAt: "2026-09-24T12:30:00.000Z",
  },
  {
    id: "fb-infra-01",
    surveyRef: "INFR-2026-001",
    surveyType: "FACILITY_INFRASTRUCTURE",
    courseCode: "CAMPUS-INFRA",
    courseName: "Smart Classrooms & High-Speed WiFi Infrastructure",
    facultyId: "infra-estate",
    facultyName: "Campus Estate & Facilities Directorate",
    departmentCode: "ALL",
    semester: 5,
    academicYear: "2026-2027",
    ratingPedagogy: 4,
    ratingSyllabus: 4,
    ratingPunctuality: 5,
    ratingDoubtClearing: 4,
    ratingCourseMaterial: 4,
    overallScore: 4.2,
    qualitativeRemarks: "Smartboard visual clarity is excellent. Dining mess evening snacks variety could be expanded.",
    facilityCategory: "CLASSROOMS_AND_WIFI",
    isAnonymized: true,
    submittedAt: "2026-10-05T09:45:00.000Z",
  },
];

const DEFAULT_ACTION_REPORTS: FeedbackActionReport[] = [
  {
    id: "atr-01",
    reportRef: "ATR-2026-CSE-01",
    targetType: "FACULTY_PEDAGOGY",
    targetId: "fac-02",
    targetName: "Prof. Arthur Vance",
    departmentCode: "CSE",
    triggerReason: "Mid-Term SET identified student friction in Doubt Clearing responsiveness (3.8/5.0).",
    correctiveAction: "HOD conducted peer teaching review; scheduled 2 weekly dedicated problem-solving tutorial hours and assigned Teaching Assistant.",
    assignedAuthority: "Dr. Sarah Jenkins (HOD Computer Science)",
    deadlineDate: "2026-11-15",
    status: "IMPLEMENTED",
    iqacVerificationDate: "2026-10-25",
    iqacRemarks: "Verified by Dean Academics. Tutorial attendance tracking active; student satisfaction improved.",
    createdAt: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "atr-02",
    reportRef: "ATR-2026-LAB-02",
    targetType: "CAMPUS_FACILITY",
    targetId: "INFRA-CLOUD-LAB",
    targetName: "Advanced Cloud & Distributed Computing Laboratory",
    departmentCode: "CSE",
    triggerReason: "Student feedback indicated insufficient GPU memory allocations for deep learning practical exercises.",
    correctiveAction: "Provisioned 16 additional NVIDIA RTX workstations and campus private cloud compute quota for semester projects.",
    assignedAuthority: "Chief IT Systems Administrator & Estate Committee",
    deadlineDate: "2026-12-01",
    status: "ACTION_PLANNED",
    createdAt: "2026-10-18T14:30:00.000Z",
  },
  {
    id: "atr-03",
    reportRef: "ATR-2026-CURR-03",
    targetType: "COURSE_CURRICULUM",
    targetId: "CS204",
    targetName: "Algorithms & Complexity Theory (CS204)",
    departmentCode: "CSE",
    triggerReason: "Alumni curriculum survey recommended integrating modern competitive coding platforms and Rust memory semantics.",
    correctiveAction: "Board of Studies (BoS) agenda item added to introduce Rust and LeetCode-style problem sets into Lab Manual.",
    assignedAuthority: "Board of Studies Curriculum Committee",
    deadlineDate: "2026-11-30",
    status: "PENDING_REVIEW",
    createdAt: "2026-10-22T11:15:00.000Z",
  },
];

const DEFAULT_SURVEY_CYCLES: FeedbackSurveyCycle[] = [
  {
    id: "cycle-01",
    cycleCode: "SET-FALL2026-MID",
    title: "Mid-Semester Student Evaluation of Teaching (SET)",
    surveyType: "COURSE_FACULTY_EVALUATION",
    academicYear: "2026-2027",
    semesterTerm: "Fall 2026 (Sem V)",
    startDate: "2026-09-15",
    endDate: "2026-10-31",
    targetDepartment: "ALL",
    targetAudience: "ALL_ENROLLED_STUDENTS",
    isMandatory: true,
    eligibleCount: 1420,
    completedCount: 1198,
    status: "ACTIVE",
  },
  {
    id: "cycle-02",
    cycleCode: "EXIT-2026-FINAL",
    title: "Graduating Senior Comprehensive Exit Survey",
    surveyType: "EXIT_SURVEY_SENIORS",
    academicYear: "2025-2026",
    semesterTerm: "Spring 2026 (Sem VIII)",
    startDate: "2026-04-01",
    endDate: "2026-05-30",
    targetDepartment: "ALL",
    targetAudience: "GRADUATING_FINAL_YEAR",
    isMandatory: true,
    eligibleCount: 680,
    completedCount: 654,
    status: "COMPLETED",
  },
  {
    id: "cycle-03",
    cycleCode: "ALUMNI-NEP-2026",
    title: "Annual Alumni Curriculum Relevance & Syllabus Revision Survey",
    surveyType: "ALUMNI_CURRICULUM_SURVEY",
    academicYear: "2026-2027",
    semesterTerm: "Annual 2026",
    startDate: "2026-08-01",
    endDate: "2026-11-30",
    targetDepartment: "ALL",
    targetAudience: "ALUMNI_COMMUNITY",
    isMandatory: false,
    eligibleCount: 3200,
    completedCount: 940,
    status: "ACTIVE",
  },
  {
    id: "cycle-04",
    cycleCode: "INFRA-Q3-2026",
    title: "Campus Facilities, Dining, WiFi & Residential Infrastructure Survey",
    surveyType: "FACILITY_INFRASTRUCTURE",
    academicYear: "2026-2027",
    semesterTerm: "Quarter 3 2026",
    startDate: "2026-07-01",
    endDate: "2026-12-15",
    targetDepartment: "ALL",
    targetAudience: "ALL_CAMPUS_RESIDENTS",
    isMandatory: false,
    eligibleCount: 2100,
    completedCount: 1450,
    status: "ACTIVE",
  },
];

function readStore(): FeedbackStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: FeedbackStoreSchema = {
      responses: JSON.parse(JSON.stringify(DEFAULT_RESPONSES)),
      actionReports: JSON.parse(JSON.stringify(DEFAULT_ACTION_REPORTS)),
      surveyCycles: JSON.parse(JSON.stringify(DEFAULT_SURVEY_CYCLES)),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.responses) parsed.responses = JSON.parse(JSON.stringify(DEFAULT_RESPONSES));
    if (!parsed.actionReports) parsed.actionReports = JSON.parse(JSON.stringify(DEFAULT_ACTION_REPORTS));
    if (!parsed.surveyCycles) parsed.surveyCycles = JSON.parse(JSON.stringify(DEFAULT_SURVEY_CYCLES));
    return parsed;
  } catch (err) {
    console.error("[FeedbackStore Read Error]:", err);
    return {
      responses: JSON.parse(JSON.stringify(DEFAULT_RESPONSES)),
      actionReports: JSON.parse(JSON.stringify(DEFAULT_ACTION_REPORTS)),
      surveyCycles: JSON.parse(JSON.stringify(DEFAULT_SURVEY_CYCLES)),
    };
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
    const actionReports = store.actionReports || [];
    const surveyCycles = store.surveyCycles || [];

    return {
      totalResponses,
      averageSatisfactionRating: avgOverallScore,
      facultyEvaluatedCount: facultyIndices.length,
      topRatedFacultyCount: facultyIndices.filter((f) => f.performanceBand === "EXCELLENT" || f.performanceBand === "VERY_GOOD").length,
      actionReportsTotal: actionReports.length,
      actionReportsImplemented: actionReports.filter((a) => a.status === "IMPLEMENTED" || a.status === "VERIFIED_BY_IQAC").length,
      activeSurveyCycles: surveyCycles.filter((c) => c.status === "ACTIVE").length,
    };
  },

  getResponses(facultyId?: string, courseCode?: string, scrubStudentId: boolean = true) {
    const store = readStore();
    return store.responses
      .filter((r) => {
        if (facultyId && r.facultyId !== facultyId) return false;
        if (courseCode && r.courseCode !== courseCode) return false;
        return true;
      })
      .map((r) => {
        if (scrubStudentId) {
          const { studentId, studentHash, ...rest } = r;
          return rest as SurveyResponse;
        }
        return r;
      });
  },

  getMultiStakeholderSurveys(surveyType?: string) {
    const store = readStore();
    return store.responses.filter((r) => {
      if (surveyType && surveyType !== "ALL") {
        return r.surveyType === surveyType;
      }
      return r.surveyType !== "COURSE_FACULTY_EVALUATION";
    });
  },

  getAllFacultyIndices(): FacultyPerformanceIndex[] {
    const store = readStore();
    const facultyMap = new Map<string, { facultyName: string; departmentCode: string }>();

    for (const r of store.responses) {
      if (r.surveyType === "COURSE_FACULTY_EVALUATION" && r.facultyId) {
        if (!facultyMap.has(r.facultyId)) {
          facultyMap.set(r.facultyId, { facultyName: r.facultyName, departmentCode: r.departmentCode });
        }
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

  getActionReports(status?: string, departmentCode?: string): FeedbackActionReport[] {
    const store = readStore();
    const reports = store.actionReports || [];
    return reports.filter((r) => {
      if (status && status !== "ALL" && r.status !== status) return false;
      if (departmentCode && departmentCode !== "ALL" && r.departmentCode !== departmentCode) return false;
      return true;
    });
  },

  createActionReport(payload: Partial<FeedbackActionReport>): FeedbackActionReport {
    const validation = validateActionReport(payload);
    if (!validation.isValid) {
      throw new Error(`Action Report Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.actionReports) store.actionReports = [];

    const newReport: FeedbackActionReport = {
      id: `atr-${Date.now()}`,
      reportRef: `ATR-2026-${(payload.departmentCode || "GEN").toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`,
      targetType: payload.targetType || "FACULTY_PEDAGOGY",
      targetId: payload.targetId || "TARGET-01",
      targetName: payload.targetName!,
      departmentCode: payload.departmentCode || "CSE",
      triggerReason: payload.triggerReason!,
      correctiveAction: payload.correctiveAction!,
      assignedAuthority: payload.assignedAuthority!,
      deadlineDate: payload.deadlineDate!,
      status: payload.status || "ACTION_PLANNED",
      createdAt: new Date().toISOString(),
    };

    store.actionReports.unshift(newReport);
    writeStore(store);
    return newReport;
  },

  updateActionReport(id: string, status: ActionPlanStatus, iqacRemarks?: string): FeedbackActionReport {
    const store = readStore();
    if (!store.actionReports) store.actionReports = [];

    const index = store.actionReports.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Action Report not found with ID ${id}`);
    }

    store.actionReports[index].status = status;
    if (status === "VERIFIED_BY_IQAC") {
      store.actionReports[index].iqacVerificationDate = new Date().toISOString();
      if (iqacRemarks) store.actionReports[index].iqacRemarks = iqacRemarks;
    }

    writeStore(store);
    return store.actionReports[index];
  },

  getSurveyCycles(status?: string): FeedbackSurveyCycle[] {
    const store = readStore();
    const cycles = store.surveyCycles || [];
    return cycles.filter((c) => {
      if (status && status !== "ALL" && c.status !== status) return false;
      return true;
    });
  },

  createSurveyCycle(payload: Partial<FeedbackSurveyCycle>): FeedbackSurveyCycle {
    const validation = validateSurveyCycle(payload);
    if (!validation.isValid) {
      throw new Error(`Survey Cycle Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    if (!store.surveyCycles) store.surveyCycles = [];

    const newCycle: FeedbackSurveyCycle = {
      id: `cycle-${Date.now()}`,
      cycleCode: payload.cycleCode || `SET-CYC-${Date.now().toString().slice(-4)}`,
      title: payload.title!,
      surveyType: payload.surveyType || "COURSE_FACULTY_EVALUATION",
      academicYear: payload.academicYear || "2026-2027",
      semesterTerm: payload.semesterTerm || "Active Term",
      startDate: payload.startDate!,
      endDate: payload.endDate!,
      targetDepartment: payload.targetDepartment || "ALL",
      targetAudience: payload.targetAudience || "ALL_ENROLLED_STUDENTS",
      isMandatory: payload.isMandatory ?? true,
      eligibleCount: payload.eligibleCount || 1000,
      completedCount: 0,
      status: payload.status || "ACTIVE",
    };

    store.surveyCycles.unshift(newCycle);
    writeStore(store);
    return newCycle;
  },

  updateSurveyCycle(id: string, status: SurveyCycleStatus): FeedbackSurveyCycle {
    const store = readStore();
    if (!store.surveyCycles) store.surveyCycles = [];

    const index = store.surveyCycles.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Survey Cycle not found with ID ${id}`);
    }

    store.surveyCycles[index].status = status;
    writeStore(store);
    return store.surveyCycles[index];
  },

  resetStore() {
    writeStore({
      responses: JSON.parse(JSON.stringify(DEFAULT_RESPONSES)),
      actionReports: JSON.parse(JSON.stringify(DEFAULT_ACTION_REPORTS)),
      surveyCycles: JSON.parse(JSON.stringify(DEFAULT_SURVEY_CYCLES)),
    });
  },

  submitSurvey(payload: Partial<SurveyResponse>): SurveyResponse {
    const validation = validateSurveySubmission(payload);
    if (!validation.isValid) {
      throw new Error(`Survey Submission Error: ${validation.errors.join("; ")}`);
    }

    const store = readStore();
    const sem = payload.semester || 5;
    const studentIdentifier = payload.studentId || payload.studentHash;

    if (studentIdentifier) {
      const existing = store.responses.find(
        (r) =>
          (r.studentId === studentIdentifier || r.studentHash === studentIdentifier) &&
          r.courseCode.toLowerCase() === (payload.courseCode || "").toLowerCase() &&
          r.semester === sem
      );
      if (existing) {
        throw new Error(
          `Duplicate submission detected: You have already submitted an evaluation for course ${payload.courseCode} in Semester ${sem}.`
        );
      }
    }

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

    let prefix = "SET";
    if (payload.surveyType === "EXIT_SURVEY_SENIORS") prefix = "EXIT";
    else if (payload.surveyType === "ALUMNI_CURRICULUM_SURVEY") prefix = "ALUM";
    else if (payload.surveyType === "FACILITY_INFRASTRUCTURE") prefix = "INFR";

    const newResponse: SurveyResponse = {
      id: `fb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      surveyRef: `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`,
      surveyType: payload.surveyType || "COURSE_FACULTY_EVALUATION",
      courseCode: payload.courseCode!,
      courseName: payload.courseName || "Institutional Course",
      facultyId: payload.facultyId!,
      facultyName: payload.facultyName || "Faculty Instructor",
      departmentCode: payload.departmentCode || "CSE",
      semester: sem,
      academicYear: payload.academicYear || "2025-2026",
      ratingPedagogy: payload.ratingPedagogy!,
      ratingSyllabus: payload.ratingSyllabus!,
      ratingPunctuality: payload.ratingPunctuality!,
      ratingDoubtClearing: payload.ratingDoubtClearing!,
      ratingCourseMaterial: payload.ratingCourseMaterial!,
      overallScore,
      qualitativeRemarks: payload.qualitativeRemarks,
      isAnonymized: true,
      studentId: payload.studentId,
      studentHash: payload.studentHash,
      submittedAt: new Date().toISOString(),
      stakeholderType: payload.stakeholderType,
      facilityCategory: payload.facilityCategory,
      emergingTechRecommended: payload.emergingTechRecommended,
      futureAspirations: payload.futureAspirations,
    };

    store.responses.unshift(newResponse);

    // Update survey cycle count if applicable
    if (store.surveyCycles) {
      const activeCycle = store.surveyCycles.find(
        (c) => c.status === "ACTIVE" && c.surveyType === newResponse.surveyType
      );
      if (activeCycle) {
        activeCycle.completedCount += 1;
      }
    }

    writeStore(store);
    return newResponse;
  },
};
