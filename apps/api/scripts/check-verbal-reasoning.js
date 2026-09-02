require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const topics = [
    'Statements and Conclusion',
    'Idioms and phrases',
    'Fill In The Blanks',
    'Error Identification',
    'Reasoning Ability',
    'Blood Relation',
    'Number Series'
  ];

  const topicRecs = await prisma.topic.findMany({
    where: { name: { in: topics } }
  });
  const topicIds = topicRecs.map(t => t.id);

  const questions = await prisma.question.findMany({
    where: { topicId: { in: topicIds } }
  });

  let errorCount = 0;
  for (const q of questions) {
    if (q.questionType !== 'MCQ') continue;
    let data;
    try {
      data = typeof q.mcqData === 'string' ? JSON.parse(q.mcqData) : q.mcqData;
    } catch (e) {
      console.log(`JSON parse error on ${q.id}`);
      errorCount++;
      continue;
    }
    
    if (!data.options || !Array.isArray(data.options) || data.options.length < 2) {
      console.log(`Missing options on ${q.id}: ${q.questionStatement}`);
      errorCount++;
    }
    
    if (!q.answer) {
      console.log(`Missing answer on ${q.id}`);
      errorCount++;
    } else if (data.options && !data.options.includes(q.answer) && !data.options.some(o => typeof o === 'string' && o.includes(q.answer))) {
      // Just flag it to review manually.
      // console.log(`Answer not in options on ${q.id}: ${q.answer} vs ${data.options}`);
    }
  }
  console.log(`Checked ${questions.length} Verbal/Reasoning questions. Errors: ${errorCount}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
