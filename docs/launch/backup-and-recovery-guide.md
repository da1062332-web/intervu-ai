# Backup & Recovery Guide

This guide details the backup strategy, disaster recovery workflows, and connection pool configurations for the IntervuAI production database layer.

---

## 1. Persistence Infrastructure

IntervuAI utilizes a PostgreSQL database hosted on Supabase.

- **Database Engine**: PostgreSQL v15+
- **Primary Host**: Supabase Managed Instance
- **Location**: AWS region (matching application deployment)

---

## 2. Backup Strategy & Policies

### 2.1 Automated Managed Backups

Supabase provides automated physical backups of the database:

- **Backup Type**: Daily full physical backups.
- **Retention Period**: 7 days (Base Tier) / 30 days (Enterprise Tier).
- **Scope**: Includes all PostgreSQL tables, schemas, indexes, and extensions.

### 2.2 Point-in-Time Recovery (PITR)

For critical production safety, Point-in-Time Recovery (PITR) is enabled:

- **Frequency**: Continuous archiving of Write-Ahead Logs (WAL).
- **Recovery Granularity**: Restore the database state to any specific second within the retention window (up to 30 days).
- **Purpose**: Protects against accidental data corruption, bad migrations, or malicious deletions.

---

## 3. Recovery Workflows

### 3.1 Point-in-Time Restore (Console)

To restore the database to a specific timestamp:

1. Log in to the **Supabase Dashboard**.
2. Navigate to **Project Settings** ➔ **Database** ➔ **Backups**.
3. Select **Point-in-Time Recovery (PITR)**.
4. Input the target restore timestamp (UTC).
5. Click **Prepare Restore**. Supabase will spin up a cloned database containing the restored state.
6. Verify data integrity on the restored instance.
7. Switch the connection string in the application environment configuration (`DATABASE_URL`) to point to the restored database host.

---

## 4. Connection Pool Configuration

To prevent pool exhaustion under concurrent API loads (as validated by the 100-user load test), the Prisma client connection pool is tuned as follows:

### 4.1 Connection String Settings

Adjust the `DATABASE_URL` query parameters in the production `.env` configuration:

```env
DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres?connection_limit=20&pool_timeout=15"
```

### 4.2 Tuning Parameters

- **`connection_limit`**: Configured to **20** connections per API container instance. For a clustered 3-container setup, this bounds max pool usage to 60, leaving sufficient connection headroom for database admin tasks and background worker queue jobs (max pg_connections is 500 on Supabase small tier).
- **`pool_timeout`**: Set to **15** seconds. If a connection request waits in the queue for longer than 15s, it will timeout, letting NestJS return a graceful HTTP 503 (Service Unavailable) rather than keeping requests hanging and exhausting server resources.

---

## 5. Idempotency & Failure Resiliency

- **Autosave Protection**: Answers are saved using `upsert` queries keyed by the unique composite index `(testInstanceId, questionId)`. If a duplicate request is sent due to network latency, the DB performs a safe update, preventing duplicate insertions.
- **Transactional Rollbacks**: High-impact multi-step operations (e.g. Question Assembly, Attempt Submissions, and Evaluation Outcome persistence) are fully wrapped in Prisma `$transaction` blocks to ensure that if any step fails, all preceding database writes are cleanly rolled back, preventing orphan entries.
