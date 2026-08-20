import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const configs = await prisma.examConfig.findMany({
    where: {
      OR: [
        { name: { contains: 'Testing config 2', mode: 'insensitive' } },
        { code: { contains: 'Testing config 2', mode: 'insensitive' } },
        { name: { contains: 'Testing', mode: 'insensitive' } },
      ],
    },
    include: {
      ruleFlags: true,
      sections: true,
      blueprint: true,
      assembledTests: {
        include: {
          sections: {
            include: {
              questions: true,
            },
          },
        },
      },
    },
  });

  console.log(`Found ${configs.length} exam configs matching 'Testing':`);
  for (const c of configs) {
    console.log(`\n======================================================`);
    console.log(`Exam ID: ${c.id}`);
    console.log(`Name: ${c.name}`);
    console.log(`Code: ${c.code}`);
    console.log(`Status: ${c.status}`);
    console.log(`Active: ${c.isActive}`);
    console.log(`Duration: ${c.durationMinutes} min`);
    console.log(`Rule Flags:`, c.ruleFlags);
    console.log(`Sections count: ${c.sections.length}`);
    for (const s of c.sections) {
      console.log(`  - Section: ${s.name} (${s.questionCount} questions, ${s.sectionDurationMinutes} min)`);
    }
    console.log(`AssembledTests count: ${c.assembledTests.length}`);
    for (const a of c.assembledTests) {
      console.log(`  * Assembly ID: ${a.id} | Status: ${a.status} | Total Qs: ${a.totalQuestions} | Sections: ${a.sections.length}`);
      for (const as of a.sections) {
        console.log(`    - Sec ${as.sectionKey}: ${as.questions.length} questions attached`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
