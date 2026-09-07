import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shortConfig = await prisma.examConfig.findFirst({
    where: {
      OR: [
        { code: 'ASM_TCS_NQT_SHORT_001' },
        { id: 'ASM_TCS_NQT_SHORT_001' },
        { name: { contains: 'Short', mode: 'insensitive' } },
      ],
    },
  });

  console.log("Short Config:", shortConfig);

  // If status is ARCHIVED or isActive is false, let's see why
  const allConfigs = await prisma.examConfig.findMany({
    select: { id: true, code: true, name: true, status: true, isActive: true, isArchived: true },
  });
  console.log("All ExamConfigs:", allConfigs);
}

main().finally(() => prisma.$disconnect());
