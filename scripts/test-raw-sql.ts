import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRawSql() {
  const config = await prisma.examConfig.findFirst({ where: { name: "TCS-NQT" } });
  if (!config) return;

  const sampleTopicIds = [
    "4ba3b455-f07f-43b5-92a1-97f420567462",
    "192425b9-c1dc-4e04-9b8d-39e4c87dcc15",
    "ad831921-634b-48b0-a423-ec1080de2e17",
  ];

  console.log("Testing raw SQL for section topics claim...");
  const t0 = Date.now();
  const rows: any[] = await prisma.$queryRaw`
    SELECT 
      st."topicId" AS "topicId",
      s."examConfigId" AS "configId",
      s."questionCount" AS "questionCount",
      (SELECT COUNT(*)::int FROM "SectionTopic" st2 WHERE st2."sectionId" = s.id) AS "sectionTopicCount"
    FROM "SectionTopic" st
    JOIN "ExamSection" s ON st."sectionId" = s.id
    JOIN "ExamConfig" c ON s."examConfigId" = c.id
    WHERE st."topicId" = ANY(${sampleTopicIds}::text[])
      AND c.id != ${config.id}
      AND c."isArchived" = false
      AND c.status != 'ARCHIVED';
  `;
  const elapsed = Date.now() - t0;
  console.log(`⏱️ Raw SQL Elapsed Time: ${elapsed}ms (${rows.length} rows)`);
  console.log("Sample rows:", rows.slice(0, 3));
}

testRawSql()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
