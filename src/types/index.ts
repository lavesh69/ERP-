export type UserRole = 
  | "SUPER_ADMIN" 
  | "INSTITUTION_ADMIN" 
  | "FACULTY" 
  | "STUDENT" 
  | "PARENT" 
  | "GUEST";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  providerId: string;
  institutionId: string;
  institutionName: string;
  createdAt: string;
  lastLoginAt: string;
  isTestUser?: boolean;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  department: string;
  facultyName: string;
  semester: string;
  enrolledCount: number;
  instructor?: string;
  room?: string;
  schedule?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek?: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY";
  startTime?: string;
  endTime?: string;
  courseCode: string;
  courseTitle?: string;
  courseName?: string;
  roomName?: string;
  room?: string;
  facultyName?: string;
  instructor?: string;
  sectionName?: string;
  day?: string;
  time?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: "ACADEMIC" | "CAMPUS" | "EXAM" | "URGENT";
  author: string;
  createdAt: string;
  priority?: "normal" | "important" | "urgent";
}
