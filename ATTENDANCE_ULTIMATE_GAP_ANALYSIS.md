# CLASSROOM ERP — ATTENDANCE OS: ULTIMATE GAP ANALYSIS & REMEDIATION PLAN

**Target**: `https://erp-omega-pink.vercel.app/attendance`  
**System Architecture**: Multi-Tenant Academic Operating System  
**Audit Date**: September 25, 2026  
**Auditor**: Senior ERP & Attendance System Architect

---

## 1. Executive Summary

This master gap analysis document inspects every layer of the CLASSROOM Attendance System across Database, Authentication, RBAC, Multi-Tenant Isolation, Academic Hierarchy, Teacher Operations, Student Self-Service, Class Teacher Mentorship, HOD Governance, Institution Admin Oversight, Super Admin Global Command, QR/BLE/Geofence Security, Session State Machine, Audit, Reporting, and Testing.

---

## 2. Master Gap Inventory by Domain & Severity

### Domain 1: RBAC & Governance Multi-Role Command Centers
- **GAP-01 [P0 CRITICAL] Single Frontend Role Split (Student vs Teacher Only)**
  - **Location**: `src/app/attendance/page.tsx` (Lines 1025-1805)
  - **Current Behavior**: The UI only checks `currentRole === "STUDENT"` vs `currentRole !== "STUDENT"`. HOD, Class Teacher, Institution Admin, and Super Admin all see the identical teacher marking page.
  - **Expected Behavior**: Provide role-specific specialized command centers:
    - `STUDENT`: Personal attendance dossier, enrolled subject matrix, monthly calendar, recovery margin calculator, petition tracker, QR self-scan.
    - `TEACHER`: Today's classes, smart start from timetable, live attendance room, fast bulk controls, keyboard shortcuts, QR projector.
    - `CLASS_TEACHER`: Section-level attendance oversight, morning roll summary, section defaulter alerts, pastoral parent coordination.
    - `HOD`: Department attendance dashboard, faculty lecture completion rate, department missing attendance detector, cohort risk analysis.
    - `INSTITUTION_ADMIN`: Campus & department attendance governance, institution attendance policy editor, institutional defaulter roster, campus audit logs.
    - `SUPER_ADMIN`: Platform-wide multi-institution monitoring, global filters, missing attendance detector, exception center, cross-tenant telemetry.
  - **Impact**: Administrative users lack governance oversight; HODs cannot inspect departmental compliance; Super Admins cannot monitor multi-tenant platform health.
  - **Fix**: Implement dedicated view components and role-based tabs in `src/app/attendance/page.tsx` and role-tailored API payloads in `src/app/api/attendance/route.ts`.
  - **Verification**: Verify each of the 6 roles renders its designated command center with correct metrics and access permissions.

---

### Domain 2: Missing Attendance Detector & Timetable Reconciliation
- **GAP-02 [P1 HIGH] Lack of Automated Missing Attendance Scanner**
  - **Location**: Backend (`src/app/api/attendance/` missing detector route)
  - **Current Behavior**: If a faculty member misses a lecture or forgets to take attendance, the timetable slot remains silent with no alert or exception log.
  - **Expected Behavior**: Automated backend scanner reconciles today's active timetable slots against conducted `AttendanceSession` records. Any slot whose start time has elapsed by >15 minutes without an active/completed session is flagged as `MISSING_ATTENDANCE`.
  - **Impact**: Classes go unrecorded without administrative notification; creates compliance violations with regulatory accreditation.
  - **Fix**: Implement `/api/attendance/missing` endpoint and UI alert banner displaying unrecorded scheduled lectures with teacher, room, and section.
  - **Verification**: Run timetable test with elapsed slots and verify missing classes are accurately flagged with zero false positives.

---

### Domain 3: Attendance Exception Center & Anomaly Telemetry
- **GAP-03 [P1 HIGH] Missing Centralized Security Exception Logger**
  - **Location**: `src/app/api/attendance/`
  - **Current Behavior**: Failed QR scans, geofence perimeter breaches, and tamper attempts log to console/winston but lack a dedicated queryable exception dashboard for Admins.
  - **Expected Behavior**: Dedicated Exception Center tracking:
    - QR token expiry / replay attempts
    - Student scan attempts for unenrolled subjects
    - Geofence boundary rejections
    - Direct modification attempts on finalized/locked sessions
    - Unauthorized faculty attendance overrides
  - **Impact**: Security administrators cannot audit spoofing or proxy attendance patterns.
  - **Fix**: Implement `/api/attendance/exceptions` route and exception center tab in Admin/Super Admin view.
  - **Verification**: Trigger simulated invalid scan and verify exception entry created with timestamp, actor, session, and rejection reason.

---

### Domain 4: Institutional Attendance Policy Management
- **GAP-04 [P1 HIGH] Hardcoded Attendance Rules & Thresholds**
  - **Location**: `src/lib/attendance/calculator.ts`
  - **Current Behavior**: Senate threshold is hardcoded to 75.0% (`SENATE_EXAM_THRESHOLD`). Late threshold (15m), QR rotation (15s), and allowed verification methods cannot be configured per institution.
  - **Expected Behavior**: Dynamic `AttendancePolicy` architecture supporting institution-level configuration:
    - Minimum required attendance percentage (e.g. 75.0%, 80.0%, 85.0%)
    - Late arrival cutoff minutes (e.g. 10m, 15m, 20m)
    - Late treatment policy (COUNT_AS_PRESENT, COUNT_AS_HALF, COUNT_AS_ABSENT)
    - Excused treatment policy (COUNT_AS_PRESENT, COUNT_AS_EXCUSED)
    - QR rotation seconds (10s - 60s)
    - Allowed methods (MANUAL, QR, BLE, GEOFENCE, COMBO)
    - Correction request window (e.g. 7 days, 14 days)
  - **Impact**: Institutions with different academic bylaws or faculty policies cannot customize attendance governance.
  - **Fix**: Create `src/lib/attendance/policy.ts` and `/api/attendance/policy` endpoint with persistence.
  - **Verification**: Update institution policy and verify calculator and session initialization respect configured parameters.

---

### Domain 5: Attendance Report Center & Data Export
- **GAP-05 [P2 MEDIUM] Lack of Dedicated Multi-Format Report Generator**
  - **Location**: Frontend and Backend API
  - **Current Behavior**: Attendance page offers only basic roster CSV export; no comprehensive institutional reports (Daily Register, Subject Matrix, Defaulter Notice Sheet, Section Summary).
  - **Expected Behavior**: Comprehensive `/api/attendance/reports` endpoint supporting:
    - Daily Attendance Sheet (all sections/subjects on a date)
    - Subject Attendance Register (term-long lectures conducted vs attended)
    - Student Defaulter Roster (all students < threshold with classes needed to recover)
    - Section Summary Sheet (aggregate section metrics)
    - Formats: CSV and JSON (for spreadsheet/PDF ingestion)
  - **Impact**: Academic registrars and exam controllers cannot export formal compliance and hall ticket clearance sheets.
  - **Fix**: Implement `/api/attendance/reports` with role-scoped boundaries and UI report generator modal.
  - **Verification**: Export report for Section 5-A and verify attendance rates match database calculations.

---

### Domain 6: Fast Attendance Controls & Keyboard Shortcuts
- **GAP-06 [P2 MEDIUM] Teacher Keyboard-First Efficiency & Rapid Bulk Actions**
  - **Location**: `src/app/attendance/page.tsx`
  - **Current Behavior**: Hotkeys P/A/L/E only trigger if mouse is hovered over a specific row (`hoveredStudentId`). No arrow key navigation between students; missing "Mark Remaining Absent" and "Reset Unmarked" actions.
  - **Expected Behavior**:
    - Arrow Up / Arrow Down navigation through roster items
    - Enter key opens student details / focuses status
    - Quick actions: "Mark All Present", "Mark Remaining Absent", "Reset All", "Invert Selection"
    - Confirmation modals for destructive bulk operations
  - **Impact**: Takes teachers too many clicks to record large cohorts (60+ students).
  - **Fix**: Add active focused index state, Arrow navigation, and one-click bulk controls with confirmation.
  - **Verification**: Navigate roster entirely via Arrow keys and mark attendance with single keystroke.

---

### Domain 7: Tenant & Resource Isolation (IDOR Protection)
- **GAP-07 [P0 CRITICAL] Cross-Tenant & Cross-Student IDOR Guards**
  - **Location**: `src/app/api/attendance/route.ts` & `src/app/api/attendance/sessions/route.ts`
  - **Current Behavior**: Student view relies on session, but could leak if query parameters allow arbitrary `studentId`. Teacher route verifies assignment, but needs explicit multi-tenant validation against `institutionId`.
  - **Expected Behavior**:
    - Strict server-side verification: `studentId` derived exclusively from verified JWT session for STUDENT role.
    - Teacher role restricted to assigned courses, timetable slots, or departmental courses.
    - HOD restricted to department courses.
    - Institution Admin restricted to institution campus/departments.
    - Super Admin authorized across all tenants with explicit audit logging.
  - **Impact**: Potential unauthorized data disclosure across sections or institutions.
  - **Fix**: Fortify authorization guards in all attendance endpoints with strict tenant and department checks.
  - **Verification**: Attempt cross-tenant session query in unit test and confirm 403 Forbidden.

---

## 3. Implementation Roadmap & Architecture

| Phase | Milestone | Deliverables |
| :--- | :--- | :--- |
| **Phase A** | Backend Policy & Exception Services | `src/lib/attendance/policy.ts`, `/api/attendance/policy`, `/api/attendance/exceptions`, `/api/attendance/missing` |
| **Phase B** | Reporting & Export Engine | `/api/attendance/reports` with CSV/JSON exports for Daily, Subject, Defaulter, and Section |
| **Phase C** | Backend RBAC & Role Payloads | Expand `GET /api/attendance` to return tailored datasets for HOD, Class Teacher, Institution Admin, Super Admin |
| **Phase D** | Frontend Command Centers | Add specialized views in `src/app/attendance/page.tsx` for HOD, Class Teacher, Admin, and Super Admin |
| **Phase E** | Fast Attendance & Keyboard UX | Arrow navigation, Mark Remaining Absent, confirmation modals, tactile feedback |
| **Phase F** | Test Suite Expansion | Groups 36, 37, 38 in `src/lib/test-runner.ts` validating policies, missing attendance, exceptions, and RBAC |
| **Phase G** | Build, Deploy & Live Verification | `npm run test`, `npm run build`, `git push origin main`, live health validation |
