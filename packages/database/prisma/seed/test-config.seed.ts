import { PrismaClient } from "@prisma/client";

export async function seedTestConfigs(prisma: PrismaClient) {
  console.log("Seeding Test Configs...");

  const tcsConfig = await prisma.testConfig.upsert({
    where: { configKey: "TCS_NQT_APTITUDE" },
    update: {},
    create: {
      configKey: "TCS_NQT_APTITUDE",
      companyName: "TCS",
      displayName: "TCS NQT Aptitude Config",
      totalDurationSeconds: 90 * 60, // 90 mins
      totalQuestions: 40,
      sections: {
        create: [
          {
            sectionKey: "APTITUDE",
            displayName: "Aptitude",
            durationSeconds: 45 * 60,
            questionCount: 20,
            orderIndex: 0,
          },
          {
            sectionKey: "REASONING",
            displayName: "Reasoning",
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
}
