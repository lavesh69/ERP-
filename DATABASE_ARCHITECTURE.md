# DATABASE ARCHITECTURE & SCHEMA SPECIFICATION

**System**: CLASSROOM — Autonomous Education ERP & Academic Operating System  
**Document Version**: 2.0 (Production Verified)  
**Authors**: Principal Database Architect, DevSecOps Lead  
**Last Verified**: September 24, 2026  

---

## 1. Executive Database Summary

CLASSROOM operates on an **Enterprise Dual-Engine Architecture** engineered for cloud scale and offline development parity:

1. **Production Engine**: **Neon Cloud Serverless PostgreSQL 16+** with PgBouncer connection pooling (`sslmode=require`).
2. **Development / Local Test Engine**: **SQLite 3** running in Write-Ahead Logging (`WAL`) mode with `busy_timeout = 5000ms`.
3. **ORM & Migration Layer**: **Prisma ORM 6.19+** with dual-schema synchronization managed via `prisma-deploy.mjs`.

```
               ┌────────────────────────────────────────────────────────┐
               │              CLASSROOM ERP Application API             │
               └───────────────────────────┬────────────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │        Runtime Engine Switcher      │
                        │        (src/lib/db/prisma.ts)       │
                        └─────────┬─────────────────┬─────────┘
                                  │                 │
                [Cloud / Vercel]  │                 │  [Local / Test]
                                  ▼                 ▼
                  ┌──────────────────────┐   ┌──────────────────────┐
                  │ Neon PostgreSQL 16+  │   │ SQLite 3 (WAL Mode)  │
                  │ PgBouncer Connection │   │ busy_timeout=5000ms  │
                  │ Pool (Auto-scaled)   │   │ Zero-latency mock db │
                  └──────────────────────┘   └──────────────────────┘
```

---

## 2. Institutional Multi-Tenant Hierarchy

All data records are bound by institutional tenancy. No orphan records or cross-institutional visibility are permitted:

$$\text{Platform Root} \longrightarrow \text{Institution} \longrightarrow \text{Campus} \longrightarrow \text{Department} \longrightarrow \text{Program} \longrightarrow \text{Semester} \longrightarrow \text{Section} \longrightarrow \text{Users}$$

### Tenancy Isolation Rules
1. **Institution Boundary**: All core models (`User`, `Campus`, `Department`, `Announcement`, `AuditLog`) maintain a foreign key reference to `Institution.id` (`onDelete: Cascade`).
2. **User Identity Boundary**: Every academic entity (`Student`, `Faculty`, `Parent`) resolves directly to a parent `User` record with unique institutional email and composite role index.
3. **Resource Scoping**: APIs enforce `WHERE institutionId = session.institutionId` on all write and read queries.

---

## 3. Relational Entity Domain Models

The database contains **38 normalized tables** organized into 12 functional domains:

### Domain 1: Identity, RBAC & Tenancy
* **`Institution`**: Primary tenant entity (`code`, `name`, `legalName`, `website`, `status`, `primaryColor`).
* **`Campus`**: Physical branch locations (`code`, `location`, `timezone`, `isMainCampus`).
* **`Department`**: Academic divisions (`CSE`, `ECE`, `MECH`, `BIOTECH`, `MGMT`).
* **`Program`**: Degrees offered (`B.Tech CSE`, `M.Sc AI`, `MBA`).
* **`AcademicYear` & `Semester`**: Institutional chronological divisions.
* **`Section`**: Cohort groupings (`Section A`, `Section B`).
* **`User`**: Base identity entity (`email`, `passwordHash`, `role`, `twoFactorEnabled`, `failedLoginAttempts`, `lockedUntil`, `mustChangePassword`).
* **`Role` & `Permission` & `RolePermission`**: Granular RBAC permission assignment.
* **`UserRole`**: Join table supporting multi-role assignment per user.
* **`UserSession`**: Persistent device session tracking table (`tokenHash`, `userAgent`, `ipAddress`, `device`, `lastActiveAt`).

### Domain 2: Academic Profiles
* **`Student`**: Scholar records (`rollNumber`, `admissionNumber`, `cgpa`, `attendanceRate`, `status`).
* **`Faculty`**: Instructor profiles (`employeeCode`, `designation`, `specialization`, `officeRoom`).
* **`Parent`**: Guardian profiles (`relationType`, `emergencyContact`).
* **`StudentParentRelation`**: Explicit many-to-many relationship linking multiple guardians to scholars.

### Domain 3: Courseware & LMS
* **`Course`**: Curricular subjects (`code`, `title`, `credits`, `theoryHours`, `labHours`, `syllabusText`).
* **`CourseModule`**: Thematic syllabus units.
* **`CourseChapter`**: Granular lessons, slide decks, video assets, and lecture notes.
* **`CourseFaculty`**: Faculty teaching assignments per semester.
* **`Enrollment`**: Student course registration (`status`, `attendancePct`, `currentGradeLetter`).

### Domain 4: Scheduling & IoT Campus
* **`Room`**: Classrooms, auditoriums, and labs (`roomNumber`, `capacity`, `iotStatus`, `rfidReaderId`).
* **`TimetableSlot`**: Time table schedule (`dayOfWeek`, `startTime`, `endTime`, `type`).

### Domain 5: Attendance Telemetry
* **`AttendanceSession`**: Distinct class instances conducted by faculty or biometric hardware.
* **`AttendanceRecord`**: Individual student mark (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `biometricPunchTime`).

### Domain 6: Assessment & Grading
* **`Assignment`**: Continuous assessments (`title`, `dueDate`, `maxPoints`, `rubricJson`).
* **`Submission`**: Student artifact submissions (`content`, `fileUrl`, `gradePoints`, `feedback`, `gradedById`).
* **`Exam`**: Midterms, finals, and quizzes (`type`, `totalMarks`, `weightage`).
* **`Question`**: Question bank items (`questionText`, `marks`, `bloomTaxonomyLevel`).
* **`ExamResult`**: Graded examination scores (`marksObtained`, `gradeLetter`, `moderatedMarks`).

### Domain 7: Bursar & Finance
* **`FeeStructure`**: Fee schedules (`tuitionFee`, `labFee`, `libraryFee`, `sportsFee`, `dueDate`).
* **`StudentFee`**: Student ledger billing records (`totalAmount`, `paidAmount`, `discountAmount`, `status`).
* **`PaymentTransaction`**: Cryptographic gateway transaction records (`referenceNumber`, `amount`, `paymentMethod`, `status`, `gatewayResponse`).
* **`Scholarship` & `ScholarshipApplication`**: Endowment and grant application lifecycle.

### Domain 8: Library ERP
* **`LibraryBook`**: Catalog entries (`isbn`, `title`, `author`, `category`, `totalCopies`, `availableCopies`).
* **`BookLoan`**: Circulation tracking (`issuedAt`, `dueDate`, `returnedAt`, `fineAmount`, `status`).

### Domain 9: Research & Careers
* **`ResearchProject`**: Grants and faculty research lab initiatives (`grantAmount`, `fundingAgency`, `status`).
* **`Publication`**: Journal articles, patents, and DOI indexed citations.
* **`JobPosting` & `JobApplication`**: Corporate placement drives and applicant tracking.

### Domain 10: Institutional Communications & Governance
* **`Announcement`**: Broadcast notices (`targetAudience`, `priority`).
* **`Notification`**: User-scoped direct notifications (`type`, `isRead`, `linkUrl`).
* **`AuditLog`**: Append-only compliance log (`actorUserId`, `action`, `targetEntity`, `detailsJson`, `ipAddress`).
* **`AcademicDocument`**: Stored institutional transcripts, diplomas, and research papers.

---

## 4. Foreign Key Constraints & Cascades

1. **Tenancy Cascade**: Deleting an `Institution` cascades down to delete its Campuses, Departments, Courses, and Users.
2. **Profile Integrity**: Deleting a `User` cascades down to delete associated `Student`, `Faculty`, `Parent`, `UserSession`, `Notification`, and `AcademicDocument` records.
3. **Ledger Protection**: `PaymentTransaction` records require a valid `StudentFee` parent and are locked to preserve bursar auditability.

---

## 5. Performance Indexing Matrix

| Table | Index Columns | Index Purpose |
|---|---|---|
| `User` | `email` (UNIQUE) | O(1) Authentication lookups |
| `UserSession` | `userId`, `tokenHash` (UNIQUE) | Multi-device session validation |
| `Student` | `rollNumber` (UNIQUE), `admissionNumber` (UNIQUE), `userId` (UNIQUE) | Scholar lookups & IDOR checks |
| `Faculty` | `employeeCode` (UNIQUE), `userId` (UNIQUE) | Staff lookup |
| `Course` | `code` (UNIQUE), `departmentId` | Curricular lookups |
| `Enrollment` | `[studentId, courseId]` (UNIQUE) | Duplicate registration prevention |
| `AttendanceRecord` | `[attendanceSessionId, studentId]` (UNIQUE) | Single mark per class session |
| `PaymentTransaction` | `referenceNumber` (UNIQUE), `studentFeeId` | Payment idempotency & ledger audit |
| `LibraryBook` | `isbn` (UNIQUE) | Book lookups |
| `AuditLog` | `institutionId`, `timestamp`, `action` | Rapid compliance audits |

---

## 6. Migration & Deployment Strategy

* **Deployment Hook (`prisma-deploy.mjs`)**:
  - Automatically identifies whether environment has Neon PostgreSQL connection strings (`DATABASE_URL`, `POSTGRES_PRISMA_URL`).
  - Swaps in `prisma/schema.postgresql.prisma` during cloud build.
  - Automatically pushes relational schema via `npx prisma db push --accept-data-loss`.
  - When in local offline environments, preserves `prisma/schema.sqlite.prisma` for sub-second test execution.
* **Zero Cost Constraint**: Compliant with Vercel Hobby and Neon Serverless Free-Tier (3 GiB compute-hours/month, 0.5 GiB storage).
