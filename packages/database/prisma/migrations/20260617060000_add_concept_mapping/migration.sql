-- CreateTable
CREATE TABLE "ConceptMapping" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "conceptName" TEXT NOT NULL,
    "conceptCode" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConceptMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConceptMapping_topicId_idx" ON "ConceptMapping"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptMapping_topicId_conceptCode_key" ON "ConceptMapping"("topicId", "conceptCode");
