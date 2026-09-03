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

  const topics = await prisma.topic.findMany({ where: { name: { in: targetTopics } } });
  let totalTemplates = 0;

  for (const topic of topics) {
    const questions = await prisma.question.findMany({
      where: { topicId: topic.id, source: 'Manual Seed' },
      include: { concept: true }
    });

    for (const q of questions) {
      if (!q.concept) continue;

      const data = typeof q.mcqData === 'string' ? JSON.parse(q.mcqData) : q.mcqData;
      if (!data || !data.options) continue;

      const existing = await prisma.template.findFirst({
        where: { name: `Template: ${q.concept.name} - ${q.difficulty}` }
      });

      if (!existing) {
        await prisma.template.create({
          data: {
            templateKey: `TPL_${q.concept.code}_${q.difficulty}_${Date.now()}`,
            conceptKey: q.concept.code,
            name: `Template: ${q.concept.name} - ${q.difficulty}`,
            difficultyLevel: q.difficulty,
            difficulty: q.difficulty,
            questionType: 'multiple_choice',
            isActive: true,
            structure: {
              options: data.options,
              explanation: q.explanation || 'Correct answer provided.',
              questionText: q.questionText,
              correctAnswerIndex: data.options.indexOf(q.answer)
            },
            solutionSchema: {
              answer: q.answer
            },
            config: {
              title: `Template: ${q.concept.name} - ${q.difficulty}`,
              prompt: q.questionText,
              options: data.options,
              answer: q.answer,
              difficulty: q.difficulty,
              explanation: q.explanation || 'Correct answer provided.'
            },
            variableSchema: {},
            constraints: {},
            generationStrategy: 'VARIABLE',
            readinessStatus: 'READY'
          }
        });
        totalTemplates++;
      }
    }
  }

  console.log(`Successfully created ${totalTemplates} static Templates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
