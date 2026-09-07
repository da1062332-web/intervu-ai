-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "plan" TYPE TEXT USING "plan"::TEXT;
ALTER TABLE "subscriptions" ALTER COLUMN "plan" SET DEFAULT 'FREE';
