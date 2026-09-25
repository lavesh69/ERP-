# CLASSROOM ERP — ATTENDANCE OPERATING SYSTEM ARCHITECTURE
## Multi-Factor Dynamic Verification, Telemetry & Decision Engine Specification

---

### 1. Academic Hierarchy & Attendance Domain Topology

```mermaid
graph TD
    Inst[Institution: Apex University] --> Camp[Campus: South Delhi Main]
    Camp --> Dept[Department: Computer Science & AI]
    Dept --> Prog[Program: B.Tech Computer Science]
    Prog --> AY[Academic Year: 2026-2027]
    AY --> Sem[Semester: Fall 5th]
    Sem --> Course[Course: CS-402 Advanced Neural Networks]
    Course --> Sec[Section: 5-A]
    Sec --> Room[Room: Turing Lecture Hall 101]
    Sec --> Stud[Enrolled Students Roster]
    Room --> Ble[BLE Hardware Beacon: UUID / RSSI]
    Room --> Geo[GPS Coordinates: Lat / Lng / Radius]
```

---

### 2. Multi-Factor Verification & Decision Flow Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor T as Faculty / Teacher
    participant UI as Classroom ERP Frontend
    participant API as Attendance API Gateway
    participant DB as PostgreSQL / Neon
    actor S as Enrolled Student

    Note over T,UI: 1. Smart Session Initialization
    T->>UI: Selects Course / Clicks "Start Attendance"
    UI->>API: POST /api/attendance/sessions (Course, Room, Method, Cutoffs)
    API->>DB: Validate Teacher Assignment & Timetable Slot
    API->>DB: Create AttendanceSession (Status: ACTIVE)
    API->>API: Generate Initial Dynamic QR Token (APX_ATT_V2)
    API-->>UI: Session Created with Rotating Token

    Note over T,UI: 2. Dynamic QR Projection & Rotation
    UI->>UI: Fullscreen Projector Mode Active
    loop Every 15-45 Seconds
        UI->>API: GET /api/attendance/sessions/:id/qr
        API->>API: Check Window & Rotate Token with HMAC Nonce
        API-->>UI: New QR Token + Live Present Count
    end

    Note over S,API: 3. Multi-Factor Student Check-In
    S->>UI: Opens Scanner on Mobile Device
    UI->>UI: Activates Rear Camera Stream (jsQR)
    UI->>UI: Reads GPS Coordinates & Web Bluetooth Beacon
    S->>API: POST /api/attendance/qr/verify (Token, SessionId, GPS, BLE)
    API->>DB: Authenticate Student from JWT Cookie
    API->>DB: Verify Active Course Enrollment
    API->>API: Validate Cryptographic QR Signature & Expiration Window
    API->>API: Calculate Server Haversine Distance (GPS vs Room)
    API->>API: Validate BLE Challenge-Response & RSSI Perimeter
    API->>DB: Atomic Transaction: Insert AttendanceRecord & Update Aggregate
    API-->>S: HTTP 200 OK + Digital Attendance Receipt

    Note over T,DB: 4. Session Finalization & Absence Engine
    T->>UI: Clicks "Close & Lock Session"
    UI->>API: PATCH /api/attendance/sessions (action: "CLOSE")
    API->>DB: Atomically Mark All Unchecked Enrolled Students as ABSENT
    API->>DB: Transition Session Status to LOCKED
    API-->>UI: Session Finalized & Locked
```

---

### 3. Verification Modes & Governance Policy

| Mode | Required Multi-Factor Checkpoints | Use Case | Security Level |
|---|---|---|---|
| **`MANUAL`** | Faculty direct roster check-in | Small lab groups, outdoor practicum | Standard |
| **`QR`** | Authenticated session + Dynamic Rotating QR | General university lectures | High |
| **`QR_GEOFENCE`** | Dynamic QR + Server-side Haversine Distance Verification | Large lecture halls, auditorium classes | Very High |
| **`QR_BLE`** | Dynamic QR + Web Bluetooth Beacon Challenge Proof | High-security exam halls, specialized computing labs | Extremely High |
| **`SMART_COMBO`** | Dynamic QR + GPS Geofence (<100m) + BLE Beacon RSSI | Enterprise campus defense against proxy and spoofing | Maximum Military Grade |

---

### 4. Data Models & Entity Relationships

- **`AttendanceSession`**:
  - `id`: UUID Primary Key
  - `courseId`, `facultyId`, `sectionId`, `roomId`
  - `date`: Session calendar date
  - `startTime`, `endTime`: Scheduled instruction window
  - `method`: `MANUAL` \| `QR` \| `SMART_COMBO`
  - `status`: `DRAFT` \| `ACTIVE` \| `PAUSED` \| `SUBMITTED` \| `LOCKED` \| `CLOSED`
  - `qrCodeToken`, `qrNonce`, `qrExpiresAt`, `qrRotationSeconds`
  - `latitude`, `longitude`, `allowedRadiusMeters`
  - `bleDeviceId`, `bleBeaconId`, `bleRequired`, `geofenceRequired`
  - `closedAt`, `createdAt`, `updatedAt`

- **`AttendanceRecord`**:
  - `id`: UUID Primary Key
  - `sessionId`: Foreign Key to `AttendanceSession` (Cascade Delete)
  - `studentId`: Foreign Key to `Student` (Cascade Delete)
  - `status`: `PRESENT` \| `ABSENT` \| `LATE` \| `EXCUSED`
  - `verificationMethod`: `MANUAL` \| `QR` \| `BLUETOOTH` \| `GEOFENCE` \| `COMBO`
  - `qrVerified`, `bluetoothVerified`, `geofenceVerified`: Booleans
  - `distanceMeters`: Server-calculated proximity (GPS)
  - `markedBy`: `STUDENT_SELF_SCAN` \| `FACULTY_MANUAL` \| `SYSTEM_ABSENCE_ENGINE`
  - `timestamp`: Verified timestamp
  - **Constraint**: `@@unique([sessionId, studentId])` (Prevents duplicate check-ins)

- **`BleDevice`**:
  - `id`: UUID Primary Key
  - `roomId`: Foreign Key to `Room`
  - `name`: Hardware identifier (e.g. `Turing-Hall-Beacon-01`)
  - `serviceUuid`, `characteristicUuid`, `beaconIdentifier`
  - `rssiThreshold`: Default -80 dBm
  - `isActive`: Boolean

---

### 5. Absence & Late Arrival Rules
1. **Late Threshold**:
   - A configurable window (default: 10 minutes from session start).
   - Check-ins received within `0` to `thresholdMins` are marked **`PRESENT`**.
   - Check-ins received after `thresholdMins` but before session closure are marked **`LATE`**.
2. **System Absence Engine**:
   - When faculty transitions the session to `CLOSED`, any student enrolled in the course section who has no corresponding `AttendanceRecord` is automatically created as **`ABSENT`**.
3. **Excused Status**:
   - Students with approved `ATTENDANCE_CORRECTION` petitions or verified medical leaves are recorded as **`EXCUSED`**, contributing to numerator attendance credit under university Senate regulations.
