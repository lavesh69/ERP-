/**
 * National Academic Depository (NAD) & Academic Bank of Credits (ABC) Engine
 * Implements NEP 2020 APAAR (Automated Permanent Academic Account Registry) ID Validation,
 * UGC 10-Point Credit Calculations, and Digilocker NAD Credit Transfer XML/JSON Manifests.
 */

import crypto from "crypto";

export interface AbcCourseCreditRecord {
  courseCode: string;
  courseTitle: string;
  semester: number;
  courseType: "CORE" | "ELECTIVE" | "LAB" | "INTERNSHIP" | "MOOC_SWAYAM";
  creditsEarned: number;
  letterGrade: "O" | "A+" | "A" | "B+" | "B" | "C" | "P" | "F";
  gradePoints: number; // UGC 10-point scale: O=10, A+=9, A=8, B+=7, B=6, C=5, P=4, F=0
  creditPoints: number; // creditsEarned * gradePoints
  completionYear: number;
  examSession: string; // e.g. "Autumn 2026"
}

export interface ApaarStudentDossier {
  studentId: string;
  studentName: string;
  rollNumber: string;
  admissionNumber: string;
  apaarId: string; // 12-digit national ID
  abcAccountId: string; // e.g. "ABC-IND-98124019"
  institutionCode: string;
  institutionName: string;
  programCode: string;
  programName: string;
  degreeType: string;
  currentSemester: number;
  totalCreditsEarned: number;
  cumulativeGpa: number;
  nadVerificationSeal: string;
  records: AbcCourseCreditRecord[];
  generatedAt: string;
}

export class NadAbcEngine {
  /**
   * Validates 12-digit APAAR National Student ID format
   */
  public static validateApaarId(apaarId: string): { isValid: boolean; normalizedId: string; error?: string } {
    if (!apaarId || typeof apaarId !== "string") {
      return { isValid: false, normalizedId: "", error: "APAAR ID is required" };
    }

    const clean = apaarId.replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(clean)) {
      return {
        isValid: false,
        normalizedId: clean,
        error: "APAAR ID must be exactly 12 numeric digits in compliance with NEP 2020",
      };
    }

    // Format as 4-4-4 grouping (e.g. 2026-9812-4019)
    const formatted = `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
    return { isValid: true, normalizedId: formatted };
  }

  /**
   * Generates a deterministic Academic Bank of Credits (ABC) Account ID from APAAR ID
   */
  public static deriveAbcAccountId(apaarId: string): string {
    const clean = apaarId.replace(/[\s-]/g, "");
    return `ABC-IND-${clean.slice(4, 12)}`;
  }

  /**
   * Converts 100-point scale or percentage to UGC 10-point grade letter and points
   */
  public static calculateUgcGrade(percentage: number): { letterGrade: AbcCourseCreditRecord["letterGrade"]; gradePoints: number } {
    if (percentage >= 90) return { letterGrade: "O", gradePoints: 10 };
    if (percentage >= 80) return { letterGrade: "A+", gradePoints: 9 };
    if (percentage >= 70) return { letterGrade: "A", gradePoints: 8 };
    if (percentage >= 60) return { letterGrade: "B+", gradePoints: 7 };
    if (percentage >= 55) return { letterGrade: "B", gradePoints: 6 };
    if (percentage >= 50) return { letterGrade: "C", gradePoints: 5 };
    if (percentage >= 40) return { letterGrade: "P", gradePoints: 4 };
    return { letterGrade: "F", gradePoints: 0 };
  }

  /**
   * Generates an official APAAR / ABC Credit Transcript Dossier with SHA-256 seal
   */
  public static generateTranscriptDossier(params: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    admissionNumber: string;
    apaarId: string;
    institutionCode?: string;
    institutionName?: string;
    programCode?: string;
    programName?: string;
    degreeType?: string;
    currentSemester?: number;
    courses: Array<{
      code: string;
      title: string;
      semester: number;
      courseType?: "CORE" | "ELECTIVE" | "LAB" | "INTERNSHIP" | "MOOC_SWAYAM";
      credits: number;
      scorePercentage?: number;
      letterGrade?: AbcCourseCreditRecord["letterGrade"];
      completionYear?: number;
      examSession?: string;
    }>;
  }): ApaarStudentDossier {
    const {
      studentId,
      studentName,
      rollNumber,
      admissionNumber,
      apaarId,
      institutionCode = "APEX-UNIV-01",
      institutionName = "Apex University of Science & Technology",
      programCode = "BTECH-CSE",
      programName = "Bachelor of Technology in Computer Science & Engineering",
      degreeType = "Undergraduate (UG)",
      currentSemester = 6,
      courses,
    } = params;

    const validated = this.validateApaarId(apaarId);
    const normalizedApaar = validated.isValid ? validated.normalizedId : "2026-0000-0000";
    const abcAccountId = this.deriveAbcAccountId(normalizedApaar);

    const records: AbcCourseCreditRecord[] = courses.map((c) => {
      let grade = c.letterGrade;
      let points = 0;

      if (!grade && c.scorePercentage != null) {
        const ugc = this.calculateUgcGrade(c.scorePercentage);
        grade = ugc.letterGrade;
        points = ugc.gradePoints;
      } else {
        const pointMap: Record<string, number> = {
          O: 10,
          "A+": 9,
          A: 8,
          "B+": 7,
          B: 6,
          C: 5,
          P: 4,
          F: 0,
        };
        grade = grade || "A";
        points = pointMap[grade] ?? 8;
      }

      return {
        courseCode: c.code,
        courseTitle: c.title,
        semester: c.semester,
        courseType: c.courseType || "CORE",
        creditsEarned: points > 0 ? c.credits : 0,
        letterGrade: grade,
        gradePoints: points,
        creditPoints: (points > 0 ? c.credits : 0) * points,
        completionYear: c.completionYear || 2026,
        examSession: c.examSession || "Spring 2026",
      };
    });

    const totalCredits = records.reduce((sum, r) => sum + r.creditsEarned, 0);
    const totalCreditPoints = records.reduce((sum, r) => sum + r.creditPoints, 0);
    const cumulativeGpa = totalCredits > 0 ? Number((totalCreditPoints / totalCredits).toFixed(2)) : 0.0;

    const verificationSeed = `${normalizedApaar}:${rollNumber}:${totalCredits}:${cumulativeGpa}:${institutionCode}`;
    const hash = crypto.createHash("sha256").update(verificationSeed).digest("hex").slice(0, 16).toUpperCase();
    const nadVerificationSeal = `NAD-ABC-${hash}`;

    return {
      studentId,
      studentName,
      rollNumber,
      admissionNumber,
      apaarId: normalizedApaar,
      abcAccountId,
      institutionCode,
      institutionName,
      programCode,
      programName,
      degreeType,
      currentSemester,
      totalCreditsEarned: totalCredits,
      cumulativeGpa,
      nadVerificationSeal,
      records,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates official National Academic Depository (NAD) XML credit transfer payload
   * for Digilocker integration in accordance with UGC ABC schema v2.0
   */
  public static generateNadDigilockerXml(dossier: ApaarStudentDossier): string {
    const courseNodes = dossier.records
      .map(
        (r) => `    <CourseRecord>
      <CourseCode>${r.courseCode}</CourseCode>
      <CourseTitle>${r.courseTitle}</CourseTitle>
      <Semester>${r.semester}</Semester>
      <CourseType>${r.courseType}</CourseType>
      <CreditsEarned>${r.creditsEarned}</CreditsEarned>
      <GradeLetter>${r.letterGrade}</GradeLetter>
      <GradePoints>${r.gradePoints}</GradePoints>
      <CreditPoints>${r.creditPoints}</CreditPoints>
      <CompletionYear>${r.completionYear}</CompletionYear>
      <ExamSession>${r.examSession}</ExamSession>
    </CourseRecord>`
      )
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<NadAcademicCreditExchange xmlns="http://nad.gov.in/schema/abc/v2" version="2.0">
  <Header>
    <InstitutionCode>${dossier.institutionCode}</InstitutionCode>
    <InstitutionName>${dossier.institutionName}</InstitutionName>
    <Timestamp>${dossier.generatedAt}</Timestamp>
    <VerificationSeal>${dossier.nadVerificationSeal}</VerificationSeal>
  </Header>
  <StudentProfile>
    <ApaarId>${dossier.apaarId}</ApaarId>
    <AbcAccountId>${dossier.abcAccountId}</AbcAccountId>
    <StudentName>${dossier.studentName}</StudentName>
    <RollNumber>${dossier.rollNumber}</RollNumber>
    <AdmissionNumber>${dossier.admissionNumber}</AdmissionNumber>
    <ProgramCode>${dossier.programCode}</ProgramCode>
    <ProgramName>${dossier.programName}</ProgramName>
    <DegreeType>${dossier.degreeType}</DegreeType>
    <CurrentSemester>${dossier.currentSemester}</CurrentSemester>
    <TotalCreditsEarned>${dossier.totalCreditsEarned}</TotalCreditsEarned>
    <CumulativeCGPA>${dossier.cumulativeGpa}</CumulativeCGPA>
  </StudentProfile>
  <CreditRepository>
${courseNodes}
  </CreditRepository>
</NadAcademicCreditExchange>`;
  }

  public static generateDigilockerNadXml(dossier: ApaarStudentDossier): string {
    return this.generateNadDigilockerXml(dossier);
  }
}
