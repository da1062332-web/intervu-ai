import { PrismaClient, DifficultyLevel } from '@prisma/client';

export async function seedTemplates(prisma: PrismaClient): Promise<void> {
  console.log('Seeding templates...');

  const templates = [
    {
      name: 'Frontend Engineer Assessment',
      description: 'Standard frontend assessment focusing on HTML, CSS, JavaScript, and React components.',
      difficulty: DifficultyLevel.EASY,
      config: {
        durationMinutes: 60,
        passingScorePercentage: 70,
        sections: [
          { name: 'HTML & CSS', questionCount: 5 },
          { name: 'JavaScript Core', questionCount: 5 },
          { name: 'React Components', questionCount: 5 },
        ],
      },
      isSystem: true,
    },
    {
      name: 'Backend Engineer Assessment',
      description: 'Comprehensive backend assessment assessing Node.js, NestJS, database query tuning, and system architecture.',
      difficulty: DifficultyLevel.MEDIUM,
      config: {
        durationMinutes: 90,
        passingScorePercentage: 75,
        sections: [
          { name: 'Node.js & NestJS', questionCount: 5 },
          { name: 'Database & SQL/NoSQL', questionCount: 5 },
          { name: 'API Design & Security', questionCount: 5 },
        ],
      },
      isSystem: true,
    },
    {
      name: 'Fullstack Engineer Assessment',
      description: 'Challenging fullstack assessment covering frontend rendering, API architecture, data persistence, and performance.',
      difficulty: DifficultyLevel.HARD,
      config: {
        durationMinutes: 120,
        passingScorePercentage: 80,
        sections: [
          { name: 'Frontend App Lifecycle', questionCount: 5 },
          { name: 'Backend API Design', questionCount: 5 },
          { name: 'Database Optimization', questionCount: 5 },
          { name: 'System Security & Scaling', questionCount: 5 },
        ],
      },
      isSystem: true,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      await prisma.template.update({
        where: { id: existing.id },
        data: {
          description: template.description,
          difficulty: template.difficulty,
          config: template.config,
          isSystem: template.isSystem,
        },
      });
    } else {
      await prisma.template.create({
        data: template,
      });
    }
  }

  console.log('Templates seeded successfully.');
}
