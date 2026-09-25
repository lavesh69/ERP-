# CLASSROOM ERP — ATTENDANCE TEST PLAN & VERIFICATION MATRIX

---

### 1. Verification Suites & Test Coverage Targets

| Test Suite Group | Test Case Identifier | Objective & Verification Standard | Target Result |
|---|---|---|---|
| **Cryptographic QR** | `TC-ATT-01` | Server generates 6-part `APX_ATT_V2` rotating token | Valid token generated with HMAC |
| **Tamper Resistance** | `TC-ATT-02` | Tampered token payload or signature rejected | Constant-time comparator fails |
| **Sliding Expiration** | `TC-ATT-03` | Expired token rejected after rotation interval | `400 Invalid/Expired Token` |
| **Server Geofencing** | `TC-ATT-04` | Haversine distance calculates accurate meters | Valid inside 100m, rejected outside |
| **Web Bluetooth Proximity** | `TC-ATT-05` | BLE challenge proof verified with valid RSSI | Rejected if RSSI < -80 dBm or wrong student |
| **Database Idempotency** | `TC-ATT-06` | Compound unique key `[sessionId, studentId]` blocks duplicates | Duplicate rejected with idempotency response |
| **Timetable Auto-Fill** | `TC-ATT-07` | Current period & day resolved to active course slot | Pre-fills Course, Section, Room, Faculty |
| **Manual Roster Marking** | `TC-ATT-08` | Statuses `PRESENT`, `ABSENT`, `LATE`, `EXCUSED` recorded | Updates aggregate percentage & DB |
| **Absence Engine** | `TC-ATT-09` | Unmarked students transition to `ABSENT` on session close | Auto-creates `ABSENT` records |
| **Session State Machine** | `TC-ATT-10` | `ACTIVE` → `PAUSED` → `CLOSED` → `LOCKED` transitions | Proper state transitions & audit log |
| **Correction Workflow** | `TC-ATT-11` | Student files petition; Faculty approval updates status | Atomic record update & audit log |
| **Multi-Tenant Protection** | `TC-ATT-12` | Cross-institution or unenrolled student check-in | Rejected with `403 Forbidden` |
| **CSV Report Generator** | `TC-ATT-13` | Serializes roster into valid RFC 4180 CSV | Includes header, student rows, stats |

---

### 2. Execution Phases
1. **Unit & API Integration Tests**: Automated suite in `src/lib/test-runner.ts` (Group 29 & Group 33).
2. **Typecheck & Static Analysis**: `npx tsc --noEmit`.
3. **Production Compilation**: `npm run build` validating all 90 routes.
4. **Git Version Control**: Line endings LF (`git add --renormalize .`), English commit, push to GitHub `main`.
5. **Live Production Smoke Testing**: Verification against `https://erp-omega-pink.vercel.app/attendance` and `/api/health`.
