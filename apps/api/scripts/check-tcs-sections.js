require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findUnique({
    where: { id: 'cmsifafam000099s9csfe33pg' },
    include: {
      sections: true
    }
  });

  if (!config) {
    console.log('ExamConfig not found.');
    return;
  }

  let totalQuestions = 0;
  console.log(`Config: ${config.name}`);
  for (const sec of config.sections) {
    console.log(`Section: ${sec.name} | questionCount: ${sec.questionCount}`);
    totalQuestions += sec.questionCount;
  }
  console.log(`Total questions in sections: ${totalQuestions}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
