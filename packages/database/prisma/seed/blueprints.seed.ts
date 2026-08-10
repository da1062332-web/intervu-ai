import { PrismaClient, TopicStatus } from "@prisma/client";

export async function seedBlueprints(prisma: PrismaClient) {
  console.log("Seeding Blueprints...");

  // 1. Create Topics
  const topicAptitude = await prisma.topic.upsert({
    where: { code: "APTITUDE_GENERAL" },
    update: { name: "Aptitude", status: TopicStatus.ACTIVE },
    create: {
      name: "Aptitude",
      code: "APTITUDE_GENERAL",
      description: "General Aptitude Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  const topicReasoning = await prisma.topic.upsert({
    where: { code: "REASONING_GENERAL" },
    update: { name: "Reasoning", status: TopicStatus.ACTIVE },
    create: {
      name: "Reasoning",
      code: "REASONING_GENERAL",
      description: "General Reasoning Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  // 2. Create ExamConfig & Sections
  await prisma.examConfig.deleteMany({ where: { code: "TCS_NQT_EXAM" } });

  const examConfig = await prisma.examConfig.create({
    data: {
      name: "TCS NQT Exam",
      code: "TCS_NQT_EXAM",
      role: "TCS NQT Candidate",
      durationMinutes: 90,
      totalQuestions: 40,
      difficultyDistribution: {
        create: {
          easyPercentage: 30,
          mediumPercentage: 50,
          hardPercentage: 20,
        },
      },
      sections: {
        create: [
          {
            name: "Aptitude",
            code: "TCS_NQT_SEC_APT",
            questionCount: 20,
            sectionDurationMinutes: 45,
            sectionOrder: 1,
            sectionTopics: {
              create: [
                {
                  topic: { connect: { id: topicAptitude.id } },
                  topicWeightage: { create: { weightagePercentage: 100 } },
                },
              ],
            },
          },
          {
            name: "Reasoning",
            code: "TCS_NQT_SEC_REA",
            questionCount: 20,
            sectionDurationMinutes: 45,
            sectionOrder: 2,
            sectionTopics: {
              create: [
                {
                  topic: { connect: { id: topicReasoning.id } },
                  topicWeightage: { create: { weightagePercentage: 100 } },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      sections: true,
    },
  });

  const secAptitude = examConfig.sections.find(
    (s) => s.code === "TCS_NQT_SEC_APT",
  )!;
  const secReasoning = examConfig.sections.find(
    (s) => s.code === "TCS_NQT_SEC_REA",
  )!;

  // 3. Create BlueprintConfig & BlueprintTopicConfig
  await prisma.blueprintConfig.deleteMany({ where: { code: "BP_TCS_NQT" } });

  const blueprint = await prisma.blueprintConfig.create({
    data: {
      name: "TCS NQT Aptitude Blueprint",
      code: "BP_TCS_NQT",
      description: "Blueprint for TCS NQT Aptitude Exam",
      totalQuestions: 40,
      totalDurationMinutes: 90,
      topicConfigs: {
        create: [
          {
            sectionId: secAptitude.id,
            topicId: topicAptitude.id,
            questionCount: 20,
            weightage: 50.0,
            easyCount: 6,
            mediumCount: 10,
            hardCount: 4,
          },
          {
            sectionId: secReasoning.id,
            topicId: topicReasoning.id,
            questionCount: 20,
            weightage: 50.0,
            easyCount: 6,
            mediumCount: 10,
            hardCount: 4,
          },
        ],
      },
    },
  });

  console.log("Seeded Blueprint Config successfully: " + blueprint.code);
}
