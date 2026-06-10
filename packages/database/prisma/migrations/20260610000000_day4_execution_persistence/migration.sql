-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'EVALUATED');

-- CreateTable
CREATE TABLE "CandidateAnswer" (
    "id" TEXT NOT NULL,
    "testInstanceId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "isMarkedForReview" BOOLEAN NOT NULL DEFAULT false,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionState" (
    "id" TEXT NOT NULL,
    "testInstanceId" TEXT NOT NULL,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "remainingTimeSeconds" INTEGER NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "testInstanceId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submissionHash" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateAnswer_testInstanceId_idx" ON "CandidateAnswer"("testInstanceId");

-- CreateIndex
CREATE INDEX "CandidateAnswer_questionId_idx" ON "CandidateAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateAnswer_testInstanceId_questionId_key" ON "CandidateAnswer"("testInstanceId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionState_testInstanceId_key" ON "ExecutionState"("testInstanceId");

-- CreateIndex
CREATE INDEX "ExecutionState_testInstanceId_idx" ON "ExecutionState"("testInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_testInstanceId_key" ON "Submission"("testInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_submissionHash_key" ON "Submission"("submissionHash");

-- CreateIndex
CREATE INDEX "Submission_testInstanceId_idx" ON "Submission"("testInstanceId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- AddForeignKey
ALTER TABLE "CandidateAnswer" ADD CONSTRAINT "CandidateAnswer_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionState" ADD CONSTRAINT "ExecutionState_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
