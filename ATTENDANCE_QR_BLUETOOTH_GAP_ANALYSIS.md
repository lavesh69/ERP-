# CLASSROOM ERP — SMART ATTENDANCE GAP ANALYSIS
## Dynamic Rotating QR + Web Bluetooth Proximity + Geofence Verification + Anti-Proxy

**Target System:** CLASSROOM — Academic OS / Education ERP  
**Audit Date:** September 2026  
**Auditor:** Principal Education ERP Architect & Security Systems Engineer  
**Status:** Audit Complete & Implementation Planned  

---

## 1. Executive Summary

The CLASSROOM ERP attendance system was audited to evaluate its readiness for modern high-assurance campus operations. Previously, the Attendance Management UI (`src/app/attendance/page.tsx`) featured manual roster recording, static SVG QR mock displays, simulated token rotation strings (`APX-${selectedCourse}-ROT-${qrExpiry}`), and manual Present/Late/Absent toggles. 

While manual record submission functioned through `src/app/api/attendance/route.ts`, the automated, mobile, and contactless workflows contained critical vulnerabilities and missing production components:
1. **QR Generation Was Static & Predictable:** Token rotation was client-side timer manipulation without cryptographic signatures, allowing students to forward screenshots or reuse static strings across sessions.
2. **Missing Real In-Browser Scanner:** The UI lacked a live WebRTC/MediaStream camera scanner with back-facing camera selection, permission lifecycle recovery, and native BarcodeDetector/jsQR fallback.
3. **BLE Proximity Was Theoretical:** No Web Bluetooth API handshake (`navigator.bluetooth`) existed. There was no server challenge-response mechanism, and the UI displayed simulated "5m" distances rather than real BLE peripheral advertising and RSSI-filtered proximity checks.
4. **Geofence Validation Was Absent:** The system did not collect or verify GPS coordinates against lecture hall/classroom geo-boundaries, leaving it vulnerable to off-campus remote check-ins.
5. **Session Lifecycle & Database Constraints:** The `AttendanceSession` model lacked spatial coordinates, beacon identifiers, rotation parameters, and session state transitions (`DRAFT` -> `ACTIVE` -> `PAUSED` -> `CLOSED`).

This document provides an exhaustive breakdown of the architectural gaps, security vulnerabilities, and technical specifications required to bring the system to an enterprise college/university standard.

---

## 2. Comprehensive Gap Analysis Matrix

| Feature Domain | Existing State | Production Requirement | Severity | Impact / Risk |
| :--- | :--- | :--- | :--- | :--- |
| **QR Code Generation** | Client-side mock SVG matrix; predictable string format `APX-${course}-ROT-${counter}`. | High-contrast, scalable QR rendered from HMAC-SHA256 signed rotating tokens; server-side salt, nonce, and sliding window validation. | **CRITICAL** | Tokens can be forged, predicted, or shared via messaging apps. |
| **Projector Mode** | Simple popup modal without fullscreen, room details, live counters, or responsive sizing. | Fullscreen high-contrast Projector Mode with active countdown clock, live polling student check-in count, course/room metadata, and faculty session controls. | **HIGH** | Hard to view on large lecture hall projectors; faculty cannot see real-time student check-in velocity. |
| **QR Scanner** | No video stream or camera scanner; manual input only. | Integrated camera scanner using `navigator.mediaDevices.getUserMedia` (`facingMode: "environment"`), multi-engine decoding (`BarcodeDetector` + fallback), and immediate stream cleanup. | **CRITICAL** | Students cannot scan QR codes using their mobile browsers or webcams. |
| **Web Bluetooth Proximity** | No implementation; cosmetic distance indicators in some UI views. | Real Web Bluetooth API (`navigator.bluetooth.requestDevice`) integration with GATT service/characteristic challenge-response, RSSI signal estimation, and browser capability detection. | **HIGH** | Inability to confirm physical co-presence inside the designated classroom. |
| **BLE Browser Fallback** | Hard assumption or mock states. | Graceful degradation matrix: Chromium desktop/Android supports Web Bluetooth; Safari/iOS lacks native Web Bluetooth and falls back to GPS Geofence + Dynamic QR combo. | **HIGH** | iOS users would be blocked from completing attendance if BLE is strictly enforced without fallback. |
| **Geofence Validation** | No coordinate capture or verification. | Server-side Haversine formula distance check: Student GPS `(lat, lng, accuracy)` compared against Classroom/Room `(lat, lng)` within configurable `allowedRadiusMeters` (default 50-100m). | **HIGH** | Remote proxy check-ins by students receiving forwarded QR codes. |
| **Anti-Proxy Architecture** | Single manual save endpoint without token validation. | Multi-factor verification pipeline: Authenticated Student Session + Active Course Enrollment + Nonce Uniqueness + Signature Verification + Time Expiry + Single-Use per Student per Session. | **CRITICAL** | Proxy attendance, duplicate submissions, and phantom records. |
| **Database Schema** | `AttendanceSession` missing room, coordinates, BLE beacons, and rotation intervals; `AttendanceRecord` missing verification audit fields. | Expanded schema with `BleDevice` registry, session geocoordinates, radius, rotation interval, and record verification methods (`QR`, `BLE`, `GEOFENCE`, `COMBO`). | **HIGH** | Incomplete audit trail, impossible to verify compliance or audit disputes. |
| **RBAC Enforcement** | Faculty and Admin share loose API checks. | Strict RBAC: Only Faculty teaching the course/section or Academic Admin can launch sessions and projector mode; Students can only submit scans for enrolled courses. | **CRITICAL** | Unauthorized students starting sessions or marking arbitrary students. |

---

## 3. Detailed Technical Analysis

### 3.1 QR Generation & Rotating Token Cryptography
* **Vulnerability:** Static or long-lived QR codes are vulnerable to the "Screenshot Forwarding" attack, where a student present in class snaps a photo and sends it to absent peers via WhatsApp or Telegram.
* **Remediation:**
  1. Session tokens are generated on the server via `POST /api/attendance/sessions/[id]/qr`.
  2. Format: `APX_ATT_V2.<sessionId>.<nonce>.<issuedAt>.<expiresAt>.<signature>`
  3. Signature: `HMAC-SHA256(sessionId + nonce + issuedAt + expiresAt, SERVER_SECRET)`.
  4. Short validity window: 15–30 seconds. A client-side countdown bar synchronizes with the server time.
  5. One-time nonce invalidation: When verifying, the server ensures the nonce has not already been redeemed by the same student, and the current server timestamp falls strictly within `[issuedAt - 5s, expiresAt + 5s]` (allowing for minor clock skew).

### 3.2 Real Camera QR Scanner & Browser Permissions
* **Requirements:**
  1. **Permission Handling:** Explicit state machine handling `PROMPT`, `GRANTED`, `DENIED`, `UNSUPPORTED`, `IN_USE`.
  2. **Camera Selection:** Default to rear-facing environment camera (`facingMode: { ideal: "environment" }`) with fallback to any available video input device.
  3. **Resource Cleanup:** Critical: Upon modal close or component unmount, all `MediaStreamTrack` instances must invoke `.stop()` to turn off hardware camera indicators and prevent battery drain.
  4. **Decoder Fallback:** Check for native `window.BarcodeDetector` (fastest, zero CPU overhead in modern Chrome/Edge); fall back to lightweight Canvas image analysis or `html5-qrcode` integration.

### 3.3 Web Bluetooth Low Energy (BLE) Proximity Verification
* **Requirements & Constraints:**
  1. **Secure Context:** The Web Bluetooth API is only exposed in HTTPS or `localhost` environments.
  2. **Platform Support:**
     - Fully supported: Chrome/Edge on Windows, macOS, Linux, Chrome OS, and Android.
     - Unsupported natively: Safari (iOS/macOS), Firefox.
  3. **No Fake Distances:** Web Bluetooth GATT does not provide a raw distance in meters without continuous calibrated RSSI filtering. The system must report truthful operational states: `BLE_READY`, `REQUESTING_DEVICE`, `CONNECTED`, `CHALLENGE_VERIFIED`, `NOT_SUPPORTED_FALLBACK_GEOFENCE`.
  4. **Challenge-Response:**
     - The institution registers classroom BLE beacons/dongles (`BleDevice` model) broadcasting a known service UUID.
     - When verifying in BLE mode, the student device connects to the classroom beacon GATT server, reads a rotating dynamic challenge byte array, or transmits the session nonce for verification.

### 3.4 Geofence Location Verification
* **Requirements:**
  1. **Browser Geolocation:** Student mobile browser requests `navigator.geolocation.getCurrentPosition` with `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 0`.
  2. **Server-Side Distance Calculation:** The client never computes whether it is "inside" the geofence (client calculation is easily tampered with). The server executes the Haversine formula:
     $$\Delta \varphi = \text{lat}_2 - \text{lat}_1, \quad \Delta \lambda = \text{lng}_2 - \text{lng}_1$$
     $$a = \sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos(\text{lat}_1) \cos(\text{lat}_2) \sin^2\left(\frac{\Delta \lambda}{2}\right)$$
     $$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right), \quad d = R \cdot c \quad (R = 6,371,000 \text{ meters})$$
  3. **Validation:** $d \le \text{allowedRadiusMeters}$ (e.g., 50–100m depending on classroom hall size).

---

## 4. Implementation Target Architecture

```
[Faculty / Teacher] ──> Starts Session ──> [AttendanceSession: ACTIVE]
        │                                         │
        └──> Opens Projector Mode                 ├── Generates HMAC Rotating QR (15s)
                    │                             └── Broadcasts Session ID & Nonce
                    ▼
          [Lecture Hall Screen]
       High-Contrast Dynamic QR
                    │
                    ▼ (Optical Scan)
[Student Mobile Browser]
        │
        ├── 1. Captures QR Token via Environment Camera
        ├── 2. Captures GPS Coordinates (High Accuracy)
        ├── 3. (Optional) Connects to Classroom BLE Beacon GATT
        │
        └──> Submits Verification Bundle:
             { sessionId, qrToken, studentId, lat, lng, bleChallengeResponse }
                    │
                    ▼
          [POST /api/attendance/qr/verify]
                    │
                    ├── Step 1: Validate Student Session & Auth Token
                    ├── Step 2: Validate Active Course Enrollment
                    ├── Step 3: Validate AttendanceSession State (ACTIVE, !CLOSED)
                    ├── Step 4: Verify QR HMAC-SHA256 Signature & Expiry Window
                    ├── Step 5: Verify Server-Side Geofence Distance (Haversine <= radius)
                    ├── Step 6: Verify BLE Challenge (if BLE_REQUIRED or BLE_OPTIONAL)
                    ├── Step 7: Check Unique Constraint (SessionId + StudentId)
                    └── Step 8: Atomic Transaction -> Write AttendanceRecord
                                Update Session Live Count & Audit Log
```

---

## 5. Security & Verification Conclusion

By migrating from static mock QR codes to a cryptographically verified, time-rotating token architecture augmented with server-side geofencing and Web Bluetooth proximity detection, CLASSROOM ERP effectively eliminates the top four academic fraud vectors:
1. Proxy attendance via remote chat screenshot forwarding.
2. Replay of expired or captured attendance tokens.
3. Enrollment spoofing by un-enrolled students.
4. Location tampering via simulated client-side checks.

All subsequent phases will enforce zero mock data, resilient fallback modes for non-Bluetooth devices (iOS/Safari), and complete automated testing coverage.
