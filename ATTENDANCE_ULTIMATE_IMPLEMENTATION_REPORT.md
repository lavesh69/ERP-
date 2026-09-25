# CLASSROOM ERP — ATTENDANCE OPERATING SYSTEM
## ULTIMATE PRODUCTION TRANSFORMATION REPORT

**Target Environment:** `https://erp-omega-pink.vercel.app/attendance`  
**System Architecture:** Enterprise Academic Multi-Tenant Attendance Operating System  
**Test Suite Verification:** 421/421 Tests Passing (100% Pass Rate across 38 Comprehensive Test Groups)  
**TypeScript Compliance:** 100% Clean (`npx tsc --noEmit` exits 0)  

---

## 1. Executive Summary

The CLASSROOM ERP Attendance module has been successfully transformed from a standard roll-call page into a full-scale, multi-tenant, enterprise-grade **Academic Attendance Operating System**. 

The upgraded system tightly unifies:
1. **Academic Master Data Hierarchy:** Institutions → Campuses → Departments → Programs → Courses/Subjects → Semesters → Sections → Enrolled Students & Assigned Faculty.
2. **Multi-Factor Anti-Proxy Security Engine:** Time-synchronized HMAC SHA-256 rotating QR tokens (15s rotation window, 30s grace expiry), Hardware BLE Beacon proximity challenges with RSSI calibration (-59 dBm Tx power, -65 dBm calibrated at 1m), and GPS Haversine geodesic classroom boundary fences.
3. **6 Operational Persona Perspectives:**
   - **Student:** Real-time personal attendance dossier, subject matrix, Senate 75% exam cutoff monitor, admit card eligibility clearinghouse, and discrepancy petition filings.
   - **Teacher / Faculty:** Live timetable 1-click class launch, rapid bulk keyboard shortcuts (`[P]`, `[A]`, `[L]`, `[E]`, `[Space]`, arrows), dynamic full-screen projector mode, student petition review & resolution desk, and System Absence Engine auto-lock.
   - **Class Teacher:** Morning roll summary, enrolled section cohort radar, real-time section defaulters list (<75%), and 1-click pastoral guardian outreach alert dispatch.
   - **HOD (Head of Department):** Department curriculum delivery audit, faculty compliance rate tracking, real-time Missing Attendance Session Scanner, and department subject register generation.
   - **Institution Admin:** Campus & departmental governance, institutional attendance policy editor (with audit logging), and campus-wide defaulter rosters.
   - **Super Admin:** Global multi-institution telemetry command center, system-wide missing lecture detector, and Attendance Security Exception Radar (blocking replay attacks, GPS spoofing, unverified devices, and unauthorized faculty modifications).

---

## 2. Master Academic Data & Multi-Tenant Isolation

### 2.1 Hierarchy Integrity
Attendance is no longer an isolated table. It strictly validates against the university's relational master data:
- `Institution` (Apex root)
- `Campus` (Physical university sites)
- `Department` (e.g., Computer Science, Electrical Engineering, Biotechnology)
- `Program` (e.g., B.Tech CSE, M.Tech AI, B.Sc Bio, MBA)
- `Course` / `Subject` (15+ real accredited courses spanning CORE, ELECTIVE, LAB/PRACTICAL, and SEMINAR types)
- `Section` (Section 5-A, Section 5-B, etc., preventing student leakage across class cohorts)
- `StudentEnrollment` & `CourseFaculty` (Verifying authorized faculty assignment and student enrollment before any mark is logged)

### 2.2 Multi-Section Isolation
- Multiple sections conducting lectures for the exact same course on the exact same date maintain unique session IDs and isolated attendance rosters (`where: { courseId, sectionId, date }`).
- Zero cross-section student bleeding: Section 5-A students cannot be marked or viewed in Section 5-B rosters.

---

## 3. The 6 Persona Workflows & Perspectives

A persistent **Role Perspective Selector** is integrated at the top of `/attendance`, enabling seamless switching between automated role detection and specialized administrative radars:

### 3.1 Student Perspective (`STUDENT`)
- **Transparency Dossier:** Cumulative term percentage, lectures attended vs. conducted, admit card eligibility status (`ELIGIBLE` vs. `WITHHELD_DEFAULTER`).
- **Subject-Wise Matrix:** Displays course codes, subject types (Core/Elective/Lab), faculty names, attendance percentages, standing, and the recovery margin formula:
  $$\text{Classes Needed} = \left\lceil \frac{0.75 \times \text{Total} - \text{Attended}}{0.25} \right\rceil$$
- **Discrepancy Petition Filing:** Students can file a formal attendance correction request with justification and medical/duty leave proof directly to the professor and Academic Dean.

### 3.2 Teacher Perspective (`TEACHER`)
- **Live Timetable Smart Banner:** Detects active class based on server time and provides a 1-click button to launch the live projector mode with pre-configured parameters.
- **Bulk & Keyboard Controls:** Mark All Present, Mark Remaining Absent (with confirmation modal), Reset to Clean Defaults, and keyboard hotkeys.
- **Accidental Loss Prevention:** Unsaved change guards via `beforeunload` and offline localStorage draft persistence.
- **System Absence Engine:** Closing and locking a session automatically computes all unmarked enrolled students and logs them as `ABSENT` with provenance `SYSTEM_AUTO_CLOSE`.

### 3.3 Class Teacher Perspective (`CLASS_TEACHER`)
- **Section Overview Radar:** Enrolled cohort count, logged present count, absent count, and section-wide defaulter count.
- **Pastoral Outreach:** 1-click button to dispatch pastoral guardian notifications to parents of students under 75%.
- **Daily Section Sheet:** Direct export of section-specific morning roll records.

### 3.4 Head of Department Perspective (`HOD`)
- **Curriculum Delivery Governance:** Tracks percentage of scheduled departmental lectures actually conducted by faculty.
- **Missing Attendance Scanner:** Identifies faculty who held classes on the timetable but forgot to record attendance sessions.
- **Department Subject Register:** Comprehensive subject-level audit report generation.

### 3.5 Institution Admin Perspective (`INSTITUTION_ADMIN`)
- **Master Attendance Policy Editor:** Controls Senate minimum percentage, late grace periods (minutes), QR rotation frequency, geofence radius, and mandatory hardware BLE rules.
- **Audit Logging:** Every policy change is recorded with actor ID, timestamp, and previous vs. updated configurations in `AuditEvent`.

### 3.6 Super Admin Perspective (`SUPER_ADMIN`)
- **Global Governance Command:** Live metric cards showing total institutions, campuses, departments, programs, sections, faculty, and enrolled students.
- **Attendance Security Exception Radar:** Live telemetry feed of security incidents (replay attacks, out-of-perimeter GPS scans, unverified devices, and unauthorized faculty attempts).

---

## 4. Multi-Factor Anti-Spoofing & Security Architecture

| Security Mechanism | Specification | Mitigation |
| :--- | :--- | :--- |
| **Dynamic Rotating QR** | HMAC SHA-256 tokens rotating every 15s with 30s grace window | Prevents photo sharing and remote projector projection screenshots. |
| **Geofence Haversine** | GPS coordinates verified against classroom lat/long within 100m perimeter | Prevents students from scanning outside campus or from hostels. |
| **Hardware BLE Proximity** | Bluetooth Low Energy beacon challenge-response with RSSI calibration (-59 dBm Tx, -65 dBm 1m) | Guarantees physical in-room presence even when GPS is spoofed. |
| **Replay Attack Blocker** | Single-use token nonces stored in cache with compound unique keys | Prevents duplicate submissions of the same QR token by multiple devices. |
| **Session Immutability** | Finite State Machine (`DRAFT` → `ACTIVE` → `CLOSED` → `LOCKED`) | Once finalized or locked, records are immutable and require an approved petition to adjust. |

---

## 5. New API Endpoints

1. **`GET /api/attendance/policy` & `POST /api/attendance/policy`**
   - Retrieves and updates institutional attendance rules, thresholds, and verification mandates.
2. **`GET /api/attendance/missing`**
   - Cross-references scheduled timetable slots with conducted attendance sessions to find unrecorded lectures.
3. **`GET /api/attendance/exceptions` & `POST /api/attendance/exceptions`**
   - Live telemetry feed for tamper, proxy, and spoofing events.
4. **`GET /api/attendance/reports`**
   - Generates official `DAILY_SHEET`, `SUBJECT_REGISTER`, and `DEFAULTER_ROSTER` in RFC 4180 CSV and JSON formats.
5. **`GET /api/attendance` (Updated)**
   - Returns multi-tenant academic governance statistics, real-time command center telemetry, and full subject catalog integration.

---

## 6. Verification and Test Results

The test suite in `src/lib/test-runner.ts` was expanded to **38 Comprehensive Test Groups** and executed via `npm run test`:

```
=================================================
🎉 ALL 421/421 TESTS PASSED SUCCESSFULLY!
=================================================
```

- **Group 33:** Smart Attendance Operating System Engine & Multi-Factor Verification (21 tests)
- **Group 34:** Attendance Hardening, Authoritative Calculator & Session Immutability (29 tests)
- **Group 35:** Course Master Data Hierarchy, Multi-Section Isolation & Ingestion Engine (24 tests)
- **Group 36:** Attendance Policy Engine & Institutional Configuration (11 tests)
- **Group 37:** Missing Attendance Session Scanner & Security Exception Telemetry (7 tests)
- **Group 38:** Reporting Engine & Multi-Role Governance Matrix (14 tests)

---
*Generated by Senior Education-ERP Systems Architecture Team for CLASSROOM ERP.*
