-- CreateEnum
CREATE TYPE "RecommendationPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "EvaluationResult" ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "incorrectAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "testInstanceId" TEXT,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "testId" DROP NOT NULL,
ALTER COLUMN "communicationScore" SET DEFAULT 0.0,
ALTER COLUMN "technicalScore" SET DEFAULT 0.0,
ALTER COLUMN "overallRating" SET DEFAULT 0.0;

-- AlterTable
ALTER TABLE "SkillScore" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "priority" "RecommendationPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceSummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testsCompleted" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lastAssessmentDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recommendation_evaluationId_idx" ON "Recommendation"("evaluationId");

-- CreateIndex
CREATE INDEX "Recommendation_priority_idx" ON "Recommendation"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceSummary_userId_key" ON "PerformanceSummary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationResult_testInstanceId_key" ON "EvaluationResult"("testInstanceId");

-- CreateIndex
CREATE INDEX "EvaluationResult_testInstanceId_idx" ON "EvaluationResult"("testInstanceId");

-- CreateIndex
CREATE INDEX "EvaluationResult_overallScore_idx" ON "EvaluationResult"("overallScore");

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "EvaluationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceSummary" ADD CONSTRAINT "PerformanceSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add Custom Check Constraint for XOR relationship (testId vs testInstanceId)
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "chk_evaluation_source" 
CHECK (
  ("testId" IS NOT NULL AND "testInstanceId" IS NULL) OR 
  ("testId" IS NULL AND "testInstanceId" IS NOT NULL)
);
