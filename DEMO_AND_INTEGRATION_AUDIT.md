# CLASSROOM ERP — Forensic Demo, Mock & Integration Audit (DEMO_AND_INTEGRATION_AUDIT)

**Platform:** CLASSROOM — Autonomous School & College ERP / Academic Operating System  
**Repository:** `lavesh69/ERP-`  
**Scope:** In-Memory Volatile Stores, Mock Fallbacks, Synthetic Stubs & External Third-Party Integration Readiness  
**Target Gateways:** Payment Processors (Razorpay/Stripe), Messaging (WhatsApp/SMS), Cloud Storage (S3/R2), Biometrics (ZKTeco/eSSL), Bibliographic (OpenLibrary/CrossRef)  
**Status:** Complete Project-Wide Forensic Discovery  
**Mode:** AUDIT ONLY — Zero Code Modifications  

---

## 1. Executive Summary

A forensic review of all 145 API endpoints and 46 page routes in CLASSROOM ERP was conducted to detect hardcoded demo fallbacks, in-memory volatile variables, synthetic data generators, and incomplete third-party service gateways.

While core modules (Authentication, SIS, Examinations, Fee Ledger) are backed by the relational Prisma schema, several auxiliary modules rely on in-memory variables or prototype fallbacks. Additionally, communication and telematics modules feature robust interface abstractions whose live third-party API keys must be provisioned for production deployment.

This audit catalogues every volatile state variable, simulated service, and external integration gateway with actionable remediation steps according to the **16-Field Enterprise Audit Schema**.

---

## 2. In-Memory Volatile Registries & Synthetic Fallback Register

### Finding DEMO-MEM-001: HR Staff Leave Applications In-Memory Store
* **Finding ID:** `DEMO-MEM-001`
* **Module:** Faculty & HRMS
* **Route / Component:** `src/app/api/hr/leaves/route.ts:128-165`
* **Category:** In-Memory Volatile State (Cold-Start Wipe Risk)
* **Current Behavior:** Leave applications are stored in an in-memory array `SAMPLE_LEAVE_APPLICATIONS`. The array is re-initialized whenever the Node.js process restarts, destroying all newly submitted leaves.
* **Expected Enterprise Behavior:** Leave applications must be written immediately to a persistent store (Prisma database or atomic JSON file).
* **Evidence:** In `src/app/api/hr/leaves/route.ts`:
  ```typescript
  let SAMPLE_LEAVE_APPLICATIONS: LeaveApplication[] = [ ... ];
  ```
* **Verification Status:** Verified. Process restart wipes newly submitted applications.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Faculty leave requests and approval records are lost after server cold-starts.
* **Business Impact:** High administrative friction, inaccurate leave quotas, and labor dispute risk.
* **Root Cause:** Prototyping array was never connected to persistent database storage.
* **Recommended Improvement:** Migrate storage to `data/hr-leaves.json` or create a `StaffLeave` Prisma entity.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Newly submitted leave records persist across server restarts.

---

### Finding DEMO-MEM-002: Careers Portal Scheduled Interviews In-Memory Store
* **Finding ID:** `DEMO-MEM-002`
* **Module:** Placement & Careers (ATS)
* **Route / Component:** `src/app/api/careers/route.ts:18`
* **Category:** In-Memory Volatile State
* **Current Behavior:** Scheduled candidate interviews are pushed to an ephemeral array `SCHEDULED_INTERVIEWS = []`, which is wiped on process restart.
* **Expected Enterprise Behavior:** Interview slots, candidate IDs, company interviewers, and virtual meeting links must persist in the database.
* **Evidence:** In `src/app/api/careers/route.ts`:
  ```typescript
  let SCHEDULED_INTERVIEWS: any[] = [];
  ```
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Placement officers and students lose interview scheduling logs after server recycling.
* **Business Impact:** Missed campus recruitment interviews with corporate hiring partners.
* **Root Cause:** In-memory prototyping array left active.
* **Recommended Improvement:** Store interview appointments in `data/careers.json` with file-backed persistence.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: Scheduled interviews persist across application reloads.

---

### Finding DEMO-MOCK-001: Hardcoded ATS Candidate Skill Match Array
* **Finding ID:** `DEMO-MOCK-001`
* **Module:** Placement & Careers (ATS)
* **Route / Component:** `src/app/api/careers/route.ts:49`
* **Category:** Hardcoded Mock Fallback
* **Current Behavior:** When evaluating candidate resumes against job opening requirements, the endpoint injects a hardcoded skill list `["React", "TypeScript", "Node.js"]` into the candidate profile rather than extracting actual text tokens from uploaded resume files.
* **Expected Enterprise Behavior:** Resume parsing should execute genuine text extraction (via `pdf-parse` or OCR) and match extracted keywords against the job description's required skills.
* **Evidence:** In `src/app/api/careers/route.ts`:
  ```typescript
  matchedSkills: ["React", "TypeScript", "Node.js"], // Hardcoded demo fallback
  ```
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** All candidates show identical matched skills regardless of their actual resume contents.
* **Business Impact:** Misleading ATS placement scoring for corporate recruiters.
* **Root Cause:** Prototyped resume scoring logic used static sample data.
* **Recommended Improvement:** Implement regex or NLP token extraction against uploaded resume text.
* **Dependencies:** Text extraction utility.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Candidate match scores reflect actual keywords in their uploaded resume.

---

### Finding DEMO-MOCK-002: Bibliographic Fake Book Metadata Fallback
* **Finding ID:** `DEMO-MOCK-002`
* **Module:** Library Information System
* **Route / Component:** `src/app/api/library/route.ts:261`
* **Category:** Synthetic Data Fallback
* **Current Behavior:** When an external ISBN lookup times out or fails, the handler catches the error and returns a fake book titled `"Academic Treatise & Research Manual"`.
* **Expected Enterprise Behavior:** When lookup fails, the API must return a clean `404 Not Found` response with a prompt for manual data entry.
* **Evidence:** In `src/app/api/library/route.ts`:
  ```typescript
  title: "Academic Treatise & Research Manual",
  author: "Distinguished Academic Faculty",
  ```
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Unknown scanned textbooks are saved into the library catalog under fake names.
* **Business Impact:** Corrupted library catalog requiring manual database cleaning.
* **Root Cause:** Demo resilience fallback left in production code.
* **Recommended Improvement:** Remove synthetic book fallback and return clean `{ found: false }` status.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (0.25 days). Acceptance: ISBN search failure returns 404 without inserting synthetic titles.

---

### Finding DEMO-MOCK-003: Static GPS Telematics Coordinates in Campus Transport Map
* **Finding ID:** `DEMO-MOCK-003`
* **Module:** Transport & Fleet Management
* **Route / Component:** `/transport`, `src/lib/transport/transport-store.ts:25-50`
* **Category:** Simulated Hardware Data
* **Current Behavior:** Campus bus positions on the route map render fixed, hardcoded latitude/longitude coordinates (`28.6139, 77.2090`), with no connection to live IoT vehicle GPS trackers.
* **Expected Enterprise Behavior:** Vehicle coordinates should update via incoming GPS tracker telematics webhooks (`/api/transport/telematics`) or MQTT message brokers.
* **Evidence:** `src/lib/transport/transport-store.ts` initializes routes with fixed lat/long points that never change unless manually edited.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Parents and students see a static pin on the map rather than real-time school bus movement.
* **Business Impact:** Inability to provide live school bus safety tracking promised to parents.
* **Root Cause:** GPS telematics ingestion webhook was not implemented.
* **Recommended Improvement:** Create an ingestion webhook accepting vehicle ID and GPS coordinates to update bus positions.
* **Dependencies:** Map component.
* **Effort Estimate & Acceptance Criteria:** M (1.5 days). Acceptance: Ingesting GPS coordinates via API updates bus position on the map in real time.

---

## 3. External Gateway & Third-Party Integration Audit

The table below summarizes the operational readiness of all external third-party service gateways in CLASSROOM ERP:

| Integration Domain | Primary Provider | Integration Status | Production Readiness | Gap & Remediation Required |
|---|---|:---:|:---:|---|
| **Payment Gateway** | Razorpay / Stripe | **Functional Architecture** | **Production Ready** | Requires production `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` in environment. Webhook signature verification verified. |
| **Transactional Email** | SendGrid / Resend / SMTP | **Functional Architecture** | **Production Ready** | Requires live `SMTP_SERVER` / `RESEND_API_KEY` for transactional 2FA codes, fee receipts, and admit card emails. |
| **SMS & WhatsApp Gateway** | Gupshup / Fast2SMS / Twilio | **Mock Outbox Queue** | **Needs Gateway API Keys** | Messages are queued in `data/communication.json` outbox. Requires connecting outbox worker to Twilio/Gupshup REST API. |
| **Cloud Object Storage** | AWS S3 / Cloudflare R2 | **Local FS / Data URL** | **Needs S3 Bucket** | File uploads currently convert to base64 Data URLs or local disk. Production requires S3/R2 presigned URL upload pipeline for large files. |
| **Biometric IoT Turnstiles**| ZKTeco / eSSL Push | **Webhook Ready** | **Needs Secret Hardening** | Ingestion webhook is functional; requires removing default fallback secret (`SEC-004`) and configuring device whitelists. |
| **Bibliographic Services** | OpenLibrary / CrossRef | **Partially Integrated** | **Needs Fallback Clean** | OpenLibrary API integrated; requires removing synthetic fallback (`DEMO-MOCK-002`) and adding CrossRef for DOI lookup. |
| **LLM AI Copilot** | Google Gemini API | **Fully Integrated** | **Production Ready** | All 12 AI agents operational via Gemini API; requires daily token quota rate-limiting (`GAP-AI-001`). |

---

## 4. Integration Remediation Matrix

| Finding ID | Component | Defect Summary | Severity | Effort | Target Milestone |
|---|---|---|:---:|:---:|:---:|
| **`DEMO-MEM-001`** | `/api/hr/leaves` | Staff leaves in volatile array | P0 | S | Phase 1 (Week 1) |
| **`DEMO-MEM-002`** | `/api/careers` | ATS interviews in volatile array | P2 | S | Phase 1 (Week 1) |
| **`DEMO-MOCK-001`** | `/api/careers` | Hardcoded candidate skill match | P2 | S | Phase 2 (Week 3) |
| **`DEMO-MOCK-002`** | `/api/library` | Fictitious book title fallback | P2 | S | Phase 1 (Week 1) |
| **`DEMO-MOCK-003`** | `/transport` | Static bus GPS coordinates | P2 | M | Phase 2 (Week 3) |

---

*End of Forensic Demo, Mock & Integration Audit.*
