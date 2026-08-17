import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.examConfig.findFirst({
    where: { OR: [{ code: "TCS_NQT_PLACEMENT_ASSESSMENT" }, { name: { contains: "TCS NQT Placement Assessment" } }] },
    include: {
      sections: {
        include: {
          sectionTopics: {
            include: { topic: true },
          },
        },
      },
      difficultyDistribution: true,
    },
  });

  if (!config) {
    console.log("Config not found.");
    return;
  }

  console.log("Config keys:", Object.keys(config));
  console.log("Config raw:", JSON.stringify({
    id: config.id,
    name: config.name,
    code: config.code,
    status: config.status,
    totalQuestions: config.totalQuestions,
    durationMinutes: (config as any).durationMinutes,
    totalDurationSeconds: (config as any).totalDurationSeconds,
    durationSeconds: (config as any).durationSeconds,
  }, null, 2));

  console.log("\nSection 0 raw:", JSON.stringify(config.sections[0], null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
