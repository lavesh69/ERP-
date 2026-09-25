# CLASSROOM ERP — TEACHER & STUDENT PRODUCTION GAP ANALYSIS
## Comprehensive Audit, Architectural Deficiencies & Production Remediation Matrix

**Target System:** CLASSROOM Academic OS / Higher Education ERP  
**Deployment:** `https://erp-omega-pink.vercel.app/`  
**Audit Date:** September 2026  
**Auditor:** Principal Education ERP Product Architect & Security Systems Engineer  
**Status:** Audit Complete — Production Remediation Planned  

---

## 1. Executive Summary

This audit evaluates the functional, operational, architectural, security, and user experience maturity of the **Teacher (Faculty)** and **Student** modules within CLASSROOM ERP. 

While the application features responsive dashboards, clean typography (Ivory Bloom palette), role switching, and dynamic attendance, deep code inspection revealed several architectural gaps that prevent it from functioning as a true, production-grade Academic Operating System:
1. **FERPA / Data Privacy Leakage in Secondary Modules:** 
   - `/api/finance` exposed institutional fee collections and student fee balances to Faculty users.
   - `/api/careers` returned all student job applicants, resumes, and CGPAs to student callers instead of scoping to `myApplication`.
   - `/api/scholarships` returned raw arrays of all applicant essays, CGPAs, and roll numbers to student callers.
   - `/api/documents` allowed any student to view all academic documents across the institution.
   - `/api/announcements` exposed confidential faculty-only notices to students.
2. **Disconnected Cross-Module Workflows:**
   - When a student submitted an `ATTENDANCE_CORRECTION` request and a teacher approved it via `/api/students/requests`, the request status changed to `APPROVED`, but the underlying `AttendanceRecord` in the database was never updated.
   - Student assignments lacked explicit rubrics and grade locking mechanics after finalization.
3. **LMS Curriculum CRUD Completeness:**
   - Teachers could add chapters and update progress, but could not delete obsolete materials or create new units/modules directly via the API.
4. **Scoping in Teacher Student Roster:**
   - In `/api/students`, non-admin faculty querying the roster received all students in the institution with their fee payment status, rather than being restricted to students enrolled in courses taught by the faculty.

Below is the categorized, item-by-item gap analysis with root cause analysis, affected files, database entities, and precise remediation specifications.

---

## 2. Comprehensive Gap Analysis Matrix

| ID | Module | Feature | Current State | Expected State | Severity | Category | Completion Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | Student & Teacher | Finance FERPA Data Isolation | `/api/finance` returns all student fees when caller role is `FACULTY`. | Faculty is strictly blocked with 403 Forbidden. Only students (self) and finance admins can access fee data. | **CRITICAL** | SECURITY, RBAC | REMEDIATION READY |
| **GAP-02** | Student | Careers / Placement Privacy | `/api/careers` returns all student applications, CGPAs, and resumes to student callers. | If caller is `STUDENT`, strip `applications` array and return only `myApplication`. Full applicant list restricted to Admin/Placement officers. | **CRITICAL** | SECURITY, RBAC | REMEDIATION READY |
| **GAP-03** | Student | Scholarship Applicant Privacy | `/api/scholarships` returns `allApplications` array containing all applicant statements and CGPAs to students. | `allApplications` is omitted for students; students only see their own application status and eligibility match. | **CRITICAL** | SECURITY, DATA INTEGRITY | REMEDIATION READY |
| **GAP-04** | Student | Document Repository Isolation | `/api/documents` returns all uploaded documents to any caller without user filtering. | Students see only documents where `userId == session.userId` or category is `PUBLIC_CATALOG`. | **HIGH** | SECURITY, RBAC | REMEDIATION READY |
| **GAP-05** | Communication | Announcement Audience Scoping | `/api/announcements` returns all announcements regardless of `targetAudience`. | Students only receive announcements where `targetAudience IN ('ALL', 'STUDENT')`. Faculty-only notices hidden. | **HIGH** | SECURITY, RBAC | REMEDIATION READY |
| **GAP-06** | Teacher | Student Roster Scoping | `/api/students` returns all institutional students with fee payment status to faculty. | For `FACULTY`, scope roster to students enrolled in courses taught by that faculty; omit sensitive fee fields. | **HIGH** | SECURITY, RBAC | REMEDIATION READY |
| **GAP-07** | Workflow | Attendance Correction Execution | Approving an `ATTENDANCE_CORRECTION` petition updates the petition status, but does not modify the attendance record. | When petition is `APPROVED`, server atomically updates or creates the `AttendanceRecord` to `EXCUSED` or `PRESENT` with audit metadata. | **HIGH** | WORKFLOW, DATA INTEGRITY | REMEDIATION READY |
| **GAP-08** | Teacher LMS | Curriculum Material Deletion | `/api/lms` lacks `DELETE` handler for removing obsolete chapters or courseware. | Implement `DELETE /api/lms?chapterId=...` restricted to Course Faculty or Admin. | **MEDIUM** | API, WORKFLOW | REMEDIATION READY |
| **GAP-09** | Teacher LMS | Unit / Module Creation | Teachers could only update syllabus progress for seeded modules, but could not create new units. | Implement `action: "CREATE_MODULE"` in `POST /api/lms` allowing faculty to author new curriculum units. | **MEDIUM** | API, FEATURE | REMEDIATION READY |
| **GAP-10** | Assignments | Digital Grading Rubrics & Lock | `POST /api/assignments/grade` accepted numeric points and feedback, but lacked rubric breakdown and grade locking. | Support rubric criteria scoring, draft vs published grade flags, and prevent alteration of locked submissions without explicit reason. | **HIGH** | WORKFLOW, DATA INTEGRITY | REMEDIATION READY |
| **GAP-11** | Student | Exam Marksheet Aggregation | `/api/examinations` filtered published results, but student lacked cumulative SGPA/CGPA breakdown on marksheet modal. | Compute course credits, grade points earned, and semester GPA on the certified marksheet view. | **MEDIUM** | UX, WORKFLOW | REMEDIATION READY |
| **GAP-12** | Database & Models | Cascade & Data Integrity | Some relations in schema lacked cascade or audit timestamps. | Verify Prisma relations and ensure audit log entries are emitted for all grade and petition mutations. | **MEDIUM** | DATABASE, AUDIT | REMEDIATION READY |

---

## 3. Detailed Architectural Gap Reports

### GAP-01: Finance FERPA Data Isolation
* **Module:** Finance / Student Billing
* **Current State:** In `src/app/api/finance/route.ts`, if caller role is `FACULTY`, `studentFeeWhere` evaluates to `{}`. Consequently, faculty members querying the finance API receive all institutional fee collections, student fee balances, and payment transaction logs.
* **Expected State:** Teachers must NEVER see student financial or fee records. Only `STUDENT` (for self), `PARENT` (for linked child), and administrative roles (`SUPER_ADMIN`, `INSTITUTION_ADMIN`, `FINANCE_OFFICER`) may access finance endpoints. Faculty callers must receive `403 Forbidden`.
* **Affected Files:** `src/app/api/finance/route.ts`
* **Fix:** Enforce role validation at the top of `GET /api/finance`. If caller is `FACULTY`, return `403 Forbidden`.

### GAP-02: Careers & Placement Applicant Data Privacy
* **Module:** Careers & Placements
* **Current State:** In `src/app/api/careers/route.ts`, the `GET` handler queries all job postings and maps `j.applications` into the public response, including other students' full names, emails, CGPAs, application statuses, and resume URLs.
* **Expected State:** A student browsing job opportunities must ONLY see the job listing and their own application (`myApplication`). Other students' applications, CGPAs, and private resumes must be completely stripped.
* **Affected Files:** `src/app/api/careers/route.ts`
* **Fix:** Condition `applications: isStudent ? [] : j.applications.map(...)`.

### GAP-03: Scholarship Applicant Privacy
* **Module:** Scholarships
* **Current State:** In `src/app/api/scholarships/route.ts`, line 74 returns `allApplications` containing every applicant's statement of purpose, roll number, and CGPA to all GET callers, including students.
* **Expected State:** Students must only see available scholarships, eligibility match indicators, and their own submission (`myApplication`). The `allApplications` roster is confidential and must be restricted to financial aid administrators.
* **Affected Files:** `src/app/api/scholarships/route.ts`
* **Fix:** If `isStudent`, set `allApplications: []`.

### GAP-04: Academic Document Repository Isolation
* **Module:** Document Center
* **Current State:** In `src/app/api/documents/route.ts`, `prisma.academicDocument.findMany()` returns all uploaded documents without filtering by user.
* **Expected State:** Students should only see documents belonging to their account (`userId === session.userId`) or documents marked with public categories (e.g. `PROSPECTUS`, `CURRICULUM_GUIDE`).
* **Affected Files:** `src/app/api/documents/route.ts`
* **Fix:** Add `where: isStudent ? { OR: [{ userId: session.userId }, { category: { in: PUBLIC_CATEGORIES } }] } : {}`.

### GAP-05: Communication / Announcement Audience Scoping
* **Module:** Announcements & Communication
* **Current State:** In `src/app/api/announcements/route.ts`, `GET` returns all announcements from the institution without checking `targetAudience`.
* **Expected State:** Students should only see announcements targeted to `"ALL"` or `"STUDENT"`. Confidential administrative and faculty-only notices must not be exposed.
* **Affected Files:** `src/app/api/announcements/route.ts`
* **Fix:** Add filter `{ where: isStudent ? { targetAudience: { in: ["ALL", "STUDENT"] } } : {} }`.

### GAP-06: Student Roster Scoping for Faculty
* **Module:** Student Roster
* **Current State:** In `src/app/api/students/route.ts`, when a faculty member accesses the roster, all students in the institution are returned along with their fee records (`fees: { include: { feeStructure: true } }`).
* **Expected State:** Faculty should only see students enrolled in their assigned courses or sections, and private financial data must be stripped from the response.
* **Affected Files:** `src/app/api/students/route.ts`
* **Fix:** When caller is `FACULTY`, filter students by course enrollment under that faculty and omit `fees`.

### GAP-07: Attendance Correction Workflow Resolution
* **Module:** Student Requests & Attendance
* **Current State:** When an `ATTENDANCE_CORRECTION` petition is marked `APPROVED` via `PATCH /api/students/requests`, only the petition record is updated. The student's actual attendance record in `AttendanceRecord` remains absent or unmodified.
* **Expected State:** Upon approval of an attendance correction petition, the server must look up or create the corresponding `AttendanceRecord` for that student and session, set status to `EXCUSED` or `PRESENT`, record `markedBy: "FACULTY_CORRECTION"`, and emit an audit event.
* **Affected Files:** `src/app/api/students/requests/route.ts`
* **Fix:** In `PATCH /api/students/requests`, if `type === "ATTENDANCE_CORRECTION"` and `status === "APPROVED"`, resolve the target session and update/upsert the `AttendanceRecord`.

### GAP-08 & GAP-09: LMS Curriculum Authoring & Material Lifecycle
* **Module:** LMS & Curriculum Management
* **Current State:** Teachers could only add chapters and update progress for pre-existing modules, but could not author new Units/Modules or delete obsolete courseware.
* **Expected State:** Full curriculum authoring: `POST /api/lms` supports `action: "CREATE_MODULE"`, and `DELETE /api/lms` allows removing chapters.
* **Affected Files:** `src/app/api/lms/route.ts`
* **Fix:** Add `CREATE_MODULE` action and `DELETE` method.

### GAP-10: Assignment Digital Grading Rubrics & Lock
* **Module:** Assignments
* **Current State:** `POST /api/assignments/grade` accepted numeric points and feedback, but did not support rubric breakdowns, grade locks, or draft vs published states.
* **Expected State:** Faculty can submit rubric criteria, save draft grades, publish official grades, and lock grades against accidental modification.
* **Affected Files:** `src/app/api/assignments/grade/route.ts`
* **Fix:** Add `rubricScores`, `isDraft`, and `isLocked` support in `POST /api/assignments/grade`.

---

## 4. Remediation Roadmap & Verification Plan

1. **Security & Privacy Hardening:**
   - Patch `src/app/api/finance/route.ts` to block faculty from viewing student fee ledgers.
   - Patch `src/app/api/careers/route.ts` to strip applicant rosters for student callers.
   - Patch `src/app/api/scholarships/route.ts` to omit confidential application dossiers from student view.
   - Patch `src/app/api/documents/route.ts` to scope document lists to the authenticated user.
   - Patch `src/app/api/announcements/route.ts` to respect `targetAudience` permissions.
   - Patch `src/app/api/students/route.ts` to scope student rosters for faculty and strip financial data.
2. **Workflow & Data Integrity:**
   - Enhance `src/app/api/students/requests/route.ts` to update `AttendanceRecord` upon approval of attendance correction petitions.
   - Enhance `src/app/api/lms/route.ts` with unit creation (`CREATE_MODULE`) and chapter deletion (`DELETE`).
   - Enhance `src/app/api/assignments/grade/route.ts` with rubric evaluation and draft/published grade locking.
3. **Automated Testing:**
   - Add **Group 30: Academic Operating System Maturity & FERPA Privacy Isolation** in `src/lib/test-runner.ts`.
   - Verify all test assertions pass (100% green).
4. **Documentation Deliverables:**
   - `TEACHER_MODULE.md`
   - `STUDENT_MODULE.md`
   - `ACADEMIC_WORKFLOW.md`
   - `RBAC_MATRIX.md`
   - `ATTENDANCE_ARCHITECTURE.md`
5. **Build, Commit & Live Deployment QA:**
   - Execute production build (`npm run build`).
   - Push to `origin main` and verify live deployment on `https://erp-omega-pink.vercel.app/`.
