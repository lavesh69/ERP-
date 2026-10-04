export interface DocumentChunk {
  id: string;
  documentId: string;
  title: string;
  category: string;
  courseCode?: string;
  institutionId?: string;
  allowedRoles?: string[];
  content: string;
  chunkIndex: number;
  embedding?: number[];
}

export interface GroundedCitation {
  documentTitle: string;
  category: string;
  excerpt: string;
  relevanceScore: number;
}

export interface VectorSearchOptions {
  topK?: number;
  courseFilter?: string;
  institutionId?: string;
  userRole?: string;
  minScore?: number;
}

export const DEFAULT_EMBEDDING_DIM = 128;

// Deterministic FNV-1a hash function for subword vector bucket mapping
function fnv1aHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

// Generate normalized dense vector embedding using TF-IDF subword and character n-gram hashing
export function generateTextEmbedding(text: string, dimensions: number = DEFAULT_EMBEDDING_DIM): number[] {
  const vec = new Array(dimensions).fill(0);
  if (!text || text.trim().length === 0) {
    return vec;
  }

  const cleaned = text.toLowerCase();
  const words = cleaned.split(/\W+/).filter((w) => w.length > 1);

  // Common stop words to de-weight
  const stopWords = new Set(["the", "and", "for", "with", "this", "that", "from", "are", "were", "been", "have"]);

  // 1. Word unigrams
  for (const word of words) {
    const isStop = stopWords.has(word);
    const weight = isStop ? 0.3 : 1.0 + Math.log(1 + word.length);
    const h = fnv1aHash(word);
    const idx = h % dimensions;
    const sign = (h & 1) === 0 ? 1 : -1;
    vec[idx] += sign * weight;
  }

  // 2. Character 3-grams for semantic morphologic preservation (e.g. 'attend', 'matrix', 'transf')
  for (let i = 0; i <= cleaned.length - 3; i++) {
    const tri = cleaned.slice(i, i + 3);
    const h = fnv1aHash(tri);
    const idx = h % dimensions;
    const sign = (h & 2) === 0 ? 0.4 : -0.4;
    vec[idx] += sign;
  }

  // 3. L2 Euclidean Normalization
  let sumSq = 0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vec[i] * vec[i];
  }

  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = Number((vec[i] / norm).toFixed(6));
    }
  }

  return vec;
}

// Cosine similarity computation between two normalized dense vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  const score = dotProduct / denom;
  // Bound to [0.0, 1.0] for semantic retrieval ranking
  return Math.max(0, Math.min(1, score));
}

// Sliding window text chunking with sentence and boundary awareness
export function chunkText(content: string, maxChunkLength: number = 300, overlap: number = 50): string[] {
  if (!content) return [];
  if (content.length <= maxChunkLength) return [content];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < content.length) {
    let endIndex = startIndex + maxChunkLength;

    if (endIndex < content.length) {
      // Look back for sentence end (. ) or paragraph break
      const slice = content.slice(startIndex, endIndex);
      const lastSentenceBreak = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("\n\n"));
      if (lastSentenceBreak > maxChunkLength * 0.6) {
        endIndex = startIndex + lastSentenceBreak + 2;
      } else {
        // Otherwise look for word boundary
        const lastSpace = slice.lastIndexOf(" ");
        if (lastSpace > maxChunkLength * 0.7) {
          endIndex = startIndex + lastSpace + 1;
        }
      }
    } else {
      endIndex = content.length;
    }

    const chunk = content.slice(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = Math.max(startIndex + 1, endIndex - overlap);
  }

  return chunks;
}

// Seed Academic Corpus with Pre-computed Dense Vectors
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

// Pre-initialize embeddings for seed documents
for (const doc of SEED_KNOWLEDGE_DOCUMENTS) {
  if (!doc.embedding) {
    doc.embedding = generateTextEmbedding(`${doc.title} ${doc.content}`);
  }
}

// In-Memory dynamic vector corpus repository
const dynamicCorpus: DocumentChunk[] = [...SEED_KNOWLEDGE_DOCUMENTS];

// Dynamically index new academic documents or syllabus handbooks into vector corpus
export function addDocumentToCorpus(doc: {
  title: string;
  category: string;
  content: string;
  courseCode?: string;
  documentId?: string;
  institutionId?: string;
  allowedRoles?: string[];
}): DocumentChunk[] {
  const chunks = chunkText(doc.content);
  const docId = doc.documentId || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const created: DocumentChunk[] = [];

  chunks.forEach((chunkContent, idx) => {
    const chunk: DocumentChunk = {
      id: `${docId}-ch-${idx}`,
      documentId: docId,
      title: doc.title,
      category: doc.category,
      courseCode: doc.courseCode,
      institutionId: doc.institutionId,
      allowedRoles: doc.allowedRoles,
      content: chunkContent,
      chunkIndex: idx,
      embedding: generateTextEmbedding(`${doc.title} ${chunkContent}`),
    };
    dynamicCorpus.push(chunk);
    created.push(chunk);
  });

  return created;
}

// Semantic Vector & Hybrid Search across academic knowledge base
export function semanticVectorSearch(query: string, options: VectorSearchOptions = {}): GroundedCitation[] {
  const { topK = 3, courseFilter, institutionId, userRole, minScore = 0.15 } = options;
  if (!query || query.trim().length === 0) return [];

  const queryEmbedding = generateTextEmbedding(query);
  const queryTokens = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

  const scored = dynamicCorpus.map((doc) => {
    // Multi-tenant isolation: strictly exclude documents belonging to another institution or unscoped callers
    if (doc.institutionId && doc.institutionId !== institutionId) {
      return { doc, score: 0 };
    }

    // Role-based document sensitivity isolation
    if (userRole && doc.allowedRoles && doc.allowedRoles.length > 0 && !doc.allowedRoles.includes(userRole)) {
      return { doc, score: 0 };
    }

    if (courseFilter && doc.courseCode && doc.courseCode !== courseFilter) {
      return { doc, score: 0 };
    }

    // 1. Dense Cosine Vector Similarity
    const docEmb = doc.embedding || generateTextEmbedding(`${doc.title} ${doc.content}`);
    const cosine = cosineSimilarity(queryEmbedding, docEmb);

    // 2. Exact Lexical Match Boost
    let lexicalMatches = 0;
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    for (const token of queryTokens) {
      if (titleLower.includes(token)) lexicalMatches += 3;
      if (contentLower.includes(token)) lexicalMatches += 1;
    }
    const lexicalScore = queryTokens.length > 0 ? lexicalMatches / (queryTokens.length * 3) : 0;

    // 3. Hybrid Blend: 70% Dense Semantic Vector + 30% Lexical Exact
    const hybridScore = cosine * 0.7 + lexicalScore * 0.3;

    return { doc, score: hybridScore };
  });

  return scored
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => ({
      documentTitle: item.doc.title,
      category: item.doc.category,
      excerpt: item.doc.content,
      relevanceScore: Number(item.score.toFixed(3)),
    }));
}

// Backwards-compatible retrieval function used across chat and assessment modules
export function retrieveRelevantKnowledge(
  query: string,
  courseFilter?: string,
  options?: { institutionId?: string; userRole?: string }
): GroundedCitation[] {
  return semanticVectorSearch(query, {
    courseFilter,
    institutionId: options?.institutionId,
    userRole: options?.userRole,
    topK: 3,
    minScore: 0.15,
  });
}
