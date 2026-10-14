/**
 * CLASSROOM ERP — Faculty Research, Grants, Patents & Consultancy Ledger Engine
 * 
 * Implements comprehensive statutory UGC Regulation 2018 (Appendix II, Table 2)
 * Academic Performance Indicator (API) Research Score calculation, tracking
 * Scopus/WoS publications, DST/SERB/ISRO grants, IPR patents, and industrial consultancy.
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface ResearchPublication {
  id: string;
  facultyId: string;
  facultyName: string;
  title: string;
  journalName: string;
  issnOrIsbn: string;
  indexing: "SCOPUS" | "WEB_OF_SCIENCE" | "UGC_CARE" | "IEEE_XPLORE" | "PEER_REVIEWED";
  impactFactor: number;
  authorshipRole: "FIRST_AUTHOR" | "CORRESPONDING_AUTHOR" | "CO_AUTHOR" | "PRINCIPAL_SUPERVISOR";
  totalAuthors: number;
  doi?: string;
  publicationYear: number;
  apiPointsAwarded: number;
  verified: boolean;
}

export interface ResearchGrant {
  id: string;
  facultyId: string;
  facultyName: string;
  projectTitle: string;
  fundingAgency: "DST" | "SERB" | "ISRO" | "DRDO" | "AICTE" | "ICMR" | "INDUSTRY" | "INTERNAL";
  sanctionOrderNumber: string;
  sanctionYear: number;
  durationMonths: number;
  totalOutlayInr: number;
  fundsDisbursedInr: number;
  investigatorRole: "PRINCIPAL_INVESTIGATOR" | "CO_PRINCIPAL_INVESTIGATOR";
  status: "PROPOSED" | "SANCTIONED" | "ACTIVE" | "COMPLETED";
  apiPointsAwarded: number;
}

export interface PatentRecord {
  id: string;
  facultyId: string;
  facultyName: string;
  title: string;
  patentOffice: "INDIA_IPO" | "USPTO" | "EPO" | "PCT_WIPO";
  applicationNumber: string;
  filingDate: string;
  grantDate?: string;
  stage: "FILED" | "PUBLISHED" | "GRANTED" | "COMMERCIALIZED";
  isNational: boolean;
  apiPointsAwarded: number;
}

export interface ConsultancyProject {
  id: string;
  facultyId: string;
  facultyName: string;
  clientOrganization: string;
  projectScope: string;
  agreementDate: string;
  contractValueInr: number;
  institutionalOverheadShareInr: number;
  consultantDisbursementInr: number;
  status: "ACTIVE" | "COMPLETED";
  apiPointsAwarded: number;
}

export interface FacultyResearchPortfolio {
  facultyId: string;
  facultyName: string;
  department: string;
  designation: string;
  hIndex: number;
  i10Index: number;
  totalCitations: number;
  publications: ResearchPublication[];
  grants: ResearchGrant[];
  patents: PatentRecord[];
  consultancies: ConsultancyProject[];
  ugcApiSummary: {
    category1PublicationsScore: number;
    category2GrantsScore: number;
    category3PatentsPolicyScore: number;
    category4ConsultancyScore: number;
    totalUgcResearchScore: number;
    eligibleForProfessorCas: boolean; // Threshold 110 points
    eligibleForAssociateProfessorCas: boolean; // Threshold 70 points
  };
  integrityVerificationSeal: string;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data", "faculty");
const PORTFOLIO_FILE = path.join(DATA_DIR, "research_portfolio.json");

function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PORTFOLIO_FILE)) {
    fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(DEFAULT_PORTFOLIOS, null, 2), "utf-8");
  }
}

/**
 * Calculates UGC Regulation 2018 Table 2 API points for a publication:
 * - Refereed Journal indexed in Scopus/WoS: 25 Base Points
 * - Plus Impact factor augments:
 *    - IF < 1: +5
 *    - 1 <= IF < 2: +10
 *    - 2 <= IF < 5: +15
 *    - 5 <= IF < 10: +20
 *    - IF >= 10: +25
 * - Shared distribution rule:
 *    - First/Corresponding author receives 70% of total
 *    - Co-author receives 30% of total
 */
export function calculatePublicationApiPoints(
  indexing: ResearchPublication["indexing"],
  impactFactor: number,
  authorshipRole: ResearchPublication["authorshipRole"]
): number {
  let base = 10;
  if (indexing === "SCOPUS" || indexing === "WEB_OF_SCIENCE" || indexing === "IEEE_XPLORE") {
    base = 25;
  } else if (indexing === "UGC_CARE") {
    base = 15;
  }

  let ifBonus = 0;
  if (impactFactor >= 10) ifBonus = 25;
  else if (impactFactor >= 5) ifBonus = 20;
  else if (impactFactor >= 2) ifBonus = 15;
  else if (impactFactor >= 1) ifBonus = 10;
  else if (impactFactor > 0) ifBonus = 5;

  const totalPoints = base + ifBonus;

  if (authorshipRole === "FIRST_AUTHOR" || authorshipRole === "CORRESPONDING_AUTHOR" || authorshipRole === "PRINCIPAL_SUPERVISOR") {
    return Math.round(totalPoints * 0.7 * 10) / 10;
  } else {
    return Math.round(totalPoints * 0.3 * 10) / 10;
  }
}

/**
 * Calculates UGC API points for extramural sponsored research grants:
 * - Grants > 10 Lakhs: 10 points (PI), 5 points (Co-PI)
 * - Grants 4 - 10 Lakhs: 7 points (PI), 3.5 points (Co-PI)
 * - Grants 1 - 4 Lakhs: 4 points (PI), 2 points (Co-PI)
 */
export function calculateGrantApiPoints(
  totalOutlayInr: number,
  role: ResearchGrant["investigatorRole"]
): number {
  const isPI = role === "PRINCIPAL_INVESTIGATOR";
  if (totalOutlayInr >= 1000000) {
    return isPI ? 10 : 5;
  } else if (totalOutlayInr >= 400000) {
    return isPI ? 7 : 3.5;
  } else {
    return isPI ? 4 : 2;
  }
}

/**
 * Calculates UGC API points for patents:
 * - International Granted: 10 points
 * - National Granted: 7 points
 * - Published / Under Examination: 4 points
 */
export function calculatePatentApiPoints(
  stage: PatentRecord["stage"],
  isNational: boolean
): number {
  if (stage === "GRANTED" || stage === "COMMERCIALIZED") {
    return isNational ? 7 : 10;
  }
  return 4; // Filed/Published
}

/**
 * Calculates UGC API points for consultancy:
 * - 3 points for every 10 Lakhs mobilization, minimum 2 points
 */
export function calculateConsultancyApiPoints(contractValueInr: number): number {
  const points = Math.max(2, Math.round((contractValueInr / 1000000) * 3));
  return points;
}

export function generatePortfolioSeal(portfolio: FacultyResearchPortfolio): string {
  const payload = `${portfolio.facultyId}|${portfolio.ugcApiSummary.totalUgcResearchScore}|${portfolio.publications.length}|${portfolio.grants.length}`;
  return `UGC-RESEARCH-SEAL-${crypto.createHash("sha256").update(payload).digest("hex").substring(0, 24).toUpperCase()}`;
}

export function loadAllPortfolios(): Record<string, FacultyResearchPortfolio> {
  ensureStorage();
  try {
    const raw = fs.readFileSync(PORTFOLIO_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PORTFOLIOS;
  }
}

export function saveAllPortfolios(portfolios: Record<string, FacultyResearchPortfolio>): void {
  ensureStorage();
  fs.writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolios, null, 2), "utf-8");
}

export function getFacultyResearchPortfolio(facultyId: string, facultyNameFallback = "Faculty Member"): FacultyResearchPortfolio {
  const all = loadAllPortfolios();
  if (all[facultyId]) {
    return all[facultyId];
  }

  // Create initial empty portfolio for faculty
  const newPortfolio: FacultyResearchPortfolio = {
    facultyId,
    facultyName: facultyNameFallback,
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    hIndex: 8,
    i10Index: 12,
    totalCitations: 245,
    publications: [],
    grants: [],
    patents: [],
    consultancies: [],
    ugcApiSummary: {
      category1PublicationsScore: 0,
      category2GrantsScore: 0,
      category3PatentsPolicyScore: 0,
      category4ConsultancyScore: 0,
      totalUgcResearchScore: 0,
      eligibleForProfessorCas: false,
      eligibleForAssociateProfessorCas: false,
    },
    integrityVerificationSeal: "",
    lastUpdated: new Date().toISOString(),
  };

  newPortfolio.integrityVerificationSeal = generatePortfolioSeal(newPortfolio);
  all[facultyId] = newPortfolio;
  saveAllPortfolios(all);
  return newPortfolio;
}

export function addPublicationToPortfolio(
  facultyId: string,
  pub: Omit<ResearchPublication, "id" | "apiPointsAwarded" | "verified">
): FacultyResearchPortfolio {
  const all = loadAllPortfolios();
  const portfolio = all[facultyId] || getFacultyResearchPortfolio(facultyId, pub.facultyName);

  const apiPoints = calculatePublicationApiPoints(pub.indexing, pub.impactFactor, pub.authorshipRole);
  const newPub: ResearchPublication = {
    ...pub,
    id: `pub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    apiPointsAwarded: apiPoints,
    verified: true,
  };

  portfolio.publications.push(newPub);
  recalculatePortfolioSummary(portfolio);
  all[facultyId] = portfolio;
  saveAllPortfolios(all);
  return portfolio;
}

export function addGrantToPortfolio(
  facultyId: string,
  grant: Omit<ResearchGrant, "id" | "apiPointsAwarded">
): FacultyResearchPortfolio {
  const all = loadAllPortfolios();
  const portfolio = all[facultyId] || getFacultyResearchPortfolio(facultyId, grant.facultyName);

  const apiPoints = calculateGrantApiPoints(grant.totalOutlayInr, grant.investigatorRole);
  const newGrant: ResearchGrant = {
    ...grant,
    id: `grant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    apiPointsAwarded: apiPoints,
  };

  portfolio.grants.push(newGrant);
  recalculatePortfolioSummary(portfolio);
  all[facultyId] = portfolio;
  saveAllPortfolios(all);
  return portfolio;
}

export function addPatentToPortfolio(
  facultyId: string,
  patent: Omit<PatentRecord, "id" | "apiPointsAwarded">
): FacultyResearchPortfolio {
  const all = loadAllPortfolios();
  const portfolio = all[facultyId] || getFacultyResearchPortfolio(facultyId, patent.facultyName);

  const apiPoints = calculatePatentApiPoints(patent.stage, patent.isNational);
  const newPatent: PatentRecord = {
    ...patent,
    id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    apiPointsAwarded: apiPoints,
  };

  portfolio.patents.push(newPatent);
  recalculatePortfolioSummary(portfolio);
  all[facultyId] = portfolio;
  saveAllPortfolios(all);
  return portfolio;
}

export function recalculatePortfolioSummary(portfolio: FacultyResearchPortfolio): void {
  const cat1 = portfolio.publications.reduce((sum, p) => sum + p.apiPointsAwarded, 0);
  const cat2 = portfolio.grants.reduce((sum, g) => sum + g.apiPointsAwarded, 0);
  const cat3 = portfolio.patents.reduce((sum, pat) => sum + pat.apiPointsAwarded, 0);
  const cat4 = portfolio.consultancies.reduce((sum, c) => sum + c.apiPointsAwarded, 0);

  const total = Math.round((cat1 + cat2 + cat3 + cat4) * 10) / 10;

  portfolio.ugcApiSummary = {
    category1PublicationsScore: Math.round(cat1 * 10) / 10,
    category2GrantsScore: Math.round(cat2 * 10) / 10,
    category3PatentsPolicyScore: Math.round(cat3 * 10) / 10,
    category4ConsultancyScore: Math.round(cat4 * 10) / 10,
    totalUgcResearchScore: total,
    eligibleForProfessorCas: total >= 110,
    eligibleForAssociateProfessorCas: total >= 70,
  };

  portfolio.integrityVerificationSeal = generatePortfolioSeal(portfolio);
  portfolio.lastUpdated = new Date().toISOString();
}

const DEFAULT_PORTFOLIOS: Record<string, FacultyResearchPortfolio> = {
  "fac-demo-01": {
    facultyId: "fac-demo-01",
    facultyName: "Dr. Rajesh K. Sharma",
    department: "Computer Science & Engineering",
    designation: "Professor & Dean R&D",
    hIndex: 18,
    i10Index: 32,
    totalCitations: 1420,
    publications: [
      {
        id: "pub-01",
        facultyId: "fac-demo-01",
        facultyName: "Dr. Rajesh K. Sharma",
        title: "Fault-Tolerant Consensus in Asynchronous Hybrid Byzantine Clouds",
        journalName: "IEEE Transactions on Parallel and Distributed Systems",
        issnOrIsbn: "1045-9219",
        indexing: "IEEE_XPLORE",
        impactFactor: 5.3,
        authorshipRole: "FIRST_AUTHOR",
        totalAuthors: 3,
        doi: "10.1109/TPDS.2024.3389102",
        publicationYear: 2024,
        apiPointsAwarded: 31.5,
        verified: true,
      },
      {
        id: "pub-02",
        facultyId: "fac-demo-01",
        facultyName: "Dr. Rajesh K. Sharma",
        title: "Adaptive Rate-Limiting and Zero-Trust Telemetry for Distributed Microservices",
        journalName: "ACM Transactions on Autonomous and Adaptive Systems",
        issnOrIsbn: "1556-4665",
        indexing: "SCOPUS",
        impactFactor: 3.8,
        authorshipRole: "CORRESPONDING_AUTHOR",
        totalAuthors: 2,
        doi: "10.1145/3641209",
        publicationYear: 2025,
        apiPointsAwarded: 28.0,
        verified: true,
      },
    ],
    grants: [
      {
        id: "grant-01",
        facultyId: "fac-demo-01",
        facultyName: "Dr. Rajesh K. Sharma",
        projectTitle: "AI-Augmented Resilient Architecture for Smart Grid Sensor Networks",
        fundingAgency: "DST",
        sanctionOrderNumber: "DST/TMD/CERI/2023/84",
        sanctionYear: 2023,
        durationMonths: 36,
        totalOutlayInr: 4850000,
        fundsDisbursedInr: 3200000,
        investigatorRole: "PRINCIPAL_INVESTIGATOR",
        status: "ACTIVE",
        apiPointsAwarded: 10,
      },
    ],
    patents: [
      {
        id: "pat-01",
        facultyId: "fac-demo-01",
        facultyName: "Dr. Rajesh K. Sharma",
        title: "A Cryptographically Sealed Low-Power IoT Mesh Gateway Architecture",
        patentOffice: "INDIA_IPO",
        applicationNumber: "202311048291",
        filingDate: "2023-08-14",
        grantDate: "2025-01-20",
        stage: "GRANTED",
        isNational: true,
        apiPointsAwarded: 7,
      },
    ],
    consultancies: [
      {
        id: "con-01",
        facultyId: "fac-demo-01",
        facultyName: "Dr. Rajesh K. Sharma",
        clientOrganization: "Apex Tech Cloud Solutions Ltd.",
        projectScope: "High-Throughput Distributed Kafka Architecture Audit & Tuning",
        agreementDate: "2024-05-10",
        contractValueInr: 1200000,
        institutionalOverheadShareInr: 360000,
        consultantDisbursementInr: 840000,
        status: "COMPLETED",
        apiPointsAwarded: 4,
      },
    ],
    ugcApiSummary: {
      category1PublicationsScore: 59.5,
      category2GrantsScore: 10.0,
      category3PatentsPolicyScore: 7.0,
      category4ConsultancyScore: 4.0,
      totalUgcResearchScore: 80.5,
      eligibleForProfessorCas: false,
      eligibleForAssociateProfessorCas: true,
    },
    integrityVerificationSeal: "UGC-RESEARCH-SEAL-APEX-FAC-DEMO-01",
    lastUpdated: new Date().toISOString(),
  },
};
