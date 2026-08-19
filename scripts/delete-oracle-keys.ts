import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Oracle Key Database Cleanup ---');

  const oracles = await prisma.codingOracle.findMany();
  console.log(`Found ${oracles.length} CodingOracle records:`, oracles.map((o) => o.key));

  const patterns = await prisma.codingPattern.findMany();
  console.log(`Found ${patterns.length} CodingPattern records.`);

  // 1. Delete CodingPattern records referencing oracle keys
  const deletedPatterns = await prisma.codingPattern.deleteMany({});
  console.log(`Deleted ${deletedPatterns.count} CodingPattern records.`);

  // 2. Delete CodingOracle records from database
  const deletedOracles = await prisma.codingOracle.deleteMany({});
  console.log(`Deleted ${deletedOracles.count} CodingOracle records.`);

  // 3. Remove oracleKey references inside Question codingData JSON
  const codingQuestions = await prisma.question.findMany({
    where: {
      questionType: 'CODING',
    },
  });
  console.log(`Checked ${codingQuestions.length} CODING questions for oracleKey references.`);

  let updatedQuestionCount = 0;
  for (const q of codingQuestions) {
    if (q.codingData && typeof q.codingData === 'object') {
      const data = { ...(q.codingData as Record<string, unknown>) };
      if ('oracleKey' in data) {
        delete data.oracleKey;
        await prisma.question.update({
          where: { id: q.id },
          data: { codingData: data as any },
        });
        updatedQuestionCount++;
      }
    }
  }
  console.log(`Stripped oracleKey from ${updatedQuestionCount} Question records.`);

  console.log('✅ All existing oracle keys and associated pattern records successfully deleted from database.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing deletion:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
