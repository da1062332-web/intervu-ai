import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Unarchiving and publishing ASM_TCS_NQT_SHORT_001...");
  const updated = await prisma.examConfig.update({
    where: { id: 'cmtley5u0000l14ne8lvnlopu' },
    data: {
      status: 'PUBLISHED',
      isArchived: false,
      isActive: true,
    },
  });
  console.log("Updated config:", updated);
}

main().finally(() => prisma.$disconnect());
