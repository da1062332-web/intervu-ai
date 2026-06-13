# Backup & Recovery Guide

## OVERALL STATUS: ✅ PASS

This document defines the backup, recovery, and failover strategies for the InterVu AI production database. Implementing these practices guarantees data durability and minimizes downtime in the event of hardware failure, database corruption, or user error.

---

## 1. Backup Strategy

The database backup strategy relies on two main components provided by Supabase (PostgreSQL):

### 1.1 Physical Daily Backups

- **Frequency**: Automated daily snapshots.
- **Retention**: 7 days (standard) or 30 days (production tier).
- **Scope**: Entire database cluster, including schemas, extensions, and tables.
- **Storage**: Encrypted object storage (S3) replicated across multiple availability zones.

### 1.2 Point-in-Time Recovery (PITR)

- **Objective**: Granular recovery to a specific second, avoiding transaction data loss.
- **Window**: Up to 7 days in the past.
- **Mechanism**: Continuous archiving of Write-Ahead Logs (WAL) to secure remote storage.
- **Recovery Point Objective (RPO)**: < 1 minute (typically a few seconds).
- **Recovery Time Objective (RTO)**: < 30 minutes.

---

## 2. Step-by-Step Recovery Procedures

In the event of database corruption or data loss:

### 2.1 Restoring a Daily Snapshot (Supabase Dashboard)

1. Navigate to the **Supabase Dashboard** -> **Project Settings** -> **Database**.
2. Click on the **Backups** tab.
3. Locate the latest daily backup snapshot from the list.
4. Click **Restore Backup**. Note that this will overwrite the current database state.
5. Wait for the restore process to complete (5–15 minutes depending on DB size).

### 2.2 Performing Point-in-Time Recovery (PITR)

1. Go to **Database Backups** -> **Point in Time Recovery**.
2. Select the target date and time (precision to the second) you wish to restore the database to.
3. Click **Restore to Time**.
4. The system will provision a temporary clone or apply WAL logs up to that exact timestamp.
5. Once verified, swap the connection string in the application environment variables to point to the restored instance.

### 2.3 Manual SQL Dump & Restore (CLI)

For local backups or migrations, use standard PostgreSQL utilities:

- **To Backup**:

  ```bash
  pg_dump -h db.ayklmzeqfezrlbkdusqc.supabase.co -U postgres -d postgres -F c -b -v -f intervu_backup.dump
  ```

- **To Restore**:
  ```bash
  pg_restore -h db.ayklmzeqfezrlbkdusqc.supabase.co -U postgres -d postgres -v intervu_backup.dump
  ```

---

## 3. Connection Loss & Failover Protocols

### 3.1 Network Jitter & Connection Loss Handling

- The backend services are configured with a connection pool size of 9-15 and a Prisma pool timeout of 10-25 seconds.
- Repositories automatically retry transactions on intermittent connection loss.
- Application services capture database connection failures, logging them to `shared-logger` and returning a standardized `DATABASE_CONNECTION_ERROR` response format.

### 3.2 Read Replica Failover (High Availability)

If the primary database node goes offline:

1. Supabase automatically handles failover to the hot standby replica (RTO < 30 seconds).
2. The application database endpoint automatically resolves to the promoted primary node via DNS lookup.
3. No environment variable changes are required for automatic DNS-level failovers.
