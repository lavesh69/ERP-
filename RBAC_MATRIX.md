# CLASSROOM ERP — COMPREHENSIVE ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

## 1. Security Architecture Principles

Classroom ERP enforces a defense-in-depth authorization model combining:
1. **Cryptographic JWT Sessions**: Signed with institutional secrets, carrying `role`, `userId`, and `institutionId`.
2. **Token Revocation Ledger**: Instant token revocation upon logout, password change, or security lockout.
3. **FERPA Privacy Wall**: Strict legal boundaries prohibiting academic faculty from viewing student billing, balances, and payment transactions.
4. **Backend IDOR Protection**: Direct database filtering ensuring students can only access their own academic records, submissions, documents, and transcripts.

---

## 2. Granular Permissions Matrix by Role

| Resource Domain | SUPER_ADMIN | INSTITUTION_ADMIN | HOD | PROFESSOR / FACULTY | CLASS_TEACHER | STUDENT | PARENT | REGISTRAR / EXAM_OFFICER | FINANCE_OFFICER |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **User Accounts** | CRUD (All) | CRUD (Inst) | Read (Dept) | Read (Self) | Read (Self) | Read (Self) | Read (Child) | Read (All) | Read (All) |
| **Courses & Curriculum** | CRUD | CRUD | CRUD (Dept) | CRUD (Assigned) | Read (Assigned)| Read (Enrolled)| Read (Child) | Read | Read |
| **Timetable & Scheduling**| CRUD | CRUD | CRUD (Dept) | Read (Schedule) | Read (Schedule)| Read (Enrolled)| Read (Child) | CRUD | Read |
| **Attendance Sessions** | CRUD | CRUD | CRUD (Dept) | CRUD (Assigned) | CRUD (Assigned)| Self-Verify | Read (Child) | Read | Read |
| **Attendance Records** | Override | Override | Override (Dept)| Edit (Own Class)| Edit (Own Class)| Read (Own) | Read (Child) | Read | Read |
| **Assignments & Rubrics** | CRUD | CRUD | CRUD (Dept) | CRUD (Assigned) | CRUD (Assigned)| Submit / View | Read (Child) | Read | Read |
| **Submission Grading** | Grade/Unlock | Grade/Unlock | Grade/Unlock | Grade / Lock | Grade / Lock | Read (Own) | Read (Child) | Read | Read |
| **Examinations** | CRUD | CRUD | CRUD (Dept) | Enter Marks | Enter Marks | Read (Pub) | Read (Pub) | CRUD / Certify| Read |
| **Exam Grades (Draft)** | Read / Edit | Read / Edit | Read / Edit | Edit (Assigned)| Edit (Assigned)| ❌ FORBIDDEN | ❌ FORBIDDEN | Read / Certify| ❌ FORBIDDEN |
| **Exam Grades (Pub)** | Read | Read | Read | Read | Read | Read (Own) | Read (Child) | Read / Export | Read |
| **Tuition & Billing (FERPA)**| Full Access | Full Access | ❌ BLOCKED | ❌ BLOCKED | ❌ BLOCKED | Read (Own) | Read (Child) | Read | Full Access |
| **Placement Drives** | CRUD | CRUD | Read | Read | Read | Apply / View Own| ❌ FORBIDDEN | Read | ❌ FORBIDDEN |
| **Placement Applicants** | Full Access | Full Access | Full Access | Read | Read | ❌ PEER MASKED | ❌ FORBIDDEN | Read | ❌ FORBIDDEN |
| **Scholarships (Admin)** | CRUD | CRUD | Read | Read | Read | ❌ PEER MASKED | ❌ FORBIDDEN | Read | Full Access |
| **Documents / Dossiers** | Full Access | Full Access | Full Access | View (Public) | View (Public) | View Own/Public| View Child | Full Access | Read |
| **Announcements** | Post / View | Post / View | Post / View | Post / View | Post / View | View (Scoped) | View (Scoped) | Post / View | Post / View |
| **Audit Logs** | Full Access | Full Access | Read (Dept) | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | ❌ FORBIDDEN | Read | Read |

---

## 3. FERPA Privacy Wall Details

### Legislative Requirement:
Under the Family Educational Rights and Privacy Act (FERPA) and international financial data privacy regulations:
- Instructors, lecturers, and academic evaluators must evaluate student academic merit free from knowledge of a student's personal financial need, outstanding tuition dues, scholarship statuses, or institutional billing disputes.
- Cross-student financial disclosures are strictly illegal.

### Implementation Guardrails:
1. **API Guard in `GET /api/finance` and `POST /api/finance`**:
   ```ts
   if (role && ["FACULTY", "PROFESSOR", "CLASS_TEACHER", "HOD"].includes(role)) {
     return NextResponse.json(
       { error: "Forbidden: Academic faculty are restricted from accessing student financial records (FERPA compliance)." },
       { status: 403 }
     );
   }
   ```
2. **Student Roster Stripping (`/api/students`)**:
   - When faculty query student dossiers or course rosters, all `feeStatus`, `fees`, and `transactions` fields are omitted at the database query level (`fees: false`).

---

## 4. Student Peer Data Privacy Isolation

To protect student confidentiality across competitive and sensitive modules:
1. **Careers & Job Postings (`/api/careers`)**:
   - When `role === "STUDENT"`, the `applications` array is set to `[]`.
   - The student only receives their own `myApplication` metadata. Other applicants' resumes, contact info, and CGPAs are blocked.
2. **Scholarships Desk (`/api/scholarships`)**:
   - When `role === "STUDENT"`, the `allApplications` array is set to `[]`.
   - The student only receives the scholarship eligibility rules and their own submitted application.
3. **Institutional Documents (`/api/documents`)**:
   - Students can only view their own uploaded files or approved public institutional categories (`SYLLABUS`, `HANDBOOK`, `POLICY`, `CALENDAR`, `TEMPLATE`).
   - Private student transcripts, ID proofs, and sensitive disciplinary documentation belonging to other scholars are strictly masked.
4. **Announcements Audience Scoping (`/api/announcements`)**:
   - Students only receive broadcasts where `targetAudience IN ('ALL', 'STUDENT')`.
   - Internal faculty communications and senate notices are withheld.

---

## 5. Security Elevation & Grade Locking Model

1. **Grade Locking Protocol**:
   - During assignment or examination grading, instructors can mark a grade as locked (`[LOCKED]`).
   - Once locked, standard faculty cannot tamper with or recalculate marks.
   - Grade unlocks require elevated authorization from `HOD`, `EXAM_CONTROLLER`, `INSTITUTION_ADMIN`, or `SUPER_ADMIN`.
2. **Audit Trail Accountability**:
   - All role elevations, grade overrides, attendance adjustments, and fee receipts write an immutable event to the `AuditLog` table with timestamp, IP address, actor ID, and delta JSON payload.
