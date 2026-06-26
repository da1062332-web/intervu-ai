import { PrismaClient, DifficultyLevel } from "@prisma/client";

export async function seedTemplates(prisma: PrismaClient): Promise<void> {
  console.log("Seeding templates...");

  // Delete dependent records to avoid foreign key constraint violations
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Template" CASCADE;');

  const templates = [
    {
      name: "TCS_NQT_APTITUDE",
      description: "Standard TCS NQT Aptitude test blueprint.",
      difficulty: DifficultyLevel.MEDIUM,
      config: {
        durationMinutes: 90,
        passingScorePercentage: 70,
        sections: [
          { name: "Aptitude", questionCount: 20 },
          { name: "Reasoning", questionCount: 20 },
        ],
      },
      isSystem: true,
    }
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  console.log("Templates seeded successfully.");
}
