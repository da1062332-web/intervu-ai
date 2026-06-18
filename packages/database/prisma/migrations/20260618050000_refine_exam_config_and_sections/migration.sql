-- CreateEnum
CREATE TYPE "ConfigStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropIndex
DROP INDEX IF EXISTS "ExamSection_displayOrder_idx";

-- DropIndex
DROP INDEX IF EXISTS "ExamSection_examConfigId_displayOrder_key";

-- 1. AlterTable ExamConfig to add columns as nullable first
ALTER TABLE "ExamConfig" ADD COLUMN "code" TEXT;
ALTER TABLE "ExamConfig" ADD COLUMN "description" TEXT;
ALTER TABLE "ExamConfig" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExamConfig" ADD COLUMN "status" "ConfigStatus" NOT NULL DEFAULT 'DRAFT';

-- 2. Backfill ExamConfig code uniquely using CUID suffix to avoid composite collision
UPDATE "ExamConfig"
SET "code" = UPPER(REPLACE(TRIM("name"), ' ', '_')) || '_' || SUBSTRING("id", LENGTH("id") - 4, 5)
WHERE "code" IS NULL;

-- 3. Set NOT NULL on ExamConfig.code
ALTER TABLE "ExamConfig" ALTER COLUMN "code" SET NOT NULL;

-- 4. AlterTable ExamSection - Rename displayOrder to sectionOrder, durationMinutes to sectionDurationMinutes
ALTER TABLE "ExamSection" RENAME COLUMN "displayOrder" TO "sectionOrder";
ALTER TABLE "ExamSection" RENAME COLUMN "durationMinutes" TO "sectionDurationMinutes";

-- 5. Backfill NULL durations in sectionDurationMinutes
UPDATE "ExamSection" SET "sectionDurationMinutes" = 0 WHERE "sectionDurationMinutes" IS NULL;

-- 6. Set NOT NULL on sectionDurationMinutes
ALTER TABLE "ExamSection" ALTER COLUMN "sectionDurationMinutes" SET NOT NULL;

-- 7. Add code and isRequired columns to ExamSection as nullable first
ALTER TABLE "ExamSection" ADD COLUMN "code" TEXT;
ALTER TABLE "ExamSection" ADD COLUMN "isRequired" BOOLEAN NOT NULL DEFAULT true;

-- 8. Backfill ExamSection code uniquely within each examConfig
UPDATE "ExamSection"
SET "code" = UPPER(REPLACE(TRIM("name"), ' ', '_')) || '_' || "sectionOrder"
WHERE "code" IS NULL;

-- 9. Set NOT NULL on ExamSection.code
ALTER TABLE "ExamSection" ALTER COLUMN "code" SET NOT NULL;

-- 10. Create indexes and unique constraints
CREATE UNIQUE INDEX "ExamConfig_code_key" ON "ExamConfig"("code");
CREATE INDEX "ExamSection_sectionOrder_idx" ON "ExamSection"("sectionOrder");
CREATE UNIQUE INDEX "ExamSection_examConfigId_code_key" ON "ExamSection"("examConfigId", "code");
