-- CreateTable
CREATE TABLE "DifficultyDistribution" (
    "id" TEXT NOT NULL,
    "examConfigId" TEXT NOT NULL,
    "easyCount" INTEGER NOT NULL,
    "mediumCount" INTEGER NOT NULL,
    "hardCount" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DifficultyDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRuleFlags" (
    "id" TEXT NOT NULL,
    "examConfigId" TEXT NOT NULL,
    "negativeMarkingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "randomizeOptions" BOOLEAN NOT NULL DEFAULT false,
    "calculatorAllowed" BOOLEAN NOT NULL DEFAULT false,
    "sectionLockingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "freeNavigationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRuleFlags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DifficultyDistribution_examConfigId_key" ON "DifficultyDistribution"("examConfigId");

-- CreateIndex
CREATE INDEX "DifficultyDistribution_examConfigId_idx" ON "DifficultyDistribution"("examConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRuleFlags_examConfigId_key" ON "ExamRuleFlags"("examConfigId");

-- CreateIndex
CREATE INDEX "ExamRuleFlags_examConfigId_idx" ON "ExamRuleFlags"("examConfigId");

-- AddForeignKey
ALTER TABLE "DifficultyDistribution" ADD CONSTRAINT "DifficultyDistribution_examConfigId_fkey" FOREIGN KEY ("examConfigId") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamRuleFlags" ADD CONSTRAINT "ExamRuleFlags_examConfigId_fkey" FOREIGN KEY ("examConfigId") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
