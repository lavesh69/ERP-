export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  category: string;
  courseCode?: string;
  content: string;
  chunkIndex: number;
}

export interface GroundedCitation {
  documentTitle: string;
  category: string;
  excerpt: string;
  relevanceScore: number;
}

// In-Memory & Prisma-backed Knowledge Base with Academic Regulations & Course Syllabi
export const SEED_KNOWLEDGE_DOCUMENTS: DocumentChunk[] = [
  {
    id: "chunk-reg-01",
    documentId: "doc-reg-01",
    title: "Apex University Academic Regulations 2026",
    category: "REGULATION",
    content: "Attendance Policy: A minimum of 75% attendance across all scheduled lectures, tutorials, and laboratories is mandatory to be eligible for End-Semester Examinations. Students with attendance between 65% and 74.9% may apply for medical condonation subject to Dean of Academic Affairs approval.",
    chunkIndex: 0,
  },
  {
    id: "chunk-reg-02",
    documentId: "doc-reg-01",
    title: "Apex University Academic Regulations 2026",
    category: "REGULATION",
    content: "Grading Scale & SGPA: Grading uses a 10-point scale where A+ (90-100%) represents 10.0 points, A (80-89%) represents 9.0 points, B+ (70-79%) represents 8.0 points, B (60-69%) represents 7.0 points, and F (<40%) represents Fail (0.0 points). To graduate, a student must maintain a cumulative CGPA of not less than 5.0.",
    chunkIndex: 1,
  },
  {
    id: "chunk-cs402-01",
    documentId: "doc-cs402",
    title: "CS-402 Advanced Neural Networks Syllabus & Schedule",
    category: "SYLLABUS",
    courseCode: "CS-402",
    content: "CS-402 covers Deep Architectures, Attention Mechanisms, Transformer self-attention, Mixture of Experts (MoE), Diffusion Models, and Multi-Agent Orchestration. Mid-Term Examination is scheduled for Week 8 and accounts for 30% of total grade. Final Project accounts for 40%.",
    chunkIndex: 0,
  },
  {
    id: "chunk-bio210-01",
    documentId: "doc-bio210",
    title: "BIO-210 Cellular Genomics Lab Manual",
    category: "LAB_MANUAL",
    courseCode: "BIO-210",
    content: "BIO-210 Lab Safety Regulations: All students entering Clean Room IoT Pods must wear nitrile gloves and protective eyewear. CRISPR transfection assays must be incubated strictly at 37°C in Chamber 3. Lab notebooks count for 25% of internal assessment.",
    chunkIndex: 0,
  },
  {
    id: "chunk-fin-01",
    documentId: "doc-fin-01",
    title: "University Bursar Fee Policy & Installments",
    category: "POLICY",
    content: "Fee Payment Deadlines: Fall semester tuition fees must be cleared by the 15th of the term start month. Installment payment plans allow 3 equal splits with a 2% administrative fee. A late payment fee of $25 per week applies after the final grace period.",
    chunkIndex: 0,
  },
];

// Semantic keyword and term matching ranker for grounded retrieval
export function retrieveRelevantKnowledge(query: string, courseFilter?: string): GroundedCitation[] {
  const queryTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  if (queryTokens.length === 0) return [];

  const scored = SEED_KNOWLEDGE_DOCUMENTS.map((doc) => {
    if (courseFilter && doc.courseCode && doc.courseCode !== courseFilter) {
      return { doc, score: 0 };
    }

    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    let matches = 0;
    for (const token of queryTokens) {
      if (titleLower.includes(token)) matches += 3;
      if (contentLower.includes(token)) matches += 1;
    }

    const score = matches / (queryTokens.length * 3);
    return { doc, score };
  });

  return scored
    .filter((item) => item.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      documentTitle: item.doc.title,
      category: item.doc.category,
      excerpt: item.doc.content,
      relevanceScore: Number(item.score.toFixed(2)),
    }));
}
