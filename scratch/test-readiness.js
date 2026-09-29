const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: {
              topic: true
            }
          }
        }
      }
    }
  });

  console.log('--- TESTING READINESS CHECK ON ALL EXAM CONFIGS ---');
  for (const c of configs) {
    console.log(`\nConfig: "${c.name}" (ID: ${c.id})`);
    for (const s of c.sections) {
      console.log(`  Section: "${s.name}" (questions: ${s.questionCount})`);
      for (const st of s.sectionTopics) {
        if (!st.topic) continue;
        const total = await prisma.question.count({
          where: { topicId: st.topic.id, status: 'ACTIVE' }
        });
        const easy = await prisma.question.count({
          where: { topicId: st.topic.id, status: 'ACTIVE', difficulty: 'EASY' }
        });
        const med = await prisma.question.count({
          where: { topicId: st.topic.id, status: 'ACTIVE', difficulty: 'MEDIUM' }
        });
        const hard = await prisma.question.count({
          where: { topicId: st.topic.id, status: 'ACTIVE', difficulty: 'HARD' }
        });
        console.log(`    Topic: "${st.topic.name}" (${st.topic.code}) | Active Pool: ${total} [EASY: ${easy}, MED: ${med}, HARD: ${hard}]`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
