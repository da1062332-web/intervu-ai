-- CreateTable
CREATE TABLE "blueprint_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "totalQuestions" INTEGER NOT NULL,
    "totalDurationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blueprint_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprint_topic_configs" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "weightage" DECIMAL(65,30) NOT NULL,
    "easyCount" INTEGER NOT NULL,
    "mediumCount" INTEGER NOT NULL,
    "hardCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blueprint_topic_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blueprint_configs_code_key" ON "blueprint_configs"("code");

-- CreateIndex
CREATE INDEX "blueprint_configs_deletedAt_idx" ON "blueprint_configs"("deletedAt");

-- CreateIndex
CREATE INDEX "blueprint_topic_configs_blueprintId_idx" ON "blueprint_topic_configs"("blueprintId");

-- CreateIndex
CREATE INDEX "blueprint_topic_configs_sectionId_idx" ON "blueprint_topic_configs"("sectionId");

-- CreateIndex
CREATE INDEX "blueprint_topic_configs_topicId_idx" ON "blueprint_topic_configs"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "blueprint_topic_configs_blueprintId_topicId_key" ON "blueprint_topic_configs"("blueprintId", "topicId");

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprint_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
