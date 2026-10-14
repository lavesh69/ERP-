# CLASSROOM ERP — Remaining External Work & Hardware/Vendor Dependencies

## Overview

All ERP core modules, business logic, persistence layers, validation rules, user interfaces, and automated test suites are **100% complete, fully implemented, and verified in code**.

The following items are external third-party or hardware-level integrations that depend on physical devices, external vendor contractual agreements, or live production API credentials when the ERP is provisioned for an actual physical campus.

---

## 1. External Third-Party API Credentials (Plug-and-Play)

The system is architected with realistic simulator fallbacks and secure `.env` parameter bindings. When the institution provisions its production accounts, simply populate these environment variables:

1. **SMS Gateway (Twilio / AWS SNS / MSG91):**
   - Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
   - Current status: Simulated via logging and `data/outbox/sms.json`. Real HTTP dispatch is wired to fire as soon as keys are provided.
2. **WhatsApp Business Cloud API (Meta):**
   - Environment variables: `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`.
   - Current status: Simulated via `data/outbox/whatsapp.json`. Formats and webhook handlers are completely implemented.
3. **Payment Gateway Live Credentials (Razorpay / Stripe):**
   - Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
   - Current status: Fully implemented with HMAC-SHA256 signature verification and duplicate transaction idempotency defense. Currently operating in test/sandbox mode.
4. **National Academic Depository (NAD / Digilocker):**
   - Environment variables: `DIGILOCKER_NAD_CLIENT_ID`, `DIGILOCKER_NAD_SECRET`.
   - Current status: Generates compliant Digilocker NAD XML schemas and ABC JSON payloads with 12-digit APAAR ID validation. Requires university institutional onboarding with the Ministry of Education for direct government API sync.

---

## 2. Campus Physical Hardware Integrations

1. **Physical RFID Card Readers (Canteen / Library / Security Turnstiles):**
   - Current status: Hardware wedge barcode and RFID scanner inputs are supported via keyboard-emulation input listeners and rapid scan API endpoints (`/api/library` action `RAPID_CIRCULATION_SCAN`, `/api/canteen` POS).
   - Campus Deployment: Connect USB or Ethernet HID barcode/RFID scanners to cafeteria POS and library circulation counter terminals.
2. **Biometric Fingerprint / Facial Recognition Time Clocks:**
   - Current status: Push webhook endpoint `/api/attendance/biometric-push` is fully functional with API key security and duplicate punch deduplication.
   - Campus Deployment: Configure on-premise biometric time clocks (e.g., ZKTeco, Essl) to send HTTP POST callbacks to `https://<domain>/api/attendance/biometric-push`.
3. **GPS Trackers for Campus Transit Buses:**
   - Current status: Fleet operations tracking and route geofences are handled in `/api/transport`.
   - Campus Deployment: Set up in-vehicle OBD/GPS trackers to post telemetry coordinate packets to the transport fleet API.

---

## 3. Maintenance & Scaling Recommendations

1. **PostgreSQL Migration:**
   - In production, configure `DATABASE_URL=postgresql://...` in `.env` and execute `node prisma-deploy.mjs`. The Prisma dual-schema generator automatically switches from development SQLite to production PostgreSQL without code modifications.
2. **Periodic Redis Cache & Job Queues (Optional):**
   - For campus deployments exceeding 10,000 concurrent students during exam result publication days, an optional Redis layer can be introduced for session caching and rate-limiting.
