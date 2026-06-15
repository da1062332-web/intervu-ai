-- CreateTable
CREATE TABLE "ExamConfig" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamConfigVersion" (
    "id" TEXT NOT NULL,
    "examConfigId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamConfig_createdAt_idx" ON "ExamConfig"("createdAt");

-- CreateIndex
CREATE INDEX "ExamConfig_role_idx" ON "ExamConfig"("role");

-- CreateIndex
CREATE INDEX "ExamConfigVersion_examConfigId_idx" ON "ExamConfigVersion"("examConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamConfigVersion_examConfigId_versionNumber_key" ON "ExamConfigVersion"("examConfigId", "versionNumber");

-- AddForeignKey
ALTER TABLE "ExamConfigVersion" ADD CONSTRAINT "ExamConfigVersion_examConfigId_fkey" FOREIGN KEY ("examConfigId") REFERENCES "ExamConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
