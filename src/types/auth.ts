export type UserRole =
  | "SUPER_ADMIN"
  | "INSTITUTION_ADMIN"
  | "PRINCIPAL"
  | "HOD"
  | "FACULTY"
  | "CLASS_TEACHER"
  | "STUDENT"
  | "PARENT"
  | "ACCOUNTANT"
  | "LIBRARIAN"
  | "EXAMINATION_CONTROLLER"
  | "PLACEMENT_OFFICER"
  | "RESEARCH_COORDINATOR"
  | "HR_STAFF"
  | "ALUMNI"
  | "GUEST";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name?: string;
  role: UserRole;
  institutionId: string;
  institutionName: string;
  campusId?: string;
  departmentId?: string;
  avatarUrl?: string;
  studentId?: string;
  facultyId?: string;
  parentId?: string;
}

export interface RoleConfig {
  role: UserRole;
  displayName: string;
  description: string;
  badgeColor: string;
  dashboardPath: string;
  allowedNav: string[];
}
