-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "tags" TEXT[],
    "easySupport" BOOLEAN NOT NULL DEFAULT true,
    "mediumSupport" BOOLEAN NOT NULL DEFAULT true,
    "hardSupport" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ConceptMapping" ADD CONSTRAINT "ConceptMapping_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
