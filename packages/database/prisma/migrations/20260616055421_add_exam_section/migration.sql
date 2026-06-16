-- CreateTable
CREATE TABLE "ExamSection" (
    "id" TEXT NOT NULL,
    "examConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "durationMinutes" INTEGER,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamSection_examConfigId_idx" ON "ExamSection"("examConfigId");

-- CreateIndex
CREATE INDEX "ExamSection_displayOrder_idx" ON "ExamSection"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSection_examConfigId_displayOrder_key" ON "ExamSection"("examConfigId", "displayOrder");

-- AddForeignKey
ALTER TABLE "ExamSection" ADD CONSTRAINT "ExamSection_examConfigId_fkey" FOREIGN KEY ("examConfigId") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
