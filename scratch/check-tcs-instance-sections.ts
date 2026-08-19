import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const instances = await prisma.testInstance.findMany({
    where: {
      examConfigId: 'cmsifafam000099s9csfe33pg',
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      sections: {
        include: {
          questions: {
            take: 3,
          },
        },
      },
    },
  });

  console.log(`Found ${instances.length} recent instances for TCS:`);
  for (const inst of instances) {
    console.log(`\n=================================================`);
    console.log(`Instance ID: ${inst.id}`);
    console.log(`Status: ${inst.status}`);
    console.log(`Created At: ${inst.createdAt}`);
    console.log(`Sections Count: ${inst.sections.length}`);
    for (const s of inst.sections) {
      console.log(`  - Section ${s.sectionKey} (${s.sectionName || s.title}): ${s.questions.length} questions attached, questionCount: ${s.questionCount}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
