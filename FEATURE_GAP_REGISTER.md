# CLASSROOM ERP — Comprehensive Feature Gap Register (FEATURE_GAP_REGISTER)

**Platform:** CLASSROOM — Autonomous School & College ERP / Academic Operating System  
**Repository:** `lavesh69/ERP-`  
**Standard:** UGC / AICTE Guidelines, NEP 2020 Framework, CBCS Regulations, NAAC Criteria 1–7  
**Status:** Complete Project-Wide Feature Gap Discovery across 23 Operational Domains  
**Mode:** AUDIT ONLY — Baseline Evidence Verification  

---

## 1. Executive Summary & Domain Coverage

This register documents every discovered feature gap, incomplete workflow, unintegrated subsystem, and architectural disconnect across all 23 institutional functional domains of CLASSROOM ERP.

Each finding is formulated according to the **16-Field Enterprise Audit Schema**:
1. `Finding ID`
2. `Module`
3. `Route / Component`
4. `Category`
5. `Current Behavior`
6. `Expected Enterprise Behavior`
7. `Evidence`
8. `Verification Status`
9. `Severity` (P0: Blocker, P1: High, P2: Medium, P3: Low)
10. `Priority` (Immediate, High, Medium, Low)
11. `User Impact`
12. `Business Impact`
13. `Root Cause`
14. `Recommended Improvement`
15. `Dependencies`
16. `Effort Estimate & Acceptance Criteria`

---

## 2. Domain-by-Domain Feature Gap Register

### 2.1 Admissions, Applicant Portal & Enrollment

#### GAP-ADM-001: Disconnected Applicant-to-Student Enrollment Bridge
* **Finding ID:** `GAP-ADM-001`
* **Module:** Admissions & Enrollment
* **Route / Component:** `/admissions/apply`, `src/app/api/admissions/route.ts:40-75`, `src/lib/admissions/admissions-store.ts`
* **Category:** Incomplete Workflow / Cross-Module Disconnect
* **Current Behavior:** Prospective students can submit admission applications, pay registration fees, and progress their state up to `SEAT_CONFIRMED`. However, there is no automated trigger or 1-click administrative action to generate an official institutional `Student` entity in Prisma, assign a permanent Roll/Registration number, or provision their default LMS account.
* **Expected Enterprise Behavior:** Upon seat confirmation and fee verification, an automated provisioning bridge should create the official `Student` entity in Prisma with assigned `currentSemester: 1`, section, academic advisor, and auto-generated user credentials.
* **Evidence:** `src/app/api/admissions/route.ts` only mutates `admissionsStore` (stored in `data/admissions.json`), with zero write calls to `prisma.student.create()`.
* **Verification Status:** Verified via code inspection and runtime execution.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Newly admitted students cannot log into the SIS or LMS after completing admissions.
* **Business Impact:** Manual data re-entry required by the Registrar's office, risking duplicate records and enrollment delays.
* **Root Cause:** Admissions store was developed as an isolated JSON-backed subsystem without a pipeline to the Prisma `Student` relational model.
* **Recommended Improvement:** Implement `POST /api/admissions/provision-student` that converts a confirmed applicant dossier into a `User` + `Student` + `StudentFee` atomic transaction.
* **Dependencies:** `prisma.user`, `prisma.student`, `prisma.studentFee`.
* **Effort Estimate & Acceptance Criteria:** M (3 days). Acceptance: Confirming an admission automatically outputs an active Student ID and initial semester fee schedule in the database.

---

### 2.2 Student Information System (SIS) & Student 360

#### GAP-SIS-001: Absence of Student Cohort Promotion & Rollback Engine
* **Finding ID:** `GAP-SIS-001`
* **Module:** Student Information System (SIS)
* **Route / Component:** `/students`, `src/app/api/students/promote/route.ts:18-45`
* **Category:** Functional Limitation
* **Current Behavior:** The promotion endpoint only performs basic batch incrementation of `currentSemester` without checking graduation eligibility, prerequisite completion, backlog caps, or fee clearance.
* **Expected Enterprise Behavior:** End-of-semester cohort promotion engine must enforce configurable academic standing rules (e.g., minimum CGPA 4.0, maximum allowable active backlogs <= 3, tuition fee clearance). If an administrative error occurs, a reversible promotion audit batch must allow rollbacks.
* **Evidence:** `src/app/api/students/promote/route.ts` increments `currentSemester: { increment: 1 }` unconditionally for all selected IDs without querying examination backlogs or Bursar hold flags.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Students with excessive backlogs or disciplinary suspensions are erroneously promoted to the next semester.
* **Business Impact:** Regulatory non-compliance with statutory university examination ordinances.
* **Root Cause:** Absence of cross-table constraint checks against `ExamResult` and `StudentFee` in the promotion handler.
* **Recommended Improvement:** Introduce an eligibility pre-check gate querying active backlogs and financial holds before executing the semester promotion.
* **Dependencies:** `prisma.examResult`, `prisma.studentFee`.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Promotion preview modal displays eligibility status (Eligible, Detained, Financial Hold) with override logs.

---

### 2.3 Faculty & Staff Management (HRMS)

#### GAP-HR-001: Volatile In-Memory Storage for Faculty Leave Applications
* **Finding ID:** `GAP-HR-001`
* **Module:** Faculty & Staff Management (HRMS)
* **Route / Component:** `/hr`, `src/app/api/hr/leaves/route.ts:128-165`
* **Category:** Data Integrity / Missing Persistence
* **Current Behavior:** Faculty and staff leave applications submitted via `POST /api/hr/leaves` are stored in an in-memory JavaScript array `SAMPLE_LEAVE_APPLICATIONS`. All submitted leaves are lost when the Next.js serverless function reloads or redeploys.
* **Expected Enterprise Behavior:** All leave applications (Casual Leave, Earned Leave, Medical Leave, Duty Leave) must be stored persistently with leave ledger tracking, quota deductions, and HOD approval workflows.
* **Evidence:** In `src/app/api/hr/leaves/route.ts`:
  ```typescript
  let SAMPLE_LEAVE_APPLICATIONS: LeaveApplication[] = [...];
  // ...
  SAMPLE_LEAVE_APPLICATIONS.unshift(newApplication);
  return NextResponse.json({ success: true, application: newApplication });
  ```
* **Verification Status:** Verified.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Faculty leave requests vanish randomly, leading to unexcused absence flags and payroll deductions.
* **Business Impact:** High labor grievance risk and inaccurate attendance/payroll calculations.
* **Root Cause:** Prototype placeholder array was never migrated to a dedicated Prisma model or persistent JSON store.
* **Recommended Improvement:** Create `StaffLeave` model in Prisma or back the store with `data/hr-leaves.json` with write lock guarantees.
* **Dependencies:** Prisma schema migration or file store.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Leave submissions survive server process restart and update available balance ledgers.

---

### 2.4 Attendance & Leaves Management

#### GAP-ATT-001: Absence of Biometric Device Sync Heartbeat & Device Registry in UI
* **Finding ID:** `GAP-ATT-001`
* **Module:** Attendance Operations
* **Route / Component:** `/attendance`, `src/app/api/attendance/devices/route.ts`
* **Category:** Operational Visibility Gap
* **Current Behavior:** The API supports biometric push events, but the frontend dashboard lacks a real-time device health monitor displaying IoT turnstile connection states, offline sync buffer size, and IP whitelists.
* **Expected Enterprise Behavior:** Campus IT and Estate administrators must have a dedicated "Biometric Turnstiles & Devices" tab displaying live device ping status, battery/network state, firmware versions, and sync logs.
* **Evidence:** `/attendance` page renders QR generator, BLE beacon scanner, and manual roster tabs, but does not render the data from `/api/attendance/devices`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Administrators cannot determine if attendance sync failure is due to student absence or hardware turnstile disconnection.
* **Business Impact:** Turnstile downtime goes unnoticed until end-of-day attendance reports are generated.
* **Root Cause:** UI tab for hardware device fleet management was not hooked to the existing `/api/attendance/devices` endpoint.
* **Recommended Improvement:** Add a "Biometric IoT Gateways" tab in the Attendance console displaying live status pills and sync diagnostic triggers.
* **Dependencies:** `/api/attendance/devices`.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Attendance UI shows turnstile IP, serial number, online/offline status, and last push timestamp.

---

### 2.5 Curriculum, Courses & NEP 2020 Framework

#### GAP-CUR-001: Absence of Academic Bank of Credits (ABC) & Digilocker APAAR Sync
* **Finding ID:** `GAP-CUR-001`
* **Module:** Curriculum & Academic Regulations
* **Route / Component:** `/institution`, `/students/profile`, `src/lib/academics/curriculum-store.ts`
* **Category:** Regulatory Compliance Gap (NEP 2020)
* **Current Behavior:** Courses define credits and lecture/tutorial/practical (L-T-P) hours, but student profiles do not store APAAR (Automated Permanent Academic Account Registry) / ABC IDs or export standardized XML credits to the national Digilocker NAD gateway.
* **Expected Enterprise Behavior:** In compliance with the National Education Policy 2020 and UGC guidelines, students must have an APAAR 12-digit identifier, and completed course credits must be exportable in the National Academic Depository (NAD) format.
* **Evidence:** Inspection of `Student` schema in `prisma/schema.prisma` reveals fields `enrollmentNo` and `rollNumber`, but lacks `apaarId` or `abcAccountId`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** High
* **User Impact:** Students transferring between universities cannot transfer credits through the government ABC portal.
* **Business Impact:** Non-compliance with mandatory UGC/AICTE regulatory directives for higher education institutions.
* **Root Cause:** Schema was designed prior to national APAAR/ABC mandate integration requirements.
* **Recommended Improvement:** Add `apaarId` to `Student` model and implement a NAD/ABC export utility under `/examinations`.
* **Dependencies:** `prisma.schema`.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Student profile allows APAAR ID entry and generates UGC ABC credit transfer summaries.

---

### 2.6 Timetable & Space Allocation

#### GAP-TT-001: Timetable Clash Resolution Lacks Automated Room Capacity Validation
* **Finding ID:** `GAP-TT-001`
* **Module:** Timetable & Space Utilization
* **Route / Component:** `/timetable`, `src/app/api/timetable/route.ts:50-95`
* **Category:** Functional Edge Case
* **Current Behavior:** The timetable constraint solver checks for teacher double-booking and room timeslot conflicts, but does not validate whether the assigned classroom seating capacity is equal to or greater than the enrolled cohort size.
* **Expected Enterprise Behavior:** When assigning course sections to physical lecture halls or labs, the solver must flag a hard error or warning if `Section.enrolledCount > Room.capacity`.
* **Evidence:** `src/app/api/timetable/route.ts` validates `roomClash = existing.roomId === slot.roomId && existing.dayOfWeek === slot.dayOfWeek && existing.period === slot.period`, but ignores room capacity metrics.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** A 120-student lecture section can be assigned to a 30-student seminar room.
* **Business Impact:** Facility chaos on the first day of classes.
* **Root Cause:** Capacity constraint was omitted from the conflict check logic.
* **Recommended Improvement:** Incorporate room capacity verification into the timetable scheduler constraint pipeline.
* **Dependencies:** `Room` model or facility attributes.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Scheduling a large class into a small room triggers an overcapacity alert.

---

### 2.7 Examinations, Evaluation & Grading

#### GAP-EXAM-001: Absence of Relative Grading (Bell Curve) & Moderation Audit Trail
* **Finding ID:** `GAP-EXAM-001`
* **Module:** Examinations & Evaluation
* **Route / Component:** `/examinations`, `src/app/api/examinations/moderation/route.ts:25-60`
* **Category:** Functional Limitation
* **Current Behavior:** Examination moderation allows bulk score adjustments (e.g. adding grace marks), but lacks an automated statistical Bell Curve (mean, median, standard deviation) grading generator and does not record the Board of Examiners (BoE) moderation resolution notes.
* **Expected Enterprise Behavior:** Controller of Examinations (CoE) requires statistical distribution graphs for each course exam with automated letter-grade distribution (O, A+, A, B+, B, C, P, F) based on standard deviations, accompanied by signed BoE resolution logs.
* **Evidence:** `src/app/api/examinations/moderation/route.ts` applies linear delta modifiers (`score + graceMarks`) without calculating standard deviation distribution curves or logging moderator committee IDs.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Examination cell officers must manually calculate relative grading cutoffs in external spreadsheets.
* **Business Impact:** Grading discrepancies, lack of auditability during student grade revaluation appeals.
* **Root Cause:** Only basic absolute mark adjustments were implemented in the moderation endpoint.
* **Recommended Improvement:** Add relative grading statistical calculations (Gaussian/Z-score distribution) and BoE minutes audit log to the moderation view.
* **Dependencies:** Exam results calculation utility.
* **Effort Estimate & Acceptance Criteria:** M (3 days). Acceptance: Course grade view displays standard deviation curve and auto-assigns 10-point UGC grade letters.

---

### 2.8 Learning Management System (LMS)

#### GAP-LMS-001: SCORM / xAPI Package Ingestion & Student Video Watch Progress Tracking
* **Finding ID:** `GAP-LMS-001`
* **Module:** Learning Management System (LMS)
* **Route / Component:** `/lms`, `src/app/api/lms/route.ts`
* **Category:** Missing Standard Feature
* **Current Behavior:** LMS supports uploading PDF notes, lecture links, and YouTube video embeds, but does not track student video playback percentage or support standardized SCORM 1.2 / 2004 e-learning zip packages.
* **Expected Enterprise Behavior:** Faculty should be able to upload interactive SCORM modules, and video resources should track playback duration (e.g., student must watch >= 80% to unlock accompanying quiz).
* **Evidence:** `src/lib/lms/lms-store.ts` only stores metadata (`title`, `url`, `type: 'VIDEO' | 'PDF'`), with no telemetry on student interaction time or SCORM manifest parsers.
* **Verification Status:** Verified.
* **Severity:** P3 (Low)
* **Priority:** Low
* **User Impact:** Faculty cannot verify whether students actually engaged with asynchronous digital learning materials.
* **Business Impact:** Inability to deliver accredited flipped-classroom or MOOC-style hybrid courseware.
* **Root Cause:** Basic file/link repository was prioritized over interactive LMS standard runtimes.
* **Recommended Improvement:** Add playback progress events in the LMS media player and record completion timestamps in `StudentProgress`.
* **Dependencies:** Client video player component.
* **Effort Estimate & Acceptance Criteria:** M (3 days). Acceptance: Video lectures log percentage watched and reflect completion checkmarks on student LMS cards.

---

### 2.9 Fee Collection, Accounting & Bursar

#### GAP-FIN-001: Absence of Automated Fine Schedules & Concession Quota Rules
* **Finding ID:** `GAP-FIN-001`
* **Module:** Finance & Bursar
* **Route / Component:** `/finance`, `src/app/api/finance/late-fines/route.ts:20-55`
* **Category:** Functional Automation Gap
* **Current Behavior:** Late fee calculation is triggered manually on-demand via query parameter rather than running as an automated recurring cron job matching institutional grace period rules.
* **Expected Enterprise Behavior:** Bursar system should allow configuration of institutional fine matrices (e.g. Grace Period 7 days; Days 8–15: \$5/day; Days 16+: flat \$50 fine), automatically updating outstanding student fee balances at midnight.
* **Evidence:** In `src/app/api/finance/late-fines/route.ts`, late fines are only computed when a user actively hits the GET endpoint with specific parameters.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Students receive unexpected fine additions only when viewing their account rather than on a predictable schedule.
* **Business Impact:** Delinquent fees are not systematically accrued on the institutional balance sheet.
* **Root Cause:** Background scheduler worker is not attached to a cron runner in serverless environments.
* **Recommended Improvement:** Implement a scheduled Vercel Cron or background worker job to execute late fine accruals daily.
* **Dependencies:** Background job runner or Vercel cron configuration.
* **Effort Estimate & Acceptance Criteria:** S (1.5 days). Acceptance: Daily scheduled run adds accrued late fees to overdue `StudentFee` records and notifies parents.

---

### 2.10 Scholarships & Financial Assistance

#### GAP-SCH-001: Inability to Auto-Disburse Approved Scholarships into Fee Balances
* **Finding ID:** `GAP-SCH-001`
* **Module:** Scholarships & Financial Aid
* **Route / Component:** `/scholarships`, `src/app/api/scholarships/route.ts`
* **Category:** Cross-Module Workflow Disconnect
* **Current Behavior:** When an administrator approves a scholarship application (`status: "APPROVED"`), the scholarship grant is marked approved in the scholarship store, but does not adjust or credit the student's active semester fee invoice in the Finance module.
* **Expected Enterprise Behavior:** Approving a tuition fee waiver or merit scholarship must automatically post a credit adjustment transaction against the student's pending `StudentFee` ledger record.
* **Evidence:** `src/lib/scholarships/scholarship-store.ts` updates its internal state without emitting an event or calling `prisma.studentFee.update()`.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Scholarship recipients continue to receive automated overdue fee notices and payment demands.
* **Business Impact:** Bursar accountants must manually cross-reference approved scholarship lists and manually apply discounts.
* **Root Cause:** Disconnected data models between `scholarshipStore` and `StudentFee`.
* **Recommended Improvement:** Hook scholarship approval action to automatically insert a fee concession entry in `src/app/api/finance/concessions/route.ts`.
* **Dependencies:** `prisma.studentFee`, `scholarshipStore`.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Approving a scholarship automatically reduces student payable fee balance by the approved scholarship amount.

---

### 2.11 Library Information System

#### GAP-LIB-001: RFID Gate & Barcode Circulation Scanner Webhook Absent
* **Finding ID:** `GAP-LIB-001`
* **Module:** Library Management
* **Route / Component:** `/library`, `src/app/api/library/route.ts:180-230`
* **Category:** Hardware Integration Gap
* **Current Behavior:** Issue and return transactions require manual typing of book accession numbers and student roll numbers in the UI. There is no USB/Bluetooth barcode scanner auto-focus mode or SIP2/NCIP RFID gate antenna protocol integration.
* **Expected Enterprise Behavior:** Library circulation desk should provide a rapid-entry mode that accepts continuous barcode/RFID wedge scanner input without needing mouse clicks, validating book checkout in < 2 seconds.
* **Evidence:** `src/app/api/library/route.ts` accepts JSON payloads, but the UI `/library` lacks auto-focus scanner input fields with debounce listeners.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Peak-hour library checkouts experience long student queues.
* **Business Impact:** Operational inefficiency and increased risk of unreturned library inventory.
* **Root Cause:** UI optimized for standard form input rather than continuous barcode keyboard wedge hardware.
* **Recommended Improvement:** Add a dedicated "Rapid Circulation Scanner" view with auto-cycling input focus and audible success/error tones.
* **Dependencies:** `/library` page component.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Circulation desk processes book barcode + student ID badge barcode in a single streamlined keypress event.

---

### 2.12 Campus Clinic & Health Records (EMR)

#### GAP-CLN-001: Medical Dispensing Does Not Decrement Pharmacy Inventory
* **Finding ID:** `GAP-CLN-001`
* **Module:** Campus Clinic & Health Records
* **Route / Component:** `/clinic`, `src/app/api/clinic/route.ts:60-110`
* **Category:** Cross-Module Disconnect
* **Current Behavior:** A doctor or nurse can log a student clinical consultation with prescribed medicines, but this prescription does not deduct quantities from the clinic's medicine stock inventory or check for expired pharmaceuticals.
* **Expected Enterprise Behavior:** When medicines are dispensed during a medical consultation, the clinic pharmacy inventory must automatically decrement stock counts and alert the medical officer if stock reaches minimum reorder levels.
* **Evidence:** `src/lib/clinic/clinic-store.ts` adds consultations to `consultations` array, but does not update stock counts in `medicineInventory`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Clinic staff can prescribe and dispense medications that are physically out of stock or past expiration.
* **Business Impact:** Clinical liability and risk of medication dispensing errors.
* **Root Cause:** The consultation logger and pharmacy inventory manager operate as isolated sub-arrays within `clinicStore`.
* **Recommended Improvement:** Link consultation prescription completion to stock decrement in `medicineInventory` within `clinicStore`.
* **Dependencies:** `src/lib/clinic/clinic-store.ts`.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Completing a consultation with "Paracetamol 500mg (10 tabs)" reduces inventory stock count by 10.

---

### 2.13 Hostel & Accommodation Operations

#### GAP-HST-001: Hostel Room Allocation Does Not Generate Billing Invoices
* **Finding ID:** `GAP-HST-001`
* **Module:** Hostel Operations
* **Route / Component:** `/hostel`, `src/app/api/hostel/route.ts:35-80`
* **Category:** Incomplete Financial Workflow
* **Current Behavior:** Allocating a student to a hostel room (Single, Double, AC, Non-AC) updates the bed occupancy state, but does not generate or attach a Hostel Fee invoice in the student's finance billing ledger.
* **Expected Enterprise Behavior:** Bed allocation must automatically invoke the Bursar fee engine, adding a room-type specific hostel and mess charge to the student's active semester fee bill.
* **Evidence:** In `src/lib/hostel/hostel-store.ts`, `allocateBed()` mutates room occupancy, with zero interactions with `StudentFee` or finance tables.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Students reside in university hostel facilities without receiving official fee billing notices.
* **Business Impact:** Revenue leakage; hostel fee recovery requires manual ledger reconciliation at the end of the academic year.
* **Root Cause:** Hostel subsystem was engineered independently from the primary Bursar module.
* **Recommended Improvement:** Dispatch a fee generation event on bed allocation that calls `prisma.studentFee.create()` or finance structure mapping.
* **Dependencies:** `prisma.studentFee`, `hostel-store.ts`.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Allocating a room generates an itemized "Hostel & Mess Fee" line item in `/finance`.

---

### 2.14 Transport & Fleet Management

#### GAP-TRN-001: Bus Pass Issuance Does Not Link to Bursar Ledger or GPS Geo-fencing
* **Finding ID:** `GAP-TRN-001`
* **Module:** Transport & Fleet Management
* **Route / Component:** `/transport`, `src/app/api/transport/route.ts:45-85`
* **Category:** Cross-Module Disconnect
* **Current Behavior:** Issuing a transport bus pass generates a pass record in the transport store, but does not verify fee payment in the Bursar module, nor does the vehicle tracking map connect to live GPS telematics webhooks.
* **Expected Enterprise Behavior:** A student bus pass must only transition to `ACTIVE` once the transport fee is settled, and vehicle coordinates should update via GPS tracker MQTT/REST webhooks.
* **Evidence:** `src/app/api/transport/route.ts` creates bus passes with `status: "ACTIVE"` unconditionally without inspecting `StudentFee`. Vehicle GPS locations in `/transport` are static coordinates.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Non-paying students can generate valid bus boarding QR codes; parents cannot track real-time school bus positions.
* **Business Impact:** Uncollected transport operational costs and lack of student safety monitoring.
* **Root Cause:** Transport module lacked integration hooks with finance and GPS device ingestion webhooks.
* **Recommended Improvement:** Enforce fee verification before bus pass activation and expose a webhook `/api/transport/telematics` for vehicle GPS units.
* **Dependencies:** `prisma.studentFee`, transport store.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Pass issuance requires fee clearance; incoming telematics payload updates map pins.

---

### 2.15 Cafeteria / Canteen & RFID POS

#### GAP-POS-001: Cafeteria Wallet Top-Up Bypasses Payment Gateway & Missing Daily Spend Caps
* **Finding ID:** `GAP-POS-001`
* **Module:** Cafeteria & RFID POS
* **Route / Component:** `/canteen`, `src/app/api/canteen/route.ts:69-105`
* **Category:** Security / Business Logic Flaw
* **Current Behavior:** The canteen API accepts arbitrary wallet balance additions (`action: "TOP_UP_WALLET"`) without verifying a payment gateway HMAC signature or checking parental daily expenditure caps.
* **Expected Enterprise Behavior:** Wallet top-ups must be initiated through Razorpay/Stripe, and parents should have the ability to enforce daily meal expenditure limits on student smart cards.
* **Evidence:** `src/app/api/canteen/route.ts:74-79`:
  ```typescript
  if (action === "TOP_UP_WALLET") {
    const { studentId, amount } = body;
    // Directly mutates balance without payment transaction ID or signature check
    wallet.balance += Number(amount);
  }
  ```
* **Verification Status:** Verified.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Students can manipulate client payloads to credit unlimited funds to their cafeteria wallets.
* **Business Impact:** Direct financial loss for campus food service vendors.
* **Root Cause:** Simulated demo endpoint logic was left in production without payment verification guards.
* **Recommended Improvement:** Route wallet top-ups through `/api/payments/create-order` and require verified payment callback verification before crediting funds.
* **Dependencies:** Payment gateway verification utility.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Wallet top-up requires a verified payment gateway transaction reference.

---

### 2.16 Placement, Careers & Internships (ATS)

#### GAP-CAR-001: ATS Resume Parser Uses Synthetic Fallback & Lacks Automated Offer Letter PDF
* **Finding ID:** `GAP-CAR-001`
* **Module:** Placement & Career Portal
* **Route / Component:** `/careers`, `src/app/api/careers/route.ts:35-85`
* **Category:** Functional Mock Fallback
* **Current Behavior:** Resume skill extraction synthesizes a mock skills array when parsing resumes, and candidate interview schedules are stored in an in-memory array `SCHEDULED_INTERVIEWS`.
* **Expected Enterprise Behavior:** Resumes must be parsed via OCR/NLP text extraction, candidate records must persist in the database, and issuing an offer should generate a signed institutional placement offer letter PDF.
* **Evidence:** `src/app/api/careers/route.ts:49` hardcodes `["React", "TypeScript", "Node.js"]` as matched skills; line 18 declares ephemeral `let SCHEDULED_INTERVIEWS = []`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Placement cell officers lose interview schedules after server restarts; resume match scores are synthetic.
* **Business Impact:** Inability to manage multi-company campus placement seasons accurately.
* **Root Cause:** Early prototype implementation using in-memory mock variables.
* **Recommended Improvement:** Migrate career data to `data/careers.json` or Prisma, and connect real text extraction.
* **Dependencies:** Persistent store, PDF generator.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Interview schedules persist across restarts and offer records generate exportable summaries.

---

### 2.17 Research, Grants & Publications

#### GAP-RES-001: DOI Publication Lookup Lacks Automated Scopus / Web of Science Indexing Verification
* **Finding ID:** `GAP-RES-001`
* **Module:** Research & Grants
* **Route / Component:** `/research`, `src/app/api/research/route.ts:40-75`
* **Category:** Academic Quality Verification Gap
* **Current Behavior:** Faculty can enter any DOI string or journal publication details, but the system does not query CrossRef or Scopus APIs to verify journal indexing (SCI, SCIE, Scopus, UGC-CARE) or fetch citation counts.
* **Expected Enterprise Behavior:** When faculty submit a DOI, the system should fetch publication metadata from CrossRef, populate citation counts, and verify whether the ISSN belongs to the UGC-CARE list for NAAC/NIRF reporting.
* **Evidence:** `src/lib/research/research-store.ts` stores user-entered strings without invoking external bibliographic verification APIs.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Research coordinators must manually cross-verify every faculty publication claim against official indexing databases.
* **Business Impact:** Risk of submitting fraudulent or predatory journal publications in institutional NAAC Criterion 3 / NIRF submissions.
* **Root Cause:** Absence of external CrossRef API integration in the publication submission pipeline.
* **Recommended Improvement:** Integrate CrossRef REST API (`https://api.crossref.org/works/{doi}`) to auto-fill journal, volume, citations, and indexing status.
* **Dependencies:** CrossRef API utility.
* **Effort Estimate & Acceptance Criteria:** S (1.5 days). Acceptance: Entering a valid DOI auto-fills title, authors, journal name, and publication date from CrossRef.

---

### 2.18 Alumni Relations & Convocation

#### GAP-ALM-001: Convocation No-Dues Clearance Workflow Bypassable Without Department Scoping
* **Finding ID:** `GAP-ALM-001`
* **Module:** Alumni & Convocation
* **Route / Component:** `/convocation`, `src/app/api/convocation/route.ts:40-70`
* **Category:** Authorization / Workflow Integrity
* **Current Behavior:** The convocation no-dues clearance action (`action: "UPDATE_CLEARANCE"`) allows any caller to mark Library, Laboratory, Hostel, Sports, and Accounts clearances as `CLEARED` in a single unauthenticated call.
* **Expected Enterprise Behavior:** No-Dues clearance requires role-segregated approvals: only the Librarian can clear library dues, only the Bursar can clear finance dues, and only the Warden can clear hostel dues.
* **Evidence:** In `src/app/api/convocation/route.ts`, `UPDATE_CLEARANCE` does not verify whether the authenticated user possesses the specific departmental authority for the target clearance item.
* **Verification Status:** Verified.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Students or unauthorized staff can mark all departmental dues as cleared without returning assets or settling debts.
* **Business Impact:** Material loss of library books, laboratory apparatus, and outstanding tuition balances prior to degree conferral.
* **Root Cause:** Missing department-level permission checks in the clearance mutation handler.
* **Recommended Improvement:** Enforce granular department role authorization checks before updating clearance status flags.
* **Dependencies:** `requireRole()` helper.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Only users with corresponding role (e.g. `LIBRARIAN` for library clearance) can update their respective clearance status.

---

### 2.19 Statutory Grievances & POSH Redressal

#### GAP-GRV-001: POSH Complaints Lack Encrypted Whistleblower Isolation & Anonymity Controls
* **Finding ID:** `GAP-GRV-001`
* **Module:** Grievances & Statutory Compliance
* **Route / Component:** `/grievances`, `src/app/api/grievances/route.ts:16-30`
* **Category:** Statutory Compliance / Privacy Risk (POSH Act)
* **Current Behavior:** Grievances of all categories (Academic, Hostel, Fees, Sexual Harassment / POSH) are returned in a single global list without separate encryption or restricted committee access controls.
* **Expected Enterprise Behavior:** In compliance with the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, POSH complaints must be cryptographically isolated and strictly restricted to the Internal Complaints Committee (ICC) presiding officer.
* **Evidence:** `src/app/api/grievances/route.ts` returns all complaints without filtering out confidential POSH dossiers from standard academic complaints.
* **Verification Status:** Verified.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Complainant identities and sensitive testimony in harassment cases are visible to general administrative staff.
* **Business Impact:** Severe legal liability under statutory POSH disclosure prohibitions and breach of student protection mandates.
* **Root Cause:** Grievance categories were grouped into a single unified table without dedicated sensitivity partitioning.
* **Recommended Improvement:** Implement strict category-based access control where `category === "POSH"` requires explicit `ICC_MEMBER` or `SUPER_ADMIN` role authorization.
* **Dependencies:** RBAC permission matrix.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: POSH complaints are completely hidden from non-ICC staff and students other than the filer.

---

### 2.20 Campus Safety, Security & Visitor Management

#### GAP-SEC-001: Emergency SOS Broadcast Callable by Any Authenticated User Without Confirmation
* **Finding ID:** `GAP-SEC-001`
* **Module:** Campus Safety & Emergency Response
* **Route / Component:** `/emergency`, `src/app/api/emergency/route.ts:40-65`
* **Category:** Operational Safety Hazard
* **Current Behavior:** Any authenticated student or staff member can trigger a university-wide `CRITICAL_LOCKDOWN` broadcast via `POST /api/emergency`, which broadcasts audio sirens and banner alerts to all active connected user sessions.
* **Expected Enterprise Behavior:** High-severity campus lockdown broadcasts must be strictly restricted to the Chief Security Officer, Registrar, or Vice Chancellor, requiring dual confirmation or PIN authorization.
* **Evidence:** In `src/app/api/emergency/route.ts`, `action: "BROADCAST_ALERT"` checks only basic authentication without requiring an administrative or security officer role.
* **Verification Status:** Verified.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Malicious or prank student accounts can trigger campus-wide panic broadcasts and false alarms.
* **Business Impact:** Reputational damage, disruption of classes, and potential emergency service false-alarm penalties.
* **Root Cause:** Missing role filter on the alert broadcast mutation.
* **Recommended Improvement:** Guard `BROADCAST_ALERT` with strict `requireRole(["SUPER_ADMIN", "ADMIN", "SECURITY_OFFICER"])`.
* **Dependencies:** `requireRole()` middleware.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: Student accounts calling emergency broadcast receive `403 Forbidden`.

---

### 2.21 Institutional Governance, Multitenancy & Super Admin

#### GAP-GOV-001: Tenant Database Connection String Isolation Absent in Multi-Campus Mode
* **Finding ID:** `GAP-GOV-001`
* **Module:** Multitenancy & Institutional Governance
* **Route / Component:** `/admin`, `src/lib/tenant/tenant-context.ts:15-55`
* **Category:** Architectural Scalability Limitation
* **Current Behavior:** Multi-campus tenancy is implemented via logical row-level tenant filtering (`tenantId` column) within a single shared database instance, lacking support for dedicated per-campus database connections or isolated schema configurations.
* **Expected Enterprise Behavior:** Large multi-institution universities or university systems require the option of physical database isolation (separate PostgreSQL connection string per tenant) to guarantee compliance with regional data residency requirements.
* **Evidence:** `src/lib/prisma.ts` initializes a single global Prisma client instance with `process.env.DATABASE_URL`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Cross-tenant query bugs could theoretically compromise row-level isolation in high-concurrency environments.
* **Business Impact:** Inability to pitch multi-tenant enterprise contracts requiring dedicated database isolation.
* **Root Cause:** Architectural choice of row-level multi-tenancy over dynamic database connection pooling.
* **Recommended Improvement:** Extend `tenant-context.ts` to support dynamic connection factory resolver when `TENANT_DB_STRATEGY=DATABASE_PER_TENANT`.
* **Dependencies:** Prisma client connection manager.
* **Effort Estimate & Acceptance Criteria:** L (5 days). Acceptance: Super-admin can configure isolated database connection URLs per institutional tenant.

---

### 2.22 Accreditation (NAAC / NBA / NIRF)

#### GAP-ACR-001: Absence of Automated SSR (Self Study Report) Document Assembly Engine
* **Finding ID:** `GAP-ACR-001`
* **Module:** Accreditation & Quality Assurance (IQAC)
* **Route / Component:** `/accreditation`, `src/app/api/accreditation/route.ts`
* **Category:** Functional Reporting Gap
* **Current Behavior:** The accreditation dashboard displays visual radar charts and quantitative metric scores for NAAC Criteria 1 through 7, but cannot compile or export the formal NAAC Self Study Report (SSR) DOCX/PDF template with appended evidentiary files.
* **Expected Enterprise Behavior:** IQAC directors require a 1-click "Generate NAAC SSR Dossier" button that aggregates faculty ratios, research publications, student feedback summaries, and infrastructure metrics into the standardized NAAC Word/PDF format.
* **Evidence:** `/accreditation` renders charts and score inputs, but lacks document compilation endpoints that package evidence attachments into an SSR zip file.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** IQAC teams must manually copy and paste numbers from the ERP into external NAAC portal submission forms.
* **Business Impact:** High manual effort and extended accreditation preparation cycles.
* **Root Cause:** Visual scoring was completed, but automated document assembly engine was deferred.
* **Recommended Improvement:** Implement `/api/accreditation/export-ssr` that merges institutional data into the official NAAC SSR template format.
* **Dependencies:** Document generation utility (`docx`/`pdf-lib`).
* **Effort Estimate & Acceptance Criteria:** M (3 days). Acceptance: System exports a populated SSR draft with all criteria metric tables.

---

### 2.23 Autonomous AI Assistant & Multi-Agent Swarm

#### GAP-AI-001: Absence of Token Budgeting, Rate Limiting & User Audit Logs on AI Agent Invocations
* **Finding ID:** `GAP-AI-001`
* **Module:** AI Copilot & Autonomous Agents
* **Route / Component:** `/ai-assistant`, `src/app/api/ai/agent/route.ts:25-80`
* **Category:** Operational Cost & Governance Risk
* **Current Behavior:** The 12 autonomous AI agents (Academic Advisor, Bursar Copilot, Timetable Solver, Examination Proctor, etc.) process queries via Gemini API without per-user daily token quotas, sliding-window rate limiting, or persistent prompt/response audit logs.
* **Expected Enterprise Behavior:** Institutional deployments must enforce tiered token allocations (e.g. Students: 10,000 tokens/day; Faculty: 50,000 tokens/day) and log all agent interactions to prevent confidential data exfiltration or unexpected cloud billing spikes.
* **Evidence:** In `src/app/api/ai/agent/route.ts`, queries are forwarded to the model runtime without checking Redis token buckets or logging tokens consumed per user session.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** A single user can exhaust the institution's monthly AI API budget by scripting automated queries.
* **Business Impact:** Uncontrolled LLM infrastructure expenses and lack of compliance tracking for sensitive prompt disclosures.
* **Root Cause:** Prototype LLM integration focused on prompt engineering without institutional rate limiting middleware.
* **Recommended Improvement:** Add user token consumption tracking to `User` or Redis, enforcing daily token quota checks before agent execution.
* **Dependencies:** Upstash Redis or Prisma token counter.
* **Effort Estimate & Acceptance Criteria:** S (1.5 days). Acceptance: Users exceeding daily token limit receive a friendly rate limit alert with reset timer.

---

## 3. Summary of Gaps by Priority & Severity

| Domain | Total Findings | P0 (Blocker) | P1 (High) | P2 (Medium) | P3 (Low) |
|---|:---:|:---:|:---:|:---:|:---:|
| **Admissions & SIS** | 2 | 0 | 2 | 0 | 0 |
| **Faculty & HR** | 1 | 1 | 0 | 0 | 0 |
| **Attendance & Academics** | 3 | 0 | 0 | 3 | 0 |
| **Examinations & LMS** | 2 | 0 | 0 | 1 | 1 |
| **Finance & Scholarships** | 2 | 0 | 1 | 1 | 0 |
| **Campus Logistics (Hostel, Transport, Library)** | 3 | 0 | 2 | 1 | 0 |
| **Campus Operations (POS, Clinic, Safety, Convocation)** | 4 | 3 | 0 | 1 | 0 |
| **Research & Accreditation** | 2 | 0 | 0 | 2 | 0 |
| **Governance & AI Security** | 4 | 1 | 1 | 2 | 0 |
| **Total** | **23** | **5** | **6** | **11** | **1** |

---

*End of Comprehensive Feature Gap Register.*
