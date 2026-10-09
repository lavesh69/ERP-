# CLASSROOM ERP — Setup & Deployment Guide

This guide provides complete instructions for configuring, initializing, building, and deploying the **CLASSROOM School & College ERP** in development, staging, and production environments.

---

## 1. System Requirements & Prerequisites

- **Node.js**: `v18.18.0` or higher (Recommended: `v20.x LTS` or `v22.x LTS`)
- **Package Manager**: `npm` (v9+) or `pnpm` (v8+)
- **Database Engine**:
  - Development / Testing: SQLite (`file:./prisma/dev.db` - zero config)
  - Production: PostgreSQL (`v14+`) or MySQL (`v8+`)
- **Git**: For version control and CI/CD pipelines
- **Memory**: Minimum 2 GB RAM (Recommended 4 GB+ for full build and RAG vector indexing)

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

### Essential Environment Variables

```env
# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------
# For SQLite (Default):
DATABASE_URL="file:./dev.db"
# For PostgreSQL (Production):
# DATABASE_URL="postgresql://user:password@hostname:5432/classroom_erp?schema=public"

# ---------------------------------------------------------
# AUTHENTICATION & SECURITY
# ---------------------------------------------------------
JWT_SECRET="classroom-super-secret-jwt-key-2026-production"
NEXTAUTH_SECRET="classroom-super-secret-jwt-key-2026-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Two-Factor Authentication (TOTP)
TOTP_ISSUER="CLASSROOM ERP"

# Rate Limiting & Captcha (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""

# ---------------------------------------------------------
# ARTIFICIAL INTELLIGENCE & LLM
# ---------------------------------------------------------
# Google Gemini API (Recommended for 12 Autonomous Agents & RAG)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
LLM_MODEL="gemini-1.5-flash"

# Optional Alternative: OpenAI
OPENAI_API_KEY=""

# ---------------------------------------------------------
# PAYMENTS & BURSAR GATEWAYS
# ---------------------------------------------------------
# Razorpay (India & UPI)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Stripe (International)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# ---------------------------------------------------------
# COMMUNICATIONS & EMAIL OUTBOX
# ---------------------------------------------------------
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@classroom.edu"
SMTP_PASS=""
EMAIL_FROM="CLASSROOM ERP <notifications@classroom.edu>"

# ---------------------------------------------------------
# CLOUD STORAGE (OPTIONAL)
# ---------------------------------------------------------
# Default: Local secure filesystem (storage/)
STORAGE_PROVIDER="local"
AWS_S3_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
```

---

## 3. Database Initialization & Seeding

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Synchronize Database Schema:**
   ```bash
   npx prisma db push
   ```

4. **Seed Demonstration Master Data & Users:**
   The seed script creates initial institutional hierarchies, 16 mock role accounts, courses, and fee structures:
   ```bash
   npm run prisma:seed
   ```

---

## 4. Running the Development Server

Start the local development server on `http://localhost:3000`:

```bash
npm run dev
```

Default test credentials for quick login:
- **Super Admin:** `provost.evans@classroom.edu` / `Admin@123`
- **Institution Admin:** `admin@classroom.edu` / `Admin@123`
- **Faculty:** `dr.arun@classroom.edu` / `Faculty@123`
- **Student:** `arav.patel@classroom.edu` / `Student@123`
- **Accountant:** `accounts@classroom.edu` / `Account@123`

---

## 5. Automated Verification & Testing

Before creating a commit or deploying to production, run the automated verification checks:

1. **Static Type Checking:**
   ```bash
   npx tsc --noEmit
   ```
   *Expected result: 0 errors.*

2. **Full End-to-End Test Suite:**
   ```bash
   npm test
   ```
   *Expected result: 957 of 957 tests passed across 60 functional groups.*

3. **Production Build Validation:**
   ```bash
   npm run build
   ```
   *Compiles all 174 routes and generates optimized production bundles.*

---

## 6. Production Deployment

### Option A: Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel.
2. In Project Settings -> Environment Variables, provide all required variables from Section 2.
3. Configure the Build Command:
   ```bash
   node prisma-deploy.mjs && next build
   ```
4. Output Directory: `.next`
5. Deploy. Vercel automatically deploys edge middleware and serverless functions for all 174 routes.

### Option B: Docker Container Deployment

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Build and run the container:
```bash
docker build -t classroom-erp:latest .
docker run -p 3000:3000 --env-file .env classroom-erp:latest
```

### Option C: Traditional Linux Server (PM2)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install production dependencies
npm ci --only=production

# 3. Apply database migrations
npx prisma db push

# 4. Compile application
npm run build

# 5. Start with PM2
pm2 start npm --name "classroom-erp" -- start
pm2 save
```

---

## 7. Backup, Disaster Recovery & Maintenance

- **Automated SQLite Database Backup:**
  ```bash
  npm run backup
  ```
  Saves timestamped snapshots into `backups/db-backup-<timestamp>.db` with SHA-256 integrity verification.

- **Automated Scheduled Jobs:**
  The ERP includes built-in background schedulers in `src/lib/jobs/automation.ts` handling:
  - Daily Biometric Attendance Aggregation (00:00 UTC)
  - Attendance Defaulter Risk Alerts (< 75% threshold)
  - Night Roll-Call Curfew Audits (21:30 local)
  - Fee Due Date Reminders and Late Fine Accrual
