import { PrismaClient } from '@prisma/client';

const dbUrl = "postgresql://postgres:MARVEL7ace%4077090@db.ayklmzeqfezrlbkdusqc.supabase.co:5432/postgres?connect_timeout=60&connection_limit=1";

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function verify() {
  const errorTopic = await prisma.topic.findFirst({ where: { code: 'ERROR_IDENTIFICATION' } });
  if (!errorTopic) return;

  const countInQuestionTable = await prisma.question.count({
    where: { topicId: errorTopic.id },
  });

  const countInGenQuestionTable = await prisma.generatedQuestion.count({
    where: {
      OR: [
        { conceptKey: 'ERROR_IDENTIFICATION' },
        { questionText: { contains: 'Select the option that has the error', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`\n=== FINAL COUNT VERIFICATION ===`);
  console.log(`Error Identification topic ID: ${errorTopic.id}`);
  console.log(`Questions in main 'Question' table for Error Identification: ${countInQuestionTable}`);
  console.log(`Questions in 'GeneratedQuestion' table matching Error Identification: ${countInGenQuestionTable}`);

  // Fetch all status breakdown for Error Identification in GeneratedQuestion
  const genQuestions = await prisma.generatedQuestion.findMany({
    where: {
      OR: [
        { conceptKey: 'ERROR_IDENTIFICATION' },
        { questionText: { contains: 'Select the option that has the error', mode: 'insensitive' } },
      ],
    },
  });

  const statusMap: Record<string, number> = {};
  genQuestions.forEach((q) => {
    const meta = (q.metadata || {}) as any;
    const st = (meta.status || q.status || 'DRAFT').toUpperCase();
    statusMap[st] = (statusMap[st] || 0) + 1;
  });

  console.log('\nStatus Breakdown in GeneratedQuestion:', statusMap);
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
