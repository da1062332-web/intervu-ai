const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const configs = await prisma.examConfig.findMany({
    select: { name: true, status: true, isActive: true, isArchived: true }
  });
  console.log(configs);
}

run().finally(() => prisma.$disconnect());
