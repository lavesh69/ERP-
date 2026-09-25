# STUDENT / SCHOLAR MODULE — TECHNICAL & WORKFLOW SPECIFICATION

## 1. Executive Summary

The **Student / Scholar Module** in Classroom ERP provides learners with a secure, centralized, FERPA-compliant academic workspace. It empowers students with real-time insight into attendance records, curriculum completion, continuous assessment submissions, verified examination transcripts, digitized admit cards, bursar ledgers, and formal administrative petition desks.

---

## 2. Core Architecture & Scholar Workflows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SCHOLAR ACADEMIC PORTAL                         │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│    MY DOSSIER    │ SUBJECT ATTEND.  │  COURSEWARE LMS │ EXAM RESULTS   │
│ - Verified CGPA  │ - Defaulter Alert│ - Video Streams │ - Hall Ticket  │
│ - Degree Credits │ - Daily Sessions │ - Slide Decks   │ - Certified GPA│
├──────────────────┴──────────────────┴─────────────────┴────────────────┤
│                    STUDENT GOVERNANCE & SERVICES                       │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│  PETITIONS DESK  │ BURSAR LEDGERS   │ LIBRARY BORROWS │ PRIVACY & 2FA  │
│ - Leave Requests │ - Online Pay Slip│ - Overdue Alarms│ - GDPR Export  │
│ - Attendance Fix │ - Dues Balance   │ - ISBN Directory│ - TOTP Auth    │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

---

## 3. Dedicated Student Pages & UI Components

### 3.1 Scholar Dashboard (`src/app/page.tsx`)
- **Telemetry**: Personalized metrics: Biometric Attendance Rate (with Defaulter warning if <75%), Enrolled Course count, Pending Homework items, Fee Balance, and Open Requests.
- **My Classes Today**: Displays time slots, room names, building locations, and faculty names for the student's enrolled courses.
- **My Curriculum Progress**: Tracks percentage of verified chapters completed across all enrolled courses.
- **Pending Homework & Upcoming Examinations**: Direct alerts for upcoming assignment deadlines and mid-term / final examination dates.
- **Requests & Petitions Status**: Real-time status badges (`SUBMITTED`, `APPROVED`, `REJECTED`) for submitted petitions.

### 3.2 Scholar 360 Dossier (`src/app/students/profile/page.tsx`)
- **IDOR Protection**: Strictly scoped to the authenticated student's session. Any attempt to modify URL query parameters to view another scholar's records is blocked and redirected to the student's personal dossier.
- **Tabbed Experience**:
  1. **Overview & Dossier**: Student ID, Roll Number, Program, Department, Section, Admission Date, Advisor contact details, and one-click "Download Official Transcript".
  2. **Courses & Grades**: Active semester curriculum with credit weightages and cumulative GPA history.
  3. **Attendance Records**: Session-by-session historical logs with course codes, faculty names, and status (`PRESENT`, `ABSENT`, `LATE`).
  4. **Bursar Ledgers**: Tuition fees breakdown, scholarship discounts, past payment receipts, and pending dues.
  5. **Library Circulation**: Active book loans, due dates, and return confirmations.
  6. **Requests & Petitions**: Full lifecycle management of formal academic petitions (see section 3.5).
  7. **Security & Sessions**: Active multi-device login sessions, IP tracking, password change, TOTP two-factor authentication setup, and GDPR Article 15/17 data export and erasure requests.

### 3.3 Attendance & Subject-Wise Tracking (`src/app/attendance/page.tsx`)
- **APIs**: `GET /api/attendance`.
- **Functionality**:
  - Displays overall biometric attendance percentage with visual color indicators (Green for $\ge 75\%$, Red for $< 75\%$).
  - Breakdown by enrolled course, listing classes attended vs total sessions delivered.
  - "Petition Attendance Discrepancy" button: Opens a pre-filled petition modal linking directly to the attendance engine.

### 3.4 Interactive Courseware & LMS (`src/app/lms/page.tsx`)
- **APIs**: `GET /api/lms`, `POST /api/lms`.
- **Functionality**:
  - Browse curriculum units, lecture notes, slide decks, and code repositories.
  - View simulated lecture video stream with 1080p HD status and verified course outcomes.
  - Interactive chapter completion toggle: Updates progress percentage in the database.
  - One-click verified lecture slide deck download.
  - "Explain via AI" copilot assistance for deep mathematical and theoretical concepts.

### 3.5 Requests & Petitions Desk (`src/app/students/profile/page.tsx?tab=requests`)
- **APIs**: `GET /api/students/requests`, `POST /api/students/requests`.
- **Functionality**:
  - Scholars submit formal petitions in 5 distinct categories:
    1. `LEAVE`: Leave of Absence / Medical Exemption
    2. `ATTENDANCE_CORRECTION`: Attendance Discrepancy Rectification
    3. `DOCUMENT_REQUEST`: Official Transcript / Bonafide Certificate
    4. `CERTIFICATE`: Course Completion / Degree Verification
    5. `ACADEMIC_CORRECTION`: Grade Discrepancy / Re-evaluation Petition
  - Real-time status updates with administrative justification and reviewer remarks upon resolution.

### 3.6 Examinations & Hall Tickets (`src/app/examinations/page.tsx`)
- **APIs**: `GET /api/examinations`, `GET /api/examinations/hall-ticket`.
- **Functionality**:
  - **Certified Results Dossier**: Displays officially certified marks, letter grades, and GPA contribution. Draft (unverified) faculty marks remain strictly hidden from student views until formally published by the exam controller.
  - **Official Hall Ticket / Admit Card**: One-click download of digitally signed admit cards with verification signature, candidate roll number, seat allocation, and examination venue.

---

## 4. Privacy, Security & Compliance

- **FERPA Compliance**: Student records, grades, and financial accounts are strictly isolated by session verification. Students can never view peer performance or exam drafts.
- **GDPR Article 15 & 17**: Provides cryptographic 256-bit SHA sealed data export and automated erasure requests.
- **Two-Factor Authentication (TOTP)**: Supports standard authenticator apps (Google Authenticator, Microsoft Authenticator, 1Password) with master emergency key overrides for session continuity.
