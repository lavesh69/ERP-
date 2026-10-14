/**
 * Faculty Academic Workload, 200-Point Roster & Honorarium Engine
 * Implements DoPT 200-Point Reservation Roster, UGC 2018 Table 3A Screening Matrix,
 * Ad-Hoc/Guest Faculty Per-Lecture Honorarium, and Examination Duty Remuneration.
 */

export type RosterCategory = "UR" | "SC" | "ST" | "OBC" | "EWS";

export interface RosterSlot {
  rosterPoint: number;
  category: RosterCategory;
  isReserved: boolean;
}

export interface UgcTable3ACandidate {
  candidateId: string;
  candidateName: string;
  graduationPercentage: number;
  postGraduationPercentage: number;
  hasMPhil: boolean;
  mPhilPercentage?: number;
  hasPhd: boolean;
  hasNetJrf: boolean;
  hasNetOnly: boolean;
  hasSletSet: boolean;
  peerReviewedPublicationsCount: number;
  teachingExperienceYears: number;
  hasNationalInternationalAward: boolean;
  hasStateAward: boolean;
}

export interface UgcTable3AScreeningResult {
  candidateId: string;
  candidateName: string;
  graduationScore: number;     // Max 15
  postGraduationScore: number; // Max 25
  mPhilScore: number;          // Max 07
  phdScore: number;            // 30
  netJrfScore: number;         // Max 07
  publicationsScore: number;   // Max 10
  experienceScore: number;     // Max 10
  awardsScore: number;         // Max 03
  totalAcademicScore: number;  // Max 100
  isShortlistedForInterview: boolean; // Typically >= 50 or top rank
  criteriaSummary: string;
}

export interface GuestLectureClaim {
  id: string;
  facultyName: string;
  facultyEmail: string;
  courseCode: string;
  department: string;
  lecturesDelivered: number;
  ratePerLecture?: number; // Default ₹1,500
  payPeriod: string;
}

export interface ExamDutyClaim {
  facultyName: string;
  scriptsEvaluated?: number;     // ₹30/script
  questionPapersSet?: number;    // ₹2,500/paper
  practicalExamDays?: number;    // ₹1,500/day
  centerSuperintendentDays?: number; // ₹1,000/day
  taDaAllowance?: number;
}

export class FacultyWorkloadHonorariumEngine {
  public static readonly GUEST_LECTURE_DEFAULT_RATE = 1500;
  public static readonly GUEST_LECTURE_MONTHLY_CEILING = 50000;

  // Standard DoPT 200-Point cycle distribution pattern for Central Institutions
  // SC: 15% (30 points), ST: 7.5% (15 points), OBC: 27% (54 points), EWS: 10% (20 points), UR: 40.5% (81 points)
  public static get200PointRosterCategory(point: number): RosterCategory {
    const p = ((point - 1) % 200) + 1;

    // Standard statutory cycle mapping
    const scPoints = new Set([
      1, 8, 14, 21, 28, 36, 43, 50, 56, 63, 70, 78, 85, 92, 100,
      107, 114, 121, 128, 136, 143, 150, 156, 163, 170, 178, 185, 192, 198, 200,
    ]);
    const stPoints = new Set([
      4, 17, 31, 44, 58, 71, 84, 98, 111, 125, 138, 151, 165, 179, 193,
    ]);
    const ewsPoints = new Set([
      10, 20, 30, 40, 50, 60, 70, 80, 90, 101, 110, 120, 130, 140, 152, 160, 171, 180, 190, 199,
    ]);
    const obcPoints = new Set([
      3, 7, 11, 15, 19, 23, 27, 32, 35, 39, 42, 47, 51, 55, 59, 62, 67, 72, 75, 79,
      83, 87, 91, 95, 99, 103, 108, 112, 115, 119, 123, 127, 131, 135, 139, 144, 147, 153, 157, 161,
      166, 169, 173, 177, 182, 186, 189, 194, 197,
    ]);

    if (scPoints.has(p)) return "SC";
    if (stPoints.has(p)) return "ST";
    if (ewsPoints.has(p)) return "EWS";
    if (obcPoints.has(p)) return "OBC";
    return "UR";
  }

  /**
   * Audit 200-point roster cadre backlog and determine category for next recruitment vacancy
   */
  public static auditRosterStatus(currentCadreSize: number) {
    const nextRosterPoint = currentCadreSize + 1;
    const designatedCategory = this.get200PointRosterCategory(nextRosterPoint);

    const rosterTable: RosterSlot[] = [];
    for (let i = 1; i <= Math.min(200, Math.max(20, nextRosterPoint + 5)); i++) {
      const cat = this.get200PointRosterCategory(i);
      rosterTable.push({
        rosterPoint: i,
        category: cat,
        isReserved: cat !== "UR",
      });
    }

    return {
      currentFilledPosts: currentCadreSize,
      nextRosterPoint,
      designatedCategoryForNextPost: designatedCategory,
      isNextPostReserved: designatedCategory !== "UR",
      rosterCycle: Math.floor(currentCadreSize / 200) + 1,
      rosterPreview: rosterTable,
    };
  }

  /**
   * Evaluate UGC Regulations 2018 Table 3A Screening Scorecard for Assistant Professor direct recruitment
   */
  public static evaluateUgcTable3AScorecard(candidate: UgcTable3ACandidate): UgcTable3AScreeningResult {
    // 1. Graduation (Max 15)
    let gradScore = 0;
    if (candidate.graduationPercentage >= 80) gradScore = 15;
    else if (candidate.graduationPercentage >= 60) gradScore = 13;
    else if (candidate.graduationPercentage >= 55) gradScore = 10;
    else if (candidate.graduationPercentage >= 45) gradScore = 5;

    // 2. Post-Graduation (Max 25)
    let pgScore = 0;
    if (candidate.postGraduationPercentage >= 80) pgScore = 25;
    else if (candidate.postGraduationPercentage >= 60) pgScore = 23;
    else if (candidate.postGraduationPercentage >= 55) pgScore = 20;

    // 3. M.Phil (Max 07)
    let mPhilScore = 0;
    if (candidate.hasMPhil) {
      mPhilScore = (candidate.mPhilPercentage || 60) >= 60 ? 7 : 5;
    }

    // 4. Ph.D. (30)
    const phdScore = candidate.hasPhd ? 30 : 0;

    // 5. NET with JRF (07) / NET (05) / SLET (03)
    let netScore = 0;
    if (candidate.hasNetJrf) netScore = 7;
    else if (candidate.hasNetOnly) netScore = 5;
    else if (candidate.hasSletSet) netScore = 3;

    // Combined cap: M.Phil + Ph.D. maximum 30 marks
    const academicQualificationCap = Math.min(30, mPhilScore + phdScore);

    // Combined cap: JRF/NET/SET maximum 7 marks
    const netCap = Math.min(7, netScore);

    // 6. Research Publications (2 marks for each publication, Max 10)
    const publicationsScore = Math.min(10, candidate.peerReviewedPublicationsCount * 2);

    // 7. Teaching / Post Doctoral Experience (2 marks for one year each, Max 10)
    const experienceScore = Math.min(10, Math.floor(candidate.teachingExperienceYears) * 2);

    // 8. Awards (International/National 03, State 02, Max 03)
    let awardsScore = 0;
    if (candidate.hasNationalInternationalAward) awardsScore = 3;
    else if (candidate.hasStateAward) awardsScore = 2;

    const totalAcademicScore =
      gradScore +
      pgScore +
      academicQualificationCap +
      netCap +
      publicationsScore +
      experienceScore +
      awardsScore;

    return {
      candidateId: candidate.candidateId,
      candidateName: candidate.candidateName,
      graduationScore: gradScore,
      postGraduationScore: pgScore,
      mPhilScore,
      phdScore,
      netJrfScore: netScore,
      publicationsScore,
      experienceScore,
      awardsScore,
      totalAcademicScore,
      isShortlistedForInterview: totalAcademicScore >= 50,
      criteriaSummary: `Grad: ${gradScore}/15, PG: ${pgScore}/25, Ph.D/M.Phil: ${academicQualificationCap}/30, NET: ${netCap}/7, Pubs: ${publicationsScore}/10, Exp: ${experienceScore}/10, Awards: ${awardsScore}/3. Total: ${totalAcademicScore}/100.`,
    };
  }

  /**
   * Compute Guest / Ad-hoc Faculty Per-Lecture Honorarium Bill under UGC circular
   */
  public static computeGuestLectureHonorarium(claim: GuestLectureClaim) {
    const rate = claim.ratePerLecture || this.GUEST_LECTURE_DEFAULT_RATE;
    const rawTotal = claim.lecturesDelivered * rate;
    const billPayable = Math.min(rawTotal, this.GUEST_LECTURE_MONTHLY_CEILING);
    const ceilingExceeded = rawTotal > this.GUEST_LECTURE_MONTHLY_CEILING;

    return {
      claimId: claim.id,
      facultyName: claim.facultyName,
      facultyEmail: claim.facultyEmail,
      courseCode: claim.courseCode,
      department: claim.department,
      payPeriod: claim.payPeriod,
      lecturesDelivered: claim.lecturesDelivered,
      ratePerLecture: rate,
      rawAmountClaimed: rawTotal,
      billPayable,
      ceilingExceeded,
      statutoryRemarks: ceilingExceeded
        ? `Capped at UGC monthly honorarium ceiling of ₹${this.GUEST_LECTURE_MONTHLY_CEILING.toLocaleString()}.`
        : "Bill verified within UGC approved ceiling.",
    };
  }

  /**
   * Compute Examination Branch Remuneration for paper evaluations, setters, and practical examiners
   */
  public static computeExamDutyRemuneration(claim: ExamDutyClaim) {
    const scriptRate = 30; // ₹30/script
    const paperSetRate = 2500; // ₹2,500/paper
    const practicalDayRate = 1500; // ₹1,500/day
    const superintendentDayRate = 1000; // ₹1,000/day

    const scriptTotal = (claim.scriptsEvaluated || 0) * scriptRate;
    const paperSetTotal = (claim.questionPapersSet || 0) * paperSetRate;
    const practicalTotal = (claim.practicalExamDays || 0) * practicalDayRate;
    const superintendentTotal = (claim.centerSuperintendentDays || 0) * superintendentDayRate;
    const taDa = claim.taDaAllowance || 0;

    const grandTotal = scriptTotal + paperSetTotal + practicalTotal + superintendentTotal + taDa;

    return {
      facultyName: claim.facultyName,
      scriptsEvaluated: claim.scriptsEvaluated || 0,
      scriptTotal,
      questionPapersSet: claim.questionPapersSet || 0,
      paperSetTotal,
      practicalExamDays: claim.practicalExamDays || 0,
      practicalTotal,
      centerSuperintendentDays: claim.centerSuperintendentDays || 0,
      superintendentTotal,
      taDaAllowance: taDa,
      grandTotalRemuneration: grandTotal,
      voucherGeneratedAt: new Date().toISOString(),
    };
  }

  /**
   * Verify Ph.D. Research Guide Quota Compliance under UGC Minimum Standards Regulations
   */
  public static checkPhdGuideQuota(designation: "PROFESSOR" | "ASSOCIATE_PROFESSOR" | "ASSISTANT_PROFESSOR", currentlyGuidingCount: number) {
    let maxQuota = 4;
    if (designation === "PROFESSOR") maxQuota = 8;
    else if (designation === "ASSOCIATE_PROFESSOR") maxQuota = 6;

    const canAdmitMore = currentlyGuidingCount < maxQuota;
    const remainingSlots = Math.max(0, maxQuota - currentlyGuidingCount);

    return {
      designation,
      maxStatutoryQuota: maxQuota,
      currentlyGuidingCount,
      remainingSlots,
      canAdmitMoreScholars: canAdmitMore,
      complianceStatus: canAdmitMore ? "COMPLIANT" : "QUOTA_FULL",
    };
  }
}
