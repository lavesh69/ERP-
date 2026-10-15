/**
 * Academic Council & Board of Studies (BoS) Curriculum Governance Engine
 * Module 56: Statutory Curricular Governance & Syllabus Regulations
 */

export type BoSStatus =
  | "DRAFT"
  | "BOS_APPROVED"
  | "ACADEMIC_COUNCIL_RATIFIED"
  | "REFERRED_BACK";

export type ModificationType =
  | "NEW_COURSE"
  | "SYLLABUS_REVISION"
  | "CREDIT_RESTRUCTURE"
  | "COURSE_DEPRECATION";

export interface CourseModification {
  id: string;
  type: ModificationType;
  courseCode: string;
  courseTitle: string;
  credits: number;
  ltpPattern: string; // e.g. "3-0-2" (Lecture-Tutorial-Practical)
  justification: string;
  stakeholderFeedbackRef: string;
  prerequisites?: string;
  syllabusUnitsSummary: string;
}

export interface BoSProposal {
  id: string;
  resolutionNumber: string; // e.g. APEX-BOS-CSE-2026-042
  regulation: string;       // e.g. "Regulation R2026 - AICTE CBCS Scheme"
  department: string;
  chairpersonName: string;
  externalAcademicNominees: string[];
  industryExpertNominee: string;
  alumniNominee: string;
  meetingDate: string;
  status: BoSStatus;
  courseModifications: CourseModification[];
  minutesOfMeetingHash: string;
  ratificationGazetteNumber?: string; // e.g. APEX-AC-GAZETTE-2026-8819
  ratifiedBy?: string;
  ratifiedAt?: string;
  academicCouncilMeetingDate?: string;
  createdAt: string;
}

export interface BoSAnalytics {
  totalProposals: number;
  bosApprovedCount: number;
  ratifiedCount: number;
  pendingCouncilRatification: number;
  newCoursesIntroduced: number;
  coursesRevised: number;
  activeRegulationsCount: number;
}

class BoSGovernanceStore {
  private proposals: BoSProposal[] = [
    {
      id: "BOS-2026-01",
      resolutionNumber: "APEX-BOS-CSE-2026-042",
      regulation: "Regulation R2026 - National Education Policy CBCS",
      department: "Computer Science & Engineering",
      chairpersonName: "Dr. Arvind Swaminathan (HOD, CSE)",
      externalAcademicNominees: [
        "Prof. N. K. Sharma (Professor, Dept of CSE, IIT Bombay)",
        "Prof. Sunita Sundaram (Dean of Academic Courses, IISc Bangalore)",
      ],
      industryExpertNominee: "Rajeshwar Rao (Chief Technology Architect, Infosys Labs)",
      alumniNominee: "Meera Krishnan (Principal Systems Engineer, Google Cloud)",
      meetingDate: "2026-09-18",
      status: "ACADEMIC_COUNCIL_RATIFIED",
      ratificationGazetteNumber: "APEX-AC-GAZETTE-2026-8819",
      ratifiedBy: "Academic Council (Chaired by Prof. V. C. Deshmukh, Vice-Chancellor)",
      ratifiedAt: "2026-09-28T16:45:00Z",
      academicCouncilMeetingDate: "2026-09-28",
      minutesOfMeetingHash: "SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      courseModifications: [
        {
          id: "MOD-101",
          type: "NEW_COURSE",
          courseCode: "CSE-418",
          courseTitle: "Generative AI & Agentic Architectures",
          credits: 4,
          ltpPattern: "3-0-2",
          justification: "Critical industry demand for autonomous multi-agent systems and LLM orchestration under Industry 4.0 mandate.",
          stakeholderFeedbackRef: "Industry Advisory Board Resolution 2026-IAB-09",
          prerequisites: "CSE-301 Data Structures, CSE-312 Deep Learning",
          syllabusUnitsSummary: "Unit I: Transformers & Attention; Unit II: RAG & Vector Embeddings; Unit III: Agentic Protocols; Unit IV: Production Guardrails & Alignment.",
        },
        {
          id: "MOD-102",
          type: "SYLLABUS_REVISION",
          courseCode: "CSE-305",
          courseTitle: "Operating Systems & Concurrency",
          credits: 4,
          ltpPattern: "3-1-0",
          justification: "Modernized syllabus to incorporate Rust memory-safe concurrency primitives alongside POSIX threads.",
          stakeholderFeedbackRef: "Alumni Technical Review 2026-ATR-04",
          prerequisites: "CSE-201 Computer Architecture",
          syllabusUnitsSummary: "Unit I: Kernel Architecture; Unit II: Scheduling; Unit III: Rust Concurrency & Ownership; Unit IV: Distributed File Systems.",
        },
      ],
      createdAt: "2026-09-18T10:00:00Z",
    },
    {
      id: "BOS-2026-02",
      resolutionNumber: "APEX-BOS-ECE-2026-019",
      regulation: "Regulation R2026 - National Education Policy CBCS",
      department: "Electronics & Communication Engineering",
      chairpersonName: "Dr. Sandeep Kulkarni (HOD, ECE)",
      externalAcademicNominees: [
        "Prof. T. Ramalingam (Chair, VLSI Design Lab, IIT Madras)",
      ],
      industryExpertNominee: "Dr. Vivek Anand (Director of Silicon Systems, Qualcomm)",
      alumniNominee: "Gautam Shenoy (Senior ASIC Designer, Apple)",
      meetingDate: "2026-10-02",
      status: "BOS_APPROVED",
      minutesOfMeetingHash: "SHA256:88e2c34293817f8b9e67123aa1283c84792a34891bca7264883921dfbb092312",
      courseModifications: [
        {
          id: "MOD-201",
          type: "NEW_COURSE",
          courseCode: "ECE-442",
          courseTitle: "RISC-V Chip Design & Silicon Verification",
          credits: 4,
          ltpPattern: "3-0-2",
          justification: "National Semiconductor Mission alignment to equip students with open-standard ISA architecture synthesis.",
          stakeholderFeedbackRef: "India Semiconductor Mission Advisory MoU-2026",
          prerequisites: "ECE-302 Digital Electronics",
          syllabusUnitsSummary: "Unit I: RISC-V ISA Fundamentals; Unit II: Chisel & Verilog Pipelines; Unit III: Tape-out Verification; Unit IV: FPGA Prototyping.",
        },
      ],
      createdAt: "2026-10-02T11:30:00Z",
    },
  ];

  public getAllProposals(): BoSProposal[] {
    return [...this.proposals];
  }

  public getProposalById(id: string): BoSProposal | undefined {
    return this.proposals.find((p) => p.id === id);
  }

  public createProposal(params: {
    department: string;
    regulation: string;
    chairpersonName: string;
    externalAcademicNominees: string[];
    industryExpertNominee: string;
    alumniNominee: string;
    meetingDate: string;
  }): BoSProposal {
    const seq = (this.proposals.length + 3).toString().padStart(3, "0");
    const deptPrefix =
      params.department.includes("Computer") || params.department.includes("Computing")
        ? "CSE"
        : params.department.includes("Electronics")
        ? "ECE"
        : "ENG";
    const resNo = `APEX-BOS-${deptPrefix}-2026-${seq}`;

    const newProposal: BoSProposal = {
      id: `BOS-2026-${seq}`,
      resolutionNumber: resNo,
      regulation: params.regulation,
      department: params.department,
      chairpersonName: params.chairpersonName,
      externalAcademicNominees: params.externalAcademicNominees,
      industryExpertNominee: params.industryExpertNominee,
      alumniNominee: params.alumniNominee,
      meetingDate: params.meetingDate,
      status: "DRAFT",
      courseModifications: [],
      minutesOfMeetingHash: `SHA256:${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`,
      createdAt: new Date().toISOString(),
    };

    this.proposals.unshift(newProposal);
    return newProposal;
  }

  public addCourseModification(
    proposalId: string,
    mod: Omit<CourseModification, "id">
  ): BoSProposal {
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("BoS Proposal not found");

    const newMod: CourseModification = {
      ...mod,
      id: `MOD-${Date.now().toString().slice(-4)}`,
    };

    proposal.courseModifications.push(newMod);
    return proposal;
  }

  public approveByBoS(proposalId: string): BoSProposal {
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("BoS Proposal not found");
    if (proposal.courseModifications.length === 0) {
      throw new Error("Cannot approve BoS proposal with 0 curricular modifications");
    }

    proposal.status = "BOS_APPROVED";
    return proposal;
  }

  public ratifyByAcademicCouncil(
    proposalId: string,
    ratifiedBy: string,
    councilMeetingDate: string
  ): BoSProposal {
    const proposal = this.proposals.find((p) => p.id === proposalId);
    if (!proposal) throw new Error("BoS Proposal not found");

    const gazetteNum = Math.floor(1000 + Math.random() * 9000);
    proposal.status = "ACADEMIC_COUNCIL_RATIFIED";
    proposal.ratificationGazetteNumber = `APEX-AC-GAZETTE-2026-${gazetteNum}`;
    proposal.ratifiedBy = ratifiedBy;
    proposal.ratifiedAt = new Date().toISOString();
    proposal.academicCouncilMeetingDate = councilMeetingDate;

    return proposal;
  }

  public getAnalytics(): BoSAnalytics {
    const totalProposals = this.proposals.length;
    const bosApprovedCount = this.proposals.filter((p) => p.status === "BOS_APPROVED").length;
    const ratifiedCount = this.proposals.filter((p) => p.status === "ACADEMIC_COUNCIL_RATIFIED").length;
    const pendingCouncilRatification = bosApprovedCount;

    let newCoursesIntroduced = 0;
    let coursesRevised = 0;
    const regulations = new Set<string>();

    for (const p of this.proposals) {
      regulations.add(p.regulation);
      for (const m of p.courseModifications) {
        if (m.type === "NEW_COURSE") newCoursesIntroduced++;
        if (m.type === "SYLLABUS_REVISION") coursesRevised++;
      }
    }

    return {
      totalProposals,
      bosApprovedCount,
      ratifiedCount,
      pendingCouncilRatification,
      newCoursesIntroduced,
      coursesRevised,
      activeRegulationsCount: regulations.size,
    };
  }
}

export const bosGovernanceEngine = new BoSGovernanceStore();
