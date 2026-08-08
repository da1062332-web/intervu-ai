-- Add retry metadata columns to generation_jobs for BullMQ retry tracking
ALTER TABLE "generation_jobs"
  ADD COLUMN IF NOT EXISTS "attemptsMade" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "generation_jobs"
  ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER;
