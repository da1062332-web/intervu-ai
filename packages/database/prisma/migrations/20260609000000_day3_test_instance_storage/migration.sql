-- CreateEnum
CREATE TYPE "TestInstanceStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED');

-- CreateTable
CREATE TABLE "TestInstance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testConfigId" TEXT NOT NULL,
    "status" "TestInstanceStatus" NOT NULL DEFAULT 'CREATED',
    "startedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestInstanceSection" (
    "id" TEXT NOT NULL,
    "testInstanceId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "sectionName" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestInstanceSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestInstanceQuestion" (
    "id" TEXT NOT NULL,
    "testInstanceId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "questionOrder" INTEGER NOT NULL,
    "questionSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestInstanceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestInstance_userId_idx" ON "TestInstance"("userId");

-- CreateIndex
CREATE INDEX "TestInstance_status_idx" ON "TestInstance"("status");

-- CreateIndex
CREATE INDEX "TestInstance_testConfigId_idx" ON "TestInstance"("testConfigId");

-- CreateIndex
CREATE INDEX "TestInstanceSection_testInstanceId_idx" ON "TestInstanceSection"("testInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "TestInstanceSection_testInstanceId_orderIndex_key" ON "TestInstanceSection"("testInstanceId", "orderIndex");

-- CreateIndex
CREATE INDEX "TestInstanceQuestion_testInstanceId_idx" ON "TestInstanceQuestion"("testInstanceId");

-- CreateIndex
CREATE INDEX "TestInstanceQuestion_sectionId_idx" ON "TestInstanceQuestion"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestInstanceQuestion_sectionId_questionOrder_key" ON "TestInstanceQuestion"("sectionId", "questionOrder");

-- AddForeignKey
ALTER TABLE "TestInstance" ADD CONSTRAINT "TestInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInstance" ADD CONSTRAINT "TestInstance_testConfigId_fkey" FOREIGN KEY ("testConfigId") REFERENCES "TestConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInstanceSection" ADD CONSTRAINT "TestInstanceSection_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInstanceQuestion" ADD CONSTRAINT "TestInstanceQuestion_testInstanceId_fkey" FOREIGN KEY ("testInstanceId") REFERENCES "TestInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestInstanceQuestion" ADD CONSTRAINT "TestInstanceQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "TestInstanceSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

