-- CreateTable: coding_oracles
CREATE TABLE IF NOT EXISTS "coding_oracles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "supportedDifficulties" TEXT[] DEFAULT ARRAY['EASY', 'MEDIUM', 'HARD']::"text"[],
    "parameterSchema" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "coding_oracles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coding_oracles_key_key" ON "coding_oracles"("key");
CREATE INDEX IF NOT EXISTS "coding_oracles_key_idx" ON "coding_oracles"("key");
CREATE INDEX IF NOT EXISTS "coding_oracles_category_idx" ON "coding_oracles"("category");
CREATE INDEX IF NOT EXISTS "coding_oracles_isActive_idx" ON "coding_oracles"("isActive");

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "CodingPatternStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: coding_patterns
CREATE TABLE IF NOT EXISTS "coding_patterns" (
    "id" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "CodingPatternStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "oracleKey" TEXT NOT NULL,
    "statementSpecification" JSONB NOT NULL DEFAULT '{}',
    "parameterSchema" JSONB NOT NULL DEFAULT '{}',
    "constraintSchema" JSONB NOT NULL DEFAULT '{}',
    "aiConfiguration" JSONB NOT NULL DEFAULT '{}',
    "starterCode" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "coding_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "coding_patterns_patternKey_key" ON "coding_patterns"("patternKey");
CREATE UNIQUE INDEX IF NOT EXISTS "coding_patterns_slug_key" ON "coding_patterns"("slug");
CREATE INDEX IF NOT EXISTS "coding_patterns_patternKey_idx" ON "coding_patterns"("patternKey");
CREATE INDEX IF NOT EXISTS "coding_patterns_oracleKey_idx" ON "coding_patterns"("oracleKey");
CREATE INDEX IF NOT EXISTS "coding_patterns_difficulty_idx" ON "coding_patterns"("difficulty");
CREATE INDEX IF NOT EXISTS "coding_patterns_status_idx" ON "coding_patterns"("status");
CREATE INDEX IF NOT EXISTS "coding_patterns_deletedAt_idx" ON "coding_patterns"("deletedAt");

-- CreateTable: coding_test_cases
CREATE TABLE IF NOT EXISTS "coding_test_cases" (
    "id" TEXT NOT NULL,
    "patternId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "expectedOutput" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isStress" BOOLEAN NOT NULL DEFAULT false,
    "isBoundary" BOOLEAN NOT NULL DEFAULT false,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coding_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "coding_test_cases_patternId_idx" ON "coding_test_cases"("patternId");
CREATE INDEX IF NOT EXISTS "coding_test_cases_isPublic_idx" ON "coding_test_cases"("isPublic");

-- AddForeignKey: coding_patterns -> coding_oracles
DO $$ BEGIN
    ALTER TABLE "coding_patterns" ADD CONSTRAINT "coding_patterns_oracleKey_fkey"
    FOREIGN KEY ("oracleKey") REFERENCES "coding_oracles"("key") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: coding_test_cases -> coding_patterns
DO $$ BEGIN
    ALTER TABLE "coding_test_cases" ADD CONSTRAINT "coding_test_cases_patternId_fkey"
    FOREIGN KEY ("patternId") REFERENCES "coding_patterns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
