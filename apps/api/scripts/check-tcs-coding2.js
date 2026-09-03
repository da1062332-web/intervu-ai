require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const codingTopic = await prisma.topic.findFirst({
    where: { name: 'Coding' }
  });
  if (!codingTopic) return;

  const questions = await prisma.question.findMany({
    where: { topicId: codingTopic.id }
  });
  for (const q of questions) {
    console.log(`\n--- ${q.questionTitle} ---`);
    if (q.codingData) {
      const cd = typeof q.codingData === 'string' ? JSON.parse(q.codingData) : q.codingData;
      console.log('Public tests:', cd.publicTests?.length);
      console.log('Hidden tests:', cd.hiddenTests?.length);
      console.log('Starter code keys:', Object.keys(cd.starterCode || {}));
      console.log('Correctness logic present?', !!cd.correctnessLogic);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
