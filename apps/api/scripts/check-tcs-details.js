require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findUnique({
    where: { id: 'cmsifafam000099s9csfe33pg' },
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

  if (!config) {
    console.log('ExamConfig not found.');
    return;
  }

  let totalRequired = 0;
  let topicIds = [];
  console.log(`Config: ${config.name}`);
  for (const sec of config.sections) {
    console.log(`Section: ${sec.name}`);
    for (const st of sec.sectionTopics) {
      console.log(`  - Topic: ${st.topic.name} | Needs: ${st.questionCount}`);
      totalRequired += st.questionCount;
      topicIds.push(st.topic.id);
    }
  }
  console.log(`Total questions needed: ${totalRequired}`);
  
  // Now find questions for these topics
  for (const topicId of topicIds) {
    const qCount = await prisma.question.count({
      where: { topicId }
    });
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    console.log(`Topic ${topic.name} has ${qCount} total questions in the DB.`);
  }

}
main().catch(console.error).finally(() => prisma.$disconnect());
