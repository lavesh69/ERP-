# CLASSROOM — Autonomous Education ERP & Intelligent Classroom Management Platform

> "Your Complete Academic Operating System"

**CLASSROOM** is a production-grade, scalable, modern Education ERP uniting College/University ERP, School ERP, LMS, Virtual Classroom, SIS, 16 RBAC Roles, 12 Autonomous AI Agents, Grounded RAG Knowledge Base, and Business Intelligence.

---

## 🎨 Design System: Ivory Bloom (`#FFF0F5`)

The frontend visual identity is rooted in the **Ivory Bloom (`#FFF0F5`)** aesthetic, constructed with:
- **Primary Canvas**: `#FFF0F5` (Ivory Bloom)
- **Primary Dark / Brand**: `#8E5368` (Deep Rose)
- **Primary Accent**: `#C9829B` (Soft Rose)
- **Container Background**: `#FCEEF3` (Blush Container)
- **Elevated Surfaces**: `#FFFFFF` (Crisp Elevated White Cards)
- **Subtle Borders**: `#EADDE2`
- **Typography**: `#242124` (Deep Charcoal for WCAG AAA contrast)
- **Operational Colors**: Success (`#3D8B67`), Warning (`#C58A35`), Danger (`#C75A5A`), Info (`#668CB8`)

---

## 👥 16 Core User Roles & Perspectives

Instant 1-click role switching is enabled in the top and side navigation for testing:
1. **SUPER_ADMIN**: Platform multi-tenant console, feature flags, telemetry, and root audits.
2. **INSTITUTION_ADMIN**: Campus management, departments, and academic calendars.
3. **PRINCIPAL / DIRECTOR**: Executive governance, faculty reviews, and accreditation evidence.
4. **HOD (Head of Department)**: Course structure, faculty workload allocation, cohort metrics.
5. **FACULTY / PROFESSOR**: Course delivery, attendance taking, rubric grading, question paper formulation.
6. **CLASS_TEACHER**: Section mentoring, attendance audits, and parent coordination.
7. **STUDENT**: Enrolled courses, timetable, coursework submissions, examinations, and AI tutor.
8. **PARENT / GUARDIAN**: Multi-child view, live attendance alerts, fees, and teacher messages.
9. **ACCOUNTANT**: Tuition ledgers, installment schedules, and payment gateways.
10. **LIBRARIAN**: Book cataloging, ISBN loans, fine calculations, and digital licenses.
11. **EXAMINATION_CONTROLLER**: Question bank, exam schedules, grading curves, and GPA transcripts.
12. **PLACEMENT_OFFICER**: Corporate recruitment drives, internship postings, and mock interview drills.
13. **RESEARCH_COORDINATOR**: Research grants, peer-reviewed publications, and patents.
14. **HR_STAFF**: Faculty leaves, service records, and appraisals.
15. **ALUMNI**: Alumni network, mentoring, and donation portal.
16. **GUEST**: Read-only campus inspection and public course directory.

---

## 🤖 12 Autonomous AI Agents & Grounded RAG

| Agent | Responsibility | Guardrail Enforced |
| :--- | :--- | :--- |
| **Academic Agent** | Concept tutoring, study plans, active recall flashcards | No |
| **Student Support Agent** | 24/7 student FAQ and campus navigation | No |
| **Faculty Assistant Agent** | Lecture outline synthesis, rubric generator | No |
| **Examination Agent** | Bloom's taxonomy question paper formulation | Requires Faculty Review |
| **Research Agent** | Literature discovery & citation bibliographies | No |
| **Career Agent** | Resume tailoring & technical mock interviews | No |
| **Internship Agent** | Candidate-to-listing matchmaking | No |
| **Scholarship Agent** | Eligibility verification & document auditing | Requires Bursar Sign-off |
| **Administration Agent** | Hall allocation optimization & room swap proposals | Requires Admin Approval |
| **Analytics Agent** | Cohort retention modeling & attendance risk flags | No |
| **Notification Agent** | Automated SMS/Email drafts for defaulters | Requires Dispatch Sign-off |
| **Knowledge Retrieval Agent** | Grounded institutional document search (RAG) with precise citations | Zero Hallucination |

> [!CAUTION]
> **Strict AI Guardrails**: Autonomous AI agents are strictly prohibited from mutating official academic grades, student financial ledgers, or disciplinary status without authorized human administrative review.

---

## 🚀 Quick Start & How to Run

### 1. Requirements
- Node.js 18+ (Tested on v24.18.0)
- npm 10+

### 2. Environment Setup
```bash
cp .env.example .env
npm install
```

### 3. Database Initialization & Seeding
```bash
npm run db:push
npm run db:seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Free Development / Trial Authentication (Firebase)

CLASSROOM provides a **100% Free Development & Trial Authentication System** using Firebase:
- **Google Sign-In**: Native OAuth popup flow.
- **Email/Password**: Sign in or register trial accounts.
- **Firebase Test Phone OTP (Zero SMS Cost)**: Pre-configured development test phone numbers bypass SMS carrier routing, enabling realistic 6-digit OTP verification with **$0.00 carrier fees**.
- **Firestore User Profile**: Syncs user profile documents to Cloud Firestore on authentication.
- **Vercel Hobby Deployable**: Zero native binary dependencies; instant deployment to Vercel Hobby tier.

📖 **Complete Configuration Guide**: See [FIREBASE_AUTH_SETUP.md](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/FIREBASE_AUTH_SETUP.md) for step-by-step instructions on configuring Google Sign-In and Firebase Test Phone numbers.

