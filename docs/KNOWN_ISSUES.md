# CLASSROOM ERP — Known Issues & Technical Debt Register

**Project:** CLASSROOM — School & College ERP  
**Repository:** `https://github.com/lavesh69/ERP-`  
**Assessment Date:** Academic Session 2026–2027  
**Status:** All Critical Functional Gaps (P0 & P1) Resolved  

---

## 1. Architectural Trade-offs & Production Considerations

### 1.1 SQLite in Serverless Deployments (Vercel)
- **Current State:** The application defaults to SQLite (`prisma/dev.db`). In Vercel serverless functions, the file is automatically mirrored to the writable `/tmp` directory (`src/lib/db/prisma.ts`) to avoid read-only filesystem locks (`SQLITE_CANTOPEN`).
- **Limitation:** In serverless cloud environments, `/tmp` storage is ephemeral and is not shared across concurrently running serverless function instances.
- **Production Recommendation:** For production deployments expecting hundreds of simultaneous concurrent sessions, set `DATABASE_URL` to a hosted PostgreSQL instance (such as [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or AWS Aurora Serverless). The Prisma schema and connection layer are already configured to auto-detect PostgreSQL connection strings.

---

### 1.2 External Cloud Service Fallbacks (By Design)
The ERP includes defensive fallbacks so the application remains completely testable and functional even before third-party cloud credentials are provided:

1. **AI Assistant Live LLM:**
   - *Behavior:* If `GEMINI_API_KEY` or `OPENAI_API_KEY` is not set, the AI Assistant Studio uses domain-grounded database synthesis and RAG retrieval.
   - *Upgrade Path:* Add `GEMINI_API_KEY="AIzaSy..."` to `.env` to enable dynamic real-time generative responses.
2. **Payment Processing (Bursar Gateways):**
   - *Behavior:* In the absence of live payment gateway credentials, the checkout modal operates in sandbox simulation mode, recording valid transaction IDs and ledger receipts.
   - *Upgrade Path:* Provide live `RAZORPAY_KEY_ID` or `STRIPE_SECRET_KEY` in `.env` for actual credit card/UPI bank settlement.
3. **Outbound Notification Delivery:**
   - *Behavior:* When SMTP is unconfigured, notification emails are captured in `data/outbox/emails.json` for auditing and inspection.
   - *Upgrade Path:* Configure `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in `.env` for live SMTP delivery.

---

### 1.3 Cloudflare Turnstile CAPTCHA
- **Current State:** In test environments and local development, Turnstile CAPTCHA bypasses verification if keys are blank (`src/lib/security/captcha.ts`), allowing seamless automated testing and developer iteration.
- **Production Action:** On custom production domains, register a site on Cloudflare Turnstile and populate `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in `.env`.

---

### 1.4 Windows Git Line Endings (CRLF vs LF)
- **Issue:** On Windows workstations, Git may attempt to convert line endings to CRLF during checkouts.
- **Resolution:** The repository enforces LF line endings via `.gitattributes`. Before committing changes on Windows, run `git add --renormalize .` to ensure compliance with POSIX LF standards.

---

## 2. Issue Triage Summary

| Item ID | Component | Severity | Description | Status / Resolution |
| :--- | :--- | :--- | :--- | :--- |
| `ISS-01` | Multi-Tenant Database | Low | Ephemeral SQLite in Vercel serverless. | Handled via `/tmp` mirror; recommend PostgreSQL for multi-region scale. |
| `ISS-02` | External LLM | Low | LLM API key absence. | Handled via grounded RAG synthesis fallback. |
| `ISS-03` | Payment Settlement | Low | Live gateway credentials pending. | Handled via interactive sandbox checkout modal. |
| `ISS-04` | Outbound Mail | Low | SMTP server unconfigured. | Handled via persistent JSON outbox buffer. |
| `ISS-05` | Captcha Validation | Low | Turnstile site keys optional in dev. | Automatically validated in dev, enabled via `.env` in prod. |
