import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MVP Database Architecture...');

  // 1. Create TCS NQT Config
  const tcsConfig = await prisma.testConfig.upsert({
    where: { configKey: 'TCS_NQT_APTITUDE' },
    update: {},
    create: {
      configKey: 'TCS_NQT_APTITUDE',
      companyName: 'TCS',
      displayName: 'TCS NQT Aptitude Config',
      totalDurationSeconds: 90 * 60, // 90 mins
      totalQuestions: 40,
      sections: {
        create: [
          {
            sectionKey: 'APTITUDE',
            displayName: 'Aptitude',
            durationSeconds: 45 * 60,
            questionCount: 20,
            orderIndex: 0,
          },
          {
            sectionKey: 'REASONING',
            displayName: 'Reasoning',
            durationSeconds: 45 * 60,
            questionCount: 20,
            orderIndex: 1,
          },
        ],
      },
      rule: {
        create: {
          negativeMarking: false,
          sectionLocking: true,
          shuffleQuestions: true,
          allowNavigation: true,
        },
      },
    },
  });
  console.log(`Created Config: ${tcsConfig.configKey}`);

  // 2. Create 5 Base Templates
  const concepts = ['time_work', 'probability', 'percentages', 'averages', 'coding_basics'];
  
  for (const concept of concepts) {
    const templateKey = `BASE_${concept.toUpperCase()}`;
    await prisma.template.upsert({
      where: { templateKey },
      update: {},
      create: {
        templateKey,
        conceptKey: concept,
        difficultyLevel: 'MEDIUM',
        questionType: 'MULTIPLE_CHOICE',
        structure: { type: 'standard' },
        variableSchema: { variables: [] },
        constraints: { logic: 'standard' },
        solutionSchema: { format: 'text' },
        name: `Template for ${concept}`,
        config: {},
      },
    });
    console.log(`Created Template: ${templateKey}`);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
