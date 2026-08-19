import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assemblies = await prisma.assembledTest.findMany({
    where: {
      configId: 'cmsifafam000099s9csfe33pg',
    },
    include: {
      sections: {
        include: {
          questions: {
            select: { id: true, questionId: true },
          },
        },
      },
    },
  });

  console.log(`Found ${assemblies.length} assemblies for TCS config:`);
  for (const a of assemblies) {
    console.log(`\n======================================================`);
    console.log(`Assembly ID: ${a.id} | Status: ${a.status} | Total Qs: ${a.totalQuestions}`);
    console.log(`Sections count: ${a.sections.length}`);
    for (const s of a.sections) {
      console.log(`  - Section ID: ${s.id} | Key: "${s.sectionKey}" | Name: "${s.sectionName}" | Questions attached: ${s.questions.length}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
