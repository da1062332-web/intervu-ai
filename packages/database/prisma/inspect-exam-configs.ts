import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
    select: { id: true, name: true, role: true, code: true, durationMinutes: true },
  });
  console.log('ExamConfigs in DB:', JSON.stringify(configs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
