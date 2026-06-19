/*
  Warnings:

  - Added the required column `updatedAt` to the `SectionTopic` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SectionTopic" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "TopicWeightage" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "weightagePercentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicWeightage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicWeightage_sectionId_idx" ON "TopicWeightage"("sectionId");

-- CreateIndex
CREATE INDEX "TopicWeightage_topicId_idx" ON "TopicWeightage"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicWeightage_sectionId_topicId_key" ON "TopicWeightage"("sectionId", "topicId");

-- AddForeignKey
ALTER TABLE "SectionTopic" ADD CONSTRAINT "SectionTopic_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTopic" ADD CONSTRAINT "SectionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicWeightage" ADD CONSTRAINT "TopicWeightage_sectionId_topicId_fkey" FOREIGN KEY ("sectionId", "topicId") REFERENCES "SectionTopic"("sectionId", "topicId") ON DELETE CASCADE ON UPDATE CASCADE;
