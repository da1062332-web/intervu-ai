-- Migration: add_config_versioning_publishing
-- Week 3 Day 1 — Configuration Management System

-- Step 1: Add new values to ConfigStatus enum
ALTER TYPE "ConfigStatus" ADD VALUE IF NOT EXISTS 'VALIDATED';
ALTER TYPE "ConfigStatus" ADD VALUE IF NOT EXISTS 'PUBLISHED';

-- Step 2: Add status index to ExamConfig
CREATE INDEX IF NOT EXISTS "ExamConfig_status_idx" ON "ExamConfig"("status");

-- Step 3: Create ConfigSnapshot model
CREATE TABLE IF NOT EXISTS "ConfigSnapshot" (
    "id"        TEXT NOT NULL,
    "configId"  TEXT NOT NULL,
    "version"   TEXT NOT NULL,
    "snapshot"  JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfigSnapshot_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConfigSnapshot_configId_fkey" FOREIGN KEY ("configId")
        REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ConfigSnapshot_configId_idx" ON "ConfigSnapshot"("configId");
CREATE INDEX IF NOT EXISTS "ConfigSnapshot_version_idx" ON "ConfigSnapshot"("version");

-- Step 4: Create ConfigPublishLog model
CREATE TABLE IF NOT EXISTS "ConfigPublishLog" (
    "id"          TEXT NOT NULL,
    "configId"    TEXT NOT NULL,
    "publishedBy" TEXT,
    "version"     TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConfigPublishLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ConfigPublishLog_configId_fkey" FOREIGN KEY ("configId")
        REFERENCES "ExamConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ConfigPublishLog_configId_idx" ON "ConfigPublishLog"("configId");
