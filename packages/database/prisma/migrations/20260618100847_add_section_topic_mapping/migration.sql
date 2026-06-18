-- CreateTable
CREATE TABLE "SectionTopic" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SectionTopic_sectionId_idx" ON "SectionTopic"("sectionId");

-- CreateIndex
CREATE INDEX "SectionTopic_topicId_idx" ON "SectionTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionTopic_sectionId_topicId_key" ON "SectionTopic"("sectionId", "topicId");
