# CLASSROOM — Teacher + Student Module Gap Analysis & Production Blueprint

**Project**: CLASSROOM Autonomous Education ERP & LMS  
**Audit Date**: September 25, 2026  
**Standards**: Enterprise Education ERP, FERPA/GDPR Student Privacy, University SIS/LMS Accreditation  

---

## 1. Executive Summary

This gap analysis provides a systematic inspection of the Teacher (Faculty) and Student modules within the CLASSROOM ERP. The objective is to transition from fragmented institutional views and hardcoded demos into a mature, production-grade university ERP and LMS where:
1. **Teachers** have an intuitive workspace to view assigned courses, track workload, conduct attendance with anti-duplicate validation, manage syllabi, upload course materials (PDF, DOCX, slides), publish assignments, evaluate submissions, enter exam marks, review student progress, and monitor class analytics.
2. **Students** have a secure, private academic portal to track enrolled courses, view attendance with deficit alerts, access learning materials, submit assignments, take exams, generate hall tickets, inspect officially published marksheets with dynamic GPA/CGPA, review fees, browse library loans, submit requests (leave, attendance correction), and receive targeted announcements.
3. **Data Isolation & RBAC** are strictly enforced: no student can view or tamper with another student's academic or financial records, and teachers cannot access or modify classes outside their assigned curriculum.

---

## 2. Comprehensive Gap Analysis Matrix

| Module | Current State | Missing Functionality | Severity | Required Production Fix |
|:---|:---|:---|:---|:---|
| **Teacher Dashboard** (`/`) | Displays global institutional executive telemetry (Total Scholars, Bursar Revenue, Campus Turnstiles) regardless of role. | Faculty-specific dashboard: Today's lectures, next upcoming class, pending attendance to submit, assignments pending grading, upcoming exams, class alerts (<75% attendance), and weekly workload summary. | **CRITICAL** | Implement role-aware dashboard in `src/app/page.tsx` and `/api/dashboard` returning faculty-scoped classes, workload, pending actions, and quick actions (Take Attendance, Create Assignment, Upload Material, Enter Marks). |
| **Student Dashboard** (`/`) | Displays global university admin KPIs rather than student academic status. | Student-scoped dashboard: Enrolled courses progress, overall & subject attendance rate, upcoming assignment deadlines, scheduled exams, published GPA/CGPA, fee payment standing, and today's schedule. | **CRITICAL** | Implement role-aware dashboard in `src/app/page.tsx` and `/api/dashboard` returning the authenticated student's enrolled courses, attendance, upcoming deadlines, exam alerts, and fees. |
| **Teacher My Classes** (`/faculty`, `/courses`) | Faculty route only provides a global faculty staff directory. No dedicated workspace for teachers to manage their specific assigned classes. | Dedicated "My Classes & Sections" view showing only courses assigned to the logged-in faculty in `CourseFaculty`, with student count, attendance rate, assignments, exams, and class roster. | **HIGH** | Build My Classes panel and `/api/faculty/classes` endpoint scoped strictly to `CourseFaculty.facultyId === callerFaculty.id`. Prevent viewing unauthorized classes. |
| **Attendance (Teacher)** (`/attendance`) | Course dropdown has hardcoded options (`CS-402`, `BIO-210`). Session creation hardcodes `sectionId` and faculty. Lacks validation to prevent duplicate records for the same lecture/date. | Scoping to teacher's assigned courses/sections; support for Late and Excused status in bulk actions; duplicate session prevention; locked session status. | **CRITICAL** | Update `src/app/attendance/page.tsx` and `/api/attendance` to scope course selection to assigned courses, add unique session constraints, support Late/Excused marks, and prevent duplicate session creation. |
| **Attendance (Student)** (`/attendance`) | Student accessing `/attendance` sees teacher controls ("Mark All Present", "Project QR Scanner", "Save to Database") and can attempt to mark attendance. | Student-specific attendance view: Subject-wise breakdown, monthly calendar view, attendance percentage vs 75% requirement, deficit alerts, and Attendance Correction Request workflow. | **CRITICAL** | Split `/attendance` into Teacher Mode and Student Mode based on `currentRole`. For students, display personalized subject breakdown, attendance calendar, and an interactive "Request Attendance Correction" modal. |
| **Course & Syllabus Management** (`/lms`) | LMS page is a static chapter viewer with a student completion toggle. | Teacher syllabus management: Unit-level syllabus tracking (Unit I — 100%, Unit II — 80%), learning objectives, course outcomes, reference textbooks, and teaching progress persistence. | **HIGH** | Add Course Management capabilities in `/lms` and `/api/lms` allowing teachers to define units (`CourseModule`), track syllabus completion percentages, and persist learning outcomes in the database. |
| **Learning Materials** (`/lms`, `/documents`) | Lecture slides button outputs a mock hardcoded string. No organized repository for lecture documents (PDF, DOCX, PPTX, XLSX, links). | File upload organized by Course → Unit → Topic → Material with metadata (author, upload date, file size), publish/unpublish toggle, and secure download for enrolled students only. | **HIGH** | Build Learning Material repository in LMS with file upload/link attachment, metadata, and role-based access ensuring students only see materials for enrolled courses. |
| **Assignments & Grading** (`/assignments`) | Course code is hardcoded to `CS-402` in creation modal. Submissions lack late submission rules, resubmission policies, or return status. | Dynamic course selector for assigned courses; submission status breakdown (Total, Submitted, Pending, Late, Graded, Returned); resubmission toggle; rubric points; feedback persistence. | **HIGH** | Enhance `/assignments`, `/api/assignments`, and `/api/assignments/grade` with multi-course selection, status counts, deadline enforcement, return/resubmission flags, and rich grading feedback. |
| **Exams & Question Formulation** (`/examinations`) | Marks entry modal hardcodes `studentId: "stu-mercer-01"`. Faculty cannot enter marks for an entire class roster. Questions lack structured types (MCQ, Short, Long). | Question Bank formulation per unit/topic; class-wide marks entry table; draft save vs final publication workflow; role permission check for final publishing. | **CRITICAL** | Build class-wide Marks Entry modal in `/examinations` allowing teachers to enter marks for all enrolled students; add Question Bank manager; support Draft vs Published status. |
| **Student Results & Marksheet** (`/examinations`, `/students/profile`) | Marksheet display is fragmented. Unofficial/draft marks may leak before publication. | Official University Marksheet: Subject, Credits, Internal Marks, External Marks, Total, Grade Letter, Grade Point, Credits Earned, Semester GPA, and Cumulative CGPA. Hide unpublished results. | **CRITICAL** | Implement student Marksheet view in `/examinations` and `/students/profile` calculating SGPA and CGPA dynamically using the institution's grading engine, filtering strictly to published results. |
| **Student Requests Workflow** (New) | No mechanism exists for students to submit leave requests, document requests, certificate requests, or attendance correction requests. | Student Service Desk: Leave requests, Attendance correction requests, Transcript/Bonafide certificate requests with statuses (`SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`). | **HIGH** | Create `StudentRequest` model in Prisma, implement `/api/students/requests` API, and build interactive Request Center in the Student experience. |
| **Student Fees & Financial Isolation** (`/finance`) | Student can access general finance portal. Needs strict student self-service financial view. | Student fee statement: Tuition, lab, library breakdown, paid amount, pending balance, payment history, and instant receipt generation without exposing other students' accounts. | **HIGH** | Scope `/finance` for students to only query `studentFee` where `studentId === currentStudent.id`. Provide itemized receipt and payment history. |
| **Student Library ERP** (`/library`) | Shows general library catalog. Needs personalized student book management. | Student's active loans, due dates, renewal requests, overdue fines, and reserve book workflow. | **MEDIUM** | Add "My Issued Books & Due Dates" tab to `/library` for students, showing active loan countdowns and return statuses. |
| **Announcements Scoping** (`/communication`) | `STUDENT` role was omitted from `SideNavBar.tsx` for `/communication`. | Students unable to access announcements. Announcements lack targeting by Institution, Department, or Course. | **HIGH** | Add `STUDENT` to allowed roles for `/communication`; add audience targeting (`ALL`, `STUDENTS`, `FACULTY`) and priority badges (Urgent/Emergency banner). |
| **Teacher Class Analytics & Workload** (`/analytics`) | Analytics page is restricted to Super Admin / Institution Admin only. Teachers lack class performance analytics. | Teacher Class Analytics: Attendance distribution curve, assignment completion rate, average marks, grade distribution, and list of students at academic risk (<75% attendance). | **MEDIUM** | Add Teacher Analytics tab in `/analytics` or `/faculty` with database-computed charts for attendance, assignments, and grade distribution across assigned classes. |
| **Mobile UX & Responsiveness** (All Modules) | Desktop tables in attendance, timetable, and assignments cause horizontal scrolling on viewport widths < 390px. | Mobile-optimized cards, swipeable tabs, touch-friendly bulk attendance buttons, collapsible timetable blocks, and bottom action bars. | **UX / HIGH** | Optimize mobile rendering for `/`, `/attendance`, `/assignments`, `/examinations`, `/lms`, and `/timetable` using responsive card layouts, horizontal scroll containers, and 44px+ touch targets. |

---

## 3. Implementation Roadmap

### Phase A: Database Schema Alignment (`prisma/schema.prisma`)
- Add `StudentRequest` entity for student leave, document, and attendance correction requests.
- Add `progressPercent`, `learningObjectives`, and `courseOutcomes` to `CourseModule`.
- Add `isPublished`, `fileSizeKb`, and `authorId` to `CourseChapter`.
- Run Prisma db push to sync the SQLite / PostgreSQL schemas.

### Phase B: Unified Backend APIs
1. `/api/dashboard`: Role-aware data aggregation for `FACULTY`, `STUDENT`, and `ADMIN`.
2. `/api/faculty/classes`: Teacher's assigned courses, sections, student counts, and attendance stats.
3. `/api/attendance`: Support teacher roster marking (Present, Absent, Late, Excused) and student attendance query with subject breakdown.
4. `/api/assignments`: Course selector, status counts, deadline enforcement, and submission grading.
5. `/api/examinations`: Class-wide marks entry, question bank formulation, draft vs published workflow.
6. `/api/lms`: Syllabus progress tracking, unit management, and learning materials upload.
7. `/api/students/requests`: Student request creation (Leave, Attendance Correction, Certificates) and review workflow.

### Phase C: Teacher Experience Overhaul
- **Teacher Dashboard**: Today's lectures, next class banner, attendance alerts, pending grading count, workload stats, quick action modals.
- **Teacher Attendance**: Course selector, session date, Present/Absent/Late/Excused bulk marking, duplicate prevention, locked sessions.
- **Teacher Course Management & LMS**: Syllabus tracking (Unit I 100%, Unit II 80%), materials upload, learning objectives.
- **Teacher Assignments & Grading**: Class assignment creator, submission table, grading modal with feedback.
- **Teacher Exams & Marks Entry**: Exam scheduler, class roster marks entry, final publish action.

### Phase D: Student Experience Overhaul
- **Student Dashboard**: Enrolled courses progress, attendance rate, upcoming deadlines, exam alerts, fees, and today's schedule.
- **Student Attendance**: Subject attendance percentage, calendar view, deficit warnings (<75%), and "Request Attendance Correction" modal.
- **Student Assignments**: Assignment list, deadline countdown, file/text submission, graded feedback view.
- **Student Exams & Marksheet**: Upcoming exams, Hall Ticket generator, official published marksheet with SGPA/CGPA.
- **Student Requests Center**: Submit leave, certificate, or attendance correction requests and monitor status.
- **Student Fees & Library**: Personal fee breakdown, payment receipts, active book loans with due dates.

### Phase E: Verification, Tests & Deployment
- Automated test coverage in `src/lib/test-runner.ts` covering Teacher and Student workflows, RBAC guards, and request lifecycle.
- Type check (`npx tsc --noEmit`) and build (`npm run build`).
- Git commit & push to GitHub repository (`origin main`).
- Live verification on deployed Vercel instance (`https://erp-omega-pink.vercel.app`).
