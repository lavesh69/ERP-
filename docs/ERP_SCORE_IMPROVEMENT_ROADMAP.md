# CLASSROOM ERP — Score Improvement Roadmap

**Current Baseline Score:** 93.75%  
**Projected Target Score (Post-Roadmap Scenario):** 96.50% (+2.75 pp)  
**Objective:** Address identified competitor advantages (Tally accounting export, PostgreSQL cluster observability, WhatsApp Cloud API dispatcher, bulk student promotion rollover) while maintaining 100% test pass rates and zero regressions.

---

## 1. Top 10 Prioritized Improvements Matrix

| Task ID | Improvement Task | Baseline | Target Metric | Motivating Competitor | Impact (pp) | Complexity | Priority |
| :---: | :--- | :---: | :---: | :--- | :---: | :---: | :---: |
| **`IMP-01`** | **Tally Prime & Accounting XML Ledger Export** | 80% Integrations | 92% Integrations | Fedena / Entab / Frappe | +0.60 pp | Medium | **P1 (High)** |
| **`IMP-02`** | **Database Latency & Preflight Telemetry (`/api/health`)** | 86% Scalability | 95% Scalability | TCS iON / Academia | +0.45 pp | Low | **P1 (High)** |
| **`IMP-03`** | **Bulk Student Semester Promotion & Rollover Engine** | 94% Workflow | 98% Workflow | Academia / Frappe | +0.60 pp | Medium | **P1 (High)** |
| **`IMP-04`** | **WhatsApp Business Cloud API Webhook Adapter** | 78% Integrations | 90% Integrations | Teachmint / Entab | +0.60 pp | Medium | **P2** |
| **`IMP-05`** | **Automated Table CSV / Excel Export Utility** | 90% Analytics | 96% Analytics | Fedena / Frappe | +0.30 pp | Low | **P2** |
| **`IMP-06`** | **Automated Academic Transcripts PDF Generation Service** | 94% Workflow | 98% Workflow | TCS iON / Academia | +0.60 pp | Medium | **P2** |
| **`IMP-07`** | **Low-Bandwidth Offline QR Code Attendance Cache** | 96% Core ERP | 99% Core ERP | Fedena (Offline RFID) | +0.60 pp | Medium | **P2** |
| **`IMP-08`** | **Fine-Grained Custom DocType / Field Metadata Engine** | 82% Integrations | 90% Integrations | Frappe Education | +0.40 pp | High | **P3** |
| **`IMP-09`** | **Streaming LLM Token Generation in AI Assistant Studio** | 95% AI Studio | 99% AI Studio | Teachmint (EduAI) | +0.40 pp | Medium | **P3** |
| **`IMP-10`** | **Automated Load Testing & Micro-Benchmark Suite** | 94% Reliability | 98% Reliability | TCS iON (Mega-Scale) | +0.40 pp | Medium | **P3** |

---

## 2. Detailed Improvement Specifications

### `IMP-01`: Tally Prime & Accounting XML Ledger Export
- **Current Baseline:** Fee transactions exportable only as JSON or standard reports.
- **Target:** Endpoint `/api/finance?export=tally` generates compliant Tally Prime `<ENVELOPE>` XML format for 1-click accounting ledger imports.
- **Competitor Motivation:** Fedena and Entab provide Tally XML sync, saving bursar accountants hours of manual double-entry.
- **Acceptance Criteria:**
  1. `GET /api/finance?export=tally` returns `application/xml` content type.
  2. Output conforms to Tally XML Voucher schema (`VCHTYPE="Receipt"`, `<DATE>`, `<NARRATION>`, `<ALLLEDGERENTRIES.LIST>`).
  3. Includes student roll number, receipt number, and fee category breakdown.
- **Test Case:** Test suite Group 61 assertion verifying valid XML generation and voucher amount totals.

---

### `IMP-02`: Database Latency & Preflight Telemetry (`/api/health`)
- **Current Baseline:** `/api/health` reports status and rough database ping without dialect differentiation.
- **Target:** Accurate detection of SQLite vs PostgreSQL (Neon/Supabase), query roundtrip latency in milliseconds, active tenant counts, and system heap memory telemetry.
- **Competitor Motivation:** TCS iON and Academia provide real-time infrastructure telemetry dashboards for DevOps administrators.
- **Acceptance Criteria:**
  1. Correctly outputs `engine: "SQLite (Local / Vercel Serverless /tmp)"` or `"PostgreSQL (Neon Cloud / Supabase)"`.
  2. Latency reported accurately with sub-millisecond precision.
  3. All system health metrics served with `no-store` cache headers.
- **Test Case:** Test suite assertion checking JSON response keys for `database.engine`, `database.latencyMs`, and `system.uptimeSeconds`.

---

### `IMP-03`: Bulk Student Semester Promotion & Rollover Engine
- **Current Baseline:** Individual student promotions and institutional year rollover exist separately.
- **Target:** Batch promotion endpoint `/api/students/promote` enabling an entire class section to advance to the next semester with automatic backlog carrying and prerequisite clearance checks.
- **Competitor Motivation:** Academia by Serosoft and Frappe Education provide streamlined end-of-year batch advancement.
- **Acceptance Criteria:**
  1. Accepts `sourceSemesterId`, `targetSemesterId`, and array of student IDs.
  2. Checks each student's CGPA and backlog count against institutional advancement rules.
  3. Returns structured summary: promoted count, detained count, and audit event logs.
- **Test Case:** Group 61 assertion verifying bulk student promotion with prerequisite filtering.

---

## 3. Projected Target Scenario (Post-Implementation)

$$\text{Projected Score: } 96.50\% \quad (\text{Increase: } +2.75\text{ percentage points})$$

*Disclaimer: The projected score is a simulated target scenario assuming full verification and testing of the listed improvements. It does not reflect a static guarantee.*
