-- Live Assessment Monitoring & Recovery System Migration

-- 1. Extend TestInstanceStatus enum
DO $$
BEGIN
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'NOT_STARTED';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'STARTING';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'ACTIVE';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'DISCONNECTED';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'RECONNECTING';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'SUBMITTING';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'AUTO_SUBMITTED';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'EVALUATING';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'TERMINATED';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'ADMIN_REVIEW';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'RESUME_AUTHORIZED';
  ALTER TYPE "TestInstanceStatus" ADD VALUE IF NOT EXISTS 'RESUMED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Extend SubmissionStatus enum
DO $$
BEGIN
  ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'RECOVERED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create SubmissionSource enum
DO $$
BEGIN
  CREATE TYPE "SubmissionSource" AS ENUM ('USER', 'SYSTEM', 'RULE_ENGINE', 'TIMEOUT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create SubmissionReason enum
DO $$
BEGIN
  CREATE TYPE "SubmissionReason" AS ENUM ('USER_SUBMIT', 'TIME_EXPIRED', 'PROCTORING_LIMIT', 'NETWORK_FAILURE', 'SESSION_EXPIRY', 'SYSTEM_FAILURE', 'ADMIN_ACTION', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Update Submission table
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "source" "SubmissionSource" NOT NULL DEFAULT 'USER';
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "reason" "SubmissionReason" NOT NULL DEFAULT 'USER_SUBMIT';
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "reason_details" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "is_auto_submit" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "checkpoint_data" JSONB;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "correlation_id" TEXT;

CREATE INDEX IF NOT EXISTS "Submission_source_idx" ON "Submission"("source");
CREATE INDEX IF NOT EXISTS "Submission_is_auto_submit_idx" ON "Submission"("is_auto_submit");

-- 6. Update AssessmentAuditLog table
ALTER TABLE "assessment_audit_logs" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'CANDIDATE';
ALTER TABLE "assessment_audit_logs" ADD COLUMN IF NOT EXISTS "severity" TEXT DEFAULT 'P3';
ALTER TABLE "assessment_audit_logs" ADD COLUMN IF NOT EXISTS "actor_id" TEXT;
ALTER TABLE "assessment_audit_logs" ADD COLUMN IF NOT EXISTS "actor_role" TEXT DEFAULT 'CANDIDATE';
ALTER TABLE "assessment_audit_logs" ADD COLUMN IF NOT EXISTS "correlation_id" TEXT;

CREATE INDEX IF NOT EXISTS "assessment_audit_logs_event_type_idx" ON "assessment_audit_logs"("event_type");

-- 7. Create assessment_events table
CREATE TABLE IF NOT EXISTS "assessment_events" (
  "id" TEXT NOT NULL,
  "assessment_id" TEXT NOT NULL,
  "attempt_id" TEXT NOT NULL,
  "candidate_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'CANDIDATE',
  "severity" TEXT NOT NULL DEFAULT 'P3',
  "correlation_id" TEXT,
  "metadata" JSONB,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assessment_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_events_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "assessment_events_assessment_id_idx" ON "assessment_events"("assessment_id");
CREATE INDEX IF NOT EXISTS "assessment_events_attempt_id_idx" ON "assessment_events"("attempt_id");
CREATE INDEX IF NOT EXISTS "assessment_events_candidate_id_idx" ON "assessment_events"("candidate_id");
CREATE INDEX IF NOT EXISTS "assessment_events_event_type_idx" ON "assessment_events"("event_type");
CREATE INDEX IF NOT EXISTS "assessment_events_severity_idx" ON "assessment_events"("severity");
CREATE INDEX IF NOT EXISTS "assessment_events_timestamp_idx" ON "assessment_events"("timestamp");

-- 8. Create attempt_recovery_logs table
CREATE TABLE IF NOT EXISTS "attempt_recovery_logs" (
  "id" TEXT NOT NULL,
  "attempt_id" TEXT NOT NULL,
  "admin_id" TEXT NOT NULL,
  "admin_email" TEXT,
  "previous_status" TEXT NOT NULL,
  "new_status" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "extra_time_seconds" INTEGER NOT NULL DEFAULT 0,
  "checkpoint_data" JSONB,
  "correlation_id" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "attempt_recovery_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attempt_recovery_logs_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "attempt_recovery_logs_attempt_id_idx" ON "attempt_recovery_logs"("attempt_id");
CREATE INDEX IF NOT EXISTS "attempt_recovery_logs_admin_id_idx" ON "attempt_recovery_logs"("admin_id");

-- 9. Create live_assessment_alerts table
CREATE TABLE IF NOT EXISTS "live_assessment_alerts" (
  "id" TEXT NOT NULL,
  "assessment_id" TEXT NOT NULL,
  "attempt_id" TEXT,
  "candidate_id" TEXT,
  "severity" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "is_resolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "resolved_at" TIMESTAMP(3),
  "resolved_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "live_assessment_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "live_assessment_alerts_assessment_id_idx" ON "live_assessment_alerts"("assessment_id");
CREATE INDEX IF NOT EXISTS "live_assessment_alerts_attempt_id_idx" ON "live_assessment_alerts"("attempt_id");
CREATE INDEX IF NOT EXISTS "live_assessment_alerts_severity_is_resolved_idx" ON "live_assessment_alerts"("severity", "is_resolved");
