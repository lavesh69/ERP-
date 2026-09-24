# CLASSROOM ERP — BACKUP, DISASTER RECOVERY & BUSINESS CONTINUITY PLAN

**Audit Date**: September 24, 2026  
**Auditor**: Principal Database Architect & DevSecOps Engineer  
**Database**: Neon Serverless PostgreSQL 16 + Local SQLite Fallback Engine  
**Retention Policy**: 30-Day Automated Rolling Snapshots + 7-Day Neon Point-in-Time Recovery (PITR)  

---

## 1. Executive Summary

This document establishes the Disaster Recovery (DR), continuous data protection, and business continuity strategy for the CLASSROOM Educational Resource Planning (ERP) database.

Educational ERP systems are mission-critical: grade sheets, examination attendance, fee transactions, and student credentials must be protected against catastrophic data loss, accidental operational deletion, migration corruption, and malicious attacks. 

The DR strategy combines:
1. **Infrastructure Tier**: Neon Serverless continuous WAL streaming and Point-In-Time Recovery (PITR).
2. **Application Tier**: Automated enterprise cryptographic JSON snapshots with SHA-256 verification (`src/lib/db/backup.ts`).
3. **Zero-Cost Constraint**: Operates entirely within Neon Free Tier and local/cloud storage quotas without recurring backup charges.

---

## 2. Recovery Objectives (RTO & RPO)

| Metric | Target | Worst-Case Bound | Justification |
|---|---|---|---|
| **Recovery Point Objective (RPO)** | **< 5 minutes** | **15 minutes** | In the event of catastrophic failure, data loss is bounded to the last 5 minutes of committed PostgreSQL write-ahead logs. |
| **Recovery Time Objective (RTO)** | **< 15 minutes** | **30 minutes** | Time required to branch from Neon PITR or ingest a verified cryptographic snapshot into a freshly provisioned cluster. |

---

## 3. Disaster Recovery Architecture

```
                       ┌────────────────────────────────────────┐
                       │       CLASSROOM Production Engine      │
                       │          (Vercel Serverless)           │
                       └───────────────────┬────────────────────┘
                                           │
                         ┌─────────────────┴─────────────────┐
                         ▼                                   ▼
             ┌───────────────────────┐           ┌───────────────────────┐
             │ Neon PostgreSQL (Live)│           │ Application Snapshots │
             │  Continuous WAL Logs  │           │   (src/lib/db/backup) │
             └───────────┬───────────┘           └───────────┬───────────┘
                         │ S3 Continuous Sync                │ SHA-256 Checksum
                         ▼                                   ▼
             ┌───────────────────────┐           ┌───────────────────────┐
             │ Neon Point-in-Time    │           │ Encrypted Cold Backup │
             │ Recovery (PITR)       │           │ 30-Day Rolling Storage│
             │ (7-Day Replay Window) │           │ (backups/*.json)      │
             └───────────────────────┘           └───────────────────────┘
```

---

## 4. Backup Mechanisms

### 4.1 Neon Serverless Continuous WAL & Point-in-Time Recovery (PITR)
- **Continuous Logging**: Every database transaction is streamed to Neon's decoupled storage architecture backed by AWS S3.
- **Zero-Copy Branching**: An instant point-in-time snapshot can be created in < 2 seconds without copying raw data.
- **Granular Recovery**: Database state can be restored to any exact second within the retention window.

### 4.2 Application Cryptographic Snapshots (`src/lib/db/backup.ts`)
The application includes an internal snapshot utility that exports all 23 database models into a structured, validated JSON archive:
- **Checksum Integrity**: Calculates and records a SHA-256 hash across the entire exported payload.
- **Entity Coverage**: Full exports for Institutions, Campuses, Departments, Programs, Users, Students, Faculty, Courses, Attendance, Fee Structures, Transactions, Assignments, Exams, Results, Library, Announcements, and Audit Logs.
- **30-Day Retention Pruning**: Automatically prunes snapshot files older than 30 days during each execution to prevent disk exhaustion.

---

## 5. Disaster Recovery Procedures

### Scenario A: Accidental Data Deletion or Corrupted Migration
*Target: Restore database to the state immediately preceding the incident.*

1. **Identify Timestamp**:
   Determine the exact UTC time (`T_incident`) when the destructive query or migration occurred.
2. **Execute Neon PITR Branch via CLI or Console**:
   ```bash
   # Create a recovery branch from the live main branch at T_incident - 1 minute
   neon branch create --project-id <PROJECT_ID> \
     --name restore-pitr \
     --parent main \
     --timestamp "2026-09-24T06:30:00Z"
   ```
3. **Verify Integrity**:
   Inspect row counts on the `restore-pitr` branch:
   ```bash
   npx prisma db pull
   ```
4. **Promote Branch**:
   Set `restore-pitr` as default branch or update `DATABASE_URL` in Vercel to point to the restored compute endpoint.

---

### Scenario B: Catastrophic Project Loss or Multi-Cloud Migration
*Target: Full restore from application-level cryptographic JSON snapshot.*

1. **Locate Latest Valid Snapshot**:
   Select the most recent `.json` archive from the `backups/` directory or cold storage.
2. **Verify Checksum**:
   ```typescript
   import { verifyBackupIntegrity } from "@/lib/db/backup";
   const isValid = verifyBackupIntegrity(backupJson, expectedChecksum);
   if (!isValid) throw new Error("Backup file corrupted. Checksum mismatch.");
   ```
3. **Provision Fresh Database**:
   ```bash
   # Reset schema on fresh PostgreSQL instance
   npx prisma db push --accept-data-loss
   ```
4. **Execute Restoration Ingestion**:
   Execute the batch restoration script to populate relational records in dependency order (Institutions -> Departments -> Users -> Students -> Courses).

---

## 6. Backup Verification Schedule & Drills

1. **Bi-Weekly Integrity Verification**: Automated run of `verifyBackupIntegrity()` against newly generated snapshot archives.
2. **Monthly Recovery Drill**: Staging environment restored from backup to validate RTO bounds (< 15 minutes).
3. **Pre-Deployment Snapshots**: High-risk schema changes (`prisma db push` or major feature releases) require an immediate pre-release snapshot creation.
