-- CreateIndex
CREATE INDEX "EvaluationResult_createdAt_idx" ON "EvaluationResult"("createdAt");

-- CreateIndex
CREATE INDEX "TestInstance_createdAt_idx" ON "TestInstance"("createdAt");

-- CreateIndex
CREATE INDEX "TestInstanceQuestion_questionId_idx" ON "TestInstanceQuestion"("questionId");
