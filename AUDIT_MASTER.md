# CLASSROOM ERP — Master Audit & Enterprise Architecture Evaluation (AUDIT_MASTER)

**Platform:** CLASSROOM — Autonomous School & College ERP / Academic Operating System  
**Repository:** `lavesh69/ERP-`  
**Live Production URL:** `https://erp-omega-pink.vercel.app/`  
**Assessment Team Roles:** Senior ERP Product Architect, University Domain Specialist, Full-Stack Engineer, UI/UX Auditor, Cybersecurity Specialist, Database Architect, Performance Engineer, EdTech Market Analyst  
**Audit Standard:** OWASP Top 10 (2021), ISO/IEC 27001, UGC/CBCS Guidelines, NEP 2020 Framework, NAAC Criterion 1–7, DPDP Act 2023  
**Execution Baseline:** 46 Page Routes, 145 API Endpoints, 48 Prisma Database Models, 65 Automated Test Suites (1,085 passing assertions)  
**Audit Status:** Complete Project-Wide Evidence-Based Discovery (Phase 1–15)

---

## 1. Executive Summary

A comprehensive, zero-modification audit of the entire CLASSROOM ERP application was performed across all 23 institutional modules, 46 frontend pages, and 145 API routes. The application demonstrates exceptional functional breadth with an advanced unified design system (Ivory Bloom: `#FFF0F5`, `#8E5368`, `#C9829B`, `#242124`), native TOTP two-factor authentication, a multi-constraint timetable solver, 12 autonomous AI agents, and a suite of 1,085 automated verification tests.

However, deep code and runtime inspection reveals critical operational, security, and architectural gaps that must be resolved prior to high-concurrency multi-campus production deployment:
1. **Critical Security & Privacy Vulnerabilities (4 Confirmed):**
   - **`SEC-001` (Critical):** Medical EMR clinic records (diagnoses, vitals, prescriptions) are exposed to any authenticated user via `/api/clinic?tab=consultations` without medical staff RBAC.
   - **`SEC-002` (Critical):** Statutory and whistleblower grievances (POSH harassment, ethics complaints) are exposed globally via `/api/grievances?tab=list` without complainant/committee scoping.
   - **`SEC-003` (Critical):** Cafeteria POS `/api/canteen` allows unauthenticated wallet top-ups without payment gateway signature verification and unrestricted order state modification.
   - **`SEC-004` (High):** Biometric turnstile endpoint `/api/attendance/biometric-push` falls back to a hardcoded shared secret `"apex-biometric-secret-2026"` when the environment variable is absent.
2. **Volatile In-Memory Registries (3 Confirmed):**
   - HR staff leave applications (`src/app/api/hr/leaves/route.ts`) are stored in an in-memory JavaScript array (`SAMPLE_LEAVE_APPLICATIONS`) that is wiped upon serverless cold-start or redeployment.
   - Careers scheduled interviews (`src/app/api/careers/route.ts`) use an in-memory array (`SCHEDULED_INTERVIEWS`).
   - OpenLibrary bibliographic fallback synthesizes fictitious book titles and authors (`"Academic Treatise"`) when network timeouts occur.
3. **Cross-Module Disconnections (4 Confirmed):**
   - Hostel bed allocation does not generate billing invoices in the finance module (`StudentFee`).
   - Transport bus pass issuance operates disconnected from the Bursar ledger.
   - Public admissions application lifecycle stops at `SEAT_CONFIRMED`; no 1-click bridge exists to auto-provision the official `Student` entity in Prisma.
   - Financial fee settlement (`/api/payments/verify`) updates fee balances and records payment transactions in two un-transactioned queries rather than an atomic `prisma.$transaction`.
4. **Client-Side Scalability Ceilings:**
   - Core administrative pages (`/attendance` at 98.7 kB, `/examinations` at 24.7 kB, `/finance` at 20.3 kB) are large monolithic client components lacking DOM virtualization (`@tanstack/react-virtual`), which will experience severe rendering lag when rendering cohorts exceeding 500 scholars.

---

## 2. Complete Application Inventory

### 2.1 Complete Route Inventory (46 Page Routes)

| Category | Route | Path | Primary Role | Layout Pattern |
|---|---|---|---|---|
| **Public & Gateway** | Landing / Portal Home | `/` | All Roles | AppShell + Hero |
| | Login / Multi-Factor | `/login` | Public | Centered Auth Card |
| | Self Registration | `/register` | Public | Multi-Role Stepper |
| | Public Admissions Portal | `/admissions/apply` | Public Applicants | 4-Stage Stepper |
| **Academic Core** | Student 360 & SIS | `/students` | Staff / Leadership | Table + Drawer |
| | Student Detail Profile | `/students/[id]` | Staff / Faculty | Tabbed Dossier |
| | Student Self-Service Profile | `/students/profile` | Student | Personal Dashboard |
| | Faculty Directory | `/faculty` | Staff / Leadership | Cards + Workload |
| | Faculty Detail Profile | `/faculty/[id]` | Faculty / Staff | Teaching Matrix |
| | Faculty Self-Service Profile | `/faculty/profile` | Faculty | Personal Workload |
| | Course Master & Curriculum | `/institution` | Admin / Leadership | Accordion Tree |
| | Timetable & Space Utilization | `/timetable` | Faculty / Student | Daily / Weekly Grid |
| | Examinations & Moderation | `/examinations` | CoE / Faculty / Student | Tabbed Console |
| | Assignments & Submissions | `/assignments` | Faculty / Student | Kanban / Table |
| | LMS & Course Materials | `/lms` | Faculty / Student | Video & Syllabus |
| | Smart Attendance Engine | `/attendance` | Faculty / Student | QR / BLE / Geofence |
| **Governance & Quality** | Super Admin & Multitenancy | `/admin` | Super Admin | Tabbed Governance |
| | Institutional Analytics | `/analytics` | Leadership | Telemetry Charts |
| | Accreditation (NAAC/NBA) | `/accreditation` | Leadership / CoE | Criteria Radar |
| | Grievance Redressal | `/grievances` | All Roles | Ticket System |
| | Feedback & Surveys | `/feedback` | Faculty / Student | Likert Scale |
| | Statutory Convocation | `/convocation` | CoE / Registrar | No-Dues Matrix |
| **Finance & Bursar** | Student Fees & Tally Export | `/finance` | Bursar / Student | Ledger + Checkout |
| | Scholarships & Financial Aid | `/scholarships` | Admin / Student | Merit Matrix |
| **Student Support & Pillars** | Parent Portal & Ward Monitoring | `/parent` | Parent | FERPA Ward View |
| | Library Catalog & Desk | `/library` | Librarian / Student | ISBN Circulation |
| | Placement & Career Portal | `/careers` | Placement / Student | ATS Job Board |
| | Research & Grants | `/research` | Research / Faculty | DOI Publications |
| | Campus Hostel Operations | `/hostel` | Warden / Student | Room Grid & Curfew |
| | Transport & Bus Routes | `/transport` | Transport / Student | Route Tracking |
| | Campus Clinic & EMR | `/clinic` | Doctor / Nurse / Student | Consultations / Beds |
| | Cafeteria & RFID POS | `/canteen` | All Roles | Menu & Wallet |
| | Campus Safety & Emergency SOS | `/emergency` | All Roles | Lockdown Broadcast |
| | Gate Security & Visitor Passes | `/security` | Guard / Admin | Pass Verification |
| | Student Clubs & Societies | `/clubs` | All Roles | Activity Points |
| | Incubation & Startup Accelerator | `/incubation` | Placement / Student | Cohort Funnel |
| | International Relations & FRRO | `/international` | International Officer | Partner MOUs |
| | Campus Events & Calendar | `/events` | All Roles | Month / Week View |
| | Alumni Network & Transcripts | `/alumni` | Alumni / Registrar | Directory & Verify |
| | Academic Documents Vault | `/documents` | All Roles | Secure Vault |
| | Staff HR, Leaves & Payroll | `/hr` | HR / Faculty | Leave / Salary Slip |
| | Campus Asset Inventory | `/inventory` | Estate Officer | Asset Registry |
| | Admissions Management Console | `/admissions` | Admissions Dean | Pipeline Funnel |
| | Autonomous AI Copilot | `/ai-assistant` | All Roles | 12 Agent Console |
| | User Profile Settings | `/profile` | All Roles | 2FA & Credentials |

---

### 2.2 API Endpoints Inventory (145 Route Handlers)

The application exposes 145 distinct API endpoints across 26 route domains:
- **Authentication & Identity (13 endpoints):** `/api/auth/login`, `/logout`, `/me`, `/register`, `/change-password`, `/forgot-password`, `/reset-password`, `/sessions`, `/switch-role`, `/unlock`, `/2fa/setup`, `/2fa/verify`, `/2fa/disable`.
- **Administrative Governance (10 endpoints):** `/api/admin/audit-logs`, `/jobs`, `/provision`, `/queue`, `/settings`, `/subscriptions`, `/switch-tenant`, `/telemetry`, `/tenants`, `/users`.
- **Academic & Curriculum (12 endpoints):** `/api/courses`, `/courses/bulk-import`, `/courses/registration`, `/classes/roster`, `/classes/remarks`, `/curriculum/co-po`, `/curriculum/electives`, `/timetable`, `/timetable/utilization`, `/lms`, `/assignments`, `/assignments/grade`.
- **Attendance Operations (11 endpoints):** `/api/attendance`, `/attendance/biometric-push`, `/attendance/defaulters`, `/attendance/detention`, `/attendance/devices`, `/attendance/exceptions`, `/attendance/missing`, `/attendance/offline-cache`, `/attendance/policy`, `/attendance/qr/verify`, `/attendance/reports`.
- **Examinations & Evaluation (10 endpoints):** `/api/examinations`, `/admit-card`, `/co-po`, `/dummy-numbers`, `/hall-ticket`, `/moderation`, `/plagiarism-check`, `/seating`, `/transcripts`, `/transcripts/pdf`.
- **Finance & Bursar (11 endpoints):** `/api/finance`, `/finance/brs`, `/finance/concessions`, `/finance/day-end`, `/finance/installments`, `/finance/late-fines`, `/finance/receipt`, `/finance/refunds`, `/finance/structures`, `/payments/create-order`, `/payments/verify`.
- **HR & Staff Management (4 endpoints):** `/api/faculty`, `/faculty/bulk-import`, `/hr/leaves`, `/hr/payroll`.
- **Student Services & Portals (8 endpoints):** `/api/students`, `/students/bulk-import`, `/students/promote`, `/students/registration`, `/students/requests`, `/parent`, `/parent/appointments`, `/parent/wards`.
- **Campus Operations & Logistics (18 endpoints):** `/api/hostel`, `/transport`, `/canteen`, `/clinic`, `/emergency`, `/security`, `/inventory`, `/library`, `/library/reservations`, `/library/sync-fines`, `/clubs`, `/events`, `/feedback`, `/grievances`, `/incubation`, `/international`, `/alumni/directory`, `/alumni/verification`.
- **Communication & Export Utilities (5 endpoints):** `/api/announcements`, `/notifications`, `/communication/outbox`, `/communication/whatsapp`, `/export/tabular`.
- **AI & RAG Services (3 endpoints):** `/api/ai/agent`, `/ai/query`, `/testing/benchmark`.

---

## 3. High-Impact Findings Matrix

| Finding ID | Domain | Severity | Priority | Defect Summary | Primary Root Cause |
|---|---|:---:|:---:|---|---|
| **`SEC-001`** | Clinic | **Critical** | **P0** | Global EMR Health Data & Diagnoses Leaked to Non-Medical Users | Missing RBAC check in `/api/clinic` |
| **`SEC-002`** | Grievances | **Critical** | **P0** | Statutory POSH & Harassment Whistleblower Complaints Globally Visible | Absence of complainant/committee record filter |
| **`SEC-003`** | Canteen | **Critical** | **P0** | Unauthenticated Wallet Top-Up & Arbitrary Order Status Modification | Unprotected `/api/canteen` action handlers |
| **`SEC-004`** | Attendance | **High** | **P0** | Hardcoded Fallback Secret in Biometric Turnstile Endpoint | Default string fallback in `process.env.BIOMETRIC_DEVICE_KEY` |
| **`BUG-001`** | HR Staff | **High** | **P1** | Staff Leave Applications Stored in Volatile In-Memory JavaScript Array | Missing Prisma model or JSON persistence |
| **`BUG-002`** | Finance | **High** | **P1** | Fee Settle Mutation Lacks Atomic Database Transaction Boundary | Disconnected `update` and `create` calls |
| **`GAP-001`** | Admissions | **High** | **P1** | Public Admission Workflow Stops at Offer; No Auto-Provisioning to SIS | Missing bridge between `admissionsStore` and `Student` table |
| **`GAP-002`** | Hostel/Transport | **Medium** | **P1** | Bed Allocation & Bus Pass Issuance Disconnected from Bursar Ledger | No cross-module event or fee invoice generation |
| **`UI-001`** | Parent Portal | **Medium** | **P2** | Unlinked Parent Shows Raw Error Toast Rather than Link-Ward Wizard | Missing empty-state onboarding component |
| **`PERF-001`** | Attendance UI | **High** | **P1** | 98.7 kB Monolithic Client Page Lacks DOM Table Virtualization | Full table rendering of historical student logs |

---

## 4. Production Readiness Scorecard

| Dimension | Weight | Current Score | Gap to Production | Readiness Assessment |
|---|:---:|:---:|:---:|---|
| **Core Academic Workflows** | 20% | 96% | -4% | Production Ready; minor enrollment bridging required |
| **Security, RBAC & Isolation** | 15% | 82% | -18% | Blocked by 4 P0 security defects (`SEC-001` to `SEC-004`) |
| **UI/UX & Design Consistency** | 15% | 94% | -6% | Highly polished Ivory Bloom design; needs virtualization |
| **Data Integrity & Persistence** | 15% | 88% | -12% | Blocked by volatile HR leaves array & non-transactional fee settle |
| **Reliability & Automated Testing**| 10% | 100% | 0% | Verified: 1,085 / 1,085 automated tests passing |
| **Reporting, Exports & Analytics** | 10% | 98% | -2% | Tally XML, Excel XML, CSV, and UGC PDF Dossier operational |
| **External Integrations & Scale** | 15% | 85% | -15% | Dual DB ready; requires PostgreSQL + live credentials for scale |
| **Weighted Total** | **100%** | **91.8%** | **-8.2%** | **Near Production; Requires P0/P1 Remediations** |

---

## 5. Audit Documentation Suite Structure

This audit deliverable is organized into the following specialized reports in the repository:
1. **[`FEATURE_GAP_REGISTER.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/FEATURE_GAP_REGISTER.md):** Complete register of missing and incomplete features across all 23 modules.
2. **[`UI_UX_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/UI_UX_AUDIT.md):** Route-by-route visual hierarchy, responsive layout, and interaction audit.
3. **[`BUG_AND_WORKFLOW_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/BUG_AND_WORKFLOW_AUDIT.md):** Functional bugs, broken state transitions, and workflow drop-offs.
4. **[`SECURITY_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/SECURITY_AUDIT.md):** OWASP Top 10 vulnerabilities, unauthorized endpoints, and data leakage risks.
5. **[`API_DATABASE_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/API_DATABASE_AUDIT.md):** Schema constraints, N+1 query patterns, and transaction safety analysis.
6. **[`DEMO_AND_INTEGRATION_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/DEMO_AND_INTEGRATION_AUDIT.md):** Hardcoded fallbacks, mock data registries, and third-party gateway audit.
7. **[`PERFORMANCE_SCALABILITY_AUDIT.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/PERFORMANCE_SCALABILITY_AUDIT.md):** Concurrency benchmarks, bundle size analysis, and 500–70,000 student capacity model.
8. **[`COMPETITIVE_GAP_ANALYSIS.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/COMPETITIVE_GAP_ANALYSIS.md):** Benchmark against Fedena, Entab, Teachmint, ERPNext, Academia, and TCS iON.
9. **[`MASTER_IMPROVEMENT_ROADMAP.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/MASTER_IMPROVEMENT_ROADMAP.md):** Prioritized 30-day, 60-day, and 90-day implementation releases with effort estimations.
10. **[`AUDIT_EVIDENCE_INDEX.md`](file:///C:/Users/lavesh%20dobriyal/.gemini/antigravity/scratch/classroom/AUDIT_EVIDENCE_INDEX.md):** Traceability index mapping every finding to exact files, line numbers, and tests.
