import { createHash } from "crypto";

export interface PeerReviewEvaluation {
  id: string;
  publicationId: string;
  reviewerCode: string;
  originalityScore: number;
  methodologyScore: number;
  empiricalRigorScore: number;
  averageScore: number;
  ethicalCompliance: "PASS" | "FAIL";
  recommendation: "ACCEPT" | "MINOR_REVISION" | "MAJOR_REVISION" | "REJECT";
  comments: string;
  evaluatedAt: string;
}

export function generateStandardDoi(
  title: string,
  journal: string,
  year: number = new Date().getFullYear()
): { doi: string; url: string; sha256Checksum: string } {
  const hash = createHash("sha256")
    .update(`${title}:${journal || "apex"}:${year}`)
    .digest("hex");
  const suffix = hash.slice(0, 8);
  const doi = `10.1000/apex.${year}.${suffix}`;
  return {
    doi,
    url: `https://doi.org/${doi}`,
    sha256Checksum: hash,
  };
}
