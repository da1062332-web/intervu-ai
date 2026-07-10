const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const configs = await prisma.testConfig.findMany({ where: { isActive: true } });
  console.log('TestConfigs:', configs);
  const examConfigs = await prisma.examConfig.findMany({ where: { isActive: true } });
  console.log('ExamConfigs:', examConfigs);
  await prisma.$disconnect();
}
run();
