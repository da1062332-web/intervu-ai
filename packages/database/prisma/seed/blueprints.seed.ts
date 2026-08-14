import { PrismaClient, TopicStatus } from "@prisma/client";

export async function seedBlueprints(prisma: PrismaClient) {
  console.log("Seeding Blueprints...");

  // 1. Create Topics
  const topicNumerical = await prisma.topic.upsert({
    where: { code: "NUMERICAL_ABILITY" },
    update: { name: "Numerical Ability", status: TopicStatus.ACTIVE },
    create: {
      name: "Numerical Ability",
      code: "NUMERICAL_ABILITY",
      description: "Quantitative & Numerical Ability Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  const topicReasoning = await prisma.topic.upsert({
    where: { code: "REASONING_ABILITY" },
    update: { name: "Reasoning Ability", status: TopicStatus.ACTIVE },
    create: {
      name: "Reasoning Ability",
      code: "REASONING_ABILITY",
      description: "Logical Reasoning & Critical Thinking Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  const topicVerbal = await prisma.topic.upsert({
    where: { code: "VERBAL_ABILITY" },
    update: { name: "Verbal Ability", status: TopicStatus.ACTIVE },
    create: {
      name: "Verbal Ability",
      code: "VERBAL_ABILITY",
      description: "English Language & Verbal Ability Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  const topicCoding = await prisma.topic.upsert({
    where: { code: "CODING" },
    update: { name: "Coding", status: TopicStatus.ACTIVE },
    create: {
      name: "Coding",
      code: "CODING",
      description: "Hands-on Programming & Algorithm Questions",
      status: TopicStatus.ACTIVE,
    },
  });

  // 2. Create ExamConfig & Sections
  await prisma.examConfig.deleteMany({ where: { code: "TCS_NQT_EXAM" } });

  const examConfig = await prisma.examConfig.create({
    data: {
      name: "TCS NQT Placement Assessment",
      code: "TCS_NQT_EXAM",
      role: "TCS NQT Candidate",
      durationMinutes: 115,
      totalQuestions: 72,
      difficultyDistribution: {
        create: {
          easyPercentage: 65,
          mediumPercentage: 35,
          hardPercentage: 0,
        },
      },
      sections: {
        create: [
          {
            name: "Numerical Ability",
            code: "TCS_NQT_SEC_NUM",
            questionCount: 26,
            sectionDurationMinutes: 40,
            sectionOrder: 1,
            sectionTopics: {
              create: [
                {
                  topic: { connect: { id: topicNumerical.id } },
                  topicWeightage: { create: { weightagePercentage: 100 } },
                },
              ],
            },
          },
          {
            name: "Reasoning Ability",
            code: "TCS_NQT_SEC_REA",
            questionCount: 24,
            sectionDurationMinutes: 35,
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
          {
            name: "Verbal Ability",
            code: "TCS_NQT_SEC_VERB",
            questionCount: 20,
            sectionDurationMinutes: 25,
            sectionOrder: 3,
            sectionTopics: {
              create: [
                {
                  topic: { connect: { id: topicVerbal.id } },
                  topicWeightage: { create: { weightagePercentage: 100 } },
                },
              ],
            },
          },
          {
            name: "Hands-on Coding",
            code: "TCS_NQT_SEC_CODE",
            questionCount: 2,
            sectionDurationMinutes: 15,
            sectionOrder: 4,
            sectionTopics: {
              create: [
                {
                  topic: { connect: { id: topicCoding.id } },
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

  const secNum = examConfig.sections.find((s) => s.code === "TCS_NQT_SEC_NUM")!;
  const secReasoning = examConfig.sections.find(
    (s) => s.code === "TCS_NQT_SEC_REA",
  )!;
  const secVerbal = examConfig.sections.find(
    (s) => s.code === "TCS_NQT_SEC_VERB",
  )!;
  const secCoding = examConfig.sections.find(
    (s) => s.code === "TCS_NQT_SEC_CODE",
  )!;

  // 3. Create BlueprintConfig & BlueprintTopicConfig
  await prisma.blueprintConfig.deleteMany({ where: { code: "BP_TCS_NQT" } });

  const blueprint = await prisma.blueprintConfig.create({
    data: {
      name: "TCS NQT Complete Assessment Blueprint",
      code: "BP_TCS_NQT",
      description:
        "Standard TCS NQT Blueprint (Numerical, Reasoning, Verbal, Coding)",
      totalQuestions: 72,
      totalDurationMinutes: 115,
      topicConfigs: {
        create: [
          {
            sectionId: secNum.id,
            topicId: topicNumerical.id,
            questionCount: 26,
            weightage: 36.0,
            easyCount: 17,
            mediumCount: 9,
            hardCount: 0,
          },
          {
            sectionId: secReasoning.id,
            topicId: topicReasoning.id,
            questionCount: 24,
            weightage: 33.0,
            easyCount: 16,
            mediumCount: 8,
            hardCount: 0,
          },
          {
            sectionId: secVerbal.id,
            topicId: topicVerbal.id,
            questionCount: 20,
            weightage: 28.0,
            easyCount: 14,
            mediumCount: 6,
            hardCount: 0,
          },
          {
            sectionId: secCoding.id,
            topicId: topicCoding.id,
            questionCount: 2,
            weightage: 3.0,
            easyCount: 1,
            mediumCount: 1,
            hardCount: 0,
          },
        ],
      },
    },
  });

  console.log("Seeded Blueprint Config successfully: " + blueprint.code);
}
