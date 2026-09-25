# TEACHER / FACULTY MODULE — TECHNICAL & WORKFLOW SPECIFICATION

## 1. Executive Summary

The **Teacher / Faculty Module** in Classroom ERP is engineered to deliver a comprehensive, enterprise-grade academic lifecycle command center. It unifies daily instructional workflows, continuous assessment, dynamic biometric and manual attendance recording, accredited curriculum progression, and student petition resolution into a single responsive, database-driven interface.

---

## 2. Core Architecture & Information Map

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TEACHER COMMAND WORKSPACE                       │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│  DAILY SCHEDULE  │  ACTIVE ROSTERS  │ ASSIGNMENT DESK │ SYLLABUS % LMS │
│  - Room Alloc.   │  - Course Enr.   │ - Submissions   │ - Unit Outlines│
│  - Timetable API │  - Attendance %  │ - Rubric Grading│ - Upload Decks │
├──────────────────┴──────────────────┴─────────────────┴────────────────┤
│                       INTERACTIVE WORKFLOW CONTROLS                    │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│ BATCH ATTENDANCE │ BATCH EXAM MARKS │ NOTICE BOARD    │ PETITION DESK  │
│ - Session Guard  │ - Draft vs Pub   │ - Cross-Campus  │ - Leave Review │
│ - Real-time Logs │ - Letter Grades  │ - Priority Tier │ - Discrepancies│
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

---

## 3. Dedicated Teacher Pages & UI Components

### 3.1 Faculty Dashboard (`src/app/page.tsx`)
- **Telemetry**: Real-time counts of assigned classes, total enrolled students, pending assignments to grade, and an active Defaulters Watch (<75% attendance).
- **Today's Teaching Schedule**: Synchronized directly with `/api/dashboard`, detailing time slots, courses, room codes, and lecture halls.
- **Defaulters Quick Watch**: Immediately displays students in faculty's assigned courses whose biometric attendance has fallen below statutory thresholds.
- **Quick Action Workflows**: One-click modals to mark attendance, post assignments, schedule exams, and broadcast announcements.

### 3.2 My Classes & Rosters (`src/app/faculty/page.tsx`)
- **API**: `GET /api/faculty/classes`.
- **Functionality**:
  - Dynamically lists only the courses taught by the authenticated instructor.
  - Displays enrolled student rosters with roll numbers, contact information, and verified attendance percentages.
  - Tracks individual syllabus delivery completion rates against academic calendar milestones.

### 3.3 Dynamic Attendance Engine (`src/app/attendance/page.tsx`)
- **APIs**: `GET /api/attendance`, `POST /api/attendance`.
- **Functionality**:
  - Automatically loads the faculty's assigned courses into a dropdown selector.
  - Prevents duplicate attendance sessions on the same date for the same course and section, notifying the faculty immediately if a session is already recorded.
  - Provides instant "Mark All Present", "Mark All Absent", and individual student toggles.
  - Live session summary calculating total strength, present count, absent count, and attendance percentage.

### 3.4 Continuous Assessment & Assignments (`src/app/assignments/page.tsx`)
- **APIs**: `GET /api/assignments`, `POST /api/assignments`.
- **Functionality**:
  - Create assignments with deadlines, maximum scores, submission types, and attached prompt criteria.
  - Submissions desk displaying student upload timestamps, plagiarism similarity percentages, and rubric evaluation tools.

### 3.5 Examination & Batch Roster Grading (`src/app/examinations/page.tsx`)
- **APIs**: `GET /api/examinations`, `POST /api/examinations`, `PUT /api/examinations`.
- **Functionality**:
  - Examination scheduling with weightage %, duration in minutes, and Bloom's taxonomy question prompts.
  - **Batch Roster Marks Entry Modal**:
    - Faculty reviews the entire enrolled class roster in a responsive table.
    - Input numerical marks (0 to Maximum Exam Marks).
    - **Save Draft**: Saves provisional marks locally in the database (`isVerified: false, publishedAt: null`) without exposing them to students.
    - **Publish Official Grades**: Computes standard letter grades (A+, A, B, etc.) and GPA points, locks results to student transcripts (`isVerified: true, publishedAt: Date`), and updates cumulative CGPA.

### 3.6 Learning Management System (`src/app/lms/page.tsx`)
- **APIs**: `GET /api/lms`, `POST /api/lms`.
- **Functionality**:
  - Switch between all assigned academic courses.
  - Interactive Unit Syllabus Progress slider: Faculty updates delivery percentage (0-100%) and logs accredited course outcomes (`CO1`, `CO2`, etc.).
  - Upload Learning Materials: Add PDF slides, video streams, lab code, and interactive quizzes mapped directly to syllabus units.

### 3.7 Student Academic Petitions Review (`src/app/students/profile/page.tsx?tab=requests`)
- **APIs**: `GET /api/students/requests`, `PATCH /api/students/requests`.
- **Functionality**:
  - Review submitted student petitions: Leave of Absence, Attendance Discrepancies, and Document requests.
  - Evaluate attached justification notes and document links.
  - Resolution modal: Approve or Reject petitions with faculty remarks recorded in the permanent audit trail.

---

## 4. Database Schema Support

| Model | Purpose | Key Attributes |
|---|---|---|
| `CourseModule` | Syllabus unit tracking | `progressPercent`, `learningObjectives`, `courseOutcomes` |
| `CourseChapter` | Learning content metadata | `contentType`, `contentUrl`, `fileSizeKb`, `durationMins`, `isPublished` |
| `ExamResult` | Examination evaluation | `marksObtained`, `gradeLetter`, `isVerified`, `publishedAt`, `verifiedById` |
| `AttendanceRecord` | Attendance tracking | `courseId`, `studentId`, `date`, `status`, `remarks` |
| `StudentRequest` | Formal student petitions | `type`, `title`, `reason`, `status`, `reviewerRemarks`, `reviewedById` |

---

## 5. Security & RBAC Policies

- **Endpoint Scoping**: Faculty endpoints require authenticated tokens carrying the `FACULTY`, `PROFESSOR`, `HOD`, `PRINCIPAL`, or `INSTITUTION_ADMIN` role claims.
- **Roster Privacy**: Instructors can only view rosters and grade students officially enrolled in their department and assigned courses.
- **Audit Trails**: All status mutations, grade publishing actions, and petition approvals emit structured logs with timestamp, actor user ID, and target entity IDs.
