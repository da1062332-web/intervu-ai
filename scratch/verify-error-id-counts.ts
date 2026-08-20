import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

async function verify() {
  const errorTopic = await prisma.topic.findFirst({
    where: { code: "ERROR_IDENTIFICATION" },
  });
  if (!errorTopic) return;

  const countInQuestionTable = await prisma.question.count({
    where: { topicId: errorTopic.id },
  });

  const countInGenQuestionTable = await prisma.generatedQuestion.count({
    where: {
      OR: [
        { conceptKey: "ERROR_IDENTIFICATION" },
        {
          questionText: {
            contains: "Select the option that has the error",
            mode: "insensitive",
          },
        },
      ],
    },
  });

  console.log(`\n=== FINAL COUNT VERIFICATION ===`);
  console.log(`Error Identification topic ID: ${errorTopic.id}`);
  console.log(
    `Questions in main 'Question' table for Error Identification: ${countInQuestionTable}`,
  );
  console.log(
    `Questions in 'GeneratedQuestion' table matching Error Identification: ${countInGenQuestionTable}`,
  );

  // Fetch all status breakdown for Error Identification in GeneratedQuestion
  const genQuestions = await prisma.generatedQuestion.findMany({
    where: {
      OR: [
        { conceptKey: "ERROR_IDENTIFICATION" },
        {
          questionText: {
            contains: "Select the option that has the error",
            mode: "insensitive",
          },
        },
      ],
    },
  });

  const statusMap: Record<string, number> = {};
  genQuestions.forEach((q) => {
    const meta = (q.metadata || {}) as any;
    const st = (meta.status || q.status || "DRAFT").toUpperCase();
    statusMap[st] = (statusMap[st] || 0) + 1;
  });

  console.log("\nStatus Breakdown in GeneratedQuestion:", statusMap);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
