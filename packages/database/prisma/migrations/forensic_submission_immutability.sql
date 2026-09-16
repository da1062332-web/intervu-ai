-- 1. Add new enum values to SubmissionStatus
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'AUTO_SUBMITTED';
ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'FINAL_SUBMITTED';

-- 2. Drop unique constraint on testInstanceId to allow multiple sequential submissions (original auto-submit + final submit)
ALTER TABLE "Submission" DROP CONSTRAINT IF EXISTS "Submission_testInstanceId_key";

-- 3. Add attempt_sequence and is_current columns to Submission
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "attempt_sequence" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "is_current" BOOLEAN NOT NULL DEFAULT true;

-- 4. Create performance indices for sequence and current submission lookups
CREATE INDEX IF NOT EXISTS "Submission_testInstanceId_is_current_idx" ON "Submission"("testInstanceId", "is_current");
CREATE INDEX IF NOT EXISTS "Submission_testInstanceId_attempt_sequence_idx" ON "Submission"("testInstanceId", "attempt_sequence");
