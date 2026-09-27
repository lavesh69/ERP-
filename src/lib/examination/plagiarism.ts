/**
 * Plagiarism & Academic Integrity Engine
 * Computes N-gram Jaccard Similarity and phrase overlap across student submissions.
 */

export interface PlagiarismComparisonResult {
  submissionAId: string;
  studentAName: string;
  submissionBId: string;
  studentBName: string;
  similarityScore: number; // 0.0 to 1.0 (percentage / 100)
  isFlagged: boolean;
  matchingPhrases: string[];
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function generateNgrams(tokens: string[], n = 3): Set<string> {
  const ngrams = new Set<string>();
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.add(tokens.slice(i, i + n).join(" "));
  }
  return ngrams;
}

export function calculateJaccardSimilarity(textA: string, textB: string, n = 3): {
  similarity: number;
  matchingPhrases: string[];
} {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return { similarity: 0, matchingPhrases: [] };
  }

  const ngramsA = generateNgrams(tokensA, n);
  const ngramsB = generateNgrams(tokensB, n);

  if (ngramsA.size === 0 || ngramsB.size === 0) {
    return { similarity: 0, matchingPhrases: [] };
  }

  const intersection = new Set<string>();
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) {
      intersection.add(gram);
    }
  }

  const union = new Set<string>([...ngramsA, ...ngramsB]);
  const similarity = Math.round((intersection.size / union.size) * 100) / 100;

  return {
    similarity,
    matchingPhrases: Array.from(intersection).slice(0, 5),
  };
}

export function scanSubmissionsForPlagiarism(
  submissions: Array<{ id: string; studentName: string; content: string }>,
  threshold = 0.35
): PlagiarismComparisonResult[] {
  const results: PlagiarismComparisonResult[] = [];

  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const subA = submissions[i];
      const subB = submissions[j];

      const { similarity, matchingPhrases } = calculateJaccardSimilarity(subA.content, subB.content);

      if (similarity >= threshold) {
        results.push({
          submissionAId: subA.id,
          studentAName: subA.studentName,
          submissionBId: subB.id,
          studentBName: subB.studentName,
          similarityScore: similarity,
          isFlagged: true,
          matchingPhrases,
        });
      }
    }
  }

  return results.sort((a, b) => b.similarityScore - a.similarityScore);
}

// ==========================================
// GLOBAL ACADEMIC LITERATURE & WEB CORPUS ENGINE
// ==========================================

export interface AcademicCorpusEntry {
  title: string;
  source: string; // e.g. "IEEE Xplore", "arXiv:cs.AI", "ACM Computing Surveys", "CrossRef"
  url?: string;
  authors?: string;
  year?: number;
  content: string;
}

export interface ExternalAcademicMatch {
  sourceTitle: string;
  source: string;
  url?: string;
  authors?: string;
  year?: number;
  similarityScore: number;
  matchedPhrases: string[];
  isFlagged: boolean;
  citationRecommended: string;
}

export interface GlobalAcademicScanResult {
  overallAcademicSimilarity: number;
  highestMatchSource: string | null;
  flaggedCount: number;
  matches: ExternalAcademicMatch[];
  aiGeneratedLikelihoodScore: number;
  academicIntegrityVerdict:
    | "ORIGINAL"
    | "MODERATE_CITATION_REQUIRED"
    | "HIGH_SIMILARITY_FLAGGED"
    | "ACADEMIC_MISCONDUCT_ALERT";
}

export const DEFAULT_ACADEMIC_CORPUS: AcademicCorpusEntry[] = [
  {
    title: "Attention Is All You Need: The Transformer Architecture",
    source: "arXiv:1706.03762 / NeurIPS",
    authors: "Vaswani, A., Shazeer, N., Parmar, N., et al.",
    year: 2017,
    url: "https://arxiv.org/abs/1706.03762",
    content:
      "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Multi-head self-attention allows the model to jointly attend to information from different representation subspaces at different positions.",
  },
  {
    title: "A Relational Model of Data for Large Shared Data Banks",
    source: "Communications of the ACM (CACM)",
    authors: "Codd, E. F.",
    year: 1970,
    url: "https://dl.acm.org/doi/10.1145/362384.362685",
    content:
      "Future users of large data banks must be protected from having to know how the data is organized in the machine. A model based on n-ary relations, a normal form for data base relations, and the concept of a universal data sublanguage are introduced. In contrast to tree-structured files or network models, relational operations provide data independence from machine representation and storage order.",
  },
  {
    title: "Operating System Concepts: Paging and Virtual Memory Management",
    source: "Addison-Wesley / IEEE Press",
    authors: "Silberschatz, A., Galvin, P. B., & Gagne, G.",
    year: 2018,
    url: "https://www.os-book.com",
    content:
      "Virtual memory involves the separation of logical memory as perceived by users from physical memory. This separation allows an extremely large virtual memory to be provided for programmers when only a smaller physical memory is available. Paging avoids external fragmentation and the need for compaction. Physical memory is divided into fixed-sized blocks called frames, and logical memory is divided into blocks of the same size called pages.",
  },
  {
    title: "Architectural Styles and the Design of Network-based Software Architectures (REST)",
    source: "University of California, Irvine (Doctoral Dissertation)",
    authors: "Fielding, R. T.",
    year: 2000,
    url: "https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm",
    content:
      "Representational State Transfer (REST) is an architectural style for distributed hypermedia systems. The key constraints are client-server separation, stateless interactions, cacheable responses, layered system hierarchies, and uniform interfaces through standard HTTP verbs and resource identification via URIs.",
  },
  {
    title: "The Byzantine Generals Problem and Fault Tolerance in Distributed Consensus",
    source: "ACM TOPLAS",
    authors: "Lamport, L., Shostak, R., & Pease, M.",
    year: 1982,
    url: "https://dl.acm.org/doi/10.1145/357172.357176",
    content:
      "Reliable computer systems must handle malfunctioning components that give conflicting information to different parts of the system. We describe this problem abstractly as the Byzantine Generals Problem, in which a group of generals must agree on a common battle plan. We show that using oral messages, the problem is solvable if and only if more than two-thirds of the generals are loyal.",
  },
];

export function estimateAiGenerationLikelihood(text: string): number {
  if (!text || text.trim().length < 50) return 0.05;

  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (sentences.length < 2) return 0.1;

  // 1. Sentence length variance (Low variance = uniform synthetic writing)
  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLen = lengths.reduce((acc, l) => acc + l, 0) / lengths.length;
  const variance = lengths.reduce((acc, l) => acc + Math.pow(l - avgLen, 2), 0) / lengths.length;

  // 2. Hallmark LLM transition marker density
  const llmKeywords = [
    "furthermore",
    "moreover",
    "in conclusion",
    "it is crucial to",
    "delve",
    "tapestry",
    "holistic",
    "beacon",
    "seamless",
    "it is worth noting",
    "pivotal role",
    "testament to",
  ];
  const lower = text.toLowerCase();
  let keywordHits = 0;
  for (const kw of llmKeywords) {
    if (lower.includes(kw)) keywordHits++;
  }

  let score = 0.1;
  // If variance is unusually low (sentences all ~12-18 words)
  if (variance < 15 && lengths.length >= 3) {
    score += 0.35;
  }
  // Keyword density contribution
  score += Math.min(0.45, keywordHits * 0.12);

  return Math.min(0.98, Math.round(score * 100) / 100);
}

export function scanAcademicCorpusSimilarity(
  content: string,
  externalCorpus: AcademicCorpusEntry[] = DEFAULT_ACADEMIC_CORPUS,
  threshold = 0.25
): GlobalAcademicScanResult {
  if (!content || content.trim().length === 0) {
    return {
      overallAcademicSimilarity: 0,
      highestMatchSource: null,
      flaggedCount: 0,
      matches: [],
      aiGeneratedLikelihoodScore: 0,
      academicIntegrityVerdict: "ORIGINAL",
    };
  }

  const matches: ExternalAcademicMatch[] = [];

  for (const entry of externalCorpus) {
    const { similarity, matchingPhrases } = calculateJaccardSimilarity(content, entry.content, 3);

    if (similarity >= threshold) {
      const citation = `${entry.authors || "Unknown"} (${entry.year || "n.d."}). "${entry.title}." ${entry.source}. ${entry.url || ""}`.trim();
      matches.push({
        sourceTitle: entry.title,
        source: entry.source,
        url: entry.url,
        authors: entry.authors,
        year: entry.year,
        similarityScore: similarity,
        matchedPhrases: matchingPhrases,
        isFlagged: similarity >= 0.4,
        citationRecommended: citation,
      });
    }
  }

  matches.sort((a, b) => b.similarityScore - a.similarityScore);

  const highestScore = matches.length > 0 ? matches[0].similarityScore : 0;
  const flaggedCount = matches.filter((m) => m.isFlagged).length;
  const aiScore = estimateAiGenerationLikelihood(content);

  let verdict: GlobalAcademicScanResult["academicIntegrityVerdict"] = "ORIGINAL";
  if (highestScore >= 0.6) {
    verdict = "ACADEMIC_MISCONDUCT_ALERT";
  } else if (highestScore >= 0.4) {
    verdict = "HIGH_SIMILARITY_FLAGGED";
  } else if (highestScore >= 0.25) {
    verdict = "MODERATE_CITATION_REQUIRED";
  }

  return {
    overallAcademicSimilarity: highestScore,
    highestMatchSource: matches.length > 0 ? matches[0].sourceTitle : null,
    flaggedCount,
    matches,
    aiGeneratedLikelihoodScore: aiScore,
    academicIntegrityVerdict: verdict,
  };
}
