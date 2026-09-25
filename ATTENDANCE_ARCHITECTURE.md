# CLASSROOM ERP — SMART ATTENDANCE ARCHITECTURAL SPECIFICATION
DYNAMIC QR ROTATION • BLUETOOTH BLE • GEOFENCING • ANTI-PROXY AUDIT • PETITIONS

## 1. Executive Overview

The **Classroom ERP Smart Attendance System** represents a multi-modal, zero-trust attendance verification engine. Designed to eliminate student proxy marking, buddy punching, and out-of-classroom check-ins, the engine leverages four verification layers that can operate independently or in conjunction (`SMART_COMBO`).

```
                               ┌────────────────────────────────┐
                               │   FACULTY PROJECTOR / CONSOLE  │
                               │   - Active Attendance Session  │
                               │   - Rotating QR (15s Window)   │
                               │   - BLE Beacon Broadcaster     │
                               └───────────────┬────────────────┘
                                               │
                                 Cryptographic Challenge
                                               │
                 ┌─────────────────────────────┼─────────────────────────────┐
                 │                             │                             │
                 ▼                             ▼                             ▼
       ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
       │   1. ROTATING QR  │         │  2. GPS GEOFENCE  │         │  3. BLUETOOTH BLE │
       │  APX_ATT_V2 Token │         │  Haversine Radius │         │  RSSI Proximity   │
       │  15s Auto-Refresh │         │  <= 75 Meters     │         │  Threshold: -78dBm│
       └─────────┬─────────┘         └─────────┬─────────┘         └─────────┬─────────┘
                 │                             │                             │
                 └─────────────────────────────┼─────────────────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │   POST /api/attendance/verify   │
                               │   - Replay Attack Rejection    │
                               │   - Unique Constraint Check    │
                               │   - Audit Telemetry Logging    │
                               └────────────────┬───────────────┘
                                                ▼
                               ┌────────────────────────────────┐
                               │    DATABASE ATTENDANCE RECORD   │
                               │    Status: PRESENT / LATE       │
                               │    Badges: [QR] [GPS] [BLE]    │
                               └────────────────────────────────┘
```

---

## 2. Core Verification Vectors

### 2.1 Vector 1: Dynamic Rotating QR (`APX_ATT_V2`)
- **Protocol**: `APX_ATT_V2.<sessionId>.<courseId>.<nonce>.<expiresAt>.<signature>`
- **Token Rotation Interval**: Default 15 seconds (configurable from 10s to 60s).
- **HMAC-SHA256 Cryptography**: Signed using `ATTENDANCE_SECRET_KEY` on the server.
- **Constant-Time Verification**: Verification utilizes `crypto.timingSafeEqual` to eliminate timing attacks.
- **Replay Protection**: Expired tokens or tokens older than current timestamp are immediately rejected.

### 2.2 Vector 2: Geofence Validation (Haversine Formula)
- **Algorithm**: Great-circle distance computation between instructor lecture hall and student coordinates:
  $$\Delta \sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}$$
  $$d = R \cdot \Delta \sigma$$
- **Threshold**: Default radius $r \le 75\text{ m}$.
- **Accuracy Verification**: Enforces mobile browser geolocation accuracy threshold ($< 50\text{ m}$) to prevent GPS mock/spoofing tools.

### 2.3 Vector 3: Web Bluetooth (BLE Proximity)
- **Challenge-Response**: Server issues a cryptographic BLE challenge `BLE_CHALLENGE.<sessionId>.<studentId>.<timestamp>.<signature>`.
- **Hardware Integration**: Uses standard Web Bluetooth API (`navigator.bluetooth`) on Android, iOS (Chrome/Bluefy), macOS, and Windows.
- **RSSI Proximity Boundary**: Validated RSSI threshold (default $\ge -78\text{ dBm}$) ensuring the student's device is physically inside the designated classroom perimeter.

### 2.4 Vector 4: Multi-Factor Combo Verification (`SMART_COMBO`)
- Instructor can enforce any combination:
  - `QR_ONLY`: Dynamic rotating QR code.
  - `QR_AND_GEOFENCE`: QR code + student must be inside the GPS radius.
  - `SMART_COMBO`: All three factors (QR code + GPS radius + Bluetooth proximity) required for highest security exams and labs.

---

## 3. Database Architecture & Integrity Constraints

### Database Schema Models
```prisma
model AttendanceSession {
  id                  String   @id @default(uuid())
  courseId            String
  facultyId           String
  sectionId           String
  date                DateTime
  startTime           String
  endTime             String
  method              String   @default("MANUAL") // MANUAL, QR, BLUETOOTH, GEOFENCE, SMART_COMBO
  qrRotationSeconds   Int      @default(15)
  allowedRadiusMeters Float    @default(75.0)
  latitude            Float?
  longitude           Float?
  bleRequired         Boolean  @default(false)
  geofenceRequired    Boolean  @default(false)
  status              String   @default("ACTIVE") // ACTIVE, CLOSED, CANCELLED

  course              Course   @relation(...)
  faculty             Faculty  @relation(...)
  section             Section  @relation(...)
  records             AttendanceRecord[]
}

model AttendanceRecord {
  id                 String    @id @default(uuid())
  sessionId          String
  studentId          String
  status             String    @default("PRESENT") // PRESENT, ABSENT, LATE, EXCUSED
  remarks            String?
  verificationMethod String    @default("MANUAL")
  qrVerified         Boolean   @default(false)
  bluetoothVerified  Boolean   @default(false)
  geofenceVerified   Boolean   @default(false)
  distanceMeters     Float?
  verifiedAt         DateTime?
  markedBy           String?   // "STUDENT_SELF_SCAN", "FACULTY_MANUAL"

  session            AttendanceSession @relation(...)
  student            Student           @relation(...)

  @@unique([sessionId, studentId]) // Strictly prevents duplicate attendance
}
```

---

## 4. Attendance Petition & Automated Rectification Workflow

When a student has an unexcused absence due to authorized medical leave, sports representation, or hardware discrepancy:
1. **Submission**:
   - Student submits request via `POST /api/students/requests` with type `ATTENDANCE_CORRECTION`, including explanation and medical attachment URL.
2. **Review & Approval**:
   - Faculty or Academic Advisor reviews petition via `PATCH /api/students/requests`.
3. **Automated Ledger Update**:
   - On approval (`status: "APPROVED"`), the API automatically updates the corresponding `AttendanceRecord` to `EXCUSED` or `PRESENT`.
   - The record remarks are annotated with the request tracking ID: `Approved correction via request <id>`.
4. **Audit Trail**:
   - Generates an immutable `AuditLog` entry (`action: "ATTENDANCE_CHANGED"`) documenting previous status, new status, reviewer ID, and timestamp.
