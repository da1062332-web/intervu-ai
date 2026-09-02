require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetTopics = [
    'Programming Fundamentals',
    'Arrays & Strings',
    'Sorting & Searching',
    'Hashing',
    'Recursion',
    'Basic Data Structures',
    'SQL'
  ];

  let hasErrors = false;

  for (const tName of targetTopics) {
    console.log(`\nChecking Topic: ${tName}`);
    const topic = await prisma.topic.findFirst({ where: { name: tName } });
    if (!topic) {
      console.log(`❌ ERROR: Topic not found.`);
      hasErrors = true;
      continue;
    }

    const questions = await prisma.question.findMany({
      where: { topicId: topic.id, source: 'Manual Seed' },
      include: { concept: true }
    });

    console.log(`Found ${questions.length} questions (Expected 3).`);
    if (questions.length !== 3) hasErrors = true;

    const diffs = questions.map(q => q.difficulty).sort();
    if (diffs.join(',') !== 'EASY,HARD,MEDIUM') {
      console.log(`❌ ERROR: Difficulties do not match EASY, MEDIUM, HARD. Found: ${diffs}`);
      hasErrors = true;
    }

    for (const q of questions) {
      // Check MCQ data
      const data = typeof q.mcqData === 'string' ? JSON.parse(q.mcqData) : q.mcqData;
      
      if (!data || !Array.isArray(data.options) || data.options.length !== 4) {
        console.log(`❌ ERROR on Q(${q.id}): Invalid options array.`);
        hasErrors = true;
      }
      
      if (!q.answer) {
        console.log(`❌ ERROR on Q(${q.id}): No answer defined.`);
        hasErrors = true;
      } else if (data && data.options && !data.options.includes(q.answer)) {
        console.log(`❌ ERROR on Q(${q.id}): Answer '${q.answer}' is not in options array! Options: [${data.options.join(', ')}]`);
        hasErrors = true;
      }

      if (q.questionSource !== 'MANUAL') {
        console.log(`❌ ERROR on Q(${q.id}): Source is not MANUAL.`);
        hasErrors = true;
      }
    }
  }

  if (!hasErrors) {
    console.log('\n✅ ALL CHECKS PASSED: Questions are perfectly valid, options are correct, and answers match options precisely.');
  } else {
    console.log('\n❌ SOME CHECKS FAILED.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
