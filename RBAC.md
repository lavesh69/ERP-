# CLASSROOM ERP — ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSIONS SPECIFICATION

**Audit Date**: September 24, 2026  
**Auditor**: Principal Backend Security Engineer & IAM Architect  
**Architecture**: Multi-Tenant Tiered RBAC with Object-Level Ownership Checks  
**Roles Monitored**: 16 Institutional Roles  

---

## 1. Executive Summary

This document defines the Role-Based Access Control (RBAC) architecture, permissions matrix, and tenant boundary enforcement mechanisms for the CLASSROOM Educational Resource Planning (ERP) platform.

The system enforces the **Principle of Least Privilege (PoLP)** and **Defense in Depth**:
1. **Frontend Navigation Guarding**: Cosmetic hiding of unauthorized links and dashboard widgets.
2. **Edge Middleware Routing**: Path-level route protection in `src/middleware.ts`.
3. **Backend API Guards**: Cryptographic session verification and strict role validation in `src/lib/auth/admin-guard.ts`.
4. **Data-Layer Tenant Isolation**: Automatic row-level filtering by `institutionId` and `tenantId` across all Prisma queries.
5. **Broken Object Level Authorization (BOLA) Guards**: Resource ownership matching against authenticated JWT claims (`userId`, `studentId`, `facultyId`).

---

## 2. Institutional Role Hierarchy

```
                             ┌─────────────────────┐
                             │     SUPER_ADMIN     │
                             │ (Cross-Tenant Root) │
                             └──────────┬──────────┘
                                        │
                             ┌──────────▼──────────┐
                             │  INSTITUTION_ADMIN  │
                             │  (Campus Executive) │
                             └──────────┬──────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
  │    PRINCIPAL    │          │   ACCOUNTANT    │          │  EXAM_CONTROLLER│
  │  (Head of Inst) │          │(Bursar/Finance) │          │  (Evaluations)  │
  └────────┬────────┘          └─────────────────┘          └─────────────────┘
           │
  ┌────────▼────────┐
  │       HOD       │
  │ (Head of Dept)  │
  └────────┬────────┘
           │
  ┌────────┴────────────────────────────┐
  ▼                                     ▼
┌──────────────────┐                  ┌──────────────────┐
│     FACULTY      │                  │  CLASS_TEACHER   │
│(Course Instruct) │                  │ (Batch In-Charge)│
└────────┬─────────┘                  └────────┬─────────┘
         │                                     │
         └──────────────────┬──────────────────┘
                            ▼
         ┌─────────────────────────────────────┐
         │               STUDENT               │
         │           (Learner/Scholar)         │
         └──────────────────┬──────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │               PARENT                │
         │           (Guardian/Payer)          │
         └─────────────────────────────────────┘

Specialized Campus Roles:
- LIBRARIAN (Library Catalog, Circulation, Book Issue/Return, Fines)
- PLACEMENT_OFFICER (Career Drives, Interviews, Job Postings, Offers)
- RESEARCH_COORDINATOR (Grants, Publications, Ethics Clearance)
- HR_STAFF (Payroll, Faculty Onboarding, Leaves)
- ALUMNI (Networking, Mentorship, Events)
- GUEST (Trial / Evaluation Preview Session)
```

---

## 3. Comprehensive Institutional Permissions Matrix

**Legend**:
- **C** = Create
- **R** = Read (All within institution)
- **R\*** = Read (Own records only)
- **U** = Update (All within institution)
- **U\*** = Update (Own records only)
- **D** = Delete

| Role | Student Records | Faculty & Staff | Fee & Payments | Attendance | Exams & Marks | Library Books | System Audit |
|---|---|---|---|---|---|---|---|
| **SUPER_ADMIN** | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D |
| **INSTITUTION_ADMIN** | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | C / R / U / D | R |
| **PRINCIPAL** | R / U | R / U | R | R / U | R / U | R | R |
| **HOD** | R / U (Dept) | R / U (Dept) | - | R / U (Dept) | R / U (Dept) | R | - |
| **FACULTY** | R (Classes) | R\* | - | C / R / U (Classes)| C / R / U (Classes)| R | - |
| **CLASS_TEACHER** | R / U (Batch) | R\* | - | C / R / U (Batch) | C / R / U (Batch) | R | - |
| **ACCOUNTANT** | R | R (Payroll) | C / R / U | - | - | - | - |
| **EXAM_CONTROLLER** | R | R | - | R | C / R / U / D | - | - |
| **LIBRARIAN** | R | R | - | - | - | C / R / U / D | - |
| **PLACEMENT_OFFICER** | R / U (Placements)| - | - | - | - | - | - |
| **RESEARCH_COORDINATOR**| - | R | - | - | - | R | - |
| **HR_STAFF** | - | C / R / U | C / R / U (Payroll)| R | - | - | - |
| **STUDENT** | R\* / U\* | - | R\* / C\* (Pay)| R\* | R\* | R / R\* | - |
| **PARENT** | R\* (Child) | - | R\* / C\* (Pay)| R\* (Child) | R\* (Child) | - | - |
| **ALUMNI** | - | - | - | - | - | R | - |
| **GUEST (Trial)** | R\* (Mock) | R\* (Mock) | R\* (Mock) | R\* (Mock) | R\* (Mock) | R\* (Mock) | - |

---

## 4. Backend Guard Enforcement Implementation

All privileged routes enforce authorization via `src/lib/auth/admin-guard.ts`:

### 4.1 Role Guard Helper
```typescript
import { requireRoleAuth, requireAdminAuth, requireAuth } from "@/lib/auth/admin-guard";

// Super Admin & Institution Admin Only
export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req);
  if (auth instanceof NextResponse) return auth; // 401 or 403 returned automatically
  
  const tenantId = auth.payload.tenantId;
  // Execution continues safely with verified tenant context
}

// Academic Staff Guard
export async function PATCH(req: NextRequest) {
  const auth = await requireRoleAuth(req, ["SUPER_ADMIN", "INSTITUTION_ADMIN", "HOD", "FACULTY"]);
  if (auth instanceof NextResponse) return auth;
  // Authorized execution...
}
```

### 4.2 Multi-Tenant Data Scoping
To prevent cross-tenant leakage, queries must inject the tenant condition from the validated JWT token:
```typescript
const students = await prisma.student.findMany({
  where: {
    institutionId: auth.payload.institutionId, // Strict boundary
    status: "ACTIVE"
  }
});
```

---

## 5. Token Invalidation & Session Revocation

1. **Explicit Logout**: When `/api/auth/logout` is called, the session token is logged in the `UserSession` table as `revokedAt = now()`.
2. **Revocation Check**: `isTokenRevoked(token)` intercepts incoming calls in `admin-guard.ts`. Revoked sessions immediately yield `401 Unauthorized`.
3. **Password Change**: Changing user passwords (`/api/auth/change-password`) updates `passwordChangedAt`, automatically invalidating any prior JWT tokens issued before the timestamp.
4. **Account Lockout**: 5 failed consecutive password attempts trigger a 15-minute freeze (`lockedUntil = now() + 15m`).

---

## 6. Audit & Compliance Verification

- All vertical or horizontal privilege escalation attempts trigger a high-severity security event logged via `logger.security("FORBIDDEN_ROLE_ACCESS")`.
- Audit records store the actor ID, originating IP address, target path, and attempted action for compliance reporting under FERPA, GDPR, and ISO 27001.
