import fs from "fs";
import path from "path";
import crypto from "crypto";

export type RepositoryItemType =
  | "THESIS"
  | "DISSERTATION"
  | "FACULTY_PAPER"
  | "E_BOOK"
  | "DATASET"
  | "CONFERENCE_PROCEEDING";

export type RepositoryAccessLevel = "OPEN_ACCESS" | "CAMPUS_ONLY" | "RESTRICTED";

export interface RepositoryItem {
  id: string;
  itemType: RepositoryItemType;
  title: string;
  author: string;
  authorAffiliation: string;
  department: string;
  publicationYear: number;
  doi: string;
  license: "CC-BY-4.0" | "CC-BY-NC-4.0" | "APEX-INSTITUTIONAL-RESTRICTED" | "PUBLIC_DOMAIN";
  abstract: string;
  keywords: string[];
  fileSizeMb: number;
  fileFormat: "PDF" | "EPUB" | "ZIP";
  accessLevel: RepositoryAccessLevel;
  downloadsCount: number;
  citationsCount: number;
  peerReviewed: boolean;
  advisor?: string;
  checksumSha256: string;
  createdAt: string;
}

export interface DownloadAuditPass {
  passId: string;
  itemId: string;
  itemTitle: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  watermarkSeal: string;
  issuedAt: string;
  expiresAt: string;
  downloadUrl: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const REPO_FILE = path.join(DATA_DIR, "elibrary-repository.json");

export const DEFAULT_REPOSITORY_SEED: RepositoryItem[] = [
  {
    id: "IR-2026-001",
    itemType: "FACULTY_PAPER",
    title: "Autonomous Fault Detection and Microgrid Voltage Stabilization via Deep Reinforcement Learning",
    author: "Dr. Elena Vance, Prof. Arjun Sharma",
    authorAffiliation: "Department of Electrical & Computer Engineering, Apex Institute of Technology",
    department: "Electrical Engineering",
    publicationYear: 2026,
    doi: "10.5555/apex-ir/2026/ee-001",
    license: "CC-BY-4.0",
    abstract: "This paper presents a resilient decentralized control framework for smart microgrids under fluctuating solar penetration using deep Q-networks.",
    keywords: ["Smart Grids", "Deep RL", "Voltage Stability", "Renewable Energy"],
    fileSizeMb: 4.8,
    fileFormat: "PDF",
    accessLevel: "OPEN_ACCESS",
    downloadsCount: 342,
    citationsCount: 18,
    peerReviewed: true,
    checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    createdAt: "2026-01-15T09:30:00.000Z",
  },
  {
    id: "IR-2026-002",
    itemType: "DISSERTATION",
    title: "Formal Verification of Multi-Tenant Rollup Contracts in Zero-Knowledge Ethereum Layer 2 Architecture",
    author: "Aditya Nair",
    advisor: "Prof. Vikram Malhotra",
    authorAffiliation: "Department of Computer Science & Engineering",
    department: "Computer Science",
    publicationYear: 2025,
    doi: "10.5555/apex-ir/2025/cs-042",
    license: "CC-BY-NC-4.0",
    abstract: "Doctoral dissertation exploring deductive verification methods for zero-knowledge circuit soundness and state transition constraints in cryptographic zk-EVM architectures.",
    keywords: ["Zero-Knowledge Proofs", "ZK-Rollups", "Formal Methods", "Smart Contracts"],
    fileSizeMb: 12.4,
    fileFormat: "PDF",
    accessLevel: "OPEN_ACCESS",
    downloadsCount: 519,
    citationsCount: 27,
    peerReviewed: true,
    checksumSha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    createdAt: "2025-11-20T14:15:00.000Z",
  },
  {
    id: "IR-2026-003",
    itemType: "THESIS",
    title: "High-Throughput CRISPR-Cas9 Target Cleavage Efficacy Prediction Using Graph Attention Networks",
    author: "Kavita Ramachandran",
    advisor: "Dr. Maya Deshmukh",
    authorAffiliation: "Department of Biotechnology & Computational Biology",
    department: "Biotechnology",
    publicationYear: 2026,
    doi: "10.5555/apex-ir/2026/bio-018",
    license: "CC-BY-4.0",
    abstract: "Master of Science thesis formulating guide RNA secondary structures as molecular topological graphs to predict off-target cutting frequencies with 94.6% AUC ROC.",
    keywords: ["CRISPR", "Graph Neural Networks", "Bioinformatics", "Off-target Cleavage"],
    fileSizeMb: 8.2,
    fileFormat: "PDF",
    accessLevel: "CAMPUS_ONLY",
    downloadsCount: 184,
    citationsCount: 9,
    peerReviewed: true,
    checksumSha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    createdAt: "2026-02-10T11:00:00.000Z",
  },
  {
    id: "IR-2026-004",
    itemType: "E_BOOK",
    title: "Advanced Distributed Database Architectures: From Raft Consensus to Globally Distributed ACID Transactions",
    author: "Prof. Marcus Thorne",
    authorAffiliation: "School of Computing & Information Systems",
    department: "Computer Science",
    publicationYear: 2026,
    doi: "10.5555/apex-ir/2026/textbook-004",
    license: "APEX-INSTITUTIONAL-RESTRICTED",
    abstract: "Course textbook and monograph covering Paxos/Raft consensus algorithms, vector clocks, multi-version concurrency control (MVCC), and distributed deadlock mitigation.",
    keywords: ["Distributed Systems", "Raft", "ACID", "Consensus", "MVCC"],
    fileSizeMb: 18.6,
    fileFormat: "PDF",
    accessLevel: "CAMPUS_ONLY",
    downloadsCount: 780,
    citationsCount: 42,
    peerReviewed: true,
    checksumSha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    createdAt: "2026-01-05T08:00:00.000Z",
  },
  {
    id: "IR-2026-005",
    itemType: "DATASET",
    title: "Multi-Modal Classroom Acoustic and Thermal Comfort Sensor Dataset across 48 Lecture Theatres",
    author: "Infrastructure Analytics Research Group",
    authorAffiliation: "Department of Civil & Architecture Engineering",
    department: "Civil Engineering",
    publicationYear: 2025,
    doi: "10.5555/apex-ir/2025/data-009",
    license: "PUBLIC_DOMAIN",
    abstract: "Time-series IoT sensor data recorded at 1-minute intervals encompassing CO2 ppm, ambient temperature, humidity, and reverberation time measurements over two academic semesters.",
    keywords: ["IoT", "Indoor Air Quality", "Acoustics", "Smart Campus"],
    fileSizeMb: 64.5,
    fileFormat: "ZIP",
    accessLevel: "OPEN_ACCESS",
    downloadsCount: 215,
    citationsCount: 14,
    peerReviewed: false,
    checksumSha256: "8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4",
    createdAt: "2025-12-14T16:20:00.000Z",
  },
];

function ensureRepoFileExists(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPO_FILE)) {
    fs.writeFileSync(REPO_FILE, JSON.stringify(DEFAULT_REPOSITORY_SEED, null, 2), "utf8");
  }
}

export function getAllRepositoryItems(): RepositoryItem[] {
  ensureRepoFileExists();
  try {
    const raw = fs.readFileSync(REPO_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_REPOSITORY_SEED;
  } catch (err) {
    console.error("Error reading repository file:", err);
    return DEFAULT_REPOSITORY_SEED;
  }
}

export function saveRepositoryItems(items: RepositoryItem[]): void {
  ensureRepoFileExists();
  fs.writeFileSync(REPO_FILE, JSON.stringify(items, null, 2), "utf8");
}

export function searchRepository(params: {
  query?: string;
  department?: string;
  itemType?: string;
  accessLevel?: string;
}): RepositoryItem[] {
  const items = getAllRepositoryItems();
  return items.filter((item) => {
    if (params.department && params.department !== "ALL" && item.department !== params.department) {
      return false;
    }
    if (params.itemType && params.itemType !== "ALL" && item.itemType !== params.itemType) {
      return false;
    }
    if (params.accessLevel && params.accessLevel !== "ALL" && item.accessLevel !== params.accessLevel) {
      return false;
    }
    if (params.query && params.query.trim().length > 0) {
      const q = params.query.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(q);
      const inAuthor = item.author.toLowerCase().includes(q);
      const inAbstract = item.abstract.toLowerCase().includes(q);
      const inKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      const inDoi = item.doi.toLowerCase().includes(q);
      return inTitle || inAuthor || inAbstract || inKeywords || inDoi;
    }
    return true;
  });
}

export function depositRepositoryItem(params: {
  itemType: RepositoryItemType;
  title: string;
  author: string;
  authorAffiliation: string;
  department: string;
  publicationYear?: number;
  license: "CC-BY-4.0" | "CC-BY-NC-4.0" | "APEX-INSTITUTIONAL-RESTRICTED" | "PUBLIC_DOMAIN";
  abstract: string;
  keywords: string[];
  fileSizeMb?: number;
  fileFormat?: "PDF" | "EPUB" | "ZIP";
  accessLevel?: RepositoryAccessLevel;
  advisor?: string;
  peerReviewed?: boolean;
}): RepositoryItem {
  const items = getAllRepositoryItems();
  const year = params.publicationYear || new Date().getFullYear();
  const depCode = params.department.slice(0, 3).toLowerCase();
  const uniqueSeq = (items.length + 1).toString().padStart(3, "0");
  const id = `IR-${year}-${uniqueSeq}`;
  const doi = `10.5555/apex-ir/${year}/${depCode}-${uniqueSeq}`;
  
  // Calculate deterministic cryptographic SHA-256
  const hash = crypto
    .createHash("sha256")
    .update(`${id}:${params.title}:${params.author}:${Date.now()}`)
    .digest("hex");

  const newItem: RepositoryItem = {
    id,
    itemType: params.itemType,
    title: params.title.trim(),
    author: params.author.trim(),
    authorAffiliation: params.authorAffiliation.trim(),
    department: params.department.trim(),
    publicationYear: year,
    doi,
    license: params.license,
    abstract: params.abstract.trim(),
    keywords: params.keywords.map((k) => k.trim()).filter(Boolean),
    fileSizeMb: params.fileSizeMb || 5.2,
    fileFormat: params.fileFormat || "PDF",
    accessLevel: params.accessLevel || "OPEN_ACCESS",
    downloadsCount: 0,
    citationsCount: 0,
    peerReviewed: params.peerReviewed ?? true,
    advisor: params.advisor?.trim(),
    checksumSha256: hash,
    createdAt: new Date().toISOString(),
  };

  items.unshift(newItem);
  saveRepositoryItems(items);
  return newItem;
}

export function generateCitation(
  itemId: string,
  style: "APA" | "IEEE" | "BIBTEX"
): { style: string; citation: string; doi: string } {
  const items = getAllRepositoryItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error(`Repository item ${itemId} not found`);
  }

  let citation = "";
  if (style === "APA") {
    citation = `${item.author} (${item.publicationYear}). ${item.title}. Institutional Repository of Apex Institute of Technology. https://doi.org/${item.doi}`;
  } else if (style === "IEEE") {
    citation = `${item.author}, "${item.title}," Apex Institutional Repository, ${item.publicationYear}. doi: ${item.doi}.`;
  } else if (style === "BIBTEX") {
    const bibKey = `${item.author.split(" ")[0].toLowerCase()}${item.publicationYear}${item.id.replace(/-/g, "")}`;
    citation = `@techreport{${bibKey},\n  author = {${item.author}},\n  title = {${item.title}},\n  institution = {Apex Institute of Technology},\n  year = {${item.publicationYear}},\n  doi = {${item.doi}},\n  url = {https://doi.org/${item.doi}}\n}`;
  }

  return { style, citation, doi: item.doi };
}

export function requestSecuredDownload(
  itemId: string,
  requester: { name: string; email: string; role: string }
): DownloadAuditPass {
  const items = getAllRepositoryItems();
  const index = items.findIndex((i) => i.id === itemId);
  if (index === -1) {
    throw new Error(`Repository item ${itemId} not found`);
  }

  // Increment download counter
  items[index].downloadsCount += 1;
  saveRepositoryItems(items);

  const item = items[index];
  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hr token

  const sealHash = crypto
    .createHash("sha256")
    .update(`${item.id}:${requester.email}:${now.toISOString()}:${item.checksumSha256}`)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  const watermarkSeal = `APEX-IR-SEAL-${sealHash}`;

  return {
    passId: `PASS-${Date.now().toString(36).toUpperCase()}`,
    itemId: item.id,
    itemTitle: item.title,
    requesterName: requester.name,
    requesterEmail: requester.email,
    requesterRole: requester.role,
    watermarkSeal,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    downloadUrl: `/api/library/elibrary?downloadPass=${watermarkSeal}&docId=${item.id}`,
  };
}

export function getRepositoryAnalytics() {
  const items = getAllRepositoryItems();
  const totalAssets = items.length;
  const totalDownloads = items.reduce((acc, curr) => acc + curr.downloadsCount, 0);
  const totalCitations = items.reduce((acc, curr) => acc + curr.citationsCount, 0);
  const openAccessCount = items.filter((i) => i.accessLevel === "OPEN_ACCESS").length;
  const openAccessPct = totalAssets > 0 ? Math.round((openAccessCount / totalAssets) * 100) : 0;

  const departmentCounts: Record<string, number> = {};
  items.forEach((i) => {
    departmentCounts[i.department] = (departmentCounts[i.department] || 0) + 1;
  });

  const typeCounts: Record<string, number> = {};
  items.forEach((i) => {
    typeCounts[i.itemType] = (typeCounts[i.itemType] || 0) + 1;
  });

  return {
    totalAssets,
    totalDownloads,
    totalCitations,
    openAccessCount,
    openAccessPct,
    departmentCounts,
    typeCounts,
  };
}
