const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const figTopics = await prisma.topic.findMany({
    where: {
      OR: [
        { code: { in: ['FIGURE_SERIES', 'FIGURE_ANALOGY', 'vr-top-001', 'vr-top-002'] } },
        { name: { contains: 'Figure' } }
      ]
    },
    include: { concepts: true }
  });
  console.log('--- FIGURE TOPICS & CONCEPTS ---');
  figTopics.forEach(t => {
    console.log('Topic:', t.id, '| code:', t.code, '| name:', t.name);
    t.concepts.forEach(c => console.log('   Concept:', c.id, '| code:', c.code, '| name:', c.name));
  });

  const templates = await prisma.template.findMany({
    where: {
      OR: [
        { name: { contains: 'Figure' } },
        { conceptKey: { contains: 'ROTATION' } },
        { conceptKey: { contains: 'FIGURE' } },
        { conceptKey: { contains: 'SHAPE' } },
        { conceptKey: { contains: 'INTERLEAVED' } },
        { conceptKey: { contains: 'PROGRESSIVE' } },
        { conceptKey: { contains: 'MULTIPLE' } },
        { conceptKey: { contains: 'POSITION' } },
        { conceptKey: { contains: 'ADDITION' } }
      ]
    }
  });

  console.log('\n--- FIGURE TEMPLATES --- total:', templates.length);
  templates.forEach(t => {
    console.log('\nID:', t.id);
    console.log('Name:', t.name);
    console.log('Strategy:', t.generationStrategy);
    console.log('ConceptKey:', t.conceptKey);
    console.log('Difficulty:', t.difficulty, 'DifficultyLevel:', t.difficultyLevel);
    console.log('Config:', JSON.stringify(t.config));
    console.log('Structure:', JSON.stringify(t.structure));
  });

  const figQuestions = await prisma.question.findMany({
    where: {
      OR: [
        { topicId: { in: figTopics.map(t => t.id) } },
        { templateId: { in: templates.map(t => t.id) } }
      ]
    }
  });
  console.log('\n--- FIGURE QUESTIONS IN DB --- total:', figQuestions.length);
  figQuestions.forEach(q => {
    console.log(q.id, '| topicId:', q.topicId, '| conceptId:', q.conceptId, '| templateId:', q.templateId, '| diff:', q.difficulty, '| text:', q.questionText?.substring(0, 50));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
