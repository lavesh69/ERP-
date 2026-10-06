import fs from "fs";
import path from "path";
import {
  AccreditationCriterion,
  InstitutionalMetrics,
  calculateFacultyStudentRatio,
  calculateCadreRatio,
  generateAQARDossier,
} from "./accreditation-engine";

const DATA_DIR = path.join(process.cwd(), "data", "accreditation");
const STORE_FILE = path.join(DATA_DIR, "accreditation_data.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

interface AccreditationStoreSchema {
  metrics: InstitutionalMetrics;
  criteria: AccreditationCriterion[];
}

const DEFAULT_METRICS: InstitutionalMetrics = {
  totalStudents: 1250,
  totalFaculty: 84,
  professorsCount: 12,
  associateProfessorsCount: 24,
  assistantProfessorsCount: 48,
  phdQualifiedPercentage: 78.5,
  placementRatePercentage: 94.2,
  studentSatisfactionSurveyRating: 3.86,
};

const DEFAULT_CRITERIA: AccreditationCriterion[] = [
  {
    criterionNumber: 1,
    name: "Curricular Aspects",
    weightage: 150,
    scoreAchieved: 142,
    gradeEquivalent: "A++",
    keyIndicators: [
      { indicator: "Outcome-Based Curriculum (OBE)", target: "100% courses mapped", achieved: "100%", isCompliant: true },
      { indicator: "Academic Flexibility (CBCS / Electives)", target: ">= 40% electives", achieved: "48%", isCompliant: true },
      { indicator: "Structured Stakeholder Feedback", target: "Annual 360 review", achieved: "Implemented", isCompliant: true },
    ],
  },
  {
    criterionNumber: 2,
    name: "Teaching-Learning and Evaluation",
    weightage: 200,
    scoreAchieved: 188,
    gradeEquivalent: "A++",
    keyIndicators: [
      { indicator: "Faculty-to-Student Ratio (FSR)", target: "<= 1:15", achieved: "1:14.9", isCompliant: true },
      { indicator: "Full-time Ph.D. Faculty", target: ">= 70%", achieved: "78.5%", isCompliant: true },
      { indicator: "Continuous Internal Assessment (CIA)", target: "Rubric-based", achieved: "100% automated", isCompliant: true },
    ],
  },
  {
    criterionNumber: 3,
    name: "Research, Innovations and Extension",
    weightage: 150,
    scoreAchieved: 136,
    gradeEquivalent: "A+",
    keyIndicators: [
      { indicator: "Extramural Sponsored Research Grants", target: ">= $500k/yr", achieved: "$720k", isCompliant: true },
      { indicator: "Patents Published & Conferred", target: ">= 5/yr", achieved: "8 patents", isCompliant: true },
      { indicator: "Community Outreach / NSS-Rotaract", target: ">= 10 programs", achieved: "14 programs", isCompliant: true },
    ],
  },
  {
    criterionNumber: 4,
    name: "Infrastructure and Learning Resources",
    weightage: 100,
    scoreAchieved: 95,
    gradeEquivalent: "A++",
    keyIndicators: [
      { indicator: "ICT-Enabled Smart Classrooms", target: ">= 80%", achieved: "92%", isCompliant: true },
      { indicator: "Digital Library Repositories", target: "24/7 Access", achieved: "IEEE, ACM, Elsevier", isCompliant: true },
      { indicator: "Bandwidth per Student", target: ">= 50 Mbps", achieved: "1 Gbps dedicated", isCompliant: true },
    ],
  },
  {
    criterionNumber: 5,
    name: "Student Support and Progression",
    weightage: 100,
    scoreAchieved: 94,
    gradeEquivalent: "A++",
    keyIndicators: [
      { indicator: "Institutional & Govt Scholarships", target: ">= 20% students", achieved: "28%", isCompliant: true },
      { indicator: "Campus Placement Conversion", target: ">= 85%", achieved: "94.2%", isCompliant: true },
      { indicator: "Grievance & POSH Resolution SLA", target: "<= 7 days", achieved: "4.2 days avg", isCompliant: true },
    ],
  },
  {
    criterionNumber: 6,
    name: "Governance, Leadership and Management",
    weightage: 100,
    scoreAchieved: 92,
    gradeEquivalent: "A+",
    keyIndicators: [
      { indicator: "Comprehensive E-Governance / ERP", target: "Full campus lifecycle", achieved: "Classroom ERP V2", isCompliant: true },
      { indicator: "Financial Audits & BRS Reconciliation", target: "Clean external audit", achieved: "Clean Unqualified", isCompliant: true },
      { indicator: "Faculty Development Programs (FDP)", target: ">= 2/year/faculty", achieved: "3.1 average", isCompliant: true },
    ],
  },
  {
    criterionNumber: 7,
    name: "Institutional Values and Best Practices",
    weightage: 100,
    scoreAchieved: 96,
    gradeEquivalent: "A++",
    keyIndicators: [
      { indicator: "Green Campus & Solar Power Offset", target: ">= 30% renewable", achieved: "42% solar", isCompliant: true },
      { indicator: "Barrier-Free Disabled Friendly Campus", target: "100% accessible", achieved: "Ramps & Lifts 100%", isCompliant: true },
      { indicator: "Code of Conduct & Ethics Charter", target: "Published & Audited", achieved: "Certified", isCompliant: true },
    ],
  },
];

function readStore(): AccreditationStoreSchema {
  ensureDirectory();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: AccreditationStoreSchema = {
      metrics: DEFAULT_METRICS,
      criteria: DEFAULT_CRITERIA,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading accreditation store, using defaults", err);
    return {
      metrics: DEFAULT_METRICS,
      criteria: DEFAULT_CRITERIA,
    };
  }
}

export const accreditationStore = {
  getSummary() {
    const store = readStore();
    const fsr = calculateFacultyStudentRatio(store.metrics.totalStudents, store.metrics.totalFaculty);
    const cadre = calculateCadreRatio(
      store.metrics.professorsCount,
      store.metrics.associateProfessorsCount,
      store.metrics.assistantProfessorsCount
    );
    const dossier = generateAQARDossier(store.criteria);

    return {
      metrics: store.metrics,
      fsr,
      cadre,
      dossier,
      criteriaCount: store.criteria.length,
    };
  },

  getCriteria() {
    return readStore().criteria;
  },

  generateOfficialDossier() {
    const store = readStore();
    return generateAQARDossier(store.criteria);
  },
};
