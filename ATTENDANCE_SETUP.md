# CLASSROOM ERP — SMART ATTENDANCE SETUP & OPERATOR GUIDE
## Institutional Deployment, Faculty Projector Mode & Student Mobile Verification

**Target Audience:** System Administrators, Campus IT Staff, Faculty Members, and Students  
**Platform:** CLASSROOM Academic OS (v2.4-Production)  

---

## 1. Quick Start Overview

CLASSROOM Smart Attendance delivers frictionless, proxy-proof roll-call using:
1. **Faculty Lecture Hall Screen:** Fullscreen high-contrast Dynamic QR Code refreshing every 15 seconds.
2. **Student Mobile Browser:** Instant in-browser camera scanning, GPS geofencing, and optional Web Bluetooth proximity.
3. **No App Store Download Required:** Works directly inside mobile Safari, Chrome, and Edge on HTTPS.

---

## 2. Campus IT & Hardware Setup

### 2.1 Classroom Geofence Coordinates
Each physical room in the ERP can be assigned geographic coordinates to restrict attendance to the lecture hall building:
1. Navigate to **Infrastructure & Campus Management** or configure via the database.
2. Update the `Room` record:
   ```json
   {
     "code": "LH-4B",
     "name": "Alan Turing Lecture Hall",
     "latitude": 28.5450,
     "longitude": 77.1926,
     "allowedRadiusMeters": 100.0
   }
   ```
3. The server will automatically enforce that student check-ins originate within 100 meters of the room center.

### 2.2 Classroom Bluetooth Low Energy (BLE) Beacon Setup
For proctored exam halls or restricted labs requiring co-presence confirmation:
1. **Beacon Hardware:** Any standard BLE peripheral (ESP32 micro-controller, Raspberry Pi, or commercial iBeacon/Eddystone puck).
2. **Service UUID Configuration:**
   * **Primary Service UUID:** `0000ffe0-0000-1000-8000-00805f9b34fb`
   * **Characteristic UUID:** `0000ffe1-0000-1000-8000-00805f9b34fb`
   * **Advertising Interval:** 200ms–500ms
   * **Transmission Power:** -12 dBm to -6 dBm (tuned for 10–20 meter classroom perimeter).
3. **Register Beacon in ERP:**
   * Make a `POST /api/attendance/devices` call or add via Admin settings:
   ```bash
   curl -X POST https://your-erp.domain.com/api/attendance/devices \
     -H "Content-Type: application/json" \
     -H "Cookie: classroom_session=<ADMIN_SESSION>" \
     -d '{
       "name": "LH-4B BLE Beacon",
       "roomId": "<ROOM_UUID>",
       "beaconIdentifier": "LH4B-BEACON-01",
       "serviceUuid": "0000ffe0-0000-1000-8000-00805f9b34fb",
       "rssiThreshold": -85
     }'
   ```

---

## 3. Faculty / Teacher Step-by-Step Guide

### Step 1: Open Attendance Management
1. Log into CLASSROOM with your Faculty credentials (`faculty@classroom.edu`).
2. Navigate to **Attendance** in the primary sidebar navigation (`/attendance`).
3. Select your assigned Course (e.g. `CS-402 - Distributed Computing`).

### Step 2: Launch Smart Attendance Session
1. Click the indigo **"Project Dynamic QR"** button in the header toolbar.
2. The system automatically initializes an `ACTIVE` attendance session with a secure HMAC-signed token.
3. The **Projector Mode** interface launches instantly.

### Step 3: Display on Lecture Hall Projector
1. Connect your laptop to the lecture hall HDMI or projector.
2. Click the **Fullscreen** button (top right) or press `F11` to maximize the presentation.
3. Observe:
   * **Dynamic QR Code:** Displayed prominently in high-contrast black on white.
   * **Countdown Progress Bar:** Shows the remaining seconds until token rotation (default: 15s).
   * **Live Turnout Counter:** Shows real-time attendance (e.g. `48 / 62 Students Checked In`).
   * **Live Stream Feed:** Displays incoming student check-ins with timestamps and roll numbers.

### Step 4: Control & Finalize Session
* **Pause Rotation:** Click **"Pause Rotation"** if you need to pause check-ins temporarily while delivering slides.
* **Finalize Session:** When roll-call time has elapsed, click **"Finalize Session"**. This sets the session status to `CLOSED`, revokes all active QR tokens, and commits the records to the academic ledger.

---

## 4. Student Step-by-Step Guide

### Step 1: Access Classroom Attendance
1. Open your mobile browser (Safari, Chrome, Samsung Internet) and visit `https://erp-omega-pink.vercel.app/attendance`.
2. Ensure you are logged into your student account.

### Step 2: Open Camera Scanner
1. Tap the green **"Scan Attendance QR"** button.
2. When prompted by your browser:
   * **Allow Camera Access:** Required to read the dynamic optical QR code.
   * **Allow Location Access:** Required for campus geofence proximity verification.

### Step 3: Scan the Screen
1. Point your mobile camera at the lecture hall projector.
2. The scanner decodes the `APX_ATT_V2` rotating token within 200 milliseconds.
3. The system validates:
   * Token signature & active 15s timestamp window
   * Your enrollment in the course
   * Geofence boundary check
4. Upon successful validation, a green **"Attendance Marked!"** confirmation appears with your roll number and verification method badge (`QR_HMAC` or `COMBO`).

---

## 5. Troubleshooting & Fallbacks

| Symptom | Probable Cause | Action / Resolution |
| :--- | :--- | :--- |
| **"Attendance token expired X seconds ago"** | Student scanned an old screenshot or delayed submission. | Point camera at the live lecture hall screen to capture the latest code. |
| **"Geofence validation failed (X meters away)"** | Student GPS location is outside the lecture hall boundary. | Ensure GPS is enabled with "High Accuracy" on the phone. Move inside the classroom. |
| **"You are not enrolled in this course"** | Student is attempting to check into a lecture they are not registered for. | Verify enrolled courses in Student Academic Dossier. |
| **"Camera hardware unavailable"** | Browser permission blocked or connection not secure (HTTP). | Ensure using `https://` protocol. Go to browser settings -> Site Settings -> Camera -> Allow. |
| **"BLE Unsupported (Safari/iOS)"** | Web Bluetooth is restricted on iOS Safari. | The system automatically falls back to **GPS Geofence + Dynamic QR**. No student is locked out. |
| **"Attendance already recorded"** | Student scanned twice in the same lecture. | The system is idempotent; your attendance is safely saved. |
