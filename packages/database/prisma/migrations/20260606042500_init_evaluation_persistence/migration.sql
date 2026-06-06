-- AlterTable
ALTER TABLE "EvaluationResult" ADD COLUMN     "overallScore" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "SkillScore" (
    "id" TEXT NOT NULL,
    "evaluationId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "feedback" TEXT NOT NULL,

    CONSTRAINT "SkillScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillScore_evaluationId_idx" ON "SkillScore"("evaluationId");

-- AddForeignKey
ALTER TABLE "SkillScore" ADD CONSTRAINT "SkillScore_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "EvaluationResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
