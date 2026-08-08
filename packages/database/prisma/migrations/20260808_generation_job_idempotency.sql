-- Add idempotency tracking to generation_jobs for active-job deduplication
ALTER TABLE "generation_jobs"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE INDEX IF NOT EXISTS "generation_jobs_status_idempotencyKey_idx"
  ON "generation_jobs" ("status", "idempotencyKey");
