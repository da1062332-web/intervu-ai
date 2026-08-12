import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const configCode = "TCS_NQT_PLACEMENT_ASSESSMENT";
  console.log(`=== Audit Readiness Check for Config: ${configCode} ===`);

  const config = await prisma.examConfig.findFirst({
    where: { OR: [{ code: configCode }, { name: { contains: "TCS NQT" } }] },
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
    console.log(`Config not found in database by code "${configCode}".`);
    return;
  }

  console.log(`Found ExamConfig: ${config.name} (${config.id})`);

  // Count active manual questions for Para Jumbled
  const topic = await prisma.topic.findFirst({
    where: { OR: [{ code: "PARA_JUMBLED" }, { name: "Para Jumbled" }] },
  });

  if (topic) {
    const easyCount = await prisma.question.count({
      where: { topicId: topic.id, difficulty: "EASY", status: "ACTIVE" },
    });
    const hardCount = await prisma.question.count({
      where: { topicId: topic.id, difficulty: "HARD", status: "ACTIVE" },
    });
    console.log(`\nTopic '${topic.name}' Question Pool Status:`);
    console.log(`  - Active EASY Questions: ${easyCount} (Required: 2) -> ${easyCount >= 2 ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`  - Active HARD Questions: ${hardCount} (Required: 1) -> ${hardCount >= 1 ? "PASSED ✅" : "FAILED ❌"}`);
  }
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
