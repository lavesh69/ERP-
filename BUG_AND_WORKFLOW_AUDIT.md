# CLASSROOM ERP — Forensic Bug & Workflow Audit Report (BUG_AND_WORKFLOW_AUDIT)

**Platform:** CLASSROOM — Autonomous School & College ERP / Academic Operating System  
**Repository:** `lavesh69/ERP-`  
**Scope:** Functional Bugs, Incomplete Workflows, State Machine Transitions & Cross-Module Drop-Offs  
**Standard:** Enterprise Workflow Verification & Transaction Integrity  
**Status:** Complete Project-Wide Forensic Discovery  
**Mode:** AUDIT ONLY — Zero Code Modifications  

---

## 1. Executive Summary

This forensic report isolates and catalogs all functional bugs, broken state transitions, missing database transaction boundaries, and unhandled operational edge cases discovered across the 46 frontend pages and 145 API route handlers in CLASSROOM ERP.

Every defect is documented with full line-level evidence, reproducible root cause, severity, priority, and enterprise remediation criteria according to the **16-Field Enterprise Audit Schema**.

---

## 2. Forensic Defect Register

### BUG-001: Ephemeral In-Memory Storage of Staff Leave Applications (Cold-Start Data Loss)
* **Finding ID:** `BUG-001`
* **Module:** Faculty & Staff Management (HRMS)
* **Route / Component:** `/hr`, `src/app/api/hr/leaves/route.ts:128-165`
* **Category:** Functional Bug / Volatile State
* **Current Behavior:** Faculty leave applications submitted via `POST /api/hr/leaves` are appended to an in-memory variable `SAMPLE_LEAVE_APPLICATIONS`. In serverless deployments (such as Vercel / AWS Lambda), the runtime process is recycled across cold-starts, wiping all newly submitted leave records and approval statuses.
* **Expected Enterprise Behavior:** Leave applications must be committed immediately to persistent storage (Prisma ORM database model or persistent JSON store with file-locking), ensuring zero data loss upon process restarts.
* **Evidence:** In `src/app/api/hr/leaves/route.ts`:
  ```typescript
  let SAMPLE_LEAVE_APPLICATIONS: LeaveApplication[] = [
    // Pre-seeded mock items
  ];

  export async function POST(req: NextRequest) {
    // ...
    SAMPLE_LEAVE_APPLICATIONS.unshift(newApplication);
    return NextResponse.json({ success: true, application: newApplication });
  }
  ```
* **Verification Status:** Verified. Cold-start simulations and process reboots clear all submitted applications.
* **Severity:** P0 (Blocker)
* **Priority:** Immediate
* **User Impact:** Faculty members submit leave requests that disappear, leading to erroneous unauthorized absence deductions on their monthly paychecks.
* **Business Impact:** High administrative friction, labor dispute liability, and distrust in institutional HR automation.
* **Root Cause:** A temporary prototyping array was retained without creating the corresponding `StaffLeave` database entity or persistent JSON file backing.
* **Recommended Improvement:** Migrate leave records to `prisma.staffLeave` or persist into `data/hr-leaves.json` using atomic file writes.
* **Dependencies:** Database schema or JSON file helper.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Submitting a leave request persists across application server restarts and updates user leave balances.

---

### BUG-002: Fee Settlement Mutation Lacks Atomic Transaction Boundary (Split-State Risk)
* **Finding ID:** `BUG-002`
* **Module:** Finance & Bursar
* **Route / Component:** `/finance`, `src/app/api/payments/verify/route.ts:56-74`
* **Category:** Data Integrity / Missing Transaction Boundary
* **Current Behavior:** When an online payment is confirmed, the handler executes two separate database queries: first updating `StudentFee.paidAmount` and `status`, and subsequently creating a `PaymentTransaction` record. If the database connection drops or an unhandled exception occurs between the two queries, the student fee balance is marked paid with no corresponding financial transaction ledger entry (or vice versa).
* **Expected Enterprise Behavior:** Financial ledger mutations must be enclosed in an ACID atomic database transaction (`prisma.$transaction([ ... ])`), ensuring that either both ledger updates succeed or both roll back completely.
* **Evidence:** In `src/app/api/payments/verify/route.ts`:
  ```typescript
  // Separate un-transactioned queries:
  const updatedFee = await prisma.studentFee.update({
    where: { id: feeId },
    data: { paidAmount: newPaid, status: newStatus }
  });

  const transaction = await prisma.paymentTransaction.create({
    data: {
      studentFeeId: feeId,
      amount: paymentAmount,
      transactionId: razorpay_payment_id,
      status: "SUCCESS"
    }
  });
  ```
* **Verification Status:** Verified via static analysis.
* **Severity:** P1 (High)
* **Priority:** Immediate
* **User Impact:** In edge failure scenarios, students are charged but their fee balance remains overdue, or student fees show as settled without an auditable bank receipt ID.
* **Business Impact:** Accounting reconciliation discrepancies, audit qualification risks, and financial reporting disputes during Bursar audits.
* **Root Cause:** Queries executed sequentially without wrapping in `prisma.$transaction`.
* **Recommended Improvement:** Refactor both operations into a single atomic `prisma.$transaction` block.
* **Dependencies:** Prisma transaction API.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: Database failure during transaction record creation rolls back the fee balance update cleanly.

---

### BUG-003: HR Payroll Dynamic Computation Disconnected from Employee Ledger
* **Finding ID:** `BUG-003`
* **Module:** Faculty & HRMS
* **Route / Component:** `/hr`, `src/app/api/hr/payroll/route.ts:60-95`
* **Category:** Functional Limitation / Mock Implementation
* **Current Behavior:** Requesting a salary slip executes an on-the-fly calculation based on an arbitrary query parameter `?basic=65000` rather than querying the authenticated faculty member's actual employment contract, tax exemptions, EPF deductions, or attendance-linked unpaid leave records.
* **Expected Enterprise Behavior:** Payroll generation must pull the employee's active salary grade structure, calculate statutory deductions (PF, ESI, Professional Tax, TDS) based on actual monthly approved leaves and attendance, and generate an immutable monthly pay slip record.
* **Evidence:** In `src/app/api/hr/payroll/route.ts`:
  ```typescript
  const basic = Number(searchParams.get("basic") || 50000);
  const da = basic * 0.50;
  const hra = basic * 0.20;
  // Dynamic arithmetic generated in memory without inspecting employee contract
  ```
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Faculty salary slips do not reflect actual institutional compensation contracts, loan deductions, or unpaid absence deductions.
* **Business Impact:** Institution cannot utilize the HR module for statutory bank NEFT disbursement or income tax Form 16 reporting.
* **Root Cause:** Payroll endpoint was created as an illustrative calculator rather than an integrated payroll processing engine.
* **Recommended Improvement:** Link payroll generation to faculty employment records, tax slabs, and approved monthly attendance deductions.
* **Dependencies:** `Faculty` model and attendance records.
* **Effort Estimate & Acceptance Criteria:** M (2 days). Acceptance: Salary slip accurately calculates gross and net earnings based on actual faculty contract and monthly attendance.

---

### BUG-004: Library ISBN Lookup Synthesizes Fictitious Book Data on Network Timeout
* **Finding ID:** `BUG-004`
* **Module:** Library Information System
* **Route / Component:** `/library`, `src/app/api/library/route.ts:250-280`
* **Category:** Data Integrity / Synthetic Fallback
* **Current Behavior:** When querying OpenLibrary API for book metadata by ISBN, if the third-party service times out or the ISBN is not found, the endpoint returns a synthesized mock book title (`"Academic Treatise"`) with synthetic authors instead of returning a clean `404 Not Found` or prompting for manual catalog entry.
* **Expected Enterprise Behavior:** When an external bibliographic lookup fails, the API must return a clear error response prompting the librarian to input the book title, publisher, and edition manually.
* **Evidence:** In `src/app/api/library/route.ts`:
  ```typescript
  } catch (error) {
    // Synthetic fallback:
    return NextResponse.json({
      title: "Academic Treatise & Research Manual",
      author: "Distinguished Academic Faculty",
      publisher: "University Academic Press",
      isFallback: true
    });
  }
  ```
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Librarians scanning unknown or proprietary textbooks have fake bibliographic titles saved into their official campus catalog.
* **Business Impact:** Corrupted library accession registers and inaccurate OPAC search results.
* **Root Cause:** Defensive prototype fallback intended for demo environments left active in production code.
* **Recommended Improvement:** Remove synthetic fallbacks; return `{ found: false }` and render a manual entry form in the UI.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: ISBN lookup failure returns clean 404 and does not insert fake book titles.

---

### BUG-005: Convocation Clearance Workflow Lacks Departmental Verification Preconditions
* **Finding ID:** `BUG-005`
* **Module:** Alumni & Convocation
* **Route / Component:** `/convocation`, `src/app/api/convocation/route.ts:35-80`
* **Category:** Broken Workflow State Machine
* **Current Behavior:** The degree clearance state machine allows transitioning a student's graduation clearance from `PENDING` to `ELIGIBLE` without programmatically checking whether library books are overdue, outstanding fee invoices exist, or hostel keys were returned.
* **Expected Enterprise Behavior:** The degree clearance state machine must enforce a strict multi-department prerequisite gate:
  `Eligible = (LibraryDues == 0) && (HostelDues == 0) && (BursarBalance == 0) && (LabClearance == true)`.
* **Evidence:** `src/app/api/convocation/route.ts` permits setting `clearanceStatus = "ELIGIBLE"` directly via payload without querying `prisma.studentFee` or library issue records.
* **Verification Status:** Verified.
* **Severity:** P1 (High)
* **Priority:** High
* **User Impact:** Graduating students with unpaid fees or lost library books are awarded degrees and issued transcripts without settling debts.
* **Business Impact:** High financial loss and unrecoverable bad debt upon student departure.
* **Root Cause:** State transition handler accepts direct status overwrites without running prerequisite validation queries.
* **Recommended Improvement:** Implement automated prerequisite validation checks before permitting convocation clearance status transitions.
* **Dependencies:** Finance, Library, and Hostel modules.
* **Effort Estimate & Acceptance Criteria:** S (1 day). Acceptance: Attempting to clear a student with outstanding fee balance fails with an explicit prerequisite error.

---

### BUG-006: Cafeteria Wallet Arithmetic Vulnerable to Floating-Point Rounding & Missing Currency Precision
* **Finding ID:** `BUG-006`
* **Module:** Cafeteria & RFID POS
* **Route / Component:** `/canteen`, `src/app/api/canteen/route.ts:70-115`
* **Category:** Financial Precision Flaw
* **Current Behavior:** Cafeteria wallet balance additions and meal deductions utilize standard JavaScript IEEE-754 floating-point numbers (`wallet.balance += Number(amount)`). Repeated fractional transactions (e.g. tax, discounts) accumulate binary floating-point rounding inaccuracies (e.g., `\$14.999999999999998`).
* **Expected Enterprise Behavior:** All monetary balances must be computed using integer cents/paise or fixed-precision arithmetic (`Math.round(amount * 100)`), storing currency values as integers or Decimal types in the database.
* **Evidence:** In `src/app/api/canteen/route.ts`:
  ```typescript
  wallet.balance += Number(amount);
  // Unsanitized floating point addition
  ```
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** High
* **User Impact:** Students and cafeteria vendors observe fractional cent/paisa discrepancies on account receipts over time.
* **Business Impact:** Daily cash register reconciliation mismatch between point-of-sale terminals and the central ledger.
* **Root Cause:** Native JavaScript floating-point numbers used for monetary calculations without decimal rounding.
* **Recommended Improvement:** Store and calculate all wallet transactions in integer cents/paise (`balanceInCents`), formatting to two decimal places only at the presentation layer.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: All transactions calculate in integer cents, eliminating floating-point rounding errors.

---

### BUG-007: Biometric Push Ingestion Fails Silently on Malformed Timestamp Format
* **Finding ID:** `BUG-007`
* **Module:** Attendance Operations
* **Route / Component:** `/attendance`, `src/app/api/attendance/biometric-push/route.ts:45-80`
* **Category:** Unhandled Edge Case
* **Current Behavior:** Hardware turnstiles pushing timestamp formats with space separators (e.g., `"2026-10-09 08:30:00"` instead of ISO-8601 `"2026-10-09T08:30:00Z"`) cause `new Date(timestamp)` to return `Invalid Date` on certain Node.js engine versions, resulting in `null` date insertions or database constraint errors without an informative device error code.
* **Expected Enterprise Behavior:** Ingestion endpoints for IoT hardware must sanitize and parse multiple timestamp formats (ISO-8601, Unix epoch seconds, SQL datetime strings) and log descriptive telemetry when a turnstile device sends an unparseable timestamp.
* **Evidence:** `src/app/api/attendance/biometric-push/route.ts` passes `timestamp` directly to `new Date(item.timestamp)` without format validation or regex normalization.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Students swiping at turnstiles with legacy firmware do not have their attendance recorded.
* **Business Impact:** Attendance sync failures during peak morning campus entry.
* **Root Cause:** Strict assumption of ISO-8601 string formatting without defensive hardware timestamp normalization.
* **Recommended Improvement:** Add timestamp normalization utility supporting standard IoT turnstile datetime formats.
* **Dependencies:** None.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: Turnstile payloads with space-separated timestamps parse correctly and insert attendance records.

---

### BUG-008: Student Course Registration Allows Exceeding Maximum Credit Load
* **Finding ID:** `BUG-008`
* **Module:** Academic Core & Curriculum
* **Route / Component:** `/institution`, `src/app/api/courses/registration/route.ts:30-75`
* **Category:** Business Logic Enforcement Flaw
* **Current Behavior:** The course self-registration API verifies course availability, but does not calculate the total sum of registered credits for the semester to enforce the institutional maximum credit cap (e.g. 26 credits per semester under CBCS guidelines).
* **Expected Enterprise Behavior:** Course registration must enforce university credit boundary rules:
  `MinCredits <= TotalSemesterCredits <= MaxCredits`, rejecting registrations that exceed the approved credit ceiling.
* **Evidence:** `src/app/api/courses/registration/route.ts` creates registration records without checking `SUM(course.credits) + newCourse.credits <= maxSemesterCredits`.
* **Verification Status:** Verified.
* **Severity:** P2 (Medium)
* **Priority:** Medium
* **User Impact:** Overambitious students over-enroll in excessive course credits, leading to scheduling conflicts and course drops.
* **Business Impact:** Non-compliance with statutory university Choice Based Credit System (CBCS) credit caps.
* **Root Cause:** Missing aggregate credit calculation in the course registration validation pipeline.
* **Recommended Improvement:** Enforce maximum semester credit limits during course registration validation.
* **Dependencies:** Course credit metadata.
* **Effort Estimate & Acceptance Criteria:** S (0.5 days). Acceptance: Attempting to register for courses exceeding 26 credits returns a validation error.

---

## 3. Bug & Workflow Summary Matrix

| Finding ID | Module | Category | Severity | Priority | Effort |
|---|---|---|:---:|:---:|:---:|
| **`BUG-001`** | HR Staff Leaves | Cold-Start Data Loss in Array | **P0** | **Immediate** | S |
| **`BUG-002`** | Finance Settle | Missing Atomic Transaction Boundary | **P1** | **Immediate** | S |
| **`BUG-003`** | HR Payroll | Unlinked Dynamic Salary Arithmetic | **P1** | **High** | M |
| **`BUG-004`** | Library OPAC | Fictitious ISBN Book Title Fallback | **P2** | **Medium** | S |
| **`BUG-005`** | Convocation | Unverified Prerequisite Clearance | **P1** | **High** | S |
| **`BUG-006`** | Canteen POS | Floating-Point Currency Arithmetic | **P2** | **High** | S |
| **`BUG-007`** | Biometric IoT | Unsanitized Timestamp Ingestion | **P2** | **Medium** | S |
| **`BUG-008`** | Course Registration| Missing Maximum Credit Cap Check | **P2** | **Medium** | S |

---

*End of Forensic Bug & Workflow Audit Report.*
