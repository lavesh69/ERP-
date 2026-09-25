# CLASSROOM ERP — ATTENDANCE ROLE-BASED ACCESS CONTROL (RBAC) MATRIX

---

### 1. Attendance Role Permission Matrix

| Role | View Own | View Class Roster | Start / Project Session | Manual Mark | Close / Lock Session | Reopen Session | Approve Correction | Manage BLE Beacons | Export Reports |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **STUDENT** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **PARENT** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **FACULTY / PROFESSOR** | ❌ | ✅ (Assigned) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (Assigned) |
| **CLASS_TEACHER** | ❌ | ✅ (Section) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (Section) |
| **HOD** | ❌ | ✅ (Dept) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Dept) |
| **PRINCIPAL / DEAN** | ❌ | ✅ (Campus) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Campus) |
| **INSTITUTION_ADMIN** | ❌ | ✅ (Institution)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Institution)|
| **SUPER_ADMIN** | ❌ | ✅ (Platform) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Platform) |

---

### 2. Guard Implementations & Enforcements

1. **Student Isolation Barrier**:
   - `GET /api/attendance`: If `role === 'STUDENT'`, API forces execution down perspective (1) and filters strictly by `auth.payload.userId`. Students can never inspect class rosters, aggregate counts, or peer check-in logs.
2. **Faculty Course Assignment Barrier**:
   - A faculty member can only initiate attendance sessions and record manual marks for courses where they are assigned as instructor in the `CourseFaculty` relation.
3. **Session Lock Inviolability**:
   - Once a session transitions to `LOCKED`, teachers cannot arbitrarily modify records. Modifying locked attendance requires HOD or Dean-level permissions with a recorded justification in `AuditLog`.
4. **Hardware Management Restriction**:
   - BLE Beacon configuration (`/api/attendance/devices`) is restricted strictly to `INSTITUTION_ADMIN`, `SUPER_ADMIN`, and `HOD`. Students and basic instructors cannot register or alter hardware beacon identifiers.
