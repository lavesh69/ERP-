# CLASSROOM ERP — Enterprise Setup & Administration Guide

This document provides complete instructions for initializing, configuring, testing, and deploying **CLASSROOM ERP** in local development, university on-premises servers, and enterprise cloud environments.

---

## 1. System Requirements & Prerequisites

| Component | Minimum Requirement | Recommended Enterprise Setup |
| :--- | :--- | :--- |
| **Node.js** | `v18.18.0` | `v20.x LTS` or `v22.x LTS` |
| **Memory** | 2 GB RAM | 8 GB+ RAM for high-concurrency institutions |
| **Database** | SQLite (`prisma/dev.db` - Zero config) | PostgreSQL v15+ (Neon / Supabase / AWS Aurora) |
| **Disk Space** | 1 GB Free | 20 GB+ for student document archives |

---

## 2. Quickstart (Development Environment)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/lavesh69/ERP-.git
cd ERP-
npm install
```

### Step 2: Environment Configuration
Create `.env` from `.env.example`:
```bash
cp .env.example .env
```

Ensure essential keys are defined:
```env
# Database Connection (Default: Local SQLite)
DATABASE_URL="file:./dev.db"

# Session & Token Secrets
JWT_SECRET="classroom-enterprise-jwt-secret-2026"
NEXTAUTH_SECRET="classroom-enterprise-jwt-secret-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional Cloud AI (Google Gemini 1.5 Flash)
GEMINI_API_KEY=""
LLM_MODEL="gemini-1.5-flash"
```

### Step 3: Database Schema & Seed Initialization
```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Push schema to database
npx prisma db push

# 3. Seed demonstration master data (Campuses, courses, 16 user accounts)
npm run prisma:seed
```

### Step 4: Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Pre-Seeded Demonstration Roles & Credentials

All 16 personas are initialized with password: `Classroom@2026`

| Role | Email Address | Dashboard Route |
| :--- | :--- | :--- |
| **Super Admin** | `provost.evans@classroom.edu` | `/admin` |
| **Institution Admin** | `admin.mercer@apex.edu` | `/institution` |
| **Principal / Director** | `director.vance@apex.edu` | `/analytics` |
| **Head of Department (HOD)**| `hod.cse@apex.edu` | `/institution` |
| **Faculty / Professor** | `dr.arun@classroom.edu` | `/faculty` |
| **Class Teacher** | `teacher.sharma@apex.edu` | `/students` |
| **Student** | `arav.patel@classroom.edu` | `/students/profile` |
| **Parent / Guardian** | `parent.mercer@apex.edu` | `/parent` |
| **Accountant / Bursar** | `accounts@classroom.edu` | `/finance` |
| **Librarian** | `librarian.patel@apex.edu` | `/library` |
| **Examination Controller** | `exam.controller@apex.edu` | `/examinations` |
| **Placement Officer** | `placement@apex.edu` | `/careers` |
| **Research Coordinator** | `research.lead@apex.edu` | `/research` |
| **HR & Staff Manager** | `hr.manager@apex.edu` | `/faculty` |
| **Alumni Member** | `alumni.chen@apex.edu` | `/careers` |
| **Guest / Auditor** | `auditor.guest@apex.edu` | `/institution` |

---

## 4. Verification & Testing Commands

Execute these verification checks before committing changes or releasing to production:

```bash
# 1. Static Type Checking (0 errors expected)
npx tsc --noEmit

# 2. Run Full 61 Automated Test Suites (967 passing assertions)
npm test

# 3. Next.js Production Build Validation
npm run build
```

---

## 5. Enterprise PostgreSQL Cloud Migration (Neon / Supabase)

For large universities (>1,000 active students), migrate from SQLite to managed PostgreSQL:

1. Create a cloud database instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@ep-cool-project.neon.tech/classroom_db?sslmode=require"
   POSTGRES_PRISMA_URL="postgresql://user:password@ep-cool-project-pooler.neon.tech/classroom_db?sslmode=require&pgbouncer=true"
   ```
3. Push the schema to PostgreSQL:
   ```bash
   npx prisma db push
   ```
4. Seed the database:
   ```bash
   npm run prisma:seed
   ```
5. Recompile and start:
   ```bash
   npm run build
   npm start
   ```

---

## 6. Disaster Recovery & Database Backup

Create a timestamped backup snapshot with SHA-256 integrity verification:

```bash
npm run backup
```
Snapshots are securely archived in `backups/db-backup-<timestamp>.db`.
