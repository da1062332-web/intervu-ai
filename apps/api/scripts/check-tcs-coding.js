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
  console.log(`Found ${questions.length} Coding questions.`);
  for (const q of questions) {
    console.log(`\n--- Question: ${q.questionTitle || q.id} ---`);
    console.log(q.questionStatement);
    console.log(`Source: ${q.questionSource} | Type: ${q.questionType}`);
    // Check codingData
    if (q.codingData) {
      console.log(`Coding data present: yes`);
    } else {
      console.log(`Coding data present: no`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
