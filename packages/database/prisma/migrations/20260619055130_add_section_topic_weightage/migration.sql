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

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "config_id" TEXT NOT NULL,
    "style_profile_id" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_profile_characteristics" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "characteristic_name" TEXT NOT NULL,
    "characteristic_value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profile_characteristics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "style_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profile_type" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "style_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicWeightage_sectionId_idx" ON "TopicWeightage"("sectionId");

-- CreateIndex
CREATE INDEX "TopicWeightage_topicId_idx" ON "TopicWeightage"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicWeightage_sectionId_topicId_key" ON "TopicWeightage"("sectionId", "topicId");

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

-- CreateIndex
CREATE UNIQUE INDEX "blueprints_config_id_key" ON "blueprints"("config_id");

-- CreateIndex
CREATE INDEX "blueprints_config_id_idx" ON "blueprints"("config_id");

-- CreateIndex
CREATE INDEX "blueprints_style_profile_id_idx" ON "blueprints"("style_profile_id");

-- CreateIndex
CREATE INDEX "style_profile_characteristics_profile_id_idx" ON "style_profile_characteristics"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "style_profile_characteristics_profile_id_characteristic_nam_key" ON "style_profile_characteristics"("profile_id", "characteristic_name");

-- CreateIndex
CREATE INDEX "style_profiles_active_idx" ON "style_profiles"("active");

-- CreateIndex
CREATE INDEX "style_profiles_profile_type_idx" ON "style_profiles"("profile_type");

-- AddForeignKey
ALTER TABLE "SectionTopic" ADD CONSTRAINT "SectionTopic_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionTopic" ADD CONSTRAINT "SectionTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicWeightage" ADD CONSTRAINT "TopicWeightage_sectionId_topicId_fkey" FOREIGN KEY ("sectionId", "topicId") REFERENCES "SectionTopic"("sectionId", "topicId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "blueprint_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ExamSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprint_topic_configs" ADD CONSTRAINT "blueprint_topic_configs_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_style_profile_id_fkey" FOREIGN KEY ("style_profile_id") REFERENCES "style_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "style_profile_characteristics" ADD CONSTRAINT "style_profile_characteristics_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "style_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
