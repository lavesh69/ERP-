import { UserRole, RoleConfig } from "@/types/auth";
import { ROLE_CONFIGS } from "./roles";
import { PermissionCode, hasPermission as baseHasPermission } from "./permissions";

/**
 * Functional Domain Categories
 */
export type ModuleDomain =
  | "ACADEMIC"
  | "FINANCE"
  | "ADMINISTRATION"
  | "HR_PAYROLL"
  | "FACILITIES"
  | "GOVERNANCE"
  | "RESEARCH_INCUBATION"
  | "STUDENT_LIFE"
  | "SYSTEM";

/**
 * Metadata definition for an ERP Module
 */
export interface ModuleDefinition {
  id: string;
  name: string;
  path: string;
  domain: ModuleDomain;
  description: string;
  iconName: string;
  badge?: string;
  allowedRoles: readonly UserRole[];
  minRoleLevel?: number;
}

/**
 * Complete Module Registry covering all 52 ERP Application Routes
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  // --- ACADEMIC DOMAIN ---
  "/students": {
    id: "students",
    name: "Students SIS Directory",
    path: "/students",
    domain: "ACADEMIC",
    description: "Student Information System, demographics, enrollment records, and directory",
    iconName: "GraduationCap",
    badge: "SIS",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
    ],
  },
  "/students/profile": {
    id: "student-profile",
    name: "Student 360 Self-Service",
    path: "/students/profile",
    domain: "STUDENT_LIFE",
    description: "Personal academic record, enrolled courses, attendance, and petitions",
    iconName: "UserCheck",
    allowedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "STUDENT", "FACULTY", "CLASS_TEACHER"],
  },
  "/faculty": {
    id: "faculty",
    name: "Faculty Roster & Workload",
    path: "/faculty",
    domain: "ACADEMIC",
    description: "Faculty directory, departmental workload, and subject allotments",
    iconName: "Users",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "HR_STAFF",
      "RESEARCH_COORDINATOR",
    ],
  },
  "/faculty/profile": {
    id: "faculty-profile",
    name: "Faculty Self-Service",
    path: "/faculty/profile",
    domain: "ACADEMIC",
    description: "Personal teaching schedule, leave balance, and publications portfolio",
    iconName: "UserCheck",
    allowedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "FACULTY", "HOD", "PRINCIPAL"],
  },
  "/lms": {
    id: "lms",
    name: "Learning Management System",
    path: "/lms",
    domain: "ACADEMIC",
    description: "Course syllabus, lecture notes, video repository, and online quizzes",
    iconName: "BookOpen",
    badge: "Live",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
    ],
  },
  "/attendance": {
    id: "attendance",
    name: "Biometric & Class Attendance",
    path: "/attendance",
    domain: "ACADEMIC",
    description: "Daily period attendance, biometric RFID sync, and defaulter tracking",
    iconName: "CheckSquare",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "HR_STAFF",
      "STUDENT",
      "PARENT",
    ],
  },
  "/timetable": {
    id: "timetable",
    name: "Academic Timetable & Rooms",
    path: "/timetable",
    domain: "ACADEMIC",
    description: "Conflict-free class schedule matrix and room space utilization",
    iconName: "Calendar",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "EXAMINATION_CONTROLLER",
      "HR_STAFF",
      "STUDENT",
    ],
  },
  "/assignments": {
    id: "assignments",
    name: "Assignment Submission & Rubrics",
    path: "/assignments",
    domain: "ACADEMIC",
    description: "Homework distribution, digital submissions, and grading rubrics",
    iconName: "FileText",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
    ],
  },
  "/examinations": {
    id: "examinations",
    name: "Exams, Hall Tickets & Grading",
    path: "/examinations",
    domain: "ACADEMIC",
    description: "Question papers, exam schedules, grading curves, and GPA transcripts",
    iconName: "Award",
    badge: "GPA",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
    ],
  },
  "/feedback": {
    id: "feedback",
    name: "Course & Faculty Feedback",
    path: "/feedback",
    domain: "ACADEMIC",
    description: "Student evaluation of teaching (SET) and NAAC Criterion II surveys",
    iconName: "MessageSquareHeart",
    badge: "SET",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "EXAMINATION_CONTROLLER",
    ],
  },

  // --- FINANCE DOMAIN ---
  "/finance": {
    id: "finance",
    name: "Bursar Fees & Treasury",
    path: "/finance",
    domain: "FINANCE",
    description: "Tuition collection, bank reconciliation, challans, and fee structures",
    iconName: "CreditCard",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "ACCOUNTANT",
      "STUDENT",
      "PARENT",
    ],
  },
  "/scholarships": {
    id: "scholarships",
    name: "Scholarships & Financial Aid",
    path: "/scholarships",
    domain: "FINANCE",
    description: "Merit-cum-means assistance, government stipends, and endowments",
    iconName: "Gift",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "ACCOUNTANT",
      "STUDENT",
    ],
  },

  // --- ADMINISTRATION & GOVERNANCE ---
  "/admin": {
    id: "admin",
    name: "Super Admin Infrastructure",
    path: "/admin",
    domain: "SYSTEM",
    description: "Multi-tenant configuration, platform metrics, and root system security",
    iconName: "ShieldAlert",
    badge: "Root",
    allowedRoles: ["SUPER_ADMIN"],
  },
  "/institution": {
    id: "institution",
    name: "Institution & Campus Settings",
    path: "/institution",
    domain: "ADMINISTRATION",
    description: "Campus branches, academic sessions, semester rollover, and quotas",
    iconName: "Building2",
    allowedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PRINCIPAL", "HOD", "GUEST"],
  },
  "/analytics": {
    id: "analytics",
    name: "Institutional Analytics & BI",
    path: "/analytics",
    domain: "ADMINISTRATION",
    description: "Predictive student retention, financial cashflows, and executive BI",
    iconName: "BarChart3",
    badge: "BI",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
    ],
  },
  "/documents": {
    id: "documents",
    name: "Digital Document Vault",
    path: "/documents",
    domain: "ADMINISTRATION",
    description: "Cryptographically verified university records and certificates",
    iconName: "FolderLock",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
      "ALUMNI",
    ],
  },
  "/communication": {
    id: "communication",
    name: "Omnichannel Communications",
    path: "/communication",
    domain: "ADMINISTRATION",
    description: "Official university circulars, SMS broadcasts, and announcements",
    iconName: "Bell",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "PARENT",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
      "ALUMNI",
    ],
  },
  "/accreditation": {
    id: "accreditation",
    name: "Accreditation IQAC (NAAC/NBA)",
    path: "/accreditation",
    domain: "GOVERNANCE",
    description: "NAAC 7-Criteria radar analysis, NBA outcomes, and SSR documentary repository",
    iconName: "Award",
    badge: "NAAC",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "RESEARCH_COORDINATOR",
      "EXAMINATION_CONTROLLER",
    ],
  },
  "/compliance": {
    id: "compliance",
    name: "Proctorial & Anti-Ragging",
    path: "/compliance",
    domain: "GOVERNANCE",
    description: "UGC / AICTE regulatory compliance, anti-ragging squad, and affidavits",
    iconName: "ShieldAlert",
    badge: "Statutory",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "PARENT",
      "HR_STAFF",
    ],
  },
  "/grievances": {
    id: "grievances",
    name: "Grievances & POSH Redressal",
    path: "/grievances",
    domain: "GOVERNANCE",
    description: "Statutory grievance cell, POSH committee, and 15-day SLA hearing logs",
    iconName: "Scale",
    badge: "UGC",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "PARENT",
      "HR_STAFF",
    ],
  },

  // --- HR & PAYROLL DOMAIN ---
  "/hr": {
    id: "hr",
    name: "HR, Staff Leaves & 7th CPC",
    path: "/hr",
    domain: "HR_PAYROLL",
    description: "Faculty service book, leave management, and 7th CPC payroll processing",
    iconName: "Briefcase",
    badge: "HRMS",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "HR_STAFF",
      "ACCOUNTANT",
      "FACULTY",
    ],
  },

  // --- FACILITIES & CAMPUS OPERATIONS ---
  "/library": {
    id: "library",
    name: "Library Science ERP",
    path: "/library",
    domain: "FACILITIES",
    description: "OPAC catalog, RFID circulation, ISBN loans, and e-journal subscriptions",
    iconName: "Library",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "LIBRARIAN",
      "FACULTY",
      "STUDENT",
      "ALUMNI",
      "GUEST",
    ],
  },
  "/hostel": {
    id: "hostel",
    name: "Residential Halls & Housing",
    path: "/hostel",
    domain: "FACILITIES",
    description: "Hostel room allocation, mess billing, rebate claims, and gate outpasses",
    iconName: "Bed",
    badge: "Dorm",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "PARENT",
      "HR_STAFF",
    ],
  },
  "/transport": {
    id: "transport",
    name: "Fleet Logistics & Bus Routes",
    path: "/transport",
    domain: "FACILITIES",
    description: "GPS bus tracking, stop scheduling, and driver statutory compliance",
    iconName: "Bus",
    badge: "GPS",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "PARENT",
      "HR_STAFF",
    ],
  },
  "/canteen": {
    id: "canteen",
    name: "Canteen & Smart POS",
    path: "/canteen",
    domain: "FACILITIES",
    description: "Digital food ordering, contactless meal tokens, and kitchen inventory",
    iconName: "UtensilsCrossed",
    badge: "RFID",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "PARENT",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
      "ALUMNI",
      "GUEST",
    ],
  },
  "/clinic": {
    id: "clinic",
    name: "Campus Health & Infirmary",
    path: "/clinic",
    domain: "FACILITIES",
    description: "OPD patient triage, doctor appointments, emergency bed care, and pharmacy",
    iconName: "HeartPulse",
    badge: "OPD",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "PARENT",
      "HR_STAFF",
    ],
  },
  "/security": {
    id: "security",
    name: "Gate Security & Visitor Access",
    path: "/security",
    domain: "FACILITIES",
    description: "Vehicle ANPR logging, visitor digital gate passes, and perimeter checks",
    iconName: "ShieldCheck",
    badge: "Passes",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "HR_STAFF",
      "FACULTY",
      "GUEST",
      "PARENT",
    ],
  },
  "/inventory": {
    id: "inventory",
    name: "Central Store & Capital Assets",
    path: "/inventory",
    domain: "FACILITIES",
    description: "Fixed asset register, department indents, purchase orders, and stock audits",
    iconName: "Boxes",
    badge: "Assets",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "ACCOUNTANT",
      "LIBRARIAN",
      "FACULTY",
      "HR_STAFF",
    ],
  },
  "/store": {
    id: "store",
    name: "Stationery & Exam Store",
    path: "/store",
    domain: "FACILITIES",
    description: "Answer booklet dispatch, stationery requisitions, and inventory issue",
    iconName: "Package",
    badge: "Store",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "ACCOUNTANT",
      "EXAMINATION_CONTROLLER",
    ],
  },
  "/estate": {
    id: "estate",
    name: "Estate Works & Maintenance",
    path: "/estate",
    domain: "FACILITIES",
    description: "Civil/electrical work orders, statutory SLA tracking, and BOQ estimates",
    iconName: "Wrench",
    badge: "Works",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "ACCOUNTANT",
      "HR_STAFF",
    ],
  },
  "/guesthouse": {
    id: "guesthouse",
    name: "University Guest House",
    path: "/guesthouse",
    domain: "FACILITIES",
    description: "VIP suite reservations, visiting examiner accommodation, and billing",
    iconName: "Hotel",
    badge: "Transit",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "ACCOUNTANT",
      "HR_STAFF",
      "GUEST",
    ],
  },
  "/emergency": {
    id: "emergency",
    name: "Emergency EOC & Crisis SOS",
    path: "/emergency",
    domain: "FACILITIES",
    description: "One-touch emergency siren broadcasts, muster logs, and crisis protocols",
    iconName: "Siren",
    badge: "SOS",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "PARENT",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
      "ALUMNI",
      "GUEST",
    ],
  },

  // --- RESEARCH & INNOVATION ---
  "/research": {
    id: "research",
    name: "Research Grants & Patents",
    path: "/research",
    domain: "RESEARCH_INCUBATION",
    description: "Sponsored research projects, grant drawdowns, and patent filings",
    iconName: "FlaskConical",
    badge: "NSF",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "RESEARCH_COORDINATOR",
    ],
  },
  "/cif": {
    id: "cif",
    name: "Central Instrumentation (CIF)",
    path: "/cif",
    domain: "RESEARCH_INCUBATION",
    description: "Advanced analytical instrument slot bookings (NMR, SEM, XRD, HPLC)",
    iconName: "Microscope",
    badge: "CIF",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "RESEARCH_COORDINATOR",
    ],
  },
  "/incubation": {
    id: "incubation",
    name: "Venture Incubator & TBI",
    path: "/incubation",
    domain: "RESEARCH_INCUBATION",
    description: "Student/faculty startups, seed funding, mentor connect, and milestone reviews",
    iconName: "Rocket",
    badge: "AIC",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "ALUMNI",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
    ],
  },

  // --- STUDENT LIFE & GLOBAL RELATIONS ---
  "/careers": {
    id: "careers",
    name: "Career Services & Campus Placements",
    path: "/careers",
    domain: "STUDENT_LIFE",
    description: "Corporate recruitment drives, candidate shortlisting, and job offers",
    iconName: "Briefcase",
    badge: "ATS",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PLACEMENT_OFFICER",
      "STUDENT",
      "ALUMNI",
    ],
  },
  "/alumni": {
    id: "alumni",
    name: "Alumni Relations & Mentorship",
    path: "/alumni",
    domain: "STUDENT_LIFE",
    description: "Alumni network, mentoring connections, and alma mater endowments",
    iconName: "GraduationCap",
    badge: "Network",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PLACEMENT_OFFICER",
      "STUDENT",
      "ALUMNI",
      "FACULTY",
    ],
  },
  "/events": {
    id: "events",
    name: "Campus Venues & Reservations",
    path: "/events",
    domain: "STUDENT_LIFE",
    description: "Auditorium & seminar hall booking, audiovisual setup, and campus calendar",
    iconName: "CalendarDays",
    badge: "Venues",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "ALUMNI",
    ],
  },
  "/clubs": {
    id: "clubs",
    name: "Student Clubs & 100-Point Portal",
    path: "/clubs",
    domain: "STUDENT_LIFE",
    description: "Student clubs, activity points accreditation, and cultural events",
    iconName: "Compass",
    badge: "Points",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
    ],
  },
  "/convocation": {
    id: "convocation",
    name: "Convocation & Degree Conferral",
    path: "/convocation",
    domain: "STUDENT_LIFE",
    description: "No-dues clearance verification, gown distribution, and degree honors",
    iconName: "GraduationCap",
    badge: "Degree",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "ALUMNI",
      "EXAMINATION_CONTROLLER",
      "ACCOUNTANT",
      "LIBRARIAN",
      "PLACEMENT_OFFICER",
    ],
  },
  "/international": {
    id: "international",
    name: "International Relations (IRO)",
    path: "/international",
    domain: "STUDENT_LIFE",
    description: "Global university MoUs, study abroad exchange, and FRRO visa tracking",
    iconName: "Globe2",
    badge: "MoU",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "STUDENT",
      "RESEARCH_COORDINATOR",
    ],
  },
  "/admissions": {
    id: "admissions",
    name: "Admissions CRM & Enrollment",
    path: "/admissions",
    domain: "ADMINISTRATION",
    description: "Inquiry pipeline, entrance test ranks, seat counseling, and quotas",
    iconName: "UserPlus",
    badge: "CRM",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "ACCOUNTANT",
      "HR_STAFF",
    ],
  },
  "/parent": {
    id: "parent",
    name: "Parent & Guardian Portal",
    path: "/parent",
    domain: "STUDENT_LIFE",
    description: "Ward attendance telemetry, fee invoices, grades, and faculty appointments",
    iconName: "HeartHandshake",
    badge: "Guardian",
    allowedRoles: ["SUPER_ADMIN", "INSTITUTION_ADMIN", "PARENT"],
  },
  "/profile": {
    id: "profile",
    name: "My Profile & Identity Security",
    path: "/profile",
    domain: "SYSTEM",
    description: "User profile, two-factor authentication, sessions, and preferences",
    iconName: "UserCheck",
    allowedRoles: [
      "SUPER_ADMIN",
      "INSTITUTION_ADMIN",
      "PRINCIPAL",
      "HOD",
      "FACULTY",
      "CLASS_TEACHER",
      "STUDENT",
      "PARENT",
      "ACCOUNTANT",
      "LIBRARIAN",
      "EXAMINATION_CONTROLLER",
      "PLACEMENT_OFFICER",
      "RESEARCH_COORDINATOR",
      "HR_STAFF",
      "ALUMNI",
      "GUEST",
    ],
  },
};

/**
 * Checks whether a given role has access to a specific route or module ID
 */
export function hasModuleAccess(role: UserRole, pathOrId: string): boolean {
  // Normalize path
  let normalizedPath = pathOrId.startsWith("/") ? pathOrId : `/${pathOrId}`;
  
  // Strip sub-routes and queries: e.g. /students/123 -> /students
  const matchedModuleKey = Object.keys(MODULE_REGISTRY).find((key) => {
    if (normalizedPath === key) return true;
    if (normalizedPath.startsWith(`${key}/`)) return true;
    return false;
  });

  if (!matchedModuleKey) {
    // If not in registry, check default root
    if (normalizedPath === "/" || normalizedPath === "") return true;
    return false;
  }

  const moduleDef = MODULE_REGISTRY[matchedModuleKey];
  return moduleDef.allowedRoles.includes(role);
}

/**
 * Returns all accessible modules for a given role, sorted by domain
 */
export function getAllowedModulesForRole(role: UserRole): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY).filter((moduleDef) =>
    moduleDef.allowedRoles.includes(role)
  );
}

/**
 * Returns role-based default dashboard landing path
 */
export function getRoleDashboardPath(role: UserRole): string {
  const config = ROLE_CONFIGS[role];
  if (config && config.dashboardPath) {
    return config.dashboardPath;
  }
  switch (role) {
    case "STUDENT":
      return "/students/profile";
    case "PARENT":
      return "/parent";
    case "ACCOUNTANT":
      return "/finance";
    case "LIBRARIAN":
      return "/library";
    case "EXAMINATION_CONTROLLER":
      return "/examinations";
    case "PLACEMENT_OFFICER":
      return "/careers";
    case "RESEARCH_COORDINATOR":
      return "/research";
    case "HR_STAFF":
      return "/hr";
    case "GUEST":
      return "/institution";
    default:
      return "/";
  }
}

/**
 * Granular Role Feature Action Capabilities
 */
export interface RoleCapabilities {
  canCreateStudents: boolean;
  canEditStudents: boolean;
  canDeleteStudents: boolean;
  canMarkAttendance: boolean;
  canAuditAttendance: boolean;
  canGradeAssignments: boolean;
  canSubmitAssignments: boolean;
  canPublishResults: boolean;
  canCurveGrades: boolean;
  canCollectFees: boolean;
  canManageFeeStructures: boolean;
  canDisbursePayroll: boolean;
  canApproveLeaves: boolean;
  canAllocateHostelBeds: boolean;
  canManageTransportFleet: boolean;
  canManageLibraryCatalog: boolean;
  canManageCentralStore: boolean;
  canApproveWorkOrders: boolean;
  canManageGateSecurity: boolean;
  canTriggerPanicAlert: boolean;
  canApproveGrants: boolean;
  canManagePlacements: boolean;
  canAccessAccreditationSSR: boolean;
}

export function getRoleCapabilities(role: UserRole): RoleCapabilities {
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isInstAdmin = role === "INSTITUTION_ADMIN" || isSuperAdmin;
  const isPrincipal = role === "PRINCIPAL" || isInstAdmin;
  const isHOD = role === "HOD" || isPrincipal;
  const isFaculty = role === "FACULTY" || isHOD;
  const isStudent = role === "STUDENT";
  const isAccountant = role === "ACCOUNTANT" || isInstAdmin;
  const isLibrarian = role === "LIBRARIAN" || isInstAdmin;
  const isCoE = role === "EXAMINATION_CONTROLLER" || isInstAdmin;
  const isHR = role === "HR_STAFF" || isInstAdmin;
  const isPlacement = role === "PLACEMENT_OFFICER" || isInstAdmin;
  const isResearch = role === "RESEARCH_COORDINATOR" || isPrincipal;

  return {
    canCreateStudents: isInstAdmin,
    canEditStudents: isInstAdmin || isHOD,
    canDeleteStudents: isSuperAdmin,
    canMarkAttendance: isFaculty || role === "CLASS_TEACHER",
    canAuditAttendance: isHOD || isPrincipal || isHR,
    canGradeAssignments: isFaculty || role === "CLASS_TEACHER",
    canSubmitAssignments: isStudent,
    canPublishResults: isCoE || isPrincipal,
    canCurveGrades: isCoE,
    canCollectFees: isAccountant,
    canManageFeeStructures: isAccountant || isInstAdmin,
    canDisbursePayroll: isAccountant || isHR,
    canApproveLeaves: isHOD || isPrincipal || isHR,
    canAllocateHostelBeds: isInstAdmin || role === "FACULTY", // Wardens
    canManageTransportFleet: isInstAdmin,
    canManageLibraryCatalog: isLibrarian,
    canManageCentralStore: isAccountant || isInstAdmin,
    canApproveWorkOrders: isInstAdmin || isPrincipal,
    canManageGateSecurity: isHR || isInstAdmin,
    canTriggerPanicAlert: isInstAdmin || isPrincipal || isHR,
    canApproveGrants: isResearch || isPrincipal,
    canManagePlacements: isPlacement,
    canAccessAccreditationSSR: isFaculty || isHOD || isPrincipal || isInstAdmin,
  };
}
