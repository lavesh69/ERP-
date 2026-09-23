# CLASSROOM Academic OS — Enterprise Cyber Security Architecture

> Comprehensive security defense matrix adhering to **OWASP Top 10 (2025/2026)**, **NIST SP 800-63B**, **FERPA (34 CFR Part 99)**, **GDPR (EU 2016/679)**, and **SOC-2 Type II** controls.

---

## 🛡️ Enterprise Defense In Depth

### 1. HTTP Security Headers (A+ Grade)
- **Strict-Transport-Security (HSTS)**: `max-age=63072000; includeSubDomains; preload` (Zero SSL Stripping / Man-In-The-Middle defense).
- **Content-Security-Policy (CSP)**: Strict whitelist permitting only verified Google OAuth and Firebase endpoints; disallows unauthorized `eval()` and injection.
- **X-Frame-Options**: `DENY` (Full Clickjacking prevention).
- **X-Content-Type-Options**: `nosniff` (MIME confusion attack defense).
- **Permissions-Policy**: Camera, microphone, geolocation, usb, and screen capture disabled by default.
- **Cross-Origin-Opener-Policy (COOP)**: `same-origin-allow-popups` (prevents cross-window tabnabbing while supporting Google OAuth popups).

### 2. Identity & Access Management (IAM)
- **Zero OAuth Secret Leakage**: Passwords, Google secrets, and service accounts are never included in static bundles.
- **Anti-Privilege Escalation**: Firestore security rules verify document diffs to prevent self-promotion (`role`, `status` immutable by non-admin users).
- **Multi-Factor Authentication (2FA)**: TOTP RFC 6238 support with encrypted secret storage.

### 3. Application Security & Input Sanitization
- **Strict XSS Stripping**: HTML tags, `javascript:` pseudo-protocols, and inline event handlers stripped on form inputs.
- **Open-Redirect Hardening**: All post-login target URLs validated strictly against relative local paths.
- **Brute-Force & Flood Rate Limiting**: Exponential lockout timers on authentication endpoints and registration forms.

### 4. Workstation & Session Protection
- **Idle Inactivity Guard (FERPA / SOC-2)**: 15-minute inactivity tracker with 60-second visual countdown modal. Automatically terminates sessions left unattended on campus lab computers.
- **Immutable Audit Logging**: Write-only audit logs with IP tracking, actor ID, and payload hash. Audit logs cannot be updated or deleted by any user.
