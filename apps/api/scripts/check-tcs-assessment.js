require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findFirst({
    where: { name: { contains: 'TCS NQT Placement Assessment' } },
    include: {
      sections: {
        include: {
          questions: true
        }
      }
    }
  });

  if (config) {
    console.log('Found ExamConfig:', config.name, '| Status:', config.status, '| Sections:', config.sections.length);
    let qCount = 0;
    for (const sec of config.sections) {
      console.log(` - Section ${sec.name}: ${sec.questions.length} questions`);
      qCount += sec.questions.length;
    }
    console.log(`Total questions: ${qCount}`);
    console.log(`Config ID: ${config.id}`);
  } else {
    console.log('ExamConfig not found.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
