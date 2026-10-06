/**
 * Persistent Store for Course Outcomes & CO-PO Articulation Matrices
 */

import fs from "fs";
import path from "path";
import {
  COPOArticulation,
  computeCOAttainment,
  computePOAttainmentMatrix,
  generateNbaSarCriterion3,
  STANDARD_PROGRAM_OUTCOMES,
} from "./obe-engine";

const DATA_DIR = path.join(process.cwd(), "data", "curriculum");
const STORE_FILE = path.join(DATA_DIR, "co_po_matrices.json");

function ensureDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const DEFAULT_MATRICES: Record<string, COPOArticulation> = {
  "CS-402": {
    courseCode: "CS-402",
    courseTitle: "Distributed Systems & Neural Transformer Architectures",
    departmentCode: "CSE",
    academicYear: "2025-2026",
    semester: 4,
    credits: 4,
    directWeight: 0.8,
    indirectWeight: 0.2,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "Dr. Sarah Chen (Associate Professor)",
    outcomes: [
      {
        code: "CO1",
        title: "Mathematical Foundations & Gradient Formulations",
        description: "Formulate high-dimensional matrix gradients and vector spaces for distributed optimization.",
        bloomLevel: "K3",
        bloomDescription: "Apply",
        targetPercent: 65,
        directAttainment: 2.8,
        indirectAttainment: 2.6,
        overallAttainment: 2.76,
      },
      {
        code: "CO2",
        title: "Modular Attention Mechanisms & Sequence Modeling",
        description: "Implement modular multi-head self-attention mechanisms with numerical precision and stability.",
        bloomLevel: "K4",
        bloomDescription: "Analyze",
        targetPercent: 60,
        directAttainment: 2.6,
        indirectAttainment: 2.5,
        overallAttainment: 2.58,
      },
      {
        code: "CO3",
        title: "Distributed Parallelism & Sharding Protocols",
        description: "Design data-parallel and pipeline-parallel sharding across multi-node GPU clusters.",
        bloomLevel: "K5",
        bloomDescription: "Evaluate",
        targetPercent: 60,
        directAttainment: 2.7,
        indirectAttainment: 2.8,
        overallAttainment: 2.72,
      },
      {
        code: "CO4",
        title: "Fault-Tolerant Consensus & Ledger Sync",
        description: "Analyze consensus protocols (Raft, Paxos) and verify state replication under partial network partitions.",
        bloomLevel: "K4",
        bloomDescription: "Analyze",
        targetPercent: 65,
        directAttainment: 2.5,
        indirectAttainment: 2.4,
        overallAttainment: 2.48,
      },
      {
        code: "CO5",
        title: "Autonomous Agentic Pipelines & RAG Systems",
        description: "Deploy grounded autonomous agent architectures with strict provenance checks and guardrails.",
        bloomLevel: "K6",
        bloomDescription: "Create",
        targetPercent: 55,
        directAttainment: 2.9,
        indirectAttainment: 2.7,
        overallAttainment: 2.86,
      },
      {
        code: "CO6",
        title: "Ethical AI Safety, Model Watermarking & Observability",
        description: "Formulate cryptographic auditing, prompt injection filters, and ethical compliance frameworks for deployed neural models.",
        bloomLevel: "K5",
        bloomDescription: "Evaluate",
        targetPercent: 70,
        directAttainment: 2.7,
        indirectAttainment: 2.5,
        overallAttainment: 2.66,
      },
    ],
    mappingMatrix: {
      CO1: { PO1: 3, PO2: 3, PO3: 2, PO4: 2, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 3 },
      CO2: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 2, PO10: 1, PO11: 1, PO12: 2, PSO1: 3, PSO2: 3 },
      CO3: { PO1: 3, PO2: 3, PO3: 3, PO4: 3, PO5: 3, PO6: 1, PO7: 1, PO8: 0, PO9: 2, PO10: 2, PO11: 2, PO12: 3, PSO1: 3, PSO2: 2 },
      CO4: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 1, PO7: 0, PO8: 1, PO9: 2, PO10: 2, PO11: 2, PO12: 2, PSO1: 3, PSO2: 1 },
      CO5: { PO1: 3, PO2: 3, PO3: 3, PO4: 3, PO5: 3, PO6: 2, PO7: 1, PO8: 2, PO9: 3, PO10: 3, PO11: 2, PO12: 3, PSO1: 3, PSO2: 3 },
      CO6: { PO1: 2, PO2: 2, PO3: 2, PO4: 2, PO5: 2, PO6: 3, PO7: 2, PO8: 3, PO9: 2, PO10: 2, PO11: 1, PO12: 3, PSO1: 2, PSO2: 3 },
    },
  },

  "CS-301": {
    courseCode: "CS-301",
    courseTitle: "Relational Database Management & Query Optimization",
    departmentCode: "CSE",
    academicYear: "2025-2026",
    semester: 3,
    credits: 4,
    directWeight: 0.8,
    indirectWeight: 0.2,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "Dr. Vikram Sarin (Professor)",
    outcomes: [
      {
        code: "CO1",
        title: "Entity-Relationship & Relational Modeling",
        description: "Translate real-world business constraints into normalized ER schemas and relational structures.",
        bloomLevel: "K3",
        bloomDescription: "Apply",
        targetPercent: 70,
        directAttainment: 2.7,
        indirectAttainment: 2.5,
        overallAttainment: 2.66,
      },
      {
        code: "CO2",
        title: "Relational Algebra & Advanced SQL Querying",
        description: "Formulate complex declarative SQL queries, subqueries, and relational algebra expressions.",
        bloomLevel: "K3",
        bloomDescription: "Apply",
        targetPercent: 65,
        directAttainment: 2.8,
        indirectAttainment: 2.6,
        overallAttainment: 2.76,
      },
      {
        code: "CO3",
        title: "Schema Normalization & Anomaly Elimination",
        description: "Apply functional dependencies and multi-valued dependencies to normalize schemas to 3NF and BCNF.",
        bloomLevel: "K4",
        bloomDescription: "Analyze",
        targetPercent: 60,
        directAttainment: 2.4,
        indirectAttainment: 2.3,
        overallAttainment: 2.38,
      },
      {
        code: "CO4",
        title: "Transaction Concurrency & ACID Recovery",
        description: "Examine two-phase locking protocols, WAL logs, and serializability graphs for transaction safety.",
        bloomLevel: "K4",
        bloomDescription: "Analyze",
        targetPercent: 60,
        directAttainment: 2.5,
        indirectAttainment: 2.5,
        overallAttainment: 2.5,
      },
    ],
    mappingMatrix: {
      CO1: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 2, PO11: 1, PO12: 2, PSO1: 3, PSO2: 2 },
      CO2: { PO1: 3, PO2: 3, PO3: 2, PO4: 2, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 3 },
      CO3: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 0, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 2 },
      CO4: { PO1: 3, PO2: 2, PO3: 3, PO4: 3, PO5: 2, PO6: 1, PO7: 0, PO8: 1, PO9: 1, PO10: 1, PO11: 1, PO12: 2, PSO1: 3, PSO2: 3 },
    },
  },
};

/**
 * Loads all stored CO-PO articulations
 */
export function getAllArticulations(): Record<string, COPOArticulation> {
  ensureDirectory();
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_MATRICES, ...parsed };
    }
  } catch (err) {
    console.error("Error reading co_po_matrices.json:", err);
  }
  return DEFAULT_MATRICES;
}

/**
 * Gets articulation data for a single course
 */
export function getCourseArticulation(courseCode: string): COPOArticulation {
  const all = getAllArticulations();
  const normalized = courseCode.toUpperCase().trim();
  if (all[normalized]) {
    return all[normalized];
  }

  // Fallback template for any other course
  return {
    courseCode: normalized,
    courseTitle: `${normalized} Core Course`,
    departmentCode: "CSE",
    academicYear: "2025-2026",
    semester: 1,
    credits: 3,
    directWeight: 0.8,
    indirectWeight: 0.2,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: "Academic Coordinator",
    outcomes: [
      {
        code: "CO1",
        title: "Foundational Principles",
        description: `Comprehend foundational theoretical frameworks and methodologies of ${normalized}.`,
        bloomLevel: "K2",
        bloomDescription: "Understand",
        targetPercent: 60,
        directAttainment: 2.5,
        indirectAttainment: 2.4,
        overallAttainment: 2.48,
      },
      {
        code: "CO2",
        title: "Technical Implementation",
        description: `Implement, compute, and benchmark algorithms relating to ${normalized}.`,
        bloomLevel: "K3",
        bloomDescription: "Apply",
        targetPercent: 60,
        directAttainment: 2.6,
        indirectAttainment: 2.5,
        overallAttainment: 2.58,
      },
      {
        code: "CO3",
        title: "Critical Analysis & Evaluation",
        description: `Analyze bottlenecks, evaluate failure cases, and propose structural optimizations for ${normalized}.`,
        bloomLevel: "K4",
        bloomDescription: "Analyze",
        targetPercent: 55,
        directAttainment: 2.4,
        indirectAttainment: 2.3,
        overallAttainment: 2.38,
      },
    ],
    mappingMatrix: {
      CO1: { PO1: 3, PO2: 2, PO3: 2, PO4: 1, PO5: 2, PO6: 0, PO7: 0, PO8: 0, PO9: 1, PO10: 1, PO11: 0, PO12: 2, PSO1: 3, PSO2: 2 },
      CO2: { PO1: 3, PO2: 3, PO3: 3, PO4: 2, PO5: 3, PO6: 0, PO7: 0, PO8: 0, PO9: 2, PO10: 1, PO11: 1, PO12: 2, PSO1: 3, PSO2: 3 },
      CO3: { PO1: 3, PO2: 3, PO3: 3, PO4: 3, PO5: 2, PO6: 1, PO7: 0, PO8: 1, PO9: 2, PO10: 2, PO11: 1, PO12: 3, PSO1: 3, PSO2: 2 },
    },
  };
}

/**
 * Saves or updates a course articulation matrix
 */
export function saveCourseArticulation(
  courseCode: string,
  updatedData: Partial<COPOArticulation>,
  actorName = "Faculty Member"
): COPOArticulation {
  ensureDirectory();
  const all = getAllArticulations();
  const normalized = courseCode.toUpperCase().trim();
  const current = getCourseArticulation(normalized);

  // Recalculate CO overall attainments if weights or scores change
  const directWeight = updatedData.directWeight ?? current.directWeight;
  const indirectWeight = updatedData.indirectWeight ?? current.indirectWeight;

  const outcomes = (updatedData.outcomes ?? current.outcomes).map((co) => ({
    ...co,
    overallAttainment: computeCOAttainment(co.directAttainment, co.indirectAttainment, directWeight, indirectWeight),
  }));

  const merged: COPOArticulation = {
    ...current,
    ...updatedData,
    courseCode: normalized,
    outcomes,
    directWeight,
    indirectWeight,
    updatedAt: new Date().toISOString(),
    lastUpdatedBy: actorName,
  };

  all[normalized] = merged;

  fs.writeFileSync(STORE_FILE, JSON.stringify(all, null, 2), "utf-8");
  return merged;
}
