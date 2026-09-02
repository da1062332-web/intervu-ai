import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRawSqlUsages() {
  const sampleTopicIds = [
    "4ba3b455-f07f-43b5-92a1-97f420567462",
    "192425b9-c1dc-4e04-9b8d-39e4c87dcc15",
    "ad831921-634b-48b0-a423-ec1080de2e17",
  ];
  const configId = "dummy-config";

  console.log("Testing raw SQL usages with correct table names...");
  let t0 = Date.now();
  const usages: any[] = await prisma.$queryRaw`
    SELECT u."config_id" AS "configId", COUNT(u."question_id")::int AS "count"
    FROM "exam_config_question_usages" u
    JOIN "questions" q ON u."question_id" = q.id
    WHERE u."config_id" != ${configId}
      AND q.status = 'ACTIVE'
      AND q."question_source" != 'MANUAL'
      AND q."topic_id" = ANY(${sampleTopicIds}::text[])
    GROUP BY u."config_id";
  `;
  console.log(`⏱️ Usages Raw SQL: ${Date.now() - t0}ms (${usages.length} rows)`);

  t0 = Date.now();
  const conflicts: any[] = await prisma.$queryRaw`
    SELECT DISTINCT q."topic_id" AS "topicId", c.name AS "configName"
    FROM "exam_config_question_usages" u
    JOIN "questions" q ON u."question_id" = q.id
    JOIN "ExamConfig" c ON u."config_id" = c.id
    WHERE u."config_id" != ${configId}
      AND q.status = 'ACTIVE'
      AND q."question_source" != 'MANUAL'
      AND q."topic_id" = ANY(${sampleTopicIds}::text[])
    LIMIT 20;
  `;
  console.log(`⏱️ Conflicts Raw SQL: ${Date.now() - t0}ms (${conflicts.length} rows)`);
}

testRawSqlUsages()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
