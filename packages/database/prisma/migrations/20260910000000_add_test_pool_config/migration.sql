-- AlterTable: add dynamic pre-generated pool configuration to RuleFlags
ALTER TABLE "RuleFlags"
ADD COLUMN IF NOT EXISTS "pool_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "pool_target_size" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS "pool_min_threshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS "pool_refill_batch_size" INTEGER NOT NULL DEFAULT 5;

-- CreateTable: pre-generated test instance pool
CREATE TABLE IF NOT EXISTS "pregenerated_test_instances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "config_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "config_version_hash" TEXT,
    "sections_json" JSONB NOT NULL,
    "claimed_by" TEXT,
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pregenerated_test_instances_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pregenerated_test_instances_config_id_status_idx"
ON "pregenerated_test_instances"("config_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "pregenerated_test_instances_config_id_status_created_at_idx"
ON "pregenerated_test_instances"("config_id", "status", "created_at");
