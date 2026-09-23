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
