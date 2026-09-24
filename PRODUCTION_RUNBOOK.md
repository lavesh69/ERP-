# CLASSROOM ERP — PRODUCTION OPERATIONS & INCIDENT RUNBOOK

**Effective Date**: September 24, 2026  
**Audience**: DevOps Engineers, System Administrators, Security Incident Handlers  
**System**: CLASSROOM ERP (Next.js 15.1.7 + Prisma ORM + Neon PostgreSQL + Vercel)  
**Production Domain**: `https://erp-omega-pink.vercel.app`  

---

## 1. System Overview & Key Architecture

CLASSROOM ERP operates on a modern, cost-efficient, zero-maintenance serverless architecture:
- **Application Host**: Vercel Edge & Serverless Runtime (Node.js 20.x, AWS `us-east-1`).
- **Database Engine**: Neon Serverless PostgreSQL with PgBouncer connection pooling (`sslmode=require`).
- **Development/Test Fallback**: SQLite (`file:./dev.db`) managed via `prisma-deploy.mjs`.
- **Identity & Auth**: Institutional JWT (`classroom_session` cookie / Bearer token) + Firebase Client SDK sync.
- **Trial / Development Authentication**: Fully intact and supported for evaluation and offline validation.

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: Zero-Downtime Application Deployment
Deployments are continuously integrated via GitHub `main` branch:
1. Ensure all local tests pass before pushing:
   ```bash
   npm test
   ```
2. Verify line endings and commit changes:
   ```bash
   git add .
   git commit -m "feat/fix: descriptive release message"
   git push origin main
   ```
3. Vercel executes the build pipeline:
   - Runs `node prisma-deploy.mjs` (detects PostgreSQL, generates Prisma Client, syncs schema).
   - Runs `next build` (pre-renders static pages, bundles serverless functions).
4. Vercel automatically performs atomic green/blue instant traffic cutover.

### SOP-02: Database Schema Updates
1. Define model modifications in `prisma/schema.postgresql.prisma`.
2. Sync the identical model changes to `prisma/schema.sqlite.prisma` to keep local tests passing.
3. Test locally with SQLite:
   ```bash
   node prisma-deploy.mjs
   npm test
   ```
4. Push to `main`. `prisma-deploy.mjs` applies the changes to Neon Cloud PostgreSQL automatically during the build step.

### SOP-03: Secrets Rotation Protocol

#### A. Rotating `JWT_SECRET`
> [!WARNING]
> Rotating `JWT_SECRET` immediately invalidates all active user sessions, requiring all users to re-authenticate.
1. Generate a high-entropy 64-character secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Navigate to **Vercel Dashboard** -> **Project Settings** -> **Environment Variables**.
3. Update `JWT_SECRET` with the new value for **Production** and **Preview** environments.
4. Redeploy the latest commit to apply the new secret.

#### B. Rotating `DATABASE_URL` (Neon PostgreSQL)
1. In the **Neon Console**, navigate to **Connection Details**.
2. Click **Reset Password** for the role `neondb_owner`.
3. Copy the updated connection string with pooled port (`6543`) and `sslmode=require`.
4. Update `DATABASE_URL` in **Vercel Environment Variables**.
5. Trigger an instant redeployment.

---

## 3. Health Diagnostics & Observability

### Endpoint Health Probe: `/api/health`
Verify system liveness and database connectivity via HTTP GET:
```bash
curl -i https://erp-omega-pink.vercel.app/api/health
```

**Expected Healthy Response (`200 OK`)**:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-24T07:15:00.000Z",
  "database": {
    "status": "connected",
    "latencyMs": 42
  },
  "uptime": 86400,
  "environment": "production"
}
```

**Degraded / Outage Signals**:
- Status `500 Internal Server Error`: Database connection pool exhausted or credentials rejected.
- Latency `> 500ms`: Neon compute cold start or cross-region network congestion.

---

## 4. Incident Response Playbooks

### Playbook 1: Sev-1 Application Outage (5xx Errors Across All Routes)
1. **Triage Impact**:
   - Check status on `https://erp-omega-pink.vercel.app/api/health`.
   - Inspect Vercel Function Logs for unhandled exceptions or connection errors.
2. **Diagnose Database**:
   - Log in to Neon Console. Check compute endpoint state (Active vs Suspended vs Error).
   - If compute is in an error state, click **Restart Compute**.
3. **Verify Build Inlining**:
   - Confirm `next.config.mjs` does not have hardcoded `DATABASE_URL` in its `env` block.
4. **Emergency Rollback**:
   - If a bad commit caused the outage, go to Vercel Deployments, find the last known good deployment, and click **Instant Rollback**.

---

### Playbook 2: Database Connection Spike / Pool Exhaustion
1. **Symptom**: Prisma throws `P2024: Timed out fetching a new connection from the connection pool`.
2. **Root Cause**: Unpooled connection string used or unclosed connection handles.
3. **Action**:
   - Verify `DATABASE_URL` uses the pooled endpoint (contains `-pooler` subdomain or port `6543`).
   - Confirm Prisma is instantiated as a singleton in `src/lib/prisma.ts`.
   - Neon PgBouncer handles up to 10,000 pooled connections; ensure no scripts bypass the pooler in serverless functions.

---

### Playbook 3: Credential Stuffing / Brute Force Attack
1. **Symptom**: Spikes in `401 Unauthorized` logs on `/api/auth/login`.
2. **Mitigation**:
   - System automatically locks accounts after 5 failed attempts (`lockedUntil = now() + 15m`).
   - If attacker targets distributed usernames, deploy an IP rate-limiting rule in Vercel Edge Firewall or block offending ASN ranges in middleware.
3. **Forensic Audit**:
   - Query `AuditLog` table for failed authentication events and origin IPs:
   ```bash
   curl -H "Authorization: Bearer <ADMIN_TOKEN>" https://erp-omega-pink.vercel.app/api/admin/audit-logs
   ```

---

### Playbook 4: Payment Webhook Discrepancy
1. **Symptom**: Student reports fee paid at gateway, but ERP status remains "UNPAID".
2. **Action**:
   - Navigate to `/api/payments/verify` handler logs.
   - Cross-check `razorpay_order_id` / `transactionId` against gateway dashboard.
   - If gateway signature verified but database write timed out, trigger manual reconciliation via `POST /api/finance` with the transaction ID.
   - Ledgers and receipts are automatically reconciled upon verified payment confirmation.

---

## 5. Escalation Matrix

| Severity | Definition | Response SLA | Primary Contact |
|---|---|---|---|
| **Sev-1 (Critical)** | Core ERP down; all users unable to log in; database inaccessible | < 15 minutes | Lead DevSecOps / Cloud Architect |
| **Sev-2 (High)** | Major subsystem degraded (Exams or Fee Payments failing); core ERP up | < 1 hour | Backend Lead / Database Admin |
| **Sev-3 (Medium)** | Non-blocking bug in background jobs, email notifications, or analytics | < 4 hours | Module Developer |
| **Sev-4 (Low)** | Cosmetic UI issue or documentation update | Next sprint | Frontend Developer |
